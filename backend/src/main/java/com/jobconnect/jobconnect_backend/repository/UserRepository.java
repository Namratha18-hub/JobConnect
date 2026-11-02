package com.jobconnect.jobconnect_backend.repository;

import com.jobconnect.jobconnect_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    // Find user using exact email
    Optional<User> findByEmail(String email);

    // Find user without considering uppercase or lowercase letters
    Optional<User> findByEmailIgnoreCase(String email);
}