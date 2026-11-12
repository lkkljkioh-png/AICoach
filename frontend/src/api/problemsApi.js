
const API_BASE_URL = "http://localhost:8080/api";

async function request(url, options = {}) {
    const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        credentials: "include",
    });

    if (!response.ok) {
        let message = `API 요청 실패 (${response.status})`;

        try {
            const data = await response.json();
            message = data.detail || data.message || message;
        } catch {
            // JSON 오류 응답이 아닌 경우
        }

        throw new Error(message);
    }

    return response.json();
}

export function getProblems() {
    return request("/problems");
}

export function getProblemById(id) {
    return request(`/problems/${id}`);
}

function postCode(id, action, language, code) {
    return request(`/problems/${id}/${action}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ language, code }),
    });
}

export function runProblem(id, language, code) {
    return postCode(id, "run", language, code);
}

export function submitProblem(id, language, code) {
    return postCode(id, "submit", language, code);
}
