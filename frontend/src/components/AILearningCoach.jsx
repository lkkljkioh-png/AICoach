import { useEffect, useState } from "react";

import {
    Sparkles,
    BrainCircuit,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";

import ReactMarkdown from "react-markdown";

import {
    getAICoaching,
    getSavedAICoaching
} from "../api/learningApi.js";

import "../styles/AILearningCoach.css";

export default function AILearningCoach() {
    const [coaching, setCoaching] = useState("");

    const [loadingSaved, setLoadingSaved] = useState(true);

    useEffect(() => {
        let active = true;

        async function loadSavedPlan() {
            try {
                const saved = await getSavedAICoaching();

                if (active && saved) {
                    setCoaching(saved.coaching);
                }
            } catch (err) {
                console.error("저장된 학습 계획 조회 실패:", err);

                if (active) {
                    setError(err.message);
                }
            } finally {
                if (active) {
                    setLoadingSaved(false);
                }
            }
        }

        loadSavedPlan();

        return () => {
            active = false;
        };
    }, []);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const analyze = async () => {
        if (loading) return;

        setLoading(true);
        setError("");

        try {
            const result = await getAICoaching();
            setCoaching(result.coaching);
        } catch (err) {
            setError(
                err.message ||
                "AI 학습 분석을 진행하지 못했습니다."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="ai-coach-panel">

            <div className="ai-coach-header">
                <div className="ai-coach-title">
                    <BrainCircuit size={24} />

                    <div>
                        <h2>AI 맞춤 학습 코칭</h2>
                        <p>
                            실제 제출 기록을 분석해
                            개인별 학습 전략을 제안합니다.
                        </p>
                    </div>
                </div>

                <span className="ai-coach-model">
                    Gemini 3.5
                </span>
            </div>


            {loadingSaved && (
                <div className="ai-coach-loading">
                    <p>저장된 학습 계획을 불러오는 중...</p>
                </div>
            )}

            {!coaching && !loading && !loadingSaved && (
                <div className="ai-coach-intro">
                    <Sparkles size={32} />

                    <h3>나에게 필요한 학습은 무엇일까요?</h3>

                    <p>
                        정답률과 취약 유형을 분석하여
                        맞춤 학습 전략과 7일 학습 계획을
                        생성합니다.
                    </p>
                </div>
            )}

            {loading && (
                <div
                    className="ai-coach-loading"
                    role="status"
                >
                    <RefreshCw
                        size={28}
                        className="ai-coach-spin"
                    />

                    <h3>AI가 학습 기록을 분석하고 있어요</h3>

                    <p>
                        제출 기록과 취약 유형을 바탕으로
                        학습 계획을 생성하고 있습니다.
                    </p>
                </div>
            )}

            {error && (
                <div className="ai-coach-error" role="alert">
                    <AlertCircle size={19} />
                    <span>{error}</span>
                </div>
            )}

            {coaching && (
                <div className="ai-coach-result">
                    <div className="ai-coach-result-title">
                        <CheckCircle2 size={20} />
                        <strong>개인 맞춤 분석 결과</strong>
                    </div>

                    <div className="ai-coach-markdown">
                        <ReactMarkdown
                            skipHtml
                            components={{
                                a: ({ node, ...props }) => (
                                    <span>{props.children}</span>
                                ),
                            }}
                        >
                            {coaching}
                        </ReactMarkdown>
                    </div>
                </div>
            )}

            <button
                type="button"
                className="ai-coach-button"
                onClick={analyze}
                disabled={loading}
            >
                {loading ? (
                    <RefreshCw
                        size={18}
                        className="ai-coach-spin"
                    />
                ) : (
                    <Sparkles size={18} />
                )}

                {loading
                    ? "분석 중..."
                    : coaching
                        ? "학습 계획 다시 생성"
                        : "AI 맞춤 학습 분석하기"}
            </button>

            <p className="ai-coach-notice">
                AI 학습 계획은 실제 제출 통계를 바탕으로
                생성된 참고용 추천입니다.
            </p>
        </section>
    );
}
