import { useEffect, useState } from "react";
import { BookOpen, BrainCircuit, RotateCcw, MessageSquare, LayoutDashboard, Home, LogOut, UserRound, Menu, X, ArrowUpRight, ChevronDown } from "lucide-react";
import { getCurrentUser, logout } from "../api/authApi.js";
import "../styles/Header.css";

const NAV = [
    { href: "/problems", label: "문제 풀이", Icon: BookOpen },
    { href: "/learning", label: "AI 맞춤 학습", Icon: BrainCircuit },
    { href: "/review", label: "오답 복습", Icon: RotateCcw },
    { href: "/mypage", label: "마이페이지", Icon: LayoutDashboard },
    { href: "/qna", label: "Q&A", Icon: MessageSquare },
];

export default function Header() {
    const [user, setUser] = useState(null);
    const [checking, setChecking] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [logoError, setLogoError] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    const publicPage = ["/", "/login", "/signup"].includes(path);
    const compact = /^\/problems\/[^/]+$/.test(path);
    const active = (href) => path === href || path.startsWith(`${href}/`);

    useEffect(() => {
        let mounted = true;
        getCurrentUser().then((data) => { if (mounted) setUser(data); })
            .catch((error) => console.error("로그인 상태 확인 실패:", error))
            .finally(() => { if (mounted) setChecking(false); });
        return () => { mounted = false; };
    }, []);

    useEffect(() => {
        const onClick = (event) => { if (!event.target.closest(".ac-profile")) setProfileOpen(false); };
        const onKey = (event) => { if (event.key === "Escape") { setProfileOpen(false); setMobileOpen(false); } };
        document.addEventListener("click", onClick);
        document.addEventListener("keydown", onKey);
        return () => { document.removeEventListener("click", onClick); document.removeEventListener("keydown", onKey); };
    }, []);

    const handleLogout = async () => {
        if (loggingOut) return;
        setLoggingOut(true);
        try { await logout(); window.location.href = "/"; }
        catch (error) { alert(error.message || "로그아웃에 실패했습니다."); setLoggingOut(false); }
    };

    const navLinks = (items) =>
        items.map(({ href, label, Icon }) => (
            <a
                key={href}
                href={href}
                title={label}
                aria-label={label}
                aria-current={active(href) ? "page" : undefined}
                className={active(href) ? "is-active" : ""}
            >
                <Icon size={19} strokeWidth={1.75} />
                <span>{label}</span>
            </a>
        ));
    const logo = <a className="ac-brand" href="/" aria-label="AICoach 홈">{logoError ? <span className="ac-brand-fallback">AICO</span> : <img src="/aicoach-logo.png" alt="AICoach" onError={() => setLogoError(true)} />}</a>;
    const account = !checking && (user ? (
        <div className="ac-profile">
            <button type="button" className="ac-profile-trigger" aria-label="계정 메뉴" aria-expanded={profileOpen} onClick={() => setProfileOpen((v) => !v)}>
                <span className="ac-avatar"><UserRound size={18} /></span>
                <span className="ac-account-copy"><strong>{user.nickname}</strong><small>내 계정</small></span><ChevronDown size={14} className="ac-profile-chevron" />
            </button>
            {profileOpen && <div className="ac-profile-menu"><div className="ac-profile-info"><strong>{user.nickname}</strong><small>{user.email}</small></div><a href="/mypage"><UserRound size={16} /> 마이페이지</a><button type="button" disabled={loggingOut} onClick={handleLogout}><LogOut size={16} />{loggingOut ? "로그아웃 중..." : "로그아웃"}</button></div>}
        </div>
    ) : <div className="ac-auth-links"><a href="/login">로그인</a><a className="ac-primary-link" href="/signup">시작하기 <ArrowUpRight size={15} /></a></div>);

    return publicPage ? (
        <header className="ac-public-header">
            <div className="ac-public-inner">{logo}<nav className="ac-public-nav" aria-label="주 메뉴"><a href="/#features">주요 기능</a><a href="/#how-it-works">학습 과정</a>{navLinks(NAV)}</nav><div className="ac-public-actions">{account}<button className="ac-mobile-toggle" type="button" aria-label="메뉴" aria-expanded={mobileOpen} onClick={() => setMobileOpen(v => !v)}>{mobileOpen ? <X /> : <Menu />}</button></div></div>
            {mobileOpen && <nav className="ac-mobile-nav" aria-label="모바일 메뉴">{navLinks(NAV)}<a href="/#features">주요 기능</a><a href="/#how-it-works">학습 과정</a></nav>}
        </header>
    ) : (
        <header className={`ac-app-header ${compact ? "ac-compact" : ""}`}>
            <div className="ac-side-top">{logo}<button className="ac-mobile-toggle" type="button" aria-label="메뉴" aria-expanded={mobileOpen} onClick={() => setMobileOpen(v => !v)}>{mobileOpen ? <X /> : <Menu />}</button></div>
            <div className={`ac-side-content ${mobileOpen ? "is-open" : ""}`}>
                <nav className="ac-side-nav" aria-label="학습 메뉴"><div className="ac-nav-caption">WORKSPACE</div>{navLinks(NAV.slice(0, 4))}<div className="ac-nav-caption ac-community-caption">COMMUNITY</div>{navLinks(NAV.slice(4))}</nav>
                <div className="ac-side-bottom"><a className="ac-home-link" href="/" title="홈" aria-label="홈"><Home size={19} /><span>홈으로</span></a>{account}</div>
            </div>
        </header>
    );
}
