import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

/** Message d'état de la transaction (pending / success / error). */
export function TxStatus({
    status,
    message,
}: {
    status: "success" | "error" | "pending";
    message: string;
}) {
    const iconMap = {
        success: <CheckCircle2 size={14} color="var(--green)" />,
        error: <AlertCircle size={14} color="#ef4444" />,
        pending: <Loader2 size={14} className="animate-spin" color="var(--accent-light)" />,
    };
    const colorMap = {
        success: "var(--green)",
        error: "#ef4444",
        pending: "var(--accent-light)",
    };

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 13,
                color: colorMap[status],
            }}
        >
            {iconMap[status]}
            {message}
        </div>
    );
}
