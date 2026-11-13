
import Home from "./pages/Home.jsx";
import Problems from "./pages/Problems.jsx";
import ProblemSolve from "./pages/ProblemSolve.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import MyPage from "./pages/MyPage.jsx";

function App() {
  const path =
    window.location.pathname.replace(/\/+$/, "") || "/";

  if (path === "/login") {
    return <AuthPage mode="login" />;
  }

  if (path === "/signup") {
    return <AuthPage mode="signup" />;
  }

  if (path === "/problems") {
    return <Problems />;
  }

  if (/^\/problems\/[^/]+$/.test(path)) {
    return <ProblemSolve />;
  }

  if (path === "/mypage") {
    return <MyPage />;
  }

  return <Home />;
}

export default App;
