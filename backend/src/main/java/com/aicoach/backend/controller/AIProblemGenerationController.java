
package com.aicoach.backend.controller;

import com.aicoach.backend.service.AIProblemGenerationService;
import com.aicoach.backend.service.AIProblemStorageService;
import com.aicoach.backend.service.AuthService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin/problems")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AIProblemGenerationController {

    private static final String SESSION_USER_ID = "USER_ID";

    private final AIProblemGenerationService generationService;
    private final AIProblemStorageService storageService;
    private final AuthService authService;

    @Value("${AICOACH_ADMIN_EMAIL:}")
    private String adminEmail;

    // 생성자

    public AIProblemGenerationController(
            AIProblemGenerationService generationService,
            AIProblemStorageService storageService,
            AuthService authService) {

        this.generationService = generationService;
        this.storageService = storageService;
        this.authService = authService;
    }

    // 관리자 인증

    private void requireAdmin(HttpServletRequest request) {

        HttpSession session = request.getSession(false);

        // 1. 로그인 여부 확인
        if (session == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "로그인이 필요합니다.");
        }

        Object userIdObject = session.getAttribute(SESSION_USER_ID);

        if (!(userIdObject instanceof Long userId)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "로그인이 필요합니다.");
        }

        // 2. 관리자 이메일 설정 확인
        if (adminEmail == null || adminEmail.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "관리자 이메일이 설정되지 않았습니다.");
        }

        // 3. 현재 로그인한 사용자 조회
        AuthService.UserResponse user = authService.getUser(userId);

        // 4. 관리자 계정 일치 여부 확인
        if (!adminEmail.trim().equalsIgnoreCase(
                user.email())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "관리자 권한이 없습니다.");
        }
    }

    // AI 문제 생성
    // POST /api/admin/problems/generate

    @PostMapping("/generate")
    public AIProblemGenerationService.GeneratedProblem generate(
            @RequestBody AIProblemGenerationService.GenerateRequest request,
            HttpServletRequest servletRequest) {

        // 관리자 권한 확인
        requireAdmin(servletRequest);

        // Gemini 문제 생성
        return generationService.generate(request);
    }

    // 문제 검증 및 MySQL 저장
    // POST /api/admin/problems/save

    @PostMapping("/save")
    public AIProblemStorageService.SaveResponse save(
            @RequestBody AIProblemGenerationService.GeneratedProblem problem,
            HttpServletRequest servletRequest) {

        // 관리자 권한 확인
        requireAdmin(servletRequest);

        // Docker 검증 후 MySQL 저장
        return storageService.saveVerifiedProblem(problem);
    }

    // 문제 공개
    // PATCH /api/admin/problems/{id}/publish

    @PatchMapping("/{id}/publish")
    public AIProblemStorageService.SaveResponse publish(
            @PathVariable Long id,
            HttpServletRequest servletRequest) {

        requireAdmin(servletRequest);

        return storageService.publishProblem(id);
    }

    @GetMapping("/access")
    public AdminAccessResponse checkAdminAccess(
            HttpServletRequest request) {

        requireAdmin(request);

        return new AdminAccessResponse(true);
    }

    public record AdminAccessResponse(boolean admin) {
    }

}
