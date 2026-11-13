
const API_BASE_URL = "http://localhost:8080/api";

export async function getMySubmissions() {
    const response = await fetch(
        `${API_BASE_URL}/submissions/me`,
        {
            credentials: "include",
        }
    );

    if (response.status === 401) {
        const error = new Error("로그인이 필요합니다.");
        error.status = 401;
        throw error;
    }

    if (!response.ok) {
        throw new Error(
            `제출 기록을 불러오지 못했습니다. (${response.status})`
        );
    }

    const data = await response.json();

    return Array.isArray(data) ? data : [];
}
