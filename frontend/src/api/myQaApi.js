const API_URL = "http://localhost:8080/api/qa/my";

// 내 Q&A 활동 조회
export async function getMyQaActivity(signal) {
    const response = await fetch(`${API_URL}/activity`, {
        method: "GET",
        credentials: "include",
        signal,
        headers: {
            Accept: "application/json",
        },
    });

    if (!response.ok) {
        if (response.status === 401) {
            const error = new Error(
                "로그인이 필요합니다."
            );

            error.status = 401;
            throw error;
        }

        const data = await response.json().catch(() => ({}));

        throw new Error(
            data.detail ||
            data.message ||
            `Q&A 활동 조회 실패 (${response.status})`
        );
    }

    return response.json();
}