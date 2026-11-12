const API_URL = "http://localhost:8080/api/auth";

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
        let message = `요청 실패 (${response.status})`;

        try {
            const data = await response.json();
            message = data.detail || data.message || message;
        } catch {
            // JSON이 아닌 오류 응답
        }

        throw new Error(message);
    }

    return response.json();
}

// 회원가입
export function signup(email, password, nickname) {
    return request("/signup", {
        method: "POST",
        body: JSON.stringify({ email, password, nickname }),
    });
}

// 로그인
export function login(email, password) {
    return request("/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });
}

// 현재 로그인한 사용자 조회
export async function getCurrentUser() {
    const response = await fetch(`${API_URL}/me`, {
        credentials: "include",
    });

    if (response.status === 401) {
        return null;
    }

    if (!response.ok) {
        throw new Error(`로그인 상태 확인 실패 (${response.status})`);
    }

    return response.json();
}

// 로그아웃
export function logout() {
    return request("/logout", {
        method: "POST",
    });
}