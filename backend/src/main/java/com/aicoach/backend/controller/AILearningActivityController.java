
package com.aicoach.backend.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/ai-learning/activity")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AILearningActivityController {

    private final JdbcTemplate jdbcTemplate;

    public AILearningActivityController(
            JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public record ActivityResponse(
            Long id,
            Long problemId,
            String language,
            String action,
            boolean revised,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {
    }

    @GetMapping
    public List<ActivityResponse> getMyActivity(
            HttpServletRequest request) {

        HttpSession session = request.getSession(false);

        if (session == null ||
                !(session.getAttribute("USER_ID") instanceof Long)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "로그인이 필요합니다.");
        }

        Long userId = (Long) session.getAttribute("USER_ID");

        String sql = """
                SELECT
                    id,
                    problem_id,
                    language,
                    action_type,
                    original_code,
                    revised_code,
                    created_at,
                    updated_at
                FROM ai_coding_sessions
                WHERE user_id = ?
                ORDER BY created_at DESC
                """;

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> {
                    String original = rs.getString("original_code");
                    String revised = rs.getString("revised_code");

                    return new ActivityResponse(
                            rs.getLong("id"),
                            rs.getLong("problem_id"),
                            rs.getString("language"),
                            rs.getString("action_type"),
                            !java.util.Objects.equals(original, revised),
                            rs.getTimestamp("created_at").toLocalDateTime(),
                            rs.getTimestamp("updated_at").toLocalDateTime());
                },
                userId);
    }
}
