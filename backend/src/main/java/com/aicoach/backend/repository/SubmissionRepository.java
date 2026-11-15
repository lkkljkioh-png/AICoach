package com.aicoach.backend.repository;

import com.aicoach.backend.entity.SubmissionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubmissionRepository
        extends JpaRepository<SubmissionEntity, Long> {

    // 사용자별 제출 기록 조회
    List<SubmissionEntity> findByUserIdOrderBySubmittedAtDescIdDesc(
            Long userId);

    // 특정 사용자의 제출 코드 상세 조회
    Optional<SubmissionEntity> findByIdAndUserId(
            Long id,
            Long userId);
}