import { useEffect, useMemo, useState } from "react";
import {
    MessageSquare,
    Search,
    Plus,
    Eye,
    ArrowLeft,
    Code2,
    CheckCircle2,
    MessagesSquare,
    Clock,
    ChevronRight,
    Send,
    Pencil,
    Trash2,
} from "lucide-react";

import Header from "../components/Header.jsx";
import QnaAnswers from "../components/QnaAnswers.jsx";
import QnaListActions from "../components/QnaListActions.jsx";
import { getCurrentUser } from "../api/authApi.js";
import {
    getQuestions,
    getQuestion,
    createQuestion,
    updateQuestion,
    deleteQuestion,
} from "../api/qaApi.js";

import "../styles/QnaPage.css";

const LANGUAGES = {
    GENERAL: "일반",
    PYTHON: "Python",
    JAVASCRIPT: "JavaScript",
    JAVA: "Java",
    C: "C",
    CPP: "C++",
    SQL: "SQL",
};

const EMPTY_FORM = {
    title: "",
    content: "",
    language: "GENERAL",
    code: "",
};

function isSolved(value) {
    return value === true || value === 1 || value === "1";
}

function formatDate(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleDateString("ko-KR");
}

export default function QnaPage() {
    const [questions, setQuestions] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [language, setLanguage] = useState("ALL");
    const [status, setStatus] = useState("ALL");

    const [view, setView] = useState("LIST");
    const [selected, setSelected] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);

    const [editingId, setEditingId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    async function loadQuestions() {
        setLoading(true);
        setError("");

        try {
            const data = await getQuestions();
            setQuestions(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const path =
            window.location.pathname.replace(/\/+$/, "");

        const detailMatch = path.match(/^\/qna\/(\d+)$/);
        const editMatch = path.match(/^\/qna\/(\d+)\/edit$/);

        async function initialize() {
            setLoading(true);
            setError("");

            try {
                const currentUser = await getCurrentUser();
                setUser(currentUser);

                if (editMatch) {
                    const question = await getQuestion(editMatch[1]);

                    if (
                        !currentUser ||
                        String(currentUser.id) !== String(question.user_id)
                    ) {
                        window.location.replace(`/qna/${editMatch[1]}`);
                        return;
                    }

                    setSelected(question);
                    setEditingId(question.id);

                    setForm({
                        title: question.title || "",
                        content: question.content || "",
                        language: question.language || "GENERAL",
                        code: question.code || "",
                    });

                    setView("WRITE");
                } else if (detailMatch) {
                    const question = await getQuestion(detailMatch[1]);

                    setSelected(question);
                    setView("DETAIL");
                } else if (path === "/qna/write") {
                    if (!currentUser) {
                        window.location.replace("/login");
                        return;
                    }

                    setEditingId(null);
                    setForm(EMPTY_FORM);
                    setView("WRITE");
                } else {
                    setView("LIST");
                    await loadQuestions();
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        initialize();
    }, []);

    const stats = useMemo(() => {
        const solved = questions.filter(
            (item) => isSolved(item.solved)
        ).length;

        return {
            total: questions.length,
            solved,
            pending: questions.length - solved,
        };
    }, [questions]);

    const filtered = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return questions.filter((item) => {
            if (
                language !== "ALL" &&
                item.language !== language
            ) return false;

            if (
                status === "SOLVED" &&
                !isSolved(item.solved)
            ) return false;

            if (
                status === "PENDING" &&
                isSolved(item.solved)
            ) return false;

            return (
                String(item.title || "")
                    .toLowerCase()
                    .includes(keyword) ||
                String(item.nickname || "")
                    .toLowerCase()
                    .includes(keyword)
            );
        });
    }, [questions, search, language, status]);

    function changeForm(key, value) {
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));
    }

    function openWrite() {
        if (!user) {
            alert("로그인 후 질문을 작성할 수 있습니다.");
            window.location.href = "/login";
            return;
        }

        window.location.href = "/qna/write";
    }

    function openEdit() {
        if (!user || !selected) return;

        if (String(user.id) !== String(selected.user_id)) {
            setError("본인이 작성한 질문만 수정할 수 있습니다.");
            return;
        }

        window.location.href = `/qna/${selected.id}/edit`;
    }

    async function handleDelete() {
        if (!user || !selected || deleting) return;

        if (String(user.id) !== String(selected.user_id)) {
            setError("본인이 작성한 질문만 삭제할 수 있습니다.");
            return;
        }

        const confirmed = window.confirm(
            "질문을 삭제하시겠습니까?\n등록된 답변도 함께 삭제되며 복구할 수 없습니다."
        );

        if (!confirmed) return;

        setDeleting(true);
        setError("");

        try {
            await deleteQuestion(selected.id);

            window.location.replace("/qna");
        } catch (err) {
            setError(err.message);
        } finally {
            setDeleting(false);
        }
    }

    function openQuestion(id) {
        window.location.href = `/qna/${id}`;
    }

    function goList() {
        if (saving || deleting) return;

        window.location.href = "/qna";
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (saving) return;

        if (!form.title.trim() || !form.content.trim()) {
            setError("제목과 내용을 입력해 주세요.");
            return;
        }

        setSaving(true);
        setError("");

        try {
            if (editingId !== null) {
                await updateQuestion(editingId, form);

                window.location.replace(`/qna/${editingId}`);
            } else {
                await createQuestion(form);

                window.location.replace("/qna");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            <Header />

            <main className="qna-page">
                <div className="qna-container">

                    <section className="qna-heading">
                        <div>
                            <span className="qna-eyebrow">
                                COMMUNITY
                            </span>

                            <h1>
                                <MessageSquare size={30} />
                                개발 Q&A
                            </h1>

                            <p>
                                막히는 코드부터 개발 고민까지,
                                함께 질문하고 성장해 보세요.
                            </p>
                        </div>

                        {view === "LIST" && (
                            <button
                                className="qna-primary"
                                onClick={openWrite}
                            >
                                <Plus size={19} />
                                질문 작성
                            </button>
                        )}
                    </section>

                    {error && (
                        <div className="qna-error" role="alert">
                            {error}
                        </div>
                    )}

                    {view === "LIST" && (
                        <>
                            <section className="qna-stats">
                                <div className="qna-stat">
                                    <MessagesSquare size={23} />
                                    <span>전체 질문</span>
                                    <strong>{stats.total}</strong>
                                </div>

                                <div className="qna-stat">
                                    <Clock size={23} />
                                    <span>미해결 질문</span>
                                    <strong>{stats.pending}</strong>
                                </div>

                                <div className="qna-stat">
                                    <CheckCircle2 size={23} />
                                    <span>해결된 질문</span>
                                    <strong>{stats.solved}</strong>
                                </div>
                            </section>

                            <section className="qna-panel">
                                <div className="qna-panel-heading">
                                    <div>
                                        <h2>질문 게시판</h2>
                                        <p>
                                            다른 개발자들의 질문을
                                            확인해 보세요.
                                        </p>
                                    </div>

                                    <span>
                                        {filtered.length}개 질문
                                    </span>
                                </div>

                                <div className="qna-filters">
                                    <label className="qna-search">
                                        <Search size={18} />
                                        <input
                                            type="search"
                                            placeholder="제목 또는 작성자 검색"
                                            value={search}
                                            onChange={(e) =>
                                                setSearch(e.target.value)
                                            }
                                        />
                                    </label>

                                    <select
                                        aria-label="프로그래밍 언어"
                                        value={language}
                                        onChange={(e) =>
                                            setLanguage(e.target.value)
                                        }
                                    >
                                        <option value="ALL">
                                            전체 언어
                                        </option>

                                        {Object.entries(LANGUAGES)
                                            .map(([key, label]) => (
                                                <option
                                                    key={key}
                                                    value={key}
                                                >
                                                    {label}
                                                </option>
                                            ))}
                                    </select>

                                    <select
                                        aria-label="해결 상태"
                                        value={status}
                                        onChange={(e) =>
                                            setStatus(e.target.value)
                                        }
                                    >
                                        <option value="ALL">
                                            전체 상태
                                        </option>
                                        <option value="PENDING">
                                            미해결
                                        </option>
                                        <option value="SOLVED">
                                            해결 완료
                                        </option>
                                    </select>
                                </div>

                                {loading ? (
                                    <div className="qna-empty">
                                        질문을 불러오는 중입니다...
                                    </div>
                                ) : filtered.length === 0 ? (
                                    <div className="qna-empty">
                                        <MessagesSquare size={38} />

                                        <h3>
                                            {questions.length === 0
                                                ? "아직 등록된 질문이 없어요"
                                                : "검색 결과가 없어요"}
                                        </h3>

                                        <p>
                                            {questions.length === 0
                                                ? "커뮤니티의 첫 번째 질문을 작성해 보세요."
                                                : "검색어나 필터를 변경해 보세요."}
                                        </p>

                                        {questions.length === 0 && (
                                            <button
                                                className="qna-primary"
                                                onClick={openWrite}
                                            >
                                                첫 질문 작성하기
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="qna-list">
                                        {filtered.map((item) => (
                                            <div
                                                className="qla-row"
                                                key={item.id}
                                            >
                                                <button
                                                    type="button"
                                                    className="qna-item"
                                                    onClick={() =>
                                                        openQuestion(item.id)
                                                    }
                                                >
                                                    <div className="qna-item-info">
                                                        <div className="qna-tags">
                                                            <span className="qna-tag">
                                                                {LANGUAGES[item.language]
                                                                    || item.language}
                                                            </span>

                                                            <span
                                                                className={
                                                                    isSolved(item.solved)
                                                                        ? "qna-status solved"
                                                                        : "qna-status pending"
                                                                }
                                                            >
                                                                {isSolved(item.solved)
                                                                    ? "해결 완료"
                                                                    : "미해결"}
                                                            </span>
                                                        </div>

                                                        <h3>{item.title}</h3>

                                                        <div className="qna-meta">
                                                            <span>{item.nickname}</span>

                                                            <span>
                                                                {formatDate(item.created_at)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="qna-item-counts">
                                                        <span>
                                                            <Eye size={16} />
                                                            {item.view_count}
                                                        </span>

                                                        <span>
                                                            <MessageSquare size={16} />
                                                            {item.answer_count}
                                                        </span>

                                                        <ChevronRight size={19} />
                                                    </div>
                                                </button>

                                                {user &&
                                                    String(user.id) === String(item.user_id) && (
                                                        <QnaListActions
                                                            type="question"
                                                            questionId={item.id}
                                                            onChanged={loadQuestions}
                                                        />
                                                    )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </>
                    )}

                    {view === "WRITE" && (
                        <>
                            <button
                                className="qna-back"
                                onClick={goList}
                            >
                                <ArrowLeft size={18} />
                                질문 목록
                            </button>

                            <form
                                className="qna-panel qna-form"
                                onSubmit={handleSubmit}
                            >
                                <h2>
                                    {editingId !== null
                                        ? "질문 수정"
                                        : "새로운 질문"}
                                </h2>

                                <p>
                                    문제 상황과 시도한 방법을
                                    구체적으로 작성해 주세요.
                                </p>

                                <label>
                                    프로그래밍 언어

                                    <select
                                        value={form.language}
                                        onChange={(e) =>
                                            changeForm("language", e.target.value)
                                        }
                                    >
                                        {Object.entries(LANGUAGES)
                                            .map(([key, label]) => (
                                                <option
                                                    key={key}
                                                    value={key}
                                                >
                                                    {label}
                                                </option>
                                            ))}
                                    </select>
                                </label>

                                <label>
                                    제목

                                    <input
                                        required
                                        maxLength={150}
                                        value={form.title}
                                        placeholder="어떤 문제가 발생했나요?"
                                        onChange={(e) =>
                                            changeForm("title", e.target.value)
                                        }
                                    />
                                </label>

                                <label>
                                    질문 내용

                                    <textarea
                                        required
                                        rows={8}
                                        maxLength={10000}
                                        value={form.content}
                                        placeholder="발생한 문제, 오류 메시지, 시도한 방법을 작성해 주세요."
                                        onChange={(e) =>
                                            changeForm("content", e.target.value)
                                        }
                                    />
                                </label>

                                <label>
                                    <span className="qna-code-label">
                                        <Code2 size={18} />
                                        코드 첨부 (선택)
                                    </span>

                                    <textarea
                                        className="qna-code-input"
                                        rows={10}
                                        maxLength={50000}
                                        spellCheck={false}
                                        value={form.code}
                                        placeholder="// 문제가 발생한 코드를 입력하세요."
                                        onChange={(e) =>
                                            changeForm("code", e.target.value)
                                        }
                                    />
                                </label>

                                <div className="qna-form-actions">
                                    <button
                                        type="button"
                                        className="qna-secondary"
                                        onClick={goList}
                                        disabled={saving}
                                    >
                                        취소
                                    </button>

                                    <button
                                        className="qna-primary"
                                        type="submit"
                                        disabled={saving}
                                    >
                                        <Send size={17} />

                                        {saving
                                            ? "저장 중..."
                                            : editingId !== null
                                                ? "수정 완료"
                                                : "질문 등록"}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}

                    {view === "DETAIL" && (
                        <>
                            <button
                                className="qna-back"
                                onClick={goList}
                            >
                                <ArrowLeft size={18} />
                                질문 목록
                            </button>

                            {loading ? (
                                <div className="qna-panel qna-empty">
                                    질문을 불러오는 중입니다...
                                </div>
                            ) : selected && (
                                <>
                                    <article className="qna-panel qna-detail">
                                        <div className="qna-tags">
                                            <span className="qna-tag">
                                                {LANGUAGES[selected.language]
                                                    || selected.language}
                                            </span>

                                            <span
                                                className={
                                                    isSolved(selected.solved)
                                                        ? "qna-status solved"
                                                        : "qna-status pending"
                                                }
                                            >
                                                {isSolved(selected.solved)
                                                    ? "해결 완료"
                                                    : "미해결"}
                                            </span>
                                        </div>

                                        <div className="qna-detail-title-row">
                                            <h2>{selected.title}</h2>

                                            {user &&
                                                String(user.id) === String(selected.user_id) && (
                                                    <div className="qna-owner-actions">
                                                        <button
                                                            type="button"
                                                            className="qna-edit-button"
                                                            onClick={openEdit}
                                                            disabled={deleting}
                                                        >
                                                            <Pencil size={16} />
                                                            수정
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="qna-delete-button"
                                                            onClick={handleDelete}
                                                            disabled={deleting}
                                                        >
                                                            <Trash2 size={16} />
                                                            {deleting ? "삭제 중..." : "삭제"}
                                                        </button>
                                                    </div>
                                                )}
                                        </div>

                                        <div className="qna-meta">
                                            <span>{selected.nickname}</span>
                                            <span>
                                                {formatDate(selected.created_at)}
                                            </span>
                                            <span>
                                                <Eye size={16} />
                                                {selected.view_count}
                                            </span>
                                        </div>

                                        <div className="qna-content">
                                            {selected.content}
                                        </div>

                                        {selected.code && (
                                            <div className="qna-code-block">
                                                <div>
                                                    <Code2 size={16} />
                                                    {LANGUAGES[selected.language]
                                                        || selected.language}
                                                </div>

                                                <pre>
                                                    <code>{selected.code}</code>
                                                </pre>
                                            </div>
                                        )}
                                    </article>

                                    <QnaAnswers
                                        key={selected.id}
                                        question={selected}
                                        user={user}
                                        onSolvedChange={(solved) =>
                                            setSelected((prev) =>
                                                prev
                                                    ? {
                                                        ...prev,
                                                        solved,
                                                    }
                                                    : prev
                                            )
                                        }
                                    />
                                </>
                            )}
                        </>
                    )}
                </div>
            </main>
        </>
    );
}