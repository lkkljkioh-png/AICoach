
const API_BASE = "http://localhost:8080/api";

async function handleResponse(response) {
    if (!response.ok) {
        if (response.status === 401) {
            throw new Error(
                "AI 학습 기록을 저장하려면 로그인해야 합니다."
            );
        }

        throw new Error(
            `AI 학습 기록 저장 실패 (${response.status})`
        );
    }

    return response.json();
}

// AI 제안 코드 선택 시 원본 저장
export async function createAILearningSession({
    problemId,
    language,
    instruction,
    action,
    originalCode,
}) {
    const response = await fetch(
        `${API_BASE}/ai-learning/sessions`,
        {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                problemId,
                language,
                instruction,
                action,
                originalCode,
            }),
        }
    );

    return handleResponse(response);
}

// 사용자가 수정한 코드 저장
export async function saveAIRevisedCode(
    sessionId,
    revisedCode
) {
    const response = await fetch(
        `${API_BASE}/ai-learning/sessions/${sessionId}`,
        {
            method: "PUT",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                revisedCode,
            }),
        }
    );

    return handleResponse(response);
}
