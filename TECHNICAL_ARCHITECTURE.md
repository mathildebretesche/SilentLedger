# Technical Architecture - SilentLedger

## 📊 Table des Matières

1. [System Overview](#system-overview)
2. [Smart Contracts](#smart-contracts)
3. [Frontend Architecture](#frontend-architecture)
4. [API Layer](#api-layer)
5. [Data Flow](#data-flow)
6. [Security Model](#security-model)
7. [Cryptography](#cryptography)
8. [State Management](#state-management)
9. [Networks & Deployment](#networks--deployment)
10. [Performance Optimizations](#performance-optimizations)
11. [Error Handling](#error-handling)
12. [Testing Strategy](#testing-strategy)
13. [Infrastructure](#infrastructure)

---

## System Overview

### High-Level Architecture Diagram

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   User Device   │─────▶│   Next.js App    │─────▶│   blockchain    │
│  (Mobile/Web)   │◀─────│  (Vercel/Node)   │◀─────│  (Sepolia/Eth)  │
└─────────────────┘      └──────────────────┘      └─────────────────┘
         │                         │                         │
         │    ┌──────────────┐     │    ┌──────────────┐    │
         └───▶│ Reclaim zkTLS │◀───┘    │   Gemini AI  │◀───┘
              │   Protocol   │         │    (0G)      │
              └──────────────┘         └──────────────┘
```

### Core Components

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | Next.js 14 App Router | UI + Web3 integration |
| Smart Contracts | Solidity + Foundry | On-chain attestations + SBTs |
| API | Next.js API Routes | AI audit + GitHub fetch |
| ZK Proofs | Reclaim Protocol | Privacy-preserving verification |
| AI Model | Google Gemini / 0G | Code quality scoring |
| Storage | Ethereum + IPFS (optionnal) | Attestation permanence |
| Identity | EAS + Wallet Connect | Decentralized identity |

---

## Smart Contracts

### 1. SilentLedgerAttester.sol

**Location**: `/contracts/src/SilentLedgerAttester.sol`

**State Variables**:
```solidity
address public owner;
address public easAddress;
address public oracleSigner; // Signs AI audit results
uint256 public platformCount;
mapping(bytes32 => Platform) public platforms; // byte32 = keccak256(name)
mapping(address => bytes32[]) public userAttestations; // UIDs per user
mapping(bytes32 => bool) public proofUsed; // Prevent replay
```

**Key Structs**:
```solidity
struct Platform {
  bytes32 platformId;      // keccak256("github")
  string name;            // "GitHub"
  bytes32 metadataURI;    // IPFS hash of platform config
  bool isActive;
  uint256 verification Fee;
}

struct OracleData {
  address recipient;
  string competenceName;
  uint256 level;
  uint256 examScore;      // 0-100
  string proofOfWorkURL;
  bytes32 studentId;      // keccak256(wallet)
  uint256 deadline;
}
```

**Key Functions**:

#### `submitProof(bytes memory rawProof, bytes32 platformId, uint256 reputationScore)`
1. Verify zk proof via `GhostVerifier.verifyProof()`
2. Check `!proofUsed[keccak256(rawProof)]`
3. Create EAS attestation via `IEAS.createAttestation()`
4. Emit `AttestationCreated(uid, msg.sender, platformId)`
5. Mark proof as used

**Gas**: ~150k

#### `submitOracleProof(bytes memory signature, OracleData memory data)`
1. Recover signer from `keccak256(abi.encode(data))` signature
2. Verify `signer == oracleSigner`
3. Verify `block.timestamp <= data.deadline`
4. Verify `data.recipient == msg.sender`
5. Verify `data.examScore <= 100`
6. Create EAS attestation
7. Emit `OracleAttestationCreated(uid, data.examScore)`

**Gas**: ~180k

#### `getAttestations(address user) public view returns (bytes32[])`
Returns array of attestation UIDs for user. No on-chain storage (uses EAS indexer off-chain), but kept for convenience.

---

### 2. CertificationSBT.sol (ERC-5192)

**Location**: `/contracts/src/CertificationSBT.sol`

**Standards**: ERC-5192 (SBT), ERC-165

**State Variables**:
```solidity
uint256 public nextTokenId;
mapping(uint256 => Certification) public certifications;
mapping(address => uint256[]) public ownerTokens;
```

**Certifications**:
```solidity
struct Certification {
  string competenceName;     // "AI Code Audit"
  string proofOfWorkURL;     // "https://github.com/..."
  uint256 examScore;         // 0-100
  uint256 acquisitionDate;   // timestamp
  bytes32 attestationUID;    // Links to EAS attestation
}
```

**Minting**:
```solidity
function mint(
  address to,
  string memory competenceName,
  string memory proofOfWorkURL,
  uint256 examScore,
  bytes32 attestationUID
) external onlyAttester returns (uint256) {
  nextTokenId++;
  certifications[nextTokenId] = Certification({
    competenceName: competenceName,
    proofOfWorkURL: proofOfWorkURL,
    examScore: examScore,
    acquisitionDate: block.timestamp,
    attestationUID: attestationUID
  });
  _safeMint(to, nextTokenId);
  ownerTokens[to].push(nextTokenId);
  emit CertificationMinted(nextTokenId, to, attestationUID);
}
```

**Read Functions**:
```solidity
function getCertification(uint256 tokenId) external view returns (
  string memory competenceName,
  string memory proofOfWorkURL,
  uint256 examScore,
  uint256 acquisitionDate
)

function getTokensOfOwner(address owner) external view returns (uint256[] memory)
```

---

### 3. GhostVerifier.sol

**Location**: `/contracts/src/GhostVerifier.sol`

**Purpose**: Verify Reclaim zkSNARK proofs

**Implementation**:
```solidity
interface IGroth16Verifier {
  function verifyProof(
    uint[2] memory a,
    uint[2][2] memory b,
    uint[2] memory c,
    uint[2] memory input
  ) external pure returns (bool);
}

contract GhostVerifier is IGroth16Verifier {
  // Reuses verification key from Reclaim's verifier
  // Compiles circom circuit to snarkjs verifier
}
```

**Usage**: Called by `SilentLedgerAttester.submitProof()`

---

## Frontend Architecture

### Directory Structure

```
frontend/
├── app/                    # Next.js 14 App Router
│   ├── (public)/          # Public routes (no auth)
│   │   ├── page.tsx       # Landing page
│   │   └── layout.tsx
│   ├── (private)/         # Protected routes (wallet required)
│   │   ├── dashboard/
│   │   │   ├── page.tsx   # Main dashboard
│   │   │   └── components/ # Tab components
│   │   ├── profile/
│   │   ├── security/
│   │   └── privacy/
│   ├── api/               # API Routes
│   │   └── github-audit/
│   │       └── route.ts   # AI audit endpoint
│   ├── contracts/         # Static contract pages
│   ├── docs/              # Documentation
│   ├── layout.tsx         # Root layout + providers
│   └── page.tsx           # Home redirect
├── components/            # Reusable UI components
│   ├── AmbientBackground.tsx
│   ├── Footer.tsx, Header.tsx, LaunchOverlay.tsx
│   ├── TrustWheel.tsx, SilentProofBadge.tsx
│   ├── TxStatus.tsx, QRCodeDisplay.tsx
│   ├── BadgeSkeleton.tsx, OptionCard.tsx
│   ├── SBTBadge.tsx
│   └── LanguageSwitcher.tsx
├── lib/
│   ├── contracts.ts       # ABIs + addresses
│   ├── i18n/              # Internationalization
│   └── utils.ts           # Helpers
├── providers/
│   ├── Web3Provider.tsx   # Wagmi config
│   ├── QueryProvider.tsx  # React Query
│   └── LanguageProvider.tsx
├── services/
│   ├── ReclaimService.ts  # zkTLS flows
│   ├── EASService.ts
│   ├── GitHubService.ts
│   └── AuditService.ts
├── hooks/
│   ├── useTrustScore.ts
│   └── usePlatforms.ts
├── types/
│   ├── attestation.ts
│   ├── audit.ts
│   └── platform.ts
├── public/                # Static assets
├── styles/                # Additional CSS
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.mjs
```

---

## Frontend Key Files

### 1. Dashboard: `app/dashboard/page.tsx`

**Main state**:
```typescript
const [activeTab, setActiveTab] = useState<TabType>("overview");
const [zkProof, setZkProof] = useState<ZKProof | null>(null);
const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
const [txStatus, setTxStatus] = useState<TxStatus | null>(null);
```

**Wagmi Hooks**:
```typescript
const { address, isConnected } = useAccount();
const { writeContractAsync, isPending: isTxPending } = useWriteContract();

// Read attestations
const { data: attestationUIDs, refetch } = useReadContract({
  address: ATTESTER_ADDRESS,
  abi: SILENT_LEDGER_ATTESTER_ABI,
  functionName: "getAttestations",
  args: address ? [address] : undefined,
});

// Read SBTs
const { data: sbtIds } = useReadContract({
  address: SBT_ADDRESS,
  abi: CERTIFICATION_SBT_ABI,
  functionName: "getTokensOfOwner",
  args: address ? [address] : undefined,
});
```

**Trust Score Calculation**:
```typescript
const trustScore = useMemo(() => {
  let score = 0;
  const platformHashes = {
    github: keccak256(toBytes("github")),
    x: keccak256(toBytes("x")),
    linkedin: keccak256(toBytes("linkedin")),
    farcaster: keccak256(toBytes("farcaster")),
  };

  if (verifiedPlatforms.includes(platformHashes.github)) score += 40;
  if (verifiedPlatforms.includes(platformHashes.x)) score += 20;
  if (verifiedPlatforms.includes(platformHashes.linkedin)) score += 20;

  score += Math.min(sbtIds.length * 10, 20);
  return Math.min(score, 100);
}, [verifiedPlatforms, sbtIds]);
```

**Main Handlers**:

`handleStampIntelligence(platform)`:
1. `initPlatformProof()` from ReclaimService
2. Shows QR modal with `proofUrl`
3. Waits for `onProofReady` callback → sets `zkProof` + `platformId`
4. User sees "Proof Generated" → clicks "Submit On-Chain"

`handleSubmitOnChain()`:
1. Parse `zkProof.raw` → JSON
2. Call `writeContractAsync({
   address: ATTESTER_ADDRESS,
   abi: SILENT_LEDGER_ATTESTER_ABI,
   functionName: "submitProof",
   args: [rawProof, platformId, reputationScore]
})`
3. On success: `refetchAttestations()`, close modal

`handleRunAudit()`:
1. POST to `/api/github-audit`
2. Set `auditResult` with score + signature
3. Display "Save Attestation" button

`handleSaveAuditScore()`:
1. Call `submitOracleProof()` with signature
2. `refetchAttestations()`, `refetchCertifications()`

---

### 2. ReclaimService

**Location**: `/frontend/services/ReclaimService.ts`

**Core Functions**:
```typescript
export async function initPlatformProof(params: {
  platform: SupportedPlatform;
  walletAddress: `0x${string}`;
  onProofReady: (result: ZKProof & { platformId: bytes; reputationScore: bigint; username?: string }) => void;
  onError: (err: Error) => void;
}): Promise<string> // Returns session URL
```

**Implementation Flow**:
1. Call Reclaim API: `POST https://api.reclaimprotocol.org/v1/sessions`
   ```json
   {
     "appId": process.env.NEXT_PUBLIC_RECLAIM_APP_ID,
     "callbackUrl": `${window.location.origin}/api/reclaim-callback`,
     "context": JSON.stringify({
       platform: platform,
       walletAddress: walletAddress
     }),
     "metadata": { "source": "silentledger" }
   }
   ```
2. Poll Reclaim API every 3s for `GET /sessions/{id}`
3. When `session.status === "verified"`:
   - Fetch proof: `GET /sessions/{id}/proof`
   - Verify proof locally via `snarkjs.groth16.verify()`
   - Extract `platformId` from `signals`
   - Calculate `reputationScore` from proof metadata
   - Call `onProofReady()`

**Supported Platforms**:
```typescript
const PLATFORM_CONFIGS = {
  github: {
    circuit: "github_repo_contributor",
    claimType: "github_contribution",
  },
  x: {
    circuit: "twitter_verification",
    claimType: "twitter_verified",
  },
  linkedin: {
    circuit: "linkedin_employment",
    claimType: "linkedin_employed",
  },
  farcaster: {
    circuit: "farcaster_verification",
    claimType: "farcaster_id",
  },
};
```

---

### 3. API Route: `/api/github-audit/route.ts`

**Purpose**: Server-side GitHub code audit using Gemini

**Flow**:
```typescript
export async function POST(request: Request) {
  const { username, address } = await request.json();

  // 1. Rate limiting (5 per day per IP)
  const rateCheck = await checkRateLimit(request.ip);
  if (!rateCheck.allowed) return new Response("Rate limited", { status: 429 });

  // 2. Fetch GitHub repos
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const { data: repos } = await octokit.request('GET /users/{username}/repos', {
    username,
    sort: 'stargazers',
    per_page: 5,
  });

  // 3. Analyze with Gemini
  const prompt = buildPrompt(repos);
  const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = gemini.getGenerativeModel({ model: "gemini-1.5-pro" });
  const result = await model.generateContent(prompt);
  const score = extractScore(result.response.text());

  // 4. Build oracle payload
  const payload: OracleData = {
    recipient: address,
    competenceName: "Open Source Contributor",
    level: 1,
    examScore: score,
    proofOfWorkURL: `https://github.com/${username}`,
    studentId: keccak256(toBytes(address)),
    deadline: Math.floor(Date.now() / 1000) + 3600,
  };

  // 5. Sign with oracle private key
  const digest = keccak256(abi.encode(
    type("OracleData"),
    payload
  ));
  const signature = await signMessage(digest, ORACLE_PRIVATE_KEY);

  // 6. Return
  return NextResponse.json({
    score,
    summary: result.response.text(),
    totalStars: repos.reduce((sum, r) => sum + r.stargazers_count, 0),
    signatureData: { signature, data: payload },
  });
}
```

**Security**:
- Rate limiting by IP
- GitHub account validation (404 check)
- Server-side signature only (private key never in frontend)
- 1-hour deadline on signatures

---

## API Layer

### Endpoints

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/github-audit` | POST | Run AI audit on GitHub user |
| `/api/reclaim-callback` | POST | Webhook from Reclaim (not used, polling preferred) |
| `/api/health` | GET | Health check |
| `/api/contracts` | GET | Return ABIs + addresses for frontend |

### Authentication

**No authentication required** - All endpoints are public but rate-limited.

Rate limits:
- `/api/github-audit`: 5 requests/day per IP
- `/api/contracts`: 1000 requests/hour per IP

---

## Data Flow Diagrams

### 1. Platform Verification Flow (zkTLS)

```
┌─────────┐
│ User    │ Clicks "Verify GitHub"
└────┬────┘
     │
     ▼
┌────────────────────┐
│ Frontend: init     │ initPlatformProof({platform: "github"})
│ Reclaim session    │
└────┬───────────────┘
     │
     ▼
┌────────────────────┐
│ Reclaim API        │ Returns session URL
│ POST /sessions     │
└────┬───────────────┘
     │
     ▼
┌────────────────────┐
│ Frontend displays  │ <QRCode url={sessionUrl}>
│ QR code            │
└────┬───────────────┘
     │
     ▼
┌────────────────────┐
│ Mobile: Reclaim    │ Scan QR → sign proof
│ App                │
└────┬───────────────┘
     │
     ▼
┌────────────────────┐
│ Reclaim Server     │ Proof ready, emits webhook
│ POST /sessions/{id}│
└────┬───────────────┘
     │
     ▼
┌────────────────────┐
│ Frontend polling   │ Check every 3s
│ GET /sessions/{id} │
└────┬───────────────┘
     │
     ▼
┌────────────────────┐
│ Proof verified!    │ setZkProof(result)
│ Show "Submit" btn  │
└────┬───────────────┘
     │
     ▼
┌────────────────────┐
│ writeContractAsync │ submitProof(rawProof, platformId, score)
│ → Blockchain       │
└────┬───────────────┘
     │
     ▼
┌────────────────────┐
│ EAS Attestation    │ UID minted on-chain
│ created            │
└────────────────────┘
```

### 2. AI Audit Flow

```
┌─────────┐
│ User    │ Enters GitHub username (auto-filled if GitHub verified)
└────┬────┘
     │
     ▼
┌────────────────────┐
│ Frontend validates │ Must have GitHub zkTLS first
│ verifiedUsername    │
└────┬───────────────┘
     │
     ▼
┌────────────────────┐
│ Click "Analyze"    │ POST /api/github-audit
└────┬───────────────┘
     │
     ▼
┌────────────────────┐
│ API Route          │ 1. Fetch repos from GitHub
│                    │ 2. Build prompt with repo data
│                    │ 3. Call Gemini API
│                    │ 4. Parse score (0-100)
│                    │ 5. Build OracleData payload
│                    │ 6. Sign with oracle private key
└────┬───────────────┘
     │
     ▼
┌────────────────────┐
│ Frontend receives  │ { score, signature, data }
│ auditResult        │
└────┬───────────────┘
     │
     ▼
┌────────────────────┐
│ Click "Save Score" │ submitOracleProof(signature, data)
│ → writeContract    │
└────┬───────────────┘
     │
     ▼
┌────────────────────┐
│ SilentLedger       │ 1. Verify signature matches oracleSigner
│ Attester           │ 2. Verify score <= 100
│                    │ 3. Verify not expired
│                    │ 4. Create EAS attestation
│                    │ 5. Emit OracleAttestationCreated
└────┬───────────────┘
     │
     ▼
┌────────────────────┐
│ CertificationSBT   │ mint(to, "AI Code Audit", score, github_url)
│ contract           │
└────────────────────┘
```

---

## Security Model

### Threat Model

| Threat | Mitigation |
|--------|------------|
| **Proof Replay** | `mapping(bytes32 => bool) proofUsed` in contract |
| **Oracle Signature Forgery** | Private key stored server-side only, never exposed |
| **AI Score Manipulation** | Score capped at 100, deadline enforced, recipient check |
| **Sybil Attack** | zkTLS proofs cost real device fingerprint; replay protection |
| **Rate Limiting Bypass** | IP-based + potential wallet-based rate limiting |
| **GitHub Impersonation** | Must have GitHub zkTLS proof proving ownership first |

### Access Control

**Roles**:
```solidity
address public owner;          // Can change oracleSigner, fees
address public oracleSigner;   // Can sign AI audit proofs
address public attester;       // Can mint SBTs (same as contract)
```

**Modifiers**:
```solidity
modifier onlyOwner() {
  require(msg.sender == owner, "Not owner");
  _;
}

modifier onlyOracle() {
  require(msg.sender == oracleSigner, "Not oracle");
  _;
}

modifier onlyAttester() {
  require(msg.sender == attester, "Not attester");
  _;
}
```

---

## Cryptography

### zkTLS with Reclaim

**Circuit**: `ghost-reclaim-circom` (in `/contracts/circom/`)

**Public Signals** (what ends up on-chain):
1. `platformId` (bytes32) - Which platform was verified
2. `reputationScore` (uint256) - Derived from the claim
3. `nullifier` (bytes32) - Prevents replay

**Private Signals** (never revealed):
- Device fingerprint
- OAuth token
- IP address
- Timestamp

**Verification Flow**:
1. User scans QR → Reclaim mobile app
2. App fetches OAuth token → proves ownership without revealing token
3. App generates zkSNARK proof (~2s on mobile)
4. Proof sent to Reclaim server → verified → returned to frontend
5. Frontend calls `GhostVerifier.verifyProof()` on-chain with proof + public signals

---

### Oracle Signatures (AI Audit)

**Payload**:
```typescript
const payload = {
  recipient: address,       // Must match msg.sender
  competenceName: string,   // Static: "Open Source Contributor"
  level: uint256,          // Currently unused
  examScore: uint256,      // 0-100 from Gemini
  proofOfWorkURL: string,  // "https://github.com/username"
  studentId: bytes32,      // keccak256(wallet address)
  deadline: uint256,       // Unix timestamp (1h expiry)
};
```

**Signing**:
```typescript
const digest = keccak256(abi.encode(
  type("OracleData"),
  payload
));
const signature = await wallet.signMessage(digest);
```

**On-chain verification**:
```solidity
bytes32 digest = keccak256(abi.encode(data));
address signer = ECDSA.recover(digest, signature);
require(signer == oracleSigner, "Invalid oracle signature");
require(block.timestamp <= data.deadline, "Signature expired");
require(data.recipient == msg.sender, "Recipient mismatch");
```

---

## State Management Patterns

### React Query Configuration

**`providers/QueryProvider.tsx`**:
```typescript
export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnMount: "always",      // Critical for fresh on-chain data
      refetchOnWindowFocus: true,    // Auto-refresh when tab gains focus
      staleTime: 0,                  // Always considered stale
      retry: 1,                      // Don't retry failed queries
      gcTime: 1000 * 60 * 5,         // 5 minutes cache
    },
    mutations: {
      retry: 1,
    },
  },
});
```

### Wagmi Configuration

**`providers/Web3Provider.tsx`**:
```typescript
const config = createConfig({
  chains: [sepolia, amoy],
  transports: {
    [sepolia.id]: createPublicClient({ chain: sepolia, transport: http(SEPOLIA_RPC_URL) }),
    [amoy.id]: createPublicClient({ chain: amoy, transport: http(AMOY_RPC_URL) }),
  },
  connectors: [
    metaMask(),
    coinbaseWallet({ appName: "SilentLedger" }),
    walletConnect({ projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID! }),
  ],
  ssr: true, // Required for Next.js SSR
});

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(SEPOLIA_RPC_URL),
});
```

---

## Networks & Deployment

### Supported Networks

| Network | Type | Chain ID | RPC | Status |
|---------|------|----------|-----|--------|
| Sepolia | Testnet | 11155111 | Infura/Alchemy | ✅ Deployed |
| Amoy | Testnet (Polygon) | 80002 | -- | ⏳ Planned |
| Mainnet | -- | 1 | -- | ❌ Not yet |

### Deployed Addresses (Sepolia)

```typescript
// lib/contracts.ts
export const EAS_ADDRESS = "0x...";
export const ATTESTER_ADDRESS = "0x...";
export const SBT_ADDRESS = "0x...";
```

**To update after deployment**:
1. Deploy contracts with `forge script`
2. Update `.env.local` with new addresses
3. Rebuild frontend

---

## Performance Optimizations

### 1. Batch Read Calls

**Problem**: Loading dashboard makes ~20 eth_calls sequentially.

**Solution**: `useReadContracts` batches all reads into single RPC:

```typescript
const { data: attestationDetails } = useReadContracts({
  contracts: attestationUIDs.map(uid => ({
    address: EAS_ADDRESS,
    abi: EAS_ABI,
    functionName: "getAttestation",
    args: [uid],
  })),
  // Sends all in one multicall
});
```

### 2. Conditional Query Enabling

```typescript
useReadContract({
  queryFn: () => contract.balanceOf(address),
  queryKey: ["balance", address],
  enabled: isConnected && !!address, // Only runs when wallet connected
});
```

### 3. JSON.parse Caching

**Problem**: `JSON.parse(zkProof.raw)` called on every render.

**Solution**: Memoize:
```typescript
const parsedProof = useMemo(() => {
  if (!zkProof) return null;
  return JSON.parse(zkProof.raw);
}, [zkProof]);
```

### 4. Intersection Observer

**Problem**: All sections animate on load → jank.

**Solution**: Only animate when in viewport:
```typescript
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
      }
    });
  },
  { threshold: 0.1 }
);
```

### 5. Three.js Optimization

- Particles: 200 desktop / 50 mobile
- `frustumCulled: true`
- `BufferGeometry` reused, not recreated
- `useFrame` only updates shader uniforms

---

## Error Handling

### Error Boundaries

**Global**: Next.js error boundary (`app/error.tsx`) for unexpected crashes.

**Component-level**:
```typescript
try {
  const score = await runAudit();
} catch (error) {
  setTxStatus({
    status: "error",
    message: error instanceof Error ? error.message : "Unknown error",
  });
}
```

### Reclaim Errors

**Handled in `ReclaimService`**:
- Session creation fails → `onError()`
- Proof polling timeout → `onError()` after 5min
- Proof verification fails → `onError()`

**User feedback**: `TxStatus` component displays error with retry button.

### Contract Errors

**Reverted transactions**:
```typescript
try {
  await writeContractAsync({ ... });
} catch (error) {
  if (error.message.includes("user rejected")) {
    setTxStatus({ status: "error", message: "Transaction rejected" });
  } else if (error.message.includes("insufficient funds")) {
    setTxStatus({ status: "error", message: "Insufficient ETH for gas" });
  } else {
    setTxStatus({ status: "error", message: "Transaction failed" });
  }
}
```

---

## Testing Strategy

### Unit Tests (Contracts)

```bash
cd contracts
forge test -vvv
```

**Test coverage**:
- `SilentLedgerAttester.t.sol`: submitProof, submitOracleProof, edge cases
- `CertificationSBT.t.sol`: mint, getCertification, onlyAttester
- `GhostVerifier.t.sol`: verify valid/invalid proofs

**Mocks**:
- `MockEAS.sol` - Simulates EAS contract
- `MockReclaimVerifier.sol` - Simulates ghost verifier

---

### Frontend Tests (TODO)

```bash
cd frontend
npm run test
```

**Planned coverage**:
- `TrustWheel.test.tsx`: renders correct score, animation
- `SilentProofBadge.test.tsx`: decodes platformId correctly
- `ReclaimService.test.ts`: proof parsing, error handling
- `useTrustScore.test.ts`: score calculation edge cases

---

### E2E Tests (TODO)

Using Playwright:

```typescript
test("full audit flow", async ({ page }) => {
  // 1. Connect wallet
  await page.click('[data-testid="connect-wallet"]');
  // 2. Verify GitHub
  await page.click('[data-testid="verify-github"]');
  // 3. Wait for proof (mock in test)
  // 4. Submit on-chain
  await page.click('[data-testid="submit-onchain"]');
  // 5. Run audit
  await page.click('[data-testid="run-audit"]');
  // 6. Save score
  await page.click('[data-testid="save-score"]');
  // 7. Verify SBT minted
  await expect(page.locator('[data-testid="sbt-list"]')).toHaveCount(1);
});
```

---

## Environment Variables

### Frontend (`.env.local`)

```env
# Required
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=
NEXT_PUBLIC_RECLAIM_APP_ID=
NEXT_PUBLIC_EAS_ADDRESS=
NEXT_PUBLIC_ATTESTER_ADDRESS=
NEXT_PUBLIC_SBT_ADDRESS=
NEXT_PUBLIC_GEMINI_API_KEY=

# Optional (defaults to Sepolia)
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/...
NEXT_PUBLIC_AMOY_RPC_URL=
NEXT_PUBLIC_ENABLE_ANALYTICS=false

# Feature flags
NEXT_PUBLIC_ENABLE_FARCASTER=true
NEXT_PUBLIC_ENABLE_AUDIT=true
```

### Contracts (`.env`)

```env
SEPOLIA_RPC_URL=
AMOY_RPC_URL=
PRIVATE_KEY=             # Deployer key
ORACLE_PRIVATE_KEY=     # AI audit signing key
GITHUB_TOKEN=           # For API rate limit bypass
RECLAIM_APP_ID=         # Reclaim Protocol app ID
ETHERSCAN_API_KEY=
```

---

## Infrastructure

### Hosting

- **Frontend**: Vercel (automatic deployments on push to main)
- **Contracts**: Ethereum Sepolia testnet
- **API**: Vercel Serverless Functions (same as frontend)

### CDN

- **Assets**: Vercel Edge Network
- **Fonts**: Google Fonts
- **Icons**: Lucide (SVG inline, no CDN)

### Monitoring

- **Errors**: Sentry (to be added)
- **Analytics**: PostHog (anonymized, opt-in)
- **Uptime**: UptimeRobot (ping `/api/health`)

---

## Build & Deploy Pipeline

### Contracts

```bash
cd contracts

# Install dependencies
forge install
npm install

# Build
forge build

# Test
forge test -vv

# Coverage (optional)
forge coverage --report lcov

# Deploy to Sepolia
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast
```

### Frontend

```bash
cd frontend

# Install
npm ci

# Lint
npm run lint

# Dev
npm run dev

# Build
npm run build

# Preview production build
npm run start

# Deploy (Vercel CLI)
vercel --prod
```

---

## Conventions de Code

### TypeScript

- Strict mode enabled
- No `any` types (use `unknown` then narrow)
- explicit return types on public functions
- Interfaces over types for objects

### Solidity

- ^0.8.20
- NatSpec comments on all public functions
- Check-effects-interactions pattern
- Reentrancy guard on external calls
- Custom errors over require strings

### React

- Functional components + hooks only
- No class components
- No inline event handlers (pass named functions)
- Use `useCallback` for event handlers passed to children
- Use `useMemo` for expensive calculations

---

## Glossary

| Term | Definition |
|------|------------|
| zkTLS | Zero-knowledge proofs of TLS connections (Reclaim Protocol) |
| EAS | Ethereum Attestation Service - standard for on-chain attestations |
| SBT | Soul-Bound Token - non-transferable NFT (ERC-5192) |
| Attestation | Cryptographic statement about a subject (EAS) |
| Oracle | Off-chain data source that signs data for on-chain use |
| Replay Attack | Using same proof/signature multiple times |
| GhostVerifier | Contract that verifies zkSNARK proofs |
| Trust Score | 0-100 score combining platform verifications + SBTs |
| SilentLedger Attester | Main contract managing attestations |

---

**Document Version**: 1.0
**Last Updated**: 2026-02-21
**Maintained By**: SilentLedger Team
