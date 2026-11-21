
import { useEffect, useMemo, useState } from "react";
import {
    Trash2,
    CheckCircle2,
    Clock3,
    CircleDashed,
    RefreshCw,
    Archive,
    ArchiveRestore,
} from "lucide-react";

import {
    getMyPersonalizedProblems,
    deleteMyPersonalizedProblem,
    archivePersonalizedProblem,
    restorePersonalizedProblem,
} from "../api/personalizedProblemApi.js";

import "../styles/PersonalProblemManager.css";

const MAX_PROBLEMS = 30;

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
    const [busyId, setBusyId] = useState(null);

    const [view, setView] = useState("active");
    const [filter, setFilter] = useState("ALL");

    const loadProblems = async () => {
        setLoading(true);
        setError("");

        try {
            const data = await getMyPersonalizedProblems();
            setProblems(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || "문제 조회에 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let active = true;

        async function load() {
            setLoading(true);
            setError("");

            try {
                const data = await getMyPersonalizedProblems();

                if (active) {
                    setProblems(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                if (active) {
                    setError(err.message || "조회 실패");
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

    const activeProblems = useMemo(
        () => problems.filter((p) => !p.archived),
        [problems]
    );

    const archivedProblems = useMemo(
        () => problems.filter((p) => p.archived),
        [problems]
    );

    const stats = useMemo(() => ({
        total: activeProblems.length,
        solved: activeProblems.filter(
            (p) => p.solveStatus === "SOLVED"
        ).length,
        progress: activeProblems.filter(
            (p) => p.solveStatus === "IN_PROGRESS"
        ).length,
    }), [activeProblems]);

    const filtered = useMemo(() => {
        const source = view === "archive"
            ? archivedProblems
            : activeProblems;

        if (filter === "ALL") return source;

        return source.filter(
            (p) => p.solveStatus === filter
        );
    }, [activeProblems, archivedProblems, view, filter]);

    const handleArchive = async (problem) => {
        if (busyId !== null) return;

        setBusyId(problem.id);
        setError("");

        try {
            await archivePersonalizedProblem(problem.id);
            await loadProblems();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusyId(null);
        }
    };

    const handleRestore = async (problem) => {
        if (busyId !== null) return;

        if (activeProblems.length >= MAX_PROBLEMS) {
            setError(
                "개인 문제 저장 공간이 가득 찼습니다. " +
                "다른 문제를 먼저 보관해 주세요."
            );
            return;
        }

        setBusyId(problem.id);
        setError("");

        try {
            await restorePersonalizedProblem(problem.id);
            await loadProblems();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async (problem) => {
        if (busyId !== null) return;

        const confirmed = window.confirm(
            `"${problem.title}" 문제를 삭제할까요?\n` +
            "삭제한 문제는 복구할 수 없습니다."
        );

        if (!confirmed) return;

        setBusyId(problem.id);
        setError("");

        try {
            await deleteMyPersonalizedProblem(problem.id);
            await loadProblems();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusyId(null);
        }
    };

    return (
        <section className="ppm">
            <div className="ppm-heading">
                <div>
                    <h2>내가 생성한 문제</h2>
                    <p>
                        문제를 보관하거나 복원하고
                        학습 상태를 관리할 수 있습니다.
                    </p>
                </div>
            </div>

            <div className="ppm-storage">
                <div className="ppm-storage-heading">
                    <span>AI 문제 저장 공간</span>
                    <strong>
                        {activeProblems.length} / {MAX_PROBLEMS}개
                    </strong>
                </div>

                <div
                    className="ppm-storage-track"
                    role="progressbar"
                    aria-label="AI 문제 저장 공간 사용량"
                    aria-valuenow={Math.min(
                        activeProblems.length,
                        MAX_PROBLEMS
                    )}
                    aria-valuemin={0}
                    aria-valuemax={MAX_PROBLEMS}
                >
                    <div
                        className="ppm-storage-fill"
                        style={{
                            width: `${Math.min(
                                activeProblems.length /
                                MAX_PROBLEMS * 100,
                                100
                            )}%`,
                        }}
                    />
                </div>

                <p>
                    {activeProblems.length >= MAX_PROBLEMS
                        ? "저장 공간이 가득 찼습니다."
                        : `새로운 AI 문제를 ${MAX_PROBLEMS - activeProblems.length
                        }개 더 생성할 수 있습니다.`}
                </p>
            </div>

            <div className="ppm-stats">
                <div>
                    <span>일반 문제</span>
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

            <div className="ppm-view-tabs">
                <button
                    type="button"
                    className={view === "active" ? "active" : ""}
                    onClick={() => setView("active")}
                >
                    내 문제 ({activeProblems.length})
                </button>

                <button
                    type="button"
                    className={view === "archive" ? "active" : ""}
                    onClick={() => setView("archive")}
                >
                    <Archive size={16} />
                    보관함 ({archivedProblems.length})
                </button>
            </div>

            <div className="ppm-toolbar">
                <label htmlFor="ppm-status">
                    풀이 상태
                </label>
                <select
                    id="ppm-status"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                >
                    <option value="ALL">전체 문제</option>
                    <option value="NOT_STARTED">미풀이</option>
                    <option value="IN_PROGRESS">풀이 중</option>
                    <option value="SOLVED">해결 완료</option>
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
                    {view === "archive"
                        ? "보관한 문제가 없습니다."
                        : "표시할 개인 문제가 없습니다."}
                </div>
            ) : (
                <div className="ppm-list">
                    {filtered.map((problem) => {
                        const status =
                            STATUS[problem.solveStatus] ||
                            STATUS.NOT_STARTED;

                        const StatusIcon = status.Icon;

                        return (
                            <article
                                key={problem.id}
                                className="ppm-item"
                            >
                                <div className="ppm-item-main">
                                    <div className="ppm-item-top">
                                        <span
                                            className={
                                                `ppm-status ${problem.solveStatus
                                                }`
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

                                    {problem.archived ? (
                                        <button
                                            type="button"
                                            className="ppm-action-button"
                                            title="보관함에서 복원"
                                            disabled={busyId !== null}
                                            onClick={() =>
                                                handleRestore(problem)
                                            }
                                        >
                                            <ArchiveRestore size={16} />
                                            복원
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            className="ppm-action-button"
                                            title="보관함으로 이동"
                                            disabled={busyId !== null}
                                            onClick={() =>
                                                handleArchive(problem)
                                            }
                                        >
                                            <Archive size={16} />
                                            보관
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        className="ppm-delete"
                                        disabled={
                                            problem.submissionCount > 0 ||
                                            busyId !== null
                                        }
                                        title={
                                            problem.submissionCount > 0
                                                ? "제출 기록이 있어 삭제할 수 없습니다."
                                                : "문제 삭제"
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
