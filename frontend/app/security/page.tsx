"use client";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  ShieldCheck,
  GitMerge,
  Hash,
  RefreshCw,
  Lock,
  FileCode2,
  AlertTriangle,
} from "lucide-react";

const sections = [
  {
    id: "groth16",
    icon: <GitMerge size={20} />,
    label: "Groth16 / zk-SNARK",
    heading: "Proofs that are either valid or impossible to forge.",
    body: [
      "Every reputation badge on Silent Ledger is backed by a Groth16 zk-SNARK — a zero-knowledge Succinct Non-interactive Argument of Knowledge. The underlying math operates over the BN128 elliptic curve, the same construction used in Ethereum's EIP-197 precompiles.",
      "A Groth16 proof has a fixed size of 3 elliptic curve points (~128 bytes) regardless of circuit complexity. A verifier can check it in constant time. More importantly: generating a valid proof without satisfying every circuit constraint is computationally equivalent to breaking the discrete logarithm problem on BN128 — a task with no known polynomial-time algorithm.",
      "The GhostIdentity circuit enforces 4 constraints simultaneously. If any single one fails — wrong hash, score below threshold, out-of-range value — the prover cannot produce a valid proof. The on-chain verifier ( Groth16Verifier.sol) calls revert on any invalid proof, costing the attacker only gas.",
    ],
    code: [
      "(1)  identityCommitment = Poseidon(usernameHash, salt)",
      "(2)  nullifier          = Poseidon(usernameHash, platformId, reclaimId)",
      "(3)  reputationScore   ≥ reputationThreshold",
      "(4)  reputationScore   <  2³²",
    ],
  },
  {
    id: "poseidon",
    icon: <Hash size={20} />,
    label: "Poseidon Hash",
    heading: "A hash function built for zero-knowledge.",
    body: [
      "Standard hash functions like SHA-256 or keccak256 require tens of thousands of R1CS constraints when encoded inside a ZK circuit. This inflates proof generation time, memory usage, and the size of the trusted setup. Silent Ledger uses Poseidon — an algebraic hash function designed specifically for prime-field arithmetic.",
      "Poseidon runs ~100× more efficiently inside a ZK circuit than SHA-256. The identityCommitment and nullifier are both Poseidon hashes. They are collision-resistant under the same hardness assumptions as the curve: finding two inputs that produce the same digest requires solving a discrete-log-equivalent problem.",
      "Poseidon's design has been independently analyzed and deployed in production by Zcash, Aztec, StarkWare, and Ethereum researchers. It is not experimental cryptography — it is the current ZK-native standard.",
    ],
  },
  {
    id: "nullifier",
    icon: <RefreshCw size={20} />,
    label: "Anti-replay Nullifier",
    heading: "The same credential can never be submitted twice.",
    body: [
      "Each attestation produces a nullifier — a deterministic hash derived from the username hash, the platform identifier, and the reclaimIdentifier (the unique fingerprint assigned by Reclaim's MPC attestors to a specific TLS session). The smart contract stores every consumed nullifier and reverts on any duplicate.",
      "The reclaimIdentifier is computed from the intrinsic parameters of the HTTPS claim — URL, regex match, response timestamp. It is identical for the same underlying contribution regardless of who submits it. This means two different wallets submitting the same GitHub contribution produce the exact same nullifier, and only the first submission succeeds.",
      "This design closes two attack vectors at once: a single user cannot collect multiple badges from one real contribution, and the nullifier itself reveals nothing — it is a Poseidon hash of private values, pre-image resistant under the security of the hash function.",
    ],
  },
  {
    id: "contract",
    icon: <Lock size={20} />,
    label: "Smart Contract",
    heading: "On-chain verification with no trusted intermediary.",
    body: [
      "GhostVerifier.sol is the only entity that issues attestations. It does not accept human input, operator signatures, or admin overrides. The sole path to creating a Ghost attestation is a valid Groth16 proof — verified deterministically by the Solidity verifier generated directly from the proving key.",
      "The contract enforces three sequential gates: (1) the Groth16 proof is cryptographically valid, (2) the nullifier has not been used before, (3) EAS stores the attestation. A failure at any gate reverts the entire transaction. There is no fallback, no emergency exit, no admin bypass.",
      "Badges are issued as non-transferable Soulbound Tokens under ERC-5192. The transfer function is permanently locked at the contract level. Reputation cannot be sold, delegated, or moved. It is cryptographically bound to the wallet that generated the proof.",
    ],
  },
  {
    id: "trusted-setup",
    icon: <FileCode2 size={20} />,
    label: "Trusted Setup",
    heading: "The one assumption — and how it's managed.",
    body: [
      "Groth16 requires a one-time trusted setup ceremony (Powers of Tau) to generate the proving key and verification key. If a single party controlled the entire ceremony and kept the toxic waste (the randomness used during setup), they could generate valid proofs for false statements without satisfying circuit constraints.",
      "The current deployment uses a public Powers of Tau ceremony at 2^17 constraints — the Hermez network's contribution ceremony, which involved hundreds of independent participants from around the world. The toxic waste is destroyed as long as at least one participant was honest. A single honest contributor is sufficient.",
      "The circuit source, the R1CS, the WASM witness generator, the final .zkey, and the on-chain verification key are all published. Anyone can re-run the verification: compile the circuit from source, re-export the Solidity verifier, and compare it byte-for-byte with the deployed contract.",
    ],
  },
  {
    id: "attack-surface",
    icon: <AlertTriangle size={20} />,
    label: "Attack Surface",
    heading: "What could go wrong — stated plainly.",
    body: [
      "Cryptographic break against BN128 discrete log: would compromise the entire zk-SNARK system. No practical attack is known; the curve is used in production by Ethereum itself. This is the foundational assumption the entire field relies on.",
      "Reclaim MPC compromise: if all attestor nodes in the zkTLS session collude, they could fabricate a fake TLS response. This would let someone prove a reputation score they don't have. Reclaim's MPC design requires full collusion — no subset of nodes is sufficient. This attack is outside the scope of Silent Ledger's own cryptography.",
      "Wallet key compromise: if an attacker steals your private key, they can submit proofs on your behalf — but only for contributions you have actually made, since the circuit enforces that the claim is real. Your reputation cannot be inflated by a key thief. It can only be used, not forged.",
      "Frontend substitution: a malicious frontend could display false data or route transactions to a different contract. This is why the contract address and ABI are published. Verify them before connecting your wallet. The protocol is secure; the page you are reading is not part of that trust model.",
    ],
  },
];

export default function SecurityPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      <Header maxWidthClass="max-w-5xl" />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="px-8 pt-16 pb-24 max-w-5xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-card border border-white/60 text-[11px] font-bold uppercase tracking-wider text-accent mb-10">
          <ShieldCheck size={12} />
          Security Model
        </div>
        <h1 className="text-6xl lg:text-[88px] font-black tracking-tighter leading-[0.85] mb-8 text-primary">
          WHY<br />
          <span className="text-transparent" style={{ WebkitTextStroke: "1.5px rgba(15,23,42,0.4)" }}>FORGING</span><br />
          IS IMPOSSIBLE.
        </h1>
        <p className="text-xl text-secondary max-w-xl leading-relaxed font-medium">
          Security here is not a configuration or a policy. It is a consequence of the mathematics.
          This page explains the chain of guarantees — and the one honest assumption at its base.
        </p>

        {/* ── Quick nav ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mt-12">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="flex items-center shadow-sm gap-2 px-4 py-2 rounded-full glass-card border border-white/40 text-[11px] font-black uppercase tracking-widest text-secondary hover:text-accent hover:border-white/80 transition-all"
            >
              {s.icon}
              {s.label}
            </a>
          ))}
        </div>
      </header>

      {/* ── Sections ────────────────────────────────────────────────────── */}
      <main className="px-8 max-w-5xl mx-auto w-full pb-32 space-y-0">
        {sections.map((s, i) => (
          <section
            key={s.id}
            id={s.id}
            className="border-t border-white/40 py-16 grid lg:grid-cols-[220px_1fr] gap-12"
          >
            {/* Left — label */}
            <div className="flex flex-col gap-4 lg:pt-1">
              <div className="flex items-center gap-2 text-accent">
                {s.icon}
                <span className="text-[11px] font-black uppercase tracking-widest">{s.label}</span>
              </div>
              <span className="text-[11px] font-black tracking-widest text-secondary/30 uppercase">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>

            {/* Right — content */}
            <div>
              <h2 className="text-2xl lg:text-3xl font-black tracking-tight leading-tight mb-8 text-primary">
                {s.heading}
              </h2>
              <div className="space-y-5 mb-8">
                {s.body.map((paragraph, j) => (
                  <p key={j} className="text-base text-secondary leading-[1.8]">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Optional code block */}
              {"code" in s && s.code && (
                <div className="glass-card bg-black/5 rounded-2xl px-8 py-6 font-mono text-[13px] leading-[2] text-secondary space-y-1">
                  {(s.code as string[]).map((line, j) => (
                    <div key={j}>
                      <span className="text-primary/30 select-none mr-4">{String(j + 1).padStart(2, "0")}</span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        ))}

        {/* ── Guarantee chain ─────────────────────────────────────────── */}
        <div className="border-t border-white/40 pt-16">
          <div className="glass-card text-primary rounded-[40px] p-12 lg:p-16 relative overflow-hidden">
            <div
              className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-30"
              style={{
                background: "radial-gradient(circle, #20349F 0%, transparent 70%)",
                filter: "blur(80px)",
                transform: "translate(30%, -30%)",
              }}
            />
            <div className="relative z-10">
              <p className="text-[11px] font-black uppercase tracking-widest text-secondary/50 mb-10">
                Chain of Guarantees
              </p>

              <div className="space-y-0">
                {[
                  {
                    step: "01",
                    label: "zkTLS",
                    claim: "The TLS response is authentic.",
                    basis: "MPC threshold signature over the TLS session",
                  },
                  {
                    step: "02",
                    label: "Circuit",
                    claim: "The claim satisfies all 4 constraints.",
                    basis: "Groth16 completeness — valid witness ↔ valid proof",
                  },
                  {
                    step: "03",
                    label: "Poseidon",
                    claim: "Commitments and nullifiers cannot be reversed.",
                    basis: "Pre-image resistance over BN128 prime field",
                  },
                  {
                    step: "04",
                    label: "Nullifier",
                    claim: "The same credential cannot be submitted twice.",
                    basis: "Deterministic hash stored on-chain, revert on collision",
                  },
                  {
                    step: "05",
                    label: "Verifier",
                    claim: "Only a valid proof opens the contract gate.",
                    basis: "Solidity verifier generated from proving key, no admin path",
                  },
                  {
                    step: "06",
                    label: "SBT",
                    claim: "Reputation cannot be transferred or sold.",
                    basis: "ERC-5192 transfer locked at contract level",
                  },
                ].map((item, i, arr) => (
                  <div
                    key={item.step}
                    className={`flex items-start gap-8 py-6 ${i < arr.length - 1 ? "border-b border-primary/10" : ""}`}
                  >
                    <span className="text-[11px] font-black text-secondary/40 w-6 shrink-0 mt-0.5">
                      {item.step}
                    </span>
                    <div className="flex-1 flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-8">
                      <span className="text-[11px] font-black uppercase tracking-widest text-accent w-20 shrink-0">
                        {item.label}
                      </span>
                      <span className="text-base font-bold text-primary flex-1">
                        {item.claim}
                      </span>
                      <span className="text-[12px] text-secondary lg:text-right lg:max-w-xs">
                        {item.basis}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <Footer />
    </div>
  );
}
