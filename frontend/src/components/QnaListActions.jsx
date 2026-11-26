import { useEffect, useRef, useState } from "react";

import {
    Pencil,
    Trash2,
    X,
    Save,
} from "lucide-react";

import {
    getQuestion,
    getAnswers,
    updateQuestion,
    deleteQuestion,
    updateAnswer,
    deleteAnswer,
} from "../api/qaApi.js";

import "../styles/QnaListActions.css";

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

export default function QnaListActions({
    type = "question",
    questionId,
    answerId,
    onChanged,
}) {
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState(EMPTY_FORM);

    const dialogRef = useRef(null);
    const lockRef = useRef(false);

    const isQuestion = type === "question";
    const label = isQuestion ? "질문" : "답변";

    useEffect(() => {
        const dialog = dialogRef.current;

        if (open && dialog && !dialog.open) {
            dialog.showModal();
        }

        return () => {
            if (dialog?.open) {
                dialog.close();
            }
        };
    }, [open]);

    function changeForm(key, value) {
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));
    }

    function closeModal() {
        if (lockRef.current) return;

        setOpen(false);
        setError("");
    }

    // 기존 질문 또는 답변 불러오기
    async function handleEdit() {
        if (lockRef.current) return;

        lockRef.current = true;
        setOpen(true);
        setLoading(true);
        setError("");
        setForm(EMPTY_FORM);

        try {
            if (isQuestion) {
                const question = await getQuestion(questionId);

                setForm({
                    title: question.title || "",
                    content: question.content || "",
                    language: question.language || "GENERAL",
                    code: question.code || "",
                });
            } else {
                const answers = await getAnswers(questionId);

                const answer = answers.find(
                    (item) =>
                        String(item.id) === String(answerId)
                );

                if (!answer) {
                    throw new Error(
                        "답변을 찾을 수 없습니다."
                    );
                }

                setForm({
                    ...EMPTY_FORM,
                    content: answer.content || "",
                });
            }
        } catch (err) {
            setError(
                err.message ||
                `${label}을 불러오지 못했습니다.`
            );

            setOpen(false);
            alert(err.message || "불러오기 실패");
        } finally {
            lockRef.current = false;
            setLoading(false);
        }
    }

    // 수정 내용 저장
    async function handleSave(event) {
        event.preventDefault();

        if (lockRef.current) return;

        if (!form.content.trim()) {
            setError("내용을 입력해 주세요.");
            return;
        }

        if (isQuestion && !form.title.trim()) {
            setError("제목을 입력해 주세요.");
            return;
        }

        lockRef.current = true;
        setBusy(true);
        setError("");

        try {
            if (isQuestion) {
                await updateQuestion(questionId, {
                    title: form.title.trim(),
                    content: form.content.trim(),
                    language: form.language,
                    code: form.code,
                });
            } else {
                await updateAnswer(
                    questionId,
                    answerId,
                    form.content.trim()
                );
            }

            setOpen(false);
        } catch (err) {
            setError(
                err.message ||
                `${label} 수정에 실패했습니다.`
            );

            return;
        } finally {
            lockRef.current = false;
            setBusy(false);
        }

        await onChanged?.();
    }

    // 질문 또는 답변 삭제
    async function handleDelete() {
        if (lockRef.current) return;

        const message = isQuestion
            ? "질문을 삭제하시겠습니까?\n등록된 답변도 함께 삭제되며 복구할 수 없습니다."
            : "답변을 삭제하시겠습니까?\n채택된 답변이라면 질문의 해결 상태도 변경됩니다.";

        if (!window.confirm(message)) {
            return;
        }

        lockRef.current = true;
        setBusy(true);

        try {
            if (isQuestion) {
                await deleteQuestion(questionId);
            } else {
                await deleteAnswer(
                    questionId,
                    answerId
                );
            }
        } catch (err) {
            alert(
                err.message ||
                `${label} 삭제에 실패했습니다.`
            );

            return;
        } finally {
            lockRef.current = false;
            setBusy(false);
        }

        await onChanged?.();
    }

    return (
        <>
            <div className="qla-actions">
                <button
                    type="button"
                    className="qla-edit"
                    disabled={busy || loading}
                    onClick={handleEdit}
                >
                    <Pencil size={15} />
                    수정
                </button>

                <button
                    type="button"
                    className="qla-delete"
                    disabled={busy || loading}
                    onClick={handleDelete}
                >
                    <Trash2 size={15} />
                    {busy ? "처리 중..." : "삭제"}
                </button>
            </div>

            {open && (
                <dialog
                    ref={dialogRef}
                    className="qla-modal"
                    aria-label={`${label} 수정`}
                    onCancel={(event) => {
                        event.preventDefault();
                        closeModal();
                    }}
                >
                    <div className="qla-modal-header">
                        <div>
                            <span className="qla-eyebrow">
                                EDIT {isQuestion ? "QUESTION" : "ANSWER"}
                            </span>

                            <h2>{label} 수정</h2>

                            <p>
                                작성한 내용을 수정할 수 있습니다.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="qla-close"
                            aria-label="닫기"
                            disabled={busy || loading}
                            onClick={closeModal}
                        >
                            <X size={22} />
                        </button>
                    </div>

                    {loading ? (
                        <div className="qla-loading">
                            내용을 불러오는 중입니다...
                        </div>
                    ) : (
                        <form
                            className="qla-form"
                            onSubmit={handleSave}
                        >
                            {error && (
                                <div
                                    className="qla-error"
                                    role="alert"
                                >
                                    {error}
                                </div>
                            )}

                            {isQuestion && (
                                <>
                                    <label>
                                        프로그래밍 언어

                                        <select
                                            value={form.language}
                                            disabled={busy}
                                            onChange={(event) =>
                                                changeForm(
                                                    "language",
                                                    event.target.value
                                                )
                                            }
                                        >
                                            {Object.entries(
                                                LANGUAGES
                                            ).map(([key, name]) => (
                                                <option
                                                    key={key}
                                                    value={key}
                                                >
                                                    {name}
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
                                            disabled={busy}
                                            onChange={(event) =>
                                                changeForm(
                                                    "title",
                                                    event.target.value
                                                )
                                            }
                                        />
                                    </label>
                                </>
                            )}

                            <label>
                                {label} 내용

                                <textarea
                                    required
                                    rows={8}
                                    maxLength={10000}
                                    value={form.content}
                                    disabled={busy}
                                    onChange={(event) =>
                                        changeForm(
                                            "content",
                                            event.target.value
                                        )
                                    }
                                />

                                <small>
                                    {form.content.length.toLocaleString()}
                                    / 10,000
                                </small>
                            </label>

                            {isQuestion && (
                                <label>
                                    첨부 코드 (선택)

                                    <textarea
                                        className="qla-code"
                                        rows={8}
                                        maxLength={50000}
                                        spellCheck={false}
                                        value={form.code}
                                        disabled={busy}
                                        onChange={(event) =>
                                            changeForm(
                                                "code",
                                                event.target.value
                                            )
                                        }
                                    />
                                </label>
                            )}

                            <div className="qla-footer">
                                <button
                                    type="button"
                                    className="qla-cancel"
                                    disabled={busy}
                                    onClick={closeModal}
                                >
                                    취소
                                </button>

                                <button
                                    type="submit"
                                    className="qla-save"
                                    disabled={busy}
                                >
                                    <Save size={16} />

                                    {busy
                                        ? "저장 중..."
                                        : "수정 완료"}
                                </button>
                            </div>
                        </form>
                    )}
                </dialog>
            )}
        </>
    );
}