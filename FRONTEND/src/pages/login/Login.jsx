import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../../services/api";

/* ───── SVG Icons ───── */
const EyeIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const data = await loginUser(form.email, form.password);
      localStorage.setItem("codesetu_token", data.token);
      localStorage.setItem("codesetu_user", JSON.stringify(data.user));
      setSuccess("Login successful! Redirecting...");
      setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex">
      {/* ─── Left Panel – Branding ─── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-mesh-dense">
        {/* Background Orbs */}
        <div className="absolute top-20 left-10 w-80 h-80 bg-primary-600/20 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-float-slower" />
        <div className="absolute inset-0 grid-pattern opacity-40" />

        <div className="relative z-10 flex flex-col items-center justify-center w-full px-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow">
              <span className="text-white font-bold text-xl">&lt;/&gt;</span>
            </div>
            <span className="text-3xl font-bold text-white tracking-tight">
              Code<span className="gradient-text">Setu</span>
            </span>
          </Link>

          {/* Illustration: Code Snippet */}
          <div className="glass rounded-2xl p-6 max-w-sm w-full shadow-glass animate-float mb-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-auto text-xs text-slate-500 font-mono">welcome.js</span>
            </div>
            <div className="font-mono text-sm leading-7 text-slate-300">
              <div><span className="text-primary-400">const</span> <span className="text-accent-400">developer</span> = {'{'}</div>
              <div className="pl-6"><span className="text-slate-400">name:</span> <span className="text-green-400">&quot;You&quot;</span>,</div>
              <div className="pl-6"><span className="text-slate-400">status:</span> <span className="text-green-400">&quot;Ready to code&quot;</span>,</div>
              <div className="pl-6"><span className="text-slate-400">platform:</span> <span className="text-green-400">&quot;CodeSetu&quot;</span></div>
              <div>{'}'}</div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white text-center mb-3">Welcome Back, Developer</h2>
          <p className="text-slate-400 text-center text-sm max-w-xs">
            Pick up right where you left off. Your code and progress are waiting for you.
          </p>
        </div>
      </div>

      {/* ─── Right Panel – Form ─── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-scale-in">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-10">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">&lt;/&gt;</span>
              </div>
              <span className="text-xl font-bold text-white">
                Code<span className="gradient-text">Setu</span>
              </span>
            </Link>
          </div>

          <h1 className="text-3xl font-extrabold text-white mb-2">Sign In</h1>
          <p className="text-slate-400 mb-8">Enter your credentials to access your account.</p>

          {/* Error / Success */}
          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium animate-slide-up">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium animate-slide-up">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="input-field"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPass ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="input-field pr-12"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPass ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-base !py-4"
            >
              {loading ? (
                <>
                  <Spinner />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-slate-500 font-medium">New to CodeSetu?</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Register Link */}
          <Link
            to="/register"
            className="btn-secondary w-full text-sm justify-center"
          >
            Create an Account
          </Link>

          {/* Back */}
          <p className="text-center mt-8">
            <Link to="/" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
              ← Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
