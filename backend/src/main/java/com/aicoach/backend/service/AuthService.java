package com.aicoach.backend.service;

import com.aicoach.backend.entity.UserEntity;
import com.aicoach.backend.repository.UserRepository;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;
import java.util.regex.Pattern;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public record SignupRequest(
            String email,
            String password,
            String nickname) {
    }

    public record LoginRequest(
            String email,
            String password) {
    }

    public record UserResponse(
            Long id,
            String email,
            String nickname) {
    }

    // 회원가입
    public UserResponse signup(SignupRequest request) {

        if (request == null) {
            throw badRequest("회원가입 정보를 입력해 주세요.");
        }

        String email = normalizeEmail(request.email());
        String password = request.password();
        String nickname = request.nickname() == null
                ? ""
                : request.nickname().trim();

        if (email.length() > 255 ||
                !EMAIL_PATTERN.matcher(email).matches()) {
            throw badRequest("올바른 이메일을 입력해 주세요.");
        }

        if (password == null ||
                password.length() < 8 ||
                password.length() > 72) {
            throw badRequest("비밀번호는 8~72자로 입력해 주세요.");
        }

        if (nickname.length() < 2 ||
                nickname.length() > 30) {
            throw badRequest("닉네임은 2~30자로 입력해 주세요.");
        }

        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "이미 가입된 이메일입니다.");
        }

        UserEntity user = new UserEntity(
                email,
                passwordEncoder.encode(password),
                nickname);

        try {
            return toResponse(userRepository.saveAndFlush(user));
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "이미 가입된 이메일이거나 저장할 수 없는 정보입니다.");
        }
    }

    // 로그인
    public UserResponse login(LoginRequest request) {

        if (request == null ||
                request.email() == null ||
                request.password() == null) {
            throw unauthorized();
        }

        String email = normalizeEmail(request.email());

        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(this::unauthorized);

        if (!passwordEncoder.matches(
                request.password(),
                user.getPasswordHash())) {
            throw unauthorized();
        }

        return toResponse(user);
    }

    // 현재 사용자 조회
    public UserResponse getUser(Long id) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(this::unauthorized);

        return toResponse(user);
    }

    private UserResponse toResponse(UserEntity user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getNickname());
    }

    private String normalizeEmail(String email) {
        return email == null
                ? ""
                : email.trim().toLowerCase(Locale.ROOT);
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                message);
    }

    private ResponseStatusException unauthorized() {
        return new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "이메일 또는 비밀번호가 올바르지 않습니다.");
    }
}