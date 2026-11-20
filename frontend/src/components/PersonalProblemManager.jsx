
import { useEffect, useMemo, useState } from "react";
import {
    Trash2,
    CheckCircle2,
    Clock3,
    CircleDashed,
    RefreshCw,
} from "lucide-react";

import {
    getMyPersonalizedProblems,
    deleteMyPersonalizedProblem,
} from "../api/personalizedProblemApi.js";

import "../styles/PersonalProblemManager.css";

const STATUS = {
    NOT_STARTED: {
        label: "미풀이",
        Icon: CircleDashed,
    },
    IN_PROGRESS: {
        label: "풀이 중",
        Icon: Clock3,
    },
    SOLVED: {
        label: "해결 완료",
        Icon: CheckCircle2,
    },
};

const LEVELS = {
    EASY: "쉬움",
    MEDIUM: "보통",
    HARD: "어려움",
};

export default function PersonalProblemManager({
    refreshKey = 0,
}) {
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState(null);
    const [filter, setFilter] = useState("ALL");

    useEffect(() => {
        let active = true;

        async function load() {
            setLoading(true);
            setError("");

            try {
                const data =
                    await getMyPersonalizedProblems();

                if (active) {
                    setProblems(
                        Array.isArray(data) ? data : []
                    );
                }
            } catch (err) {
                if (active) {
                    setError(err.message);
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        load();

        return () => {
            active = false;
        };
    }, [refreshKey]);

    const stats = useMemo(() => {
        return {
            total: problems.length,
            solved: problems.filter(
                (p) => p.solveStatus === "SOLVED"
            ).length,
            progress: problems.filter(
                (p) => p.solveStatus === "IN_PROGRESS"
            ).length,
        };
    }, [problems]);

    const filtered = useMemo(() => {
        if (filter === "ALL") {
            return problems;
        }

        return problems.filter(
            (p) => p.solveStatus === filter
        );
    }, [problems, filter]);

    const handleDelete = async (problem) => {
        if (deletingId !== null) return;

        const confirmed = window.confirm(
            `"${problem.title}" 문제를 삭제할까요?\n` +
            "삭제한 문제는 복구할 수 없습니다."
        );

        if (!confirmed) return;

        setDeletingId(problem.id);
        setError("");

        try {
            await deleteMyPersonalizedProblem(
                problem.id
            );

            setProblems((previous) =>
                previous.filter(
                    (item) => item.id !== problem.id
                )
            );
        } catch (err) {
            setError(err.message);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <section className="ppm">
            <div className="ppm-heading">
                <div>
                    <h2>내가 생성한 문제</h2>
                    <p>
                        개인 맞춤 문제와 학습 진행 상황을
                        관리할 수 있습니다.
                    </p>
                </div>
            </div>

            <div className="ppm-stats">
                <div>
                    <span>전체 문제</span>
                    <strong>{stats.total}</strong>
                </div>

                <div>
                    <span>풀이 중</span>
                    <strong>{stats.progress}</strong>
                </div>

                <div>
                    <span>해결 완료</span>
                    <strong>{stats.solved}</strong>
                </div>
            </div>

            <div className="ppm-toolbar">
                <label htmlFor="ppm-status">
                    풀이 상태
                </label>

                <select
                    id="ppm-status"
                    value={filter}
                    onChange={(event) =>
                        setFilter(event.target.value)
                    }
                >
                    <option value="ALL">
                        전체 문제
                    </option>
                    <option value="NOT_STARTED">
                        미풀이
                    </option>
                    <option value="IN_PROGRESS">
                        풀이 중
                    </option>
                    <option value="SOLVED">
                        해결 완료
                    </option>
                </select>
            </div>

            {error && (
                <div className="ppm-error" role="alert">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="ppm-empty">
                    <RefreshCw
                        size={20}
                        className="personal-problem-spin"
                    />
                    문제 목록을 불러오는 중입니다.
                </div>
            ) : filtered.length === 0 ? (
                <div className="ppm-empty">
                    표시할 개인 문제가 없습니다.
                </div>
            ) : (
                <div className="ppm-list">
                    {filtered.map((problem) => {
                        const status =
                            STATUS[problem.solveStatus] ||
                            STATUS.NOT_STARTED;

                        const StatusIcon = status.Icon;

                        const canDelete =
                            problem.submissionCount === 0;

                        return (
                            <article
                                key={problem.id}
                                className="ppm-item"
                            >
                                <div className="ppm-item-main">
                                    <div className="ppm-item-top">
                                        <span
                                            className={
                                                `ppm-status ${problem.solveStatus}`
                                            }
                                        >
                                            <StatusIcon size={14} />
                                            {status.label}
                                        </span>

                                        <span className="ppm-level">
                                            {LEVELS[problem.level] ||
                                                problem.level}
                                        </span>

                                        <span className="ppm-category">
                                            {problem.category}
                                        </span>
                                    </div>

                                    <h3>{problem.title}</h3>

                                    <p>
                                        제출 {problem.submissionCount}회
                                        {" · "}
                                        정답 {problem.acceptedCount}회
                                        {" · "}
                                        정답률 {problem.accuracy}%
                                    </p>
                                </div>

                                <div className="ppm-actions">
                                    <a
                                        href={`/problems/${problem.id}`}
                                        className="ppm-solve"
                                    >
                                        문제 풀기
                                    </a>

                                    <button
                                        type="button"
                                        className="ppm-delete"
                                        disabled={
                                            !canDelete ||
                                            deletingId !== null
                                        }
                                        title={
                                            canDelete
                                                ? "문제 삭제"
                                                : "제출 이력이 있어 삭제할 수 없습니다."
                                        }
                                        onClick={() =>
                                            handleDelete(problem)
                                        }
                                    >
                                        <Trash2 size={17} />
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
