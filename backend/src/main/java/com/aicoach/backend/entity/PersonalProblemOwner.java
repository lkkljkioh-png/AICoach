
package com.aicoach.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "personal_problem_owners")
public class PersonalProblemOwner {

    @Id
    @Column(name = "problem_id")
    private Long problemId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    protected PersonalProblemOwner() {
    }

    public PersonalProblemOwner(Long problemId, Long userId) {
        this.problemId = problemId;
        this.userId = userId;
    }

    public Long getProblemId() {
        return problemId;
    }

    public Long getUserId() {
        return userId;
    }
}
