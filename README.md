# Silent Ledger

> **Proof of Intelligence** - Transform your Web2 contributions into anonymous on-chain attestations via zkTLS

SilentLedger is an innovative Web3 platform that allows you to transform your digital contributions and reputations (GitHub, social networks, etc.) into verifiable blockchain attestations while preserving your privacy. By using zero-knowledge proof (ZK) technologies and the Ethereum Attestation Service (EAS), SilentLedger offers a new form of skill proof: **Proof of Knowledge, not Proof of Stake**.

![Logo](frontend/public/logo.png)

## ✨ Key Features

### 🎯 Multi-Platform Verification
- **GitHub**: AI-powered code quality audit + contribution verification
- **X / Twitter**: Social identity verification
- **LinkedIn**: Professional certification
- **Farcaster**: Web3 social reputation verification

### 🔐 Privacy & Anonymity
- **zkTLS**: Zero-knowledge proofs of your data without exposure
- **Reclaim Protocol**: Secure cryptographic proof generation
- **EAS Attestations**: Standardized, verifiable on-chain certifications

### 🤖 Artificial Intelligence
- **Automated Audit**: GitHub code quality analysis with Google Gemini
- **Reputation Score**: Objective scoring based on metrics
- **SBT Certifications**: Non-transferable soul-bound badges for achievements

### 📊 Interactive Dashboard
- **TrustWheel**: Visual representation of your overall trust score
- **Tabbed Navigation**: Overview, legitimacy, audit, attestations
- **On-Chain Tracking**: Immutable history of all certifications

## 🏗️ Architecture

```
SilentLedger/
├── frontend/          # Next.js Application (TypeScript + Tailwind CSS)
│   ├── app/          # Pages and routes (Dashboard, Onboarding, etc.)
│   ├── components/   # UI Components (Badges, TrustWheel, etc.)
│   ├── lib/          # Configurations (contracts, i18n, etc.)
│   ├── services/     # Services (Reclaim, EAS, etc.)
│   └── providers/    # Context providers (Web3, Language)
├── contracts/        # Solidity Smart Contracts (Foundry)
│   ├── src/          # Main contracts
│   ├── test/         # Unit and integration tests
│   ├── script/       # Deployment scripts
│   └── circom/       # ZK Circuits (for zkTLS)
└── package/          # Internal NPM packages
```

## 🚀 Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Static typing
- **Tailwind CSS** - Utility-first CSS framework
- **Wagmi + Viem** - Ethereum connection and interaction
- **RainbowKit** - Wallet connect UI
- **Three.js** - 3D animations and visual effects
- **React Query** - Server state management
- **shadcn/ui** - Reusable UI components

### Blockchain & Web3
- **Solidity** - Smart contract language
- **Foundry** - Ethereum development toolkit
- **EAS (Ethereum Attestation Service)** - Attestation standard
- **Reclaim Protocol** - zkTLS for private proofs
- **snarkjs** - Client-side SNARK library

### Artificial Intelligence
- **Google Gemini** - Code analysis and scoring
- **Custom Oracle** - Audit score signatures

### Security & Cryptography
- **Lit Protocol** - Decentralized encryption
- **circom** - ZK circuits for zero-knowledge proofs
- **secp256k1** - Cryptographic signatures

## 📦 Installation & Configuration

### Prerequisites
- **Node.js** 18+
- **pnpm** or **npm**
- **Git**
- **Foundry** (for contracts)

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/SilentLedger.git
cd SilentLedger
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp frontend/.env.local.backup frontend/.env.local
cp contracts/.env.example contracts/.env
```

Edit the `.env` files with your own values:
- `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`
- `NEXT_PUBLIC_RECLAIM_APP_ID`
- `NEXT_PUBLIC_EAS_ADDRESS`
- Google Gemini API keys
- Deployed contract addresses

### 3. Install Dependencies

```bash
# Frontend
cd frontend
npm install

# Contracts
cd ../contracts
npm install
```

### 4. Compile Contracts

```bash
cd contracts
forge build
```

### 5. Start Development

```bash
cd frontend
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## 🧪 Testing

### Frontend
```bash
cd frontend
npm run lint
```

### Smart Contracts
```bash
cd contracts
forge test
```

### Coverage
```bash
cd contracts
forge coverage
```

## 🗄️ Smart Contract Structure

### `SilentLedgerAttester.sol`
Main contract managing EAS attestations. Allows:
- Submitting zkTLS proofs
- Submitting oracle proofs (AI audit)
- Reading user attestations

### `CertificationSBT.sol`
Soul-Bound Token (ERC-5192) for certifications:
- Non-transferable badges
- Certification metadata
- Proof of acquisition

### `GhostVerifier.sol`
Zero-knowledge proof verifier:
- Reclaim Protocol integration
- ZK circuit verification

## 🔧 Usage Workflow

### 1. Wallet Connection
User connects wallet via RainbowKit (MetaMask, Coinbase Wallet, etc.)

### 2. Platform Verification (zkTLS)
- Select platform (GitHub, X, LinkedIn, Farcaster)
- Generate zkTLS proof via Reclaim Protocol
- Scan QR code with Reclaim mobile app
- Client-side proof signing

### 3. On-Chain Submission
- ZK proof submitted to `SilentLedgerAttester` contract
- EAS attestation created immutably
- User receives corresponding badge

### 4. AI Audit (GitHub)
- GitHub authentication verified
- Automatic repository analysis by Gemini
- Oracle signature generation
- SBT certification creation

## 🌐 Supported Networks

| Network | Environment | Attester Contract | EAS Address |
|---------|-------------|-------------------|-------------|
| Sepolia | Testnet | `0x...` | `0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC` |
| Amoy | Polygon Testnet | `0x...` | To be deployed |

## 📋 Environment Variables

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_RECLAIM_APP_ID=your_reclaim_app_id
NEXT_PUBLIC_EAS_ADDRESS=0x...
NEXT_PUBLIC_SILENT_LEDGER_ADDRESS=0x...
NEXT_PUBLIC_SBT_ADDRESS=0x...
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key
```

### Contracts (`contracts/.env`)
```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/...
PRIVATE_KEY=0x...  # For deployment
```

## 🔍 API Routes

### `POST /api/github-audit`
Launches a GitHub code audit with AI analysis.

**Request:**
```json
{
  "username": "github_username",
  "address": "0x_wallet_address"
}
```

**Response:**
```json
{
  "score": 85,
  "summary": "Code well-structured with comprehensive tests...",
  "totalStars": 2450,
  "signatureData": {
    "signature": "0x...",
    "data": {
      "recipient": "0x...",
      "competenceName": "Open Source Contributor",
      "level": 3,
      "examScore": 85,
      "proofOfWorkURL": "https://github.com/...",
      "studentId": "0x...",
      "deadline": 1735689600
    }
  }
}
```

## 🤝 Contribution

We welcome contributions! Please read our [guidelines](CONTRIBUTING.md) before submitting a PR.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## 🔗 Resources

- **Documentation**: [docs.silentledger.io](https://docs.silentledger.io)
- **Website**: [silentledger.io](https://silentledger.io)
- **EAS Documentation**: [docs.easscan.org](https://docs.easscan.org)
- **Reclaim Protocol**: [docs.reclaimprotocol.org](https://docs.reclaimprotocol.org)
- **Foundry Book**: [book.getfoundry.sh](https://book.getfoundry.sh/)

## 🙏 Acknowledgments

- [Ethereum Attestation Service](https://easscan.org) for the attestation standard
- [Reclaim Protocol](https://reclaimprotocol.org) for zkTLS
- [Google Gemini](https://gemini.google.com) for AI
- [Vercel](https://vercel.com) for hosting
- [OpenZeppelin](https://openzeppelin.com) for contracts libraries

---

**Built with ❤️ by the SilentLedger Team**
