
import { useState } from "react";
import {
    GitCompare,
    Play,
    Sparkles,
    LoaderCircle,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";

import "../styles/AICodeComparison.css";

const API_BASE = "http://localhost:8080/api";

async function readResponse(response) {
    if (!response.ok) {
        let message = `요청 실패 (${response.status})`;

        try {
            const data = await response.json();
            message =
                data.detail ||
                data.message ||
                message;
        } catch {
            // JSON 오류 응답이 아니면 상태 코드를 사용
        }

        throw new Error(message);
    }

    return response.json();
}

function ResultCard({ title, result }) {
    const accepted = result?.status === "ACCEPTED";

    return (
        <div className="ai-compare-result-card">
            <strong>{title}</strong>

            <div
                className={
                    accepted
                        ? "ai-compare-status success"
                        : "ai-compare-status failure"
                }
            >
                {accepted ? (
                    <CheckCircle2 size={18} />
                ) : (
                    <AlertCircle size={18} />
                )}

                {result?.status || "UNKNOWN"}
            </div>

            <div className="ai-compare-count">
                {result?.passed ?? 0}
                {" / "}
                {result?.total ?? 0}
                {" 테스트 통과"}
            </div>

            <p>{result?.output || "결과 없음"}</p>
        </div>
    );
}

export default function AICodeComparison({
    sessionId,
    problemId,
    language,
    currentCode,
    disabled = false,
}) {
    const [result, setResult] = useState(null);
    const [feedback, setFeedback] = useState("");

    const [comparing, setComparing] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState("");

    // 저장된 AI 원본과 현재 편집기 코드를 채점
    const compareCodes = async () => {
        if (comparing || analyzing || disabled) return;

        setComparing(true);
        setError("");
        setFeedback("");
        setResult(null);

        try {
            const response = await fetch(
                `${API_BASE}/ai-learning/sessions/${sessionId}/compare`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        revisedCode: currentCode,
                    }),
                }
            );

            const data = await readResponse(response);
            setResult(data);

        } catch (err) {
            setError(
                err.message || "코드 비교에 실패했습니다."
            );
        } finally {
            setComparing(false);
        }
    };

    // 기존 Gemini 코드 분석 API 재사용
    const analyzeImprovement = async () => {
        if (!result || analyzing || comparing || disabled) {
            return;
        }

        setAnalyzing(true);
        setError("");

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
                        code: result.revisedCode,
                    }),
                }
            );

            const data = await readResponse(response);

            setFeedback(data.feedback || "");

        } catch (err) {
            setError(
                err.message ||
                "Gemini 코드 분석에 실패했습니다."
            );
        } finally {
            setAnalyzing(false);
        }
    };

    const hasChanged =
        result?.originalCode !== result?.revisedCode;

    const original = result?.originalResult;
    const revised = result?.revisedResult;

    const gainedPasses =
        (revised?.passed ?? 0) -
        (original?.passed ?? 0);

    const stale =
        result !== null &&
        currentCode !== result.revisedCode;

    return (
        <section className="ai-compare-panel">

            <div className="ai-compare-heading">
                <GitCompare size={23} />

                <div>
                    <h3>AI 코드 개선 분석</h3>
                    <p>
                        AI 원본과 직접 개선한 코드를
                        비교하고 검증합니다.
                    </p>
                </div>
            </div>

            <button
                type="button"
                className="ai-compare-primary"
                onClick={compareCodes}
                disabled={
                    disabled ||
                    comparing ||
                    analyzing ||
                    !currentCode?.trim()
                }
            >
                {comparing ? (
                    <LoaderCircle size={18} />
                ) : (
                    <Play size={18} />
                )}

                {comparing
                    ? "두 코드를 채점하고 있습니다..."
                    : "개선 전후 비교하기"}
            </button>

            {error && (
                <p className="ai-compare-error" role="alert">
                    {error}
                </p>
            )}

            {stale && (
                <p className="ai-compare-warning">
                    비교 후 코드가 변경되었습니다.
                    최신 결과를 확인하려면 다시 비교하세요.
                </p>
            )}

            {result && (
                <>
                    <div className="ai-compare-grid">
                        <div className="ai-compare-code-card">
                            <h4>AI 원본 코드</h4>
                            <pre>
                                <code>
                                    {result.originalCode}
                                </code>
                            </pre>
                        </div>

                        <div className="ai-compare-code-card">
                            <h4>사용자 개선 코드</h4>
                            <pre>
                                <code>
                                    {result.revisedCode}
                                </code>
                            </pre>
                        </div>
                    </div>

                    <div className="ai-compare-grid">
                        <ResultCard
                            title="AI 원본 채점"
                            result={original}
                        />

                        <ResultCard
                            title="수정 코드 채점"
                            result={revised}
                        />
                    </div>

                    <div className="ai-compare-summary">
                        <strong>개선 결과</strong>

                        <p>
                            {hasChanged
                                ? "AI 원본과 수정 코드에 차이가 있습니다."
                                : "원본과 수정 코드가 동일합니다."}
                        </p>

                        <p>
                            {gainedPasses > 0
                                ? `${gainedPasses}개 테스트를 더 통과했습니다.`
                                : gainedPasses < 0
                                    ? `${Math.abs(gainedPasses)}개 테스트를 덜 통과했습니다.`
                                    : "테스트 통과 개수는 동일합니다."}
                        </p>

                        <p>
                            이 결과는 정답 테스트 비교이며
                            실행 시간이나 메모리 개선을
                            증명하는 결과는 아닙니다.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="ai-compare-primary"
                        onClick={analyzeImprovement}
                        disabled={
                            analyzing ||
                            comparing ||
                            disabled ||
                            stale
                        }
                    >
                        {analyzing ? (
                            <LoaderCircle size={18} />
                        ) : (
                            <Sparkles size={18} />
                        )}

                        {analyzing
                            ? "AI 분석 중..."
                            : "수정 코드 Gemini 분석하기"}
                    </button>

                    {feedback && (
                        <div className="ai-compare-feedback">
                            <h4>Gemini 분석 결과</h4>
                            <pre>{feedback}</pre>
                            <p>
                                이 분석은 수정 코드에 대한
                                피드백이며, 원본과의 정량적
                                성능 비교는 아닙니다.
                            </p>
                        </div>
                    )}
                </>
            )}
        </section>
    );
}
