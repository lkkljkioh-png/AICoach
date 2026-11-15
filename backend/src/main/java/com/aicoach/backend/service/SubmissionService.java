
package com.aicoach.backend.service;

import com.aicoach.backend.entity.SubmissionEntity;
import com.aicoach.backend.repository.SubmissionRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
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
        public List<SubmissionResponse> getUserSubmissions(
                        Long userId) {

                return submissionRepository
                                .findByUserIdOrderBySubmittedAtDescIdDesc(userId)
                                .stream()
                                .map(this::toResponse)
                                .toList();
        }

        @Transactional(readOnly = true)
        public SubmissionDetailResponse getSubmission(
                        Long submissionId,
                        Long userId) {

                SubmissionEntity submission = submissionRepository
                                .findByIdAndUserId(submissionId, userId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "제출 기록을 찾을 수 없습니다."));

                return new SubmissionDetailResponse(
                                submission.getId(),
                                submission.getProblemId(),
                                submission.getLanguage(),
                                submission.getCode(),
                                submission.getStatus(),
                                submission.getPassed(),
                                submission.getTotal(),
                                submission.getSubmittedAt());
        }

        private SubmissionResponse toResponse(
                        SubmissionEntity submission) {

                return new SubmissionResponse(
                                submission.getId(),
                                submission.getProblemId(),
                                submission.getLanguage(),
                                submission.getStatus(),
                                submission.getPassed(),
                                submission.getTotal(),
                                submission.getSubmittedAt());
        }

        public record SubmissionResponse(
                        Long id,
                        Long problemId,
                        String language,
                        String status,
                        int passed,
                        int total,
                        LocalDateTime submittedAt) {
        }

        public record SubmissionDetailResponse(
                        Long id,
                        Long problemId,
                        String language,
                        String code,
                        String status,
                        int passed,
                        int total,
                        LocalDateTime submittedAt) {
        }
}
