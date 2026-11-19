
const API_BASE = "http://localhost:8080/api";

export async function generatePersonalizedProblem() {
    const response = await fetch(
        `${API_BASE}/learning/personalized-problems/generate`,
        {
            method: "POST",
            credentials: "include",
        }
    );

    if (!response.ok) {
        let message = `맞춤 문제 생성 실패 (${response.status})`;

        try {
            const data = await response.json();

            message =
                data.detail ||
                data.message ||
                message;
        } catch {
            // JSON 이외의 오류 응답 처리
        }

        const error = new Error(message);
        error.status = response.status;

        throw error;
    }

    return response.json();
}


export async function savePersonalizedProblem(problem) {
    const response = await fetch(
        `${API_BASE}/learning/personalized-problems/save`,
        {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(problem),
        }
    );

    if (!response.ok) {
        let message = `개인 문제 저장 실패 (${response.status})`;

        try {
            const data = await response.json();

            message =
                data.detail ||
                data.message ||
                message;
        } catch {
            // JSON 이외의 오류 응답 처리
        }

        throw new Error(message);
    }

    return response.json();
}

export async function getMyPersonalizedProblems() {
    const response = await fetch(
        `${API_BASE}/learning/personalized-problems/me`,
        {
            credentials: "include",
        }
    );

    if (!response.ok) {
        throw new Error(
            `개인 문제 조회 실패 (${response.status})`
        );
    }

    return response.json();
}

