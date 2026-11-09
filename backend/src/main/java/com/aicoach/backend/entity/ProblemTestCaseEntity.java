
package com.aicoach.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "problem_test_cases")
public class ProblemTestCaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "problem_id", nullable = false)
    private Long problemId;

    @Column(name = "test_input", columnDefinition = "TEXT")
    private String testInput;

    @Column(name = "expected_output", nullable = false, columnDefinition = "TEXT")
    private String expectedOutput;

    protected ProblemTestCaseEntity() {
    }

    public Long getId() {
        return id;
    }

    public Long getProblemId() {
        return problemId;
    }

    public String getTestInput() {
        return testInput;
    }

    public String getExpectedOutput() {
        return expectedOutput;
    }
}
