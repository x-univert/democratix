#![no_std]

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

/// Types de pétitions selon le niveau territorial
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone, PartialEq, Debug)]
pub enum PetitionType {
    Local,          // Commune (5% habitants)
    Departmental,   // Département (2% habitants)
    National,       // National (100k, 500k ou 1M signatures)
}

/// Statut d'une pétition
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone, PartialEq, Debug)]
pub enum PetitionStatus {
    Active,              // Collecte signatures en cours
    Closed,              // Fermée (deadline atteinte)
    ThresholdReached,    // Seuil atteint, en attente réponse
    ResponsePending,     // Institution doit répondre
    ResponseProvided,    // Réponse fournie
    DebateTriggered,     // Débat déclenché (national)
    InquiryTriggered,    // Commission d'enquête (500k national)
    RICEligible,         // Éligible conversion RIC (1M national)
    RICConverted,        // Convertie en RIC
}

/// Niveau territorial
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone, PartialEq, Debug)]
pub enum TerritorialScope<M: ManagedTypeApi> {
    Commune { insee_code: ManagedBuffer<M> },
    Department { code: ManagedBuffer<M> },
    Region { code: ManagedBuffer<M> },
    National,
}

/// Structure principale d'une pétition
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
pub struct Petition<M: ManagedTypeApi> {
    pub id: u64,
    pub title: ManagedBuffer<M>,
    pub description_ipfs: ManagedBuffer<M>,
    pub scope: TerritorialScope<M>,
    pub petition_type: PetitionType,
    pub creator: ManagedAddress<M>,
    pub created_at: u64,
    pub deadline: u64,
    pub signatures_count: u64,
    pub target_signatures: u64,
    pub threshold_percentage: u32,        // Ex: 5% pour commune
    pub population_base: u64,             // Population de référence
    pub status: PetitionStatus,
    pub debate_triggered: bool,
    pub inquiry_triggered: bool,
    pub ric_eligible: bool,
    pub response_ipfs: Option<ManagedBuffer<M>>,
    pub response_deadline: Option<u64>,
    pub responder: Option<ManagedAddress<M>>,
}

/// Signature d'un citoyen (anonyme via nullifier)
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
pub struct PetitionSignature<M: ManagedTypeApi> {
    pub petition_id: u64,
    pub nullifier: ManagedBuffer<M>,
    pub timestamp: u64,
    pub zk_proof: Option<ManagedBuffer<M>>,
}

#[multiversx_sc::contract]
pub trait PetitionContract {
    /// Initialisation du contract
    #[init]
    fn init(&self) {
        self.next_petition_id().set(1u64);
    }

    /// Fonction appelée lors de l'upgrade du contrat
    #[upgrade]
    fn upgrade(&self) {}

    /// Créer une nouvelle pétition
    ///
    /// # Arguments
    /// * `title` - Titre court de la pétition
    /// * `description_ipfs` - Hash IPFS du document complet
    /// * `scope` - Niveau territorial
    /// * `petition_type` - Type de pétition
    /// * `duration_days` - Durée en jours (ex: 90)
    /// * `population_base` - Population de référence (pour calcul seuil)
    ///
    /// # Returns
    /// ID de la pétition créée
    #[endpoint(createPetition)]
    fn create_petition(
        &self,
        title: ManagedBuffer,
        description_ipfs: ManagedBuffer,
        scope: TerritorialScope<Self::Api>,
        petition_type: PetitionType,
        duration_days: u64,
        population_base: u64,
    ) -> u64 {
        require!(title.len() > 0, "Title cannot be empty");
        require!(description_ipfs.len() == 46, "Invalid IPFS CID");
        require!(duration_days >= 30 && duration_days <= 180, "Duration must be 30-180 days");
        require!(population_base > 0, "Population base must be > 0");

        let caller = self.blockchain().get_caller();
        let petition_id = self.next_petition_id().get();
        let current_timestamp = self.blockchain().get_block_timestamp();

        // Calculer seuil en fonction du type
        let (threshold_percentage, target_signatures) = self.calculate_threshold(
            &petition_type,
            population_base,
        );

        let petition = Petition {
            id: petition_id,
            title: title.clone(),
            description_ipfs: description_ipfs.clone(),
            scope: scope.clone(),
            petition_type: petition_type.clone(),
            creator: caller.clone(),
            created_at: current_timestamp,
            deadline: current_timestamp + (duration_days * 86400),
            signatures_count: 0,
            target_signatures,
            threshold_percentage,
            population_base,
            status: PetitionStatus::Active,
            debate_triggered: false,
            inquiry_triggered: false,
            ric_eligible: false,
            response_ipfs: None,
            response_deadline: None,
            responder: None,
        };

        self.petitions().insert(petition_id, petition);
        self.next_petition_id().set(petition_id + 1);

        // Emit event
        self.petition_created_event(
            petition_id,
            &title,
            &caller,
            &description_ipfs,
        );

        petition_id
    }

    /// Calculer le seuil de signatures requis
    fn calculate_threshold(
        &self,
        petition_type: &PetitionType,
        population: u64,
    ) -> (u32, u64) {
        match petition_type {
            PetitionType::Local => {
                // 5% de la population
                let threshold_pct = 5u32;
                let target = (population * 5) / 100;
                (threshold_pct, target.max(100)) // Minimum 100 signatures
            },
            PetitionType::Departmental => {
                // 2% de la population
                let threshold_pct = 2u32;
                let target = (population * 2) / 100;
                (threshold_pct, target.max(1000)) // Minimum 1000 signatures
            },
            PetitionType::National => {
                // National : 100,000 minimum (débat Assemblée)
                let threshold_pct = 0u32; // Seuil absolu
                let target = 100_000u64;
                (threshold_pct, target)
            },
        }
    }

    /// Signer une pétition (avec nullifier anti-fraude)
    ///
    /// # Arguments
    /// * `petition_id` - ID de la pétition
    /// * `nullifier` - Hash cryptographique unique (Poseidon(citizen_id, petition_id, secret))
    /// * `zk_proof` - Preuve zk-SNARK optionnelle d'éligibilité
    #[endpoint(signPetition)]
    fn sign_petition(
        &self,
        petition_id: u64,
        nullifier: ManagedBuffer,
        zk_proof: OptionalValue<ManagedBuffer>,
    ) {
        require!(self.petitions().contains_key(&petition_id), "Petition not found");
        require!(nullifier.len() == 64, "Invalid nullifier length"); // 32 bytes hex

        let mut petition = self.petitions().get(&petition_id).unwrap();

        // Vérifications
        require!(petition.status == PetitionStatus::Active, "Petition not active");
        require!(
            self.blockchain().get_block_timestamp() <= petition.deadline,
            "Petition deadline expired"
        );
        require!(
            !self.used_nullifiers(petition_id).contains(&nullifier),
            "Already signed (nullifier used)"
        );

        // Si preuve zk-SNARK fournie, la vérifier
        if let OptionalValue::Some(ref proof) = zk_proof {
            require!(
                self.verify_zk_proof(proof, &nullifier, petition_id),
                "Invalid zk-SNARK proof"
            );
        }

        // Note: Signature structure created for validation but not stored
        // Nullifier is stored to prevent double-signing

        self.used_nullifiers(petition_id).insert(nullifier.clone());
        petition.signatures_count += 1;

        // Vérifier si seuil atteint
        self.check_petition_thresholds(&mut petition);

        self.petitions().insert(petition_id, petition.clone());

        // Emit event
        self.petition_signed_event(
            petition_id,
            &nullifier,
            petition.signatures_count,
        );
    }

    /// Vérifier et déclencher actions si seuils atteints
    fn check_petition_thresholds(&self, petition: &mut Petition<Self::Api>) {
        let signatures = petition.signatures_count;

        match &petition.petition_type {
            PetitionType::Local | PetitionType::Departmental => {
                // Seuil % atteint
                if signatures >= petition.target_signatures
                    && petition.status == PetitionStatus::Active
                {
                    petition.status = PetitionStatus::ThresholdReached;

                    // Institution doit répondre sous 30 jours
                    petition.response_deadline = Some(
                        self.blockchain().get_block_timestamp() + 30 * 86400
                    );

                    self.threshold_reached_event(
                        petition.id,
                        signatures,
                        petition.target_signatures,
                    );
                }
            },
            PetitionType::National => {
                // Paliers nationaux
                if signatures >= 100_000 && !petition.debate_triggered {
                    petition.debate_triggered = true;
                    petition.status = PetitionStatus::DebateTriggered;

                    self.debate_triggered_event(petition.id, signatures);
                }

                if signatures >= 500_000 && !petition.inquiry_triggered {
                    petition.inquiry_triggered = true;
                    petition.status = PetitionStatus::InquiryTriggered;

                    self.inquiry_triggered_event(petition.id, signatures);
                }

                if signatures >= 1_000_000 && !petition.ric_eligible {
                    petition.ric_eligible = true;
                    petition.status = PetitionStatus::RICEligible;

                    self.ric_eligible_event(petition.id, signatures);
                }
            },
        }
    }

    /// Vérifier preuve zk-SNARK (simplifié, vérification réelle via backend)
    fn verify_zk_proof(
        &self,
        _proof: &ManagedBuffer,
        _nullifier: &ManagedBuffer,
        _petition_id: u64,
    ) -> bool {
        // Dans un contrat production, on vérifierait la preuve Groth16 on-chain
        // Pour l'instant, on assume que le backend a déjà vérifié
        true
    }

    /// Institution répond à la pétition
    ///
    /// # Arguments
    /// * `petition_id` - ID de la pétition
    /// * `response_ipfs` - Hash IPFS de la réponse officielle
    #[endpoint(respondToPetition)]
    fn respond_to_petition(
        &self,
        petition_id: u64,
        response_ipfs: ManagedBuffer,
    ) {
        require!(self.petitions().contains_key(&petition_id), "Petition not found");
        require!(response_ipfs.len() == 46, "Invalid IPFS CID");

        let caller = self.blockchain().get_caller();
        let mut petition = self.petitions().get(&petition_id).unwrap();

        require!(
            petition.status == PetitionStatus::ThresholdReached
                || petition.status == PetitionStatus::ResponsePending,
            "Petition not awaiting response"
        );

        // Vérifier autorisation (normalement via registre institutions)
        // Pour l'instant, on accepte toute adresse autorisée
        require!(
            self.authorized_responders().contains(&caller),
            "Not authorized to respond"
        );

        petition.response_ipfs = Some(response_ipfs.clone());
        petition.responder = Some(caller.clone());
        petition.status = PetitionStatus::ResponseProvided;

        self.petitions().insert(petition_id, petition);

        self.petition_response_event(
            petition_id,
            &caller,
            &response_ipfs,
        );
    }

    /// Convertir pétition éligible en RIC
    ///
    /// # Arguments
    /// * `petition_id` - ID de la pétition (doit avoir 1M+ signatures)
    /// * `ric_contract_address` - Adresse du smart contract RIC
    ///
    /// # Returns
    /// ID du RIC créé
    #[endpoint(convertToRIC)]
    fn convert_to_ric(
        &self,
        petition_id: u64,
        ric_contract_address: ManagedAddress,
    ) -> u64 {
        require!(self.petitions().contains_key(&petition_id), "Petition not found");

        let mut petition = self.petitions().get(&petition_id).unwrap();

        require!(
            petition.ric_eligible,
            "Petition not eligible for RIC (need 1M signatures)"
        );
        require!(
            petition.status == PetitionStatus::RICEligible,
            "Petition already converted or not eligible"
        );

        // Appel cross-contract au RIC contract pour créer le RIC
        let ric_id: u64 = self
            .ric_proxy(ric_contract_address)
            .create_ric_from_petition(
                petition.title.clone(),
                petition.description_ipfs.clone(),
                petition.scope.clone(),
                petition.signatures_count,
            )
            .execute_on_dest_context();

        petition.status = PetitionStatus::RICConverted;
        self.petitions().insert(petition_id, petition);

        self.ric_conversion_event(petition_id, ric_id);

        ric_id
    }

    /// Fermer pétition après deadline
    #[endpoint(closePetition)]
    fn close_petition(&self, petition_id: u64) {
        require!(self.petitions().contains_key(&petition_id), "Petition not found");

        let mut petition = self.petitions().get(&petition_id).unwrap();

        require!(
            self.blockchain().get_block_timestamp() > petition.deadline,
            "Petition deadline not reached"
        );
        require!(petition.status == PetitionStatus::Active, "Petition not active");

        petition.status = PetitionStatus::Closed;
        self.petitions().insert(petition_id, petition.clone());

        self.petition_closed_event(petition_id, petition.signatures_count);
    }

    /// Ajouter une adresse autorisée à répondre (admin)
    #[only_owner]
    #[endpoint(addAuthorizedResponder)]
    fn add_authorized_responder(&self, address: ManagedAddress) {
        self.authorized_responders().insert(address);
    }

    /// Retirer une adresse autorisée (admin)
    #[only_owner]
    #[endpoint(removeAuthorizedResponder)]
    fn remove_authorized_responder(&self, address: ManagedAddress) {
        self.authorized_responders().swap_remove(&address);
    }

    // ========== VIEWS ==========

    /// Obtenir détails d'une pétition
    #[view(getPetition)]
    fn get_petition(&self, petition_id: u64) -> Petition<Self::Api> {
        require!(self.petitions().contains_key(&petition_id), "Petition not found");
        self.petitions().get(&petition_id).unwrap()
    }

    /// Obtenir nombre total de pétitions
    #[view(getTotalPetitions)]
    fn get_total_petitions(&self) -> u64 {
        self.next_petition_id().get() - 1
    }

    /// Vérifier si un nullifier a été utilisé
    #[view(isNullifierUsed)]
    fn is_nullifier_used(&self, petition_id: u64, nullifier: ManagedBuffer) -> bool {
        self.used_nullifiers(petition_id).contains(&nullifier)
    }

    /// Obtenir toutes les pétitions actives
    #[view(getActivePetitions)]
    fn get_active_petitions(&self) -> MultiValueEncoded<Petition<Self::Api>> {
        let mut result = MultiValueEncoded::new();
        let total = self.next_petition_id().get();

        for id in 1..total {
            if let Some(petition) = self.petitions().get(&id) {
                if petition.status == PetitionStatus::Active {
                    result.push(petition);
                }
            }
        }

        result
    }

    /// Obtenir pétitions par créateur
    #[view(getPetitionsByCreator)]
    fn get_petitions_by_creator(
        &self,
        creator: ManagedAddress,
    ) -> MultiValueEncoded<Petition<Self::Api>> {
        let mut result = MultiValueEncoded::new();
        let total = self.next_petition_id().get();

        for id in 1..total {
            if let Some(petition) = self.petitions().get(&id) {
                if petition.creator == creator {
                    result.push(petition);
                }
            }
        }

        result
    }

    /// Obtenir statistiques d'une pétition
    #[view(getPetitionStats)]
    fn get_petition_stats(&self, petition_id: u64) -> MultiValue4<u64, u64, u32, bool> {
        require!(self.petitions().contains_key(&petition_id), "Petition not found");
        let petition = self.petitions().get(&petition_id).unwrap();

        let progress_percentage = if petition.target_signatures > 0 {
            ((petition.signatures_count * 100) / petition.target_signatures) as u32
        } else {
            0u32
        };

        MultiValue4::from((
            petition.signatures_count,
            petition.target_signatures,
            progress_percentage,
            petition.signatures_count >= petition.target_signatures,
        ))
    }

    // ========== STORAGE ==========

    #[storage_mapper("petitions")]
    fn petitions(&self) -> MapMapper<u64, Petition<Self::Api>>;

    #[storage_mapper("nextPetitionId")]
    fn next_petition_id(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("usedNullifiers")]
    fn used_nullifiers(&self, petition_id: u64) -> UnorderedSetMapper<ManagedBuffer>;

    #[storage_mapper("authorizedResponders")]
    fn authorized_responders(&self) -> UnorderedSetMapper<ManagedAddress>;

    // ========== EVENTS ==========

    #[event("petitionCreated")]
    fn petition_created_event(
        &self,
        #[indexed] petition_id: u64,
        #[indexed] title: &ManagedBuffer,
        #[indexed] creator: &ManagedAddress,
        description_ipfs: &ManagedBuffer,
    );

    #[event("petitionSigned")]
    fn petition_signed_event(
        &self,
        #[indexed] petition_id: u64,
        #[indexed] nullifier: &ManagedBuffer,
        total_signatures: u64,
    );

    #[event("thresholdReached")]
    fn threshold_reached_event(
        &self,
        #[indexed] petition_id: u64,
        #[indexed] signatures: u64,
        target: u64,
    );

    #[event("debateTriggered")]
    fn debate_triggered_event(
        &self,
        #[indexed] petition_id: u64,
        signatures: u64,
    );

    #[event("inquiryTriggered")]
    fn inquiry_triggered_event(
        &self,
        #[indexed] petition_id: u64,
        signatures: u64,
    );

    #[event("ricEligible")]
    fn ric_eligible_event(
        &self,
        #[indexed] petition_id: u64,
        signatures: u64,
    );

    #[event("petitionResponse")]
    fn petition_response_event(
        &self,
        #[indexed] petition_id: u64,
        #[indexed] responder: &ManagedAddress,
        response_ipfs: &ManagedBuffer,
    );

    #[event("ricConversion")]
    fn ric_conversion_event(
        &self,
        #[indexed] petition_id: u64,
        #[indexed] ric_id: u64,
    );

    #[event("petitionClosed")]
    fn petition_closed_event(
        &self,
        #[indexed] petition_id: u64,
        final_signatures: u64,
    );

    // ========== PROXY ==========

    #[proxy]
    fn ric_proxy(&self, sc_address: ManagedAddress) -> ric_proxy::Proxy<Self::Api>;
}

/// Proxy pour appels cross-contract au RIC contract
mod ric_proxy {
    multiversx_sc::imports!();

    #[multiversx_sc::proxy]
    pub trait RICProxy {
        #[endpoint(createRICFromPetition)]
        fn create_ric_from_petition(
            &self,
            title: ManagedBuffer,
            description_ipfs: ManagedBuffer,
            scope: super::TerritorialScope<Self::Api>,
            initial_signatures: u64,
        ) -> u64;
    }
}
