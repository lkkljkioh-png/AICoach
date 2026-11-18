
import { useMemo } from "react";
import {
    Target,
    CheckCircle2,
    BookOpenCheck,
    Flame,
    TrendingUp,
    CalendarCheck2,
} from "lucide-react";

import "../styles/LearningGoalStats.css";

// 날짜 문자열 생성
function toDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// 날짜 문자열을 로컬 날짜로 변환
function parseDate(key) {
    const [year, month, day] = key.split("-").map(Number);

    return new Date(year, month - 1, day);
}

// 각 날짜에 정답을 제출한 서로 다른 문제 수 계산
function buildSolvedMap(submissions) {
    const grouped = new Map();

    for (const item of submissions) {
        if (
            item.status !== "ACCEPTED" ||
            item.problemId == null ||
            !item.submittedAt
        ) {
            continue;
        }

        const key = String(item.submittedAt).slice(0, 10);

        if (!grouped.has(key)) {
            grouped.set(key, new Set());
        }

        grouped.get(key).add(String(item.problemId));
    }

    return new Map(
        [...grouped].map(([key, ids]) => [key, ids.size])
    );
}

// 해당 날짜의 목표 달성 여부
function isCompleted(plan, solvedMap) {
    if (!plan) return false;

    return (
        (solvedMap.get(plan.planDate) || 0) >=
        plan.targetCount
    );
}

// 오늘 또는 어제부터 거슬러 올라간 연속 달성 일수
function calculateStreak(planMap, solvedMap, today) {
    let cursor = parseDate(today);

    const todayPlan = planMap.get(today);

    if (!isCompleted(todayPlan, solvedMap)) {
        cursor.setDate(cursor.getDate() - 1);
    }

    let streak = 0;

    while (true) {
        const key = toDateKey(cursor);
        const plan = planMap.get(key);

        if (!isCompleted(plan, solvedMap)) {
            break;
        }

        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
}

export default function LearningGoalStats({
    plans = [],
    submissions = [],
    month,
}) {
    const now = new Date();
    const today = toDateKey(now);

    const analysis = useMemo(() => {
        const selectedMonth = month instanceof Date
            ? month
            : new Date();

        const year = selectedMonth.getFullYear();
        const monthIndex = selectedMonth.getMonth();

        const firstDay = new Date(year, monthIndex, 1);
        const lastDay = new Date(year, monthIndex + 1, 0);

        const solvedMap = buildSolvedMap(submissions);

        const planMap = new Map(
            plans.map((plan) => [plan.planDate, plan])
        );

        const monthlyPlans = plans.filter((plan) => {
            const date = parseDate(plan.planDate);

            return (
                date.getFullYear() === year &&
                date.getMonth() === monthIndex
            );
        });

        // 미래 날짜의 계획은 달성률에서 제외
        const eligiblePlans = monthlyPlans.filter(
            (plan) => plan.planDate <= today
        );

        const completedPlans = eligiblePlans.filter(
            (plan) => isCompleted(plan, solvedMap)
        );

        const goalRate = eligiblePlans.length > 0
            ? Math.round(
                (completedPlans.length / eligiblePlans.length) * 100
            )
            : null;

        const solvedTotal = [...solvedMap.entries()]
            .filter(([key]) => {
                const date = parseDate(key);

                return (
                    date.getFullYear() === year &&
                    date.getMonth() === monthIndex &&
                    key <= today
                );
            })
            .reduce((sum, [, count]) => sum + count, 0);

        const daily = [];

        for (
            let day = new Date(firstDay);
            day <= lastDay;
            day.setDate(day.getDate() + 1)
        ) {
            const key = toDateKey(day);
            const plan = planMap.get(key);
            const solved = solvedMap.get(key) || 0;

            const future = key > today;

            daily.push({
                key,
                day: day.getDate(),
                plan: Boolean(plan),
                future,
                solved,
                target: plan?.targetCount || 0,
                completed: !future && isCompleted(plan, solvedMap),
                percentage: plan && !future
                    ? Math.min(
                        100,
                        Math.round((solved / plan.targetCount) * 100)
                    )
                    : 0,
            });
        }

        const streak = calculateStreak(
            planMap,
            solvedMap,
            today
        );

        const incomplete = eligiblePlans.length -
            completedPlans.length;

        return {
            goalRate,
            registered: monthlyPlans.length,
            evaluated: eligiblePlans.length,
            completed: completedPlans.length,
            incomplete,
            solvedTotal,
            streak,
            daily,
        };
    }, [plans, submissions, month, today]);

    const monthLabel = month instanceof Date
        ? `${month.getFullYear()}년 ${month.getMonth() + 1}월`
        : `${now.getFullYear()}년 ${now.getMonth() + 1}월`;

    return (
        <section className="goal-stats">
            <div className="goal-stats-heading">
                <div>
                    <span className="goal-stats-eyebrow">
                        GOAL ANALYTICS
                    </span>

                    <h3>
                        <TrendingUp size={21} />
                        학습 목표 달성 통계
                    </h3>

                    <p>{monthLabel} 기준 학습 분석</p>
                </div>

                <CalendarCheck2 size={23} />
            </div>

            <div className="goal-stats-grid">
                <div className="goal-stats-card">
                    <Target size={21} />
                    <span>목표 달성률</span>
                    <strong>
                        {analysis.goalRate === null
                            ? "-"
                            : `${analysis.goalRate}%`}
                    </strong>
                    <small>미래 목표 제외</small>
                </div>

                <div className="goal-stats-card">
                    <CheckCircle2 size={21} />
                    <span>목표 달성 일수</span>
                    <strong>
                        {analysis.completed}
                        <small> / {analysis.evaluated}일</small>
                    </strong>
                    <small>
                        이번 달 등록 {analysis.registered}일
                    </small>
                </div>

                <div className="goal-stats-card">
                    <BookOpenCheck size={21} />
                    <span>이번 달 해결 문제</span>
                    <strong>
                        {analysis.solvedTotal}
                        <small>개</small>
                    </strong>
                    <small>날짜별 중복 제거</small>
                </div>

                <div className="goal-stats-card">
                    <Flame size={21} />
                    <span>현재 연속 목표 달성</span>
                    <strong>
                        {analysis.streak}
                        <small>일</small>
                    </strong>
                    <small>오늘 또는 어제 기준</small>
                </div>
            </div>

            <div className="goal-stats-detail">
                <div className="goal-stats-detail-heading">
                    <div>
                        <h4>일별 목표 달성 현황</h4>
                        <p>
                            날짜별 학습 목표 대비 실제 정답 문제 수
                        </p>
                    </div>
                </div>

                <div className="goal-stats-chart-scroll">
                    <div className="goal-stats-chart">
                        {analysis.daily.map((item) => (
                            <div
                                className="goal-stats-day"
                                key={item.key}
                                title={
                                    item.plan
                                        ? `${item.key}: ${item.solved}/${item.target}문제`
                                        : `${item.key}: 등록된 목표 없음`
                                }
                            >
                                <div className="goal-stats-bar-track">
                                    {item.plan && !item.future && (
                                        <div
                                            className={
                                                item.completed
                                                    ? "goal-stats-bar completed"
                                                    : "goal-stats-bar"
                                            }
                                            style={{
                                                height: `${item.percentage}%`,
                                            }}
                                        />
                                    )}
                                </div>

                                <span className="goal-stats-day-label">
                                    {item.day}
                                </span>

                                <span
                                    className={[
                                        "goal-stats-day-dot",
                                        item.completed ? "completed" : "",
                                        item.plan ? "planned" : "",
                                    ].join(" ")}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="goal-stats-legend">
                    <span>
                        <i className="goal-legend-success" />
                        달성
                    </span>
                    <span>
                        <i className="goal-legend-progress" />
                        미달성
                    </span>
                    <span>
                        <i className="goal-legend-none" />
                        목표 없음 / 미래
                    </span>
                </div>

                {analysis.evaluated === 0 ? (
                    <p className="goal-stats-feedback">
                        이 달에는 아직 평가할 학습 목표가 없습니다.
                        날짜를 선택해 목표를 등록해 보세요.
                    </p>
                ) : analysis.incomplete === 0 ? (
                    <p className="goal-stats-feedback success">
                        등록한 학습 목표를 모두 달성했어요!
                    </p>
                ) : (
                    <p className="goal-stats-feedback">
                        현재까지 {analysis.completed}일 목표를 달성했고,
                        {analysis.incomplete}일은 목표를 채우지 못했어요.
                    </p>
                )}
            </div>

            <p className="goal-stats-note">
                목표 달성률은 선택한 달의 오늘까지 등록된
                목표 중 달성한 날짜의 비율입니다.
                연속 달성은 목표가 등록된 날짜를 매일
                연속으로 달성한 경우에만 집계합니다.
                해결 문제 수는 같은 날짜의 중복 정답을 제외합니다.
            </p>
        </section>
    );
}
