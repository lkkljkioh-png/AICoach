
import { useEffect, useState } from "react";
import { X, BrainCircuit, LoaderCircle } from "lucide-react";

import { getSubmissionById } from "../api/submissionsApi.js";
import AIFeedback from "./AIFeedback.jsx";

import "../styles/ReviewAIAnalysis.css";

export default function ReviewAIAnalysis({
    submissionId,
    onClose,
}) {
    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!submissionId) return;

        let active = true;

        async function load() {
            setLoading(true);
            setError("");
            setSubmission(null);

            try {
                const data = await getSubmissionById(submissionId);

                if (!active) return;

                if (data.status === "ACCEPTED") {
                    throw new Error("정답 제출은 오답 분석 대상이 아닙니다.");
                }

                setSubmission(data);
            } catch (err) {
                if (active) {
                    setError(err.message || "제출 기록 조회 실패");
                }
            } finally {
                if (active) setLoading(false);
            }
        }

        load();

        return () => {
            active = false;
        };
    }, [submissionId]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Escape") onClose();
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [onClose]);

    return (
        <div
            className="review-ai-overlay"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <section
                className="review-ai-modal"
                role="dialog"
                aria-modal="true"
                aria-label="AI 오답 분석"
            >
                <div className="review-ai-header">
                    <div>
                        <h2>
                            <BrainCircuit size={23} />
                            AI 오답 분석
                        </h2>
                        <p>이전에 틀렸던 코드를 다시 분석합니다.</p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="닫기"
                    >
                        <X size={21} />
                    </button>
                </div>

                {loading ? (
                    <div className="review-ai-state">
                        <LoaderCircle size={23} />
                        제출 코드를 불러오는 중...
                    </div>
                ) : error ? (
                    <div className="review-ai-state" role="alert">
                        {error}
                    </div>
                ) : submission ? (
                    <div className="review-ai-body">
                        <div className="review-ai-info">
                            <span>{submission.language}</span>
                            <span>{submission.status}</span>
                            <span>
                                {submission.passed}/{submission.total} 통과
                            </span>
                        </div>

                        <div className="review-ai-code">
                            <h3>이전 오답 코드</h3>
                            <pre><code>{submission.code}</code></pre>
                        </div>

                        <AIFeedback
                            key={submission.id}
                            problemId={submission.problemId}
                            language={submission.language}
                            code={submission.code}
                        />

                        <p className="review-ai-notice">
                            AI 분석은 코드 개선을 위한 참고 자료입니다.
                            채점 결과와 실제 오류 원인을 함께 확인하세요.
                        </p>

                        <a
                            className="review-ai-retry"
                            href={`/problems/${submission.problemId}?language=${encodeURIComponent(submission.language)}&mode=direct&submission=${submission.id}`}
                        >
                            이 코드로 다시 풀기
                        </a>
                    </div>
                ) : null}
            </section>
        </div>
    );
}
