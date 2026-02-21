"use client";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import {
  ShieldCheck,
  GitMerge,
  Hash,
  RefreshCw,
  Lock,
  FileCode2,
  AlertTriangle,
} from "lucide-react";
import { ReactNode } from "react";

const SECTION_ICONS: ReactNode[] = [
  <GitMerge key="groth16" size={20} />,
  <Hash key="poseidon" size={20} />,
  <RefreshCw key="nullifier" size={20} />,
  <Lock key="contract" size={20} />,
  <FileCode2 key="trusted" size={20} />,
  <AlertTriangle key="attack" size={20} />,
];

export default function SecurityPage() {
  const { t } = useTranslation();
  const sections = t.security.sections;

  return (
    <div className="min-h-screen bg-background text-primary">
      <Header />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <header className="px-8 max-w-5xl mx-auto w-full pt-16 pb-24 flex flex-col items-start">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-card border border-white/60 text-[11px] font-bold uppercase tracking-wider text-accent mb-10">
          <ShieldCheck size={12} />
          {t.security.badge}
        </div>
        <h1 className="text-6xl lg:text-[88px] font-black tracking-tighter leading-[0.85] mb-8 text-primary">
          {t.security.title1}<br />
          <span className="text-transparent" style={{ WebkitTextStroke: "1.5px rgba(15,23,42,0.4)" }}>{t.security.title2}</span><br />
          {t.security.title3}
        </h1>
        <p className="text-xl text-secondary max-w-xl leading-relaxed font-medium">
          {t.security.subtitle}
        </p>

        {/* ── Quick nav ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mt-12">
          {sections.map((s, idx) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="flex items-center shadow-sm gap-2 px-4 py-2 rounded-full glass-card border border-white/40 text-[11px] font-black uppercase tracking-widest text-secondary hover:text-accent hover:border-white/80 transition-all"
            >
              {SECTION_ICONS[idx]}
              {s.label}
            </a>
          ))}
        </div>
      </header>

      {/* ── Sections ────────────────────────────────────────────────────── */}
      <main className="px-8 max-w-5xl mx-auto w-full pb-32 space-y-0">
        {sections.map((s, i) => (
          <section
            key={s.id}
            id={s.id}
            className="border-t border-white/40 py-16 grid lg:grid-cols-[220px_1fr] gap-12"
          >
            {/* Left — label */}
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
              <div className="space-y-5 mb-8">
                {s.body.map((paragraph, j) => (
                  <p key={j} className="text-base text-secondary leading-[1.8]">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Optional code block */}
              {"code" in s && (s as { code?: readonly string[] }).code && (
                <div className="glass-card bg-black/5 rounded-2xl px-8 py-6 font-mono text-[13px] leading-[2] text-secondary space-y-1">
                  {((s as { code?: readonly string[] }).code as readonly string[]).map((line, j) => (
                    <div key={j}>
                      <span className="text-primary/30 select-none mr-4">{String(j + 1).padStart(2, "0")}</span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        ))}

        {/* ── Guarantee chain ─────────────────────────────────────────── */}
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
            <div className="relative z-10">
              <p className="text-[11px] font-black uppercase tracking-widest text-secondary/50 mb-10">
                {t.security.guaranteeChain}
              </p>

              <div className="space-y-0">
                {t.security.guarantees.map((item, i, arr) => (
                  <div
                    key={item.step}
                    className={`flex items-start gap-8 py-6 ${i < arr.length - 1 ? "border-b border-primary/10" : ""}`}
                  >
                    <span className="text-[11px] font-black text-secondary/40 w-6 shrink-0 mt-0.5">
                      {item.step}
                    </span>
                    <div className="flex-1 flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-8">
                      <span className="text-[11px] font-black uppercase tracking-widest text-accent w-20 shrink-0">
                        {item.label}
                      </span>
                      <span className="text-base font-bold text-primary flex-1">
                        {item.claim}
                      </span>
                      <span className="text-[12px] text-secondary lg:text-right lg:max-w-xs">
                        {item.basis}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <Footer />
    </div>
  );
}
