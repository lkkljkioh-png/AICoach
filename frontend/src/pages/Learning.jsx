
import { useEffect, useState } from "react";
import {
    Sparkles,
    Target,
    BookOpen,
    ArrowRight,
    RefreshCw,
    CheckCircle2,
    BarChart3,
    BrainCircuit,
    AlertCircle,
} from "lucide-react";

import Header from "../components/Header.jsx";
import { getLearningRecommendations } from "../api/learningApi.js";

import "../styles/Learning.css";

const LEVEL_LABELS = {
    EASY: "쉬움",
    MEDIUM: "보통",
    HARD: "어려움",
};

function getAccuracyClass(accuracy) {
    if (accuracy >= 70) return "high";
    if (accuracy >= 40) return "medium";
    return "low";
}

export default function Learning() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notLoggedIn, setNotLoggedIn] = useState(false);

    const loadRecommendations = async () => {
        setLoading(true);
        setError("");
        setNotLoggedIn(false);

        try {
            const result = await getLearningRecommendations();
            setData(result);
        } catch (err) {
            if (err.status === 401) {
                setNotLoggedIn(true);
            } else {
                setError(
                    err.message ||
                    "학습 분석 결과를 불러오지 못했습니다."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let active = true;

        async function load() {
            try {
                const result =
                    await getLearningRecommendations();

                if (active) setData(result);
            } catch (err) {
                if (!active) return;

                if (err.status === 401) {
                    setNotLoggedIn(true);
                } else {
                    setError(err.message);
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

    const categoryStats = data?.categoryStats ?? [];
    const recommendations = data?.recommendations ?? [];

    return (
        <>
            <Header />

            <main className="learning-page">
                <div className="learning-container">

                    {/* 페이지 헤더 */}
                    <div className="learning-hero">
                        <span className="learning-eyebrow">
                            PERSONALIZED LEARNING
                        </span>

                        <h1>
                            나에게 맞는 <span>코딩 학습</span>
                        </h1>

                        <p>
                            제출 기록을 분석해 부족한 유형을 확인하고
                            다음 학습 문제를 추천합니다.
                        </p>
                    </div>

                    {/* 로딩 */}
                    {loading ? (
                        <div
                            className="learning-message"
                            role="status"
                        >
                            <BrainCircuit size={30} />
                            학습 기록을 분석하는 중입니다...
                        </div>

                    ) : notLoggedIn ? (
                        <div className="learning-message">
                            <BookOpen size={30} />

                            <h2>로그인이 필요합니다</h2>

                            <p>
                                로그인하면 개인별 학습 분석과
                                추천 문제를 확인할 수 있어요.
                            </p>

                            <a
                                href="/login"
                                className="learning-btn"
                            >
                                로그인하기
                                <ArrowRight size={16} />
                            </a>
                        </div>

                    ) : error ? (
                        <div
                            className="learning-message"
                            role="alert"
                        >
                            <AlertCircle size={30} />

                            <h2>학습 분석 실패</h2>
                            <p>{error}</p>

                            <button
                                type="button"
                                className="learning-btn"
                                onClick={loadRecommendations}
                            >
                                <RefreshCw size={16} />
                                다시 시도
                            </button>
                        </div>

                    ) : data && (
                        <>
                            {/* 학습 통계 */}
                            <section className="learning-stats">
                                <div className="learning-stat">
                                    <BookOpen size={21} />
                                    <span>총 제출 횟수</span>
                                    <strong>
                                        {data.totalSubmissions}회
                                    </strong>
                                </div>

                                <div className="learning-stat">
                                    <CheckCircle2 size={21} />
                                    <span>해결한 문제</span>
                                    <strong>
                                        {data.solvedProblems}개
                                    </strong>
                                </div>

                                <div className="learning-stat">
                                    <Target size={21} />
                                    <span>제출 정답률</span>
                                    <strong>{data.accuracy}%</strong>
                                </div>
                            </section>

                            {/* 학습 분석 */}
                            <section className="learning-summary">
                                <div className="learning-section-title">
                                    <BrainCircuit size={22} />
                                    <h2>나의 학습 분석</h2>
                                </div>

                                <div className="learning-insights">
                                    <div>
                                        <span>추천 난이도</span>

                                        <strong>
                                            {LEVEL_LABELS[
                                                data.recommendedLevel
                                            ] ?? data.recommendedLevel}
                                        </strong>

                                        <p>
                                            현재 문제 해결 수와 제출 정답률을
                                            기준으로 결정했습니다.
                                        </p>
                                    </div>

                                    <div>
                                        <span>우선 보완할 유형</span>

                                        <strong>
                                            {data.weakCategory ||
                                                "현재 없음"}
                                        </strong>

                                        <p>
                                            {data.weakCategory
                                                ? "오답이 존재하는 유형 중 정답률이 가장 낮은 유형입니다."
                                                : "제출 기록에서 취약 유형이 확인되지 않았습니다."}
                                        </p>
                                    </div>
                                </div>

                                <div className="learning-ai-insight">
                                    <Sparkles size={20} />

                                    <div>
                                        <h3>학습 추천 가이드</h3>

                                        <p>{data.insight}</p>
                                    </div>
                                </div>
                            </section>

                            {/* 유형별 정답률 */}
                            <section className="learning-summary">
                                <div className="learning-section-title">
                                    <BarChart3 size={22} />
                                    <h2>유형별 학습 현황</h2>
                                </div>

                                <p className="learning-subtitle">
                                    실제 제출 기록으로 계산한 유형별 정답률입니다.
                                    동일 문제의 반복 제출도 포함합니다.
                                </p>

                                {categoryStats.length === 0 ? (
                                    <div className="learning-category-empty">
                                        아직 분석할 제출 기록이 없습니다.
                                        문제를 풀고 제출하면 이곳에
                                        학습 현황이 표시됩니다.
                                    </div>
                                ) : (
                                    <div className="learning-category-list">
                                        {categoryStats.map((stat) => (
                                            <div
                                                className="learning-category-item"
                                                key={stat.category}
                                            >
                                                <div className="learning-category-top">
                                                    <div>
                                                        <strong>
                                                            {stat.category}
                                                        </strong>

                                                        {data.weakCategory ===
                                                            stat.category && (
                                                                <span className="learning-weak-label">
                                                                    보완 추천
                                                                </span>
                                                            )}
                                                    </div>

                                                    <strong>
                                                        {stat.accuracy}%
                                                    </strong>
                                                </div>

                                                <div
                                                    className="learning-category-progress"
                                                    role="progressbar"
                                                    aria-label={`${stat.category} 정답률`}
                                                    aria-valuenow={stat.accuracy}
                                                    aria-valuemin={0}
                                                    aria-valuemax={100}
                                                >
                                                    <div
                                                        className={getAccuracyClass(
                                                            stat.accuracy
                                                        )}
                                                        style={{
                                                            width: `${stat.accuracy}%`,
                                                        }}
                                                    />
                                                </div>

                                                <div className="learning-category-bottom">
                                                    <span>
                                                        총 {stat.total}회 제출
                                                    </span>

                                                    <span>
                                                        정답 {stat.accepted}회
                                                        {" · "}
                                                        오답 {stat.failed}회
                                                    </span>

                                                    <span>
                                                        해결 {stat.solvedProblems}문제
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* 맞춤 추천 문제 */}
                            <section className="learning-recommendations">
                                <div className="learning-section-title">
                                    <Target size={22} />
                                    <h2>맞춤 추천 문제</h2>
                                </div>

                                <p className="learning-subtitle">
                                    취약 유형과 이전 오답 기록,
                                    추천 난이도를 기준으로 선정했습니다.
                                </p>

                                {recommendations.length === 0 ? (
                                    <div className="learning-message">
                                        <h3>
                                            추천할 미해결 문제가 없어요.
                                        </h3>

                                        <p>
                                            새로운 문제가 등록되면
                                            이곳에서 확인할 수 있습니다.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="learning-list">
                                        {recommendations.map(
                                            (problem, index) => (
                                                <article
                                                    className="learning-card"
                                                    key={problem.id}
                                                >
                                                    <div className="learning-card-number">
                                                        {String(
                                                            index + 1
                                                        ).padStart(2, "0")}
                                                    </div>

                                                    <div className="learning-card-content">
                                                        <div className="learning-card-tags">
                                                            <span>
                                                                {problem.category}
                                                            </span>

                                                            <span>
                                                                {LEVEL_LABELS[
                                                                    problem.level
                                                                ] ?? problem.level}
                                                            </span>

                                                            <span>
                                                                약 {problem.time}분
                                                            </span>
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
