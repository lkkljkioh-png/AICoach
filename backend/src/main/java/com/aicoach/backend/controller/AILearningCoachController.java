
package com.aicoach.backend.controller;

import com.aicoach.backend.service.AILearningCoachService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/learning/ai-coach")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AILearningCoachController {

    private static final String SESSION_USER_ID = "USER_ID";

    private final AILearningCoachService coachService;

    public AILearningCoachController(
            AILearningCoachService coachService) {

        this.coachService = coachService;
    }

    @PostMapping
    public AILearningCoachService.CoachResponse analyze(
            HttpServletRequest request) {

        HttpSession session = request.getSession(false);

        if (session == null) {
            throw unauthorized();
        }

        Object userId = session.getAttribute(SESSION_USER_ID);

        if (!(userId instanceof Long id)) {
            throw unauthorized();
        }

        return coachService.getCoaching(id);
    }

    private ResponseStatusException unauthorized() {
        return new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "로그인이 필요합니다.");
    }

    @GetMapping("/latest")
    public org.springframework.http.ResponseEntity<AILearningCoachService.SavedCoachResponse> getLatest(
            HttpServletRequest request) {

        HttpSession session = request.getSession(false);

        if (session == null) {
            throw unauthorized();
        }

        Object userId = session.getAttribute(SESSION_USER_ID);

        if (!(userId instanceof Long id)) {
            throw unauthorized();
        }

        return coachService.getLatestPlan(id)
                .map(org.springframework.http.ResponseEntity::ok)
                .orElseGet(() -> org.springframework.http.ResponseEntity
                        .noContent()
                        .build());
    }

}
