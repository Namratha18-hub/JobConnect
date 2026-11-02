package com.jobconnect.jobconnect_backend.service;

import com.jobconnect.jobconnect_backend.dto.SavedExternalInternshipRequest;
import com.jobconnect.jobconnect_backend.dto.SavedExternalInternshipResponse;
import com.jobconnect.jobconnect_backend.entity.SavedExternalInternship;
import com.jobconnect.jobconnect_backend.entity.StudentProfile;
import com.jobconnect.jobconnect_backend.entity.User;
import com.jobconnect.jobconnect_backend.entity.enums.Role;
import com.jobconnect.jobconnect_backend.entity.external.ExternalInternship;
import com.jobconnect.jobconnect_backend.repository.ExternalInternshipRepository;
import com.jobconnect.jobconnect_backend.repository.SavedExternalInternshipRepository;
import com.jobconnect.jobconnect_backend.repository.StudentProfileRepository;
import com.jobconnect.jobconnect_backend.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class SavedExternalInternshipService {

    private final SavedExternalInternshipRepository repository;
    private final StudentProfileRepository studentProfileRepository;
    private final ExternalInternshipRepository externalInternshipRepository;
    private final UserRepository userRepository;

    public SavedExternalInternshipService(
            SavedExternalInternshipRepository repository,
            StudentProfileRepository studentProfileRepository,
            ExternalInternshipRepository externalInternshipRepository,
            UserRepository userRepository) {

        this.repository = repository;
        this.studentProfileRepository = studentProfileRepository;
        this.externalInternshipRepository = externalInternshipRepository;
        this.userRepository = userRepository;
    }

    /*
     * Get saved external internships belonging to the logged-in student.
     */
    @Transactional(readOnly = true)
    public List<SavedExternalInternshipResponse> getAll() {

        User user = getAuthenticatedStudent();

        return repository.findByStudent_UserId(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /*
     * Save an external internship for the authenticated student.
     */
    public SavedExternalInternshipResponse create(
            SavedExternalInternshipRequest request) {

        User user = getAuthenticatedStudent();

        if (request == null
                || request.getExternalInternshipId() == null
                || request.getExternalInternshipId().isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "External internship ID is required"
            );
        }

        Long externalInternshipId;

        try {
            externalInternshipId = Long.parseLong(
                    request.getExternalInternshipId().trim()
            );
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid external internship ID"
            );
        }

        StudentProfile student = studentProfileRepository
                .findById(user.getId())
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Student profile not found"
                        ));

        ExternalInternship internship = externalInternshipRepository
                .findById(externalInternshipId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "External internship not found"
                        ));

        /*
         * Only currently live, non-expired external internships
         * can be newly saved.
         */
        if (!"LIVE".equalsIgnoreCase(internship.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "This external internship is no longer available"
            );
        }

        if (internship.getApplicationDeadline() != null
                && internship.getApplicationDeadline().isBefore(LocalDate.now())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "The application deadline has passed"
            );
        }

        SavedExternalInternship.SavedExternalInternshipId id =
                new SavedExternalInternship.SavedExternalInternshipId(
                        user.getId(),
                        internship.getId()
                );

        if (repository.existsById(id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This external internship is already saved"
            );
        }

        SavedExternalInternship saved =
                new SavedExternalInternship();

        saved.setId(id);
        saved.setStudent(student);
        saved.setExternalInternship(internship);

        return toResponse(repository.save(saved));
    }

    /*
     * Remove an external internship from the authenticated
     * student's saved list.
     */
    public void delete(String externalInternshipId) {

        User user = getAuthenticatedStudent();

        if (externalInternshipId == null
                || externalInternshipId.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "External internship ID is required"
            );
        }

        Long internshipId;

        try {
            internshipId = Long.parseLong(
                    externalInternshipId.trim()
            );
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid external internship ID"
            );
        }

        SavedExternalInternship.SavedExternalInternshipId id =
                new SavedExternalInternship.SavedExternalInternshipId(
                        user.getId(),
                        internshipId
                );

        if (!repository.existsById(id)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Saved external internship not found"
            );
        }

        repository.deleteById(id);
    }

    /*
     * Resolve the authenticated user from Spring Security.
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
                    "Please log in to manage saved internships"
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
                    "Only students can manage saved internships"
            );
        }

        return user;
    }

    /*
     * Convert a saved internship and its associated listing
     * into the frontend response DTO.
     */
    private SavedExternalInternshipResponse toResponse(
            SavedExternalInternship saved) {

        ExternalInternship internship =
                saved.getExternalInternship();

        String deadline =
                internship.getApplicationDeadline() == null
                        ? null
                        : internship.getApplicationDeadline().toString();

        String verifiedOn =
                internship.getLastVerifiedAt() == null
                        ? null
                        : internship.getLastVerifiedAt()
                                .toLocalDate()
                                .toString();

        return new SavedExternalInternshipResponse(
                saved.getId().getStudentId(),
                String.valueOf(internship.getId()),
                internship.getTitle(),
                internship.getCompanyName(),
                internship.getLocation(),
                internship.getWorkMode(),
                internship.getDuration(),
                internship.getPayDisplay(),
                deadline,
                internship.getDomain(),
                internship.getCategory(),
                internship.getEligibleYears(),
                internship.getSource(),
                internship.getExternalApplyUrl(),
                verifiedOn,
                "Automatically updated from live source",
                saved.getSavedAt()
        );
    }
}