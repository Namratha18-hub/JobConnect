package com.jobconnect.jobconnect_backend.service;

import com.jobconnect.jobconnect_backend.dto.StudentProfileResponse;
import com.jobconnect.jobconnect_backend.dto.StudentProfileUpdateRequest;
import com.jobconnect.jobconnect_backend.entity.StudentProfile;
import com.jobconnect.jobconnect_backend.entity.User;
import com.jobconnect.jobconnect_backend.repository.StudentProfileRepository;
import com.jobconnect.jobconnect_backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StudentProfileService {

    private final StudentProfileRepository repository;
    private final UserRepository userRepository;

    public StudentProfileService(
            StudentProfileRepository repository,
            UserRepository userRepository) {

        this.repository = repository;
        this.userRepository = userRepository;
    }

    public StudentProfileResponse getById(Long id) {

        StudentProfile profile =
                getOrCreateProfile(id);

        return toResponse(profile);
    }

    public List<StudentProfileResponse> getAll() {

        return repository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public StudentProfileResponse update(
            Long id,
            StudentProfileUpdateRequest request) {

        StudentProfile profile =
                getOrCreateProfile(id);

        profile.setPhone(
                clean(request.getPhone())
        );

        profile.setLocation(
                clean(request.getLocation())
        );

        profile.setBio(
                clean(request.getBio())
        );

        StudentProfile updatedProfile =
                repository.save(profile);

        return toResponse(updatedProfile);
    }

    private StudentProfile getOrCreateProfile(
            Long userId) {

        return repository.findById(userId)
                .orElseGet(() -> {

                    User user =
                            userRepository
                                    .findById(userId)
                                    .orElseThrow(() ->
                                            new RuntimeException(
                                                    "User not found"
                                            )
                                    );

                    /*
                     * StudentProfile uses @MapsId.
                     * Set the User relationship so
                     * Hibernate derives user_id correctly.
                     */
                    StudentProfile profile =
                            new StudentProfile();

                    profile.setUser(user);

                    return repository
                            .saveAndFlush(profile);
                });
    }

    private String clean(String value) {

        if (value == null) {
            return null;
        }

        String cleaned =
                value.trim();

        return cleaned.isEmpty()
                ? null
                : cleaned;
    }

    private StudentProfileResponse toResponse(
            StudentProfile profile) {

        return new StudentProfileResponse(
                profile.getUserId(),
                profile.getPhone(),
                profile.getLocation(),
                profile.getBio()
        );
    }
}