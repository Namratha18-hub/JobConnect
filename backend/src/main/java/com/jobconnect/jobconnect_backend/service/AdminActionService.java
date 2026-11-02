package com.jobconnect.jobconnect_backend.service;

import com.jobconnect.jobconnect_backend.dto.AdminActionRequest;
import com.jobconnect.jobconnect_backend.dto.AdminActionResponse;
import com.jobconnect.jobconnect_backend.entity.AdminAction;
import com.jobconnect.jobconnect_backend.entity.User;
import com.jobconnect.jobconnect_backend.repository.AdminActionRepository;
import com.jobconnect.jobconnect_backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminActionService {

    private final AdminActionRepository repository;
    private final UserRepository userRepository;

    public AdminActionService(
            AdminActionRepository repository,
            UserRepository userRepository) {

        this.repository = repository;
        this.userRepository = userRepository;
    }

    public AdminActionResponse getById(Long id) {
        AdminAction action = repository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Admin action not found"));

        return toResponse(action);
    }

    public List<AdminActionResponse> getAll() {
        return repository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public AdminActionResponse create(AdminActionRequest request) {

        User admin = userRepository.findById(request.getAdminId())
                .orElseThrow(() ->
                        new RuntimeException("Admin user not found"));

        AdminAction action = AdminAction.builder()
                .admin(admin)
                .actionType(request.getActionType())
                .targetType(request.getTargetType())
                .targetId(request.getTargetId())
                .description(request.getDescription())
                .build();

        AdminAction savedAction = repository.save(action);

        return toResponse(savedAction);
    }

    private AdminActionResponse toResponse(AdminAction action) {
        return new AdminActionResponse(
                action.getId(),
                action.getAdmin().getId(),
                action.getActionType(),
                action.getTargetType(),
                action.getTargetId(),
                action.getDescription(),
                action.getCreatedAt()
        );
    }
}