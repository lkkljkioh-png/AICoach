import "../styles/Header.css?v=2";

function Header() {
  return (
    <header className="header">
      <div className="header-container">

        <a href="/" className="header-logo">
          <img
            src="/aicoach-logo.png"
            alt="AICoach 로고"
          />
        </a>

        <nav className="header-nav">
          <a href="/#home">홈</a>
          <a href="/#features">주요 기능</a>
          <a href="/#how-it-works">학습 과정</a>
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
    </header>
  );
}

export default Header;
