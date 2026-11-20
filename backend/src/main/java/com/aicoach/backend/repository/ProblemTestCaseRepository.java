
package com.aicoach.backend.repository;

import com.aicoach.backend.entity.ProblemTestCaseEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProblemTestCaseRepository
                extends JpaRepository<ProblemTestCaseEntity, Long> {

        List<ProblemTestCaseEntity> findByProblemIdOrderByIdAsc(
                        Long problemId);

        // 개인 문제 삭제 시 테스트케이스 정리
        long deleteByProblemId(Long problemId);
}
