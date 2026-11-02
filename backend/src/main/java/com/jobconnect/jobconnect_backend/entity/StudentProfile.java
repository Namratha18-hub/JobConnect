package com.jobconnect.jobconnect_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "student_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentProfile {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(length = 20)
    private String phone;

    @Column(length = 160)
    private String location;

    @Column(name = "about", columnDefinition = "TEXT")
    private String bio;

    @Column(name = "profile_photo_url", length = 255)
    private String profilePhotoUrl;
}