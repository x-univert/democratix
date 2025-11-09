#![no_std]

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

// ==================== TYPES ====================

/// Type de proposition de DAO politique
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, PartialEq, Clone, Debug)]
pub enum ProposalType {
    Orientation,      // Orientation politique (programme)
    Campaign,         // Campagne électorale
    Budget,           // Dépense budgétaire
    Membership,       // Adhésion nouveau membre
    Expulsion,        // Exclusion membre
    Constitutional,   // Modification statuts/charte
}

/// Statut d'une proposition
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, PartialEq, Clone, Debug)]
pub enum ProposalStatus {
    Active,      // En cours de vote
    Passed,      // Approuvée
    Rejected,    // Rejetée
    Executed,    // Exécutée
    Cancelled,   // Annulée
}

/// Type d'élection interne (primaires)
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, PartialEq, Clone, Debug)]
pub enum PrimaryType {
    Municipal,      // Municipales
    Departmental,   // Départementales
    Regional,       // Régionales
    Legislative,    // Législatives
    Presidential,   // Présidentielle
}

/// Statut d'élection interne
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, PartialEq, Clone, Debug)]
pub enum PrimaryStatus {
    Open,      // Inscriptions ouvertes
    Voting,    // Vote en cours
    Closed,    // Terminée
}

/// Organisation Autonome Décentralisée (DAO) Politique
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
pub struct PoliticalDAO<M: ManagedTypeApi> {
    pub id: u64,
    pub name: ManagedBuffer<M>,
    pub charter_ipfs: ManagedBuffer<M>,
    pub program_ipfs: ManagedBuffer<M>,
    pub logo_ipfs: Option<ManagedBuffer<M>>,
    pub founder: ManagedAddress<M>,
    pub members_count: u64,
    pub treasury_balance: BigUint<M>,
    pub proposals_count: u64,
    pub voting_threshold_percentage: u32,  // Ex: 60% pour valider
    pub membership_fee_egld: BigUint<M>,
    pub created_at: u64,
    pub is_active: bool,
}

/// Membre du DAO
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
pub struct DAOMember<M: ManagedTypeApi> {
    pub address: ManagedAddress<M>,
    pub joined_at: u64,
    pub voting_weight: u64,  // 1 par défaut (égalitaire, pas ploutocratie)
    pub proposals_submitted: u32,
    pub votes_cast: u32,
    pub is_active: bool,
    pub contribution_egld: BigUint<M>,
}

/// Proposition de DAO
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
pub struct DAOProposal<M: ManagedTypeApi> {
    pub id: u64,
    pub dao_id: u64,
    pub proposal_type: ProposalType,
    pub title: ManagedBuffer<M>,
    pub description_ipfs: ManagedBuffer<M>,
    pub proposer: ManagedAddress<M>,
    pub votes_for: u64,
    pub votes_against: u64,
    pub votes_abstain: u64,
    pub status: ProposalStatus,
    pub created_at: u64,
    pub voting_deadline: u64,
    pub execution_data: Option<ManagedBuffer<M>>,  // Données pour exécution automatique
}

/// Primaire interne (sélection candidat)
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
pub struct Primary<M: ManagedTypeApi> {
    pub id: u64,
    pub dao_id: u64,
    pub primary_type: PrimaryType,
    pub territory_code: ManagedBuffer<M>,  // Code INSEE commune/département/région
    pub title: ManagedBuffer<M>,
    pub candidates_count: u32,
    pub total_votes: u64,
    pub status: PrimaryStatus,
    pub registration_deadline: u64,
    pub voting_start: u64,
    pub voting_end: u64,
    pub created_at: u64,
}

/// Candidat à une primaire
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
pub struct Candidate<M: ManagedTypeApi> {
    pub address: ManagedAddress<M>,
    pub primary_id: u64,
    pub name: ManagedBuffer<M>,
    pub program_ipfs: ManagedBuffer<M>,
    pub biography_ipfs: ManagedBuffer<M>,
    pub votes_received: u64,
    pub is_winner: bool,
}

/// Vote dans une primaire
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
pub struct PrimaryVote<M: ManagedTypeApi> {
    pub voter: ManagedAddress<M>,
    pub primary_id: u64,
    pub candidate_address: ManagedAddress<M>,
    pub timestamp: u64,
}

// ==================== SMART CONTRACT ====================

/// Smart Contract pour DAOs Politiques
/// Permet de créer des partis politiques décentralisés avec gouvernance transparente
#[multiversx_sc::contract]
pub trait DaoPoliticalContract {
    #[init]
    fn init(&self) {
        self.next_dao_id().set(1);
        self.next_proposal_id().set(1);
        self.next_primary_id().set(1);
    }

    /// Fonction appelée lors de l'upgrade du contrat
    #[upgrade]
    fn upgrade(&self) {}

    // ==================== STORAGE ====================

    #[storage_mapper("next_dao_id")]
    fn next_dao_id(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("next_proposal_id")]
    fn next_proposal_id(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("next_primary_id")]
    fn next_primary_id(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("daos")]
    fn daos(&self) -> MapMapper<u64, PoliticalDAO<Self::Api>>;

    #[storage_mapper("members")]
    fn members(&self, dao_id: u64) -> MapMapper<ManagedAddress, DAOMember<Self::Api>>;

    #[storage_mapper("proposals")]
    fn proposals(&self) -> MapMapper<u64, DAOProposal<Self::Api>>;

    #[storage_mapper("proposal_votes")]
    fn proposal_votes(&self, proposal_id: u64, voter: &ManagedAddress) -> SingleValueMapper<bool>;

    #[storage_mapper("primaries")]
    fn primaries(&self) -> MapMapper<u64, Primary<Self::Api>>;

    #[storage_mapper("candidates")]
    fn candidates(&self, primary_id: u64) -> VecMapper<Candidate<Self::Api>>;

    #[storage_mapper("primary_votes")]
    fn primary_votes(&self, primary_id: u64) -> MapMapper<ManagedAddress, PrimaryVote<Self::Api>>;

    #[storage_mapper("dao_proposals")]
    fn dao_proposals(&self, dao_id: u64) -> VecMapper<u64>;

    #[storage_mapper("dao_primaries")]
    fn dao_primaries(&self, dao_id: u64) -> VecMapper<u64>;

    // ==================== ENDPOINTS ====================

    /// Créer un nouveau DAO politique
    ///
    /// # Arguments
    /// * `name` - Nom du parti
    /// * `charter_ipfs` - Charte/statuts (IPFS)
    /// * `program_ipfs` - Programme politique (IPFS)
    /// * `voting_threshold` - Seuil de validation (ex: 60 pour 60%)
    /// * `membership_fee` - Cotisation en EGLD
    #[endpoint(createDAO)]
    #[payable("EGLD")]
    fn create_dao(
        &self,
        name: ManagedBuffer,
        charter_ipfs: ManagedBuffer,
        program_ipfs: ManagedBuffer,
        voting_threshold: u32,
        membership_fee: BigUint,
    ) -> u64 {
        require!(name.len() > 0, "Name cannot be empty");
        require!(charter_ipfs.len() == 46, "Invalid charter IPFS CID");
        require!(program_ipfs.len() == 46, "Invalid program IPFS CID");
        require!(voting_threshold > 50 && voting_threshold <= 100, "Threshold must be 51-100%");

        let caller = self.blockchain().get_caller();
        let dao_id = self.next_dao_id().get();
        let current_timestamp = self.blockchain().get_block_timestamp();

        // Payment pour création (optionnel)
        let payment = self.call_value().egld_value().clone_value();

        let dao = PoliticalDAO {
            id: dao_id,
            name: name.clone(),
            charter_ipfs,
            program_ipfs,
            logo_ipfs: None,
            founder: caller.clone(),
            members_count: 1,
            treasury_balance: payment.clone(),
            proposals_count: 0,
            voting_threshold_percentage: voting_threshold,
            membership_fee_egld: membership_fee,
            created_at: current_timestamp,
            is_active: true,
        };

        // Ajouter le fondateur comme premier membre
        let founder_member = DAOMember {
            address: caller.clone(),
            joined_at: current_timestamp,
            voting_weight: 1,
            proposals_submitted: 0,
            votes_cast: 0,
            is_active: true,
            contribution_egld: payment,
        };

        self.daos().insert(dao_id, dao);
        self.members(dao_id).insert(caller.clone(), founder_member);
        self.next_dao_id().set(dao_id + 1);

        // Emit event
        self.dao_created_event(dao_id, caller, name);

        dao_id
    }

    /// Rejoindre un DAO (payer cotisation)
    #[endpoint(joinDAO)]
    #[payable("EGLD")]
    fn join_dao(&self, dao_id: u64) {
        require!(self.daos().contains_key(&dao_id), "DAO not found");

        let mut dao = self.daos().get(&dao_id).unwrap();
        require!(dao.is_active, "DAO is not active");

        let caller = self.blockchain().get_caller();
        require!(!self.members(dao_id).contains_key(&caller), "Already a member");

        let payment = self.call_value().egld_value().clone_value();
        require!(payment >= dao.membership_fee_egld, "Insufficient membership fee");

        let current_timestamp = self.blockchain().get_block_timestamp();

        let member = DAOMember {
            address: caller.clone(),
            joined_at: current_timestamp,
            voting_weight: 1,
            proposals_submitted: 0,
            votes_cast: 0,
            is_active: true,
            contribution_egld: payment.clone(),
        };

        self.members(dao_id).insert(caller.clone(), member);
        dao.members_count += 1;
        dao.treasury_balance += &payment;
        self.daos().insert(dao_id, dao);

        self.member_joined_event(dao_id, caller);
    }

    /// Soumettre une proposition
    #[endpoint(submitProposal)]
    fn submit_proposal(
        &self,
        dao_id: u64,
        proposal_type: ProposalType,
        title: ManagedBuffer,
        description_ipfs: ManagedBuffer,
        voting_duration_days: u64,
    ) -> u64 {
        require!(self.daos().contains_key(&dao_id), "DAO not found");
        require!(title.len() > 0, "Title cannot be empty");
        require!(description_ipfs.len() == 46, "Invalid IPFS CID");
        require!(voting_duration_days >= 7 && voting_duration_days <= 60, "Duration must be 7-60 days");

        let caller = self.blockchain().get_caller();
        require!(self.members(dao_id).contains_key(&caller), "Not a member");

        let proposal_id = self.next_proposal_id().get();
        let current_timestamp = self.blockchain().get_block_timestamp();
        let voting_deadline = current_timestamp + (voting_duration_days * 86400);

        let proposal = DAOProposal {
            id: proposal_id,
            dao_id,
            proposal_type: proposal_type.clone(),
            title: title.clone(),
            description_ipfs,
            proposer: caller.clone(),
            votes_for: 0,
            votes_against: 0,
            votes_abstain: 0,
            status: ProposalStatus::Active,
            created_at: current_timestamp,
            voting_deadline,
            execution_data: None,
        };

        self.proposals().insert(proposal_id, proposal);
        self.dao_proposals(dao_id).push(&proposal_id);

        let mut dao = self.daos().get(&dao_id).unwrap();
        dao.proposals_count += 1;
        self.daos().insert(dao_id, dao);

        let mut member = self.members(dao_id).get(&caller).unwrap();
        member.proposals_submitted += 1;
        self.members(dao_id).insert(caller.clone(), member);

        self.next_proposal_id().set(proposal_id + 1);

        self.proposal_submitted_event(proposal_id, dao_id, caller);

        proposal_id
    }

    /// Voter sur une proposition
    #[endpoint(voteProposal)]
    fn vote_proposal(
        &self,
        proposal_id: u64,
        vote_for: bool,
        abstain: bool,
    ) {
        require!(self.proposals().contains_key(&proposal_id), "Proposal not found");

        let mut proposal = self.proposals().get(&proposal_id).unwrap();
        require!(proposal.status == ProposalStatus::Active, "Proposal not active");

        let caller = self.blockchain().get_caller();
        require!(self.members(proposal.dao_id).contains_key(&caller), "Not a member");
        require!(!self.proposal_votes(proposal_id, &caller).get(), "Already voted");

        let current_timestamp = self.blockchain().get_block_timestamp();
        require!(current_timestamp < proposal.voting_deadline, "Voting period ended");

        if abstain {
            proposal.votes_abstain += 1;
        } else if vote_for {
            proposal.votes_for += 1;
        } else {
            proposal.votes_against += 1;
        }

        self.proposal_votes(proposal_id, &caller).set(true);
        self.proposals().insert(proposal_id, proposal);

        let mut member = self.members(proposal.dao_id).get(&caller).unwrap();
        member.votes_cast += 1;
        self.members(proposal.dao_id).insert(caller.clone(), member);

        self.vote_cast_on_proposal_event(proposal_id, caller);
    }

    /// Finaliser une proposition (après deadline)
    #[endpoint(finalizeProposal)]
    fn finalize_proposal(&self, proposal_id: u64) {
        require!(self.proposals().contains_key(&proposal_id), "Proposal not found");

        let mut proposal = self.proposals().get(&proposal_id).unwrap();
        require!(proposal.status == ProposalStatus::Active, "Proposal not active");

        let current_timestamp = self.blockchain().get_block_timestamp();
        require!(current_timestamp >= proposal.voting_deadline, "Voting period not ended");

        let dao = self.daos().get(&proposal.dao_id).unwrap();
        let total_votes = proposal.votes_for + proposal.votes_against + proposal.votes_abstain;

        // Calculer si la proposition est approuvée
        let approval_percentage = if total_votes > 0 {
            (proposal.votes_for * 100) / total_votes
        } else {
            0
        };

        if approval_percentage >= dao.voting_threshold_percentage as u64 {
            proposal.status = ProposalStatus::Passed;
        } else {
            proposal.status = ProposalStatus::Rejected;
        }

        self.proposals().insert(proposal_id, proposal.clone());

        self.proposal_finalized_event(proposal_id, proposal.status.clone());
    }

    /// Créer une primaire (élection interne)
    #[endpoint(createPrimary)]
    fn create_primary(
        &self,
        dao_id: u64,
        primary_type: PrimaryType,
        territory_code: ManagedBuffer,
        title: ManagedBuffer,
        registration_duration_days: u64,
        voting_duration_days: u64,
    ) -> u64 {
        require!(self.daos().contains_key(&dao_id), "DAO not found");
        require!(title.len() > 0, "Title cannot be empty");

        let caller = self.blockchain().get_caller();
        require!(self.members(dao_id).contains_key(&caller), "Not a member");

        let primary_id = self.next_primary_id().get();
        let current_timestamp = self.blockchain().get_block_timestamp();
        let registration_deadline = current_timestamp + (registration_duration_days * 86400);
        let voting_start = registration_deadline;
        let voting_end = voting_start + (voting_duration_days * 86400);

        let primary = Primary {
            id: primary_id,
            dao_id,
            primary_type: primary_type.clone(),
            territory_code,
            title: title.clone(),
            candidates_count: 0,
            total_votes: 0,
            status: PrimaryStatus::Open,
            registration_deadline,
            voting_start,
            voting_end,
            created_at: current_timestamp,
        };

        self.primaries().insert(primary_id, primary);
        self.dao_primaries(dao_id).push(&primary_id);
        self.next_primary_id().set(primary_id + 1);

        self.primary_created_event(primary_id, dao_id);

        primary_id
    }

    /// S'inscrire comme candidat à une primaire
    #[endpoint(registerAsCandidate)]
    fn register_as_candidate(
        &self,
        primary_id: u64,
        name: ManagedBuffer,
        program_ipfs: ManagedBuffer,
        biography_ipfs: ManagedBuffer,
    ) {
        require!(self.primaries().contains_key(&primary_id), "Primary not found");
        require!(program_ipfs.len() == 46, "Invalid program IPFS CID");
        require!(biography_ipfs.len() == 46, "Invalid biography IPFS CID");

        let mut primary = self.primaries().get(&primary_id).unwrap();
        require!(primary.status == PrimaryStatus::Open, "Registration closed");

        let caller = self.blockchain().get_caller();
        require!(self.members(primary.dao_id).contains_key(&caller), "Not a DAO member");

        let current_timestamp = self.blockchain().get_block_timestamp();
        require!(current_timestamp < primary.registration_deadline, "Registration period ended");

        let candidate = Candidate {
            address: caller.clone(),
            primary_id,
            name: name.clone(),
            program_ipfs,
            biography_ipfs,
            votes_received: 0,
            is_winner: false,
        };

        self.candidates(primary_id).push(&candidate);
        primary.candidates_count += 1;
        self.primaries().insert(primary_id, primary);

        self.candidate_registered_event(primary_id, caller);
    }

    /// Voter dans une primaire
    #[endpoint(voteInPrimary)]
    fn vote_in_primary(
        &self,
        primary_id: u64,
        candidate_address: ManagedAddress,
    ) {
        require!(self.primaries().contains_key(&primary_id), "Primary not found");

        let mut primary = self.primaries().get(&primary_id).unwrap();
        let current_timestamp = self.blockchain().get_block_timestamp();

        // Passer en phase de vote si nécessaire
        if primary.status == PrimaryStatus::Open && current_timestamp >= primary.voting_start {
            primary.status = PrimaryStatus::Voting;
            self.primaries().insert(primary_id, primary.clone());
        }

        require!(primary.status == PrimaryStatus::Voting, "Voting not open");
        require!(current_timestamp < primary.voting_end, "Voting period ended");

        let caller = self.blockchain().get_caller();
        require!(self.members(primary.dao_id).contains_key(&caller), "Not a DAO member");
        require!(!self.primary_votes(primary_id).contains_key(&caller), "Already voted");

        // Trouver et mettre à jour le candidat
        let candidates_len = self.candidates(primary_id).len();
        let mut found = false;
        for i in 0..candidates_len {
            let mut candidate = self.candidates(primary_id).get(i);
            if candidate.address == candidate_address {
                candidate.votes_received += 1;
                self.candidates(primary_id).set(i, &candidate);
                found = true;
                break;
            }
        }

        require!(found, "Candidate not found");

        let vote = PrimaryVote {
            voter: caller.clone(),
            primary_id,
            candidate_address: candidate_address.clone(),
            timestamp: current_timestamp,
        };

        self.primary_votes(primary_id).insert(caller.clone(), vote);
        primary.total_votes += 1;
        self.primaries().insert(primary_id, primary);

        self.primary_vote_cast_event(primary_id, caller);
    }

    // ==================== QUERIES ====================

    #[view(getDAO)]
    fn get_dao(&self, dao_id: u64) -> Option<PoliticalDAO<Self::Api>> {
        self.daos().get(&dao_id)
    }

    #[view(getDAOMember)]
    fn get_dao_member(&self, dao_id: u64, address: ManagedAddress) -> Option<DAOMember<Self::Api>> {
        self.members(dao_id).get(&address)
    }

    #[view(getProposal)]
    fn get_proposal(&self, proposal_id: u64) -> Option<DAOProposal<Self::Api>> {
        self.proposals().get(&proposal_id)
    }

    #[view(getPrimary)]
    fn get_primary(&self, primary_id: u64) -> Option<Primary<Self::Api>> {
        self.primaries().get(&primary_id)
    }

    #[view(getPrimaryCandidates)]
    fn get_primary_candidates(&self, primary_id: u64) -> ManagedVec<Candidate<Self::Api>> {
        self.candidates(primary_id).load_as_vec()
    }

    // ==================== EVENTS ====================

    #[event("dao_created")]
    fn dao_created_event(
        &self,
        #[indexed] dao_id: u64,
        founder: ManagedAddress,
        name: ManagedBuffer,
    );

    #[event("member_joined")]
    fn member_joined_event(
        &self,
        #[indexed] dao_id: u64,
        member: ManagedAddress,
    );

    #[event("proposal_submitted")]
    fn proposal_submitted_event(
        &self,
        #[indexed] proposal_id: u64,
        #[indexed] dao_id: u64,
        proposer: ManagedAddress,
    );

    #[event("vote_cast_on_proposal")]
    fn vote_cast_on_proposal_event(
        &self,
        #[indexed] proposal_id: u64,
        voter: ManagedAddress,
    );

    #[event("proposal_finalized")]
    fn proposal_finalized_event(
        &self,
        #[indexed] proposal_id: u64,
        status: ProposalStatus,
    );

    #[event("primary_created")]
    fn primary_created_event(
        &self,
        #[indexed] primary_id: u64,
        #[indexed] dao_id: u64,
    );

    #[event("candidate_registered")]
    fn candidate_registered_event(
        &self,
        #[indexed] primary_id: u64,
        candidate: ManagedAddress,
    );

    #[event("primary_vote_cast")]
    fn primary_vote_cast_event(
        &self,
        #[indexed] primary_id: u64,
        voter: ManagedAddress,
    );
}
