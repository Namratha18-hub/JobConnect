
package com.jobconnect.jobconnect_backend.controller;

import com.jobconnect.jobconnect_backend.dto.ResumeResponse;
import com.jobconnect.jobconnect_backend.service.ResumeService;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Path;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/resumes")
public class ResumeController {

    private final ResumeService service;

    public ResumeController(ResumeService service) {
        this.service = service;
    }

    // --------------------------------------------------
    // GET A RESUME'S METADATA
    // --------------------------------------------------

    @GetMapping("/{id}")
    public ResponseEntity<ResumeResponse> getById(
            @PathVariable Long id,
            Principal principal) {

        return ResponseEntity.ok(
                service.getById(
                        id,
                        principal.getName()
                )
        );
    }

    // --------------------------------------------------
    // GET RESUMES VISIBLE TO THE LOGGED-IN USER
    // --------------------------------------------------

    @GetMapping
    public ResponseEntity<List<ResumeResponse>> getAll(
            Principal principal) {

        return ResponseEntity.ok(
                service.getAll(principal.getName())
        );
    }

    // --------------------------------------------------
    // VIEW A RESUME PDF
    // --------------------------------------------------

    @GetMapping("/{id}/file")
    public ResponseEntity<Resource> viewResume(
            @PathVariable Long id,
            Principal principal) throws IOException {

        // The service verifies that the logged-in user
        // has permission to access this resume.
        Path path = service.getAuthorizedResumePath(
                id,
                principal.getName()
        );

        Resource resource = new UrlResource(
                path.toUri()
        );

        if (!resource.exists()
                || !resource.isReadable()) {

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Resume file not found"
            );
        }

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\""
                                + path.getFileName().toString()
                                + "\""
                )
                .header(
                        HttpHeaders.CACHE_CONTROL,
                        "no-store"
                )
                .body(resource);
    }

    // --------------------------------------------------
    // UPLOAD A RESUME
    // --------------------------------------------------

    @PostMapping(
            value = "/upload",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ResumeResponse> uploadResume(
            @RequestParam("file") MultipartFile file,
            Principal principal) throws IOException {

        ResumeResponse response = service.upload(
                file,
                principal.getName()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }
}
