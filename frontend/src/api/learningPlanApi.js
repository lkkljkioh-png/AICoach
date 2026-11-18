
const API_BASE = "http://localhost:8080/api/learning/plans";

async function request(path = "", options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    });

    if (!response.ok) {
        let message = `학습 계획 요청 실패 (${response.status})`;

        try {
            const data = await response.json();
            message = data.detail || data.message || message;
        } catch {
            // JSON 오류 응답이 없는 경우
        }

        throw new Error(message);
    }

    if (response.status === 204) return null;

    return response.json();
}

export function getLearningPlans() {
    return request();
}

export function saveLearningPlan(data) {
    return request("", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export function deleteLearningPlan(date) {
    return request(`/${encodeURIComponent(date)}`, {
        method: "DELETE",
    });
}
