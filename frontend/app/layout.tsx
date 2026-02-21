import type { Metadata } from "next";
import "./globals.css";

import { Web3Provider } from "@/providers/Web3Provider";
import { AppBackground } from "@/components/AppBackground";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";

export const metadata: Metadata = {
  title: "Silent Ledger – Proof of Intelligence",
  description:
    "Transformez vos contributions Web2 en attestations on-chain anonymes via zkTLS. Proof of Knowledge, not Proof of Stake.",
  keywords: ["zkTLS", "EAS", "Web3", "ZK Proof", "GitHub", "Attestation"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="icon" href="/logo.png" sizes="32x32" type="image/png" />
      </head>
      <body>
        <LanguageProvider>
          <Web3Provider>
            <AppBackground />
            {children}
          </Web3Provider>
        </LanguageProvider>
      </body>
    </html>
  );
}
