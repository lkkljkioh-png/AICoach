const API_URL = "http://localhost:8080/api/qa";

async function request(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error("로그인이 필요합니다.");
        }

        const data = await response.json().catch(() => ({}));

        throw new Error(
            data.detail ||
            data.message ||
            `요청 실패 (${response.status})`
        );
    }

    return response.json();
}

// 질문 목록 조회
export function getQuestions() {
    return request("/questions");
}

// 질문 상세 조회
export function getQuestion(id) {
    return request(`/questions/${id}`);
}

// 질문 작성
export function createQuestion(data) {
    return request("/questions", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

// 질문 수정
export function updateQuestion(id, data) {
    return request(`/questions/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

// 질문 삭제
export function deleteQuestion(id) {
    return request(`/questions/${id}`, {
        method: "DELETE",
    });
}

// 답변 목록 조회
export function getAnswers(questionId) {
    return request(`/questions/${questionId}/answers`);
}

// 답변 등록
export function createAnswer(questionId, content) {
    return request(`/questions/${questionId}/answers`, {
        method: "POST",
        body: JSON.stringify({ content }),
    });
}

// 답변 수정
export function updateAnswer(questionId, answerId, content) {
    return request(
        `/questions/${questionId}/answers/${answerId}`,
        {
            method: "PUT",
            body: JSON.stringify({ content }),
        }
    );
}

// 답변 삭제
export function deleteAnswer(questionId, answerId) {
    return request(
        `/questions/${questionId}/answers/${answerId}`,
        {
            method: "DELETE",
        }
    );
}

// 답변 채택 및 취소
export function acceptAnswer(questionId, answerId) {
    return request(
        `/questions/${questionId}/answers/${answerId}/accept`,
        {
            method: "PATCH",
        }
    );
}