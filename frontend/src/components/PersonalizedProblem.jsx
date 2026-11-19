import { useEffect, useState } from "react";
import {
    Sparkles,
    BrainCircuit,
    AlertCircle,
    CheckCircle2,
    RefreshCw,
    BookOpen,
} from "lucide-react";


import {
    generatePersonalizedProblem,
    savePersonalizedProblem,
    getMyPersonalizedProblems,
} from "../api/personalizedProblemApi.js";

import "../styles/PersonalizedProblem.css";

const LEVEL_LABELS = {
    EASY: "쉬움",
    MEDIUM: "보통",
    HARD: "어려움",
};

export default function PersonalizedProblem() {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [saving, setSaving] = useState(false);
    const [savedProblem, setSavedProblem] = useState(null);
    const [myProblems, setMyProblems] = useState([]);
    const [listError, setListError] = useState("");

    useEffect(() => {
        let active = true;

        getMyPersonalizedProblems()
            .then((data) => {
                if (active) {
                    setMyProblems(
                        Array.isArray(data) ? data : []
                    );
                }
            })
            .catch((err) => {
                if (active) {
                    setListError(err.message);
                }
            });

        return () => {
            active = false;
        };
    }, []);

    const handleSaveProblem = async () => {
        if (!problem || saving || savedProblem) return;

        setSaving(true);
        setError("");

        try {
            const saved = await savePersonalizedProblem(problem);

            setSavedProblem(saved);

            setMyProblems((previous) => [
                {
                    id: saved.problemId,
                    title: problem.title,
                    category: problem.category,
                    level: problem.level,
                    time: problem.time,
                },
                ...previous,
            ]);
        } catch (err) {
            setError(
                err.message || "문제를 저장하지 못했습니다."
            );
        } finally {
            setSaving(false);
        }
    };


    const handleGenerate = async () => {
        if (loading) return;

        setLoading(true);
        setError("");
        setResult(null);
        setSavedProblem(null);


        try {
            const data = await generatePersonalizedProblem();
            setResult(data);
        } catch (err) {
            setError(
                err.message || "문제를 생성하지 못했습니다."
            );
        } finally {
            setLoading(false);
        }
    };

    const problem = result?.problem;

    return (
        <section className="personal-problem">
            <div className="personal-problem-header">
                <div className="personal-problem-icon">
                    <BrainCircuit size={25} />
                </div>

                <div>
                    <span>AI PERSONALIZED PRACTICE</span>
                    <h2>AI 맞춤 문제 생성</h2>
                    <p>
                        나의 제출 기록과 취약 유형을 분석해
                        새로운 코딩 문제를 생성합니다.
                    </p>
                </div>
            </div>

            {!result && !loading && (
                <div className="personal-problem-intro">
                    <Sparkles size={32} />

                    <h3>나에게 필요한 문제를 만들어 볼까요?</h3>

                    <p>
                        AI가 현재 학습 수준과 부족한 영역에
                        맞춰 새로운 문제를 출제합니다.
                    </p>
                </div>
            )}

            {loading && (
                <div
                    className="personal-problem-loading"
                    role="status"
                >
                    <RefreshCw
                        size={29}
                        className="personal-problem-spin"
                    />

                    <strong>Gemini가 문제를 생성하고 있습니다.</strong>

                    <p>
                        학습 기록을 반영해 문제와
                        테스트케이스를 구성하고 있어요.
                    </p>
                </div>
            )}

            {error && (
                <div
                    className="personal-problem-error"
                    role="alert"
                >
                    <AlertCircle size={19} />
                    <span>{error}</span>
                </div>
            )}

            {problem && (
                <div className="personal-problem-result">
                    <div className="personal-problem-success">
                        <CheckCircle2 size={19} />
                        개인 맞춤 문제 생성 완료
                    </div>

                    <div className="personal-problem-tags">
                        <span>
                            {LEVEL_LABELS[result.recommendedLevel]
                                || result.recommendedLevel}
                        </span>
                        <span>{result.weakCategory}</span>
                        <span>약 {problem.time}분</span>
                    </div>

                    <h3>{problem.title}</h3>

                    <div className="personal-problem-insight">
                        <strong>이 문제가 추천된 이유</strong>
                        <p>{result.insight}</p>
                    </div>

                    <div className="personal-problem-section">
                        <h4>
                            <BookOpen size={17} />
                            문제 설명
                        </h4>
                        <p>{problem.description}</p>
                    </div>

                    <div className="personal-problem-examples">
                        <div>
                            <h4>예제 입력</h4>
                            <pre>{problem.input || "(입력 없음)"}</pre>
                        </div>

                        <div>
                            <h4>예제 출력</h4>
                            <pre>{problem.output}</pre>
                        </div>
                    </div>

                    <details className="personal-problem-hint">
                        <summary>힌트 보기</summary>
                        <p>{problem.hint || "힌트가 없습니다."}</p>
                    </details>


                    <div className="personal-problem-actions">
                        {!savedProblem ? (
                            <>
                                <button
                                    type="button"
                                    className="personal-problem-button"
                                    onClick={handleSaveProblem}
                                    disabled={saving || loading}
                                >
                                    {saving
                                        ? "Docker 검증 및 저장 중..."
                                        : "문제 저장하고 풀기"}
                                </button>

                                <p className="personal-problem-notice">
                                    저장 전에 Docker로 정답 코드를 검증합니다.
                                    검증을 통과한 문제만 내 문제로 저장됩니다.
                                </p>
                            </>
                        ) : (
                            <div className="personal-problem-saved">
                                <p>
                                    문제가 저장되었습니다.
                                    이제 코딩을 시작할 수 있어요.
                                </p>

                                <a
                                    className="personal-problem-button"
                                    href={`/problems/${savedProblem.problemId}`}
                                >
                                    코드 작성하러 가기
                                </a>
                            </div>
                        )}
                    </div>

                </div>
            )}

            <button
                type="button"
                className="personal-problem-button"
                onClick={handleGenerate}
                disabled={loading}
            >
                {loading ? (
                    <RefreshCw
                        size={18}
                        className="personal-problem-spin"
                    />
                ) : (
                    <Sparkles size={18} />
                )}

                {loading
                    ? "문제 생성 중..."
                    : result
                        ? "다른 맞춤 문제 생성하기"
                        : "내 취약점 기반 문제 생성하기"}
            </button>

            <div className="personal-problem-my-list">
                <h3>내가 생성한 문제</h3>

                {listError && (
                    <p role="alert">{listError}</p>
                )}

                {!listError && myProblems.length === 0 && (
                    <p>아직 저장한 개인 문제가 없습니다.</p>
                )}

                {myProblems.map((item) => (
                    <div
                        key={item.id}
                        className="personal-problem-my-item"
                    >
                        <div>
                            <strong>{item.title}</strong>
                            <span>
                                {LEVEL_LABELS[item.level] || item.level}
                                {" · "}
                                {item.category}
                            </span>
                        </div>

                        <a href={`/problems/${item.id}`}>
                            문제 풀기
                        </a>
                    </div>
                ))}
            </div>

        </section>
    );
}
