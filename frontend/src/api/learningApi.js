
const API_BASE = "http://localhost:8080/api";

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
