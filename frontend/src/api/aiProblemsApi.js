
const API_BASE = "http://localhost:8080/api/admin/problems";

async function request(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    });

    if (!response.ok) {
        let message = `요청 실패 (${response.status})`;

        try {
            const data = await response.json();
            message =
                data.detail ||
                data.message ||
                message;
        } catch {
            // 응답이 JSON이 아닐 수 있음
        }

        throw new Error(message);
    }

    return response.json();
}

// Gemini AI 문제 생성
export function generateAIProblem(level, category) {
    return request("/generate", {
        method: "POST",
        body: JSON.stringify({
            level,
            category,
        }),
    });
}

// Docker 검증 후 MySQL 저장
export function saveAIProblem(problem) {
    return request("/save", {
        method: "POST",
        body: JSON.stringify(problem),
    });
}

// 검증되어 저장된 문제 공개
export function publishAIProblem(problemId) {
    return request(`/${problemId}/publish`, {
        method: "PATCH",
    });
}
