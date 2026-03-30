import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { getAllProblems } from "../../services/api";

export default function Problems() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const data = await getAllProblems();
        setProblems(data.data.problems || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProblems();
  }, []);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "text-green-400 bg-green-400/10 border-green-400/20";
      case "medium":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      case "hard":
        return "text-red-400 bg-red-400/10 border-red-400/20";
      default:
        return "text-slate-400 bg-slate-400/10 border-slate-400/20";
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 relative overflow-hidden">
      {/* Background Orbs & Mesh */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-mesh grid-pattern opacity-50 pointer-events-none" />
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl animate-float-slow pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-float-slower pointer-events-none" />

      <Navbar />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="mb-12 animate-slide-up">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Explore <span className="gradient-text">Problems</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl">
            Sharpen your coding skills with our curated collection of problems. From arrays to dynamic programming, master it all.
          </p>
        </div>

        {/* Problems Table / List */}
        <div className="glass rounded-2xl shadow-glass border border-white/5 overflow-hidden animate-slide-up-delay">
          
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/10 bg-surface-900/50">
            <div className="col-span-1 text-sm font-semibold text-slate-400 uppercase tracking-wider">Status</div>
            <div className="col-span-8 md:col-span-7 text-sm font-semibold text-slate-400 uppercase tracking-wider">Title</div>
            <div className="col-span-3 md:col-span-2 text-sm font-semibold text-slate-400 uppercase tracking-wider text-center">Difficulty</div>
            <div className="hidden md:block col-span-2 text-sm font-semibold text-slate-400 uppercase tracking-wider text-right">Action</div>
          </div>

          {/* Loading & Error States */}
          {loading && (
            <div className="flex justify-center items-center py-20">
              <svg className="animate-spin h-8 w-8 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          )}
          {error && (
            <div className="py-20 text-center text-red-400 font-medium">
              Error fetching problems: {error}
            </div>
          )}
          {!loading && !error && problems.length === 0 && (
            <div className="py-20 text-center text-slate-400 font-medium">
              No problems found. Check back later!
            </div>
          )}

          {/* List */}
          <div className="divide-y divide-white/5">
            {!loading && problems.map((prob) => (
              <Link
                to={`/problems/${prob.slug}`}
                key={prob._id}
                className="grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-white/[0.02] transition-colors group cursor-pointer"
              >
                <div className="col-span-1 flex items-center">
                  {/* Mock Status Icon (Unsolved circle) */}
                  <div className="w-5 h-5 rounded-full border-2 border-slate-600 group-hover:border-primary-400 transition-colors" />
                </div>
                <div className="col-span-8 md:col-span-7 font-medium text-slate-200 group-hover:text-white transition-colors truncate pr-4">
                  {prob.title}
                </div>
                <div className="col-span-3 md:col-span-2 text-center">
                  <span className={`inline-flex items-center justify-center px-2.5 py-1 text-xs font-semibold rounded-full border ${getDifficultyColor(prob.difficulty)}`}>
                    {prob.difficulty || "Unknown"}
                  </span>
                </div>
                <div className="hidden md:flex col-span-2 justify-end">
                  <span className="text-sm font-medium text-primary-400 group-hover:text-accent-400 transition-colors">
                    Solve
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
