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

    // Dynamic Color Palette Logic
    const getColors = (val: number) => {
        if (val >= 80) return {
            start: "#10b981", // Emerald 500
            end: "#059669",   // Emerald 600
            glow: "rgba(16, 185, 129, 0.2)",
            text: "#065f46"   // Emerald 800
        };
        if (val >= 50) return {
            start: "#3b82f6", // Blue 500
            end: "#1d4ed8",   // Blue 700
            glow: "rgba(59, 130, 246, 0.2)",
            text: "#1e40af"   // Blue 800
        };
        return {
            start: "#64748b", // Slate 500
            end: "#334155",   // Slate 700
            glow: "rgba(100, 116, 139, 0.2)",
            text: "#1e293b"   // Slate 800
        };
    };

    const colors = getColors(normalizedValue);

    return (
        <div className="relative flex items-center justify-center w-full max-w-[280px] sm:max-w-[320px] aspect-square animate-in fade-in zoom-in duration-1000">
            {/* Dynamic Background Glow */}
            <div
                className="absolute inset-[20%] rounded-full opacity-30 blur-[60px] transition-all duration-1000"
                style={{ background: colors.glow }}
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
                        <stop offset="0%" stopColor={colors.start} />
                        <stop offset="100%" stopColor={colors.end} />
                    </linearGradient>
                </defs>
            </svg>

            {/* Central Score Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pt-2">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-secondary opacity-40 mb-2">
                    CONFIDENCE
                </span>

                <div className="flex items-start mb-2">
                    <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-none text-primary">
                        {Math.round(normalizedValue)}
                    </span>
                    <span className="text-2xl font-black text-accent mt-3 ml-0.5">%</span>
                </div>

                {/* Status Badge */}
                <div
                    className="px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-widest border transition-all duration-500 shadow-sm"
                    style={{
                        background: `${colors.start}15`,
                        borderColor: `${colors.start}30`,
                        color: colors.text,
                        backdropFilter: "blur(10px)"
                    }}
                >
                    {normalizedValue >= 90 ? "SOVEREIGN" : normalizedValue >= 50 ? "VERIFIED" : "LEVEL 1"}
                </div>
            </div>
        </div>
    );
}
