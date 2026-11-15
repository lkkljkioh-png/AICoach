
package com.aicoach.backend.service;

import com.aicoach.backend.entity.ProblemEntity;
import com.aicoach.backend.entity.SubmissionEntity;
import com.aicoach.backend.repository.ProblemRepository;
import com.aicoach.backend.repository.SubmissionRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

        // 추천 문제
        public record RecommendedProblem(
                        Long id,
                        String title,
                        String level,
                        String category,
                        Integer time,
                        String reason,
                        int score) {
        }

        // 유형별 학습 통계
        public record CategoryStat(
                        String category,
                        int total,
                        int accepted,
                        int failed,
                        int accuracy,
                        int solvedProblems) {
        }

        // 전체 학습 분석 응답
        public record LearningResponse(
                        int totalSubmissions,
                        int acceptedSubmissions,
                        int solvedProblems,
                        int accuracy,
                        String recommendedLevel,
                        String weakCategory,
                        String insight,
                        List<CategoryStat> categoryStats,
                        List<RecommendedProblem> recommendations) {
        }

        // 내부 통계 계산용
        private static class MutableCategoryStat {
                int total;
                int accepted;
                int failed;
                Set<Long> solvedIds = new HashSet<>();
        }

        @Transactional(readOnly = true)
        public LearningResponse getRecommendations(Long userId) {

                List<SubmissionEntity> submissions = submissionRepository
                                .findByUserIdOrderBySubmittedAtDescIdDesc(userId);

                List<ProblemEntity> problems = problemRepository.findByPublishedTrueOrderByIdAsc();

                Map<Long, ProblemEntity> problemMap = problems.stream().collect(Collectors.toMap(
                                ProblemEntity::getId,
                                p -> p));

                // 1. 전체 제출 통계
                int total = submissions.size();

                int accepted = (int) submissions.stream()
                                .filter(s -> "ACCEPTED".equals(s.getStatus()))
                                .count();

                int accuracy = total == 0
                                ? 0
                                : (int) Math.round(accepted * 100.0 / total);

                Set<Long> solvedIds = submissions.stream()
                                .filter(s -> "ACCEPTED".equals(s.getStatus()))
                                .map(SubmissionEntity::getProblemId)
                                .collect(Collectors.toSet());

                Set<Long> attemptedIds = submissions.stream()
                                .map(SubmissionEntity::getProblemId)
                                .collect(Collectors.toSet());

                // 2. 유형별 통계 계산
                Map<String, MutableCategoryStat> categoryMap = new HashMap<>();

                for (SubmissionEntity submission : submissions) {

                        ProblemEntity problem = problemMap.get(submission.getProblemId());

                        if (problem == null) {
                                continue;
                        }

                        String category = problem.getCategory();

                        MutableCategoryStat stat = categoryMap.computeIfAbsent(
                                        category,
                                        key -> new MutableCategoryStat());

                        stat.total++;

                        if ("ACCEPTED".equals(submission.getStatus())) {
                                stat.accepted++;
                                stat.solvedIds.add(submission.getProblemId());
                        } else {
                                stat.failed++;
                        }
                }

                List<CategoryStat> categoryStats = categoryMap.entrySet()
                                .stream()
                                .map(entry -> {
                                        MutableCategoryStat s = entry.getValue();

                                        int rate = s.total == 0
                                                        ? 0
                                                        : (int) Math.round(
                                                                        s.accepted * 100.0 / s.total);

                                        return new CategoryStat(
                                                        entry.getKey(),
                                                        s.total,
                                                        s.accepted,
                                                        s.failed,
                                                        rate,
                                                        s.solvedIds.size());
                                })
                                .sorted(
                                                Comparator.comparingInt(
                                                                CategoryStat::accuracy).thenComparing(
                                                                                Comparator.comparingInt(
                                                                                                CategoryStat::total)
                                                                                                .reversed())
                                                                .thenComparing(
                                                                                CategoryStat::category))
                                .toList();

                // 3. 취약 유형 결정
                // 오답이 존재하는 유형만 취약 후보로 사용
                String weakCategory = categoryStats.stream()
                                .filter(stat -> stat.failed() > 0)
                                .map(CategoryStat::category)
                                .findFirst()
                                .orElse(null);

                // 4. 추천 난이도
                String targetLevel = calculateLevel(
                                total,
                                accuracy,
                                solvedIds.size());

                // 5. 학습 분석 메시지
                String insight = createInsight(
                                total,
                                accuracy,
                                weakCategory,
                                targetLevel);

                // 6. 문제 추천 점수 계산
                List<RecommendedProblem> recommendations = problems.stream()
                                .filter(p -> !solvedIds.contains(p.getId()))
                                .map(problem -> {

                                        int score = 0;
                                        List<String> reasons = new ArrayList<>();

                                        boolean attempted = attemptedIds.contains(problem.getId());

                                        // 이전에 틀린 문제 우선
                                        if (attempted) {
                                                score += 50;
                                                reasons.add(
                                                                "이전에 시도했지만 아직 해결하지 못한 문제입니다");
                                        }

                                        // 취약 유형 우선
                                        if (weakCategory != null
                                                        && weakCategory.equals(
                                                                        problem.getCategory())) {

                                                score += 35;
                                                reasons.add(
                                                                "정답률이 낮은 유형을 보완할 수 있습니다");
                                        }

                                        // 추천 난이도 일치
                                        if (targetLevel.equals(problem.getLevel())) {
                                                score += 20;
                                                reasons.add(
                                                                "현재 추천 난이도에 적합합니다");
                                        }

                                        // 새로운 문제
                                        if (!attempted) {
                                                score += 10;
                                        }

                                        if (reasons.isEmpty()) {
                                                reasons.add(
                                                                total == 0
                                                                                ? "첫 학습으로 도전하기 좋은 문제입니다"
                                                                                : "새로운 유형에 도전해 보세요");
                                        }

                                        return new RecommendedProblem(
                                                        problem.getId(),
                                                        problem.getTitle(),
                                                        problem.getLevel(),
                                                        problem.getCategory(),
                                                        problem.getTime(),
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
                                insight,
                                categoryStats,
                                recommendations);
        }

        // 학습 분석 메시지
        private String createInsight(
                        int total,
                        int accuracy,
                        String weakCategory,
                        String level) {

                if (total == 0) {
                        return "아직 제출 기록이 없습니다. 쉬운 문제부터 풀면서 학습 데이터를 쌓아보세요.";
                }

                if (weakCategory != null) {
                        return weakCategory
                                        + " 유형의 정답률이 상대적으로 낮습니다. "
                                        + "해당 유형을 복습하면서 "
                                        + levelLabel(level)
                                        + " 난이도 문제를 풀어보세요.";
                }

                if (accuracy >= 80) {
                        return "현재 높은 제출 정답률을 유지하고 있습니다. "
                                        + "새로운 문제 유형에도 도전해 보세요.";
                }

                return "현재 학습 기록을 바탕으로 "
                                + levelLabel(level)
                                + " 난이도 문제를 추천합니다.";
        }

        // 난이도 결정
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

        private String levelLabel(String level) {
                return switch (level) {
                        case "EASY" -> "쉬움";
                        case "MEDIUM" -> "보통";
                        case "HARD" -> "어려움";
                        default -> "쉬움";
                };
        }

        private int levelDistance(String level, String target) {
                return Math.abs(levelRank(level) - levelRank(target));
        }

        private int levelRank(String level) {
                if (level == null)
                        return 4;

                return switch (level) {
                        case "EASY" -> 1;
                        case "MEDIUM" -> 2;
                        case "HARD" -> 3;
                        default -> 4;
                };
        }
}
