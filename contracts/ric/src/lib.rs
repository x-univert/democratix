#![no_std]

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

// ==================== TYPES (AVANT LE TRAIT) ====================

#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, PartialEq, Clone, Debug)]
pub enum RICType {
    Legislatif,       // Nouvelle loi
    Abrogatoire,      // Suppression loi existante
    Revocatoire,      // Destitution élu
    Constitutionnel,  // Modification constitution
}

#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, PartialEq, Clone, Debug)]
pub enum RICStatus {
    Draft,                   // Brouillon
    CollectingSignatures,    // Collecte en cours
    SignaturesReached,       // Seuil atteint, en attente validation
    Validated,               // Validé par Conseil Constitutionnel
    Rejected,                // Rejeté par Conseil
    CampaignPeriod,          // Période de campagne
    VotingOpen,              // Vote en cours
    VotingClosed,            // Vote terminé
    Approved,                // Approuvé par vote
    RejectedByVote,          // Rejeté par vote
    Implemented,             // Loi promulguée
}

#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, PartialEq, Clone, Debug)]
pub enum TerritorialScope {
    National,
    Regional { region_id: u32 },
    Departmental { department_id: u32 },
    Municipal { city_code: u32 },
}

#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
pub struct RICProposal<M: ManagedTypeApi> {
    pub id: u64,
    pub ric_type: RICType,
    pub scope: TerritorialScope,
    pub title: ManagedBuffer<M>,
    pub proposed_law_ipfs: ManagedBuffer<M>,      // Hash IPFS du texte de loi complet
    pub justification_ipfs: ManagedBuffer<M>,     // Exposé des motifs
    pub impact_study_ipfs: ManagedBuffer<M>,      // Étude d'impact
    pub signatures_count: u64,
    pub target_signatures: u64,
    pub status: RICStatus,
    pub proposer: ManagedAddress<M>,
    pub created_at: u64,
    pub signature_deadline: u64,
    pub referendum_id: Option<u64>,               // ID du référendum si créé
    pub validation_decision_ipfs: Option<ManagedBuffer<M>>, // Décision Conseil Constit.
}

#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
pub struct RICReferendum<M: ManagedTypeApi> {
    pub id: u64,
    pub proposal_id: u64,
    pub question: ManagedBuffer<M>,
    pub campaign_start: u64,
    pub campaign_end: u64,
    pub vote_start: u64,
    pub vote_end: u64,
    pub total_votes: u64,
    pub yes_votes: u64,
    pub no_votes: u64,
    pub participation_rate: u64,  // Pourcentage * 100 (ex: 6780 = 67.80%)
    pub outcome: Option<ReferendumOutcome>,
}

#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, PartialEq, Clone, Debug)]
pub enum ReferendumOutcome {
    Approved,
    Rejected,
}

#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
pub struct CampaignArgument<M: ManagedTypeApi> {
    pub side: ArgumentSide,
    pub title: ManagedBuffer<M>,
    pub content_ipfs: ManagedBuffer<M>,
    pub author: ManagedAddress<M>,
    pub upvotes: u64,
    pub downvotes: u64,
    pub sources: ManagedVec<M, ManagedBuffer<M>>,
}

#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, PartialEq, Clone, Debug)]
pub enum ArgumentSide {
    For,      // POUR
    Against,  // CONTRE
}

// ==================== SMART CONTRACT ====================

/// Smart Contract pour les Référendums d'Initiative Citoyenne (RIC)
/// Permet aux citoyens de proposer des lois, collecter des signatures,
/// et déclencher automatiquement des référendums
#[multiversx_sc::contract]
pub trait RicContract {
    #[init]
    fn init(&self) {
        self.next_proposal_id().set(1);
        self.next_referendum_id().set(1);
    }

    /// Fonction appelée lors de l'upgrade du contrat
    #[upgrade]
    fn upgrade(&self) {}

    // ==================== STORAGE ====================

    #[storage_mapper("next_proposal_id")]
    fn next_proposal_id(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("next_referendum_id")]
    fn next_referendum_id(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("proposals")]
    fn proposals(&self) -> MapMapper<u64, RICProposal<Self::Api>>;

    #[storage_mapper("referendums")]
    fn referendums(&self) -> MapMapper<u64, RICReferendum<Self::Api>>;

    #[storage_mapper("used_nullifiers")]
    fn used_nullifiers(&self, proposal_id: u64) -> UnorderedSetMapper<ManagedBuffer>;

    #[storage_mapper("campaign_arguments")]
    fn campaign_arguments(&self, referendum_id: u64) -> VecMapper<CampaignArgument<Self::Api>>;

    #[storage_mapper("constitutional_council")]
    fn constitutional_council(&self) -> UnorderedSetMapper<ManagedAddress>;

    #[storage_mapper("electorate_sizes")]
    fn electorate_sizes(&self, scope: &TerritorialScope) -> SingleValueMapper<u64>;

    // ==================== ENDPOINTS ====================

    /// Soumettre une proposition de RIC
    #[endpoint(submitRICProposal)]
    fn submit_ric_proposal(
        &self,
        ric_type: RICType,
        scope: TerritorialScope,
        title: ManagedBuffer,
        proposed_law_ipfs: ManagedBuffer,
        justification_ipfs: ManagedBuffer,
        impact_study_ipfs: ManagedBuffer,
    ) -> u64 {
        let caller = self.blockchain().get_caller();
        let current_time = self.blockchain().get_block_timestamp();

        // Calculer le seuil de signatures requis
        let target_signatures = self.calculate_signature_threshold(&scope);

        // Calculer la deadline (30-90 jours selon scope)
        let signature_deadline = match &scope {
            TerritorialScope::National => current_time + 7_776_000, // 90 jours
            TerritorialScope::Regional { .. } => current_time + 5_184_000, // 60 jours
            TerritorialScope::Departmental { .. } => current_time + 5_184_000, // 60 jours
            TerritorialScope::Municipal { .. } => current_time + 2_592_000, // 30 jours
        };

        let proposal_id = self.next_proposal_id().get();

        let proposal = RICProposal {
            id: proposal_id,
            ric_type,
            scope,
            title: title.clone(),
            proposed_law_ipfs,
            justification_ipfs,
            impact_study_ipfs,
            signatures_count: 0,
            target_signatures,
            status: RICStatus::CollectingSignatures,
            proposer: caller.clone(),
            created_at: current_time,
            signature_deadline,
            referendum_id: None,
            validation_decision_ipfs: None,
        };

        self.proposals().insert(proposal_id, proposal);
        self.next_proposal_id().set(proposal_id + 1);

        // Event
        self.ric_proposal_created_event(
            proposal_id,
            title,
            target_signatures,
            signature_deadline,
        );

        proposal_id
    }

    /// Signer une proposition de RIC
    /// Utilise un système de nullifier pour empêcher double signature
    #[endpoint(signRICProposal)]
    fn sign_ric_proposal(
        &self,
        proposal_id: u64,
        nullifier: ManagedBuffer,  // Hash(citizen_id + proposal_id) from zk-SNARK
    ) {
        let mut proposal = self.proposals().get(&proposal_id).unwrap();

        // Vérifier que la collecte est ouverte
        require!(
            proposal.status == RICStatus::CollectingSignatures,
            "Collecte fermée"
        );

        // Vérifier deadline
        let current_time = self.blockchain().get_block_timestamp();
        require!(
            current_time <= proposal.signature_deadline,
            "Délai dépassé"
        );

        // Vérifier que le nullifier n'a pas déjà été utilisé (pas de double signature)
        let mut nullifiers = self.used_nullifiers(proposal_id);
        require!(
            !nullifiers.contains(&nullifier),
            "Déjà signé"
        );

        // Enregistrer la signature
        proposal.signatures_count += 1;
        nullifiers.insert(nullifier);

        // Event
        self.ric_signature_added_event(
            proposal_id,
            proposal.signatures_count,
            proposal.target_signatures,
        );

        // Si seuil atteint → Changer statut
        if proposal.signatures_count >= proposal.target_signatures {
            proposal.status = RICStatus::SignaturesReached;
            self.ric_threshold_reached_event(proposal_id, proposal.signatures_count);
        }

        self.proposals().insert(proposal_id, proposal);
    }

    /// Validation par le Conseil Constitutionnel
    #[endpoint(validateRICProposal)]
    fn validate_ric_proposal(
        &self,
        proposal_id: u64,
        approved: bool,
        decision_ipfs: ManagedBuffer,
    ) {
        let caller = self.blockchain().get_caller();

        // Seul le Conseil Constitutionnel peut valider
        require!(
            self.constitutional_council().contains(&caller),
            "Non autorisé"
        );

        let mut proposal = self.proposals().get(&proposal_id).unwrap();

        require!(
            proposal.status == RICStatus::SignaturesReached,
            "Pas en attente de validation"
        );

        proposal.validation_decision_ipfs = Some(decision_ipfs);

        if approved {
            proposal.status = RICStatus::Validated;

            // Créer automatiquement le référendum
            let referendum_id = self.create_referendum(proposal_id);
            proposal.referendum_id = Some(referendum_id);

            self.ric_validated_event(proposal_id, referendum_id);
        } else {
            proposal.status = RICStatus::Rejected;
            self.ric_rejected_event(proposal_id);
        }

        self.proposals().insert(proposal_id, proposal);
    }

    /// Créer le référendum associé au RIC
    #[endpoint(createReferendum)]
    fn create_referendum(&self, proposal_id: u64) -> u64 {
        let proposal = self.proposals().get(&proposal_id).unwrap();
        let current_time = self.blockchain().get_block_timestamp();

        let referendum_id = self.next_referendum_id().get();

        // Périodes
        let campaign_start = current_time + 604_800; // +7 jours (préparation)
        let campaign_end = campaign_start + 5_184_000; // +60 jours campagne
        let vote_start = campaign_end + 86_400; // +1 jour (préparation vote)
        let vote_end = vote_start + 86_400; // Vote pendant 1 jour (dimanche)

        let referendum = RICReferendum {
            id: referendum_id,
            proposal_id,
            question: proposal.title.clone(),
            campaign_start,
            campaign_end,
            vote_start,
            vote_end,
            total_votes: 0,
            yes_votes: 0,
            no_votes: 0,
            participation_rate: 0,
            outcome: None,
        };

        self.referendums().insert(referendum_id, referendum);
        self.next_referendum_id().set(referendum_id + 1);

        self.referendum_created_event(
            referendum_id,
            proposal_id,
            campaign_start,
            vote_start,
        );

        referendum_id
    }

    /// Soumettre un argument de campagne
    #[endpoint(submitCampaignArgument)]
    fn submit_campaign_argument(
        &self,
        referendum_id: u64,
        side: ArgumentSide,
        title: ManagedBuffer,
        content_ipfs: ManagedBuffer,
        sources: ManagedVec<ManagedBuffer>,
    ) {
        let referendum = self.referendums().get(&referendum_id).unwrap();
        let current_time = self.blockchain().get_block_timestamp();

        // Vérifier que la campagne est en cours
        require!(
            current_time >= referendum.campaign_start && current_time <= referendum.campaign_end,
            "Campagne pas active"
        );

        let caller = self.blockchain().get_caller();

        let argument = CampaignArgument {
            side,
            title,
            content_ipfs,
            author: caller,
            upvotes: 0,
            downvotes: 0,
            sources,
        };

        self.campaign_arguments(referendum_id).push(&argument);
    }

    /// Voter sur la qualité d'un argument (upvote/downvote)
    #[endpoint(voteOnArgument)]
    fn vote_on_argument(
        &self,
        referendum_id: u64,
        argument_index: usize,
        upvote: bool,
    ) {
        let mut arguments = self.campaign_arguments(referendum_id);
        let mut argument = arguments.get(argument_index);

        if upvote {
            argument.upvotes += 1;
        } else {
            argument.downvotes += 1;
        }

        arguments.set(argument_index, &argument);
    }

    /// Finaliser le référendum (après dépouillement)
    /// Note: Le vote lui-même est géré par le voting_contract principal
    /// Ici on enregistre juste les résultats
    #[endpoint(finalizeReferendum)]
    fn finalize_referendum(
        &self,
        referendum_id: u64,
        yes_votes: u64,
        no_votes: u64,
    ) {
        // TODO: Ajouter vérification que seul le voting_contract peut appeler cet endpoint
        // (via cross-contract call ou multi-sig organizers)

        let mut referendum = self.referendums().get(&referendum_id).unwrap();

        require!(
            referendum.outcome.is_none(),
            "Référendum déjà finalisé"
        );

        let current_time = self.blockchain().get_block_timestamp();
        require!(
            current_time > referendum.vote_end,
            "Vote pas terminé"
        );

        referendum.yes_votes = yes_votes;
        referendum.no_votes = no_votes;
        referendum.total_votes = yes_votes + no_votes;

        // Calculer taux de participation
        let proposal = self.proposals().get(&referendum.proposal_id).unwrap();
        let electorate = self.electorate_sizes(&proposal.scope).get();
        referendum.participation_rate = (referendum.total_votes * 10000) / electorate; // * 100 * 100

        // Déterminer outcome
        let yes_percentage = (yes_votes * 100) / referendum.total_votes;

        // Seuil majorité renforcée pour RIC constitutionnel
        let required_majority = match proposal.ric_type {
            RICType::Constitutionnel => 60,
            _ => 50,
        };

        let outcome = if yes_percentage >= required_majority {
            ReferendumOutcome::Approved
        } else {
            ReferendumOutcome::Rejected
        };

        referendum.outcome = Some(outcome.clone());
        self.referendums().insert(referendum_id, referendum.clone());

        // Mettre à jour le statut de la proposition
        let mut proposal = self.proposals().get(&referendum.proposal_id).unwrap();

        if outcome == ReferendumOutcome::Approved {
            proposal.status = RICStatus::Approved;
            // TODO: Déclencher promulgation loi (via event ou cross-contract call)
            self.ric_approved_event(referendum.proposal_id, yes_votes, no_votes);
        } else {
            proposal.status = RICStatus::RejectedByVote;
            self.ric_rejected_by_vote_event(referendum.proposal_id, yes_votes, no_votes);
        }

        self.proposals().insert(referendum.proposal_id, proposal);
    }

    // ==================== VIEWS ====================

    #[view(getProposal)]
    fn get_proposal(&self, proposal_id: u64) -> RICProposal<Self::Api> {
        self.proposals().get(&proposal_id).unwrap()
    }

    #[view(getReferendum)]
    fn get_referendum(&self, referendum_id: u64) -> RICReferendum<Self::Api> {
        self.referendums().get(&referendum_id).unwrap()
    }

    #[view(getActiveProposals)]
    fn get_active_proposals(&self) -> MultiValueEncoded<RICProposal<Self::Api>> {
        let mut active = MultiValueEncoded::new();
        for (_, proposal) in self.proposals().iter() {
            if proposal.status == RICStatus::CollectingSignatures
                || proposal.status == RICStatus::CampaignPeriod
                || proposal.status == RICStatus::VotingOpen
            {
                active.push(proposal);
            }
        }
        active
    }

    #[view(getCampaignArguments)]
    fn get_campaign_arguments(&self, referendum_id: u64) -> MultiValueEncoded<CampaignArgument<Self::Api>> {
        let mut args = MultiValueEncoded::new();
        for arg in self.campaign_arguments(referendum_id).iter() {
            args.push(arg);
        }
        args
    }

    #[view(getSignatureProgress)]
    fn get_signature_progress(&self, proposal_id: u64) -> (u64, u64) {
        let proposal = self.proposals().get(&proposal_id).unwrap();
        (proposal.signatures_count, proposal.target_signatures)
    }

    // ==================== ADMIN ====================

    #[only_owner]
    #[endpoint(addConstitutionalCouncilMember)]
    fn add_constitutional_council_member(&self, member: ManagedAddress) {
        self.constitutional_council().insert(member);
    }

    #[only_owner]
    #[endpoint(setElectorateSize)]
    fn set_electorate_size(&self, scope: TerritorialScope, size: u64) {
        self.electorate_sizes(&scope).set(size);
    }

    // ==================== PRIVATE FUNCTIONS ====================

    fn calculate_signature_threshold(&self, scope: &TerritorialScope) -> u64 {
        let electorate = self.electorate_sizes(scope).get();

        if electorate == 0 {
            return 100; // Fallback
        }

        match scope {
            TerritorialScope::National => electorate / 100,          // 1%
            TerritorialScope::Regional { .. } => electorate * 2 / 100, // 2%
            TerritorialScope::Departmental { .. } => electorate * 2 / 100, // 2%
            TerritorialScope::Municipal { .. } => electorate * 5 / 100,    // 5%
        }
    }

    // ==================== EVENTS ====================

    #[event("ric_proposal_created")]
    fn ric_proposal_created_event(
        &self,
        #[indexed] proposal_id: u64,
        #[indexed] title: ManagedBuffer,
        #[indexed] target_signatures: u64,
        deadline: u64,
    );

    #[event("ric_signature_added")]
    fn ric_signature_added_event(
        &self,
        #[indexed] proposal_id: u64,
        #[indexed] current_signatures: u64,
        target_signatures: u64,
    );

    #[event("ric_threshold_reached")]
    fn ric_threshold_reached_event(
        &self,
        #[indexed] proposal_id: u64,
        final_signatures: u64,
    );

    #[event("ric_validated")]
    fn ric_validated_event(
        &self,
        #[indexed] proposal_id: u64,
        #[indexed] referendum_id: u64,
    );

    #[event("ric_rejected")]
    fn ric_rejected_event(
        &self,
        #[indexed] proposal_id: u64,
    );

    #[event("referendum_created")]
    fn referendum_created_event(
        &self,
        #[indexed] referendum_id: u64,
        #[indexed] proposal_id: u64,
        #[indexed] campaign_start: u64,
        vote_start: u64,
    );

    #[event("ric_approved")]
    fn ric_approved_event(
        &self,
        #[indexed] proposal_id: u64,
        #[indexed] yes_votes: u64,
        no_votes: u64,
    );

    #[event("ric_rejected_by_vote")]
    fn ric_rejected_by_vote_event(
        &self,
        #[indexed] proposal_id: u64,
        #[indexed] yes_votes: u64,
        no_votes: u64,
    );
}
