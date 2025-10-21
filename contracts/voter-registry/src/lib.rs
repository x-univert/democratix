#![no_std]

use multiversx_sc::{derive_imports::*, imports::*};

mod crypto_mock;

/// Structure représentant un électeur
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Debug)]
pub struct Voter<M: ManagedTypeApi> {
    pub credential_hash: ManagedBuffer<M>,
    pub is_registered: bool,
    pub has_voted: bool,
    pub voting_token: ManagedBuffer<M>,
}

/// Smart Contract d'Enregistrement des Électeurs
///
/// Ce contrat gère l'enregistrement des électeurs éligibles pour une élection.
/// Il utilise des preuves zk-SNARK pour vérifier l'éligibilité sans révéler l'identité.
#[multiversx_sc::contract]
pub trait VoterRegistry {
    #[init]
    fn init(&self) {}

    /// Enregistre un nouvel électeur avec une preuve zk-SNARK
    ///
    /// # Arguments
    /// * `election_id` - ID de l'élection
    /// * `credential_proof` - Preuve zk-SNARK d'éligibilité
    #[endpoint(registerVoter)]
    fn register_voter(
        &self,
        election_id: u64,
        credential_proof: ManagedBuffer,
    ) -> ManagedBuffer {
        // Vérifier la preuve d'éligibilité (version MOCK pour POC)
        require!(
            crypto_mock::crypto_verification::verify_voter_eligibility(&credential_proof),
            "Preuve d'éligibilité invalide"
        );

        let caller = self.blockchain().get_caller();
        let credential_hash_bytes = self.crypto().sha256(&credential_proof);
        let credential_hash = credential_hash_bytes.as_managed_buffer().clone();

        // Vérifier que l'électeur n'est pas déjà enregistré
        require!(
            self.voters(election_id, &credential_hash).is_empty(),
            "Électeur déjà enregistré"
        );

        // Générer un token de vote aveugle unique
        let token = self.generate_voting_token(election_id, &caller);

        let voter = Voter {
            credential_hash: credential_hash.clone(),
            is_registered: true,
            has_voted: false,
            voting_token: token.clone(),
        };

        self.voters(election_id, &credential_hash).set(&voter);

        // Événement
        self.voter_registered_event(election_id, credential_hash);

        token
    }

    /// Vérifie si un token de vote est valide
    #[view(isTokenValid)]
    fn is_token_valid(&self, election_id: u64, token: ManagedBuffer) -> bool {
        // TODO: Implémenter la vérification du token
        !token.is_empty()
    }

    /// Marque un token comme utilisé (après vote)
    #[endpoint(revokeToken)]
    fn revoke_token(&self, election_id: u64, token: ManagedBuffer) {
        // TODO: Vérifier que l'appelant est le contrat de vote
        // TODO: Marquer le token comme utilisé
        require!(!token.is_empty(), "Token invalide");

        self.used_tokens(election_id, &token).set(true);
    }

    // === STORAGE ===

    #[storage_mapper("voters")]
    fn voters(
        &self,
        election_id: u64,
        credential_hash: &ManagedBuffer,
    ) -> SingleValueMapper<Voter<Self::Api>>;

    #[storage_mapper("usedTokens")]
    fn used_tokens(&self, election_id: u64, token: &ManagedBuffer) -> SingleValueMapper<bool>;

    // === EVENTS ===

    #[event("voterRegistered")]
    fn voter_registered_event(&self, #[indexed] election_id: u64, #[indexed] credential_hash: ManagedBuffer);

    // === PRIVATE ===

    fn generate_voting_token(&self, election_id: u64, caller: &ManagedAddress) -> ManagedBuffer {
        let mut data = ManagedBuffer::new();
        data.append_bytes(&election_id.to_be_bytes()[..]);
        data.append(caller.as_managed_buffer());
        data.append_bytes(&self.blockchain().get_block_timestamp().to_be_bytes()[..]);
        self.crypto().sha256(&data).as_managed_buffer().clone()
    }
}
