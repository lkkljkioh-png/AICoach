
package com.aicoach.backend.controller;

import com.aicoach.backend.entity.AICodingSessionEntity;
import com.aicoach.backend.repository.AICodingSessionRepository;
import com.aicoach.backend.service.JudgeService;
import com.aicoach.backend.service.ProblemService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Set;

@RestController
@RequestMapping("/api/ai-learning/sessions")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AICodingSessionController {

    private static final Set<String> LANGUAGES = Set.of(
            "Python", "JavaScript", "Java", "C", "C++");

    private final AICodingSessionRepository repository;
    private final ProblemService problemService;
    private final JudgeService judgeService;

    public AICodingSessionController(
            AICodingSessionRepository repository,
            ProblemService problemService,
            JudgeService judgeService) {

        this.repository = repository;
        this.problemService = problemService;
        this.judgeService = judgeService;
    }

    public record CreateRequest(
            Long problemId,
            String language,
            String instruction,
            String action,
            String originalCode) {
    }

    public record UpdateRequest(String revisedCode) {
    }

    public record SessionResponse(
            Long id,
            String status) {
    }

    public record SessionDetail(
            Long id,
            Long problemId,
            String language,
            String originalCode,
            String revisedCode) {
    }

    public record CompareRequest(
            String revisedCode) {
    }

    public record CompareResponse(
            Long sessionId,
            String language,
            String originalCode,
            String revisedCode,
            JudgeService.JudgeResult originalResult,
            JudgeService.JudgeResult revisedResult) {
    }

    // 로그인한 사용자 식별

    private Long requireUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);

        if (session == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "로그인이 필요합니다.");
        }

        Object value = session.getAttribute("USER_ID");

        if (!(value instanceof Long userId)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "로그인이 필요합니다.");
        }

        return userId;
    }

    // 본인 소유의 AI 학습 기록 조회

    private AICodingSessionEntity requireSession(
            Long sessionId,
            Long userId) {

        return repository
                .findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "학습 기록을 찾을 수 없습니다."));
    }

    // AI 원본 코드 및 프롬프트 저장

    @PostMapping
    public SessionResponse create(
            @RequestBody CreateRequest request,
            HttpServletRequest servletRequest) {

        Long userId = requireUser(servletRequest);

        if (request == null
                || request.problemId() == null
                || !LANGUAGES.contains(request.language())
                || request.instruction() == null
                || request.instruction().isBlank()
                || request.instruction().length() > 2000
                || request.originalCode() == null
                || request.originalCode().isBlank()
                || request.originalCode().length() > 12000
                || (!"generate".equals(request.action())
                        && !"debug".equals(request.action()))) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "올바른 학습 정보를 입력해 주세요.");
        }

        problemService.getProblem(request.problemId());

        AICodingSessionEntity entity = new AICodingSessionEntity(
                userId,
                request.problemId(),
                request.language(),
                request.instruction(),
                request.action(),
                request.originalCode());

        AICodingSessionEntity saved = repository.save(entity);

        return new SessionResponse(
                saved.getId(),
                "CREATED");
    }

    // 사용자 수정 코드 저장

    @PutMapping("/{sessionId}")
    @Transactional
    public SessionResponse update(
            @PathVariable Long sessionId,
            @RequestBody UpdateRequest request,
            HttpServletRequest servletRequest) {

        Long userId = requireUser(servletRequest);

        if (request == null
                || request.revisedCode() == null
                || request.revisedCode().length() > 12000) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "수정 코드가 올바르지 않습니다.");
        }

        AICodingSessionEntity session = requireSession(sessionId, userId);

        session.setRevisedCode(request.revisedCode());

        return new SessionResponse(
                session.getId(),
                "SAVED");
    }

    // 저장된 원본 코드와 최신 수정 코드 조회

    @GetMapping("/{sessionId}")
    @Transactional(readOnly = true)
    public SessionDetail getSession(
            @PathVariable Long sessionId,
            HttpServletRequest servletRequest) {

        Long userId = requireUser(servletRequest);

        AICodingSessionEntity session = requireSession(sessionId, userId);

        return new SessionDetail(
                session.getId(),
                session.getProblemId(),
                session.getLanguage(),
                session.getOriginalCode(),
                session.getRevisedCode());
    }

    // AI 원본 코드와 수정 코드를 Docker로 비교 채점

    @PostMapping("/{sessionId}/compare")
    public CompareResponse compare(
            @PathVariable Long sessionId,
            @RequestBody CompareRequest request,
            HttpServletRequest servletRequest) {

        Long userId = requireUser(servletRequest);

        AICodingSessionEntity session = requireSession(sessionId, userId);

        if (request == null
                || request.revisedCode() == null
                || request.revisedCode().isBlank()
                || request.revisedCode().length() > 12000) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "비교할 수정 코드를 입력해 주세요.");
        }

        // 원본은 DB에서 가져와 변경하지 않음
        String originalCode = session.getOriginalCode();

        // 수정 코드는 현재 편집기 내용을 사용
        String revisedCode = request.revisedCode();

        Long problemId = session.getProblemId();
        String language = session.getLanguage();

        // 기존 Docker Judge로 원본 채점
        JudgeService.JudgeResult originalResult = judgeService.submit(
                problemId,
                language,
                originalCode);

        // 동일한 테스트케이스로 수정 코드 채점
        JudgeService.JudgeResult revisedResult = judgeService.submit(
                problemId,
                language,
                revisedCode);

        // 일반 제출 기록은 생성하지 않음
        return new CompareResponse(
                session.getId(),
                language,
                originalCode,
                revisedCode,
                originalResult,
                revisedResult);
    }
}
