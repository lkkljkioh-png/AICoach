
import { useEffect, useState } from "react";
import {
    Sparkles,
    Target,
    BookOpen,
    ArrowRight,
    RefreshCw,
    CheckCircle2,
} from "lucide-react";

import Header from "../components/Header.jsx";
import { getLearningRecommendations } from "../api/learningApi.js";
import "../styles/Learning.css";

const LEVEL_LABELS = {
    EASY: "쉬움",
    MEDIUM: "보통",
    HARD: "어려움",
};

export default function Learning() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notLoggedIn, setNotLoggedIn] = useState(false);

    useEffect(() => {
        let active = true;

        getLearningRecommendations()
            .then((result) => {
                if (active) setData(result);
            })
            .catch((err) => {
                if (!active) return;

                if (err.status === 401) {
                    setNotLoggedIn(true);
                } else {
                    setError(err.message);
                }
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    return (
        <>
            <Header />

            <main className="learning-page">
                <div className="learning-container">
                    <div className="learning-hero">
                        <span className="learning-eyebrow">
                            PERSONALIZED LEARNING
                        </span>
                        <h1>
                            나에게 맞는 <span>코딩 학습</span>
                        </h1>
                        <p>
                            지금까지의 문제 풀이 기록을 바탕으로
                            다음에 풀어볼 문제를 추천해 드립니다.
                        </p>
                    </div>

                    {loading ? (
                        <div className="learning-message">
                            학습 기록을 분석하는 중입니다...
                        </div>
                    ) : notLoggedIn ? (
                        <div className="learning-message">
                            <BookOpen size={30} />
                            <h2>로그인이 필요합니다</h2>
                            <p>로그인하면 개인별 추천을 받을 수 있어요.</p>
                            <a href="/login" className="learning-btn">
                                로그인하기 <ArrowRight size={16} />
                            </a>
                        </div>
                    ) : error ? (
                        <div className="learning-message" role="alert">
                            <h2>추천 결과를 불러오지 못했어요</h2>
                            <p>{error}</p>
                            <button
                                className="learning-btn"
                                onClick={() => window.location.reload()}
                            >
                                <RefreshCw size={16} /> 다시 시도
                            </button>
                        </div>
                    ) : data && (
                        <>
                            <section className="learning-stats">
                                <div className="learning-stat">
                                    <BookOpen size={21} />
                                    <span>총 제출</span>
                                    <strong>{data.totalSubmissions}회</strong>
                                </div>
                                <div className="learning-stat">
                                    <CheckCircle2 size={21} />
                                    <span>해결한 문제</span>
                                    <strong>{data.solvedProblems}개</strong>
                                </div>
                                <div className="learning-stat">
                                    <Target size={21} />
                                    <span>제출 정답률</span>
                                    <strong>{data.accuracy}%</strong>
                                </div>
                            </section>

                            <section className="learning-summary">
                                <div className="learning-section-title">
                                    <Sparkles size={22} />
                                    <h2>나의 학습 분석</h2>
                                </div>

                                <div className="learning-insights">
                                    <div>
                                        <span>추천 난이도</span>
                                        <strong>
                                            {LEVEL_LABELS[data.recommendedLevel]
                                                ?? data.recommendedLevel}
                                        </strong>
                                        <p>
                                            현재 제출 기록을 기준으로
                                            추천하는 학습 난이도입니다.
                                        </p>
                                    </div>
                                    <div>
                                        <span>보완하면 좋은 유형</span>
                                        <strong>
                                            {data.weakCategory || "분석 중"}
                                        </strong>
                                        <p>
                                            {data.weakCategory
                                                ? "오답이 많이 발생한 유형입니다."
                                                : "문제를 더 풀면 취약 유형을 확인할 수 있어요."}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <section className="learning-recommendations">
                                <div className="learning-section-title">
                                    <Target size={22} />
                                    <h2>추천 문제</h2>
                                </div>
                                <p className="learning-subtitle">
                                    아직 해결하지 않은 문제 중에서
                                    학습 기록에 맞는 문제를 골랐어요.
                                </p>

                                {data.recommendations.length === 0 ? (
                                    <div className="learning-message">
                                        <h3>추천할 미해결 문제가 없어요.</h3>
                                        <p>
                                            새로운 문제가 등록되면
                                            이곳에서 확인할 수 있습니다.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="learning-list">
                                        {data.recommendations.map(
                                            (problem, index) => (
                                                <article
                                                    className="learning-card"
                                                    key={problem.id}
                                                >
                                                    <div className="learning-card-number">
                                                        {String(index + 1).padStart(2, "0")}
                                                    </div>

                                                    <div className="learning-card-content">
                                                        <div className="learning-card-tags">
                                                            <span>{problem.category}</span>
                                                            <span>
                                                                {LEVEL_LABELS[problem.level]
                                                                    ?? problem.level}
                                                            </span>
                                                            <span>약 {problem.time}분</span>
                                                        </div>
                                                        <h3>{problem.title}</h3>
                                                        <p>{problem.reason}</p>
                                                    </div>

                                                    <a
                                                        className="learning-card-link"
                                                        href={`/problems/${problem.id}`}
                                                    >
                                                        문제 풀기
                                                        <ArrowRight size={16} />
                                                    </a>
                                                </article>
                                            )
                                        )}
                                    </div>
                                )}
                            </section>
                        </>
                    )}
                </div>
            </main>
        </>
    );
}
