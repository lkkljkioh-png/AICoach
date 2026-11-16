
const API_BASE = "http://localhost:8080/api";

// 기존 맞춤 문제 추천
export async function getLearningRecommendations() {
    const response = await fetch(
        `${API_BASE}/learning/recommendations`,
        {
            method: "GET",
            credentials: "include",
        }
    );

    if (!response.ok) {
        const error = new Error(
            `추천 데이터를 불러오지 못했습니다. (${response.status})`
        );
        error.status = response.status;
        throw error;
    }

    return response.json();
}

// 학습 대시보드
export async function getLearningDashboard() {
    const response = await fetch(
        `${API_BASE}/learning/dashboard`,
        {
            method: "GET",
            credentials: "include",
        }
    );

    if (!response.ok) {
        const error = new Error(
            `학습 대시보드 조회 실패 (${response.status})`
        );
        error.status = response.status;
        throw error;
    }

    return response.json();
}

// Gemini AI 맞춤 학습 코칭
export async function getAICoaching() {
    const response = await fetch(
        `${API_BASE}/learning/ai-coach`,
        {
            method: "POST",
            credentials: "include",
        }
    );

    if (!response.ok) {
        let message = `AI 코칭 요청 실패 (${response.status})`;

        try {
            const data = await response.json();
            message = data.detail || data.message || message;
        } catch {
            // 오류 응답이 JSON이 아닌 경우
        }

        throw new Error(message);
    }

    return response.json();
}


export async function getSavedAICoaching() {
    const response = await fetch(
        "http://localhost:8080/api/learning/ai-coach/latest",
        {
            method: "GET",
            credentials: "include",
        }
    );

    if (response.status === 204) {
        return null;
    }

    if (!response.ok) {
        throw new Error(
            `저장된 학습 계획 조회 실패 (${response.status})`
        );
    }

    return response.json();
}

