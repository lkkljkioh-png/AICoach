
import { useEffect, useState } from "react";
import {
    ArrowLeft,
    Code2,
    RotateCcw,
    Send,
    Lightbulb,
    Play,
} from "lucide-react";

import Header from "../components/Header.jsx";
import Editor from "@monaco-editor/react";
import {
    getProblemById,
    runProblem,
    submitProblem,
} from "../api/problemsApi.js";
import "../styles/ProblemSolve.css";

const LANGUAGES = ["Python", "Java", "C", "C++", "JavaScript"];

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
    Java: "java",
    C: "c",
    "C++": "cpp",
    JavaScript: "javascript",
};

const EDITOR_OPTIONS = {
    fontSize: 14,
    lineHeight: 24,
    minimap: { enabled: false },
    automaticLayout: true,
    scrollBeyondLastLine: false,
    lineNumbers: "on",
    tabSize: 4,

    // 자동완성 비활성화
    quickSuggestions: false,
    suggestOnTriggerCharacters: false,
    wordBasedSuggestions: "off",
    inlineSuggest: { enabled: false },
    parameterHints: { enabled: false },
    snippetSuggestions: "none",
    acceptSuggestionOnEnter: "off",

    // 코드 자동 작성 비활성화
    autoClosingBrackets: "never",
    autoClosingQuotes: "never",
    autoSurround: "never",
    autoIndent: "none",
    formatOnType: false,
    formatOnPaste: false,

    // 추가 힌트 비활성화
    hover: { enabled: false },
    codeLens: false,
    lightbulb: { enabled: "off" },
};


function ProblemSolve() {
    const pathParts = window.location.pathname.split("/");
    const problemId = Number(pathParts[2]);


    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

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


    const params = new URLSearchParams(window.location.search);
    const initialLanguage = params.get("language");

    const [language, setLanguage] = useState(
        LANGUAGES.includes(initialLanguage)
            ? initialLanguage
            : "Python"
    );

    const [codes, setCodes] = useState({});
    const [showHint, setShowHint] = useState(false);
    const [message, setMessage] = useState("");
    const [runResult, setRunResult] = useState(null);
    const [isRunning, setIsRunning] = useState(false);

    const code = codes[language] ?? STARTER_CODE[language];

    const changeLanguage = (nextLanguage) => {
        setLanguage(nextLanguage);
        setMessage("");

        const nextParams = new URLSearchParams(window.location.search);
        nextParams.set("language", nextLanguage);

        window.history.replaceState(
            null,
            "",
            `${window.location.pathname}?${nextParams.toString()}`
        );
    };

    const changeCode = (value) => {
        setCodes((previous) => ({
            ...previous,
            [language]: value,
        }));
        setMessage("");
    };

    const resetCode = () => {
        changeCode(STARTER_CODE[language]);
    };


    const runCode = async () => {
        if (!code.trim() || code === STARTER_CODE[language]) {
            setRunResult({
                status: "error",
                output: "먼저 코드를 작성해 주세요.",
            });
            return;
        }

        setIsRunning(true);
        setMessage("");
        setRunResult({
            status: "info",
            output: "코드 실행 중...",
        });

        try {
            const result = await runProblem(
                problemId, language, code
            );

            setRunResult({
                status: result.status === "SUCCESS"
                    ? "success"
                    : "error",
                output: result.output || "(출력 없음)",
            });

        } catch (error) {
            setRunResult({
                status: "error",
                output: error.message,
            });
        } finally {
            setIsRunning(false);
        }
    };

    const submitCode = async () => {
        if (!code.trim() || code === STARTER_CODE[language]) {
            setMessage("먼저 코드를 작성해 주세요.");
            return;
        }

        setIsRunning(true);
        setMessage("채점 중입니다...");

        try {
            const result = await submitProblem(
                problemId, language, code
            );

            const labels = {
                ACCEPTED: "정답",
                WRONG_ANSWER: "오답",
                RUNTIME_ERROR: "실행 오류",
                TIME_LIMIT: "시간 초과",
                OUTPUT_LIMIT: "출력 제한 초과",
            };

            const label = labels[result.status] || result.status;

            setMessage(
                `${label} | ${result.passed}/${result.total} 통과\n`
                + result.output
            );

            setRunResult({
                status: result.status === "ACCEPTED"
                    ? "success"
                    : "error",
                output: result.output,
            });

        } catch (error) {
            setMessage(error.message);
        } finally {
            setIsRunning(false);
        }
    };

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
                    <a href="/problems">문제 목록으로 돌아가기</a>
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
                    <a href="/problems">문제 목록으로 돌아가기</a>
                </main>
            </>
        );
    }

    return (
        <>
            <Header />

            <main className="solve-page">
                <div className="solve-container">
                    <a href="/problems" className="solve-back">
                        <ArrowLeft size={17} />
                        문제 목록으로
                    </a>

                    <div className="solve-heading">
                        <div>
                            <span className="solve-eyebrow">CODING PRACTICE</span>
                            <h1>{problem.title}</h1>
                            <div className="solve-tags">
                                <span>{problem.level}</span>
                                <span>{problem.category}</span>
                                <span>예상 {problem.time}분</span>
                            </div>
                        </div>
                    </div>

                    <div className="solve-layout">
                        <section className="solve-card">
                            <div className="solve-card-header">
                                <h2>문제 설명</h2>
                            </div>

                            <div className="solve-card-body">
                                <p className="solve-description">
                                    {problem.description}
                                </p>

                                <h3>예시 입력</h3>
                                <pre className="solve-example">{problem.input}</pre>

                                <h3>예시 출력</h3>
                                <pre className="solve-example">{problem.output}</pre>

                                <button
                                    type="button"
                                    className="solve-hint-toggle"
                                    onClick={() => setShowHint(!showHint)}
                                >
                                    <Lightbulb size={17} />
                                    {showHint ? "힌트 숨기기" : "힌트 보기"}
                                </button>

                                {showHint && (
                                    <div className="solve-hint">
                                        {problem.hint}
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="solve-card solve-editor-card">
                            <div className="solve-editor-header">
                                <div className="solve-editor-title">
                                    <Code2 size={19} />
                                    <h2>코드 작성</h2>
                                </div>

                                <select
                                    aria-label="프로그래밍 언어"
                                    value={language}
                                    onChange={(e) => changeLanguage(e.target.value)}
                                >
                                    {LANGUAGES.map((item) => (
                                        <option key={item} value={item}>
                                            {item}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="solve-code-area">
                                <Editor
                                    height="430px"
                                    theme="vs-dark"
                                    language={MONACO_LANGUAGES[language]}
                                    value={code}
                                    onChange={(value) => changeCode(value ?? "")}
                                    options={EDITOR_OPTIONS}
                                />
                            </div>

                            <div className="solve-editor-footer">
                                <button
                                    type="button"
                                    className="solve-reset"
                                    onClick={resetCode}
                                >
                                    <RotateCcw size={16} />
                                    초기화
                                </button>

                                <div className="solve-action-buttons">
                                    <button
                                        type="button"
                                        className="solve-run"
                                        onClick={runCode}
                                        disabled={isRunning}
                                    >
                                        <Play size={16} />
                                        {isRunning ? "실행 중..." : "실행하기"}
                                    </button>

                                    <button
                                        type="button"
                                        className="solve-submit"
                                        onClick={submitCode}
                                    >
                                        <Send size={16} />
                                        제출하기
                                    </button>
                                </div>
                            </div>

                            <div className="solve-result-panel">
                                <div className="solve-result-header">
                                    <span className="solve-result-dot" />
                                    <h3>실행 결과</h3>
                                </div>

                                <div className="solve-result-body">
                                    {runResult ? (
                                        <pre className={`solve-result-output ${runResult.status}`}>
                                            {runResult.output}
                                        </pre>
                                    ) : (
                                        <p className="solve-result-placeholder">
                                            코드를 작성한 후 실행하기 버튼을 눌러주세요.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {message && (
                                <div className="solve-message" role="status">
                                    {message}
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </main>
        </>
    );
}

export default ProblemSolve;
