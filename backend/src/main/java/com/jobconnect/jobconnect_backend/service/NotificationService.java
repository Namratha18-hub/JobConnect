
package com.jobconnect.jobconnect_backend.service;

import com.jobconnect.jobconnect_backend.dto.NotificationRequest;
import com.jobconnect.jobconnect_backend.dto.NotificationResponse;
import com.jobconnect.jobconnect_backend.entity.Notification;
import com.jobconnect.jobconnect_backend.entity.User;
import com.jobconnect.jobconnect_backend.repository.NotificationRepository;
import com.jobconnect.jobconnect_backend.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository repository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public NotificationService(
            NotificationRepository repository,
            UserRepository userRepository,
            EmailService emailService) {

        this.repository = repository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    // Retrieve one notification belonging to the logged-in user.
    public NotificationResponse getById(
            Long id,
            String email) {

        User user = getUser(email);

        Notification notification =
                repository.findByIdAndUser_Id(
                        id,
                        user.getId()
                ).orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Notification not found"
                        )
                );

        return toResponse(notification);
    }

    // Retrieve the logged-in user's notifications.
    public List<NotificationResponse> getAll(
            String email) {

        User user = getUser(email);

        return repository
                .findByUser_IdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // Create an in-app notification and send an email.
    public NotificationResponse create(
            NotificationRequest request) {

        User user = userRepository
                .findById(request.getUserId())
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "User not found"
                        )
                );

        Notification notification =
                Notification.builder()
                        .user(user)
                        .title(request.getTitle())
                        .message(request.getMessage())
                        .isRead(false)
                        .build();

        Notification savedNotification =
                repository.save(notification);

        // Send email to the same notification recipient.
        emailService.sendNotificationEmail(
                user.getEmail(),
                savedNotification.getTitle(),
                savedNotification.getMessage()
        );

        return toResponse(savedNotification);
    }

    // Mark one notification as read.
    public NotificationResponse markAsRead(
            Long id,
            String email) {

        User user = getUser(email);

        Notification notification =
                repository.findByIdAndUser_Id(
                        id,
                        user.getId()
                ).orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Notification not found"
                        )
                );

        notification.setIsRead(true);

        Notification savedNotification =
                repository.save(notification);

        return toResponse(savedNotification);
    }

    // Retrieve unread notification count.
    public long getUnreadCount(String email) {

        User user = getUser(email);

        return repository.countByUser_IdAndIsReadFalse(
                user.getId()
        );
    }

    // Mark all unread notifications as read.
    public List<NotificationResponse> markAllAsRead(
            String email) {

        User user = getUser(email);

        List<Notification> unreadNotifications =
                repository.findByUser_IdAndIsReadFalseOrderByCreatedAtDesc(
                        user.getId()
                );

        unreadNotifications.forEach(
                notification -> notification.setIsRead(true)
        );

        return repository.saveAll(unreadNotifications)
                .stream()
                .map(this::toResponse)
                .toList();
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

    private NotificationResponse toResponse(
            Notification notification) {

        return new NotificationResponse(
                notification.getId(),
                notification.getUser().getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getIsRead(),
                notification.getCreatedAt()
        );
    }
}
