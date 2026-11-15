
const API_BASE = "http://localhost:8080/api/drafts";

export async function getDrafts(problemId) {
    const response = await fetch(
        `${API_BASE}/${problemId}`,
        { credentials: "include" }
    );

    if (!response.ok) {
        throw new Error(`코드 불러오기 실패 (${response.status})`);
    }

    return response.json();
}

export async function saveDrafts(problemId, codes) {
    const response = await fetch(
        `${API_BASE}/${problemId}`,
        {
            method: "PUT",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(codes),
        }
    );

    if (!response.ok) {
        throw new Error(`코드 저장 실패 (${response.status})`);
    }

    return response.json();
}
