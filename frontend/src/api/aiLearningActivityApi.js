
const API_BASE = "http://localhost:8080/api";

export async function getAILearningActivity() {
    const response = await fetch(
        `${API_BASE}/ai-learning/activity`,
        {
            method: "GET",
            credentials: "include",
        }
    );

    if (!response.ok) {
        throw new Error(
            `AI 학습 활동 조회 실패 (${response.status})`
        );
    }

    const data = await response.json();

    return Array.isArray(data) ? data : [];
}
