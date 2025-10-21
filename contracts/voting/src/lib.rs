#![no_std]

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
}

/// Vote chiffré
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Debug)]
pub struct EncryptedVote<M: ManagedTypeApi> {
    pub encrypted_choice: ManagedBuffer<M>,
    pub proof: ManagedBuffer<M>,  // zk-SNARK proof
    pub timestamp: u64,
}

/// Smart Contract de Vote
///
/// Ce contrat gère la création d'élections, le vote et le stockage des votes chiffrés.
#[multiversx_sc::contract]
pub trait VotingContract {
    #[init]
    fn init(&self) {}

    /// Crée une nouvelle élection
    ///
    /// # Arguments
    /// * `title` - Titre de l'élection
    /// * `description_ipfs` - Hash IPFS de la description complète
    /// * `start_time` - Timestamp de début
    /// * `end_time` - Timestamp de fin
    #[endpoint(createElection)]
    fn create_election(
        &self,
        title: ManagedBuffer,
        description_ipfs: ManagedBuffer,
        start_time: u64,
        end_time: u64,
    ) -> u64 {
        require!(start_time < end_time, "Dates invalides");
        require!(
            start_time > self.blockchain().get_block_timestamp(),
            "La date de début doit être dans le futur"
        );

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
        voting_token: ManagedBuffer,
        encrypted_vote: EncryptedVote<Self::Api>,
    ) {
        require!(self.elections(election_id).is_empty() == false, "Élection inexistante");

        let mut election = self.elections(election_id).get();

        let current_time = self.blockchain().get_block_timestamp();
        require!(
            current_time >= election.start_time && current_time <= election.end_time,
            "Élection non active"
        );
        require!(election.status == ElectionStatus::Active, "Élection non active");

        // TODO: Vérifier le token avec le contrat voter-registry

        // Vérifier la preuve zk-SNARK du vote (version MOCK pour POC)
        require!(
            crypto_mock::crypto_verification::verify_encrypted_vote(
                &encrypted_vote.encrypted_choice,
                &encrypted_vote.proof
            ),
            "Preuve de vote invalide"
        );

        // Stocker le vote chiffré
        self.votes(election_id).push(&encrypted_vote);
        election.total_votes += 1;
        self.elections(election_id).set(&election);

        // TODO: Révoquer le token dans voter-registry

        self.vote_cast_event(election_id, current_time);
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

    // === VIEWS ===

    #[view(getElection)]
    fn get_election(&self, election_id: u64) -> Election<Self::Api> {
        self.elections(election_id).get()
    }

    #[view(getTotalVotes)]
    fn get_total_votes(&self, election_id: u64) -> u64 {
        self.elections(election_id).get().total_votes
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

    // === EVENTS ===

    #[event("electionCreated")]
    fn election_created_event(
        &self,
        #[indexed] election_id: u64,
        #[indexed] organizer: &ManagedAddress,
    );

    #[event("voteCast")]
    fn vote_cast_event(&self, #[indexed] election_id: u64, timestamp: u64);

    #[event("electionClosed")]
    fn election_closed_event(&self, #[indexed] election_id: u64, total_votes: u64);
}
