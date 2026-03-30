import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";
import Editor from "@monaco-editor/react";
import { ChevronLeft, Play, Send, Terminal, GripVertical, AlertCircle, CheckCircle } from "lucide-react";

import { getProblemBySlug, runCode } from "../../services/api";
import Navbar from "../../components/Navbar";

const LANGUAGES = {
  javascript: { id: 63, name: "JavaScript (Node.js)" },
  python: { id: 71, name: "Python (3)" },
  cpp: { id: 54, name: "C++" },
  java: { id: 62, name: "Java" },
};

export default function CodeEditor() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("");

  // Terminal state
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  // Auth check
  const user = JSON.parse(localStorage.getItem("codesetu_user") || "null");

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const res = await getProblemBySlug(slug);
        const prob = res.data?.problem;
        setProblem(prob);
        // Find default template
        const defaultTemplate = prob?.starterCode?.find((s) => s.language === "javascript");
        setCode(defaultTemplate?.code || "// Write your code here");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [slug]);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    const template = problem?.starterCode?.find((s) => s.language === newLang);
    setCode(template?.code || "// Write your code here");
  };

  const executeCode = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setIsRunning(true);
    setOutput(null);

    try {
      const langId = LANGUAGES[language].id;
      const res = await runCode(problem._id, langId, code);
      // Results is an array of testcase results
      setOutput(res.results || []);
    } catch (err) {
      setOutput([{ error: err.message, status: "System Error" }]);
    } finally {
      setIsRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-primary-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-slate-400 font-mono">Loading IDE Workspace...</p>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center text-center px-4">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-3xl text-white font-bold mb-2">Problem Not Found</h2>
        <p className="text-slate-400 mb-6">{error || "The problem you're looking for doesn't exist."}</p>
        <Link to="/problems" className="btn-secondary">Back to Problems</Link>
      </div>
    );
  }

  const getDifficultyColor = (diff) => {
    switch (diff?.toLowerCase()) {
      case "easy": return "text-green-400 bg-green-400/10 border-green-400/20";
      case "medium": return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      case "hard": return "text-red-400 bg-red-400/10 border-red-400/20";
      default: return "text-slate-400 bg-slate-400/10 border-slate-400/20";
    }
  };

  return (
    <div className="h-screen flex flex-col bg-surface-950 overflow-hidden font-sans">
      {/* ─── IDE Navbar ─── */}
      <div className="h-14 border-b border-white/10 bg-surface-900/80 backdrop-blur-xl flex items-center justify-between px-4 shrink-0 transition-colors">
        <div className="flex items-center gap-4">
          <Link to="/problems" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors cursor-pointer group">
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-semibold text-sm hidden sm:block">Back</span>
          </Link>
          <div className="h-5 w-px bg-white/10 mx-2" />
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 text-xs font-bold rounded flex items-center shadow-lg ${getDifficultyColor(problem.difficulty)}`}>
              {problem.difficulty}
            </span>
            <span className="text-white font-semibold flex items-center">{problem.title}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <button
                onClick={executeCode}
                disabled={isRunning}
                className="flex items-center gap-2 px-4 py-1.5 bg-surface-800 hover:bg-surface-700 text-slate-300 hover:text-white border border-white/10 rounded-lg text-sm font-semibold transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRunning ? (
                  <svg className="animate-spin h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                ) : (
                  <Play className="w-4 h-4 text-green-400" />
                )}
                Run
              </button>
              <button
                disabled={isRunning}
                className="flex items-center gap-2 px-5 py-1.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-lg text-sm font-semibold shadow-[0_0_15px_rgba(124,58,237,0.4)] transition-all active:scale-95 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                Submit
              </button>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-xs ml-2 ring-2 ring-primary-500/20">
                 {user.name.charAt(0).toUpperCase()}
              </div>
            </>
          ) : (
            <Link to="/login" className="flex items-center gap-2 px-5 py-1.5 bg-gradient-to-r from-accent-600 to-primary-600 text-white shadow-glow hover:shadow-glow-lg transition-all rounded-lg text-sm font-bold">
              Sign In to Solve
            </Link>
          )}
        </div>
      </div>

      {/* ─── Main Workspace Editor ─── */}
      <div className="flex-1 overflow-hidden p-2">
        <PanelGroup direction="horizontal" className="rounded-xl overflow-hidden border border-white/5 bg-black/20 shadow-glass">
          
          {/* LEFT: Description */}
          <Panel defaultSize={40} minSize={25} className="bg-surface-900 relative">
            <div className="h-full flex flex-col">
              <div className="flex items-center px-4 h-11 border-b border-white/5 bg-surface-800 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Description
              </div>
              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                <h1 className="text-2xl font-bold text-white mb-6">{problem.title}</h1>
                <div 
                  className="prose prose-invert prose-slate max-w-none text-[15px] leading-relaxed 
                  prose-pre:bg-surface-950 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-lg
                  prose-code:text-accent-300 prose-code:bg-accent-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                  prose-headings:text-white prose-a:text-primary-400"
                  dangerouslySetInnerHTML={{ __html: problem.description }}
                />
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-1.5 bg-surface-950 hover:bg-primary-500/50 transition-colors cursor-col-resize flex items-center justify-center relative group">
            <div className="absolute inset-y-0 w-4 -left-1" />
            <GripVertical className="w-3 h-3 text-slate-600 group-hover:text-white transition-colors" />
          </PanelResizeHandle>

          {/* RIGHT: Editor & Console */}
          <Panel defaultSize={60} minSize={30}>
            <PanelGroup direction="vertical">
              
              {/* TOP: Monaco Editor */}
              <Panel defaultSize={70} minSize={20} className="bg-surface-900 relative">
                <div className="flex flex-col h-full">
                  {/* Editor Header */}
                  <div className="flex items-center justify-between px-4 h-11 border-b border-white/5 bg-surface-800">
                    <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Code</div>
                    <select
                      value={language}
                      onChange={handleLanguageChange}
                      className="bg-surface-950 border border-white/10 text-xs text-slate-300 rounded px-2 py-1 outline-none focus:border-primary-500 cursor-pointer"
                    >
                      {Object.keys(LANGUAGES).map((l) => (
                        <option key={l} value={l}>{LANGUAGES[l].name}</option>
                      ))}
                    </select>
                  </div>
                  {/* Editor Wrapper */}
                  <div className="flex-1 w-full bg-[#1e1e1e]">
                    <Editor
                      height="100%"
                      language={language === "cpp" ? "cpp" : language}
                      theme="vs-dark"
                      value={code}
                      onChange={(val) => setCode(val)}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        padding: { top: 16 },
                        scrollBeyondLastLine: false,
                        smoothScrolling: true,
                        cursorBlinking: "smooth",
                        cursorSmoothCaretAnimation: "on",
                        formatOnPaste: true
                      }}
                    />
                  </div>
                </div>
              </Panel>

              <PanelResizeHandle className="h-1.5 bg-surface-950 hover:bg-primary-500/50 transition-colors cursor-row-resize flex items-center justify-center relative group">
                <div className="absolute inset-x-0 h-4 -top-1" />
                <GripVertical className="w-3 h-3 text-slate-600 group-hover:text-white transition-colors rotate-90" />
              </PanelResizeHandle>

              {/* BOTTOM: Terminal Console */}
              <Panel defaultSize={30} minSize={10} className="bg-[#0a0a0a] relative font-mono text-sm">
                <div className="flex items-center gap-2 px-4 h-10 border-b border-white/10 bg-surface-800 text-xs font-semibold text-slate-400">
                  <Terminal className="w-4 h-4" />
                  Terminal Output
                </div>
                <div className="p-4 overflow-y-auto h-[calc(100%-2.5rem)] scrollbar-thin text-slate-300">
                  {!output && !isRunning && (
                    <div className="text-slate-500">Press "Run" to test your code...</div>
                  )}
                  {isRunning && (
                    <div className="flex items-center gap-2 text-primary-400">
                      <Spinner /> <span>Compiling & Executing...</span>
                    </div>
                  )}
                  {output && output.map((tc, idx) => (
                    <div key={idx} className="mb-6 last:mb-0 border border-white/5 rounded-lg overflow-hidden bg-black/40">
                      <div className={`px-4 py-2 text-xs font-bold flex items-center gap-2 ${
                        tc.status === "Accepted" ? "bg-green-500/10 text-green-400 border-b border-green-500/20" : 
                        tc.status === "Internal Error" ? "bg-red-500/10 text-red-500 border-b border-red-500/20" :
                        "bg-red-500/10 text-red-400 border-b border-red-500/20"
                      }`}>
                        {tc.status === "Accepted" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        Test Case {idx + 1}: {tc.status}
                      </div>

                      {tc.error ? (
                        <div className="p-3 text-red-400 text-xs break-words">
                          {tc.error}
                        </div>
                      ) : (
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div>
                            <div className="text-slate-500 mb-1">Input:</div>
                            <div className="bg-surface-900 rounded p-2 text-slate-300 overflow-x-auto whitespace-pre">{tc.input}</div>
                          </div>
                          <div>
                            <div className="text-slate-500 mb-1">Expected:</div>
                            <div className="bg-surface-900 rounded p-2 text-emerald-400 overflow-x-auto whitespace-pre">{tc.expectedOutput}</div>
                          </div>
                          <div className="col-span-1 md:col-span-2">
                            <div className="text-slate-500 mb-1">Output:</div>
                            <div className="bg-surface-900 rounded p-2 text-white overflow-x-auto whitespace-pre">{tc.actualOutput || "No Output"}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

const Spinner = () => (
  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);
