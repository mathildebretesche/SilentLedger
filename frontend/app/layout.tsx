import type { Metadata } from "next";
import dynamic from "next/dynamic";
import "./globals.css";

const Web3Provider = dynamic(
  () => import("@/providers/Web3Provider").then((mod) => mod.Web3Provider),
  { ssr: false }
);

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
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
