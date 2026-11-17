
import { useState } from "react";
import {
    Sparkles,
    Bug,
    CheckCircle2,
    LoaderCircle,
    AlertCircle,
} from "lucide-react";

import { requestAICode } from "../api/aiCodingApi.js";
import "../styles/AICodingWorkspace.css";

export default function AICodingWorkspace({
    problemId,
    language,
    currentCode,
    judgeResult,
    runResult,
    onApplyCode,
    onGenerated,
    disabled = false,
}) {
    const [instruction, setInstruction] = useState("");
    const [proposal, setProposal] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [reviewed, setReviewed] = useState(false);
    const [applied, setApplied] = useState(false);

    const requestCode = async (action) => {
        if (loading || disabled) return;

        setLoading(true);
        setError("");
        setProposal(null);
        setReviewed(false);
        setApplied(false);

        try {
            const result = await requestAICode({
                problemId,
                language,
                instruction:
                    instruction.trim() ||
                    (action === "debug"
                        ? "현재 코드의 오류를 수정하고 이유를 설명해 줘."
                        : "이 문제를 해결하는 코드를 작성하고 알고리즘을 설명해 줘."),
                currentCode,
                judgeOutput:
                    judgeResult?.output ||
                    runResult?.output ||
                    "",
                action,
            });

            if (!result.code?.trim()) {
                throw new Error(
                    "AI가 유효한 코드를 반환하지 않았습니다."
                );
            }

            setProposal({
                ...result,
                language,
            });
            onGenerated?.();
        } catch (err) {
            setError(err.message || "AI 요청에 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const applyCode = () => {
        if (!proposal || !reviewed || disabled) return;

        if (proposal.language !== language) {
            setError(
                "언어가 변경되었습니다. AI 코드를 다시 요청해 주세요."
            );
            return;
        }

        const confirmed = window.confirm(
            "AI 코드를 편집기에 적용하시겠습니까?\n현재 작성 중인 코드가 변경됩니다."
        );

        if (!confirmed) return;

        onApplyCode(proposal.code);
        setApplied(true);
    };

    return (
        <section className="ai-workspace">
            <div className="ai-workspace-heading">
                <Sparkles size={23} />
                <div>
                    <h3>AI 코딩 워크스페이스</h3>
                    <p>
                        AI에게 코드를 요청하고 직접 검증하며
                        학습하세요.
                    </p>
                </div>
            </div>

            <div className="ai-workspace-section">
                <h4>1. AI에게 요청하기</h4>

                <textarea
                    value={instruction}
                    onChange={(e) =>
                        setInstruction(e.target.value)
                    }
                    placeholder="예: 짝수의 덧셈 코드 개발"
                    maxLength={2000}
                    rows={4}
                    disabled={loading}
                />

                <div className="ai-workspace-actions">
                    <button
                        type="button"
                        onClick={() => requestCode("generate")}
                        disabled={loading || disabled}
                    >
                        <Sparkles size={17} />
                        AI 코드 생성
                    </button>

                    <button
                        type="button"
                        onClick={() => requestCode("debug")}
                        disabled={loading || disabled}
                    >
                        <Bug size={17} />
                        현재 코드 디버깅
                    </button>
                </div>
            </div>

            {loading && (
                <div className="ai-workspace-info">
                    <LoaderCircle size={18} />
                    Gemini가 코드를 분석하고 있습니다.
                </div>
            )}

            {error && (
                <div
                    className="ai-workspace-error"
                    role="alert"
                >
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {proposal && (
                <div className="ai-workspace-section">
                    <h4>2. AI 제안 코드 검토</h4>

                    <pre className="ai-workspace-code">
                        <code>{proposal.code}</code>
                    </pre>

                    <h4>AI 설명</h4>
                    <p className="ai-workspace-explanation">
                        {proposal.explanation}
                    </p>

                    <label className="ai-workspace-review">
                        <input
                            type="checkbox"
                            checked={reviewed}
                            onChange={(e) =>
                                setReviewed(e.target.checked)
                            }
                        />
                        코드를 검토했으며 실행 결과를
                        직접 확인하겠습니다.
                    </label>

                    <button
                        type="button"
                        onClick={applyCode}
                        disabled={
                            !reviewed ||
                            disabled ||
                            applied ||
                            proposal.language !== language
                        }
                    >
                        <CheckCircle2 size={17} />
                        {applied
                            ? "편집기에 적용됨"
                            : "이 코드 선택하여 편집기에 적용"}
                    </button>

                    {applied && (
                        <p className="ai-workspace-info">
                            코드를 적용했습니다.
                            아래에서 실행 및 제출하여
                            결과를 검증하세요.
                        </p>
                    )}
                </div>
            )}
        </section>
    );
}
