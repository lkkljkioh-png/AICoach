
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

    @Column(name = "archived", nullable = false)
    private boolean archived = false;

    protected PersonalProblemOwner() {
    }

    public PersonalProblemOwner(Long problemId, Long userId) {
        this.problemId = problemId;
        this.userId = userId;
        this.archived = false;
    }

    public Long getProblemId() {
        return problemId;
    }

    public Long getUserId() {
        return userId;
    }

    public boolean isArchived() {
        return archived;
    }

    public void setArchived(boolean archived) {
        this.archived = archived;
    }
}
