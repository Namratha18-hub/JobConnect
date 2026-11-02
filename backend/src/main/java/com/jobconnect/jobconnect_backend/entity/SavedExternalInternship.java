package com.jobconnect.jobconnect_backend.entity;

import com.jobconnect.jobconnect_backend.entity.external.ExternalInternship;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(name = "saved_external_internships")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SavedExternalInternship {

    @EmbeddedId
    private SavedExternalInternshipId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("studentId")
    @JoinColumn(name = "student_id", nullable = false)
    private StudentProfile student;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("externalInternshipId")
    @JoinColumn(
            name = "external_internship_id",
            nullable = false
    )
    private ExternalInternship externalInternship;

    @Column(name = "saved_at", nullable = false)
    private LocalDateTime savedAt = LocalDateTime.now();

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class SavedExternalInternshipId
            implements Serializable {

        private static final long serialVersionUID = 1L;

        @Column(name = "student_id")
        private Long studentId;

        @Column(name = "external_internship_id")
        private Long externalInternshipId;
    }
}