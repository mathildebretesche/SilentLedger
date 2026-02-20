import Link from "next/link";
import { Fingerprint, Github, Twitter, MessageSquare, ArrowRight } from "lucide-react";

export function Footer() {
    return (
        <footer className="relative z-10 w-full mt-24">
            {/* Top frosted border for depth */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="max-w-7xl mx-auto px-8 py-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">

                    {/* Brand Column (Span 4) */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        <Link href="/" className="flex items-center gap-3 text-current no-underline group w-fit">
                            <div className="w-10 h-10 glass-card rounded-xl flex items-center justify-center border border-white/40 group-hover:scale-105 transition-transform">
                                <Fingerprint size={22} className="text-accent" />
                            </div>
                            <span className="font-bold text-xl tracking-tighter">Silent Ledger</span>
                        </Link>
                        <p className="text-secondary/80 text-sm leading-relaxed max-w-sm">
                            Proof of Intelligence built on Ethereum Attestation Service (EAS).
                            Transform your Web2 reputation into verifiable, anonymous on-chain power via zkTLS.
                        </p>
                        <div className="flex gap-4 mt-2">
                            <a href="#" className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-secondary hover:text-accent hover:-translate-y-1 transition-all">
                                <Twitter size={18} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-secondary hover:text-accent hover:-translate-y-1 transition-all">
                                <Github size={18} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-secondary hover:text-accent hover:-translate-y-1 transition-all">
                                <MessageSquare size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Protocol Column (Span 3) */}
                    <div className="lg:col-span-3 lg:col-start-6 flex flex-col gap-6">
                        <h4 className="font-black text-xs uppercase tracking-[0.2em] text-primary">Protocol</h4>
                        <div className="flex flex-col gap-4">
                            <Link href="/dashboard" className="text-sm font-medium text-secondary/80 hover:text-accent transition-colors flex items-center gap-2 group">
                                Portal <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                            </Link>
                            <Link href="/profile" className="text-sm font-medium text-secondary/80 hover:text-accent transition-colors flex items-center gap-2 group">
                                Explorer <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                            </Link>
                            <a href="#" className="text-sm font-medium text-secondary/80 hover:text-accent transition-colors flex items-center gap-2 group">
                                Smart Contracts <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                            </a>
                        </div>
                    </div>

                    {/* Developers Column (Span 2) */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <h4 className="font-black text-xs uppercase tracking-[0.2em] text-primary">Developers</h4>
                        <div className="flex flex-col gap-4">
                            <a href="#" className="text-sm font-medium text-secondary/80 hover:text-accent transition-colors">Documentation</a>
                            <a href="#" className="text-sm font-medium text-secondary/80 hover:text-accent transition-colors">GitHub Repo</a>
                            <a href="#" className="text-sm font-medium text-secondary/80 hover:text-accent transition-colors">Bug Bounty</a>
                        </div>
                    </div>

                    {/* Resources Column (Span 2) */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <h4 className="font-black text-xs uppercase tracking-[0.2em] text-primary">Resources</h4>
                        <div className="flex flex-col gap-4">
                            <Link href="/security" className="text-sm font-medium text-secondary/80 hover:text-accent transition-colors">Security</Link>
                            <Link href="/privacy" className="text-sm font-medium text-secondary/80 hover:text-accent transition-colors">Privacy</Link>
                            <a href="#" className="text-sm font-medium text-secondary/80 hover:text-accent transition-colors">Brand Assets</a>
                        </div>
                    </div>

                </div>

                {/* Bottom Bar */}
                <div className="mt-20 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-xs font-semibold tracking-wide text-secondary/60">
                        &copy; {new Date().getFullYear()} Silent Ledger. All rights reserved.
                    </p>
                    <div className="flex items-center gap-3 px-4 py-2 rounded-full glass-card border-none shadow-none bg-white/5">
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
                        <span className="text-[11px] font-black uppercase tracking-wider text-secondary">Operational - Sepolia</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
