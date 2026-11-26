import { useEffect, useState } from "react";
import {
    MessageSquare,
    CheckCircle2,
    Pencil,
    Trash2,
    Send,
    UserRound,
    Award,
} from "lucide-react";

import ReactMarkdown from "react-markdown";

import {
    getAnswers,
    createAnswer,
    updateAnswer,
    deleteAnswer,
    acceptAnswer,
} from "../api/qaApi.js";

function isAccepted(value) {
    return value === true || value === 1 || value === "1";
}

function formatDate(value) {
    if (!value) return "";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? String(value)
        : date.toLocaleString("ko-KR");
}

export default function QnaAnswers({
    question,
    user,
    onSolvedChange,
}) {
    const [answers, setAnswers] = useState([]);
    const [content, setContent] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState("");

    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const isQuestionOwner =
        user &&
        String(user.id) === String(question.user_id);

    useEffect(() => {
        let active = true;

        async function load() {
            setLoading(true);
            setError("");

            try {
                const data = await getAnswers(question.id);

                if (active) {
                    setAnswers(
                        Array.isArray(data) ? data : []
                    );
                }
            } catch (err) {
                if (active) setError(err.message);
            } finally {
                if (active) setLoading(false);
            }
        }

        load();

        return () => {
            active = false;
        };
    }, [question.id]);

    async function refreshAnswers() {
        const data = await getAnswers(question.id);

        setAnswers(Array.isArray(data) ? data : []);
    }

    // 답변 등록
    async function handleSubmit(event) {
        event.preventDefault();

        if (busy || !content.trim()) return;

        setBusy(true);
        setError("");

        try {
            await createAnswer(
                question.id,
                content.trim()
            );

            setContent("");
            await refreshAnswers();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    // 답변 수정 시작
    function openEdit(answer) {
        setError("");
        setEditingId(answer.id);
        setEditContent(answer.content);
    }

    function cancelEdit() {
        setEditingId(null);
        setEditContent("");
    }

    // 답변 수정 저장
    async function handleUpdate(answerId) {
        if (busy || !editContent.trim()) return;

        setBusy(true);
        setError("");

        try {
            await updateAnswer(
                question.id,
                answerId,
                editContent.trim()
            );

            cancelEdit();
            await refreshAnswers();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    // 답변 삭제
    async function handleDelete(answer) {
        if (busy) return;

        const message = isAccepted(answer.accepted)
            ? "채택된 답변입니다. 삭제하면 질문이 미해결 상태로 변경됩니다. 삭제하시겠습니까?"
            : "작성한 답변을 삭제하시겠습니까?";

        if (!window.confirm(message)) return;

        setBusy(true);
        setError("");

        try {
            const result = await deleteAnswer(
                question.id,
                answer.id
            );

            onSolvedChange?.(result.solved);

            await refreshAnswers();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    // 답변 채택 및 취소
    async function handleAccept(answer) {
        if (busy) return;

        const accepted = isAccepted(answer.accepted);

        const message = accepted
            ? "답변 채택을 취소하시겠습니까?"
            : "이 답변을 채택하시겠습니까? 기존 채택 답변이 있다면 변경됩니다.";

        if (!window.confirm(message)) return;

        setBusy(true);
        setError("");

        try {
            const result = await acceptAnswer(
                question.id,
                answer.id
            );

            onSolvedChange?.(result.solved);

            await refreshAnswers();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <section className="qna-panel qna-answer-section">
            <div className="qna-answer-heading">
                <h2>
                    <MessageSquare size={22} />
                    답변
                    <span className="qna-answer-count">
                        {answers.length}
                    </span>
                </h2>
            </div>

            {error && (
                <div className="qna-error" role="alert">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="qna-empty">
                    답변을 불러오는 중입니다...
                </div>
            ) : answers.length === 0 ? (
                <div className="qna-answer-empty">
                    <MessageSquare size={32} />
                    <strong>아직 등록된 답변이 없어요</strong>
                    <p>첫 번째 답변을 작성해 보세요.</p>
                </div>
            ) : (
                <div className="qna-answer-list">
                    {answers.map((answer) => {
                        const accepted =
                            isAccepted(answer.accepted);

                        const isOwner =
                            user &&
                            String(user.id) ===
                            String(answer.user_id);

                        return (
                            <article
                                key={answer.id}
                                className={
                                    accepted
                                        ? "qna-answer accepted"
                                        : "qna-answer"
                                }
                            >
                                {accepted && (
                                    <div className="qna-accepted-label">
                                        <Award size={17} />
                                        채택된 답변
                                    </div>
                                )}

                                <div className="qna-answer-author">
                                    <div className="qna-answer-profile">
                                        <div className="qna-answer-avatar">
                                            <UserRound size={19} />
                                        </div>

                                        <div>
                                            <strong>
                                                {answer.nickname}
                                            </strong>

                                            <small>
                                                {formatDate(answer.created_at)}
                                            </small>
                                        </div>
                                    </div>

                                    {isOwner && (
                                        <div className="qna-owner-actions">
                                            <button
                                                type="button"
                                                className="qna-edit-button"
                                                disabled={busy}
                                                onClick={() =>
                                                    openEdit(answer)
                                                }
                                            >
                                                <Pencil size={14} />
                                                수정
                                            </button>

                                            <button
                                                type="button"
                                                className="qna-delete-button"
                                                disabled={busy}
                                                onClick={() =>
                                                    handleDelete(answer)
                                                }
                                            >
                                                <Trash2 size={14} />
                                                삭제
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {editingId === answer.id ? (
                                    <div className="qna-answer-editor">
                                        <textarea
                                            value={editContent}
                                            maxLength={10000}
                                            rows={7}
                                            disabled={busy}
                                            onChange={(e) =>
                                                setEditContent(e.target.value)
                                            }
                                        />

                                        <div className="qna-form-actions">
                                            <button
                                                className="qna-secondary"
                                                type="button"
                                                disabled={busy}
                                                onClick={cancelEdit}
                                            >
                                                취소
                                            </button>

                                            <button
                                                className="qna-primary"
                                                type="button"
                                                disabled={
                                                    busy ||
                                                    !editContent.trim()
                                                }
                                                onClick={() =>
                                                    handleUpdate(answer.id)
                                                }
                                            >
                                                수정 완료
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="qna-answer-content">
                                        <ReactMarkdown>
                                            {answer.content}
                                        </ReactMarkdown>
                                    </div>
                                )}

                                {isQuestionOwner && !isOwner && (
                                    <div className="qna-accept-actions">
                                        <button
                                            type="button"
                                            className={
                                                accepted
                                                    ? "qna-accept-button selected"
                                                    : "qna-accept-button"
                                            }
                                            disabled={busy}
                                            onClick={() =>
                                                handleAccept(answer)
                                            }
                                        >
                                            <CheckCircle2 size={17} />

                                            {accepted
                                                ? "채택 취소"
                                                : "답변 채택"}
                                        </button>
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </div>
            )}

            {user ? (
                <form
                    className="qna-answer-form"
                    onSubmit={handleSubmit}
                >
                    <h3>답변 작성</h3>

                    <p>
                        문제 해결 방법이나 개선할 수 있는
                        부분을 설명해 주세요.
                    </p>

                    <textarea
                        rows={7}
                        maxLength={10000}
                        value={content}
                        disabled={busy}
                        onChange={(e) =>
                            setContent(e.target.value)
                        }
                        placeholder="답변을 작성해 주세요. Markdown과 코드 블록을 사용할 수 있습니다."
                        required
                    />

                    <div className="qna-answer-submit">
                        <span>
                            {content.length.toLocaleString()}
                            / 10,000
                        </span>

                        <button
                            type="submit"
                            className="qna-primary"
                            disabled={busy || !content.trim()}
                        >
                            <Send size={17} />

                            {busy ? "처리 중..." : "답변 등록"}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="qna-answer-login">
                    <p>
                        로그인하고 다른 개발자의 질문에
                        답변해 보세요.
                    </p>

                    <a
                        href="/login"
                        className="qna-primary"
                    >
                        로그인하기
                    </a>
                </div>
            )}
        </section>
    );
}