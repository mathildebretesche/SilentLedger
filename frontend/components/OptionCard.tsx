"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";

export function OptionCard({
    id,
    icon,
    title,
    subtitle,
    onClick,
}: {
    id: string;
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    onClick: () => void;
}) {
    const [hovered, setHovered] = useState(false);

    return (
        <button
            id={id}
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "18px 20px",
                background: hovered ? "rgba(124,58,237,0.06)" : "var(--bg-elevated)",
                border: `1px solid ${hovered ? "rgba(124,58,237,0.3)" : "var(--border)"}`,
                borderRadius: 14,
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                transition: "background 0.15s, border-color 0.15s, transform 0.1s",
                transform: hovered ? "translateY(-1px)" : "translateY(0)",
            }}
        >
            {icon}
            <div style={{ flex: 1 }}>
                <div
                    style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        letterSpacing: "-0.01em",
                        marginBottom: 3,
                    }}
                >
                    {title}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    {subtitle}
                </div>
            </div>
            <ChevronRight
                size={16}
                color={hovered ? "var(--accent-light)" : "var(--text-muted)"}
                style={{ flexShrink: 0, transition: "color 0.15s" }}
            />
        </button>
    );
}
