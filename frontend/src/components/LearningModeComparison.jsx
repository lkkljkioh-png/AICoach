
import { useMemo } from "react";
import {
    Code2,
    Sparkles,
    CheckCircle2,
    BookOpen,
    Target,
} from "lucide-react";

import "../styles/LearningModeComparison.css";

// 모드별 통계 계산
function calculateStats(submissions) {
    const accepted = submissions.filter(
        (item) => item.status === "ACCEPTED"
    );

    const solved = new Set(
        accepted.map((item) => item.problemId)
    ).size;

    return {
        total: submissions.length,
        accepted: accepted.length,
        solved,
        rate: submissions.length
            ? Math.round(
                (accepted.length / submissions.length) * 100
            )
            : null,
    };
}

export default function LearningModeComparison({
    submissions = [],
}) {
    const data = useMemo(() => {
        const direct = submissions.filter(
            (item) => item.learningMode === "DIRECT"
        );

        const ai = submissions.filter(
            (item) => item.learningMode === "AI"
        );

        const unknown = submissions.filter(
            (item) =>
                item.learningMode !== "DIRECT" &&
                item.learningMode !== "AI"
        );

        return {
            direct: calculateStats(direct),
            ai: calculateStats(ai),
            unknown: unknown.length,
        };
    }, [submissions]);

    const modes = [
        {
            key: "direct",
            title: "직접 코딩 학습",
            description: "스스로 작성한 코드의 제출 성과",
            icon: Code2,
            stats: data.direct,
        },
        {
            key: "ai",
            title: "AI 활용 코딩 학습",
            description: "AI를 활용한 코드의 제출 성과",
            icon: Sparkles,
            stats: data.ai,
        },
    ];

    return (
        <section className="mode-comparison">
            <div className="mode-comparison-heading">
                <h2>학습 모드별 성과 비교</h2>
                <p>
                    직접 코딩과 AI 활용 코딩의 채점 결과를
                    각각 확인할 수 있습니다.
                </p>
            </div>

            <div className="mode-comparison-grid">
                {modes.map((mode) => {
                    const Icon = mode.icon;
                    const stats = mode.stats;

                    return (
                        <article
                            className={`mode-comparison-card ${mode.key}`}
                            key={mode.key}
                        >
                            <div className="mode-comparison-card-header">
                                <div className="mode-comparison-icon">
                                    <Icon size={21} />
                                </div>

                                <div>
                                    <h3>{mode.title}</h3>
                                    <p>{mode.description}</p>
                                </div>
                            </div>

                            <div className="mode-comparison-primary">
                                <span>제출 횟수</span>
                                <strong>{stats.total}회</strong>
                            </div>

                            <div className="mode-comparison-details">
                                <div>
                                    <CheckCircle2 size={16} />
                                    <span>정답 제출</span>
                                    <strong>{stats.accepted}회</strong>
                                </div>

                                <div>
                                    <BookOpen size={16} />
                                    <span>해결한 문제</span>
                                    <strong>{stats.solved}개</strong>
                                </div>

                                <div>
                                    <Target size={16} />
                                    <span>제출 정답률</span>
                                    <strong>
                                        {stats.rate === null
                                            ? "기록 없음"
                                            : `${stats.rate}%`}
                                    </strong>
                                </div>
                            </div>

                            <div className="mode-comparison-progress">
                                <div
                                    style={{
                                        width: `${stats.rate ?? 0}%`,
                                    }}
                                />
                            </div>
                        </article>
                    );
                })}
            </div>

            <p className="mode-comparison-note">
                정답률은 해당 모드의 정답 제출 수를 전체
                제출 수로 나눈 값입니다. 해결한 문제는
                모드별로 중복을 제외합니다.
                {data.unknown > 0 &&
                    ` 이전 제출 기록 중 모드를 알 수 없는 ${data.unknown}건은 비교에서 제외했습니다.`}
            </p>
        </section>
    );
}
