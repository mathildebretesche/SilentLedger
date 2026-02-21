"use client";

import Link from "next/link";
import { ExternalLink, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  ATTESTER_ADDRESS,
  EAS_ADDRESS,
  SBT_ADDRESS,
  EAS_EXPLORER_URL,
} from "@/lib/contracts";

export default function ContractsPage() {
  const { t } = useTranslation();
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (address: string) => {
    await navigator.clipboard.writeText(address);
    setCopied(address);
    setTimeout(() => setCopied(null), 2000);
  };

  const contracts = [
    {
      name: t.contracts.attesterName || "SilentLedgerAttester",
      description: t.contracts.attesterDesc || "Main contract that issues reputation attestations. Accepts zk-SNARK proofs and submits attestations via EAS.",
      address: ATTESTER_ADDRESS,
      explorer: `https://sepolia.etherscan.io/address/${ATTESTER_ADDRESS}`,
      abi: "SILENT_LEDGER_ATTESTER_ABI",
      functions: ["submitProof", "submitOracleProof", "getAttestations", "sbtContract"],
    },
    {
      name: t.contracts.sbtName || "CertificationSBT",
      description: t.contracts.sbtDesc || "Soulbound Token (ERC-5192) for certifications. Badges are non-transferable and permanently bound to the receiving wallet.",
      address: SBT_ADDRESS,
      explorer: `https://sepolia.etherscan.io/address/${SBT_ADDRESS}`,
      abi: "CERTIFICATION_SBT_ABI",
      functions: ["tokenURI", "getTokensOfOwner", "getCertification"],
    },
    {
      name: t.contracts.easName || "EAS",
      description: t.contracts.easDesc || "Standardized attestation service on Ethereum. Stores all attestations in a verifiable and immutable way.",
      address: EAS_ADDRESS,
      explorer: `${EAS_EXPLORER_URL}/0x${EAS_ADDRESS.slice(2)}`,
      abi: "EAS_ABI",
      functions: ["getAttestation"],
      external: true,
    },
  ];

  const isPlaceholder = (address: string) =>
    address === "0x0000000000000000000000000000000000000000";

  return (
    <div className="min-h-screen relative flex flex-col" style={{ color: "var(--text-primary)" }}>
      <Header />

      <main className="flex-1 pt-32 pb-20 px-4 sm:px-6 md:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-4">
              {t.contracts.title}
            </h1>
            <p className="text-secondary/80 text-lg leading-relaxed max-w-2xl">
              {t.contracts.subtitle}
            </p>
          </div>

          {/* Network Badge */}
          <div className="mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-white/20 text-sm font-semibold">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {t.contracts.network}
            </span>
          </div>

          {/* Contracts List */}
          <div className="space-y-8">
            {contracts.map((contract, index) => (
              <div
                key={index}
                className="glass-card p-4 sm:p-6 rounded-2xl border border-white/20 hover:border-accent/50 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-primary mb-2">
                      {contract.name}
                    </h2>
                    <p className="text-secondary/80 text-sm leading-relaxed">
                      {contract.description}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {isPlaceholder(contract.address) ? (
                      <span className="px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 text-xs font-semibold text-center">
                        {t.contracts.notDeployed}
                      </span>
                    ) : (
                      <a
                        href={contract.explorer}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-accent/10 text-accent text-sm font-semibold hover:bg-accent/20 transition-colors"
                      >
                        <ExternalLink size={14} />
                        {t.contracts.viewOnEtherscan}
                      </a>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="bg-primary/5 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between gap-4">
                    <code className="text-sm font-mono text-secondary/90 break-all">
                      {contract.address}
                    </code>
                    {!isPlaceholder(contract.address) && (
                      <button
                        onClick={() => copyToClipboard(contract.address)}
                        className="flex-shrink-0 w-10 h-10 rounded-lg glass-card border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
                        title={t.contracts.copyAddress}
                      >
                        {copied === contract.address ? (
                          <Check size={18} className="text-green-400" />
                        ) : (
                          <Copy size={18} className="text-secondary/60" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* ABI Reference */}
                <div className="mb-4">
                  <span className="text-xs font-semibold text-secondary/60 uppercase tracking-wider">
                    {t.contracts.abiExport}
                  </span>
                  <p className="font-mono text-sm text-secondary/80 mt-1">
                    {contract.abi}
                  </p>
                </div>

                {/* Functions */}
                <div>
                  <span className="text-xs font-semibold text-secondary/60 uppercase tracking-wider">
                    {t.contracts.keyFunctions}
                  </span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {contract.functions.map((fn, idx) => (
                      <code
                        key={idx}
                        className="px-3 py-1 rounded-lg bg-accent/10 text-accent text-xs font-mono"
                      >
                        {fn}
                      </code>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Additional Resources */}
          <div className="mt-12 p-6 rounded-2xl bg-gradient-to-br from-accent/5 to-primary/5 border border-white/10">
            <h3 className="text-lg font-bold text-primary mb-3">
              {t.contracts.integrationTitle}
            </h3>
            <p className="text-secondary/80 text-sm mb-4">
              {t.contracts.integrationDesc}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg glass-card border border-white/20 text-sm font-medium hover:bg-white/10 transition-colors"
              >
                {t.contracts.viewDocs}
              </Link>
              <a
                href="https://github.com/mathildebretesche/SilentLedger"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg glass-card border border-white/20 text-sm font-medium hover:bg-white/10 transition-colors"
              >
                <ExternalLink size={14} />
                {t.contracts.viewGitHub}
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
