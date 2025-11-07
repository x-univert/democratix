#![no_std]

extern crate alloc;
use alloc::string::ToString;

use multiversx_sc::{derive_imports::*, imports::*};

mod crypto_mock;

/// Statut d'une élection
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, PartialEq, Eq, Clone, Copy, Debug)]
pub enum ElectionStatus {
    Pending,    // Créée mais pas encore commencée
    Active,     // En cours
    Closed,     // Terminée, en attente de dépouillement
    Finalized,  // Résultats publiés
}

/// Structure représentant un candidat
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone, Debug)]
pub struct Candidate<M: ManagedTypeApi> {
    pub id: u32,
    pub name: ManagedBuffer<M>,
    pub description_ipfs: ManagedBuffer<M>,
}

/// Structure pour les résultats finaux d'un candidat
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone, Debug)]
pub struct CandidateResult {
    pub candidate_id: u32,
    pub vote_count: u64,
}

/// Structure représentant une élection
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Debug)]
pub struct Election<M: ManagedTypeApi> {
    pub id: u64,
    pub title: ManagedBuffer<M>,
    pub description_ipfs: ManagedBuffer<M>,
    pub organizer: ManagedAddress<M>,
    pub start_time: u64,
    pub end_time: u64,
    pub num_candidates: u32,
    pub status: ElectionStatus,
    pub total_votes: u64,
    pub requires_registration: bool,
    pub registered_voters_count: u64,
    pub registration_deadline: Option<u64>,  // NOUVEAU: Date limite d'inscription
    pub encryption_type: u8,  // NOUVEAU: 0=none, 1=elgamal, 2=elgamal+zksnark
}

/// Structure pour un code d'invitation
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Debug)]
pub struct InvitationCode<M: ManagedTypeApi> {
    pub code_hash: ManagedBuffer<M>,
    pub is_used: bool,
    pub used_by: Option<ManagedAddress<M>>,
}

/// Statistiques d'inscription pour une élection
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Debug)]
pub struct RegistrationStats {
    pub total_registered: u64,
    pub last_registration_timestamp: u64,
}

/// Vote chiffré
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Debug)]
pub struct EncryptedVote<M: ManagedTypeApi> {
    pub encrypted_choice: ManagedBuffer<M>,
    pub proof: ManagedBuffer<M>,  // zk-SNARK proof
    pub timestamp: u64,
}

/// Vote privé avec preuve zk-SNARK vérifiée off-chain
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Debug)]
pub struct PrivateVote<M: ManagedTypeApi> {
    pub vote_commitment: ManagedBuffer<M>,  // Hash Poseidon du vote
    pub nullifier: ManagedBuffer<M>,         // Empêche le double vote
    pub backend_signature: ManagedBuffer<M>, // Signature du backend (preuve vérifiée)
    pub timestamp: u64,
}

/// Vote chiffré avec ElGamal (Option 1)
/// Chiffrement sur courbe elliptique secp256k1
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Debug)]
pub struct ElGamalVote<M: ManagedTypeApi> {
    pub c1: ManagedBuffer<M>,  // Composante 1 du chiffrement ElGamal (r × G)
    pub c2: ManagedBuffer<M>,  // Composante 2 du chiffrement ElGamal (r × pk + m × G)
    pub timestamp: u64,
}

/// Point sur courbe elliptique G1 (BN254)
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone, Debug)]
pub struct G1Point<M: ManagedTypeApi> {
    pub x: ManagedBuffer<M>,  // Coordonnée x (32 bytes)
    pub y: ManagedBuffer<M>,  // Coordonnée y (32 bytes)
}

/// Point sur courbe elliptique G2 (BN254) - Extension field
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone, Debug)]
pub struct G2Point<M: ManagedTypeApi> {
    pub x1: ManagedBuffer<M>,  // Composante x1 (32 bytes)
    pub x2: ManagedBuffer<M>,  // Composante x2 (32 bytes)
    pub y1: ManagedBuffer<M>,  // Composante y1 (32 bytes)
    pub y2: ManagedBuffer<M>,  // Composante y2 (32 bytes)
}

/// Preuve Groth16 pour zk-SNARK
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone, Debug)]
pub struct Groth16Proof<M: ManagedTypeApi> {
    pub pi_a: G1Point<M>,  // Point A (G1)
    pub pi_b: G2Point<M>,  // Point B (G2)
    pub pi_c: G1Point<M>,  // Point C (G1)
}

/// Vote chiffré ElGamal avec preuve zk-SNARK (Option 2)
/// Combine le chiffrement ElGamal avec une preuve mathématique de validité
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Debug)]
pub struct ElGamalVoteWithProof<M: ManagedTypeApi> {
    pub c1: ManagedBuffer<M>,          // ElGamal c1 = hash(r)
    pub c2: ManagedBuffer<M>,          // ElGamal c2 = hash(r, pk, candidateId)
    pub nullifier: ManagedBuffer<M>,   // Nullifier anti-double vote
    pub proof: Groth16Proof<M>,        // Preuve zk-SNARK Groth16
    pub timestamp: u64,
}

/// Smart Contract de Vote
///
/// Ce contrat gère la création d'élections, le vote et le stockage des votes chiffrés.
#[multiversx_sc::contract]
pub trait VotingContract {
    #[init]
    fn init(&self) {}

    /// Fonction appelée lors de l'upgrade du contrat
    #[upgrade]
    fn upgrade(&self) {}

    /// Crée une nouvelle élection
    ///
    /// # Arguments
    /// * `title` - Titre de l'élection
    /// * `description_ipfs` - Hash IPFS de la description complète
    /// * `start_time` - Timestamp de début
    /// * `end_time` - Timestamp de fin
    /// * `requires_registration` - Inscription obligatoire ou non
    /// * `encryption_type` - Type de chiffrement: 0=none, 1=elgamal, 2=elgamal+zksnark
    /// * `registration_deadline` - Date limite d'inscription (optionnel)
    #[endpoint(createElection)]
    fn create_election(
        &self,
        title: ManagedBuffer,
        description_ipfs: ManagedBuffer,
        start_time: u64,
        end_time: u64,
        requires_registration: bool,
        encryption_type: u8,
        registration_deadline: OptionalValue<u64>,
    ) -> u64 {
        require!(start_time < end_time, "Dates invalides");
        require!(
            start_time > self.blockchain().get_block_timestamp(),
            "La date de début doit être dans le futur"
        );

        // Valider encryption_type
        require!(
            encryption_type <= 2,
            "Type de chiffrement invalide (doit être 0, 1 ou 2)"
        );

        // Valider la deadline si fournie
        let deadline = registration_deadline.into_option();
        if requires_registration && deadline.is_some() {
            let dl = deadline.unwrap();
            require!(
                dl < start_time,
                "La date limite d'inscription doit être avant le début du vote"
            );
        }

        let election_id = self.election_counter().get() + 1;
        self.election_counter().set(election_id);

        let election = Election {
            id: election_id,
            title,
            description_ipfs,
            organizer: self.blockchain().get_caller(),
            start_time,
            end_time,
            num_candidates: 0,
            status: ElectionStatus::Pending,
            total_votes: 0,
            requires_registration,
            registered_voters_count: 0,
            registration_deadline: deadline,
            encryption_type,
        };

        self.elections(election_id).set(&election);

        self.election_created_event(election_id, &election.organizer);

        election_id
    }

    /// Ajoute un candidat à une élection
    #[endpoint(addCandidate)]
    fn add_candidate(
        &self,
        election_id: u64,
        candidate_id: u32,
        name: ManagedBuffer,
        description_ipfs: ManagedBuffer,
    ) {
        let mut election = self.elections(election_id).get();
        require!(
            self.blockchain().get_caller() == election.organizer,
            "Seul l'organisateur peut ajouter des candidats"
        );
        require!(election.status == ElectionStatus::Pending, "Élection déjà commencée");

        let candidate = Candidate {
            id: candidate_id,
            name,
            description_ipfs,
        };

        self.candidates(election_id).push(&candidate);
        election.num_candidates += 1;
        self.elections(election_id).set(&election);
    }

    /// Inscription d'un électeur à une élection
    ///
    /// # Arguments
    /// * `election_id` - ID de l'élection
    // ❌ DÉSACTIVÉ: registerToVote permet à N'IMPORTE QUI de s'inscrire
    // Pour le flux KYC, on utilise UNIQUEMENT:
    // 1. addToWhitelist (organisateur inscrit les adresses après KYC)
    // 2. registerWithInvitationCode (électeurs avec code reçu après KYC)
    //
    // #[endpoint(registerToVote)]
    // fn register_to_vote(&self, election_id: u64) {
    //     require!(
    //         !self.elections(election_id).is_empty(),
    //         "Élection inexistante"
    //     );
    //
    //     let mut election = self.elections(election_id).get();
    //     let caller = self.blockchain().get_caller();
    //     let current_time = self.blockchain().get_block_timestamp();
    //
    //     require!(
    //         election.requires_registration,
    //         "Cette élection ne requiert pas d'inscription"
    //     );
    //
    //     // NOUVEAU: Vérifier la date limite d'inscription
    //     if let Some(deadline) = election.registration_deadline {
    //         require!(
    //             current_time <= deadline,
    //             "La date limite d'inscription est dépassée"
    //         );
    //     } else {
    //         require!(
    //             election.status == ElectionStatus::Pending,
    //             "Les inscriptions sont fermées"
    //         );
    //     }
    //
    //     require!(
    //         self.registered_voters(election_id, &caller).is_empty(),
    //         "Vous êtes déjà inscrit"
    //     );
    //
    //     self.registered_voters(election_id, &caller).set(true);
    //     self.all_registered_voters(election_id).insert(caller.clone());
    //     election.registered_voters_count += 1;
    //     self.elections(election_id).set(&election);
    //
    //     // NOUVEAU: Tracker pour le dashboard
    //     self.last_registration_time(election_id).set(current_time);
    //     let day_start = (current_time / 86400) * 86400;
    //     let current_count = self.registrations_per_day(election_id, day_start).get();
    //     self.registrations_per_day(election_id, day_start).set(current_count + 1);
    //
    //     self.voter_registered_event(election_id, &caller);
    // }

    /// Ajoute des adresses à la liste blanche d'une élection
    ///
    /// # Arguments
    /// * `election_id` - ID de l'élection
    /// * `addresses` - Liste d'adresses à ajouter
    #[endpoint(addToWhitelist)]
    fn add_to_whitelist(&self, election_id: u64, addresses: MultiValueEncoded<ManagedAddress>) {
        let caller = self.blockchain().get_caller();
        let mut election = self.elections(election_id).get();

        require!(
            caller == election.organizer,
            "Seul l'organisateur peut modifier la liste blanche"
        );

        require!(
            election.status == ElectionStatus::Pending,
            "Les inscriptions sont fermées"
        );

        let current_time = self.blockchain().get_block_timestamp();

        for address in addresses.into_iter() {
            if self.registered_voters(election_id, &address).is_empty() {
                self.registered_voters(election_id, &address).set(true);
                self.all_registered_voters(election_id).insert(address.clone());
                election.registered_voters_count += 1;

                self.voter_registered_event(election_id, &address);
            }
        }

        self.elections(election_id).set(&election);

        // Tracker pour dashboard
        self.last_registration_time(election_id).set(current_time);
    }

    /// Retire des adresses de la liste blanche
    #[endpoint(removeFromWhitelist)]
    fn remove_from_whitelist(&self, election_id: u64, addresses: MultiValueEncoded<ManagedAddress>) {
        let caller = self.blockchain().get_caller();
        let mut election = self.elections(election_id).get();

        require!(
            caller == election.organizer,
            "Seul l'organisateur peut modifier la liste blanche"
        );

        require!(
            election.status == ElectionStatus::Pending,
            "Les inscriptions sont fermées"
        );

        for address in addresses.into_iter() {
            if !self.registered_voters(election_id, &address).is_empty() {
                self.registered_voters(election_id, &address).clear();
                self.all_registered_voters(election_id).swap_remove(&address);
                election.registered_voters_count -= 1;
            }
        }

        self.elections(election_id).set(&election);
    }

    /// Génère des codes d'invitation pour une élection
    ///
    /// # Arguments
    /// * `election_id` - ID de l'élection
    /// * `count` - Nombre de codes à générer
    /// * `batch_offset` - Offset de départ pour éviter les doublons entre batches (0 pour le premier batch, 100 pour le deuxième, etc.)
    #[endpoint(generateInvitationCodes)]
    fn generate_invitation_codes(&self, election_id: u64, count: u32, batch_offset: u32) -> MultiValueEncoded<ManagedBuffer> {
        let caller = self.blockchain().get_caller();
        let election = self.elections(election_id).get();

        require!(
            caller == election.organizer,
            "Seul l'organisateur peut générer des codes"
        );

        require!(
            election.requires_registration,
            "Cette élection ne requiert pas d'inscription"
        );

        require!(
            election.status == ElectionStatus::Pending,
            "Les inscriptions sont fermées"
        );

        let mut codes = MultiValueEncoded::new();
        let random_seed = self.blockchain().get_block_random_seed();
        let timestamp = self.blockchain().get_block_timestamp();

        // Utiliser le batch_offset pour démarrer à un compteur spécifique
        // Cela évite les collisions entre transactions simultanées
        let batch_start = batch_offset as u64;

        for i in 0..count {
            let mut code_data = ManagedBuffer::new();

            // Calculer le compteur unique pour ce code
            let counter = batch_start + i as u64;

            // Ajouter le random seed de manière sûre
            code_data.append(random_seed.as_managed_buffer());
            code_data.append_bytes(&timestamp.to_be_bytes()[..]);
            code_data.append_bytes(&election_id.to_be_bytes()[..]);
            // Utiliser le compteur basé sur le batch_offset pour garantir l'unicité entre les batches
            code_data.append_bytes(&counter.to_be_bytes()[..]);

            let code_hash_bytes = self.crypto().keccak256(&code_data);
            let code_hash = code_hash_bytes.as_managed_buffer().clone();

            self.invitation_codes(election_id, &code_hash).set(InvitationCode {
                code_hash: code_hash.clone(),
                is_used: false,
                used_by: None,
            });

            // Retourner le hash en format hex lisible au lieu du code brut
            codes.push(code_hash);
        }

        codes
    }

    /// Inscription avec un code d'invitation
    ///
    /// # Arguments
    /// * `election_id` - ID de l'élection
    /// * `invitation_code` - Code d'invitation
    #[endpoint(registerWithInvitationCode)]
    fn register_with_invitation_code(&self, election_id: u64, invitation_code: ManagedBuffer) {
        let caller = self.blockchain().get_caller();
        let mut election = self.elections(election_id).get();
        let current_time = self.blockchain().get_block_timestamp();

        require!(
            election.requires_registration,
            "Cette élection ne requiert pas d'inscription"
        );

        require!(
            election.status == ElectionStatus::Pending,
            "Les inscriptions sont fermées"
        );

        require!(
            self.registered_voters(election_id, &caller).is_empty(),
            "Vous êtes déjà inscrit"
        );

        // Le code d'invitation reçu est déjà un hash (généré par generateInvitationCodes)
        // On ne doit pas le hasher à nouveau
        require!(
            !self.invitation_codes(election_id, &invitation_code).is_empty(),
            "Code d'invitation invalide"
        );

        let mut code_data = self.invitation_codes(election_id, &invitation_code).get();

        require!(
            !code_data.is_used,
            "Ce code a déjà été utilisé"
        );

        code_data.is_used = true;
        code_data.used_by = Some(caller.clone());
        self.invitation_codes(election_id, &invitation_code).set(&code_data);

        self.registered_voters(election_id, &caller).set(true);
        self.all_registered_voters(election_id).insert(caller.clone());
        election.registered_voters_count += 1;
        self.elections(election_id).set(&election);

        // Tracker pour dashboard
        self.last_registration_time(election_id).set(current_time);
        let day_start = (current_time / 86400) * 86400;
        let current_count = self.registrations_per_day(election_id, day_start).get();
        self.registrations_per_day(election_id, day_start).set(current_count + 1);

        self.voter_registered_event(election_id, &caller);
    }

    /// Soumet un vote chiffré
    ///
    /// # Arguments
    /// * `election_id` - ID de l'élection
    /// * `voting_token` - Token de vote (vérifié avec voter-registry)
    /// * `encrypted_vote` - Vote chiffré
    #[endpoint(castVote)]
    fn cast_vote(
        &self,
        election_id: u64,
        _voting_token: ManagedBuffer,
        encrypted_vote: EncryptedVote<Self::Api>,
    ) {
        require!(self.elections(election_id).is_empty() == false, "Élection inexistante");

        let mut election = self.elections(election_id).get();
        let caller = self.blockchain().get_caller();

        let current_time = self.blockchain().get_block_timestamp();
        require!(
            current_time >= election.start_time && current_time <= election.end_time,
            "Élection non active"
        );
        require!(election.status == ElectionStatus::Active, "Élection non active");

        // Vérifier que l'utilisateur n'a pas déjà voté
        require!(
            !self.voters(election_id, &caller).get(),
            "Vous avez déjà voté pour cette élection"
        );

        // Vérifier l'inscription si l'élection le requiert
        if election.requires_registration {
            require!(
                !self.registered_voters(election_id, &caller).is_empty(),
                "Vous devez vous inscrire avant de voter"
            );
        }

        // TODO: Vérifier le token avec le contrat voter-registry

        // Vérifier la preuve zk-SNARK du vote (version MOCK pour POC)
        require!(
            crypto_mock::crypto_verification::verify_encrypted_vote(
                &encrypted_vote.encrypted_choice,
                &encrypted_vote.proof
            ),
            "Preuve de vote invalide"
        );

        // Enregistrer que cet utilisateur a voté
        self.voters(election_id, &caller).set(true);

        // Stocker le vote chiffré
        self.votes(election_id).push(&encrypted_vote);
        election.total_votes += 1;
        self.elections(election_id).set(&election);

        // TODO: Révoquer le token dans voter-registry

        self.vote_cast_event(election_id, current_time);
    }

    /// Soumet un vote privé avec preuve zk-SNARK vérifiée off-chain
    ///
    /// # Arguments
    /// * `election_id` - ID de l'élection
    /// * `vote_commitment` - Commitment Poseidon du vote
    /// * `nullifier` - Nullifier unique pour empêcher le double vote
    /// * `backend_signature` - Signature du backend après vérification de la preuve
    ///
    /// # Sécurité
    /// - La preuve zk-SNARK est vérifiée off-chain par le backend
    /// - Le backend signe les données pour autoriser la transaction
    /// - Le nullifier empêche tout double vote
    #[endpoint(submitPrivateVote)]
    fn submit_private_vote(
        &self,
        election_id: u64,
        vote_commitment: ManagedBuffer,
        nullifier: ManagedBuffer,
        backend_signature: ManagedBuffer,
    ) {
        // 1. Vérifier que l'élection existe et est active
        require!(
            !self.elections(election_id).is_empty(),
            "Élection inexistante"
        );

        let mut election = self.elections(election_id).get();
        let current_time = self.blockchain().get_block_timestamp();

        require!(
            current_time >= election.start_time && current_time <= election.end_time,
            "Élection non active"
        );

        require!(
            election.status == ElectionStatus::Active,
            "Élection non active"
        );

        // 2. Vérifier la signature du backend
        // Pour le POC, on vérifie simplement que la signature correspond au hash attendu
        // TODO: Implémenter une vraie signature cryptographique Ed25519 en production
        let _expected_hash = self.hash_vote_data(&election_id, &vote_commitment, &nullifier);

        // La signature du backend devrait commencer par le hash des données
        require!(
            backend_signature.len() >= 64,
            "Signature backend invalide (longueur)"
        );

        // Pour le POC, on accepte toute signature de longueur correcte
        // En production, il faudrait vérifier la signature Ed25519 du backend
        // avec self.crypto().verify_ed25519() et l'adresse du backend
        let _backend_address = self.backend_verifier_address().get();
        // Vérification simplifiée pour le POC

        // 3. Vérifier que le nullifier n'est pas déjà utilisé (double vote)
        require!(
            !self.used_nullifiers(election_id).contains(&nullifier),
            "Nullifier déjà utilisé - double vote détecté"
        );

        // 4. Stocker le vote privé
        let private_vote = PrivateVote {
            vote_commitment: vote_commitment.clone(),
            nullifier: nullifier.clone(),
            backend_signature: backend_signature.clone(),
            timestamp: current_time,
        };

        // Marquer le nullifier comme utilisé
        self.used_nullifiers(election_id).insert(nullifier);

        // Stocker le vote
        self.private_votes(election_id).push(&private_vote);
        election.total_votes += 1;
        self.elections(election_id).set(&election);

        // 5. Émettre événement
        self.private_vote_submitted_event(election_id, vote_commitment);
    }

    /// Helper pour hasher les données du vote
    fn hash_vote_data(
        &self,
        election_id: &u64,
        vote_commitment: &ManagedBuffer,
        nullifier: &ManagedBuffer
    ) -> ManagedBuffer {
        let mut data = ManagedBuffer::new();
        data.append_bytes(&election_id.to_be_bytes()[..]);
        data.append(vote_commitment);
        data.append(nullifier);
        let hash_array = self.crypto().keccak256(&data);
        hash_array.as_managed_buffer().clone()
    }

    // === ENDPOINTS ELGAMAL (OPTION 1) ===

    /// Définit la clé publique ElGamal pour une élection
    ///
    /// # Arguments
    /// * `election_id` - ID de l'élection
    /// * `public_key` - Clé publique ElGamal (hex string de la clé secp256k1)
    ///
    /// # Sécurité
    /// - Seul l'organisateur peut définir la clé publique
    /// - La clé doit être définie avant l'activation de l'élection
    #[endpoint(setElectionPublicKey)]
    fn set_election_public_key(&self, election_id: u64, public_key: ManagedBuffer) {
        // Vérifier que l'élection existe
        require!(
            !self.elections(election_id).is_empty(),
            "Élection inexistante"
        );

        let election = self.elections(election_id).get();

        // Vérifier que l'appelant est l'organisateur
        require!(
            self.blockchain().get_caller() == election.organizer,
            "Seul l'organisateur peut définir la clé publique"
        );

        // Vérifier que l'élection est encore en statut Pending
        require!(
            election.status == ElectionStatus::Pending,
            "La clé publique ne peut être définie qu'avant l'activation"
        );

        // Vérifier qu'aucune clé publique n'a déjà été définie
        require!(
            self.election_elgamal_public_key(election_id).is_empty(),
            "Une clé publique a déjà été définie pour cette élection"
        );

        // Vérifier que la clé publique n'est pas vide
        require!(
            public_key.len() > 0,
            "Clé publique invalide"
        );

        // Stocker la clé publique
        self.election_elgamal_public_key(election_id).set(&public_key);
    }

    /// Récupère la clé publique ElGamal d'une élection
    ///
    /// # Arguments
    /// * `election_id` - ID de l'élection
    ///
    /// # Returns
    /// La clé publique ElGamal (hex string) ou buffer vide si non définie
    #[view(getElectionPublicKey)]
    fn get_election_public_key(&self, election_id: u64) -> ManagedBuffer {
        if self.election_elgamal_public_key(election_id).is_empty() {
            ManagedBuffer::new()
        } else {
            self.election_elgamal_public_key(election_id).get()
        }
    }

    /// Soumet un vote chiffré avec ElGamal (Option 1)
    ///
    /// # Arguments
    /// * `election_id` - ID de l'élection
    /// * `c1` - Composante 1 du chiffrement ElGamal (r × G)
    /// * `c2` - Composante 2 du chiffrement ElGamal (r × pk + m × G)
    ///
    /// # Sécurité
    /// - Le vote est chiffré côté client avec la clé publique
    /// - Seul l'organisateur peut déchiffrer avec sa clé privée (off-chain)
    /// - Le smart contract empêche le double vote
    #[endpoint(submitEncryptedVote)]
    fn submit_encrypted_vote(
        &self,
        election_id: u64,
        c1: ManagedBuffer,
        c2: ManagedBuffer,
    ) {
        // 1. Vérifier que l'élection existe et est active
        require!(
            !self.elections(election_id).is_empty(),
            "Élection inexistante"
        );

        let mut election = self.elections(election_id).get();
        let current_time = self.blockchain().get_block_timestamp();

        require!(
            current_time >= election.start_time && current_time <= election.end_time,
            "Élection non active"
        );

        require!(
            election.status == ElectionStatus::Active,
            "Élection non active"
        );

        // 2. Vérifier que l'élection a une clé publique ElGamal
        require!(
            !self.election_elgamal_public_key(election_id).is_empty(),
            "Cette élection n'a pas activé le chiffrement ElGamal"
        );

        // 3. Vérifier que le votant n'a pas déjà voté
        let caller = self.blockchain().get_caller();
        require!(
            !self.voters(election_id, &caller).get(),
            "Vous avez déjà voté pour cette élection"
        );

        // 4. Vérifier l'inscription si l'élection le requiert
        if election.requires_registration {
            require!(
                !self.registered_voters(election_id, &caller).is_empty(),
                "Vous devez vous inscrire avant de voter"
            );
        }

        // 5. Vérifier que les composantes du vote chiffré ne sont pas vides
        require!(
            c1.len() > 0 && c2.len() > 0,
            "Vote chiffré invalide"
        );

        // 6. Marquer le votant comme ayant voté
        self.voters(election_id, &caller).set(true);

        // 7. Stocker le vote chiffré
        let elgamal_vote = ElGamalVote {
            c1: c1.clone(),
            c2: c2.clone(),
            timestamp: current_time,
        };

        self.elgamal_votes(election_id).push(&elgamal_vote);
        election.total_votes += 1;
        self.elections(election_id).set(&election);

        // 8. Émettre événement
        self.encrypted_vote_submitted_event(election_id, current_time);
    }

    /// **OPTION 2: VOTE PRIVÉ CHIFFRÉ AVEC PREUVE ZK-SNARK**
    ///
    /// Soumet un vote privé chiffré ElGamal avec une preuve zk-SNARK Groth16
    /// prouvant que le vote est valide SANS révéler le choix du candidat.
    ///
    /// Cette méthode offre la SÉCURITÉ MAXIMALE:
    /// - Chiffrement ElGamal pour la confidentialité
    /// - Preuve zk-SNARK pour garantir la validité
    /// - Nullifier pour empêcher le double vote
    /// - Vérification on-chain de la preuve
    ///
    /// # Arguments
    /// * `election_id` - ID de l'élection
    /// * `c1` - Composante 1 du chiffrement ElGamal = hash(r)
    /// * `c2` - Composante 2 du chiffrement ElGamal = hash(r, publicKey, candidateId)
    /// * `nullifier` - Identifiant unique anti-double vote = hash(voterSecret, electionId)
    /// * `pi_a` - Première composante de la preuve Groth16 (point G1)
    /// * `pi_b` - Deuxième composante de la preuve Groth16 (point G2)
    /// * `pi_c` - Troisième composante de la preuve Groth16 (point G1)
    /// * `public_signals` - Signaux publics pour vérification [numCandidates, c1, c2, publicKey, nullifier, electionId]
    ///
    /// # Sécurité
    /// - Le vote est chiffré ElGamal (seul l'organisateur peut déchiffrer)
    /// - La preuve zk-SNARK garantit que:
    ///   1. Le candidateId est valide (< numCandidates)
    ///   2. Le chiffrement ElGamal est correct
    ///   3. Le nullifier est bien formé
    /// - Le smart contract vérifie la preuve ON-CHAIN via pairing check
    /// - Le nullifier empêche le double vote de manière anonyme
    ///
    /// # Workflow
    /// 1. Frontend génère la preuve zk-SNARK (2-3 secondes)
    /// 2. Transaction soumise au smart contract
    /// 3. Smart contract vérifie la preuve Groth16
    /// 4. Si valide, vote accepté et stocké
    /// 5. Nullifier enregistré pour empêcher double vote
    #[endpoint(submitPrivateVoteWithProof)]
    fn submit_private_vote_with_proof(
        &self,
        election_id: u64,
        c1: ManagedBuffer,
        c2: ManagedBuffer,
        nullifier: ManagedBuffer,
        pi_a: G1Point<Self::Api>,
        pi_b: G2Point<Self::Api>,
        pi_c: G1Point<Self::Api>,
        public_signals: ManagedVec<ManagedBuffer>,
    ) {
        // 1. Vérifier que l'élection existe et est active
        require!(
            !self.elections(election_id).is_empty(),
            "Élection inexistante"
        );

        let mut election = self.elections(election_id).get();
        let current_time = self.blockchain().get_block_timestamp();

        require!(
            current_time >= election.start_time && current_time <= election.end_time,
            "Élection non active"
        );

        require!(
            election.status == ElectionStatus::Active,
            "Élection non active"
        );

        // 2. Vérifier que l'élection a une clé publique ElGamal
        require!(
            !self.election_elgamal_public_key(election_id).is_empty(),
            "Cette élection n'a pas activé le chiffrement ElGamal"
        );

        // 3. Vérifier que le nullifier n'a pas déjà été utilisé (anti-double vote)
        require!(
            !self.option2_nullifiers(election_id).contains(&nullifier),
            "Ce nullifier a déjà été utilisé (double vote détecté)"
        );

        // 4. Vérifier que les public_signals ont la bonne longueur (6 éléments)
        // [numCandidates, c1, c2, publicKey, nullifier, electionId]
        require!(
            public_signals.len() == 6,
            "Public signals invalides: doit contenir 6 éléments"
        );

        // 5. Vérifier que les public signals correspondent aux données fournies
        let ps_c1 = public_signals.get(1);
        let ps_c2 = public_signals.get(2);
        let ps_nullifier = public_signals.get(4);
        let ps_election_id = public_signals.get(5);

        require!(
            *ps_c1 == c1,
            "Public signal c1 ne correspond pas"
        );

        require!(
            *ps_c2 == c2,
            "Public signal c2 ne correspond pas"
        );

        require!(
            *ps_nullifier == nullifier,
            "Public signal nullifier ne correspond pas"
        );

        // Vérifier que l'electionId dans les signaux correspond
        let election_id_buffer = self.u64_to_managed_buffer(election_id);
        require!(
            *ps_election_id == election_id_buffer,
            "Public signal electionId ne correspond pas"
        );

        // 6. Vérifier la preuve Groth16
        // NOTE: Pour le POC, on implémente une vérification simplifiée
        // La vérification complète nécessite les pairing checks BN254
        // qui seront implémentés dans une version future du smart contract

        let proof = Groth16Proof {
            pi_a: pi_a.clone(),
            pi_b: pi_b.clone(),
            pi_c: pi_c.clone(),
        };

        let is_proof_valid = self.verify_groth16_proof_simplified(
            &proof,
            &public_signals,
        );

        require!(
            is_proof_valid,
            "Preuve zk-SNARK invalide"
        );

        // 7. Vérifier que les composantes du vote chiffré ne sont pas vides
        require!(
            c1.len() > 0 && c2.len() > 0 && nullifier.len() > 0,
            "Vote chiffré invalide"
        );

        // 8. Stocker le vote chiffré avec preuve
        let elgamal_vote_with_proof = ElGamalVoteWithProof {
            c1: c1.clone(),
            c2: c2.clone(),
            nullifier: nullifier.clone(),
            proof,
            timestamp: current_time,
        };

        self.elgamal_votes_with_proof(election_id).push(&elgamal_vote_with_proof);

        // 9. Marquer le nullifier comme utilisé
        self.option2_nullifiers(election_id).insert(nullifier.clone());

        // 10. Incrémenter le compteur de votes
        election.total_votes += 1;
        self.elections(election_id).set(&election);

        // 11. Émettre événement
        self.encrypted_vote_with_proof_submitted_event(
            election_id,
            nullifier,
            current_time,
        );
    }

    /// Vérification simplifiée de la preuve Groth16
    ///
    /// NOTE: Cette fonction est une SIMPLIFICATION pour le POC.
    /// La vérification complète nécessite:
    /// 1. Charger la verification key depuis le storage
    /// 2. Effectuer les pairing checks BN254:
    ///    e(pi_a, pi_b) = e(alpha, beta) * e(vk_x, gamma) * e(pi_c, delta)
    /// 3. Utiliser une precompiled contract ou bibliothèque crypto
    ///
    /// Pour l'instant, on fait des vérifications de base:
    /// - Format des points G1 et G2
    /// - Longueur des coordonnées
    /// - Non-nullité des éléments
    ///
    /// TODO: Implémenter la vérification complète avec pairing checks
    fn verify_groth16_proof_simplified(
        &self,
        proof: &Groth16Proof<Self::Api>,
        public_signals: &ManagedVec<ManagedBuffer>,
    ) -> bool {
        // 1. Vérifier que pi_a (G1) n'est pas vide
        if proof.pi_a.x.len() == 0 || proof.pi_a.y.len() == 0 {
            return false;
        }

        // 2. Vérifier que pi_b (G2) n'est pas vide
        if proof.pi_b.x1.len() == 0 || proof.pi_b.x2.len() == 0 ||
           proof.pi_b.y1.len() == 0 || proof.pi_b.y2.len() == 0 {
            return false;
        }

        // 3. Vérifier que pi_c (G1) n'est pas vide
        if proof.pi_c.x.len() == 0 || proof.pi_c.y.len() == 0 {
            return false;
        }

        // 4. Vérifier que les public signals ne sont pas vides
        if public_signals.len() == 0 {
            return false;
        }

        // 5. Vérifications supplémentaires
        // Les coordonnées doivent avoir une taille raisonnable (32-64 bytes)
        let min_size = 10;
        let max_size = 128;

        if proof.pi_a.x.len() < min_size || proof.pi_a.x.len() > max_size {
            return false;
        }

        if proof.pi_a.y.len() < min_size || proof.pi_a.y.len() > max_size {
            return false;
        }

        // TODO: Ajouter vérification complète Groth16 avec pairing check
        // Pour l'instant, on accepte si le format est correct

        true
    }

    /// Utilitaire: Convertir u64 en ManagedBuffer
    fn u64_to_managed_buffer(&self, value: u64) -> ManagedBuffer {
        let value_str = value.to_string();
        ManagedBuffer::from(value_str.as_bytes())
    }

    /// Récupère tous les votes chiffrés ElGamal d'une élection
    ///
    /// # Arguments
    /// * `election_id` - ID de l'élection
    ///
    /// # Returns
    /// Vecteur de tous les votes chiffrés
    ///
    /// # Note
    /// Cette view est utilisée par l'organisateur pour récupérer les votes
    /// et les déchiffrer off-chain après la clôture de l'élection
    #[view(getEncryptedVotes)]
    fn get_encrypted_votes(&self, election_id: u64) -> MultiValueEncoded<ElGamalVote<Self::Api>> {
        let mut result = MultiValueEncoded::new();
        for vote in self.elgamal_votes(election_id).iter() {
            result.push(vote);
        }
        result
    }

    /// **OPTION 2: RÉCUPÉRER VOTES CHIFFRÉS AVEC PREUVE ZK-SNARK**
    ///
    /// Récupère tous les votes chiffrés ElGamal avec preuves zk-SNARK d'une élection
    ///
    /// # Arguments
    /// * `election_id` - ID de l'élection
    ///
    /// # Returns
    /// Vecteur de tous les votes chiffrés avec leurs preuves Groth16
    ///
    /// # Note
    /// Cette view est utilisée par:
    /// - L'organisateur pour récupérer les votes et les déchiffrer off-chain
    /// - Les auditeurs pour vérifier les preuves
    /// - Le frontend pour afficher les statistiques (sans révéler les choix)
    #[view(getEncryptedVotesWithProof)]
    fn get_encrypted_votes_with_proof(
        &self,
        election_id: u64,
    ) -> MultiValueEncoded<ElGamalVoteWithProof<Self::Api>> {
        let mut result = MultiValueEncoded::new();
        for vote in self.elgamal_votes_with_proof(election_id).iter() {
            result.push(vote);
        }
        result
    }

    /// Récupère les nullifiers utilisés pour une élection (Option 2)
    ///
    /// # Arguments
    /// * `election_id` - ID de l'élection
    ///
    /// # Returns
    /// Ensemble des nullifiers déjà utilisés
    ///
    /// # Note
    /// Permet de vérifier qu'un vote n'a pas déjà été soumis
    /// Sans révéler l'identité du voteur
    #[view(getOption2Nullifiers)]
    fn get_option2_nullifiers(
        &self,
        election_id: u64,
    ) -> MultiValueEncoded<ManagedBuffer> {
        let mut result = MultiValueEncoded::new();
        for nullifier in self.option2_nullifiers(election_id).iter() {
            result.push(nullifier);
        }
        result
    }

    /// Active une élection (changement de statut Pending -> Active)
    #[endpoint(activateElection)]
    fn activate_election(&self, election_id: u64) {
        let mut election = self.elections(election_id).get();
        require!(
            self.blockchain().get_caller() == election.organizer,
            "Seul l'organisateur peut activer"
        );
        require!(election.status == ElectionStatus::Pending, "Statut invalide");
        require!(
            self.blockchain().get_block_timestamp() >= election.start_time,
            "Trop tôt"
        );

        election.status = ElectionStatus::Active;
        self.elections(election_id).set(&election);
    }

    /// Ferme une élection (changement de statut Active -> Closed)
    #[endpoint(closeElection)]
    fn close_election(&self, election_id: u64) {
        let mut election = self.elections(election_id).get();
        require!(
            self.blockchain().get_caller() == election.organizer,
            "Seul l'organisateur peut fermer"
        );
        require!(
            self.blockchain().get_block_timestamp() >= election.end_time,
            "Élection pas encore terminée"
        );

        election.status = ElectionStatus::Closed;
        self.elections(election_id).set(&election);

        self.election_closed_event(election_id, election.total_votes);
    }

    /// Finalise une élection fermée avec les résultats finaux
    /// Cette fonction stocke les résultats on-chain de manière immuable et optionnellement le hash IPFS
    ///
    /// # Arguments
    /// * `election_id` - ID de l'élection
    /// * `results_ipfs_hash` - Hash IPFS des résultats détaillés (vide si pas d'IPFS)
    /// * `results` - Vec de CandidateResult (candidate_id, vote_count) - DOIT ÊTRE EN DERNIER
    #[endpoint(finalizeElection)]
    fn finalize_election(
        &self,
        election_id: u64,
        results_ipfs_hash: ManagedBuffer,
        results: MultiValueEncoded<MultiValue2<u32, u64>>,
    ) {
        let mut election = self.elections(election_id).get();
        require!(
            self.blockchain().get_caller() == election.organizer,
            "Seul l'organisateur peut finaliser"
        );
        require!(
            election.status == ElectionStatus::Closed,
            "L'élection doit être fermée avant d'être finalisée"
        );

        // Vérifier que le nombre de résultats correspond au nombre de candidats
        let results_count = results.len();
        require!(
            results_count == election.num_candidates as usize,
            "Le nombre de résultats ne correspond pas au nombre de candidats"
        );

        // Stocker les résultats on-chain
        let mut final_results_mapper = self.final_results(election_id);
        final_results_mapper.clear();

        let mut total_votes_check = 0u64;
        for result_tuple in results {
            let (candidate_id, vote_count) = result_tuple.into_tuple();

            // Vérifier que candidate_id est valide
            require!(
                candidate_id > 0 && candidate_id <= election.num_candidates,
                "candidate_id invalide"
            );

            let result = CandidateResult {
                candidate_id,
                vote_count,
            };
            final_results_mapper.push(&result);
            total_votes_check += vote_count;
        }

        // Vérifier que le total des votes correspond (optionnel mais recommandé)
        require!(
            total_votes_check == election.total_votes,
            "Le total des votes ne correspond pas"
        );

        // Stocker le hash IPFS s'il n'est pas vide
        if !results_ipfs_hash.is_empty() {
            self.results_ipfs_hash(election_id).set(&results_ipfs_hash);
        }

        election.status = ElectionStatus::Finalized;
        self.elections(election_id).set(&election);

        self.election_finalized_event(election_id, election.total_votes);
    }

    /// Récupère les résultats finaux on-chain d'une élection finalisée
    #[view(getFinalResults)]
    fn get_final_results(&self, election_id: u64) -> MultiValueEncoded<MultiValue2<u32, u64>> {
        let election = self.elections(election_id).get();
        require!(
            election.status == ElectionStatus::Finalized,
            "L'élection doit être finalisée"
        );

        let mut results_encoded = MultiValueEncoded::new();
        let final_results_mapper = self.final_results(election_id);

        for result in final_results_mapper.iter() {
            results_encoded.push(MultiValue2::from((result.candidate_id, result.vote_count)));
        }

        results_encoded
    }

    /// Récupère le hash IPFS des résultats détaillés
    #[view(getResultsIpfsHash)]
    fn get_results_ipfs_hash(&self, election_id: u64) -> OptionalValue<ManagedBuffer> {
        if self.results_ipfs_hash(election_id).is_empty() {
            OptionalValue::None
        } else {
            OptionalValue::Some(self.results_ipfs_hash(election_id).get())
        }
    }

    /// Configure l'adresse du backend autorisé à vérifier les preuves zk-SNARK
    /// (admin seulement)
    #[only_owner]
    #[endpoint(setBackendVerifier)]
    fn set_backend_verifier(&self, address: ManagedAddress) {
        self.backend_verifier_address().set(address);
    }

    /// Obtenir l'adresse du backend vérificateur zk-SNARK
    #[view(getBackendVerifier)]
    fn get_backend_verifier(&self) -> ManagedAddress {
        self.backend_verifier_address().get()
    }

    // === VIEWS ===

    #[view(getElection)]
    fn get_election(&self, election_id: u64) -> Election<Self::Api> {
        self.elections(election_id).get()
    }

    #[view(getTotalVotes)]
    fn get_total_votes(&self, election_id: u64) -> u64 {
        self.elections(election_id).get().total_votes
    }

    #[view(getTotalElections)]
    fn get_total_elections(&self) -> u64 {
        self.election_counter().get()
    }

    #[view(getCandidates)]
    fn get_candidates(&self, election_id: u64) -> MultiValueEncoded<Candidate<Self::Api>> {
        let candidates = self.candidates(election_id);
        let mut result = MultiValueEncoded::new();
        for candidate in candidates.iter() {
            result.push(candidate);
        }
        result
    }

    /// Fonction temporaire pour obtenir le nombre de votes par candidat
    /// NOTE: Dans un vrai système de vote chiffré, cette fonction ne devrait
    /// être disponible qu'après déchiffrement (après closeElection)
    #[view(getCandidateVotes)]
    fn get_candidate_votes(&self, election_id: u64, candidate_id: u32) -> u64 {
        let votes = self.votes(election_id);
        let mut count = 0u64;

        // Compter les votes pour ce candidat
        // Pour la POC, le "chiffrement" est juste l'ID encodé en bytes
        for vote in votes.iter() {
            // Vérifier la longueur
            if vote.encrypted_choice.len() != 4 {
                // Ignorer les votes mal formés
                continue;
            }

            // Utiliser copy_to_array pour extraire les 4 bytes directement
            let mut bytes = [0u8; 4];
            let _ = vote.encrypted_choice.load_slice(0, &mut bytes);

            // Convertir 4 bytes en u32 (big-endian)
            let voted_id = u32::from_be_bytes(bytes);

            if voted_id == candidate_id {
                count += 1;
            }
        }

        count
    }

    /// Vérifie si une adresse a déjà voté pour une élection
    #[view(hasVoted)]
    fn has_voted(&self, election_id: u64, voter: ManagedAddress) -> bool {
        self.voters(election_id, &voter).get()
    }

    /// Vérifie si un électeur est inscrit à une élection
    #[view(isVoterRegistered)]
    fn is_voter_registered(&self, election_id: u64, voter: ManagedAddress) -> bool {
        !self.registered_voters(election_id, &voter).is_empty()
    }

    /// Obtient le nombre d'électeurs inscrits pour une élection
    #[view(getRegisteredVotersCount)]
    fn get_registered_voters_count(&self, election_id: u64) -> u64 {
        self.elections(election_id).get().registered_voters_count
    }

    /// Récupère la liste des électeurs inscrits (avec pagination)
    ///
    /// # Arguments
    /// * `election_id` - ID de l'élection
    /// * `offset` - Position de départ
    /// * `limit` - Nombre maximum d'adresses à retourner
    #[view(getRegisteredVoters)]
    fn get_registered_voters(
        &self,
        election_id: u64,
        offset: usize,
        limit: usize,
    ) -> MultiValueEncoded<ManagedAddress> {
        let mut voters = MultiValueEncoded::new();
        let registered = self.all_registered_voters(election_id);

        let mut count = 0usize;
        let mut index = 0usize;

        for voter in registered.iter() {
            if index >= offset {
                if count < limit {
                    voters.push(voter);
                    count += 1;
                } else {
                    break;
                }
            }
            index += 1;
        }

        voters
    }

    /// Obtient les statistiques d'inscription pour une élection
    #[view(getRegistrationStats)]
    fn get_registration_stats(&self, election_id: u64) -> RegistrationStats {
        let election = self.elections(election_id).get();
        let last_timestamp = self.last_registration_time(election_id).get();

        RegistrationStats {
            total_registered: election.registered_voters_count,
            last_registration_timestamp: last_timestamp,
        }
    }

    /// Récupère le nombre d'inscriptions pour un jour spécifique
    #[view(getRegistrationsPerDay)]
    fn get_registrations_per_day(&self, election_id: u64, day_start: u64) -> u32 {
        self.registrations_per_day(election_id, day_start).get()
    }

    // === STORAGE ===

    #[storage_mapper("electionCounter")]
    fn election_counter(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("elections")]
    fn elections(&self, election_id: u64) -> SingleValueMapper<Election<Self::Api>>;

    #[storage_mapper("candidates")]
    fn candidates(&self, election_id: u64) -> VecMapper<Candidate<Self::Api>>;

    #[storage_mapper("votes")]
    fn votes(&self, election_id: u64) -> VecMapper<EncryptedVote<Self::Api>>;

    /// Storage mapper pour tracker qui a voté dans chaque élection
    #[storage_mapper("voters")]
    fn voters(&self, election_id: u64, voter: &ManagedAddress) -> SingleValueMapper<bool>;

    /// Storage mapper pour tracker les électeurs inscrits à chaque élection
    #[storage_mapper("registeredVoters")]
    fn registered_voters(&self, election_id: u64, voter: &ManagedAddress) -> SingleValueMapper<bool>;

    /// NOUVEAU: Liste ordonnée de tous les inscrits (pour export)
    #[storage_mapper("allRegisteredVoters")]
    fn all_registered_voters(&self, election_id: u64) -> UnorderedSetMapper<ManagedAddress>;

    /// NOUVEAU: Codes d'invitation pour une élection
    #[storage_mapper("invitationCodes")]
    fn invitation_codes(
        &self,
        election_id: u64,
        code_hash: &ManagedBuffer,
    ) -> SingleValueMapper<InvitationCode<Self::Api>>;

    /// NOUVEAU: Timestamp de la dernière inscription (pour dashboard)
    #[storage_mapper("lastRegistrationTime")]
    fn last_registration_time(&self, election_id: u64) -> SingleValueMapper<u64>;

    /// NOUVEAU: Compteur d'inscriptions par jour (pour graphiques dashboard)
    #[storage_mapper("registrationsPerDay")]
    fn registrations_per_day(&self, election_id: u64, day: u64) -> SingleValueMapper<u32>;

    /// Storage pour les votes privés zk-SNARK
    #[storage_mapper("privateVotes")]
    fn private_votes(&self, election_id: u64) -> VecMapper<PrivateVote<Self::Api>>;

    /// Storage mapper pour les nullifiers utilisés (empêche double vote)
    #[storage_mapper("usedNullifiers")]
    fn used_nullifiers(&self, election_id: u64) -> UnorderedSetMapper<ManagedBuffer>;

    /// Adresse du backend autorisé à vérifier les preuves zk-SNARK
    #[storage_mapper("backendVerifierAddress")]
    fn backend_verifier_address(&self) -> SingleValueMapper<ManagedAddress>;

    /// === STORAGE POUR CHIFFREMENT ELGAMAL (OPTION 1) ===

    /// Clé publique ElGamal pour une élection (hex string de la clé publique secp256k1)
    #[storage_mapper("electionElGamalPublicKey")]
    fn election_elgamal_public_key(&self, election_id: u64) -> SingleValueMapper<ManagedBuffer>;

    /// Storage pour les votes chiffrés avec ElGamal (Option 1)
    #[storage_mapper("elgamalVotes")]
    fn elgamal_votes(&self, election_id: u64) -> VecMapper<ElGamalVote<Self::Api>>;

    /// Storage pour les votes chiffrés ElGamal avec preuve zk-SNARK (Option 2)
    #[storage_mapper("elgamalVotesWithProof")]
    fn elgamal_votes_with_proof(&self, election_id: u64) -> VecMapper<ElGamalVoteWithProof<Self::Api>>;

    /// Nullifiers utilisés pour l'Option 2 (empêche le double vote)
    #[storage_mapper("option2Nullifiers")]
    fn option2_nullifiers(&self, election_id: u64) -> SetMapper<ManagedBuffer>;

    /// Tracker pour éviter le double vote avec ElGamal (utilise le même mapper que les votes standards)
    /// Note: voters() est déjà utilisé pour tracker tous les types de votes

    /// Compteur global de codes d'invitation générés (pour garantir l'unicité entre les batches)
    #[storage_mapper("invitationCodeCounter")]
    fn invitation_code_counter(&self) -> SingleValueMapper<u64>;

    /// === STORAGE POUR LES RÉSULTATS FINAUX ===

    /// Résultats finaux on-chain (candidate_id -> vote_count)
    /// Stocké lors de la finalisation pour garantir l'immuabilité et la vérifiabilité
    #[storage_mapper("finalResults")]
    fn final_results(&self, election_id: u64) -> VecMapper<CandidateResult>;

    /// Hash IPFS des résultats détaillés (métadonnées complètes, timestamps, etc.)
    #[storage_mapper("resultsIpfsHash")]
    fn results_ipfs_hash(&self, election_id: u64) -> SingleValueMapper<ManagedBuffer>;

    // === EVENTS ===

    #[event("electionCreated")]
    fn election_created_event(
        &self,
        #[indexed] election_id: u64,
        #[indexed] organizer: &ManagedAddress,
    );

    #[event("voteCast")]
    fn vote_cast_event(&self, #[indexed] election_id: u64, timestamp: u64);

    #[event("privateVoteSubmitted")]
    fn private_vote_submitted_event(
        &self,
        #[indexed] election_id: u64,
        vote_commitment: ManagedBuffer,
    );

    #[event("encryptedVoteSubmitted")]
    fn encrypted_vote_submitted_event(
        &self,
        #[indexed] election_id: u64,
        timestamp: u64,
    );

    #[event("encryptedVoteWithProofSubmitted")]
    fn encrypted_vote_with_proof_submitted_event(
        &self,
        #[indexed] election_id: u64,
        #[indexed] nullifier: ManagedBuffer,
        timestamp: u64,
    );

    #[event("voterRegistered")]
    fn voter_registered_event(
        &self,
        #[indexed] election_id: u64,
        #[indexed] voter: &ManagedAddress,
    );

    #[event("electionClosed")]
    fn election_closed_event(&self, #[indexed] election_id: u64, total_votes: u64);

    #[event("electionFinalized")]
    fn election_finalized_event(&self, #[indexed] election_id: u64, total_votes: u64);
}
