
package com.aicoach.backend.repository;

import com.aicoach.backend.entity.ProblemEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProblemRepository
        extends JpaRepository<ProblemEntity, Long> {

    List<ProblemEntity> findByPublishedTrueOrderByIdAsc();

    Optional<ProblemEntity> findByIdAndPublishedTrue(Long id);
}
