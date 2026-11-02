package com.jobconnect.jobconnect_backend.repository;

import com.jobconnect.jobconnect_backend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository
        extends JpaRepository<Notification, Long> {

    List<Notification> findByUser_IdOrderByCreatedAtDesc(
            Long userId
    );

    Optional<Notification> findByIdAndUser_Id(
            Long id,
            Long userId
    );

    // Count unread notifications for one user.
    long countByUser_IdAndIsReadFalse(Long userId);
   List<Notification> findByUser_IdAndIsReadFalseOrderByCreatedAtDesc(
            Long userId
    );
}