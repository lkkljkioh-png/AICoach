
import { useEffect, useMemo, useState } from "react";
import {
    Target,
    CheckCircle2,
    BookOpen,
    CalendarDays,
    ArrowRight,
    Sparkles,
} from "lucide-react";

import "../styles/DailyLearningGoal.css";

// 로컬 날짜 문자열 생성
function getTodayKey() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// 사용자별 학습 목표 불러오기
function loadGoal(userId) {
    try {
        const saved = localStorage.getItem(
            `aicoach:daily-goal:${userId}`
        );

        const value = Number(saved);

        if (
            saved !== null &&
            Number.isInteger(value) &&
            value >= 1 &&
            value <= 10
        ) {
            return value;
        }
    } catch {
        // 브라우저 저장소 접근 실패
    }

    return 3;
}

export default function DailyLearningGoal({
    userId,
    submissions = [],
}) {
    const [goal, setGoal] = useState(() =>
        loadGoal(userId)
    );

    const [todayKey, setTodayKey] = useState(
        getTodayKey
    );

    const [saved, setSaved] = useState(false);

    // 날짜 변경 확인
    useEffect(() => {
        const timer = setInterval(() => {
            const current = getTodayKey();

            setTodayKey((previous) =>
                previous === current ? previous : current
            );
        }, 60000);

        return () => clearInterval(timer);
    }, []);

    // 사용자 변경 시 목표 다시 불러오기
    useEffect(() => {
        setGoal(loadGoal(userId));
        setSaved(false);
    }, [userId]);

    // 오늘 정답을 제출한 서로 다른 문제 집계
    const completedProblems = useMemo(() => {
        const solvedIds = new Set();

        for (const item of submissions) {
            if (
                item.status !== "ACCEPTED" ||
                !item.submittedAt ||
                !item.problemId
            ) {
                continue;
            }

            const submittedDate =
                String(item.submittedAt).slice(0, 10);

            if (submittedDate === todayKey) {
                solvedIds.add(item.problemId);
            }
        }

        return solvedIds.size;
    }, [submissions, todayKey]);

    const percentage = Math.min(
        100,
        Math.round((completedProblems / goal) * 100)
    );

    const remaining = Math.max(
        0,
        goal - completedProblems
    );

    const completed = completedProblems >= goal;

    const handleSave = () => {
        try {
            localStorage.setItem(
                `aicoach:daily-goal:${userId}`,
                String(goal)
            );

            setSaved(true);
        } catch {
            setSaved(false);
            alert("목표 저장에 실패했습니다.");
        }
    };

    return (
        <section className="daily-goal-section">
            <div className="daily-goal-header">
                <div>
                    <span className="daily-goal-eyebrow">
                        DAILY LEARNING GOAL
                    </span>

                    <h2>
                        <Target size={23} />
                        오늘의 학습 목표
                    </h2>

                    <p>
                        매일 목표를 설정하고 꾸준히
                        코딩 실력을 키워보세요.
                    </p>
                </div>

                <span className="daily-goal-date">
                    <CalendarDays size={16} />
                    {todayKey}
                </span>
            </div>

            <div className="daily-goal-card">
                <div className="daily-goal-top">
                    <div className="daily-goal-main-stat">
                        <span>오늘 해결한 문제</span>

                        <div>
                            <strong>{completedProblems}</strong>
                            <span>/ {goal}개</span>
                        </div>
                    </div>

                    <div className="daily-goal-percentage">
                        <span>목표 달성률</span>
                        <strong>{percentage}%</strong>
                    </div>
                </div>

                <div className="daily-goal-progress">
                    <div
                        style={{ width: `${percentage}%` }}
                        role="progressbar"
                        aria-label="일일 학습 목표 달성률"
                        aria-valuenow={percentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                    />
                </div>

                <div className="daily-goal-message">
                    {completed ? (
                        <div className="daily-goal-completed">
                            <CheckCircle2 size={20} />

                            <span>
                                오늘의 목표를 달성했습니다!
                                잘했어요.
                            </span>
                        </div>
                    ) : (
                        <div className="daily-goal-remaining">
                            <BookOpen size={19} />

                            <span>
                                목표까지 {remaining}문제 남았어요.
                            </span>
                        </div>
                    )}
                </div>

                <div className="daily-goal-settings">
                    <div>
                        <h3>나의 일일 목표</h3>
                        <p>
                            하루에 해결할 문제 수를 설정하세요.
                        </p>
                    </div>

                    <div className="daily-goal-actions">
                        <select
                            value={goal}
                            onChange={(e) => {
                                setGoal(Number(e.target.value));
                                setSaved(false);
                            }}
                            aria-label="일일 목표 문제 수"
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

                        <button
                            type="button"
                            onClick={handleSave}
                        >
                            목표 저장
                        </button>
                    </div>
                </div>

                {saved && (
                    <p className="daily-goal-saved">
                        <CheckCircle2 size={15} />
                        목표가 저장되었습니다.
                    </p>
                )}

                {completed && (
                    <div className="daily-goal-success">
                        <Sparkles size={18} />
                        오늘도 목표 달성! 내일도 꾸준히 도전해 보세요.
                    </div>
                )}

                <a
                    href="/problems"
                    className="daily-goal-start"
                >
                    문제 풀러 가기
                    <ArrowRight size={16} />
                </a>
            </div>

            <p className="daily-goal-note">
                오늘 정답을 제출한 서로 다른 문제 수를 기준으로
                계산합니다. 같은 문제를 여러 번 맞혀도 1개로
                집계합니다. 목표 설정은 현재 브라우저에 저장됩니다.
            </p>
        </section>
    );
}
