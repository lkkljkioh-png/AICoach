import { useState } from "react";

import {
    Sparkles,
    Bug,
    CheckCircle2,
    LoaderCircle,
    AlertCircle,
    Send,
    Code2,
} from "lucide-react";

import { requestAICode } from "../api/aiCodingApi.js";

import {
    createAILearningSession,
} from "../api/aiLearningSessionApi.js";

import "../styles/AICodingWorkspace.css";

// =====================================
// AI 코딩 학습 워크스페이스
// =====================================

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

    // =====================================
    // 사용자 프롬프트
    // =====================================

    const [instruction, setInstruction] = useState("");

    // 실제 Gemini에 전달했던 프롬프트
    const [proposalInstruction, setProposalInstruction] =
        useState("");

    // AI 요청 종류
    const [proposalAction, setProposalAction] =
        useState("generate");

    // =====================================
    // AI 제안 코드
    // =====================================

    const [proposal, setProposal] = useState(null);

    const [reviewed, setReviewed] = useState(false);
    const [applied, setApplied] = useState(false);

    // =====================================
    // 요청 상태
    // =====================================

    const [loading, setLoading] = useState(false);
    const [applying, setApplying] = useState(false);
    const [error, setError] = useState("");

    // =====================================
    // AI 코드 생성 / 디버깅
    // =====================================

    const requestCode = async (action) => {

        if (loading || applying || disabled) {
            return;
        }

        // 사용자가 프롬프트를 직접 작성해야 함
        const submittedInstruction = instruction.trim();

        if (!submittedInstruction) {
            setError(
                "AI에게 요청할 내용을 직접 작성해 주세요."
            );
            return;
        }

        if (submittedInstruction.length > 2000) {
            setError(
                "프롬프트는 2000자 이하로 작성해 주세요."
            );
            return;
        }

        if (
            action === "debug" &&
            (
                !currentCode?.trim() ||
                currentCode.trim() ===
                "# 여기에 코드를 작성하세요."
            )
        ) {
            setError(
                "디버깅할 코드를 먼저 작성하거나 적용해 주세요."
            );
            return;
        }

        setLoading(true);
        setError("");

        // 이전 제안 초기화
        setProposal(null);
        setReviewed(false);
        setApplied(false);

        try {

            const result = await requestAICode({
                problemId,
                language,

                instruction: submittedInstruction,

                // 디버깅 요청에만 현재 코드를 전달
                currentCode:
                    action === "debug"
                        ? (currentCode || "")
                        : "",

                // 디버깅 요청에만 실행 결과를 전달
                judgeOutput:
                    action === "debug"
                        ? (
                            judgeResult?.output ||
                            runResult?.output ||
                            ""
                        )
                        : "",

                action,
            });

            if (
                !result ||
                typeof result.code !== "string" ||
                !result.code.trim()
            ) {
                throw new Error(
                    "AI가 유효한 코드를 반환하지 않았습니다."
                );
            }

            // AI 결과 저장
            setProposal({
                code: result.code,
                explanation: result.explanation || "",
                language,
            });

            // 실제 요청했던 프롬프트와 종류 보관
            setProposalInstruction(submittedInstruction);
            setProposalAction(action);

            // 기존 ProblemSolve.jsx와 연결
            onGenerated?.();

        } catch (err) {

            console.error(
                "AI 코드 요청 실패:",
                err
            );

            setError(
                err.message ||
                "AI 코드 생성 중 오류가 발생했습니다."
            );

        } finally {
            setLoading(false);
        }
    };

    // =====================================
    // AI 제안 코드 선택 / DB 저장 / 적용
    // =====================================

    const applyCode = async () => {

        if (
            !proposal ||
            !reviewed ||
            disabled ||
            loading ||
            applying ||
            applied
        ) {
            return;
        }

        if (proposal.language !== language) {
            setError(
                "프로그래밍 언어가 변경되었습니다. 코드를 다시 요청해 주세요."
            );
            return;
        }

        // 사용자 확인
        const confirmed = window.confirm(
            "AI가 제안한 코드를 편집기에 적용하시겠습니까?\n\n" +
            "현재 작성 중인 코드가 변경됩니다.\n" +
            "AI 원본 코드와 프롬프트는 MySQL에 저장됩니다."
        );

        if (!confirmed) {
            return;
        }

        setApplying(true);
        setError("");

        try {

            // =====================================
            // 1. AI 원본 코드 DB 저장
            // =====================================

            const session = await createAILearningSession({
                problemId,
                language,

                // Gemini에 실제 전달했던 프롬프트
                instruction: proposalInstruction,

                // generate 또는 debug
                action: proposalAction,

                // 사용자 수정 전 AI 원본
                originalCode: proposal.code,
            });

            if (
                !session ||
                !Number.isSafeInteger(session.id)
            ) {
                throw new Error(
                    "AI 학습 기록 ID를 받아오지 못했습니다."
                );
            }

            // =====================================
            // 2. Monaco Editor에 코드 적용
            // =====================================

            onApplyCode(proposal.code, session.id);

            // =====================================
            // 3. AI 검토 영역 숨김
            // =====================================

            setApplied(true);

            // =====================================
            // 4. 편집기로 이동
            // =====================================

            setTimeout(() => {
                document
                    .querySelector(".solve-editor-card")
                    ?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                    });
            }, 100);

        } catch (err) {

            console.error(
                "AI 학습 코드 적용 실패:",
                err
            );

            setError(
                err.message ||
                "AI 코드 저장 또는 적용에 실패했습니다."
            );

        } finally {
            setApplying(false);
        }
    };

    // =====================================
    // 화면
    // =====================================

    return (
        <section className="ai-workspace">

            {/* =========================
                헤더
            ========================= */}

            <div className="ai-workspace-heading">

                <Sparkles size={23} />

                <div>
                    <h3>AI 코딩 워크스페이스</h3>

                    <p>
                        AI에게 직접 요청하고 생성된 코드를
                        검토·개선하며 학습하세요.
                    </p>
                </div>

            </div>

            {/* =========================
                STEP 1. 프롬프트 작성
            ========================= */}

            <div className="ai-workspace-section">

                <h4>1. AI에게 요청하기</h4>

                <p className="ai-workspace-explanation">
                    AI에게 어떤 작업을 요청할지
                    직접 작성해 보세요.
                </p>

                <textarea
                    value={instruction}

                    onChange={(e) => {
                        setInstruction(e.target.value);
                        setError("");
                    }}

                    placeholder="AI에게 어떤 작업을 요청하고 싶은가요? 직접 작성해 보세요."

                    maxLength={2000}
                    rows={4}

                    disabled={loading || applying}
                />

                <div className="ai-workspace-actions">

                    {/* 코드 생성 */}

                    <button
                        type="button"

                        onClick={() =>
                            requestCode("generate")
                        }

                        disabled={
                            loading ||
                            applying ||
                            disabled ||
                            !instruction.trim()
                        }
                    >
                        {loading ? (
                            <LoaderCircle size={17} />
                        ) : (
                            <Sparkles size={17} />
                        )}

                        AI 코드 생성
                    </button>

                    {/* 디버깅 */}

                    <button
                        type="button"

                        onClick={() =>
                            requestCode("debug")
                        }

                        disabled={
                            loading ||
                            applying ||
                            disabled ||
                            !instruction.trim() ||
                            !currentCode?.trim()
                        }
                    >
                        <Bug size={17} />
                        현재 코드 디버깅
                    </button>

                </div>

            </div>

            {/* =========================
                로딩
            ========================= */}

            {loading && (
                <div
                    className="ai-workspace-info"
                    role="status"
                >
                    <LoaderCircle size={18} />

                    Gemini가 요청 내용을 분석하고
                    코드를 생성하고 있습니다.
                </div>
            )}

            {/* =========================
                저장 중
            ========================= */}

            {applying && (
                <div
                    className="ai-workspace-info"
                    role="status"
                >
                    <LoaderCircle size={18} />

                    AI 원본 코드와 프롬프트를
                    MySQL에 저장하고 있습니다.
                </div>
            )}

            {/* =========================
                오류
            ========================= */}

            {error && (
                <div
                    className="ai-workspace-error"
                    role="alert"
                >
                    <AlertCircle size={18} />

                    <span>{error}</span>
                </div>
            )}

            {/* =========================
                STEP 2. AI 코드 검토

                편집기에 적용하면 숨김
            ========================= */}

            {proposal && !applied && (

                <div className="ai-workspace-section">

                    <h4>
                        2. AI 제안 코드 검토
                    </h4>

                    {/* AI 생성 코드 */}

                    <pre className="ai-workspace-code">
                        <code>
                            {proposal.code}
                        </code>
                    </pre>

                    {/* AI 설명 */}

                    <h4>AI 코드 설명</h4>

                    <p className="ai-workspace-explanation">
                        {proposal.explanation}
                    </p>

                    {/* 실제 요청 프롬프트 */}

                    <div className="ai-workspace-explanation">
                        <strong>
                            내가 AI에게 요청한 내용
                        </strong>

                        <p>
                            {proposalInstruction}
                        </p>
                    </div>

                    {/* 코드 검토 확인 */}

                    <label className="ai-workspace-review">

                        <input
                            type="checkbox"

                            checked={reviewed}

                            onChange={(e) =>
                                setReviewed(e.target.checked)
                            }

                            disabled={applying}
                        />

                        <span>
                            AI 코드를 검토했으며
                            직접 실행·채점하고
                            개선할 부분을 확인하겠습니다.
                        </span>

                    </label>

                    {/* 편집기에 적용 */}

                    <button
                        type="button"

                        onClick={applyCode}

                        disabled={
                            !reviewed ||
                            disabled ||
                            loading ||
                            applying ||
                            proposal.language !== language
                        }
                    >
                        {applying ? (
                            <LoaderCircle size={17} />
                        ) : (
                            <CheckCircle2 size={17} />
                        )}

                        {applying
                            ? "저장 및 적용 중..."
                            : "이 코드 선택하여 편집기에 적용"}
                    </button>

                </div>
            )}

            {/* =========================
                STEP 3. 적용 완료
            ========================= */}

            {applied && (
                <div
                    className="ai-workspace-info"
                    role="status"
                >
                    <Code2 size={18} />

                    <span>
                        AI 코드가 편집기에 적용되었습니다.
                        직접 수정하고 실행·채점해 보세요.
                    </span>
                </div>
            )}

        </section>
    );
}
