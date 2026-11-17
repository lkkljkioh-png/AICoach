
package com.aicoach.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_coding_sessions")
public class AICodingSessionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "problem_id", nullable = false)
    private Long problemId;

    @Column(nullable = false, length = 30)
    private String language;

    @Column(nullable = false, length = 2000)
    private String instruction;

    @Column(name = "action_type", nullable = false, length = 20)
    private String actionType;

    @Column(name = "original_code", nullable = false, columnDefinition = "TEXT")
    private String originalCode;

    @Column(name = "revised_code", nullable = false, columnDefinition = "TEXT")
    private String revisedCode;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected AICodingSessionEntity() {
    }

    public AICodingSessionEntity(
            Long userId,
            Long problemId,
            String language,
            String instruction,
            String actionType,
            String originalCode) {

        this.userId = userId;
        this.problemId = problemId;
        this.language = language;
        this.instruction = instruction;
        this.actionType = actionType;
        this.originalCode = originalCode;
        this.revisedCode = originalCode;
    }

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Long getProblemId() {
        return problemId;
    }

    public String getLanguage() {
        return language;
    }

    public String getOriginalCode() {
        return originalCode;
    }

    public String getRevisedCode() {
        return revisedCode;
    }

    public void setRevisedCode(String revisedCode) {
        this.revisedCode = revisedCode;
    }
}
