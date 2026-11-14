
package com.aicoach.backend.controller;

import com.aicoach.backend.service.LearningService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/learning")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class LearningController {

    private static final String SESSION_USER_ID = "USER_ID";

    private final LearningService learningService;

    public LearningController(LearningService learningService) {
        this.learningService = learningService;
    }

    @GetMapping("/recommendations")
    public LearningService.LearningResponse getRecommendations(
            HttpServletRequest request) {

        HttpSession session = request.getSession(false);

        if (session == null) {
            throw unauthorized();
        }

        Object userId = session.getAttribute(SESSION_USER_ID);

        if (!(userId instanceof Long id)) {
            throw unauthorized();
        }

        return learningService.getRecommendations(id);
    }

    private ResponseStatusException unauthorized() {
        return new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "로그인이 필요합니다.");
    }
}
