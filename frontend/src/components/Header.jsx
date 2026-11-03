
import "../styles/Header.css";

function Header() {
  return (
    <header className="header">
      <div className="header-container">

        {/* 왼쪽: 로고 + 소개 메뉴 */}
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

        {/* 오른쪽: 서비스 메뉴 + 계정 */}
        <div className="header-right">
          <nav className="header-nav-right">
            <a href="/problems">문제 풀이</a>
            <a href="/learning">AI 맞춤 학습</a>
            <a href="/qna">Q&A</a>
            <a href="/mypage">MY</a>
          </nav>

          <div className="header-actions">
            <a href="/login" className="login-link">
              로그인
            </a>
            <a href="/signup" className="signup-link">
              회원가입
            </a>
          </div>
        </div>

      </div>
    </header>
  );
}

export default Header;
