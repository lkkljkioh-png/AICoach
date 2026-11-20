
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
} from "../api/personalizedProblemApi.js";

import "../styles/PersonalizedProblem.css";
import PersonalProblemManager from "./PersonalProblemManager.jsx";

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

export default function PersonalizedProblem() {
    const [mode, setMode] = useState("AUTO");
    const [level, setLevel] = useState("EASY");
    const [category, setCategory] = useState("구현");

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [myProblems, setMyProblems] = useState([]);
    const [listLoading, setListLoading] = useState(true);
    const [listError, setListError] = useState("");

    const problem = result?.problem;
    const savedProblem = result?.savedProblem;

    // 기존에 저장한 개인 문제 불러오기
    useEffect(() => {
        let active = true;

        async function loadMyProblems() {
            try {
                const data =
                    await getMyPersonalizedProblems();

                if (active) {
                    setMyProblems(
                        Array.isArray(data) ? data : []
                    );
                }
            } catch (err) {
                if (active) {
                    setListError(err.message);
                }
            } finally {
                if (active) {
                    setListLoading(false);
                }
            }
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
        if (loading) return;

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

            if (!data?.problem || !data?.savedProblem?.problemId) {
                throw new Error(
                    "문제 저장 결과가 올바르지 않습니다."
                );
            }

            if (data.savedProblem.validationStatus !== "ACCEPTED") {
                throw new Error(
                    "Docker 검증이 완료되지 않았습니다."
                );
            }

            setResult(data);

            // 생성 후 실제 DB에 저장된 목록 재조회
            try {
                const updated =
                    await getMyPersonalizedProblems();

                setMyProblems(
                    Array.isArray(updated) ? updated : []
                );
                setListError("");
            } catch (listErr) {
                setListError(
                    "문제는 저장되었지만 목록을 갱신하지 못했습니다: "
                    + listErr.message
                );
            }

        } catch (err) {
            setError(
                err.message || "문제 생성에 실패했습니다."
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

            <div className="personal-problem-mode">
                <h3>문제 생성 방식</h3>

                <div className="personal-problem-mode-buttons">
                    <button
                        type="button"
                        className={
                            mode === "AUTO" ? "active" : ""
                        }
                        onClick={() => handleModeChange("AUTO")}
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
                        onClick={() => handleModeChange("MANUAL")}
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
                            <option value="EASY">쉬움</option>
                            <option value="MEDIUM">보통</option>
                            <option value="HARD">어려움</option>
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
                                setCategory(event.target.value);
                                setResult(null);
                            }}
                        >
                            {CATEGORIES.map((item) => (
                                <option key={item} value={item}>
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
                                {problem.input || "(입력 없음)"}
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
                            {problem.hint || "힌트가 없습니다."}
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
                disabled={loading}
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
                    : result
                        ? "새로운 문제 다시 생성하기"
                        : "AI 문제 생성하기"}
            </button>

            <PersonalProblemManager
                refreshKey={savedProblem?.problemId ?? 0}
            />

        </section>
    );
}
