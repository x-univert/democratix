#![no_std]

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

/// Niveau institutionnel dans la hiérarchie territoriale
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone, PartialEq, Debug)]
pub enum InstitutionLevel {
    Commune,            // 34,955 communes
    Intercommunality,   // 1,254 intercommunalités (EPCI)
    Department,         // 101 départements
    Region,             // 18 régions
    National,           // État français
}

/// Catégorie de commune (selon population)
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone, PartialEq, Debug)]
pub enum CommuneCategory {
    MicroCommune,       // < 500 habitants
    SmallCommune,       // 500-2,000 habitants
    MediumCommune,      // 2,000-10,000 habitants
    LargeCommune,       // 10,000-50,000 habitants
    City,               // 50,000-100,000 habitants
    LargeCity,          // 100,000+ habitants
    Metropolis,         // > 500,000 habitants
}

/// Structure principale d'une institution
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
pub struct Institution<M: ManagedTypeApi> {
    pub id: u64,
    pub insee_code: ManagedBuffer<M>,           // Code INSEE (ex: "69123" pour Lyon)
    pub siren: ManagedBuffer<M>,                // Numéro SIREN (9 chiffres)
    pub name: ManagedBuffer<M>,                 // Nom officiel
    pub slug: ManagedBuffer<M>,                 // URL-friendly name
    pub level: InstitutionLevel,
    pub category: Option<CommuneCategory>,       // Pour communes uniquement

    // Hiérarchie territoriale
    pub parent_region_code: ManagedBuffer<M>,    // Code région
    pub parent_department_code: ManagedBuffer<M>, // Code département
    pub parent_intercommunality_id: Option<u64>,  // ID intercommunalité (si commune)

    // Géolocalisation
    pub latitude: ManagedBuffer<M>,              // Décimal (ex: "45.7578")
    pub longitude: ManagedBuffer<M>,             // Décimal (ex: "4.8320")
    pub postal_codes: ManagedVec<M, ManagedBuffer<M>>, // Liste codes postaux

    // Données démographiques
    pub population: u64,
    pub electorate: u64,                         // Nombre électeurs inscrits
    pub area_km2: u32,                           // Superficie en km²

    // Gouvernance locale
    pub mayor_name: Option<ManagedBuffer<M>>,
    pub mayor_party: Option<ManagedBuffer<M>>,
    pub council_size: u32,                       // Nombre conseillers

    // Finances
    pub annual_budget_euros: u64,
    pub participative_budget_percentage: u32,    // % budget participatif (ex: 10%)

    // Configuration DEMOCRATIX
    pub ric_enabled: bool,
    pub petition_threshold_percentage: u32,      // % pour pétitions (défaut 5%)
    pub ric_threshold_percentage: u32,           // % pour RIC locaux (défaut 5%)

    // Métadonnées IPFS
    pub metadata_ipfs: Option<ManagedBuffer<M>>, // Infos complètes sur IPFS

    // Timestamps
    pub created_at: u64,
    pub updated_at: u64,
}

/// Contact d'une institution
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
pub struct InstitutionContact<M: ManagedTypeApi> {
    pub institution_id: u64,
    pub email: ManagedBuffer<M>,
    pub phone: ManagedBuffer<M>,
    pub website: ManagedBuffer<M>,
    pub address_line1: ManagedBuffer<M>,
    pub address_line2: Option<ManagedBuffer<M>>,
    pub postal_code: ManagedBuffer<M>,
    pub city: ManagedBuffer<M>,
}

/// Statistiques électorales d'une institution
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
pub struct ElectoralStats {
    pub institution_id: u64,
    pub total_elections: u64,
    pub total_votes_cast: u64,
    pub avg_participation_rate: u32,             // Pourcentage moyen
    pub last_election_date: u64,
    pub democratix_active_since: u64,
}

#[multiversx_sc::contract]
pub trait InstitutionRegistryContract {
    /// Initialisation du contrat
    #[init]
    fn init(&self) {
        self.next_institution_id().set(1u64);
        self.total_communes().set(0u64);
        self.total_departments().set(0u64);
        self.total_regions().set(0u64);
    }

    /// Enregistrer une nouvelle institution (admin uniquement)
    ///
    /// # Arguments
    /// * `insee_code` - Code INSEE officiel
    /// * `siren` - Numéro SIREN (9 chiffres)
    /// * `name` - Nom officiel de l'institution
    /// * `level` - Niveau hiérarchique
    /// * `population` - Population totale
    /// * `electorate` - Nombre d'électeurs inscrits
    /// * `parent_region_code` - Code région parente
    /// * `parent_department_code` - Code département parent
    ///
    /// # Returns
    /// ID de l'institution créée
    #[only_owner]
    #[endpoint(registerInstitution)]
    fn register_institution(
        &self,
        insee_code: ManagedBuffer,
        siren: ManagedBuffer,
        name: ManagedBuffer,
        slug: ManagedBuffer,
        level: InstitutionLevel,
        population: u64,
        electorate: u64,
        parent_region_code: ManagedBuffer,
        parent_department_code: ManagedBuffer,
        latitude: ManagedBuffer,
        longitude: ManagedBuffer,
    ) -> u64 {
        require!(insee_code.len() > 0, "INSEE code required");
        require!(siren.len() == 9, "SIREN must be 9 digits");
        require!(name.len() > 0, "Name required");
        require!(population > 0, "Population must be > 0");
        require!(
            !self.institutions_by_insee().contains_key(&insee_code),
            "INSEE code already registered"
        );

        let institution_id = self.next_institution_id().get();
        let current_timestamp = self.blockchain().get_block_timestamp();

        // Déterminer catégorie si commune
        let category = if level == InstitutionLevel::Commune {
            Some(self.calculate_commune_category(population))
        } else {
            None
        };

        let institution = Institution {
            id: institution_id,
            insee_code: insee_code.clone(),
            siren,
            name: name.clone(),
            slug: slug.clone(),
            level: level.clone(),
            category,
            parent_region_code,
            parent_department_code,
            parent_intercommunality_id: None,
            latitude,
            longitude,
            postal_codes: ManagedVec::new(),
            population,
            electorate,
            area_km2: 0, // À mettre à jour séparément
            mayor_name: None,
            mayor_party: None,
            council_size: self.calculate_council_size(population, &level),
            annual_budget_euros: 0,
            participative_budget_percentage: 10, // 10% par défaut
            ric_enabled: false,
            petition_threshold_percentage: 5,    // 5% par défaut
            ric_threshold_percentage: 5,         // 5% par défaut
            metadata_ipfs: None,
            created_at: current_timestamp,
            updated_at: current_timestamp,
        };

        // Sauvegarder
        self.institutions().insert(institution_id, institution);
        self.institutions_by_insee().insert(insee_code.clone(), institution_id);
        self.institutions_by_slug().insert(slug, institution_id);
        self.next_institution_id().set(institution_id + 1);

        // Mettre à jour compteurs
        match level {
            InstitutionLevel::Commune => {
                let count = self.total_communes().get();
                self.total_communes().set(count + 1);
            },
            InstitutionLevel::Department => {
                let count = self.total_departments().get();
                self.total_departments().set(count + 1);
            },
            InstitutionLevel::Region => {
                let count = self.total_regions().get();
                self.total_regions().set(count + 1);
            },
            _ => {}
        }

        // Emit event
        self.institution_registered_event(
            institution_id,
            &insee_code,
            &name,
        );

        institution_id
    }

    /// Calculer catégorie de commune selon population
    fn calculate_commune_category(&self, population: u64) -> CommuneCategory {
        if population < 500 {
            CommuneCategory::MicroCommune
        } else if population < 2_000 {
            CommuneCategory::SmallCommune
        } else if population < 10_000 {
            CommuneCategory::MediumCommune
        } else if population < 50_000 {
            CommuneCategory::LargeCommune
        } else if population < 100_000 {
            CommuneCategory::City
        } else if population < 500_000 {
            CommuneCategory::LargeCity
        } else {
            CommuneCategory::Metropolis
        }
    }

    /// Calculer taille du conseil selon population
    fn calculate_council_size(&self, population: u64, level: &InstitutionLevel) -> u32 {
        match level {
            InstitutionLevel::Commune => {
                // Selon Code général des collectivités territoriales
                if population < 100 { 7 }
                else if population < 500 { 11 }
                else if population < 1_500 { 15 }
                else if population < 2_500 { 19 }
                else if population < 3_500 { 23 }
                else if population < 5_000 { 27 }
                else if population < 10_000 { 29 }
                else if population < 20_000 { 33 }
                else if population < 30_000 { 35 }
                else if population < 40_000 { 39 }
                else if population < 50_000 { 43 }
                else if population < 60_000 { 45 }
                else if population < 80_000 { 49 }
                else if population < 100_000 { 53 }
                else if population < 150_000 { 55 }
                else if population < 200_000 { 59 }
                else if population < 250_000 { 61 }
                else if population < 300_000 { 65 }
                else { 69 } // > 300,000
            },
            InstitutionLevel::Department => 51,  // Conseillers départementaux
            InstitutionLevel::Region => 100,     // Conseillers régionaux (variable)
            _ => 0,
        }
    }

    /// Mettre à jour une institution (admin)
    #[only_owner]
    #[endpoint(updateInstitution)]
    #[allow_multiple_var_args]
    fn update_institution(
        &self,
        institution_id: u64,
        population: OptionalValue<u64>,
        electorate: OptionalValue<u64>,
        mayor_name: OptionalValue<ManagedBuffer>,
        metadata_ipfs: OptionalValue<ManagedBuffer>,
    ) {
        require!(
            self.institutions().contains_key(&institution_id),
            "Institution not found"
        );

        let mut institution = self.institutions().get(&institution_id).unwrap();

        // Mettre à jour champs optionnels
        if let OptionalValue::Some(pop) = population {
            institution.population = pop;
            // Recalculer catégorie si commune
            if institution.level == InstitutionLevel::Commune {
                institution.category = Some(self.calculate_commune_category(pop));
            }
        }

        if let OptionalValue::Some(elect) = electorate {
            institution.electorate = elect;
        }

        if let OptionalValue::Some(name) = mayor_name {
            institution.mayor_name = Some(name);
        }

        if let OptionalValue::Some(ipfs) = metadata_ipfs {
            institution.metadata_ipfs = Some(ipfs);
        }

        institution.updated_at = self.blockchain().get_block_timestamp();

        self.institutions().insert(institution_id, institution);

        self.institution_updated_event(institution_id);
    }

    /// Activer DEMOCRATIX pour une institution
    #[endpoint(enableDemocratix)]
    fn enable_democratix(
        &self,
        institution_id: u64,
        ric_enabled: bool,
        petition_threshold: u32,
        ric_threshold: u32,
    ) {
        require!(
            self.institutions().contains_key(&institution_id),
            "Institution not found"
        );

        let caller = self.blockchain().get_caller();
        let mut institution = self.institutions().get(&institution_id).unwrap();

        // Vérifier autorisation (owner ou institution elle-même)
        let is_owner = self.blockchain().get_owner_address() == caller;
        let is_institution_admin = self.institution_admins(institution_id).contains(&caller);

        require!(
            is_owner || is_institution_admin,
            "Not authorized"
        );

        require!(petition_threshold > 0 && petition_threshold <= 10, "Threshold 1-10%");
        require!(ric_threshold > 0 && ric_threshold <= 10, "Threshold 1-10%");

        institution.ric_enabled = ric_enabled;
        institution.petition_threshold_percentage = petition_threshold;
        institution.ric_threshold_percentage = ric_threshold;
        institution.updated_at = self.blockchain().get_block_timestamp();

        self.institutions().insert(institution_id, institution.clone());

        // Initialiser stats électorales
        if !self.electoral_stats().contains_key(&institution_id) {
            let stats = ElectoralStats {
                institution_id,
                total_elections: 0,
                total_votes_cast: 0,
                avg_participation_rate: 0,
                last_election_date: 0,
                democratix_active_since: self.blockchain().get_block_timestamp(),
            };
            self.electoral_stats().insert(institution_id, stats);
        }

        self.democratix_enabled_event(
            institution_id,
            &institution.name,
            ric_enabled,
        );
    }

    /// Ajouter un admin pour une institution
    #[only_owner]
    #[endpoint(addInstitutionAdmin)]
    fn add_institution_admin(&self, institution_id: u64, admin_address: ManagedAddress) {
        self.institution_admins(institution_id).insert(admin_address);
    }

    /// Enregistrer contact d'une institution
    #[endpoint(registerContact)]
    fn register_contact(
        &self,
        institution_id: u64,
        email: ManagedBuffer,
        phone: ManagedBuffer,
        website: ManagedBuffer,
        address_line1: ManagedBuffer,
        postal_code: ManagedBuffer,
        city: ManagedBuffer,
    ) {
        require!(
            self.institutions().contains_key(&institution_id),
            "Institution not found"
        );

        let caller = self.blockchain().get_caller();
        let is_owner = self.blockchain().get_owner_address() == caller;
        let is_admin = self.institution_admins(institution_id).contains(&caller);

        require!(is_owner || is_admin, "Not authorized");

        let contact = InstitutionContact {
            institution_id,
            email,
            phone,
            website,
            address_line1,
            address_line2: None,
            postal_code,
            city,
        };

        self.institution_contacts().insert(institution_id, contact);
    }

    /// Incrémenter statistiques électorales après une élection
    #[endpoint(recordElection)]
    fn record_election(
        &self,
        institution_id: u64,
        votes_cast: u64,
        participation_rate: u32,
    ) {
        require!(
            self.institutions().contains_key(&institution_id),
            "Institution not found"
        );

        // Vérifier autorisation (contract voting ou admin)
        let caller = self.blockchain().get_caller();
        require!(
            self.authorized_callers().contains(&caller),
            "Not authorized to record elections"
        );

        let mut stats = if self.electoral_stats().contains_key(&institution_id) {
            self.electoral_stats().get(&institution_id).unwrap()
        } else {
            ElectoralStats {
                institution_id,
                total_elections: 0,
                total_votes_cast: 0,
                avg_participation_rate: 0,
                last_election_date: 0,
                democratix_active_since: self.blockchain().get_block_timestamp(),
            }
        };

        // Mettre à jour stats
        let old_total = stats.total_elections;
        stats.total_elections += 1;
        stats.total_votes_cast += votes_cast;
        stats.last_election_date = self.blockchain().get_block_timestamp();

        // Recalculer taux participation moyen
        let old_avg = stats.avg_participation_rate as u64;
        let new_avg = ((old_avg * old_total) + participation_rate as u64) / stats.total_elections;
        stats.avg_participation_rate = new_avg as u32;

        self.electoral_stats().insert(institution_id, stats);
    }

    // ========== VIEWS ==========

    /// Obtenir institution par ID
    #[view(getInstitution)]
    fn get_institution(&self, institution_id: u64) -> Institution<Self::Api> {
        require!(
            self.institutions().contains_key(&institution_id),
            "Institution not found"
        );
        self.institutions().get(&institution_id).unwrap()
    }

    /// Obtenir institution par code INSEE
    #[view(getInstitutionByInsee)]
    fn get_institution_by_insee(&self, insee_code: ManagedBuffer) -> Institution<Self::Api> {
        require!(
            self.institutions_by_insee().contains_key(&insee_code),
            "Institution not found"
        );
        let id = self.institutions_by_insee().get(&insee_code).unwrap();
        self.institutions().get(&id).unwrap()
    }

    /// Obtenir institution par slug
    #[view(getInstitutionBySlug)]
    fn get_institution_by_slug(&self, slug: ManagedBuffer) -> Institution<Self::Api> {
        require!(
            self.institutions_by_slug().contains_key(&slug),
            "Institution not found"
        );
        let id = self.institutions_by_slug().get(&slug).unwrap();
        self.institutions().get(&id).unwrap()
    }

    /// Obtenir contact d'une institution
    #[view(getInstitutionContact)]
    fn get_institution_contact(&self, institution_id: u64) -> InstitutionContact<Self::Api> {
        require!(
            self.institution_contacts().contains_key(&institution_id),
            "Contact not found"
        );
        self.institution_contacts().get(&institution_id).unwrap()
    }

    /// Obtenir stats électorales
    #[view(getElectoralStats)]
    fn get_electoral_stats(&self, institution_id: u64) -> ElectoralStats {
        require!(
            self.electoral_stats().contains_key(&institution_id),
            "Stats not found"
        );
        self.electoral_stats().get(&institution_id).unwrap()
    }

    /// Obtenir toutes les communes (paginé)
    #[view(getCommunes)]
    fn get_communes(
        &self,
        offset: u64,
        limit: u64,
    ) -> MultiValueEncoded<Institution<Self::Api>> {
        let mut result = MultiValueEncoded::new();
        let max_id = self.next_institution_id().get();
        let mut count = 0u64;
        let mut skipped = 0u64;

        for id in 1..max_id {
            if count >= limit {
                break;
            }

            if let Some(institution) = self.institutions().get(&id) {
                if institution.level == InstitutionLevel::Commune {
                    if skipped >= offset {
                        result.push(institution);
                        count += 1;
                    } else {
                        skipped += 1;
                    }
                }
            }
        }

        result
    }

    /// Obtenir nombre total d'institutions
    #[view(getTotalInstitutions)]
    fn get_total_institutions(&self) -> MultiValue3<u64, u64, u64> {
        MultiValue3::from((
            self.total_communes().get(),
            self.total_departments().get(),
            self.total_regions().get(),
        ))
    }

    /// Vérifier si DEMOCRATIX est activé
    #[view(isDemocratixEnabled)]
    fn is_democratix_enabled(&self, institution_id: u64) -> bool {
        if let Some(institution) = self.institutions().get(&institution_id) {
            institution.ric_enabled
        } else {
            false
        }
    }

    // ========== STORAGE ==========

    #[storage_mapper("institutions")]
    fn institutions(&self) -> MapMapper<u64, Institution<Self::Api>>;

    #[storage_mapper("institutionsByInsee")]
    fn institutions_by_insee(&self) -> MapMapper<ManagedBuffer, u64>;

    #[storage_mapper("institutionsBySlug")]
    fn institutions_by_slug(&self) -> MapMapper<ManagedBuffer, u64>;

    #[storage_mapper("nextInstitutionId")]
    fn next_institution_id(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("totalCommunes")]
    fn total_communes(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("totalDepartments")]
    fn total_departments(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("totalRegions")]
    fn total_regions(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("institutionAdmins")]
    fn institution_admins(&self, institution_id: u64) -> UnorderedSetMapper<ManagedAddress>;

    #[storage_mapper("institutionContacts")]
    fn institution_contacts(&self) -> MapMapper<u64, InstitutionContact<Self::Api>>;

    #[storage_mapper("electoralStats")]
    fn electoral_stats(&self) -> MapMapper<u64, ElectoralStats>;

    #[storage_mapper("authorizedCallers")]
    fn authorized_callers(&self) -> UnorderedSetMapper<ManagedAddress>;

    // ========== EVENTS ==========

    #[event("institutionRegistered")]
    fn institution_registered_event(
        &self,
        #[indexed] institution_id: u64,
        #[indexed] insee_code: &ManagedBuffer,
        name: &ManagedBuffer,
    );

    #[event("institutionUpdated")]
    fn institution_updated_event(&self, #[indexed] institution_id: u64);

    #[event("democratixEnabled")]
    fn democratix_enabled_event(
        &self,
        #[indexed] institution_id: u64,
        #[indexed] name: &ManagedBuffer,
        ric_enabled: bool,
    );
}
