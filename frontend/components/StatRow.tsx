/** Ligne label / valeur pour la carte Statistiques du dashboard. */
export function StatRow({
    label,
    value,
    accent,
}: {
    label: string;
    value: string;
    accent?: boolean;
}) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
            }}
        >
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{label}</span>
            <span
                style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: accent ? "var(--accent-light)" : "var(--text-primary)",
                }}
            >
                {value}
            </span>
        </div>
    );
}
