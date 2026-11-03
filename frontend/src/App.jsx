
import Home from "./pages/Home.jsx";
import Problems from "./pages/Problems.jsx";

function App() {
  const path =
    window.location.pathname.replace(/\/+$/, "") || "/";

  if (path === "/problems") {
    return <Problems />;
  }

  return <Home />;
}

export default App;
