
package com.aicoach.backend.controller;

import com.aicoach.backend.entity.ProblemEntity;
import com.aicoach.backend.service.ProblemService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/problems")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class ProblemController {

    private final ProblemService problemService;

    public ProblemController(ProblemService problemService) {
        this.problemService = problemService;
    }

    private Long currentUserId(HttpServletRequest request) {
        HttpSession session = request.getSession(false);

        if (session == null) {
            return null;
        }

        Object value = session.getAttribute("USER_ID");

        return value instanceof Long id ? id : null;
    }

    @GetMapping
    public List<ProblemEntity> getAllProblems() {
        return problemService.getAllProblems();
    }

    @GetMapping("/{id}")
    public ProblemEntity getProblem(
            @PathVariable Long id,
            HttpServletRequest request) {

        return problemService.getProblem(
                id,
                currentUserId(request));
    }
}
