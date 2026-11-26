import Home from "./pages/Home.jsx";
import Problems from "./pages/Problems.jsx";
import ProblemSolve from "./pages/ProblemSolve.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import MyPage from "./pages/MyPage.jsx";
import Learning from "./pages/Learning.jsx";
import AdminProblems from "./pages/AdminProblems.jsx";
import ReviewPage from "./pages/ReviewPage.jsx";
import QnaPage from "./pages/QnaPage.jsx";

function App() {
  const path =
    window.location.pathname.replace(/\/+$/, "") || "/";

  if (path === "/login") {
    return <AuthPage mode="login" />;
  }

  if (path === "/signup") {
    return <AuthPage mode="signup" />;
  }

  if (path === "/admin/problems") {
    return <AdminProblems />;
  }

  if (path === "/review") {
    return <ReviewPage />;
  }

  if (path === "/problems") {
    return <Problems />;
  }

  if (/^\/problems\/[^/]+$/.test(path)) {
    return <ProblemSolve />;
  }

  if (path === "/learning") {
    return <Learning />;
  }

  if (path === "/mypage") {
    return <MyPage />;
  }

  if (path === "/qna" || path.startsWith("/qna/")) {
    return <QnaPage />;
  }
  return <Home />;
}

export default App;