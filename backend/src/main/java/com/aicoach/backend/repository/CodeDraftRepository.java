
package com.aicoach.backend.repository;

import com.aicoach.backend.entity.CodeDraftEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CodeDraftRepository
        extends JpaRepository<CodeDraftEntity, Long> {

    List<CodeDraftEntity> findByUserIdAndProblemId(
            Long userId,
            Long problemId);

    Optional<CodeDraftEntity> findByUserIdAndProblemIdAndLanguage(
            Long userId,
            Long problemId,
            String language);
}
