
import { useEffect, useMemo, useState } from "react";
import {
    Search,
    ChevronDown,
    ChevronUp,
    BookOpen,
    RotateCcw,
    ArrowUpDown,
} from "lucide-react";

import Header from "../components/Header.jsx";
import { getProblems } from "../api/problemsApi.js";
import "../styles/Problems.css";

import {
    getMyPersonalizedProblems,
} from "../api/personalizedProblemApi.js";

import {
    getProblemById,
} from "../api/problemsApi.js";

const LEVELS = [
    { value: "ALL", label: "전체 난이도" },
    { value: "EASY", label: "쉬움" },
    { value: "MEDIUM", label: "보통" },
    { value: "HARD", label: "어려움" },
];

const LEVEL_LABELS = {
    EASY: "쉬움",
    MEDIUM: "보통",
    HARD: "어려움",
};

const LEVEL_ORDER = {
    EASY: 1,
    MEDIUM: 2,
    HARD: 3,
};

const SORT_OPTIONS = [
    { value: "default", label: "기본순" },
    { value: "newest", label: "최신순" },
    { value: "oldest", label: "오래된순" },
    { value: "easy", label: "난이도 낮은순" },
    { value: "hard", label: "난이도 높은순" },
    { value: "title", label: "제목순" },
];

const PROBLEM_TYPES = [
    { value: "ALL", label: "전체 문제" },
    { value: "PUBLIC", label: "일반 문제" },
    { value: "PERSONAL", label: "내 AI 문제" },
];

const LANGUAGES = [
    { value: "Python", label: "Python", supported: true },
    { value: "JavaScript", label: "JavaScript", supported: true },
    { value: "Java", label: "Java", supported: true },
    { value: "C", label: "C", supported: true },
    { value: "C++", label: "C++", supported: true },
];



function Problems() {
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [level, setLevel] = useState("ALL");
    const [category, setCategory] = useState("ALL");
    const [sort, setSort] = useState("default");
    const [language, setLanguage] = useState("Python");
    const [expanded, setExpanded] = useState(null);
    const [problemType, setProblemType] = useState("ALL");



    useEffect(() => {
        let active = true;

        async function loadProblems() {
            setLoading(true);
            setError("");

            try {
                // 공개 문제 불러오기
                const publicProblems = await getProblems();

                let personalProblems = [];

                try {
                    // 로그인 사용자의 개인 문제 불러오기
                    const myProblems =
                        await getMyPersonalizedProblems();

                    if (Array.isArray(myProblems)) {
                        // 개인 문제 상세 정보 가져오기
                        const results = await Promise.all(
                            myProblems.map(async (item) => {
                                try {
                                    const detail =
                                        await getProblemById(item.id);

                                    return {
                                        ...detail,
                                        isPersonal: true,
                                    };
                                } catch {
                                    return {
                                        ...item,
                                        isPersonal: true,
                                    };
                                }
                            })
                        );

                        personalProblems = results;
                    }
                } catch (err) {
                    // 비로그인 사용자는 공개 문제만 표시
                    if (err.status !== 401) {
                        console.error(
                            "개인 문제 조회 실패:",
                            err
                        );
                    }
                }

                const merged = new Map();

                for (const problem of [
                    ...(Array.isArray(publicProblems)
                        ? publicProblems
                        : []),
                    ...personalProblems,
                ]) {
                    merged.set(problem.id, problem);
                }

                if (active) {
                    setProblems([...merged.values()]);
                }
            } catch (err) {
                if (active) {
                    setError(
                        err.message ||
                        "문제 목록을 불러오지 못했습니다."
                    );
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        loadProblems();

        return () => {
            active = false;
        };
    }, []);


    const categories = useMemo(() => {
        return [
            "ALL",
            ...new Set(
                problems.map((problem) => problem.category).filter(Boolean)
            ),
        ];
    }, [problems]);

    const filtered = useMemo(() => {
        const keyword = search.trim().toLocaleLowerCase();

        const result = problems.filter((problem) => {
            const matchesSearch =
                !keyword ||
                [
                    problem.title,
                    problem.category,
                    problem.description,
                ].some((value) =>
                    String(value ?? "")
                        .toLocaleLowerCase()
                        .includes(keyword)
                );

            const matchesProblemType =
                problemType === "ALL" ||
                (problemType === "PUBLIC" && !problem.isPersonal) ||
                (problemType === "PERSONAL" && problem.isPersonal);

            const matchesLevel =
                level === "ALL" || problem.level === level;

            const matchesCategory =
                category === "ALL" || problem.category === category;

            return (
                matchesSearch &&
                matchesProblemType &&
                matchesLevel &&
                matchesCategory
            );

        });

        const rank = (problem) =>
            LEVEL_ORDER[problem.level] ?? 99;

        result.sort((a, b) => {
            switch (sort) {
                case "newest":
                    return b.id - a.id;

                case "oldest":
                    return a.id - b.id;

                case "easy":
                    return rank(a) - rank(b) || a.id - b.id;

                case "hard":
                    return rank(b) - rank(a) || a.id - b.id;

                case "title":
                    return a.title.localeCompare(b.title, "ko");

                default:
                    return a.id - b.id;
            }
        });

        return result;
    }, [problems, search, problemType, level, category, sort]);

    const resetFilters = () => {
        setSearch("");
        setLevel("ALL");
        setCategory("ALL");
        setSort("default");
        setExpanded(null);
        setProblemType("ALL");

    };

    const getProblemLink = (id) =>
        `/problems/${id}?language=${encodeURIComponent(language)}`;

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
                                원하는 문제를 검색하고 직접 코드를 작성해 보세요.
                            </p>
                        </div>

                        <div className="problems-stat">
                            <strong>{problems.length}</strong>
                            <span>준비된 연습 문제</span>
                        </div>
                    </div>

                    <div className="problems-toolbar">
                        <label className="problems-search">
                            <Search size={18} />
                            <input
                                aria-label="문제 검색"
                                type="search"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="문제명, 설명 또는 유형 검색"
                            />
                        </label>


                        <select
                            className="problems-select"
                            aria-label="문제 종류 선택"
                            value={problemType}
                            onChange={(event) =>
                                setProblemType(event.target.value)
                            }
                        >
                            {PROBLEM_TYPES.map((item) => (
                                <option
                                    key={item.value}
                                    value={item.value}
                                >
                                    {item.label}
                                </option>
                            ))}
                        </select>

                        <select
                            className="problems-select"
                            aria-label="난이도 선택"
                            value={level}
                            onChange={(event) =>
                                setLevel(event.target.value)
                            }
                        >
                            {LEVELS.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>

                        <select
                            className="problems-select"
                            aria-label="유형 선택"
                            value={category}
                            onChange={(event) =>
                                setCategory(event.target.value)
                            }
                        >
                            {categories.map((item) => (
                                <option key={item} value={item}>
                                    {item === "ALL" ? "전체 유형" : item}
                                </option>
                            ))}
                        </select>

                        <select
                            className="problems-select"
                            aria-label="프로그래밍 언어 선택"
                            value={language}
                            onChange={(event) =>
                                setLanguage(event.target.value)
                            }
                        >
                            {LANGUAGES.map((item) => (
                                <option
                                    key={item.value}
                                    value={item.value}
                                    disabled={!item.supported}
                                >
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="problems-filter-bottom">
                        <div className="problems-filter-info">
                            <span>
                                검색 결과 <strong>{filtered.length}</strong>개
                            </span>
                            <button
                                type="button"
                                className="problems-reset-btn"
                                onClick={resetFilters}
                            >
                                <RotateCcw size={14} />
                                필터 초기화
                            </button>
                        </div>

                        <label className="problems-sort">
                            <ArrowUpDown size={15} />
                            <select
                                aria-label="문제 정렬"
                                value={sort}
                                onChange={(event) =>
                                    setSort(event.target.value)
                                }
                            >
                                {SORT_OPTIONS.map((item) => (
                                    <option key={item.value} value={item.value}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <section className="problems-panel">
                        <div className="problems-panel-title">
                            <h2>전체 문제</h2>
                            <span>
                                {language} · {filtered.length}개 문제
                            </span>
                        </div>

                        {loading ? (
                            <div className="problems-empty">
                                <h3>문제를 불러오는 중입니다...</h3>
                            </div>
                        ) : error ? (
                            <div className="problems-empty">
                                <h3>문제를 불러오지 못했어요.</h3>
                                <p>{error}</p>
                                <p>Spring Boot와 MySQL 연결을 확인해 주세요.</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="problems-empty">
                                <BookOpen size={32} />
                                <h3>검색 결과가 없어요</h3>
                                <p>검색어나 필터 조건을 변경해 보세요.</p>
                                <button
                                    type="button"
                                    className="problems-empty-reset"
                                    onClick={resetFilters}
                                >
                                    필터 초기화
                                </button>
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
                                                    href={getProblemLink(problem.id)}
                                                >

                                                    {problem.title}

                                                    {problem.isPersonal && (
                                                        <span className="problem-personal-badge">
                                                            내 AI 문제
                                                        </span>
                                                    )}

                                                </a>
                                            </h3>

                                            <div className="problem-tags">
                                                <span>{problem.category}</span>
                                                <span>{language}</span>
                                                <span>약 {problem.time}분</span>
                                            </div>
                                        </div>

                                        <span
                                            className={`problem-level ${problem.level}`}
                                        >
                                            {LEVEL_LABELS[problem.level] ??
                                                problem.level}
                                        </span>

                                        <button
                                            type="button"
                                            className="problem-preview-btn"
                                            aria-expanded={expanded === problem.id}
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
                                                    <pre>{problem.input ?? "입력 없음"}</pre>
                                                </div>
                                                <div>
                                                    <small>예시 출력</small>
                                                    <pre>{problem.output ?? "출력 없음"}</pre>
                                                </div>
                                            </div>

                                            {problem.hint && (
                                                <div className="problem-hint">
                                                    💡 학습 힌트: {problem.hint}
                                                </div>
                                            )}

                                            <a
                                                className="problem-solve-link"
                                                href={getProblemLink(problem.id)}
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
                        문제 목록은 AICoach 데이터베이스에서 불러옵니다.
                        현재 코드 실행 및 채점은 Python을 지원합니다.
                        다른 언어는 추후 지원할 예정입니다.
                    </p>
                </div>
            </main>
        </>
    );
}

export default Problems;
