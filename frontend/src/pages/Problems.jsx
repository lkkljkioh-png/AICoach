
import { useMemo, useState } from "react";

import {
    Search,
    ChevronDown,
    ChevronUp,
    BookOpen,
} from "lucide-react";

import Header from "../components/Header.jsx";
import { PROBLEMS } from "../data/problemsData.js";

import "../styles/Problems.css";

const LEVELS = [
    "전체 난이도",
    "입문",
    "초급",
    "중급",
    "고급",
];

const CATEGORIES = [
    "전체 유형",
    ...new Set(PROBLEMS.map((problem) => problem.category)),
];

const LANGUAGES = [
    "Python",
    "Java",
    "C",
    "C++",
    "JavaScript",
];

function Problems() {
    const [search, setSearch] = useState("");
    const [level, setLevel] = useState("전체 난이도");
    const [category, setCategory] = useState("전체 유형");
    const [language, setLanguage] = useState("Python");
    const [expanded, setExpanded] = useState(null);

    const filtered = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return PROBLEMS.filter((problem) => {
            const matchLevel =
                level === "전체 난이도" ||
                problem.level === level;

            const matchCategory =
                category === "전체 유형" ||
                problem.category === category;

            const matchSearch =
                !keyword ||
                [
                    problem.title,
                    problem.category,
                    problem.description,
                ].some((value) =>
                    value.toLowerCase().includes(keyword)
                );

            return matchLevel && matchCategory && matchSearch;
        });
    }, [search, level, category]);

    return (
        <>
            <Header />

            <main className="problems-page">
                <div className="problems-container">
                    <span className="problems-eyebrow">
                        PRACTICE WITH AICOACH
                    </span>

                    <div className="problems-heading">
                        <div>
                            <h1>문제 풀이</h1>

                            <p>
                                내 수준에 맞는 문제를 골라보세요.
                                <br />
                                원하는 프로그래밍 언어로 문제를
                                해결할 수 있어요.
                            </p>
                        </div>

                        <div className="problems-stat">
                            <strong>{PROBLEMS.length}</strong>
                            <span>준비된 연습 문제</span>
                        </div>
                    </div>

                    {/* 검색 및 필터 */}

                    <div className="problems-toolbar">
                        <label className="problems-search">
                            <Search size={18} />

                            <input
                                aria-label="문제 검색"
                                value={search}
                                onChange={(e) =>
                                    setSearch(e.target.value)
                                }
                                placeholder="문제명 또는 유형 검색"
                            />
                        </label>

                        {/* 난이도 */}

                        <select
                            className="problems-select"
                            aria-label="난이도 선택"
                            value={level}
                            onChange={(e) =>
                                setLevel(e.target.value)
                            }
                        >
                            {LEVELS.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>

                        {/* 문제 유형 */}

                        <select
                            className="problems-select"
                            aria-label="유형 선택"
                            value={category}
                            onChange={(e) =>
                                setCategory(e.target.value)
                            }
                        >
                            {CATEGORIES.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>

                        {/* 프로그래밍 언어 */}

                        <select
                            className="problems-select"
                            aria-label="프로그래밍 언어 선택"
                            value={language}
                            onChange={(e) =>
                                setLanguage(e.target.value)
                            }
                        >
                            {LANGUAGES.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 문제 목록 */}

                    <section className="problems-panel">
                        <div className="problems-panel-title">
                            <h2>전체 문제</h2>

                            <span>
                                {language} · {filtered.length}개 문제
                            </span>
                        </div>

                        {filtered.length === 0 ? (
                            <div className="problems-empty">
                                <BookOpen size={32} />

                                <h3>검색 결과가 없어요</h3>

                                <p>
                                    검색어나 필터 조건을 변경해 보세요.
                                </p>
                            </div>
                        ) : (
                            filtered.map((problem) => (
                                <article
                                    className="problem-item"
                                    key={problem.id}
                                >
                                    <div className="problem-row">
                                        <span className="problem-index">
                                            {String(problem.id).padStart(2, "0")}
                                        </span>

                                        <div className="problem-content">
                                            <h3>
                                                <a
                                                    className="problem-title-link"
                                                    href={`/problems/${problem.id}?language=${encodeURIComponent(language)}`}
                                                >
                                                    {problem.title}
                                                </a>
                                            </h3>

                                            <div className="problem-tags">
                                                <span>{problem.category}</span>
                                                <span>{language}</span>
                                                <span>
                                                    약 {problem.time}분
                                                </span>
                                            </div>
                                        </div>

                                        <span
                                            className={`problem-level ${problem.level}`}
                                        >
                                            {problem.level}
                                        </span>

                                        <button
                                            type="button"
                                            className="problem-preview-btn"
                                            aria-expanded={
                                                expanded === problem.id
                                            }
                                            onClick={() =>
                                                setExpanded(
                                                    expanded === problem.id
                                                        ? null
                                                        : problem.id
                                                )
                                            }
                                        >
                                            {expanded === problem.id
                                                ? "접기"
                                                : "문제 미리보기"}

                                            {expanded === problem.id ? (
                                                <ChevronUp size={15} />
                                            ) : (
                                                <ChevronDown size={15} />
                                            )}
                                        </button>
                                    </div>

                                    {expanded === problem.id && (
                                        <div className="problem-details">
                                            <h4>문제 설명</h4>

                                            <p>{problem.description}</p>

                                            <div className="problem-example">
                                                <div>
                                                    <small>예시 입력</small>
                                                    <pre>{problem.input}</pre>
                                                </div>

                                                <div>
                                                    <small>예시 출력</small>
                                                    <pre>{problem.output}</pre>
                                                </div>
                                            </div>

                                            <div className="problem-hint">
                                                💡 학습 힌트: {problem.hint}
                                            </div>
                                            <a
                                                className="problem-solve-link"
                                                href={`/problems/${problem.id}?language=${encodeURIComponent(language)}`}
                                            >
                                                이 문제 풀기 →
                                            </a>
                                        </div>
                                    )}
                                </article>
                            ))
                        )}
                    </section>

                    <p className="problems-note">
                        현재는 예시 문제를 사용하는
                        프론트엔드 화면입니다.
                        실제 코드 실행 및 AI 채점 기능은
                        추후 연결됩니다.
                    </p>
                </div>
            </main>
        </>
    );
}

export default Problems;
