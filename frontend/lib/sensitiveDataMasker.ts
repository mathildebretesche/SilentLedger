/**
 * sensitiveDataMasker.ts – Silent Ledger
 *
 * Masquage des données sensibles AVANT la génération de la preuve ZK.
 *
 * Pourquoi ce fichier existe :
 *   Le SDK Reclaim génère une preuve zkTLS à partir d'une requête HTTPS réelle.
 *   Cette requête peut contenir des en-têtes sensibles (Authorization, Cookie,
 *   tokens de session, mots de passe Basic Auth...).
 *   Ces données ne doivent JAMAIS apparaître :
 *     - dans les logs client/serveur
 *     - dans le champ `parameters` sérialisé du ClaimInfo
 *     - dans le contexte JSON inclus dans la preuve
 *
 *   Ce module fournit :
 *     1. `sanitizeHeaders()`    – épure les en-têtes HTTP avant le ProofRequest
 *     2. `sanitizeProofContext()` – vérifie que la preuve finale ne contient
 *                                   aucune valeur sensible
 *     3. `redactSensitiveString()` – util générique de rédaction par regex
 */

// ─── Configuration ────────────────────────────────────────────────────────────

/**
 * En-têtes HTTP systématiquement supprimés avant un ProofRequest.
 * Le SDK Reclaim n'en a pas besoin pour les providers publics (GitHub public API).
 */
const BLOCKED_HEADERS: ReadonlySet<string> = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-auth-token",
  "x-session-token",
  "x-api-key",
  "proxy-authorization",
  "www-authenticate",
  "x-csrf-token",
  "x-access-token",
  "x-refresh-token",
]);

/**
 * Patterns regex détectant des valeurs sensibles potentielles dans une string.
 * Chaque entrée définit un label (pour les logs) et le pattern à chercher.
 */
const SENSITIVE_PATTERNS: ReadonlyArray<{ label: string; pattern: RegExp }> = [
  // JWT  (3 segments base64url séparés par des points)
  {
    label: "JWT",
    pattern: /\beyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\b/g,
  },
  // Bearer token
  {
    label: "Bearer token",
    pattern: /\bBearer\s+[A-Za-z0-9\-_\.~\+\/]+=*\b/gi,
  },
  // Basic Auth encodé en base64 (Authorization: Basic <base64>)
  {
    label: "Basic Auth",
    pattern: /\bBasic\s+[A-Za-z0-9+\/]+=*\b/gi,
  },
  // Clé API générique (ghp_, ghs_, glpat-, sk-, pk-)
  {
    label: "API key",
    pattern:
      /\b(?:ghp|ghs|github_pat|glpat|sk|pk)_[A-Za-z0-9_\-]{10,}\b/g,
  },
  // Chaîne password= ou pwd= dans une URL ou JSON
  {
    label: "Password param",
    pattern: /(?:password|passwd|pwd|secret)=["']?[^\s&"',}]{4,}["']?/gi,
  },
  // Session ID de type express-session / connect.sid
  {
    label: "Session ID",
    pattern: /s%3A[A-Za-z0-9\-_]{20,}\.[A-Za-z0-9+/]+=*/g,
  },
  // UUID v4 dans un contexte token (nom de clé "token", "session", "secret")
  {
    label: "UUID token",
    pattern:
      /(?:token|session|secret|key)['":\s]+[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi,
  },
];

/** Valeur de remplacement substituée à toute donnée sensible détectée. */
const REDACTED = "[REDACTED]";

// ─── Types publics ────────────────────────────────────────────────────────────

/** En-têtes HTTP sous forme clé→valeur (insensible à la casse des clés). */
export type HttpHeaders = Record<string, string>;

/**
 * Résultat du nettoyage des en-têtes.
 * `sanitized`  : objet prêt à être transmis au SDK Reclaim.
 * `removed`    : liste des noms d'en-têtes supprimés (pour audit/log).
 */
export interface SanitizedHeaders {
  sanitized: HttpHeaders;
  removed: string[];
}

/**
 * Résultat de la vérification du contexte d'une preuve ZK.
 * `safe`     : true si aucune donnée sensible n'a été détectée.
 * `findings` : liste des patterns détectés (vide si safe=true).
 */
export interface ProofContextAudit {
  safe: boolean;
  findings: Array<{ label: string; location: string }>;
}

// ─── 1. Nettoyage des en-têtes HTTP ──────────────────────────────────────────

/**
 * Épure un objet d'en-têtes HTTP en supprimant toutes les clés sensibles
 * (voir `BLOCKED_HEADERS`) et en neutralisant par regex les valeurs
 * qui contiendraient encore un pattern sensible.
 *
 * À appeler juste avant `ReclaimProofRequest.init()` ou tout appel réseau
 * passant des en-têtes au SDK.
 *
 * @example
 * const { sanitized } = sanitizeHeaders({
 *   Authorization: "Bearer ghp_XXXXXX",
 *   Accept: "application/json",
 * });
 * // sanitized → { Accept: "application/json" }
 */
export function sanitizeHeaders(headers: HttpHeaders): SanitizedHeaders {
  const sanitized: HttpHeaders = {};
  const removed: string[] = [];

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();

    if (BLOCKED_HEADERS.has(lowerKey)) {
      removed.push(key);
      continue;
    }

    // Valeur non bloquée par le nom mais contenant un pattern sensible
    const cleanedValue = redactSensitiveString(value);
    if (cleanedValue !== value) {
      removed.push(`${key} (value redacted)`);
    }

    sanitized[key] = cleanedValue;
  }

  return { sanitized, removed };
}

// ─── 2. Vérification du contexte de la preuve ZK ──────────────────────────────

/**
 * Audit le contexte JSON d'une preuve ZK avant qu'elle ne soit soumise
 * on-chain ou envoyée au callback.
 *
 * Inspecte les champs `claimInfo.context`, `claimInfo.parameters` et
 * `signedClaim` sous forme de string JSON.
 *
 * @param proofRaw  Objet preuve brut retourné par le SDK Reclaim.
 * @returns         `{ safe: true }` si propre, sinon la liste des fuites.
 *
 * @throws {SensitiveDataLeakError} si `throwOnLeak` est true et qu'une fuite
 *         est détectée (comportement par défaut en production).
 */
export function sanitizeProofContext(
  proofRaw: unknown,
  options: { throwOnLeak?: boolean } = { throwOnLeak: true }
): ProofContextAudit {
  const serialized = safeSerialize(proofRaw);
  const findings: Array<{ label: string; location: string }> = [];

  for (const { label, pattern } of SENSITIVE_PATTERNS) {
    // reset lastIndex pour les regex globales
    pattern.lastIndex = 0;
    if (pattern.test(serialized)) {
      findings.push({ label, location: "proof serialized payload" });
    }
    pattern.lastIndex = 0;
  }

  const audit: ProofContextAudit = {
    safe: findings.length === 0,
    findings,
  };

  if (!audit.safe && options.throwOnLeak) {
    throw new SensitiveDataLeakError(findings);
  }

  return audit;
}

// ─── 3. Rédaction générique d'une chaîne ─────────────────────────────────────

/**
 * Remplace tous les patterns sensibles connus dans `input` par `[REDACTED]`.
 * Utile pour nettoyer n'importe quelle chaîne (URL, body, log…) avant
 * de la passer à Reclaim ou de l'afficher côté client.
 *
 * @example
 * redactSensitiveString("token=ghp_XXXXX&page=1")
 * // → "[REDACTED]&page=1"
 */
export function redactSensitiveString(input: string): string {
  let result = input;
  for (const { pattern } of SENSITIVE_PATTERNS) {
    pattern.lastIndex = 0;
    result = result.replace(pattern, REDACTED);
    pattern.lastIndex = 0;
  }
  return result;
}

// ─── 4. Nettoyage d'un contexte Reclaim avant ajout à la preuve ───────────────

/**
 * Nettoie le dictionnaire `extractedParameters` retourné par le SDK Reclaim
 * en s'assurant qu'aucune valeur sensible n'a été capturée par accident
 * dans les paramètres extraits de la réponse HTTP.
 *
 * @param params  Objet `extractedParameters` brut.
 * @returns       Copie nettoyée avec les valeurs sensibles rédigées.
 */
export function sanitizeExtractedParams(
  params: Record<string, string>
): Record<string, string> {
  const clean: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    clean[key] = redactSensitiveString(value);
  }
  return clean;
}

// ─── Erreur dédiée ────────────────────────────────────────────────────────────

/**
 * Erreur levée quand une fuite de données sensibles est détectée dans
 * le payload d'une preuve ZK.
 */
export class SensitiveDataLeakError extends Error {
  constructor(
    public readonly findings: Array<{ label: string; location: string }>
  ) {
    const labels = findings.map((f) => f.label).join(", ");
    super(
      `[SilentLedger] Sensitive data detected in ZK proof payload: ${labels}. ` +
        `Proof submission aborted.`
    );
    this.name = "SensitiveDataLeakError";
  }
}

// ─── Helpers internes ─────────────────────────────────────────────────────────

/** Serialise un objet quelconque en string JSON de manière sécurisée. */
function safeSerialize(value: unknown): string {
  try {
    return JSON.stringify(value) ?? "";
  } catch {
    return String(value);
  }
}
