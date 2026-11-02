
package com.jobconnect.jobconnect_backend.controller;

import com.jobconnect.jobconnect_backend.dto.AuthResponse;
import com.jobconnect.jobconnect_backend.dto.LoginRequest;
import com.jobconnect.jobconnect_backend.dto.RegisterRequest;
import com.jobconnect.jobconnect_backend.dto.ForgotPasswordRequest;
import com.jobconnect.jobconnect_backend.dto.ResetPasswordRequest;
import com.jobconnect.jobconnect_backend.dto.DirectPasswordResetRequest;

import com.jobconnect.jobconnect_backend.service.AuthService;
import com.jobconnect.jobconnect_backend.service.PasswordResetService;

import com.jobconnect.jobconnect_backend.repository.UserRepository;
import com.jobconnect.jobconnect_backend.entity.User;

import jakarta.validation.Valid;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(
            AuthService authService,
            PasswordResetService passwordResetService,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        this.authService = authService;
        this.passwordResetService = passwordResetService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // REGISTER
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(authService.register(request));
    }

    // LOGIN
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request) {

        return ResponseEntity.ok(authService.login(request));
    }

    // FORGOT PASSWORD - EMAIL RESET LINK
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {

        passwordResetService.requestPasswordReset(
                request.getEmail()
        );

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "If an account exists with that email, "
                                + "a password reset link will be sent."
                )
        );
    }

    // RESET PASSWORD - TOKEN BASED
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {

        try {
            passwordResetService.resetPassword(
                    request.getToken(),
                    request.getNewPassword()
            );

            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "Password reset successfully. "
                                    + "Please sign in with your new password."
                    )
            );

        } catch (IllegalArgumentException exception) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    exception.getMessage()
                            )
                    );
        }
    }

    // DIRECT PASSWORD RESET - LOCAL DEMO ONLY
    @PostMapping("/direct-reset-password")
    public ResponseEntity<Map<String, String>> directResetPassword(
            @Valid @RequestBody DirectPasswordResetRequest request) {

        // Confirm passwords
        if (!request.getNewPassword()
                .equals(request.getConfirmPassword())) {

            return ResponseEntity.badRequest().body(
                    Map.of("message", "Passwords do not match.")
            );
        }

        // Find registered user
        User user = userRepository.findByEmailIgnoreCase(
                request.getEmail().trim()
        ).orElse(null);

        if (user == null) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", "Email address not found.")
            );
        }

        // Encrypt and update password
        user.setPassword(
                passwordEncoder.encode(request.getNewPassword())
        );

        userRepository.save(user);

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Password updated successfully! Please login."
                )
        );
    }
}
