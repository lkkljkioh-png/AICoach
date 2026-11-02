import { useState } from "react";
import Header from "../components/Header.jsx";
import "../styles/Home.css";

/* 문구 데이터 */
const FEATURES = [
  {
    title: "코드 분석",
    desc: "정답 여부만 알려주지 않아요. 틀린 줄을 표시하고, 왜 그렇게 동작하는지 풀어서 설명합니다.",
    example: "3번째 줄 반복문이 끝나기 전에 return이 실행돼요.",
  },
  {
    title: "맞춤 문제 추천",
    desc: "자주 틀리는 유형을 기억해 두었다가, 약한 부분을 채우는 문제를 다음에 보여줘요.",
    example: "최근 오답 4개 중 3개가 반복문 조건 → 비슷한 문제 5개 준비됨",
  },
  {
    title: "풀이 기록",
    desc: "제출한 코드와 AI 피드백이 문제별로 남아서, 며칠 뒤에 다시 봐도 어디서 막혔는지 기억나요.",
    example: "이번 주 12문제 제출 · 9문제 해결",
  },
];

const STEPS = [
  { title: "문제를 고르고 풀기", desc: "난이도를 고르면 편집기가 바로 열려요. 설치할 건 없어요." },
  { title: "제출하고 피드백 받기", desc: "테스트 결과와 함께 막힌 줄에 대한 설명이 도착해요." },
  { title: "추천 문제로 이어가기", desc: "방금 놓친 개념을 연습할 다음 문제가 준비돼요." },
];

/* 히어로 코드 편집기 데모: 틀린 코드 ↔ 고친 코드 */
const BUGGY = [
  "def solution(numbers):",
  "    result = 0",
  "    for n in numbers:",
  "        result += n",
  "    return result",
];
const FIXED = [
  "def solution(numbers):",
  "    result = 0",
  "    for n in numbers:",
  "        if n % 2 == 0:",
  "            result += n",
  "    return result",
];

// 키워드와 숫자에만 색을 입히는 작은 하이라이터
function Code({ text }) {
  return text.split(/(\bdef\b|\bfor\b|\bin\b|\bif\b|\breturn\b|\b\d+\b)/g).map((p, i) =>
    /^(def|for|in|if|return)$/.test(p) ? <span key={i} className="tk-key">{p}</span>
      : /^\d+$/.test(p) ? <span key={i} className="tk-num">{p}</span>
        : p
  );
}

function Home() {
  const [fixed, setFixed] = useState(false);
  const lines = fixed ? FIXED : BUGGY;

  return (
    <>
      <Header />

      <main>
        {/* 히어로 */}
        <section id="home" className="home-hero">
          <div className="home-hero-container">
            <div className="home-hero-left">
              <h1>
                틀린 코드에는<br />이유가 있어요.<br />AICoach가 짚어드려요.
              </h1>
              <p>
                문제를 풀고 제출하면, AI가 어느 줄이 왜 틀렸는지 설명하고
                다음에 풀 문제까지 골라줍니다.
              </p>
              <div className="home-buttons">
                <a href="/signup" className="home-start-btn">무료로 시작하기</a>
                <a href="#features" className="home-info-btn">기능 둘러보기</a>
              </div>
            </div>

            <div className="home-editor" aria-label="AI 코드 분석 예시">
              <div className="home-editor-header">
                <strong>solution.py</strong>
                <span>문제: 짝수만 더하기</span>
              </div>

              <pre className="home-editor-code">
                {lines.map((text, i) => (
                  <div key={i} className={`code-line ${!fixed && i === 3 ? "is-flag" : ""}`}>
                    <i>{i + 1}</i>
                    <code><Code text={text} /></code>
                  </div>
                ))}
              </pre>

              <div className={`home-editor-feedback ${fixed ? "ok" : "bad"}`} aria-live="polite">
                <em>{fixed ? "분석 완료" : "4번째 줄 확인 필요"}</em>
                <p>
                  {fixed
                    ? "짝수만 골라 더하고 있어요. 다음 문제에서는 조건식을 한 줄로 쓰는 방법을 연습해 볼까요?"
                    : "모든 수를 더하고 있어요. 문제는 짝수만 더하는 거예요. if n % 2 == 0: 조건을 먼저 걸어 보세요."}
                </p>
              </div>

              <div className="home-editor-footer">
                <span>{fixed ? "테스트 3개 중 3개 통과" : "테스트 3개 중 1개 통과"}</span>
                <button type="button" onClick={() => setFixed(!fixed)}>
                  {fixed ? "처음 상태로" : "조건 추가해서 다시 제출"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 주요 기능 */}
        <section id="features" className="home-section">
          <div className="home-inner">
            <h2>풀고, 고치고, 다음 문제로 넘어가는 데 필요한 것만 담았어요</h2>
            <div className="home-feature-list">
              {FEATURES.map((f) => (
                <article key={f.title} className="home-feature-row">
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                  <div className="home-feature-example">{f.example}</div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 학습 과정 */}
        <section id="how-it-works" className="home-section">
          <div className="home-inner">
            <h2>처음 시작해도 세 단계면 충분해요</h2>
            <ol className="home-steps">
              {STEPS.map((s, i) => (
                <li key={s.title}>
                  <b>{i + 1}</b>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 하단 CTA */}
        <section className="home-inner">
          <div className="home-cta">
            <h2>오늘 첫 문제를 풀어보세요</h2>
            <a href="/signup" className="home-cta-btn">무료로 시작하기</a>
          </div>
        </section>
      </main>

      <footer className="home-footer">© 2026 AICoach · AI 코딩 코치</footer>
    </>
  );
}

export default Home;