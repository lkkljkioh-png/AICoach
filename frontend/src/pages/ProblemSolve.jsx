
import { useEffect, useRef, useState } from "react";
import {
    ArrowLeft,
    Code2,
    BrainCircuit,
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
import AICodingWorkspace from "../components/AICodingWorkspace.jsx";

import {
    getProblemById,
    runProblem,
    submitProblem,
} from "../api/problemsApi.js";

import { getCurrentUser } from "../api/authApi.js";
import { getDrafts, saveDrafts } from "../api/draftsApi.js";
import { getSubmissionById } from "../api/submissionsApi.js";

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

    JavaScript: "// 여기에 코드를 작성하세요.\n\n",

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

function readLearningMode() {
    try {
        const saved = localStorage.getItem(
            "aicoach:learning-mode"
        );

        return saved === "ai" ? "ai" : "direct";
    } catch {
        return "direct";
    }
}

// =====================================
// 문제 풀이 페이지
// =====================================

function ProblemSolve() {

    // =====================================
    // URL 파라미터
    // =====================================

    const pathParts =
        window.location.pathname.split("/");

    const problemId = Number(pathParts[2]);

    const params =
        new URLSearchParams(window.location.search);

    const initialLanguage = params.get("language");
    const submissionParam = params.get("submission");

    const STORAGE_KEY =
        `aicoach:problem:${problemId}:drafts`;

    const submissionId =
        submissionParam && /^[1-9]\d*$/.test(submissionParam)
            ? Number(submissionParam)
            : null;

    // =====================================
    // 학습 모드
    // =====================================

    const [learningMode, setLearningMode] =
        useState(readLearningMode);

    // AI가 코드를 생성하면 편집기를 표시
    const [aiEditorReady, setAiEditorReady] =
        useState(false);

    const changeLearningMode = (mode) => {
        if (mode !== "direct" && mode !== "ai") return;

        setLearningMode(mode);

        try {
            localStorage.setItem(
                "aicoach:learning-mode",
                mode
            );
        } catch (err) {
            console.warn("학습 모드 저장 실패:", err);
        }
    };

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

    const [draftReady, setDraftReady] =
        useState(false);

    const [draftUserId, setDraftUserId] =
        useState(null);

    const [draftSaveStatus, setDraftSaveStatus] =
        useState("loading");

    const [draftError, setDraftError] =
        useState("");

    const saveQueue = useRef(Promise.resolve());
    const skipInitialSave = useRef(true);

    const code =
        codes[language] ?? STARTER_CODE[language];

    // =====================================
    // 실행 및 제출 상태
    // =====================================

    const [showHint, setShowHint] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const [runResult, setRunResult] =
        useState(null);

    const [judgeResult, setJudgeResult] =
        useState(null);

    const [isRunning, setIsRunning] =
        useState(false);

    const [
        restoringSubmission,
        setRestoringSubmission,
    ] = useState(false);

    // =====================================
    // 문제 또는 언어 변경 시 AI 화면 초기화
    // =====================================

    useEffect(() => {
        setAiEditorReady(false);
    }, [problemId, language]);

    // =====================================
    // 저장 코드 불러오기
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
                    // 로그인 사용자: MySQL
                    const remoteCodes =
                        await getDrafts(problemId);

                    if (!active) return;

                    setCodes(
                        normalizeCodes(remoteCodes)
                    );

                    setDraftUserId(user.id);
                } else {
                    // 비로그인 사용자: 브라우저
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

                console.error(
                    "코드 불러오기 실패:",
                    err
                );

                setDraftSaveStatus("error");

                setDraftError(
                    "코드를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요."
                );

                // 기존 저장 코드 보호
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
                    console.error(
                        "로컬 저장 실패:",
                        err
                    );

                    if (!cancelled) {
                        setDraftSaveStatus("error");
                    }
                }

                return;
            }

            // DB 저장 순서 보장
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
                    console.error(
                        "MySQL 자동 저장 실패:",
                        err
                    );

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
    // 언어 변경
    // =====================================

    const changeLanguage = (nextLanguage) => {
        if (!LANGUAGES.includes(nextLanguage)) {
            return;
        }

        setLanguage(nextLanguage);

        setMessage("");
        setRunResult(null);
        setJudgeResult(null);
        setAiEditorReady(false);

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
        if (!draftReady || isRunning) return;

        changeCode(STARTER_CODE[language]);
    };

    // =====================================
    // AI 생성 코드 적용
    // =====================================

    const applyAICode = (generatedCode) => {
        if (
            !draftReady ||
            isRunning ||
            typeof generatedCode !== "string" ||
            !generatedCode.trim()
        ) {
            return;
        }

        changeCode(generatedCode);
        setAiEditorReady(true);

        setMessage(
            "AI가 제안한 코드를 적용했습니다. 직접 검토하고 실행·채점해 보세요."
        );
    };

    // =====================================
    // 이전 제출 코드 복원
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

            if (
                !LANGUAGES.includes(
                    submission.language
                )
            ) {
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
                [submission.language]:
                    submission.code,
            }));

            setLanguage(submission.language);

            setRunResult(null);
            setJudgeResult(null);

            // AI 모드에서도 복원 코드 표시
            setAiEditorReady(true);

            const nextParams =
                new URLSearchParams(
                    window.location.search
                );

            nextParams.delete("submission");
            nextParams.set(
                "language",
                submission.language
            );

            window.history.replaceState(
                null,
                "",
                `${window.location.pathname}?${nextParams.toString()}`
            );

            setMessage(
                "이전 제출 코드를 불러왔습니다. 수정 후 다시 실행하거나 제출할 수 있습니다."
            );
        } catch (err) {
            setMessage(
                err.message ||
                "이전 코드를 불러오지 못했습니다."
            );
        } finally {
            setRestoringSubmission(false);
        }
    };

    // =====================================
    // Docker 코드 실행
    // =====================================

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
                output:
                    result.output || "(출력 없음)",
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
    // Docker 코드 제출 및 채점
    // =====================================

    const submitCode = async () => {
        if (isRunning || !draftReady) return;

        setMessage("");
        setJudgeResult(null);

        if (
            !code.trim() ||
            code === STARTER_CODE[language]
        ) {
            setMessage(
                "먼저 코드를 작성해 주세요."
            );

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
    // 자동 저장 상태 표시
    // =====================================

    const renderSaveStatus = () => {
        if (draftSaveStatus === "loading") {
            return (
                <>
                    <LoaderCircle size={14} />
                    저장된 코드 불러오는 중...
                </>
            );
        }

        if (draftSaveStatus === "saving") {
            return (
                <>
                    <Save size={14} />
                    자동 저장 중...
                </>
            );
        }

        if (draftSaveStatus === "error") {
            return (
                <>
                    <AlertCircle size={14} />
                    {draftError || "자동 저장 실패"}
                </>
            );
        }

        return (
            <>
                <CheckCircle2 size={14} />
                {draftUserId !== null
                    ? "MySQL에 자동 저장됨"
                    : "브라우저에 자동 저장됨"}
            </>
        );
    };

    // =====================================
    // 로딩 화면
    // =====================================

    if (loading) {
        return (
            <>
                <Header />

                <main className="solve-not-found">
                    <h2>
                        문제를 불러오는 중입니다...
                    </h2>
                </main>
            </>
        );
    }

    // =====================================
    // 오류 화면
    // =====================================

    if (error || !problem) {
        return (
            <>
                <Header />

                <main className="solve-not-found">
                    <h2>
                        문제를 불러오지 못했습니다.
                    </h2>

                    <p>
                        {error ||
                            "문제를 찾을 수 없습니다."}
                    </p>

                    <a href="/problems">
                        문제 목록으로 돌아가기
                    </a>
                </main>
            </>
        );
    }

    // =====================================
    // 코드 편집기 표시 조건
    // =====================================

    const showEditor =
        learningMode === "direct" ||
        aiEditorReady ||
        Number.isSafeInteger(submissionId);

    // =====================================
    // 화면 렌더링
    // =====================================

    return (
        <>
            <Header />

            <main className="solve-page">
                <div className="solve-container">

                    {/* 문제 목록으로 */}

                    <a
                        href="/problems"
                        className="solve-back"
                    >
                        <ArrowLeft size={17} />
                        문제 목록으로
                    </a>

                    {/* =========================
                        문제 제목
                    ========================= */}

                    <div className="solve-heading">
                        <div>
                            <span className="solve-eyebrow">
                                CODING PRACTICE
                            </span>

                            <h1>{problem.title}</h1>

                            <div className="solve-tags">
                                <span>
                                    {problem.level}
                                </span>

                                <span>
                                    {problem.category}
                                </span>

                                <span>
                                    예상 {problem.time}분
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* =========================
                        학습 방식 선택
                    ========================= */}

                    <section className="solve-learning-mode">

                        <div className="solve-learning-mode-header">
                            <h2>학습 방식 선택</h2>

                            <p>
                                직접 코딩하거나 AI와
                                협업하며 학습할 수 있습니다.
                            </p>
                        </div>

                        <div className="solve-learning-mode-options">

                            {/* 직접 코딩 학습 */}

                            <button
                                type="button"
                                className={`solve-mode-card ${learningMode === "direct"
                                        ? "active"
                                        : ""
                                    }`}
                                onClick={() =>
                                    changeLearningMode(
                                        "direct"
                                    )
                                }
                                aria-pressed={
                                    learningMode === "direct"
                                }
                            >
                                <div className="solve-mode-icon">
                                    <Code2 size={24} />
                                </div>

                                <div className="solve-mode-content">
                                    <strong>
                                        직접 코딩 학습
                                    </strong>

                                    <p>
                                        직접 코드를 작성하고
                                        Docker 채점과
                                        Gemini AI 피드백으로
                                        실력을 향상합니다.
                                    </p>
                                </div>

                                {learningMode === "direct" && (
                                    <CheckCircle2 size={20} />
                                )}
                            </button>

                            {/* AI 활용 학습 */}

                            <button
                                type="button"
                                className={`solve-mode-card ${learningMode === "ai"
                                        ? "active"
                                        : ""
                                    }`}
                                onClick={() =>
                                    changeLearningMode(
                                        "ai"
                                    )
                                }
                                aria-pressed={
                                    learningMode === "ai"
                                }
                            >
                                <div className="solve-mode-icon">
                                    <BrainCircuit size={24} />
                                </div>

                                <div className="solve-mode-content">
                                    <strong>
                                        AI 활용 코딩 학습
                                    </strong>

                                    <p>
                                        AI에게 직접 요청하고
                                        생성된 코드의 문제점을
                                        분석·개선하며 학습합니다.
                                    </p>
                                </div>

                                {learningMode === "ai" && (
                                    <CheckCircle2 size={20} />
                                )}
                            </button>
                        </div>

                        <div className="solve-mode-description">
                            {learningMode === "direct"
                                ? "직접 코드를 작성하고 실행·채점한 뒤 AI 피드백을 활용하세요."
                                : "AI에게 직접 요청하고, 제안된 코드를 검토한 후 실행·검증하세요."}
                        </div>
                    </section>

                    {/* =========================
                        메인 2단 레이아웃
                    ========================= */}

                    <div className="solve-layout">

                        {/* =========================
                            왼쪽: 문제 설명
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
                                        setShowHint(
                                            !showHint
                                        )
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
                            오른쪽: 학습 작업 공간
                        ========================= */}

                        <div className="solve-right-column">

                            {/* =====================
                                AI 활용 모드
                                AI 요청창 최상단
                            ===================== */}

                            {learningMode === "ai" && (
                                <AICodingWorkspace
                                    key={`${problemId}:${language}`}
                                    problemId={problemId}
                                    language={language}
                                    currentCode={code}
                                    judgeResult={judgeResult}
                                    runResult={runResult}
                                    onGenerated={() =>
                                        setAiEditorReady(true)
                                    }
                                    onApplyCode={applyAICode}
                                    disabled={
                                        !draftReady || isRunning
                                    }
                                />
                            )}

                            {/* =====================
                                코드 편집기

                                직접 코딩:
                                즉시 표시

                                AI 활용:
                                AI 생성 성공 후 표시
                            ===================== */}

                            {showEditor && (

                                <section className="solve-card solve-editor-card">

                                    {/* 편집기 헤더 */}

                                    <div className="solve-editor-header">

                                        <div className="solve-editor-title">
                                            <Code2 size={19} />

                                            <h2>
                                                {learningMode === "ai"
                                                    ? "AI 코드 검증 및 개선"
                                                    : "코드 작성"}
                                            </h2>
                                        </div>

                                        <select
                                            aria-label="프로그래밍 언어"
                                            value={language}
                                            onChange={(e) =>
                                                changeLanguage(
                                                    e.target.value
                                                )
                                            }
                                            disabled={!draftReady}
                                        >
                                            {LANGUAGES.map(
                                                (item) => (
                                                    <option
                                                        key={item}
                                                        value={item}
                                                    >
                                                        {item}
                                                    </option>
                                                )
                                            )}
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
                                                changeCode(
                                                    value ?? ""
                                                )
                                            }
                                            options={{
                                                ...EDITOR_OPTIONS,
                                                readOnly:
                                                    !draftReady,
                                            }}
                                        />

                                    </div>

                                    {/* 자동 저장 */}

                                    <div
                                        role="status"
                                        aria-live="polite"
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "7px",
                                            padding:
                                                "10px 16px",
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

                                    {/* 이전 제출 기록 */}

                                    {Number.isSafeInteger(submissionId) && (
                                        <div
                                            style={{
                                                padding:
                                                    "12px 16px",
                                                background:
                                                    "#eff6ff",
                                                borderBottom:
                                                    "1px solid #dbeafe",
                                                display: "flex",
                                                alignItems:
                                                    "center",
                                                justifyContent:
                                                    "space-between",
                                                gap: "12px",
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    color:
                                                        "#1d4ed8",
                                                    fontSize:
                                                        "13px",
                                                    fontWeight:
                                                        600,
                                                }}
                                            >
                                                이전 제출 기록에서 이동했습니다.
                                            </span>

                                            <button
                                                type="button"
                                                onClick={
                                                    restoreSubmission
                                                }
                                                disabled={
                                                    !draftReady ||
                                                    isRunning ||
                                                    restoringSubmission
                                                }
                                                style={{
                                                    border: "none",
                                                    background:
                                                        "#2563eb",
                                                    color:
                                                        "#ffffff",
                                                    borderRadius:
                                                        "8px",
                                                    padding:
                                                        "9px 14px",
                                                    cursor:
                                                        "pointer",
                                                    fontWeight:
                                                        700,
                                                }}
                                            >
                                                {restoringSubmission
                                                    ? "불러오는 중..."
                                                    : "이전 코드 불러오기"}
                                            </button>
                                        </div>
                                    )}

                                    {/* =====================
                                        실행 및 제출
                                    ===================== */}

                                    <div className="solve-editor-footer">

                                        <button
                                            type="button"
                                            className="solve-reset"
                                            onClick={resetCode}
                                            disabled={
                                                !draftReady ||
                                                isRunning
                                            }
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
                                                    !draftReady ||
                                                    isRunning
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
                                                    !draftReady ||
                                                    isRunning
                                                }
                                            >
                                                <Send size={16} />

                                                {isRunning
                                                    ? "처리 중..."
                                                    : "제출하기"}
                                            </button>

                                        </div>
                                    </div>

                                    {/* =====================
                                        실행 결과
                                    ===================== */}

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
                                                    코드를 작성한 후
                                                    실행하기 버튼을
                                                    눌러주세요.
                                                </p>
                                            )}

                                        </div>
                                    </div>

                                    {/* =====================
                                        제출 채점 결과
                                    ===================== */}

                                    {judgeResult && (

                                        <div className="solve-judge-panel">

                                            <div className="solve-judge-heading">

                                                <span
                                                    className={`solve-judge-status ${judgeResult.status ===
                                                            "ACCEPTED"
                                                            ? "accepted"
                                                            : "rejected"
                                                        }`}
                                                >
                                                    {JUDGE_LABELS[
                                                        judgeResult.status
                                                    ] ??
                                                        judgeResult.status}
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

                                    {/* 메시지 */}

                                    {message && (
                                        <div
                                            className="solve-message"
                                            role="status"
                                        >
                                            {message}
                                        </div>
                                    )}

                                    {/* =====================
                                        Gemini AI 피드백

                                        두 모드 모두 유지
                                    ===================== */}

                                    <AIFeedback
                                        problemId={problemId}
                                        language={language}
                                        code={code}
                                        disabled={
                                            isRunning ||
                                            !draftReady
                                        }
                                    />

                                </section>
                            )}

                        </div>
                    </div>

                </div>
            </main>
        </>
    );
}

export default ProblemSolve;
