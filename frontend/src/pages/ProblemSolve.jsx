
import { getSubmissionById } from "../api/submissionsApi.js";
import { useEffect, useRef, useState } from "react";
import {
    ArrowLeft,
    Code2,
    RotateCcw,
    Send,
    Lightbulb,
    Play,
    Save,
    CheckCircle2,
    AlertCircle,
    LoaderCircle,
} from "lucide-react";

import Header from "../components/Header.jsx";
import Editor from "@monaco-editor/react";
import AIFeedback from "../components/AIFeedback.jsx";

import {
    getProblemById,
    runProblem,
    submitProblem,
} from "../api/problemsApi.js";

import { getCurrentUser } from "../api/authApi.js";
import { getDrafts, saveDrafts } from "../api/draftsApi.js";

import "../styles/ProblemSolve.css";

// =====================================
// 지원 언어
// =====================================

const LANGUAGES = [
    "Python",
    "JavaScript",
    "Java",
    "C",
    "C++",
];

const STARTER_CODE = {
    Python: "# 여기에 코드를 작성하세요.\n\n",

    Java: `public class Main {
    public static void main(String[] args) {
        // 여기에 코드를 작성하세요.
    }
}`,

    C: `#include <stdio.h>

int main(void) {
    // 여기에 코드를 작성하세요.
    return 0;
}`,

    "C++": `#include <iostream>
using namespace std;

int main() {
    // 여기에 코드를 작성하세요.
    return 0;
}`,

    JavaScript: "// 여기에 코드를 작성하세요.\n\n",
};

const MONACO_LANGUAGES = {
    Python: "python",
    JavaScript: "javascript",
    Java: "java",
    C: "c",
    "C++": "cpp",
};

// =====================================
// Monaco Editor 설정
// =====================================

const EDITOR_OPTIONS = {
    fontSize: 14,
    lineHeight: 24,
    minimap: { enabled: false },
    automaticLayout: true,
    scrollBeyondLastLine: false,
    lineNumbers: "on",
    tabSize: 4,

    quickSuggestions: false,
    suggestOnTriggerCharacters: false,
    wordBasedSuggestions: "off",
    inlineSuggest: { enabled: false },
    parameterHints: { enabled: false },
    snippetSuggestions: "none",
    acceptSuggestionOnEnter: "off",

    autoClosingBrackets: "never",
    autoClosingQuotes: "never",
    autoSurround: "never",
    autoIndent: "none",
    formatOnType: false,
    formatOnPaste: false,

    hover: { enabled: false },
    codeLens: false,
    lightbulb: { enabled: "off" },
};

// =====================================
// 유틸리티
// =====================================

function normalizeCodes(value) {
    if (
        !value ||
        typeof value !== "object" ||
        Array.isArray(value)
    ) {
        return {};
    }

    return Object.fromEntries(
        Object.entries(value).filter(
            ([language, code]) =>
                LANGUAGES.includes(language) &&
                typeof code === "string"
        )
    );
}

function readLocalDraft(storageKey) {
    try {
        const saved = localStorage.getItem(storageKey);

        return saved
            ? normalizeCodes(JSON.parse(saved))
            : {};
    } catch {
        return {};
    }
}

const JUDGE_LABELS = {
    ACCEPTED: "정답입니다!",
    WRONG_ANSWER: "오답입니다",
    RUNTIME_ERROR: "실행 오류",
    TIME_LIMIT: "시간 초과",
    TIME_LIMIT_EXCEEDED: "시간 초과",
    COMPILE_ERROR: "컴파일 오류",
    OUTPUT_LIMIT: "출력 제한 초과",
};

// =====================================
// 문제 풀이 페이지
// =====================================

function ProblemSolve() {
    const pathParts = window.location.pathname.split("/");
    const problemId = Number(pathParts[2]);

    const params = new URLSearchParams(window.location.search);
    const initialLanguage = params.get("language");

    const STORAGE_KEY =
        `aicoach:problem:${problemId}:drafts`;

    const submissionParam =
        new URLSearchParams(window.location.search)
            .get("submission");

    const submissionId =
        submissionParam && /^[1-9]\d*$/.test(submissionParam)
            ? Number(submissionParam)
            : null;

    const [restoringSubmission, setRestoringSubmission] =
        useState(false);

    // =====================================
    // 문제 데이터
    // =====================================

    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        setLoading(true);
        setError("");
        setProblem(null);

        getProblemById(problemId)
            .then((data) => {
                if (active) {
                    setProblem(data);
                }
            })
            .catch((err) => {
                if (active) {
                    setError(err.message);
                }
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, [problemId]);

    // =====================================
    // 코드 편집 상태
    // =====================================

    const [language, setLanguage] = useState(
        LANGUAGES.includes(initialLanguage)
            ? initialLanguage
            : "Python"
    );

    const [codes, setCodes] = useState({});
    const [draftReady, setDraftReady] = useState(false);
    const [draftUserId, setDraftUserId] = useState(null);
    const [draftSaveStatus, setDraftSaveStatus] =
        useState("loading");

    const [draftError, setDraftError] = useState("");

    // 저장 요청 순서를 보장하기 위한 Promise 체인
    const saveQueue = useRef(Promise.resolve());

    // 초기 로딩 시 자동 저장이 시작되지 않도록 관리
    const skipInitialSave = useRef(true);

    const code =
        codes[language] ?? STARTER_CODE[language];

    // =====================================
    // 로그인 여부 및 저장 코드 불러오기
    // =====================================

    useEffect(() => {
        let active = true;

        skipInitialSave.current = true;
        setDraftReady(false);
        setDraftUserId(null);
        setDraftSaveStatus("loading");
        setDraftError("");
        setCodes({});

        async function loadDrafts() {
            try {
                const user = await getCurrentUser();

                if (!active) return;

                if (user) {
                    // 로그인 사용자: MySQL에서 불러오기
                    const remoteCodes = await getDrafts(problemId);

                    if (!active) return;

                    setCodes(normalizeCodes(remoteCodes));
                    setDraftUserId(user.id);
                } else {
                    // 비로그인 사용자: 브라우저에 저장
                    const localCodes =
                        readLocalDraft(STORAGE_KEY);

                    setCodes(localCodes);
                    setDraftUserId(null);
                }

                skipInitialSave.current = true;
                setDraftSaveStatus("saved");
                setDraftReady(true);
            } catch (err) {
                if (!active) return;

                console.error("코드 불러오기 실패:", err);

                setDraftSaveStatus("error");
                setDraftError(
                    "코드를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요."
                );

                // 서버의 기존 코드를 덮어쓰지 않도록
                // 로딩 실패 시 편집과 자동 저장을 막음
                setDraftReady(false);
            }
        }

        loadDrafts();

        return () => {
            active = false;
        };
    }, [problemId, STORAGE_KEY]);

    // =====================================
    // 코드 자동 저장
    // =====================================

    useEffect(() => {
        if (!draftReady) return;

        // 최초 로딩 직후에는 저장하지 않음
        if (skipInitialSave.current) {
            skipInitialSave.current = false;
            return;
        }

        setDraftSaveStatus("saving");

        let cancelled = false;

        const timer = setTimeout(() => {
            const snapshot = { ...codes };

            if (draftUserId === null) {
                try {
                    localStorage.setItem(
                        STORAGE_KEY,
                        JSON.stringify(snapshot)
                    );

                    if (!cancelled) {
                        setDraftSaveStatus("saved");
                    }
                } catch (err) {
                    console.error("로컬 저장 실패:", err);

                    if (!cancelled) {
                        setDraftSaveStatus("error");
                    }
                }

                return;
            }

            // 서버 저장은 순차적으로 실행하여
            // 이전 요청이 나중에 덮어쓰는 상황 방지
            const operation = saveQueue.current
                .catch(() => { })
                .then(() =>
                    saveDrafts(problemId, snapshot)
                );

            saveQueue.current = operation;

            operation
                .then(() => {
                    if (!cancelled) {
                        setDraftSaveStatus("saved");
                    }
                })
                .catch((err) => {
                    console.error("MySQL 자동 저장 실패:", err);

                    if (!cancelled) {
                        setDraftSaveStatus("error");
                    }
                });
        }, 800);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [
        codes,
        draftReady,
        draftUserId,
        problemId,
        STORAGE_KEY,
    ]);

    // =====================================
    // 문제 풀이 상태
    // =====================================

    const [showHint, setShowHint] = useState(false);
    const [message, setMessage] = useState("");
    const [runResult, setRunResult] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [judgeResult, setJudgeResult] = useState(null);

    // =====================================
    // 언어 변경
    // =====================================

    const changeLanguage = (nextLanguage) => {
        if (!LANGUAGES.includes(nextLanguage)) return;

        setLanguage(nextLanguage);
        setMessage("");
        setRunResult(null);
        setJudgeResult(null);

        const nextParams =
            new URLSearchParams(window.location.search);

        nextParams.set("language", nextLanguage);

        window.history.replaceState(
            null,
            "",
            `${window.location.pathname}?${nextParams.toString()}`
        );
    };

    // =====================================
    // 코드 변경
    // =====================================

    const changeCode = (value) => {
        if (!draftReady) return;

        setCodes((previous) => ({
            ...previous,
            [language]: value,
        }));

        setMessage("");
        setRunResult(null);
        setJudgeResult(null);
    };

    // =====================================
    // 코드 초기화
    // =====================================

    const resetCode = () => {
        if (!draftReady) return;

        changeCode(STARTER_CODE[language]);
    };

    // =====================================
    // 코드 실행
    // =====================================


    const restoreSubmission = async () => {
        if (
            !draftReady ||
            isRunning ||
            restoringSubmission ||
            !Number.isSafeInteger(submissionId)
        ) {
            return;
        }

        setRestoringSubmission(true);
        setMessage("");

        try {
            const submission =
                await getSubmissionById(submissionId);

            if (submission.problemId !== problemId) {
                throw new Error(
                    "현재 문제와 제출 기록의 문제가 다릅니다."
                );
            }

            if (!LANGUAGES.includes(submission.language)) {
                throw new Error(
                    "지원하지 않는 프로그래밍 언어입니다."
                );
            }

            const confirmed = window.confirm(
                "이전 제출 코드를 불러오면 현재 언어의 작성 중인 코드가 변경됩니다.\n계속하시겠습니까?"
            );

            if (!confirmed) return;

            setCodes((previous) => ({
                ...previous,
                [submission.language]: submission.code,
            }));

            setLanguage(submission.language);
            setRunResult(null);
            setJudgeResult(null);

            // URL에서 이전 제출 ID 제거
            const params =
                new URLSearchParams(window.location.search);

            params.delete("submission");
            params.set("language", submission.language);

            window.history.replaceState(
                null,
                "",
                `${window.location.pathname}?${params.toString()}`
            );

            setMessage(
                "이전 제출 코드를 불러왔습니다. 수정 후 다시 실행하거나 제출할 수 있습니다."
            );
        } catch (error) {
            setMessage(
                error.message || "이전 코드를 불러오지 못했습니다."
            );
        } finally {
            setRestoringSubmission(false);
        }
    };

    const runCode = async () => {
        if (isRunning || !draftReady) return;

        setJudgeResult(null);
        setMessage("");

        if (
            !code.trim() ||
            code === STARTER_CODE[language]
        ) {
            setRunResult({
                status: "error",
                output: "먼저 코드를 작성해 주세요.",
            });
            return;
        }

        setIsRunning(true);

        setRunResult({
            status: "info",
            output: "코드를 실행하고 있습니다...",
        });

        try {
            const result = await runProblem(
                problemId,
                language,
                code
            );

            setRunResult({
                status:
                    result.status === "SUCCESS"
                        ? "success"
                        : "error",
                output: result.output || "(출력 없음)",
            });
        } catch (err) {
            setRunResult({
                status: "error",
                output: err.message,
            });
        } finally {
            setIsRunning(false);
        }
    };

    // =====================================
    // 코드 제출
    // =====================================

    const submitCode = async () => {
        if (isRunning || !draftReady) return;

        setMessage("");
        setJudgeResult(null);

        if (
            !code.trim() ||
            code === STARTER_CODE[language]
        ) {
            setMessage("먼저 코드를 작성해 주세요.");
            return;
        }

        setIsRunning(true);
        setRunResult(null);

        try {
            const result = await submitProblem(
                problemId,
                language,
                code
            );

            setJudgeResult({
                status: result.status,
                passed: result.passed ?? 0,
                total: result.total ?? 0,
                output: result.output ?? "",
            });
        } catch (err) {
            setMessage(err.message);
        } finally {
            setIsRunning(false);
        }
    };

    // =====================================
    // 저장 상태 표시
    // =====================================

    const renderSaveStatus = () => {
        const iconStyle = {
            flexShrink: 0,
        };

        if (draftSaveStatus === "loading") {
            return (
                <>
                    <LoaderCircle size={14} style={iconStyle} />
                    저장된 코드 불러오는 중...
                </>
            );
        }

        if (draftSaveStatus === "saving") {
            return (
                <>
                    <Save size={14} style={iconStyle} />
                    자동 저장 중...
                </>
            );
        }

        if (draftSaveStatus === "error") {
            return (
                <>
                    <AlertCircle size={14} style={iconStyle} />
                    {draftError || "자동 저장에 실패했습니다."}
                </>
            );
        }

        return (
            <>
                <CheckCircle2 size={14} style={iconStyle} />
                {draftUserId !== null
                    ? "MySQL에 자동 저장됨"
                    : "브라우저에 자동 저장됨"}
            </>
        );
    };

    // =====================================
    // 로딩 및 오류 처리
    // =====================================

    if (loading) {
        return (
            <>
                <Header />
                <main className="solve-not-found">
                    <h2>문제를 불러오는 중입니다...</h2>
                </main>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Header />
                <main className="solve-not-found">
                    <h2>문제를 불러오지 못했어요.</h2>
                    <p>{error}</p>
                    <a href="/problems">
                        문제 목록으로 돌아가기
                    </a>
                </main>
            </>
        );
    }

    if (!problem) {
        return (
            <>
                <Header />
                <main className="solve-not-found">
                    <h1>문제를 찾을 수 없습니다.</h1>
                    <a href="/problems">
                        문제 목록으로 돌아가기
                    </a>
                </main>
            </>
        );
    }

    // =====================================
    // 화면 렌더링
    // =====================================

    return (
        <>
            <Header />

            <main className="solve-page">
                <div className="solve-container">

                    {/* 문제 목록으로 돌아가기 */}
                    <a href="/problems" className="solve-back">
                        <ArrowLeft size={17} />
                        문제 목록으로
                    </a>

                    {/* 문제 제목 */}
                    <div className="solve-heading">
                        <div>
                            <span className="solve-eyebrow">
                                CODING PRACTICE
                            </span>

                            <h1>{problem.title}</h1>

                            <div className="solve-tags">
                                <span>{problem.level}</span>
                                <span>{problem.category}</span>
                                <span>예상 {problem.time}분</span>
                            </div>
                        </div>
                    </div>

                    <div className="solve-layout">

                        {/* =========================
                            문제 설명
                        ========================= */}

                        <section className="solve-card">
                            <div className="solve-card-header">
                                <h2>문제 설명</h2>
                            </div>

                            <div className="solve-card-body">
                                <p className="solve-description">
                                    {problem.description}
                                </p>

                                <h3>예시 입력</h3>

                                <pre className="solve-example">
                                    {problem.input}
                                </pre>

                                <h3>예시 출력</h3>

                                <pre className="solve-example">
                                    {problem.output}
                                </pre>

                                <button
                                    type="button"
                                    className="solve-hint-toggle"
                                    onClick={() =>
                                        setShowHint(!showHint)
                                    }
                                >
                                    <Lightbulb size={17} />
                                    {showHint
                                        ? "힌트 숨기기"
                                        : "힌트 보기"}
                                </button>

                                {showHint && (
                                    <div className="solve-hint">
                                        {problem.hint}
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* =========================
                            코드 편집기
                        ========================= */}

                        <section className="solve-card solve-editor-card">

                            <div className="solve-editor-header">
                                <div className="solve-editor-title">
                                    <Code2 size={19} />
                                    <h2>코드 작성</h2>
                                </div>

                                <select
                                    aria-label="프로그래밍 언어"
                                    value={language}
                                    onChange={(e) =>
                                        changeLanguage(e.target.value)
                                    }
                                    disabled={!draftReady}
                                >
                                    {LANGUAGES.map((item) => (
                                        <option
                                            key={item}
                                            value={item}
                                        >
                                            {item}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Monaco Editor */}
                            <div className="solve-code-area">
                                <Editor
                                    height="430px"
                                    theme="vs-dark"
                                    language={
                                        MONACO_LANGUAGES[language]
                                    }
                                    value={code}
                                    onChange={(value) =>
                                        changeCode(value ?? "")
                                    }
                                    options={{
                                        ...EDITOR_OPTIONS,
                                        readOnly: !draftReady,
                                    }}
                                />
                            </div>

                            {/* 자동 저장 상태 */}
                            <div
                                role="status"
                                aria-live="polite"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "7px",
                                    padding: "10px 16px",
                                    fontSize: "12px",
                                    color:
                                        draftSaveStatus === "error"
                                            ? "#dc2626"
                                            : "#64748b",
                                    borderBottom:
                                        "1px solid #e2e8f0",
                                }}
                            >
                                {renderSaveStatus()}
                            </div>

                            {Number.isSafeInteger(submissionId) && (
                                <div
                                    style={{
                                        padding: "12px 16px",
                                        background: "#eff6ff",
                                        borderBottom: "1px solid #dbeafe",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: "12px",
                                    }}
                                >
                                    <span
                                        style={{
                                            color: "#1d4ed8",
                                            fontSize: "13px",
                                            fontWeight: 600,
                                        }}
                                    >
                                        이전 제출 기록에서 이동했습니다.
                                    </span>

                                    <button
                                        type="button"
                                        onClick={restoreSubmission}
                                        disabled={
                                            !draftReady ||
                                            isRunning ||
                                            restoringSubmission
                                        }
                                        style={{
                                            border: "none",
                                            background: "#2563eb",
                                            color: "#ffffff",
                                            borderRadius: "8px",
                                            padding: "9px 14px",
                                            cursor: "pointer",
                                            fontWeight: 700,
                                        }}
                                    >
                                        {restoringSubmission
                                            ? "불러오는 중..."
                                            : "이전 코드 불러오기"}
                                    </button>
                                </div>
                            )}

                            {/* 실행 및 제출 버튼 */}
                            <div className="solve-editor-footer">
                                <button
                                    type="button"
                                    className="solve-reset"
                                    onClick={resetCode}
                                    disabled={!draftReady || isRunning}
                                >
                                    <RotateCcw size={16} />
                                    초기화
                                </button>

                                <div className="solve-action-buttons">
                                    <button
                                        type="button"
                                        className="solve-run"
                                        onClick={runCode}
                                        disabled={
                                            isRunning || !draftReady
                                        }
                                    >
                                        <Play size={16} />
                                        실행하기
                                    </button>

                                    <button
                                        type="button"
                                        className="solve-submit"
                                        onClick={submitCode}
                                        disabled={
                                            isRunning || !draftReady
                                        }
                                    >
                                        <Send size={16} />

                                        {isRunning
                                            ? "처리 중..."
                                            : "제출하기"}
                                    </button>
                                </div>
                            </div>

                            {/* =========================
                                실행 결과
                            ========================= */}

                            <div className="solve-result-panel">
                                <div className="solve-result-header">
                                    <span className="solve-result-dot" />
                                    <h3>실행 결과</h3>
                                </div>

                                <div className="solve-result-body">
                                    {runResult ? (
                                        <pre
                                            className={`solve-result-output ${runResult.status}`}
                                        >
                                            {runResult.output}
                                        </pre>
                                    ) : (
                                        <p className="solve-result-placeholder">
                                            코드를 작성한 후 실행하기
                                            버튼을 눌러주세요.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* =========================
                                제출 채점 결과
                            ========================= */}

                            {judgeResult && (
                                <div className="solve-judge-panel">

                                    <div className="solve-judge-heading">
                                        <span
                                            className={`solve-judge-status ${judgeResult.status === "ACCEPTED"
                                                ? "accepted"
                                                : "rejected"
                                                }`}
                                        >
                                            {JUDGE_LABELS[
                                                judgeResult.status
                                            ] ?? judgeResult.status}
                                        </span>

                                        <span className="solve-judge-count">
                                            {judgeResult.passed}
                                            {" / "}
                                            {judgeResult.total}
                                            {" 통과"}
                                        </span>
                                    </div>

                                    {judgeResult.total > 0 && (
                                        <div
                                            className="solve-judge-progress"
                                            role="progressbar"
                                            aria-label="테스트 케이스 통과율"
                                            aria-valuenow={
                                                judgeResult.passed
                                            }
                                            aria-valuemin={0}
                                            aria-valuemax={
                                                judgeResult.total
                                            }
                                        >
                                            <div
                                                style={{
                                                    width: `${(
                                                        judgeResult.passed /
                                                        judgeResult.total
                                                    ) * 100
                                                        }%`,
                                                }}
                                            />
                                        </div>
                                    )}

                                    <p className="solve-judge-description">
                                        {judgeResult.output}
                                    </p>
                                </div>
                            )}

                            {/* 오류 메시지 */}
                            {message && (
                                <div
                                    className="solve-message"
                                    role="status"
                                >
                                    {message}
                                </div>
                            )}

                            {/* =========================
                                AI 피드백
                            ========================= */}

                            <AIFeedback
                                problemId={problemId}
                                language={language}
                                code={code}
                                disabled={
                                    isRunning || !draftReady
                                }
                            />

                        </section>
                    </div>
                </div>
            </main>
        </>
    );
}

export default ProblemSolve;
