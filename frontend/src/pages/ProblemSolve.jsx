
import { useState } from "react";
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
import { PROBLEMS } from "../data/problemsData.js";
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

    const problem = PROBLEMS.find((item) => item.id === problemId);

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

    const runCode = () => {
        if (!code.trim() || code === STARTER_CODE[language]) {
            setRunResult({
                status: "error",
                output: "먼저 코드를 작성해 주세요.",
            });
            return;
        }

        setIsRunning(false);

        setRunResult({
            status: "info",
            output:
                "코드 실행 기능은 현재 준비 중입니다.\n백엔드 코드 실행 환경 연결 후 실제 출력 결과가 표시됩니다.",
        });
    };

    const submitCode = () => {
        if (!code.trim() || code === STARTER_CODE[language]) {
            setMessage("먼저 코드를 작성해 주세요.");
            return;
        }

        setMessage(
            "코드 작성이 확인되었습니다. 실제 실행 및 AI 채점은 백엔드 연결 후 제공됩니다."
        );
    };

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
