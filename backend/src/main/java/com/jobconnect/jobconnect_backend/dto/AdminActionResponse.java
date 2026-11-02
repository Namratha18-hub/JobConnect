package com.jobconnect.jobconnect_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AdminActionResponse {

    private Long id;
    private Long adminId;
    private String actionType;
    private String targetType;
    private Long targetId;
    private String description;
    private LocalDateTime createdAt;
}