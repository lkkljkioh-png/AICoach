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
import java.util.Set;

@RestController
@RequestMapping("/api/qa")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class QaController {

    private final JdbcTemplate jdbcTemplate;

    private static final Set<String> LANGUAGES = Set.of(
            "GENERAL", "PYTHON", "JAVASCRIPT",
            "JAVA", "C", "CPP", "SQL");

    public QaController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public record QuestionRequest(
            String title,
            String content,
            String language,
            String code) {
    }

    // 질문 목록 조회
    @GetMapping("/questions")
    public List<Map<String, Object>> getQuestions() {

        return jdbcTemplate.queryForList("""
                SELECT
                    q.id,
                    q.user_id,
                    u.nickname,
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
                JOIN users u ON q.user_id = u.id
                ORDER BY q.id DESC
                LIMIT 100
                """);
    }

    // 질문 상세 조회
    @GetMapping("/questions/{id}")
    public Map<String, Object> getQuestion(
            @PathVariable Long id) {

        List<Map<String, Object>> questions = jdbcTemplate.queryForList("""
                SELECT
                    q.*,
                    u.nickname
                FROM qa_questions q
                JOIN users u ON q.user_id = u.id
                WHERE q.id = ?
                """, id);

        if (questions.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "질문을 찾을 수 없습니다.");
        }

        jdbcTemplate.update("""
                UPDATE qa_questions
                SET view_count = view_count + 1
                WHERE id = ?
                """, id);

        Map<String, Object> question = questions.get(0);

        question.put(
                "view_count",
                ((Number) question.get("view_count")).longValue() + 1);

        return question;
    }

    // 질문 작성
    @PostMapping("/questions")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createQuestion(
            @RequestBody QuestionRequest body,
            HttpServletRequest request) {

        Long userId = requireUser(request);

        String title = body.title() == null
                ? ""
                : body.title().trim();

        String content = body.content() == null
                ? ""
                : body.content().trim();

        String language = body.language() == null
                ? "GENERAL"
                : body.language().trim().toUpperCase(java.util.Locale.ROOT);

        String code = body.code() == null
                ? ""
                : body.code();

        if (title.isBlank() || title.length() > 150
                || content.isBlank() || content.length() > 10000
                || code.length() > 50000
                || !LANGUAGES.contains(language)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "질문 입력 정보를 확인해 주세요.");
        }

        jdbcTemplate.update("""
                INSERT INTO qa_questions
                    (user_id, title, content, language, code)
                VALUES (?, ?, ?, ?, ?)
                """,
                userId, title, content, language, code);

        return Map.of(
                "message", "질문이 등록되었습니다.");
    }

    // 질문 수정
    @PutMapping("/questions/{id}")
    public Map<String, Object> updateQuestion(
            @PathVariable Long id,
            @RequestBody QuestionRequest body,
            HttpServletRequest request) {

        Long userId = requireUser(request);

        checkQuestionOwner(id, userId);

        String title = body.title() == null
                ? ""
                : body.title().trim();

        String content = body.content() == null
                ? ""
                : body.content().trim();

        String language = body.language() == null
                ? "GENERAL"
                : body.language().trim()
                        .toUpperCase(java.util.Locale.ROOT);

        String code = body.code() == null
                ? ""
                : body.code();

        if (title.isBlank() || title.length() > 150
                || content.isBlank() || content.length() > 10000
                || code.length() > 50000
                || !LANGUAGES.contains(language)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "질문 입력 정보를 확인해 주세요.");
        }

        jdbcTemplate.update("""
                UPDATE qa_questions
                SET title = ?,
                    content = ?,
                    language = ?,
                    code = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND user_id = ?
                """,
                title, content, language, code, id, userId);

        return Map.of(
                "message", "질문이 수정되었습니다.");
    }

    // 질문 삭제
    @DeleteMapping("/questions/{id}")
    public Map<String, Object> deleteQuestion(
            @PathVariable Long id,
            HttpServletRequest request) {

        Long userId = requireUser(request);

        checkQuestionOwner(id, userId);

        jdbcTemplate.update("""
                DELETE FROM qa_questions
                WHERE id = ? AND user_id = ?
                """, id, userId);

        return Map.of(
                "message", "질문이 삭제되었습니다.");
    }

    // 질문 작성자 확인
    private void checkQuestionOwner(
            Long questionId,
            Long userId) {

        List<Long> owners = jdbcTemplate.queryForList("""
                SELECT user_id
                FROM qa_questions
                WHERE id = ?
                """, Long.class, questionId);

        if (owners.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "질문을 찾을 수 없습니다.");
        }

        if (!owners.get(0).equals(userId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "본인이 작성한 질문만 수정하거나 삭제할 수 있습니다.");
        }
    }

    public record AnswerRequest(String content) {
    }

    // 답변 목록 조회
    @GetMapping("/questions/{questionId}/answers")
    public List<Map<String, Object>> getAnswers(
            @PathVariable Long questionId) {

        return jdbcTemplate.queryForList("""
                SELECT
                    a.id,
                    a.question_id,
                    a.user_id,
                    u.nickname,
                    a.content,
                    a.accepted,
                    a.created_at,
                    a.updated_at
                FROM qa_answers a
                JOIN users u ON a.user_id = u.id
                WHERE a.question_id = ?
                ORDER BY a.accepted DESC, a.created_at ASC, a.id ASC
                """, questionId);
    }

    // 답변 등록
    @PostMapping("/questions/{questionId}/answers")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Map<String, Object> createAnswer(
            @PathVariable Long questionId,
            @RequestBody AnswerRequest body,
            HttpServletRequest request) {

        Long userId = requireUser(request);

        lockQuestion(questionId);

        String content = validateAnswer(body);

        jdbcTemplate.update("""
                INSERT INTO qa_answers
                    (question_id, user_id, content)
                VALUES (?, ?, ?)
                """, questionId, userId, content);

        return Map.of(
                "message", "답변이 등록되었습니다.");
    }

    // 답변 수정
    @PutMapping("/questions/{questionId}/answers/{answerId}")
    @Transactional
    public Map<String, Object> updateAnswer(
            @PathVariable Long questionId,
            @PathVariable Long answerId,
            @RequestBody AnswerRequest body,
            HttpServletRequest request) {

        Long userId = requireUser(request);

        lockQuestion(questionId);

        Map<String, Object> answer = findAnswer(questionId, answerId);

        checkAnswerOwner(answer, userId);

        String content = validateAnswer(body);

        jdbcTemplate.update("""
                UPDATE qa_answers
                SET content = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                  AND question_id = ?
                  AND user_id = ?
                """, content, answerId, questionId, userId);

        return Map.of(
                "message", "답변이 수정되었습니다.");
    }

    // 답변 삭제
    @DeleteMapping("/questions/{questionId}/answers/{answerId}")
    @Transactional
    public Map<String, Object> deleteAnswer(
            @PathVariable Long questionId,
            @PathVariable Long answerId,
            HttpServletRequest request) {

        Long userId = requireUser(request);

        lockQuestion(questionId);

        Map<String, Object> answer = findAnswer(questionId, answerId);

        checkAnswerOwner(answer, userId);

        jdbcTemplate.update("""
                DELETE FROM qa_answers
                WHERE id = ?
                  AND question_id = ?
                  AND user_id = ?
                """, answerId, questionId, userId);

        boolean solved = synchronizeSolved(questionId);

        return Map.of(
                "message", "답변이 삭제되었습니다.",
                "solved", solved);
    }

    // 답변 채택 및 채택 취소
    @PatchMapping("/questions/{questionId}/answers/{answerId}/accept")
    @Transactional
    public Map<String, Object> acceptAnswer(
            @PathVariable Long questionId,
            @PathVariable Long answerId,
            HttpServletRequest request) {

        Long userId = requireUser(request);

        lockQuestion(questionId);

        checkQuestionOwner(questionId, userId);

        Map<String, Object> answer = findAnswer(questionId, answerId);

        Long answerOwnerId = ((Number) answer.get("user_id")).longValue();

        if (answerOwnerId.equals(userId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "본인이 작성한 답변은 채택할 수 없습니다.");
        }

        Object acceptedValue = answer.get("accepted");

        boolean alreadyAccepted = Boolean.TRUE.equals(acceptedValue)
                || "1".equals(String.valueOf(acceptedValue));

        // 기존 채택 답변 초기화
        jdbcTemplate.update("""
                UPDATE qa_answers
                SET accepted = FALSE
                WHERE question_id = ?
                  AND accepted = TRUE
                """, questionId);

        // 채택되지 않은 답변이면 새로 채택
        if (!alreadyAccepted) {

            jdbcTemplate.update("""
                    UPDATE qa_answers
                    SET accepted = TRUE
                    WHERE id = ?
                      AND question_id = ?
                    """, answerId, questionId);
        }

        boolean solved = synchronizeSolved(questionId);

        return Map.of(
                "message",
                solved
                        ? "답변이 채택되었습니다."
                        : "답변 채택이 취소되었습니다.",
                "accepted", !alreadyAccepted,
                "solved", solved);
    }

    // 질문 상태 동기화
    private boolean synchronizeSolved(Long questionId) {

        Long acceptedCount = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM qa_answers
                WHERE question_id = ?
                  AND accepted = TRUE
                """, Long.class, questionId);

        boolean solved = acceptedCount != null && acceptedCount > 0;

        jdbcTemplate.update("""
                UPDATE qa_questions
                SET solved = ?
                WHERE id = ?
                """, solved, questionId);

        return solved;
    }

    // 질문 잠금 및 존재 여부 확인
    private void lockQuestion(Long questionId) {

        List<Long> questions = jdbcTemplate.queryForList("""
                SELECT id
                FROM qa_questions
                WHERE id = ?
                FOR UPDATE
                """, Long.class, questionId);

        if (questions.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "질문을 찾을 수 없습니다.");
        }
    }

    // 답변 조회
    private Map<String, Object> findAnswer(
            Long questionId,
            Long answerId) {

        List<Map<String, Object>> answers = jdbcTemplate.queryForList("""
                SELECT *
                FROM qa_answers
                WHERE id = ?
                  AND question_id = ?
                """, answerId, questionId);

        if (answers.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "답변을 찾을 수 없습니다.");
        }

        return answers.get(0);
    }

    // 답변 작성자 확인
    private void checkAnswerOwner(
            Map<String, Object> answer,
            Long userId) {

        Long ownerId = ((Number) answer.get("user_id")).longValue();

        if (!ownerId.equals(userId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "본인이 작성한 답변만 수정하거나 삭제할 수 있습니다.");
        }
    }

    // 답변 내용 검증
    private String validateAnswer(AnswerRequest body) {

        String content = body == null || body.content() == null
                ? ""
                : body.content().trim();

        if (content.isBlank() || content.length() > 10000) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "답변은 1~10000자로 작성해 주세요.");
        }

        return content;
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