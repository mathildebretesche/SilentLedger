"use client";

import { useEffect, useState } from "react";

/**
 * TrustWheel Component
 * A premium circular gauge inspired by Apple Watch / High-end dashboards.
 */
export function TrustWheel({ value = 0 }: { value: number }) {
    const radius = 90;
    const strokeWidth = 14;
    const circumference = 2 * Math.PI * radius;
    const [offset, setOffset] = useState(circumference);
    const normalizedValue = Math.max(0, Math.min(100, value));

    useEffect(() => {
        const progress = (normalizedValue / 100) * circumference;
        const timer = setTimeout(() => {
            setOffset(circumference - progress);
        }, 300);
        return () => clearTimeout(timer);
    }, [normalizedValue, circumference]);

    return (
        <div className="relative flex items-center justify-center w-[320px] h-[320px] animate-in fade-in zoom-in duration-1000">
            {/* Dynamic Background Glow */}
            <div
                className="absolute inset-[20%] rounded-full opacity-30 blur-[60px] transition-colors duration-1000"
                style={{ background: normalizedValue > 50 ? "var(--accent)" : "#94a3b8" }}
            />

            <svg className="w-full h-full transform -rotate-90 filter drop-shadow-[0_0_30px_rgba(32,52,159,0.1)]" viewBox="0 0 240 240">
                {/* Outer Track */}
                <circle
                    cx="120"
                    cy="120"
                    r={radius}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.4)"
                    strokeWidth={strokeWidth - 2}
                    className="backdrop-blur-sm"
                />

                {/* Progress Stroke */}
                <circle
                    cx="120"
                    cy="120"
                    r={radius}
                    fill="none"
                    stroke="url(#trustGradient)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    style={{ strokeDashoffset: offset }}
                    strokeLinecap="round"
                    className="transition-all duration-[1500ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                />

                <defs>
                    <linearGradient id="trustGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--accent)" />
                        <stop offset="100%" stopColor="var(--accent-light)" />
                    </linearGradient>
                </defs>
            </svg>

            {/* Central Score Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pt-2">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-secondary opacity-40 mb-2">
                    CONFIDENCE
                </span>

                <div className="flex items-start mb-2">
                    <span className="text-[88px] font-black tracking-tighter leading-none text-primary">
                        {Math.round(normalizedValue)}
                    </span>
                    <span className="text-2xl font-black text-accent mt-3 ml-0.5">%</span>
                </div>

                {/* Status Badge */}
                <div
                    className="px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-widest border transition-all duration-500 shadow-sm"
                    style={{
                        background: normalizedValue > 70 ? "rgba(34,197,94,0.08)" : "rgba(32,52,159,0.04)",
                        borderColor: normalizedValue > 70 ? "rgba(34,197,94,0.15)" : "rgba(32,52,159,0.15)",
                        color: normalizedValue > 70 ? "#16a34a" : "var(--accent)",
                        backdropFilter: "blur(10px)"
                    }}
                >
                    {normalizedValue >= 90 ? "SOVEREIGN" : normalizedValue >= 50 ? "VERIFIED" : "LEVEL 1"}
                </div>
            </div>
        </div>
    );
}
