import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { getAllProblems, getTags } from "../../services/api";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  CircleDot,
  Tag,
  X,
  ArrowUpDown,
  BarChart3,
  Flame,
  Zap,
} from "lucide-react";

/* ───── Difficulty Helpers ───── */
const DIFFICULTY_CONFIG = {
  Easy: { color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", glow: "shadow-emerald-500/10" },
  Medium: { color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", glow: "shadow-amber-500/10" },
  Hard: { color: "text-rose-400", bg: "bg-rose-400/10", border: "border-rose-400/20", glow: "shadow-rose-500/10" },
};

const getDifficultyStyle = (diff) => DIFFICULTY_CONFIG[diff] || { color: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400/20", glow: "" };

/* ───── Status Icon Component ───── */
function StatusIcon({ state }) {
  if (!state || !state.attempted) {
    return <Circle className="w-[18px] h-[18px] text-slate-600" />;
  }
  if (state.submittedSuccessfully) {
    return <CheckCircle2 className="w-[18px] h-[18px] text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]" />;
  }
  return <CircleDot className="w-[18px] h-[18px] text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]" />;
}

/* ───── Sort Options ───── */
const SORT_OPTIONS = [
  { value: "", label: "Default" },
  { value: "title", label: "Title (A-Z)" },
  { value: "difficulty", label: "Difficulty" },
  { value: "acceptance", label: "Acceptance %" },
  { value: "recent", label: "Recently Added" },
];

export default function Problems() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters & Sorting
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [tags, setTags] = useState([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Dropdowns
  const [showDiffDropdown, setShowDiffDropdown] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Auth
  const user = JSON.parse(localStorage.getItem("codesetu_user") || "null");

  // Fetch tags on mount
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await getTags();
        setTags(res.data?.tags || []);
      } catch { /* tags are optional */ }
    };
    fetchTags();
  }, []);

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch problems
  const fetchProblems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit: 20 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (difficulty) params.difficulty = difficulty;
      if (selectedTag) params.tag = selectedTag;
      if (sortBy) params.sortBy = sortBy;
      if (user?.id) params.userId = user.id;

      const res = await getAllProblems(params);
      setProblems(res.data?.problems || []);
      setTotalPages(res.totalPages || 1);
      setTotal(res.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, difficulty, selectedTag, sortBy]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = () => {
      setShowDiffDropdown(false);
      setShowTagDropdown(false);
      setShowSortDropdown(false);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const clearFilters = () => {
    setSearch("");
    setDifficulty("");
    setSelectedTag("");
    setSortBy("");
    setPage(1);
  };

  const hasActiveFilters = search || difficulty || selectedTag || sortBy;

  // Stats
  const solvedCount = problems.filter((p) => p.userProblemState?.submittedSuccessfully).length;

  return (
    <div className="min-h-screen bg-surface-950 relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-0 left-0 right-0 h-[600px] bg-mesh grid-pattern opacity-40 pointer-events-none" />
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-primary-600/8 rounded-full blur-[100px] animate-float-slow pointer-events-none" />
      <div className="absolute bottom-40 right-1/4 w-[400px] h-[400px] bg-accent-500/6 rounded-full blur-[100px] animate-float-slower pointer-events-none" />

      <Navbar />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* ─── Header ─── */}
        <div className="mb-10 animate-slide-up">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 tracking-tight">
                Problem<span className="gradient-text">set</span>
              </h1>
              <p className="text-base text-slate-400 max-w-xl">
                Sharpen your coding skills with our curated collection. Filter by difficulty, topics, or search for specific problems.
              </p>
            </div>
            {/* Quick Stats */}
            <div className="flex items-center gap-6">
              <div className="glass rounded-xl px-5 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary-500/15 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <div className="text-lg font-bold text-white">{total}</div>
                  <div className="text-xs text-slate-500">Total Problems</div>
                </div>
              </div>
              {user && (
                <div className="glass rounded-xl px-5 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-emerald-400">{solvedCount}</div>
                    <div className="text-xs text-slate-500">Solved</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Filters Bar ─── */}
        <div className="glass rounded-2xl p-4 mb-6 animate-slide-up-delay relative z-20">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search problems by title..."
                className="w-full pl-10 pr-4 py-2.5 bg-surface-950/60 border border-white/8 rounded-xl text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-primary-500/50 focus:bg-surface-950/80 transition-all"
                id="problem-search"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Difficulty Filter */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => { setShowDiffDropdown(!showDiffDropdown); setShowTagDropdown(false); setShowSortDropdown(false); }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                    difficulty
                      ? `${getDifficultyStyle(difficulty).bg} ${getDifficultyStyle(difficulty).color} ${getDifficultyStyle(difficulty).border}`
                      : "bg-surface-950/60 text-slate-400 border-white/8 hover:border-white/15 hover:text-slate-200"
                  }`}
                  id="difficulty-filter"
                >
                  <Flame className="w-4 h-4" />
                  {difficulty || "Difficulty"}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDiffDropdown ? "rotate-180" : ""}`} />
                </button>
                {showDiffDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-44 glass rounded-xl border border-white/10 shadow-2xl z-50 py-1.5 animate-scale-in">
                    <button
                      onClick={() => { setDifficulty(""); setShowDiffDropdown(false); setPage(1); }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${!difficulty ? "text-primary-400 bg-primary-500/10" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
                    >All Difficulties</button>
                    {["Easy", "Medium", "Hard"].map((d) => {
                      const style = getDifficultyStyle(d);
                      return (
                        <button
                          key={d}
                          onClick={() => { setDifficulty(d); setShowDiffDropdown(false); setPage(1); }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2 ${difficulty === d ? `${style.color} ${style.bg}` : "text-slate-400 hover:text-white hover:bg-white/5"}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${style.bg} ${style.border} border`} />
                          {d}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Topic Tag Filter */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => { setShowTagDropdown(!showTagDropdown); setShowDiffDropdown(false); setShowSortDropdown(false); }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                    selectedTag
                      ? "bg-primary-500/10 text-primary-300 border-primary-500/20"
                      : "bg-surface-950/60 text-slate-400 border-white/8 hover:border-white/15 hover:text-slate-200"
                  }`}
                  id="tag-filter"
                >
                  <Tag className="w-4 h-4" />
                  {selectedTag || "Topics"}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showTagDropdown ? "rotate-180" : ""}`} />
                </button>
                {showTagDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-56 glass rounded-xl border border-white/10 shadow-2xl z-50 py-1.5 max-h-72 overflow-y-auto scrollbar-thin animate-scale-in">
                    <button
                      onClick={() => { setSelectedTag(""); setShowTagDropdown(false); setPage(1); }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${!selectedTag ? "text-primary-400 bg-primary-500/10" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
                    >All Topics</button>
                    {tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => { setSelectedTag(tag); setShowTagDropdown(false); setPage(1); }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${selectedTag === tag ? "text-primary-400 bg-primary-500/10" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
                      >{tag}</button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sort */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => { setShowSortDropdown(!showSortDropdown); setShowDiffDropdown(false); setShowTagDropdown(false); }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                    sortBy
                      ? "bg-accent-500/10 text-accent-300 border-accent-500/20"
                      : "bg-surface-950/60 text-slate-400 border-white/8 hover:border-white/15 hover:text-slate-200"
                  }`}
                  id="sort-select"
                >
                  <ArrowUpDown className="w-4 h-4" />
                  {SORT_OPTIONS.find((o) => o.value === sortBy)?.label || "Sort"}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSortDropdown ? "rotate-180" : ""}`} />
                </button>
                {showSortDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-48 glass rounded-xl border border-white/10 shadow-2xl z-50 py-1.5 animate-scale-in">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setSortBy(opt.value); setShowSortDropdown(false); setPage(1); }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${sortBy === opt.value ? "text-accent-400 bg-accent-500/10" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
                      >{opt.label}</button>
                    ))}
                  </div>
                )}
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium text-red-400 bg-red-500/8 border border-red-500/15 hover:bg-red-500/15 transition-all"
                  id="clear-filters"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Active filter pills */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5 flex-wrap">
              <span className="text-xs text-slate-500 mr-1">Active:</span>
              {difficulty && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${getDifficultyStyle(difficulty).bg} ${getDifficultyStyle(difficulty).color} ${getDifficultyStyle(difficulty).border} border`}>
                  {difficulty}
                  <button onClick={() => { setDifficulty(""); setPage(1); }}><X className="w-3 h-3" /></button>
                </span>
              )}
              {selectedTag && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-primary-500/10 text-primary-300 border border-primary-500/20">
                  {selectedTag}
                  <button onClick={() => { setSelectedTag(""); setPage(1); }}><X className="w-3 h-3" /></button>
                </span>
              )}
              {sortBy && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-accent-500/10 text-accent-300 border border-accent-500/20">
                  Sort: {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
                  <button onClick={() => { setSortBy(""); setPage(1); }}><X className="w-3 h-3" /></button>
                </span>
              )}
              {search && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 text-slate-300 border border-white/10">
                  &ldquo;{search}&rdquo;
                  <button onClick={() => { setSearch(""); setPage(1); }}><X className="w-3 h-3" /></button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* ─── Problems Table ─── */}
        <div className="glass rounded-2xl shadow-glass border border-white/5 overflow-hidden animate-slide-up-delay">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-3 px-5 py-3.5 border-b border-white/8 bg-surface-900/60">
            <div className="col-span-1 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-center">
              Status
            </div>
            <div className="col-span-5 md:col-span-5 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center">
              Title
            </div>
            <div className="hidden md:flex col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wider items-center">
              Topics
            </div>
            <div className="col-span-3 md:col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-center">
              Difficulty
            </div>
            <div className="hidden md:flex col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wider items-center justify-end pr-2">
              Acceptance
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-primary-500/20 border-t-primary-500 animate-spin" />
                <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-accent-500/10 border-b-accent-500/40 animate-spin-slow" />
              </div>
              <p className="text-slate-500 text-sm mt-4 font-mono">Loading problems...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="py-20 text-center">
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <X className="w-7 h-7 text-red-400" />
              </div>
              <p className="text-red-400 font-medium mb-1">Failed to load problems</p>
              <p className="text-slate-500 text-sm">{error}</p>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && problems.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-14 h-14 rounded-full bg-slate-500/10 flex items-center justify-center mx-auto mb-4">
                <Search className="w-7 h-7 text-slate-500" />
              </div>
              <p className="text-slate-300 font-medium mb-1">No problems found</p>
              <p className="text-slate-500 text-sm">Try adjusting your filters or search term.</p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="mt-4 text-sm text-primary-400 hover:text-primary-300 transition-colors">
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Problem Rows */}
          <div className="divide-y divide-white/[0.04]">
            {!loading &&
              problems.map((prob, idx) => {
                const diffStyle = getDifficultyStyle(prob.difficulty);
                return (
                  <Link
                    to={`/problems/${prob.slug}`}
                    key={prob._id}
                    className="grid grid-cols-12 gap-3 px-5 py-4 items-center hover:bg-white/[0.025] transition-all duration-200 group cursor-pointer"
                    style={{ animationDelay: `${idx * 30}ms` }}
                    id={`problem-row-${prob.slug}`}
                  >
                    {/* Status */}
                    <div className="col-span-1 flex items-center justify-center">
                      <StatusIcon state={prob.userProblemState} />
                    </div>

                    {/* Title */}
                    <div className="col-span-5 md:col-span-5 min-w-0">
                      <div className="font-medium text-slate-200 group-hover:text-white transition-colors truncate text-[15px]">
                        {prob.order ? `${prob.order}. ` : ""}{prob.title}
                      </div>
                    </div>

                    {/* Topic Tags */}
                    <div className="hidden md:flex col-span-2 gap-1.5 flex-wrap">
                      {(prob.topicTags || []).slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-[10px] font-medium text-slate-400 bg-white/[0.04] rounded border border-white/[0.06] whitespace-nowrap"
                        >{tag}</span>
                      ))}
                      {(prob.topicTags || []).length > 2 && (
                        <span className="px-1.5 py-0.5 text-[10px] text-slate-500">+{prob.topicTags.length - 2}</span>
                      )}
                    </div>

                    {/* Difficulty */}
                    <div className="col-span-3 md:col-span-2 flex items-center justify-center">
                      <span className={`inline-flex items-center justify-center px-3 py-1 text-xs font-semibold rounded-full border ${diffStyle.bg} ${diffStyle.color} ${diffStyle.border}`}>
                        {prob.difficulty || "Unknown"}
                      </span>
                    </div>

                    {/* Acceptance Rate */}
                    <div className="hidden md:flex col-span-2 items-center justify-end pr-2">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              (prob.acceptanceRate || 0) >= 60 ? "bg-emerald-500/70" :
                              (prob.acceptanceRate || 0) >= 30 ? "bg-amber-500/70" : "bg-rose-500/70"
                            }`}
                            style={{ width: `${prob.acceptanceRate || 0}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-slate-400 w-12 text-right">
                          {prob.acceptanceRate != null ? `${prob.acceptanceRate}%` : "—"}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>

        {/* ─── Pagination ─── */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 animate-fade-in">
            <div className="text-sm text-slate-500">
              Page <span className="text-slate-300 font-medium">{page}</span> of{" "}
              <span className="text-slate-300 font-medium">{totalPages}</span>
              <span className="hidden sm:inline"> · {total} total problems</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-surface-900/60 border border-white/8 text-slate-400 hover:text-white hover:border-white/15 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                id="prev-page"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>

              {/* Page numbers */}
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                        pageNum === page
                          ? "bg-primary-500/20 text-primary-300 border border-primary-500/30"
                          : "text-slate-500 hover:text-white hover:bg-white/5"
                      }`}
                    >{pageNum}</button>
                  );
                })}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-surface-900/60 border border-white/8 text-slate-400 hover:text-white hover:border-white/15 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                id="next-page"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
