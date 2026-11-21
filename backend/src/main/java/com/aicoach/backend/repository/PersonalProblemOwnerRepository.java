
package com.aicoach.backend.repository;

import com.aicoach.backend.entity.PersonalProblemOwner;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PersonalProblemOwnerRepository
                extends JpaRepository<PersonalProblemOwner, Long> {

        boolean existsByProblemIdAndUserId(
                        Long problemId,
                        Long userId);

        Optional<PersonalProblemOwner> findByProblemIdAndUserId(
                        Long problemId,
                        Long userId);

        List<PersonalProblemOwner> findByUserIdOrderByProblemIdDesc(
                        Long userId);

        // 보관하지 않은 개인 문제 개수
        long countByUserIdAndArchivedFalse(Long userId);

        // 기존 메서드 호환
        long countByUserId(Long userId);
}
