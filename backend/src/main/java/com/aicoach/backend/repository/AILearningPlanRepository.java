
package com.aicoach.backend.repository;

import com.aicoach.backend.entity.AILearningPlanEntity;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AILearningPlanRepository
        extends JpaRepository<AILearningPlanEntity, Long> {

    Optional<AILearningPlanEntity> findFirstByUserIdOrderByCreatedAtDescIdDesc(
            Long userId);
}
