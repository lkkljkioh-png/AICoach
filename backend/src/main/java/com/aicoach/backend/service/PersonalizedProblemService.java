
package com.aicoach.backend.service;

import com.aicoach.backend.entity.PersonalProblemOwner;
import com.aicoach.backend.entity.ProblemEntity;
import com.aicoach.backend.entity.SubmissionEntity;

import com.aicoach.backend.repository.PersonalProblemOwnerRepository;
import com.aicoach.backend.repository.ProblemRepository;
import com.aicoach.backend.repository.ProblemTestCaseRepository;
import com.aicoach.backend.repository.SubmissionRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PersonalizedProblemService {

        private final AIProblemStorageService storageService;
        private final PersonalProblemOwnerRepository ownerRepository;
        private final ProblemRepository problemRepository;
        private final ProblemTestCaseRepository testCaseRepository;
        private final SubmissionRepository submissionRepository;

        public PersonalizedProblemService(
                        AIProblemStorageService storageService,
                        PersonalProblemOwnerRepository ownerRepository,
                        ProblemRepository problemRepository,
                        ProblemTestCaseRepository testCaseRepository,
                        SubmissionRepository submissionRepository) {

                this.storageService = storageService;
                this.ownerRepository = ownerRepository;
                this.problemRepository = problemRepository;
                this.testCaseRepository = testCaseRepository;
                this.submissionRepository = submissionRepository;
        }

        // Docker 검증 및 개인 문제 저장
        @Transactional
        public AIProblemStorageService.SaveResponse save(
                        Long userId,
                        AIProblemGenerationService.GeneratedProblem problem) {

                AIProblemStorageService.SaveResponse saved = storageService.saveVerifiedProblem(problem);

                ownerRepository.save(
                                new PersonalProblemOwner(
                                                saved.problemId(),
                                                userId));

                return saved;
        }

        // 로그인 사용자 개인 문제와 풀이 통계 조회
        @Transactional(readOnly = true)
        public List<PersonalProblemResponse> getMyProblems(Long userId) {

                List<SubmissionEntity> submissions = submissionRepository
                                .findByUserIdOrderBySubmittedAtDescIdDesc(userId);

                // 문제 ID별 제출 기록 분류
                Map<Long, List<SubmissionEntity>> submissionsByProblem = submissions.stream()
                                .collect(Collectors.groupingBy(
                                                SubmissionEntity::getProblemId));

                return ownerRepository
                                .findByUserIdOrderByProblemIdDesc(userId)
                                .stream()
                                .map(owner -> {

                                        ProblemEntity problem = problemRepository
                                                        .findById(owner.getProblemId())
                                                        .orElse(null);

                                        if (problem == null) {
                                                return null;
                                        }

                                        List<SubmissionEntity> history = submissionsByProblem.getOrDefault(
                                                        problem.getId(),
                                                        List.of());

                                        int total = history.size();

                                        long accepted = history.stream()
                                                        .filter(item -> "ACCEPTED".equals(item.getStatus()))
                                                        .count();

                                        String solveStatus;

                                        if (accepted > 0) {
                                                solveStatus = "SOLVED";
                                        } else if (total > 0) {
                                                solveStatus = "IN_PROGRESS";
                                        } else {
                                                solveStatus = "NOT_STARTED";
                                        }

                                        double accuracy = total == 0
                                                        ? 0.0
                                                        : Math.round(
                                                                        accepted * 1000.0 / total) / 10.0;

                                        return new PersonalProblemResponse(
                                                        problem.getId(),
                                                        problem.getTitle(),
                                                        problem.getLevel(),
                                                        problem.getCategory(),
                                                        problem.getTime(),
                                                        solveStatus,
                                                        total,
                                                        accepted,
                                                        accuracy);
                                })
                                .filter(item -> item != null)
                                .toList();
        }

        // 제출 이력이 없는 개인 문제만 삭제
        @Transactional
        public void deleteMyProblem(
                        Long userId,
                        Long problemId) {

                // 다른 사용자의 문제 삭제 방지
                if (!ownerRepository.existsByProblemIdAndUserId(
                                problemId,
                                userId)) {

                        throw new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "본인의 개인 문제를 찾을 수 없습니다.");
                }

                ProblemEntity problem = problemRepository
                                .findById(problemId)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND,
                                                "문제를 찾을 수 없습니다."));

                // 공개 문제 삭제 방지
                if (problem.isPublished()) {
                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "공개된 문제는 삭제할 수 없습니다.");
                }

                // 학습 기록 보호
                long submissionCount = submissionRepository.countByProblemId(problemId);

                if (submissionCount > 0) {
                        throw new ResponseStatusException(
                                        HttpStatus.CONFLICT,
                                        "제출 이력이 있는 문제는 삭제할 수 없습니다. "
                                                        + "학습 기록 보호를 위해 삭제를 차단했습니다.");
                }

                // 테스트케이스 삭제
                testCaseRepository.deleteByProblemId(problemId);

                // 소유권 정보 삭제
                ownerRepository.deleteById(problemId);

                // 문제 삭제
                problemRepository.delete(problem);
        }

        public record PersonalProblemResponse(
                        Long id,
                        String title,
                        String level,
                        String category,
                        Integer time,
                        String solveStatus,
                        int submissionCount,
                        long acceptedCount,
                        double accuracy) {
        }
}
