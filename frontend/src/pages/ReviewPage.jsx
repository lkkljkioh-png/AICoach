
import { useEffect, useMemo, useState } from "react";
import {
    BookOpenCheck,
    CheckCircle2,
    AlertCircle,
    RotateCcw,
    ArrowRight,
    Search,
    BrainCircuit,
} from "lucide-react";

import Header from "../components/Header.jsx";
import { getCurrentUser } from "../api/authApi.js";
import { getMySubmissions } from "../api/submissionsApi.js";
import { getProblems } from "../api/problemsApi.js";
import "../styles/ReviewPage.css";
import ReviewAIAnalysis from "../components/ReviewAIAnalysis.jsx";

const STATUS_LABELS = {
    ACCEPTED: "정답",
    WRONG_ANSWER: "오답",
    RUNTIME_ERROR: "실행 오류",
    COMPILE_ERROR: "컴파일 오류",
    TIME_LIMIT: "시간 초과",
    TIME_LIMIT_EXCEEDED: "시간 초과",
    OUTPUT_LIMIT: "출력 제한 초과",
};

function getReviewItems(submissions, problems) {
    const problemTitles = new Map(
        problems.map((problem) => [String(problem.id), problem.title])
    );

    const groups = new Map();

    const sorted = [...submissions].sort((a, b) => {
        const dateA = Date.parse(a.submittedAt || "") || 0;
        const dateB = Date.parse(b.submittedAt || "") || 0;

        return dateA - dateB || Number(a.id) - Number(b.id);
    });

    for (const submission of sorted) {
        if (submission.problemId == null) continue;

        const language = submission.language || "Python";
        const key = `${submission.problemId}:${language}`;

        if (!groups.has(key)) {
            groups.set(key, {
                problemId: submission.problemId,
                language,
                title:
                    problemTitles.get(String(submission.problemId)) ||
                    `문제 #${submission.problemId}`,
                attempts: 0,
                failures: 0,
                latestStatus: "",
                lastSubmittedAt: "",
                latestFailedSubmissionId: null,
            });
        }

        const group = groups.get(key);

        group.attempts += 1;

        if (
            submission.status &&
            submission.status !== "ACCEPTED"
        ) {
            group.failures += 1;
            group.latestFailedSubmissionId = submission.id;
        }

        group.latestStatus = submission.status;
        group.lastSubmittedAt = submission.submittedAt;
    }

    return [...groups.values()]
        .filter((item) => item.failures > 0)
        .map((item) => ({
            ...item,
            completed: item.latestStatus === "ACCEPTED",
        }))
        .sort((a, b) => {
            if (a.completed !== b.completed) {
                return Number(a.completed) - Number(b.completed);
            }

            return (
                (Date.parse(b.lastSubmittedAt || "") || 0) -
                (Date.parse(a.lastSubmittedAt || "") || 0)
            );
        });
}

export default function ReviewPage() {
    const [submissions, setSubmissions] = useState([]);
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notLoggedIn, setNotLoggedIn] = useState(false);

    const [filter, setFilter] = useState("ALL");
    const [language, setLanguage] = useState("ALL");
    const [search, setSearch] = useState("");

    const [selectedSubmissionId, setSelectedSubmissionId] =
        useState(null);

    useEffect(() => {
        let active = true;

        async function load() {
            try {
                const user = await getCurrentUser();

                if (!active) return;

                if (!user) {
                    setNotLoggedIn(true);
                    return;
                }

                const [records, problemList] = await Promise.all([
                    getMySubmissions(),
                    getProblems(),
                ]);

                if (!active) return;

                setSubmissions(Array.isArray(records) ? records : []);
                setProblems(Array.isArray(problemList) ? problemList : []);
            } catch (err) {
                if (!active) return;

                if (err.status === 401) {
                    setNotLoggedIn(true);
                } else {
                    setError(err.message || "복습 기록 조회 실패");
                }
            } finally {
                if (active) setLoading(false);
            }
        }

        load();

        return () => {
            active = false;
        };
    }, []);

    const reviewItems = useMemo(
        () => getReviewItems(submissions, problems),
        [submissions, problems]
    );

    const stats = useMemo(() => {
        const completed = reviewItems.filter(
            (item) => item.completed
        ).length;

        return {
            total: reviewItems.length,
            completed,
            pending: reviewItems.length - completed,
            rate: reviewItems.length
                ? Math.round((completed / reviewItems.length) * 100)
                : 0,
        };
    }, [reviewItems]);

    const languages = useMemo(
        () => [
            "ALL",
            ...new Set(reviewItems.map((item) => item.language)),
        ],
        [reviewItems]
    );

    const filtered = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return reviewItems.filter((item) => {
            if (filter === "PENDING" && item.completed) return false;
            if (filter === "COMPLETED" && !item.completed) return false;
            if (language !== "ALL" && item.language !== language) {
                return false;
            }

            return item.title.toLowerCase().includes(keyword);
        });
    }, [reviewItems, filter, language, search]);

    return (
        <>
            <Header />

            <main className="review-page">
                <div className="review-container">
                    <div className="review-heading">
                        <span className="review-eyebrow">
                            PERSONAL REVIEW
                        </span>

                        <h1>
                            <BookOpenCheck size={30} />
                            오답 복습
                        </h1>

                        <p>
                            틀렸던 문제를 다시 풀고,
                            나의 학습 성장을 확인해 보세요.
                        </p>
                    </div>

                    {loading ? (
                        <div className="review-empty">
                            복습 기록을 불러오는 중입니다...
                        </div>
                    ) : notLoggedIn ? (
                        <div className="review-empty">
                            <h2>로그인이 필요합니다</h2>
                            <p>로그인 후 나의 오답 기록을 확인할 수 있어요.</p>
                            <a href="/login">로그인하기</a>
                        </div>
                    ) : error ? (
                        <div className="review-empty" role="alert">
                            <h2>기록을 불러오지 못했어요</h2>
                            <p>{error}</p>
                            <button onClick={() => window.location.reload()}>
                                다시 시도
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="review-stats">
                                <div className="review-stat">
                                    <BookOpenCheck size={22} />
                                    <span>전체 복습 대상</span>
                                    <strong>{stats.total}개</strong>
                                </div>

                                <div className="review-stat">
                                    <AlertCircle size={22} />
                                    <span>복습 필요</span>
                                    <strong>{stats.pending}개</strong>
                                </div>

                                <div className="review-stat">
                                    <CheckCircle2 size={22} />
                                    <span>복습 완료</span>
                                    <strong>{stats.completed}개</strong>
                                </div>

                                <div className="review-stat">
                                    <RotateCcw size={22} />
                                    <span>복습 완료율</span>
                                    <strong>{stats.rate}%</strong>
                                </div>
                            </div>

                            <section className="review-panel">
                                <div className="review-panel-heading">
                                    <div>
                                        <h2>나의 복습 목록</h2>
                                        <p>문제와 언어별 최신 채점 결과를 기준으로 표시합니다.</p>
                                    </div>

                                    <span>{filtered.length}개 문제</span>
                                </div>

                                <div className="review-filters">
                                    <label className="review-search">
                                        <Search size={18} />
                                        <input
                                            type="search"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="문제 검색"
                                        />
                                    </label>

                                    <select
                                        aria-label="복습 상태"
                                        value={filter}
                                        onChange={(e) => setFilter(e.target.value)}
                                    >
                                        <option value="ALL">전체 상태</option>
                                        <option value="PENDING">복습 필요</option>
                                        <option value="COMPLETED">복습 완료</option>
                                    </select>

                                    <select
                                        aria-label="프로그래밍 언어"
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                    >
                                        {languages.map((item) => (
                                            <option key={item} value={item}>
                                                {item === "ALL" ? "전체 언어" : item}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {filtered.length === 0 ? (
                                    <div className="review-empty">
                                        <BookOpenCheck size={34} />
                                        <h3>표시할 복습 문제가 없어요</h3>
                                        <p>문제를 제출하거나 필터를 변경해 보세요.</p>
                                        <a href="/problems">문제 풀러 가기</a>
                                    </div>
                                ) : (
                                    <div className="review-list">
                                        {filtered.map((item) => (
                                            <article
                                                className="review-item"
                                                key={`${item.problemId}:${item.language}`}
                                            >
                                                <div className="review-item-info">
                                                    <span
                                                        className={
                                                            item.completed
                                                                ? "review-status completed"
                                                                : "review-status pending"
                                                        }
                                                    >
                                                        {item.completed
                                                            ? "복습 완료"
                                                            : "복습 필요"}
                                                    </span>

                                                    <h3>{item.title}</h3>

                                                    <div className="review-meta">
                                                        <span>{item.language}</span>
                                                        <span>제출 {item.attempts}회</span>
                                                        <span>실패 {item.failures}회</span>
                                                        <span>
                                                            최근 결과:{" "}
                                                            {STATUS_LABELS[item.latestStatus] ||
                                                                item.latestStatus}
                                                        </span>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    className="review-ai-button"
                                                    onClick={() =>
                                                        setSelectedSubmissionId(
                                                            item.latestFailedSubmissionId
                                                        )
                                                    }
                                                    disabled={!item.latestFailedSubmissionId}
                                                >
                                                    <BrainCircuit size={17} />
                                                    AI 오답 분석
                                                </button>

                                                <a
                                                    className="review-solve-link"
                                                    href={`/problems/${item.problemId}?language=${encodeURIComponent(item.language)}&mode=direct`}
                                                >
                                                    {item.completed ? "다시 풀기" : "복습하기"}
                                                    <ArrowRight size={17} />
                                                </a>
                                            </article>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </>
                    )}
                </div>
            </main>

            {selectedSubmissionId !== null && (
                <ReviewAIAnalysis
                    submissionId={selectedSubmissionId}
                    onClose={() => setSelectedSubmissionId(null)}
                />
            )}

        </>
    );
}
