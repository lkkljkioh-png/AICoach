
import { useEffect, useMemo, useState } from "react";
import {
    ArrowRight,
    BookOpen,
    CheckCircle2,
    Clock3,
    Code2,
    Target,
} from "lucide-react";

import Header from "../components/Header.jsx";
import { getCurrentUser } from "../api/authApi.js";
import { getProblems } from "../api/problemsApi.js";
import { getMySubmissions } from "../api/submissionsApi.js";

import "../styles/MyPage.css";

const STATUS_LABELS = {
    ACCEPTED: "정답",
    WRONG_ANSWER: "오답",
    TIME_LIMIT: "시간 초과",
    TIME_LIMIT_EXCEEDED: "시간 초과",
    RUNTIME_ERROR: "실행 오류",
    COMPILE_ERROR: "컴파일 오류",
    OUTPUT_LIMIT: "출력 초과",
};

function formatDate(dateString) {
    if (!dateString) return "-";

    const [date, time = ""] = dateString.split("T");

    return `${date} ${time.slice(0, 5)}`.trim();
}

export default function MyPage() {
    const [user, setUser] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notLoggedIn, setNotLoggedIn] = useState(false);

    useEffect(() => {
        let active = true;

        async function load() {
            try {
                const currentUser = await getCurrentUser();

                if (!currentUser) {
                    if (active) setNotLoggedIn(true);
                    return;
                }

                const [records, problemList] = await Promise.all([
                    getMySubmissions(),
                    getProblems(),
                ]);

                if (!active) return;

                setUser(currentUser);
                setSubmissions(records);
                setProblems(
                    Array.isArray(problemList) ? problemList : []
                );
            } catch (err) {
                if (!active) return;

                if (err.status === 401) {
                    setNotLoggedIn(true);
                } else {
                    setError(
                        err.message || "학습 기록을 불러오지 못했습니다."
                    );
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

    const stats = useMemo(() => {
        const accepted = submissions.filter(
            (item) => item.status === "ACCEPTED"
        );

        const solvedIds = new Set(
            accepted.map((item) => item.problemId)
        );

        const languageCounts = submissions.reduce(
            (counts, item) => {
                const language = item.language || "기타";

                counts[language] = (counts[language] || 0) + 1;

                return counts;
            },
            {}
        );

        const languages = Object.entries(languageCounts).sort(
            (a, b) => b[1] - a[1]
        );

        return {
            total: submissions.length,
            accepted: accepted.length,
            solved: solvedIds.size,
            rate: submissions.length
                ? Math.round(
                    (accepted.length / submissions.length) * 100
                )
                : 0,
            languages,
        };
    }, [submissions]);

    const titles = useMemo(
        () =>
            new Map(
                problems.map((item) => [item.id, item.title])
            ),
        [problems]
    );

    return (
        <>
            <Header />

            <main className="my-page">
                <div className="my-container">
                    <div className="my-heading">
                        <span className="my-eyebrow">
                            MY LEARNING
                        </span>

                        <h1>나의 학습 현황</h1>

                        <p>
                            {user
                                ? `${user.nickname}님의 코딩 학습 기록을 확인해 보세요.`
                                : "제출 기록과 학습 성과를 확인해 보세요."}
                        </p>
                    </div>

                    {loading ? (
                        <section className="my-empty" role="status">
                            학습 기록을 불러오는 중입니다...
                        </section>
                    ) : notLoggedIn ? (
                        <section className="my-empty">
                            <h2>로그인이 필요합니다</h2>
                            <p>
                                로그인하면 제출 기록과 학습 통계를
                                확인할 수 있어요.
                            </p>

                            <a className="my-primary-link" href="/login">
                                로그인하기
                                <ArrowRight size={16} />
                            </a>
                        </section>
                    ) : error ? (
                        <section className="my-empty" role="alert">
                            <h2>학습 기록을 불러오지 못했어요</h2>
                            <p>{error}</p>

                            <button
                                type="button"
                                onClick={() => window.location.reload()}
                            >
                                다시 시도
                            </button>
                        </section>
                    ) : (
                        <>
                            <div className="my-stat-grid">
                                <div className="my-stat-card">
                                    <div className="my-stat-icon">
                                        <Code2 size={20} />
                                    </div>
                                    <span>총 제출 횟수</span>
                                    <strong>
                                        {stats.total}<small>회</small>
                                    </strong>
                                </div>

                                <div className="my-stat-card">
                                    <div className="my-stat-icon">
                                        <CheckCircle2 size={20} />
                                    </div>
                                    <span>정답 제출</span>
                                    <strong>
                                        {stats.accepted}<small>회</small>
                                    </strong>
                                </div>

                                <div className="my-stat-card">
                                    <div className="my-stat-icon">
                                        <BookOpen size={20} />
                                    </div>
                                    <span>해결한 문제</span>
                                    <strong>
                                        {stats.solved}<small>개</small>
                                    </strong>
                                </div>

                                <div className="my-stat-card">
                                    <div className="my-stat-icon">
                                        <Target size={20} />
                                    </div>
                                    <span>제출 정답률</span>
                                    <strong>
                                        {stats.rate}<small>%</small>
                                    </strong>
                                </div>
                            </div>

                            <div className="my-content-grid">
                                <section className="my-panel">
                                    <div className="my-panel-title">
                                        <div>
                                            <h2>최근 제출 기록</h2>
                                            <p>
                                                제출 결과를 최신순으로 확인할 수 있어요.
                                            </p>
                                        </div>
                                        <Clock3 size={19} />
                                    </div>

                                    {submissions.length === 0 ? (
                                        <div className="my-panel-empty">
                                            <p>아직 제출한 코드가 없어요.</p>
                                            <a href="/problems">
                                                첫 문제 풀러 가기
                                                <ArrowRight size={15} />
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="my-table-wrap">
                                            <table className="my-table">
                                                <thead>
                                                    <tr>
                                                        <th>문제</th>
                                                        <th>언어</th>
                                                        <th>결과</th>
                                                        <th>통과</th>
                                                        <th>제출 일시</th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {submissions.slice(0, 20).map(
                                                        (item) => (
                                                            <tr key={item.id}>
                                                                <td>
                                                                    <a
                                                                        href={`/problems/${item.problemId}`}
                                                                    >
                                                                        {titles.get(item.problemId) ||
                                                                            `문제 #${item.problemId}`}
                                                                    </a>
                                                                </td>

                                                                <td>{item.language}</td>

                                                                <td>
                                                                    <span
                                                                        className={`my-result ${item.status === "ACCEPTED"
                                                                                ? "my-result-ok"
                                                                                : "my-result-fail"
                                                                            }`}
                                                                    >
                                                                        {STATUS_LABELS[item.status] ||
                                                                            item.status}
                                                                    </span>
                                                                </td>

                                                                <td>
                                                                    {item.passed}/{item.total}
                                                                </td>

                                                                <td>
                                                                    {formatDate(item.submittedAt)}
                                                                </td>
                                                            </tr>
                                                        )
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </section>

                                <section className="my-panel my-language-panel">
                                    <div className="my-panel-title">
                                        <div>
                                            <h2>언어별 제출</h2>
                                            <p>사용한 프로그래밍 언어</p>
                                        </div>
                                    </div>

                                    {stats.languages.length === 0 ? (
                                        <div className="my-panel-empty">
                                            <p>아직 언어별 기록이 없어요.</p>
                                        </div>
                                    ) : (
                                        stats.languages.map(([language, count]) => (
                                            <div
                                                className="my-language-row"
                                                key={language}
                                            >
                                                <div className="my-language-meta">
                                                    <strong>{language}</strong>
                                                    <span>{count}회</span>
                                                </div>

                                                <div className="my-progress">
                                                    <div
                                                        style={{
                                                            width: `${(count / stats.total) * 100
                                                                }%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))
                                    )}

                                    <p className="my-stat-note">
                                        정답률은 정답 제출 수 ÷ 전체 제출 수로
                                        계산합니다. 해결한 문제는 중복 없이
                                        계산합니다.
                                    </p>
                                </section>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </>
    );
}
