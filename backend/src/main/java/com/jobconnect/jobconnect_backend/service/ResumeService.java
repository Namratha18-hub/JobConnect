
package com.jobconnect.jobconnect_backend.service;

import com.jobconnect.jobconnect_backend.dto.ResumeResponse;
import com.jobconnect.jobconnect_backend.entity.Resume;
import com.jobconnect.jobconnect_backend.entity.StudentProfile;
import com.jobconnect.jobconnect_backend.entity.User;
import com.jobconnect.jobconnect_backend.repository.ApplicationRepository;
import com.jobconnect.jobconnect_backend.repository.ResumeRepository;
import com.jobconnect.jobconnect_backend.repository.StudentProfileRepository;
import com.jobconnect.jobconnect_backend.repository.UserRepository;

import jakarta.transaction.Transactional;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.regex.Pattern;

@Service
public class ResumeService {

    private static final long MAX_RESUME_SIZE =
            10L * 1024L * 1024L;

    private static final String INVALID_RESUME_MESSAGE =
            "Please upload a correct resume PDF. "
            + "The selected document does not appear to be a resume.";

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile(
                    "[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}",
                    Pattern.CASE_INSENSITIVE
            );

    private static final Pattern PHONE_PATTERN =
            Pattern.compile(
                    "(?:\\+?\\d{1,3}[\\s-]?)?(?:\\d[\\s-]?){10}"
            );

    private final ResumeRepository repository;
    private final StudentProfileRepository studentProfileRepository;
    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;

    public ResumeService(
            ResumeRepository repository,
            StudentProfileRepository studentProfileRepository,
            UserRepository userRepository,
            ApplicationRepository applicationRepository) {

        this.repository = repository;
        this.studentProfileRepository = studentProfileRepository;
        this.userRepository = userRepository;
        this.applicationRepository = applicationRepository;
    }

    // --------------------------------------------------
    // GET RESUME BY ID
    // --------------------------------------------------

    @Transactional
    public ResumeResponse getById(Long id, String email) {

        User user = getUser(email);

        Resume resume = repository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Resume not found"
                        )
                );

        authorizeResumeAccess(resume, user);

        return toResponse(resume);
    }

    // --------------------------------------------------
    // GET AUTHORIZED RESUME FILE PATH
    // --------------------------------------------------

    @Transactional
    public Path getAuthorizedResumePath(
            Long id,
            String email) {

        User user = getUser(email);

        Resume resume = repository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Resume not found"
                        )
                );

        // Verify ownership or recruiter access before
        // accessing the physical PDF file.
        authorizeResumeAccess(resume, user);

        if (resume.getStudent() == null
                || resume.getStudent().getUserId() == null
                || resume.getFileName() == null
                || resume.getFileName().isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Resume file not found"
            );
        }

        // This matches the directory used by upload().
        Path resumeRoot = Paths.get(
                "uploads",
                "resumes"
        ).toAbsolutePath().normalize();

        Path studentDirectory = resumeRoot
                .resolve(
                        String.valueOf(
                                resume.getStudent().getUserId()
                        )
                )
                .normalize();

        Path resumePath = studentDirectory
                .resolve(resume.getFileName())
                .normalize();

        // Ensure the resolved path stays inside the
        // selected student's resume directory.
        if (!studentDirectory.startsWith(resumeRoot)
                || !resumePath.startsWith(studentDirectory)) {

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Resume file not found"
            );
        }

        try {
            // Resolve symbolic links and verify that the
            // actual file remains inside the student directory.
            Path realStudentDirectory =
                    studentDirectory.toRealPath();

            Path realResumePath =
                    resumePath.toRealPath();

            if (!realResumePath.startsWith(realStudentDirectory)
                    || !Files.isRegularFile(realResumePath)
                    || !Files.isReadable(realResumePath)) {

                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Resume file not found"
                );
            }

            return realResumePath;

        } catch (IOException ex) {

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Resume file not found"
            );
        }
    }

    // --------------------------------------------------
    // GET RESUMES VISIBLE TO THE LOGGED-IN USER
    // --------------------------------------------------

    @Transactional
    public List<ResumeResponse> getAll(String email) {

        User user = getUser(email);

        String role = user.getRole().name();

        List<Resume> resumes;

        if ("STUDENT".equals(role)) {

            resumes = repository.findByStudent_UserId(
                    user.getId()
            );

        } else if ("RECRUITER".equals(role)) {

            resumes = applicationRepository
                    .findDistinctResumesForRecruiter(
                            user.getId()
                    );

        } else if ("ADMIN".equals(role)) {

            resumes = repository.findAll();

        } else {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not authorized to access resumes"
            );
        }

        return resumes.stream()
                .map(this::toResponse)
                .toList();
    }

    // --------------------------------------------------
    // CHECK RESUME ACCESS
    // --------------------------------------------------

    private void authorizeResumeAccess(
            Resume resume,
            User user) {

        String role = user.getRole().name();

        // Administrators can view all resumes.
        if ("ADMIN".equals(role)) {
            return;
        }

        // Students can view only their own resumes.
        if ("STUDENT".equals(role)
                && resume.getStudent() != null
                && Objects.equals(
                        resume.getStudent().getUserId(),
                        user.getId())) {

            return;
        }

        // Recruiters can view resumes associated with
        // applications to their own jobs.
        if ("RECRUITER".equals(role)
                && applicationRepository
                        .existsByResume_IdAndJob_PostedBy_UserId(
                                resume.getId(),
                                user.getId())) {

            return;
        }

        throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Resume not found"
        );
    }

    // --------------------------------------------------
    // FIND LOGGED-IN USER
    // --------------------------------------------------

    private User getUser(String email) {

        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "User not found"
                        )
                );
    }

    // --------------------------------------------------
    // UPLOAD RESUME
    // --------------------------------------------------

    @Transactional
    public ResumeResponse upload(
            MultipartFile file,
            String email) throws IOException {

        // 1. Validate the uploaded file.
        validateBasicFile(file);

        // 2. Validate the PDF contents.
        validateResumeContent(file);

        // 3. Find the authenticated user.
        User user = getUser(email);

        // Only students can upload resumes.
        if (!"STUDENT".equals(user.getRole().name())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Only students can upload resumes"
            );
        }

        // 4. Find or create the student's profile.
        StudentProfile student =
                studentProfileRepository
                        .findById(user.getId())
                        .orElseGet(() -> {

                            StudentProfile newProfile =
                                    new StudentProfile();

                            newProfile.setUser(user);

                            return studentProfileRepository
                                    .saveAndFlush(newProfile);
                        });

        // 5. Sanitize the filename.
        String originalFileName =
                file.getOriginalFilename();

        String safeFileName =
                sanitizeFileName(originalFileName);

        // 6. Create the student's upload directory.
        Path uploadDirectory =
                Paths.get(
                        "uploads",
                        "resumes",
                        String.valueOf(user.getId())
                );

        Files.createDirectories(uploadDirectory);

        // 7. Save the physical PDF file.
        Path filePath =
                uploadDirectory.resolve(safeFileName);

        Files.copy(
                file.getInputStream(),
                filePath,
                StandardCopyOption.REPLACE_EXISTING
        );

        // 8. Deactivate older resumes.
        List<Resume> oldResumes =
                repository.findByStudent_UserId(
                        user.getId()
                );

        for (Resume oldResume : oldResumes) {
            oldResume.setIsActive(false);
        }

        if (!oldResumes.isEmpty()) {
            repository.saveAll(oldResumes);
        }

        // 9. Save the new active resume record.
        Resume resume = Resume.builder()
                .student(student)
                .fileName(safeFileName)
                .filePath(
                        "/uploads/resumes/"
                                + user.getId()
                                + "/"
                                + safeFileName
                )
                .fileSize(file.getSize())
                .isActive(true)
                .build();

        Resume savedResume = repository.save(resume);

        return toResponse(savedResume);
    }

    // --------------------------------------------------
    // BASIC FILE VALIDATION
    // --------------------------------------------------

    private void validateBasicFile(MultipartFile file) {

        if (file == null || file.isEmpty()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please select your resume."
            );
        }

        if (file.getSize() > MAX_RESUME_SIZE) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Resume must be 10 MB or smaller."
            );
        }

        String originalFileName =
                file.getOriginalFilename();

        if (originalFileName == null
                || originalFileName.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    INVALID_RESUME_MESSAGE
            );
        }

        if (!originalFileName
                .toLowerCase(Locale.ROOT)
                .endsWith(".pdf")) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please upload your resume in PDF format."
            );
        }

        String contentType = file.getContentType();

        if (contentType != null
                && !contentType.equalsIgnoreCase("application/pdf")
                && !contentType.equalsIgnoreCase(
                        "application/octet-stream")) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    INVALID_RESUME_MESSAGE
            );
        }
    }

    // --------------------------------------------------
    // PDF CONTENT VALIDATION
    // --------------------------------------------------

    private void validateResumeContent(
            MultipartFile file) throws IOException {

        byte[] pdfBytes = file.getBytes();

        if (!startsWithPdfSignature(pdfBytes)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    INVALID_RESUME_MESSAGE
            );
        }

        String extractedText;

        try (PDDocument document =
                     Loader.loadPDF(pdfBytes)) {

            if (document.isEncrypted()) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        INVALID_RESUME_MESSAGE
                );
            }

            PDFTextStripper stripper =
                    new PDFTextStripper();

            stripper.setSortByPosition(true);

            extractedText =
                    stripper.getText(document);

        } catch (ResponseStatusException ex) {

            throw ex;

        } catch (Exception ex) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    INVALID_RESUME_MESSAGE
            );
        }

        if (extractedText == null
                || extractedText.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    INVALID_RESUME_MESSAGE
            );
        }

        String text = extractedText
                .replaceAll("\\s+", " ")
                .trim()
                .toLowerCase(Locale.ROOT);

        if (text.length() < 100) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    INVALID_RESUME_MESSAGE
            );
        }

        String[] resumeSections = {
                "education",
                "skills",
                "technical skills",
                "projects",
                "experience",
                "work experience",
                "internship",
                "internships",
                "certifications",
                "achievements",
                "objective",
                "summary",
                "profile",
                "career objective",
                "languages",
                "academic"
        };

        int sectionScore = 0;

        for (String section : resumeSections) {

            if (text.contains(section)) {
                sectionScore++;
            }
        }

        boolean hasEmail =
                EMAIL_PATTERN.matcher(text).find();

        boolean hasPhone =
                PHONE_PATTERN.matcher(text).find();

        boolean hasResumeIdentity =
                text.contains("linkedin")
                || text.contains("github")
                || text.contains("portfolio")
                || text.contains("resume")
                || text.contains("curriculum vitae")
                || text.contains("curriculum-vitae")
                || text.contains("cv");

        boolean validResume =
                sectionScore >= 4
                && (hasEmail || hasPhone || hasResumeIdentity);

        boolean strongResumeStructure =
                sectionScore >= 6;

        if (!validResume && !strongResumeStructure) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    INVALID_RESUME_MESSAGE
            );
        }
    }

    // --------------------------------------------------
    // PDF SIGNATURE VALIDATION
    // --------------------------------------------------

    private boolean startsWithPdfSignature(byte[] bytes) {

        if (bytes == null || bytes.length < 5) {
            return false;
        }

        return bytes[0] == '%'
                && bytes[1] == 'P'
                && bytes[2] == 'D'
                && bytes[3] == 'F'
                && bytes[4] == '-';
    }

    // --------------------------------------------------
    // SAFE FILENAME
    // --------------------------------------------------

    private String sanitizeFileName(
            String originalFileName) {

        String safeFileName =
                Paths.get(originalFileName)
                        .getFileName()
                        .toString();

        safeFileName = safeFileName.replaceAll(
                "[^a-zA-Z0-9._-]",
                "_"
        );

        if (!safeFileName
                .toLowerCase(Locale.ROOT)
                .endsWith(".pdf")) {

            safeFileName += ".pdf";
        }

        return safeFileName;
    }

    // --------------------------------------------------
    // ENTITY TO RESPONSE DTO
    // --------------------------------------------------

    private ResumeResponse toResponse(Resume resume) {

        return new ResumeResponse(
                resume.getId(),
                resume.getStudent().getUserId(),
                resume.getFileName(),
                resume.getFilePath(),
                resume.getIsActive(),
                resume.getUploadedAt()
        );
    }
}
