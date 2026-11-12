import { useEffect, useState } from "react";
import { LogOut, UserRound } from "lucide-react";

import { getCurrentUser, logout } from "../api/authApi.js";

import "../styles/Header.css";

function Header() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;

    getCurrentUser()
      .then((data) => {
        if (active) {
          setUser(data);
        }
      })
      .catch((error) => {
        console.error("로그인 상태 확인 실패:", error);
      })
      .finally(() => {
        if (active) {
          setChecking(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await logout();
      window.location.href = "/";
    } catch (error) {
      alert(error.message || "로그아웃에 실패했습니다.");
      setLoggingOut(false);
    }
  };

  return (
    <header className="header">
      <div className="header-container">

        <div className="header-left">
          <a href="/" className="header-logo">
            <img
              src="/aicoach-logo.png"
              alt="AICoach 로고"
            />
          </a>

          <nav className="header-nav-left">
            <a href="/#features">주요 기능</a>
            <a href="/#how-it-works">학습 과정</a>
          </nav>
        </div>

        <div className="header-right">
          <nav className="header-nav-right">
            <a href="/problems">문제 풀이</a>
            <a href="/learning">AI 맞춤 학습</a>
            <a href="/qna">Q&A</a>
            <a href="/mypage">MY</a>
          </nav>

          <div className="header-actions">
            {!checking && (
              user ? (
                <>
                  <span
                    className="header-user"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "7px",
                      color: "#172c56",
                      fontSize: "13px",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <UserRound size={17} />
                    {user.nickname}
                  </span>

                  <button
                    type="button"
                    className="login-link"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "7px",
                      padding: 0,
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                    }}
                  >
                    <LogOut size={16} />
                    {loggingOut
                      ? "로그아웃 중..."
                      : "로그아웃"}
                  </button>
                </>
              ) : (
                <>
                  <a
                    href="/login"
                    className="login-link"
                  >
                    로그인
                  </a>

                  <a
                    href="/signup"
                    className="signup-link"
                  >
                    회원가입
                  </a>
                </>
              )
            )}
          </div>
        </div>

      </div>
    </header>
  );
}

export default Header;