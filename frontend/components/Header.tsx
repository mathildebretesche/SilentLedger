"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { LaunchOverlay } from "@/components/LaunchOverlay";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Menu, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n/LanguageContext";

export function Header({ maxWidthClass = "max-w-7xl" }: { maxWidthClass?: string }) {
    const pathname = usePathname();
    const [showOverlay, setShowOverlay] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { t } = useTranslation();

    const handleOpen = () => setShowOverlay(true);
    const handleClose = () => setShowOverlay(false);

    const isAppPage = pathname === "/dashboard" || pathname === "/profile";

    const navLinks: { href: string; label: string; show?: boolean }[] = isAppPage ? [
        { href: "/profile", label: t.header.explorer, show: pathname !== "/profile" },
        { href: "/dashboard", label: t.header.portal, show: pathname !== "/dashboard" },
    ] : [
        { href: "/security", label: t.header.security },
        { href: "/privacy", label: t.header.privacy },
    ];

    return (
        <>
            <header className={`relative z-50 flex items-center justify-between px-4 sm:px-6 py-4 mx-auto w-full ${maxWidthClass}`}>
                {/* Left: Logo */}
                <Link href="/" className="flex items-center gap-2 sm:gap-3 text-current no-underline group">
                    {isAppPage ? (
                        <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/20 shadow-sm group-hover:scale-105 transition-transform shrink-0">
                            <Image
                                src="/logo.png"
                                alt="Silent Ledger"
                                width={32}
                                height={32}
                                className="object-contain"
                            />
                        </div>
                    ) : (
                        <div className="relative w-10 h-10 glass-card rounded-xl overflow-hidden border border-white/40 group-hover:scale-105 transition-transform shrink-0">
                            <Image
                                src="/logo.png"
                                alt="Silent Ledger"
                                width={40}
                                height={40}
                                className="object-contain"
                            />
                        </div>
                    )}
                    <span className="font-bold text-base sm:text-lg tracking-tighter text-accent">Silent Ledger</span>
                </Link>

                {/* Desktop Nav & Actions */}
                <div className="hidden md:flex items-center gap-4 lg:gap-6">
                    <nav className="flex items-center gap-6 lg:gap-8">
                        {navLinks.filter(link => link.show !== false).map((link, i) => (
                            <Link
                                key={i}
                                href={link.href}
                                className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-secondary hover:text-accent transition-colors"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    <LanguageSwitcher />

                    {isAppPage ? (
                        <ConnectButton accountStatus="avatar" chainStatus="icon" showBalance={false} />
                    ) : (
                        <button
                            onClick={handleOpen}
                            className="px-4 sm:px-6 py-2 bg-accent text-white text-xs sm:text-sm font-bold rounded-full hover:bg-accent-light transition-all active:scale-95 shadow-lg shadow-accent/20"
                        >
                            {t.header.launchApp}
                        </button>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden flex items-center justify-center w-10 h-10 glass-card rounded-xl"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    {mobileMenuOpen ? (
                        <X size={20} className="text-primary" />
                    ) : (
                        <Menu size={20} className="text-primary" />
                    )}
                </button>
            </header>

            {/* Mobile Menu Full-Screen Overlay */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-40">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-xl transition-opacity"
                        onClick={() => setMobileMenuOpen(false)}
                    />

                    {/* Menu Content */}
                    <div className="relative z-10 flex flex-col items-center justify-center min-h-screen w-full px-6 py-12">
                        {/* Close button - top right */}
                        <button
                            onClick={() => setMobileMenuOpen(false)}
                            className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center rounded-full glass-card border border-white/20 hover:bg-white/10 transition-colors"
                            aria-label="Close menu"
                        >
                            <X size={24} className="text-primary" />
                        </button>

                        {/* Navigation Links */}
                        <nav className="flex flex-col items-center gap-4 w-full max-w-sm">
                            {navLinks.filter(link => link.show !== false).map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="w-full py-4 px-6 rounded-2xl text-lg font-bold text-secondary hover:bg-white/10 hover:text-accent transition-all text-center min-h-[44px] flex items-center justify-center"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>

                        {/* Divider */}
                        <div className="w-full max-w-sm h-px bg-white/20 my-8" />

                        {/* Actions */}
                        <div className="flex flex-col items-center gap-6 w-full max-w-sm">
                            {/* Language Switcher */}
                            <div className="flex flex-col items-center gap-2">
                                <LanguageSwitcher />
                                <span className="text-xs text-secondary">Language</span>
                            </div>

                            {/* Launch App Button */}
                            {!isAppPage && (
                                <button
                                    onClick={() => { setMobileMenuOpen(false); handleOpen(); }}
                                    className="w-full py-4 px-8 bg-accent text-white text-base font-bold rounded-full hover:bg-accent-light transition-all active:scale-95 shadow-lg shadow-accent/20 flex items-center justify-center gap-2 min-h-[44px]"
                                >
                                    {t.header.launchApp}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <LaunchOverlay isOpen={showOverlay} onClose={handleClose} />
        </>
    );
}
