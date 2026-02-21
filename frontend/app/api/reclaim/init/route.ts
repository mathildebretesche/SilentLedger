/**
 * POST /api/reclaim/init
 * ─────────────────────────────────────────────────────────────────────────────
 * Route serveur qui crée et signe un ProofRequest Reclaim avec l'APP_SECRET.
 * Le SDK v4.x exige que la signature soit générée server-side ; le client
 * reconstruit ensuite la session via ReclaimProofRequest.fromJsonString().
 *
 * Body JSON : { providerId: string, context: string }
 * Réponse   : { requestConfig: string }  (JSON sérialisé signé)
 */

import { NextRequest, NextResponse } from "next/server";
import { ReclaimProofRequest } from "@reclaimprotocol/js-sdk";

// Ces variables ne sont PAS préfixées NEXT_PUBLIC_ → jamais exposées au client.
const APP_ID     = process.env.RECLAIM_APP_ID     ?? process.env.NEXT_PUBLIC_RECLAIM_APP_ID     ?? "";
// Le SDK Reclaim n'attend PAS le préfixe 0x sur le secret.
const APP_SECRET = (process.env.RECLAIM_APP_SECRET ?? process.env.NEXT_PUBLIC_RECLAIM_APP_SECRET ?? "")
  .replace(/^0x/i, "");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { providerId?: string; walletAddress?: string };
    const { providerId, walletAddress } = body;

    if (!providerId) {
      return NextResponse.json({ error: "Missing providerId" }, { status: 400 });
    }

    if (!APP_ID || !APP_SECRET) {
      return NextResponse.json(
        { error: "Reclaim credentials not configured on server" },
        { status: 500 }
      );
    }

    // ── Création & signature server-side ────────────────────────────────────
    const proofRequest = await ReclaimProofRequest.init(
      APP_ID,
      APP_SECRET,
      providerId,
      { acceptAiProviders: true }   // accepte les preuves AI Witness (fallback MPC)
    );

    // Lie la preuve au wallet de l'utilisateur
    if (walletAddress) {
      proofRequest.setContext(walletAddress, "Silent Ledger verification");
    }

    // Sérialise la config signée pour être envoyée au client
    const requestConfig = proofRequest.toJsonString();

    return NextResponse.json({ requestConfig });
  } catch (err) {
    console.error("[reclaim/init]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
