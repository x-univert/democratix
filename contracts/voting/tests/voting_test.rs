use multiversx_sc_scenario::*;

fn world() -> ScenarioWorld {
    let mut blockchain = ScenarioWorld::new();
    blockchain.register_contract("mxsc:output/voting.mxsc.json", voting::ContractBuilder);
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
                .new_address("address:owner", 1, "sc:voting"),
        )
        .sc_deploy(
            ScDeployStep::new()
                .from("address:owner")
                .contract_code("mxsc:output/voting.mxsc.json", &[])
                .call(voting::contract_obj::<DebugApi>().init())
                .expect(TxExpect::ok().no_result()),
        );
}

#[test]
fn test_create_election() {
    let mut world = world();
    let owner_address = "address:owner";
    let voting_sc_address = "sc:voting";

    // Setup
    world
        .start_trace()
        .set_state_step(
            SetStateStep::new()
                .put_account(owner_address, Account::new().nonce(1))
                .new_address(owner_address, 1, voting_sc_address),
        )
        .sc_deploy(
            ScDeployStep::new()
                .from(owner_address)
                .contract_code("mxsc:output/voting.mxsc.json", &[])
                .call(voting::contract_obj::<DebugApi>().init())
                .expect(TxExpect::ok().no_result()),
        );

    // Create candidates
    let current_timestamp = 1000u64;
    let start_time = current_timestamp + 100;
    let end_time = start_time + 3600;

    world.set_state_step(
        SetStateStep::new()
            .block_timestamp(current_timestamp)
    );

    // Create election
    world.sc_call_step(
        ScCallStep::new()
            .from(owner_address)
            .to(voting_sc_address)
            .call(voting::contract_obj::<DebugApi>()
                .create_election(
                    managed_buffer!(b"Presidential Election 2025"),
                    managed_buffer!(b"QmTest123..."),
                    start_time,
                    end_time,
                    ManagedVec::from_iter([
                        voting::Candidate {
                            id: 1,
                            name: managed_buffer!(b"Candidate A"),
                            description_ipfs: managed_buffer!(b"QmCandidateA"),
                        },
                        voting::Candidate {
                            id: 2,
                            name: managed_buffer!(b"Candidate B"),
                            description_ipfs: managed_buffer!(b"QmCandidateB"),
                        },
                    ])
                )
            )
            .expect(TxExpect::ok().result("1")),
    );

    // Verify election was created
    world.sc_query_step(
        ScQueryStep::new()
            .to(voting_sc_address)
            .call(voting::contract_obj::<DebugApi>().get_election(1u64))
            .expect(TxExpect::ok()),
    );
}

#[test]
fn test_create_election_invalid_dates() {
    let mut world = world();
    let owner_address = "address:owner";
    let voting_sc_address = "sc:voting";

    // Setup
    world
        .start_trace()
        .set_state_step(
            SetStateStep::new()
                .put_account(owner_address, Account::new().nonce(1))
                .new_address(owner_address, 1, voting_sc_address),
        )
        .sc_deploy(
            ScDeployStep::new()
                .from(owner_address)
                .contract_code("mxsc:output/voting.mxsc.json", &[])
                .call(voting::contract_obj::<DebugApi>().init())
                .expect(TxExpect::ok().no_result()),
        );

    let current_timestamp = 1000u64;
    let end_time = current_timestamp + 100;
    let start_time = end_time + 1000; // start_time > end_time (invalid)

    world.set_state_step(
        SetStateStep::new()
            .block_timestamp(current_timestamp)
    );

    // Try to create election with invalid dates
    world.sc_call_step(
        ScCallStep::new()
            .from(owner_address)
            .to(voting_sc_address)
            .call(voting::contract_obj::<DebugApi>()
                .create_election(
                    managed_buffer!(b"Test Election"),
                    managed_buffer!(b"QmTest"),
                    start_time,
                    end_time,
                    ManagedVec::from_iter([
                        voting::Candidate {
                            id: 1,
                            name: managed_buffer!(b"Candidate A"),
                            description_ipfs: managed_buffer!(b"QmA"),
                        },
                        voting::Candidate {
                            id: 2,
                            name: managed_buffer!(b"Candidate B"),
                            description_ipfs: managed_buffer!(b"QmB"),
                        },
                    ])
                )
            )
            .expect(TxExpect::user_error("str:Dates invalides")),
    );
}

#[test]
fn test_create_election_insufficient_candidates() {
    let mut world = world();
    let owner_address = "address:owner";
    let voting_sc_address = "sc:voting";

    // Setup
    world
        .start_trace()
        .set_state_step(
            SetStateStep::new()
                .put_account(owner_address, Account::new().nonce(1))
                .new_address(owner_address, 1, voting_sc_address),
        )
        .sc_deploy(
            ScDeployStep::new()
                .from(owner_address)
                .contract_code("mxsc:output/voting.mxsc.json", &[])
                .call(voting::contract_obj::<DebugApi>().init())
                .expect(TxExpect::ok().no_result()),
        );

    let current_timestamp = 1000u64;
    let start_time = current_timestamp + 100;
    let end_time = start_time + 3600;

    world.set_state_step(
        SetStateStep::new()
            .block_timestamp(current_timestamp)
    );

    // Try to create election with only 1 candidate
    world.sc_call_step(
        ScCallStep::new()
            .from(owner_address)
            .to(voting_sc_address)
            .call(voting::contract_obj::<DebugApi>()
                .create_election(
                    managed_buffer!(b"Test Election"),
                    managed_buffer!(b"QmTest"),
                    start_time,
                    end_time,
                    ManagedVec::from_iter([
                        voting::Candidate {
                            id: 1,
                            name: managed_buffer!(b"Candidate A"),
                            description_ipfs: managed_buffer!(b"QmA"),
                        },
                    ])
                )
            )
            .expect(TxExpect::user_error("str:Minimum 2 candidats requis")),
    );
}

#[test]
fn test_activate_election() {
    let mut world = world();
    let owner_address = "address:owner";
    let voting_sc_address = "sc:voting";

    // Setup and create election
    world
        .start_trace()
        .set_state_step(
            SetStateStep::new()
                .put_account(owner_address, Account::new().nonce(1))
                .new_address(owner_address, 1, voting_sc_address),
        )
        .sc_deploy(
            ScDeployStep::new()
                .from(owner_address)
                .contract_code("mxsc:output/voting.mxsc.json", &[])
                .call(voting::contract_obj::<DebugApi>().init())
                .expect(TxExpect::ok().no_result()),
        );

    let current_timestamp = 1000u64;
    let start_time = current_timestamp + 100;
    let end_time = start_time + 3600;

    world.set_state_step(
        SetStateStep::new()
            .block_timestamp(current_timestamp)
    );

    // Create election
    world.sc_call_step(
        ScCallStep::new()
            .from(owner_address)
            .to(voting_sc_address)
            .call(voting::contract_obj::<DebugApi>()
                .create_election(
                    managed_buffer!(b"Test Election"),
                    managed_buffer!(b"QmTest"),
                    start_time,
                    end_time,
                    ManagedVec::from_iter([
                        voting::Candidate {
                            id: 1,
                            name: managed_buffer!(b"Candidate A"),
                            description_ipfs: managed_buffer!(b"QmA"),
                        },
                        voting::Candidate {
                            id: 2,
                            name: managed_buffer!(b"Candidate B"),
                            description_ipfs: managed_buffer!(b"QmB"),
                        },
                    ])
                )
            )
            .expect(TxExpect::ok().result("1")),
    );

    // Advance time to start_time
    world.set_state_step(
        SetStateStep::new()
            .block_timestamp(start_time)
    );

    // Activate election
    world.sc_call_step(
        ScCallStep::new()
            .from(owner_address)
            .to(voting_sc_address)
            .call(voting::contract_obj::<DebugApi>().activate_election(1u64))
            .expect(TxExpect::ok().no_result()),
    );
}

#[test]
fn test_cast_vote() {
    let mut world = world();
    let owner_address = "address:owner";
    let voter_address = "address:voter";
    let voting_sc_address = "sc:voting";

    // Setup
    world
        .start_trace()
        .set_state_step(
            SetStateStep::new()
                .put_account(owner_address, Account::new().nonce(1))
                .put_account(voter_address, Account::new().nonce(1))
                .new_address(owner_address, 1, voting_sc_address),
        )
        .sc_deploy(
            ScDeployStep::new()
                .from(owner_address)
                .contract_code("mxsc:output/voting.mxsc.json", &[])
                .call(voting::contract_obj::<DebugApi>().init())
                .expect(TxExpect::ok().no_result()),
        );

    let current_timestamp = 1000u64;
    let start_time = current_timestamp + 100;
    let end_time = start_time + 3600;

    world.set_state_step(
        SetStateStep::new()
            .block_timestamp(current_timestamp)
    );

    // Create election
    world.sc_call_step(
        ScCallStep::new()
            .from(owner_address)
            .to(voting_sc_address)
            .call(voting::contract_obj::<DebugApi>()
                .create_election(
                    managed_buffer!(b"Test Election"),
                    managed_buffer!(b"QmTest"),
                    start_time,
                    end_time,
                    ManagedVec::from_iter([
                        voting::Candidate {
                            id: 1,
                            name: managed_buffer!(b"Candidate A"),
                            description_ipfs: managed_buffer!(b"QmA"),
                        },
                        voting::Candidate {
                            id: 2,
                            name: managed_buffer!(b"Candidate B"),
                            description_ipfs: managed_buffer!(b"QmB"),
                        },
                    ])
                )
            )
            .expect(TxExpect::ok().result("1")),
    );

    // Activate election
    world.set_state_step(
        SetStateStep::new()
            .block_timestamp(start_time)
    );

    world.sc_call_step(
        ScCallStep::new()
            .from(owner_address)
            .to(voting_sc_address)
            .call(voting::contract_obj::<DebugApi>().activate_election(1u64))
            .expect(TxExpect::ok().no_result()),
    );

    // Cast vote
    world.sc_call_step(
        ScCallStep::new()
            .from(voter_address)
            .to(voting_sc_address)
            .call(voting::contract_obj::<DebugApi>()
                .cast_vote(
                    1u64,
                    managed_buffer!(b"voting_token_abc123"),
                    voting::EncryptedVote {
                        encrypted_choice: managed_buffer!(b"encrypted_vote_data"),
                        proof: managed_buffer!(b"zk_snark_proof"),
                        timestamp: start_time,
                    }
                )
            )
            .expect(TxExpect::ok().no_result()),
    );

    // Verify vote count increased
    world.sc_query_step(
        ScQueryStep::new()
            .to(voting_sc_address)
            .call(voting::contract_obj::<DebugApi>().get_total_votes(1u64))
            .expect(TxExpect::ok().result("1")),
    );
}

#[test]
fn test_close_election() {
    let mut world = world();
    let owner_address = "address:owner";
    let voting_sc_address = "sc:voting";

    // Setup and create election
    world
        .start_trace()
        .set_state_step(
            SetStateStep::new()
                .put_account(owner_address, Account::new().nonce(1))
                .new_address(owner_address, 1, voting_sc_address),
        )
        .sc_deploy(
            ScDeployStep::new()
                .from(owner_address)
                .contract_code("mxsc:output/voting.mxsc.json", &[])
                .call(voting::contract_obj::<DebugApi>().init())
                .expect(TxExpect::ok().no_result()),
        );

    let current_timestamp = 1000u64;
    let start_time = current_timestamp + 100;
    let end_time = start_time + 3600;

    world.set_state_step(
        SetStateStep::new()
            .block_timestamp(current_timestamp)
    );

    // Create election
    world.sc_call_step(
        ScCallStep::new()
            .from(owner_address)
            .to(voting_sc_address)
            .call(voting::contract_obj::<DebugApi>()
                .create_election(
                    managed_buffer!(b"Test Election"),
                    managed_buffer!(b"QmTest"),
                    start_time,
                    end_time,
                    ManagedVec::from_iter([
                        voting::Candidate {
                            id: 1,
                            name: managed_buffer!(b"Candidate A"),
                            description_ipfs: managed_buffer!(b"QmA"),
                        },
                        voting::Candidate {
                            id: 2,
                            name: managed_buffer!(b"Candidate B"),
                            description_ipfs: managed_buffer!(b"QmB"),
                        },
                    ])
                )
            )
            .expect(TxExpect::ok().result("1")),
    );

    // Activate election
    world.set_state_step(
        SetStateStep::new()
            .block_timestamp(start_time)
    );

    world.sc_call_step(
        ScCallStep::new()
            .from(owner_address)
            .to(voting_sc_address)
            .call(voting::contract_obj::<DebugApi>().activate_election(1u64))
            .expect(TxExpect::ok().no_result()),
    );

    // Advance time past end_time
    world.set_state_step(
        SetStateStep::new()
            .block_timestamp(end_time + 1)
    );

    // Close election
    world.sc_call_step(
        ScCallStep::new()
            .from(owner_address)
            .to(voting_sc_address)
            .call(voting::contract_obj::<DebugApi>().close_election(1u64))
            .expect(TxExpect::ok().no_result()),
    );
}
