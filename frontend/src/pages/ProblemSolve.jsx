
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
import AICodeComparison from "../components/AICodeComparison.jsx";

import {
    getProblemById,
    runProblem,
    submitProblem,
} from "../api/problemsApi.js";

import { getCurrentUser } from "../api/authApi.js";
import { getDrafts, saveDrafts } from "../api/draftsApi.js";
import { getSubmissionById } from "../api/submissionsApi.js";
import { saveAIRevisedCode } from "../api/aiLearningSessionApi.js";

import "../styles/ProblemSolve.css";

// 지원 언어

const LANGUAGES = [
    "Python",
    "JavaScript",
    "Java",
    "C",
    "C++",
];

// 언어별 기본 코드

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

// Monaco 언어 설정

const MONACO_LANGUAGES = {
    Python: "python",
    JavaScript: "javascript",
    Java: "java",
    C: "c",
    "C++": "cpp",
};

// Monaco 편집기 설정

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

// Docker 채점 결과 표시

const JUDGE_LABELS = {
    ACCEPTED: "정답입니다!",
    WRONG_ANSWER: "오답입니다",
    RUNTIME_ERROR: "실행 오류",
    TIME_LIMIT: "시간 초과",
    TIME_LIMIT_EXCEEDED: "시간 초과",
    COMPILE_ERROR: "컴파일 오류",
    OUTPUT_LIMIT: "출력 제한 초과",
};

// 코드 저장 데이터 검증

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

// 브라우저에 저장한 코드 읽기

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

// 마지막 학습 모드 읽기

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

// 문제 풀이 페이지

export default function ProblemSolve() {

    // URL 정보

    const pathParts = window.location.pathname.split("/");
    const problemId = Number(pathParts[2]);

    const params = new URLSearchParams(
        window.location.search
    );

    const initialLanguage = params.get("language");
    const submissionParam = params.get("submission");

    const STORAGE_KEY =
        `aicoach:problem:${problemId}:drafts`;

    const submissionId =
        submissionParam && /^[1-9]\d*$/.test(submissionParam)
            ? Number(submissionParam)
            : null;

    // 학습 모드

    const [learningMode, setLearningMode] =
        useState(readLearningMode);

    // AI 편집기 표시 상태

    const [aiEditorReady, setAiEditorReady] =
        useState(false);

    // 현재 AI 학습 기록

    const [aiSession, setAiSession] =
        useState(null);

    // AI 코드 저장 상태

    const [aiRevisionStatus, setAiRevisionStatus] =
        useState("idle");

    const [aiRevisionError, setAiRevisionError] =
        useState("");

    // AI 코드 저장 요청 순서

    const aiSaveQueue = useRef(Promise.resolve());
    const aiSaveVersion = useRef(0);

    // 문제 데이터

    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // 프로그래밍 언어

    const [language, setLanguage] = useState(
        LANGUAGES.includes(initialLanguage)
            ? initialLanguage
            : "Python"
    );

    // 직접 코딩 전용 코드

    const [codes, setCodes] = useState({});

    // AI 활용 학습 전용 코드

    const [aiCode, setAiCode] = useState("");

    // 기존 코드 저장 상태

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

    // 학습 모드별 코드 분리

    const code =
        learningMode === "ai"
            ? aiCode
            : (codes[language] ?? STARTER_CODE[language]);

    // 실행 및 제출 상태

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

    const [restoringSubmission, setRestoringSubmission] =
        useState(false);

    // 학습 모드 변경

    const changeLearningMode = (mode) => {
        if (mode !== "direct" && mode !== "ai") {
            return;
        }

        if (mode === learningMode) {
            return;
        }

        setLearningMode(mode);

        setMessage("");
        setRunResult(null);
        setJudgeResult(null);

        try {
            localStorage.setItem(
                "aicoach:learning-mode",
                mode
            );
        } catch (err) {
            console.warn("학습 모드 저장 실패:", err);
        }
    };

    // 문제 데이터 조회

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

    // 문제 및 언어 변경 시 AI 학습 초기화

    useEffect(() => {
        setAiCode("");
        setAiEditorReady(false);
        setAiSession(null);

        setAiRevisionStatus("idle");
        setAiRevisionError("");

        aiSaveVersion.current += 1;
    }, [problemId, language]);

    // 저장된 직접 코딩 코드 불러오기

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
                    const remoteCodes =
                        await getDrafts(problemId);

                    if (!active) return;

                    setCodes(normalizeCodes(remoteCodes));
                    setDraftUserId(user.id);
                } else {
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
                    "코드를 불러오지 못했습니다. " +
                    "새로고침 후 다시 시도해 주세요."
                );

                setDraftReady(false);
            }
        }

        loadDrafts();

        return () => {
            active = false;
        };
    }, [problemId, STORAGE_KEY]);

    // 직접 코딩 코드 자동 저장

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
                        "브라우저 코드 저장 실패:",
                        err
                    );

                    if (!cancelled) {
                        setDraftSaveStatus("error");
                    }
                }

                return;
            }

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
                        "MySQL 코드 저장 실패:",
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

    // AI 수정 코드 자동 저장

    useEffect(() => {
        if (
            learningMode !== "ai" ||
            !draftReady ||
            !aiSession ||
            aiSession.problemId !== problemId ||
            aiSession.language !== language
        ) {
            return;
        }

        const sessionId = aiSession.id;
        const snapshot = aiCode;

        const version = ++aiSaveVersion.current;

        let cancelled = false;

        setAiRevisionStatus("saving");
        setAiRevisionError("");

        const timer = setTimeout(() => {
            const operation = aiSaveQueue.current
                .catch(() => { })
                .then(() =>
                    saveAIRevisedCode(
                        sessionId,
                        snapshot
                    )
                );

            aiSaveQueue.current = operation;

            operation
                .then(() => {
                    if (
                        !cancelled &&
                        version === aiSaveVersion.current
                    ) {
                        setAiRevisionStatus("saved");
                        setAiRevisionError("");
                    }
                })
                .catch((err) => {
                    if (
                        !cancelled &&
                        version === aiSaveVersion.current
                    ) {
                        setAiRevisionStatus("error");

                        setAiRevisionError(
                            err.message ||
                            "AI 수정 코드 저장에 실패했습니다."
                        );
                    }
                });
        }, 1200);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [
        aiCode,
        aiSession,
        problemId,
        language,
        draftReady,
        learningMode,
    ]);

    // 새로운 AI 제안 생성 시 기존 AI 작업 종료

    const handleAIGenerated = () => {
        setAiCode("");
        setAiSession(null);

        setAiRevisionStatus("idle");
        setAiRevisionError("");

        setRunResult(null);
        setJudgeResult(null);
        setMessage("");

        setAiEditorReady(false);
    };

    // 언어 변경

    const changeLanguage = (nextLanguage) => {
        if (!LANGUAGES.includes(nextLanguage)) {
            return;
        }

        if (nextLanguage === language) {
            return;
        }

        setLanguage(nextLanguage);

        setMessage("");
        setRunResult(null);
        setJudgeResult(null);

        setAiCode("");
        setAiSession(null);
        setAiEditorReady(false);

        setAiRevisionStatus("idle");
        setAiRevisionError("");

        const nextParams =
            new URLSearchParams(window.location.search);

        nextParams.set("language", nextLanguage);

        window.history.replaceState(
            null,
            "",
            `${window.location.pathname}?${nextParams.toString()}`
        );
    };

    // 현재 학습 모드의 코드만 변경

    const changeCode = (value) => {
        if (!draftReady) return;

        if (learningMode === "ai") {
            setAiCode(value);
        } else {
            setCodes((previous) => ({
                ...previous,
                [language]: value,
            }));
        }

        setMessage("");
        setRunResult(null);
        setJudgeResult(null);
    };

    // 코드 초기화

    const resetCode = () => {
        if (!draftReady || isRunning) return;

        changeCode(STARTER_CODE[language]);
    };

    // AI 원본 코드 저장 후 편집기에 적용

    const applyAICode = (generatedCode, sessionId) => {
        if (
            !draftReady ||
            isRunning ||
            typeof generatedCode !== "string" ||
            !generatedCode.trim() ||
            !Number.isSafeInteger(sessionId)
        ) {
            return;
        }

        setAiSession({
            id: sessionId,
            problemId,
            language,
        });

        setAiCode(generatedCode);

        setAiRevisionStatus("saving");
        setAiRevisionError("");

        setRunResult(null);
        setJudgeResult(null);

        setAiEditorReady(true);

        setMessage(
            "새 AI 코드가 적용되었습니다. " +
            "직접 수정한 코드는 별도로 저장됩니다."
        );
    };

    // 이전 제출 코드 복원

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
                "이전 제출 코드를 불러오면 " +
                "현재 작성 중인 코드가 변경됩니다.\n" +
                "계속하시겠습니까?"
            );

            if (!confirmed) return;

            if (learningMode === "ai") {
                setAiCode(submission.code);
            } else {
                setCodes((previous) => ({
                    ...previous,
                    [submission.language]: submission.code,
                }));
            }

            setLanguage(submission.language);

            setRunResult(null);
            setJudgeResult(null);

            setAiEditorReady(true);
            setAiSession(null);

            const nextParams =
                new URLSearchParams(window.location.search);

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
                "이전 제출 코드를 불러왔습니다. " +
                "수정 후 다시 실행하거나 제출할 수 있습니다."
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

    // Docker 코드 실행

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

    // Docker 코드 제출

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

            // AI 학습 모드 제출 시 수정 코드 최종 저장

            if (
                learningMode === "ai" &&
                aiSession &&
                aiSession.problemId === problemId &&
                aiSession.language === language
            ) {
                const sessionId = aiSession.id;
                const submittedCode = code;

                const version =
                    ++aiSaveVersion.current;

                setAiRevisionStatus("saving");

                try {
                    const operation = aiSaveQueue.current
                        .catch(() => { })
                        .then(() =>
                            saveAIRevisedCode(
                                sessionId,
                                submittedCode
                            )
                        );

                    aiSaveQueue.current = operation;

                    await operation;

                    if (
                        version === aiSaveVersion.current
                    ) {
                        setAiRevisionStatus("saved");
                        setAiRevisionError("");
                    }
                } catch (saveError) {
                    if (
                        version === aiSaveVersion.current
                    ) {
                        setAiRevisionStatus("error");

                        setAiRevisionError(
                            saveError.message ||
                            "최종 AI 코드 저장 실패"
                        );
                    }
                }
            }
        } catch (err) {
            setMessage(err.message);
        } finally {
            setIsRunning(false);
        }
    };

    // 직접 코딩 저장 상태 표시

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

    // AI 학습 기록 저장 상태 표시

    const renderAISaveStatus = () => {
        if (!aiSession) return null;

        if (aiRevisionStatus === "saving") {
            return (
                <span>
                    AI 수정 코드 저장 중...
                </span>
            );
        }

        if (aiRevisionStatus === "error") {
            return (
                <span style={{ color: "#dc2626" }}>
                    AI 학습 기록 저장 실패
                </span>
            );
        }

        if (aiRevisionStatus === "saved") {
            return (
                <span style={{ color: "#16a34a" }}>
                    AI 학습 기록 MySQL 저장 완료
                </span>
            );
        }

        return null;
    };

    // 문제 로딩 화면

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

    // 문제 조회 오류 화면

    if (error || !problem) {
        return (
            <>
                <Header />

                <main className="solve-not-found">
                    <h2>문제를 불러오지 못했습니다.</h2>

                    <p>
                        {error || "문제를 찾을 수 없습니다."}
                    </p>

                    <a href="/problems">
                        문제 목록으로 돌아가기
                    </a>
                </main>
            </>
        );
    }

    // 코드 편집기 표시 조건

    const showEditor =
        learningMode === "direct" ||
        aiEditorReady ||
        Number.isSafeInteger(submissionId);

    return (
        <>
            <Header />

            <main className="solve-page">
                <div className="solve-container">

                    <a
                        href="/problems"
                        className="solve-back"
                    >
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

                    {/* 학습 모드 선택 */}

                    <section className="solve-learning-mode">
                        <div className="solve-learning-mode-header">
                            <h2>학습 방식 선택</h2>

                            <p>
                                자신에게 맞는 방식으로
                                코딩을 학습해 보세요.
                            </p>
                        </div>

                        <div className="solve-learning-mode-options">

                            <button
                                type="button"
                                className={`solve-mode-card ${learningMode === "direct"
                                        ? "active"
                                        : ""
                                    }`}
                                onClick={() =>
                                    changeLearningMode("direct")
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
                                        실행·채점한 뒤 AI 피드백으로
                                        코드를 개선합니다.
                                    </p>
                                </div>

                                {learningMode === "direct" && (
                                    <CheckCircle2 size={20} />
                                )}
                            </button>

                            <button
                                type="button"
                                className={`solve-mode-card ${learningMode === "ai"
                                        ? "active"
                                        : ""
                                    }`}
                                onClick={() =>
                                    changeLearningMode("ai")
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
                                        생성된 코드를 검토·수정하며
                                        학습합니다.
                                    </p>
                                </div>

                                {learningMode === "ai" && (
                                    <CheckCircle2 size={20} />
                                )}
                            </button>
                        </div>

                        <div className="solve-mode-description">
                            {learningMode === "direct"
                                ? "직접 코드를 작성하고 Docker 채점과 Gemini 피드백을 활용하세요."
                                : "AI에게 프롬프트를 작성하고 생성된 코드를 검토한 후 직접 개선해 보세요."}
                        </div>
                    </section>

                    {/* 문제 설명과 코드 작업 영역 */}

                    <div className="solve-layout">

                        {/* 왼쪽 문제 설명 */}

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

                        {/* 오른쪽 학습 작업 영역 */}

                        <div className="solve-right-column">

                            {/* AI 활용 학습 */}

                            {learningMode === "ai" && (
                                <AICodingWorkspace
                                    key={`${problemId}:${language}`}
                                    problemId={problemId}
                                    language={language}
                                    currentCode={aiCode}
                                    judgeResult={judgeResult}
                                    runResult={runResult}
                                    onGenerated={handleAIGenerated}
                                    onApplyCode={applyAICode}
                                    disabled={
                                        !draftReady || isRunning
                                    }
                                />
                            )}

                            {/* Monaco 코드 편집기 */}

                            {showEditor && (
                                <section className="solve-card solve-editor-card">

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
                                            flexWrap: "wrap",
                                            gap: "12px",
                                            padding: "10px 16px",
                                            fontSize: "12px",
                                            color: "#64748b",
                                            borderBottom:
                                                "1px solid #e2e8f0",
                                        }}
                                    >
                                        <span
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "7px",
                                            }}
                                        >
                                            {learningMode === "direct"
                                                ? renderSaveStatus()
                                                : renderAISaveStatus() ??
                                                "AI 학습 코드"}
                                        </span>
                                    </div>

                                    {/* AI 코드 저장 오류 */}

                                    {learningMode === "ai" &&
                                        aiRevisionError && (
                                            <div
                                                className="solve-message"
                                                role="alert"
                                            >
                                                {aiRevisionError}
                                            </div>
                                        )}

                                    {/* 이전 제출 코드 불러오기 */}

                                    {Number.isSafeInteger(submissionId) && (
                                        <div
                                            style={{
                                                padding: "12px 16px",
                                                background: "#eff6ff",
                                                borderBottom:
                                                    "1px solid #dbeafe",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent:
                                                    "space-between",
                                                flexWrap: "wrap",
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
                                            disabled={
                                                !draftReady || isRunning
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
                                                    !draftReady || isRunning
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
                                                    !draftReady || isRunning
                                                }
                                            >
                                                <Send size={16} />

                                                {isRunning
                                                    ? "처리 중..."
                                                    : "제출하기"}
                                            </button>
                                        </div>
                                    </div>

                                    {/* 실행 결과 */}

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
                                                    실행하기 버튼을 눌러주세요.
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Docker 제출 채점 결과 */}

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

                                    {/* 안내 메시지 */}

                                    {message && (
                                        <div
                                            className="solve-message"
                                            role="status"
                                        >
                                            {message}
                                        </div>
                                    )}

                                    {/* Gemini 코드 피드백 */}

                                    <AIFeedback
                                        problemId={problemId}
                                        language={language}
                                        code={code}
                                        disabled={
                                            isRunning || !draftReady
                                        }
                                    />

                                    {/* AI 코드 개선 전후 비교 */}

                                    {learningMode === "ai" &&
                                        aiSession && (
                                            <AICodeComparison
                                                key={aiSession.id}
                                                sessionId={aiSession.id}
                                                problemId={problemId}
                                                language={language}
                                                currentCode={aiCode}
                                                disabled={
                                                    isRunning || !draftReady
                                                }
                                            />
                                        )}
                                </section>
                            )}

                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
