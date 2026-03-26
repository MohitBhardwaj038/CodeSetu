import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerRequest, verifyOtp } from "../../services/api";

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

const CheckCircle = () => (
  <svg className="w-20 h-20 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

/* ───── Step Indicator ───── */
function StepIndicator({ currentStep }) {
  const steps = [
    { num: 1, label: "Your Info" },
    { num: 2, label: "Verify OTP" },
    { num: 3, label: "Done" },
  ];

  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {steps.map((step, i) => (
        <div key={step.num} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                currentStep > step.num
                  ? "bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                  : currentStep === step.num
                  ? "bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-glow"
                  : "bg-surface-800 text-slate-500 border border-white/10"
              }`}
            >
              {currentStep > step.num ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              ) : (
                step.num
              )}
            </div>
            <span className={`text-xs mt-2 font-medium ${currentStep >= step.num ? "text-white" : "text-slate-600"}`}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`w-16 sm:w-24 h-0.5 mx-2 mb-6 rounded transition-all duration-500 ${
                currentStep > step.num
                  ? "bg-green-500"
                  : "bg-white/10"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════ */
/* ═════  REGISTER PAGE  ════════════ */
/* ═══════════════════════════════════ */

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Step 1 fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Step 2 fields
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const clearMessages = () => {
    setError("");
    setSuccessMsg("");
  };

  /* ── Step 1: Request OTP ── */
  const handleStep1 = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!name.trim() || !email.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }

    setLoading(true);
    try {
      const data = await registerRequest(name.trim(), email.trim());
      setSuccessMsg(data.message);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 2: Verify OTP & Set Password ── */
  const handleStep2 = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!otp || !password || !confirmPass) {
      setError("Please fill in all fields.");
      return;
    }
    if (otp.length !== 6) {
      setError("OTP must be exactly 6 digits.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPass) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(email.trim(), otp, password);
      setStep(3);
      setTimeout(() => navigate("/login"), 3000);
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
        <div className="absolute top-20 right-10 w-80 h-80 bg-accent-500/15 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl animate-float-slower" />
        <div className="absolute inset-0 grid-pattern opacity-40" />

        <div className="relative z-10 flex flex-col items-center justify-center w-full px-16">
          <Link to="/" className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow">
              <span className="text-white font-bold text-xl">&lt;/&gt;</span>
            </div>
            <span className="text-3xl font-bold text-white tracking-tight">
              Code<span className="gradient-text">Setu</span>
            </span>
          </Link>

          {/* Illustration */}
          <div className="glass rounded-2xl p-6 max-w-sm w-full shadow-glass animate-float mb-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-auto text-xs text-slate-500 font-mono">register.js</span>
            </div>
            <div className="font-mono text-sm leading-7 text-slate-300">
              <div><span className="text-primary-400">async function</span> <span className="text-accent-400">joinCodeSetu</span>() {'{'}</div>
              <div className="pl-6"><span className="text-primary-300">await</span> <span className="text-white">createAccount</span>();</div>
              <div className="pl-6"><span className="text-primary-300">await</span> <span className="text-white">verifyEmail</span>();</div>
              <div className="pl-6"><span className="text-primary-300">await</span> <span className="text-white">startCoding</span>();</div>
              <div className="pl-6"><span className="text-slate-500">{'// 🚀 You\'re in!'}</span></div>
              <div>{'}'}</div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white text-center mb-3">Join the Community</h2>
          <p className="text-slate-400 text-center text-sm max-w-xs">
            Create your free account and start your coding journey today. It only takes a minute.
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

          <h1 className="text-3xl font-extrabold text-white mb-2">Create Account</h1>
          <p className="text-slate-400 mb-8">Get started with CodeSetu in just a few steps.</p>

          <StepIndicator currentStep={step} />

          {/* Error / Success */}
          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium animate-slide-up">
              {error}
            </div>
          )}
          {successMsg && step !== 3 && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium animate-slide-up">
              {successMsg}
            </div>
          )}

          {/* ── STEP 1: Name & Email ── */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-5 animate-slide-up">
              <div>
                <label htmlFor="register-name" className="block text-sm font-medium text-slate-300 mb-2">
                  Full Name
                </label>
                <input
                  id="register-name"
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); clearMessages(); }}
                  className="input-field"
                  placeholder="John Doe"
                  autoComplete="name"
                />
              </div>

              <div>
                <label htmlFor="register-email" className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address
                </label>
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearMessages(); }}
                  className="input-field"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full text-base !py-4">
                {loading ? (
                  <>
                    <Spinner />
                    Sending OTP...
                  </>
                ) : (
                  "Send Verification Code"
                )}
              </button>
            </form>
          )}

          {/* ── STEP 2: OTP & Password ── */}
          {step === 2 && (
            <form onSubmit={handleStep2} className="space-y-5 animate-slide-up">
              <div className="glass-light rounded-xl px-4 py-3 mb-2">
                <p className="text-xs text-slate-400">
                  We&apos;ve sent a 6-digit verification code to <span className="text-white font-medium">{email}</span>
                </p>
              </div>

              <div>
                <label htmlFor="register-otp" className="block text-sm font-medium text-slate-300 mb-2">
                  Verification Code (OTP)
                </label>
                <input
                  id="register-otp"
                  type="text"
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); clearMessages(); }}
                  className="input-field text-center tracking-[0.5em] text-lg font-mono"
                  placeholder="000000"
                  maxLength={6}
                  autoComplete="one-time-code"
                />
              </div>

              <div>
                <label htmlFor="register-password" className="block text-sm font-medium text-slate-300 mb-2">
                  Set Password
                </label>
                <div className="relative">
                  <input
                    id="register-password"
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clearMessages(); }}
                    className="input-field pr-12"
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors" aria-label="Toggle password visibility">
                    {showPass ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="register-confirm" className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="register-confirm"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPass}
                    onChange={(e) => { setConfirmPass(e.target.value); clearMessages(); }}
                    className="input-field pr-12"
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors" aria-label="Toggle confirm password visibility">
                    {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full text-base !py-4">
                {loading ? (
                  <>
                    <Spinner />
                    Verifying...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>

              <button
                type="button"
                onClick={() => { setStep(1); clearMessages(); setOtp(""); setPassword(""); setConfirmPass(""); }}
                className="w-full text-center text-sm text-slate-500 hover:text-slate-300 transition-colors pt-2"
              >
                ← Back to Step 1
              </button>
            </form>
          )}

          {/* ── STEP 3: Success ── */}
          {step === 3 && (
            <div className="text-center py-8 animate-scale-in">
              <div className="flex justify-center mb-6">
                <div className="animate-pulse-glow rounded-full">
                  <CheckCircle />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Account Created!</h2>
              <p className="text-slate-400 mb-8">
                Your account has been verified successfully. Redirecting to login...
              </p>
              <div className="w-full h-1.5 bg-surface-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full animate-[gradient-x_3s_ease_infinite]" style={{ animation: "fillBar 3s linear forwards" }} />
              </div>
              <style>{`
                @keyframes fillBar {
                  from { width: 0%; }
                  to { width: 100%; }
                }
              `}</style>
            </div>
          )}

          {/* Divider & Login Link */}
          {step !== 3 && (
            <>
              <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-slate-500 font-medium">Already have an account?</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <Link to="/login" className="btn-secondary w-full text-sm justify-center">
                Sign In Instead
              </Link>
            </>
          )}

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
