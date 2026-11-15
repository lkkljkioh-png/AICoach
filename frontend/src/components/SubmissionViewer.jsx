
import { useEffect, useState } from "react";
import {
    X,
    Code2,
    Copy,
    Check,
    RotateCcw,
    LoaderCircle,
} from "lucide-react";

import { getSubmissionById } from "../api/submissionsApi.js";
import "../styles/SubmissionViewer.css";

const STATUS_LABELS = {
    ACCEPTED: "정답",
    WRONG_ANSWER: "오답",
    RUNTIME_ERROR: "실행 오류",
    TIME_LIMIT: "시간 초과",
    TIME_LIMIT_EXCEEDED: "시간 초과",
    COMPILE_ERROR: "컴파일 오류",
    OUTPUT_LIMIT: "출력 제한 초과",
};

export default function SubmissionViewer({
    submissionId,
    onClose,
}) {
    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (submissionId == null) return;

        let active = true;

        setLoading(true);
        setSubmission(null);
        setError("");
        setCopied(false);

        getSubmissionById(submissionId)
            .then((data) => {
                if (active) setSubmission(data);
            })
            .catch((err) => {
                if (active) setError(err.message);
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [submissionId]);

    useEffect(() => {
        function handleKeyDown(event) {
            if (event.key === "Escape") onClose();
        }

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [onClose]);

    const copyCode = async () => {
        if (!submission) return;

        try {
            await navigator.clipboard.writeText(submission.code);
            setCopied(true);
        } catch {
            setError("코드를 복사하지 못했습니다.");
        }
    };

    const retryProblem = () => {
        if (!submission) return;

        const params = new URLSearchParams({
            language: submission.language,
            submission: String(submission.id),
        });

        window.location.href =
            `/problems/${submission.problemId}?${params.toString()}`;
    };

    return (
        <div
            className="submission-overlay"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <section
                className="submission-modal"
                role="dialog"
                aria-modal="true"
                aria-label="제출 코드 상세 보기"
            >
                <div className="submission-modal-header">
                    <div className="submission-modal-title">
                        <Code2 size={20} />
                        <div>
                            <h2>이전 제출 코드</h2>
                            <p>제출 기록 상세 보기</p>
                        </div>
                    </div>

                    <button
                        className="submission-close"
                        type="button"
                        onClick={onClose}
                        aria-label="닫기"
                    >
                        <X size={20} />
                    </button>
                </div>

                {loading ? (
                    <div className="submission-modal-state">
                        <LoaderCircle size={24} />
                        제출 코드를 불러오는 중...
                    </div>
                ) : !submission ? (
                    <div className="submission-modal-state">
                        {error || "제출 기록을 찾지 못했습니다."}
                    </div>
                ) : (
                    <>
                        <div className="submission-modal-meta">
                            <span>{submission.language}</span>

                            <span
                                className={
                                    submission.status === "ACCEPTED"
                                        ? "submission-success"
                                        : "submission-fail"
                                }
                            >
                                {STATUS_LABELS[submission.status] ||
                                    submission.status}
                            </span>

                            <span>
                                {submission.passed} / {submission.total} 통과
                            </span>
                        </div>

                        <pre className="submission-code">
                            <code>{submission.code}</code>
                        </pre>

                        {error && (
                            <p className="submission-error" role="alert">
                                {error}
                            </p>
                        )}

                        <div className="submission-modal-actions">
                            <button
                                type="button"
                                className="submission-copy"
                                onClick={copyCode}
                            >
                                {copied
                                    ? <Check size={16} />
                                    : <Copy size={16} />}
                                {copied ? "복사 완료" : "코드 복사"}
                            </button>

                            <button
                                type="button"
                                className="submission-retry"
                                onClick={retryProblem}
                            >
                                <RotateCcw size={16} />
                                이 코드로 다시 풀기
                            </button>
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}
