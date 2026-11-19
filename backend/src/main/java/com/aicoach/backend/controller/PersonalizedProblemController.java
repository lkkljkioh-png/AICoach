
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

import java.util.List;

@RestController
@RequestMapping("/api/learning/personalized-problems")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class PersonalizedProblemController {

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

        Object userId = session.getAttribute("USER_ID");

        if (!(userId instanceof Long id)) {
            throw unauthorized();
        }

        return id;
    }

    // 취약점 기반 Gemini 문제 생성
    @PostMapping("/generate")
    public PersonalizedProblemResponse generate(
            HttpServletRequest request) {

        Long userId = requireUser(request);

        LearningService.LearningResponse analysis = learningService.getRecommendations(userId);

        String level = analysis.recommendedLevel();
        String category = analysis.weakCategory();

        if (category == null || category.isBlank()) {
            category = "구현";
        }

        AIProblemGenerationService.GenerateRequest generateRequest = new AIProblemGenerationService.GenerateRequest(
                level,
                category);

        AIProblemGenerationService.GeneratedProblem problem = generationService.generate(generateRequest);

        return new PersonalizedProblemResponse(
                level,
                category,
                analysis.insight(),
                problem);
    }

    // Docker 검증 및 개인 문제 저장
    @PostMapping("/save")
    public AIProblemStorageService.SaveResponse save(
            @RequestBody AIProblemGenerationService.GeneratedProblem problem,
            HttpServletRequest request) {

        Long userId = requireUser(request);

        return personalizedService.save(userId, problem);
    }

    // 내 개인 문제 목록
    @GetMapping("/me")
    public List<PersonalizedProblemService.PersonalProblemResponse> myProblems(HttpServletRequest request) {

        Long userId = requireUser(request);

        return personalizedService.getMyProblems(userId);
    }

    public record PersonalizedProblemResponse(
            String recommendedLevel,
            String weakCategory,
            String insight,
            AIProblemGenerationService.GeneratedProblem problem) {
    }

    private ResponseStatusException unauthorized() {
        return new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "로그인이 필요합니다.");
    }
}
