
import Header from "../components/Header.jsx";
import "../styles/Home.css";

function Home() {
  return (
    <>
      <Header />

      <main>
        <section className="home-hero">
          <div className="home-hero-container">

            <div className="home-hero-left">
              <span className="home-badge">
                AI CODING LEARNING PLATFORM
              </span>

              <h1>
                코딩 학습의 새로운 방법,
                <br />
                <span>AICoach와 함께.</span>
              </h1>

              <p>
                코딩 문제 풀이부터 AI 코드 분석,
                맞춤형 문제 추천까지.
                <br />
                나의 실력에 맞춘 체계적인
                코딩 학습을 시작해 보세요.
              </p>

              <div className="home-buttons">
                <a href="/signup" className="home-start-btn">
                  무료로 시작하기
                </a>
                <a href="#features" className="home-info-btn">
                  주요 기능 알아보기
                </a>
              </div>
            </div>

            <div className="home-hero-right">
              <div className="home-editor">
                <div className="home-editor-header">
                  <span>● ● ●</span>
                  <p>solution.py</p>
                </div>

                <pre>
                  <code>{`def solution(numbers):
    result = sum(numbers)
    return result

print(solution([1, 2, 3, 4]))`}</code>
                </pre>

                <div className="home-editor-result">
                  <strong>✓ AI 분석 완료</strong>
                  <p>
                    모든 테스트를 통과했습니다!
                    효율적인 코드입니다.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        <section id="features" className="home-features">
          <div className="home-section-title">
            <span>OUR FEATURES</span>
            <h2>AICoach가 제공하는 학습 기능</h2>
            <p>AI와 함께 더 효율적인 코딩 학습을 경험하세요.</p>
          </div>

          <div className="home-feature-grid">
            <article className="home-feature-card">
              <div className="home-feature-icon">{"</>"}</div>
              <h3>코딩 문제 풀이</h3>
              <p>다양한 난이도의 코딩 문제에 도전하세요.</p>
            </article>

            <article className="home-feature-card">
              <div className="home-feature-icon">AI</div>
              <h3>AI 코드 피드백</h3>
              <p>작성한 코드의 문제점과 개선 방향을 분석합니다.</p>
            </article>

            <article className="home-feature-card">
              <div className="home-feature-icon">↗</div>
              <h3>맞춤형 문제 추천</h3>
              <p>학습 기록을 기반으로 적합한 문제를 추천합니다.</p>
            </article>
          </div>
        </section>
      </main>
    </>
  );
}

export default Home;
