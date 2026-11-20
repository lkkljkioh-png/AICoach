
package com.aicoach.backend.repository;

import com.aicoach.backend.entity.PersonalProblemOwner;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PersonalProblemOwnerRepository
                extends JpaRepository<PersonalProblemOwner, Long> {

        boolean existsByProblemIdAndUserId(
                        Long problemId,
                        Long userId);

        List<PersonalProblemOwner> findByUserIdOrderByProblemIdDesc(
                        Long userId);
}
