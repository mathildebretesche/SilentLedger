"use client";

import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { LaunchOverlay } from "@/components/LaunchOverlay";
import { Footer } from "@/components/Footer";
import {
  Fingerprint,
  ArrowRight,
  Shield,
  Zap,
} from "lucide-react";

export default function HomePage() {
  const [showOverlay, setShowOverlay] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  const handleOpen = () => setShowOverlay(true);
  const handleClose = () => setShowOverlay(false);

  // Track scroll for parallax effects
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Intersection Observer for fade-in sections
  const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({ hero: true });
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="min-h-screen relative flex flex-col"
      style={{ color: "var(--text-primary)" }}
    >
      <Header />

      {/* ── Hero Section ───────────────────────────────────────────────── */}
      <main
        id="hero"
        ref={(el) => { if (el) sectionRefs.current["hero"] = el; }}
        className={`relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center px-8 max-w-7xl mx-auto w-full gap-16 lg:gap-24 py-20 lg:py-32 transition-all duration-1000 ${isVisible["hero"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
      >
        <div className="flex-1 text-center lg:text-left" style={{ transform: `translateY(${scrollY * -0.05}px)` }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card text-[11px] font-bold uppercase tracking-wider text-accent mb-8">
            Digital Sovereignty Network
          </div>

          <h1 className="text-7xl lg:text-[110px] font-[900] tracking-tighter leading-[0.8] mb-10">
            <span className="block text-primary">THE SILENT</span>
            <span className="text-transparent" style={{ WebkitTextStroke: "1.5px rgba(15,23,42,0.4)" }}>REVOLUTION.</span>
          </h1>

          <p className="text-xl text-secondary max-w-md mb-12 leading-relaxed font-medium">
            Your contributions. Your reputation. <br />
            <span className="text-primary font-bold italic">Completely Anonymous.</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <button
              onClick={handleOpen}
              className="group relative flex items-center gap-3 px-10 py-5 bg-accent text-white rounded-2xl font-bold text-lg overflow-hidden transition-all hover:bg-accent-light hover:shadow-[0_20px_40px_rgba(32,52,159,0.3)] active:scale-95"
            >
              <span className="relative z-10">Get Started</span>
              <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        <div
          className="flex-1 relative hidden lg:block"
          style={{ transform: `rotate(${scrollY * 0.01}deg) translateY(${scrollY * 0.03}px)` }}
        >
          <div className="glass-card relative z-10 p-10 w-[440px] aspect-[4/5] flex flex-col shadow-2xl transition-transform duration-500 hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-12">
              <Shield size={24} className="text-accent" />
              <div className="px-3 py-1 rounded-full bg-white/40 border border-white/60 text-secondary text-[10px] font-black">ENCRYPTED_LEDGER</div>
            </div>
            <div className="space-y-6">
              <div className="h-4 w-2/3 bg-black/5 rounded-full" />
              <div className="h-4 w-1/3 bg-black/5 rounded-full" />
              <div className="pt-8 space-y-4">
                <div className="h-16 w-full glass-card rounded-2xl flex items-center px-4 gap-4">
                  <Zap size={20} className="text-accent" />
                  <div className="h-2 w-1/2 bg-black/10 rounded-full" />
                </div>
                <div className="h-16 w-full glass-card rounded-2xl flex items-center px-4 gap-4 opacity-70">
                  <div className="w-5 h-5 rounded bg-black/10" />
                  <div className="h-2 w-1/3 bg-black/10 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Problem Section ────────────────────────────────────────────── */}
      <section
        id="problem"
        ref={(el) => { if (el) sectionRefs.current["problem"] = el; }}
        className={`relative z-10 py-32 px-8 max-w-7xl mx-auto w-full transition-all duration-1000 ${isVisible["problem"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-24"}`}
      >
        <div style={{ transform: `translateY(${scrollY * -0.02}px)` }}>
          <h2 className="text-5xl lg:text-[80px] font-black tracking-tighter leading-[0.9] mb-10 text-primary">
            REPUTATION IS <br />
            <span className="text-transparent" style={{ WebkitTextStroke: "1px rgba(15,23,42,0.4)" }}>TRAPPED.</span>
          </h2>
          <div className="space-y-8 text-xl text-secondary leading-relaxed font-medium max-w-2xl">
            <p>
              Every day, you contribute to the global knowledge pool. On GitHub, Discord, Slack.
              You build value, but <span className="text-primary font-bold">you don&apos;t own it.</span>
            </p>
            <p>
              To prove your expertise, you must expose your identity, your history, and your private tokens.
              You are forced to choose between <span className="text-accent font-bold">Verification</span> and <span className="text-accent font-bold">Privacy.</span>
            </p>
          </div>
        </div>
      </section>

      {/* ── Solution Section ────────────────────────────────────────────── */}
      <section
        id="solution"
        ref={(el) => { if (el) sectionRefs.current["solution"] = el; }}
        className={`relative z-10 py-32 px-8 max-w-7xl mx-auto w-full transition-all duration-1000 ${isVisible["solution"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-24"}`}
      >
        <div className="glass-card text-primary rounded-[60px] p-12 lg:p-24 overflow-hidden relative group border-white/20">
          <div
            className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent blur-[140px] rounded-full transition-transform duration-700 ease-out opacity-20"
            style={{ transform: `translate(30%, -30%) translateY(${scrollY * 0.1}px)` }}
          />

          <div className="relative z-10 flex flex-col lg:flex-row gap-20 items-center">
            <div className="lg:w-1/2">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(255,255,255,0.4)]">
                <Fingerprint size={32} className="text-accent" />
              </div>
              <h2 className="text-5xl lg:text-7xl font-black tracking-tighter leading-none mb-10 text-primary">
                THE SILENT <br />
                <span className="text-transparent" style={{ WebkitTextStroke: "1px rgba(15,23,42,0.3)" }}>RESPONSE.</span>
              </h2>
              <p className="text-xl text-secondary leading-relaxed font-medium mb-12">
                Silent Ledger uses <span className="text-primary font-bold">zkTLS</span> to bridge your Web2 reputation to the chain without ever seeing your secrets.
                Verifiable. Anonymous. Sovereign.
              </p>
              <button
                onClick={handleOpen}
                className="px-10 py-5 bg-accent text-white rounded-2xl font-black text-lg hover:bg-accent-light transition-all flex items-center gap-3 shadow-[0_10px_30px_rgba(32,52,159,0.3)]"
              >
                Join the Protocol <ArrowRight size={20} />
              </button>
            </div>

            <div className="lg:w-1/2 grid grid-cols-2 gap-4">
              {[
                { label: "zkTLS", sub: "MPC-TLS Tech", speed: 0.02 },
                { label: "EAS", sub: "Global Standards", speed: -0.025 },
                { label: "100%", label2: "Private", type: "stat", speed: 0.02 },
                { label: "0", label2: "Storage", type: "stat", speed: -0.025 }
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-8 border border-white/40 rounded-[32px] glass-card backdrop-blur-md transition-transform duration-500 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)] text-primary"
                  style={{ transform: `translateY(${scrollY * item.speed}px)` }}
                >
                  {item.type === "stat" ? (
                    <>
                      <div className="text-4xl font-black mb-1 text-accent">{item.label}</div>
                      <div className="text-[10px] uppercase font-black tracking-widest text-secondary">{item.label2}</div>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-black mb-1 text-primary">{item.label}</div>
                      <div className="text-[10px] uppercase font-black tracking-widest text-secondary">{item.sub}</div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <Footer />

      <LaunchOverlay isOpen={showOverlay} onClose={handleClose} />
    </div>
  );
}
