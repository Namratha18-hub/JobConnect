package com.jobconnect.jobconnect_backend.controller;

import com.jobconnect.jobconnect_backend.dto.UserResponse;
import com.jobconnect.jobconnect_backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @GetMapping("/email")
    public ResponseEntity<UserResponse> getUserByEmail(
            @RequestParam String email) {
        return ResponseEntity.ok(userService.getUserByEmail(email));
    }
}