"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Fingerprint,
  ArrowRight,
  Shield,
  Zap,
  Lock,
  User,
  Search,
  X,
  Plus,
  ArrowDown,
  Globe,
  Ghost,
  Database,
  Hash,
  Cpu,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [showOverlay, setShowOverlay] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // Track scroll for parallax effects
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Intersection Observer for fade-in sections
  const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({});
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
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      {/* ── Dynamic Floating Background (Parallax Layer) ────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Large Blurred Blobs */}
        <div 
          className="absolute w-[800px] h-[800px] rounded-full opacity-[0.06]"
          style={{
            top: "-10%",
            left: "-5%",
            background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)",
            filter: "blur(140px)",
            transform: `translate(${scrollY * 0.05}px, ${scrollY * 0.2}px)`,
          }}
        />
        <div 
          className="absolute w-[600px] h-[600px] rounded-full opacity-[0.04]"
          style={{
            bottom: "10%",
            right: "-10%",
            background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)",
            filter: "blur(120px)",
            transform: `translate(${scrollY * -0.1}px, ${scrollY * -0.15}px)`,
          }}
        />

        {/* Floating Icons with individual speeds */}
        {[
          { icon: <Shield size={40} />, t: "15%", l: "12%", s: 0.4, o: 0.04, r: 15 },
          { icon: <Lock size={32} />, t: "65%", l: "88%", s: 0.2, o: 0.03, r: -10 },
          { icon: <Fingerprint size={56} />, t: "82%", l: "8%", s: 0.7, o: 0.03, r: 40 },
          { icon: <Zap size={48} />, t: "28%", l: "78%", s: 0.3, o: 0.05, r: -20 },
          { icon: <Database size={32} />, t: "52%", l: "18%", s: 0.5, o: 0.04, r: 12 },
          { icon: <Hash size={44} />, t: "12%", l: "92%", s: 0.25, o: 0.04, r: 25 },
          { icon: <Cpu size={36} />, t: "40%", l: "85%", s: 0.6, o: 0.03, r: -5 },
        ].map((item, i) => (
          <div
            key={i}
            className="absolute transition-transform duration-75 ease-out"
            style={{
              top: item.t,
              left: item.l,
              opacity: item.o,
              transform: `translateY(${scrollY * item.s}px) rotate(${item.r + scrollY * 0.04}deg)`,
            }}
          >
            {item.icon}
          </div>
        ))}

        {/* Animated Grid */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
            backgroundSize: "80px 80px",
            backgroundPosition: `0px ${scrollY * 0.08}px`,
          }}
        />
      </div>

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-8 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center border border-black/[0.05]">
            <Fingerprint size={22} className="text-violet-600" />
          </div>
          <span className="font-bold text-xl tracking-tighter">Silent Ledger</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <button 
            onClick={() => setShowOverlay(true)}
            className="px-6 py-2.5 bg-black text-white text-sm font-bold rounded-full hover:bg-black/80 transition-all active:scale-95 shadow-lg shadow-black/10"
          >
            Launch App
          </button>
        </div>
      </nav>

      {/* ── Hero Section ───────────────────────────────────────────────── */}
      <main 
        id="hero"
        ref={(el) => { if (el) sectionRefs.current["hero"] = el; }}
        className={`relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center px-8 max-w-7xl mx-auto w-full gap-16 lg:gap-24 py-20 lg:py-32 transition-all duration-1000 ${isVisible["hero"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
      >
        <div className="flex-1 text-center lg:text-left" style={{ transform: `translateY(${scrollY * -0.05}px)` }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-50 border border-violet-100 text-[11px] font-bold uppercase tracking-wider text-violet-600 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
            Digital Sovereignty Network
          </div>
          
          <h1 className="text-7xl lg:text-[110px] font-[900] tracking-tighter leading-[0.8] mb-10">
            <span className="block text-black">THE SILENT</span>
            <span className="text-transparent" style={{ WebkitTextStroke: "1.5px rgba(0,0,0,0.15)" }}>REVOLUTION.</span>
          </h1>
          
          <p className="text-xl text-black/50 max-w-md mb-12 leading-relaxed font-medium">
            Your contributions. Your reputation. <br/>
            <span className="text-black font-bold italic">Completely Anonymous.</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <button
              onClick={() => setShowOverlay(true)}
              className="group relative flex items-center gap-3 px-10 py-5 bg-violet-600 text-white rounded-2xl font-bold text-lg overflow-hidden transition-all hover:bg-violet-700 hover:shadow-[0_20px_40px_rgba(124,58,237,0.25)] active:scale-95"
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
                <Ghost size={24} className="text-violet-600/20" />
                <div className="px-3 py-1 rounded-full bg-black/5 text-[10px] font-black">ENCRYPTED_LEDGER</div>
             </div>
             <div className="space-y-6">
                <div className="h-4 w-2/3 bg-black/5 rounded-full" />
                <div className="h-4 w-1/3 bg-black/5 rounded-full" />
                <div className="pt-8 space-y-4">
                   <div className="h-16 w-full bg-black/[0.02] border border-black/[0.05] rounded-2xl flex items-center px-4 gap-4">
                      <Zap size={20} className="text-violet-600" />
                      <div className="h-2 w-1/2 bg-black/10 rounded-full" />
                   </div>
                   <div className="h-16 w-full bg-black/[0.02] border border-black/[0.05] rounded-2xl flex items-center px-4 gap-4 opacity-40">
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
        <div className="flex flex-col lg:flex-row gap-20 items-start">
          <div className="lg:w-1/2" style={{ transform: `translateY(${scrollY * -0.02}px)` }}>
            <h2 className="text-5xl lg:text-[80px] font-black tracking-tighter leading-[0.9] mb-10">
              REPUTATION IS <br/>
              <span className="text-transparent" style={{ WebkitTextStroke: "1px rgba(0,0,0,0.3)" }}>TRAPPED.</span>
            </h2>
            <div className="space-y-8 text-xl text-black/60 leading-relaxed font-medium">
              <p>
                Every day, you contribute to the global knowledge pool. On GitHub, Discord, Slack. 
                You build value, but <span className="text-black font-bold">you don't own it.</span>
              </p>
              <p>
                To prove your expertise, you must expose your identity, your history, and your private tokens. 
                You are forced to choose between <span className="text-violet-600 font-bold">Verification</span> and <span className="text-violet-600 font-bold">Privacy.</span>
              </p>
            </div>
          </div>
          
          <div className="lg:w-1/2 grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { 
                icon: <Globe className="text-red-500" />, 
                title: "Data Silos", 
                text: "Your contributions are locked within centralized platforms.",
                speed: 0.05
              },
              { 
                icon: <Lock className="text-red-500" />, 
                title: "Privacy Leak", 
                text: "Proving your work requires revealing sensitive session cookies.",
                speed: 0.1
              },
              { 
                icon: <Fingerprint className="text-red-500" />, 
                title: "Fixed ID", 
                text: "You can't prove knowledge without linking your real-world identity.",
                speed: 0.03
              },
              { 
                icon: <Shield className="text-red-500" />, 
                title: "Fragile Trust", 
                text: "Reputation vanishes if you lose access to a single account.",
                speed: 0.08
              }
            ].map((item, i) => (
              <div 
                key={i} 
                className="glass-card p-8 group hover:border-red-200 transition-all"
                style={{ transform: `translateY(${scrollY * item.speed}px)` }}
              >
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold mb-3 uppercase tracking-tight">{item.title}</h3>
                <p className="text-sm text-black/40 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Solution Section ────────────────────────────────────────────── */}
      <section 
        id="solution"
        ref={(el) => { if (el) sectionRefs.current["solution"] = el; }}
        className={`relative z-10 py-32 px-8 max-w-7xl mx-auto w-full transition-all duration-1000 ${isVisible["solution"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-24"}`}
      >
        <div className="bg-black text-white rounded-[60px] p-12 lg:p-24 overflow-hidden relative group">
          <div 
            className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-600/30 blur-[140px] rounded-full transition-transform duration-700 ease-out"
            style={{ transform: `translate(30%, -30%) translateY(${scrollY * 0.1}px)` }}
          />
          
          <div className="relative z-10 flex flex-col lg:flex-row gap-20 items-center">
             <div className="lg:w-1/2">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                   <Fingerprint size={32} className="text-black" />
                </div>
                <h2 className="text-5xl lg:text-7xl font-black tracking-tighter leading-none mb-10">
                   THE SILENT <br/>
                   <span className="text-white/30">RESPONSE.</span>
                </h2>
                <p className="text-xl text-white/50 leading-relaxed font-medium mb-12">
                   Silent Ledger uses <span className="text-white font-bold">zkTLS</span> to bridge your Web2 reputation to the chain without ever seeing your secrets. 
                   Verifiable. Anonymous. Sovereign.
                </p>
                <button 
                  onClick={() => setShowOverlay(true)}
                  className="px-10 py-5 bg-white text-black rounded-2xl font-black text-lg hover:bg-white/90 transition-all flex items-center gap-3"
                >
                  Join the Protocol <ArrowRight size={20} />
                </button>
             </div>
             
             <div className="lg:w-1/2 grid grid-cols-2 gap-4">
                {[
                  { label: "zkTLS", sub: "MPC-TLS Tech", speed: 0.02 },
                  { label: "EAS", sub: "Global Standards", speed: -0.015 },
                  { label: "100%", label2: "Private", type: "stat", speed: 0.035 },
                  { label: "0", label2: "Storage", type: "stat", speed: -0.025 }
                ].map((item, i) => (
                  <div 
                    key={i} 
                    className="p-8 border border-white/10 rounded-[32px] bg-white/5 backdrop-blur-sm transition-transform duration-500"
                    style={{ transform: `translateY(${scrollY * item.speed}px)` }}
                  >
                    {item.type === "stat" ? (
                      <>
                        <div className="text-4xl font-black mb-1">{item.label}</div>
                        <div className="text-[10px] uppercase font-black tracking-widest text-white/30">{item.label2}</div>
                      </>
                    ) : (
                      <>
                        <div className="text-2xl font-black mb-1">{item.label}</div>
                        <div className="text-[10px] uppercase font-black tracking-widest text-white/30">{item.sub}</div>
                      </>
                    )}
                  </div>
                ))}
             </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="relative z-10 px-8 py-20 max-w-7xl mx-auto w-full flex flex-col items-center gap-12 text-center">
        <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center">
          <Fingerprint size={24} />
        </div>
        <div className="text-black/30 text-xs font-bold uppercase tracking-[0.4em]">
          The Future is Silent
        </div>
        <div className="h-px w-24 bg-black/10" />
        <div className="flex gap-12">
           {["Protocol", "Privacy", "Security", "GitHub"].map(item => (
             <a key={item} href="#" className="text-[11px] font-black uppercase tracking-widest text-black/40 hover:text-black transition-colors">{item}</a>
           ))}
        </div>
      </footer>

      {/* ── Selection Overlay ─────────────────────────────────────────────── */}
      {showOverlay && (
        <>
          <div
            onClick={() => setShowOverlay(false)}
            className="fixed inset-0 bg-white/40 backdrop-blur-2xl z-[100] animate-in fade-in duration-500"
          />

          <div className="fixed inset-0 z-[101] flex items-center justify-center p-6 pointer-events-none">
            <div className="bg-white/90 border border-white w-full max-w-2xl rounded-[48px] p-16 shadow-[0_40px_100px_rgba(0,0,0,0.1)] backdrop-blur-3xl pointer-events-auto animate-in zoom-in-95 fade-in slide-in-from-bottom-12 duration-700">
              <div className="flex items-center justify-between mb-16">
                <div>
                  <h2 className="text-5xl font-black tracking-tighter mb-2">ACCESS.</h2>
                  <p className="text-black/40 font-medium">Select your point of entry.</p>
                </div>
                <button
                  onClick={() => setShowOverlay(false)}
                  className="w-14 h-14 rounded-full bg-black/5 border border-black/[0.05] flex items-center justify-center hover:bg-black hover:text-white transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="group flex flex-col p-10 rounded-[40px] bg-black text-white hover:bg-black/90 transition-all text-left"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-8 shrink-0">
                    <User size={28} />
                  </div>
                  <h3 className="text-2xl font-black mb-2">Portal</h3>
                  <div className="mt-auto flex items-center gap-2 font-bold text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
                    Claim Identity <ArrowRight size={14} />
                  </div>
                </button>

                <button
                  onClick={() => router.push("/profile")}
                  className="group flex flex-col p-10 rounded-[40px] bg-white border border-black/[0.05] hover:border-black/20 transition-all text-left"
                >
                  <div className="w-14 h-14 rounded-2xl bg-black/5 flex items-center justify-center mb-8 shrink-0">
                    <Search size={28} className="text-black/60" />
                  </div>
                  <h3 className="text-2xl font-black mb-2">Explorer</h3>
                  <div className="mt-auto flex items-center gap-2 font-bold text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
                    Search Ledger <ArrowRight size={14} />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
