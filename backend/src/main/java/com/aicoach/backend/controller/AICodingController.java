
package com.aicoach.backend.controller;

import com.aicoach.backend.service.AICodingService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

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
            @RequestBody AICodeRequest request,
            HttpServletRequest servletRequest) {

        HttpSession session = servletRequest.getSession(false);

        Long userId = null;

        if (session != null) {
            Object value = session.getAttribute("USER_ID");

            if (value instanceof Long idValue) {
                userId = idValue;
            }
        }

        return aiCodingService.generate(
                id,
                request.language(),
                request.instruction(),
                request.currentCode(),
                request.judgeOutput(),
                request.action(),
                userId);
    }
}
