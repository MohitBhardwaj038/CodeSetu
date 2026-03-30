import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";

/* ───── Animated Counter Hook ───── */
function useCounter(end, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = 0;
          const startTime = performance.now();
          const step = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * (end - start) + start));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return [count, ref];
}

/* ───── Scroll-Triggered Fade In ───── */
function FadeInSection({ children, className = "", delay = 0 }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ───── SVG Icons ───── */
const CodeIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
  </svg>
);

const CollabIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
  </svg>
);

const TrophyIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0 1 16.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.04 6.04 0 0 1-2.02 1.118M14.27 9.728a5.962 5.962 0 0 1-2.27.445 5.963 5.963 0 0 1-2.27-.445" />
  </svg>
);

const RocketIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
  </svg>
);



/* ───── Code Animation Block ───── */
function CodeBlock() {
  const lines = [
    { indent: 0, color: "text-primary-400", text: 'function ', hl: "text-accent-400", hlText: "solve", rest: "(problems) {" },
    { indent: 1, color: "text-slate-400", text: "// Your journey starts here" },
    { indent: 1, color: "text-primary-300", text: "const ", hl: "text-white", hlText: "skills", rest: ' = learn(code);' },
    { indent: 1, color: "text-primary-300", text: "const ", hl: "text-white", hlText: "team", rest: " = collaborate(peers);" },
    { indent: 1, color: "text-primary-300", text: "const ", hl: "text-white", hlText: "rank", rest: " = compete(contests);" },
    { indent: 1, color: "text-primary-400", text: "return ", hl: "text-accent-300", hlText: "success", rest: ";" },
    { indent: 0, color: "text-primary-400", text: "}" },
  ];

  return (
    <div className="glass rounded-2xl overflow-hidden shadow-glass max-w-md w-full animate-float">
      {/* Title Bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
        <div className="w-3 h-3 rounded-full bg-red-500/80" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <div className="w-3 h-3 rounded-full bg-green-500/80" />
        <span className="ml-3 text-xs text-slate-500 font-mono">solution.js</span>
      </div>
      {/* Code Body */}
      <div className="p-5 font-mono text-sm leading-7">
        {lines.map((line, i) => (
          <div key={i} style={{ paddingLeft: `${line.indent * 24}px` }} className="animate-fade-in" >
            <span className={line.color}>{line.text}</span>
            {line.hl && <span className={line.hl}>{line.hlText}</span>}
            {line.rest && <span className="text-slate-300">{line.rest}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───── Feature Card ───── */
function FeatureCard({ icon, title, description, gradient, delay }) {
  return (
    <FadeInSection delay={delay}>
      <div className="glass rounded-2xl p-8 h-full group hover:border-primary-500/30 transition-all duration-500 hover:shadow-glow hover:-translate-y-1">
        <div className={`w-14 h-14 rounded-xl ${gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
        <p className="text-slate-400 leading-relaxed text-sm">{description}</p>
      </div>
    </FadeInSection>
  );
}

/* ───── Stat Card ───── */
function StatCard({ value, suffix, label }) {
  const [count, ref] = useCounter(value);
  return (
    <div ref={ref} className="text-center p-6">
      <div className="text-4xl sm:text-5xl font-extrabold gradient-text mb-2">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-slate-400 text-sm font-medium">{label}</div>
    </div>
  );
}

/* ───── Step Card ───── */
function StepCard({ number, title, description, delay }) {
  return (
    <FadeInSection delay={delay}>
      <div className="relative text-center group">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-2xl font-bold text-white mx-auto mb-5 group-hover:shadow-glow transition-shadow duration-300 group-hover:scale-110 transition-transform">
          {number}
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">{description}</p>
      </div>
    </FadeInSection>
  );
}

/* ═══════════════════════════════════════════════ */
/* ══════════════  LANDING PAGE  ════════════════ */
/* ═══════════════════════════════════════════════ */

export default function Landing() {
  const user = JSON.parse(localStorage.getItem("codesetu_user") || "null");
  const ctaTarget = user ? "/problems" : "/register";

  return (
    <div className="min-h-screen bg-surface-950 overflow-hidden">
      <Navbar />

      {/* ─── HERO ──────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center bg-mesh grid-pattern pt-20">
        {/* Background Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-600/20 rounded-full blur-3xl animate-float-slow pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-float-slower pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left – Text */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-light text-xs font-semibold text-primary-300 mb-8 animate-fade-in">
                <RocketIcon />
                <span>The Bridge to Better Code</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-[1.1] mb-6 animate-slide-up text-balance">
                Code.{" "}
                <span className="gradient-text">Collaborate.</span>{" "}
                <span className="gradient-text-accent">Compete.</span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed mb-10 animate-slide-up-delay">
                A powerful coding platform with a professional editor, real-time collaboration spaces, and competitive programming contests — all in one place.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slide-up-delay-2">
                <Link to={ctaTarget} className="btn-primary text-base">
                  {user ? "Go to Problems" : "Start Coding Free"}
                  <ArrowRightIcon />
                </Link>
                <a href="#features" className="btn-secondary text-base">
                  Explore Features
                </a>
              </div>
            </div>

            {/* Right – Code Block */}
            <div className="flex justify-center lg:justify-end">
              <CodeBlock />
            </div>
          </div>
        </div>

        {/* Bottom Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-surface-950 to-transparent pointer-events-none" />
      </section>

      {/* ─── FEATURES ──────────────────────────── */}
      <section id="features" className="relative py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection className="text-center mb-16">
            <p className="text-sm font-semibold text-primary-400 tracking-wider uppercase mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-5 text-balance">
              Everything You Need to <span className="gradient-text">Level Up</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              From writing your first line of code to conquering competitive programming — we&apos;ve got you covered.
            </p>
          </FadeInSection>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            <FeatureCard
              icon={<CodeIcon />}
              title="Code Editor"
              description="A professional-grade editor with syntax highlighting, auto-complete, multi-language support, and instant code execution — just like the real deal."
              gradient="bg-gradient-to-br from-primary-600 to-primary-800"
              delay={0}
            />
            <FeatureCard
              icon={<CollabIcon />}
              title="Collaboration Space"
              description="Code together in real-time with teammates. Shared editors, live cursors, and integrated chat make pair programming seamless."
              gradient="bg-gradient-to-br from-accent-600 to-accent-500"
              delay={150}
            />
            <FeatureCard
              icon={<TrophyIcon />}
              title="Contests & Rankings"
              description="Compete in timed coding challenges, climb the leaderboard, and earn badges. Prove your skills in weekly and monthly contests."
              gradient="bg-gradient-to-br from-primary-500 to-accent-500"
              delay={300}
            />
          </div>
        </div>
      </section>

      {/* ─── STATS ──────────────────────────────── */}
      <section id="stats" className="relative py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="glass rounded-3xl p-8 sm:p-12 grid grid-cols-2 md:grid-cols-4 gap-6">
              <StatCard value={10000} suffix="+" label="Active Coders" />
              <StatCard value={500} suffix="+" label="Coding Problems" />
              <StatCard value={150} suffix="+" label="Contests Hosted" />
              <StatCard value={50} suffix="+" label="Universities" />
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ─── HOW IT WORKS ──────────────────────── */}
      <section id="how-it-works" className="relative py-24 sm:py-32 bg-mesh-dense">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection className="text-center mb-16">
            <p className="text-sm font-semibold text-accent-400 tracking-wider uppercase mb-3">How It Works</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-5 text-balance">
              Get Started in <span className="gradient-text-accent">3 Simple Steps</span>
            </h2>
          </FadeInSection>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connector Line (desktop) */}
            <div className="hidden md:block absolute top-8 left-[calc(16.67%+32px)] right-[calc(16.67%+32px)] h-0.5 bg-gradient-to-r from-primary-500/50 via-accent-500/50 to-primary-500/50" />

            <StepCard
              number="1"
              title="Create Your Account"
              description="Sign up in seconds with your email. Verify with OTP and you're ready to go."
              delay={0}
            />
            <StepCard
              number="2"
              title="Start Coding"
              description="Jump into the editor, solve problems, or join a collaboration room with your team."
              delay={200}
            />
            <StepCard
              number="3"
              title="Compete & Grow"
              description="Enter contests, earn rankings, and track your progress as you level up your skills."
              delay={400}
            />
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER ────────────────────────── */}
      <section className="relative py-24 sm:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="relative rounded-3xl overflow-hidden">
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-700 via-primary-600 to-accent-600 opacity-90" />
              <div className="absolute inset-0 grid-pattern opacity-30" />

              <div className="relative z-10 px-8 sm:px-16 py-16 sm:py-20 text-center">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-5 text-balance">
                  Ready to Build Something Amazing?
                </h2>
                <p className="text-lg text-white/80 max-w-xl mx-auto mb-10">
                  Join thousands of developers who are sharpening their skills on CodeSetu. Your journey begins now.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to={ctaTarget}
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-700 font-bold rounded-xl hover:bg-white/90 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-xl text-base"
                  >
                    {user ? "Explore Problems" : "Get Started \u2014 It\u2019s Free"}
                    <ArrowRightIcon />
                  </Link>
                </div>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ─── FOOTER ────────────────────────────── */}
      <footer className="border-t border-white/5 bg-surface-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">&lt;/&gt;</span>
                </div>
                <span className="text-lg font-bold text-white">
                  Code<span className="gradient-text">Setu</span>
                </span>
              </Link>
              <p className="text-sm text-slate-500 leading-relaxed">
                The bridge to better code. Practice, collaborate, and compete with developers worldwide.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm text-slate-500">
                <li><a href="#features" className="hover:text-slate-300 transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-slate-300 transition-colors">How it Works</a></li>
                <li><a href="#stats" className="hover:text-slate-300 transition-colors">Community</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2.5 text-sm text-slate-500">
                <li><a href="#" className="hover:text-slate-300 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-slate-300 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-slate-300 transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm text-slate-500">
                <li><a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-600">
              &copy; {new Date().getFullYear()} CodeSetu. All rights reserved.
            </p>
            <div className="flex items-center gap-5">
              {/* GitHub */}
              <a href="#" className="text-slate-600 hover:text-slate-400 transition-colors" aria-label="GitHub">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" /></svg>
              </a>
              {/* Twitter */}
              <a href="#" className="text-slate-600 hover:text-slate-400 transition-colors" aria-label="Twitter">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              </a>
              {/* LinkedIn */}
              <a href="#" className="text-slate-600 hover:text-slate-400 transition-colors" aria-label="LinkedIn">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}