
import "../styles/Header.css";

function Header() {
  return (
    <header className="header">
      <div className="header-container">

        {/* 원본 AICoach 로고 */}
        <a href="/" className="header-logo">
          <img
            src="/aicoach-logo.png"
            alt="AICoach 로고"
          />
        </a>

        {/* 왼쪽 내비게이션 메뉴 */}
        <nav className="header-nav" aria-label="주요 메뉴">
          <a href="#home">홈</a>
          <a href="#features">주요 기능</a>
          <a href="#how-it-works">학습 과정</a>
        </nav>

        {/* 오른쪽 회원 메뉴 */}
        <div className="header-actions">
          <a href="/login" className="login-link">
            로그인
          </a>

          <a href="/signup" className="signup-link">
            회원가입
          </a>
        </div>

      </div>
    </header>
  );
}

export default Header;
