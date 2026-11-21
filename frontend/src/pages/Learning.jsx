
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
    LayoutDashboard,
    FolderOpen,
} from "lucide-react";

import Header from "../components/Header.jsx";
import LearningDashboard from "../components/LearningDashboard.jsx";
import AILearningCoach from "../components/AILearningCoach.jsx";
import IndependentPractice from "../components/IndependentPractice.jsx";
import AILearningProgress from "../components/AILearningProgress.jsx";
import PersonalizedProblem from "../components/PersonalizedProblem.jsx";
import PersonalProblemManager from "../components/PersonalProblemManager.jsx";

import { getLearningRecommendations } from "../api/learningApi.js";

import "../styles/Learning.css";

const LEVEL_LABELS = {
    EASY: "쉬움",
    MEDIUM: "보통",
    HARD: "어려움",
};

const TABS = [
    {
        id: "overview",
        label: "학습 현황",
        description: "학습 성과와 취약 유형 분석",
        Icon: LayoutDashboard,
    },
    {
        id: "coach",
        label: "AI 코칭",
        description: "AI 피드백과 코딩 연습",
        Icon: BrainCircuit,
    },
    {
        id: "generate",
        label: "문제 생성",
        description: "나에게 맞는 AI 문제 생성",
        Icon: Sparkles,
    },
    {
        id: "mine",
        label: "내 문제",
        description: "생성한 문제와 풀이 상태 관리",
        Icon: FolderOpen,
    },
];

function getAccuracyClass(accuracy) {
    if (accuracy >= 70) return "high";
    if (accuracy >= 40) return "medium";
    return "low";
}

export default function Learning() {
    const [activeTab, setActiveTab] = useState("overview");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notLoggedIn, setNotLoggedIn] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const requested = params.get("tab");

        if (TABS.some((tab) => tab.id === requested)) {
            setActiveTab(requested);
        }
    }, []);

    const changeTab = (tabId) => {
        setActiveTab(tabId);

        const url = new URL(window.location.href);
        url.searchParams.set("tab", tabId);
        window.history.replaceState(null, "", url);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

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
        loadRecommendations();
    }, []);

    const categoryStats = data?.categoryStats ?? [];
    const recommendations = data?.recommendations ?? [];

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
                            AI <span>맞춤 학습</span>
                        </h1>

                        <p>
                            나의 학습 현황을 확인하고
                            AI 코칭과 맞춤형 문제로
                            실력을 키워보세요.
                        </p>
                    </div>

                    <nav
                        className="learning-tabs"
                        aria-label="AI 맞춤 학습 메뉴"
                    >
                        {TABS.map((tab) => {
                            const Icon = tab.Icon;
                            const selected = activeTab === tab.id;

                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    className={`learning-tab ${selected ? "active" : ""
                                        }`}
                                    aria-current={
                                        selected ? "page" : undefined
                                    }
                                    onClick={() => changeTab(tab.id)}
                                >
                                    <Icon size={19} />

                                    <span className="learning-tab-copy">
                                        <strong>{tab.label}</strong>
                                        <small>{tab.description}</small>
                                    </span>
                                </button>
                            );
                        })}
                    </nav>

                    {loading ? (
                        <div
                            className="learning-message"
                            role="status"
                        >
                            <RefreshCw
                                className="personal-problem-spin"
                                size={26}
                            />
                            학습 정보를 불러오는 중입니다...
                        </div>
                    ) : notLoggedIn ? (
                        <div className="learning-message">
                            <BookOpen size={30} />
                            <h2>로그인이 필요합니다</h2>
                            <p>
                                로그인 후 AI 맞춤 학습을
                                이용할 수 있습니다.
                            </p>
                            <a href="/login" className="learning-btn">
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
                            <h2>학습 정보 조회 실패</h2>
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
                        <div className="learning-tab-content">

                            {activeTab === "overview" && (
                                <div className="learning-panel-stack">

                                    <div className="learning-tab-heading">
                                        <h2>나의 학습 현황</h2>
                                        <p>
                                            지금까지의 학습 성과를
                                            한눈에 확인하세요.
                                        </p>
                                    </div>

                                    <div className="learning-stats">
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
                                    </div>

                                    <LearningDashboard />

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
                                                    제출 정답률과 해결한
                                                    문제를 기준으로 분석합니다.
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
                                                        ? "오답이 존재하는 유형 중 우선 학습할 영역입니다."
                                                        : "현재 취약 유형이 확인되지 않았습니다."}
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

                                    <section className="learning-summary">
                                        <div className="learning-section-title">
                                            <BarChart3 size={22} />
                                            <h2>유형별 학습 현황</h2>
                                        </div>

                                        <p className="learning-subtitle">
                                            실제 제출 기록을 기준으로
                                            계산한 유형별 정답률입니다.
                                        </p>

                                        {categoryStats.length === 0 ? (
                                            <div className="learning-category-empty">
                                                아직 분석할 제출 기록이 없습니다.
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

                                    <AILearningProgress />

                                    <section className="learning-recommendations">
                                        <div className="learning-section-title">
                                            <Target size={22} />
                                            <h2>맞춤 추천 문제</h2>
                                        </div>

                                        <p className="learning-subtitle">
                                            취약 유형과 추천 난이도에
                                            맞춘 기존 연습 문제입니다.
                                        </p>

                                        {recommendations.length === 0 ? (
                                            <div className="learning-category-empty">
                                                추천할 미해결 문제가 없습니다.
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
                                </div>
                            )}

                            {activeTab === "coach" && (
                                <div className="learning-panel-stack">
                                    <div className="learning-tab-heading">
                                        <h2>AI 학습 코칭</h2>
                                        <p>
                                            AI 피드백과 직접 코딩 연습으로
                                            실력을 개선하세요.
                                        </p>
                                    </div>

                                    <AILearningCoach />
                                    <IndependentPractice />
                                </div>
                            )}

                            {activeTab === "generate" && (
                                <div className="learning-panel-stack">
                                    <div className="learning-tab-heading">
                                        <h2>AI 맞춤 문제 생성</h2>
                                        <p>
                                            취약점 기반 자동 추천 또는
                                            직접 설정으로 문제를 생성하세요.
                                        </p>
                                    </div>

                                    <PersonalizedProblem
                                        showManager={false}
                                    />
                                </div>
                            )}

                            {activeTab === "mine" && (
                                <div className="learning-panel-stack">
                                    <div className="learning-tab-heading">
                                        <h2>내 문제 관리</h2>
                                        <p>
                                            내가 생성한 문제의 풀이 상태와
                                            학습 기록을 확인하세요.
                                        </p>
                                    </div>

                                    <PersonalProblemManager />
                                </div>
                            )}

                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
