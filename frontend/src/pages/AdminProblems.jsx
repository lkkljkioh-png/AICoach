
import { useEffect, useState } from "react";
import {
    Sparkles,
    Save,
    CheckCircle2,
    AlertCircle,
    LoaderCircle,
    ArrowLeft,
    Eye,
} from "lucide-react";

import Header from "../components/Header.jsx";

import { getCurrentUser } from "../api/authApi.js";

import {
    generateAIProblem,
    saveAIProblem,
    publishAIProblem,
} from "../api/aiProblemsApi.js";

import "../styles/AdminProblems.css";

const LEVELS = [
    { value: "EASY", label: "쉬움" },
    { value: "MEDIUM", label: "보통" },
    { value: "HARD", label: "어려움" },
];

function AdminProblems() {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    const [level, setLevel] = useState("EASY");
    const [category, setCategory] = useState("구현");

    const [problem, setProblem] = useState(null);
    const [saved, setSaved] = useState(null);

    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        getCurrentUser()
            .then(setUser)
            .catch((err) => setError(err.message))
            .finally(() => setAuthLoading(false));
    }, []);

    const handleGenerate = async () => {
        if (generating || saving || publishing) return;

        setGenerating(true);
        setProblem(null);
        setSaved(null);
        setError("");
        setMessage("");

        try {
            const result = await generateAIProblem(
                level,
                category.trim()
            );

            setProblem(result);
            setMessage(
                "AI 문제 생성 완료! 내용을 확인한 후 저장하세요."
            );
        } catch (err) {
            setError(err.message);
        } finally {
            setGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!problem || saving || publishing) return;

        setSaving(true);
        setError("");
        setMessage("");

        try {
            const result = await saveAIProblem(problem);

            setSaved(result);

            setMessage(
                `Docker 검증 성공! ` +
                `${result.passed}/${result.total}개 통과. ` +
                `문제 ID: ${result.problemId}`
            );
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handlePublish = async () => {
        if (
            !saved ||
            saved.published ||
            publishing
        ) {
            return;
        }

        if (!window.confirm(
            "이 문제를 전체 사용자에게 공개하시겠습니까?"
        )) {
            return;
        }

        setPublishing(true);
        setError("");
        setMessage("");

        try {
            await publishAIProblem(saved.problemId);

            setSaved((previous) => ({
                ...previous,
                published: true,
            }));

            setMessage(
                "문제가 공개되었습니다. 이제 문제 목록에서 확인할 수 있습니다."
            );
        } catch (err) {
            setError(err.message);
        } finally {
            setPublishing(false);
        }
    };

    if (authLoading) {
        return (
            <>
                <Header />
                <main className="admin-problems">
                    <p>로그인 상태 확인 중...</p>
                </main>
            </>
        );
    }

    if (!user) {
        return (
            <>
                <Header />
                <main className="admin-problems">
                    <h2>로그인이 필요합니다.</h2>
                    <a href="/login">로그인하기</a>
                </main>
            </>
        );
    }

    return (
        <>
            <Header />

            <main className="admin-problems">
                <a href="/problems" className="admin-back">
                    <ArrowLeft size={17} />
                    문제 목록으로
                </a>

                <div className="admin-heading">
                    <Sparkles size={28} />
                    <div>
                        <h1>AI 문제 관리</h1>
                        <p>
                            Gemini로 코딩 테스트 문제를 생성하고
                            Docker 검증 후 저장합니다.
                        </p>
                    </div>
                </div>

                <section className="admin-panel">
                    <h2>새 문제 생성</h2>

                    <div className="admin-fields">
                        <label>
                            난이도
                            <select
                                value={level}
                                onChange={(e) => setLevel(e.target.value)}
                                disabled={generating}
                            >
                                {LEVELS.map((item) => (
                                    <option
                                        key={item.value}
                                        value={item.value}
                                    >
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            문제 유형
                            <input
                                value={category}
                                onChange={(e) =>
                                    setCategory(e.target.value)
                                }
                                placeholder="예: 배열, 문자열, DFS"
                                maxLength={40}
                                disabled={generating}
                            />
                        </label>
                    </div>

                    <button
                        className="admin-primary"
                        onClick={handleGenerate}
                        disabled={
                            generating ||
                            saving ||
                            publishing ||
                            category.trim().length < 2
                        }
                    >
                        {generating ? (
                            <LoaderCircle
                                size={18}
                                className="admin-spin"
                            />
                        ) : (
                            <Sparkles size={18} />
                        )}
                        {generating
                            ? "AI 문제 생성 중..."
                            : "AI 문제 생성하기"}
                    </button>
                </section>

                {error && (
                    <div className="admin-alert admin-error">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {message && (
                    <div className="admin-alert admin-success">
                        <CheckCircle2 size={18} />
                        <span>{message}</span>
                    </div>
                )}

                {problem && (
                    <section className="admin-panel">
                        <div className="admin-preview-heading">
                            <h2>생성된 문제 미리보기</h2>
                            <span className="admin-level">
                                {LEVELS.find(
                                    (item) => item.value === problem.level
                                )?.label}
                            </span>
                        </div>

                        <h3>{problem.title}</h3>

                        <p className="admin-meta">
                            {problem.category} · 예상 {problem.time}분
                        </p>

                        <h4>문제 설명</h4>
                        <div className="admin-description">
                            {problem.description}
                        </div>

                        <div className="admin-examples">
                            <div>
                                <h4>예제 입력</h4>
                                <pre>{problem.input || "(입력 없음)"}</pre>
                            </div>
                            <div>
                                <h4>예제 출력</h4>
                                <pre>{problem.output}</pre>
                            </div>
                        </div>

                        <h4>힌트</h4>
                        <p>{problem.hint || "힌트 없음"}</p>

                        <details className="admin-details">
                            <summary>Python 정답 코드 확인</summary>
                            <pre>{problem.referenceSolution}</pre>
                        </details>

                        <details className="admin-details">
                            <summary>
                                테스트케이스 확인 (
                                {problem.testCases?.length ?? 0}개)
                            </summary>

                            {problem.testCases?.map((test, index) => (
                                <div
                                    className="admin-testcase"
                                    key={index}
                                >
                                    <strong>테스트 {index + 1}</strong>

                                    <p>입력</p>
                                    <pre>{test.input || "(입력 없음)"}</pre>

                                    <p>예상 출력</p>
                                    <pre>{test.expectedOutput}</pre>
                                </div>
                            ))}
                        </details>

                        {!saved && (
                            <button
                                className="admin-primary"
                                onClick={handleSave}
                                disabled={saving || generating}
                            >
                                {saving ? (
                                    <LoaderCircle
                                        size={18}
                                        className="admin-spin"
                                    />
                                ) : (
                                    <Save size={18} />
                                )}

                                {saving
                                    ? "Docker 검증 및 저장 중..."
                                    : "검증 후 MySQL 저장"}
                            </button>
                        )}

                        {saved && (
                            <div className="admin-saved">
                                <CheckCircle2 size={20} />

                                <div>
                                    <strong>검증 성공</strong>
                                    <p>
                                        {saved.passed}/{saved.total}
                                        개 테스트 통과
                                    </p>
                                    <p>문제 ID: {saved.problemId}</p>
                                </div>

                                {!saved.published ? (
                                    <button
                                        className="admin-primary"
                                        onClick={handlePublish}
                                        disabled={publishing}
                                    >
                                        <Eye size={17} />
                                        {publishing
                                            ? "공개 중..."
                                            : "문제 공개"}
                                    </button>
                                ) : (
                                    <a
                                        className="admin-primary"
                                        href={`/problems/${saved.problemId}`}
                                    >
                                        문제 풀러 가기
                                    </a>
                                )}
                            </div>
                        )}
                    </section>
                )}
            </main>
        </>
    );
}

export default AdminProblems;
