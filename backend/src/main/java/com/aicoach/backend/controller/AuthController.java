package com.aicoach.backend.controller;

import com.aicoach.backend.service.AuthService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AuthController {

    private static final String SESSION_USER_ID = "USER_ID";

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // 회원가입
    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthService.UserResponse signup(
            @RequestBody AuthService.SignupRequest request) {
        return authService.signup(request);
    }

    // 로그인
    @PostMapping("/login")
    public AuthService.UserResponse login(
            @RequestBody AuthService.LoginRequest request,
            HttpServletRequest servletRequest) {
        AuthService.UserResponse user = authService.login(request);

        HttpSession session = servletRequest.getSession(false);

        if (session != null) {
            servletRequest.changeSessionId();
        } else {
            session = servletRequest.getSession(true);
        }

        session.setAttribute(SESSION_USER_ID, user.id());
        session.setMaxInactiveInterval(60 * 60 * 2);

        return user;
    }

    // 로그인 상태 확인
    @GetMapping("/me")
    public AuthService.UserResponse me(
            HttpServletRequest request) {
        HttpSession session = request.getSession(false);

        if (session == null) {
            throw unauthorized();
        }

        Object userId = session.getAttribute(SESSION_USER_ID);

        if (!(userId instanceof Long id)) {
            throw unauthorized();
        }

        return authService.getUser(id);
    }

    // 로그아웃
    @PostMapping("/logout")
    public MessageResponse logout(HttpServletRequest request) {

        HttpSession session = request.getSession(false);

        if (session != null) {
            session.invalidate();
        }

        return new MessageResponse("로그아웃되었습니다.");
    }

    public record MessageResponse(String message) {
    }

    private ResponseStatusException unauthorized() {
        return new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "로그인이 필요합니다.");
    }
}