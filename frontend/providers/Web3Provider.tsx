"use client";

/**
 * Web3Provider.tsx – Silent Ledger
 * Configure Wagmi + RainbowKit + React Query pour l'ensemble de l'app.
 */

import React, { useState, useEffect } from "react";
import { WagmiProvider as WagmiCoreProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RainbowKitProvider,
  darkTheme,
  getDefaultConfig,
} from "@rainbow-me/rainbowkit";
import { mainnet, sepolia } from "wagmi/chains";
import { http } from "wagmi";

import "@rainbow-me/rainbowkit/styles.css";

// ── Project ID guard ────────────────────────────────────────────────────────
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error(
    "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not defined in .env.local"
  );
}

const wagmiConfig = getDefaultConfig({
  appName: "Silent Ledger",
  projectId: projectId,
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true, // Safely handles SSR with RainbowKit
});

// Un seul QueryClient partagé – persiste entre les navigations client.
const queryClient = new QueryClient();

interface Web3ProviderProps {
  children: React.ReactNode;
}

/**
 * Enveloppe tous les providers nécessaires à l'app Web3 :
 * WagmiCoreProvider → QueryClientProvider → RainbowKitProvider
 */
export function Web3Provider({ children }: Web3ProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Ne monter les providers Web3 qu'après hydratation côté client.
  // wagmi/WalletConnect accèdent à localStorage à l'init → crash SSR sinon.
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <WagmiCoreProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#7C3AED",
            accentColorForeground: "white",
            borderRadius: "medium",
            fontStack: "system",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiCoreProvider>
  );
}

