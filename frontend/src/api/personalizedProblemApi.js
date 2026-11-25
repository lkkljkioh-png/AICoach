
const API_BASE = "http://localhost:8080/api";

async function readResponse(response, fallbackMessage) {
    if (!response.ok) {
        let message = `${fallbackMessage} (${response.status})`;

        try {
            const data = await response.json();
            message = data.detail || data.message || message;
        } catch {
            // JSON이 아닌 오류 응답 처리
        }

        const error = new Error(message);
        error.status = response.status;
        throw error;
    }

    return response.json();
}

// 자동 추천 또는 직접 설정 문제 생성
export async function generatePersonalizedProblem(
    options = { mode: "AUTO" }
) {
    const response = await fetch(
        `${API_BASE}/learning/personalized-problems/generate`,
        {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(options),
        }
    );

    return readResponse(response, "맞춤 문제 생성 실패");
}

// Docker 검증 및 개인 문제 저장
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

    return readResponse(response, "개인 문제 저장 실패");
}

// 내가 저장한 개인 문제 조회
export async function getMyPersonalizedProblems() {
    const response = await fetch(
        `${API_BASE}/learning/personalized-problems/me`,
        {
            credentials: "include",
        }
    );

    return readResponse(response, "개인 문제 조회 실패");
}


// 본인의 개인 문제 삭제
export async function deleteMyPersonalizedProblem(problemId) {
    const response = await fetch(
        `http://localhost:8080/api/learning/personalized-problems/${problemId}`,
        {
            method: "DELETE",
            credentials: "include",
        }
    );

    if (!response.ok) {
        let message = `문제 삭제 실패 (${response.status})`;

        try {
            const data = await response.json();

            message =
                data.detail ||
                data.message ||
                data.reason ||
                message;
        } catch {
            // JSON이 아닌 응답 처리
        }

        const error = new Error(message);
        error.status = response.status;
        throw error;
    }

    return true;
}


// 개인 문제 보관
export async function archivePersonalizedProblem(problemId) {
    const response = await fetch(
        `http://localhost:8080/api/learning/personalized-problems/${problemId}/archive`,
        {
            method: "PATCH",
            credentials: "include",
        }
    );

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
            data.detail ||
            data.message ||
            `문제 보관 실패 (${response.status})`
        );
    }

    return true;
}

// 보관된 개인 문제 복원
export async function restorePersonalizedProblem(problemId) {
    const response = await fetch(
        `http://localhost:8080/api/learning/personalized-problems/${problemId}/restore`,
        {
            method: "PATCH",
            credentials: "include",
        }
    );

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
            data.detail ||
            data.message ||
            `문제 복원 실패 (${response.status})`
        );
    }

    return true;
}

// 개인 문제 저장 한도 조회
export async function getPersonalizedProblemQuota() {
    const response = await fetch(
        `${API_BASE}/learning/personalized-problems/quota`,
        {
            credentials: "include",
        }
    );

    return readResponse(response, "저장 한도 조회 실패");
}

