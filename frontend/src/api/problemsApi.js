
const API_BASE_URL = "http://localhost:8080/api";

async function request(url) {
    const response = await fetch(`${API_BASE_URL}${url}`);

    if (!response.ok) {
        throw new Error(`API 요청 실패 (${response.status})`);
    }

    return response.json();
}

// 전체 문제 조회
export function getProblems() {
    return request("/problems");
}

// 특정 문제 상세 조회
export function getProblemById(id) {
    return request(`/problems/${id}`);
}
