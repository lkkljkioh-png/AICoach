
package com.aicoach.backend.service;

import com.aicoach.backend.entity.ProblemEntity;
import com.aicoach.backend.repository.ProblemRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ProblemService {

    private final ProblemRepository problemRepository;

    public ProblemService(ProblemRepository problemRepository) {
        this.problemRepository = problemRepository;
    }

    // 공개된 전체 문제 조회
    public List<ProblemEntity> getAllProblems() {
        return problemRepository.findByPublishedTrueOrderByIdAsc();
    }

    // 공개된 문제 상세 조회
    public ProblemEntity getProblem(Long id) {
        return problemRepository.findByIdAndPublishedTrue(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "문제를 찾을 수 없습니다."));
    }
}
