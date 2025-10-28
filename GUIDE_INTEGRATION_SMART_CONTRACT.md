# Guide d'intégration Frontend - Smart Contract pour DEMOCRATIX

## Table des matières
1. [Vue d'ensemble](#vue-densemble)
2. [Architecture actuelle (Dashboard PingPong)](#architecture-actuelle-dashboard-pingpong)
3. [Comment adapter pour DEMOCRATIX](#comment-adapter-pour-democratix)
4. [Étapes détaillées d'intégration](#étapes-détaillées-dintégration)
5. [Exemples concrets](#exemples-concrets)

---

## Vue d'ensemble

### Qu'est-ce qui se passe quand on clique sur un bouton ?

Quand un utilisateur clique sur un bouton dans le Dashboard (ex: "Ping"), voici le flux complet:

```
[Clic utilisateur]
    ↓
[Composant React]
    ↓
[Hook personnalisé]
    ↓
[Création de la transaction]
    ↓
[Signature par le wallet]
    ↓
[Envoi à la blockchain]
    ↓
[Smart Contract s'exécute]
    ↓
[Résultat affiché à l'utilisateur]
```

---

## Architecture actuelle (Dashboard PingPong)

### 1. Structure des fichiers

```
frontend/src/
├── pages/
│   └── Dashboard/
│       └── widgets/
│           └── PingPongAbi/
│               ├── PingPongAbi.tsx          # Widget UI
│               └── hooks/
│                   └── useGetTimeToPong.ts  # Lecture du SC
├── hooks/
│   └── transactions/
│       └── useSendPingPongTransaction.ts    # Écriture au SC
├── contracts/
│   └── ping-pong.abi.json                   # ABI du smart contract
└── helpers/
    └── signAndSendTransactions.ts           # Signature & envoi
```

### 2. Le fichier ABI (Application Binary Interface)

**Fichier:** `frontend/src/contracts/ping-pong.abi.json`

**Qu'est-ce que c'est ?**
- C'est le "manuel d'instructions" du smart contract
- Il décrit toutes les fonctions disponibles, leurs paramètres et types de retour
- Généré automatiquement lors de la compilation du smart contract Rust

**Contenu exemple:**
```json
{
  "name": "PingPong",
  "endpoints": [
    {
      "name": "ping",
      "mutability": "mutable",
      "payableInTokens": ["EGLD"],
      "inputs": [],
      "outputs": []
    },
    {
      "name": "pong",
      "mutability": "mutable",
      "inputs": [],
      "outputs": []
    },
    {
      "name": "getTimeToPong",
      "mutability": "readonly",
      "inputs": [
        { "name": "address", "type": "Address" }
      ],
      "outputs": [
        { "type": "Option<u64>" }
      ]
    }
  ]
}
```

### 3. Widget React (Interface utilisateur)

**Fichier:** `frontend/src/pages/Dashboard/widgets/PingPongAbi/PingPongAbi.tsx`

```typescript
export const PingPongAbi = () => {
  // Hooks pour lire le smart contract
  const getTimeToPong = useGetTimeToPong();
  const pingAmount = useGetPingAmount();

  // Hooks pour écrire au smart contract
  const { sendPingTransactionFromAbi, sendPongTransactionFromAbi } =
    useSendPingPongTransaction();

  // Gestionnaire du clic sur le bouton "Ping"
  const handlePingTransaction = async (payload: PingTransactionPayloadType) => {
    if (payload.amount) {
      // Envoie la transaction au smart contract
      const sessionId = await sendPingTransactionFromAbi(payload.amount);
      return sessionId;
    }
  };

  return (
    <PingPongComponent
      sendPingTransaction={handlePingTransaction}
      sendPongTransaction={sendPongTransactionFromAbi}
      getTimeToPong={getTimeToPong}
      pingAmount={pingAmount}
    />
  );
};
```

**Ce qui se passe:**
1. Le composant importe des hooks personnalisés
2. Ces hooks gèrent la communication avec le smart contract
3. Quand l'utilisateur clique, le gestionnaire crée et envoie une transaction

### 4. Hook d'écriture (Envoyer des transactions)

**Fichier:** `frontend/src/hooks/transactions/useSendPingPongTransaction.ts`

**Méthode 1: Transaction manuelle**
```typescript
const sendPingTransaction = async (amount: string) => {
  // 1. Créer la transaction manuellement
  const pingTransaction = new Transaction({
    value: BigInt(amount),              // Montant à envoyer
    data: Buffer.from('ping'),          // Nom de la fonction
    receiver: new Address(contractAddress), // Adresse du SC
    gasLimit: BigInt(6000000),          // Limite de gas
    gasPrice: BigInt(GAS_PRICE),
    chainID: network.chainId,
    sender: new Address(address),       // Adresse de l'utilisateur
    version: 2
  });

  // 2. Obtenir le nonce (numéro de séquence)
  const networkProvider = new ProxyNetworkProvider(network.apiAddress);
  const account = await networkProvider.getAccount(new Address(address));
  pingTransaction.nonce = account.nonce;

  // 3. Estimer le coût en gas
  const transactionCost = await networkProvider.estimateTransactionCost(pingTransaction);
  pingTransaction.gasLimit = BigInt(transactionCost.gasLimit);

  // 4. Signer et envoyer
  const sessionId = await signAndSendTransactions({
    transactions: [pingTransaction],
    transactionsDisplayInfo: {
      processingMessage: 'Processing Ping transaction',
      errorMessage: 'An error has occured during Ping',
      successMessage: 'Ping transaction successful'
    }
  });

  return sessionId;
};
```

**Méthode 2: Transaction avec ABI (RECOMMANDÉE)**
```typescript
const sendPingTransactionFromAbi = async (amount: string) => {
  // 1. Créer une factory avec l'ABI
  const abi = AbiRegistry.create(pingPongAbi);
  const scFactory = new SmartContractTransactionsFactory({
    config: new TransactionsFactoryConfig({ chainID: network.chainId }),
    abi
  });

  // 2. Créer la transaction via la factory (plus simple!)
  const pingTransaction = await scFactory.createTransactionForExecute(
    new Address(address),
    {
      gasLimit: BigInt(6000000),
      function: 'ping',                    // Nom de la fonction
      contract: new Address(contractAddress),
      nativeTransferAmount: BigInt(amount) // Arguments
    }
  );

  // 3. Signer et envoyer
  const sessionId = await signAndSendTransactions({
    transactions: [pingTransaction],
    transactionsDisplayInfo: PING_TRANSACTION_INFO
  });

  return sessionId;
};
```

### 5. Helper de signature et envoi

**Fichier:** `frontend/src/helpers/signAndSendTransactions.ts`

```typescript
export const signAndSendTransactions = async ({
  transactions,
  transactionsDisplayInfo
}) => {
  // 1. Obtenir le provider du wallet (xPortal, DeFi Wallet, etc.)
  const provider = getAccountProvider();

  // 2. Obtenir le gestionnaire de transactions
  const txManager = TransactionManager.getInstance();

  // 3. Faire signer les transactions par le wallet de l'utilisateur
  const signedTransactions = await provider.signTransactions(transactions);

  // 4. Envoyer les transactions signées à la blockchain
  const sentTransactions = await txManager.send(signedTransactions);

  // 5. Suivre l'état de la transaction et afficher les notifications
  const sessionId = await txManager.track(sentTransactions, {
    transactionsDisplayInfo
  });

  return sessionId;
};
```

**Ce qui se passe:**
1. Le wallet de l'utilisateur s'ouvre pour demander confirmation
2. L'utilisateur approuve → transaction signée avec sa clé privée
3. La transaction est envoyée à la blockchain
4. Le TransactionManager suit l'état et affiche des notifications

### 6. Hook de lecture (Query du smart contract)

**Fichier:** `frontend/src/pages/Dashboard/widgets/PingPongAbi/hooks/useGetTimeToPong.ts`

```typescript
export const useGetTimeToPong = () => {
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccount();

  const getTimeToPong = async (): Promise<number | undefined> => {
    try {
      // 1. Créer un provider pour interroger le smart contract
      const networkProvider = new ProxyNetworkProvider(network.apiAddress);

      // 2. Charger l'ABI
      const abi = AbiRegistry.create(pingPongAbi);

      // 3. Créer une instance du smart contract
      const contract = new SmartContract({
        address: new Address(contractAddress),
        abi: abi
      });

      // 4. Créer la query
      const interaction = contract.methods.getTimeToPong([address]);
      const query = interaction.buildQuery();

      // 5. Exécuter la query (lecture seule, pas de transaction)
      const response = await networkProvider.queryContract(query);

      // 6. Analyser le résultat
      const result = interaction.interpretQueryResponse(response);
      const value = result[0].valueOf();

      return value?.toNumber();
    } catch (err) {
      console.error('Unable to call getTimeToPong', err);
    }
  };

  return getTimeToPong;
};
```

**Différence importante:**
- **Query (lecture)**: Ne coûte pas de gas, ne nécessite pas de signature, instantané
- **Transaction (écriture)**: Coûte du gas, nécessite signature, prend quelques secondes

---

## Comment adapter pour DEMOCRATIX

### Architecture proposée

```
frontend/src/
├── pages/
│   ├── Elections/
│   │   └── Elections.tsx
│   ├── CreateElection/
│   │   └── CreateElection.tsx
│   ├── ElectionDetail/
│   │   └── ElectionDetail.tsx
│   └── Vote/
│       └── Vote.tsx
├── hooks/
│   ├── elections/
│   │   ├── useGetElections.ts           # Lire toutes les élections
│   │   ├── useGetElection.ts            # Lire une élection
│   │   ├── useGetElectionResults.ts     # Lire les résultats
│   │   └── useGetCandidates.ts          # Lire les candidats
│   └── transactions/
│       ├── useCreateElection.ts         # Créer une élection
│       ├── useVote.ts                   # Voter
│       └── useEndElection.ts            # Terminer une élection
├── contracts/
│   └── democratix.abi.json              # ABI de votre SC
└── config/
    └── config.devnet.ts                 # Adresse du SC déployé
```

---

## Étapes détaillées d'intégration

### Étape 1: Compiler et récupérer l'ABI

**Après avoir compilé votre smart contract Rust:**

```bash
cd backend
mxpy contract build
```

**Fichiers générés:**
```
backend/output/
├── democratix.wasm              # Code binaire à déployer
└── democratix.abi.json          # ABI à copier dans frontend
```

**Copier l'ABI dans le frontend:**
```bash
cp backend/output/democratix.abi.json frontend/src/contracts/
```

### Étape 2: Déployer le smart contract

**Sur devnet:**
```bash
mxpy contract deploy \
  --bytecode=backend/output/democratix.wasm \
  --pem=wallet.pem \
  --proxy=https://devnet-gateway.multiversx.com \
  --chain=D \
  --gas-limit=60000000 \
  --send
```

**Vous obtiendrez une adresse de smart contract:**
```
Contract address: erd1qqqqqqqqqqqqqpgq...
```

### Étape 3: Configurer l'adresse du smart contract

**Fichier:** `frontend/src/config/config.devnet.ts`

```typescript
export const DEMOCRATIX_CONTRACT_ADDRESS = 'erd1qqqqqqqqqqqqqpgq...';
```

### Étape 4: Créer le hook de création d'élection

**Fichier:** `frontend/src/hooks/transactions/useCreateElection.ts`

```typescript
import { AbiRegistry, Address, SmartContractTransactionsFactory } from 'lib';
import { contractAddress } from 'config';
import democratixAbi from 'contracts/democratix.abi.json';
import { signAndSendTransactions } from 'helpers';

export const useCreateElection = () => {
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccount();

  const createElection = async (
    title: string,
    description: string,
    candidates: string[],
    endTimestamp: number
  ) => {
    // 1. Créer la factory avec l'ABI
    const abi = AbiRegistry.create(democratixAbi);
    const scFactory = new SmartContractTransactionsFactory({
      config: new TransactionsFactoryConfig({ chainID: network.chainId }),
      abi
    });

    // 2. Créer la transaction
    const transaction = await scFactory.createTransactionForExecute(
      new Address(address),
      {
        gasLimit: BigInt(15000000), // Plus de gas car fonction complexe
        function: 'createElection',
        contract: new Address(contractAddress),
        arguments: [
          title,              // String
          description,        // String
          candidates,         // Vec<String>
          endTimestamp        // u64
        ]
      }
    );

    // 3. Signer et envoyer
    const sessionId = await signAndSendTransactions({
      transactions: [transaction],
      transactionsDisplayInfo: {
        processingMessage: 'Création de l\'élection en cours...',
        errorMessage: 'Erreur lors de la création de l\'élection',
        successMessage: 'Élection créée avec succès!'
      }
    });

    return sessionId;
  };

  return { createElection };
};
```

### Étape 5: Créer le hook de vote

**Fichier:** `frontend/src/hooks/transactions/useVote.ts`

```typescript
export const useVote = () => {
  const { network } = useGetNetworkConfig();
  const { address } = useGetAccount();

  const vote = async (electionId: number, candidateId: number) => {
    const abi = AbiRegistry.create(democratixAbi);
    const scFactory = new SmartContractTransactionsFactory({
      config: new TransactionsFactoryConfig({ chainID: network.chainId }),
      abi
    });

    const transaction = await scFactory.createTransactionForExecute(
      new Address(address),
      {
        gasLimit: BigInt(10000000),
        function: 'vote',
        contract: new Address(contractAddress),
        arguments: [
          electionId,    // u32
          candidateId    // u32
        ]
      }
    );

    const sessionId = await signAndSendTransactions({
      transactions: [transaction],
      transactionsDisplayInfo: {
        processingMessage: 'Vote en cours...',
        errorMessage: 'Erreur lors du vote',
        successMessage: 'Vote enregistré!'
      }
    });

    return sessionId;
  };

  return { vote };
};
```

### Étape 6: Créer le hook de lecture des élections

**Fichier:** `frontend/src/hooks/elections/useGetElections.ts`

```typescript
export const useGetElections = () => {
  const { network } = useGetNetworkConfig();

  const getElections = async () => {
    try {
      // 1. Provider réseau
      const networkProvider = new ProxyNetworkProvider(network.apiAddress);

      // 2. Charger l'ABI
      const abi = AbiRegistry.create(democratixAbi);

      // 3. Instance du smart contract
      const contract = new SmartContract({
        address: new Address(contractAddress),
        abi: abi
      });

      // 4. Créer la query
      const interaction = contract.methods.getAllElections();
      const query = interaction.buildQuery();

      // 5. Exécuter la query
      const response = await networkProvider.queryContract(query);

      // 6. Interpréter le résultat
      const result = interaction.interpretQueryResponse(response);

      // 7. Transformer en format TypeScript
      const elections = result[0].valueOf().map((election: any) => ({
        id: election.id.toNumber(),
        title: election.title.toString(),
        description: election.description.toString(),
        endTimestamp: election.end_timestamp.toNumber(),
        status: election.status.name, // "Active" ou "Finished"
        totalVotes: election.total_votes.toNumber(),
        candidates: election.candidates.map((c: any) => ({
          id: c.id.toNumber(),
          name: c.name.toString(),
          votes: c.votes.toNumber()
        }))
      }));

      return elections;
    } catch (err) {
      console.error('Unable to fetch elections', err);
      return [];
    }
  };

  return { getElections };
};
```

### Étape 7: Utiliser dans les composants React

**Fichier:** `frontend/src/pages/Elections/Elections.tsx`

```typescript
import { useEffect, useState } from 'react';
import { useGetElections } from 'hooks/elections/useGetElections';

export const Elections = () => {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getElections } = useGetElections();

  // Charger les élections au montage du composant
  useEffect(() => {
    const fetchElections = async () => {
      setLoading(true);
      const data = await getElections();
      setElections(data);
      setLoading(false);
    };

    fetchElections();
  }, []);

  if (loading) {
    return <div>Chargement des élections...</div>;
  }

  return (
    <div>
      <h1>Élections</h1>
      {elections.map(election => (
        <div key={election.id}>
          <h2>{election.title}</h2>
          <p>{election.description}</p>
          <p>Votes: {election.totalVotes}</p>
        </div>
      ))}
    </div>
  );
};
```

**Fichier:** `frontend/src/pages/CreateElection/CreateElection.tsx`

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateElection } from 'hooks/transactions/useCreateElection';

export const CreateElection = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [candidates, setCandidates] = useState(['', '']);
  const [endDate, setEndDate] = useState('');

  const { createElection } = useCreateElection();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!title || !description || !endDate) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    // Convertir la date en timestamp
    const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);

    try {
      // Appeler le smart contract
      await createElection(
        title,
        description,
        candidates.filter(c => c.trim() !== ''),
        endTimestamp
      );

      // Rediriger après succès
      navigate('/elections');
    } catch (error) {
      console.error('Erreur création élection:', error);
      alert('Erreur lors de la création de l\'élection');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titre"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
      />
      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
      />
      {/* Candidats... */}
      <button type="submit">Créer l'élection</button>
    </form>
  );
};
```

**Fichier:** `frontend/src/pages/Vote/Vote.tsx`

```typescript
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVote } from 'hooks/transactions/useVote';

export const Vote = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const { vote } = useVote();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (selectedCandidate === null) {
      alert('Veuillez sélectionner un candidat');
      return;
    }

    try {
      // Appeler le smart contract
      await vote(parseInt(id!), selectedCandidate);

      alert('Vote enregistré avec succès!');
      navigate(`/election/${id}`);
    } catch (error) {
      console.error('Erreur vote:', error);
      alert('Erreur lors du vote');
    }
  };

  return (
    <div>
      {/* Interface de sélection des candidats */}
      <button onClick={handleSubmit}>Confirmer mon vote</button>
    </div>
  );
};
```

---

## Exemples concrets

### Exemple 1: Lecture simple (pas de paramètres)

**Smart Contract Rust:**
```rust
#[view(getTotalElections)]
fn get_total_elections(&self) -> u32 {
    self.elections().len() as u32
}
```

**Hook Frontend:**
```typescript
const getTotalElections = async (): Promise<number> => {
  const networkProvider = new ProxyNetworkProvider(network.apiAddress);
  const abi = AbiRegistry.create(democratixAbi);
  const contract = new SmartContract({
    address: new Address(contractAddress),
    abi: abi
  });

  const interaction = contract.methods.getTotalElections();
  const query = interaction.buildQuery();
  const response = await networkProvider.queryContract(query);
  const result = interaction.interpretQueryResponse(response);

  return result[0].valueOf().toNumber();
};
```

### Exemple 2: Lecture avec paramètres

**Smart Contract Rust:**
```rust
#[view(getElection)]
fn get_election(&self, election_id: u32) -> Election<Self::Api> {
    self.elections().get(election_id).unwrap()
}
```

**Hook Frontend:**
```typescript
const getElection = async (electionId: number): Promise<Election> => {
  const networkProvider = new ProxyNetworkProvider(network.apiAddress);
  const abi = AbiRegistry.create(democratixAbi);
  const contract = new SmartContract({
    address: new Address(contractAddress),
    abi: abi
  });

  const interaction = contract.methods.getElection([electionId]);
  const query = interaction.buildQuery();
  const response = await networkProvider.queryContract(query);
  const result = interaction.interpretQueryResponse(response);

  const election = result[0].valueOf();
  return {
    id: election.id.toNumber(),
    title: election.title.toString(),
    description: election.description.toString(),
    // ... autres champs
  };
};
```

### Exemple 3: Écriture simple

**Smart Contract Rust:**
```rust
#[endpoint(endElection)]
fn end_election(&self, election_id: u32) {
    let caller = self.blockchain().get_caller();
    // ... logique
}
```

**Hook Frontend:**
```typescript
const endElection = async (electionId: number) => {
  const abi = AbiRegistry.create(democratixAbi);
  const scFactory = new SmartContractTransactionsFactory({
    config: new TransactionsFactoryConfig({ chainID: network.chainId }),
    abi
  });

  const transaction = await scFactory.createTransactionForExecute(
    new Address(address),
    {
      gasLimit: BigInt(8000000),
      function: 'endElection',
      contract: new Address(contractAddress),
      arguments: [electionId]
    }
  );

  const sessionId = await signAndSendTransactions({
    transactions: [transaction],
    transactionsDisplayInfo: {
      processingMessage: 'Clôture de l\'élection...',
      errorMessage: 'Erreur lors de la clôture',
      successMessage: 'Élection clôturée!'
    }
  });

  return sessionId;
};
```

### Exemple 4: Écriture avec paiement EGLD

**Smart Contract Rust:**
```rust
#[payable("EGLD")]
#[endpoint(createPremiumElection)]
fn create_premium_election(&self, title: ManagedBuffer) {
    let payment = self.call_value().egld_value();
    require!(payment == BigUint::from(1000000000000000000u64), "Must pay 1 EGLD");
    // ... logique
}
```

**Hook Frontend:**
```typescript
const createPremiumElection = async (title: string) => {
  const abi = AbiRegistry.create(democratixAbi);
  const scFactory = new SmartContractTransactionsFactory({
    config: new TransactionsFactoryConfig({ chainID: network.chainId }),
    abi
  });

  const oneEGLD = '1000000000000000000'; // 1 EGLD en wei

  const transaction = await scFactory.createTransactionForExecute(
    new Address(address),
    {
      gasLimit: BigInt(15000000),
      function: 'createPremiumElection',
      contract: new Address(contractAddress),
      arguments: [title],
      nativeTransferAmount: BigInt(oneEGLD) // Paiement en EGLD
    }
  );

  const sessionId = await signAndSendTransactions({
    transactions: [transaction],
    transactionsDisplayInfo: {
      processingMessage: 'Création élection premium...',
      errorMessage: 'Erreur création',
      successMessage: 'Élection premium créée!'
    }
  });

  return sessionId;
};
```

---

## Résumé des étapes pour DEMOCRATIX

### Phase 1: Préparation
1. ✅ Compiler le smart contract Rust
2. ✅ Récupérer le fichier ABI
3. ✅ Déployer le smart contract sur devnet
4. ✅ Noter l'adresse du smart contract

### Phase 2: Configuration Frontend
5. ✅ Copier l'ABI dans `frontend/src/contracts/democratix.abi.json`
6. ✅ Ajouter l'adresse dans `frontend/src/config/config.devnet.ts`

### Phase 3: Hooks de lecture (queries)
7. ✅ Créer `useGetElections.ts` - liste toutes les élections
8. ✅ Créer `useGetElection.ts` - détails d'une élection
9. ✅ Créer `useGetElectionResults.ts` - résultats d'une élection
10. ✅ Créer `useGetUserVote.ts` - vérifier si l'utilisateur a voté

### Phase 4: Hooks d'écriture (transactions)
11. ✅ Créer `useCreateElection.ts` - créer une élection
12. ✅ Créer `useVote.ts` - voter pour un candidat
13. ✅ Créer `useEndElection.ts` - terminer une élection (si admin)

### Phase 5: Intégration dans les pages
14. ✅ Intégrer dans `Elections.tsx` - afficher la liste
15. ✅ Intégrer dans `CreateElection.tsx` - formulaire de création
16. ✅ Intégrer dans `ElectionDetail.tsx` - afficher les résultats
17. ✅ Intégrer dans `Vote.tsx` - interface de vote

### Phase 6: Tests
18. ✅ Tester sur devnet avec un wallet de test
19. ✅ Vérifier les transactions sur l'explorateur
20. ✅ Déployer sur mainnet quand tout fonctionne

---

## Outils de débogage

### 1. Explorer MultiversX Devnet
**URL:** https://devnet-explorer.multiversx.com

- Voir toutes vos transactions
- Vérifier l'état du smart contract
- Voir les logs d'erreur

### 2. Console du navigateur
```typescript
// Activer les logs détaillés
localStorage.setItem('DEBUG', 'true');

// Dans vos hooks
console.log('Query result:', result);
console.log('Transaction sent:', sessionId);
```

### 3. Tester les queries directement
```bash
# Avec mxpy
mxpy contract query erd1qqqqqqqqqqqqqpgq... \
  --function="getAllElections" \
  --proxy=https://devnet-gateway.multiversx.com
```

---

## Questions fréquentes

**Q: Combien coûte une transaction ?**
R: Dépend de la complexité. Comptez environ 0.00005-0.001 EGLD par transaction.

**Q: Combien de temps prend une transaction ?**
R: Environ 6 secondes (1 bloc sur MultiversX).

**Q: Comment gérer les erreurs ?**
R: Le smart contract retourne des erreurs avec `require!()`. Elles apparaissent dans la notification d'erreur.

**Q: Peut-on tester sans déployer ?**
R: Oui, utilisez les mocks comme dans les pages actuelles, puis remplacez par les vrais hooks.

**Q: Faut-il payer pour les queries (lectures) ?**
R: Non, seules les transactions (écritures) coûtent du gas.

---

## Prochaines étapes

1. **Terminer le smart contract** - Assurez-vous que toutes les fonctions sont implémentées
2. **Générer l'ABI** - Compiler et récupérer l'ABI
3. **Déployer sur devnet** - Tester en conditions réelles
4. **Créer les hooks** - Suivre les exemples de ce document
5. **Intégrer dans l'UI** - Remplacer les données mockées
6. **Tests complets** - Vérifier tous les scénarios
7. **Déploiement mainnet** - Quand tout est validé

---

**Besoin d'aide ?**
- Documentation MultiversX: https://docs.multiversx.com
- SDK JS: https://docs.multiversx.com/sdk-and-tools/sdk-js/
- Template dApp: https://github.com/multiversx/mx-template-dapp

**Ce guide vous donne toutes les clés pour connecter votre interface DEMOCRATIX au smart contract MultiversX! 🚀**
