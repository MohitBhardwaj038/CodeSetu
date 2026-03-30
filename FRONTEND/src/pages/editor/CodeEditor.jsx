import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";
import Editor from "@monaco-editor/react";
import {
  ChevronLeft, Play, Send, Terminal, GripVertical, AlertCircle, CheckCircle,
  FileText, BookOpen, Clock, Tag, ThumbsUp, ThumbsDown, Lightbulb, ChevronDown,
  ChevronRight, CheckCircle2, XCircle, CircleDot, Timer, Cpu, History,
} from "lucide-react";

import { getProblemBySlug, runCode, submitCode, getUserSubmissions } from "../../services/api";

const LANGUAGES = {
  javascript: { id: 63, name: "JavaScript (Node.js)", monacoLang: "javascript" },
  python: { id: 71, name: "Python (3)", monacoLang: "python" },
  cpp: { id: 54, name: "C++", monacoLang: "cpp" },
  java: { id: 62, name: "Java", monacoLang: "java" },
};

const getDifficultyStyle = (diff) => {
  switch (diff?.toLowerCase()) {
    case "easy": return { color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" };
    case "medium": return { color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" };
    case "hard": return { color: "text-rose-400", bg: "bg-rose-400/10", border: "border-rose-400/20" };
    default: return { color: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400/20" };
  }
};

const Spinner = ({ className = "h-4 w-4" }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  // Tabs
  const [activeTab, setActiveTab] = useState("description");
  const [terminalTab, setTerminalTab] = useState("testcases"); // testcases | result
  
  // Hints
  const [expandedHints, setExpandedHints] = useState({});

  // User submissions
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Auth
  const user = JSON.parse(localStorage.getItem("codesetu_user") || "null");

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const res = await getProblemBySlug(slug, user?.id);
        const prob = res.data?.problem;
        setProblem(prob);
        const defaultTemplate = prob?.starterCode?.find((s) => s.language === "javascript");
        setCode(defaultTemplate?.code || "// Write your code here\n");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [slug]);

  // Fetch submissions when tab changes
  useEffect(() => {
    if (activeTab === "submissions" && user?.id && problem?._id) {
      fetchSubmissions();
    }
  }, [activeTab]);

  const fetchSubmissions = async () => {
    setLoadingSubmissions(true);
    try {
      const res = await getUserSubmissions(problem._id, user.id);
      setSubmissions(res.data?.submissions || []);
    } catch {
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    const template = problem?.starterCode?.find((s) => s.language === newLang);
    setCode(template?.code || "// Write your code here\n");
  };

  const executeCode = async () => {
    if (!user) { navigate("/login"); return; }
    setIsRunning(true);
    setOutput(null);
    setSubmitResult(null);
    setTerminalTab("testcases");

    try {
      const langId = LANGUAGES[language].id;
      const res = await runCode(problem._id, langId, code);
      setOutput(res.results || []);
    } catch (err) {
      setOutput([{ error: err.message, status: "System Error" }]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) { navigate("/login"); return; }
    setIsSubmitting(true);
    setOutput(null);
    setSubmitResult(null);
    setTerminalTab("result");

    try {
      const langId = LANGUAGES[language].id;
      const res = await submitCode(problem._id, langId, code, user.id);
      setSubmitResult(res.data);
      // Update problem state locally
      if (res.data?.userProblemState) {
        setProblem((prev) => ({ ...prev, userProblemState: res.data.userProblemState }));
      }
    } catch (err) {
      setSubmitResult({ error: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleHint = (idx) => {
    setExpandedHints((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  // ─── Loading State ───
  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center">
        <div className="relative mb-4">
          <div className="w-14 h-14 rounded-full border-2 border-primary-500/20 border-t-primary-500 animate-spin" />
        </div>
        <p className="text-slate-400 font-mono text-sm">Loading IDE Workspace...</p>
      </div>
    );
  }

  // ─── Error State ───
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

  const diffStyle = getDifficultyStyle(problem.difficulty);

  return (
    <div className="h-screen flex flex-col bg-surface-950 overflow-hidden font-sans">
      {/* ─── IDE Navbar ─── */}
      <div className="h-12 border-b border-white/8 bg-surface-900/90 backdrop-blur-xl flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/problems" className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors group">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="font-medium text-xs hidden sm:block">Problems</span>
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${diffStyle.bg} ${diffStyle.color} ${diffStyle.border} border`}>
            {problem.difficulty}
          </span>
          <span className="text-white font-semibold text-sm truncate max-w-[200px] sm:max-w-none">{problem.title}</span>
          {problem.userProblemState?.submittedSuccessfully && (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <button
                onClick={executeCode}
                disabled={isRunning || isSubmitting}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-surface-800 hover:bg-surface-700 text-slate-300 hover:text-white border border-white/10 rounded-lg text-xs font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                id="run-code-btn"
              >
                {isRunning ? <Spinner /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                Run
              </button>
              <button
                onClick={handleSubmit}
                disabled={isRunning || isSubmitting}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-lg text-xs font-semibold shadow-[0_0_12px_rgba(99,102,241,0.25)] transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                id="submit-code-btn"
              >
                {isSubmitting ? <Spinner /> : <Send className="w-3.5 h-3.5" />}
                Submit
              </button>
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-[10px] ml-1 ring-2 ring-primary-500/20">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </>
          ) : (
            <Link to="/login" className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-accent-600 to-primary-600 text-white shadow-glow hover:shadow-glow-lg transition-all rounded-lg text-xs font-bold">
              Sign In to Solve
            </Link>
          )}
        </div>
      </div>

      {/* ─── Main Workspace ─── */}
      <div className="flex-1 overflow-hidden p-1.5">
        <PanelGroup direction="horizontal" className="rounded-xl overflow-hidden border border-white/5 bg-black/20 shadow-glass">

          {/* LEFT: Description/Editorial/Submissions Panel */}
          <Panel defaultSize={40} minSize={25} className="bg-surface-900 relative">
            <div className="h-full flex flex-col">
              {/* Tabs */}
              <div className="flex items-center h-10 border-b border-white/6 bg-surface-800/80 px-1 shrink-0">
                {[
                  { id: "description", label: "Description", icon: FileText },
                  { id: "editorial", label: "Editorial", icon: BookOpen },
                  ...(user ? [{ id: "submissions", label: "Submissions", icon: History }] : []),
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all mx-0.5 ${
                      activeTab === id
                        ? "text-white bg-white/8"
                        : "text-slate-500 hover:text-slate-300 hover:bg-white/4"
                    }`}
                    id={`tab-${id}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto scrollbar-thin">

                {/* ── Description Tab ── */}
                {activeTab === "description" && (
                  <div className="p-5">
                    {/* Title & Meta */}
                    <h1 className="text-xl font-bold text-white mb-3">{problem.title}</h1>
                    <div className="flex items-center flex-wrap gap-2 mb-5">
                      <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${diffStyle.bg} ${diffStyle.color} ${diffStyle.border}`}>
                        {problem.difficulty}
                      </span>
                      {(problem.topicTags || []).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 text-[10px] font-medium text-slate-400 bg-white/[0.04] rounded border border-white/[0.06]">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Stats Bar */}
                    <div className="flex items-center gap-4 mb-5 text-xs text-slate-500">
                      {problem.likes != null && (
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-3.5 h-3.5" /> {problem.likes}
                        </span>
                      )}
                      {problem.dislikes != null && (
                        <span className="flex items-center gap-1">
                          <ThumbsDown className="w-3.5 h-3.5" /> {problem.dislikes}
                        </span>
                      )}
                      {problem.acceptanceRate != null && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> {problem.acceptanceRate}% Acceptance
                        </span>
                      )}
                      {problem.totalSubmissions != null && (
                        <span className="flex items-center gap-1">
                          <Send className="w-3.5 h-3.5" /> {problem.totalSubmissions} Submissions
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <div
                      className="prose prose-invert prose-slate max-w-none text-[14px] leading-relaxed
                        prose-pre:bg-surface-950 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-lg
                        prose-code:text-accent-300 prose-code:bg-accent-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                        prose-headings:text-white prose-a:text-primary-400 mb-6"
                      dangerouslySetInnerHTML={{ __html: problem.description }}
                    />

                    {/* Examples */}
                    {(problem.examples || []).length > 0 && (
                      <div className="mb-6">
                        {problem.examples.map((ex, idx) => (
                          <div key={idx} className="mb-4 rounded-lg border border-white/6 overflow-hidden bg-surface-950/50">
                            <div className="px-3.5 py-2 bg-white/[0.03] border-b border-white/6 text-xs font-semibold text-slate-400">
                              Example {idx + 1}
                            </div>
                            <div className="p-3.5 space-y-2 text-sm font-mono">
                              <div>
                                <span className="text-slate-500 text-xs">Input: </span>
                                <span className="text-slate-200">{ex.input}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 text-xs">Output: </span>
                                <span className="text-emerald-400">{ex.output}</span>
                              </div>
                              {ex.explanation && (
                                <div>
                                  <span className="text-slate-500 text-xs">Explanation: </span>
                                  <span className="text-slate-300 font-sans text-xs">{ex.explanation}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Constraints */}
                    {(problem.constraints || []).length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-white mb-2.5">Constraints</h3>
                        <ul className="space-y-1.5">
                          {problem.constraints.map((c, i) => (
                            <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                              <span className="text-primary-400 mt-0.5 text-xs">•</span>
                              <code className="text-xs bg-white/[0.04] px-1.5 py-0.5 rounded text-slate-300 font-mono">{c}</code>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Hints */}
                    {(problem.hints || []).length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-white mb-2.5 flex items-center gap-1.5">
                          <Lightbulb className="w-4 h-4 text-amber-400" /> Hints
                        </h3>
                        {problem.hints.map((hint, idx) => (
                          <div key={idx} className="mb-2">
                            <button
                              onClick={() => toggleHint(idx)}
                              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10 text-sm text-amber-300/80 hover:bg-amber-500/8 transition-colors"
                            >
                              <span className="text-xs font-medium">Hint {idx + 1}</span>
                              {expandedHints[idx] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </button>
                            {expandedHints[idx] && (
                              <div className="mt-1 px-3.5 py-2.5 text-xs text-slate-400 bg-surface-950/50 rounded-lg border border-white/5 animate-fade-in">
                                {hint}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Company Tags */}
                    {(problem.companyTags || []).length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-sm font-semibold text-white mb-2.5">Companies</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {problem.companyTags.map((tag) => (
                            <span key={tag} className="px-2.5 py-1 text-[10px] font-medium text-slate-400 bg-white/[0.04] rounded-md border border-white/[0.06]">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Editorial Tab ── */}
                {activeTab === "editorial" && (
                  <div className="p-5">
                    {problem.editorial ? (
                      <>
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-primary-400" /> Editorial
                        </h2>
                        <div
                          className="prose prose-invert prose-slate max-w-none text-[14px] leading-relaxed
                            prose-pre:bg-surface-950 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-lg
                            prose-code:text-accent-300 prose-code:bg-accent-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                            prose-headings:text-white prose-a:text-primary-400"
                          dangerouslySetInnerHTML={{ __html: problem.editorial }}
                        />
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <BookOpen className="w-12 h-12 text-slate-600 mb-3" />
                        <p className="text-slate-400 font-medium mb-1">No Editorial Available</p>
                        <p className="text-slate-500 text-sm">An editorial hasn't been written for this problem yet.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Submissions Tab ── */}
                {activeTab === "submissions" && (
                  <div className="p-5">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <History className="w-5 h-5 text-primary-400" /> My Submissions
                    </h2>
                    {loadingSubmissions ? (
                      <div className="flex justify-center py-12">
                        <Spinner className="h-6 w-6 text-primary-400" />
                      </div>
                    ) : submissions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <History className="w-10 h-10 text-slate-600 mb-3" />
                        <p className="text-slate-400 text-sm">No submissions yet. Write your solution and submit!</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {submissions.map((sub) => {
                          const isAccepted = sub.status === "Accepted";
                          return (
                            <div
                              key={sub._id}
                              className={`rounded-lg border p-3 transition-colors ${
                                isAccepted
                                  ? "border-emerald-500/15 bg-emerald-500/5"
                                  : "border-white/6 bg-surface-950/40"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className={`flex items-center gap-1.5 text-sm font-semibold ${
                                  isAccepted ? "text-emerald-400" : "text-rose-400"
                                }`}>
                                  {isAccepted ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                  {sub.status}
                                </span>
                                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(sub.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-[11px] text-slate-500">
                                {sub.executionTimeMs != null && (
                                  <span className="flex items-center gap-1">
                                    <Timer className="w-3 h-3" /> {sub.executionTimeMs.toFixed(1)} ms
                                  </span>
                                )}
                                {sub.memoryUsedKb != null && (
                                  <span className="flex items-center gap-1">
                                    <Cpu className="w-3 h-3" /> {(sub.memoryUsedKb / 1024).toFixed(1)} MB
                                  </span>
                                )}
                                <span>Language: {
                                  Object.values(LANGUAGES).find((l) => String(l.id) === String(sub.language))?.name || sub.language
                                }</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
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
              <Panel defaultSize={65} minSize={20} className="bg-surface-900 relative">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between px-3 h-10 border-b border-white/5 bg-surface-800/80">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Code</div>
                    <select
                      value={language}
                      onChange={handleLanguageChange}
                      className="bg-surface-950 border border-white/10 text-xs text-slate-300 rounded-md px-2.5 py-1 outline-none focus:border-primary-500 cursor-pointer hover:bg-surface-900 transition-colors"
                      id="language-select"
                    >
                      {Object.keys(LANGUAGES).map((l) => (
                        <option key={l} value={l}>{LANGUAGES[l].name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 w-full bg-[#1e1e1e]">
                    <Editor
                      height="100%"
                      language={LANGUAGES[language].monacoLang}
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
                        formatOnPaste: true,
                        lineNumbers: "on",
                        renderLineHighlight: "line",
                        bracketPairColorization: { enabled: true },
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
              <Panel defaultSize={35} minSize={10} className="bg-[#0d0d0d] relative font-mono text-sm">
                {/* Terminal Tabs */}
                <div className="flex items-center justify-between h-9 border-b border-white/8 bg-surface-800/80 px-2 shrink-0">
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => setTerminalTab("testcases")}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                        terminalTab === "testcases" ? "text-white bg-white/8" : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      <Terminal className="w-3 h-3" /> Test Results
                    </button>
                    <button
                      onClick={() => setTerminalTab("result")}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                        terminalTab === "result"
                          ? submitResult?.submission?.status === "Accepted"
                            ? "text-emerald-400 bg-emerald-500/10"
                            : submitResult?.error || submitResult?.submission
                              ? "text-rose-400 bg-rose-500/10"
                              : "text-white bg-white/8"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      <Send className="w-3 h-3" /> Submission
                      {submitResult?.submission?.status === "Accepted" && (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-3 overflow-y-auto h-[calc(100%-2.25rem)] scrollbar-thin text-slate-300">

                  {/* ── Test Results Tab ── */}
                  {terminalTab === "testcases" && (
                    <>
                      {!output && !isRunning && (
                        <div className="text-slate-600 text-xs flex items-center gap-2 py-4">
                          <Play className="w-4 h-4" /> Press &quot;Run&quot; to test your code against visible test cases...
                        </div>
                      )}
                      {isRunning && (
                        <div className="flex items-center gap-2.5 text-primary-400 py-4">
                          <Spinner className="h-4 w-4" />
                          <span className="text-xs">Compiling & Executing...</span>
                        </div>
                      )}
                      {output &&
                        output.map((tc, idx) => (
                          <div key={idx} className="mb-3 last:mb-0 border border-white/5 rounded-lg overflow-hidden bg-black/30">
                            <div
                              className={`px-3 py-1.5 text-[11px] font-bold flex items-center gap-1.5 ${
                                tc.status === "Accepted"
                                  ? "bg-emerald-500/8 text-emerald-400 border-b border-emerald-500/15"
                                  : "bg-rose-500/8 text-rose-400 border-b border-rose-500/15"
                              }`}
                            >
                              {tc.status === "Accepted" ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                              Test Case {idx + 1}: {tc.status}
                              {tc.time && <span className="ml-auto text-[10px] text-slate-500 font-normal">{tc.time.toFixed(1)} ms</span>}
                            </div>
                            {tc.error ? (
                              <div className="p-2.5 text-rose-400 text-xs break-words">{tc.error}</div>
                            ) : (
                              <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px]">
                                <div>
                                  <div className="text-slate-600 mb-0.5 text-[10px]">Input</div>
                                  <div className="bg-surface-900 rounded p-1.5 text-slate-300 overflow-x-auto whitespace-pre font-mono">{tc.input}</div>
                                </div>
                                <div>
                                  <div className="text-slate-600 mb-0.5 text-[10px]">Expected</div>
                                  <div className="bg-surface-900 rounded p-1.5 text-emerald-400 overflow-x-auto whitespace-pre font-mono">{tc.expectedOutput}</div>
                                </div>
                                <div>
                                  <div className="text-slate-600 mb-0.5 text-[10px]">Output</div>
                                  <div className="bg-surface-900 rounded p-1.5 text-white overflow-x-auto whitespace-pre font-mono">{tc.actualOutput || "No Output"}</div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                    </>
                  )}

                  {/* ── Submission Result Tab ── */}
                  {terminalTab === "result" && (
                    <>
                      {!submitResult && !isSubmitting && (
                        <div className="text-slate-600 text-xs flex items-center gap-2 py-4">
                          <Send className="w-4 h-4" /> Press &quot;Submit&quot; to grade your solution against all test cases...
                        </div>
                      )}
                      {isSubmitting && (
                        <div className="flex items-center gap-2.5 text-primary-400 py-4">
                          <Spinner className="h-4 w-4" />
                          <span className="text-xs">Submitting & Grading against all test cases...</span>
                        </div>
                      )}
                      {submitResult && !submitResult.error && submitResult.submission && (
                        <div className="animate-fade-in">
                          {/* Status Banner */}
                          <div
                            className={`rounded-xl p-4 mb-3 border ${
                              submitResult.submission.status === "Accepted"
                                ? "bg-emerald-500/8 border-emerald-500/15"
                                : "bg-rose-500/8 border-rose-500/15"
                            }`}
                          >
                            <div className={`flex items-center gap-2 text-lg font-bold mb-2 ${
                              submitResult.submission.status === "Accepted" ? "text-emerald-400" : "text-rose-400"
                            }`}>
                              {submitResult.submission.status === "Accepted" ? (
                                <CheckCircle2 className="w-6 h-6" />
                              ) : (
                                <XCircle className="w-6 h-6" />
                              )}
                              {submitResult.submission.status}
                            </div>
                            <div className="flex items-center gap-5 text-xs text-slate-400">
                              {submitResult.submission.executionTimeMs != null && (
                                <span className="flex items-center gap-1">
                                  <Timer className="w-3.5 h-3.5" />
                                  Runtime: <span className="text-white font-medium">{submitResult.submission.executionTimeMs.toFixed(1)} ms</span>
                                </span>
                              )}
                              {submitResult.submission.memoryUsedKb != null && (
                                <span className="flex items-center gap-1">
                                  <Cpu className="w-3.5 h-3.5" />
                                  Memory: <span className="text-white font-medium">{(submitResult.submission.memoryUsedKb / 1024).toFixed(2)} MB</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Failed Test Case (if any) */}
                          {submitResult.submission.failedTestCase && (
                            <div className="border border-rose-500/15 rounded-lg overflow-hidden bg-black/30">
                              <div className="px-3 py-1.5 text-[11px] font-bold text-rose-400 bg-rose-500/8 border-b border-rose-500/15">
                                Failed Test Case
                              </div>
                              <div className="p-3 grid grid-cols-1 gap-2.5 text-[11px]">
                                <div>
                                  <div className="text-slate-600 mb-0.5 text-[10px]">Input</div>
                                  <div className="bg-surface-900 rounded p-1.5 text-slate-300 overflow-x-auto whitespace-pre font-mono">
                                    {submitResult.submission.failedTestCase.input}
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2.5">
                                  <div>
                                    <div className="text-slate-600 mb-0.5 text-[10px]">Expected</div>
                                    <div className="bg-surface-900 rounded p-1.5 text-emerald-400 overflow-x-auto whitespace-pre font-mono">
                                      {submitResult.submission.failedTestCase.expectedOutput}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-slate-600 mb-0.5 text-[10px]">Your Output</div>
                                    <div className="bg-surface-900 rounded p-1.5 text-rose-400 overflow-x-auto whitespace-pre font-mono">
                                      {submitResult.submission.failedTestCase.actualOutput || "No Output"}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {submitResult?.error && (
                        <div className="rounded-lg border border-rose-500/15 bg-rose-500/8 p-4 animate-fade-in">
                          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm mb-1">
                            <AlertCircle className="w-4 h-4" /> Submission Error
                          </div>
                          <p className="text-xs text-rose-300/80">{submitResult.error}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
