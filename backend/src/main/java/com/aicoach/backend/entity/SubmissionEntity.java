
package com.aicoach.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "submissions", indexes = {
        @Index(name = "idx_submissions_user_id", columnList = "user_id"),
        @Index(name = "idx_submissions_problem_id", columnList = "problem_id")
})
public class SubmissionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "problem_id", nullable = false)
    private Long problemId;

    @Column(nullable = false, length = 30)
    private String language;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String code;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(nullable = false)
    private int passed;

    @Column(nullable = false)
    private int total;

    @Column(name = "learning_mode", nullable = false, length = 20)
    private String learningMode = "UNKNOWN";

    @Column(name = "submitted_at", nullable = false, updatable = false)
    private LocalDateTime submittedAt;

    protected SubmissionEntity() {
    }

    public SubmissionEntity(
            Long userId,
            Long problemId,
            String language,
            String code,
            String status,
            int passed,
            int total,
            String learningMode) {

        this.userId = userId;
        this.problemId = problemId;
        this.language = language;
        this.code = code;
        this.status = status;
        this.passed = passed;
        this.total = total;
        this.learningMode = learningMode;
    }

    @PrePersist
    public void onCreate() {
        submittedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public Long getProblemId() {
        return problemId;
    }

    public String getLanguage() {
        return language;
    }

    public String getCode() {
        return code;
    }

    public String getStatus() {
        return status;
    }

    public int getPassed() {
        return passed;
    }

    public int getTotal() {
        return total;
    }

    public String getLearningMode() {
        return learningMode;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }
}
