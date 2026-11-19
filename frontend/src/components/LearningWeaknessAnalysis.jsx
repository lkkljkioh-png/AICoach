
import { useMemo } from "react";
import {
    BrainCircuit,
    AlertTriangle,
    CheckCircle2,
    Code2,
    BarChart3,
    Lightbulb,
} from "lucide-react";

import "../styles/LearningWeaknessAnalysis.css";

const ERROR_LABELS = {
    WRONG_ANSWER: "오답",
    RUNTIME_ERROR: "실행 오류",
    COMPILE_ERROR: "컴파일 오류",
    TIME_LIMIT: "시간 초과",
    TIME_LIMIT_EXCEEDED: "시간 초과",
    OUTPUT_LIMIT: "출력 초과",
};

function getDifficulty(value) {
    const key = String(value ?? "").trim().toUpperCase();

    if (["EASY", "BEGINNER", "LOW", "1", "쉬움", "초급"].includes(key)) {
        return "쉬움";
    }

    if (["MEDIUM", "NORMAL", "INTERMEDIATE", "2", "보통", "중급"].includes(key)) {
        return "보통";
    }

    if (["HARD", "ADVANCED", "HIGH", "3", "어려움", "고급"].includes(key)) {
        return "어려움";
    }

    return "미분류";
}

function calculateGroups(items, getKey) {
    const groups = new Map();

    items.forEach((item) => {
        const key = getKey(item);
        const current = groups.get(key) || {
            name: key,
            total: 0,
            accepted: 0,
            solvedIds: new Set(),
        };

        current.total += 1;

        if (item.status === "ACCEPTED") {
            current.accepted += 1;

            if (item.problemId != null) {
                current.solvedIds.add(String(item.problemId));
            }
        }

        groups.set(key, current);
    });

    return [...groups.values()].map((group) => ({
        name: group.name,
        total: group.total,
        accepted: group.accepted,
        solved: group.solvedIds.size,
        rate: Math.round(
            (group.accepted / group.total) * 100
        ),
    }));
}

function getLevel(group) {
    if (group.total < 5) {
        return {
            label: "데이터 부족",
            type: "neutral",
        };
    }

    if (group.rate < 50) {
        return {
            label: "집중 학습 필요",
            type: "danger",
        };
    }

    if (group.rate < 75) {
        return {
            label: "보완 권장",
            type: "warning",
        };
    }

    return {
        label: "양호",
        type: "success",
    };
}

export default function LearningWeaknessAnalysis({
    submissions = [],
    problems = [],
}) {
    const analysis = useMemo(() => {
        const problemMap = new Map(
            problems.map((problem) => [
                String(problem.id),
                problem,
            ])
        );

        const records = submissions.map((item) => {
            const problem = problemMap.get(
                String(item.problemId)
            );

            return {
                ...item,

                difficulty: getDifficulty(
                    problem?.level ?? problem?.difficulty
                ),

            };
        });

        const languages = calculateGroups(
            records,
            (item) => item.language || "기타"
        ).sort((a, b) => b.total - a.total);

        const difficulties = calculateGroups(
            records,
            (item) => item.difficulty
        ).sort((a, b) => {
            const order = ["쉬움", "보통", "어려움", "미분류"];
            return order.indexOf(a.name) - order.indexOf(b.name);
        });

        const errorCounts = new Map();

        records.forEach((item) => {
            if (item.status === "ACCEPTED") return;

            const name =
                ERROR_LABELS[item.status] ||
                "기타 오류";

            errorCounts.set(
                name,
                (errorCounts.get(name) || 0) + 1
            );
        });

        const errors = [...errorCounts.entries()]
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        const weaknesses = [
            ...languages.map((item) => ({
                ...item,
                category: "언어",
            })),
            ...difficulties
                .filter((item) => item.name !== "미분류")
                .map((item) => ({
                    ...item,
                    category: "난이도",
                })),
        ]
            .filter((item) => item.total >= 5 && item.rate < 75)
            .sort((a, b) =>
                a.rate - b.rate || b.total - a.total
            );

        return {
            languages,
            difficulties,
            errors,
            weaknesses,
            total: records.length,
        };
    }, [submissions, problems]);

    if (analysis.total === 0) {
        return (
            <section className="weakness-analysis">
                <h2>
                    <BrainCircuit size={23} />
                    학습 취약점 분석
                </h2>
                <p className="weakness-empty">
                    아직 제출 기록이 없습니다.
                    문제를 풀고 제출하면 분석 결과가 표시됩니다.
                </p>
            </section>
        );
    }

    const topWeakness = analysis.weaknesses[0];

    const feedback = topWeakness
        ? `${topWeakness.category} '${topWeakness.name}'의 제출 정답률이 ${topWeakness.rate}%입니다. 해당 영역의 기본 문제부터 다시 연습해 보세요.`
        : analysis.total < 5
            ? "아직 학습 기록이 적습니다. 제출 기록을 더 쌓으면 취약점을 분석할 수 있습니다."
            : "현재 기준으로 뚜렷한 취약 영역은 발견되지 않았습니다. 새로운 유형이나 더 높은 난이도에 도전해 보세요.";

    return (
        <section className="weakness-analysis">
            <div className="weakness-heading">
                <div>
                    <span className="weakness-eyebrow">
                        LEARNING DIAGNOSIS
                    </span>
                    <h2>
                        <BrainCircuit size={24} />
                        학습 취약점 분석
                    </h2>
                    <p>
                        누적 제출 기록을 바탕으로
                        부족한 학습 영역을 확인합니다.
                    </p>
                </div>
            </div>

            <div className="weakness-summary">
                <div className="weakness-summary-icon">
                    <Lightbulb size={23} />
                </div>
                <div>
                    <strong>맞춤 학습 진단</strong>
                    <p>{feedback}</p>
                </div>
            </div>

            <div className="weakness-grid">
                <div className="weakness-panel">
                    <h3>
                        <Code2 size={19} />
                        언어별 학습 성과
                    </h3>

                    {analysis.languages.map((item) => (
                        <AnalysisRow
                            key={item.name}
                            item={item}
                        />
                    ))}
                </div>

                <div className="weakness-panel">
                    <h3>
                        <BarChart3 size={19} />
                        난이도별 학습 성과
                    </h3>

                    {analysis.difficulties.map((item) => (
                        <AnalysisRow
                            key={item.name}
                            item={item}
                        />
                    ))}
                </div>
            </div>

            <div className="weakness-grid">
                <div className="weakness-panel">
                    <h3>
                        <AlertTriangle size={19} />
                        자주 발생한 오류
                    </h3>

                    {analysis.errors.length === 0 ? (
                        <p className="weakness-empty">
                            오류 제출 기록이 없습니다.
                        </p>
                    ) : (
                        analysis.errors.map((item) => (
                            <div
                                className="weakness-error-row"
                                key={item.name}
                            >
                                <span>{item.name}</span>
                                <strong>{item.count}회</strong>
                            </div>
                        ))
                    )}
                </div>

                <div className="weakness-panel">
                    <h3>
                        <CheckCircle2 size={19} />
                        우선 보완 영역
                    </h3>

                    {analysis.weaknesses.length === 0 ? (
                        <p className="weakness-empty">
                            충분한 기록이 있는 영역에서
                            정답률 75% 미만인 항목이 없습니다.
                        </p>
                    ) : (
                        analysis.weaknesses.slice(0, 3).map(
                            (item, index) => (
                                <div
                                    className="weakness-priority"
                                    key={`${item.category}-${item.name}`}
                                >
                                    <span className="weakness-rank">
                                        {index + 1}
                                    </span>
                                    <div>
                                        <strong>{item.name}</strong>
                                        <small>
                                            {item.category} · 정답률 {item.rate}%
                                        </small>
                                    </div>
                                </div>
                            )
                        )
                    )}
                </div>
            </div>


            <div className="weakness-recommend-action">
                <div>
                    <strong>취약 영역 집중 학습</strong>
                    <p>
                        분석 결과를 바탕으로 나에게 필요한
                        코딩 문제를 추천받아 보세요.
                    </p>
                </div>

                <a
                    href="/learning"
                    className="weakness-recommend-button"
                >
                    맞춤 문제 추천받기
                </a>
            </div>

            <p className="weakness-note">
                정답률은 정답 제출 횟수 / 전체 제출 횟수로
                계산합니다. 같은 문제의 반복 제출도 포함됩니다.
                취약점 판정에는 영역별 최소 5회 제출이 필요하며,
                데이터 기반 추정이므로 실제 실력을 확정하지 않습니다.
            </p>
        </section>
    );
}

function AnalysisRow({ item }) {
    const level = getLevel(item);

    return (
        <div className="weakness-analysis-row">
            <div className="weakness-row-top">
                <strong>{item.name}</strong>
                <span className={`weakness-level ${level.type}`}>
                    {level.label}
                </span>
            </div>

            <div className="weakness-row-meta">
                <span>
                    제출 {item.total}회 · 정답 {item.accepted}회
                </span>
                <strong>{item.rate}%</strong>
            </div>

            <div className="weakness-progress">
                <div
                    style={{ width: `${item.rate}%` }}
                />
            </div>
        </div>
    );
}
