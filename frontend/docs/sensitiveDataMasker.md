# sensitiveDataMasker – Guide d'utilisation

> **Fichier source :** `frontend/lib/sensitiveDataMasker.ts`

Ce module protège le pipeline de génération de preuves ZK en s'assurant
qu'aucune donnée sensible (token, mot de passe, session…) ne transite dans
le payload Reclaim ni n'est soumise on-chain.

---

## Pourquoi ce module est nécessaire

Le SDK Reclaim génère une preuve zkTLS en interceptant une vraie requête HTTPS.
Cette requête peut embarquer des en-têtes privés (`Authorization`, `Cookie`…)
ou des valeurs extraites contenant accidentellement un secret.

Ces données **ne doivent jamais apparaître** :
- dans les logs navigateur / serveur Next.js
- dans le champ `claimInfo.parameters` sérialisé de la preuve
- dans le champ `claimInfo.context` inclus dans la preuve soumise on-chain

Ce module intervient à **deux points critiques** dans `ReclaimService.ts` :
1. Avant l'initialisation du `ProofRequest` → nettoyage des en-têtes HTTP
2. Après réception de la preuve → audit du payload avant soumission on-chain

---

## API publique

### `sanitizeHeaders(headers)`

Épure un objet d'en-têtes HTTP. Toute clé appartenant à la liste bloquée est
supprimée. Les valeurs non bloquées par leur nom mais contenant un pattern
sensible sont rédigées à `[REDACTED]`.

```typescript
import { sanitizeHeaders } from "@/lib/sensitiveDataMasker";

const { sanitized, removed } = sanitizeHeaders({
  Authorization: "Bearer ghp_XXXXXX",
  Accept: "application/json",
  "X-Session-Token": "abc123",
});

// sanitized → { Accept: "application/json" }
// removed   → ["Authorization", "X-Session-Token"]
```

**En-têtes bloqués par défaut :**
`Authorization`, `Cookie`, `Set-Cookie`, `X-Auth-Token`, `X-Session-Token`,
`X-Api-Key`, `Proxy-Authorization`, `WWW-Authenticate`, `X-CSRF-Token`,
`X-Access-Token`, `X-Refresh-Token`.

---

### `sanitizeProofContext(proofRaw, options?)`

Audite la preuve brute retournée par le SDK Reclaim. Sérialise l'objet en JSON
et cherche tous les patterns sensibles connus.

```typescript
import {
  sanitizeProofContext,
  SensitiveDataLeakError,
} from "@/lib/sensitiveDataMasker";

// Mode par défaut : lève une erreur si une fuite est détectée
try {
  sanitizeProofContext(rawProof); // throwOnLeak: true par défaut
} catch (err) {
  if (err instanceof SensitiveDataLeakError) {
    console.error("Fuite bloquée :", err.findings);
    // [{ label: "JWT", location: "proof serialized payload" }]
  }
}

// Mode audit silencieux (pas d'exception)
const audit = sanitizeProofContext(rawProof, { throwOnLeak: false });
if (!audit.safe) {
  console.warn("Données suspectes détectées :", audit.findings);
}
```

**Retour `ProofContextAudit` :**

| Champ | Type | Description |
|-------|------|-------------|
| `safe` | `boolean` | `true` si aucun pattern sensible détecté |
| `findings` | `Array<{ label, location }>` | Liste des fuites (vide si safe) |

---

### `redactSensitiveString(input)`

Remplace tous les patterns sensibles d'une chaîne par `[REDACTED]`.
Pratique pour nettoyer une URL, un body de requête ou un message de log.

```typescript
import { redactSensitiveString } from "@/lib/sensitiveDataMasker";

redactSensitiveString("https://api.example.com?password=s3cr3t&page=1");
// → "https://api.example.com?[REDACTED]&page=1"

redactSensitiveString("Bearer ghp_ABCDEFGHIJ1234567890");
// → "[REDACTED]"

redactSensitiveString("Aucun secret ici.");
// → "Aucun secret ici."
```

---

### `sanitizeExtractedParams(params)`

Nettoie le dictionnaire `extractedParameters` retourné par Reclaim.
Toute valeur contenant un pattern sensible est rédigée.

```typescript
import { sanitizeExtractedParams } from "@/lib/sensitiveDataMasker";

const clean = sanitizeExtractedParams({
  contributions: "420",
  debug_token: "ghp_XXXXXXXXXX",
});
// → { contributions: "420", debug_token: "[REDACTED]" }
```

---

### `SensitiveDataLeakError`

Classe d'erreur levée par `sanitizeProofContext()` en cas de fuite détectée.

```typescript
import { SensitiveDataLeakError } from "@/lib/sensitiveDataMasker";

try {
  sanitizeProofContext(suspiciousProof);
} catch (err) {
  if (err instanceof SensitiveDataLeakError) {
    // err.message   → "[SilentLedger] Sensitive data detected in ZK proof payload: JWT, Bearer token. Proof submission aborted."
    // err.findings  → [{ label: "JWT", location: "proof serialized payload" }, ...]
  }
}
```

---

## Patterns détectés

| Label | Exemples détectés |
|-------|-------------------|
| `JWT` | `eyJhbGciOiJIUzI1NiJ9.eyJ...` |
| `Bearer token` | `Bearer ghp_XXXXX`, `Bearer eyJ...` |
| `Basic Auth` | `Basic dXNlcjpwYXNzd29yZA==` |
| `API key` | `ghp_XXXXX`, `ghs_XXXXX`, `sk_live_XXXXX`, `glpat-XXXXX` |
| `Password param` | `password=monMotDePasse`, `secret="abc123"` |
| `Session ID` | `s%3AxxxxxxxxxxxxxxxxxxxxxxX.XXXXX` (express-session) |
| `UUID token` | `"token": "a3f2e1b0-..."`, `"session": "..."` |

---

## Intégration dans ReclaimService

Le module est déjà intégré dans `frontend/services/ReclaimService.ts` :

```
flux Reclaim
    │
    ├─► initGitHubContributionsProof()
    │       │
    │       └─► [SDK] startSession()
    │                   │
    │                   └─► onSuccess(rawProof)
    │                             │
    │                             ├─► sanitizeProofContext()  ← lève SensitiveDataLeakError si fuite
    │                             ├─► sanitizeExtractedParams()  ← rédige les valeurs suspectes
    │                             └─► handleProofCallback()  → ZKProof propre
    │
    └─► catch SensitiveDataLeakError → onError() sans logger le payload
```

Pour étendre la protection à d'autres providers Reclaim, appeler les mêmes
fonctions dans les futurs handlers de callback.

---

## Étendre la liste des patterns

Pour ajouter un nouveau pattern, éditer le tableau `SENSITIVE_PATTERNS` dans
`frontend/lib/sensitiveDataMasker.ts` :

```typescript
{
  label: "Mon pattern custom",
  pattern: /mon_regex_ici/g,  // flag /g obligatoire
},
```

> **Important :** utiliser le flag `/g` sur chaque regex. Le module réinitialise
> `lastIndex` avant et après chaque test pour éviter les faux négatifs liés aux
> regex avec état en JavaScript.
