
import { useState } from "react";
import Header from "../components/Header.jsx";
import "../styles/Home.css";

function FeatureIcon({ type }) {
  const common = {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  if (type === "analysis") {
    return (
      <svg {...common}>
        <path d="M8 8 4 12l4 4" />
        <path d="m16 8 4 4-4 4" />
        <path d="m14 5-4 14" />
      </svg>
    );
  }

  if (type === "recommend") {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="18" height="18" rx="4" />
        <path d="m7 15 4-4 3 3 4-5" />
        <path d="M15 9h3v3" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M8 3h8l4 4v14H4V3h4" />
      <path d="M8 12h8" />
      <path d="M8 16h8" />
      <path d="M8 8h4" />
    </svg>
  );
}


// 주요 기능
const FEATURES = [
  {
    number: "01",
    icon: "analysis",
    title: "코드 분석",
    desc: "정답 여부만 알려주지 않아요. 틀린 줄을 표시하고, 왜 그렇게 동작하는지 풀어서 설명합니다.",
    caption: "막힌 부분을 정확하게 이해하기",
  },
  {
    number: "02",
    icon: "recommend",
    title: "맞춤 문제 추천",
    desc: "자주 틀리는 유형을 기억해 두었다가, 약한 부분을 채우는 문제를 다음에 보여줘요.",
    caption: "나에게 필요한 문제로 이어가기",
  },
  {
    number: "03",
    icon: "history",
    title: "풀이 기록",
    desc: "제출한 코드와 AI 피드백이 문제별로 남아서, 며칠 뒤에 다시 봐도 어디서 막혔는지 기억나요.",
    caption: "해결 과정을 쌓아 가기",
  },
];

// 학습 과정
const STEPS = [
  {
    title: "문제를 고르고 풀기",
    desc: "난이도를 고르면 편집기가 바로 열려요. 설치할 건 없어요.",
  },
  {
    title: "제출하고 피드백 받기",
    desc: "테스트 결과와 함께 막힌 줄에 대한 설명이 도착해요.",
  },
  {
    title: "추천 문제로 이어가기",
    desc: "방금 놓친 개념을 연습할 다음 문제가 준비돼요.",
  },
];

// 코드 분석 데모
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

// 코드 하이라이트
function Code({ text }) {
  return text
    .split(/(\bdef\b|\bfor\b|\bin\b|\bif\b|\breturn\b|\b\d+\b)/g)
    .map((part, i) =>
      /^(def|for|in|if|return)$/.test(part) ? (
        <span key={i} className="tk-key">{part}</span>
      ) : /^\d+$/.test(part) ? (
        <span key={i} className="tk-num">{part}</span>
      ) : (
        part
      )
    );
}

function Home() {
  const [fixed, setFixed] = useState(false);
  const lines = fixed ? FIXED : BUGGY;

  return (
    <>
      <Header />

      <main>

        {/* ================= HERO ================= */}
        <section id="home" className="home-hero">
          <div className="home-hero-container">

            <div className="home-hero-left">

              <h1>
                틀린 코드에는
                <br />
                <span>이유가 있어요.</span>
                <br />
                AICoach가 짚어드려요.
              </h1>

              <p className="home-lead">
                문제를 풀고 제출하면, AI가 어느 줄이 왜
                틀렸는지 설명하고 다음에 풀 문제까지
                골라줍니다.
              </p>

              <div className="home-buttons">
                <a href="/signup" className="home-start-btn">
                  무료로 시작하기
                  <span aria-hidden="true">↗</span>
                </a>

                <a href="#features" className="home-info-btn">
                  기능 둘러보기
                  <span aria-hidden="true">↓</span>
                </a>
              </div>

              <div className="home-hero-highlights">
                <span><b>✓</b> 설치 없이 바로 시작</span>
                <span><b>✓</b> 코드별 AI 피드백</span>
                <span><b>✓</b> 나에게 맞는 다음 문제</span>
              </div>

            </div>

            {/* 코드 편집기 */}
            <div className="home-editor">

              <div className="home-editor-header">
                <div className="home-editor-file">
                  <span className="home-editor-file-dot" />
                  solution.py
                </div>

                <span className="home-editor-task">
                  문제 · 짝수만 더하기
                </span>
              </div>

              <div className="home-editor-code">
                {lines.map((line, i) => (
                  <div
                    key={i}
                    className={`code-line ${!fixed && i === 3 ? "is-flag" : ""
                      }`}
                  >
                    <span className="line-number">{i + 1}</span>
                    <code><Code text={line} /></code>
                  </div>
                ))}
              </div>

              <div
                className={`home-editor-feedback ${fixed ? "ok" : "bad"
                  }`}
                aria-live="polite"
              >
                <div className="home-feedback-title">
                  <span>{fixed ? "✓" : "!"}</span>
                  {fixed ? "분석 완료" : "4번째 줄 확인 필요"}
                </div>

                <p>
                  {fixed
                    ? "짝수만 골라 더하고 있어요. 다음 문제에서는 조건식을 한 줄로 쓰는 방법을 연습해 볼까요?"
                    : "모든 수를 더하고 있어요. 문제는 짝수만 더하는 거예요. if n % 2 == 0: 조건을 먼저 걸어 보세요."}
                </p>
              </div>

              <div className="home-editor-footer">
                <span className="home-test-summary">
                  <span
                    className={`home-test-dot ${fixed ? "passed" : ""
                      }`}
                  />
                  테스트 3개 중 {fixed ? "3개" : "1개"} 통과
                </span>

                <button
                  type="button"
                  onClick={() => setFixed(!fixed)}
                >
                  {fixed
                    ? "처음 상태로 ↺"
                    : "조건 추가해서 다시 제출 →"}
                </button>
              </div>

            </div>
          </div>
        </section>

        {/* ================= FEATURES ================= */}
        <section
          id="features"
          className="home-section home-features-section"
        >
          <div className="home-inner">

            <div className="home-section-heading">
              <span className="home-section-label">
                WHY AICOACH
              </span>

              <h2>
                풀고, 고치고, 다음 문제까지.
                <br />
                <span>코딩 학습의 흐름을 하나로</span>
              </h2>

              <p>
                혼자 풀다가 막히는 순간에도,
                학습이 멈추지 않도록 도와드려요.
              </p>
            </div>

            <div className="home-feature-list">
              {FEATURES.map((feature) => (
                <article
                  key={feature.number}
                  className="home-feature-card"
                >
                  <div className="home-feature-top">
                    <span className="home-feature-icon">
                      <FeatureIcon type={feature.icon} />
                    </span>

                    <span className="home-feature-number">
                      {feature.number} / 03
                    </span>
                  </div>

                  <h3>{feature.title}</h3>
                  <p>{feature.desc}</p>

                  <div className="home-feature-caption">
                    <span>↗</span>
                    {feature.caption}
                  </div>
                </article>
              ))}
            </div>

          </div>
        </section>

        {/* ================= LEARNING PROCESS ================= */}
        <section
          id="how-it-works"
          className="home-section home-process-section"
        >
          <div className="home-inner">

            <div className="home-section-heading">
              <span className="home-section-label">
                HOW IT WORKS
              </span>

              <h2>
                처음 시작해도{" "}
                <span>세 단계면 충분해요</span>
              </h2>

              <p>
                복잡한 준비 없이,
                한 문제부터 시작해 보세요.
              </p>
            </div>

            <ol className="home-steps">
              {STEPS.map((step, i) => (
                <li
                  key={step.title}
                  className="home-step-card"
                >
                  <div className="home-step-top">
                    <span className="home-step-number">
                      0{i + 1}
                    </span>

                    <span className="home-step-symbol">
                      {["⌨", "✓", "↗"][i]}
                    </span>
                  </div>

                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </li>
              ))}
            </ol>

          </div>
        </section>

        {/* ================= BOTTOM CTA ================= */}
        <section className="home-cta-section">
          <div className="home-inner">

            <div className="home-cta">

              <div className="home-cta-content">
                <span className="home-cta-label">
                  START LEARNING TODAY
                </span>

                <h2>오늘 첫 문제를 풀어보세요.</h2>

                <p>
                  틀린 이유를 이해하는 순간,
                  다음 문제는 조금 더 쉬워집니다.
                </p>

                <a href="/signup" className="home-cta-btn">
                  무료로 시작하기
                  <span>↗</span>
                </a>
              </div>

              <div
                className="home-cta-art"
                aria-hidden="true"
              >
                <span className="home-cta-art-code">
                  &lt;/&gt;
                </span>
                <span className="home-cta-art-check">
                  ✓
                </span>
              </div>

            </div>
          </div>
        </section>

      </main>

      <footer className="home-footer">
        <span>© 2026 AICoach</span>
        <span>AI 코딩 코치 · Learn with feedback.</span>
      </footer>
    </>
  );
}

export default Home;
