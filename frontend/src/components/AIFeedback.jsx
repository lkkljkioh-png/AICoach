
import { useEffect, useState } from "react";
import {
    Sparkles,
    LoaderCircle,
    AlertCircle,
    RefreshCw,
} from "lucide-react";
import "../styles/AIFeedback.css";

const API_BASE = "http://localhost:8080/api";

function InlineText({ text }) {
    return String(text)
        .split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
        .map((part, index) => {
            if (part.startsWith("**") && part.endsWith("**")) {
                return <strong key={index}>{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith("`") && part.endsWith("`")) {
                return <code key={index}>{part.slice(1, -1)}</code>;
            }
            return part;
        });
}

function FeedbackContent({ content }) {
    return (
        <div className="ai-feedback-content">
            {content.split("\n").map((line, index) => {
                const trimmed = line.trim();

                if (!trimmed) {
                    return null;
                }

                if (trimmed === "---") {
                    return <hr key={index} />;
                }

                if (/^#{1,4}\s/.test(trimmed)) {
                    return (
                        <h3 key={index}>
                            <InlineText text={trimmed.replace(/^#+\s*/, "")} />
                        </h3>
                    );
                }

                if (/^[-*]\s/.test(trimmed)) {
                    return (
                        <div key={index} className="ai-feedback-list-item">
                            <span className="ai-feedback-bullet" />
                            <span>
                                <InlineText text={trimmed.slice(2)} />
                            </span>
                        </div>
                    );
                }

                return (
                    <p key={index}>
                        <InlineText text={trimmed} />
                    </p>
                );
            })}
        </div>
    );
}

export default function AIFeedback({
    problemId,
    language,
    code,
    disabled = false,
}) {
    const [feedback, setFeedback] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // 코드나 언어 변경 시 이전 결과 초기화
    useEffect(() => {
        setFeedback("");
        setError("");
    }, [code, language, problemId]);

    const analyzeCode = async () => {
        if (loading || disabled) return;

        if (!code || !code.trim()) {
            setError("먼저 코드를 작성해 주세요.");
            return;
        }

        setLoading(true);
        setError("");
        setFeedback("");

        const controller = new AbortController();

        const timeout = setTimeout(() => controller.abort(), 90000);


        try {
            const response = await fetch(
                `${API_BASE}/problems/${problemId}/feedback`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        language,
                        code,
                    }),
                    signal: controller.signal,
                }
            );

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error("AI 피드백 API를 찾을 수 없습니다.");
                }
                if (response.status === 502 || response.status === 503) {
                    throw new Error(
                        "Gemini 서버가 일시적으로 응답하지 않습니다. 잠시 후 다시 시도해 주세요."
                    );
                }

                throw new Error(`AI 분석 요청 실패 (${response.status})`);
            }

            const data = await response.json();

            if (!data.feedback || !data.feedback.trim()) {
                throw new Error("AI 분석 결과가 비어 있습니다.");
            }

            setFeedback(data.feedback);
        } catch (err) {
            if (err.name === "AbortError") {
                setError("AI 응답 시간이 초과되었습니다. 다시 시도해 주세요.");
            } else {
                setError(err.message || "AI 분석 중 오류가 발생했습니다.");
            }
        } finally {
            clearTimeout(timeout);
            setLoading(false);
        }
    };

    return (
        <section className="ai-feedback-panel">
            <div className="ai-feedback-header">
                <div className="ai-feedback-title">
                    <span className="ai-feedback-icon">
                        <Sparkles size={19} />
                    </span>
                    <div>
                        <h3>AI 코드 분석</h3>
                        <p>Gemini가 작성한 코드를 분석하고 개선 방향을 제안합니다.</p>
                    </div>
                </div>

                <span className="ai-feedback-model">Gemini AI</span>
            </div>

            <div className="ai-feedback-body">
                <div className="ai-feedback-action">
                    <p>
                        코드의 정확성, 개선점, 복잡도와 추천 학습 내용을 확인하세요.
                    </p>

                    <button
                        type="button"
                        className="ai-feedback-button"
                        onClick={analyzeCode}
                        disabled={loading || disabled}
                    >
                        {loading ? (
                            <>
                                <LoaderCircle className="ai-feedback-spin" size={17} />
                                분석 중...
                            </>
                        ) : feedback || error ? (
                            <>
                                <RefreshCw size={16} />
                                다시 분석하기
                            </>
                        ) : (
                            <>
                                <Sparkles size={17} />
                                AI 피드백 받기
                            </>
                        )}
                    </button>
                </div>

                {loading && (
                    <div className="ai-feedback-loading" role="status">
                        <LoaderCircle className="ai-feedback-spin" size={23} />
                        <div>
                            <strong>코드를 분석하고 있어요</strong>
                            <p>Gemini 응답을 기다리고 있습니다.</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="ai-feedback-error" role="alert">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {feedback && !loading && (
                    <div className="ai-feedback-result" aria-live="polite">
                        <div className="ai-feedback-result-title">
                            <Sparkles size={18} />
                            <strong>AI 분석 결과</strong>
                            <span>완료</span>
                        </div>

                        <FeedbackContent content={feedback} />

                        <p className="ai-feedback-notice">
                            AI 분석은 참고용입니다. 실제 정답 여부는 제출하기
                            버튼의 Docker 채점 결과를 확인해 주세요.
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}
