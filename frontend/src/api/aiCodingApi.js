
const API_BASE = "http://localhost:8080/api";

export async function requestAICode({
    problemId,
    language,
    instruction,
    currentCode = "",
    judgeOutput = "",
    action = "generate",
}) {
    const response = await fetch(
        `${API_BASE}/problems/${problemId}/ai-code`,
        {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                language,
                instruction,
                currentCode,
                judgeOutput,
                action,
            }),
        }
    );

    if (!response.ok) {
        throw new Error(
            `AI 코드 요청 실패 (${response.status})`
        );
    }

    return response.json();
}
