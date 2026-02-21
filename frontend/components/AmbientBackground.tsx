"use client";

/**
 * AmbientBackground – Centralized background elements
 * Large blurred blobs and animated grid for visual consistency across pages.
 */
export function AmbientBackground({ scrollY }: { scrollY: number }) {
    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            {/* Large Blurred Blobs for extra depth */}
            <div
                className="absolute w-[800px] h-[800px] rounded-full opacity-[0.25] transition-transform duration-700 ease-out"
                style={{
                    top: "-10%",
                    left: "-5%",
                    background: "radial-gradient(circle, #20349F 0%, transparent 70%)",
                    filter: "blur(140px)",
                    transform: `translate(${scrollY * 0.05}px, ${scrollY * 0.2}px)`,
                }}
            />
            <div
                className="absolute w-[600px] h-[600px] rounded-full opacity-[0.15] transition-transform duration-700 ease-out"
                style={{
                    bottom: "10%",
                    right: "-10%",
                    background: "radial-gradient(circle, #ffffff 0%, transparent 70%)",
                    filter: "blur(120px)",
                    transform: `translate(${scrollY * -0.1}px, ${scrollY * -0.15}px)`,
                }}
            />

            {/* Animated Grid matching new palette */}
            <div
                className="absolute inset-0 opacity-[0.4]"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)`,
                    backgroundSize: "80px 80px",
                    backgroundPosition: `0px ${scrollY * 0.08}px`,
                }}
            />
        </div>
    );
}
