import { useReadContract } from "wagmi";
import { CERTIFICATION_SBT_ABI, SBT_ADDRESS } from "@/lib/contracts";
import { Loader2 } from "lucide-react";

/**
 * Composant qui affiche un SBT spécifique (Soulbound Token).
 * Il fetch son `tokenURI` sur la blockchain et affiche l'image SVG correspondante.
 */
export function SBTBadge({ tokenId }: { tokenId: bigint }) {
    const { data: uriData, isLoading } = useReadContract({
        address: SBT_ADDRESS,
        abi: CERTIFICATION_SBT_ABI,
        functionName: "tokenURI",
        args: [tokenId],
        query: {
            staleTime: Infinity, // Le SVG SBT est immuable
        },
    });

    if (isLoading) {
        return (
            <div
                style={{
                    width: 120,
                    height: 120,
                    borderRadius: 16,
                    background: "rgba(124,58,237,0.05)",
                    border: "1px dashed rgba(124,58,237,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Loader2 size={24} className="animate-spin" color="var(--accent)" />
            </div>
        );
    }

    if (!uriData) return null;

    try {
        // Le tokenURI est formaté comme : data:application/json;base64,eyJ...
        const jsonBase64 = (uriData as string).split(",")[1];
        const jsonStr = atob(jsonBase64);
        const metadata = JSON.parse(jsonStr);

        // L'image est formatée comme : data:image/svg+xml;base64,PH...
        const imageUrl = metadata.image;

        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12,
                }}
            >
                <img
                    src={imageUrl}
                    alt={`SBT #${tokenId}`}
                    style={{
                        width: 140,
                        height: 140,
                        borderRadius: 16,
                        boxShadow: "0 8px 32px rgba(32,52,159,0.15)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        transition: "transform 0.3s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05) translateY(-4px)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1) translateY(0)")}
                />
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                        Badge Sovereign
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>
                        Token ID: {tokenId.toString()}
                    </div>
                </div>
            </div>
        );
    } catch (err) {
        console.error("Failed to parse SBT URI:", err);
        return null;
    }
}
