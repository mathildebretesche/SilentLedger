"use client";

/**
 * ProfilePage – /profile
 * Read-only view of any wallet address's Silent Proof attestations.
 * No wallet connection required.
 */

import { useState, useEffect, useCallback } from "react";
import { useReadContract } from "wagmi";
import { useAccount } from "wagmi";
import {
  Search,
  Shield,
  AlertCircle,
  Copy,
  Check,
  X,
  User,
  ExternalLink,
} from "lucide-react";
import { isAddress, decodeAbiParameters } from "viem";

import {
  SILENT_LEDGER_ATTESTER_ABI,
  ATTESTER_ADDRESS,
  CERTIFICATION_SBT_ABI,
  SBT_ADDRESS,
  EAS_ADDRESS,
  EAS_ABI,
} from "@/lib/contracts";
import { SilentProofBadge } from "@/components/SilentProofBadge";
import { useReadContracts } from "wagmi";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function ProfilePage() {
  const { t } = useTranslation();
  const { address: connectedAddress, isConnected } = useAccount();

  const [inputValue, setInputValue] = useState("");
  const [searchedAddress, setSearchedAddress] = useState<`0x${string}` | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [validAddress, setValidAddress] = useState<boolean>(false);

  // Real-time address validation
  useEffect(() => {
    if (inputValue.trim() && isAddress(inputValue.trim())) {
      setValidAddress(true);
      setInputError(null);
    } else if (inputValue.trim()) {
      setValidAddress(false);
    }
  }, [inputValue]);

  // Fetch attestations only when a valid address has been searched
  const {
    data: attestationUIDs,
    isLoading: isLoadingAttestations,
    isFetching: isFetchingAttestations,
  } = useReadContract({
    address: ATTESTER_ADDRESS,
    abi: SILENT_LEDGER_ATTESTER_ABI,
    functionName: "getAttestations",
    args: searchedAddress ? [searchedAddress] : undefined,
    query: { enabled: !!searchedAddress, staleTime: 10000 },
  });

  // Fetch SBT Token IDs
  const {
    data: sbtTokenIds,
    isLoading: isLoadingSBTs,
  } = useReadContract({
    address: SBT_ADDRESS,
    abi: CERTIFICATION_SBT_ABI,
    functionName: "getTokensOfOwner",
    args: searchedAddress ? [searchedAddress] : undefined,
    query: { enabled: !!searchedAddress, staleTime: 10000 },
  });

  // Batch Fetch SBT Details
  const sbtCalls = sbtTokenIds?.map((tokenId: bigint) => ({
    address: SBT_ADDRESS,
    abi: CERTIFICATION_SBT_ABI,
    functionName: "getCertification",
    args: [tokenId],
  }));

  const { data: sbtDetails, isLoading: isLoadingSBTDetails } = useReadContracts({
    contracts: sbtCalls ?? [],
    query: { enabled: !!sbtTokenIds && sbtTokenIds.length > 0, staleTime: 10000 },
  });

  const attestations = (attestationUIDs as `0x${string}`[] | undefined) ?? [];
  const sbts = sbtDetails ?? [];

  // Fetch EAS attestation details to decode platformId
  const { data: attestationDetails } = useReadContracts({
    contracts: attestations.map((uid) => ({
      address: EAS_ADDRESS as `0x${string}`,
      abi: EAS_ABI,
      functionName: "getAttestation",
      args: [uid],
    })),
    query: { enabled: attestations.length > 0, staleTime: 10000 },
  });

  // Extract AI Code Audit scores from SBT certifications
  const aiAuditScores = (sbtDetails || []).map((res: { result?: unknown }) => {
    if (!res.result) return null;
    const cert = res.result as {
      competenceName: string;
      proofOfWorkURL: string;
      examScore: number;
      acquisitionDate: bigint;
    };
    // Check if it's the AI Code Audit (not the generic Reclaim GitHub URL)
    if (cert.competenceName === "Open Source Contributor" && cert.proofOfWorkURL !== "https://github.com") {
      return {
        score: Number(cert.examScore),
        date: Number(cert.acquisitionDate) * 1000
      };
    }
    return null;
  }).filter(Boolean) as { score: number; date: number }[];

  // Get the most recent AI audit score
  const latestAiAudit = aiAuditScores.length > 0
    ? aiAuditScores.sort((a, b) => b.date - a.date)[0]
    : null;

  const isLoading = isLoadingAttestations || isLoadingSBTs || isLoadingSBTDetails;
  const isFetching = isFetchingAttestations;

  const handleSearch = useCallback(() => {
    const trimmed = inputValue.trim();

    // Check if ENS name (contains .eth or similar)
    if (trimmed.includes('.') && !trimmed.startsWith('0x')) {
      // For now, we'll require 0x addresses
      setInputError("Please enter a valid Ethereum address (0x...)");
      return;
    }

    if (!trimmed) {
      setInputError(t.profile?.errors?.required || "Please enter a wallet address.");
      return;
    }

    if (!isAddress(trimmed)) {
      setInputError(t.profile?.errors?.invalid || "Invalid Ethereum address.");
      return;
    }

    setInputError(null);
    setSearchedAddress(trimmed as `0x${string}`);
  }, [inputValue, t]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleClear = () => {
    setInputValue("");
    setSearchedAddress(null);
    setInputError(null);
    setCopied(false);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputValue(text);
      setInputError(null);
    } catch (err) {
      console.error("Paste failed:", err);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleUseMyAddress = () => {
    if (connectedAddress) {
      setInputValue(connectedAddress);
      setSearchedAddress(connectedAddress);
      setInputError(null);
    }
  };

  // Shorten address for display
  const shortenAddress = (addr: unknown): string => {
    if (!addr) return 'Invalid address';
    const str = typeof addr === 'string' ? addr : String(addr);
    if (str.length >= 10) {
      return `${str.slice(0, 6)}…${str.slice(-4)}`;
    }
    return str;
  };

  return (
    <div className="min-h-screen relative flex flex-col bg-background">
      <Header maxWidthClass="max-w-6xl" />

      <main className="relative z-10 w-full flex flex-col gap-12 sm:gap-20 pb-32">
        {/* ── PAGE TITLE ───────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto w-full px-6 pt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4" style={{ color: "var(--text-primary)" }}>
              {t.profile?.title || "Profile"}<span style={{ color: "var(--accent)" }}>.</span>
            </h1>
            <p className="text-lg text-secondary max-w-2xl mx-auto leading-relaxed opacity-80">
              {t.profile?.subtitle || "Enter any Ethereum wallet address to inspect their on-chain Silent Proofs."}
            </p>
          </div>
        </section>

        {/* ── QUICK ACTION: USE MY WALLET ─────────────────────────────── */}
        {isConnected && connectedAddress && (
          <section className="max-w-6xl mx-auto w-full px-6">
            <div
              className="glass-card p-4 flex items-center justify-between"
              style={{
                background: "rgba(124,58,237,0.08)",
                border: "1px solid rgba(124,58,237,0.2)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "var(--accent)" }}
                >
                  <User size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">
                    {t.profile?.connectedWallet || "Connected wallet detected"}
                  </p>
                  <p className="text-sm font-bold font-mono text-primary">
                    {shortenAddress(connectedAddress)}
                  </p>
                </div>
              </div>
              <button
                onClick={handleUseMyAddress}
                className="btn-stamp text-xs py-2 px-4"
              >
                {t.profile?.viewMyProfile || "View my profile"}
              </button>
            </div>
          </section>
        )}

        {/* ── SEARCH SECTION ─────────────────────────────────────────── */}
        <section className="max-w-3xl mx-auto w-full px-6">
          <div className="glass-card p-6">
            <div className="flex gap-3 flex-wrap">
              <div
                className="flex-1 min-w-[200px] flex items-center bg-elevated rounded-xl"
                style={{
                  border: `1px solid ${inputError ? "rgba(239,68,68,0.5)" : validAddress ? "rgba(124,58,237,0.5)" : "var(--border)"}`,
                }}
              >
                <Search size={14} className="ml-3" color={validAddress ? "var(--accent)" : "var(--text-muted)"} />
                <input
                  id="profile-address-input"
                  type="text"
                  placeholder={t.profile?.placeholder || "0x… wallet address"}
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setInputError(null);
                  }}
                  onKeyDown={handleKeyDown}
                  autoComplete="off"
                  spellCheck={false}
                  className="flex-1 bg-transparent border-none outline-none text-sm py-3 px-3 font-mono text-primary"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handlePaste}
                  className="glass-button text-xs py-2 px-3 h-10"
                  title={t.profile?.paste || "Paste from clipboard"}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                  </svg>
                  <span className="text-xs">{t.profile?.paste || "Paste"}</span>
                </button>

                <button
                  onClick={handleClear}
                  className="glass-button text-xs py-2 px-2 h-10"
                  title={t.profile?.clear || "Clear"}
                  disabled={!inputValue}
                >
                  <X size={12} />
                </button>

                <button
                  id="profile-search-btn"
                  className="btn-stamp text-xs py-2 px-4 h-10 flex items-center gap-2"
                  onClick={handleSearch}
                  disabled={!validAddress}
                  style={{
                    opacity: validAddress ? 1 : 0.5,
                    cursor: validAddress ? "pointer" : "not-allowed",
                  }}
                >
                  <Search size={12} />
                  {t.profile?.search || "Search"}
                </button>
              </div>
            </div>

            {/* Error message */}
            {inputError && (
              <div
                className="flex items-center gap-2 mt-3 text-xs text-red-500 bg-red-500/10 p-3 rounded-lg"
              >
                <AlertCircle size={12} />
                {inputError}
              </div>
            )}

            {/* Valid address indicator */}
            {validAddress && !inputError && (
              <div
                className="flex items-center gap-2 mt-3 text-xs text-accent bg-accent/10 p-3 rounded-lg"
              >
                <Check size={12} />
                {t.profile?.validAddress || "Valid Ethereum address"}
              </div>
            )}
          </div>
        </section>

        {/* ── RESULTS SECTION ─────────────────────────────────────────── */}
        {searchedAddress && (
          <section className="max-w-4xl mx-auto w-full px-6">
            <div className="glass-card p-6 sm:p-8">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-white/10">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted mb-2 flex items-center gap-2">
                    {t.profile?.silentProofs || "Silent Proofs"}
                    {attestations.length > 0 && (
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-black"
                        style={{
                          background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(167,139,250,0.3))",
                          color: "var(--accent-light)",
                        }}
                      >
                        {attestations.length}
                      </span>
                    )}
                    {sbts.length > 0 && (
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-black"
                        style={{
                          background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(52,211,153,0.2))",
                          color: "#34d399",
                        }}
                      >
                        +{sbts.length} SBT{sbts.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </h2>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-sm font-mono text-secondary bg-elevated px-3 py-1.5 rounded-md border border-border flex items-center gap-2"
                      title={searchedAddress}
                    >
                      {shortenAddress(searchedAddress)}
                      <button
                        onClick={() => handleCopy(searchedAddress)}
                        className="p-0.5 hover:bg-white/10 rounded transition-colors"
                        title={t.profile?.copyAddress || "Copy address"}
                      >
                        {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} className="text-muted" />}
                      </button>
                    </span>
                    <a
                      href={`https://sepolia.etherscan.io/address/${searchedAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors"
                      title={t.profile?.viewOnEtherscan || "View on Etherscan"}
                    >
                      {t.profile?.etherscan || "Etherscan"}
                      <ExternalLink size={10} />
                    </a>
                  </div>
                </div>

                {(isLoading || isFetching) && (
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <div className="spinner" style={{ width: 12, height: 12 }} />
                    {t.profile?.loading || "Loading..."}
                  </div>
                )}
              </div>

              {/* AI Code Audit Score Card */}
              {!isLoading && !isFetching && latestAiAudit && (
                <div className="glass-card p-6 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
                          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-primary text-lg">AI Code Quality Audit</h3>
                        <p className="text-xs text-muted">Certified code quality score</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl glass-panel">
                    <div className="flex flex-col items-center min-w-[100px]">
                      <span className="text-[10px] uppercase font-black tracking-widest text-muted mb-1">Quality Score</span>
                      <div className="text-4xl font-black text-primary flex items-baseline">
                        {latestAiAudit.score}<span className="text-sm text-muted ml-1">/100</span>
                      </div>
                      <p className="text-xs text-secondary mt-1">
                        {new Date(latestAiAudit.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-2 text-sm font-bold text-green-500 mb-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        Verified by AI
                      </div>
                      <p className="text-sm text-secondary leading-relaxed">
                        This wallet has undergone a privacy-preserving AI code quality audit. The analysis was performed on public GitHub metadata without accessing private source code.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading skeleton */}
              {(isLoading || isFetching) && (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="shimmer"
                      style={{ height: 100, borderRadius: 12, border: "1px solid var(--border)" }}
                    />
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!isLoading && !isFetching && attestations.length === 0 && sbts.length === 0 && (
                <div
                  className="text-center py-16 border-2 border-dashed rounded-2xl"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--bg-elevated)",
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{
                      background: "var(--bg-base)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <Shield size={28} className="text-muted" />
                  </div>
                  <h3 className="text-base font-bold text-primary mb-2">
                    {t.profile?.noProofsTitle || "No Silent Proofs Found"}
                  </h3>
                  <p className="text-sm text-secondary max-w-md mx-auto leading-relaxed">
                    {t.profile?.noProofsDesc || "This address hasn't created any Silent Proofs yet. Start by connecting a wallet and proving an account in the dashboard."}
                  </p>
                </div>
              )}

              {/* Empty state: no attestations but has SBTs */}
              {!isLoading && !isFetching && attestations.length === 0 && sbts.length > 0 && (
                <div
                  className="text-center py-12 rounded-2xl"
                  style={{
                    background: "rgba(16,185,129,0.05)",
                    border: "2px solid rgba(16,185,129,0.2)",
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{ background: "rgba(16,185,129,0.1)" }}
                  >
                    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2">
                      <path d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-primary mb-2">
                    {t.profile?.hasSBTs || "Certifications Found"}
                  </h3>
                  <p className="text-sm text-secondary max-w-md mx-auto leading-relaxed">
                    {t.profile?.sbtOnlyDesc || "This address has on-chain certifications but no recent Silent Proofs."}
                  </p>
                </div>
              )}

              {/* SBTs Section */}
              {!isLoading && !isFetching && sbts.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: "#34d399" }}
                      />
                      {t.profile?.certifications || "Certifications"}
                      <span className="font-normal text-muted">({sbts.length})</span>
                    </h3>
                  </div>
                  <div className="flex flex-col gap-3">
                    {sbts.map((sbtDetail: { result?: { competenceName?: string } }, i: number) => {
                      const tokenId = sbtTokenIds?.[i];
                      return (
                        <div
                          key={tokenId?.toString() || i}
                          className="glass-card p-4"
                          style={{
                            borderLeft: "3px solid #34d399",
                            background: "rgba(16,185,129,0.03)",
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-bold text-primary mb-1">
                                {sbtDetail?.result?.competenceName || t.profile?.certifiedBadge || "Certified Badge"}
                              </p>
                              <p className="text-xs text-secondary font-mono">
                                {t.profile?.tokenId || "Token ID"}: {tokenId?.toString()}
                              </p>
                            </div>
                            <span
                              className="text-[10px] font-bold uppercase tracking-wider"
                              style={{ color: "#34d399" }}
                            >
                              SBT
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Attestations Section */}
              {!isLoading && !isFetching && attestations.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: "var(--accent)" }}
                      />
                      {t.profile?.attestations || "Attestations"}
                      <span className="font-normal text-muted">({attestations.length})</span>
                    </h3>
                  </div>
                  <div className="flex flex-col gap-3 animate-in fade-in duration-1000">
                    {attestations.map((uid: `0x${string}`, i: number) => {
                      const detail = (attestationDetails || []).find(
                        (d: { result?: { uid: string } }) => d.result?.uid === uid
                      ) as { result?: { data: `0x${string}` } } | undefined;
                      let platformId: string | undefined = undefined;
                      if (detail?.result?.data) {
                        try {
                          const [pid] = decodeAbiParameters(
                            [{ type: "bytes32" }, { type: "uint256" }, { type: "bool" }],
                            detail.result.data
                          );
                          platformId = pid as string;
                        } catch { /* no-op */ }
                      }
                      return (
                        <SilentProofBadge
                          key={uid}
                          attestation={{ uid }}
                          platformId={platformId}
                          index={i}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div >
  );
}
