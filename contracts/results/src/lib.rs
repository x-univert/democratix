#![no_std]

use multiversx_sc::{derive_imports::*, imports::*};

/// Résultat pour un candidat
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone, Debug)]
pub struct CandidateResult {
    pub candidate_id: u32,
    pub vote_count: u64,
    pub percentage: u64, // Pourcentage * 100 (ex: 4523 = 45.23%)
}

/// Structure représentant les résultats d'une élection
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Debug)]
pub struct ElectionResults {
    pub election_id: u64,
    pub total_votes: u64,
    pub num_candidates: u32,
    pub is_finalized: bool,
    pub finalized_at: u64,
}

/// Smart Contract de Dépouillement des Résultats
///
/// Ce contrat gère le dépouillement et la publication des résultats d'élection.
/// Il utilise le déchiffrement homomorphique pour compter les votes sans révéler
/// les choix individuels.
///
/// NOTE: Pour le POC, ce contrat est une structure de base.
/// L'implémentation complète du déchiffrement homomorphique sera ajoutée
/// dans les prochaines phases du projet.
#[multiversx_sc::contract]
pub trait ResultsContract {
    #[init]
    fn init(&self) {}

    /// Publier les résultats d'une élection (VERSION POC)
    ///
    /// Dans la version production, cette fonction devrait:
    /// 1. Récupérer tous les votes chiffrés du contrat voting
    /// 2. Utiliser le déchiffrement homomorphique pour compter sans révéler
    /// 3. Publier les résultats agrégés
    ///
    /// # Arguments
    /// * `election_id` - ID de l'élection
    /// * `total_votes` - Nombre total de votes
    #[endpoint(publishResults)]
    fn publish_results(
        &self,
        election_id: u64,
        total_votes: u64,
    ) {
        // TODO: Vérifier que l'appelant est autorisé (organisateur ou autorité)
        // TODO: Vérifier que l'élection est fermée
        // TODO: Implémenter le déchiffrement homomorphique

        require!(
            self.results(election_id).is_empty(),
            "Résultats déjà publiés"
        );

        let election_results = ElectionResults {
            election_id,
            total_votes,
            num_candidates: 0, // TODO: Calculer depuis les votes
            is_finalized: true,
            finalized_at: self.blockchain().get_block_timestamp(),
        };

        self.results(election_id).set(&election_results);

        self.results_published_event(election_id, total_votes);
    }

    /// Ajoute un résultat pour un candidat
    #[endpoint(addCandidateResult)]
    fn add_candidate_result(
        &self,
        election_id: u64,
        candidate_id: u32,
        vote_count: u64,
        percentage: u64,
    ) {
        // TODO: Vérifier autorisation
        let result = CandidateResult {
            candidate_id,
            vote_count,
            percentage,
        };
        self.candidate_results(election_id).push(&result);
    }

    /// Récupère le résultat d'un candidat spécifique
    #[view(getCandidateResult)]
    fn get_candidate_result(&self, election_id: u64, index: usize) -> CandidateResult {
        self.candidate_results(election_id).get(index)
    }

    /// Récupérer les résultats d'une élection
    #[view(getResults)]
    fn get_results(&self, election_id: u64) -> ElectionResults {
        require!(
            !self.results(election_id).is_empty(),
            "Résultats non disponibles"
        );

        self.results(election_id).get()
    }

    /// Vérifier si les résultats sont disponibles
    #[view(areResultsAvailable)]
    fn are_results_available(&self, election_id: u64) -> bool {
        !self.results(election_id).is_empty()
    }

    // === STORAGE ===

    #[storage_mapper("results")]
    fn results(&self, election_id: u64) -> SingleValueMapper<ElectionResults>;

    #[storage_mapper("candidateResults")]
    fn candidate_results(&self, election_id: u64) -> VecMapper<CandidateResult>;

    // === EVENTS ===

    #[event("resultsPublished")]
    fn results_published_event(
        &self,
        #[indexed] election_id: u64,
        total_votes: u64,
    );
}
