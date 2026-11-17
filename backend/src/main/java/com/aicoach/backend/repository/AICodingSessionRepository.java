
package com.aicoach.backend.repository;

import com.aicoach.backend.entity.AICodingSessionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AICodingSessionRepository
        extends JpaRepository<AICodingSessionEntity, Long> {

    Optional<AICodingSessionEntity> findByIdAndUserId(
            Long id,
            Long userId);
}
