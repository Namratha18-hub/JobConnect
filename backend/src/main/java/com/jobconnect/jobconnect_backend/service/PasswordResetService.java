
package com.jobconnect.jobconnect_backend.service;

import com.jobconnect.jobconnect_backend.entity.PasswordResetToken;
import com.jobconnect.jobconnect_backend.entity.User;
import com.jobconnect.jobconnect_backend.repository.PasswordResetTokenRepository;
import com.jobconnect.jobconnect_backend.repository.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;

@Service
public class PasswordResetService {

    private static final Logger log =
            LoggerFactory.getLogger(PasswordResetService.class);

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${jobconnect.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${jobconnect.password-reset.log-link:false}")
    private boolean logResetLink;

    public PasswordResetService(
            UserRepository userRepository,
            PasswordResetTokenRepository tokenRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService) {

        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    // REQUEST PASSWORD RESET
    @Transactional
    public void requestPasswordReset(String email) {

        if (email == null || email.isBlank()) {
            return;
        }

        Optional<User> optionalUser =
                userRepository.findByEmailIgnoreCase(email.trim());

        if (optionalUser.isEmpty()) {
            return;
        }

        User user = optionalUser.get();

        // Delete previous reset tokens.
        tokenRepository.deleteByUser_Id(user.getId());

        // Generate a secure token.
        String rawToken = generateSecureToken();

        // Store only its SHA-256 hash.
        String tokenHash = hashToken(rawToken);

        LocalDateTime expiryTime =
                LocalDateTime.now().plusMinutes(15);

        PasswordResetToken resetToken =
                new PasswordResetToken(
                        user,
                        tokenHash,
                        expiryTime
                );

        tokenRepository.save(resetToken);

        String baseUrl = frontendUrl.replaceAll("/+$", "");

        String resetLink =
                baseUrl + "/reset-password?token=" + rawToken;

        // LOCAL DEVELOPMENT ONLY.
        // Never enable reset-link logging in production.
        if (logResetLink) {
            log.warn(
                    "LOCAL DEVELOPMENT RESET LINK: {}",
                    resetLink
            );
        }

        String subject = "Reset Your JobConnect Password";

        String body =
                "Hello " + user.getName() + ",\n\n"
                + "We received a request to reset your JobConnect password.\n\n"
                + "Click the link below to create a new password:\n\n"
                + resetLink + "\n\n"
                + "This link expires in 15 minutes and can only be used once.\n\n"
                + "If you did not request this password reset, "
                + "you can ignore this email.\n\n"
                + "Regards,\n"
                + "JobConnect Team";

        // Email delivery can be enabled later.
        emailService.sendNotificationEmail(
                user.getEmail(),
                subject,
                body
        );
    }

    // RESET PASSWORD
    @Transactional
    public void resetPassword(
            String rawToken,
            String newPassword) {

        if (rawToken == null || rawToken.isBlank()) {
            throw new IllegalArgumentException(
                    "Invalid or expired password-reset link."
            );
        }

        if (newPassword == null || newPassword.isBlank()) {
            throw new IllegalArgumentException(
                    "New password is required."
            );
        }

        String tokenHash = hashToken(rawToken.trim());

        PasswordResetToken resetToken =
                tokenRepository.findByTokenHash(tokenHash)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Invalid or expired password-reset link."
                                )
                        );

        LocalDateTime now = LocalDateTime.now();

        if (!resetToken.getExpiresAt().isAfter(now)
                || resetToken.getUsedAt() != null) {

            throw new IllegalArgumentException(
                    "Invalid or expired password-reset link."
            );
        }

        User user = resetToken.getUser();

        // Update password using BCrypt.
        user.setPassword(
                passwordEncoder.encode(newPassword)
        );

        userRepository.save(user);

        // Mark token as used.
        resetToken.setUsedAt(now);

        tokenRepository.save(resetToken);
    }

    // GENERATE SECURE RANDOM TOKEN
    private String generateSecureToken() {

        byte[] randomBytes = new byte[32];

        secureRandom.nextBytes(randomBytes);

        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(randomBytes);
    }

    // HASH TOKEN USING SHA-256
    private String hashToken(String token) {

        try {
            MessageDigest digest =
                    MessageDigest.getInstance("SHA-256");

            byte[] hash =
                    digest.digest(
                            token.getBytes(StandardCharsets.UTF_8)
                    );

            return HexFormat.of().formatHex(hash);

        } catch (NoSuchAlgorithmException exception) {

            throw new IllegalStateException(
                    "Unable to securely process reset token.",
                    exception
            );
        }
    }
}
