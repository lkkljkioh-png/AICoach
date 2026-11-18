
package com.aicoach.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "learning_plans", uniqueConstraints = @UniqueConstraint(name = "uk_learning_plan_user_date", columnNames = {
        "user_id", "plan_date" }))
public class LearningPlanEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "plan_date", nullable = false)
    private LocalDate planDate;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(name = "target_count", nullable = false)
    private int targetCount;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected LearningPlanEntity() {
    }

    public LearningPlanEntity(
            Long userId,
            LocalDate planDate,
            String title,
            int targetCount) {
        this.userId = userId;
        this.planDate = planDate;
        this.title = title;
        this.targetCount = targetCount;
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

    public void update(String title, int targetCount) {
        this.title = title;
        this.targetCount = targetCount;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public LocalDate getPlanDate() {
        return planDate;
    }

    public String getTitle() {
        return title;
    }

    public int getTargetCount() {
        return targetCount;
    }
}
