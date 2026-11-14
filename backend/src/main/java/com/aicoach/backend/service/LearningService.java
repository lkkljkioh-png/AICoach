
package com.aicoach.backend.service;

import com.aicoach.backend.entity.ProblemEntity;
import com.aicoach.backend.entity.SubmissionEntity;
import com.aicoach.backend.repository.ProblemRepository;
import com.aicoach.backend.repository.SubmissionRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class LearningService {

    private final ProblemRepository problemRepository;
    private final SubmissionRepository submissionRepository;

    public LearningService(
            ProblemRepository problemRepository,
            SubmissionRepository submissionRepository) {
        this.problemRepository = problemRepository;
        this.submissionRepository = submissionRepository;
    }

    public record RecommendedProblem(
            Long id,
            String title,
            String level,
            String category,
            Integer time,
            String reason,
            int score) {
    }

    public record LearningResponse(
            int totalSubmissions,
            int acceptedSubmissions,
            int solvedProblems,
            int accuracy,
            String recommendedLevel,
            String weakCategory,
            List<RecommendedProblem> recommendations) {
    }

    public LearningResponse getRecommendations(Long userId) {

        List<SubmissionEntity> submissions = submissionRepository
                .findByUserIdOrderBySubmittedAtDescIdDesc(userId);

        List<ProblemEntity> problems = problemRepository.findByPublishedTrueOrderByIdAsc();

        Set<Long> solvedIds = submissions.stream()
                .filter(s -> "ACCEPTED".equals(s.getStatus()))
                .map(SubmissionEntity::getProblemId)
                .collect(Collectors.toSet());

        Set<Long> attemptedIds = submissions.stream()
                .map(SubmissionEntity::getProblemId)
                .collect(Collectors.toSet());

        int total = submissions.size();
        int accepted = (int) submissions.stream()
                .filter(s -> "ACCEPTED".equals(s.getStatus()))
                .count();

        int accuracy = total == 0
                ? 0
                : (int) Math.round(accepted * 100.0 / total);

        Map<Long, ProblemEntity> problemMap = problems.stream().collect(Collectors.toMap(
                ProblemEntity::getId,
                p -> p));

        Map<String, Integer> failuresByCategory = new HashMap<>();

        for (SubmissionEntity submission : submissions) {

            if ("ACCEPTED".equals(submission.getStatus())) {
                continue;
            }

            ProblemEntity problem = problemMap.get(submission.getProblemId());

            if (problem == null)
                continue;

            failuresByCategory.merge(
                    problem.getCategory(), 1, Integer::sum);
        }

        String weakCategory = failuresByCategory.entrySet()
                .stream()
                .sorted(
                        Comparator.<Map.Entry<String, Integer>>comparingInt(
                                Map.Entry::getValue)
                                .reversed()
                                .thenComparing(Map.Entry::getKey))
                .map(Map.Entry::getKey)
                .findFirst()
                .orElse(null);

        String targetLevel = calculateLevel(
                total, accuracy, solvedIds.size());

        List<RecommendedProblem> recommendations = problems.stream()
                .filter(p -> !solvedIds.contains(p.getId()))
                .map(p -> {
                    int score = 0;
                    List<String> reasons = new ArrayList<>();

                    if (attemptedIds.contains(p.getId())) {
                        score += 50;
                        reasons.add("이전에 시도한 문제를 복습해 보세요");
                    }

                    if (weakCategory != null
                            && weakCategory.equals(p.getCategory())) {
                        score += 30;
                        reasons.add("보완이 필요한 유형입니다");
                    }

                    if (targetLevel.equals(p.getLevel())) {
                        score += 20;
                        reasons.add("현재 추천 난이도에 맞는 문제입니다");
                    }

                    if (reasons.isEmpty()) {
                        reasons.add(total == 0
                                ? "첫 학습으로 도전하기 좋은 문제입니다"
                                : "새로운 유형에 도전해 보세요");
                    }

                    return new RecommendedProblem(
                            p.getId(),
                            p.getTitle(),
                            p.getLevel(),
                            p.getCategory(),
                            p.getTime(),
                            String.join(". ", reasons),
                            score);
                })
                .sorted(
                        Comparator
                                .comparingInt(
                                        RecommendedProblem::score)
                                .reversed()
                                .thenComparing(
                                        r -> levelDistance(
                                                r.level(),
                                                targetLevel))
                                .thenComparing(
                                        RecommendedProblem::id))
                .limit(5)
                .toList();

        return new LearningResponse(
                total,
                accepted,
                solvedIds.size(),
                accuracy,
                targetLevel,
                weakCategory,
                recommendations);
    }

    private String calculateLevel(
            int total,
            int accuracy,
            int solved) {

        if (total == 0 || solved < 3 || accuracy < 50) {
            return "EASY";
        }

        if (solved >= 10 && accuracy >= 80) {
            return "HARD";
        }

        return "MEDIUM";
    }

    private int levelDistance(String level, String target) {
        return Math.abs(levelRank(level) - levelRank(target));
    }

    private int levelRank(String level) {
        return switch (level) {
            case "EASY" -> 1;
            case "MEDIUM" -> 2;
            case "HARD" -> 3;
            default -> 4;
        };
    }
}
