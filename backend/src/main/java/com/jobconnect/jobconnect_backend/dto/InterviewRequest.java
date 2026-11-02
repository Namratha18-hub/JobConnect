package com.jobconnect.jobconnect_backend.dto;

import com.jobconnect.jobconnect_backend.entity.Interview.InterviewType;
import com.jobconnect.jobconnect_backend.entity.Interview.Status;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InterviewRequest {

    @NotNull
    private Long applicationId;

    @NotNull
    private LocalDate scheduledDate;

    private LocalTime scheduledTime;

    @NotNull
    private InterviewType interviewType;

    private String meetingLink;

    private String interviewerName;

    private String notes;

    private Status status;
}
