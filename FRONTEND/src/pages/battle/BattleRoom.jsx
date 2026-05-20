import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";
import {
  Swords, Clock, Users, Trophy, Send, CheckCircle2, XCircle,
  AlertCircle, GripVertical, ChevronLeft, ChevronRight, Zap, Timer,
  Play, Terminal, CheckCircle, Cpu,
} from "lucide-react";
import { useBattleSocket } from "../../hooks/useBattleSocket";
import { getProblemBySlug } from "../../services/api";
import { getRoom, joinRoom, startRoom, getLeaderboard, battleSubmitCode, battleRunCode } from "../../services/battleApi";

const problemId = (p) => String(p?._id || p);

function mergeProblems(prev = [], incoming = []) {
  if (!incoming?.length) return prev;
  const map = new Map();
  for (const p of prev) map.set(problemId(p), p);
  for (const p of incoming) {
    const id = problemId(p);
    map.set(id, { ...(map.get(id) || {}), ...p, _id: p._id ?? map.get(id)?._id ?? id });
  }
  return Array.from(map.values());
}

const LANGUAGES = {
  javascript: { id: 63, name: "JavaScript", monacoLang: "javascript" },
  python:     { id: 71, name: "Python",     monacoLang: "python" },
  cpp:        { id: 54, name: "C++",         monacoLang: "cpp" },
  java:       { id: 62, name: "Java",        monacoLang: "java" },
};

const DIFF_STYLE = {
  Easy:   "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  Medium: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  Hard:   "text-rose-400 bg-rose-400/10 border-rose-400/20",
};

function Spinner() {
  return <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>;
}

function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/* Compound key for per-problem-per-language code caching */
const codeKey = (pid, lang) => `${pid}_${lang}`;

export default function BattleRoom() {
  const { code } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("codesetu_user") || "null");

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [language, setLanguage] = useState("javascript");
  const [editorCode, setEditorCode] = useState("// Write your solution here\n");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [solvedSet, setSolvedSet] = useState(new Set());
  const [leaderboard, setLeaderboard] = useState([]);
  const [remainingSecs, setRemainingSecs] = useState(0);
  const [roomStatus, setRoomStatus] = useState("waiting");
  const [isStarting, setIsStarting] = useState(false);
  const [showFinalBoard, setShowFinalBoard] = useState(false);
  const [finalLeaderboard, setFinalLeaderboard] = useState([]);
  const [codeByProblem, setCodeByProblem] = useState({});

  // Run / Terminal state
  const [isRunning, setIsRunning] = useState(false);
  const [runOutput, setRunOutput] = useState(null);
  const [terminalTab, setTerminalTab] = useState("testcases"); // testcases | result

  const buildLB = useCallback((participants) => {
    const lb = [...participants]
      .map((p) => ({
        userId: String(p.userId?._id || p.userId),
        name: p.userId?.name || "Unknown",
        score: p.score || 0,
        solved: p.solvedProblems?.length || 0,
      }))
      .sort((a, b) => b.score - a.score);
    setLeaderboard(lb);
  }, []);

  const loadRoom = useCallback(async () => {
    let res = await getRoom(code);
    let r = res.data?.room;

    const isParticipant = r.participants?.some(
      (p) => String(p.userId?._id || p.userId) === String(user.id)
    );
    if (!isParticipant) {
      const joinRes = await joinRoom(code);
      r = joinRes.data?.room;
    }

    setRoom(r);
    setRoomStatus(r.status);
    setSelectedProblem((current) => {
      if (!r.problems?.length) return current;
      if (current) {
        const match = r.problems.find((p) => problemId(p) === problemId(current));
        if (match) return mergeProblems([current], [match])[0];
      }
      return r.problems[0];
    });

    const me = r.participants?.find(
      (p) => String(p.userId?._id || p.userId) === String(user.id)
    );
    if (me) {
      setSolvedSet(
        new Set(me.solvedProblems?.map((s) => String(s.problemId)) || [])
      );
    }

    if (r.status === "active" && r.startedAt) {
      const end = new Date(r.startedAt).getTime() + r.durationMinutes * 60000;
      setRemainingSecs(Math.max(0, Math.ceil((end - Date.now()) / 1000)));
    }

    if (r.status === "finished") {
      const lbRes = await getLeaderboard(code);
      setFinalLeaderboard(lbRes.data?.leaderboard || []);
      setShowFinalBoard(true);
    }

    buildLB(r.participants || []);
    return r;
  }, [code, user?.id, buildLB]);

  // Load room on mount
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    (async () => {
      try {
        await loadRoom();
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadRoom, navigate, user]);

  const selectProblem = useCallback(
    async (prob) => {
      if (!prob) return;

      // Save current code with compound key
      const currentId = problemId(selectedProblem);
      if (currentId) {
        setCodeByProblem((prev) => ({ ...prev, [codeKey(currentId, language)]: editorCode }));
      }

      let next =
        room?.problems?.find((p) => problemId(p) === problemId(prob)) || prob;

      if (!next.description && next.slug) {
        try {
          const res = await getProblemBySlug(next.slug);
          const full = res.data?.problem;
          if (full) {
            next = full;
            setRoom((prev) => ({
              ...prev,
              problems: mergeProblems(prev?.problems, [full]),
            }));
          }
        } catch {
          /* keep partial problem data */
        }
      }

      const nextId = problemId(next);
      setSelectedProblem(next);
      setSubmitResult(null);
      setRunOutput(null);

      // Load cached code for this problem+language, or template
      const cached = codeByProblem[codeKey(nextId, language)];
      if (cached !== undefined) {
        setEditorCode(cached);
      } else {
        const tmpl = next.starterCode?.find((s) => s.language === language);
        setEditorCode(tmpl?.code || `// Write your ${language} solution here\n`);
      }
    },
    [selectedProblem, editorCode, room, codeByProblem, language]
  );

  // Refresh editor when language changes for the current problem
  useEffect(() => {
    if (!selectedProblem) return;
    const id = problemId(selectedProblem);
    const key = codeKey(id, language);

    // Check if we have cached code for this problem+language combo
    const cached = codeByProblem[key];
    if (cached !== undefined) {
      setEditorCode(cached);
    } else {
      // Load template for the new language
      const tmpl = selectedProblem.starterCode?.find((s) => s.language === language);
      const templateCode = tmpl?.code || `// Write your ${language} solution here\n`;
      setEditorCode(templateCode);
      setCodeByProblem((prev) => ({ ...prev, [key]: templateCode }));
    }
  }, [language]);

  // Socket handlers
  const handleRoomState = useCallback(({ room: r, leaderboard: lb }) => {
    if (r) {
      setRoom((prev) => ({
        ...prev,
        ...r,
        problems: mergeProblems(prev?.problems, r?.problems),
      }));
      setRoomStatus(r.status);
      if (r.participants) buildLB(r.participants);
    }
    if (lb) setLeaderboard(lb);
  }, [buildLB]);

  const handleRoomStarted = useCallback(({ startedAt, durationMinutes, problems }) => {
    setRoomStatus("active");
    const end = new Date(startedAt).getTime() + durationMinutes * 60000;
    setRemainingSecs(Math.max(0, Math.ceil((end - Date.now()) / 1000)));
    if (problems?.length) {
      setRoom((prev) => ({
        ...prev,
        problems: mergeProblems(prev?.problems, problems),
      }));
    }
  }, []);

  const handleTimerTick = useCallback(({ remainingSecs: s }) => {
    setRemainingSecs(s);
  }, []);

  const handleLeaderboardUpdate = useCallback(({ leaderboard: lb }) => {
    if (lb) setLeaderboard(lb);
  }, []);

  const handleSubmissionResult = useCallback(({ userId: uid, problemId: pid, status }) => {
    if (String(uid) === String(user?.id) && status === "Accepted") {
      setSolvedSet(prev => new Set([...prev, String(pid)]));
    }
  }, [user?.id]);

  const handleRoomEnded = useCallback(({ leaderboard: lb }) => {
    setRoomStatus("finished");
    setRemainingSecs(0);
    setFinalLeaderboard(lb || []);
    setShowFinalBoard(true);
  }, []);

  const handleParticipantJoined = useCallback(async () => {
    try {
      await loadRoom();
    } catch {
      /* ignore refresh errors */
    }
  }, [loadRoom]);

  useBattleSocket({
    roomCode: code,
    userId: user?.id,
    onRoomState: handleRoomState,
    onRoomStarted: handleRoomStarted,
    onTimerTick: handleTimerTick,
    onLeaderboardUpdate: handleLeaderboardUpdate,
    onSubmissionResult: handleSubmissionResult,
    onRoomEnded: handleRoomEnded,
    onParticipantJoined: handleParticipantJoined,
    onRoomError: (e) => setError(e.message),
  });

  const handleStartRoom = async () => {
    setIsStarting(true);
    try {
      await startRoom(code);
    } catch (e) { setError(e.message); }
    finally { setIsStarting(false); }
  };

  // ── Run code (visible test cases only) ──
  const handleRun = async () => {
    if (!selectedProblem || !user) return;
    setIsRunning(true);
    setRunOutput(null);
    setSubmitResult(null);
    setTerminalTab("testcases");
    try {
      const langId = LANGUAGES[language].id;
      const res = await battleRunCode(selectedProblem._id, langId, editorCode);
      setRunOutput(res.results || []);
    } catch (e) {
      setRunOutput([{ error: e.message, status: "System Error" }]);
    } finally {
      setIsRunning(false);
    }
  };

  // ── Submit code (all test cases) ──
  const handleSubmit = async () => {
    if (!selectedProblem || !user) return;
    setIsSubmitting(true);
    setSubmitResult(null);
    setRunOutput(null);
    setTerminalTab("result");
    try {
      const langId = LANGUAGES[language].id;
      const res = await battleSubmitCode(code, selectedProblem._id, langId, editorCode);
      setSubmitResult(res);
      if (res.status === "Accepted") {
        setSolvedSet(prev => new Set([...prev, String(selectedProblem._id)]));
      }
    } catch (e) {
      setSubmitResult({ status: "Error", error: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCreator = room && String(room.createdBy?._id || room.createdBy) === String(user?.id);
  const timerColor = remainingSecs < 60 ? "text-rose-400" : remainingSecs < 300 ? "text-amber-400" : "text-emerald-400";

  const problems = room?.problems || [];
  const currentProblemIndex = problems.findIndex(
    (p) => problemId(p) === problemId(selectedProblem)
  );
  const goToProblem = (index) => {
    if (index >= 0 && index < problems.length) {
      selectProblem(problems[index]);
    }
  };

  if (loading) return (
    <div className="h-screen bg-surface-950 flex items-center justify-center">
      <div className="text-center">
        <Spinner />
        <p className="text-slate-400 mt-3 text-sm">Loading battle room...</p>
      </div>
    </div>
  );

  if (error && !room) return (
    <div className="h-screen bg-surface-950 flex flex-col items-center justify-center text-center px-4">
      <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
      <h2 className="text-2xl font-bold text-white mb-2">Room Error</h2>
      <p className="text-slate-400 mb-6">{error}</p>
      <Link to="/battle" className="px-6 py-2 bg-primary-600 rounded-xl text-white font-bold">Back to Lobby</Link>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-surface-950 overflow-hidden font-sans">
      {/* Final Leaderboard Modal */}
      {showFinalBoard && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-900 rounded-2xl border border-white/10 p-8 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <Trophy className="w-14 h-14 text-amber-400 mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-white">Battle Ended!</h2>
              <p className="text-slate-400 text-sm mt-1">Final Leaderboard</p>
            </div>
            <div className="space-y-2 mb-6">
              {finalLeaderboard.map((entry, idx) => (
                <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border ${idx === 0 ? "bg-amber-400/10 border-amber-400/20" : "bg-surface-800 border-white/8"}`}>
                  <span className={`text-lg font-bold w-6 text-center ${idx === 0 ? "text-amber-400" : idx === 1 ? "text-slate-300" : idx === 2 ? "text-amber-700" : "text-slate-500"}`}>
                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">{entry.name || entry.user?.name || "Player"}</p>
                  </div>
                  <span className="text-primary-400 font-bold">{entry.score} pts</span>
                </div>
              ))}
              {finalLeaderboard.length === 0 && <p className="text-slate-500 text-center text-sm py-4">No submissions recorded</p>}
            </div>
            <Link to="/battle" className="block w-full py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-bold text-center hover:opacity-90 transition-opacity">
              Back to Lobby
            </Link>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="h-12 border-b border-white/8 bg-surface-900/90 backdrop-blur-xl flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/battle" className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" /><span className="text-xs hidden sm:block">Lobby</span>
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <Swords className="w-4 h-4 text-primary-400" />
          <span className="text-white font-bold text-sm truncate max-w-[200px]">{room?.name}</span>
          <span className="text-[10px] text-slate-500 font-mono bg-surface-800 px-2 py-0.5 rounded border border-white/10">{code}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Timer */}
          {roomStatus === "active" && (
            <div className={`flex items-center gap-1.5 font-mono font-bold text-sm ${timerColor}`}>
              <Timer className="w-4 h-4" />
              {formatTime(remainingSecs)}
            </div>
          )}
          {/* Start Button (creator, waiting) */}
          {isCreator && roomStatus === "waiting" && (
            <button onClick={handleStartRoom} disabled={isStarting}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-lg text-xs font-bold transition-all active:scale-95 disabled:opacity-40">
              {isStarting ? <Spinner /> : <Zap className="w-3.5 h-3.5" />}
              Start Battle
            </button>
          )}
          {roomStatus === "waiting" && !isCreator && (
            <span className="text-xs text-slate-400 px-3 py-1.5 bg-surface-800 rounded-lg border border-white/8">Waiting for host...</span>
          )}
          {roomStatus === "finished" && (
            <span className="text-xs text-rose-400 font-bold px-3 py-1.5 bg-rose-500/10 rounded-lg border border-rose-500/20">Battle Ended</span>
          )}
          {/* Run + Submit buttons */}
          {roomStatus === "active" && (
            <>
              <button onClick={handleRun} disabled={isRunning || isSubmitting || !selectedProblem}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-surface-800 hover:bg-surface-700 text-slate-300 hover:text-white border border-white/10 rounded-lg text-xs font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                id="battle-run-btn">
                {isRunning ? <Spinner /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                Run
              </button>
              <button onClick={handleSubmit} disabled={isSubmitting || isRunning || !selectedProblem}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-lg text-xs font-bold shadow-[0_0_12px_rgba(99,102,241,0.25)] transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                id="battle-submit-btn">
                {isSubmitting ? <Spinner /> : <Send className="w-3.5 h-3.5" />}
                Submit
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 overflow-hidden p-1.5">
        <PanelGroup orientation="horizontal" className="rounded-xl overflow-hidden border border-white/5">

          {/* LEFT: Problem list + description */}
          <Panel defaultSize={38} minSize={25} className="bg-surface-900 flex flex-col">
            {/* Problem tabs */}
            <div className="shrink-0 border-b border-white/8 px-2 py-2 bg-surface-800/60">
              <div className="flex items-center justify-between px-1 mb-2">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Problems</p>
                {problems.length > 1 && (
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => goToProblem(currentProblemIndex - 1)} disabled={currentProblemIndex <= 0}
                      className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30" title="Previous">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[10px] text-slate-500 font-mono min-w-[3rem] text-center">
                      {currentProblemIndex >= 0 ? currentProblemIndex + 1 : "–"}/{problems.length}
                    </span>
                    <button type="button" onClick={() => goToProblem(currentProblemIndex + 1)}
                      disabled={currentProblemIndex < 0 || currentProblemIndex >= problems.length - 1}
                      className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30" title="Next">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto scrollbar-thin">
                {problems.map((prob, idx) => {
                  const id = problemId(prob);
                  const solved = solvedSet.has(id);
                  const active = problemId(selectedProblem) === id;
                  return (
                    <button key={problemId(prob)} type="button" onClick={() => selectProblem(prob)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${active ? "bg-primary-500/15 border border-primary-500/25" : "hover:bg-white/4 border border-transparent"}`}>
                      <span className={`text-[10px] font-bold w-5 h-5 rounded flex items-center justify-center shrink-0 ${solved ? "bg-emerald-500/20 text-emerald-400" : "bg-white/8 text-slate-500"}`}>
                        {solved ? "✓" : idx + 1}
                      </span>
                      <span className="text-sm text-white truncate flex-1">{prob.title}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${DIFF_STYLE[prob.difficulty] || "text-slate-400"}`}>{prob.difficulty?.[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Problem description */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
              {selectedProblem ? (
                <>
                  <h1 className="text-lg font-bold text-white mb-2">{selectedProblem.title}</h1>
                  <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full border mb-4 ${DIFF_STYLE[selectedProblem.difficulty] || ""}`}>
                    {selectedProblem.difficulty}
                  </span>
                  <div className="prose prose-invert prose-slate max-w-none text-sm leading-relaxed
                    prose-code:text-accent-300 prose-code:bg-accent-500/10 prose-code:px-1 prose-code:rounded
                    prose-pre:bg-surface-950 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-lg"
                    dangerouslySetInnerHTML={{ __html: selectedProblem.description }} />
                  {selectedProblem.examples?.map((ex, i) => (
                    <div key={i} className="mt-4 rounded-lg border border-white/8 overflow-hidden">
                      <div className="px-3 py-1.5 bg-white/4 border-b border-white/8 text-[11px] text-slate-400 font-semibold">Example {i+1}</div>
                      <div className="p-3 font-mono text-xs space-y-1">
                        <div><span className="text-slate-500">Input: </span><span className="text-slate-200">{ex.input}</span></div>
                        <div><span className="text-slate-500">Output: </span><span className="text-emerald-400">{ex.output}</span></div>
                        {ex.explanation && <div><span className="text-slate-500">Explanation: </span><span className="text-slate-300">{ex.explanation}</span></div>}
                      </div>
                    </div>
                  ))}
                  {selectedProblem.constraints?.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-white mb-2">Constraints</h3>
                      <ul className="space-y-1">
                        {selectedProblem.constraints.map((c, i) => (
                          <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                            <span className="text-primary-400 mt-0.5">•</span>
                            <code className="bg-white/4 px-1.5 py-0.5 rounded text-slate-300">{c}</code>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-600 text-sm">Select a problem</div>
              )}
            </div>
          </Panel>

          <PanelResizeHandle className="w-1.5 bg-surface-950 hover:bg-primary-500/50 transition-colors cursor-col-resize flex items-center justify-center group">
            <GripVertical className="w-3 h-3 text-slate-600 group-hover:text-white" />
          </PanelResizeHandle>

          {/* CENTER: Editor + Terminal */}
          <Panel defaultSize={40} minSize={25}>
            <PanelGroup orientation="vertical">
              {/* Editor */}
              <Panel defaultSize={60} minSize={25} className="bg-surface-900 flex flex-col">
                <div className="flex items-center justify-between px-3 h-10 border-b border-white/8 bg-surface-800/60 shrink-0">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Code</span>
                  <select value={language} onChange={e => setLanguage(e.target.value)}
                    className="bg-surface-950 border border-white/10 text-xs text-slate-300 rounded-md px-2.5 py-1 outline-none focus:border-primary-500 cursor-pointer"
                    id="battle-language-select">
                    {Object.entries(LANGUAGES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                  </select>
                </div>
                <div className="flex-1 bg-[#1e1e1e]">
                  <Editor
                    height="100%"
                    language={LANGUAGES[language].monacoLang}
                    theme="vs-dark"
                    value={editorCode}
                    onChange={(val) => {
                      const newCode = val || "";
                      setEditorCode(newCode);
                      if (selectedProblem) {
                        setCodeByProblem((prev) => ({
                          ...prev,
                          [codeKey(problemId(selectedProblem), language)]: newCode,
                        }));
                      }
                    }}
                    options={{
                      minimap: { enabled: false }, fontSize: 14,
                      fontFamily: "'JetBrains Mono','Fira Code',monospace",
                      padding: { top: 12 }, scrollBeyondLastLine: false,
                      smoothScrolling: true, cursorBlinking: "smooth",
                      bracketPairColorization: { enabled: true },
                    }}
                  />
                </div>
              </Panel>

              <PanelResizeHandle className="h-1.5 bg-surface-950 hover:bg-primary-500/50 transition-colors cursor-row-resize flex items-center justify-center group">
                <GripVertical className="w-3 h-3 text-slate-600 group-hover:text-white rotate-90" />
              </PanelResizeHandle>

              {/* Terminal Panel with Tabs */}
              <Panel defaultSize={40} minSize={12} className="bg-[#0d0d0d] font-mono text-sm flex flex-col">
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
                          ? submitResult?.status === "Accepted"
                            ? "text-emerald-400 bg-emerald-500/10"
                            : submitResult?.status || submitResult?.error
                              ? "text-rose-400 bg-rose-500/10"
                              : "text-white bg-white/8"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      <Send className="w-3 h-3" /> Submission
                      {submitResult?.status === "Accepted" && (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-3 overflow-y-auto flex-1 scrollbar-thin text-slate-300">
                  {/* ── Test Results Tab ── */}
                  {terminalTab === "testcases" && (
                    <>
                      {!runOutput && !isRunning && (
                        <div className="text-slate-600 text-xs flex items-center gap-2 py-4">
                          <Play className="w-4 h-4" /> Press &quot;Run&quot; to test your code against sample test cases...
                        </div>
                      )}
                      {isRunning && (
                        <div className="flex items-center gap-2.5 text-primary-400 py-4">
                          <Spinner />
                          <span className="text-xs">Compiling & Executing...</span>
                        </div>
                      )}
                      {runOutput &&
                        runOutput.map((tc, idx) => (
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
                          <Spinner />
                          <span className="text-xs">Submitting & Grading against all test cases...</span>
                        </div>
                      )}
                      {submitResult && (
                        <div className="animate-fade-in">
                          <div className={`rounded-xl p-4 border mb-3 ${submitResult.status === "Accepted" ? "bg-emerald-500/8 border-emerald-500/20" : "bg-rose-500/8 border-rose-500/20"}`}>
                            <div className={`flex items-center gap-2 font-bold text-base ${submitResult.status === "Accepted" ? "text-emerald-400" : "text-rose-400"}`}>
                              {submitResult.status === "Accepted" ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                              {submitResult.status}
                            </div>
                            <div className="flex items-center gap-5 text-xs text-slate-400 mt-1">
                              {submitResult.data?.executionTimeMs > 0 && (
                                <span className="flex items-center gap-1">
                                  <Timer className="w-3.5 h-3.5" />
                                  Runtime: <span className="text-white font-medium">{submitResult.data.executionTimeMs.toFixed(1)} ms</span>
                                </span>
                              )}
                              {submitResult.data?.memoryUsedKb > 0 && (
                                <span className="flex items-center gap-1">
                                  <Cpu className="w-3.5 h-3.5" />
                                  Memory: <span className="text-white font-medium">{(submitResult.data.memoryUsedKb / 1024).toFixed(2)} MB</span>
                                </span>
                              )}
                            </div>
                          </div>
                          {submitResult.data?.failedTestCase && (
                            <div className="rounded-lg border border-rose-500/20 overflow-hidden">
                              <div className="px-3 py-1.5 text-[11px] font-bold text-rose-400 bg-rose-500/8 border-b border-rose-500/15">Failed Test Case</div>
                              <div className="p-3 space-y-2 text-[11px]">
                                <div><div className="text-slate-600 mb-0.5">Input</div><div className="bg-surface-900 rounded p-1.5 text-slate-300 whitespace-pre overflow-x-auto">{submitResult.data.failedTestCase.input}</div></div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div><div className="text-slate-600 mb-0.5">Expected</div><div className="bg-surface-900 rounded p-1.5 text-emerald-400 whitespace-pre overflow-x-auto">{submitResult.data.failedTestCase.expectedOutput}</div></div>
                                  <div><div className="text-slate-600 mb-0.5">Got</div><div className="bg-surface-900 rounded p-1.5 text-rose-400 whitespace-pre overflow-x-auto">{submitResult.data.failedTestCase.actualOutput || "No output"}</div></div>
                                </div>
                              </div>
                            </div>
                          )}
                          {submitResult.error && (
                            <div className="text-rose-400 text-xs mt-2">{submitResult.error}</div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Panel>
            </PanelGroup>
          </Panel>

          <PanelResizeHandle className="w-1.5 bg-surface-950 hover:bg-primary-500/50 transition-colors cursor-col-resize flex items-center justify-center group">
            <GripVertical className="w-3 h-3 text-slate-600 group-hover:text-white" />
          </PanelResizeHandle>

          {/* RIGHT: Leaderboard */}
          <Panel defaultSize={22} minSize={16} className="bg-surface-900 flex flex-col">
            <div className="shrink-0 px-4 py-3 border-b border-white/8 bg-surface-800/60">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                <Trophy className="w-3.5 h-3.5 text-amber-400" /> Leaderboard
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {leaderboard.length === 0 ? (
                <div className="text-slate-600 text-xs text-center py-8 flex flex-col items-center gap-2">
                  <Users className="w-8 h-8" />
                  <span>Waiting for players...</span>
                </div>
              ) : leaderboard.map((entry, idx) => {
                const isMe = String(entry.userId) === String(user?.id);
                return (
                  <div key={entry.userId || idx}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all ${isMe ? "bg-primary-500/10 border-primary-500/25" : "bg-surface-800/60 border-white/6"}`}>
                    <span className={`text-sm font-bold w-5 text-center ${idx === 0 ? "text-amber-400" : idx === 1 ? "text-slate-300" : idx === 2 ? "text-amber-700" : "text-slate-600"}`}>
                      {idx === 0 ? "🥇" : idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${isMe ? "text-primary-300" : "text-white"}`}>
                        {entry.name || entry.user?.name || "Player"}
                        {isMe && <span className="text-[10px] text-slate-500"> (you)</span>}
                      </p>
                      <p className="text-[10px] text-slate-500">{entry.solved || entry.solvedProblems || 0} solved</p>
                    </div>
                    <span className="text-primary-400 font-bold text-sm">{entry.score}</span>
                  </div>
                );
              })}
            </div>
            {/* Participants count */}
            <div className="shrink-0 px-4 py-2.5 border-t border-white/8">
              <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {room?.participants?.length || 0} participants
              </p>
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
