
package com.aicoach.backend.service;

import com.aicoach.backend.entity.ProblemEntity;
import com.aicoach.backend.entity.ProblemTestCaseEntity;
import com.aicoach.backend.repository.ProblemRepository;
import com.aicoach.backend.repository.ProblemTestCaseRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class AIProblemStorageService {

    private static final Set<String> LEVELS = Set.of("EASY", "MEDIUM", "HARD");

    private static final List<String> LANGUAGES = AIProblemGenerationService.SUPPORTED_LANGUAGES;

    private static final int REQUIRED_TEST_CASES = 5;

    private static final int MAX_CODE_LENGTH = 12000;

    private final ProblemRepository problemRepository;

    private final ProblemTestCaseRepository testCaseRepository;

    private final JudgeService judgeService;

    public AIProblemStorageService(
            ProblemRepository problemRepository,
            ProblemTestCaseRepository testCaseRepository,
            JudgeService judgeService) {

        this.problemRepository = problemRepository;
        this.testCaseRepository = testCaseRepository;
        this.judgeService = judgeService;
    }

    // 문제 저장 및 검증 결과
    public record SaveResponse(
            Long problemId,
            String title,
            boolean published,
            String validationStatus,
            int passed,
            int total) {
    }

    // 다국어 정답 코드 검증 및 문제 저장
    @Transactional
    public SaveResponse saveVerifiedProblem(
            AIProblemGenerationService.GeneratedProblem generated) {

        // 생성된 문제 데이터 검증
        validateGeneratedData(generated);

        Map<String, String> solutions = generated.referenceSolutions();

        int totalPassed = 0;
        int totalTests = 0;

        System.out.println(
                "[AI VALIDATION] 문제 검증 시작: "
                        + generated.title());

        // 5개 언어의 정답 코드 Docker 검증
        for (String language : LANGUAGES) {

            String code = solutions.get(language);

            System.out.println(
                    "[AI VALIDATION] "
                            + language
                            + " 검증 시작");

            JudgeService.JudgeResult result = judgeService.validateGeneratedSolution(
                    language,
                    code,
                    generated.testCases());

            System.out.println(
                    "[AI VALIDATION] "
                            + language
                            + " / "
                            + result.status()
                            + " / "
                            + result.passed()
                            + "/"
                            + result.total());

            // 하나라도 검증 실패하면 DB 저장 중단
            if (!"ACCEPTED".equals(result.status()) ||
                    result.passed() != REQUIRED_TEST_CASES ||
                    result.total() != REQUIRED_TEST_CASES) {

                System.err.println(
                        "[AI VALIDATION] 검증 실패: "
                                + language
                                + " / "
                                + result.status());

                throw new ResponseStatusException(
                        HttpStatus.UNPROCESSABLE_ENTITY,
                        language
                                + " 정답 코드 검증 실패: "
                                + result.status()
                                + " ("
                                + result.passed()
                                + "/"
                                + result.total()
                                + ")");
            }

            totalPassed += result.passed();
            totalTests += result.total();
        }

        // 전체 테스트케이스 검증 확인
        int requiredTotal = LANGUAGES.size() * REQUIRED_TEST_CASES;

        if (totalPassed != requiredTotal ||
                totalTests != requiredTotal) {

            throw new ResponseStatusException(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "전체 언어의 정답 코드 검증에 실패했습니다.");
        }

        System.out.println(
                "[AI VALIDATION] 전체 언어 검증 완료: "
                        + totalPassed
                        + "/"
                        + totalTests);

        // 모든 검증을 통과한 문제만 저장
        ProblemEntity problem = new ProblemEntity(
                generated.title(),
                generated.level(),
                generated.category(),
                generated.time(),
                generated.description(),
                generated.input(),
                generated.output(),
                generated.hint());

        // 최초 저장 시 미공개 상태 유지
        problem.setPublished(false);

        ProblemEntity saved = problemRepository.saveAndFlush(problem);

        // 모든 언어가 공통으로 사용할 테스트케이스 저장
        for (AIProblemGenerationService.TestCase test : generated.testCases()) {

            ProblemTestCaseEntity entity = new ProblemTestCaseEntity(
                    saved.getId(),
                    test.input(),
                    test.expectedOutput());

            testCaseRepository.save(entity);
        }

        // DB 저장 완료 로그
        System.out.println(
                "[AI PROBLEM STORAGE] 문제 저장 성공");

        System.out.println(
                "[AI PROBLEM STORAGE] 문제 ID: "
                        + saved.getId());

        System.out.println(
                "[AI PROBLEM STORAGE] 제목: "
                        + saved.getTitle());

        System.out.println(
                "[AI PROBLEM STORAGE] 지원 언어: "
                        + LANGUAGES);

        System.out.println(
                "[AI PROBLEM STORAGE] 검증 결과: "
                        + totalPassed
                        + "/"
                        + totalTests);

        return new SaveResponse(
                saved.getId(),
                saved.getTitle(),
                saved.isPublished(),
                "ACCEPTED",
                totalPassed,
                totalTests);
    }

    // AI 생성 문제 데이터 유효성 검사
    private void validateGeneratedData(
            AIProblemGenerationService.GeneratedProblem p) {

        if (p == null) {

            throw badRequest(
                    "문제 데이터가 없습니다.");
        }

        // 문제 제목 검증
        if (p.title() == null ||
                p.title().isBlank() ||
                p.title().length() > 200) {

            throw badRequest(
                    "문제 제목이 올바르지 않습니다.");
        }

        // 난이도 검증
        if (p.level() == null ||
                !LEVELS.contains(p.level())) {

            throw badRequest(
                    "난이도가 올바르지 않습니다.");
        }

        // 알고리즘 유형 검증
        if (p.category() == null ||
                p.category().isBlank() ||
                p.category().length() > 100 ||
                p.category().contains("\n") ||
                p.category().contains("\r")) {

            throw badRequest(
                    "문제 유형이 올바르지 않습니다.");
        }

        // 예상 풀이 시간 검증
        if (p.time() < 1 ||
                p.time() > 180) {

            throw badRequest(
                    "예상 풀이 시간이 올바르지 않습니다.");
        }

        // 문제 설명 검증
        if (p.description() == null ||
                p.description().isBlank() ||
                p.description().length() > 10000) {

            throw badRequest(
                    "문제 설명이 올바르지 않습니다.");
        }

        // 예제 입출력 검증
        if (p.input() == null ||
                p.output() == null ||
                p.output().isBlank() ||
                p.input().length() > 16000 ||
                p.output().length() > 16000) {

            throw badRequest(
                    "예제 입출력이 올바르지 않습니다.");
        }

        // 힌트 검증
        if (p.hint() == null ||
                p.hint().length() > 3000) {

            throw badRequest(
                    "힌트가 올바르지 않습니다.");
        }

        // 언어별 정답 코드 검증
        validateReferenceSolutions(p);

        // 테스트케이스 검증
        validateTestCases(p);
    }

    // 5개 언어 정답 코드 유효성 검사
    private void validateReferenceSolutions(
            AIProblemGenerationService.GeneratedProblem p) {

        Map<String, String> solutions = p.referenceSolutions();

        if (solutions == null ||
                solutions.isEmpty()) {

            throw badRequest(
                    "언어별 정답 코드가 없습니다.");
        }

        // 지원 언어가 정확히 일치하는지 검사
        if (!solutions.keySet().equals(
                Set.copyOf(LANGUAGES))) {

            throw badRequest(
                    "Python, JavaScript, Java, C, C++ "
                            + "5개 언어의 정답 코드가 필요합니다.");
        }

        // 각 언어별 코드 검사
        for (String language : LANGUAGES) {

            String code = solutions.get(language);

            if (code == null ||
                    code.isBlank() ||
                    code.length() > MAX_CODE_LENGTH) {

                throw badRequest(
                        language
                                + " 정답 코드가 올바르지 않습니다.");
            }
        }

        // 기존 Python 정답 코드 호환성 검사
        if (p.referenceSolution() == null ||
                p.referenceSolution().isBlank() ||
                !p.referenceSolution().equals(
                        solutions.get("Python"))) {

            throw badRequest(
                    "Python 정답 코드가 일치하지 않습니다.");
        }
    }

    // 공통 테스트케이스 유효성 검사
    private void validateTestCases(
            AIProblemGenerationService.GeneratedProblem p) {

        List<AIProblemGenerationService.TestCase> cases = p.testCases();

        if (cases == null ||
                cases.size() != REQUIRED_TEST_CASES) {

            throw badRequest(
                    "테스트케이스는 정확히 5개여야 합니다.");
        }

        boolean exampleFound = false;

        Set<String> uniqueInputs = new HashSet<>();

        for (AIProblemGenerationService.TestCase test : cases) {

            // 테스트케이스 데이터 검사
            if (test == null ||
                    test.input() == null ||
                    test.expectedOutput() == null ||
                    test.input().length() > 16000 ||
                    test.expectedOutput().isBlank() ||
                    test.expectedOutput().length() > 16000) {

                throw badRequest(
                        "테스트케이스 입력 또는 출력이 "
                                + "올바르지 않습니다.");
            }

            String normalizedInput = normalize(test.input());

            String normalizedOutput = normalize(test.expectedOutput());

            // 중복 테스트케이스 검사
            if (!uniqueInputs.add(normalizedInput)) {

                throw badRequest(
                        "중복된 테스트케이스 입력이 존재합니다.");
            }

            // 문제 예제가 테스트케이스에 포함되는지 검사
            if (normalizedInput.equals(
                    normalize(p.input()))
                    && normalizedOutput.equals(
                            normalize(p.output()))) {

                exampleFound = true;
            }
        }

        if (!exampleFound) {

            throw badRequest(
                    "예제 입출력이 테스트케이스에 "
                            + "포함되지 않았습니다.");
        }
    }

    // 검증 및 저장된 문제 공개
    @Transactional
    public SaveResponse publishProblem(
            Long problemId) {

        if (problemId == null ||
                problemId <= 0) {

            throw badRequest(
                    "올바른 문제 ID가 필요합니다.");
        }

        ProblemEntity problem = problemRepository
                .findById(problemId)
                .orElseThrow(
                        () -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "문제를 찾을 수 없습니다."));

        // 저장된 테스트케이스 조회
        List<ProblemTestCaseEntity> cases = testCaseRepository
                .findByProblemIdOrderByIdAsc(
                        problemId);

        // 테스트케이스 개수 확인
        if (cases.size() != REQUIRED_TEST_CASES) {

            throw new ResponseStatusException(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "테스트케이스가 5개가 아닙니다.");
        }

        // 이미 공개된 문제 처리
        if (problem.isPublished()) {

            return new SaveResponse(
                    problem.getId(),
                    problem.getTitle(),
                    true,
                    "PUBLISHED",
                    cases.size(),
                    cases.size());
        }

        // 문제 공개 상태 변경
        problem.setPublished(true);

        problemRepository.save(problem);

        System.out.println(
                "[AI PROBLEM STORAGE] 문제 공개 완료");

        System.out.println(
                "[AI PROBLEM STORAGE] 문제 ID: "
                        + problem.getId());

        System.out.println(
                "[AI PROBLEM STORAGE] 제목: "
                        + problem.getTitle());

        return new SaveResponse(
                problem.getId(),
                problem.getTitle(),
                true,
                "PUBLISHED",
                cases.size(),
                cases.size());
    }

    // 입출력 비교를 위한 줄바꿈 정규화
    private String normalize(String value) {

        if (value == null) {
            return "";
        }

        return value
                .replace("\r\n", "\n")
                .replace("\r", "\n")
                .stripTrailing();
    }

    // 잘못된 문제 데이터 요청 처리
    private ResponseStatusException badRequest(
            String reason) {

        return new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                reason);
    }
}
