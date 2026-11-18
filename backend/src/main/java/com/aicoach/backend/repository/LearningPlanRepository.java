
package com.aicoach.backend.repository;

import com.aicoach.backend.entity.LearningPlanEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface LearningPlanRepository
        extends JpaRepository<LearningPlanEntity, Long> {

    List<LearningPlanEntity> findByUserIdOrderByPlanDateAsc(
            Long userId);

    Optional<LearningPlanEntity> findByUserIdAndPlanDate(
            Long userId,
            LocalDate planDate);
}
