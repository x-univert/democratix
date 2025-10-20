#![no_std]

multiversx_sc::imports!();

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

    /// Structure représentant les résultats d'une élection
    #[derive(TypeAbi, TopEncode, TopDecode, NestedEncode, NestedDecode)]
    pub struct ElectionResults<M: ManagedTypeApi> {
        election_id: u64,
        total_votes: u64,
        results_by_candidate: ManagedVec<M, CandidateResult<M>>,
        is_finalized: bool,
        finalized_at: u64,
    }

    /// Résultat pour un candidat
    #[derive(TypeAbi, TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
    pub struct CandidateResult<M: ManagedTypeApi> {
        candidate_id: u32,
        vote_count: u64,
        percentage: u64, // Pourcentage * 100 (ex: 4523 = 45.23%)
    }

    /// Publier les résultats d'une élection (VERSION POC)
    ///
    /// Dans la version production, cette fonction devrait:
    /// 1. Récupérer tous les votes chiffrés du contrat voting
    /// 2. Utiliser le déchiffrement homomorphique pour compter sans révéler
    /// 3. Publier les résultats agrégés
    ///
    /// # Arguments
    /// * `election_id` - ID de l'élection
    /// * `results` - Résultats calculés (en production, calculés automatiquement)
    #[endpoint(publishResults)]
    fn publish_results(
        &self,
        election_id: u64,
        results: ManagedVec<CandidateResult<Self::Api>>,
    ) {
        // TODO: Vérifier que l'appelant est autorisé (organisateur ou autorité)
        // TODO: Vérifier que l'élection est fermée
        // TODO: Implémenter le déchiffrement homomorphique

        require!(
            self.results(election_id).is_empty(),
            "Résultats déjà publiés"
        );

        let total_votes: u64 = results.iter().map(|r| r.vote_count).sum();

        let election_results = ElectionResults {
            election_id,
            total_votes,
            results_by_candidate: results,
            is_finalized: true,
            finalized_at: self.blockchain().get_block_timestamp(),
        };

        self.results(election_id).set(&election_results);

        self.results_published_event(election_id, total_votes);
    }

    /// Récupérer les résultats d'une élection
    #[view(getResults)]
    fn get_results(&self, election_id: u64) -> ElectionResults<Self::Api> {
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
    fn results(&self, election_id: u64) -> SingleValueMapper<ElectionResults<Self::Api>>;

    // === EVENTS ===

    #[event("resultsPublished")]
    fn results_published_event(
        &self,
        #[indexed] election_id: u64,
        total_votes: u64,
    );
}
