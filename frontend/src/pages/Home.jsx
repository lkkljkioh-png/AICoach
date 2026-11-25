import { useEffect, useState } from "react";
import Header from "../components/Header.jsx";
import FeatureIcon from "../components/common/FeatureIcon.jsx";
import HomeCodeDemo from "../components/home/HomeCodeDemo.jsx";
import { getCurrentUser } from "../api/authApi.js";
import { FEATURES, STEPS } from "../data/homeData.js";
import { ArrowRight, ArrowUpRight, Code2, BrainCircuit, CheckCircle2, BarChart3, RotateCcw, Keyboard, ClipboardCheck } from "lucide-react";
import "../styles/Home.css";

const STEP_ICONS = [Keyboard, ClipboardCheck, BrainCircuit];
const TRACKS = [
    { title: "직접 코딩", desc: "스스로 작성하고 테스트 케이스로 검증하세요.", href: "/problems", Icon: Code2 },
    { title: "AI 맞춤 학습", desc: "내 수준에 맞는 문제와 AI 코칭을 만나보세요.", href: "/learning", Icon: BrainCircuit },
    { title: "오답 복습", desc: "실패한 풀이를 돌아보고 다시 도전하세요.", href: "/review", Icon: RotateCcw },
    { title: "학습 분석", desc: "학습 활동과 목표 달성 현황을 확인하세요.", href: "/mypage", Icon: BarChart3 },
];

export default function Home() {
    const [user, setUser] = useState(null);
    useEffect(() => {
        let active = true;
        getCurrentUser().then(data => { if (active) setUser(data); }).catch(error => console.error("로그인 상태 확인 실패:", error));
        return () => { active = false; };
    }, []);
    const startPath = user ? "/problems" : "/signup";
    return <><Header/><main className="product-home">
        <section className="product-hero" id="home"><div className="product-hero-inner">
            <div className="product-hero-copy"><div className="product-kicker"><span/> AI-POWERED CODING WORKSPACE</div><h1>코드를 넘어,<br/> <em>개발하는 능력.</em></h1><p>직접 풀고, AI와 함께 검증하고, 더 나은 코드로 개선하세요. 실전형 코딩 학습을 하나의 작업 공간에서 경험하세요.</p><div className="product-hero-actions"><a className="product-primary" href={startPath}>{user ? "학습 계속하기" : "학습 시작하기"}<ArrowRight size={19}/></a><a className="product-secondary" href="/problems">문제 둘러보기<ArrowUpRight size={16}/></a></div><div className="product-trust"><CheckCircle2 size={16}/> 설치 없이 브라우저에서 학습 <span>·</span> AI 코드 피드백</div></div>
            <div className="product-demo-shell"><div className="product-demo-bar"><div className="product-window-dots"><i/><i/><i/></div><span>AICoach / Practice</span><span className="product-demo-live"><i/> INTERACTIVE DEMO</span></div><HomeCodeDemo/></div>
        </div><div className="product-language-strip"><span>지원 언어</span>{["Python","JavaScript","Java","C","C++"].map(lang => <strong key={lang}>{lang}</strong>)}</div></section>
        <section className="product-section product-tracks" id="features"><div className="product-section-head"><div><span className="product-overline">YOUR WORKSPACE</span><h2>학습을 시작하는 네 가지 방법</h2></div><p>지금 필요한 학습을 선택하고, 자신의 속도로 성장하세요.</p></div><div className="product-track-grid">{TRACKS.map(({title,desc,href,Icon}) => <a key={href} className="product-track" href={href}><div className="product-track-top"><span className="product-track-icon"><Icon size={24} strokeWidth={1.7}/></span><ArrowUpRight size={18}/></div><h3>{title}</h3><p>{desc}</p><span className="product-track-link">시작하기 <ArrowRight size={14}/></span></a>)}</div></section>
        <section className="product-features"><div className="product-section"><div className="product-section-head"><div><span className="product-overline">BUILT FOR LEARNING</span><h2>한 번의 풀이를<br/> 다음 성장으로 연결합니다.</h2></div><p>문제를 해결하는 것에서 멈추지 않고, 왜 맞고 틀렸는지 이해하는 학습 경험을 제공합니다.</p></div><div className="product-feature-grid">{FEATURES.map(feature => <article className="product-feature" key={feature.number}><span className="product-feature-icon"><FeatureIcon type={feature.icon}/></span><span className="product-feature-index">{feature.number}</span><h3>{feature.title}</h3><p>{feature.desc}</p><div className="product-feature-caption">{feature.caption}</div></article>)}</div></div></section>
        <section className="product-section product-process" id="how-it-works"><div><span className="product-overline">HOW IT WORKS</span><h2>작은 반복이<br/> 실력을 만듭니다.</h2><p>복잡한 설정 없이 바로 시작하세요.</p><a href={startPath} className="product-inline-link">첫 문제 풀기 <ArrowRight size={17}/></a></div><ol>{STEPS.map((step,index)=>{const Icon=STEP_ICONS[index];return <li key={step.title}><span className="product-step-number">0{index+1}</span><Icon size={24}/><div><h3>{step.title}</h3><p>{step.desc}</p></div></li>;})}</ol></section>
        <section className="product-bottom"><div><span className="product-overline">START BUILDING</span><h2>오늘부터, 더 깊이 배우세요.</h2><p>한 문제씩 쌓아가는 나만의 개발 역량.</p></div><a className="product-primary" href={startPath}>학습 시작하기 <ArrowRight size={18}/></a></section>
    </main><footer className="product-footer"><a href="/" aria-label="AICoach 홈"><img src="/aicoach-logo.png" alt="AICoach"/></a><nav aria-label="하단 메뉴"><a href="/problems">문제 풀이</a><a href="/learning">AI 학습</a><a href="/review">오답 복습</a></nav><span>© 2026 AICoach</span></footer></>;
}
