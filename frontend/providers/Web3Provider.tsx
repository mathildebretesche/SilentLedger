"use client";

/**
 * Web3Provider.tsx – Silent Ledger
 * Configure Wagmi + RainbowKit + React Query pour l'ensemble de l'app.
 */

import React from "react";
import { WagmiProvider as WagmiCoreProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RainbowKitProvider,
  darkTheme,
  getDefaultConfig,
} from "@rainbow-me/rainbowkit";
import { mainnet, sepolia } from "wagmi/chains";

import "@rainbow-me/rainbowkit/styles.css";

// ── Project ID guard ────────────────────────────────────────────────────────
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error(
    "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not defined in .env.local"
  );
}

// ── Wagmi config ───────────────────────────────────────────────────────────
// getDefaultConfig génère automatiquement les connecteurs Metamask, WalletConnect
// Rainbow, Coinbase etc. et configure les transports HTTP/WebSocket.
const wagmiConfig = getDefaultConfig({
  appName: "Silent Ledger",
  projectId,                   // read from NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
  chains: [mainnet, sepolia],
  ssr: true,                   // Next.js App Router = SSR activé
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
  return (
    <WagmiCoreProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#7C3AED", // violet Silent Ledger
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
