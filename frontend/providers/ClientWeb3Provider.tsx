"use client";

/**
 * ClientWeb3Provider.tsx
 * Charge Web3Provider (wagmi + WalletConnect + RainbowKit) uniquement côté
 * client via next/dynamic ssr:false, empêchant tout accès à localStorage
 * pendant la génération statique (build Next.js).
 */

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const Web3ProviderDynamic = dynamic(
  () => import("./Web3Provider").then((m) => m.Web3Provider),
  { ssr: false }
);

export function ClientWeb3Provider({ children }: { children: ReactNode }) {
  return <Web3ProviderDynamic>{children}</Web3ProviderDynamic>;
}
