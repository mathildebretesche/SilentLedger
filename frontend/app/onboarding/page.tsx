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
import { Footer } from "@/components/Footer";
import {
  Github,
  Twitter,
  Linkedin,
  Sparkles,
  Shield,
  Loader2,
  CheckCircle2,
  Fingerprint,
  X,
} from "lucide-react";
import { initPlatformProof, type ZKProof, type SupportedPlatform } from "@/services/ReclaimService";
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

  // ── Redirections ───────────────────────────────────────────────────────────
  // Auparavant il y avait un redirect vers /enter si non connecté.
  // Désactivé à la demande de l'utilisateur pour rester sur /onboarding.

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
  const DEV_BYPASS_ONBOARDING = true; // Remis à false en prod pour bien rediriger vers dashboard si déjà onboardé

  // Redirection automatique si des attestations existent déjà
  useEffect(() => {
    // On ne redirige que si on est sûr d'être connecté et que les données sont chargées
    if (!isConnected || isLoadingAttestations) return;

    // Si on a déjà des attestations, on n'a plus rien à faire sur l'onboarding
    const count = (attestationUIDs as `0x${string}`[] | undefined)?.length ?? 0;
    if (count > 0) {
      router.replace("/dashboard");
    }
  }, [isConnected, isLoadingAttestations, attestationUIDs, router]);

  // ── State ──────────────────────────────────────────────────────────────────
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [zkProof, setZkProof] = useState<ZKProof | null>(null);
  const [platformId, setPlatformId] = useState<`0x${string}` | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<SupportedPlatform>("github");
  const [reputationScore, setReputationScore] = useState<bigint | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
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
    setIsSuccess(false);
    setIsClosing(false);
    setProofUrl(null);
    setZkProof(null);
    setTxStatus(null);

    try {
      const url = await initPlatformProof({
        platform: selectedPlatform,
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
          setShowProofModal(false);
        },
      });
      setProofUrl(url);
      setShowProofModal(true);
    } catch (err) {
      setIsGenerating(false);
      setTxStatus({
        status: "error",
        message: err instanceof Error ? err.message : "Erreur inconnue",
      });
    }
  }, [address, selectedPlatform]);

  /** Fermeture animée du modal */
  const closeProofModal = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setShowProofModal(false);
      setIsClosing(false);
      setIsSuccess(false);
      setIsGenerating(false);
    }, 300);
  }, []);

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
        message: `Attestation créée ! UID: ${uid?.slice(0, 12)}…`,
      });
      setIsSuccess(true);
      setZkProof(null);
      setProofUrl(null);

      // Laisser le temps à l'utilisateur de voir le succès
      setTimeout(() => {
        closeProofModal();
        setProofCount((prev) => prev + 1);

        // ≥ 1 preuve → on redirige vers le dashboard dans 2 s
        if (proofCount + 1 >= 1) {
          setRedirecting(true);
          setTimeout(() => router.replace("/dashboard"), 1500);
        }
      }, 2000);
    } catch (err) {
      setTxStatus({
        status: "error",
        message: err instanceof Error ? err.message : "Transaction échouée",
      });
    }
  }, [
    zkProof,
    platformId,
    reputationScore,
    writeContractAsync,
    router,
    proofCount,
    closeProofModal
  ]);

  // ── Calcul de l'étape active ───────────────────────────────────────────────
  const activeStep = !isConnected ? 1 : proofCount === 0 ? 2 : 3;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      {/* ── 3D Animated Background Object ── */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none transition-[background] duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)]"
        style={{
          background: activeStep === 1
            ? "radial-gradient(40vw circle at 30vw 30vh, rgba(124,58,237,0.15) 0%, rgba(32,52,159,0.05) 50%, transparent 100%)"
            : activeStep === 2
              ? "radial-gradient(50vw circle at 70vw 50vh, rgba(32,52,159,0.15) 0%, rgba(124,58,237,0.05) 50%, transparent 100%)"
              : "radial-gradient(60vw circle at 50vw 80vh, rgba(34,197,94,0.1) 0%, rgba(32,52,159,0.05) 50%, transparent 100%)",
          zIndex: 0,
        }}
      />

      {/* ── Dynamic Ambient Core ── */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none transition-[background,opacity] duration-[1500ms] ease-out"
        style={{
          background: activeStep === 1
            ? "radial-gradient(30vw circle at 35vw 35vh, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 80%)"
            : activeStep === 2
              ? "radial-gradient(40vw circle at 75vw 55vh, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 80%)"
              : "radial-gradient(50vw circle at 50vw 85vh, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 80%)",
          zIndex: 1,
          opacity: activeStep === 3 ? 0.3 : 0.6,
        }}
      />

      {/* Legacy ambient glow (kept for depth) */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(50vw circle at 50vw 0vh, rgba(32,52,159,0.05) 0%, transparent 100%)",
          zIndex: 0,
        }}
      />

      <main
        className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 min-h-screen flex flex-col justify-center py-8"
        style={{ animation: "fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
      >
        {/* ── En-tête ─────────────────────────────────────────────────────── */}
        <div className="text-center flex flex-col items-center mb-6 sm:mb-8">
          <div className="relative mb-6 sm:mb-8" style={{ animation: "fadeIn 1s ease both" }}>
            {/* Soft ethereal glow */}
            <div
              className="absolute inset-0 rounded-full blur-2xl opacity-50 animate-pulse"
              style={{ background: "var(--accent)", transform: "scale(1.5)" }}
            />
            {/* Minimal Fingerprint */}
            <div
              className="relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full"
            >
              <Fingerprint size={42} style={{ color: "var(--text-primary)" }} className="opacity-90" />
            </div>
          </div>

          <h1
            className="text-5xl sm:text-[72px] font-black tracking-tighter mb-4 sm:mb-6 leading-[1.1]"
            style={{
              color: "var(--text-primary)",
              background: "linear-gradient(180deg, var(--text-primary) 0%, var(--text-muted) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}
          >
            Silent Ledger
          </h1>
          <p
            className="text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto font-medium tracking-tight"
            style={{ color: "var(--text-secondary)" }}
          >
            Prouvez au moins un compte pour créer votre identité souveraine
            anonyme. <br className="hidden sm:block" />
            <span style={{ color: "var(--text-muted)" }}>Aucune donnée personnelle n&apos;est stockée.</span>
          </p>
        </div>

        {/* ── Minimalist Steps (Apple Style) ──────────────────────────────── */}
        <div className="flex items-center justify-center gap-6 sm:gap-12 mb-8 sm:mb-10" style={{ animation: "fadeIn 1s ease 0.3s both" }}>
          {STEPS.map((step) => (
            <div key={step.id} className="flex flex-col items-center gap-3">
              <div
                className={`transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${activeStep === step.id ? "w-8 h-2 rounded-full" : "w-2 h-2 rounded-full"
                  }`}
                style={{
                  background:
                    activeStep > step.id
                      ? "var(--green)"
                      : activeStep === step.id
                        ? "var(--text-primary)"
                        : "var(--text-muted)",
                  opacity: activeStep >= step.id ? 1 : 0.3,
                  boxShadow: activeStep === step.id ? "0 0 15px rgba(255,255,255,0.5)" : "none"
                }}
              />
              <span
                className="text-[12px] sm:text-sm font-semibold tracking-wide transition-colors duration-500"
                style={{
                  color:
                    activeStep >= step.id
                      ? "var(--text-primary)"
                      : "var(--text-muted)",
                  opacity: activeStep >= step.id ? 1 : 0.4
                }}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {/* ── Formulaire GitHub / Wallet ───────────────────────────────────── */}
        <div
          className="glass-card mx-auto w-full max-w-lg p-6 sm:p-12"
          style={{
            animation: "fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards",
            opacity: 0
          }}
        >

          <div className="relative z-10">
            {!isConnected ? (
              /* Wallet non connecté - Apple Style */
              <div className="flex flex-col items-center text-center py-4">
                <div className="mb-8">
                  <Shield size={48} style={{ color: "var(--text-primary)" }} className="opacity-80 mx-auto mb-6" />
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3" style={{ color: "var(--text-primary)" }}>
                    Authentification
                  </h2>
                  <p style={{ fontSize: 16, color: "var(--text-secondary)", maxWidth: "320px", margin: "0 auto" }}>
                    Un portefeuille Web3 est requis pour chiffrer et stocker vos preuves.
                  </p>
                </div>
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
              <div className="flex flex-col items-center gap-6 text-center py-12 animate-in fade-in zoom-in duration-500">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center relative"
                  style={{
                    background: "rgba(34,197,94,0.1)",
                    border: "1px solid rgba(34,197,94,0.4)",
                    boxShadow: "0 0 30px rgba(34,197,94,0.2), inset 0 0 20px rgba(34,197,94,0.1)",
                  }}
                >
                  <div className="absolute inset-0 rounded-2xl animate-ping opacity-20 bg-green-500" />
                  <Sparkles size={32} style={{ color: "var(--green)" }} className="drop-shadow-[0_0_10px_rgba(34,197,94,0.4)]" />
                </div>
                <div className="space-y-2">
                  <h3
                    className="text-2xl font-black tracking-tight"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Identité Sécurisée !
                  </h3>
                  <p className="font-medium" style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                    Vos preuves sont ancrées. Redirection en cours...
                  </p>
                </div>
                <Loader2 size={24} className="animate-spin mt-2" style={{ color: "var(--accent-light)" }} />
              </div>
            ) : (
              /* Formulaire de preuve - Apple Style */
              <div className="flex flex-col items-center gap-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500 py-6">
                <div className="space-y-4">
                  <div
                    className="w-16 h-16 mx-auto rounded-3xl flex items-center justify-center mb-6"
                    style={{ background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.15)" }}
                  >
                    <Shield size={32} style={{ color: "var(--accent)" }} />
                  </div>
                  <h2
                    className="text-3xl sm:text-4xl font-bold tracking-tight"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Sélectionnez une plateforme
                  </h2>
                  <p className="text-base sm:text-lg max-w-md mx-auto" style={{ color: "var(--text-secondary)" }}>
                    Prouvez la possession de votre compte de manière anonyme via zkTLS.
                  </p>
                </div>

                {/* Sélecteur de plateforme */}
                <div className="grid grid-cols-3 gap-4 w-full max-w-sm mb-4">
                  {[
                    { id: "github", icon: <Github size={24} />, label: "GitHub" },
                    { id: "x", icon: <Twitter size={24} />, label: "X / Twitter" },
                    { id: "linkedin", icon: <Linkedin size={24} />, label: "LinkedIn" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPlatform(p.id as SupportedPlatform)}
                      className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all duration-300 ${selectedPlatform === p.id
                        ? "border-accent bg-accent/5 scale-105 shadow-md"
                        : "border-white/20 bg-white/5 opacity-60 hover:opacity-100"}`}
                    >
                      <div className={selectedPlatform === p.id ? "text-accent" : "text-primary"}>
                        {p.icon}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider">{p.label}</span>
                    </button>
                  ))}
                </div>

                {/* Input + bouton */}
                <div className="flex w-full justify-center mt-2">
                  <button
                    className="btn-stamp flex items-center justify-center gap-3 font-semibold text-[16px] group w-full"
                    onClick={handleStampIntelligence}
                    disabled={isGenerating || isTxPending}
                    style={{ padding: "16px 36px", borderRadius: "14px" }}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Génération ZK ({selectedPlatform})…
                      </>
                    ) : (
                      <>
                        <Shield size={20} className="group-hover:scale-110 transition-transform" />
                        Prouver {selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)}
                      </>
                    )}
                  </button>
                </div>

                {/* Status Area */}
                <div className="mt-8">
                  {txStatus && <TxStatus status={txStatus.status} message={txStatus.message} />}
                </div>

                {/* ── MODAL DE PREUVE ── */}
                {showProofModal && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
                    {/* Backdrop */}
                    <div
                      className={`absolute inset-0 bg-black/80 backdrop-blur-xl ${isClosing ? 'modal-overlay-exit' : 'modal-overlay-enter'}`}
                      onClick={() => !isTxPending && closeProofModal()}
                    />

                    {/* Modal Content */}
                    <div className={`relative glass-card max-w-md w-full p-8 sm:p-12 border-white/20 shadow-2xl text-center ${isClosing ? 'modal-content-exit' : 'modal-content-enter'}`}>
                      <button
                        onClick={closeProofModal}
                        className="absolute top-6 right-6 text-secondary hover:text-primary transition-colors p-2 rounded-full hover:bg-white/10"
                        disabled={isTxPending || isSuccess}
                      >
                        <X size={24} />
                      </button>

                      {isSuccess ? (
                        <div className="flex flex-col items-center py-6">
                          <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-8 border-2 border-green-500/30 animate-success-check mx-auto">
                            <CheckCircle2 size={48} className="text-green-500" />
                          </div>
                          <h4 className="text-3xl font-black mb-3 tracking-tight text-primary">Vérification Validée</h4>
                          <p className="text-secondary font-medium opacity-90 max-w-[240px] mx-auto">
                            Votre identité a été ancrée avec succès. Bienvenue on-chain.
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-8 mx-auto animate-in zoom-in duration-500">
                            <Shield size={32} className="text-accent" />
                          </div>

                          {!zkProof ? (
                            <>
                              <h4 className="text-2xl font-black mb-4 tracking-tight text-primary">Scannez pour prouver</h4>
                              <p className="text-secondary mb-10 text-sm font-medium leading-relaxed opacity-90">
                                Utilisez l&apos;application Reclaim pour générer la preuve ZK de votre compte {selectedPlatform}.
                              </p>
                              {proofUrl && (
                                <div className="bg-white p-6 rounded-3xl shadow-xl mb-6 mx-auto inline-block transform hover:scale-[1.02] transition-transform">
                                  <QRCodeDisplay url={proofUrl} waiting />
                                </div>
                              )}
                              <div className="flex items-center justify-center gap-2 text-accent-light font-black text-xs uppercase tracking-widest">
                                <div className="pulse-dot" />
                                Session active...
                              </div>
                            </>
                          ) : (
                            <div className="animate-in zoom-in duration-500 w-full">
                              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-8 border border-green-500/20 mx-auto">
                                <CheckCircle2 size={40} className="text-green-500" />
                              </div>
                              <h4 className="text-2xl font-black mb-2 tracking-tight text-primary text-center">Preuve ZK prête !</h4>
                              <p className="text-secondary mb-10 text-sm font-medium text-center">
                                Score : <strong className="text-primary">{reputationScore?.toString()} pts</strong>
                              </p>

                              <button
                                className="btn-stamp w-full py-5 text-lg font-bold shadow-lg shadow-accent/20"
                                onClick={handleSubmitOnChain}
                                disabled={isTxPending}
                              >
                                {isTxPending ? (
                                  <div className="flex items-center justify-center gap-3">
                                    <Loader2 className="animate-spin" />
                                    <span>Ancrage...</span>
                                  </div>
                                ) : "Créer mon ID On-Chain"}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Statut de la transaction */}
                      {txStatus && !isSuccess && (
                        <div className="w-full text-center mt-4 animate-in slide-in-from-top-2 duration-300">
                          <TxStatus status={txStatus.status} message={txStatus.message} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Note bas de page ─────────────────────────────────────────────── */}
        {isConnected && !redirecting && (
          <p
            className="text-center font-medium opacity-60 hover:opacity-100 transition-opacity mt-6 sm:mt-8 px-6"
            style={{ color: "var(--text-secondary)", fontSize: "13px" }}
          >
            Minimum 1 compte prouvé requis pour accéder à l&apos;écosystème.
            <br />
            Le processus est cryptographiquement sécurisé et préserve votre anonymat.
          </p>
        )}
      </main>
      <Footer />
    </div>
  );
}
