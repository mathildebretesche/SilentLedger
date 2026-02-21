# Documentation Frontend - SilentLedger

## 📋 Table des Matières

1. [Architecture](#architecture)
2. [Stack Technique](#stack-technique)
3. [Structure du Projet](#structure-du-projet)
4. [Pages & Routes](#pages--routes)
5. [Composants](#composants)
6. [Services](#services)
7. [State Management](#state-management)
8. [Internationalisation](#internationalisation)
9. [Styling & Design System](#styling--design-system)
10. [Intégration Web3](#intégration-web3)
11. [API Routes](#api-routes)
12. [Configuration](#configuration)
13. [Développement](#développement)
14. [Déploiement](#déploiement)

---

## Architecture

SilentLedger est construit avec **Next.js 14** en utilisant le **App Router** (dir `app/`). L'architecture suit une approche modulaire :

```
┌─────────────────────────────────────────────────────┐
│                    Pages (app/)                      │
│  • page.tsx (Landing)                               │
│  • dashboard/page.tsx (Main app)                    │
│  • onboarding/ (Setup flow)                         │
│  • profile/ (User profile)                          │
│  • privacy/ (Privacy policy)                        │
│  • security/ (Security info)                        │
└────────────────┬────────────────────────────────────┘
                 │ uses hooks from
┌────────────────▼────────────────────────────────────┐
│              hooks/ & services/                      │
│  • useAccount, useReadContract, useWriteContract    │
│  • ReclaimService, EASService                       │
└────────────────┬────────────────────────────────────┘
                 │ imports
┌────────────────▼────────────────────────────────────┐
│           Components (components/)                   │
│  • UI: Header, Footer, TrustWheel, Badges           │
│  • Layout: LaunchOverlay, AmbientBackground         │
└────────────────┬────────────────────────────────────┘
                 │ wrapped by
┌────────────────▼────────────────────────────────────┐
│            Providers (providers/)                    │
│  • Web3Provider (Wagmi config)                      │
│  • LanguageProvider (i18n context)                  │
│  • QueryProvider (React Query)                      │
└─────────────────────────────────────────────────────┘
```

---

## Stack Technique

### Core
- **Next.js 14.2** - Framework React avec App Router
- **React 18** - UI library
- **TypeScript 5** - Typage statique
- **ESLint** - Linting

### Styling
- **Tailwind CSS 3.4** - Utility-first CSS
- **shadcn/ui** - Components primitifs
- **CSS Custom Properties** - Thème et glassmorphism
- **Three.js** + **@react-three/fiber** - 3D animations
- **@react-three/drei** - Helpers Three.js

### Web3 & Blockchain
- **Wagmi 2.19** - Hooks Ethereum (React Query based)
- **Viem 2.46** - Typesafe Ethereum primitives
- **RainbowKit 2.2** - Wallet connect UI
- **@ethereum-attestation-service/eas-sdk** - EAS integration
- **@reclaimprotocol/js-sdk** - zkTLS proofs
- **snarkjs 0.7** - SNARK verification

### AI & Services
- **@google/generative-ai** - Gemini API
- **@tanstack/react-query** - Server state management

### Utilities
- **lucide-react** - Icon set
- **class-variance-authority** - Component variants
- **clsx** + **tailwind-merge** - Conditional classes
- **qrcode** (types) - QR generation

---

## Structure du Projet

```
frontend/
├── app/                    # Pages App Router
│   ├── (public)/          # Pages publiques (sans auth)
│   │   ├── page.tsx       # Landing page
│   │   ├── layout.tsx     # Layout racine public
│   │   └── onboarding/    # Flow d'onboarding
│   ├── (private)/         # Pages protégées (redirect si déconnecté)
│   │   ├── dashboard/     # Dashboard principal
│   │   ├── profile/       # Profil utilisateur
│   │   ├── security/      # Info sécurité
│   │   └── privacy/       # Politique confidentialité
│   ├── api/               # API Routes (serverless)
│   │   └── github-audit/  # Endpoint audit IA
│   ├── contracts/         # Pages contrats
│   ├── docs/              # Pages documentation
│   ├── fonts/             # Fonts locales
│   ├── globals.css        # Styles globaux + design tokens
│   ├── layout.tsx         # Layout racine avec providers
│   └── page.tsx           # Redirect vers dashboard si connecté
│
├── components/            # Composants réutilisables
│   ├── ui/               # Composants primitifs (bientôt shadcn)
│   ├── Ambience/
│   │   ├── AmbientBackground.tsx  # Canvas 3D arrière-plan
│   │   └── Background3D.tsx       # Scène Three.js
│   ├── Footer.tsx
│   ├── Header.tsx
│   ├── LaunchOverlay.tsx  # Modal d'onboarding
│   ├── TrustWheel.tsx     # Score de confiance visuel
│   ├── SilentProofBadge.tsx  # Badge d'attestation
│   ├── BadgeSkeleton.tsx  # Loading state
│   ├── QRCodeDisplay.tsx  # QR code pour Reclaim
│   ├── TxStatus.tsx       # Status transaction
│   ├── LanguageSwitcher.tsx
│   └── SBTBadge.tsx       # Badge SBT (caché actuellement)
│
├── lib/                   # Utilitaires & configurations
│   ├── contracts.ts      # ABI + addresses contracts
│   ├── i18n/             # Internationalisation
│   │   ├── LanguageContext.tsx
│   │   ├── translations.ts
│   │   └── locales/      # fr.json, en.json
│   ├── utils.ts          # Helpers divers
│   └── constants.ts      # Constantes app
│
├── providers/             # Context providers
│   ├── Web3Provider.tsx  # Wagmi + RainbowKit config
│   ├── QueryProvider.tsx # React Query config
│   └── ThemeProvider.tsx  # (optionnel)
│
├── services/              # Services métier
│   ├── ReclaimService.ts # zkTLS generation/verification
│   ├── EASService.ts     # Attestations EAS wrapper
│   ├── GitHubService.ts  # GitHub API wrapper
│   └── AuditService.ts   # AI audit orchestration
│
├── types/                 # Types TypeScript partagés
│   ├── attestation.ts
│   ├── audit.ts
│   └── platform.ts
│
├── hooks/                 # Custom hooks
│   ├── useTrustScore.ts  # Calcul score de confiance
│   ├── useVerifiedPlatforms.ts
│   └── useSBTs.ts
│
├── public/                # Assets statiques
│   ├── logo.png
│   ├── SilentLedger_icon.png
│   └── og-image.jpg
│
├── package.json
├── tailwind.config.ts     # Config Tailwind + themes
├── next.config.mjs        # Next.js config
├── tsconfig.json          # TS config
└── .env.local.example     # Exemple variables d'env
```

---

## Pages & Routes

### Landing Page (`app/page.tsx`)

**Fonctionnalité** :
- Page d'accueil publique
- Hero section avec call-to-action
- Sections Problem/Solution
- Glassmorphism cards avec animations 3D
- Parallax scroll effects

**State local** :
```typescript
const [showOverlay, setShowOverlay] = useState(false); // Modal onboarding
const [scrollY, setScrollY] = useState(0); // For parallax
const [isVisible, setIsVisible] = useState({}); // Intersection Observer
```

**Composants utilisés** :
- `Header`, `Footer` (stateless)
- `LaunchOverlay` (modal with wallet connect flow)

---

### Dashboard (`app/dashboard/page.tsx`)

**Route** : `/dashboard` (protégée - redirige vers `/` si non connecté)

**Fonctionnalités principales** :

1. **Tabbed Navigation** (4 onglets) :
   - `overview` : TrustWheel + stats globales
   - `legitimacy` : Vérification multi-plateforme
   - `audit` : Audit IA de GitHub
   - `attestations` : Historique des attestations

2. **State Management** :

```typescript
// Proof generation
const [proofUrl, setProofUrl] = useState<string | null>(null);
const [zkProof, setZkProof] = useState<ZKProof | null>(null);
const [activePlatform, setActivePlatform] = useState<SupportedPlatform>("github");
const [isGenerating, setIsGenerating] = useState(false);

// AI Audit
const [auditUsername, setAuditUsername] = useState("");
const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
const [isAuditing, setIsAuditing] = useState(false);
const [isScoreSaved, setIsScoreSaved] = useState(false);

// Transactions
const [txStatus, setTxStatus] = useState<TxStatus | null>(null);

// Tabs
const [activeTab, setActiveTab] = useState<TabType>("overview");
```

3. **Wagmi Hooks** :

```typescript
const { address, isConnected } = useAccount();
const { writeContractAsync, isPending: isTxPending } = useWriteContract();

// Lecture des attestations
const { data: attestationUIDs, refetch: refetchAttestations } = useReadContract({
  address: ATTESTER_ADDRESS,
  abi: SILENT_LEDGER_ATTESTER_ABI,
  functionName: "getAttestations",
  args: address ? [address] : undefined,
});

// Lecture SBTs
const { data: sbtIdsData } = useReadContract({
  address: SBT_ADDRESS,
  abi: CERTIFICATION_SBT_ABI,
  functionName: "getTokensOfOwner",
  args: address ? [address] : undefined,
});

// Lecture détails attestations (batch)
const { data: attestationDetails } = useReadContracts({
  contracts: attestations.map(uid => ({
    address: EAS_ADDRESS as `0x${string}`,
    abi: EAS_ABI,
    functionName: "getAttestation",
    args: [uid]
  }))
});
```

4. **Trust Score Calculation** :

```typescript
const trustScore = (() => {
  let score = 0;

  // Platform verifications
  const hashes = {
    github: keccak256(toBytes("github")),
    x: keccak256(toBytes("x")),
    linkedin: keccak256(toBytes("linkedin")),
  };

  if (verifiedPlatforms.includes(hashes.github)) score += 40;
  if (verifiedPlatforms.includes(hashes.x)) score += 20;
  if (verifiedPlatforms.includes(hashes.linkedin)) score += 20;

  // SBT bonus: +10% per SBT (max 20%)
  score += Math.min(sbtIds.length * 10, 20);

  return Math.min(score, 100);
})();
```

5. **Handlers** :

- `handleStampIntelligence(platform)` : Lance flux zkTLS Reclaim
- `handleSubmitOnChain()` : Soumet preuve vers smart contract
- `handleRunAudit()` : Appelle API `/api/github-audit`
- `handleSaveAuditScore()` : Soumet score IA on-chain via oracle proof

---

### Onboarding (`app/onboarding/`)

Pages temporaires pour onboarding utilisateur (en cours de développement) :
- `/onboarding/welcome` - Écran d'accueil
- `/onboarding/connect` - Connexion wallet
- `/onboarding/verify` - Vérification identité

---

## Composants

### Layout Components

#### `Header.tsx`
```typescript
interface HeaderProps {
  maxWidthClass?: string; // e.g., "max-w-6xl"
}
```
**Fonctions** :
- Logo cliquable → `/`
- Navigation links conditionnées sur `isConnected`
- Wallet Connect button (RainbowKit) si déconnecté
- Language switcher
- Responsive mobile menu

**Styles** :
```tsx
className="fixed top-0 left-0 right-0 z-50 glass-card border-b-0 rounded-none"
```

---

#### `Footer.tsx`
Simple footer avec :
- Logo et tagline
- Liens sociaux (Twitter, Discord, GitHub)
- Copyright
- Version info

---

#### `LaunchOverlay.tsx`

Modal d'onboarding qui s'affiche au premier CTA click.

**State** :
```typescript
const [step, setStep] = useState<"connect" | "platform" | "success">("connect");
```

**Flow** :
1. Écran "Connect Wallet" → `connect()` (RainbowKit)
2. Écran "Choose Platform" → sélection GitHub/X/LinkedIn/Farcaster
3. Écran "Success" → QR code display via `QRCodeDisplay`

---

### Feature Components

#### `TrustWheel.tsx`

Visualisation circulaire du score de confiance (0-100).

**Props** :
```typescript
interface TrustWheelProps {
  value: number; // 0-100
  size?: number; // default 280
  className?: string;
}
```

**Implémentation** :
- SVG avec deux arcs circulaires (background + foreground)
- Degrés calculés : `(value / 100) * 270` (270° arc, pas 360)
- Gradient SVG sur l'arc foreground
- Texte central : score + label
- Animation `strokeDashoffset` au montée

**Utilisation** :
```tsx
<TrustWheel value={trustScore} />
```

---

#### `SilentProofBadge.tsx`

Affiche une attestation EAS dans une carte glassmorphism.

**Props** :
```typescript
interface SilentProofBadgeProps {
  attestation: { uid: `0x${string}` };
  platformId?: string; // bytes32 decoded
  index: number; // pour staggered animation delay
}
```

**Logique** :
- Décodage `platformId` bytes → string hash compare
- Mapping hash → platform name + icône + couleur
- Formatage date
- Display : platfom icon + name + reputation score + date

**Platform mapping** :
```typescript
const PLATFORMS = {
  github: { label: "GitHub", icon: Github, color: "text-gray-800" },
  x: { label: "X / Twitter", icon: Twitter, color: "text-blue-500" },
  linkedin: { label: "LinkedIn", icon: Linkedin, color: "text-blue-700" },
  farcaster: { label: "Farcaster", icon: Shield, color: "text-purple-500" },
};
```

---

#### `QRCodeDisplay.tsx`

Affiche QR code pour Reclaim proof flow.

**Props** :
```typescript
interface QRCodeDisplayProps {
  url: string;              // Reclaim session URL
  waiting?: boolean;        // true = animation "waiting for scan"
  onScanned?: () => void;   // Callback (polling)
}
```

**Backend** :
- Utilise `qrcode` library pour générer QR SVG
- Si `waiting`, ajoute animation de pulsation
- Polling automatique vers Reclaim webhook si `onScanned` fourni

---

#### `TxStatus.tsx`

Badge coloré selon status de transaction.

**Props** :
```typescript
type TxStatusType = "success" | "error" | "pending";

interface TxStatusProps {
  status: TxStatusType;
  message: string;
  onClose?: () => void;
}
```

**Styles** :
- `success` : vert + icône check
- `error` : rouge + icône alert
- `pending` : jaune/orange + spinner

---

#### `BadgeSkeleton.tsx`

Loading state pour liste d'attestations.
Structure identique à `SilentProofBadge` mais avec `shimmer` CSS.

---

### Background Components

#### `AmbientBackground.tsx`
Wrapper qui rend `Background3D` en position fixed, z-index -1.

```tsx
export default function AmbientBackground() {
  return (
    <div className="fixed inset-0 z-[-1]">
      <Background3D />
    </div>
  );
}
```

#### `Background3D.tsx`

Scène Three.js avec particules animées.

**Technique** :
- `Canvas` de `@react-three/fiber`
- `Points` mesh avec `BufferGeometry`
- 200 particules (sur mobile : réduit à 50)
- Animation via `useFrame` : rotation + mouse follow

**Custom shader** :
```glsl
vertex: gl_PointSize = size * (1.0 / -mvPosition.z);
fragment: radial gradient from white to transparent
```

---

## Services

### `ReclaimService.ts`

Singleton qui gère les proofs zkTLS via Reclaim Protocol.

**Exports** :
```typescript
export async function initPlatformProof(params: {
  platform: SupportedPlatform;
  walletAddress: `0x${string}`;
  onProofReady: (result: ZKProof & { platformId: bytes; reputationScore: bigint; username?: string }) => void;
  onError: (err: Error) => void;
}): Promise<string> // Retourne URL de session
```

**Workflow** :
1. Appel API Reclaim pour créer session
2. Return URL (QR code à scanner)
3. Listen webhook/poll pour `onProofReady`
4. Parse proof → extraire `platformId` (bytes) et `reputationScore`

**Types** :
```typescript
type ZKProof = {
  id: string;
  proof: string;      // JSON stringifié
  signal: string;     // Données d'entrée
  createdAt: string;
};
```

---

### `EASService.ts`

Wrapper autour de EAS SDK pour opérations courantes.

**Fonctions** :
```typescript
export function getAttestations(address: `0x${string}`): Promise<`0x${string}`[]>
export function getAttestation(uid: `0x${string}`): Promise<Attestation>
export function createAttestation(params: CreateAttestationParams): Promise<`0x${string}`>
```

**Non-utilisé actuellement** : Les appels directs via Wagmi (`useReadContract`) sont privilégiés.

---

### `GitHubService.ts`

Wrapper GitHub REST API (Octokit).

**Fonctions** :
```typescript
export async function getUserRepos(username: string): Promise<Repo[]>
export async function getRepoLanguages(owner: string, repo: string): Promise<Record<string, number>>
export async function getRepoContents(owner: string, repo: string): Promise<File[]>
```

**Utilisé par** : API route `/api/github-audit`

---

### `AuditService.ts`

Orchestre l'audit IA côté serveur (dans API route).

**Process** :
```typescript
async function runAudit(username: string, wallet: `0x${string}`) {
  // 1. Fetch GitHub repos
  const repos = await GitHubService.getUserRepos(username);

  // 2. Analyse par Gemini
  const score = await GeminiService.analyzeRepos(repos);

  // 3. Sign avec oracle privé
  const signature = await oracleSigner.signMessage(
    keccak256(abi.encode(...))
  );

  return { score, signature, data: payload };
}
```

---

## State Management

### React Query (TanStack Query)

Gestion de l'état serveur (données on-chain).

**Config** : `providers/QueryProvider.tsx`
```typescript
new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnMount: "always", // Important pour données on-chain fraîches
      staleTime: 0,
      retry: 1,
    },
  },
});
```

**Queries** :
```typescript
// Dans dashboard
const { data, isLoading, refetch } = useReadContract({
  // Auto caching + background refetch
});

// Oracle proof submission (mutation)
const { mutateAsync: submitProof, isPending } = useWriteContract();
```

---

### Local State (useState)

Pour état UI éphémère :
- Sélection platform
- QR code generation
- Modal visibility
- Tab selection

**Pattern** : State lifting facilitated via dashboard component principal (tout centralisé dans `page.tsx` dashboard).

---

### Web3 State (Wagmi)

Wagmi gère :
- `account` : { address, isConnected, chainId }
- `connectors` : wallet connect state
- `transactions` : history + status
- `contracts` : read/write hooks avec typesafety

**Exemple** :
```typescript
const { data: balance } = useReadContract({
  address: TOKEN_ADDRESS,
  abi: ERC20_ABI,
  functionName: "balanceOf",
  args: [address],
});
```

---

## Internationalisation

### `lib/i18n/`

**Context** : `LanguageContext.tsx`
```typescript
const LanguageContext = createContext<{ lang: "en" | "fr"; t: Translations }>();
```

**Translations** : `translations.ts`
```typescript
export const translations = {
  en: { home: { badge: "NEW" /* ... */ }, dashboard: {/* ... */ } },
  fr: { home: { badge: "NOUVEAU" /* ... */ }, dashboard: {/* ... */ } },
};
```

**Usage** :
```tsx
const { t } = useTranslation();
<h1>{t.home.heroTitle1}</h1>
```

**Switcher** : `LanguageSwitcher.tsx` - bouton qui toggle `lang` dans context + localStorage.

---

## Styling & Design System

### Design Tokens (`globals.css`)

**Variables CSS** :
```css
:root {
  --bg-base: #d3daff;        /* Light blue background */
  --bg-surface: rgba(255,255,255,0.1);
  --text-primary: #020617;   /* Dark slate */
  --text-secondary: #334155;
  --primary: #2563eb;        /* Blue */
  --accent: #1e293b;         /* Dark slate */
  --accent-light: #2563eb;
  --accent-glow: rgba(37,99,235,0.2);
  --green: #15803d;
}
```

---

### Glassmorphism Classes

#### `.glass-card`
Effet principal :
```css
background:
  /* 4-layer gradient simulating multiple glass surfaces */
  linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 50%),
  linear-gradient(225deg, rgba(255,255,255,0.15) 0%, transparent 50%),
  linear-gradient(315deg, rgba(255,255,255,0.08) 0%, transparent 50%),
  linear-gradient(45deg, rgba(255,255,255,0.15) 0%, transparent 50%),
  linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.05) 40%, rgba(255,255,255,0.02) 100%);

backdrop-filter: blur(24px) saturate(180%) brightness(1.02);
border: 1px solid rgba(255,255,255,0.25);
box-shadow:
  0 4px 30px rgba(0,0,0,0.04),
  0 12px 40px -8px rgba(0,0,0,0.06),
  inset 0 1px 0 rgba(255,255,255,0.4),
  inset 0 0 0 1px rgba(255,255,255,0.08),
  inset 0 -1px 0 rgba(255,255,255,0.1);
border-radius: 28px;
```

**Hover** :
```css
transform: translateY(-10px) scale(1.008);
box-shadow:
  0 20px 60px -12px rgba(0,0,0,0.12),
  0 8px 24px -4px rgba(0,0,0,0.08),
  inset 0 1px 0 rgba(255,255,255,0.6),
  inset 0 0 0 1px rgba(255,255,255,0.15),
  inset 2px 2px 6px rgba(255,255,255,0.25),
  0 0 40px rgba(37,99,235,0.08);
```

---

#### Variants

- `.glass-card-hero` : `border-radius: 48px; backdrop-filter: blur(32px) saturate(200%);`
- `.glass-card-stat` : `border-radius: 20px; backdrop-filter: blur(16px) saturate(160%);`
- `.glass-card-soft` : `backdrop-filter: blur(20px) saturate(150%); border-radius: 32px;`
- `.glass-panel` : Light panel (128x128)
- `.glass-dark` : Dark variant (black background)
- `.glass-noise` : Adds SVG noise overlay

---

#### Edge Light Effect

Automatically applied via `::after` pseudo-element :
```css
.glass-card::after {
  padding: 1px;
  background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.3) 100%);
  mask: composite exclude;
  opacity: 0; transition: opacity 0.4s;
}
.glass-card:hover::after { opacity: 1; }
```

---

### Tailwind Configuration

**`tailwind.config.ts`** :
```typescript
export default {
  content: [
    "./frontend/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        accent: "var(--accent)",
        // ...
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
      },
      animation: {
        "float": "glassFloat 6s ease-in-out infinite",
        "pulse-dot": "pulse 2s infinite",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
};
```

---

## Intégration Web3

### `providers/Web3Provider.tsx`

Wrap l'app avec Wagmi + RainbowKit :

```tsx
export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiConfig config={config}>
      <RainbowKitProvider>
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
```

**Wagmi Config** :
```typescript
const config = createConfig({
  chains: [sepolia, amoy],
  transports: {
    [sepolia.id]: http(SEPOLIA_RPC_URL),
  },
  connectors: [
    metaMask(),
    coinbaseWallet({ appName: "SilentLedger" }),
    walletConnect({ projectId: WALLET_CONNECT_PROJECT_ID }),
  ],
  ssr: true,
});
```

---

### Contract ABIs & Addresses

**`lib/contracts.ts`** :

```typescript
export const ATTESTER_ADDRESS = process.env.NEXT_PUBLIC_SILENT_LEDGER_ADDRESS!;
export const SBT_ADDRESS = process.env.NEXT_PUBLIC_SBT_ADDRESS!;
export const EAS_ADDRESS = process.env.NEXT_PUBLIC_EAS_ADDRESS!;

export const SILENT_LEDGER_ATTESTER_ABI = [
  "function submitProof(bytes rawProof, bytes32 platformId, uint256 reputationScore) returns (bytes32)",
  "function submitOracleProof(bytes signature, OracleData data) returns (bytes32)",
  "function getAttestations(address user) view returns (bytes32[])",
  // ...
] as const;

export const CERTIFICATION_SBT_ABI = [
  "function getTokensOfOwner(address owner) view returns (uint256[])",
  "function getCertification(uint256 tokenId) view returns (string competenceName, string proofOfWorkURL, uint256 examScore, uint256 acquisitionDate)",
] as const;
```

---

## API Routes

### `app/api/github-audit/route.ts`

**Method** : `POST`

**Body** :
```typescript
{
  username: string;
  address: `0x${string}`;
}
```

**Process** :

1. **Validation** :
   - Check rate limit (5/day per IP)
   - Validate Ethereum address format
   - Validate GitHub username exists (via GitHub API)

2. **GitHub fetch** :
```typescript
const repos = await octokit.request('GET /users/{username}/repos', {
  username,
  sort: 'stargazers',
  per_page: 5,
});
```

3. **Gemini analysis** :
```typescript
const prompt = `
Analyze these repos for code quality:
${repos.map(r => `- ${r.full_name}: ${r.language}, ${r.stargazers_count} stars`).join('\n')}

Score 0-100 based on:
- Test coverage presence
- README quality
- Commit frequency
- Code structure
`;

const result = await gemini.generateContent(prompt);
const score = extractScore(result.text);
```

4. **Oracle signature** :
```typescript
const payload = {
  recipient: address,
  competenceName: "Open Source Contributor",
  level: 1,
  examScore: score,
  proofOfWorkURL: `https://github.com/${username}`,
  studentId: keccak256(toBytes(address)),
  deadline: Math.floor(Date.now() / 1000) + 3600,
};

const digest = keccak256(abi.encode(...));
const signature = await oracleSigner.signMessage(digest);
```

5. **Response** :
```json
{
  "score": 87,
  "summary": "...",
  "totalStars": 2450,
  "signatureData": {
    "signature": "0x...",
    "data": { ...payload }
  }
}
```

**Error handling** :
- 429 : Rate limit
- 404 : GitHub user not found
- 500 : Gemini API error / Oracle signing error

---

## Configuration

### Variables d'Environnement (`frontend/.env.local`)

```env
# Required
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_RECLAIM_APP_ID=your_reclaim_app_id

# Contract addresses (Sepolia)
NEXT_PUBLIC_EAS_ADDRESS=0x...
NEXT_PUBLIC_SILENT_LEDGER_ADDRESS=0x...
NEXT_PUBLIC_SBT_ADDRESS=0x...

# API keys
NEXT_PUBLIC_GEMINI_API_KEY=AIza...
NEXT_PUBLIC_ORACLE_PUBLIC_KEY=0x...  # Pour affichage, la privée est côté API

# RPC
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/...

# Features
NEXT_PUBLIC_ENABLE_AUDIT=true
NEXT_PUBLIC_ENABLE_FARCASTER=true
```

**Note** : `NEXT_PUBLIC_` prefix required for client-side access.

---

### Next.js Config (`next.config.mjs`)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true, // À retirer en prod
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Enable SWC minification
  swcMinify: true,
};

export default nextConfig;
```

---

## Développement

### Lancer le projet

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### Build production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
# Auto-fix
npm run lint -- --fix
```

---

### Structure de commits conventionnelle

```
feat: add TrustWheel animation
fix: resolve EAS attestation decode error
chore: update Gemini API version
refactor: extract ReclaimService
docs: add API route documentation
style: adjust glassmorphism border radius
```

---

## Déploiement

### Vercel (recommandé)

1. Push vers GitHub
2. Import repo dans Vercel
3. Set Environment Variables dans Vercel Dashboard
4. Deploy (automatique sur pousse sur main)

**Domains customs** :
- Ajouter CNAME `dashboard.silentledger.io`
- SSL automatique via Vercel

---

### Variables d'env en production

Dans Vercel Dashboard → Project Settings → Environment Variables :
```
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID = ...
NEXT_PUBLIC_RECLAIM_APP_ID = ...
NEXT_PUBLIC_EAS_ADDRESS = 0x...
# ... tous les NEXT_PUBLIC_*
```

Non-preview branches : Set `Production` tab
Preview branches : Set `Preview` tab

---

## Testing

### Unit Tests (à venir)

```bash
npm run test
# ou
npm run test:coverage
```

**Structure** :
```
__tests__/
├── components/
│   ├── TrustWheel.test.tsx
│   └── SilentProofBadge.test.tsx
├── services/
│   ├── ReclaimService.test.ts
│   └── AuditService.test.ts
└── utils/
    └── helpers.test.ts
```

---

### E2E Tests

Avec Playwright :
```bash
npm run test:e2e
```

**Scénarios** :
1. Landing → Click CTA → Modal → Connect wallet
2. Dashboard → Verify GitHub → QR → Submit proof
3. Audit → Save score → Mint SBT
4. Tab navigation → Check attestations list

---

## Performance

### Optimisations appliquées

1. **Three.js** :
   - Réduction particules sur mobile (50 vs 200)
   - `frustumCulled = true`
   - `instancedMesh` si >1000 particules

2. **Images** :
   - Logo en `next/image` avec `width/height`
   - SVG inline pour icônes (lucide-react)

3. **Code splitting** :
   - Dynamic import pour `QRCodeDisplay` (lourd)
   - Three.js chargé uniquement sur landing

4. **API routes** :
   - Cache GitHub responses (5min)
   - Streaming Gemini responses prochainement

---

## Accessibilité

### ARIA labels

```tsx
<button aria-label="Connect Wallet">
<nav aria-label="Main navigation">
```

### Keyboard navigation

- Toutes les interactions accessibles via Tab/Enter
- Focus visible avec `focus-visible:ring`

### Contrast ratios

- Text primary : `#020617` sur `#d3daff` (WCAG AAA)
- Accent : `#2563eb` (AA+)
- Glass elements : `rgba(255,255,255,0.15)` overlay pour lisibilité

---

## Notes de développement

### Pattern "derive state from on-chain"

Ne jamais stocker l'état dans `useState` quand données viennent de blockchain :

```typescript
// ✅ Bon
const { data: attestations } = useReadContract(); // Auto refresh

// ❌ Éviter
const [attestations, setAttestations] = useState([]); // Stale
```

---

### "Contract-first" mindset

Toutes les données critiques viennent de smart contracts, pas de base de données frontend.

Si besoin d' caching temporaire :
```typescript
useQuery({
  queryKey: ['attestations', address],
  queryFn: () => contract.getAttestations(address),
  staleTime: 0, // Toujours frais pour blockchain
});
```

---

### Error boundaries

Pas de error boundary global (Next.js gère). Pour composants critiques :

```tsx
try {
  return <TrustWheel value={score} />;
} catch (error) {
  console.error("TrustWheel error:", error);
  return <div className="p-4 bg-red-100">Error loading trust score</div>;
}
```

---

## Roadmap Frontend

- [ ] Tests unitaires (Jest + Testing Library)
- [ ] E2E tests (Playwright)
- [ ] PWA support (offline attestation cache)
- [ ] Optimistic UI pour toutes les mutations
- [ ] Skeleton loaders globaux
- [ ] Error logging (Sentry)
- [ ] Analytics (PostHog anonyme)
- [ ] Better mobile UX (responsive fixes)
- [ ] Dark mode support
- [ ] More 3D scenes (per section)
- [ ] Component library (Storybook)

---

## Support & Contributing

Pour contribuer au frontend :
1. Lire `CONTRIBUTING.md` (racine du repo)
2. Fork → branche feature → PR
3. Respecter conventions de code (Prettier + ESLint)
4. Ajouter tests pour nouvelles fonctionnalités
5. Documenter dans ce fichier les changements significatifs

---

**Dernière mise à jour** : Février 2026
**Version** : v0.1.0 (MVP)
