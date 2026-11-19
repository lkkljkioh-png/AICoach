
package com.aicoach.backend.controller;

import com.aicoach.backend.service.AIFeedbackService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/problems")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AIFeedbackController {

    private static final String SESSION_USER_ID = "USER_ID";

    private final AIFeedbackService feedbackService;

    public AIFeedbackController(
            AIFeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    public record FeedbackRequest(
            String language,
            String code) {
    }

    // 공개 문제 및 본인 소유 개인 문제 AI 분석
    @PostMapping("/{id}/feedback")
    public AIFeedbackService.FeedbackResult feedback(
            @PathVariable Long id,
            @RequestBody FeedbackRequest request,
            HttpServletRequest servletRequest) {

        HttpSession session = servletRequest.getSession(false);

        Long userId = null;

        if (session != null) {
            Object value = session.getAttribute(
                    SESSION_USER_ID);

            if (value instanceof Long idValue) {
                userId = idValue;
            }
        }

        return feedbackService.analyze(
                id,
                request.language(),
                request.code(),
                userId);
    }
}
