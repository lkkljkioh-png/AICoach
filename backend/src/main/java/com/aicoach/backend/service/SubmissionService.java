package com.aicoach.backend.service;

import com.aicoach.backend.entity.SubmissionEntity;
import com.aicoach.backend.repository.SubmissionRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SubmissionService {

    private final SubmissionRepository submissionRepository;

    public SubmissionService(
            SubmissionRepository submissionRepository) {
        this.submissionRepository = submissionRepository;
    }

    @Transactional
    public void saveSubmission(
            Long userId,
            Long problemId,
            String language,
            String code,
            JudgeService.JudgeResult result) {
        SubmissionEntity submission = new SubmissionEntity(
                userId,
                problemId,
                language,
                code,
                result.status(),
                result.passed(),
                result.total());

        submissionRepository.save(submission);
    }

    @Transactional(readOnly = true)
    public List<SubmissionResponse> getUserSubmissions(Long userId) {

        return submissionRepository
                .findByUserIdOrderBySubmittedAtDescIdDesc(userId)
                .stream()
                .map(submission -> new SubmissionResponse(
                        submission.getId(),
                        submission.getProblemId(),
                        submission.getLanguage(),
                        submission.getStatus(),
                        submission.getPassed(),
                        submission.getTotal(),
                        submission.getSubmittedAt()))
                .toList();
    }

    public record SubmissionResponse(
            Long id,
            Long problemId,
            String language,
            String status,
            int passed,
            int total,
            java.time.LocalDateTime submittedAt) {
    }
}