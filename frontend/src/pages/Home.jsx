
import Header from "../components/Header.jsx";
import FeatureIcon from "../components/common/FeatureIcon.jsx";
import HomeCodeDemo from "../components/home/HomeCodeDemo.jsx";

import { useEffect, useState } from "react";
import { getCurrentUser } from "../api/authApi.js";
import { FEATURES, STEPS } from "../data/homeData.js";

import {
  ArrowUpRight,
  ArrowDown,
  ArrowRight,
  Check,
  Keyboard,
  ClipboardCheck,
  BrainCircuit,
  CodeXml,
  CircleCheck,
} from "lucide-react";

import "../styles/Home.css";

const STEP_ICONS = [
  Keyboard,
  ClipboardCheck,
  BrainCircuit,
];

function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let active = true;

    getCurrentUser()
      .then((data) => {
        if (active) setUser(data);
      })
      .catch((error) => {
        console.error("로그인 상태 확인 실패:", error);
      });

    return () => {
      active = false;
    };
  }, []);

  const startPath = user ? "/problems" : "/signup";

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
                틀렸는지 설명하고 <br />
                다음에 풀 문제까지 골라줍니다.
              </p>

              <div className="home-buttons">
                <a
                  href={startPath}
                  className="home-start-btn"
                >
                  학습 시작하기
                  <ArrowUpRight size={18} />
                </a>

                <a
                  href="#features"
                  className="home-info-btn"
                >
                  기능 둘러보기
                  <ArrowDown size={17} />
                </a>
              </div>

              <div className="home-hero-highlights">
                <span>
                  <Check size={15} />
                  설치 없이 바로 시작
                </span>

                <span>
                  <Check size={15} />
                  코드별 AI 피드백
                </span>

                <span>
                  <Check size={15} />
                  나에게 맞는 다음 문제
                </span>
              </div>
            </div>

            {/* 코드 편집기 */}
            <HomeCodeDemo />
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
                    <ArrowUpRight
                      size={15}
                      strokeWidth={2}
                    />
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
              {STEPS.map((step, index) => {
                const StepIcon = STEP_ICONS[index];

                return (
                  <li
                    key={step.title}
                    className="home-step-card"
                  >
                    <div className="home-step-top">
                      <span className="home-step-number">
                        0{index + 1}
                      </span>

                      <span className="home-step-symbol">
                        <StepIcon
                          size={25}
                          strokeWidth={1.8}
                        />
                      </span>
                    </div>

                    <h3>{step.title}</h3>
                    <p>{step.desc}</p>
                  </li>
                );
              })}
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

                <a
                  href={startPath}
                  className="home-cta-btn"
                >
                  무료로 시작하기
                  <ArrowUpRight size={18} />
                </a>
              </div>

              <div
                className="home-cta-art"
                aria-hidden="true"
              >
                <span className="home-cta-art-code">
                  <CodeXml
                    size={112}
                    strokeWidth={1.2}
                  />
                </span>

                <span className="home-cta-art-check">
                  <CircleCheck
                    size={38}
                    strokeWidth={2}
                  />
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
