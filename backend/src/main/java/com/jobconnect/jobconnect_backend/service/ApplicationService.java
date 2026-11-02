
package com.jobconnect.jobconnect_backend.service;

import com.jobconnect.jobconnect_backend.dto.ApplicationRequest;
import com.jobconnect.jobconnect_backend.dto.ApplicationResponse;
import com.jobconnect.jobconnect_backend.dto.ApplicationStatusRequest;
import com.jobconnect.jobconnect_backend.dto.NotificationRequest;
import com.jobconnect.jobconnect_backend.dto.RecruiterApplicationResponse;
import com.jobconnect.jobconnect_backend.entity.Application;
import com.jobconnect.jobconnect_backend.entity.Job;
import com.jobconnect.jobconnect_backend.entity.Resume;
import com.jobconnect.jobconnect_backend.entity.StudentProfile;
import com.jobconnect.jobconnect_backend.entity.User;
import com.jobconnect.jobconnect_backend.repository.ApplicationRepository;
import com.jobconnect.jobconnect_backend.repository.JobRepository;
import com.jobconnect.jobconnect_backend.repository.ResumeRepository;
import com.jobconnect.jobconnect_backend.repository.StudentProfileRepository;
import com.jobconnect.jobconnect_backend.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
public class ApplicationService {

    private final ApplicationRepository repository;
    private final StudentProfileRepository studentProfileRepository;
    private final JobRepository jobRepository;
    private final ResumeRepository resumeRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public ApplicationService(
            ApplicationRepository repository,
            StudentProfileRepository studentProfileRepository,
            JobRepository jobRepository,
            ResumeRepository resumeRepository,
            UserRepository userRepository,
            NotificationService notificationService) {

        this.repository = repository;
        this.studentProfileRepository = studentProfileRepository;
        this.jobRepository = jobRepository;
        this.resumeRepository = resumeRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    // Retrieve one application with an ownership check.
    public ApplicationResponse getById(
            Long id,
            String email) {

        User user = getAuthenticatedUser(email);
        String role = user.getRole().name();

        if (!"STUDENT".equals(role)
                && !"ADMIN".equals(role)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not authorized to access applications"
            );
        }

        Application application =
                repository.findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Application not found"
                                )
                        );

        if ("STUDENT".equals(role)
                && !Objects.equals(
                        application.getStudent().getUserId(),
                        user.getId())) {

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Application not found"
            );
        }

        return toResponse(application);
    }

    // Students see their own applications.
    // Administrators may see all applications.
    public List<ApplicationResponse> getAll(
            String email) {

        User user = getAuthenticatedUser(email);
        String role = user.getRole().name();

        if ("ADMIN".equals(role)) {
            return repository.findAll()
                    .stream()
                    .map(this::toResponse)
                    .toList();
        }

        if (!"STUDENT".equals(role)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not authorized to access applications"
            );
        }

        return repository.findAll()
                .stream()
                .filter(application ->
                        application.getStudent() != null
                                && Objects.equals(
                                        application.getStudent().getUserId(),
                                        user.getId()
                                )
                )
                .map(this::toResponse)
                .toList();
    }

    // Create an application and notify the recruiter.
    @Transactional
    public ApplicationResponse create(
            ApplicationRequest request,
            String email) {

        User user = getAuthenticatedUser(email);

        if (!"STUDENT".equals(user.getRole().name())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only students can submit applications"
            );
        }

        // Students can apply only using their own account.
        if (!Objects.equals(
                request.getStudentId(),
                user.getId())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only apply using your own student account"
            );
        }

        Long studentId = user.getId();

        // Check duplicate applications.
        if (repository.existsByStudentUserIdAndJobId(
                studentId,
                request.getJobId())) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Student has already applied to this job"
            );
        }

        // Find the student's profile.
        StudentProfile student =
                studentProfileRepository.findById(studentId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "Student profile not found"
                                )
                        );

        // Find the selected job.
        Job job =
                jobRepository.findById(request.getJobId())
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Job not found"
                                )
                        );

        // Find the submitted resume.
        Resume resume =
                resumeRepository.findById(request.getResumeId())
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Resume not found"
                                )
                        );

        // Verify resume ownership.
        if (resume.getStudent() == null
                || !Objects.equals(
                        resume.getStudent().getUserId(),
                        studentId)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Resume does not belong to the logged-in student"
            );
        }

        // Only active resumes can be used.
        if (!Boolean.TRUE.equals(resume.getIsActive())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Please use your active resume"
            );
        }

        // Create and save the application.
        Application application =
                Application.builder()
                        .student(student)
                        .job(job)
                        .resume(resume)
                        .coverLetter(request.getCoverLetter())
                        .status(Application.Status.APPLIED)
                        .build();

        Application savedApplication =
                repository.save(application);

        // Notify the recruiter who posted this opportunity.
        if (job.getPostedBy() != null
                && job.getPostedBy().getUserId() != null) {

            Long recruiterUserId =
                    job.getPostedBy().getUserId();

            String studentName = "A student";

            if (student.getUser() != null
                    && student.getUser().getName() != null) {

                studentName = student.getUser().getName();
            }

            String notificationMessage =
                    studentName
                    + " has applied for your opportunity: "
                    + job.getTitle()
                    + ". Open your recruiter dashboard to review the application.";

            NotificationRequest notificationRequest =
                    new NotificationRequest(
                            recruiterUserId,
                            "New Application Received",
                            notificationMessage
                    );

            notificationService.create(notificationRequest);

            System.out.println(
                    "SUCCESS: Recruiter application notification created."
            );
        }

        return toResponse(savedApplication);
    }

    // Recruiters see applications for their own jobs.
    public List<RecruiterApplicationResponse>
    getRecruiterApplications(String email) {

        User recruiter = getRecruiter(email);

        return repository.findAll()
                .stream()
                .filter(application ->
                        application.getJob() != null
                                && application.getJob().getPostedBy() != null
                                && Objects.equals(
                                        application.getJob()
                                                .getPostedBy().getUserId(),
                                        recruiter.getId()
                                )
                )
                .map(this::toRecruiterResponse)
                .toList();
    }

    // Recruiters can update statuses only for their own jobs.
    // Notify the student after a genuine status change.
    @Transactional
    public RecruiterApplicationResponse updateStatus(
            Long applicationId,
            ApplicationStatusRequest request,
            String email) {

        User recruiter = getRecruiter(email);

        Application application =
                repository.findById(applicationId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Application not found"
                                )
                        );

        // Verify that this recruiter owns the job.
        if (application.getJob() == null
                || application.getJob().getPostedBy() == null
                || !Objects.equals(
                        application.getJob().getPostedBy().getUserId(),
                        recruiter.getId())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not allowed to update this application"
            );
        }

        // Remember the previous application status.
        Application.Status previousStatus =
                application.getStatus();

        // Get the requested status.
        Application.Status newStatus =
                request.getStatus();

        if (newStatus == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Application status is required"
            );
        }

        // Update and save the application.
        application.setStatus(newStatus);
        application.setUpdatedAt(LocalDateTime.now());

        Application savedApplication =
                repository.save(application);

        // Debug information.
        System.out.println(
                "========== STATUS NOTIFICATION DEBUG =========="
        );

        System.out.println(
                "Application ID: " + savedApplication.getId()
        );

        System.out.println(
                "Previous status: " + previousStatus
        );

        System.out.println(
                "New status: " + newStatus
        );

        System.out.println(
                "Student user ID: "
                + (savedApplication.getStudent() != null
                        ? savedApplication.getStudent().getUserId()
                        : null)
        );

        boolean statusChanged =
                !Objects.equals(previousStatus, newStatus);

        System.out.println(
                "Status changed: " + statusChanged
        );

        // Notify the student only when the status changes.
        if (statusChanged
                && savedApplication.getStudent() != null
                && savedApplication.getStudent().getUserId() != null) {

            String statusLabel =
                    newStatus.name().replace("_", " ");

            String jobTitle =
                    savedApplication.getJob().getTitle();

            String notificationMessage =
                    "Your application for "
                    + jobTitle
                    + " has been updated to "
                    + statusLabel
                    + ". Please check your JobConnect account for details.";

            NotificationRequest notificationRequest =
                    new NotificationRequest(
                            savedApplication.getStudent().getUserId(),
                            "Application Status Updated",
                            notificationMessage
                    );

            notificationService.create(notificationRequest);

            System.out.println(
                    "SUCCESS: Application status notification created for student ID: "
                    + savedApplication.getStudent().getUserId()
            );

        } else {

            System.out.println(
                    "Notification skipped: Status unchanged or student unavailable."
            );
        }

        return toRecruiterResponse(savedApplication);
    }

    private User getAuthenticatedUser(String email) {

        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "User not found"
                        )
                );
    }

    private User getRecruiter(String email) {

        User user = getAuthenticatedUser(email);

        if (!"RECRUITER".equals(user.getRole().name())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Recruiter access required"
            );
        }

        return user;
    }

    private ApplicationResponse toResponse(
            Application application) {

        return new ApplicationResponse(
                application.getId(),
                application.getStudent().getUserId(),
                application.getJob().getId(),
                application.getResume().getId(),
                application.getCoverLetter(),
                application.getStatus(),
                application.getAppliedAt(),
                application.getUpdatedAt()
        );
    }

    private RecruiterApplicationResponse toRecruiterResponse(
            Application application) {

        return new RecruiterApplicationResponse(
                application.getId(),
                application.getStudent().getUserId(),
                application.getStudent().getUser().getName(),
                application.getStudent().getLocation(),
                application.getJob().getId(),
                application.getJob().getTitle(),
                application.getResume().getId(),
                application.getResume().getFileName(),
                application.getCoverLetter(),
                application.getStatus().name(),
                application.getAppliedAt(),
                application.getUpdatedAt()
        );
    }
}
