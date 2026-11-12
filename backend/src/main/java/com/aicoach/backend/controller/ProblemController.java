
package com.aicoach.backend.controller;

import com.aicoach.backend.entity.ProblemEntity;
import com.aicoach.backend.service.ProblemService;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/problems")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class ProblemController {

    private final ProblemService problemService;

    public ProblemController(ProblemService problemService) {
        this.problemService = problemService;
    }

    // 전체 문제 조회
    @GetMapping
    public List<ProblemEntity> getAllProblems() {
        return problemService.getAllProblems();
    }

    // 문제 상세 조회
    @GetMapping("/{id}")
    public ProblemEntity getProblem(@PathVariable Long id) {
        return problemService.getProblem(id);
    }
}
