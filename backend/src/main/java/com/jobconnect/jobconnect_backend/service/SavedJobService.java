package com.jobconnect.jobconnect_backend.service;

import com.jobconnect.jobconnect_backend.dto.SavedJobRequest;
import com.jobconnect.jobconnect_backend.dto.SavedJobResponse;
import com.jobconnect.jobconnect_backend.entity.Job;
import com.jobconnect.jobconnect_backend.entity.SavedJob;
import com.jobconnect.jobconnect_backend.entity.StudentProfile;
import com.jobconnect.jobconnect_backend.entity.User;
import com.jobconnect.jobconnect_backend.entity.enums.Role;
import com.jobconnect.jobconnect_backend.repository.JobRepository;
import com.jobconnect.jobconnect_backend.repository.SavedJobRepository;
import com.jobconnect.jobconnect_backend.repository.StudentProfileRepository;
import com.jobconnect.jobconnect_backend.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;

@Service
@Transactional
public class SavedJobService {

    private final SavedJobRepository repository;
    private final StudentProfileRepository studentProfileRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;

    public SavedJobService(
            SavedJobRepository repository,
            StudentProfileRepository studentProfileRepository,
            JobRepository jobRepository,
            UserRepository userRepository) {

        this.repository = repository;
        this.studentProfileRepository = studentProfileRepository;
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
    }

    /*
     * Get one saved job.
     * A student can only access their own saved-job record.
     */
    @Transactional(readOnly = true)
    public SavedJobResponse getById(SavedJob.SavedJobId id) {

        User currentUser = getAuthenticatedStudent();

        if (!Objects.equals(id.getStudentId(), currentUser.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You cannot access another student's saved job"
            );
        }

        SavedJob savedJob = repository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Saved job not found"
                        ));

        return toResponse(savedJob);
    }

    /*
     * Return only the authenticated student's saved jobs.
     */
    @Transactional(readOnly = true)
    public List<SavedJobResponse> getAll() {

        User currentUser = getAuthenticatedStudent();

        return repository.findAll()
                .stream()
                .filter(savedJob ->
                        Objects.equals(
                                savedJob.getId().getStudentId(),
                                currentUser.getId()
                        ))
                .map(this::toResponse)
                .toList();
    }

    /*
     * Save a job for the authenticated student.
     * The client cannot save a job on behalf of another student.
     */
    public SavedJobResponse create(SavedJobRequest request) {

        User currentUser = getAuthenticatedStudent();

        if (!Objects.equals(
                request.getStudentId(),
                currentUser.getId())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only save jobs for your own account"
            );
        }

        if (request.getJobId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Job ID is required"
            );
        }

        SavedJob.SavedJobId id =
                new SavedJob.SavedJobId(
                        currentUser.getId(),
                        request.getJobId()
                );

        if (repository.existsById(id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Job is already saved by this student"
            );
        }

        StudentProfile student = studentProfileRepository
                .findById(currentUser.getId())
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Student profile not found"
                        ));

        Job job = jobRepository
                .findById(request.getJobId())
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Job not found"
                        ));

        SavedJob savedJob = new SavedJob();

        savedJob.setId(id);
        savedJob.setStudent(student);
        savedJob.setJob(job);

        SavedJob saved = repository.save(savedJob);

        return toResponse(saved);
    }

    /*
     * Delete a saved job only if it belongs to the authenticated student.
     */
    public void delete(Long studentId, Long jobId) {

        User currentUser = getAuthenticatedStudent();

        if (!Objects.equals(studentId, currentUser.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only remove your own saved jobs"
            );
        }

        SavedJob.SavedJobId id =
                new SavedJob.SavedJobId(
                        currentUser.getId(),
                        jobId
                );

        if (!repository.existsById(id)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Saved job not found"
            );
        }

        repository.deleteById(id);
    }

    /*
     * Resolve the current user from the authenticated security context.
     */
    private User getAuthenticatedStudent() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken
                || authentication.getName() == null
                || authentication.getName().isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Please log in to access saved jobs"
            );
        }

        User user = userRepository
                .findByEmail(authentication.getName())
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "Authenticated user was not found"
                        ));

        if (user.getRole() != Role.STUDENT) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only students can access saved jobs"
            );
        }

        return user;
    }

    /*
     * Convert the entity to the existing response DTO.
     */
    private SavedJobResponse toResponse(SavedJob savedJob) {

        return new SavedJobResponse(
                savedJob.getId().getStudentId(),
                savedJob.getId().getJobId(),
                savedJob.getSavedAt()
        );
    }
}