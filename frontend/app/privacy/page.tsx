"use client";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { Eye, Lock, Server, Key, Layers, Zap, ShieldCheck } from "lucide-react";
import { ReactNode } from "react";

const SECTION_ICONS: ReactNode[] = [
  <Lock key="zktls" size={20} />,
  <Layers key="zk-circuit" size={20} />,
  <Key key="on-chain" size={20} />,
  <Server key="no-storage" size={20} />,
  <Eye key="threat" size={20} />,
  <Zap key="open" size={20} />,
];

export default function PrivacyPage() {
  const { t } = useTranslation();
  const sections = t.privacy.sections;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      <Header />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="px-4 sm:px-6 md:px-8 pt-12 sm:pt-16 pb-16 sm:pb-24 max-w-5xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-card border border-white/60 text-[11px] font-bold uppercase tracking-wider text-accent mb-10">
          <ShieldCheck size={12} />
          {t.privacy.badge}
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[88px] font-black tracking-tighter leading-[0.85] mb-6 sm:mb-8 text-primary">
          {t.privacy.title1}<br />
          <span className="text-transparent" style={{ WebkitTextStroke: "1.5px rgba(15,23,42,0.4)" }}>{t.privacy.title2}</span><br />
          {t.privacy.title3}
        </h1>
        <p className="text-xl text-secondary max-w-xl leading-relaxed font-medium">
          {t.privacy.subtitle}
        </p>

        {/* ── Quick nav ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mt-12">
          {sections.map((s, idx) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-white/40 shadow-sm text-[11px] font-black uppercase tracking-widest text-secondary hover:text-accent hover:border-white/80 transition-all"
            >
              {SECTION_ICONS[idx]}
              {s.label}
            </a>
          ))}
        </div>
      </header>

      {/* ── Sections ────────────────────────────────────────────────────── */}
      <main className="px-4 sm:px-6 md:px-8 max-w-5xl mx-auto w-full pb-20 sm:pb-32 space-y-0">
        {sections.map((s, i) => (
          <section
            key={s.id}
            id={s.id}
            className="border-t border-white/40 py-8 sm:py-12 md:py-16 grid lg:grid-cols-[220px_1fr] gap-8 sm:gap-12"
          >
            {/* Left — sticky label */}
            <div className="flex flex-col gap-4 lg:pt-1">
              <div className="flex items-center gap-2 text-accent">
                {SECTION_ICONS[i]}
                <span className="text-[11px] font-black uppercase tracking-widest">{s.label}</span>
              </div>
              <span className="text-[11px] font-black tracking-widest text-secondary/30 uppercase">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>

            {/* Right — content */}
            <div>
              <h2 className="text-2xl lg:text-3xl font-black tracking-tight leading-tight mb-8 text-primary">
                {s.heading}
              </h2>
              <div className="space-y-5">
                {s.body.map((paragraph, j) => (
                  <p key={j} className="text-base text-secondary leading-[1.8]">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </section>
        ))}

        {/* ── Summary block ─────────────────────────────────────────────── */}
        <div className="border-t border-white/40 pt-16">
          <div className="glass-card text-primary rounded-[40px] p-12 lg:p-16 relative overflow-hidden">
            <div
              className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-30"
              style={{
                background: "radial-gradient(circle, #20349F 0%, transparent 70%)",
                filter: "blur(80px)",
                transform: "translate(30%, -30%)",
              }}
            />
            <div className="relative z-10 max-w-xl">
              <p className="text-[11px] font-black uppercase tracking-widest text-secondary/50 mb-6">{t.privacy.summaryLabel}</p>
              <p className="text-3xl lg:text-4xl font-black tracking-tight leading-tight mb-8">
                {t.privacy.summaryTitle}<br />
                <span className="text-primary/40">{t.privacy.summaryTitleFaded}</span>
              </p>
              <p className="text-base text-secondary leading-relaxed">
                {t.privacy.summaryBody}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <Footer />
    </div>
  );
}
