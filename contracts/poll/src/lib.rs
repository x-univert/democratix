#![no_std]

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

/// Type de sondage
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone, PartialEq, Debug)]
pub enum PollType {
    Opinion,         // Sondage d'opinion simple
    Deliberative,    // Sondage délibératif (avec pondération démographique)
    PreElection,     // Sondage pré-électoral
    Consultation,    // Consultation publique
}

/// Statut du sondage
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone, PartialEq, Debug)]
pub enum PollStatus {
    Active,
    Closed,
    Analyzing,
    ResultsPublished,
}

/// Type de question
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone, PartialEq, Debug)]
pub enum QuestionType {
    SingleChoice,      // Choix unique
    MultipleChoice,    // Choix multiples
    Scale,             // Échelle (ex: 1-10)
    OpenText,          // Texte libre (hash IPFS)
}

/// Groupe démographique pour pondération
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone, PartialEq, Debug)]
pub enum DemographicGroup<M: ManagedTypeApi> {
    AgeGroup { min: u8, max: u8 },           // Ex: 18-24, 25-34, etc.
    Gender { code: u8 },                     // 0=Homme, 1=Femme, 2=Autre
    Region { code: ManagedBuffer<M> },       // Code région
    EducationLevel { level: u8 },            // 0=Primaire, 1=Secondaire, 2=Supérieur
    EmploymentStatus { status: u8 },         // 0=Employé, 1=Chômeur, 2=Retraité, 3=Étudiant
}

/// Structure d'un sondage
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
pub struct Poll<M: ManagedTypeApi> {
    pub id: u64,
    pub title: ManagedBuffer<M>,
    pub description_ipfs: ManagedBuffer<M>,
    pub poll_type: PollType,
    pub organizer: ManagedAddress<M>,
    pub created_at: u64,
    pub deadline: u64,
    pub status: PollStatus,
    pub total_responses: u64,
    pub requires_demographic_data: bool,
    pub is_anonymous: bool,
    pub results_ipfs: Option<ManagedBuffer<M>>,
}

/// Question d'un sondage
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
pub struct PollQuestion<M: ManagedTypeApi> {
    pub id: u64,
    pub poll_id: u64,
    pub text: ManagedBuffer<M>,
    pub question_type: QuestionType,
    pub options_count: u32,
    pub is_required: bool,
}

/// Option de réponse
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
pub struct PollOption<M: ManagedTypeApi> {
    pub id: u64,
    pub question_id: u64,
    pub text: ManagedBuffer<M>,
    pub votes_count: u64,
    pub weighted_votes_count: u64,  // Avec pondération démographique
}

/// Réponse d'un participant
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
pub struct PollResponse<M: ManagedTypeApi> {
    pub poll_id: u64,
    pub question_id: u64,
    pub nullifier: ManagedBuffer<M>,  // Anonymat
    pub selected_options: ManagedVec<M, u64>,  // IDs options sélectionnées
    pub scale_value: Option<u8>,      // Pour questions échelle
    pub open_text_ipfs: Option<ManagedBuffer<M>>,  // Pour texte libre
    pub demographic_group: Option<DemographicGroup<M>>,
    pub timestamp: u64,
    pub weight: u32,                  // Coefficient pondération (100 = 1.0x)
}

/// Statistiques démographiques
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
pub struct DemographicStats {
    pub poll_id: u64,
    pub total_responses: u64,
    // Simplified: detailed stats stored off-chain in IPFS
}

#[multiversx_sc::contract]
pub trait PollContract {
    /// Initialisation
    #[init]
    fn init(&self) {
        self.next_poll_id().set(1u64);
        self.next_question_id().set(1u64);
        self.next_option_id().set(1u64);
    }

    /// Fonction appelée lors de l'upgrade du contrat
    #[upgrade]
    fn upgrade(&self) {}

    /// Créer un nouveau sondage
    ///
    /// # Arguments
    /// * `title` - Titre du sondage
    /// * `description_ipfs` - Hash IPFS description complète
    /// * `poll_type` - Type de sondage
    /// * `duration_days` - Durée en jours
    /// * `requires_demographic_data` - Collecte données démographiques
    /// * `is_anonymous` - Anonymat des réponses
    ///
    /// # Returns
    /// ID du sondage créé
    #[endpoint(createPoll)]
    fn create_poll(
        &self,
        title: ManagedBuffer,
        description_ipfs: ManagedBuffer,
        poll_type: PollType,
        duration_days: u64,
        requires_demographic_data: bool,
        is_anonymous: bool,
    ) -> u64 {
        require!(title.len() > 0, "Title required");
        require!(description_ipfs.len() == 46, "Invalid IPFS CID");
        require!(duration_days >= 1 && duration_days <= 90, "Duration 1-90 days");

        let caller = self.blockchain().get_caller();
        let poll_id = self.next_poll_id().get();
        let current_timestamp = self.blockchain().get_block_timestamp();

        let poll = Poll {
            id: poll_id,
            title: title.clone(),
            description_ipfs,
            poll_type: poll_type.clone(),
            organizer: caller.clone(),
            created_at: current_timestamp,
            deadline: current_timestamp + (duration_days * 86400),
            status: PollStatus::Active,
            total_responses: 0,
            requires_demographic_data,
            is_anonymous,
            results_ipfs: None,
        };

        self.polls().insert(poll_id, poll);
        self.next_poll_id().set(poll_id + 1);

        self.poll_created_event(poll_id, &title, &caller);

        poll_id
    }

    /// Ajouter une question au sondage
    ///
    /// # Arguments
    /// * `poll_id` - ID du sondage
    /// * `text` - Texte de la question
    /// * `question_type` - Type de question
    /// * `is_required` - Question obligatoire
    ///
    /// # Returns
    /// ID de la question créée
    #[endpoint(addQuestion)]
    fn add_question(
        &self,
        poll_id: u64,
        text: ManagedBuffer,
        question_type: QuestionType,
        is_required: bool,
    ) -> u64 {
        require!(self.polls().contains_key(&poll_id), "Poll not found");

        let caller = self.blockchain().get_caller();
        let poll = self.polls().get(&poll_id).unwrap();

        require!(poll.organizer == caller, "Not poll organizer");
        require!(poll.status == PollStatus::Active, "Poll not active");
        require!(text.len() > 0, "Question text required");

        let question_id = self.next_question_id().get();

        let question = PollQuestion {
            id: question_id,
            poll_id,
            text,
            question_type,
            options_count: 0,
            is_required,
        };

        self.poll_questions(poll_id).push(&question);
        self.next_question_id().set(question_id + 1);

        question_id
    }

    /// Ajouter une option à une question
    ///
    /// # Arguments
    /// * `question_id` - ID de la question
    /// * `text` - Texte de l'option
    ///
    /// # Returns
    /// ID de l'option créée
    #[endpoint(addOption)]
    fn add_option(
        &self,
        poll_id: u64,
        question_id: u64,
        text: ManagedBuffer,
    ) -> u64 {
        require!(self.polls().contains_key(&poll_id), "Poll not found");
        require!(text.len() > 0, "Option text required");

        let caller = self.blockchain().get_caller();
        let poll = self.polls().get(&poll_id).unwrap();

        require!(poll.organizer == caller, "Not poll organizer");

        let option_id = self.next_option_id().get();

        let option = PollOption {
            id: option_id,
            question_id,
            text,
            votes_count: 0,
            weighted_votes_count: 0,
        };

        self.poll_options(question_id).push(&option);
        self.next_option_id().set(option_id + 1);

        // Incrémenter compteur options dans la question
        let mut questions = self.poll_questions(poll_id);
        for i in 0..questions.len() {
            let mut question = questions.get(i);
            if question.id == question_id {
                question.options_count += 1;
                questions.set(i, &question);
                break;
            }
        }

        option_id
    }

    /// Soumettre une réponse au sondage
    ///
    /// # Arguments
    /// * `poll_id` - ID du sondage
    /// * `question_id` - ID de la question
    /// * `nullifier` - Hash anonymat
    /// * `selected_options` - IDs options sélectionnées
    /// * `demographic_group` - Groupe démographique (optionnel)
    #[endpoint(submitResponse)]
    #[allow_multiple_var_args]
    fn submit_response(
        &self,
        poll_id: u64,
        question_id: u64,
        nullifier: ManagedBuffer,
        selected_options: MultiValueEncoded<u64>,
        demographic_group: OptionalValue<DemographicGroup<Self::Api>>,
    ) {
        require!(self.polls().contains_key(&poll_id), "Poll not found");
        require!(nullifier.len() == 64, "Invalid nullifier");

        let mut poll = self.polls().get(&poll_id).unwrap();

        require!(poll.status == PollStatus::Active, "Poll not active");
        require!(
            self.blockchain().get_block_timestamp() <= poll.deadline,
            "Poll deadline expired"
        );
        require!(
            !self.used_nullifiers(poll_id).contains(&nullifier),
            "Already responded"
        );

        // Vérifier que la question existe
        let questions = self.poll_questions(poll_id);
        let mut question_found = false;
        let mut question_type = QuestionType::SingleChoice;

        for i in 0..questions.len() {
            let question = questions.get(i);
            if question.id == question_id {
                question_found = true;
                question_type = question.question_type;
                break;
            }
        }

        require!(question_found, "Question not found");

        // Convertir selected_options en ManagedVec
        let mut options_vec = ManagedVec::new();
        for option_id in selected_options {
            options_vec.push(option_id);
        }

        // Vérifier cohérence avec type question
        match question_type {
            QuestionType::SingleChoice => {
                require!(options_vec.len() == 1, "Single choice: select exactly 1 option");
            },
            QuestionType::MultipleChoice => {
                require!(options_vec.len() > 0, "Multiple choice: select at least 1 option");
            },
            _ => {}
        }

        // Calculer poids pondération démographique
        let weight = if poll.poll_type == PollType::Deliberative {
            if let OptionalValue::Some(ref demo_group) = demographic_group {
                self.calculate_demographic_weight(demo_group)
            } else {
                100 // Poids par défaut 1.0x
            }
        } else {
            100 // Pas de pondération si pas sondage délibératif
        };

        // Enregistrer réponse
        let response = PollResponse {
            poll_id,
            question_id,
            nullifier: nullifier.clone(),
            selected_options: options_vec.clone(),
            scale_value: None,
            open_text_ipfs: None,
            demographic_group: match demographic_group {
                OptionalValue::Some(g) => Some(g),
                OptionalValue::None => None,
            },
            timestamp: self.blockchain().get_block_timestamp(),
            weight,
        };

        self.poll_responses(poll_id).push(&response);
        self.used_nullifiers(poll_id).insert(nullifier.clone());

        // Mettre à jour compteurs options
        let mut options = self.poll_options(question_id);
        for i in 0..options.len() {
            let mut option = options.get(i);

            if options_vec.contains(&option.id) {
                option.votes_count += 1;
                option.weighted_votes_count += weight as u64;
                options.set(i, &option);
            }
        }

        poll.total_responses += 1;
        self.polls().insert(poll_id, poll);

        self.response_submitted_event(poll_id, question_id, &nullifier);
    }

    /// Calculer poids démographique (simplifié)
    fn calculate_demographic_weight(&self, _group: &DemographicGroup<Self::Api>) -> u32 {
        // Dans une implémentation réelle, on calculerait le poids
        // en fonction de la représentativité du groupe dans la population
        // Pour l'instant, retourner poids par défaut
        100 // 1.0x
    }

    /// Fermer le sondage et publier résultats
    #[endpoint(closePoll)]
    fn close_poll(&self, poll_id: u64, results_ipfs: ManagedBuffer) {
        require!(self.polls().contains_key(&poll_id), "Poll not found");
        require!(results_ipfs.len() == 46, "Invalid IPFS CID");

        let caller = self.blockchain().get_caller();
        let mut poll = self.polls().get(&poll_id).unwrap();

        require!(poll.organizer == caller, "Not poll organizer");
        require!(
            self.blockchain().get_block_timestamp() >= poll.deadline
                || poll.status == PollStatus::Active,
            "Cannot close poll yet"
        );

        poll.status = PollStatus::ResultsPublished;
        poll.results_ipfs = Some(results_ipfs.clone());

        self.polls().insert(poll_id, poll);

        self.poll_closed_event(poll_id, &results_ipfs);
    }

    // ========== VIEWS ==========

    /// Obtenir sondage
    #[view(getPoll)]
    fn get_poll(&self, poll_id: u64) -> Poll<Self::Api> {
        require!(self.polls().contains_key(&poll_id), "Poll not found");
        self.polls().get(&poll_id).unwrap()
    }

    /// Obtenir questions d'un sondage
    #[view(getPollQuestions)]
    fn get_poll_questions(&self, poll_id: u64) -> MultiValueEncoded<PollQuestion<Self::Api>> {
        let questions = self.poll_questions(poll_id);
        let mut result = MultiValueEncoded::new();

        for i in 0..questions.len() {
            result.push(questions.get(i));
        }

        result
    }

    /// Obtenir options d'une question
    #[view(getQuestionOptions)]
    fn get_question_options(&self, question_id: u64) -> MultiValueEncoded<PollOption<Self::Api>> {
        let options = self.poll_options(question_id);
        let mut result = MultiValueEncoded::new();

        for i in 0..options.len() {
            result.push(options.get(i));
        }

        result
    }

    /// Obtenir résultats d'une question
    #[view(getQuestionResults)]
    fn get_question_results(
        &self,
        question_id: u64,
    ) -> MultiValue2<u64, MultiValueEncoded<MultiValue3<u64, u64, u64>>> {
        let options = self.poll_options(question_id);
        let mut total_votes = 0u64;
        let mut results = MultiValueEncoded::new();

        for i in 0..options.len() {
            let option = options.get(i);
            total_votes += option.votes_count;

            results.push(MultiValue3::from((
                option.id,
                option.votes_count,
                option.weighted_votes_count,
            )));
        }

        MultiValue2::from((total_votes, results))
    }

    /// Obtenir tous les sondages actifs
    #[view(getActivePolls)]
    fn get_active_polls(&self) -> MultiValueEncoded<Poll<Self::Api>> {
        let mut result = MultiValueEncoded::new();
        let total = self.next_poll_id().get();

        for id in 1..total {
            if let Some(poll) = self.polls().get(&id) {
                if poll.status == PollStatus::Active {
                    result.push(poll);
                }
            }
        }

        result
    }

    /// Vérifier si un utilisateur a répondu
    #[view(hasResponded)]
    fn has_responded(&self, poll_id: u64, nullifier: ManagedBuffer) -> bool {
        self.used_nullifiers(poll_id).contains(&nullifier)
    }

    /// Obtenir nombre total de sondages
    #[view(getTotalPolls)]
    fn get_total_polls(&self) -> u64 {
        self.next_poll_id().get() - 1
    }

    // ========== STORAGE ==========

    #[storage_mapper("polls")]
    fn polls(&self) -> MapMapper<u64, Poll<Self::Api>>;

    #[storage_mapper("pollQuestions")]
    fn poll_questions(&self, poll_id: u64) -> VecMapper<PollQuestion<Self::Api>>;

    #[storage_mapper("pollOptions")]
    fn poll_options(&self, question_id: u64) -> VecMapper<PollOption<Self::Api>>;

    #[storage_mapper("pollResponses")]
    fn poll_responses(&self, poll_id: u64) -> VecMapper<PollResponse<Self::Api>>;

    #[storage_mapper("usedNullifiers")]
    fn used_nullifiers(&self, poll_id: u64) -> UnorderedSetMapper<ManagedBuffer>;

    #[storage_mapper("nextPollId")]
    fn next_poll_id(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("nextQuestionId")]
    fn next_question_id(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("nextOptionId")]
    fn next_option_id(&self) -> SingleValueMapper<u64>;

    // ========== EVENTS ==========

    #[event("pollCreated")]
    fn poll_created_event(
        &self,
        #[indexed] poll_id: u64,
        #[indexed] title: &ManagedBuffer,
        organizer: &ManagedAddress,
    );

    #[event("responseSubmitted")]
    fn response_submitted_event(
        &self,
        #[indexed] poll_id: u64,
        #[indexed] question_id: u64,
        nullifier: &ManagedBuffer,
    );

    #[event("pollClosed")]
    fn poll_closed_event(
        &self,
        #[indexed] poll_id: u64,
        results_ipfs: &ManagedBuffer,
    );
}
