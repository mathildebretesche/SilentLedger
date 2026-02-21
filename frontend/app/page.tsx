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
import { useTranslation } from "@/lib/i18n/LanguageContext";

export default function HomePage() {
  const [showOverlay, setShowOverlay] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const { t } = useTranslation();

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
        className={`relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center px-4 sm:px-6 md:px-8 max-w-7xl mx-auto w-full gap-8 sm:gap-12 lg:gap-24 py-12 sm:py-16 md:py-20 lg:py-32 transition-all duration-1000 ${isVisible["hero"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
      >
        <div className="flex-1 text-center lg:text-left" style={{ transform: `translateY(${scrollY * -0.05}px)` }}>
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full glass-card glass-noise text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-accent mb-6 sm:mb-8 animate-float">
            {t.home.badge}
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[110px] font-[900] tracking-tighter leading-[0.85] sm:leading-[0.8] mb-6 sm:mb-10">
            <span className="block text-primary">{t.home.heroTitle1}</span>
            <span className="text-transparent" style={{ WebkitTextStroke: `1.5px rgba(15,23,42,0.4)` }}>{t.home.heroTitle2}</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-secondary max-w-sm sm:max-w-md md:max-w-lg mb-8 sm:mb-12 leading-relaxed font-medium">
            {t.home.heroSubtitle1} <br />
            <span className="text-primary font-bold italic">{t.home.heroSubtitle2}</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4">
            <button
              onClick={handleOpen}
              className="group relative flex items-center gap-2 sm:gap-3 px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 bg-accent text-white rounded-xl sm:rounded-2xl font-bold text-sm sm:text-lg overflow-hidden transition-all hover:bg-accent-light hover:shadow-[0_15px_30px_rgba(32,52,159,0.3)] active:scale-95 w-full sm:w-auto"
            >
              <span className="relative z-10">{t.home.cta}</span>
              <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform sm:hidden" />
              <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform hidden sm:block" />
            </button>
          </div>
        </div>

        {/* Hero illustration - Hidden on small screens, scaled on medium */}
        <div
          className="flex-1 relative hidden md:block w-full lg:w-auto"
          style={{ transform: `rotate(${scrollY * 0.01}deg) translateY(${scrollY * 0.03}px)` }}
        >
          <div className="glass-card glass-card-hero glass-noise relative z-10 p-6 sm:p-8 md:p-10 w-full max-w-[320px] sm:w-[380px] md:w-[440px] aspect-[4/5] flex flex-col transition-all duration-500 hover:scale-[1.02] overflow-hidden ambient-glow mx-auto md:mx-0">
            {/* Multi-layered ambient glow */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] md:w-[300px] h-[150px] md:h-[200px] bg-gradient-radial from-blue-500/15 via-transparent to-transparent blur-[60px]" />
              <div className="absolute bottom-0 left-0 w-[150px] md:w-[250px] h-[100px] md:h-[150px] bg-gradient-radial from-accent/10 via-transparent to-transparent blur-[50px]" />
            </div>

            <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(255,255,255,0.05)] pointer-events-none" />
            <div className="inner-glow absolute inset-0 pointer-events-none transition-opacity duration-500 opacity-0 group-hover:opacity-100" />

            <div className="relative z-10 flex items-center justify-between mb-8 md:mb-12">
              <Shield size={20} className="md:size-6 text-accent drop-shadow-[0_0_8px_rgba(37,99,235,0.4)]" />
              <div className="px-2 sm:px-3 py-1 rounded-full bg-white/40 backdrop-blur-sm border border-white/60 text-secondary text-[8px] sm:text-[10px] font-black shadow-sm backdrop-brightness-110">ENCRYPTED_LEDGER</div>
            </div>
            <div className="relative z-10 space-y-4 md:space-y-6">
              <div className="h-3 sm:h-4 w-2/3 bg-gradient-to-r from-black/8 via-black/4 to-transparent rounded-full" />
              <div className="h-3 sm:h-4 w-1/3 bg-gradient-to-r from-black/8 via-black/4 to-transparent rounded-full" />
              <div className="pt-6 md:pt-8 space-y-3 md:space-y-4">
                <div className="h-12 md:h-16 glass-card glass-card-stat glass-noise rounded-xl md:rounded-2xl flex items-center px-3 sm:px-4 gap-3 sm:gap-4 shadow-[inset_0_2px_10px_rgba(255,255,255,0.12),0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-[inset_0_2px_10px_rgba(255,255,255,0.18),0_8px_20px_rgba(0,0,0,0.06)] transition-shadow duration-300">
                  <Zap size={16} className="md:size-5 text-accent drop-shadow-[0_0_8px_rgba(37,99,235,0.5)]" />
                  <div className="h-1.5 sm:h-2 w-1/2 bg-gradient-to-r from-black/12 via-black/6 to-transparent rounded-full" />
                </div>
                <div className="h-12 md:h-16 glass-card glass-card-stat glass-noise rounded-xl md:rounded-2xl flex items-center px-3 sm:px-4 gap-3 sm:gap-4 opacity-70 shadow-[inset_0_2px_8px_rgba(255,255,255,0.08),0_2px_8px_rgba(0,0,0,0.03)]">
                  <div className="w-4 sm:w-5 h-4 sm:h-5 rounded bg-gradient-to-br from-black/12 via-black/6 to-transparent" />
                  <div className="h-1.5 sm:h-2 w-1/3 bg-gradient-to-r from-black/12 via-black/6 to-transparent rounded-full" />
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
        className={`relative z-10 py-16 sm:py-24 md:py-32 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto w-full transition-all duration-1000 ${isVisible["problem"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-24"}`}
      >
        <div style={{ transform: `translateY(${scrollY * -0.02}px)` }}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[80px] font-black tracking-tighter leading-[0.95] sm:leading-[0.9] mb-6 sm:mb-8 md:mb-10 text-primary">
            {t.home.problemTitle1} <br className="hidden sm:block" />
            <span className="text-transparent" style={{ WebkitTextStroke: `1px rgba(15,23,42,0.4)` }}>{t.home.problemTitle2}</span>
          </h2>
          <div className="space-y-6 sm:space-y-8 text-base sm:text-lg md:text-xl text-secondary leading-relaxed font-medium max-w-2xl mx-auto lg:mx-0">
            <p>
              {t.home.problem1} <span className="text-primary font-bold">{t.home.problem1Bold}</span>
            </p>
            <p>
              {t.home.problem2} <span className="text-accent font-bold">{t.home.problem2Verification}</span> {t.home.problem2And} <span className="text-accent font-bold">{t.home.problem2Privacy}</span>
            </p>
          </div>
        </div>
      </section>

      {/* ── Solution Section ────────────────────────────────────────────── */}
      <section
        id="solution"
        ref={(el) => { if (el) sectionRefs.current["solution"] = el; }}
        className={`relative z-10 py-16 sm:py-24 md:py-32 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto w-full transition-all duration-1000 ${isVisible["solution"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-24"}`}
      >
        <div className="glass-card glass-card-hero glass-noise text-primary rounded-3xl sm:rounded-4xl md:rounded-[60px] p-6 sm:p-8 md:p-12 lg:p-24 overflow-hidden relative group ambient-glow">
          {/* Multi-layered ambient glow system */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute top-0 right-0 w-[300px] sm:w-[400px] md:w-[600px] h-[200px] sm:h-[300px] md:h-[600px] bg-gradient-radial from-accent/30 via-transparent to-transparent blur-[60px] sm:blur-[80px] md:blur-[100px] rounded-full transition-transform duration-700 ease-out opacity-40"
              style={{ transform: `translate(30%, -30%) translateY(${scrollY * 0.1}px)` }}
            />
            <div
              className="absolute bottom-0 left-0 w-[200px] sm:w-[300px] md:w-[400px] h-[150px] sm:h-[200px] md:h-[400px] bg-gradient-radial from-blue-500/10 via-transparent to-transparent blur-[50px] sm:blur-[60px] md:blur-[80px] rounded-full"
              style={{ transform: `translate(-20%, 20%)` }}
            />
          </div>

          <div className="absolute inset-0 glass-noise pointer-events-none" />
          <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(255,255,255,0.05)] pointer-events-none" />
          <div className="inner-glow absolute inset-0 pointer-events-none transition-opacity duration-500 opacity-0 group-hover:opacity-100" />

          <div className="relative z-10 flex flex-col lg:flex-row gap-10 lg:gap-20 items-center">
            <div className="lg:w-1/2 w-full">
              <div className="w-12 sm:w-14 md:w-16 h-12 sm:h-14 md:h-16 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center mb-6 sm:mb-8 shadow-[0_0_30px_rgba(255,255,255,0.4)]">
                <Fingerprint size={24} className="md:size-8 text-accent" />
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter leading-none mb-6 sm:mb-8 md:mb-10 text-primary">
                {t.home.solutionTitle1} <br className="hidden sm:block" />
                <span className="text-transparent" style={{ WebkitTextStroke: `1px rgba(15,23,42,0.3)` }}>{t.home.solutionTitle2}</span>
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-secondary leading-relaxed font-medium mb-8 sm:mb-10 md:mb-12">
                {t.home.solutionDesc}
              </p>
              <button
                onClick={handleOpen}
                className="px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 bg-accent text-white rounded-xl sm:rounded-2xl font-black text-sm sm:text-lg hover:bg-accent-light transition-all flex items-center gap-2 sm:gap-3 shadow-[0_8px_20px_rgba(32,52,159,0.3)] w-full sm:w-auto justify-center sm:justify-start"
              >
                <span>{t.home.solutionCta}</span>
                <ArrowRight size={16} className="sm:size-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="lg:w-1/2 w-full grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {[
                { label: t.home.stats.zktls.label, sub: t.home.stats.zktls.sub, speed: 0.02 },
                { label: t.home.stats.eas.label, sub: t.home.stats.eas.sub, speed: -0.025 },
                { label: t.home.stats.private.label, label2: t.home.stats.private.sub, type: "stat", speed: 0.02 },
                { label: t.home.stats.storage.label, label2: t.home.stats.storage.sub, type: "stat", speed: -0.025 }
              ].map((item, i) => (
                <div
                  key={i}
                  className="glass-card glass-card-stat glass-noise p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl md:rounded-[32px] transition-all duration-500 text-primary hover:-translate-y-1 sm:hover:-translate-y-2 group"
                  style={{ transform: `translateY(${scrollY * item.speed}px)` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-inherit opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  <div className="relative z-10">
                    {item.type === "stat" ? (
                      <>
                        <div className="text-2xl sm:text-3xl md:text-4xl font-black mb-1 text-accent drop-shadow-[0_0_6px_rgba(37,99,235,0.2)]">{item.label}</div>
                        <div className="text-[8px] sm:text-[10px] uppercase font-black tracking-[0.2em] text-secondary/80">{item.label2}</div>
                      </>
                    ) : (
                      <>
                        <div className="text-lg sm:text-2xl font-black mb-1 text-primary group-hover:text-accent transition-colors duration-300">{item.label}</div>
                        <div className="text-[8px] sm:text-[10px] uppercase font-black tracking-[0.2em] text-secondary/80">{item.sub}</div>
                      </>
                    )}
                  </div>
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
