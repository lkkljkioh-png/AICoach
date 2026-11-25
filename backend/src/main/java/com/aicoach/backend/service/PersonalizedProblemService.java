package com.aicoach.backend.service;

import com.aicoach.backend.entity.PersonalProblemOwner;
import com.aicoach.backend.entity.ProblemEntity;
import com.aicoach.backend.entity.SubmissionEntity;

import com.aicoach.backend.repository.PersonalProblemOwnerRepository;
import com.aicoach.backend.repository.ProblemRepository;
import com.aicoach.backend.repository.ProblemTestCaseRepository;
import com.aicoach.backend.repository.SubmissionRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PersonalizedProblemService {

    public static final int MAX_PERSONAL_PROBLEMS = 30;

    @Value("${AICOACH_ADMIN_EMAIL:}")
    private String adminEmail;

    private final AuthService authService;
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
            SubmissionRepository submissionRepository,
            AuthService authService) {

        this.storageService = storageService;
        this.ownerRepository = ownerRepository;
        this.problemRepository = problemRepository;
        this.testCaseRepository = testCaseRepository;
        this.submissionRepository = submissionRepository;
        this.authService = authService;
    }

    // 관리자 계정 확인
    public boolean isAdmin(Long userId) {

        if (adminEmail == null || adminEmail.isBlank()) {
            return false;
        }

        return adminEmail.trim().equalsIgnoreCase(
                authService.getUser(userId).email());
    }

    // 개인 문제 저장 한도 확인
    @Transactional(readOnly = true)
    public void checkProblemLimit(Long userId) {

        // 관리자 계정은 저장 한도 제한 제외
        if (isAdmin(userId)) {
            return;
        }

        long count = ownerRepository
                .countByUserIdAndArchivedFalse(userId);

        if (count >= MAX_PERSONAL_PROBLEMS) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "개인 AI 문제는 최대 30개까지 보관할 수 있습니다. "
                            + "기존 문제를 보관함으로 이동해 주세요.");
        }
    }

    // Docker 검증 및 개인 문제 저장
    @Transactional
    public AIProblemStorageService.SaveResponse save(
            Long userId,
            AIProblemGenerationService.GeneratedProblem problem) {

        checkProblemLimit(userId);

        AIProblemStorageService.SaveResponse saved = storageService.saveVerifiedProblem(problem);

        ownerRepository.save(
                new PersonalProblemOwner(
                        saved.problemId(),
                        userId));

        return saved;
    }

    // 개인 문제 및 풀이 상태 조회
    @Transactional(readOnly = true)
    public List<PersonalProblemResponse> getMyProblems(Long userId) {

        List<SubmissionEntity> submissions = submissionRepository
                .findByUserIdOrderBySubmittedAtDescIdDesc(userId);

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
                            accuracy,
                            owner.isArchived());
                })
                .filter(item -> item != null)
                .toList();
    }

    // 개인 문제 보관
    @Transactional
    public void archiveProblem(Long userId, Long problemId) {

        PersonalProblemOwner owner = findOwnedProblem(userId, problemId);

        if (owner.isArchived()) {
            return;
        }

        owner.setArchived(true);
        ownerRepository.save(owner);
    }

    // 보관된 문제 복원
    @Transactional
    public void restoreProblem(Long userId, Long problemId) {

        PersonalProblemOwner owner = findOwnedProblem(userId, problemId);

        if (!owner.isArchived()) {
            return;
        }

        checkProblemLimit(userId);

        owner.setArchived(false);
        ownerRepository.save(owner);
    }

    // 개인 문제 소유권 확인
    private PersonalProblemOwner findOwnedProblem(
            Long userId,
            Long problemId) {

        return ownerRepository
                .findByProblemIdAndUserId(problemId, userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "본인의 개인 문제를 찾을 수 없습니다."));
    }

    // 제출 이력이 없는 개인 문제 삭제
    @Transactional
    public void deleteMyProblem(
            Long userId,
            Long problemId) {

        findOwnedProblem(userId, problemId);

        ProblemEntity problem = problemRepository
                .findById(problemId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "문제를 찾을 수 없습니다."));

        if (problem.isPublished()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "공개된 문제는 삭제할 수 없습니다.");
        }

        long submissionCount = submissionRepository.countByProblemId(problemId);

        if (submissionCount > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "제출 이력이 있는 문제는 삭제할 수 없습니다. "
                            + "대신 보관함 기능을 이용해 주세요.");
        }

        testCaseRepository.deleteByProblemId(problemId);
        ownerRepository.deleteById(problemId);
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
            double accuracy,
            boolean archived) {
    }
}