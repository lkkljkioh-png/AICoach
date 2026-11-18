
package com.aicoach.backend.controller;

import com.aicoach.backend.service.JudgeService;
import com.aicoach.backend.service.SubmissionService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Set;

@RestController
@RequestMapping("/api/problems")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class JudgeController {

    private static final String SESSION_USER_ID = "USER_ID";

    private static final Set<String> MODES = Set.of(
            "DIRECT", "AI");

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
            String code,
            String learningMode) {
    }

    @PostMapping("/{id}/run")
    public JudgeService.JudgeResult run(
            @PathVariable Long id,
            @RequestBody CodeRequest request) {

        return judgeService.run(
                id,
                request.language(),
                request.code());
    }

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

        // 학습 모드 검증
        String mode = request.learningMode();

        if (mode == null) {
            mode = "UNKNOWN";
        } else if (!MODES.contains(mode)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "올바르지 않은 학습 모드입니다.");
        }

        // Docker 채점
        JudgeService.JudgeResult result = judgeService.submit(
                id,
                request.language(),
                request.code());

        // 채점 결과 및 학습 모드 저장
        submissionService.saveSubmission(
                userId,
                id,
                request.language(),
                request.code(),
                result,
                mode);

        return result;
    }

    private ResponseStatusException unauthorized() {
        return new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "로그인 후 제출할 수 있습니다.");
    }
}
