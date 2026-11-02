package com.jobconnect.jobconnect_backend.dto;

import com.jobconnect.jobconnect_backend.entity.Interview.InterviewType;
import com.jobconnect.jobconnect_backend.entity.Interview.Status;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InterviewResponse {

    private Long id;
    private Long applicationId;
    private LocalDate scheduledDate;
    private LocalTime scheduledTime;
    private InterviewType interviewType;
    private String meetingLink;
    private String interviewerName;
    private String notes;
    private Status status;
    private LocalDateTime createdAt;
}