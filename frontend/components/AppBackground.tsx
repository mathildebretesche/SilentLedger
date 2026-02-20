"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Background3D } from "./Background3D";

export function AppBackground() {
    const pathname = usePathname();
    const [scrollY, setScrollY] = useState(0);

    // Track scroll for parallax effects
    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Only show the 3D background on the landing page
    const isHomePage = pathname === "/";

    return (
        <div
            className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-700 ease-in-out"
            style={{
                opacity: isHomePage ? 1 : 0,
                // Keep it mounted but hidden to preserve WebGL context
                visibility: isHomePage ? "visible" : "hidden",
            }}
        >
            <Background3D scrollY={scrollY} />
        </div>
    );
}
