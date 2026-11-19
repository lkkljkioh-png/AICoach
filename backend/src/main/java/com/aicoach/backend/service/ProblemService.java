
package com.aicoach.backend.service;

import com.aicoach.backend.entity.ProblemEntity;
import com.aicoach.backend.repository.ProblemRepository;
import com.aicoach.backend.repository.PersonalProblemOwnerRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ProblemService {

    private final ProblemRepository problemRepository;
    private final PersonalProblemOwnerRepository ownerRepository;

    public ProblemService(
            ProblemRepository problemRepository,
            PersonalProblemOwnerRepository ownerRepository) {

        this.problemRepository = problemRepository;
        this.ownerRepository = ownerRepository;
    }

    // 공개 문제 목록
    public List<ProblemEntity> getAllProblems() {
        return problemRepository.findByPublishedTrueOrderByIdAsc();
    }

    // 기존 공개 문제 조회 호환
    public ProblemEntity getProblem(Long id) {
        return getProblem(id, null);
    }

    // 공개 문제 또는 본인의 개인 문제만 조회
    public ProblemEntity getProblem(Long id, Long userId) {

        ProblemEntity problem = problemRepository
                .findById(id)
                .orElseThrow(this::notFound);

        if (problem.isPublished()) {
            return problem;
        }

        if (userId != null &&
                ownerRepository.existsByProblemIdAndUserId(
                        id,
                        userId)) {
            return problem;
        }

        throw notFound();
    }

    private ResponseStatusException notFound() {
        return new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "문제를 찾을 수 없습니다.");
    }
}
