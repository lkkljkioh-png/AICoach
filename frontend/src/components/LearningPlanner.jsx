
import { useEffect, useMemo, useState } from "react";
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Target,
    CheckCircle2,
    Trash2,
    Save,
    BookOpen,
    AlertCircle,
} from "lucide-react";

import {
    getLearningPlans,
    saveLearningPlan,
    deleteLearningPlan,
} from "../api/learningPlanApi.js";

import "../styles/LearningPlanner.css";
import LearningGoalStats from "./LearningGoalStats.jsx";

// 로컬 날짜를 YYYY-MM-DD로 변환
function dateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function localDate(key) {
    const [year, month, day] = key.split("-").map(Number);
    return new Date(year, month - 1, day);
}

// 달력에 표시할 날짜 계산
function createCalendar(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const result = [];

    for (let index = 0; index < firstDay.getDay(); index++) {
        result.push(null);
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
        result.push(dateKey(new Date(year, month, day)));
    }

    return result;
}

// 날짜별 정답 문제 수 계산
function countSolvedByDate(submissions) {
    const grouped = new Map();

    for (const submission of submissions) {
        if (
            submission.status !== "ACCEPTED" ||
            !submission.submittedAt ||
            submission.problemId == null
        ) {
            continue;
        }

        const key = String(submission.submittedAt).slice(0, 10);

        if (!grouped.has(key)) {
            grouped.set(key, new Set());
        }

        grouped.get(key).add(String(submission.problemId));
    }

    return new Map(
        [...grouped].map(([key, problems]) => [
            key,
            problems.size,
        ])
    );
}

export default function LearningPlanner({
    submissions = [],
}) {
    const today = dateKey(new Date());

    const [selectedDate, setSelectedDate] = useState(today);

    const [month, setMonth] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });

    const [plans, setPlans] = useState([]);
    const [title, setTitle] = useState("");
    const [targetCount, setTargetCount] = useState(3);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    // 학습 계획 불러오기
    useEffect(() => {
        let active = true;

        async function load() {
            try {
                const data = await getLearningPlans();

                if (active) {
                    const loadedPlans = Array.isArray(data) ? data : [];
                    setPlans(loadedPlans);

                    const todayPlan = loadedPlans.find(
                        (plan) => plan.planDate === today
                    );

                    setTitle(todayPlan?.title || "");
                    setTargetCount(todayPlan?.targetCount || 3);
                }
            } catch (err) {
                if (active) {
                    setError(err.message);
                }
            } finally {
                if (active) setLoading(false);
            }
        }

        load();

        return () => {
            active = false;
        };
    }, []);

    const planMap = useMemo(
        () => new Map(
            plans.map((plan) => [plan.planDate, plan])
        ),
        [plans]
    );

    const solvedMap = useMemo(
        () => countSolvedByDate(submissions),
        [submissions]
    );

    const selectedPlan = planMap.get(selectedDate);
    const solved = solvedMap.get(selectedDate) || 0;

    const percentage = selectedPlan
        ? Math.min(
            100,
            Math.round(
                (solved / selectedPlan.targetCount) * 100
            )
        )
        : 0;

    const calendar = useMemo(
        () => createCalendar(
            month.getFullYear(),
            month.getMonth()
        ),
        [month]
    );

    // 선택 날짜 변경
    const selectDate = (key) => {
        setSelectedDate(key);
        setError("");
        setMessage("");

        const plan = planMap.get(key);

        setTitle(plan?.title || "");
        setTargetCount(plan?.targetCount || 3);
    };

    // 월 이동
    const changeMonth = (amount) => {
        const nextMonth = new Date(
            month.getFullYear(),
            month.getMonth() + amount,
            1
        );

        setMonth(nextMonth);
    };

    // 학습 일정 저장
    const handleSave = async (event) => {
        event.preventDefault();

        if (saving) return;

        if (!title.trim()) {
            setError("학습 내용을 입력해 주세요.");
            return;
        }

        if (title.trim().length > 150) {
            setError("학습 내용은 150자 이하로 입력해 주세요.");
            return;
        }

        setSaving(true);
        setError("");
        setMessage("");

        try {
            const savedPlan = await saveLearningPlan({
                planDate: selectedDate,
                title: title.trim(),
                targetCount,
            });

            setPlans((previous) => [
                ...previous.filter(
                    (plan) => plan.planDate !== selectedDate
                ),
                savedPlan,
            ]);

            setMessage("학습 계획이 저장되었습니다.");
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    // 학습 일정 삭제
    const handleDelete = async () => {
        if (!selectedPlan || saving) return;

        const confirmed = window.confirm(
            `${selectedDate} 학습 계획을 삭제하시겠습니까?`
        );

        if (!confirmed) return;

        setSaving(true);
        setError("");
        setMessage("");

        try {
            await deleteLearningPlan(selectedDate);

            setPlans((previous) =>
                previous.filter(
                    (plan) => plan.planDate !== selectedDate
                )
            );

            setTitle("");
            setTargetCount(3);
            setMessage("학습 계획이 삭제되었습니다.");
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    // 월별 달성 통계
    const monthlyStats = useMemo(() => {
        const prefix = `${month.getFullYear()}-${String(
            month.getMonth() + 1
        ).padStart(2, "0")}`;

        const monthlyPlans = plans.filter(
            (plan) => plan.planDate.startsWith(prefix)
        );

        const completed = monthlyPlans.filter((plan) => {
            const count = solvedMap.get(plan.planDate) || 0;
            return count >= plan.targetCount;
        }).length;

        return {
            total: monthlyPlans.length,
            completed,
        };
    }, [plans, month, solvedMap]);

    return (
        <section className="planner">
            <div className="planner-heading">
                <div>
                    <span className="planner-eyebrow">
                        LEARNING PLANNER
                    </span>
                    <h2>나의 학습 플래너</h2>
                    <p>
                        원하는 날짜에 학습 목표를 등록하고
                        달성 현황을 관리하세요.
                    </p>
                </div>

                <CalendarDays size={26} />
            </div>

            {loading ? (
                <div className="planner-message">
                    학습 일정을 불러오는 중입니다...
                </div>
            ) : (
                <>
                    <div className="planner-summary">
                        <div>
                            <span>이번 달 등록된 목표</span>
                            <strong>{monthlyStats.total}개</strong>
                        </div>

                        <div>
                            <span>이번 달 달성한 목표</span>
                            <strong>{monthlyStats.completed}개</strong>
                        </div>

                        <div>
                            <span>선택 날짜 정답 문제</span>
                            <strong>{solved}개</strong>
                        </div>
                    </div>

                    <div className="planner-layout">
                        <div className="planner-calendar-card">
                            <div className="planner-calendar-header">
                                <button
                                    type="button"
                                    onClick={() => changeMonth(-1)}
                                    aria-label="이전 달"
                                >
                                    <ChevronLeft size={19} />
                                </button>

                                <h3>
                                    {month.getFullYear()}년{" "}
                                    {month.getMonth() + 1}월
                                </h3>

                                <button
                                    type="button"
                                    onClick={() => changeMonth(1)}
                                    aria-label="다음 달"
                                >
                                    <ChevronRight size={19} />
                                </button>
                            </div>

                            <div className="planner-weekdays">
                                {["일", "월", "화", "수", "목", "금", "토"].map(
                                    (day) => <span key={day}>{day}</span>
                                )}
                            </div>

                            <div className="planner-calendar-grid">
                                {calendar.map((key, index) => {
                                    if (!key) {
                                        return (
                                            <div
                                                className="planner-empty-day"
                                                key={`empty-${index}`}
                                            />
                                        );
                                    }

                                    const plan = planMap.get(key);
                                    const completed = plan &&
                                        (solvedMap.get(key) || 0) >=
                                        plan.targetCount;

                                    return (
                                        <button
                                            type="button"
                                            key={key}
                                            className={[
                                                "planner-day",
                                                key === selectedDate ? "selected" : "",
                                                key === today ? "today" : "",
                                                plan ? "has-plan" : "",
                                                completed ? "completed" : "",
                                            ].join(" ")}
                                            onClick={() => selectDate(key)}
                                            aria-pressed={key === selectedDate}
                                        >
                                            <span>
                                                {Number(key.slice(-2))}
                                            </span>

                                            {plan && (
                                                <span className="planner-day-dot" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="planner-legend">
                                <span>
                                    <i className="planner-dot-planned" />
                                    계획 있음
                                </span>
                                <span>
                                    <i className="planner-dot-completed" />
                                    목표 달성
                                </span>
                            </div>
                        </div>

                        <div className="planner-editor-card">
                            <div className="planner-editor-heading">
                                <div>
                                    <span>선택한 날짜</span>
                                    <h3>{selectedDate}</h3>
                                </div>

                                <button
                                    type="button"
                                    className="planner-today-btn"
                                    onClick={() => {
                                        const current = localDate(today);
                                        setMonth(new Date(
                                            current.getFullYear(),
                                            current.getMonth(),
                                            1
                                        ));
                                        selectDate(today);
                                    }}
                                >
                                    오늘
                                </button>
                            </div>

                            {selectedPlan && (
                                <div className="planner-progress-card">
                                    <div className="planner-progress-top">
                                        <span>목표 달성률</span>
                                        <strong>{percentage}%</strong>
                                    </div>

                                    <div className="planner-progress-track">
                                        <div
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>

                                    <p>
                                        {solved} / {selectedPlan.targetCount}문제
                                        {percentage === 100
                                            ? " · 목표 달성!"
                                            : " · 학습 진행 중"}
                                    </p>
                                </div>
                            )}

                            <form onSubmit={handleSave}>
                                <label htmlFor="planner-title">
                                    학습 내용
                                </label>

                                <input
                                    id="planner-title"
                                    value={title}
                                    onChange={(event) =>
                                        setTitle(event.target.value)
                                    }
                                    placeholder="예: Python 배열 문제 복습"
                                    maxLength={150}
                                    required
                                />

                                <label htmlFor="planner-target">
                                    목표 문제 수
                                </label>

                                <select
                                    id="planner-target"
                                    value={targetCount}
                                    onChange={(event) =>
                                        setTargetCount(Number(event.target.value))
                                    }
                                >
                                    {Array.from(
                                        { length: 10 },
                                        (_, index) => index + 1
                                    ).map((value) => (
                                        <option key={value} value={value}>
                                            {value}문제
                                        </option>
                                    ))}
                                </select>

                                {error && (
                                    <p className="planner-error" role="alert">
                                        <AlertCircle size={16} />
                                        {error}
                                    </p>
                                )}

                                {message && (
                                    <p className="planner-success" role="status">
                                        <CheckCircle2 size={16} />
                                        {message}
                                    </p>
                                )}

                                <div className="planner-actions">
                                    <button
                                        type="submit"
                                        className="planner-save-btn"
                                        disabled={saving}
                                    >
                                        <Save size={17} />
                                        {saving ? "저장 중..." : "계획 저장"}
                                    </button>

                                    {selectedPlan && (
                                        <button
                                            type="button"
                                            className="planner-delete-btn"
                                            onClick={handleDelete}
                                            disabled={saving}
                                        >
                                            <Trash2 size={17} />
                                            삭제
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>

                    <LearningGoalStats
                        plans={plans}
                        submissions={submissions}
                        month={month}
                    />

                    <div className="planner-bottom-info">
                        <Target size={18} />
                        <p>
                            목표 달성률은 선택한 날짜에 정답을 제출한
                            서로 다른 문제 수로 계산합니다. 같은 문제를
                            여러 번 맞혀도 1개로 집계합니다.
                        </p>
                    </div>

                    <a href="/problems" className="planner-go-problems">
                        <BookOpen size={18} />
                        문제 풀러 가기
                    </a>
                </>
            )}
        </section>
    );
}
