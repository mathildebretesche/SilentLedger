import { GitBranch, ExternalLink, Github, Twitter, Linkedin, Shield } from "lucide-react";
import { EAS_EXPLORER_URL } from "@/lib/contracts";
import { keccak256, toBytes } from "viem";

/**
 * Badge représentant une attestation EAS vérifiée.
 * Partagé entre /dashboard et /profile.
 */
export function SilentProofBadge({
    attestation,
    index,
    platformId,
}: {
    attestation: { uid: `0x${string}` };
    index: number;
    platformId?: string;
}) {
    const truncatedUid = `${attestation.uid.slice(0, 10)}…${attestation.uid.slice(-6)}`;

    // Mappage des plateformes
    const platformConfig = {
        [keccak256(toBytes("github"))]: {
            label: "GitHub Contribution",
            icon: <Github size={16} color="#000" />,
            bg: "rgba(0,0,0,0.05)",
            border: "1px solid rgba(0,0,0,0.1)",
        },
        [keccak256(toBytes("x"))]: {
            label: "X (Twitter) Identity",
            icon: <Twitter size={16} color="#1DA1F2" />,
            bg: "rgba(29,161,242,0.1)",
            border: "1px solid rgba(29,161,242,0.2)",
        },
        [keccak256(toBytes("linkedin"))]: {
            label: "LinkedIn Professional",
            icon: <Linkedin size={16} color="#0A66C2" />,
            bg: "rgba(10,102,194,0.1)",
            border: "1px solid rgba(10,102,194,0.2)",
        },
        [keccak256(toBytes("farcaster"))]: {
            label: "Farcaster Identity",
            icon: <Shield size={16} color="#855DCD" />, // Using Shield for now as lucide has no farcaster, or I can use an SVG
            bg: "rgba(133,93,205,0.1)",
            border: "1px solid rgba(133,93,205,0.2)",
        },
    };

    const config = (platformId && platformConfig[platformId as keyof typeof platformConfig]) || {
        label: "Proof of Identity",
        icon: <Shield size={16} color="var(--accent)" />,
        bg: "rgba(124,58,237,0.15)",
        border: "1px solid rgba(124,58,237,0.3)",
    };

    return (
        <div className="proof-badge" style={{ animationDelay: `${index * 60}ms` }}>
            {/* Status indicator */}
            <div className="pulse-dot flex-shrink-0" />

            {/* Icon */}
            <div
                style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: config.bg,
                    border: config.border,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                }}
            >
                {config.icon}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                        {config.label}
                    </span>
                    <span
                        style={{
                            fontSize: 11,
                            fontWeight: 500,
                            color: "var(--green)",
                            background: "var(--green-dim)",
                            padding: "2px 8px",
                            borderRadius: 4,
                        }}
                    >
                        VERIFIED
                    </span>
                </div>
                <div
                    style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        fontFamily: "monospace",
                        marginTop: 2,
                    }}
                >
                    UID: {truncatedUid}
                </div>
            </div>

            {/* EAS Explorer link */}
            <a
                href={`${EAS_EXPLORER_URL}/${attestation.uid}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--text-muted)", transition: "color 0.15s ease", flexShrink: 0 }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "var(--accent-light)")}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "var(--text-muted)")}
                title="View on EAS Explorer"
            >
                <ExternalLink size={14} />
            </a>
        </div>
    );
}
