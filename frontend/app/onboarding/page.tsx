"use client";

/**
 * /onboarding – Premier pas dans Silent Ledger
 * ─────────────────────────────────────────────────────────────────────────────
 * L'utilisateur arrive ici si son wallet ne possède aucune attestation.
 *
 * Flux :
 *   1. Wallet non connecté     → redirection vers /enter
 *   2. Wallet connecté         → affiche le formulaire de preuve GitHub
 *   3. Preuve zkTLS générée    → soumission on-chain via SilentLedgerAttester
 *   4. Attestation confirmée   → redirection automatique vers /dashboard
 */

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  Shield,
  Loader2,
  CheckCircle2,
  Fingerprint,
  Sparkles,
} from "lucide-react";
import { initGitHubProof, type ZKProof } from "@/services/ReclaimService";
import {
  SILENT_LEDGER_ATTESTER_ABI,
  ATTESTER_ADDRESS,
} from "@/lib/contracts";
import { TxStatus } from "@/components/TxStatus";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";

// ── Étapes d'onboarding visibles en haut ────────────────────────────────────
const STEPS = [
  { id: 1, label: "Connectez votre wallet" },
  { id: 2, label: "Prouvez un compte" },
  { id: 3, label: "Bienvenue sur le dashboard" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending: isTxPending } = useWriteContract();

  // Redirect si non connecté
  useEffect(() => {
    if (!isConnected) {
      router.replace("/enter");
    }
  }, [isConnected, router]);

  // Lecture des attestations on-chain
  const { data: attestationUIDs, isLoading: isLoadingAttestations } =
    useReadContract({
      address: ATTESTER_ADDRESS,
      abi: SILENT_LEDGER_ATTESTER_ABI,
      functionName: "getAttestations",
      args: address ? [address] : undefined,
      query: {
        enabled: isConnected && !!address,
        staleTime: 0,
        refetchOnMount: "always"
      },
    });

  // ── Mode développement ───────────────────────────────────────────────────
  const DEV_BYPASS_ONBOARDING = true; // Si true, on force à rester sur l'onboarding pour test

  // Redirection automatique si des attestations existent déjà
  useEffect(() => {
    if (!isConnected || isLoadingAttestations || DEV_BYPASS_ONBOARDING) return;
    const count = (attestationUIDs as `0x${string}`[] | undefined)?.length ?? 0;
    if (count > 0) {
      router.replace("/dashboard");
    }
  }, [isConnected, isLoadingAttestations, attestationUIDs, router]);

  // ── State ──────────────────────────────────────────────────────────────────
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [zkProof, setZkProof] = useState<ZKProof | null>(null);
  const [platformId, setPlatformId] = useState<`0x${string}` | null>(null);
  const [reputationScore, setReputationScore] = useState<bigint | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [txStatus, setTxStatus] = useState<{
    status: "success" | "error" | "pending";
    message: string;
  } | null>(null);
  const [proofCount, setProofCount] = useState(0);
  const [redirecting, setRedirecting] = useState(false);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleStampIntelligence = useCallback(async () => {
    if (!address) return;
    setIsGenerating(true);
    setProofUrl(null);
    setZkProof(null);
    setTxStatus(null);

    try {
      const url = await initGitHubProof({
        walletAddress: address,
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
  }, [address]);

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
        gas: 3_000_000n,
      });

      setTxStatus({
        status: "success",
        message: `Attestation créée ! UID : ${uid?.slice(0, 12)}…`,
      });
      setZkProof(null);
      setProofUrl(null);

      const newCount = proofCount + 1;
      setProofCount(newCount);

      // ≥ 1 preuve → on redirige vers le dashboard dans 2 s
      if (newCount >= 1) {
        setRedirecting(true);
        setTimeout(() => router.replace("/dashboard"), 2000);
      }
    } catch (err) {
      setTxStatus({
        status: "error",
        message: err instanceof Error ? err.message : "Transaction échouée",
      });
    }
  }, [zkProof, platformId, reputationScore, writeContractAsync, proofCount, router]);

  // ── Calcul de l'étape active ───────────────────────────────────────────────
  const activeStep = !isConnected ? 1 : proofCount === 0 ? 2 : 3;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        className="fixed pointer-events-none"
        style={{
          top: "-20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(32,52,159,0.1) 0%, transparent 70%)",
          filter: "blur(120px)",
          zIndex: 0,
        }}
      />

      <main
        className="relative z-10 max-w-2xl mx-auto px-6 py-20 flex flex-col gap-10"
      >
        {/* ── En-tête ─────────────────────────────────────────────────────── */}
        <div className="text-center">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
            style={{
              background: "rgba(32,52,159,0.15)",
              border: "1px solid rgba(32,52,159,0.3)",
            }}
          >
            <Fingerprint size={28} style={{ color: "var(--accent)" }} />
          </div>
          <h1
            className="text-4xl font-black tracking-tighter mb-3"
            style={{ color: "var(--text-primary)" }}
          >
            Bienvenue sur Silent Ledger
          </h1>
          <p
            className="text-sm leading-relaxed max-w-md mx-auto"
            style={{ color: "var(--text-secondary)" }}
          >
            Prouvez au moins un compte pour créer votre identité souveraine
            anonyme. Aucune donnée personnelle n&apos;est stockée.
          </p>
        </div>

        {/* ── Étapes ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-0">
          {STEPS.map((step, i) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                  style={{
                    background:
                      activeStep > step.id
                        ? "var(--green, #22c55e)"
                        : activeStep === step.id
                          ? "var(--accent)"
                          : "rgba(255,255,255,0.1)",
                    color:
                      activeStep >= step.id ? "white" : "var(--text-muted)",
                    border:
                      activeStep === step.id
                        ? "2px solid rgba(32,52,159,0.5)"
                        : "none",
                  }}
                >
                  {activeStep > step.id ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    step.id
                  )}
                </div>
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap"
                  style={{
                    color:
                      activeStep === step.id
                        ? "var(--text-primary)"
                        : "var(--text-muted)",
                  }}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="w-16 h-px mx-2 mb-5"
                  style={{
                    background:
                      activeStep > step.id
                        ? "var(--green, #22c55e)"
                        : "rgba(255,255,255,0.15)",
                    transition: "background 0.3s",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* ── Formulaire GitHub ────────────────────────────────────────────── */}
        <div
          className="glass-card"
          style={{ padding: "36px 36px 32px" }}
        >
          {!isConnected ? (
            /* Wallet non connecté */
            <div className="flex flex-col items-center gap-4 text-center py-8">
              <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                Connectez votre portefeuille pour commencer l&apos;onboarding.
              </p>
              <ConnectButton.Custom>
                {({
                  account,
                  chain,
                  openConnectModal,
                  mounted,
                }) => {
                  const ready = mounted;
                  const connected = ready && account && chain;

                  return (
                    <div
                      {...(!ready && {
                        "aria-hidden": true,
                        style: {
                          opacity: 0,
                          pointerEvents: "none",
                          userSelect: "none",
                        },
                      })}
                    >
                      {(() => {
                        if (!connected) {
                          return (
                            <button
                              onClick={openConnectModal}
                              type="button"
                              className="btn-stamp"
                              style={{ padding: "12px 24px", fontSize: 14 }}
                            >
                              Connecter mon portefeuille
                            </button>
                          );
                        }
                        return null; // The outer condition (!isConnected) handles the connected state
                      })()}
                    </div>
                  );
                }}
              </ConnectButton.Custom>
            </div>
          ) : redirecting ? (
            /* Redirection en cours */
            <div className="flex flex-col items-center gap-4 text-center py-8">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: "rgba(34,197,94,0.12)",
                  border: "1px solid rgba(34,197,94,0.3)",
                }}
              >
                <Sparkles size={28} color="#22c55e" />
              </div>
              <div>
                <h3
                  className="text-xl font-black tracking-tight mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  Identité créée !
                </h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  Redirection vers votre dashboard…
                </p>
              </div>
              <Loader2 size={18} className="animate-spin" style={{ color: "var(--accent)" }} />
            </div>
          ) : (
            /* Formulaire de preuve */
            <div className="flex flex-col gap-5">
              <div>
                <h2
                  className="text-lg font-black tracking-tight mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  Prouvez votre compte GitHub
                </h2>
                <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  Vos contributions seront converties en attestation zkTLS
                  anonyme ancrée on-chain via EAS.
                </p>
              </div>

              {/* Input + bouton */}
              <div className="flex gap-3">
                <button
                  className="btn-stamp"
                  onClick={handleStampIntelligence}
                  disabled={isGenerating || isTxPending}
                  style={{ whiteSpace: "nowrap" }}
                >
                  {isGenerating ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      Génération…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Shield size={14} />
                      Vérifier mon compte GitHub
                    </span>
                  )}
                </button>
              </div>

              {/* Lien Reclaim */}
              {proofUrl && !zkProof && (
                <QRCodeDisplay url={proofUrl} waiting />
              )}

              {/* Preuve prête → ancrer on-chain */}
              {zkProof && (
                <div
                  className="flex items-center justify-between rounded-xl p-4"
                  style={{
                    background: "rgba(34,197,94,0.06)",
                    border: "1px solid rgba(34,197,94,0.2)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={16} color="var(--green, #22c55e)" />
                    <div>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--text-primary)",
                        }}
                      >
                        Preuve ZK générée avec succès
                      </p>
                      <p
                        style={{ fontSize: 12, color: "var(--text-muted)" }}
                      >
                        Score : {reputationScore?.toString() ?? "—"}{" "}
                        contributions
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

              {/* Statut de la transaction */}
              {txStatus && (
                <TxStatus
                  status={txStatus.status}
                  message={txStatus.message}
                />
              )}
            </div>
          )}
        </div>

        {/* ── Note bas de page ─────────────────────────────────────────────── */}
        {isConnected && !redirecting && (
          <p
            className="text-center text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            Minimum 1 compte prouvé requis pour accéder au dashboard.
            <br />
            Vous pourrez en ajouter d&apos;autres depuis votre espace.
          </p>
        )}
      </main>
    </div>
  );
}
