
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

        private static final int DEFAULT_TIMEOUT = 5;
        private static final int COMPILE_TIMEOUT = 20;

        private static final Set<String> LANGUAGES = Set.of(
                        "Python",
                        "JavaScript",
                        "Java",
                        "C",
                        "C++");

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

        // 코드 및 언어 검증
        private void validate(String language, String code) {

                if (language == null || !LANGUAGES.contains(language)) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "지원하지 않는 프로그래밍 언어입니다.");
                }

                if (code == null || code.isBlank()
                                || code.length() > MAX_CODE_LENGTH) {

                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "코드를 입력하세요. 최대 12000자입니다.");
                }
        }

        // 실행하기: 예제 입력으로 실행
        public JudgeResult run(
                        Long problemId,
                        String language,
                        String code) {

                validate(language, code);

                ProblemEntity problem = problemService.getProblem(problemId);

                ExecutionResult result = executeCode(
                                language,
                                code,
                                problem.getInput());

                return new JudgeResult(
                                result.status(),
                                result.output(),
                                0,
                                0);
        }

        // 제출하기: 테스트 케이스 채점
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
                                        HttpStatus.UNPROCESSABLE_CONTENT,
                                        "테스트 케이스가 등록되지 않았습니다.");
                }

                if (cases.size() > MAX_TEST_CASES) {
                        throw new ResponseStatusException(
                                        HttpStatus.UNPROCESSABLE_CONTENT,
                                        "테스트 케이스가 너무 많습니다.");
                }

                int passed = 0;
                int total = cases.size();

                for (ProblemTestCaseEntity test : cases) {

                        ExecutionResult result = executeCode(
                                        language,
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
                        String expected = normalize(test.getExpectedOutput());

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

        // AI가 생성한 정답 코드를 테스트케이스에 실행하여 검증
        public JudgeResult validateGeneratedPython(
                        String code,
                        List<AIProblemGenerationService.TestCase> cases) {

                validate("Python", code);

                if (cases == null ||
                                cases.size() != 5) {
                        throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "테스트케이스는 정확히 5개여야 합니다.");
                }

                int passed = 0;
                int total = cases.size();

                for (int i = 0; i < cases.size(); i++) {

                        AIProblemGenerationService.TestCase test = cases.get(i);

                        if (test == null ||
                                        test.input() == null ||
                                        test.expectedOutput() == null ||
                                        test.input().length() > 16000 ||
                                        test.expectedOutput().length() > 16000) {

                                throw new ResponseStatusException(
                                                HttpStatus.BAD_REQUEST,
                                                "테스트케이스 형식이 올바르지 않습니다.");
                        }

                        ExecutionResult result = executeCode(
                                        "Python",
                                        code,
                                        test.input());

                        if (!"SUCCESS".equals(result.status())) {
                                return new JudgeResult(
                                                result.status(),
                                                (i + 1) + "번 테스트 실행 실패: "
                                                                + result.output(),
                                                passed,
                                                total);
                        }

                        String actual = normalize(result.output());

                        String expected = normalize(
                                        test.expectedOutput());

                        if (!actual.equals(expected)) {
                                return new JudgeResult(
                                                "WRONG_ANSWER",
                                                (i + 1)
                                                                + "번 테스트에서 예상 출력과 실제 출력이 다릅니다.",
                                                passed,
                                                total);
                        }

                        passed++;
                }

                return new JudgeResult(
                                "ACCEPTED",
                                "AI 정답 코드가 모든 테스트케이스를 통과했습니다.",
                                passed,
                                total);
        }

        // 출력 결과 비교용 정규화
        private String normalize(String value) {

                if (value == null) {
                        return "";
                }

                return value
                                .replace("\r\n", "\n")
                                .replace("\r", "\n")
                                .stripTrailing();
        }

        // 언어별 Docker 실행 명령 생성
        private List<String> buildDockerCommand(
                        String language,
                        String code,
                        String containerName) {

                String encodedCode = Base64.getEncoder()
                                .encodeToString(
                                                code.getBytes(StandardCharsets.UTF_8));

                List<String> command = new ArrayList<>(List.of(
                                "docker", "run",
                                "--rm",
                                "--name", containerName,
                                "--network", "none",
                                "--read-only",
                                "--cap-drop", "ALL",
                                "--security-opt", "no-new-privileges",
                                "--pids-limit", "64",
                                "--memory", "512m",
                                "--memory-swap", "512m",
                                "--cpus", "0.5",
                                "--user", "65534:65534",
                                "--tmpfs", "/tmp:rw,exec,nosuid,size=64m",
                                "-i"));

                switch (language) {

                        case "Python" -> {
                                String runner = "import base64,sys;"
                                                + "exec(compile(base64.b64decode(sys.argv[1]),"
                                                + "'<submission>','exec'))";

                                command.addAll(List.of(
                                                "python:3.12-alpine",
                                                "python", "-I", "-B", "-c",
                                                runner,
                                                encodedCode));
                        }

                        case "JavaScript" -> {
                                String runner = "eval(Buffer.from(process.argv[1],"
                                                + "'base64').toString('utf8'))";

                                command.addAll(List.of(
                                                "node:22-alpine",
                                                "node", "-e",
                                                runner,
                                                encodedCode));
                        }

                        case "Java" -> {
                                String runner = """
                                                printf '%s' "$1" | base64 -d > /tmp/Main.java || exit 42
                                                javac -encoding UTF-8 -d /tmp /tmp/Main.java || exit 42
                                                exec java -XX:ActiveProcessorCount=1 -Xmx128m -cp /tmp Main
                                                """;

                                command.addAll(List.of(
                                                "eclipse-temurin:21-jdk-alpine",
                                                "sh", "-c",
                                                runner,
                                                "sh",
                                                encodedCode));
                        }

                        case "C" -> {
                                String runner = """
                                                printf '%s' "$1" | base64 -d > /tmp/main.c || exit 42
                                                gcc -std=c17 -O0 -o /tmp/main /tmp/main.c || exit 42
                                                exec /tmp/main
                                                """;

                                command.addAll(List.of(
                                                "gcc:14",
                                                "sh", "-c",
                                                runner,
                                                "sh",
                                                encodedCode));
                        }

                        case "C++" -> {
                                String runner = """
                                                printf '%s' "$1" | base64 -d > /tmp/main.cpp || exit 42
                                                g++ -std=c++17 -O0 -o /tmp/main /tmp/main.cpp || exit 42
                                                exec /tmp/main
                                                """;

                                command.addAll(List.of(
                                                "gcc:14",
                                                "sh", "-c",
                                                runner,
                                                "sh",
                                                encodedCode));
                        }

                        default -> throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "지원하지 않는 언어입니다.");
                }

                return command;
        }

        // Docker에서 코드 실행
        private ExecutionResult executeCode(
                        String language,
                        String code,
                        String input) {

                String containerName = "aicoach-" + UUID.randomUUID();

                List<String> command = buildDockerCommand(
                                language,
                                code,
                                containerName);

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

                // 출력 수집
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

                // 표준 입력 전달
                Thread writer = Thread.startVirtualThread(() -> {

                        try (OutputStream stream = process.getOutputStream()) {

                                byte[] inputBytes = (input == null ? "" : input)
                                                .getBytes(StandardCharsets.UTF_8);

                                stream.write(inputBytes);
                                stream.flush();

                        } catch (IOException ignored) {
                        }
                });

                boolean compiledLanguage = Set.of(
                                "Java", "C", "C++").contains(language);

                int timeout = compiledLanguage
                                ? COMPILE_TIMEOUT
                                : DEFAULT_TIMEOUT;

                try {
                        boolean finished = process.waitFor(
                                        timeout,
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
                                output = buffer.toString(StandardCharsets.UTF_8);
                        }

                        int exitCode = process.exitValue();

                        if (compiledLanguage && exitCode == 42) {
                                return new ExecutionResult(
                                                "COMPILE_ERROR",
                                                output);
                        }

                        if (exitCode != 0) {
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

        // 비정상 종료 시 Docker 컨테이너 정리
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
