
import { useEffect, useState } from "react";
import {
    Activity,
    BarChart3,
    Code2,
    RefreshCw,
    Target,
} from "lucide-react";

import { getLearningDashboard } from "../api/learningApi.js";
import "../styles/LearningDashboard.css";


function formatDate(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

    return `${month}월 ${day}일 (${weekdays[date.getDay()]})`;
}


export default function LearningDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = async () => {
        setLoading(true);
        setError("");

        try {
            const result = await getLearningDashboard();
            setData(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let active = true;

        getLearningDashboard()
            .then((result) => {
                if (active) setData(result);
            })
            .catch((err) => {
                if (active) setError(err.message);
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    if (loading) {
        return (
            <section className="dashboard-panel">
                <p>학습 대시보드 불러오는 중...</p>
            </section>
        );
    }

    if (error) {
        return (
            <section className="dashboard-panel">
                <p>{error}</p>
                <button
                    className="dashboard-retry"
                    onClick={load}
                >
                    <RefreshCw size={16} />
                    다시 시도
                </button>
            </section>
        );
    }

    if (!data) return null;

    const languages = data.languages ?? [];
    const activity = data.dailyActivity ?? [];

    const maxDaily = Math.max(
        1,
        ...activity.map((day) => day.total)
    );

    return (
        <div className="dashboard-container">

            <section className="dashboard-summary">
                <div className="dashboard-stat">
                    <Activity size={22} />
                    <span>총 제출</span>
                    <strong>{data.totalSubmissions}회</strong>
                </div>

                <div className="dashboard-stat">
                    <Target size={22} />
                    <span>해결한 문제</span>
                    <strong>{data.solvedProblems}개</strong>
                </div>

                <div className="dashboard-stat">
                    <BarChart3 size={22} />
                    <span>전체 정답률</span>
                    <strong>{data.accuracy}%</strong>
                </div>

                <div className="dashboard-stat">
                    <Code2 size={22} />
                    <span>최근 7일 학습</span>
                    <strong>{data.activeDays}일</strong>
                </div>
            </section>

            <section className="dashboard-panel">
                <div className="dashboard-title">
                    <Activity size={21} />
                    <h2>최근 7일 학습 활동</h2>
                </div>

                <p className="dashboard-description">
                    하루에 제출한 코드 수와 정답 제출 수를 확인하세요.
                </p>

                <div className="dashboard-chart">
                    {activity.map((day) => (
                        <div
                            className="dashboard-day"
                            key={day.date}
                        >
                            <span className="dashboard-count">
                                {day.total}
                            </span>

                            <div className="dashboard-bar-track">
                                <div
                                    className="dashboard-bar-total"
                                    style={{
                                        height: `${day.total / maxDaily * 100}%`,
                                    }}
                                    title={`전체 제출 ${day.total}회`}
                                >
                                    <div
                                        className="dashboard-bar-accepted"
                                        style={{
                                            height: day.total
                                                ? `${day.accepted / day.total * 100}%`
                                                : "0%",
                                        }}
                                    />
                                </div>
                            </div>

                            <span className="dashboard-date">
                                {formatDate(day.date)}
                            </span>

                        </div>
                    ))}
                </div>

                <div className="dashboard-legend">
                    <span>
                        <i className="dashboard-legend-total" />
                        전체 제출
                    </span>
                    <span>
                        <i className="dashboard-legend-accepted" />
                        정답 제출
                    </span>
                </div>
            </section>

            <section className="dashboard-panel">
                <div className="dashboard-title">
                    <Code2 size={21} />
                    <h2>언어별 학습 분석</h2>
                </div>

                <p className="dashboard-description">
                    프로그래밍 언어별 제출 횟수와 정답률입니다.
                </p>

                {languages.length === 0 ? (
                    <div className="dashboard-empty">
                        아직 제출 기록이 없습니다.
                        문제를 풀고 제출하면 분석 결과가 표시됩니다.
                    </div>
                ) : (
                    <div className="dashboard-languages">
                        {languages.map((item) => (
                            <div
                                className="dashboard-language"
                                key={item.language}
                            >
                                <div className="dashboard-language-top">
                                    <strong>{item.language}</strong>
                                    <strong>{item.accuracy}%</strong>
                                </div>

                                <div className="dashboard-progress">
                                    <div
                                        style={{
                                            width: `${item.accuracy}%`,
                                        }}
                                    />
                                </div>

                                <div className="dashboard-language-bottom">
                                    <span>제출 {item.total}회</span>
                                    <span>정답 {item.accepted}회</span>
                                    <span>
                                        해결 {item.solvedProblems}문제
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
