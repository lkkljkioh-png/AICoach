
package com.aicoach.backend.controller;

import com.aicoach.backend.entity.LearningPlanEntity;
import com.aicoach.backend.repository.LearningPlanRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/learning/plans")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class LearningPlanController {

    private final LearningPlanRepository repository;

    public LearningPlanController(
            LearningPlanRepository repository) {
        this.repository = repository;
    }

    public record PlanRequest(
            LocalDate planDate,
            String title,
            Integer targetCount) {
    }

    public record PlanResponse(
            Long id,
            LocalDate planDate,
            String title,
            int targetCount) {
    }

    // 로그인 사용자 확인
    private Long requireUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);

        if (session == null ||
                !(session.getAttribute("USER_ID") instanceof Long userId)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "로그인이 필요합니다.");
        }

        return userId;
    }

    private PlanResponse toResponse(LearningPlanEntity plan) {
        return new PlanResponse(
                plan.getId(),
                plan.getPlanDate(),
                plan.getTitle(),
                plan.getTargetCount());
    }

    // 나의 전체 학습 일정 조회
    @GetMapping
    @Transactional(readOnly = true)
    public List<PlanResponse> getPlans(
            HttpServletRequest request) {

        Long userId = requireUser(request);

        return repository
                .findByUserIdOrderByPlanDateAsc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // 날짜별 학습 일정 저장 또는 수정
    @PostMapping
    @Transactional
    public PlanResponse savePlan(
            @RequestBody PlanRequest body,
            HttpServletRequest request) {

        Long userId = requireUser(request);

        if (body == null ||
                body.planDate() == null ||
                body.title() == null ||
                body.title().isBlank() ||
                body.title().trim().length() > 150 ||
                body.targetCount() == null ||
                body.targetCount() < 1 ||
                body.targetCount() > 10) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "학습 계획을 올바르게 입력해 주세요.");
        }

        String title = body.title().trim();

        LearningPlanEntity plan = repository
                .findByUserIdAndPlanDate(
                        userId,
                        body.planDate())
                .orElse(null);

        if (plan == null) {
            plan = new LearningPlanEntity(
                    userId,
                    body.planDate(),
                    title,
                    body.targetCount());
        } else {
            plan.update(title, body.targetCount());
        }

        return toResponse(repository.save(plan));
    }

    // 날짜별 학습 일정 삭제
    @DeleteMapping("/{date}")
    @Transactional
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePlan(
            @PathVariable LocalDate date,
            HttpServletRequest request) {

        Long userId = requireUser(request);

        LearningPlanEntity plan = repository
                .findByUserIdAndPlanDate(userId, date)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "해당 날짜의 학습 계획이 없습니다."));

        repository.delete(plan);
    }
}
