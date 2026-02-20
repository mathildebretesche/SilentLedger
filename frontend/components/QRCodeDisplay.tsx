"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { ExternalLink, Loader2, Copy, Check } from "lucide-react";

interface QRCodeDisplayProps {
  url: string;
  /** Affiche un indicateur d'attente sous le QR code */
  waiting?: boolean;
}

export function QRCodeDisplay({ url, waiting = true }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !url) return;
    QRCode.toCanvas(canvasRef.current, url, {
      width: 200,
      margin: 2,
      color: { dark: "#1a1a2e", light: "#ffffff" },
    });
  }, [url]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silently fail
    }
  };

  return (
    <div
      className="flex flex-col items-center gap-4 rounded-xl p-5"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
      }}
    >
      <p
        className="text-center text-sm"
        style={{ color: "var(--text-secondary)" }}
      >
        Scannez ce QR code avec votre téléphone pour générer la preuve zkTLS
      </p>

      {/* QR code canvas */}
      <div
        className="rounded-xl overflow-hidden shadow-md"
        style={{ border: "4px solid white", lineHeight: 0 }}
      >
        <canvas ref={canvasRef} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 w-full">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-colors"
          style={{
            background: "var(--accent)",
            color: "white",
            textDecoration: "none",
          }}
        >
          <ExternalLink size={12} />
          Ouvrir le lien
        </a>
        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-1.5 rounded-lg py-2 px-3 text-xs font-semibold transition-colors"
          style={{
            background: copied
              ? "rgba(34,197,94,0.12)"
              : "var(--bg-base, rgba(255,255,255,0.1))",
            border: `1px solid ${copied ? "rgba(34,197,94,0.3)" : "var(--border)"}`,
            color: copied ? "#22c55e" : "var(--text-secondary)",
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copié !" : "Copier"}
        </button>
      </div>

      {waiting && (
        <p
          className="text-xs flex items-center gap-1.5"
          style={{ color: "var(--text-muted)" }}
        >
          <Loader2 size={11} className="animate-spin" />
          En attente de la preuve ZK…
        </p>
      )}
    </div>
  );
}
