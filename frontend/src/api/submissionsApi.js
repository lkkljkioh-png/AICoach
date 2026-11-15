
const API_BASE_URL = "http://localhost:8080/api";

async function request(url) {
    const response = await fetch(url, {
        credentials: "include",
    });

    if (response.status === 401) {
        const error = new Error("로그인이 필요합니다.");
        error.status = 401;
        throw error;
    }

    if (!response.ok) {
        throw new Error(
            `제출 기록 조회 실패 (${response.status})`
        );
    }

    return response.json();
}

export async function getMySubmissions() {
    const data = await request(
        `${API_BASE_URL}/submissions/me`
    );

    return Array.isArray(data) ? data : [];
}

export function getSubmissionById(id) {
    return request(
        `${API_BASE_URL}/submissions/${id}`
    );
}
