
package com.aicoach.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "code_drafts", uniqueConstraints = @UniqueConstraint(name = "uk_code_drafts_user_problem_language", columnNames = {
        "user_id", "problem_id", "language" }))
public class CodeDraftEntity {

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

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected CodeDraftEntity() {
    }

    public CodeDraftEntity(
            Long userId,
            Long problemId,
            String language,
            String code) {

        this.userId = userId;
        this.problemId = problemId;
        this.language = language;
        this.code = code;
    }

    @PrePersist
    @PreUpdate
    public void updateTimestamp() {
        updatedAt = LocalDateTime.now();
    }

    public String getLanguage() {
        return language;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }
}
