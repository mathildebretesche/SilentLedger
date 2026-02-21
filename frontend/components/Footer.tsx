"use client";

import Link from "next/link";
import Image from "next/image";
import { Github, Twitter, MessageSquare, ArrowRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n/LanguageContext";

export function Footer() {
    const { t } = useTranslation();
    return (
        <footer className="relative z-10 w-full mt-16 sm:mt-24">
            {/* Top frosted border for depth */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12 sm:py-16 md:py-20">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-10 md:gap-12 lg:gap-8">

                    {/* Brand Column */}
                    <div className="sm:col-span-2 lg:col-span-4 flex flex-col gap-4 sm:gap-6">
                        <Link href="/" className="flex items-center gap-2 sm:gap-3 text-current no-underline group w-fit">
                            <div className="relative w-8 h-8 sm:w-10 sm:h-10 glass-card rounded-lg sm:rounded-xl overflow-hidden border border-white/40 group-hover:scale-105 transition-transform">
                                <Image
                                    src="/logo.png"
                                    alt="Silent Ledger"
                                    width={40}
                                    height={40}
                                    className="object-contain"
                                />
                            </div>
                            <span className="font-bold text-lg sm:text-xl tracking-tighter">Silent Ledger</span>
                        </Link>
                        <p className="text-secondary/80 text-xs sm:text-sm leading-relaxed max-w-xs sm:max-w-sm">
                            {t.footer.tagline}
                        </p>
                        <div className="flex gap-3 sm:gap-4 mt-1">
                            <a href="#" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full glass-card flex items-center justify-center text-secondary hover:text-accent hover:-translate-y-1 transition-all">
                                <Twitter size={16} className="sm:size-5" />
                            </a>
                            <a href="#" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full glass-card flex items-center justify-center text-secondary hover:text-accent hover:-translate-y-1 transition-all">
                                <Github size={16} className="sm:size-5" />
                            </a>
                            <a href="#" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full glass-card flex items-center justify-center text-secondary hover:text-accent hover:-translate-y-1 transition-all">
                                <MessageSquare size={16} className="sm:size-5" />
                            </a>
                        </div>
                    </div>

                    {/* Protocol Column */}
                    <div className="sm:col-span-2 lg:col-span-3 lg:col-start-7 flex flex-col gap-4 sm:gap-6">
                        <h4 className="font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] text-primary">{t.footer.protocol}</h4>
                        <div className="flex flex-col gap-3 sm:gap-4">
                            <Link href="/dashboard" className="text-xs sm:text-sm font-medium text-secondary/80 hover:text-accent transition-colors flex items-center gap-2 group">
                                {t.header.portal} <ArrowRight size={12} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                            </Link>
                            <Link href="/profile" className="text-xs sm:text-sm font-medium text-secondary/80 hover:text-accent transition-colors flex items-center gap-2 group">
                                {t.header.explorer} <ArrowRight size={12} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                            </Link>
                            <Link href="/contracts" className="text-xs sm:text-sm font-medium text-secondary/80 hover:text-accent transition-colors flex items-center gap-2 group">
                                {t.footer.smartContracts} <ArrowRight size={12} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                            </Link>
                        </div>
                    </div>

                    {/* Developers Column */}
                    <div className="sm:col-span-1 lg:col-span-2 flex flex-col gap-4 sm:gap-6">
                        <h4 className="font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] text-primary">{t.footer.developers}</h4>
                        <div className="flex flex-col gap-3 sm:gap-4">
                            <a href="#" className="text-xs sm:text-sm font-medium text-secondary/80 hover:text-accent transition-colors">{t.footer.documentation}</a>
                            <a href="#" className="text-xs sm:text-sm font-medium text-secondary/80 hover:text-accent transition-colors">{t.footer.githubRepo}</a>
                        </div>
                    </div>

                    {/* Resources Column */}
                    <div className="sm:col-span-1 lg:col-span-2 flex flex-col gap-4 sm:gap-6">
                        <h4 className="font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] text-primary">{t.footer.resources}</h4>
                        <div className="flex flex-col gap-3 sm:gap-4">
                            <Link href="/security" className="text-xs sm:text-sm font-medium text-secondary/80 hover:text-accent transition-colors">{t.footer.security}</Link>
                            <Link href="/privacy" className="text-xs sm:text-sm font-medium text-secondary/80 hover:text-accent transition-colors">{t.footer.privacy}</Link>
                        </div>
                    </div>

                </div>

                {/* Bottom Bar */}
                <div className="mt-12 sm:mt-16 md:mt-20 pt-4 sm:pt-6 md:pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
                    <p className="text-[10px] sm:text-xs font-semibold tracking-wide text-secondary/60 text-center md:text-left">
                        &copy; {new Date().getFullYear()} Silent Ledger. {t.footer.rights}
                    </p>
                    <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full glass-card border-none shadow-none bg-white/5">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)] animate-pulse" />
                        <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-secondary">{t.footer.operational}</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
