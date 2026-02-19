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
  getDefaultWallets,
} from "@rainbow-me/rainbowkit";
import { mainnet, sepolia } from "wagmi/chains";
import { createConfig, http } from "wagmi";

import "@rainbow-me/rainbowkit/styles.css";

// ── Project ID guard ────────────────────────────────────────────────────────
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error(
    "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not defined in .env.local"
  );
}

// ── Wagmi config ───────────────────────────────────────────────────────────
const { wallets } = getDefaultWallets();

const wagmiConfig = createConfig({
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: false, // EXPLICITLY disable SSR here to prevent localStorage errors
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
          {mounted && children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiCoreProvider>
  );
}

