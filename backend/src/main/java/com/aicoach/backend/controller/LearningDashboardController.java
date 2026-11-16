
package com.aicoach.backend.controller;

import com.aicoach.backend.service.LearningDashboardService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/learning/dashboard")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class LearningDashboardController {

    private static final String SESSION_USER_ID = "USER_ID";

    private final LearningDashboardService dashboardService;

    public LearningDashboardController(
            LearningDashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping
    public LearningDashboardService.DashboardResponse getDashboard(
            HttpServletRequest request) {

        HttpSession session = request.getSession(false);

        if (session == null) {
            throw unauthorized();
        }

        Object userId = session.getAttribute(SESSION_USER_ID);

        if (!(userId instanceof Long id)) {
            throw unauthorized();
        }

        return dashboardService.getDashboard(id);
    }

    private ResponseStatusException unauthorized() {
        return new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "로그인이 필요합니다.");
    }
}
