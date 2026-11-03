
import { useState } from "react";

import {
    AlertCircle,
    CheckCircle2,
    RotateCcw,
    ArrowRight,
} from "lucide-react";

import CodeHighlight from "./CodeHighlight.jsx";
import { HOME_CODE_DEMO } from "../../data/homeData.js";

function HomeCodeDemo() {
    const [fixed, setFixed] = useState(false);

    const {
        filename,
        title,
        buggyCode,
        fixedCode,
        feedback,
        totalTests,
        errorLine,
    } = HOME_CODE_DEMO;

    const lines = fixed ? fixedCode : buggyCode;

    const result = fixed
        ? feedback.correct
        : feedback.incorrect;

    function handleSubmit() {
        setFixed((previous) => !previous);
    }

    return (
        <div
            className="home-editor"
            aria-label="AI 코드 분석 예시"
        >
            {/* EDITOR HEADER */}
            <div className="home-editor-header">
                <div className="home-editor-file">
                    <span className="home-editor-file-dot" />
                    {filename}
                </div>

                <span className="home-editor-task">
                    문제 · {title}
                </span>
            </div>

            {/* CODE AREA */}
            <div className="home-editor-code">
                {lines.map((line, index) => (
                    <div
                        key={index}
                        className={`code-line ${!fixed && index + 1 === errorLine
                                ? "is-flag"
                                : ""
                            }`}
                    >
                        <span className="line-number">
                            {index + 1}
                        </span>

                        <code>
                            <CodeHighlight text={line} />
                        </code>
                    </div>
                ))}
            </div>

            {/* AI FEEDBACK */}
            <div
                className={`home-editor-feedback ${fixed ? "ok" : "bad"
                    }`}
                aria-live="polite"
            >
                <div className="home-feedback-title">
                    {fixed ? (
                        <CheckCircle2
                            size={17}
                            strokeWidth={2}
                        />
                    ) : (
                        <AlertCircle
                            size={17}
                            strokeWidth={2}
                        />
                    )}

                    {result.title}
                </div>

                <p>{result.message}</p>
            </div>

            {/* EDITOR FOOTER */}
            <div className="home-editor-footer">
                <span className="home-test-summary">
                    {fixed ? (
                        <CheckCircle2
                            size={15}
                            className="test-icon-success"
                        />
                    ) : (
                        <AlertCircle
                            size={15}
                            className="test-icon-warning"
                        />
                    )}

                    테스트 {totalTests}개 중{" "}
                    {result.passedTests}개 통과
                </span>

                <button
                    type="button"
                    onClick={handleSubmit}
                >
                    {fixed ? (
                        <>
                            처음 상태로
                            <RotateCcw size={15} />
                        </>
                    ) : (
                        <>
                            조건 추가해서 다시 제출
                            <ArrowRight size={15} />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

export default HomeCodeDemo;
