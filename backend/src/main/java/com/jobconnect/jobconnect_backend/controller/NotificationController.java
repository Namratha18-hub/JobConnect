package com.jobconnect.jobconnect_backend.controller;

import com.jobconnect.jobconnect_backend.dto.NotificationResponse;
import com.jobconnect.jobconnect_backend.service.NotificationService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    // Get all notifications for the logged-in user.
    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getAll(
            Principal principal) {

        return ResponseEntity.ok(
                service.getAll(principal.getName())
        );
    }

    // Get one notification.
    @GetMapping("/{id}")
    public ResponseEntity<NotificationResponse> getById(
            @PathVariable Long id,
            Principal principal) {

        return ResponseEntity.ok(
                service.getById(id, principal.getName())
        );
    }

    // Get unread notification count.
    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(
            Principal principal) {

        return ResponseEntity.ok(
                service.getUnreadCount(principal.getName())
        );
    }

    // Mark one notification as read.
    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(
            @PathVariable Long id,
            Principal principal) {

        return ResponseEntity.ok(
                service.markAsRead(id, principal.getName())
        );
    }

    // Mark all notifications as read.
    @PatchMapping("/read-all")
    public ResponseEntity<List<NotificationResponse>> markAllAsRead(
            Principal principal) {

        return ResponseEntity.ok(
                service.markAllAsRead(principal.getName())
        );
    }
}