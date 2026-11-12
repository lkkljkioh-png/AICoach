package com.aicoach.backend.repository;

import com.aicoach.backend.entity.SubmissionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SubmissionRepository
        extends JpaRepository<SubmissionEntity, Long> {

    List<SubmissionEntity> findByUserIdOrderBySubmittedAtDescIdDesc(Long userId);
}