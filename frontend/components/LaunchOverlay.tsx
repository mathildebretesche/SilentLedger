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
            <div
                onClick={handleClose}
                className="fixed inset-0 bg-white/40 backdrop-blur-2xl z-[100] transition-opacity duration-300"
                style={{ opacity: visible ? 1 : 0 }}
            />

            <div className="fixed inset-0 z-[101] flex items-center justify-center p-6 pointer-events-none">
                <div
                    className="glass-card w-full max-w-2xl p-16 shadow-[0_40px_100px_rgba(0,0,0,0.1)] pointer-events-auto transition-all duration-300"
                    style={{
                        opacity: visible ? 1 : 0,
                        transform: visible ? "scale(1) translateY(0px)" : "scale(0.96) translateY(12px)",
                    }}
                >
                    <div className="flex items-center justify-between mb-16">
                        <div>
                            <h2 className="text-5xl font-black tracking-tighter mb-2 text-primary">ACCESS.</h2>
                            <p className="text-secondary font-medium">Select your point of entry.</p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="w-14 h-14 rounded-full bg-white/20 border border-white/40 flex items-center justify-center hover:bg-white hover:text-black transition-all"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Link
                            href="/dashboard"
                            onClick={handleClose}
                            className="group flex flex-col p-10 rounded-[40px] bg-accent/90 backdrop-blur-md text-white border border-white/20 hover:bg-accent transition-all text-left shadow-lg shadow-accent/20"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-8 shrink-0">
                                <User size={28} />
                            </div>
                            <h3 className="text-2xl font-black mb-2">Portal</h3>
                            <div className="mt-auto flex items-center gap-2 font-bold text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
                                Claim Identity <ArrowRight size={14} />
                            </div>
                        </Link>

                        <Link
                            href="/profile"
                            onClick={handleClose}
                            className="group flex flex-col p-10 rounded-[40px] glass-card hover:border-white/80 transition-all text-left"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-black/5 flex items-center justify-center mb-8 shrink-0">
                                <Search size={28} className="text-accent" />
                            </div>
                            <h3 className="text-2xl font-black mb-2 text-primary">Explorer</h3>
                            <div className="mt-auto flex items-center gap-2 font-bold text-xs uppercase tracking-widest text-secondary group-hover:gap-4 transition-all">
                                Search Ledger <ArrowRight size={14} />
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
