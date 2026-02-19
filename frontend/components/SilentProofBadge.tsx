import { GitBranch, ExternalLink } from "lucide-react";
import { EAS_EXPLORER_URL } from "@/lib/contracts";

/**
 * Badge représentant une attestation EAS vérifiée.
 * Partagé entre /dashboard et /profile.
 */
export function SilentProofBadge({
    attestation,
    index,
}: {
    attestation: { uid: `0x${string}` };
    index: number;
}) {
    const truncatedUid = `${attestation.uid.slice(0, 10)}…${attestation.uid.slice(-6)}`;

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
                    background: "rgba(124,58,237,0.15)",
                    border: "1px solid rgba(124,58,237,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                }}
            >
                <GitBranch size={16} color="#a78bfa" />
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                        GitHub Contribution Proof
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
