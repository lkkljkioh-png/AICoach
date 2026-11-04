
import Home from "./pages/Home.jsx";
import Problems from "./pages/Problems.jsx";
import ProblemSolve from "./pages/ProblemSolve.jsx";

function App() {
  const path =
    window.location.pathname.replace(/\/+$/, "") || "/";

  if (path === "/problems") {
    return <Problems />;
  }

  if (/^\/problems\/[^/]+$/.test(path)) {
    return <ProblemSolve />;
  }

  return <Home />;
}

export default App;
