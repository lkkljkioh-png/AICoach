package com.aicoach.backend.controller;

import com.aicoach.backend.service.SubmissionService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/submissions")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class SubmissionController {

    private static final String SESSION_USER_ID = "USER_ID";

    private final SubmissionService submissionService;

    public SubmissionController(
            SubmissionService submissionService) {
        this.submissionService = submissionService;
    }

    @GetMapping("/me")
    public List<SubmissionService.SubmissionResponse> mySubmissions(
            HttpServletRequest request) {
        HttpSession session = request.getSession(false);

        if (session == null) {
            throw unauthorized();
        }

        Object userId = session.getAttribute(SESSION_USER_ID);

        if (!(userId instanceof Long id)) {
            throw unauthorized();
        }

        return submissionService.getUserSubmissions(id);
    }

    private ResponseStatusException unauthorized() {
        return new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "로그인이 필요합니다.");
    }
}