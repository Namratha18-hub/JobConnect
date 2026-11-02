package com.jobconnect.jobconnect_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class JobconnectBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(
                JobconnectBackendApplication.class,
                args
        );
    }
}