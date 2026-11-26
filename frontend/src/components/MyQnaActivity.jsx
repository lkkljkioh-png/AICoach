import { useEffect, useMemo, useState } from "react";

import {
    MessageSquare,
    MessagesSquare,
    CheckCircle2,
    Award,
    Eye,
    Clock3,
    ChevronRight,
    ChevronLeft,
    ArrowRight,
    RefreshCw,
    Search,
} from "lucide-react";

import { getMyQaActivity } from "../api/myQaApi.js";
import QnaListActions from "./QnaListActions.jsx";
import "../styles/MyQnaActivity.css";

const LANGUAGES = {
    GENERAL: "일반",
    PYTHON: "Python",
    JAVASCRIPT: "JavaScript",
    JAVA: "Java",
    C: "C",
    CPP: "C++",
    SQL: "SQL",
};

const PAGE_SIZE = 10;

const EMPTY_DATA = {
    stats: {
        questionCount: 0,
        solvedQuestionCount: 0,
        answerCount: 0,
        acceptedAnswerCount: 0,
    },
    questions: [],
    answers: [],
};

function isTrue(value) {
    return (
        value === true ||
        value === 1 ||
        value === "1" ||
        value === "true"
    );
}

function formatDate(value) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleDateString("ko-KR");
}

function StatCard({ icon, label, value }) {
    return (
        <div className="my-stat-card">
            <div className="my-stat-icon">
                {icon}
            </div>

            <span>{label}</span>

            <strong>
                {Number(value || 0).toLocaleString("ko-KR")}
                <small>개</small>
            </strong>
        </div>
    );
}

export default function MyQnaActivity() {
    const [data, setData] = useState(EMPTY_DATA);

    const [activeTab, setActiveTab] =
        useState("questions");

    const [status, setStatus] = useState("ALL");

    const [search, setSearch] = useState("");

    const [page, setPage] = useState(1);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [unauthorized, setUnauthorized] =
        useState(false);

    const [refreshKey, setRefreshKey] =
        useState(0);

    // Q&A 활동 조회
    useEffect(() => {
        const controller = new AbortController();

        let active = true;

        async function load() {
            setLoading(true);
            setError("");
            setUnauthorized(false);

            try {
                const result = await getMyQaActivity(
                    controller.signal
                );

                if (!active) return;

                setData({
                    stats: {
                        ...EMPTY_DATA.stats,
                        ...result.stats,
                    },
                    questions: Array.isArray(result.questions)
                        ? result.questions
                        : [],
                    answers: Array.isArray(result.answers)
                        ? result.answers
                        : [],
                });
            } catch (err) {
                if (!active || err.name === "AbortError") {
                    return;
                }

                if (err.status === 401) {
                    setUnauthorized(true);
                }

                setError(
                    err.message ||
                    "Q&A 활동을 불러오지 못했습니다."
                );
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        load();

        return () => {
            active = false;
            controller.abort();
        };
    }, [refreshKey]);

    // 검색 및 상태별 필터링
    const filteredItems = useMemo(() => {
        const source =
            activeTab === "questions"
                ? data.questions
                : data.answers;

        const keyword = search.trim().toLowerCase();

        return source.filter((item) => {
            const completed =
                activeTab === "questions"
                    ? isTrue(item.solved)
                    : isTrue(item.accepted);

            if (status === "COMPLETED" && !completed) {
                return false;
            }

            if (status === "PENDING" && completed) {
                return false;
            }

            if (!keyword) {
                return true;
            }

            const title =
                activeTab === "questions"
                    ? item.title
                    : item.question_title;

            return (
                String(title || "")
                    .toLowerCase()
                    .includes(keyword) ||
                String(item.content || "")
                    .toLowerCase()
                    .includes(keyword)
            );
        });
    }, [data, activeTab, status, search]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredItems.length / PAGE_SIZE)
    );

    const currentPage = Math.min(page, totalPages);

    const visibleItems = filteredItems.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    function changeTab(tab) {
        setActiveTab(tab);
        setSearch("");
        setStatus("ALL");
        setPage(1);
    }

    function changeStatus(value) {
        setStatus(value);
        setPage(1);
    }

    function changeSearch(value) {
        setSearch(value);
        setPage(1);
    }

    function refresh() {
        setPage(1);
        setRefreshKey((prev) => prev + 1);
    }

    return (
        <div className="my-tab-content my-qna-activity">
            <div className="my-qna-heading">
                <div className="my-section-heading">
                    <h2>나의 Q&A 활동</h2>

                    <p>
                        질문과 답변 기록을 확인하고
                        커뮤니티 활동을 관리하세요.
                    </p>
                </div>

                <a
                    href="/qna"
                    className="my-qna-community-link"
                >
                    Q&A 게시판
                    <ArrowRight size={17} />
                </a>
            </div>

            {loading ? (
                <section className="my-panel my-qna-empty">
                    <RefreshCw
                        size={24}
                        className="my-qna-spinning"
                    />

                    <p>
                        Q&A 활동을 불러오는 중입니다...
                    </p>
                </section>
            ) : error ? (
                <section
                    className="my-panel my-qna-empty"
                    role="alert"
                >
                    <MessageSquare size={32} />

                    <h3>활동을 불러오지 못했어요</h3>

                    <p>{error}</p>

                    {unauthorized ? (
                        <a
                            href="/login"
                            className="my-qna-community-link"
                        >
                            로그인하기
                        </a>
                    ) : (
                        <button
                            type="button"
                            className="my-qna-retry"
                            onClick={refresh}
                        >
                            <RefreshCw size={16} />
                            다시 시도
                        </button>
                    )}
                </section>
            ) : (
                <>
                    <div className="my-stat-grid">
                        <StatCard
                            icon={<MessageSquare size={20} />}
                            label="작성한 질문"
                            value={data.stats.questionCount}
                        />

                        <StatCard
                            icon={<CheckCircle2 size={20} />}
                            label="해결된 질문"
                            value={
                                data.stats.solvedQuestionCount
                            }
                        />

                        <StatCard
                            icon={<MessagesSquare size={20} />}
                            label="작성한 답변"
                            value={data.stats.answerCount}
                        />

                        <StatCard
                            icon={<Award size={20} />}
                            label="채택된 답변"
                            value={
                                data.stats.acceptedAnswerCount
                            }
                        />
                    </div>

                    <section className="my-panel my-qna-panel">
                        <div className="my-qna-panel-header">
                            <div className="my-qna-tabs">
                                <button
                                    type="button"
                                    className={
                                        activeTab === "questions"
                                            ? "active"
                                            : ""
                                    }
                                    aria-pressed={
                                        activeTab === "questions"
                                    }
                                    onClick={() =>
                                        changeTab("questions")
                                    }
                                >
                                    <MessageSquare size={17} />

                                    내 질문

                                    <span>
                                        {data.stats.questionCount}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    className={
                                        activeTab === "answers"
                                            ? "active"
                                            : ""
                                    }
                                    aria-pressed={
                                        activeTab === "answers"
                                    }
                                    onClick={() =>
                                        changeTab("answers")
                                    }
                                >
                                    <MessagesSquare size={17} />

                                    내 답변

                                    <span>
                                        {data.stats.answerCount}
                                    </span>
                                </button>
                            </div>

                            <button
                                type="button"
                                className="my-qna-refresh"
                                aria-label="Q&A 활동 새로고침"
                                title="새로고침"
                                onClick={refresh}
                            >
                                <RefreshCw size={18} />
                            </button>
                        </div>

                        <div className="my-qna-filters">
                            <label className="my-qna-search">
                                <Search size={18} />

                                <input
                                    type="search"
                                    value={search}
                                    placeholder={
                                        activeTab === "questions"
                                            ? "질문 제목 검색"
                                            : "질문 제목 또는 답변 검색"
                                    }
                                    onChange={(event) =>
                                        changeSearch(
                                            event.target.value
                                        )
                                    }
                                />
                            </label>

                            <select
                                aria-label="활동 상태 필터"
                                value={status}
                                onChange={(event) =>
                                    changeStatus(
                                        event.target.value
                                    )
                                }
                            >
                                <option value="ALL">
                                    전체 상태
                                </option>

                                <option value="COMPLETED">
                                    {activeTab === "questions"
                                        ? "해결 완료"
                                        : "채택된 답변"}
                                </option>

                                <option value="PENDING">
                                    {activeTab === "questions"
                                        ? "미해결"
                                        : "미채택 답변"}
                                </option>
                            </select>
                        </div>

                        <div className="my-qna-list-summary">
                            <span>
                                총 {filteredItems.length}개
                            </span>

                            <span>최신순</span>
                        </div>

                        {visibleItems.length === 0 ? (
                            <div className="my-qna-empty">
                                <MessageSquare size={38} />

                                <h3>
                                    {search || status !== "ALL"
                                        ? "검색 결과가 없어요"
                                        : activeTab === "questions"
                                            ? "작성한 질문이 없어요"
                                            : "작성한 답변이 없어요"}
                                </h3>

                                <p>
                                    {search || status !== "ALL"
                                        ? "검색어 또는 상태를 변경해 보세요."
                                        : "다른 개발자들과 지식을 나누어 보세요."}
                                </p>

                                {!search && status === "ALL" && (
                                    <a
                                        href={
                                            activeTab === "questions"
                                                ? "/qna/write"
                                                : "/qna"
                                        }
                                        className="my-qna-community-link"
                                    >
                                        {activeTab === "questions"
                                            ? "질문 작성하기"
                                            : "답변하러 가기"}

                                        <ArrowRight size={16} />
                                    </a>
                                )}
                            </div>
                        ) : (
                            <div className="my-qna-list">
                                {visibleItems.map((item) => {
                                    const isQuestion =
                                        activeTab === "questions";

                                    const completed = isQuestion
                                        ? isTrue(item.solved)
                                        : isTrue(item.accepted);

                                    const questionId = isQuestion
                                        ? item.id
                                        : item.question_id;

                                    return (
                                        <div
                                            className="qla-row"
                                            key={`${activeTab}-${item.id}`}
                                        >
                                            <a
                                                href={`/qna/${questionId}`}
                                                className="my-qna-item"
                                            >
                                                <div className="my-qna-item-main">
                                                    <div className="my-qna-tags">
                                                        <span className="my-qna-language">
                                                            {LANGUAGES[item.language]
                                                                || item.language}
                                                        </span>

                                                        <span
                                                            className={
                                                                completed
                                                                    ? "my-qna-status completed"
                                                                    : "my-qna-status pending"
                                                            }
                                                        >
                                                            {completed &&
                                                                (isQuestion ? (
                                                                    <CheckCircle2 size={13} />
                                                                ) : (
                                                                    <Award size={13} />
                                                                ))}

                                                            {isQuestion
                                                                ? completed
                                                                    ? "해결 완료"
                                                                    : "미해결"
                                                                : completed
                                                                    ? "채택된 답변"
                                                                    : "미채택"}
                                                        </span>
                                                    </div>

                                                    <h3>
                                                        {isQuestion
                                                            ? item.title
                                                            : item.question_title}
                                                    </h3>

                                                    {!isQuestion && (
                                                        <p className="my-qna-preview">
                                                            {item.content}
                                                        </p>
                                                    )}

                                                    <div className="my-qna-meta">
                                                        <span>
                                                            <Clock3 size={14} />

                                                            {formatDate(item.created_at)}
                                                        </span>

                                                        {isQuestion ? (
                                                            <>
                                                                <span>
                                                                    <Eye size={15} />
                                                                    조회 {item.view_count}
                                                                </span>

                                                                <span>
                                                                    <MessageSquare size={15} />
                                                                    답변 {item.answer_count}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <span>
                                                                질문 작성자:{" "}
                                                                {item.question_author}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <ChevronRight
                                                    size={21}
                                                    className="my-qna-arrow"
                                                />
                                            </a>

                                            <QnaListActions
                                                type={
                                                    isQuestion
                                                        ? "question"
                                                        : "answer"
                                                }
                                                questionId={questionId}
                                                answerId={
                                                    isQuestion
                                                        ? undefined
                                                        : item.id
                                                }
                                                onChanged={() =>
                                                    setRefreshKey(
                                                        (prev) => prev + 1
                                                    )
                                                }
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {filteredItems.length > PAGE_SIZE && (
                            <div className="my-qna-pagination">
                                <button
                                    type="button"
                                    aria-label="이전 페이지"
                                    disabled={currentPage <= 1}
                                    onClick={() =>
                                        setPage(currentPage - 1)
                                    }
                                >
                                    <ChevronLeft size={18} />
                                </button>

                                <span>
                                    {currentPage} / {totalPages}
                                </span>

                                <button
                                    type="button"
                                    aria-label="다음 페이지"
                                    disabled={
                                        currentPage >= totalPages
                                    }
                                    onClick={() =>
                                        setPage(currentPage + 1)
                                    }
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}