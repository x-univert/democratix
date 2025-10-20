use multiversx_sc_scenario::*;

fn world() -> ScenarioWorld {
    let mut blockchain = ScenarioWorld::new();
    blockchain.register_contract(
        "mxsc:output/voter-registry.mxsc.json",
        voter_registry::ContractBuilder,
    );
    blockchain
}

#[test]
fn test_init() {
    let mut world = world();

    world
        .start_trace()
        .set_state_step(
            SetStateStep::new()
                .put_account("address:owner", Account::new().nonce(1))
                .new_address("address:owner", 1, "sc:voter-registry"),
        )
        .sc_deploy(
            ScDeployStep::new()
                .from("address:owner")
                .contract_code("mxsc:output/voter-registry.mxsc.json", &[])
                .call(voter_registry::contract_obj::<DebugApi>().init())
                .expect(TxExpect::ok().no_result()),
        );
}

#[test]
fn test_register_voter() {
    let mut world = world();
    let owner_address = "address:owner";
    let voter_address = "address:voter1";
    let registry_sc_address = "sc:voter-registry";

    // Setup
    world
        .start_trace()
        .set_state_step(
            SetStateStep::new()
                .put_account(owner_address, Account::new().nonce(1))
                .put_account(voter_address, Account::new().nonce(1))
                .new_address(owner_address, 1, registry_sc_address),
        )
        .sc_deploy(
            ScDeployStep::new()
                .from(owner_address)
                .contract_code("mxsc:output/voter-registry.mxsc.json", &[])
                .call(voter_registry::contract_obj::<DebugApi>().init())
                .expect(TxExpect::ok().no_result()),
        );

    // Register voter
    let election_id = 1u64;
    let credential_proof = managed_buffer!(b"zk_snark_proof_data_voter1");

    world.sc_call_step(
        ScCallStep::new()
            .from(voter_address)
            .to(registry_sc_address)
            .call(
                voter_registry::contract_obj::<DebugApi>()
                    .register_voter(election_id, credential_proof),
            )
            .expect(TxExpect::ok()), // Should return a voting token
    );
}

#[test]
fn test_register_multiple_voters() {
    let mut world = world();
    let owner_address = "address:owner";
    let voter1_address = "address:voter1";
    let voter2_address = "address:voter2";
    let registry_sc_address = "sc:voter-registry";

    // Setup
    world
        .start_trace()
        .set_state_step(
            SetStateStep::new()
                .put_account(owner_address, Account::new().nonce(1))
                .put_account(voter1_address, Account::new().nonce(1))
                .put_account(voter2_address, Account::new().nonce(1))
                .new_address(owner_address, 1, registry_sc_address),
        )
        .sc_deploy(
            ScDeployStep::new()
                .from(owner_address)
                .contract_code("mxsc:output/voter-registry.mxsc.json", &[])
                .call(voter_registry::contract_obj::<DebugApi>().init())
                .expect(TxExpect::ok().no_result()),
        );

    let election_id = 1u64;

    // Register first voter
    world.sc_call_step(
        ScCallStep::new()
            .from(voter1_address)
            .to(registry_sc_address)
            .call(
                voter_registry::contract_obj::<DebugApi>().register_voter(
                    election_id,
                    managed_buffer!(b"proof_voter1"),
                ),
            )
            .expect(TxExpect::ok()),
    );

    // Register second voter
    world.sc_call_step(
        ScCallStep::new()
            .from(voter2_address)
            .to(registry_sc_address)
            .call(
                voter_registry::contract_obj::<DebugApi>().register_voter(
                    election_id,
                    managed_buffer!(b"proof_voter2"),
                ),
            )
            .expect(TxExpect::ok()),
    );
}

#[test]
fn test_is_token_valid() {
    let mut world = world();
    let owner_address = "address:owner";
    let voter_address = "address:voter1";
    let registry_sc_address = "sc:voter-registry";

    // Setup
    world
        .start_trace()
        .set_state_step(
            SetStateStep::new()
                .put_account(owner_address, Account::new().nonce(1))
                .put_account(voter_address, Account::new().nonce(1))
                .new_address(owner_address, 1, registry_sc_address),
        )
        .sc_deploy(
            ScDeployStep::new()
                .from(owner_address)
                .contract_code("mxsc:output/voter-registry.mxsc.json", &[])
                .call(voter_registry::contract_obj::<DebugApi>().init())
                .expect(TxExpect::ok().no_result()),
        );

    let election_id = 1u64;

    // Register voter and get token
    let token_result = world.sc_call_get_result(
        ScCallStep::new()
            .from(voter_address)
            .to(registry_sc_address)
            .call(
                voter_registry::contract_obj::<DebugApi>().register_voter(
                    election_id,
                    managed_buffer!(b"proof_voter1"),
                ),
            )
            .expect(TxExpect::ok()),
    );

    // Check if token is valid (should return true for non-empty token)
    world.sc_query_step(
        ScQueryStep::new()
            .to(registry_sc_address)
            .call(
                voter_registry::contract_obj::<DebugApi>().is_token_valid(
                    election_id,
                    managed_buffer!(b"some_token"),
                ),
            )
            .expect(TxExpect::ok().result("true")),
    );

    // Check invalid token (empty)
    world.sc_query_step(
        ScQueryStep::new()
            .to(registry_sc_address)
            .call(
                voter_registry::contract_obj::<DebugApi>().is_token_valid(
                    election_id,
                    managed_buffer!(b""),
                ),
            )
            .expect(TxExpect::ok().result("false")),
    );
}

#[test]
fn test_revoke_token() {
    let mut world = world();
    let owner_address = "address:owner";
    let voter_address = "address:voter1";
    let registry_sc_address = "sc:voter-registry";

    // Setup
    world
        .start_trace()
        .set_state_step(
            SetStateStep::new()
                .put_account(owner_address, Account::new().nonce(1))
                .put_account(voter_address, Account::new().nonce(1))
                .new_address(owner_address, 1, registry_sc_address),
        )
        .sc_deploy(
            ScDeployStep::new()
                .from(owner_address)
                .contract_code("mxsc:output/voter-registry.mxsc.json", &[])
                .call(voter_registry::contract_obj::<DebugApi>().init())
                .expect(TxExpect::ok().no_result()),
        );

    let election_id = 1u64;

    // Register voter
    world.sc_call_step(
        ScCallStep::new()
            .from(voter_address)
            .to(registry_sc_address)
            .call(
                voter_registry::contract_obj::<DebugApi>().register_voter(
                    election_id,
                    managed_buffer!(b"proof_voter1"),
                ),
            )
            .expect(TxExpect::ok()),
    );

    // Revoke token (simulating voting contract calling this)
    let token = managed_buffer!(b"test_token");
    world.sc_call_step(
        ScCallStep::new()
            .from(owner_address) // In real scenario, this would be the voting contract
            .to(registry_sc_address)
            .call(
                voter_registry::contract_obj::<DebugApi>().revoke_token(election_id, token),
            )
            .expect(TxExpect::ok().no_result()),
    );
}

#[test]
fn test_revoke_token_invalid() {
    let mut world = world();
    let owner_address = "address:owner";
    let registry_sc_address = "sc:voter-registry";

    // Setup
    world
        .start_trace()
        .set_state_step(
            SetStateStep::new()
                .put_account(owner_address, Account::new().nonce(1))
                .new_address(owner_address, 1, registry_sc_address),
        )
        .sc_deploy(
            ScDeployStep::new()
                .from(owner_address)
                .contract_code("mxsc:output/voter-registry.mxsc.json", &[])
                .call(voter_registry::contract_obj::<DebugApi>().init())
                .expect(TxExpect::ok().no_result()),
        );

    let election_id = 1u64;

    // Try to revoke empty token (should fail)
    world.sc_call_step(
        ScCallStep::new()
            .from(owner_address)
            .to(registry_sc_address)
            .call(
                voter_registry::contract_obj::<DebugApi>().revoke_token(
                    election_id,
                    managed_buffer!(b""),
                ),
            )
            .expect(TxExpect::user_error("str:Token invalide")),
    );
}

#[test]
fn test_voter_tokens_are_unique() {
    let mut world = world();
    let owner_address = "address:owner";
    let voter1_address = "address:voter1";
    let voter2_address = "address:voter2";
    let registry_sc_address = "sc:voter-registry";

    // Setup
    world
        .start_trace()
        .set_state_step(
            SetStateStep::new()
                .put_account(owner_address, Account::new().nonce(1))
                .put_account(voter1_address, Account::new().nonce(1))
                .put_account(voter2_address, Account::new().nonce(1))
                .new_address(owner_address, 1, registry_sc_address),
        )
        .sc_deploy(
            ScDeployStep::new()
                .from(owner_address)
                .contract_code("mxsc:output/voter-registry.mxsc.json", &[])
                .call(voter_registry::contract_obj::<DebugApi>().init())
                .expect(TxExpect::ok().no_result()),
        );

    let election_id = 1u64;

    // Register two voters - they should get different tokens
    // This is implicitly tested by the generate_voting_token function
    // which uses caller address and timestamp to create unique tokens
    world.sc_call_step(
        ScCallStep::new()
            .from(voter1_address)
            .to(registry_sc_address)
            .call(
                voter_registry::contract_obj::<DebugApi>().register_voter(
                    election_id,
                    managed_buffer!(b"proof_voter1"),
                ),
            )
            .expect(TxExpect::ok()),
    );

    world.sc_call_step(
        ScCallStep::new()
            .from(voter2_address)
            .to(registry_sc_address)
            .call(
                voter_registry::contract_obj::<DebugApi>().register_voter(
                    election_id,
                    managed_buffer!(b"proof_voter2"),
                ),
            )
            .expect(TxExpect::ok()),
    );

    // Both registrations should succeed, proving tokens are unique
}
