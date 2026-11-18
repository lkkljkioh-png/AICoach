
import { useEffect, useMemo, useState } from "react";
import {
    BrainCircuit,
    CheckCircle2,
    Clock3,
    Target,
    ArrowRight,
    RefreshCw,
    Sparkles,
    AlertCircle,
} from "lucide-react";

import { getMySubmissions } from "../api/submissionsApi.js";
import { getProblems } from "../api/problemsApi.js";

import "../styles/AILearningProgress.css";

// AI 정답 이후의 직접 코딩 기록 분석
function analyzeProgress(submissions, problems) {
    const grouped = new Map();

    for (const submission of submissions) {
        const problemId = Number(submission.problemId);

        if (!Number.isFinite(problemId)) continue;

        if (!grouped.has(problemId)) {
            grouped.set(problemId, []);
        }

        grouped.get(problemId).push(submission);
    }

    const problemMap = new Map(
        problems.map((problem) => [
            Number(problem.id),
            problem,
        ])
    );

    const results = [];

    for (const [problemId, records] of grouped) {
        const ordered = [...records].sort((a, b) => {
            const timeA = Date.parse(a.submittedAt || "");
            const timeB = Date.parse(b.submittedAt || "");

            const left = Number.isFinite(timeA) ? timeA : 0;
            const right = Number.isFinite(timeB) ? timeB : 0;

            return left - right || Number(a.id) - Number(b.id);
        });

        // AI 모드의 첫 정답 기록
        const firstAIIndex = ordered.findIndex(
            (item) =>
                item.learningMode === "AI" &&
                item.status === "ACCEPTED"
        );

        if (firstAIIndex < 0) continue;

        const firstAI = ordered[firstAIIndex];

        // AI 정답 이후에 제출한 직접 코딩 기록
        const directAttempts = ordered
            .slice(firstAIIndex + 1)
            .filter(
                (item) => item.learningMode === "DIRECT"
            );

        const successful = directAttempts.some(
            (item) => item.status === "ACCEPTED"
        );

        const problem = problemMap.get(problemId);

        const status = successful
            ? "SUCCESS"
            : directAttempts.length > 0
                ? "IN_PROGRESS"
                : "NOT_STARTED";

        results.push({
            problemId,
            title: problem?.title || `문제 #${problemId}`,
            category: problem?.category || "기타",
            level: problem?.level || "-",
            firstAIAt: firstAI.submittedAt,
            directAttempts: directAttempts.length,
            successful,
            status,
        });
    }

    // 복습 대기 문제를 먼저 배치
    const priority = {
        NOT_STARTED: 0,
        IN_PROGRESS: 1,
        SUCCESS: 2,
    };

    results.sort(
        (a, b) =>
            priority[a.status] - priority[b.status] ||
            a.problemId - b.problemId
    );

    const attempted = results.filter(
        (item) => item.directAttempts > 0
    ).length;

    const successful = results.filter(
        (item) => item.successful
    ).length;

    return {
        results,
        aiSolved: results.length,
        attempted,
        successful,
        pending: results.length - attempted,
        inProgress: attempted - successful,
        rate: attempted > 0
            ? Math.round((successful / attempted) * 100)
            : null,
    };
}

const STATUS_LABELS = {
    SUCCESS: "독립 해결 성공",
    IN_PROGRESS: "재도전 진행 중",
    NOT_STARTED: "직접 복습 필요",
};

export default function AILearningProgress() {
    const [submissions, setSubmissions] = useState([]);
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("ALL");

    const loadProgress = async () => {
        setLoading(true);
        setError("");

        try {
            const [submissionData, problemData] =
                await Promise.all([
                    getMySubmissions(),
                    getProblems(),
                ]);

            setSubmissions(
                Array.isArray(submissionData)
                    ? submissionData
                    : []
            );

            setProblems(
                Array.isArray(problemData)
                    ? problemData
                    : []
            );
        } catch (err) {
            setError(
                err.message || "학습 성과 조회에 실패했습니다."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let active = true;

        async function initialize() {
            try {
                const [submissionData, problemData] =
                    await Promise.all([
                        getMySubmissions(),
                        getProblems(),
                    ]);

                if (!active) return;

                setSubmissions(
                    Array.isArray(submissionData)
                        ? submissionData
                        : []
                );

                setProblems(
                    Array.isArray(problemData)
                        ? problemData
                        : []
                );
            } catch (err) {
                if (active) {
                    setError(
                        err.message || "학습 성과 조회에 실패했습니다."
                    );
                }
            } finally {
                if (active) setLoading(false);
            }
        }

        initialize();

        return () => {
            active = false;
        };
    }, []);

    const analysis = useMemo(
        () => analyzeProgress(submissions, problems),
        [submissions, problems]
    );

    const filteredResults = useMemo(() => {
        if (filter === "ALL") {
            return analysis.results;
        }

        return analysis.results.filter(
            (item) => item.status === filter
        );
    }, [analysis, filter]);

    return (
        <section className="ai-progress-section">
            <div className="ai-progress-heading">
                <div>
                    <span className="ai-progress-eyebrow">
                        LEARNING GROWTH
                    </span>

                    <h2>
                        <BrainCircuit size={24} />
                        AI 학습 후 독립 해결 분석
                    </h2>

                    <p>
                        AI로 해결했던 문제를 직접 다시 풀었을 때의
                        학습 성과를 확인합니다.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={loadProgress}
                    disabled={loading}
                    className="ai-progress-refresh"
                >
                    <RefreshCw size={16} />
                    새로고침
                </button>
            </div>

            {loading ? (
                <div className="ai-progress-message">
                    학습 기록을 분석하는 중입니다...
                </div>
            ) : error ? (
                <div className="ai-progress-message" role="alert">
                    <AlertCircle size={20} />
                    <p>{error}</p>
                    <button type="button" onClick={loadProgress}>
                        다시 시도
                    </button>
                </div>
            ) : (
                <>
                    <div className="ai-progress-stats">
                        <div className="ai-progress-stat">
                            <Sparkles size={20} />
                            <span>AI 활용 정답 문제</span>
                            <strong>{analysis.aiSolved}개</strong>
                        </div>

                        <div className="ai-progress-stat">
                            <Clock3 size={20} />
                            <span>직접 재도전한 문제</span>
                            <strong>{analysis.attempted}개</strong>
                        </div>

                        <div className="ai-progress-stat">
                            <CheckCircle2 size={20} />
                            <span>독립 해결 성공</span>
                            <strong>{analysis.successful}개</strong>
                        </div>

                        <div className="ai-progress-stat">
                            <Target size={20} />
                            <span>재도전 독립 해결률</span>
                            <strong>
                                {analysis.rate === null
                                    ? "-"
                                    : `${analysis.rate}%`}
                            </strong>
                        </div>
                    </div>

                    <div className="ai-progress-panel">
                        <div className="ai-progress-panel-header">
                            <div>
                                <h3>문제별 독립 해결 현황</h3>
                                <p>
                                    AI 정답 이후 직접 코딩한 기록을
                                    기준으로 계산합니다.
                                </p>
                            </div>

                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                aria-label="독립 해결 상태 필터"
                            >
                                <option value="ALL">전체 보기</option>
                                <option value="NOT_STARTED">
                                    복습 필요
                                </option>
                                <option value="IN_PROGRESS">
                                    재도전 중
                                </option>
                                <option value="SUCCESS">
                                    해결 성공
                                </option>
                            </select>
                        </div>

                        {filteredResults.length === 0 ? (
                            <div className="ai-progress-empty">
                                <BrainCircuit size={27} />
                                <p>
                                    {analysis.aiSolved === 0
                                        ? "아직 분석할 AI 정답 기록이 없습니다."
                                        : "해당 상태의 문제가 없습니다."}
                                </p>
                            </div>
                        ) : (
                            <div className="ai-progress-list">
                                {filteredResults.map((item) => (
                                    <article
                                        key={item.problemId}
                                        className="ai-progress-item"
                                    >
                                        <div className="ai-progress-item-main">
                                            <span
                                                className={`ai-progress-status ${item.status.toLowerCase()}`}
                                            >
                                                {STATUS_LABELS[item.status]}
                                            </span>

                                            <h4>{item.title}</h4>

                                            <div className="ai-progress-meta">
                                                <span>{item.category}</span>
                                                <span>{item.level}</span>
                                                <span>
                                                    직접 재도전 {item.directAttempts}회
                                                </span>
                                            </div>
                                        </div>

                                        <a
                                            href={`/problems/${item.problemId}?mode=direct`}
                                            className="ai-progress-link"
                                        >
                                            {item.successful
                                                ? "다시 풀기"
                                                : "직접 풀기"}
                                            <ArrowRight size={16} />
                                        </a>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>

                    <p className="ai-progress-note">
                        독립 해결률 = AI 정답 이후 직접 재도전한
                        문제 중 정답을 제출한 문제의 비율입니다.
                        복습하지 않은 문제는 분모에서 제외합니다.
                        실제 실력 향상이나 AI 사용 여부를 독립적으로
                        검증하는 지표는 아닙니다.
                    </p>
                </>
            )}
        </section>
    );
}
