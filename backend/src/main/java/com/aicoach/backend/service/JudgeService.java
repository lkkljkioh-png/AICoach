
package com.aicoach.backend.service;

import com.aicoach.backend.entity.ProblemEntity;
import com.aicoach.backend.entity.ProblemTestCaseEntity;
import com.aicoach.backend.repository.ProblemTestCaseRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class JudgeService {

    private static final int MAX_CODE_LENGTH = 12000;
    private static final int MAX_OUTPUT_BYTES = 16384;
    private static final int MAX_TEST_CASES = 20;
    private static final int TIMEOUT_SECONDS = 5;

    private final ProblemService problemService;
    private final ProblemTestCaseRepository testCaseRepository;

    public JudgeService(
            ProblemService problemService,
            ProblemTestCaseRepository testCaseRepository) {
        this.problemService = problemService;
        this.testCaseRepository = testCaseRepository;
    }

    public record JudgeResult(
            String status,
            String output,
            int passed,
            int total) {
    }

    private record ExecutionResult(
            String status,
            String output) {
    }

    // 제출 코드 및 언어 검사
    private void validate(String language, String code) {

        if (!"Python".equals(language)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "현재 Python만 지원합니다.");
        }

        if (code == null || code.isBlank()
                || code.length() > MAX_CODE_LENGTH) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "코드를 입력하세요. 최대 12000자입니다.");
        }
    }

    // 실행하기: 문제의 예시 입력 사용
    public JudgeResult run(
            Long problemId,
            String language,
            String code) {
        validate(language, code);

        ProblemEntity problem = problemService.getProblem(problemId);

        ExecutionResult result = executePython(
                code,
                problem.getInput());

        return new JudgeResult(
                result.status(),
                result.output(),
                0,
                0);
    }

    // 제출하기: 모든 테스트 케이스 채점
    public JudgeResult submit(
            Long problemId,
            String language,
            String code) {
        validate(language, code);

        problemService.getProblem(problemId);

        List<ProblemTestCaseEntity> cases = testCaseRepository.findByProblemIdOrderByIdAsc(
                problemId);

        if (cases.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "테스트 케이스가 등록되지 않았습니다.");
        }

        if (cases.size() > MAX_TEST_CASES) {
            throw new ResponseStatusException(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "테스트 케이스가 너무 많습니다.");
        }

        int passed = 0;
        int total = cases.size();

        for (ProblemTestCaseEntity test : cases) {

            ExecutionResult result = executePython(
                    code,
                    test.getTestInput());

            if (!"SUCCESS".equals(result.status())) {
                return new JudgeResult(
                        result.status(),
                        "테스트 " + (passed + 1)
                                + "번 실행 실패\n"
                                + result.output(),
                        passed,
                        total);
            }

            String actual = normalize(result.output());
            String expected = normalize(
                    test.getExpectedOutput());

            if (!actual.equals(expected)) {
                return new JudgeResult(
                        "WRONG_ANSWER",
                        "테스트 " + (passed + 1)
                                + "번에서 오답입니다.",
                        passed,
                        total);
            }

            passed++;
        }

        return new JudgeResult(
                "ACCEPTED",
                "모든 테스트 케이스를 통과했습니다!",
                passed,
                total);
    }

    private String normalize(String value) {
        if (value == null)
            return "";

        return value.replace("\r\n", "\n")
                .replace("\r", "\n")
                .stripTrailing();
    }

    // Docker에서 Python 코드 실행
    private ExecutionResult executePython(
            String code,
            String input) {

        String containerName = "aicoach-" + UUID.randomUUID();

        // 코드 전달 시 명령어 해석을 피하기 위해 Base64 인코딩
        String encodedCode = Base64.getEncoder()
                .encodeToString(
                        code.getBytes(StandardCharsets.UTF_8));

        String pythonRunner = "import base64,sys;"
                + "exec(compile(base64.b64decode(sys.argv[1]),"
                + "'<submission>','exec'))";

        List<String> command = List.of(
                "docker", "run",
                "--rm",
                "--name", containerName,
                "--network", "none",
                "--read-only",
                "--cap-drop", "ALL",
                "--security-opt", "no-new-privileges",
                "--pids-limit", "64",
                "--memory", "128m",
                "--memory-swap", "128m",
                "--cpus", "0.5",
                "--user", "65534:65534",
                "--tmpfs", "/tmp:rw,noexec,nosuid,size=16m",
                "-i",
                "python:3.12-alpine",
                "python", "-I", "-B", "-c",
                pythonRunner, encodedCode);

        Process process;

        try {
            process = new ProcessBuilder(command)
                    .redirectErrorStream(true)
                    .start();

        } catch (IOException e) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Docker를 실행할 수 없습니다.");
        }

        ByteArrayOutputStream buffer = new ByteArrayOutputStream();

        AtomicBoolean outputExceeded = new AtomicBoolean(false);

        // 출력 스트림 수집
        Thread reader = Thread.startVirtualThread(() -> {
            try (InputStream stream = process.getInputStream()) {

                byte[] chunk = new byte[1024];
                int length;

                while ((length = stream.read(chunk)) != -1) {
                    synchronized (buffer) {
                        if (buffer.size() + length > MAX_OUTPUT_BYTES) {
                            outputExceeded.set(true);
                            process.destroyForcibly();
                            break;
                        }

                        buffer.write(chunk, 0, length);
                    }
                }

            } catch (IOException ignored) {
            }
        });

        // 예시 입력 또는 테스트 케이스 입력 전달

        Thread writer = Thread.startVirtualThread(() -> {
            try (OutputStream stream = process.getOutputStream()) {

                byte[] inputBytes = (input == null ? "" : input)
                        .getBytes(StandardCharsets.UTF_8);

                stream.write(inputBytes);
                stream.flush();

            } catch (IOException e) {
                System.err.println(
                        "Docker 입력 전달 실패: " + e.getMessage());
            }
        });

        try {
            boolean finished = process.waitFor(
                    TIMEOUT_SECONDS,
                    TimeUnit.SECONDS);

            if (!finished || outputExceeded.get()) {
                process.destroyForcibly();

                cleanupContainer(containerName);

                if (outputExceeded.get()) {
                    return new ExecutionResult(
                            "OUTPUT_LIMIT",
                            "출력 크기 제한을 초과했습니다.");
                }

                return new ExecutionResult(
                        "TIME_LIMIT",
                        "실행 시간 제한을 초과했습니다.");
            }

            reader.join(1000);
            writer.join(1000);

            if (outputExceeded.get()) {
                cleanupContainer(containerName);

                return new ExecutionResult(
                        "OUTPUT_LIMIT",
                        "출력 크기 제한을 초과했습니다.");
            }

            String output;

            synchronized (buffer) {
                output = buffer.toString(
                        StandardCharsets.UTF_8);
            }

            if (process.exitValue() != 0) {
                return new ExecutionResult(
                        "RUNTIME_ERROR",
                        output);
            }

            return new ExecutionResult(
                    "SUCCESS",
                    output);

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();
            process.destroyForcibly();
            cleanupContainer(containerName);

            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "코드 실행이 중단되었습니다.");
        }
    }

    // 시간 초과 컨테이너 강제 정리
    private void cleanupContainer(String name) {

        try {
            Process cleanup = new ProcessBuilder(
                    "docker", "rm", "-f", name)
                    .redirectErrorStream(true)
                    .start();

            if (!cleanup.waitFor(3, TimeUnit.SECONDS)) {
                cleanup.destroyForcibly();
            }

        } catch (IOException e) {
            System.err.println(
                    "컨테이너 정리 실패: " + name);

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
