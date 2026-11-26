package com.aicoach.backend.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/qa/my")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class MyQaController {

    private final JdbcTemplate jdbcTemplate;

    public MyQaController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // 내 Q&A 활동 조회
    @GetMapping("/activity")
    @Transactional(readOnly = true)
    public Map<String, Object> getMyActivity(
            HttpServletRequest request) {

        Long userId = requireUser(request);

        List<Map<String, Object>> questions = jdbcTemplate.queryForList("""
                SELECT
                    q.id,
                    q.title,
                    q.language,
                    q.solved,
                    q.view_count,
                    q.created_at,
                    (
                        SELECT COUNT(*)
                        FROM qa_answers a
                        WHERE a.question_id = q.id
                    ) AS answer_count
                FROM qa_questions q
                WHERE q.user_id = ?
                ORDER BY q.created_at DESC, q.id DESC
                """, userId);

        List<Map<String, Object>> answers = jdbcTemplate.queryForList("""
                SELECT
                    a.id,
                    a.question_id,
                    LEFT(a.content, 240) AS content,
                    a.accepted,
                    a.created_at,
                    q.title AS question_title,
                    q.language,
                    q.solved,
                    u.nickname AS question_author
                FROM qa_answers a
                JOIN qa_questions q
                    ON a.question_id = q.id
                JOIN users u
                    ON q.user_id = u.id
                WHERE a.user_id = ?
                ORDER BY a.created_at DESC, a.id DESC
                """, userId);

        long solvedQuestions = questions.stream()
                .filter(question -> toBoolean(question.get("solved")))
                .count();

        long acceptedAnswers = answers.stream()
                .filter(answer -> toBoolean(answer.get("accepted")))
                .count();

        Map<String, Object> stats = Map.of(
                "questionCount", questions.size(),
                "solvedQuestionCount", solvedQuestions,
                "answerCount", answers.size(),
                "acceptedAnswerCount", acceptedAnswers);

        return Map.of(
                "stats", stats,
                "questions", questions,
                "answers", answers);
    }

    // DB 상태값 변환
    private boolean toBoolean(Object value) {

        if (value instanceof Boolean bool) {
            return bool;
        }

        if (value instanceof Number number) {
            return number.intValue() == 1;
        }

        return "1".equals(String.valueOf(value))
                || "true".equalsIgnoreCase(
                        String.valueOf(value));
    }

    // 로그인 사용자 확인
    private Long requireUser(HttpServletRequest request) {

        HttpSession session = request.getSession(false);

        if (session == null ||
                !(session.getAttribute("USER_ID") instanceof Long id)) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "로그인이 필요합니다.");
        }

        return id;
    }
}