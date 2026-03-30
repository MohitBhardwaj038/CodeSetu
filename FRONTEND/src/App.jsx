import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/landing/Landing";
import Login from "./pages/login/Login";
import Register from "./pages/register/Register";
import Problems from "./pages/problems/Problems";
import CodeEditor from "./pages/editor/CodeEditor";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/problems" element={<Problems />} />
        <Route path="/problems/:slug" element={<CodeEditor />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

// changes from st1;