
package com.aicoach.backend.controller;

import com.aicoach.backend.service.AICodingService;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/problems")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AICodingController {

    private final AICodingService aiCodingService;

    public AICodingController(
            AICodingService aiCodingService) {
        this.aiCodingService = aiCodingService;
    }

    public record AICodeRequest(
            String language,
            String instruction,
            String currentCode,
            String judgeOutput,
            String action) {
    }

    @PostMapping("/{id}/ai-code")
    public AICodingService.AICodeResult generateCode(
            @PathVariable Long id,
            @RequestBody AICodeRequest request) {

        return aiCodingService.generate(
                id,
                request.language(),
                request.instruction(),
                request.currentCode(),
                request.judgeOutput(),
                request.action());
    }
}
