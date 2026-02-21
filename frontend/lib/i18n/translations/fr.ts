export const fr = {
  common: {
    appName: "Silent Ledger",
    launching: "Lancement…",
    loading: "Chargement…",
    verified: "Vérifié",
    error: "Erreur",
    success: "Succès",
    pending: "En cours",
    signing: "Signature...",
  },

  profile: {
    title: "Profil",
    subtitle: "Entrez n'importe quelle adresse de portefeuille Ethereum pour inspecter leurs Silent Proofs on-chain.",
    errors: {
      required: "Veuillez entrer une adresse de portefeuille.",
      invalid: "Adresse Ethereum invalide.",
    },
    connectedWallet: "Portefeuille connecté détecté",
    viewMyProfile: "Voir mon profil",
    paste: "Coller",
    clear: "Effacer",
    search: "Rechercher",
    placeholder: "0x… adresse du portefeuille",
    validAddress: "Adresse Ethereum valide",
    loading: "Chargement...",
    silentProofs: "Silent Proofs",
    etherscan: "Voir sur Etherscan",
    viewOnEtherscan: "Voir sur Etherscan",
    copyAddress: "Copier l'adresse",
    noProofsTitle: "Aucun Silent Proof Trouvé",
    noProofsDesc: "Cette adresse n'a pas encore créé de Silent Proofs. Commencez en connectant un portefeuille et en prouvant un compte dans le tableau de bord.",
    hasSBTs: "Certifications Trouvées",
    sbtOnlyDesc: "Cette adresse a des certifications on-chain mais pas de Silent Proofs récents.",
    certifications: "Certifications",
    attestations: "Attestations",
    tokenId: "Token ID",
    certifiedBadge: "Badge Certifié",
  },

  header: {
    security: "Sécurité",
    privacy: "Confidentialité",
    explorer: "Explorer",
    portal: "Portail",
    launchApp: "Lancer l'App",
  },

  footer: {
    tagline:
      "Preuve d'intelligence construite sur l'Ethereum Attestation Service (EAS). Transformez votre réputation Web2 en puissance vérifiable et anonyme on-chain via zkTLS.",
    protocol: "Protocole",
    developers: "Développeurs",
    resources: "Ressources",
    smartContracts: "Smart Contracts",
    documentation: "Documentation",
    githubRepo: "Dépôt GitHub",
    security: "Sécurité",
    privacy: "Confidentialité",
    rights: "Tous droits réservés.",
    operational: "Opérationnel - Sepolia",
  },

  contracts: {
    title: "Contrats Intelligents",
    subtitle:
      "Explorez les contrats intelligents qui font fonctionner Silent Ledger. Tous les contrats sont vérifiés sur Etherscan et open-source.",
    network: "Réseau de Test Sepolia",
    notDeployed: "Non déployé",
    viewOnEtherscan: "Voir sur Etherscan",
    copyAddress: "Copier l'adresse",
    abiExport: "Export ABI",
    keyFunctions: "Fonctions Principales",
    integrationTitle: "Intégration",
    integrationDesc:
      "Intégrez Silent Ledger dans votre application en utilisant les ABI ci-dessus ou la bibliothèque officielle.",
    viewDocs: "Voir la documentation",
    viewGitHub: "Voir GitHub",
    attesterName: "SilentLedgerAttester",
    attesterDesc: "Contrat principal qui émet les attestations de réputation. Accepte les proofs zk-SNARK et soumet les attestations via EAS.",
    sbtName: "CertificationSBT",
    sbtDesc: "Soulbound Token (ERC-5192) pour les certifications. Les badges sont non-transférables et liés à vie au wallet qui les a reçus.",
    easName: "EAS",
    easDesc: "Service d'attestation standardisé sur Ethereum. Stocke toutes les attestations de manière vérifiable et immuable.",
  },

  docs: {
    title: "Documentation",
    subtitle:
      "Explorez la documentation technique, les guides d'architecture et les références de contrats intelligents pour Silent Ledger.",
    contributeTitle: "Contribuer",
    contributeDesc:
      "Quelque chose manque ? Aidez à améliorer la documentation ou contribuez au projet sur GitHub.",
    viewOnGitHub: "Voir sur GitHub",
  },

  enter: {
    loading: "Chargement…",
    connectionRequired: "Connexion requise",
    verifyingIdentity: "Vérification de votre identité souveraine en cours…",
    connectWallet: "Connectez votre portefeuille pour accéder à Silent Ledger.",
    connectWalletButton: "Connecter le portefeuille",
  },

  launchOverlay: {
    title: "ACCÈS.",
    subtitle: "Sélectionnez votre point d'entrée.",
    portal: {
      title: "Portail",
      description:
        "Accédez à votre identité souveraine et vos tableaux de bord privés.",
      cta: "Réclamer l'identité",
    },
    explorer: {
      title: "Explorer",
      description:
        "Parcourez le registre immuable des vérifications anonymes.",
      cta: "Rechercher",
    },
  },

  home: {
    badge: "Réseau de Souveraineté Numérique",
    heroTitle1: "LA RÉVOLUTION",
    heroTitle2: "SILENCIEUSE.",
    heroSubtitle1: "Vos contributions. Votre réputation.",
    heroSubtitle2: "Totalement Anonyme.",
    cta: "Commencer",
    problemTitle1: "LA RÉPUTATION EST",
    problemTitle2: "PRISONNIÈRE.",
    problem1:
      "Chaque jour, vous contribuez au pool mondial de connaissances. Sur GitHub, Discord, Slack. Vous créez de la valeur, mais",
    problem1Bold: "vous n'en êtes pas propriétaire.",
    problem2:
      "Pour prouver votre expertise, vous devez exposer votre identité, votre historique et vos tokens privés. Vous êtes forcé de choisir entre",
    problem2Verification: "Vérification",
    problem2And: "et",
    problem2Privacy: "Vie Privée.",
    solutionTitle1: "LA RÉPONSE",
    solutionTitle2: "SILENCIEUSE.",
    solutionDesc:
      "Silent Ledger utilise zkTLS pour relier votre réputation Web2 à la chaîne sans jamais voir vos secrets. Vérifiable. Anonyme. Souverain.",
    solutionCta: "Rejoindre le Protocole",
    stats: {
      zktls: { label: "zkTLS", sub: "Technologie MPC-TLS" },
      eas: { label: "EAS", sub: "Standards Mondiaux" },
      private: { label: "100%", sub: "Privé" },
      storage: { label: "0", sub: "Stockage" },
    },
  },

  onboarding: {
    steps: [
      { id: 1, label: "Connectez votre wallet" },
      { id: 2, label: "Prouvez un compte" },
      { id: 3, label: "Bienvenue sur le dashboard" },
    ],
    subtitle:
      "Prouvez au moins un compte pour créer votre identité souveraine anonyme.",
    subtitleNote: "Aucune donnée personnelle n'est stockée.",
    authTitle: "Authentification",
    authDesc:
      "Un portefeuille Web3 est requis pour chiffrer et stocker vos preuves.",
    connectWallet: "Connecter mon portefeuille",
    selectPlatform: "Sélectionnez une plateforme",
    selectPlatformDesc:
      "Prouvez la possession de votre compte de manière anonyme via zkTLS.",
    generating: "Génération ZK",
    prove: "Prouver",
    securedTitle: "Identité Sécurisée !",
    securedDesc: "Vos preuves sont ancrées. Redirection en cours…",
    scanTitle: "Scannez pour prouver",
    scanDesc:
      "Utilisez l'application Reclaim pour générer la preuve ZK de votre compte.",
    sessionActive: "Session active…",
    zkReady: "Preuve ZK prête !",
    score: "Score",
    pts: "pts",
    createId: "Créer mon ID On-Chain",
    anchoring: "Ancrage…",
    successTitle: "Vérification Validée",
    successDesc:
      "Votre identité a été ancrée avec succès. Bienvenue on-chain.",
    footerNote:
      "Minimum 1 compte prouvé requis pour accéder à l'écosystème. Le processus est cryptographiquement sécurisé et préserve votre anonymat.",
    txMessages: {
      signing: "Signature de la transaction…",
      created: "Attestation créée ! UID :",
      failed: "Transaction échouée",
      saving: "Sauvegarde du score on-chain…",
      saved: "Score sauvegardé ! UID :",
      saveError: "Erreur de sauvegarde",
    },
  },

  dashboard: {
    tabs: {
      overview: "Aperçu",
      legitimacy: "Légitimité",
      audit: "Audit Code",
      attestations: "Attestations",
    },
    overview: {
      subtitle: "Votre réputation est maintenant ancrée",
      subtitleBold: "totalement anonyme.",
      stats: {
        silentProofs: "Silent Proofs",
        credentials: "Certifications",
        status: "Statut",
        network: "Réseau",
        verified: "Vérifié",
      },
    },
    legitimacy: {
      eyebrow: "Moteur de Réputation",
      title: "Boostez votre légitimité.",
      platforms: {
        github: "Vérifiez vos contributions anonymement.",
        x: "Prouvez votre influence sociale.",
        linkedin: "Certifiez votre carrière professionnelle.",
        farcaster: "Prouvez votre identité décentralisée.",
      },
      verified: "Vérifié",
      proveAccount: "Prouver le compte",
    },
    audit: {
      eyebrow: "Audit IA",
      title: "Qualité du code certifiée.",
      desc: "Évaluez la qualité de code d'un compte GitHub de façon respectueuse de la vie privée. L'IA analyse les métadonnées publiques pour attribuer un score de qualité sans jamais lire le code source privé.",
      blockchainHistory: "Historique Blockchain",
      lastCertified: "Dernier audit certifié le",
      noScore: "Aucun score de qualité de code n'est enregistré sur la blockchain pour le moment.",
      requireAction: "Action requise",
      requireDesc:
        "Pour garantir l'authenticité de l'audit et préserver votre vie privée, vous devez prouver que vous possédez le compte GitHub à analyser. Cette vérification est requise à chaque nouvelle session.",
      verifyGithub: "Vérifier mon GitHub via Reclaim",
      githubAuthenticated: "Compte GitHub authentifié",
      placeholder: "Pseudo GitHub…",
      analyze: "Analyser",
      qualityScore: "Score de Qualité",
      aiAnalysis: "Analyse par IA",
      totalStars: "Total d'étoiles accumulées",
      save: "Sauvegarder on-chain",
      saved: "Sauvegardé",
    },
    attestations: {
      title: "Vos Badges de Preuve Silencieuse",
      noProofs: "Aucune preuve pour l'instant",
      noProofsDesc:
        "Rendez-vous dans l'onglet Légitimité pour tamponner votre premier compte.",
      certifications: "Certifications",
      noCerts: "Aucune certification pour l'instant.",
      attestationHistory: "Historique des attestations.",
      connectToView: "Connectez-vous pour voir l'historique.",
      noAttestation: "Aucune attestation on-chain trouvée pour cette adresse.",
    },
    proofModal: {
      title: "Attestation",
      proofReady: "Preuve générée",
      submitChain: "Soumettre on-chain",
      anchorSuccess: "Ancrage Réussi",
      immutableDesc: "Votre identité",
      isNowImmutable: "est maintenant immuable.",
      verifying: "Vérification en cours",
      scanQr: "Scannez le QR Code avec votre téléphone pour générer une preuve zkTLS sécurisée.",
      waitingMobile: "En attente du mobile...",
      proofGenerated: "Preuve ZK générée !",
      alreadyAnchored: "Identité vérifiée. Vous l'avez déjà ancrée on-chain !",
      unlockAudit: "Débloquer l'Audit IA",
      readyToAnchor: "Votre identité est prête à être ancrée on-chain.",
      anchorChain: "Ancrer on-chain",
      detectedScore: "Score Détecté",
    },
  },

  security: {
    badge: "Architecture Sécurité",
    title1: "POURQUOI LA",
    title2: "FALSIFICATION",
    title3: "EST IMPOSSIBLE.",
    subtitle:
      "La sécurité ici n'est pas une configuration ni une politique. C'est une conséquence des mathématiques. Cette page explique la chaîne de garanties — et l'unique hypothèse honnête à sa base.",
    guaranteeChain: "Chaîne de Garanties",
    guarantees: [
      { step: "01", label: "zkTLS", claim: "La réponse TLS est authentique.", basis: "Signature à seuil MPC sur la session TLS" },
      { step: "02", label: "Circuit", claim: "La demande satisfait les 4 contraintes.", basis: "Complétude Groth16 — témoin valide ↔ preuve valide" },
      { step: "03", label: "Poseidon", claim: "Les engagements et nullifiers ne peuvent pas être inversés.", basis: "Résistance à la préimage sur le corps premier BN128" },
      { step: "04", label: "Nullifier", claim: "Le même justificatif ne peut pas être soumis deux fois.", basis: "Hash déterministe stocké on-chain, revert en cas de collision" },
      { step: "05", label: "Vérificateur", claim: "Seule une preuve valide ouvre la porte du contrat.", basis: "Vérificateur Solidity généré depuis la clé de preuve, sans chemin admin" },
      { step: "06", label: "SBT", claim: "La réputation ne peut être transférée ni vendue.", basis: "Transfert ERC-5192 verrouillé au niveau du contrat" },
    ],
    sections: [
      {
        id: "groth16",
        label: "Groth16 / zk-SNARK",
        heading: "Des preuves soit valides, soit impossibles à falsifier.",
        body: [
          "Chaque badge de réputation sur Silent Ledger est soutenu par un Groth16 zk-SNARK — un Argument de Connaissance Sucinct Non-interactif à Connaissance Zéro. Les mathématiques sous-jacentes opèrent sur la courbe elliptique BN128, la même construction utilisée dans les précompilations EIP-197 d'Ethereum.",
          "Une preuve Groth16 a une taille fixe de 3 points de courbe elliptique (~128 octets) quelle que soit la complexité du circuit. Un vérificateur peut la contrôler en temps constant. Plus important encore : générer une preuve valide sans satisfaire chaque contrainte du circuit est computationnellement équivalent à résoudre le problème du logarithme discret sur BN128 — une tâche sans algorithme polynomial connu.",
          "Le circuit GhostIdentity impose 4 contraintes simultanément. Si l'une seule échoue — mauvais hash, score en dessous du seuil, valeur hors plage — le prouveur ne peut pas produire de preuve valide. Le vérificateur on-chain (Groth16Verifier.sol) appelle revert sur toute preuve invalide, ne coûtant à l'attaquant que du gas.",
        ],
        code: [
          "(1)  identityCommitment = Poseidon(usernameHash, salt)",
          "(2)  nullifier          = Poseidon(usernameHash, platformId, reclaimId)",
          "(3)  reputationScore   ≥ reputationThreshold",
          "(4)  reputationScore   <  2³²",
        ],
      },
      {
        id: "poseidon",
        label: "Hash Poseidon",
        heading: "Une fonction de hachage conçue pour la connaissance zéro.",
        body: [
          "Les fonctions de hachage standard comme SHA-256 ou keccak256 nécessitent des dizaines de milliers de contraintes R1CS lorsqu'elles sont encodées dans un circuit ZK. Cela augmente le temps de génération des preuves, l'utilisation mémoire et la taille de la configuration de confiance. Silent Ledger utilise Poseidon — une fonction de hachage algébrique conçue spécifiquement pour l'arithmétique sur les corps premiers.",
          "Poseidon fonctionne ~100× plus efficacement dans un circuit ZK que SHA-256. L'identityCommitment et le nullifier sont tous deux des hachages Poseidon. Ils sont résistants aux collisions sous les mêmes hypothèses de dureté que la courbe : trouver deux entrées produisant le même condensé nécessite de résoudre un problème équivalent au logarithme discret.",
          "La conception de Poseidon a été analysée indépendamment et déployée en production par Zcash, Aztec, StarkWare et des chercheurs Ethereum. Ce n'est pas de la cryptographie expérimentale — c'est le standard ZK actuel.",
        ],
      },
      {
        id: "nullifier",
        label: "Nullifier Anti-rejeu",
        heading: "Le même justificatif ne peut jamais être soumis deux fois.",
        body: [
          "Chaque attestation produit un nullifier — un hash déterministe dérivé du hash du nom d'utilisateur, de l'identifiant de plateforme, et du reclaimIdentifier (l'empreinte unique attribuée par les attesteurs MPC de Reclaim à une session TLS spécifique). Le smart contract stocke chaque nullifier consommé et annule tout doublon.",
          "Le reclaimIdentifier est calculé à partir des paramètres intrinsèques de la requête HTTPS — URL, correspondance regex, horodatage de réponse. Il est identique pour la même contribution sous-jacente, quel que soit le soumetteur. Cela signifie que deux wallets différents soumettant la même contribution GitHub produisent exactement le même nullifier, et seule la première soumission réussit.",
          "Cette conception ferme deux vecteurs d'attaque simultanément : un utilisateur unique ne peut pas collecter plusieurs badges à partir d'une contribution réelle, et le nullifier lui-même ne révèle rien — c'est un hash Poseidon de valeurs privées, résistant à la préimage.",
        ],
      },
      {
        id: "contract",
        label: "Smart Contract",
        heading: "Vérification on-chain sans intermédiaire de confiance.",
        body: [
          "GhostVerifier.sol est la seule entité qui émet des attestations. Il n'accepte pas d'entrée humaine, de signatures d'opérateur, ni de substitutions admin. Le seul chemin pour créer une attestation Ghost est une preuve Groth16 valide — vérifiée de manière déterministe par le vérificateur Solidity généré directement depuis la clé de preuve.",
          "Le contrat impose trois portes séquentielles : (1) la preuve Groth16 est cryptographiquement valide, (2) le nullifier n'a pas été utilisé auparavant, (3) EAS stocke l'attestation. Un échec à n'importe quelle porte annule toute la transaction. Il n'y a pas de solution de repli, pas de sortie de secours, pas de contournement admin.",
          "Les badges sont émis comme des Soulbound Tokens non-transférables sous ERC-5192. La fonction de transfert est verrouillée en permanence au niveau du contrat. La réputation ne peut être vendue, déléguée ou déplacée. Elle est liée cryptographiquement au wallet qui a généré la preuve.",
        ],
      },
      {
        id: "trusted-setup",
        label: "Configuration de Confiance",
        heading: "La seule hypothèse — et comment elle est gérée.",
        body: [
          "Groth16 nécessite une cérémonie de configuration de confiance unique (Powers of Tau) pour générer la clé de preuve et la clé de vérification. Si une seule partie contrôlait toute la cérémonie et conservait les déchets toxiques (l'aléatoire utilisé pendant la configuration), elle pourrait générer des preuves valides pour de fausses affirmations sans satisfaire les contraintes du circuit.",
          "Le déploiement actuel utilise une cérémonie Powers of Tau publique à 2^17 contraintes — la cérémonie de contribution du réseau Hermez, qui a impliqué des centaines de participants indépendants du monde entier. Les déchets toxiques sont détruits tant qu'au moins un participant a été honnête. Un seul contributeur honnête suffit.",
          "Le code source du circuit, le R1CS, le générateur de witness WASM, le .zkey final et la clé de vérification on-chain sont tous publiés. N'importe qui peut re-exécuter la vérification : compiler le circuit depuis les sources, ré-exporter le vérificateur Solidity et le comparer octet par octet avec le contrat déployé.",
        ],
      },
      {
        id: "attack-surface",
        label: "Surface d'Attaque",
        heading: "Ce qui pourrait mal tourner — dit clairement.",
        body: [
          "Rupture cryptographique contre le logarithme discret BN128 : compromettrait l'ensemble du système zk-SNARK. Aucune attaque pratique n'est connue ; la courbe est utilisée en production par Ethereum lui-même. C'est l'hypothèse fondamentale sur laquelle repose tout le domaine.",
          "Compromission du MPC Reclaim : si tous les nœuds attesteurs de la session zkTLS conspirent, ils pourraient fabriquer une fausse réponse TLS. Cela permettrait à quelqu'un de prouver un score de réputation qu'il n'a pas. La conception MPC de Reclaim nécessite une collusion totale — aucun sous-ensemble de nœuds n'est suffisant. Cette attaque est hors du champ de la cryptographie propre de Silent Ledger.",
          "Compromission de la clé du wallet : si un attaquant vole votre clé privée, il peut soumettre des preuves en votre nom — mais uniquement pour des contributions que vous avez réellement effectuées, car le circuit impose que la demande soit réelle. Votre réputation ne peut pas être gonflée par un voleur de clé. Elle peut seulement être utilisée, pas forgée.",
          "Substitution de frontend : un frontend malveillant pourrait afficher de fausses données ou router des transactions vers un contrat différent. C'est pourquoi l'adresse du contrat et l'ABI sont publiés. Vérifiez-les avant de connecter votre wallet. Le protocole est sécurisé ; la page que vous lisez n'est pas dans ce modèle de confiance.",
        ],
      },
    ],
  },

  privacy: {
    badge: "Architecture Vie Privée",
    title1: "COMMENT LA",
    title2: "VIE PRIVÉE",
    title3: "FONCTIONNE.",
    subtitle:
      "Ce n'est pas une politique de confidentialité. C'est une explication technique de pourquoi ce système ne peut pas compromettre votre identité — même s'il le voulait.",
    summaryLabel: "Résumé",
    summaryTitle: "Votre secret ne se déplace jamais.",
    summaryTitleFaded: "Seulement la preuve.",
    summaryBody:
      "zkTLS prouve que les données sont authentiques. Le circuit ZK prouve l'affirmation sans révéler les données. Le SBT enregistre la preuve sans stocker l'affirmation. À aucun moment un justificatif privé ne quitte votre contrôle.",
    sections: [
      {
        id: "zktls",
        label: "zkTLS",
        heading: "Vos identifiants ne quittent jamais votre appareil.",
        body: [
          "Les systèmes de réputation traditionnels vous demandent de prouver qui vous êtes en remettant des cookies de session, des tokens OAuth ou des clés API. Ces secrets sont envoyés à un serveur tiers, journalisés et stockés. Vous n'avez aucune idée de ce qui leur arrive ensuite.",
          "Silent Ledger utilise zkTLS — un protocole cryptographique construit au-dessus de la poignée de main TLS standard. Lorsque votre navigateur communique avec GitHub, Discord ou toute autre plateforme, nous n'interceptons rien. À la place, un cluster de Calcul Multi-Parties (MPC) agit comme co-signataire dans la session TLS : il peut attester que les données reçues sont authentiques, sans jamais en voir le contenu.",
          "Le résultat est une preuve cryptographique. Pas une copie de vos données — une déclaration mathématique disant « cette réponse provient authentiquement de ce serveur ». Cette preuve va on-chain. Votre token reste sur votre machine.",
        ],
      },
      {
        id: "zk-circuit",
        label: "Circuits ZK",
        heading: "Ce qui est prouvé, et rien de plus.",
        body: [
          "Même après que la couche TLS est vérifiée, vous contrôlez toujours ce que vous divulguez. L'attestation brute contient votre nom d'utilisateur, les compteurs de contributions, les métadonnées du compte, et plus encore. Rien de tout cela ne va on-chain tel quel.",
          "Silent Ledger fait passer l'attestation par un circuit à connaissance zéro — un programme qui peut prouver une affirmation sur des données sans révéler les données elles-mêmes. Le circuit produit un seul bit par affirmation : « cet utilisateur a plus de 50 contributions GitHub » — vrai ou faux. Pas de nom d'utilisateur. Pas d'email. Pas d'identité liée.",
          "Il s'agit d'une divulgation sélective par conception, non par politique. Vous pouvez prouver l'ancienneté sans prouver l'identité, l'expertise sans prouver l'historique d'emploi, et la réputation sans rien prouver sur votre vie personnelle.",
        ],
      },
      {
        id: "on-chain",
        label: "Stockage On-Chain",
        heading: "Ce qui est écrit sur la blockchain — et ce qui ne l'est pas.",
        body: [
          "L'attestation stockée on-chain via EAS (Ethereum Attestation Service) ne contient que la sortie du circuit ZK : une affirmation booléenne, un identifiant de schéma, un horodatage de bloc et un hash de nullifier. Pas de données brutes, pas de texte en clair, pas de champs déchiffrables.",
          "Le nullifier est un hash à sens unique dérivé de votre justificatif. Il empêche le même justificatif d'être soumis deux fois, sans lier l'attestation on-chain à une identité off-chain. Vous pouvez changer de justificatifs, et votre historique on-chain reste séparé.",
          "Les badges sont émis comme Soulbound Tokens (SBTs, ERC-5192). Ils sont non-transférables par protocole. La réputation ne peut être achetée, vendue ou déléguée.",
        ],
      },
      {
        id: "no-storage",
        label: "Zéro Stockage",
        heading: "Nous ne gérons pas de base de données.",
        body: [
          "Silent Ledger n'a pas de backend. Il n'y a pas de serveur qui stocke vos preuves, met en cache vos justificatifs ou trace vos sessions. Les nœuds MPC sont éphémères — ils participent à une seule attestation TLS et suppriment tout état.",
          "L'enregistrement on-chain est le seul artefact persistant. Il est public, auditable et sous votre contrôle. Pas de compte à supprimer. Pas de demande RGPD à déposer. Rien à violer.",
          "Le frontend est une application Next.js statique servie depuis un CDN. Il lit depuis la blockchain et depuis votre wallet local. Il n'écrit rien sur aucun serveur.",
        ],
      },
      {
        id: "threat-model",
        label: "Modèle de Menace",
        heading: "Ce contre quoi nous protégeons — et ce que nous ne prétendons pas.",
        body: [
          "Adversaire intelligent avec accès réseau : ne peut pas récupérer votre token de session depuis la preuve ZK ou l'attestation on-chain. Le protocole MPC est conçu de sorte qu'aucun nœud unique n'apprend la session TLS complète — la compromission requiert la collusion de tous les participants MPC simultanément.",
          "Analyse blockchain : les données on-chain ne contiennent par défaut ni nom d'utilisateur, ni email, ni adresse liée. La corrélation n'est possible que si vous liez volontairement votre wallet à une identité externe — ce qui est hors de notre protocole.",
          "Ce que nous ne promettons pas : si vous liez publiquement votre adresse wallet à votre vrai nom (sur les réseaux sociaux, ENS, etc.), les attestations on-chain deviennent attribuables. La pseudonymité est un outil, pas une garantie. Le protocole vous donne la possibilité d'être anonyme. Ce que vous faites de cette option vous appartient.",
        ],
      },
      {
        id: "open-source",
        label: "Vérifiabilité",
        heading: "Ne nous faites pas confiance. Vérifiez.",
        body: [
          "Les circuits ZK sont publiés et reproductibles. N'importe qui peut compiler le circuit depuis les sources et vérifier que la clé de preuve correspond. Il n'y a pas de contrainte cachée, pas d'entrée dérobée, pas de configuration de confiance appartenant à l'équipe.",
          "Les smart contracts sont vérifiés sur Etherscan. Le schéma d'attestation est public sur EAS. Le code source du frontend est ouvert — vous pouvez lire chaque ligne qui s'exécute dans votre navigateur avant de connecter votre wallet.",
          "La vie privée ne devrait pas être une fonctionnalité de produit. Ce devrait être une propriété prouvable du système.",
        ],
      },
    ],
  },
};
