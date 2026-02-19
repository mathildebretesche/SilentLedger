"use client";

/**
 * ProfilePage – /profile
 * Read-only view of any wallet address's Silent Proof attestations.
 * No wallet connection required.
 */

import { useState } from "react";
import Link from "next/link";
import { useReadContract } from "wagmi";
import {
  ArrowLeft,
  Search,
  Fingerprint,
  GitBranch,
  ExternalLink,
  Shield,
  AlertCircle,
} from "lucide-react";
import { isAddress } from "viem";

import {
  SILENT_LEDGER_ATTESTER_ABI,
  ATTESTER_ADDRESS,
  EAS_EXPLORER_URL,
} from "@/lib/contracts";

// ── Sub-components ─────────────────────────────────────────────────────────

function SilentProofBadge({
  attestation,
  index,
}: {
  attestation: { uid: `0x${string}` };
  index: number;
}) {
  const truncatedUid = `${attestation.uid.slice(0, 10)}…${attestation.uid.slice(-6)}`;
  return (
    <div className="proof-badge" style={{ animationDelay: `${index * 60}ms` }}>
      <div className="pulse-dot flex-shrink-0" />
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: "rgba(124,58,237,0.15)",
          border: "1px solid rgba(124,58,237,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <GitBranch size={16} color="#a78bfa" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
            GitHub Contribution Proof
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "var(--green)",
              background: "var(--green-dim)",
              padding: "2px 8px",
              borderRadius: 4,
            }}
          >
            VERIFIED
          </span>
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            fontFamily: "monospace",
            marginTop: 2,
          }}
        >
          UID: {truncatedUid}
        </div>
      </div>
      <a
        href={`${EAS_EXPLORER_URL}/${attestation.uid}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: "var(--text-muted)", flexShrink: 0 }}
        title="View on EAS Explorer"
      >
        <ExternalLink size={14} />
      </a>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [inputValue, setInputValue] = useState("");
  const [searchedAddress, setSearchedAddress] = useState<`0x${string}` | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);

  // Fetch attestations only when a valid address has been searched
  const {
    data: attestationUIDs,
    isLoading,
    isFetching,
  } = useReadContract({
    address: ATTESTER_ADDRESS,
    abi: SILENT_LEDGER_ATTESTER_ABI,
    functionName: "getAttestations",
    args: searchedAddress ? [searchedAddress] : undefined,
    query: { enabled: !!searchedAddress },
  });

  const attestations = (attestationUIDs as `0x${string}`[] | undefined) ?? [];

  const handleSearch = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setInputError("Please enter a wallet address.");
      return;
    }
    if (!isAddress(trimmed)) {
      setInputError("Invalid Ethereum address.");
      return;
    }
    setInputError(null);
    setSearchedAddress(trimmed as `0x${string}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-base)",
        padding: "0 24px 64px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: "-30%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Header */}
      <header
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "32px 0 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Fingerprint size={18} color="white" />
          </div>
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
            }}
          >
            Silent Ledger
          </span>
        </div>

        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 500,
            color: "var(--text-secondary)",
            textDecoration: "none",
            transition: "color 0.15s",
          }}
          id="back-to-home-link"
        >
          <ArrowLeft size={14} />
          Back
        </Link>
      </header>

      {/* Main */}
      <main
        style={{
          maxWidth: 720,
          margin: "64px auto 0",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Page title */}
        <div style={{ marginBottom: 36 }}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: "var(--text-primary)",
              marginBottom: 8,
            }}
          >
            Check a{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Profile
            </span>
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Enter any Ethereum wallet address to inspect their on-chain Silent Proofs.
          </p>
        </div>

        {/* Search bar */}
        <div
          className="glass-card"
          style={{ padding: "24px", marginBottom: 24 }}
        >
          <div style={{ display: "flex", gap: 10 }}>
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                background: "var(--bg-elevated)",
                border: `1px solid ${inputError ? "rgba(239,68,68,0.5)" : "var(--border)"}`,
                borderRadius: 8,
                padding: "0 14px",
                gap: 10,
                transition: "border-color 0.15s",
              }}
            >
              <Search size={15} color="var(--text-muted)" />
              <input
                id="profile-address-input"
                type="text"
                placeholder="0x… wallet address"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setInputError(null);
                }}
                onKeyDown={handleKeyDown}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  color: "var(--text-primary)",
                  padding: "13px 0",
                  fontFamily: "monospace",
                }}
              />
            </div>
            <button
              id="profile-search-btn"
              className="btn-stamp"
              onClick={handleSearch}
              style={{ whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 8 }}
            >
              <Search size={14} />
              Look up
            </button>
          </div>

          {inputError && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginTop: 10,
                fontSize: 12,
                color: "#ef4444",
              }}
            >
              <AlertCircle size={13} />
              {inputError}
            </div>
          )}
        </div>

        {/* Results */}
        {searchedAddress && (
          <div className="glass-card" style={{ padding: "28px" }}>
            {/* Searched address label */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <h2
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--text-muted)",
                }}
              >
                Silent Proofs{" "}
                {attestations.length > 0 && (
                  <span
                    style={{
                      fontSize: 11,
                      background: "rgba(124,58,237,0.2)",
                      color: "var(--accent-light)",
                      padding: "2px 7px",
                      borderRadius: 4,
                      marginLeft: 6,
                      fontWeight: 700,
                    }}
                  >
                    {attestations.length}
                  </span>
                )}
              </h2>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  fontFamily: "monospace",
                }}
              >
                {searchedAddress.slice(0, 8)}…{searchedAddress.slice(-6)}
              </span>
            </div>

            {/* Loading */}
            {(isLoading || isFetching) && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="shimmer"
                    style={{ height: 64, borderRadius: 10, border: "1px solid var(--border)" }}
                  />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!isLoading && !isFetching && attestations.length === 0 && (
              <div
                style={{
                  padding: "40px 32px",
                  textAlign: "center",
                  border: "1px dashed var(--border)",
                  borderRadius: 10,
                }}
              >
                <Shield
                  size={32}
                  color="var(--text-muted)"
                  style={{ margin: "0 auto 12px" }}
                />
                <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
                  No Silent Proofs found for this address.
                </p>
              </div>
            )}

            {/* Badges */}
            {!isLoading && !isFetching && attestations.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {attestations.map((uid, i) => (
                  <SilentProofBadge key={uid} attestation={{ uid }} index={i} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
