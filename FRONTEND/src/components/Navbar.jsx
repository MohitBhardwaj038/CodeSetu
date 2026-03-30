import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const ArrowRightIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
  </svg>
);

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  // Get user from local storage
  const user = JSON.parse(localStorage.getItem("codesetu_user"));

  const handleLogout = () => {
    localStorage.removeItem("codesetu_token");
    localStorage.removeItem("codesetu_user");
    navigate("/");
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-surface-900/80 backdrop-blur-xl border-b border-primary-500/10 shadow-lg shadow-primary-900/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center group-hover:shadow-glow transition-shadow duration-300">
              <span className="text-white font-bold text-lg">&lt;/&gt;</span>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Code<span className="gradient-text">Setu</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/problems" className="text-sm font-medium text-slate-400 hover:text-white transition-colors duration-200">
              Problemset
            </Link>
            <a href="/#features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors duration-200">
              Features
            </a>
            <a href="/#how-it-works" className="text-sm font-medium text-slate-400 hover:text-white transition-colors duration-200">
              How it Works
            </a>
          </div>

          {/* Auth Buttons / Profile */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold shadow-md">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-slate-200">{user.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-red-400 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-5 py-2.5 text-sm font-semibold text-slate-300 hover:text-white transition-colors duration-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn-primary !px-6 !py-2.5 text-sm"
                >
                  Get Started
                  <ArrowRightIcon />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden pb-6 animate-slide-up">
            <div className="flex flex-col gap-3 pt-2">
              <Link to="/problems" className="px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-all" onClick={() => setMobileOpen(false)}>Problemset</Link>
              <a href="/#features" className="px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-all" onClick={() => setMobileOpen(false)}>Features</a>
              <a href="/#how-it-works" className="px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-all" onClick={() => setMobileOpen(false)}>How it Works</a>
              <hr className="border-white/10 my-2" />
              {user ? (
                <>
                  <div className="px-4 py-2 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-slate-200">{user.name}</span>
                  </div>
                  <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="text-left px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-white/5 rounded-lg transition-all">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white transition-colors" onClick={() => setMobileOpen(false)}>Sign In</Link>
                  <Link to="/register" className="btn-primary text-sm mx-4" onClick={() => setMobileOpen(false)}>Get Started</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
