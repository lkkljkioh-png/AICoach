
package com.aicoach.backend.service;

import com.aicoach.backend.entity.PersonalProblemOwner;
import com.aicoach.backend.repository.PersonalProblemOwnerRepository;
import com.aicoach.backend.repository.ProblemRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PersonalizedProblemService {

    private final AIProblemStorageService storageService;
    private final PersonalProblemOwnerRepository ownerRepository;
    private final ProblemRepository problemRepository;

    public PersonalizedProblemService(
            AIProblemStorageService storageService,
            PersonalProblemOwnerRepository ownerRepository,
            ProblemRepository problemRepository) {

        this.storageService = storageService;
        this.ownerRepository = ownerRepository;
        this.problemRepository = problemRepository;
    }

    // Docker 검증과 소유권 저장을 하나의 트랜잭션으로 처리
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

    // 로그인 사용자의 개인 문제 목록
    @Transactional(readOnly = true)
    public List<PersonalProblemResponse> getMyProblems(Long userId) {

        return ownerRepository
                .findByUserIdOrderByProblemIdDesc(userId)
                .stream()
                .map(owner -> problemRepository
                        .findById(owner.getProblemId())
                        .orElse(null))
                .filter(problem -> problem != null)
                .map(problem -> new PersonalProblemResponse(
                        problem.getId(),
                        problem.getTitle(),
                        problem.getLevel(),
                        problem.getCategory(),
                        problem.getTime()))
                .toList();
    }

    public record PersonalProblemResponse(
            Long id,
            String title,
            String level,
            String category,
            Integer time) {
    }
}
