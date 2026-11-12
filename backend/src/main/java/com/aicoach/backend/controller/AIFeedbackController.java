
package com.aicoach.backend.controller;

import com.aicoach.backend.service.AIFeedbackService;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/problems")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AIFeedbackController {

    private final AIFeedbackService feedbackService;

    public AIFeedbackController(
            AIFeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    public record FeedbackRequest(
            String language,
            String code) {
    }

    @PostMapping("/{id}/feedback")
    public AIFeedbackService.FeedbackResult feedback(
            @PathVariable Long id,
            @RequestBody FeedbackRequest request) {

        return feedbackService.analyze(
                id,
                request.language(),
                request.code());
    }
}
