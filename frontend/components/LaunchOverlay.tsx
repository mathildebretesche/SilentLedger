import { useState, useEffect } from "react";
import Link from "next/link";
import { X, User, Search, ArrowRight } from "lucide-react";

export function LaunchOverlay({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => setVisible(true));
            });
        } else {
            setVisible(false);
        }
    }, [isOpen]);

    const handleClose = () => {
        setVisible(false);
        setTimeout(onClose, 300);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Dynamic Animated Backdrop */}
            <div
                onClick={handleClose}
                className="fixed inset-0 z-[100] transition-opacity duration-500 overflow-hidden"
                style={{
                    opacity: visible ? 1 : 0,
                    background: "rgba(255, 255, 255, 0.2)",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                }}
            >
                {/* Subtle moving blobs specific to the overlay */}
                <div
                    className="absolute w-[800px] h-[800px] rounded-full opacity-30 mix-blend-multiply"
                    style={{
                        top: "-20%",
                        left: "-10%",
                        background: "radial-gradient(circle, var(--accent) 0%, transparent 60%)",
                        filter: "blur(100px)",
                        animation: "spin 20s linear infinite",
                    }}
                />
                <div
                    className="absolute w-[600px] h-[600px] rounded-full opacity-20 mix-blend-multiply"
                    style={{
                        bottom: "-10%",
                        right: "-10%",
                        background: "radial-gradient(circle, #ffffff 0%, transparent 60%)",
                        filter: "blur(80px)",
                        animation: "spin-reverse 15s linear infinite",
                    }}
                />
            </div>

            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
                <div
                    className="glass-card w-full max-w-3xl p-10 sm:p-16 pointer-events-auto transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] border-white/60 shadow-[0_40px_100px_rgba(32,52,159,0.15)] relative overflow-hidden"
                    style={{
                        opacity: visible ? 1 : 0,
                        transform: visible ? "scale(1) translateY(0px)" : "scale(0.92) translateY(24px)",
                    }}
                >
                    {/* Inner highlight for extra depth */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-50" />

                    <div className="flex items-start justify-between mb-16 relative z-10">
                        <div>
                            <h2 className="text-5xl sm:text-6xl font-black tracking-tighter mb-3 text-primary" style={{ textShadow: "0 4px 20px rgba(255,255,255,0.4)" }}>ACCESS.</h2>
                            <p className="text-secondary font-medium tracking-wide text-lg opacity-80">Select your point of entry.</p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="w-14 h-14 rounded-full bg-white/20 border border-white/40 flex items-center justify-center hover:bg-white hover:text-accent hover:rotate-90 transition-all duration-300 shadow-sm"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                        {/* Primary Action: Portal */}
                        <Link
                            href="/dashboard"
                            onClick={handleClose}
                            className="group relative flex flex-col p-10 rounded-[40px] text-white overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(32,52,159,0.3)]"
                        >
                            {/* Animated Background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-accent to-accent-light z-0" />
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0" />

                            {/* Content */}
                            <div className="relative z-10 text-left h-full flex flex-col">
                                <div className="w-16 h-16 rounded-3xl bg-white/20 flex items-center justify-center mb-10 shrink-0 border border-white/30 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                    <User size={32} className="text-white drop-shadow-md" />
                                </div>
                                <h3 className="text-3xl font-black mb-3 tracking-tight">Portal</h3>
                                <p className="text-white/80 font-medium mb-8">Access your sovereign identity and private dashboards.</p>

                                <div className="mt-auto flex items-center justify-between">
                                    <span className="font-bold text-sm uppercase tracking-widest text-white/90">Claim Identity</span>
                                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-accent transition-colors duration-300">
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
                                    </div>
                                </div>
                            </div>
                        </Link>

                        {/* Secondary Action: Explorer */}
                        <Link
                            href="/profile"
                            onClick={handleClose}
                            className="group relative flex flex-col p-10 rounded-[40px] text-left transition-all duration-500 hover:-translate-y-2"
                        >
                            {/* Glass Background matching globals.css but slightly thicker for contrast against modal */}
                            <div className="absolute inset-0 rounded-[40px] bg-gradient-to-br from-white/40 to-white/10 backdrop-blur-xl border border-white/50 shadow-inner group-hover:border-white/80 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.05)] transition-all duration-500 z-0" />

                            {/* Content */}
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="w-16 h-16 rounded-3xl bg-black/5 flex items-center justify-center mb-10 shrink-0 border border-white/40 shadow-sm group-hover:scale-110 group-hover:bg-white transition-all duration-500">
                                    <Search size={32} className="text-accent drop-shadow-sm" />
                                </div>
                                <h3 className="text-3xl font-black mb-3 text-primary tracking-tight">Explorer</h3>
                                <p className="text-secondary/80 font-medium mb-8">Search the immutable ledger of anonymous verifications.</p>

                                <div className="mt-auto flex items-center justify-between">
                                    <span className="font-bold text-sm uppercase tracking-widest text-secondary group-hover:text-accent transition-colors duration-300">Search Ledger</span>
                                    <div className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center group-hover:border-accent group-hover:bg-accent group-hover:text-white transition-all duration-300">
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
