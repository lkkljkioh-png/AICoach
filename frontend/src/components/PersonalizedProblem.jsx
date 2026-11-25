import { useEffect, useState } from "react";
import {
    Sparkles,
    BrainCircuit,
    AlertCircle,
    CheckCircle2,
    RefreshCw,
    BookOpen,
    ArrowRight,
} from "lucide-react";

import {
    generatePersonalizedProblem,
    getMyPersonalizedProblems,
    getPersonalizedProblemQuota,
} from "../api/personalizedProblemApi.js";

import "../styles/PersonalizedProblem.css";
import PersonalProblemManager from "./PersonalProblemManager.jsx";

const MAX_PERSONAL_PROBLEMS = 30;

const LEVEL_LABELS = {
    EASY: "쉬움",
    MEDIUM: "보통",
    HARD: "어려움",
};

const CATEGORIES = [
    "구현",
    "문자열",
    "배열",
    "정렬",
    "완전 탐색",
    "그리디",
    "스택과 큐",
    "해시",
    "이분 탐색",
    "그래프 탐색",
    "DFS/BFS",
    "동적 계획법",
];

export default function PersonalizedProblem({
    showManager = true,
}) {
    const [mode, setMode] = useState("AUTO");
    const [level, setLevel] = useState("EASY");
    const [category, setCategory] = useState("구현");

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [myProblems, setMyProblems] = useState([]);
    const [listLoading, setListLoading] = useState(true);
    const [listError, setListError] = useState("");
    const [quotaError, setQuotaError] = useState("");

    const [unlimited, setUnlimited] = useState(false);
    const [maxProblems, setMaxProblems] = useState(
        MAX_PERSONAL_PROBLEMS
    );

    const problem = result?.problem;
    const savedProblem = result?.savedProblem;

    // 보관함에 있는 문제는 저장 공간 집계에서 제외
    const problemCount = myProblems.filter(
        (problem) => !problem.archived
    ).length;

    const remainingCount = Math.max(
        maxProblems - problemCount,
        0
    );

    const limitReached =
        !unlimited && problemCount >= maxProblems;

    const storageError = listError || quotaError;

    // 기존 개인 문제와 저장 한도 조회
    useEffect(() => {
        let active = true;

        async function loadMyProblems() {
            setListLoading(true);
            setListError("");
            setQuotaError("");

            const [listResult, quotaResult] =
                await Promise.allSettled([
                    getMyPersonalizedProblems(),
                    getPersonalizedProblemQuota(),
                ]);

            if (!active) return;

            // 개인 문제 목록 저장
            if (listResult.status === "fulfilled") {
                const data = listResult.value;

                if (Array.isArray(data)) {
                    setMyProblems(data);
                } else {
                    setListError(
                        "문제 목록 응답 형식이 올바르지 않습니다."
                    );
                }
            } else {
                setListError(
                    listResult.reason?.message ||
                    "개인 문제 조회에 실패했습니다."
                );
            }

            // 관리자 권한 및 저장 한도 저장
            if (quotaResult.status === "fulfilled") {
                const quota = quotaResult.value;

                setUnlimited(quota.unlimited === true);

                setMaxProblems(
                    Number.isInteger(quota.maxProblems) &&
                        quota.maxProblems > 0
                        ? quota.maxProblems
                        : MAX_PERSONAL_PROBLEMS
                );
            } else {
                setUnlimited(false);

                setQuotaError(
                    quotaResult.reason?.message ||
                    "저장 한도 조회에 실패했습니다."
                );
            }

            setListLoading(false);
        }

        loadMyProblems();

        return () => {
            active = false;
        };
    }, []);

    // 생성 방식 변경
    const handleModeChange = (nextMode) => {
        if (loading) return;

        setMode(nextMode);
        setError("");
        setResult(null);
    };

    // AI 문제 생성 및 DB 자동 저장
    const handleGenerate = async () => {
        if (loading || listLoading) return;

        if (storageError) {
            setError(
                "저장 공간을 확인하지 못했습니다. " +
                "페이지를 새로고침해 주세요."
            );
            return;
        }

        if (limitReached) {
            setError(
                `개인 AI 문제는 최대 ${maxProblems}개까지 ` +
                "저장할 수 있습니다. " +
                "내 문제 탭에서 기존 문제를 정리해 주세요."
            );
            return;
        }

        setLoading(true);
        setError("");
        setResult(null);

        try {
            const options =
                mode === "MANUAL"
                    ? {
                        mode: "MANUAL",
                        level,
                        category,
                    }
                    : {
                        mode: "AUTO",
                    };

            const data =
                await generatePersonalizedProblem(options);

            if (!data?.problem ||
                !data?.savedProblem?.problemId) {

                throw new Error(
                    "문제 저장 결과가 올바르지 않습니다."
                );
            }

            if (
                data.savedProblem.validationStatus !==
                "ACCEPTED"
            ) {
                throw new Error(
                    "Docker 검증이 완료되지 않았습니다."
                );
            }

            setResult(data);

            // 생성 후 DB에 저장된 목록 재조회
            try {
                const updated =
                    await getMyPersonalizedProblems();

                if (!Array.isArray(updated)) {
                    throw new Error(
                        "문제 목록 응답 형식이 올바르지 않습니다."
                    );
                }

                setMyProblems(updated);
                setListError("");

            } catch (listErr) {
                setListError(
                    "문제는 저장되었지만 목록을 " +
                    "갱신하지 못했습니다: " +
                    listErr.message
                );
            }

        } catch (err) {
            setError(
                err.message ||
                "문제 생성에 실패했습니다."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="personal-problem">

            <div className="personal-problem-header">
                <div className="personal-problem-icon">
                    <BrainCircuit size={25} />
                </div>

                <div>
                    <span>AI PERSONALIZED PRACTICE</span>
                    <h2>AI 맞춤 문제 생성</h2>

                    <p>
                        취약점 기반 자동 추천 또는
                        직접 설정으로 새로운 문제를 생성하세요.
                    </p>
                </div>
            </div>

            <div className="personal-problem-quota">
                <div className="personal-problem-quota-header">
                    <span>내 AI 문제 저장 공간</span>

                    <strong>
                        {listLoading
                            ? "조회 중..."
                            : listError
                                ? "조회 실패"
                                : quotaError
                                    ? `${problemCount}개`
                                    : unlimited
                                        ? `${problemCount}개 / 무제한`
                                        : `${problemCount} / ${maxProblems}개`}
                    </strong>
                </div>

                {!unlimited &&
                    !listLoading &&
                    !storageError && (
                        <div
                            className="personal-problem-quota-track"
                            role="progressbar"
                            aria-label="개인 AI 문제 저장 공간 사용량"
                            aria-valuenow={Math.min(
                                problemCount,
                                maxProblems
                            )}
                            aria-valuemin={0}
                            aria-valuemax={maxProblems}
                        >
                            <div
                                className="personal-problem-quota-fill"
                                style={{
                                    width: `${Math.min(
                                        problemCount /
                                        maxProblems * 100,
                                        100
                                    )}%`,
                                }}
                            />
                        </div>
                    )}

                <p>
                    {listLoading
                        ? "저장 공간 확인 중..."
                        : storageError
                            ? storageError
                            : unlimited
                                ? "관리자 계정은 제한 없이 AI 문제를 생성할 수 있습니다."
                                : limitReached
                                    ? "저장 공간이 가득 찼습니다."
                                    : `새로운 AI 문제를 ${remainingCount}개 더 생성할 수 있습니다.`}
                </p>
            </div>

            <div className="personal-problem-mode">
                <h3>문제 생성 방식</h3>

                <div className="personal-problem-mode-buttons">
                    <button
                        type="button"
                        className={
                            mode === "AUTO" ? "active" : ""
                        }
                        onClick={() =>
                            handleModeChange("AUTO")
                        }
                        disabled={loading}
                    >
                        <BrainCircuit size={18} />
                        AI 자동 추천
                    </button>

                    <button
                        type="button"
                        className={
                            mode === "MANUAL" ? "active" : ""
                        }
                        onClick={() =>
                            handleModeChange("MANUAL")
                        }
                        disabled={loading}
                    >
                        <BookOpen size={18} />
                        직접 설정
                    </button>
                </div>
            </div>

            {mode === "MANUAL" && (
                <div className="personal-problem-settings">
                    <div>
                        <label htmlFor="personal-level">
                            난이도
                        </label>

                        <select
                            id="personal-level"
                            value={level}
                            disabled={loading}
                            onChange={(event) => {
                                setLevel(event.target.value);
                                setResult(null);
                            }}
                        >
                            <option value="EASY">
                                쉬움
                            </option>

                            <option value="MEDIUM">
                                보통
                            </option>

                            <option value="HARD">
                                어려움
                            </option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="personal-category">
                            알고리즘 유형
                        </label>

                        <select
                            id="personal-category"
                            value={category}
                            disabled={loading}
                            onChange={(event) => {
                                setCategory(
                                    event.target.value
                                );
                                setResult(null);
                            }}
                        >
                            {CATEGORIES.map((item) => (
                                <option
                                    key={item}
                                    value={item}
                                >
                                    {item}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {!result && !loading && (
                <div className="personal-problem-intro">
                    <Sparkles size={32} />

                    <h3>
                        새로운 코딩 문제를 생성해 볼까요?
                    </h3>

                    <p>
                        {mode === "AUTO"
                            ? "학습 기록을 분석해 새로운 문제를 생성합니다."
                            : `${LEVEL_LABELS[level]} 난이도 · ${category}`}
                    </p>
                </div>
            )}

            {loading && (
                <div
                    className="personal-problem-loading"
                    role="status"
                >
                    <RefreshCw
                        size={29}
                        className="personal-problem-spin"
                    />

                    <strong>
                        AI 문제 생성 및 검증 중
                    </strong>

                    <p>
                        Gemini 문제 생성, Docker 정답 검증,
                        MySQL 저장을 진행하고 있습니다.
                    </p>
                </div>
            )}

            {error && (
                <div
                    className="personal-problem-error"
                    role="alert"
                >
                    <AlertCircle size={19} />
                    <span>{error}</span>
                </div>
            )}

            {problem && savedProblem && (
                <div className="personal-problem-result">
                    <div className="personal-problem-success">
                        <CheckCircle2 size={19} />
                        생성 및 DB 저장 완료
                    </div>

                    <div className="personal-problem-tags">
                        <span>
                            {LEVEL_LABELS[problem.level] ||
                                problem.level}
                        </span>

                        <span>{problem.category}</span>
                        <span>약 {problem.time}분</span>
                    </div>

                    <h3>{problem.title}</h3>

                    <div className="personal-problem-insight">
                        <strong>문제 생성 정보</strong>
                        <p>{result.insight}</p>
                    </div>

                    <div className="personal-problem-section">
                        <h4>
                            <BookOpen size={17} />
                            문제 설명
                        </h4>

                        <p>{problem.description}</p>
                    </div>

                    <div className="personal-problem-examples">
                        <div>
                            <h4>예제 입력</h4>

                            <pre>
                                {problem.input ||
                                    "(입력 없음)"}
                            </pre>
                        </div>

                        <div>
                            <h4>예제 출력</h4>
                            <pre>{problem.output}</pre>
                        </div>
                    </div>

                    <details className="personal-problem-hint">
                        <summary>힌트 보기</summary>

                        <p>
                            {problem.hint ||
                                "힌트가 없습니다."}
                        </p>
                    </details>

                    <div className="personal-problem-saved">
                        <p>
                            Docker 테스트
                            {" "}
                            {savedProblem.passed}
                            /{savedProblem.total} 통과
                            {" · "}
                            DB 저장 완료
                        </p>

                        <a
                            className="personal-problem-button"
                            href={`/problems/${savedProblem.problemId}`}
                        >
                            문제 풀기
                            <ArrowRight size={18} />
                        </a>
                    </div>
                </div>
            )}

            <button
                type="button"
                className="personal-problem-button"
                onClick={handleGenerate}
                disabled={
                    loading ||
                    listLoading ||
                    limitReached ||
                    Boolean(storageError)
                }
            >
                {loading ? (
                    <RefreshCw
                        size={18}
                        className="personal-problem-spin"
                    />
                ) : (
                    <Sparkles size={18} />
                )}

                {loading
                    ? "생성 · 검증 · 저장 중..."
                    : listLoading
                        ? "저장 공간 확인 중..."
                        : storageError
                            ? "저장 공간 확인 실패"
                            : limitReached
                                ? "AI 문제 저장 공간 부족"
                                : result
                                    ? "새로운 문제 다시 생성하기"
                                    : "AI 문제 생성하기"}
            </button>

            {showManager && (
                <PersonalProblemManager
                    refreshKey={
                        savedProblem?.problemId ?? 0
                    }
                />
            )}
        </section>
    );
}