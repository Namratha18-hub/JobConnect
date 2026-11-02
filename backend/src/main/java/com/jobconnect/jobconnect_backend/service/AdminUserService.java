
package com.jobconnect.jobconnect_backend.service;

import com.jobconnect.jobconnect_backend.dto.UserResponse;
import com.jobconnect.jobconnect_backend.entity.User;
import com.jobconnect.jobconnect_backend.entity.enums.AccountStatus;
import com.jobconnect.jobconnect_backend.entity.enums.Role;
import com.jobconnect.jobconnect_backend.repository.UserRepository;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class AdminUserService {

    private final UserRepository userRepository;

    public AdminUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    private User verifyAdmin(String adminEmail) {

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.FORBIDDEN,
                                "Admin account not found"
                        )
                );

        if (admin.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only administrators can manage users"
            );
        }

        if (admin.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Admin account is not active"
            );
        }

        return admin;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers(String adminEmail) {

        verifyAdmin(adminEmail);

        return userRepository.findAll(
                        Sort.by(Sort.Direction.DESC, "createdAt")
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public UserResponse updateUserStatus(
            String adminEmail,
            Long userId,
            AccountStatus newStatus
    ) {

        User admin = verifyAdmin(adminEmail);

        User target = userRepository.findById(userId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "User not found"
                        )
                );

        if (target.getId().equals(admin.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "You cannot change your own account status"
            );
        }

        if (target.getRole() == Role.ADMIN) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Admin accounts cannot be modified here"
            );
        }

        target.setAccountStatus(newStatus);

        User updatedUser = userRepository.save(target);

        return toResponse(updatedUser);
    }

    private UserResponse toResponse(User user) {

        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getAccountStatus(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
