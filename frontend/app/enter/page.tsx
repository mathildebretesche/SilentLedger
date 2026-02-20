"use client";

/**
 * /enter – Gateway de connexion
 * ─────────────────────────────────────────────────────────────────────────────
 * Étapes :
 *   1. Si le wallet n'est pas connecté → ouvre le modal RainbowKit
 *   2. Une fois connecté → lit les attestations on-chain
 *   3. Si attestations > 0  → redirige vers /dashboard
 *      Si attestations = 0  → redirige vers /onboarding
 */

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useReadContract } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Fingerprint, Loader2 } from "lucide-react";
import { SILENT_LEDGER_ATTESTER_ABI, ATTESTER_ADDRESS } from "@/lib/contracts";

export default function EnterPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const modalOpened = useRef(false);

  // Ouvre le modal de connexion dès le montage si non connecté
  useEffect(() => {
    if (!isConnected && openConnectModal && !modalOpened.current) {
      modalOpened.current = true;
      openConnectModal();
    }
  }, [isConnected, openConnectModal]);

  // Lecture des attestations on-chain (une fois connecté)
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

  // Routing dès que les données sont prêtes
  useEffect(() => {
    if (!isConnected || isLoadingAttestations) return;

    const count =
      (attestationUIDs as `0x${string}`[] | undefined)?.length ?? 0;

    const DEV_BYPASS_ONBOARDING = true; // Si true, on force à aller sur l'onboarding pour test

    if (count > 0 && !DEV_BYPASS_ONBOARDING) {
      router.replace("/dashboard");
    } else {
      router.replace("/onboarding");
    }
  }, [isConnected, isLoadingAttestations, attestationUIDs, router]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        className="fixed pointer-events-none"
        style={{
          top: "-20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(32,52,159,0.12) 0%, transparent 70%)",
          filter: "blur(100px)",
          zIndex: 0,
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-8 text-center px-4">
        {/* Icon */}
        <div className="w-24 h-24 rounded-3xl glass-card border border-white/40 flex items-center justify-center shadow-xl">
          {isConnected ? (
            <Loader2 size={36} className="animate-spin" style={{ color: "var(--accent)" }} />
          ) : (
            <Fingerprint
              size={36}
              className="animate-pulse"
              style={{ color: "var(--accent)" }}
            />
          )}
        </div>

        {/* Text */}
        <div>
          <h1
            className="text-4xl font-black tracking-tighter mb-3"
            style={{ color: "var(--text-primary)" }}
          >
            {isConnected ? "Chargement…" : "Connexion requise"}
          </h1>
          <p
            className="text-sm max-w-xs leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            {isConnected
              ? "Vérification de votre identité souveraine en cours…"
              : "Connectez votre portefeuille pour accéder à Silent Ledger."}
          </p>
        </div>

        {/* Manual connect button (fallback si le modal a été fermé) */}
        {!isConnected && (
          <button
            onClick={() => openConnectModal?.()}
            className="px-8 py-3 text-white text-sm font-bold rounded-full transition-all active:scale-95 shadow-lg"
            style={{
              background: "var(--accent)",
              boxShadow: "0 8px 24px rgba(32,52,159,0.25)",
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLButtonElement).style.background = "var(--accent-light)")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLButtonElement).style.background = "var(--accent)")
            }
          >
            Connecter le portefeuille
          </button>
        )}
      </div>
    </div>
  );
}
