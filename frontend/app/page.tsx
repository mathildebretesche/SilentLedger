"use client";

/**
 * HomePage – page.tsx
 * Landing page with an animated selection overlay triggered by "Launch App".
 *
 * Flow:
 *  Landing hero  ──[Launch App]──▶  Selection overlay
 *                                        ├─[My Profile]──▶  /dashboard  (wallet connect)
 *                                        └─[Check a Profile]──▶  /profile  (address search)
 */

import { useState } from "react";
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
  ChevronRight,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [showOverlay, setShowOverlay] = useState(false);

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
      {/* ── Background glow ──────────────────────────────────────────────── */}
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

      {/* ── Landing Hero ─────────────────────────────────────────────────── */}
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

        {/* Launch App CTA */}
        <button
          id="launch-app-btn"
          onClick={() => setShowOverlay(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "14px 28px",
            background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
            color: "white",
            border: "none",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            transition: "transform 0.15s, box-shadow 0.15s",
            boxShadow: "0 8px 32px rgba(124,58,237,0.35)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 12px 40px rgba(124,58,237,0.5)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 8px 32px rgba(124,58,237,0.35)";
          }}
        >
          Launch App
          <ArrowRight size={16} />
        </button>

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

      {/* ── Selection Overlay ─────────────────────────────────────────────── */}
      {showOverlay && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowOverlay(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              zIndex: 10,
              animation: "fadeIn 0.2s ease both",
            }}
          />

          {/* Panel */}
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 11,
              width: "100%",
              maxWidth: 520,
              padding: "0 24px",
              animation: "fadeInUp 0.25s ease both",
            }}
          >
            {/* Card */}
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-hover)",
                borderRadius: 20,
                padding: "36px 32px",
                boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.15)",
              }}
            >
              {/* Header row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      letterSpacing: "-0.03em",
                      color: "var(--text-primary)",
                    }}
                  >
                    How do you want to proceed?
                  </h2>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
                    Choose your experience below.
                  </p>
                </div>
                <button
                  id="close-overlay-btn"
                  onClick={() => setShowOverlay(false)}
                  style={{
                    width: 32,
                    height: 32,
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    background: "transparent",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "border-color 0.15s, color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "var(--border-hover)";
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
                  }}
                  aria-label="Close"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Divider */}
              <div
                style={{
                  height: 1,
                  background: "var(--border)",
                  margin: "20px 0 24px",
                }}
              />

              {/* Option cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* My Profile */}
                <OptionCard
                  id="my-profile-btn"
                  icon={
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(91,33,182,0.25))",
                        border: "1px solid rgba(124,58,237,0.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <User size={20} color="#a78bfa" />
                    </div>
                  }
                  title="My Profile"
                  subtitle="Connect your wallet to view and stamp your on-chain intelligence."
                  onClick={() => router.push("/dashboard")}
                />

                {/* Check a Profile */}
                <OptionCard
                  id="check-profile-btn"
                  icon={
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid var(--border-hover)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Search size={20} color="var(--text-secondary)" />
                    </div>
                  }
                  title="Check a Profile"
                  subtitle="Enter any wallet address to inspect their Silent Proof attestations."
                  onClick={() => router.push("/profile")}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Option Card ───────────────────────────────────────────────────────────────

function OptionCard({
  id,
  icon,
  title,
  subtitle,
  onClick,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      id={id}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "18px 20px",
        background: hovered ? "rgba(124,58,237,0.06)" : "var(--bg-elevated)",
        border: `1px solid ${hovered ? "rgba(124,58,237,0.3)" : "var(--border)"}`,
        borderRadius: 14,
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        transition: "background 0.15s, border-color 0.15s, transform 0.1s",
        transform: hovered ? "translateY(-1px)" : "translateY(0)",
      }}
    >
      {icon}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--text-primary)",
            letterSpacing: "-0.01em",
            marginBottom: 3,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
          {subtitle}
        </div>
      </div>
      <ChevronRight
        size={16}
        color={hovered ? "var(--accent-light)" : "var(--text-muted)"}
        style={{ flexShrink: 0, transition: "color 0.15s" }}
      />
    </button>
  );
}
