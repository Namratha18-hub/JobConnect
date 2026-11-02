
package com.jobconnect.jobconnect_backend.controller;

import com.jobconnect.jobconnect_backend.dto.UpdateUserStatusRequest;
import com.jobconnect.jobconnect_backend.dto.UserResponse;
import com.jobconnect.jobconnect_backend.service.AdminUserService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers(
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                adminUserService.getAllUsers(authentication.getName())
        );
    }

    @PatchMapping("/{userId}/status")
    public ResponseEntity<UserResponse> updateUserStatus(
            Authentication authentication,
            @PathVariable Long userId,
            @Valid @RequestBody UpdateUserStatusRequest request
    ) {

        return ResponseEntity.ok(
                adminUserService.updateUserStatus(
                        authentication.getName(),
                        userId,
                        request.getStatus()
                )
        );
    }
}
