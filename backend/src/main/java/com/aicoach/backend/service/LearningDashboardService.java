
package com.aicoach.backend.service;

import com.aicoach.backend.entity.SubmissionEntity;
import com.aicoach.backend.repository.SubmissionRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class LearningDashboardService {

    private final SubmissionRepository submissionRepository;

    public LearningDashboardService(
            SubmissionRepository submissionRepository) {
        this.submissionRepository = submissionRepository;
    }

    public record LanguageStat(
            String language,
            int total,
            int accepted,
            int failed,
            int accuracy,
            int solvedProblems) {
    }

    public record DailyStat(
            String date,
            int total,
            int accepted) {
    }

    public record DashboardResponse(
            int totalSubmissions,
            int solvedProblems,
            int accuracy,
            int activeDays,
            List<LanguageStat> languages,
            List<DailyStat> dailyActivity) {
    }

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(Long userId) {

        List<SubmissionEntity> submissions = submissionRepository
                .findByUserIdOrderBySubmittedAtDescIdDesc(
                        userId);

        int total = submissions.size();

        int accepted = (int) submissions.stream()
                .filter(s -> "ACCEPTED".equals(s.getStatus()))
                .count();

        int accuracy = percent(accepted, total);

        int solved = (int) submissions.stream()
                .filter(s -> "ACCEPTED".equals(s.getStatus()))
                .map(SubmissionEntity::getProblemId)
                .distinct()
                .count();

        // =====================================
        // 언어별 학습 통계
        // =====================================

        Map<String, List<SubmissionEntity>> grouped = submissions.stream()
                .collect(Collectors.groupingBy(
                        SubmissionEntity::getLanguage));

        List<LanguageStat> languages = grouped.entrySet().stream()
                .map(entry -> {

                    List<SubmissionEntity> items = entry.getValue();

                    int count = items.size();

                    int correct = (int) items.stream()
                            .filter(s -> "ACCEPTED".equals(
                                    s.getStatus()))
                            .count();

                    int solvedCount = (int) items.stream()
                            .filter(s -> "ACCEPTED".equals(
                                    s.getStatus()))
                            .map(SubmissionEntity::getProblemId)
                            .distinct()
                            .count();

                    return new LanguageStat(
                            entry.getKey(),
                            count,
                            correct,
                            count - correct,
                            percent(correct, count),
                            solvedCount);
                })
                .sorted(
                        Comparator.comparingInt(
                                LanguageStat::total).reversed()
                                .thenComparing(LanguageStat::language))
                .toList();

        // =====================================
        // 최근 7일 제출 활동
        // =====================================

        LocalDate today = LocalDate.now();
        LocalDate start = today.minusDays(6);

        Map<LocalDate, List<SubmissionEntity>> byDate = submissions.stream()
                .filter(s -> s.getSubmittedAt() != null)
                .filter(s -> {
                    LocalDate date = s.getSubmittedAt().toLocalDate();

                    return !date.isBefore(start)
                            && !date.isAfter(today);
                })
                .collect(Collectors.groupingBy(
                        s -> s.getSubmittedAt().toLocalDate()));

        List<DailyStat> dailyActivity = new ArrayList<>();
        int activeDays = 0;

        for (int i = 0; i < 7; i++) {

            LocalDate date = start.plusDays(i);

            List<SubmissionEntity> items = byDate.getOrDefault(
                    date,
                    Collections.emptyList());

            int count = items.size();

            int correct = (int) items.stream()
                    .filter(s -> "ACCEPTED".equals(s.getStatus()))
                    .count();

            if (count > 0) {
                activeDays++;
            }

            dailyActivity.add(
                    new DailyStat(
                            date.toString(),
                            count,
                            correct));
        }

        return new DashboardResponse(
                total,
                solved,
                accuracy,
                activeDays,
                languages,
                dailyActivity);
    }

    private int percent(int accepted, int total) {
        if (total == 0)
            return 0;

        return (int) Math.round(
                accepted * 100.0 / total);
    }
}