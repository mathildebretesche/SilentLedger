import Link from "next/link";
import { Fingerprint, ArrowRight, Shield, Zap, Lock } from "lucide-react";

export default function HomePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-base)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 800,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(124,58,237,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          maxWidth: 560,
          width: "100%",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 28px",
            boxShadow: "0 16px 48px rgba(124,58,237,0.4)",
          }}
        >
          <Fingerprint size={28} color="white" />
        </div>

        {/* Tagline badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 12px",
            background: "rgba(124,58,237,0.1)",
            border: "1px solid rgba(124,58,237,0.25)",
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 500,
            color: "var(--accent-light)",
            marginBottom: 20,
          }}
        >
          <Zap size={11} />
          ETH Denver 2026 · Proof of Intelligence
        </div>

        <h1
          style={{
            fontSize: 44,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            color: "var(--text-primary)",
            lineHeight: 1.15,
            marginBottom: 16,
          }}
        >
          Silent{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Ledger
          </span>
        </h1>

        <p
          style={{
            fontSize: 16,
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            marginBottom: 40,
            maxWidth: 440,
            margin: "0 auto 40px",
          }}
        >
          Transformez vos contributions GitHub, Discord et Slack en attestations
          on-chain anonymes via zkTLS. De la{" "}
          <em style={{ color: "var(--text-primary)", fontStyle: "normal", fontWeight: 500 }}>
            Proof of Stake
          </em>{" "}
          à la{" "}
          <em style={{ color: "var(--accent-light)", fontStyle: "normal", fontWeight: 600 }}>
            Proof of Knowledge
          </em>
          .
        </p>

        <Link
          href="/dashboard"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "14px 28px",
            background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
            color: "white",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            textDecoration: "none",
            transition: "transform 0.15s, box-shadow 0.15s",
            boxShadow: "0 8px 32px rgba(124,58,237,0.35)",
          }}
          id="open-dashboard-btn"
        >
          Launch App
          <ArrowRight size={16} />
        </Link>

        {/* Feature pills */}
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            marginTop: 48,
            flexWrap: "wrap",
          }}
        >
          {[
            { icon: <Lock size={13} />, label: "zkTLS Reclaim" },
            { icon: <Shield size={13} />, label: "EAS Attestations" },
            { icon: <Fingerprint size={13} />, label: "Pseudonyme" },
          ].map(({ icon, label }) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 20,
                fontSize: 12,
                color: "var(--text-secondary)",
              }}
            >
              {icon}
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
