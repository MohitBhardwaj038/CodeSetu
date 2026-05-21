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
            <Link to="/battle" className="text-sm font-medium text-slate-400 hover:text-white transition-colors duration-200 flex items-center gap-1.5">
              {/* <svg className="w-3.5 h-3.5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 0 1-.657.643 48.39 48.39 0 0 1-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 0 1-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 0 0-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 0 1-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 0 0 .657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 0 1-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 0 0 5.427-.63 48.05 48.05 0 0 0 .582-4.717.532.532 0 0 0-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.036 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.369 0 .713.128 1.003.349.283.215.604.401.959.401v0a.656.656 0 0 0 .658-.663 48.422 48.422 0 0 0-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 0 1-.61-.58v0Z" />
              </svg> */}
              Battle Arena
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
              <Link to="/battle" className="px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-all flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                ⚔️ Battle Arena
              </Link>
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
