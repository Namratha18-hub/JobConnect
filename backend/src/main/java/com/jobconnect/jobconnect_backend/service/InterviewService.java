package com.jobconnect.jobconnect_backend.service;

import com.jobconnect.jobconnect_backend.dto.InterviewRequest;
import com.jobconnect.jobconnect_backend.dto.InterviewResponse;
import com.jobconnect.jobconnect_backend.dto.NotificationRequest;
import com.jobconnect.jobconnect_backend.entity.Application;
import com.jobconnect.jobconnect_backend.entity.Interview;
import com.jobconnect.jobconnect_backend.entity.User;
import com.jobconnect.jobconnect_backend.repository.ApplicationRepository;
import com.jobconnect.jobconnect_backend.repository.InterviewRepository;
import com.jobconnect.jobconnect_backend.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
public class InterviewService {

    private final InterviewRepository repository;
    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public InterviewService(
            InterviewRepository repository,
            ApplicationRepository applicationRepository,
            UserRepository userRepository,
            NotificationService notificationService) {

        this.repository = repository;
        this.applicationRepository = applicationRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    // Get one interview after checking access.
    public InterviewResponse getById(
            Long id,
            String email) {

        User user = getUser(email);

        Interview interview = repository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Interview not found"
                        )
                );

        verifyAccess(interview, user);

        return toResponse(interview);
    }

    // Get only the interviews visible to the logged-in user.
    public List<InterviewResponse> getAll(String email) {

        User user = getUser(email);

        return repository.findAll()
                .stream()
                .filter(interview -> hasAccess(interview, user))
                .map(this::toResponse)
                .toList();
    }

    // Schedule an interview and notify the student.
    @Transactional
    public InterviewResponse create(
            InterviewRequest request,
            String email) {

        User recruiter = getUser(email);

        verifyRecruiter(recruiter);

        Application application =
                applicationRepository.findById(
                                request.getApplicationId()
                        )
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Application not found"
                                )
                        );

        verifyRecruiterOwnsApplication(application, recruiter);

        if (application.getStatus() == Application.Status.REJECTED
                || application.getStatus() == Application.Status.WITHDRAWN) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cannot schedule an interview for a rejected or withdrawn application"
            );
        }

        validateInterviewDetails(request);

        LocalDateTime now = LocalDateTime.now();

        Interview interview = Interview.builder()
                .application(application)
                .scheduledDate(request.getScheduledDate())
                .scheduledTime(request.getScheduledTime())
                .interviewType(request.getInterviewType())
                .meetingLink(request.getMeetingLink())
                .interviewerName(request.getInterviewerName())
                .notes(request.getNotes())
                .status(Interview.Status.SCHEDULED)
                .createdAt(now)
                .updatedAt(now)
                .build();

        application.setStatus(Application.Status.INTERVIEW);
        application.setUpdatedAt(now);

        applicationRepository.save(application);

        Interview savedInterview = repository.save(interview);

        notifyStudent(
                savedInterview,
                "Interview Scheduled",
                "Your interview has been scheduled."
        );

        return toResponse(savedInterview);
    }

    // Reschedule an existing scheduled interview.
    @Transactional
    public InterviewResponse reschedule(
            Long id,
            InterviewRequest request,
            String email) {

        User recruiter = getUser(email);

        verifyRecruiter(recruiter);

        Interview interview = repository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Interview not found"
                        )
                );

        verifyAccess(interview, recruiter);

        verifyRecruiterOwnsApplication(
                interview.getApplication(),
                recruiter
        );

        if (interview.getStatus() != Interview.Status.SCHEDULED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only scheduled interviews can be rescheduled"
            );
        }

        if (!Objects.equals(
                request.getApplicationId(),
                interview.getApplication().getId())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "The application ID cannot be changed when rescheduling"
            );
        }

        validateInterviewDetails(request);

        interview.setScheduledDate(request.getScheduledDate());
        interview.setScheduledTime(request.getScheduledTime());
        interview.setInterviewType(request.getInterviewType());
        interview.setMeetingLink(request.getMeetingLink());
        interview.setInterviewerName(request.getInterviewerName());
        interview.setNotes(request.getNotes());
        interview.setUpdatedAt(LocalDateTime.now());

        Interview savedInterview = repository.save(interview);

        notifyStudent(
                savedInterview,
                "Interview Rescheduled",
                "Your interview has been rescheduled."
        );

        return toResponse(savedInterview);
    }

    // Cancel an interview or mark it completed.
    @Transactional
    public InterviewResponse updateStatus(
            Long id,
            Interview.Status status,
            String email) {

        User recruiter = getUser(email);

        verifyRecruiter(recruiter);

        if (status != Interview.Status.CANCELLED
                && status != Interview.Status.COMPLETED) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Status must be CANCELLED or COMPLETED"
            );
        }

        Interview interview = repository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Interview not found"
                        )
                );

        verifyAccess(interview, recruiter);

        verifyRecruiterOwnsApplication(
                interview.getApplication(),
                recruiter
        );

        if (interview.getStatus() != Interview.Status.SCHEDULED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only scheduled interviews can be cancelled or completed"
            );
        }

        interview.setStatus(status);
        interview.setUpdatedAt(LocalDateTime.now());

        Interview savedInterview = repository.save(interview);

        if (status == Interview.Status.CANCELLED) {
            notifyStudent(
                    savedInterview,
                    "Interview Cancelled",
                    "Your interview has been cancelled."
            );
        } else if (status == Interview.Status.COMPLETED) {
            notifyStudent(
                    savedInterview,
                    "Interview Completed",
                    "Your interview has been marked as completed."
            );
        }

        return toResponse(savedInterview);
    }

    // Create a notification for the student associated with an interview.
    private void notifyStudent(
            Interview interview,
            String title,
            String actionMessage) {

        Application application = interview.getApplication();

        if (application == null || application.getStudent() == null) {
            return;
        }

        Long studentUserId = application.getStudent().getUserId();

        if (studentUserId == null) {
            return;
        }

        StringBuilder message = new StringBuilder(actionMessage);

        message.append(" Date: ")
                .append(interview.getScheduledDate());

        if (interview.getScheduledTime() != null) {
            message.append(" Time: ")
                    .append(interview.getScheduledTime());
        }

        if (interview.getInterviewType() != null) {
            message.append(" Type: ")
                    .append(interview.getInterviewType());
        }

        if (interview.getInterviewerName() != null
                && !interview.getInterviewerName().isBlank()) {

            message.append(" Interviewer: ")
                    .append(interview.getInterviewerName());
        }

        if (interview.getInterviewType()
                == Interview.InterviewType.ONLINE
                && interview.getMeetingLink() != null
                && !interview.getMeetingLink().isBlank()) {

            message.append(" Meeting link: ")
                    .append(interview.getMeetingLink());
        }

        notificationService.create(
                new NotificationRequest(
                        studentUserId,
                        title,
                        message.toString()
                )
        );
    }

    // Validate required scheduling details.
    private void validateInterviewDetails(InterviewRequest request) {

        if (request.getScheduledDate() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Interview date is required"
            );
        }

        if (request.getScheduledDate().isBefore(LocalDate.now())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Interview date cannot be in the past"
            );
        }

        if (request.getInterviewType() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Interview type is required"
            );
        }

        if (request.getInterviewType() == Interview.InterviewType.ONLINE
                && (request.getMeetingLink() == null
                || request.getMeetingLink().isBlank())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Meeting link is required for an online interview"
            );
        }
    }

    private User getUser(String email) {

        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "User not found"
                        )
                );
    }

    private void verifyRecruiter(User user) {

        if (!"RECRUITER".equals(user.getRole().name())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only recruiters can manage interviews"
            );
        }
    }

    private void verifyRecruiterOwnsApplication(
            Application application,
            User recruiter) {

        if (application == null
                || application.getJob() == null
                || application.getJob().getPostedBy() == null
                || !Objects.equals(
                        application.getJob().getPostedBy().getUserId(),
                        recruiter.getId())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not authorized to manage this interview"
            );
        }
    }

    // Check whether a user is permitted to view the interview.
    private boolean hasAccess(
            Interview interview,
            User user) {

        if (interview == null || interview.getApplication() == null) {
            return false;
        }

        String role = user.getRole().name();

        if ("ADMIN".equals(role)) {
            return true;
        }

        if ("STUDENT".equals(role)) {
            return interview.getApplication().getStudent() != null
                    && Objects.equals(
                            interview.getApplication()
                                    .getStudent().getUserId(),
                            user.getId()
                    );
        }

        if ("RECRUITER".equals(role)) {
            return interview.getApplication().getJob() != null
                    && interview.getApplication().getJob().getPostedBy() != null
                    && Objects.equals(
                            interview.getApplication().getJob()
                                    .getPostedBy().getUserId(),
                            user.getId()
                    );
        }

        return false;
    }

    private void verifyAccess(
            Interview interview,
            User user) {

        if (!hasAccess(interview, user)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not allowed to access this interview"
            );
        }
    }

    // Map the entity to the existing response DTO.
    private InterviewResponse toResponse(Interview interview) {

        return new InterviewResponse(
                interview.getId(),
                interview.getApplication().getId(),
                interview.getScheduledDate(),
                interview.getScheduledTime(),
                interview.getInterviewType(),
                interview.getMeetingLink(),
                interview.getInterviewerName(),
                interview.getNotes(),
                interview.getStatus(),
                interview.getCreatedAt()
        );
    }
}