"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { LaunchOverlay } from "@/components/LaunchOverlay";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "@/lib/i18n/LanguageContext";

export function Header({ maxWidthClass = "max-w-7xl" }: { maxWidthClass?: string }) {
    const pathname = usePathname();
    const [showOverlay, setShowOverlay] = useState(false);
    const { t } = useTranslation();

    const handleOpen = () => setShowOverlay(true);
    const handleClose = () => setShowOverlay(false);

    const isAppPage = pathname === "/dashboard" || pathname === "/profile";

    return (
        <>
            <header className={`relative z-50 flex items-center justify-between px-8 py-8 mx-auto w-full ${maxWidthClass}`}>
                {/* Left: Logo */}
                <Link href="/" className="flex items-center gap-3 text-current no-underline group">
                    {isAppPage ? (
                        <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/20 shadow-sm group-hover:scale-105 transition-transform">
                            <Image
                                src="/logo.png"
                                alt="Silent Ledger"
                                width={32}
                                height={32}
                                className="object-contain"
                            />
                        </div>
                    ) : (
                        <div className="relative w-10 h-10 glass-card rounded-xl overflow-hidden border border-white/40 group-hover:scale-105 transition-transform">
                            <Image
                                src="/logo.png"
                                alt="Silent Ledger"
                                width={40}
                                height={40}
                                className="object-contain"
                            />
                        </div>
                    )}
                    <span className="font-bold text-lg tracking-tighter text-accent">Silent Ledger</span>
                </Link>

                {/* Right: Nav & Actions */}
                <div className="flex items-center gap-4">
                    {!isAppPage && (
                        <div className="hidden md:flex items-center gap-8">
                            <Link href="/security" className="text-[11px] font-black uppercase tracking-widest text-secondary hover:text-accent transition-colors">{t.header.security}</Link>
                            <Link href="/privacy" className="text-[11px] font-black uppercase tracking-widest text-secondary hover:text-accent transition-colors">{t.header.privacy}</Link>
                        </div>
                    )}

                    {isAppPage && (
                        <div className="hidden md:flex items-center gap-6 mr-2">
                            {pathname !== "/profile" && (
                                <Link href="/profile" className="text-[11px] font-black uppercase tracking-widest text-secondary hover:text-accent transition-colors">
                                    {t.header.explorer}
                                </Link>
                            )}
                            {pathname !== "/dashboard" && (
                                <Link href="/dashboard" className="text-[11px] font-black uppercase tracking-widest text-secondary hover:text-accent transition-colors">
                                    {t.header.portal}
                                </Link>
                            )}
                        </div>
                    )}

                    <LanguageSwitcher />

                    {isAppPage ? (
                        <ConnectButton accountStatus="avatar" chainStatus="icon" showBalance={false} />
                    ) : (
                        <button
                            onClick={handleOpen}
                            className="px-6 py-2.5 bg-accent text-white text-sm font-bold rounded-full hover:bg-accent-light transition-all active:scale-95 shadow-lg shadow-accent/20 ml-2"
                        >
                            {t.header.launchApp}
                        </button>
                    )}
                </div>
            </header>

            <LaunchOverlay isOpen={showOverlay} onClose={handleClose} />
        </>
    );
}
