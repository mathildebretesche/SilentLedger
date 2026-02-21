"use client";

import Link from "next/link";
import { FileText, ExternalLink, ChevronRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

type DocEntry = { title: string; description: string; href: string; icon: string; external?: boolean; isAnchor?: boolean };
type DocsSection = { title: string; docs: DocEntry[] };

const docsSections: DocsSection[] = [
  {
    title: "Protocol Documentation",
    docs: [
      {
        title: "Ghost ZK Prover",
        description: "Comprehensive guide to the Ghost Identity zk-SNARK circuit architecture, Groth16 proving system, and how reputation proofs are generated and verified on-chain.",
        href: "/docs/ghostZkProver",
        icon: "🔮",
      },
      {
        title: "Nullifier and Selective Disclosure",
        description: "Deep dive into the nullifier mechanism that prevents replay attacks and enables selective disclosure of reputation credentials without revealing identity.",
        href: "/docs/nullifierAndSelectiveDisclosure",
        icon: "🔒",
      },
      {
        title: "Sensitive Data Masker",
        description: "Technical details on how sensitive information is masked and protected throughout the proof generation process.",
        href: "/docs/sensitiveDataMasker",
        icon: "🎭",
      },
    ],
  },
  {
    title: "Smart Contracts",
    docs: [
      {
        title: "SilentLedgerAttester",
        description: "Documentation for the main attestation contract that receives zk-SNARK proofs and issues EAS attestations.",
        href: "/contracts#silentledgerattester",
        icon: "📜",
        isAnchor: true,
      },
      {
        title: "CertificationSBT",
        description: "ERC-5192 Soulbound Token implementation for non-transferable certification badges.",
        href: "/contracts#certificationsbt",
        icon: "🏆",
        isAnchor: true,
      },
      {
        title: "Ethereum Attestation Service (EAS)",
        description: "Overview of EAS integration and how attestations are stored on-chain.",
        href: "https://sepolia.easscan.org/",
        icon: "⛓️",
        external: true,
      },
    ],
  },
];

export default function DocsPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen relative flex flex-col" style={{ color: "var(--text-primary)" }}>
      <Header />

      <main className="flex-1 pt-32 pb-20 px-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <div className="mb-16 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-white/20 text-xs font-bold uppercase tracking-wider text-accent mb-6">
              <FileText size={14} />
              Documentation
            </div>
            <h1 className="text-5xl font-black tracking-tight text-primary mb-6">
              {t.docs.title || "Documentation"}
            </h1>
            <p className="text-xl text-secondary/80 max-w-2xl mx-auto leading-relaxed">
              {t.docs.subtitle ||
                "Explore technical documentation, architecture guides, and smart contract references for Silent Ledger."}
            </p>
          </div>

          {/* Sections */}
          {docsSections.map((section, idx) => (
            <div key={idx} className="mb-16">
              <h2 className="text-2xl font-bold text-primary mb-6">{section.title}</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {section.docs.map((doc, docIdx) => (
                  <Link
                    key={docIdx}
                    href={doc.href}
                    target={doc.external ? "_blank" : undefined}
                    rel={doc.external ? "noopener noreferrer" : undefined}
                    className="group glass-card p-6 rounded-2xl border border-white/20 hover:border-accent/40 transition-all hover:bg-accent/5"
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-3xl">{doc.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-primary group-hover:text-accent transition-colors">
                            {doc.title}
                          </h3>
                          {doc.external && <ExternalLink size={14} className="text-secondary/40" />}
                          {doc.isAnchor && <ChevronRight size={14} className="text-secondary/40" />}
                        </div>
                        <p className="text-sm text-secondary/70 leading-relaxed line-clamp-3">
                          {doc.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {/* GitHub CTA */}
          <div className="mt-16 p-8 rounded-3xl bg-gradient-to-br from-accent/10 to-primary/5 border border-white/10 text-center">
            <h3 className="text-2xl font-bold text-primary mb-3">
              {t.docs.contributeTitle || "Contribute"}
            </h3>
            <p className="text-secondary/80 mb-6 max-w-xl mx-auto">
              {t.docs.contributeDesc ||
                "Found something missing? Help improve the documentation or contribute to the project on GitHub."}
            </p>
            <Link
              href="https://github.com/mathildebretesche/SilentLedger"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-semibold hover:bg-accent-light transition-all shadow-lg shadow-accent/25"
            >
              <ExternalLink size={18} />
              {t.docs.viewOnGitHub || "View on GitHub"}
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
