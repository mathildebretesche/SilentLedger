"use client";

/**
 * SilentDashboard – /dashboard
 * ─────────────────────────────────────────────────────────────────────────────
 * Dashboard principal de Silent Ledger.
 *
 * Flux utilisateur :
 *   1. L'utilisateur connecte son wallet via RainbowKit (ConnectButton).
 *   2. Il saisit son username GitHub et clique "Stamp my Intelligence".
 *   3. ReclaimService génère une session zkTLS → affiche un QR code / lien.
 *   4. Une fois la preuve générée, on appelle SilentLedgerAttester.submitProof()
 *      via wagmi/writeContract, créant une attestation EAS permanente.
 *   5. Les attestations existantes sont lues via useReadContract (getAttestations).
 *   6. Chaque attestation s'affiche comme un "Silent Proof Badge".
 */

import { useState, useCallback } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  Shield,
  GitBranch,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Fingerprint,
  Zap,
} from "lucide-react";

import { initGitHubContributionsProof, type ZKProof } from "@/services/ReclaimService";
import {
  SILENT_LEDGER_ATTESTER_ABI,
  ATTESTER_ADDRESS,
} from "@/lib/contracts";

import { SilentProofBadge } from "@/components/SilentProofBadge";
import { BadgeSkeleton } from "@/components/BadgeSkeleton";
import { TxStatus } from "@/components/TxStatus";
import { StatRow } from "@/components/StatRow";

export default function SilentDashboard() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending: isTxPending } = useWriteContract();

  // ── State ─────────────────────────────────────────────────────────────────
  const [githubUsername, setGithubUsername] = useState("");
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [zkProof, setZkProof] = useState<ZKProof | null>(null);
  const [platformId, setPlatformId] = useState<`0x${string}` | null>(null);
  const [reputationScore, setReputationScore] = useState<bigint | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [txStatus, setTxStatus] = useState<{
    status: "success" | "error" | "pending";
    message: string;
  } | null>(null);

  // ── On-chain data ─────────────────────────────────────────────────────────
  const {
    data: attestationUIDs,
    isLoading: isLoadingAttestations,
    refetch: refetchAttestations,
  } = useReadContract({
    address: ATTESTER_ADDRESS,
    abi: SILENT_LEDGER_ATTESTER_ABI,
    functionName: "getAttestations",
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  });

  const attestations = (attestationUIDs as `0x${string}`[] | undefined) ?? [];

  // ── Handlers ──────────────────────────────────────────────────────────────

  /** Étape 1 : Lance le flux zkTLS Reclaim. */
  const handleStampIntelligence = useCallback(async () => {
    if (!githubUsername.trim()) return;
    setIsGenerating(true);
    setProofUrl(null);
    setZkProof(null);
    setTxStatus(null);

    try {
      const url = await initGitHubContributionsProof({
        githubUsername: githubUsername.trim(),
        onProofReady: async (result) => {
          setZkProof(result.proof);
          setPlatformId(result.platformId);
          setReputationScore(result.reputationScore);
          setIsGenerating(false);
        },
        onError: (err) => {
          setIsGenerating(false);
          setTxStatus({ status: "error", message: err.message });
        },
      });
      setProofUrl(url);
    } catch (err) {
      setIsGenerating(false);
      setTxStatus({
        status: "error",
        message: err instanceof Error ? err.message : "Erreur inconnue",
      });
    }
  }, [githubUsername]);

  /** Étape 2 : Soumet la preuve ZK on-chain via SilentLedgerAttester.submitProof(). */
  const handleSubmitOnChain = useCallback(async () => {
    if (!zkProof || !platformId || reputationScore === null) return;
    setTxStatus({ status: "pending", message: "Signature de la transaction…" });

    try {
      const rawProof = JSON.parse(zkProof.raw);
      const uid = await writeContractAsync({
        address: ATTESTER_ADDRESS,
        abi: SILENT_LEDGER_ATTESTER_ABI,
        functionName: "submitProof",
        args: [rawProof, platformId, reputationScore],
      });

      setTxStatus({
        status: "success",
        message: `Attestation créée ! UID: ${uid?.slice(0, 12)}…`,
      });
      setZkProof(null);
      setProofUrl(null);
      setGithubUsername("");
      await refetchAttestations();
    } catch (err) {
      setTxStatus({
        status: "error",
        message: err instanceof Error ? err.message : "Transaction échouée",
      });
    }
  }, [zkProof, platformId, reputationScore, writeContractAsync, refetchAttestations]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-base)",
        padding: "0 24px 64px",
      }}
    >
      {/* ── Ambient background glow ─────────────────────────────────────── */}
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
          background:
            "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header
        style={{
          maxWidth: 900,
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

        <ConnectButton accountStatus="avatar" chainStatus="icon" showBalance={false} />
      </header>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main
        style={{
          maxWidth: 900,
          margin: "64px auto 0",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* ── Hero card ───────────────────────────────────────────────── */}
        <div
          className="glass-card"
          style={{ gridColumn: "1 / -1", padding: "40px 40px 36px" }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "rgba(124,58,237,0.15)",
                border: "1px solid rgba(124,58,237,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Zap size={22} color="#a78bfa" />
            </div>
            <div>
              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                Proof of Intelligence
              </h1>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--text-secondary)",
                  marginTop: 6,
                  maxWidth: 480,
                  lineHeight: 1.6,
                }}
              >
                Transformez vos contributions Web2 en attestations on-chain
                anonymes via zkTLS. Pas de richesse, seulement du talent.
              </p>
            </div>
          </div>

          {/* ── Stamp form ─────────────────────────────────────────────── */}
          <div style={{ marginTop: 32 }}>
            {!isConnected ? (
              <div
                style={{
                  padding: "16px 20px",
                  background: "rgba(124,58,237,0.06)",
                  border: "1px dashed rgba(124,58,237,0.3)",
                  borderRadius: 10,
                  textAlign: "center",
                  color: "var(--text-secondary)",
                  fontSize: 14,
                }}
              >
                Connectez votre wallet pour commencer
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Username input */}
                <div style={{ display: "flex", gap: 10 }}>
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      padding: "0 14px",
                      gap: 10,
                    }}
                  >
                    <GitBranch size={15} color="var(--text-muted)" />
                    <input
                      type="text"
                      placeholder="GitHub username…"
                      value={githubUsername}
                      onChange={(e) => setGithubUsername(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleStampIntelligence()}
                      style={{
                        flex: 1,
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        fontSize: 14,
                        color: "var(--text-primary)",
                        padding: "12px 0",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>

                  <button
                    className="btn-stamp"
                    onClick={handleStampIntelligence}
                    disabled={!githubUsername.trim() || isGenerating || isTxPending}
                    style={{ whiteSpace: "nowrap" }}
                    id="stamp-intelligence-btn"
                  >
                    {isGenerating ? (
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Loader2 size={14} className="animate-spin" />
                        Génération…
                      </span>
                    ) : (
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Shield size={14} />
                        Stamp my Intelligence
                      </span>
                    )}
                  </button>
                </div>

                {/* Reclaim QR / Link */}
                {proofUrl && !zkProof && (
                  <div
                    style={{
                      padding: "16px",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 13,
                        color: "var(--text-secondary)",
                        marginBottom: 10,
                      }}
                    >
                      Ouvrez ce lien sur votre téléphone pour générer la preuve zkTLS :
                    </p>
                    <a
                      href={proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--accent-light)",
                        textDecoration: "none",
                        wordBreak: "break-all",
                      }}
                    >
                      <ExternalLink size={13} />
                      {proofUrl.length > 60 ? proofUrl.slice(0, 60) + "…" : proofUrl}
                    </a>
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        marginTop: 10,
                      }}
                    >
                      En attente de la preuve ZK…
                      <Loader2
                        size={11}
                        style={{ display: "inline", marginLeft: 6, verticalAlign: "middle" }}
                        className="animate-spin"
                      />
                    </p>
                  </div>
                )}

                {/* Proof ready → submit on-chain */}
                {zkProof && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 16px",
                      background: "rgba(34,197,94,0.06)",
                      border: "1px solid rgba(34,197,94,0.2)",
                      borderRadius: 10,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <CheckCircle2 size={16} color="var(--green)" />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                          Preuve ZK générée avec succès
                        </p>
                        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          Score: {reputationScore?.toString() ?? "—"} contributions
                        </p>
                      </div>
                    </div>
                    <button
                      className="btn-stamp"
                      onClick={handleSubmitOnChain}
                      disabled={isTxPending}
                      style={{ fontSize: 13, padding: "10px 18px" }}
                    >
                      {isTxPending ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        "Ancrer on-chain →"
                      )}
                    </button>
                  </div>
                )}

                {/* Tx status */}
                {txStatus && (
                  <TxStatus status={txStatus.status} message={txStatus.message} />
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Stats card ──────────────────────────────────────────────── */}
        <div className="glass-card" style={{ padding: "28px 28px 24px" }}>
          <h2
            style={{
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text-muted)",
              marginBottom: 20,
            }}
          >
            Statistiques
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <StatRow label="Silent Proofs" value={attestations.length.toString()} accent />
            <StatRow label="Plateforme" value={isConnected ? "Sepolia Testnet" : "—"} />
            <StatRow label="Protocole ZK" value="Reclaim zkTLS" />
            <StatRow label="Ancrage" value="EAS v1.3.0" />
          </div>
        </div>

        {/* ── How it works card ───────────────────────────────────────── */}
        <div className="glass-card" style={{ padding: "28px 28px 24px" }}>
          <h2
            style={{
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text-muted)",
              marginBottom: 20,
            }}
          >
            Comment ça marche
          </h2>
          <ol style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              ["1", "Entrez votre username GitHub"],
              ["2", "Scan du QR Reclaim (zkTLS)"],
              ["3", "Preuve vérifiée on-chain (EAS)"],
              ["4", "Badge souverain et anonyme"],
            ].map(([step, text]) => (
              <li key={step} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "rgba(124,58,237,0.15)",
                    border: "1px solid rgba(124,58,237,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--accent-light)",
                    flexShrink: 0,
                  }}
                >
                  {step}
                </span>
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{text}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* ── Silent Proofs list ──────────────────────────────────────── */}
        <div
          className="glass-card"
          style={{ gridColumn: "1 / -1", padding: "28px 28px 24px" }}
        >
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
          </div>

          {/* Content */}
          {!isConnected ? (
            <p
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                textAlign: "center",
                padding: "24px 0",
              }}
            >
              Connectez votre wallet pour voir vos attestations.
            </p>
          ) : isLoadingAttestations ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <BadgeSkeleton />
              <BadgeSkeleton />
            </div>
          ) : attestations.length === 0 ? (
            <div
              style={{
                padding: "32px",
                textAlign: "center",
                border: "1px dashed var(--border)",
                borderRadius: 10,
              }}
            >
              <Shield
                size={28}
                color="var(--text-muted)"
                style={{ margin: "0 auto 12px" }}
              />
              <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>
                Aucune attestation pour l'instant.
                <br />
                <span style={{ color: "var(--text-secondary)" }}>
                  Stampez votre première contribution GitHub ci-dessus.
                </span>
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {attestations.map((uid, i) => (
                <SilentProofBadge key={uid} attestation={{ uid }} index={i} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
