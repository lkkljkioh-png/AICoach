
import { useEffect, useMemo, useState } from "react";
import {
    Activity,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Flame,
    Sparkles,
    Bug,
    Code2,
    RefreshCw,
} from "lucide-react";

import { getAILearningActivity } from "../api/aiLearningActivityApi.js";
import "../styles/LearningActivity.css";

function dateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function parseDate(value) {
    if (!value) return null;

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(date, amount) {
    const next = new Date(date);
    next.setDate(next.getDate() + amount);
    return next;
}

function getWeekStart(date) {
    const result = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    );

    const day = result.getDay();
    const diff = day === 0 ? -6 : 1 - day;

    result.setDate(result.getDate() + diff);

    return result;
}

function getMonthStart(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatPeriod(start, end, mode) {
    if (mode === "month") {
        return `${start.getFullYear()}년 ${start.getMonth() + 1}월`;
    }

    const format = (date) =>
        `${date.getMonth() + 1}/${date.getDate()}`;

    return `${start.getFullYear()}년 ${format(start)} ~ ${format(end)}`;
}

function buildDailyRecords(submissions, aiSessions) {
    const records = new Map();

    function getRecord(key) {
        if (!records.has(key)) {
            records.set(key, {
                submissions: 0,
                accepted: 0,
                ai: 0,
            });
        }

        return records.get(key);
    }

    for (const item of submissions) {
        const date = parseDate(item.submittedAt);

        if (!date) continue;

        const record = getRecord(dateKey(date));

        record.submissions += 1;

        if (item.status === "ACCEPTED") {
            record.accepted += 1;
        }
    }

    for (const item of aiSessions) {
        const date = parseDate(item.createdAt);

        if (!date) continue;

        const record = getRecord(dateKey(date));
        record.ai += 1;
    }

    return records;
}

function calculateStreak(records) {
    const cursor = new Date();

    function isActive(date) {
        const record = records.get(dateKey(date));

        return Boolean(
            record &&
            (record.submissions > 0 || record.ai > 0)
        );
    }

    if (!isActive(cursor)) {
        cursor.setDate(cursor.getDate() - 1);
    }

    let streak = 0;

    while (isActive(cursor)) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
}

export default function LearningActivity({
    submissions = [],
}) {
    const [mode, setMode] = useState("week");
    const [selectedDate, setSelectedDate] = useState(
        () => new Date()
    );

    const [aiSessions, setAiSessions] = useState([]);
    const [aiLoading, setAiLoading] = useState(true);
    const [aiError, setAiError] = useState("");

    useEffect(() => {
        let active = true;

        async function load() {
            try {
                const data = await getAILearningActivity();

                if (active) {
                    setAiSessions(
                        Array.isArray(data) ? data : []
                    );
                    setAiError("");
                }
            } catch (err) {
                if (active) {
                    setAiError(
                        err.message || "AI 학습 기록 조회 실패"
                    );
                }
            } finally {
                if (active) setAiLoading(false);
            }
        }

        load();

        return () => {
            active = false;
        };
    }, []);

    const period = useMemo(() => {
        let start;
        let end;

        if (mode === "week") {
            start = getWeekStart(selectedDate);
            end = addDays(start, 6);
        } else {
            start = getMonthStart(selectedDate);
            end = new Date(
                start.getFullYear(),
                start.getMonth() + 1,
                0
            );
        }

        return {
            start,
            end,
            startKey: dateKey(start),
            endKey: dateKey(end),
            label: formatPeriod(start, end, mode),
        };
    }, [mode, selectedDate]);

    const movePeriod = (amount) => {
        setSelectedDate((previous) => {
            if (mode === "week") {
                return addDays(previous, amount * 7);
            }

            return new Date(
                previous.getFullYear(),
                previous.getMonth() + amount,
                1
            );
        });
    };

    const changeMode = (nextMode) => {
        setMode(nextMode);
        setSelectedDate(new Date());
    };

    const goToday = () => {
        setSelectedDate(new Date());
    };

    const stats = useMemo(() => {
        const records = buildDailyRecords(
            submissions,
            aiSessions
        );

        const days = [];
        const cursor = new Date(period.start);

        while (cursor <= period.end) {
            const key = dateKey(cursor);

            const record = records.get(key) || {
                submissions: 0,
                accepted: 0,
                ai: 0,
            };

            days.push({
                key,
                label: mode === "week"
                    ? `${cursor.getMonth() + 1}/${cursor.getDate()}`
                    : String(cursor.getDate()),
                weekday: ["일", "월", "화", "수", "목", "금", "토"][
                    cursor.getDay()
                ],
                ...record,
            });

            cursor.setDate(cursor.getDate() + 1);
        }

        const totalSubmissions = days.reduce(
            (sum, day) => sum + day.submissions,
            0
        );

        const totalAI = days.reduce(
            (sum, day) => sum + day.ai,
            0
        );

        const totalAccepted = days.reduce(
            (sum, day) => sum + day.accepted,
            0
        );

        const activeDays = days.filter(
            (day) => day.submissions > 0 || day.ai > 0
        ).length;

        const filteredAI = aiSessions.filter((item) => {
            const date = parseDate(item.createdAt);

            if (!date) return false;

            const key = dateKey(date);

            return (
                key >= period.startKey &&
                key <= period.endKey
            );
        });

        const generated = filteredAI.filter(
            (item) => item.action === "generate"
        ).length;

        const debugged = filteredAI.filter(
            (item) => item.action === "debug"
        ).length;

        const revised = filteredAI.filter(
            (item) => item.revised === true
        ).length;

        return {
            days,
            totalSubmissions,
            totalAccepted,
            totalAI,
            activeDays,
            generated,
            debugged,
            revised,
            totalAISessions: filteredAI.length,
            streak: calculateStreak(records),
            max: Math.max(
                1,
                ...days.map((day) =>
                    Math.max(day.submissions, day.ai)
                )
            ),
        };
    }, [
        submissions,
        aiSessions,
        period,
        mode,
    ]);

    const isCurrentPeriod = useMemo(() => {
        const today = dateKey(new Date());

        return (
            today >= period.startKey &&
            today <= period.endKey
        );
    }, [period]);

    return (
        <section className="activity-section">
            <div className="activity-heading">
                <div>
                    <span className="activity-eyebrow">
                        LEARNING ANALYTICS
                    </span>

                    <h2>나의 학습 활동</h2>

                    <p>
                        직접 작성한 코드 제출과 AI 활용 학습
                        활동을 기간별로 분석합니다.
                    </p>
                </div>

                <div className="activity-controls">
                    <div
                        className="activity-mode-switch"
                        aria-label="학습 분석 기간 선택"
                    >
                        <button
                            type="button"
                            className={
                                mode === "week" ? "active" : ""
                            }
                            onClick={() => changeMode("week")}
                            aria-pressed={mode === "week"}
                        >
                            주간
                        </button>

                        <button
                            type="button"
                            className={
                                mode === "month" ? "active" : ""
                            }
                            onClick={() => changeMode("month")}
                            aria-pressed={mode === "month"}
                        >
                            월간
                        </button>
                    </div>
                </div>
            </div>

            <div className="activity-period-navigation">
                <div className="activity-navigation-left">
                    <button
                        type="button"
                        onClick={() => movePeriod(-1)}
                        aria-label={
                            mode === "week" ? "이전 주" : "이전 달"
                        }
                    >
                        <ChevronLeft size={19} />
                    </button>

                    <span className="activity-selected-period">
                        <CalendarDays size={17} />
                        {period.label}
                    </span>

                    <button
                        type="button"
                        onClick={() => movePeriod(1)}
                        aria-label={
                            mode === "week" ? "다음 주" : "다음 달"
                        }
                    >
                        <ChevronRight size={19} />
                    </button>
                </div>

                <button
                    type="button"
                    className="activity-today-button"
                    onClick={goToday}
                    disabled={isCurrentPeriod}
                >
                    오늘로 이동
                </button>
            </div>

            {aiError && (
                <p className="activity-error" role="alert">
                    AI 학습 기록을 불러오지 못했습니다.
                    제출 기록만 표시됩니다. {aiError}
                </p>
            )}

            {aiLoading && (
                <p className="activity-loading">
                    AI 학습 기록을 불러오는 중...
                </p>
            )}

            <div className="activity-summary">
                <div className="activity-summary-card">
                    <Code2 size={20} />
                    <span>선택 기간 코드 제출</span>
                    <strong>{stats.totalSubmissions}회</strong>
                </div>

                <div className="activity-summary-card">
                    <Sparkles size={20} />
                    <span>선택 기간 AI 활용</span>
                    <strong>{stats.totalAI}회</strong>
                </div>

                <div className="activity-summary-card">
                    <CalendarDays size={20} />
                    <span>선택 기간 학습 활동일</span>
                    <strong>{stats.activeDays}일</strong>
                </div>

                <div className="activity-summary-card">
                    <Flame size={20} />
                    <span>현재 연속 학습</span>
                    <strong>{stats.streak}일</strong>
                </div>
            </div>

            <div className="activity-chart-card">
                <div className="activity-chart-heading">
                    <div>
                        <h3>
                            {mode === "week"
                                ? "주간 학습 추이"
                                : "월간 학습 추이"}
                        </h3>

                        <p>
                            {period.label} · 코드 제출과 AI 활용 기록
                        </p>
                    </div>

                    <div className="activity-legend">
                        <span>
                            <i className="activity-dot activity-dot-total" />
                            코드 제출
                        </span>
                        <span>
                            <i className="activity-dot activity-dot-ai" />
                            AI 활용
                        </span>
                    </div>
                </div>

                <div className="activity-chart-scroll">
                    <div
                        className={`activity-chart activity-chart-dual ${mode === "month"
                                ? "activity-chart-month"
                                : "activity-chart-week"
                            }`}
                        role="img"
                        aria-label={`${period.label} 코드 제출 및 AI 활용 추이`}
                    >
                        {stats.days.map((day) => (
                            <div
                                className="activity-day"
                                key={day.key}
                            >
                                <div className="activity-dual-bars">
                                    <div className="activity-dual-column">
                                        {day.submissions > 0 && (
                                            <span className="activity-count">
                                                {day.submissions}
                                            </span>
                                        )}

                                        <div
                                            className="activity-dual-bar activity-submission-bar"
                                            style={{
                                                height: `${(day.submissions / stats.max) * 100
                                                    }%`,
                                            }}
                                            title={`${day.key}: 코드 제출 ${day.submissions}회`}
                                        />
                                    </div>

                                    <div className="activity-dual-column">
                                        {day.ai > 0 && (
                                            <span className="activity-count">
                                                {day.ai}
                                            </span>
                                        )}

                                        <div
                                            className="activity-dual-bar activity-ai-bar"
                                            style={{
                                                height: `${(day.ai / stats.max) * 100
                                                    }%`,
                                            }}
                                            title={`${day.key}: AI 활용 ${day.ai}회`}
                                        />
                                    </div>
                                </div>

                                <span className="activity-date">
                                    {day.label}
                                </span>

                                {mode === "week" && (
                                    <span className="activity-weekday">
                                        {day.weekday}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <p className="activity-stat-note">
                    코드 제출에는 직접 코딩과 AI 활용 모드의
                    제출이 모두 포함됩니다. AI 활용은
                    AI 학습 세션 생성 기록을 기준으로 집계합니다.
                    연속 학습 일수는 선택 기간에 관계없이
                    현재 날짜를 기준으로 계산합니다.
                </p>
            </div>

            <div className="activity-ai-detail">
                <div className="activity-chart-heading">
                    <div>
                        <h3>AI 활용 학습 분석</h3>
                        <p>
                            {period.label}에 저장된 AI 학습 기록
                        </p>
                    </div>

                    <Sparkles size={21} />
                </div>

                <div className="activity-ai-grid">
                    <div>
                        <Sparkles size={19} />
                        <span>AI 코드 생성</span>
                        <strong>{stats.generated}회</strong>
                    </div>

                    <div>
                        <Bug size={19} />
                        <span>AI 디버깅</span>
                        <strong>{stats.debugged}회</strong>
                    </div>

                    <div>
                        <RefreshCw size={19} />
                        <span>AI 코드 수정</span>
                        <strong>{stats.revised}건</strong>
                    </div>

                    <div>
                        <Activity size={19} />
                        <span>선택 기간 AI 학습 기록</span>
                        <strong>
                            {stats.totalAISessions}건
                        </strong>
                    </div>
                </div>
            </div>
        </section>
    );
}
