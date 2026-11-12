package com.aicoach.backend.controller;

import com.aicoach.backend.service.JudgeService;
import com.aicoach.backend.service.SubmissionService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/problems")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class JudgeController {

    private static final String SESSION_USER_ID = "USER_ID";

    private final JudgeService judgeService;
    private final SubmissionService submissionService;

    public JudgeController(
            JudgeService judgeService,
            SubmissionService submissionService) {
        this.judgeService = judgeService;
        this.submissionService = submissionService;
    }

    public record CodeRequest(
            String language,
            String code) {
    }

    // 실행하기: 기존과 동일하게 채점만 수행
    @PostMapping("/{id}/run")
    public JudgeService.JudgeResult run(
            @PathVariable Long id,
            @RequestBody CodeRequest request) {
        return judgeService.run(
                id,
                request.language(),
                request.code());
    }

    // 제출하기: 로그인 확인 -> 채점 -> DB 저장
    @PostMapping("/{id}/submit")
    public JudgeService.JudgeResult submit(
            @PathVariable Long id,
            @RequestBody CodeRequest request,
            HttpServletRequest servletRequest) {
        HttpSession session = servletRequest.getSession(false);

        if (session == null) {
            throw unauthorized();
        }

        Object sessionUserId = session.getAttribute(SESSION_USER_ID);

        if (!(sessionUserId instanceof Long userId)) {
            throw unauthorized();
        }

        // 1. 기존 Docker 채점
        JudgeService.JudgeResult result = judgeService.submit(
                id,
                request.language(),
                request.code());

        // 2. MySQL에 제출 기록 저장
        submissionService.saveSubmission(
                userId,
                id,
                request.language(),
                request.code(),
                result);

        // 3. 기존 채점 결과 반환
        return result;
    }

    private ResponseStatusException unauthorized() {
        return new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "로그인 후 제출할 수 있습니다.");
    }
}