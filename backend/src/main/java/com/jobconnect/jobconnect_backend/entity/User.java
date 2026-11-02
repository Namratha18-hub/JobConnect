
package com.jobconnect.jobconnect_backend.entity;

import com.jobconnect.jobconnect_backend.entity.enums.AccountStatus;
import com.jobconnect.jobconnect_backend.entity.enums.Role;

import jakarta.persistence.*;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, unique = true, length = 160)
    private String email;

    // Store only BCrypt-encrypted passwords.
    @Column(nullable = false, length = 255)
    private String password;

    // User role: STUDENT, RECRUITER or ADMIN.
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    // Account status: ACTIVE, INACTIVE or SUSPENDED.
    @Enumerated(EnumType.STRING)
    @Column(
        name = "account_status",
        nullable = false,
        length = 20
    )
    @Builder.Default
    private AccountStatus accountStatus = AccountStatus.ACTIVE;

    @CreationTimestamp
    @Column(
        name = "created_at",
        nullable = false,
        updatable = false
    )
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(
        name = "updated_at",
        nullable = false
    )
    private LocalDateTime updatedAt;
}
