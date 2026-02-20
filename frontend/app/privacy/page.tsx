"use client";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Eye, Lock, Server, Key, Layers, Zap, ShieldCheck } from "lucide-react";

const sections = [
  {
    id: "zktls",
    icon: <Lock size={20} />,
    label: "zkTLS",
    heading: "Your credentials never leave your device.",
    body: [
      "Traditional reputation systems ask you to prove who you are by handing over session cookies, OAuth tokens, or API keys. Those secrets get sent to a third-party server, logged, and stored. You have no idea what happens to them after.",
      "Silent Ledger uses zkTLS — a cryptographic protocol built on top of the standard TLS handshake. When your browser communicates with GitHub, Discord, or any other platform, we intercept nothing. Instead, a Multi-Party Computation (MPC) cluster acts as a co-signer in the TLS session: it can attest that the data you received is authentic, without ever seeing the content.",
      "The result is a cryptographic proof. Not a copy of your data — a mathematical statement that says \"this response genuinely came from this server.\" That proof goes on-chain. Your token stays on your machine.",
    ],
  },
  {
    id: "zk-circuit",
    icon: <Layers size={20} />,
    label: "ZK Circuits",
    heading: "What gets proven, and nothing more.",
    body: [
      "Even after the TLS layer is verified, you still control what you disclose. The raw attestation contains your username, contribution counts, account metadata, and more. None of that goes on-chain as-is.",
      "Silent Ledger feeds the attestation through a zero-knowledge circuit — a program that can prove a statement about data without revealing the data itself. The circuit outputs a single bit per claim: \"this user has more than 50 GitHub contributions\" — true or false. No username. No email. No linked identity.",
      "This is selective disclosure by design, not by policy. You can prove seniority without proving identity, expertise without proving employment history, and reputation without proving anything about your personal life.",
    ],
  },
  {
    id: "on-chain",
    icon: <Key size={20} />,
    label: "On-Chain Storage",
    heading: "What is written to the blockchain — and what isn't.",
    body: [
      "The attestation stored on-chain via EAS (Ethereum Attestation Service) contains only the output of the ZK circuit: a boolean claim, a schema identifier, a block timestamp, and a nullifier hash. No raw data, no plaintext, no reverse-engineerable fields.",
      "The nullifier is a one-way hash derived from your credential. It prevents the same credential from being submitted twice, without linking the on-chain attestation to any off-chain identity. You can rotate credentials, and your on-chain history stays separate.",
      "Badges are issued as Soulbound Tokens (SBTs, ERC-5192). They are non-transferable by protocol. Reputation cannot be bought, sold, or delegated.",
    ],
  },
  {
    id: "no-storage",
    icon: <Server size={20} />,
    label: "Zero Storage",
    heading: "We don't run a database.",
    body: [
      "Silent Ledger has no backend. There is no server that stores your proofs, caches your credentials, or tracks your sessions. The MPC nodes are ephemeral — they participate in a single TLS attestation and discard all state.",
      "The on-chain record is the only persistent artifact. It is public, auditable, and under your control. No account to delete. No GDPR request to file. Nothing to breach.",
      "The frontend is a static Next.js application served from a CDN. It reads from the blockchain and from your local wallet. It writes nothing to any server.",
    ],
  },
  {
    id: "threat-model",
    icon: <Eye size={20} />,
    label: "Threat Model",
    heading: "What we protect against — and what we don't claim.",
    body: [
      "Smart adversary with network access: cannot recover your session token from the ZK proof or the on-chain attestation. The MPC protocol is designed so that no single node learns the full TLS session — compromise requires collusion of all MPC participants simultaneously.",
      "Blockchain analytics: on-chain data contains no username, no email, no linked address by default. Correlation is only possible if you voluntarily link your wallet to an external identity — which is outside our protocol.",
      "What we do not promise: if you publicly link your wallet address to your real name (on social media, ENS, etc.), on-chain attestations become attributable. Pseudonymity is a tool, not a guarantee. The protocol gives you the option to be anonymous. What you do with that option is up to you.",
    ],
  },
  {
    id: "open-source",
    icon: <Zap size={20} />,
    label: "Verifiability",
    heading: "Don't trust us. Verify.",
    body: [
      "The ZK circuits are published and reproducible. Anyone can compile the circuit from source and verify that the proving key matches. There is no hidden constraint, no backdoor input, no trusted setup owned by the team.",
      "The smart contracts are verified on Etherscan. The attestation schema is public on EAS. The frontend source code is open — you can read every line that runs in your browser before connecting your wallet.",
      "Privacy should not be a product feature. It should be a provable property of the system.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      <Header maxWidthClass="max-w-5xl" />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="px-8 pt-16 pb-24 max-w-5xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-card border flex border-white/60 text-[11px] font-bold uppercase tracking-wider text-accent mb-10">
          <ShieldCheck size={12} />
          Privacy Architecture
        </div>
        <h1 className="text-6xl lg:text-[88px] font-black tracking-tighter leading-[0.85] mb-8 text-primary">
          HOW<br />
          <span className="text-transparent" style={{ WebkitTextStroke: "1.5px rgba(15,23,42,0.4)" }}>PRIVACY</span><br />
          WORKS.
        </h1>
        <p className="text-xl text-secondary max-w-xl leading-relaxed font-medium">
          This is not a privacy policy. It is a technical explanation of why this system cannot compromise your identity — even if it wanted to.
        </p>

        {/* ── Quick nav ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mt-12">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-white/40 shadow-sm text-[11px] font-black uppercase tracking-widest text-secondary hover:text-accent hover:border-white/80 transition-all"
            >
              {s.icon}
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
            {/* Left — sticky label */}
            <div className="flex flex-col gap-4 lg:pt-1">
              <div className="flex items-center gap-2 text-accent">
                {s.icon}
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
          <div className="glass-card text-primary. rounded-[40px] p-12 lg:p-16 relative overflow-hidden">
            <div
              className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-30"
              style={{
                background: "radial-gradient(circle, #20349F 0%, transparent 70%)",
                filter: "blur(80px)",
                transform: "translate(30%, -30%)",
              }}
            />
            <div className="relative z-10 max-w-xl">
              <p className="text-[11px] font-black uppercase tracking-widest text-secondary/50 mb-6">Summary</p>
              <p className="text-3xl lg:text-4xl font-black tracking-tight leading-tight mb-8">
                Your secret never moves.<br />
                <span className="text-primary/40">Only the proof does.</span>
              </p>
              <p className="text-base text-secondary leading-relaxed">
                zkTLS proves the data is authentic. The ZK circuit proves the claim without revealing the data.
                The SBT records the proof without storing the claim. At no point does a private credential leave your control.
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
