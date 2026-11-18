
import { useEffect, useMemo, useState } from "react";
import {
    BrainCircuit,
    Code2,
    Sparkles,
    Target,
    ArrowRight,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";

import { getMySubmissions } from "../api/submissionsApi.js";
import { getProblems } from "../api/problemsApi.js";

import "../styles/IndependentPractice.css";

// 학습 기록을 문제별로 정리
function analyzeProblems(problems, submissions) {
    const history = new Map();

    for (const submission of submissions) {
        const id = Number(submission.problemId);

        if (!history.has(id)) {
            history.set(id, {
                directTotal: 0,
                directAccepted: 0,
                aiTotal: 0,
                aiAccepted: 0,
            });
        }

        const record = history.get(id);
        const isAccepted = submission.status === "ACCEPTED";

        if (submission.learningMode === "DIRECT") {
            record.directTotal++;

            if (isAccepted) {
                record.directAccepted++;
            }
        }

        if (submission.learningMode === "AI") {
            record.aiTotal++;

            if (isAccepted) {
                record.aiAccepted++;
            }
        }
    }

    const recommendations = [];
    let completed = 0;

    for (const problem of problems) {
        if (problem.published === false) continue;

        const record = history.get(Number(problem.id)) || {
            directTotal: 0,
            directAccepted: 0,
            aiTotal: 0,
            aiAccepted: 0,
        };

        // 직접 코딩으로 이미 해결했다면 복습 완료
        if (record.directAccepted > 0) {
            completed++;
            continue;
        }

        let priority = 0;
        let type = "";
        let reason = "";

        if (record.aiAccepted > 0) {
            priority = 100;
            type = "AI 없이 다시 풀기";
            reason =
                "AI를 활용해 해결한 문제입니다. 이번에는 AI 도움 없이 직접 정답을 만들어 보세요.";
        } else if (record.directTotal > 0) {
            priority = 80;
            type = "직접 코딩 재도전";
            reason =
                "직접 코딩으로 시도했지만 아직 정답을 제출하지 못했습니다. 다시 도전해 보세요.";
        } else if (record.aiTotal > 0) {
            priority = 60;
            type = "AI 학습 후 직접 풀기";
            reason =
                "AI를 활용해 학습했지만 아직 정답 기록이 없습니다. 직접 코드를 작성해 보세요.";
        } else {
            priority = 20;
            type = "새로운 문제";
            reason =
                "아직 학습 기록이 없는 문제입니다. 처음부터 직접 풀어 보세요.";
        }

        recommendations.push({
            ...problem,
            priority,
            type,
            reason,
            history: record,
        });
    }

    recommendations.sort((a, b) => {
        if (b.priority !== a.priority) {
            return b.priority - a.priority;
        }

        return Number(a.id) - Number(b.id);
    });

    return {
        recommendations,
        completed,
    };
}

export default function IndependentPractice() {
    const [problems, setProblems] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [filter, setFilter] = useState("all");

    const load = async () => {
        setLoading(true);
        setError("");

        try {
            const [problemData, submissionData] =
                await Promise.all([
                    getProblems(),
                    getMySubmissions(),
                ]);

            setProblems(
                Array.isArray(problemData) ? problemData : []
            );

            setSubmissions(
                Array.isArray(submissionData)
                    ? submissionData
                    : []
            );
        } catch (err) {
            setError(
                err.message || "추천 문제를 불러오지 못했습니다."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let active = true;

        async function initialize() {
            try {
                const [problemData, submissionData] =
                    await Promise.all([
                        getProblems(),
                        getMySubmissions(),
                    ]);

                if (!active) return;

                setProblems(
                    Array.isArray(problemData) ? problemData : []
                );

                setSubmissions(
                    Array.isArray(submissionData)
                        ? submissionData
                        : []
                );
            } catch (err) {
                if (active) {
                    setError(err.message || "추천 조회 실패");
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
        () => analyzeProblems(problems, submissions),
        [problems, submissions]
    );

    const categories = useMemo(
        () => [
            ...new Set(
                analysis.recommendations
                    .map((item) => item.category)
                    .filter(Boolean)
            ),
        ],
        [analysis]
    );

    const filtered = useMemo(() => {
        const items = analysis.recommendations.filter(
            (item) =>
                filter === "all" || item.category === filter
        );

        return items.slice(0, 5);
    }, [analysis, filter]);

    const aiReviewCount = analysis.recommendations.filter(
        (item) => item.history.aiAccepted > 0
    ).length;

    return (
        <section className="independent-practice">
            <div className="independent-heading">
                <div>
                    <span className="independent-eyebrow">
                        INDEPENDENT PRACTICE
                    </span>

                    <h2>
                        <BrainCircuit size={24} />
                        AI 없이 다시 풀기
                    </h2>

                    <p>
                        AI 도움을 받았던 문제를 스스로 해결하면서
                        학습한 내용을 점검해 보세요.
                    </p>
                </div>

                <button
                    type="button"
                    className="independent-refresh"
                    onClick={load}
                    disabled={loading}
                >
                    <RefreshCw size={16} />
                    새로고침
                </button>
            </div>

            {loading ? (
                <div className="independent-message">
                    학습 기록을 분석하고 있습니다...
                </div>
            ) : error ? (
                <div className="independent-message" role="alert">
                    <AlertCircle size={20} />
                    <p>{error}</p>
                    <button type="button" onClick={load}>
                        다시 시도
                    </button>
                </div>
            ) : (
                <>
                    <div className="independent-summary">
                        <div className="independent-summary-card">
                            <Sparkles size={21} />

                            <span>AI 정답 후 직접 복습 대기</span>

                            <strong>{aiReviewCount}개</strong>
                        </div>

                        <div className="independent-summary-card">
                            <CheckCircle2 size={21} />

                            <span>직접 코딩으로 해결</span>

                            <strong>{analysis.completed}개</strong>
                        </div>

                        <div className="independent-summary-card">
                            <Target size={21} />

                            <span>추천 가능한 문제</span>

                            <strong>
                                {analysis.recommendations.length}개
                            </strong>
                        </div>
                    </div>

                    <div className="independent-list-panel">
                        <div className="independent-list-header">
                            <div>
                                <h3>나에게 필요한 복습 문제</h3>
                                <p>
                                    AI 정답 후 미복습 문제를 우선 추천합니다.
                                </p>
                            </div>

                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                aria-label="문제 유형 선택"
                            >
                                <option value="all">전체 유형</option>

                                {categories.map((category) => (
                                    <option
                                        key={category}
                                        value={category}
                                    >
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {filtered.length === 0 ? (
                            <div className="independent-message">
                                해당 조건의 추천 문제가 없습니다.
                            </div>
                        ) : (
                            <div className="independent-list">
                                {filtered.map((problem, index) => (
                                    <article
                                        className="independent-card"
                                        key={problem.id}
                                    >
                                        <div className="independent-number">
                                            {String(index + 1).padStart(2, "0")}
                                        </div>

                                        <div className="independent-card-content">
                                            <div className="independent-tags">
                                                <span className="independent-type">
                                                    {problem.type}
                                                </span>

                                                <span>{problem.category}</span>
                                                <span>{problem.level}</span>
                                            </div>

                                            <h4>{problem.title}</h4>

                                            <p>{problem.reason}</p>

                                            <div className="independent-history">
                                                <span>
                                                    <Code2 size={14} />
                                                    직접 제출 {problem.history.directTotal}회
                                                </span>

                                                <span>
                                                    <Sparkles size={14} />
                                                    AI 제출 {problem.history.aiTotal}회
                                                </span>
                                            </div>
                                        </div>

                                        <a
                                            className="independent-start"
                                            href={`/problems/${problem.id}?mode=direct`}
                                        >
                                            직접 풀기
                                            <ArrowRight size={16} />
                                        </a>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>

                    <p className="independent-note">
                        기존 학습 기록 중 모드가 UNKNOWN인 제출은
                        모드별 성과 판단에서 제외됩니다.
                        AI 활용 기록이 없더라도 새로운 문제를 추천할 수 있습니다.
                    </p>
                </>
            )}
        </section>
    );
}
