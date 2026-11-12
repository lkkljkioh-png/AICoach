
package com.aicoach.backend.controller;

import com.aicoach.backend.service.JudgeService;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/problems")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class JudgeController {

    private final JudgeService judgeService;

    public JudgeController(JudgeService judgeService) {
        this.judgeService = judgeService;
    }

    public record CodeRequest(
            String language,
            String code) {
    }

    // 코드 실행
    @PostMapping("/{id}/run")
    public JudgeService.JudgeResult run(
            @PathVariable Long id,
            @RequestBody CodeRequest request) {
        return judgeService.run(
                id,
                request.language(),
                request.code());
    }

    // 코드 제출 및 채점
    @PostMapping("/{id}/submit")
    public JudgeService.JudgeResult submit(
            @PathVariable Long id,
            @RequestBody CodeRequest request) {
        return judgeService.submit(
                id,
                request.language(),
                request.code());
    }
}
