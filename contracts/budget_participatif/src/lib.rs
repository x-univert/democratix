#![no_std]

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

// ==================== TYPES ====================

/// Phase du cycle de budget participatif
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, PartialEq, Clone, Debug)]
pub enum BudgetPhase {
    Submission,  // Dépôt de projets (60 jours)
    Voting,      // Vote citoyen (30 jours)
    Execution,   // Exécution projets (10 mois)
    Closed,      // Cycle terminé
}

/// Catégorie de projet citoyen
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, PartialEq, Clone, Debug)]
pub enum ProjectCategory {
    Transport,
    Environment,
    Culture,
    Sport,
    Education,
    PublicSpace,
    Digital,
    Other,
}

/// Statut d'un projet
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, PartialEq, Clone, Debug)]
pub enum ProjectStatus {
    Proposed,      // Proposé par citoyen
    UnderReview,   // En cours d'évaluation technique
    Validated,     // Validé techniquement
    Rejected,      // Rejeté (infaisable ou hors budget)
    Selected,      // Sélectionné après vote
    InProgress,    // En cours de réalisation
    Completed,     // Terminé
    Cancelled,     // Annulé
}

/// Jalon (milestone) d'avancement projet
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
pub struct Milestone<M: ManagedTypeApi> {
    pub description: ManagedBuffer<M>,
    pub target_date: u64,
    pub completed: bool,
    pub completion_date: Option<u64>,
    pub proof_ipfs: Option<ManagedBuffer<M>>,
}

/// Cycle annuel de budget participatif
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
pub struct ParticipativeBudget<M: ManagedTypeApi> {
    pub id: u64,
    pub commune_id: u64,
    pub year: u32,
    pub total_envelope_euros: u64,
    pub allocated_amount: u64,
    pub phase: BudgetPhase,
    pub submission_start: u64,
    pub submission_end: u64,
    pub voting_start: u64,
    pub voting_end: u64,
    pub execution_start: u64,
    pub execution_end: u64,
    pub projects_count: u32,
    pub validated_projects_count: u32,
    pub selected_projects_count: u32,
    pub created_at: u64,
    pub admin: ManagedAddress<M>,
}

/// Projet citoyen
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
pub struct CitizenProject<M: ManagedTypeApi> {
    pub id: u64,
    pub budget_cycle_id: u64,
    pub title: ManagedBuffer<M>,
    pub description_ipfs: ManagedBuffer<M>,
    pub estimated_cost_euros: u64,
    pub category: ProjectCategory,
    pub proposer: ManagedAddress<M>,
    pub votes_count: u64,
    pub condorcet_score: u32,
    pub ranking: u32,
    pub status: ProjectStatus,
    pub technical_validation_ipfs: Option<ManagedBuffer<M>>,
    pub rejection_reason_ipfs: Option<ManagedBuffer<M>>,
    pub milestones_count: u32,
    pub completed_milestones: u32,
    pub created_at: u64,
}

/// Vote préférentiel (classement Condorcet)
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
pub struct PreferentialVote<M: ManagedTypeApi> {
    pub voter: ManagedAddress<M>,
    pub budget_cycle_id: u64,
    pub project_rankings: ManagedVec<M, u64>, // Liste ordonnée des project_id par préférence
    pub timestamp: u64,
}

// ==================== SMART CONTRACT ====================

/// Smart Contract pour le Budget Participatif
/// Permet aux citoyens de proposer et voter pour des projets financés par la commune
#[multiversx_sc::contract]
pub trait BudgetParticipatifContract {
    #[init]
    fn init(&self) {
        self.next_budget_id().set(1);
        self.next_project_id().set(1);
    }

    /// Fonction appelée lors de l'upgrade du contrat
    #[upgrade]
    fn upgrade(&self) {}

    // ==================== STORAGE ====================

    #[storage_mapper("next_budget_id")]
    fn next_budget_id(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("next_project_id")]
    fn next_project_id(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("budgets")]
    fn budgets(&self) -> MapMapper<u64, ParticipativeBudget<Self::Api>>;

    #[storage_mapper("projects")]
    fn projects(&self) -> MapMapper<u64, CitizenProject<Self::Api>>;

    #[storage_mapper("milestones")]
    fn milestones(&self, project_id: u64) -> VecMapper<Milestone<Self::Api>>;

    #[storage_mapper("votes")]
    fn votes(&self, budget_id: u64) -> MapMapper<ManagedAddress, PreferentialVote<Self::Api>>;

    #[storage_mapper("commune_budgets")]
    fn commune_budgets(&self, commune_id: u64) -> VecMapper<u64>;

    #[storage_mapper("condorcet_matrix")]
    fn condorcet_matrix(&self, budget_id: u64, project_a: u64, project_b: u64) -> SingleValueMapper<u32>;

    // ==================== ENDPOINTS ====================

    /// Créer un nouveau cycle de budget participatif
    ///
    /// # Arguments
    /// * `commune_id` - ID de la commune
    /// * `year` - Année du cycle (ex: 2025)
    /// * `total_envelope_euros` - Enveloppe budgétaire totale
    /// * `submission_duration_days` - Durée phase dépôt (défaut: 60j)
    /// * `voting_duration_days` - Durée phase vote (défaut: 30j)
    #[endpoint(createBudgetCycle)]
    fn create_budget_cycle(
        &self,
        commune_id: u64,
        year: u32,
        total_envelope_euros: u64,
        submission_duration_days: u64,
        voting_duration_days: u64,
    ) -> u64 {
        require!(total_envelope_euros > 0, "Budget envelope must be > 0");
        require!(submission_duration_days >= 30, "Submission period must be >= 30 days");
        require!(voting_duration_days >= 14, "Voting period must be >= 14 days");

        let caller = self.blockchain().get_caller();
        let budget_id = self.next_budget_id().get();
        let current_timestamp = self.blockchain().get_block_timestamp();

        let submission_start = current_timestamp;
        let submission_end = submission_start + (submission_duration_days * 86400);
        let voting_start = submission_end;
        let voting_end = voting_start + (voting_duration_days * 86400);
        let execution_start = voting_end;
        let execution_end = execution_start + (300 * 86400); // 10 mois

        let budget = ParticipativeBudget {
            id: budget_id,
            commune_id,
            year,
            total_envelope_euros,
            allocated_amount: 0,
            phase: BudgetPhase::Submission,
            submission_start,
            submission_end,
            voting_start,
            voting_end,
            execution_start,
            execution_end,
            projects_count: 0,
            validated_projects_count: 0,
            selected_projects_count: 0,
            created_at: current_timestamp,
            admin: caller,
        };

        self.budgets().insert(budget_id, budget);
        self.commune_budgets(commune_id).push(&budget_id);
        self.next_budget_id().set(budget_id + 1);

        // Emit event
        self.budget_cycle_created_event(budget_id, commune_id, year, total_envelope_euros);

        budget_id
    }

    /// Soumettre un projet citoyen
    #[endpoint(submitProject)]
    fn submit_project(
        &self,
        budget_cycle_id: u64,
        title: ManagedBuffer,
        description_ipfs: ManagedBuffer,
        estimated_cost_euros: u64,
        category: ProjectCategory,
    ) -> u64 {
        require!(self.budgets().contains_key(&budget_cycle_id), "Budget cycle not found");
        require!(title.len() > 0, "Title cannot be empty");
        require!(description_ipfs.len() == 46, "Invalid IPFS CID");
        require!(estimated_cost_euros > 0, "Estimated cost must be > 0");

        let mut budget = self.budgets().get(&budget_cycle_id).unwrap();
        require!(budget.phase == BudgetPhase::Submission, "Not in submission phase");
        require!(estimated_cost_euros <= budget.total_envelope_euros, "Cost exceeds total budget");

        let caller = self.blockchain().get_caller();
        let project_id = self.next_project_id().get();
        let current_timestamp = self.blockchain().get_block_timestamp();

        let project = CitizenProject {
            id: project_id,
            budget_cycle_id,
            title: title.clone(),
            description_ipfs: description_ipfs.clone(),
            estimated_cost_euros,
            category: category.clone(),
            proposer: caller.clone(),
            votes_count: 0,
            condorcet_score: 0,
            ranking: 0,
            status: ProjectStatus::Proposed,
            technical_validation_ipfs: None,
            rejection_reason_ipfs: None,
            milestones_count: 0,
            completed_milestones: 0,
            created_at: current_timestamp,
        };

        self.projects().insert(project_id, project);
        budget.projects_count += 1;
        self.budgets().insert(budget_cycle_id, budget);
        self.next_project_id().set(project_id + 1);

        // Emit event
        self.project_submitted_event(project_id, budget_cycle_id, caller, estimated_cost_euros);

        project_id
    }

    /// Valider techniquement un projet (admin uniquement)
    #[endpoint(validateProject)]
    fn validate_project(
        &self,
        project_id: u64,
        approved: bool,
        technical_report_ipfs: ManagedBuffer,
    ) {
        require!(self.projects().contains_key(&project_id), "Project not found");
        require!(technical_report_ipfs.len() == 46, "Invalid IPFS CID");

        let mut project = self.projects().get(&project_id).unwrap();
        let budget = self.budgets().get(&project.budget_cycle_id).unwrap();

        let caller = self.blockchain().get_caller();
        require!(caller == budget.admin, "Only admin can validate");
        require!(project.status == ProjectStatus::Proposed, "Project already reviewed");

        if approved {
            project.status = ProjectStatus::Validated;
            project.technical_validation_ipfs = Some(technical_report_ipfs.clone());

            let mut budget_mut = self.budgets().get(&project.budget_cycle_id).unwrap();
            budget_mut.validated_projects_count += 1;
            self.budgets().insert(project.budget_cycle_id, budget_mut);

            self.project_validated_event(project_id, true);
        } else {
            project.status = ProjectStatus::Rejected;
            project.rejection_reason_ipfs = Some(technical_report_ipfs);
            self.project_validated_event(project_id, false);
        }

        self.projects().insert(project_id, project);
    }

    /// Voter pour des projets (vote préférentiel/Condorcet)
    #[endpoint(voteProjects)]
    fn vote_projects(
        &self,
        budget_cycle_id: u64,
        project_rankings: ManagedVec<u64>,
    ) {
        require!(self.budgets().contains_key(&budget_cycle_id), "Budget cycle not found");
        require!(project_rankings.len() > 0, "Must vote for at least 1 project");

        let budget = self.budgets().get(&budget_cycle_id).unwrap();
        require!(budget.phase == BudgetPhase::Voting, "Not in voting phase");

        let caller = self.blockchain().get_caller();
        require!(!self.votes(budget_cycle_id).contains_key(&caller), "Already voted");

        // Vérifier que tous les projets sont validés
        for project_id in project_rankings.iter() {
            require!(self.projects().contains_key(&project_id), "Project not found");
            let project = self.projects().get(&project_id).unwrap();
            require!(project.status == ProjectStatus::Validated, "Project not validated");
            require!(project.budget_cycle_id == budget_cycle_id, "Project not in this cycle");
        }

        let current_timestamp = self.blockchain().get_block_timestamp();

        let vote = PreferentialVote {
            voter: caller.clone(),
            budget_cycle_id,
            project_rankings: project_rankings.clone(),
            timestamp: current_timestamp,
        };

        // Enregistrer le vote
        self.votes(budget_cycle_id).insert(caller.clone(), vote);

        // Mettre à jour la matrice Condorcet
        self.update_condorcet_matrix(budget_cycle_id, &project_rankings);

        // Incrémenter le compteur de votes pour chaque projet
        for project_id in project_rankings.iter() {
            let mut project = self.projects().get(&project_id).unwrap();
            project.votes_count += 1;
            self.projects().insert(project_id, project);
        }

        self.vote_cast_event(caller, budget_cycle_id);
    }

    /// Allouer automatiquement les fonds après le vote
    #[endpoint(allocateFunds)]
    fn allocate_funds(&self, budget_cycle_id: u64) {
        require!(self.budgets().contains_key(&budget_cycle_id), "Budget cycle not found");

        let mut budget = self.budgets().get(&budget_cycle_id).unwrap();
        let caller = self.blockchain().get_caller();
        require!(caller == budget.admin, "Only admin can allocate funds");
        require!(budget.phase == BudgetPhase::Voting, "Not in voting phase");

        let current_timestamp = self.blockchain().get_block_timestamp();
        require!(current_timestamp >= budget.voting_end, "Voting period not ended");

        // Calculer les scores Condorcet et classer les projets
        let ranked_projects = self.calculate_condorcet_ranking(budget_cycle_id);

        // Allouer les fonds jusqu'à épuisement de l'enveloppe
        let mut remaining_budget = budget.total_envelope_euros;
        let mut selected_count: u32 = 0;

        for project_id in ranked_projects.iter() {
            let mut project = self.projects().get(&project_id).unwrap();

            if project.estimated_cost_euros <= remaining_budget {
                project.status = ProjectStatus::Selected;
                project.ranking = selected_count + 1;
                remaining_budget -= project.estimated_cost_euros;
                selected_count += 1;
                self.projects().insert(project_id, project.clone());

                self.project_selected_event(project_id, project.estimated_cost_euros);
            }
        }

        budget.allocated_amount = budget.total_envelope_euros - remaining_budget;
        budget.selected_projects_count = selected_count;
        budget.phase = BudgetPhase::Execution;
        self.budgets().insert(budget_cycle_id, budget);

        self.funds_allocated_event(budget_cycle_id, budget.total_envelope_euros - remaining_budget, selected_count);
    }

    /// Ajouter un jalon à un projet
    #[endpoint(addMilestone)]
    fn add_milestone(
        &self,
        project_id: u64,
        description: ManagedBuffer,
        target_date: u64,
    ) {
        require!(self.projects().contains_key(&project_id), "Project not found");

        let mut project = self.projects().get(&project_id).unwrap();
        let budget = self.budgets().get(&project.budget_cycle_id).unwrap();

        let caller = self.blockchain().get_caller();
        require!(caller == budget.admin || caller == project.proposer, "Not authorized");
        require!(project.status == ProjectStatus::Selected || project.status == ProjectStatus::InProgress, "Project not selected");

        let milestone = Milestone {
            description,
            target_date,
            completed: false,
            completion_date: None,
            proof_ipfs: None,
        };

        self.milestones(project_id).push(&milestone);
        project.milestones_count += 1;
        self.projects().insert(project_id, project);
    }

    /// Marquer un jalon comme terminé
    #[endpoint(completeMilestone)]
    fn complete_milestone(
        &self,
        project_id: u64,
        milestone_index: usize,
        proof_ipfs: ManagedBuffer,
    ) {
        require!(self.projects().contains_key(&project_id), "Project not found");
        require!(proof_ipfs.len() == 46, "Invalid IPFS CID");

        let mut project = self.projects().get(&project_id).unwrap();
        let budget = self.budgets().get(&project.budget_cycle_id).unwrap();

        let caller = self.blockchain().get_caller();
        require!(caller == budget.admin, "Only admin can complete milestones");

        require!(milestone_index < self.milestones(project_id).len(), "Milestone not found");

        let mut milestone = self.milestones(project_id).get(milestone_index);
        require!(!milestone.completed, "Milestone already completed");

        let current_timestamp = self.blockchain().get_block_timestamp();
        milestone.completed = true;
        milestone.completion_date = Some(current_timestamp);
        milestone.proof_ipfs = Some(proof_ipfs);

        self.milestones(project_id).set(milestone_index, &milestone);

        project.completed_milestones += 1;

        // Si tous les jalons sont terminés, marquer le projet comme terminé
        if project.completed_milestones == project.milestones_count {
            project.status = ProjectStatus::Completed;
        } else {
            project.status = ProjectStatus::InProgress;
        }

        self.projects().insert(project_id, project);
    }

    // ==================== PRIVATE FUNCTIONS ====================

    /// Mettre à jour la matrice de comparaison Condorcet
    fn update_condorcet_matrix(&self, budget_id: u64, rankings: &ManagedVec<u64>) {
        let len = rankings.len();

        for i in 0..len {
            for j in (i + 1)..len {
                let project_a = rankings.get(i);
                let project_b = rankings.get(j);

                // project_a est préféré à project_b (car il apparaît avant dans le classement)
                let current_score = self.condorcet_matrix(budget_id, project_a, project_b).get();
                self.condorcet_matrix(budget_id, project_a, project_b).set(current_score + 1);
            }
        }
    }

    /// Calculer le classement Condorcet des projets
    fn calculate_condorcet_ranking(&self, budget_id: u64) -> ManagedVec<u64> {
        let budget = self.budgets().get(&budget_id).unwrap();
        let mut project_scores: ManagedVec<(u64, u32)> = ManagedVec::new(); // (project_id, score)

        // Récupérer tous les projets validés
        for project_id in 1..self.next_project_id().get() {
            if let Some(project) = self.projects().get(&project_id) {
                if project.budget_cycle_id == budget_id && project.status == ProjectStatus::Validated {
                    let score = self.calculate_project_condorcet_score(budget_id, project_id);
                    project_scores.push((project_id, score));
                }
            }
        }

        // Trier par score décroissant (bubble sort simple)
        let len = project_scores.len();
        for i in 0..len {
            for j in 0..(len - i - 1) {
                let score_j = project_scores.get(j).1;
                let score_j_plus_1 = project_scores.get(j + 1).1;

                if score_j < score_j_plus_1 {
                    let temp = project_scores.get(j);
                    project_scores.set(j, &project_scores.get(j + 1));
                    project_scores.set(j + 1, &temp);
                }
            }
        }

        // Extraire les IDs triés
        let mut ranked_projects: ManagedVec<u64> = ManagedVec::new();
        for i in 0..project_scores.len() {
            ranked_projects.push(project_scores.get(i).0);
        }

        ranked_projects
    }

    /// Calculer le score Condorcet d'un projet
    fn calculate_project_condorcet_score(&self, budget_id: u64, project_id: u64) -> u32 {
        let mut score: u32 = 0;

        // Compter combien de fois ce projet a été préféré aux autres
        for other_project_id in 1..self.next_project_id().get() {
            if other_project_id != project_id {
                if let Some(_other_project) = self.projects().get(&other_project_id) {
                    let wins = self.condorcet_matrix(budget_id, project_id, other_project_id).get();
                    score += wins;
                }
            }
        }

        score
    }

    // ==================== QUERIES ====================

    #[view(getBudgetCycle)]
    fn get_budget_cycle(&self, budget_id: u64) -> Option<ParticipativeBudget<Self::Api>> {
        self.budgets().get(&budget_id)
    }

    #[view(getProject)]
    fn get_project(&self, project_id: u64) -> Option<CitizenProject<Self::Api>> {
        self.projects().get(&project_id)
    }

    #[view(getProjectMilestones)]
    fn get_project_milestones(&self, project_id: u64) -> ManagedVec<Milestone<Self::Api>> {
        self.milestones(project_id).load_as_vec()
    }

    #[view(getCommuneBudgets)]
    fn get_commune_budgets(&self, commune_id: u64) -> ManagedVec<u64> {
        self.commune_budgets(commune_id).load_as_vec()
    }

    // ==================== EVENTS ====================

    #[event("budget_cycle_created")]
    fn budget_cycle_created_event(
        &self,
        #[indexed] budget_id: u64,
        #[indexed] commune_id: u64,
        year: u32,
        total_envelope: u64,
    );

    #[event("project_submitted")]
    fn project_submitted_event(
        &self,
        #[indexed] project_id: u64,
        #[indexed] budget_cycle_id: u64,
        proposer: ManagedAddress,
        estimated_cost: u64,
    );

    #[event("project_validated")]
    fn project_validated_event(
        &self,
        #[indexed] project_id: u64,
        approved: bool,
    );

    #[event("vote_cast")]
    fn vote_cast_event(
        &self,
        #[indexed] voter: ManagedAddress,
        #[indexed] budget_cycle_id: u64,
    );

    #[event("funds_allocated")]
    fn funds_allocated_event(
        &self,
        #[indexed] budget_cycle_id: u64,
        allocated_amount: u64,
        selected_projects: u32,
    );

    #[event("project_selected")]
    fn project_selected_event(
        &self,
        #[indexed] project_id: u64,
        allocated_amount: u64,
    );
}
