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

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useReadContract, useWriteContract, useReadContracts } from "wagmi";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  Shield,
  Loader2,
  CheckCircle2,
  Zap,
  Fingerprint,
  Twitter,
  Linkedin,
  Github,
  X,
} from "lucide-react";

import { initPlatformProof, type ZKProof, type SupportedPlatform } from "@/services/ReclaimService";
import {
  SILENT_LEDGER_ATTESTER_ABI,
  ATTESTER_ADDRESS,
  CERTIFICATION_SBT_ABI,
  SBT_ADDRESS,
  EAS_ADDRESS,
  EAS_ABI,
} from "@/lib/contracts";

import { SilentProofBadge } from "@/components/SilentProofBadge";
import { BadgeSkeleton } from "@/components/BadgeSkeleton";
import { SBTBadge } from "@/components/SBTBadge";
import { TxStatus } from "@/components/TxStatus";
import { StatRow } from "@/components/StatRow";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { Wallet } from "lucide-react";
import { keccak256, toBytes, decodeAbiParameters } from "viem";
import { TrustWheel } from "@/components/TrustWheel";

export default function SilentDashboard() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending: isTxPending } = useWriteContract();
  const router = useRouter();

  // Redirection si déconnecté
  useEffect(() => {
    if (!isConnected) {
      router.push("/");
    }
  }, [isConnected, router]);

  // ── State ─────────────────────────────────────────────────────────────────
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [zkProof, setZkProof] = useState<ZKProof | null>(null);
  const [activePlatform, setActivePlatform] = useState<SupportedPlatform>("github");
  const [platformId, setPlatformId] = useState<`0x${string}` | null>(null);
  const [reputationScore, setReputationScore] = useState<bigint | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
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
    query: {
      enabled: isConnected && !!address,
      staleTime: 0,
      refetchOnMount: "always"
    },
  });

  const attestations = (attestationUIDs as `0x${string}`[] | undefined) ?? [];

  // Lecture des détails des attestations via EAS Contract
  const {
    data: attestationDetails,
    isLoading: isLoadingDetails,
  } = useReadContracts({
    contracts: attestations.map((uid) => ({
      address: EAS_ADDRESS as `0x${string}`,
      abi: EAS_ABI,
      functionName: "getAttestation",
      args: [uid],
    })),
  });

  const verifiedPlatforms = (attestationDetails || []).map((res: any) => {
    if (!res.result || !res.result.data) return null;
    try {
      // Decode data: bytes32 platformId, uint256 reputationScore, bool isVerified
      const [platformId] = decodeAbiParameters(
        [{ type: "bytes32" }, { type: "uint256" }, { type: "bool" }],
        res.result.data
      );
      return platformId;
    } catch {
      return null;
    }
  }).filter(Boolean);

  // Lecture des SBT On-chain
  const {
    data: sbtIdsData,
    isLoading: isLoadingSbts,
  } = useReadContract({
    address: SBT_ADDRESS,
    abi: CERTIFICATION_SBT_ABI,
    functionName: "getTokensOfOwner",
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address,
      staleTime: 0,
      refetchOnMount: "always"
    },
  });

  const sbtIds = (sbtIdsData as bigint[] | undefined) ?? [];

  // ── Logic ────────────────────────────────────────────────────────────────

  // Calcul du Trust Score
  const trustScore = (() => {
    let score = 0;

    // Plateformes supportées
    const hashes = {
      github: keccak256(toBytes("github")),
      x: keccak256(toBytes("x")),
      linkedin: keccak256(toBytes("linkedin")),
    };

    // 1. Social Verifications (Basé sur les platformId réellement présents)
    if (verifiedPlatforms.includes(hashes.github)) score += 40;
    if (verifiedPlatforms.includes(hashes.x)) score += 20;
    if (verifiedPlatforms.includes(hashes.linkedin)) score += 20;

    // 2. Oracle / SBTs -> +10% par SBT (max 20%)
    score += Math.min(sbtIds.length * 10, 20);

    return Math.min(score, 100);
  })();

  // ── Handlers ──────────────────────────────────────────────────────────────

  /** Étape 1 : Lance le flux zkTLS Reclaim pour une plateforme donnée. */
  const handleStampIntelligence = useCallback(async (platform: SupportedPlatform = "github") => {
    if (!address) return;
    setActivePlatform(platform);
    setIsGenerating(true);
    setIsSuccess(false);
    setIsClosing(false);
    setProofUrl(null);
    setZkProof(null);
    setTxStatus(null);

    try {
      const url = await initPlatformProof({
        platform,
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
  }, [address]);

  /** Fermeture animée du modal */
  const closeProofModal = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setShowProofModal(false);
      setIsClosing(false);
      setIsSuccess(false);
      setIsGenerating(false);
    }, 300); // Correspond à la durée de l'animation modalScaleOut
  }, []);

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
        gas: 3_000_000n,
      });

      setTxStatus({
        status: "success",
        message: `Attestation créée ! UID: ${uid?.slice(0, 12)}…`,
      });
      setIsSuccess(true);
      setZkProof(null);
      setProofUrl(null);

      // Attendre la fin de l'animation de succès avant de fermer
      setTimeout(() => {
        closeProofModal();
        refetchAttestations();
      }, 2000);
    } catch (err) {
      setTxStatus({
        status: "error",
        message: err instanceof Error ? err.message : "Transaction échouée",
      });
    }
  }, [zkProof, platformId, reputationScore, writeContractAsync, refetchAttestations, closeProofModal]);

  /** Étape Oracle : Vérification historique via Oracle (Mock). */
  const handleOracleVerification = useCallback(async () => {
    if (!address) return;
    setTxStatus({ status: "pending", message: "Analyse de l'historique wallet..." });

    try {
      // 1. Simuler l'analyse Off-chain (Backend)
      // Dans la réalité, on appellerait une API /api/analyze-wallet qui renverrait la signature
      // Ici, on mock les données
      const mockData = {
        recipient: address,
        competenceName: "DeFi Power User",
        level: 2, // Expert
        examScore: 92,
        proofOfWorkURL: "https://dune.com/my-defi-stats",
        studentId: keccak256(toBytes(address)), // Simple hash of address
        deadline: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1h validité
      };

      // NOTE: En prod, la signature doit venir du backend (private key).
      // Pour le test sans backend, on ne peut PAS générer une signature valide pour le contrat
      // si on n'a pas la clé privée de l'oracleSigner configuré dans le contrat.
      // Sauf si l'utilisateur *est* l'oracleSigner (peu probable).
      // Solution Mock: On assume que l'utilisateur a déployé le contrat et set son address comme oracleSigner pour le test.
      // Si ce n'est pas le cas, la tx revertira "InvalidSignature".
      // On va juste logguer un warning.
      console.warn("Assuming connected wallet IS the Oracle Signer for testing purposes.");

      // On demande à l'utilisateur de signer (simulation que c'est l'oracle)
      // Hash struct EIP-712 like (mais simplifié dans le contrat)
      // Hash: keccak256(recipient, hash(competence), level, score, hash(url), studentId, deadline)

      /*
        abi.encode(
            data.recipient,
            keccak256(bytes(data.competenceName)),
            data.level,
            data.examScore,
            keccak256(bytes(data.proofOfWorkURL)),
            data.studentId,
            data.deadline
        )
      */

      // On ne peut pas facilement signer "en tant qu'oracle" depuis le frontend si l'oracle est un backend.
      // Mais pour la démo, on va tenter d'appeler submitOracleProof avec une signature vide (ça failera)
      // OU on ajoute un bouton "Simuler Oracle" qui fait juste un appel direct si on est owner.
      // Changeons d'approche : on trigger la fonction, et on met une signature dummy 0x... 
      // Le contrat va revert "InvalidSignature".

      // MIEUX: On utilise une signature fictive et on espère que le contrat de test n'a pas activé la vérif strique ?
      // Non, le code Solidity a `if (recovered != oracleSigner) revert`.

      // On va juste mettre un message explicatif dans l'UI "Demo: Oracle Signature Requires Backend".
      // Ou on mocke l'appel contractuel directement si on a deployé en local avec une clé connue.

      // Pour l'instant, faisons l'appel avec une signature bidon pour montrer l'interaction contrat.
      const dummySignature = "0x" + "00".repeat(65);

      const uid = await writeContractAsync({
        address: ATTESTER_ADDRESS,
        abi: SILENT_LEDGER_ATTESTER_ABI,
        functionName: "submitOracleProof",
        args: [dummySignature as `0x${string}`, {
          ...mockData,
          level: mockData.level,
          examScore: mockData.examScore,
          deadline: mockData.deadline
        }],
        gas: 3_000_000n,
      });

      setTxStatus({
        status: "success",
        message: `Oracle Verification submitted! UID: ${uid?.slice(0, 12)}…`,
      });
      await refetchAttestations();

    } catch (err) {
      // C'est normal que ça fail si on n'a pas la bonne signature
      setTxStatus({
        status: "error",
        message: err instanceof Error ? err.message : "Oracle Verification Failed",
      });
    }
  }, [address, writeContractAsync, refetchAttestations]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen relative flex flex-col" style={{ background: "var(--bg-base)" }}>
      {/* ── Fixed Atmospheric Backgrounds ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-30 transition-opacity duration-1000"
          style={{
            background: "radial-gradient(circle at 50% -10%, var(--accent) 0%, transparent 70%), radial-gradient(circle at 50% 110%, var(--accent) 0%, transparent 70%)"
          }}
        />
      </div>

      <Header maxWidthClass="max-w-6xl" />

      <main className="relative z-10 w-full flex flex-col gap-24 sm:gap-40 pb-32">

        {/* ── SECTION 1: IDENTITY & OVERVIEW ────────────────────────────── */}
        <section className="max-w-6xl mx-auto w-full px-6 pt-12 md:pt-24 flex flex-col items-center text-center">
          <TrustWheel value={trustScore} />

          <p className="text-lg sm:text-xl font-medium tracking-tight text-secondary max-w-2xl mb-16 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
            Votre réputation est maintenant ancrée <br className="hidden sm:block" /> et
            <span className="text-primary font-bold italic ml-2">totalement anonyme.</span>
          </p>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full animate-in fade-in duration-1000 delay-500">
            {[
              { label: "Silent Proofs", value: attestations.length.toString(), icon: Shield },
              { label: "Credentials", value: sbtIds.length.toString(), icon: Zap },
              { label: "Status", value: "Verified", icon: CheckCircle2 },
              { label: "Network", value: "Sepolia", icon: Wallet }
            ].map((stat, i) => (
              <div key={i} className="glass-card p-6 flex flex-col items-center gap-2 border-white/20">
                <stat.icon size={16} className="text-accent opacity-60" />
                <span className="text-2xl font-black tabular-nums">{stat.value}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted">{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION 2: REPUTATION ENGINE ─────────────────────────────── */}
        <section className="max-w-5xl mx-auto w-full px-6">
          <div className="flex flex-col items-center mb-16 text-center">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-[0.3em] text-muted mb-4">Reputation Engine</h2>
            <h3 className="text-4xl sm:text-5xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
              Boostez votre légitimité.
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {[
              { id: "github", label: "GitHub", icon: <Github size={32} />, color: "bg-white/40", text: "Vérifiez vos contributions anonymement.", hash: keccak256(toBytes("github")) },
              { id: "x", label: "X / Twitter", icon: <Twitter size={32} />, color: "bg-blue-500/10", text: "Prouvez votre influence sociale.", hash: keccak256(toBytes("x")) },
              { id: "linkedin", label: "LinkedIn", icon: <Linkedin size={32} />, color: "bg-blue-700/10", text: "Certifiez votre carrière pro.", hash: keccak256(toBytes("linkedin")) },
              { id: "farcaster", label: "Farcaster", icon: <Shield size={32} />, color: "bg-purple-500/10", text: "Prouvez votre identité décentralisée.", hash: keccak256(toBytes("farcaster")) },
            ].map((p) => {
              const isPlatformVerified = verifiedPlatforms.includes(p.hash);

              return (
                <div key={p.id} className="glass-card p-8 border-white/30 flex flex-col justify-between group transition-all duration-500 hover:scale-[1.01]">
                  <div>
                    <div className={`w-14 h-14 rounded-2xl ${p.color} flex items-center justify-center mb-6 shadow-sm`}>
                      <div className="text-primary">{p.icon}</div>
                    </div>
                    <h4 className="text-2xl font-black mb-2 tracking-tight">{p.label}</h4>
                    <p className="text-sm text-secondary mb-8 leading-relaxed opacity-80">
                      {p.text}
                    </p>
                  </div>

                  {isConnected && (
                    isPlatformVerified ? (
                      <div className="flex items-center gap-2 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500">
                        <CheckCircle2 size={18} />
                        <span className="font-bold text-sm">Vérifié</span>
                      </div>
                    ) : (
                      <button
                        className="btn-stamp w-full flex items-center justify-center gap-2 text-sm font-bold py-4 hover:bg-accent hover:text-white transition-all"
                        onClick={() => handleStampIntelligence(p.id as SupportedPlatform)}
                        disabled={isGenerating || isTxPending}
                      >
                        {isGenerating && activePlatform === p.id ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                        Prouver account
                      </button>
                    )
                  )}
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 gap-8">
            {/* Oracle Card (Full Width potentially or kept in grid) */}
            <div className="glass-card p-10 sm:p-14 border-white/30 flex flex-col md:flex-row items-center justify-between group transition-all duration-500 hover:scale-[1.01] gap-8">
              <div className="max-w-xl text-center md:text-left">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-8 shadow-sm border border-emerald-500/20 mx-auto md:mx-0">
                  <Wallet size={32} className="text-emerald-500" />
                </div>
                <h4 className="text-3xl font-black mb-4 tracking-tight">On-Chain Oracle Analysis</h4>
                <p className="text-lg text-secondary mb-0 leading-relaxed opacity-80">
                  Analysez votre historique DeFi et DAO pour obtenir un score de puissance on-chain certifié.
                </p>
              </div>

              {isConnected && (
                <button
                  className="btn-stamp px-12 py-6 flex items-center justify-center gap-3 text-lg font-bold bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all border-emerald-500/20 whitespace-nowrap"
                  onClick={handleOracleVerification}
                  disabled={isTxPending}
                >
                  <Shield size={20} />
                  Analyser mon profil
                </button>
              )}
            </div>
          </div>

          {/* Reclaim / Status Area */}
          <div className="mt-12 max-w-lg mx-auto">
            {txStatus && <div className="mt-8"><TxStatus status={txStatus.status} message={txStatus.message} /></div>}
          </div>

          {/* ── MODAL DE PREUVE ── */}
          {showProofModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
              {/* Backdrop */}
              <div
                className={`absolute inset-0 bg-black/60 backdrop-blur-xl ${isClosing ? 'modal-overlay-exit' : 'modal-overlay-enter'}`}
                onClick={() => !isTxPending && closeProofModal()}
              />

              {/* Modal Content */}
              <div className={`relative glass-card max-w-md w-full p-8 sm:p-12 border-white/20 shadow-2xl ${isClosing ? 'modal-content-exit' : 'modal-content-enter'}`}>
                <button
                  onClick={closeProofModal}
                  className="absolute top-6 right-6 text-secondary hover:text-primary transition-colors p-2 rounded-full hover:bg-white/10"
                  disabled={isTxPending || isSuccess}
                >
                  <X size={24} />
                </button>

                <div className="flex flex-col items-center text-center">
                  {isSuccess ? (
                    <div className="flex flex-col items-center py-6">
                      <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-8 border-2 border-green-500/30 animate-success-check">
                        <CheckCircle2 size={48} className="text-green-500" />
                      </div>
                      <h4 className="text-3xl font-black mb-3 tracking-tight text-primary">Ancrage Réussi</h4>
                      <p className="text-secondary font-medium opacity-90 max-w-[240px]">
                        Votre identité {activePlatform} est maintenant immuable.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-8 animate-in zoom-in duration-500">
                        <Shield size={32} className="text-accent" />
                      </div>

                      {!zkProof ? (
                        <>
                          <h4 className="text-2xl font-black mb-4 tracking-tight text-primary">Vérification en cours</h4>
                          <p className="text-secondary mb-10 text-sm font-medium leading-relaxed opacity-90">
                            Scannez le QR Code avec votre téléphone pour générer une preuve zkTLS sécurisée.
                          </p>
                          {proofUrl && (
                            <div className="bg-white p-6 rounded-3xl shadow-xl mb-4 transform hover:scale-[1.02] transition-transform">
                              <QRCodeDisplay url={proofUrl} waiting />
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-accent-light font-black text-xs uppercase tracking-widest mt-4">
                            <div className="pulse-dot" />
                            En attente du mobile...
                          </div>
                        </>
                      ) : (
                        <div className="animate-in zoom-in duration-500 flex flex-col items-center w-full">
                          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-8 border border-green-500/20">
                            <CheckCircle2 size={40} className="text-green-500" />
                          </div>
                          <h4 className="text-2xl font-black mb-2 tracking-tight text-primary">Preuve ZK générée !</h4>
                          <p className="text-secondary mb-10 text-sm font-medium">
                            Votre identité {activePlatform} est prête à être ancrée on-chain.
                          </p>

                          <div className="w-full p-5 rounded-2xl bg-black/5 border border-black/5 mb-8">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted block mb-1">Score Détecté</span>
                            <span className="text-4xl font-black text-primary tabular-nums">{reputationScore?.toString()} <span className="text-xs opacity-40 font-bold uppercase tracking-widest ml-1">pts</span></span>
                          </div>

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
                            ) : "Ancrer on-chain"}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── SECTION 3: SOULBOUND GALLERY (Commented Out) ───────────────────
        <section className="max-w-6xl mx-auto w-full px-6">
          <div className="flex flex-col items-center mb-16 text-center">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-[0.3em] text-muted mb-4">Soulbound Gallery</h2>
            <h3 className="text-4xl sm:text-5xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
              Vos réussites immuables.
            </h3>
          </div>

          <div className="glass-card p-12 sm:p-20 min-h-[300px] flex items-center justify-center">
            {!isConnected ? (
              <p className="text-secondary font-medium italic">Connectez votre wallet pour explorer vos badges.</p>
            ) : isLoadingSbts ? (
              <div className="flex gap-8 flex-wrap justify-center">
                <div className="w-32 h-32 rounded-3xl bg-white/5 animate-pulse" />
                <div className="w-32 h-32 rounded-3xl bg-white/5 animate-pulse" />
                <div className="w-32 h-32 rounded-3xl bg-white/5 animate-pulse" />
              </div>
            ) : sbtIds.length === 0 ? (
              <div className="text-center">
                <p className="text-xl text-secondary mb-4 opacity-60">Aucun badge pour le moment.</p>
                <p className="text-sm text-muted">Réalisez une vérification ci-dessus pour obtenir votre premier SBT.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-12 sm:gap-16 justify-items-center">
                {sbtIds.map((id) => (
                  <SBTBadge key={id.toString()} tokenId={id} />
                ))}
              </div>
            )}
          </div>
        </section>
        ────────────────────────────────────────────────────────────── */}

        {/* ── SECTION 4: IMMUTABLE LEDGER ──────────────────────────────── */}
        <section className="max-w-4xl mx-auto w-full px-6">
          <div className="flex flex-col items-center mb-16 text-center">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-[0.3em] text-muted mb-4">Immutable Ledger</h2>
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
              Historique des attestations.
            </h3>
          </div>

          <div className="space-y-4">
            {!isConnected ? (
              <div className="glass-card p-10 text-center opacity-50">Connectez-vous pour voir l&apos;historique.</div>
            ) : isLoadingAttestations ? (
              <div className="space-y-4">
                <BadgeSkeleton />
                <BadgeSkeleton />
              </div>
            ) : attestations.length === 0 ? (
              <div className="glass-card p-12 text-center border-dashed opacity-60">
                <Shield size={32} className="mx-auto mb-4 text-muted" />
                <p>Aucune attestation on-chain trouvée pour cette adresse.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 animate-in fade-in duration-1000">
                {attestations.map((uid, i) => {
                  // Trouver le platformId pour cette attestation spécifique
                  const detail = (attestationDetails || []).find((d: any) => d.result?.uid === uid);
                  let platformId: string | undefined = undefined;

                  if (detail?.result?.data) {
                    try {
                      const [pid] = decodeAbiParameters(
                        [{ type: "bytes32" }, { type: "uint256" }, { type: "bool" }],
                        detail.result.data
                      );
                      platformId = pid;
                    } catch (e) {
                      console.error("Failed to decode platformId for", uid, e);
                    }
                  }

                  return (
                    <SilentProofBadge
                      key={uid}
                      attestation={{ uid: uid as `0x${string}` }}
                      platformId={platformId}
                      index={i}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
