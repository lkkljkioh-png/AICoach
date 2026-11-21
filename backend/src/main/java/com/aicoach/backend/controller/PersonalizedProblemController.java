
package com.aicoach.backend.controller;

import com.aicoach.backend.service.AIProblemGenerationService;
import com.aicoach.backend.service.AIProblemStorageService;
import com.aicoach.backend.service.LearningService;
import com.aicoach.backend.service.PersonalizedProblemService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/learning/personalized-problems")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class PersonalizedProblemController {

        private static final Set<String> LEVELS = Set.of("EASY", "MEDIUM", "HARD");

        private final LearningService learningService;
        private final AIProblemGenerationService generationService;
        private final PersonalizedProblemService personalizedService;

        public PersonalizedProblemController(
                        LearningService learningService,
                        AIProblemGenerationService generationService,
                        PersonalizedProblemService personalizedService) {

                this.learningService = learningService;
                this.generationService = generationService;
                this.personalizedService = personalizedService;
        }

        // 로그인 사용자 확인
        private Long requireUser(HttpServletRequest request) {

                HttpSession session = request.getSession(false);

                if (session == null) {
                        throw unauthorized();
                }

                Object value = session.getAttribute("USER_ID");

                if (!(value instanceof Long id)) {
                        throw unauthorized();
                }

                return id;
        }

        // 문제 생성 옵션
        public record GenerateOptions(
                        String mode,
                        String level,
                        String category) {
        }

        // 문제 생성 및 저장 결과
        public record PersonalizedProblemResponse(
                        String recommendedLevel,
                        String weakCategory,
                        String insight,
                        AIProblemGenerationService.GeneratedProblem problem,
                        AIProblemStorageService.SaveResponse savedProblem) {
        }

        // AI 문제 생성, Docker 검증 및 DB 자동 저장
        @PostMapping("/generate")
        public PersonalizedProblemResponse generate(
                        @RequestBody(required = false) GenerateOptions options,
                        HttpServletRequest request) {

                Long userId = requireUser(request);
                // Gemini 호출 전에 개인 문제 보관 한도 확인
                personalizedService.checkProblemLimit(userId);

                String mode = options == null || options.mode() == null
                                ? "AUTO"
                                : options.mode();

                if (!mode.equals("AUTO") && !mode.equals("MANUAL")) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "올바른 생성 모드를 선택해 주세요.");
                }

                String level;
                String category;
                String insight;

                // 직접 설정 모드
                if (mode.equals("MANUAL")) {

                        if (options == null
                                        || !LEVELS.contains(options.level())) {

                                throw new ResponseStatusException(
                                                HttpStatus.BAD_REQUEST,
                                                "올바른 난이도를 선택해 주세요.");
                        }

                        level = options.level();

                        category = options.category() == null
                                        ? ""
                                        : options.category().trim();

                        if (category.length() < 2
                                        || category.length() > 40
                                        || category.contains("\n")
                                        || category.contains("\r")) {

                                throw new ResponseStatusException(
                                                HttpStatus.BAD_REQUEST,
                                                "유형은 2~40자로 입력해 주세요.");
                        }

                        insight = "직접 선택한 난이도와 알고리즘 유형을 "
                                        + "기준으로 생성한 문제입니다.";

                } else {

                        // AI 자동 추천 모드
                        LearningService.LearningResponse analysis = learningService.getRecommendations(userId);

                        level = analysis.recommendedLevel();
                        category = analysis.weakCategory();

                        if (!LEVELS.contains(level)) {
                                level = "EASY";
                        }

                        if (category == null || category.isBlank()) {
                                category = "구현";
                        }

                        insight = analysis.insight();
                }

                // 기존 개인 문제 제목 조회
                List<PersonalizedProblemService.PersonalProblemResponse> previousProblems = personalizedService
                                .getMyProblems(userId);

                List<String> previousTitles = new ArrayList<>();

                for (var previous : previousProblems) {
                        if (previous.title() != null) {
                                previousTitles.add(previous.title());
                        }
                }

                // Gemini 문제 생성 조건
                AIProblemGenerationService.GenerateRequest generateRequest = new AIProblemGenerationService.GenerateRequest(
                                level,
                                category);

                AIProblemGenerationService.GeneratedProblem problem = null;
                AIProblemStorageService.SaveResponse saved = null;

                String lastFailure = "문제 검증에 실패했습니다.";

                // 생성 및 Docker 검증 최대 3회
                for (int attempt = 1; attempt <= 3; attempt++) {

                        System.out.println(
                                        "[AI PROBLEM] 생성 및 검증 시도: " + attempt);

                        problem = generationService.generate(
                                        generateRequest,
                                        previousTitles);

                        String newTitle = problem.title().trim();

                        // 기존 문제와 제목 중복 확인
                        boolean duplicate = previousTitles.stream()
                                        .anyMatch(title -> title.trim().equalsIgnoreCase(newTitle));

                        if (duplicate) {

                                System.out.println(
                                                "[AI PROBLEM] 중복 문제 제목 감지: "
                                                                + newTitle);

                                lastFailure = "기존 문제와 제목이 중복되었습니다.";
                                continue;
                        }

                        // 재생성 시 이전에 실패한 문제도 제외
                        previousTitles.add(newTitle);

                        try {

                                // Docker 정답 검증 및 DB 저장
                                saved = personalizedService.save(
                                                userId,
                                                problem);

                                System.out.println(
                                                "[AI PROBLEM] DB 저장 성공: "
                                                                + saved.problemId());

                                break;

                        } catch (ResponseStatusException e) {

                                // Docker 검증 실패 422만 재시도
                                if (e.getStatusCode().value() != 422) {
                                        throw e;
                                }

                                lastFailure = e.getReason() == null
                                                ? "Docker 정답 검증 실패"
                                                : e.getReason();

                                System.out.println(
                                                "[AI PROBLEM] 검증 실패: "
                                                                + lastFailure);
                        }
                }

                // 모든 생성 또는 검증 실패
                if (saved == null) {

                        throw new ResponseStatusException(
                                        HttpStatus.UNPROCESSABLE_ENTITY,
                                        "3회 생성 및 검증 실패: " + lastFailure);
                }

                // 문제 생성 및 저장 결과 반환
                return new PersonalizedProblemResponse(
                                level,
                                category,
                                insight,
                                problem,
                                saved);
        }

        // 기존 저장 API 호환 유지
        @PostMapping("/save")
        public AIProblemStorageService.SaveResponse save(
                        @RequestBody AIProblemGenerationService.GeneratedProblem problem,
                        HttpServletRequest request) {

                Long userId = requireUser(request);

                return personalizedService.save(userId, problem);
        }

        // 사용자 개인 문제 목록 조회
        @GetMapping("/me")
        public List<PersonalizedProblemService.PersonalProblemResponse> myProblems(HttpServletRequest request) {

                Long userId = requireUser(request);

                return personalizedService.getMyProblems(userId);
        }

        // 내가 생성한 개인 문제 삭제
        @DeleteMapping("/{problemId}")
        @ResponseStatus(HttpStatus.NO_CONTENT)
        public void deleteMyProblem(
                        @PathVariable Long problemId,
                        HttpServletRequest request) {

                Long userId = requireUser(request);

                personalizedService.deleteMyProblem(
                                userId,
                                problemId);
        }

        // 개인 문제 보관함으로 이동
        @PatchMapping("/{problemId}/archive")
        @ResponseStatus(HttpStatus.NO_CONTENT)
        public void archiveProblem(
                        @PathVariable Long problemId,
                        HttpServletRequest request) {

                Long userId = requireUser(request);

                personalizedService.archiveProblem(userId, problemId);
        }

        // 보관한 개인 문제 복원
        @PatchMapping("/{problemId}/restore")
        @ResponseStatus(HttpStatus.NO_CONTENT)
        public void restoreProblem(
                        @PathVariable Long problemId,
                        HttpServletRequest request) {

                Long userId = requireUser(request);

                personalizedService.restoreProblem(userId, problemId);
        }

        // 인증 오류
        private ResponseStatusException unauthorized() {

                return new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "로그인이 필요합니다.");
        }
}
