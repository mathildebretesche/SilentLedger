"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fingerprint } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { LaunchOverlay } from "@/components/LaunchOverlay";

export function Header({ maxWidthClass = "max-w-7xl" }: { maxWidthClass?: string }) {
    const pathname = usePathname();
    const [showOverlay, setShowOverlay] = useState(false);

    const handleOpen = () => setShowOverlay(true);
    const handleClose = () => setShowOverlay(false);

    const isAppPage = pathname === "/dashboard" || pathname === "/profile";
    const isSecurityOrPrivacy = pathname === "/security" || pathname === "/privacy";

    return (
        <>
            <header className={`relative z-50 flex items-center justify-between px-8 py-8 mx-auto w-full ${maxWidthClass}`}>
                {/* Left: Logo */}
                <Link href="/" className="flex items-center gap-3 text-current no-underline group">
                    {isAppPage ? (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-light flex items-center justify-center border border-white/20 shadow-sm group-hover:scale-105 transition-transform">
                            <Fingerprint size={16} className="text-white" />
                        </div>
                    ) : isSecurityOrPrivacy ? (
                        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Fingerprint size={16} className="text-white" />
                        </div>
                    ) : (
                        <div className="w-10 h-10 glass-card rounded-xl flex items-center justify-center border border-white/40 group-hover:scale-105 transition-transform">
                            <Fingerprint size={22} className="text-accent" />
                        </div>
                    )}
                    <span className="font-bold text-lg tracking-tighter">Silent Ledger</span>
                </Link>

                {/* Right: Nav & Actions */}
                <div className="flex items-center gap-6">
                    {!isAppPage && (
                        <div className="hidden md:flex items-center gap-8">
                            <Link href="/security" className="text-[11px] font-black uppercase tracking-widest text-secondary hover:text-accent transition-colors">Security</Link>
                            <Link href="/privacy" className="text-[11px] font-black uppercase tracking-widest text-secondary hover:text-accent transition-colors">Privacy</Link>
                        </div>
                    )}

                    {isAppPage && (
                        <div className="hidden md:flex items-center gap-6 mr-2">
                            {pathname !== "/profile" && (
                                <Link href="/profile" className="text-[11px] font-black uppercase tracking-widest text-secondary hover:text-accent transition-colors">
                                    Explorer
                                </Link>
                            )}
                            {pathname !== "/dashboard" && (
                                <Link href="/dashboard" className="text-[11px] font-black uppercase tracking-widest text-secondary hover:text-accent transition-colors">
                                    Portal
                                </Link>
                            )}
                        </div>
                    )}

                    {isAppPage ? (
                        <ConnectButton accountStatus="avatar" chainStatus="icon" showBalance={false} />
                    ) : (
                        <button
                            onClick={handleOpen}
                            className="px-6 py-2.5 bg-accent text-white text-sm font-bold rounded-full hover:bg-accent-light transition-all active:scale-95 shadow-lg shadow-accent/20 ml-4"
                        >
                            Launch App
                        </button>
                    )}
                </div>
            </header>

            <LaunchOverlay isOpen={showOverlay} onClose={handleClose} />
        </>
    );
}
