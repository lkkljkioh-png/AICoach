
package com.aicoach.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "problems")
public class ProblemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 20)
    private String level;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(name = "estimated_time", nullable = false)
    private Integer time;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "example_input", columnDefinition = "TEXT")
    private String input;

    @Column(name = "example_output", columnDefinition = "TEXT")
    private String output;

    @Column(columnDefinition = "TEXT")
    private String hint;

    @Column(nullable = false)
    private boolean published = false;

    protected ProblemEntity() {
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getLevel() {
        return level;
    }

    public String getCategory() {
        return category;
    }

    public Integer getTime() {
        return time;
    }

    public String getDescription() {
        return description;
    }

    public String getInput() {
        return input;
    }

    public String getOutput() {
        return output;
    }

    public String getHint() {
        return hint;
    }

    public boolean isPublished() {
        return published;
    }
}
