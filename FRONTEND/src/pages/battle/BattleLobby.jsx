import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Shield, Globe, Lock, Plus, Users, Clock, Zap, ChevronRight, ChevronLeft,
  RefreshCw, Hash, ArrowRight, Trophy, Swords
} from "lucide-react";
import { createRoom, joinRoom, listPublicRooms } from "../../services/battleApi";

const DIFFICULTY_COLORS = {
  Easy: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  Medium: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  Hard: "text-rose-400 bg-rose-400/10 border-rose-400/20",
};

function StatusBadge({ status }) {
  if (status === "waiting")
    return <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">Waiting</span>;
  if (status === "active")
    return <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 animate-pulse">Live</span>;
  return <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-slate-500/15 text-slate-400 border border-slate-500/20">Finished</span>;
}

export default function BattleLobby() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("codesetu_user") || "null");

  // Create form state
  const [tab, setTab] = useState("join"); // "join" | "create"
  const [createForm, setCreateForm] = useState({
    name: "",
    isPrivate: false,
    password: "",
    durationMinutes: 30,
    questionConfig: { easy: 1, medium: 1, hard: 1 },
  });
  const [joinCode, setJoinCode] = useState("");
  const [joinPassword, setJoinPassword] = useState("");

  const [publicRooms, setPublicRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");

  const fetchPublicRooms = async () => {
    setLoadingRooms(true);
    try {
      const res = await listPublicRooms();
      setPublicRooms(res.data?.rooms || []);
    } catch {
      setPublicRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    fetchPublicRooms();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!user) { navigate("/login"); return; }
    setError("");
    setIsCreating(true);
    try {
      const res = await createRoom({
        name: createForm.name,
        isPrivate: createForm.isPrivate,
        password: createForm.isPrivate ? createForm.password : undefined,
        durationMinutes: Number(createForm.durationMinutes),
        questionConfig: {
          easy: Number(createForm.questionConfig.easy),
          medium: Number(createForm.questionConfig.medium),
          hard: Number(createForm.questionConfig.hard),
        },
      });
      const code = res.data?.room?.roomCode;
      if (code) navigate(`/battle/${code}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = async (e, codeOverride) => {
    e?.preventDefault();
    if (!user) { navigate("/login"); return; }
    setError("");
    const code = codeOverride || joinCode.trim().toUpperCase();
    if (!code) { setError("Enter a room code"); return; }
    setIsJoining(true);
    try {
      await joinRoom(code, joinPassword || undefined);
      navigate(`/battle/${code}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsJoining(false);
    }
  };

  const updateQConfig = (key, val) => {
    const n = Math.max(0, Math.min(5, Number(val)));
    setCreateForm((f) => ({ ...f, questionConfig: { ...f.questionConfig, [key]: n } }));
  };

  return (
    <div className="min-h-screen bg-surface-950 text-white font-sans">
      {/* Header */}
      <div className="border-b border-white/8 bg-surface-900/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/problems"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-300 hover:text-white bg-surface-800/90 hover:bg-surface-700 border border-white/10 rounded-lg transition-all active:scale-95"
            id="battle-back-btn"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Problems</span>
          </Link>
          <div className="h-5 w-px bg-white/10" />
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow">
            <Swords className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Battle Arena</h1>
            <p className="text-[11px] text-slate-500">Multiplayer Coding Battles</p>
          </div>
        </div>
        {user && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-[11px] font-bold">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <span>{user.name}</span>
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: Create/Join panel */}
        <div className="lg:col-span-2">
          {/* Tabs */}
          <div className="flex bg-surface-900 rounded-xl p-1 mb-6 border border-white/8">
            {[
              { id: "join", label: "Join Room", icon: ArrowRight },
              { id: "create", label: "Create Room", icon: Plus },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setTab(id); setError(""); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  tab === id
                    ? "bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-md"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
              {error}
            </div>
          )}

          {/* Join Room */}
          {tab === "join" && (
            <form onSubmit={handleJoin} className="bg-surface-900 rounded-2xl border border-white/8 p-6 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Hash className="w-4 h-4 text-primary-400" /> Enter Room Code
              </h2>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Room Code</label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ABC123"
                  maxLength={6}
                  className="w-full bg-surface-800 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-mono tracking-widest uppercase text-center focus:outline-none focus:border-primary-500 transition-colors placeholder:text-slate-600 placeholder:tracking-normal placeholder:text-sm placeholder:font-sans"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Password (if private room)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={joinPassword}
                    onChange={(e) => setJoinPassword(e.target.value)}
                    placeholder="Leave blank for public rooms"
                    className="w-full bg-surface-800 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-primary-500 transition-colors placeholder:text-slate-600"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isJoining || !joinCode}
                className="w-full py-3 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-glow"
              >
                {isJoining ? (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                ) : (
                  <><ArrowRight className="w-4 h-4" /> Join Battle</>
                )}
              </button>
            </form>
          )}

          {/* Create Room */}
          {tab === "create" && (
            <form onSubmit={handleCreate} className="bg-surface-900 rounded-2xl border border-white/8 p-6 space-y-5">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary-400" /> Create a Battle Room
              </h2>

              {/* Room Name */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Room Name</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Epic Coding Battle"
                  maxLength={60}
                  required
                  className="w-full bg-surface-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary-500 transition-colors placeholder:text-slate-600"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">
                  <Clock className="inline w-3.5 h-3.5 mr-1" />
                  Time Limit: <span className="text-primary-400 font-bold">{createForm.durationMinutes} min</span>
                </label>
                <input
                  type="range" min="5" max="120" step="5"
                  value={createForm.durationMinutes}
                  onChange={(e) => setCreateForm((f) => ({ ...f, durationMinutes: e.target.value }))}
                  className="w-full accent-primary-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
                  <span>5 min</span><span>60 min</span><span>120 min</span>
                </div>
              </div>

              {/* Question Config */}
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Questions Per Difficulty</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "easy", label: "Easy", color: "text-emerald-400" },
                    { key: "medium", label: "Medium", color: "text-amber-400" },
                    { key: "hard", label: "Hard", color: "text-rose-400" },
                  ].map(({ key, label, color }) => (
                    <div key={key} className="bg-surface-800 rounded-xl p-3 border border-white/8 text-center">
                      <div className={`text-[11px] font-semibold mb-2 ${color}`}>{label}</div>
                      <div className="flex items-center justify-center gap-2">
                        <button type="button" onClick={() => updateQConfig(key, createForm.questionConfig[key] - 1)}
                          className="w-5 h-5 rounded bg-white/8 hover:bg-white/15 text-white text-sm flex items-center justify-center font-bold transition-colors">−</button>
                        <span className="text-white font-bold text-base w-4 text-center">{createForm.questionConfig[key]}</span>
                        <button type="button" onClick={() => updateQConfig(key, createForm.questionConfig[key] + 1)}
                          className="w-5 h-5 rounded bg-white/8 hover:bg-white/15 text-white text-sm flex items-center justify-center font-bold transition-colors">+</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Privacy Toggle */}
              <div className="flex items-center justify-between bg-surface-800 rounded-xl px-4 py-3 border border-white/8">
                <div className="flex items-center gap-2.5">
                  {createForm.isPrivate ? <Lock className="w-4 h-4 text-amber-400" /> : <Globe className="w-4 h-4 text-emerald-400" />}
                  <div>
                    <p className="text-sm font-semibold text-white">{createForm.isPrivate ? "Private Room" : "Public Room"}</p>
                    <p className="text-[11px] text-slate-500">{createForm.isPrivate ? "Password required to join" : "Anyone can join"}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCreateForm((f) => ({ ...f, isPrivate: !f.isPrivate, password: "" }))}
                  className={`w-11 h-6 rounded-full transition-all relative ${createForm.isPrivate ? "bg-primary-500" : "bg-white/15"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${createForm.isPrivate ? "left-5" : "left-0.5"}`} />
                </button>
              </div>

              {/* Password input */}
              {createForm.isPrivate && (
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Room Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      value={createForm.password}
                      onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                      placeholder="Set a password"
                      required={createForm.isPrivate}
                      className="w-full bg-surface-800 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-primary-500 transition-colors placeholder:text-slate-600"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isCreating}
                className="w-full py-3 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-glow"
              >
                {isCreating ? (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                ) : (
                  <><Zap className="w-4 h-4" /> Create Battle Room</>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Right: Public Rooms list */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary-400" /> Public Battle Rooms
            </h2>
            <button
              onClick={fetchPublicRooms}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-surface-800 hover:bg-surface-700 border border-white/8 rounded-lg transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {loadingRooms ? (
            <div className="flex items-center justify-center py-20">
              <svg className="animate-spin w-8 h-8 text-primary-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            </div>
          ) : publicRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-surface-900 rounded-2xl border border-white/6">
              <Trophy className="w-14 h-14 text-slate-700 mb-4" />
              <p className="text-slate-400 font-semibold mb-1">No active public rooms</p>
              <p className="text-slate-600 text-sm">Create one and invite your friends!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {publicRooms.map((room) => (
                <div
                  key={room._id}
                  className="group bg-surface-900 rounded-2xl border border-white/8 p-5 hover:border-primary-500/30 hover:bg-surface-800/60 transition-all cursor-pointer"
                  onClick={() => handleJoin(null, room.roomCode)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge status={room.status} />
                        <span className="text-[11px] text-slate-600 font-mono">{room.roomCode}</span>
                      </div>
                      <h3 className="text-base font-bold text-white group-hover:text-primary-300 transition-colors">{room.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">by {room.createdBy?.name}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-primary-400 transition-colors mt-1" />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {room.participants?.length || 0} Players
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {room.durationMinutes} min
                    </span>
                    <div className="flex items-center gap-1.5 ml-auto">
                      {room.questionConfig?.easy > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded border text-emerald-400 bg-emerald-400/10 border-emerald-400/20">{room.questionConfig.easy}E</span>
                      )}
                      {room.questionConfig?.medium > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded border text-amber-400 bg-amber-400/10 border-amber-400/20">{room.questionConfig.medium}M</span>
                      )}
                      {room.questionConfig?.hard > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded border text-rose-400 bg-rose-400/10 border-rose-400/20">{room.questionConfig.hard}H</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
