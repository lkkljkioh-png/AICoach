import { useState } from "react";
import {
    ArrowRight,
    Eye,
    EyeOff,
    LockKeyhole,
    Mail,
    UserRound,
    AlertCircle,
    LoaderCircle,
} from "lucide-react";

import Header from "../components/Header.jsx";
import { login, signup } from "../api/authApi.js";

import "../styles/Auth.css";

function AuthPage({ mode = "login" }) {
    const isSignup = mode === "signup";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [nickname, setNickname] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (loading) return;

        setError("");

        if (!email.trim()) {
            setError("이메일을 입력해 주세요.");
            return;
        }

        if (password.length < 8) {
            setError("비밀번호는 8자 이상 입력해 주세요.");
            return;
        }

        if (isSignup) {
            if (nickname.trim().length < 2) {
                setError("닉네임은 2자 이상 입력해 주세요.");
                return;
            }

            if (password !== confirmPassword) {
                setError("비밀번호가 일치하지 않습니다.");
                return;
            }
        }

        setLoading(true);

        try {
            if (isSignup) {
                await signup(
                    email.trim(),
                    password,
                    nickname.trim()
                );

                alert("회원가입이 완료되었습니다. 로그인해 주세요.");

                window.location.href = "/login";
            } else {
                await login(email.trim(), password);

                window.location.href = "/";
            }
        } catch (err) {
            if (err.message.includes("409")) {
                setError("이미 가입된 이메일입니다.");
            } else if (err.message.includes("401")) {
                setError("이메일 또는 비밀번호가 올바르지 않습니다.");
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Header />

            <main className="auth-page">
                <div className="auth-container">
                    <div className="auth-intro">
                        <span className="auth-eyebrow">
                            AI CODING COACH
                        </span>

                        <h1>
                            {isSignup
                                ? "AICoach와 함께 시작하세요"
                                : "다시 만나서 반가워요"}
                        </h1>

                        <p>
                            {isSignup
                                ? "계정을 만들고 나만의 코딩 학습을 시작해 보세요."
                                : "로그인하고 코딩 학습을 이어가세요."}
                        </p>
                    </div>

                    <div className="auth-card">
                        <div className="auth-card-heading">
                            <h2>{isSignup ? "회원가입" : "로그인"}</h2>

                            <p>
                                {isSignup
                                    ? "아래 정보를 입력해 계정을 생성하세요."
                                    : "계정 정보를 입력해 주세요."}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {isSignup && (
                                <div className="auth-field">
                                    <label htmlFor="nickname">닉네임</label>

                                    <div className="auth-input-wrapper">
                                        <UserRound size={18} />

                                        <input
                                            id="nickname"
                                            type="text"
                                            placeholder="2~30자"
                                            value={nickname}
                                            onChange={(e) =>
                                                setNickname(e.target.value)
                                            }
                                            minLength={2}
                                            maxLength={30}
                                            autoComplete="nickname"
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="auth-field">
                                <label htmlFor="email">이메일</label>

                                <div className="auth-input-wrapper">
                                    <Mail size={18} />

                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="example@email.com"
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                        autoComplete="email"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="auth-field">
                                <label htmlFor="password">비밀번호</label>

                                <div className="auth-input-wrapper">
                                    <LockKeyhole size={18} />

                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="8자 이상"
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        minLength={8}
                                        maxLength={72}
                                        autoComplete={
                                            isSignup
                                                ? "new-password"
                                                : "current-password"
                                        }
                                        required
                                    />

                                    <button
                                        type="button"
                                        className="auth-password-toggle"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        aria-label={
                                            showPassword
                                                ? "비밀번호 숨기기"
                                                : "비밀번호 보기"
                                        }
                                    >
                                        {showPassword ? (
                                            <EyeOff size={18} />
                                        ) : (
                                            <Eye size={18} />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {isSignup && (
                                <div className="auth-field">
                                    <label htmlFor="confirmPassword">
                                        비밀번호 확인
                                    </label>

                                    <div className="auth-input-wrapper">
                                        <LockKeyhole size={18} />

                                        <input
                                            id="confirmPassword"
                                            type="password"
                                            placeholder="비밀번호를 다시 입력하세요"
                                            value={confirmPassword}
                                            onChange={(e) =>
                                                setConfirmPassword(
                                                    e.target.value
                                                )
                                            }
                                            autoComplete="new-password"
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div
                                    className="auth-error"
                                    role="alert"
                                >
                                    <AlertCircle size={17} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="auth-submit"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <LoaderCircle
                                            size={18}
                                            className="auth-spinner"
                                        />
                                        처리 중...
                                    </>
                                ) : (
                                    <>
                                        {isSignup ? "가입하기" : "로그인"}
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="auth-bottom">
                            <span>
                                {isSignup
                                    ? "이미 계정이 있으신가요?"
                                    : "아직 계정이 없으신가요?"}
                            </span>

                            <a href={isSignup ? "/login" : "/signup"}>
                                {isSignup ? "로그인" : "회원가입"}
                            </a>
                        </div>
                    </div>

                    <p className="auth-footer-text">
                        AICoach · Learn, Code, Improve
                    </p>
                </div>
            </main>
        </>
    );
}

export default AuthPage;