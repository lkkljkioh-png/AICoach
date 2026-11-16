
package com.aicoach.backend.service;

import com.aicoach.backend.entity.ProblemEntity;
import com.aicoach.backend.entity.ProblemTestCaseEntity;
import com.aicoach.backend.repository.ProblemRepository;
import com.aicoach.backend.repository.ProblemTestCaseRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

@Service
public class AIProblemStorageService {

    private static final Set<String> LEVELS = Set.of("EASY", "MEDIUM", "HARD");

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

    public record SaveResponse(
            Long problemId,
            String title,
            boolean published,
            String validationStatus,
            int passed,
            int total) {
    }

    @Transactional
    public SaveResponse saveVerifiedProblem(
            AIProblemGenerationService.GeneratedProblem generated) {

        validateGeneratedData(generated);

        // 1. Docker로 정답 코드 검증
        JudgeService.JudgeResult result = judgeService.validateGeneratedPython(
                generated.referenceSolution(),
                generated.testCases());

        System.out.println("========== AI PROBLEM VALIDATION ==========");
        System.out.println("Status: " + result.status());
        System.out.println("Passed: " + result.passed());
        System.out.println("Total: " + result.total());
        System.out.println("Output: " + result.output());
        System.out.println("===========================================");

        // 2. 검증 실패 시 DB 저장 금지
        if (!"ACCEPTED".equals(result.status()) ||
                result.passed() != result.total()) {

            throw new ResponseStatusException(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "AI 문제 검증 실패: "
                            + result.status()
                            + " / "
                            + result.output());
        }

        // 3. 문제를 미공개 상태로 저장
        ProblemEntity problem = new ProblemEntity(
                generated.title(),
                generated.level(),
                generated.category(),
                generated.time(),
                generated.description(),
                generated.input(),
                generated.output(),
                generated.hint());

        problem.setPublished(false);

        ProblemEntity saved = problemRepository.saveAndFlush(problem);

        // 4. 테스트케이스 저장
        for (AIProblemGenerationService.TestCase test : generated.testCases()) {

            ProblemTestCaseEntity entity = new ProblemTestCaseEntity(
                    saved.getId(),
                    test.input(),
                    test.expectedOutput());

            testCaseRepository.save(entity);
        }

        return new SaveResponse(
                saved.getId(),
                saved.getTitle(),
                saved.isPublished(),
                result.status(),
                result.passed(),
                result.total());
    }

    private void validateGeneratedData(
            AIProblemGenerationService.GeneratedProblem p) {

        if (p == null) {
            throw badRequest("문제 데이터가 없습니다.");
        }

        if (p.title() == null ||
                p.title().isBlank() ||
                p.title().length() > 200) {
            throw badRequest("문제 제목이 올바르지 않습니다.");
        }

        if (p.level() == null ||
                !LEVELS.contains(p.level())) {
            throw badRequest("난이도가 올바르지 않습니다.");
        }

        if (p.category() == null ||
                p.category().isBlank() ||
                p.category().length() > 100) {
            throw badRequest("문제 유형이 올바르지 않습니다.");
        }

        if (p.time() < 1 || p.time() > 180) {
            throw badRequest("예상 풀이 시간이 올바르지 않습니다.");
        }

        if (p.description() == null ||
                p.description().isBlank() ||
                p.description().length() > 10000) {
            throw badRequest("문제 설명이 올바르지 않습니다.");
        }

        if (p.input() == null ||
                p.output() == null ||
                p.output().isBlank() ||
                p.input().length() > 16000 ||
                p.output().length() > 16000) {
            throw badRequest("예제 입출력이 올바르지 않습니다.");
        }

        if (p.hint() == null ||
                p.hint().length() > 3000) {
            throw badRequest("힌트가 올바르지 않습니다.");
        }

        if (p.referenceSolution() == null ||
                p.referenceSolution().isBlank() ||
                p.referenceSolution().length() > 12000) {
            throw badRequest("Python 정답 코드가 올바르지 않습니다.");
        }

        List<AIProblemGenerationService.TestCase> cases = p.testCases();

        if (cases == null || cases.size() != 5) {
            throw badRequest("테스트케이스는 5개여야 합니다.");
        }

        boolean exampleFound = false;

        for (AIProblemGenerationService.TestCase test : cases) {

            if (test == null ||
                    test.input() == null ||
                    test.expectedOutput() == null ||
                    test.input().length() > 16000 ||
                    test.expectedOutput().isBlank() ||
                    test.expectedOutput().length() > 16000) {
                throw badRequest(
                        "테스트케이스 입력 또는 출력이 올바르지 않습니다.");
            }

            if (normalize(test.input()).equals(normalize(p.input()))
                    && normalize(test.expectedOutput())
                            .equals(normalize(p.output()))) {
                exampleFound = true;
            }
        }

        if (!exampleFound) {
            throw badRequest(
                    "예제 입출력이 테스트케이스에 포함되지 않았습니다.");
        }
    }

    private String normalize(String value) {
        return value.replace("\r\n", "\n")
                .replace("\r", "\n")
                .stripTrailing();
    }

    private ResponseStatusException badRequest(String reason) {
        return new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                reason);
    }

    // =====================================
    // 검증 완료된 문제 공개
    // =====================================

    @Transactional
    public SaveResponse publishProblem(Long problemId) {

        ProblemEntity problem = problemRepository
                .findById(problemId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "문제를 찾을 수 없습니다."));

        // 저장된 테스트케이스가 있는지 확인
        List<ProblemTestCaseEntity> cases = testCaseRepository
                .findByProblemIdOrderByIdAsc(problemId);

        if (cases.size() != 5) {
            throw new ResponseStatusException(
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    "테스트케이스가 5개가 아닙니다.");
        }

        // 관리자 검증 저장 절차를 거친 문제만
        // 공개할 수 있도록 운영해야 함
        problem.setPublished(true);

        problemRepository.save(problem);

        return new SaveResponse(
                problem.getId(),
                problem.getTitle(),
                true,
                "PUBLISHED",
                cases.size(),
                cases.size());
    }

}
