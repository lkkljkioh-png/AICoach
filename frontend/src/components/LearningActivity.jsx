
import { useEffect, useMemo, useState } from "react";
import {
    Activity,
    CalendarDays,
    Flame,
    Sparkles,
    Bug,
    Code2,
    RefreshCw,
} from "lucide-react";

import { getAILearningActivity } from "../api/aiLearningActivityApi.js";
import "../styles/LearningActivity.css";

// 날짜 변환
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

// 코드 제출 및 AI 학습 활동 통합
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

// 연속 학습 일수
function calculateStreak(records) {
    const cursor = new Date();
    let streak = 0;

    function isActive(date) {
        const record = records.get(dateKey(date));

        return record &&
            (record.submissions > 0 || record.ai > 0);
    }

    if (!isActive(cursor)) {
        cursor.setDate(cursor.getDate() - 1);
    }

    while (isActive(cursor)) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
}

export default function LearningActivity({
    submissions = [],
}) {
    const [aiSessions, setAiSessions] = useState([]);
    const [aiLoading, setAiLoading] = useState(true);
    const [aiError, setAiError] = useState("");

    useEffect(() => {
        let active = true;

        async function load() {
            try {
                const data = await getAILearningActivity();

                if (active) {
                    setAiSessions(data);
                    setAiError("");
                }
            } catch (err) {
                if (active) {
                    setAiError(err.message);
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

    const stats = useMemo(() => {
        const records = buildDailyRecords(
            submissions,
            aiSessions
        );

        const today = new Date();

        const weekly = Array.from(
            { length: 7 },
            (_, index) => {
                const date = new Date(today);
                date.setDate(today.getDate() - (6 - index));

                const record = records.get(dateKey(date)) || {
                    submissions: 0,
                    accepted: 0,
                    ai: 0,
                };

                return {
                    key: dateKey(date),
                    label: `${date.getMonth() + 1}/${date.getDate()}`,
                    ...record,
                };
            }
        );

        const totalSubmissions = weekly.reduce(
            (sum, day) => sum + day.submissions,
            0
        );

        const totalAI = weekly.reduce(
            (sum, day) => sum + day.ai,
            0
        );

        const activeDays = weekly.filter(
            (day) => day.submissions > 0 || day.ai > 0
        ).length;

        const generated = aiSessions.filter(
            (item) => item.action === "generate"
        ).length;

        const debugged = aiSessions.filter(
            (item) => item.action === "debug"
        ).length;

        const revised = aiSessions.filter(
            (item) => item.revised
        ).length;

        return {
            weekly,
            totalSubmissions,
            totalAI,
            activeDays,
            generated,
            debugged,
            revised,
            streak: calculateStreak(records),
            max: Math.max(
                1,
                ...weekly.map((day) =>
                    Math.max(day.submissions, day.ai)
                )
            ),
        };
    }, [submissions, aiSessions]);

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
                        활동을 함께 확인하세요.
                    </p>
                </div>

                <span className="activity-period">
                    <CalendarDays size={16} />
                    최근 7일
                </span>
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
                    <span>최근 7일 코드 제출</span>
                    <strong>{stats.totalSubmissions}회</strong>
                </div>

                <div className="activity-summary-card">
                    <Sparkles size={20} />
                    <span>최근 7일 AI 활용</span>
                    <strong>{stats.totalAI}회</strong>
                </div>

                <div className="activity-summary-card">
                    <CalendarDays size={20} />
                    <span>최근 7일 학습 활동일</span>
                    <strong>{stats.activeDays}일</strong>
                </div>

                <div className="activity-summary-card">
                    <Flame size={20} />
                    <span>연속 학습</span>
                    <strong>{stats.streak}일</strong>
                </div>
            </div>

            <div className="activity-chart-card">
                <div className="activity-chart-heading">
                    <div>
                        <h3>최근 7일 학습 추이</h3>
                        <p>코드 제출과 AI 활용 기록 비교</p>
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

                <div
                    className="activity-chart activity-chart-dual"
                    role="img"
                    aria-label="최근 7일 코드 제출 및 AI 활용 추이"
                >
                    {stats.weekly.map((day) => (
                        <div className="activity-day" key={day.key}>
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
                                        title={`코드 제출 ${day.submissions}회`}
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
                                        title={`AI 활용 ${day.ai}회`}
                                    />
                                </div>
                            </div>

                            <span className="activity-date">
                                {day.label}
                            </span>
                        </div>
                    ))}
                </div>

                <p className="activity-stat-note">
                    코드 제출은 직접 코딩과 AI 활용 모드의 제출을
                    모두 포함합니다. AI 활용은 생성하거나 디버깅한
                    코드를 선택하여 저장한 횟수입니다.
                </p>
            </div>

            <div className="activity-ai-detail">
                <div className="activity-chart-heading">
                    <div>
                        <h3>AI 활용 학습 분석</h3>
                        <p>전체 기간에 저장된 AI 학습 기록</p>
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
                        <span>전체 AI 학습 기록</span>
                        <strong>{aiSessions.length}건</strong>
                    </div>
                </div>
            </div>
        </section>
    );
}
