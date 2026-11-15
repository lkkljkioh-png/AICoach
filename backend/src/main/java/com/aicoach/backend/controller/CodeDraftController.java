
package com.aicoach.backend.controller;

import com.aicoach.backend.entity.CodeDraftEntity;
import com.aicoach.backend.repository.CodeDraftRepository;
import com.aicoach.backend.repository.ProblemRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/drafts")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class CodeDraftController {

    private static final Set<String> LANGUAGES = Set.of(
            "Python", "JavaScript", "Java", "C", "C++");

    private final CodeDraftRepository repository;
    private final ProblemRepository problemRepository;

    public CodeDraftController(
            CodeDraftRepository repository,
            ProblemRepository problemRepository) {
        this.repository = repository;
        this.problemRepository = problemRepository;
    }

    private Long requireUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);

        if (session == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }

        Object id = session.getAttribute("USER_ID");

        if (!(id instanceof Long userId)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }

        return userId;
    }

    private void requireProblem(Long problemId) {
        if (!problemRepository.existsById(problemId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "문제를 찾을 수 없습니다.");
        }
    }

    @GetMapping("/{problemId}")
    @Transactional(readOnly = true)
    public Map<String, String> getDrafts(
            @PathVariable Long problemId,
            HttpServletRequest request) {

        Long userId = requireUser(request);
        requireProblem(problemId);

        Map<String, String> drafts = new HashMap<>();

        for (CodeDraftEntity draft : repository.findByUserIdAndProblemId(
                userId, problemId)) {

            drafts.put(draft.getLanguage(), draft.getCode());
        }

        return drafts;
    }

    @PutMapping("/{problemId}")
    @Transactional
    public Map<String, String> saveDrafts(
            @PathVariable Long problemId,
            @RequestBody Map<String, String> codes,
            HttpServletRequest request) {

        Long userId = requireUser(request);
        requireProblem(problemId);

        if (codes == null || codes.size() > LANGUAGES.size()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "잘못된 코드 데이터입니다.");
        }

        for (Map.Entry<String, String> entry : codes.entrySet()) {

            String language = entry.getKey();
            String code = entry.getValue();

            if (!LANGUAGES.contains(language)
                    || code == null
                    || code.length() > 12000) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "지원하지 않는 언어 또는 코드 길이입니다.");
            }
        }

        for (Map.Entry<String, String> entry : codes.entrySet()) {

            String language = entry.getKey();
            String code = entry.getValue();

            CodeDraftEntity draft = repository
                    .findByUserIdAndProblemIdAndLanguage(
                            userId, problemId, language)
                    .orElseGet(() -> new CodeDraftEntity(
                            userId, problemId, language, code));

            draft.setCode(code);
            repository.save(draft);
        }

        return Map.of("status", "SAVED");
    }
}
