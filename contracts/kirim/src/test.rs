#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Events},
    token, Address, Env, Symbol, Vec,
};
use types::{ContractError, RecipientShare};

fn setup_test(
    env: &Env,
) -> (
    KirimContractClient<'static>,
    Address,
    Address,
    token::Client<'static>,
    token::StellarAssetClient<'static>,
) {
    env.mock_all_auths();

    let contract_id = env.register_contract(None, KirimContract);
    let client = KirimContractClient::new(env, &contract_id);

    let admin = Address::generate(env);
    let token_admin = Address::generate(env);

    // Register SAC token (TESTUSD)
    let token_contract_id = env.register_stellar_asset_contract(token_admin);
    let token_client = token::Client::new(env, &token_contract_id);
    let token_admin_client = token::StellarAssetClient::new(env, &token_contract_id);

    (client, admin, token_contract_id, token_client, token_admin_client)
}

#[test]
fn test_initialize_success() {
    let env = Env::default();
    let (client, admin, token_id, _, _) = setup_test(&env);
    assert!(client.try_initialize(&admin, &token_id).is_ok());
}

#[test]
fn test_initialize_already_initialized() {
    let env = Env::default();
    let (client, admin, token_id, _, _) = setup_test(&env);
    client.initialize(&admin, &token_id);

    let res = client.try_initialize(&admin, &token_id);
    assert_eq!(
        res,
        Err(Ok(soroban_sdk::Error::from_contract_error(
            ContractError::AlreadyInitialized as u32
        )))
    );
}

#[test]
fn test_disbursement_single_recipient() {
    let env = Env::default();
    let (client, admin, token_id, token_client, token_admin_client) = setup_test(&env);
    client.initialize(&admin, &token_id);

    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);
    let total_amount = 1000i128;

    token_admin_client.mint(&sender, &total_amount);
    assert_eq!(token_client.balance(&sender), total_amount);

    let mut recipients = Vec::new(&env);
    recipients.push_back(RecipientShare {
        recipient: recipient.clone(),
        percentage: 10000,
        amount: 0,
    });

    let id = client.create_and_execute_disbursement(&sender, &total_amount, &recipients);
    assert_eq!(id, 0);

    assert_eq!(token_client.balance(&sender), 0);
    assert_eq!(token_client.balance(&recipient), total_amount);
}

#[test]
fn test_disbursement_multiple_recipients_even_split() {
    let env = Env::default();
    let (client, admin, token_id, token_client, token_admin_client) = setup_test(&env);
    client.initialize(&admin, &token_id);

    let sender = Address::generate(&env);
    let r1 = Address::generate(&env);
    let r2 = Address::generate(&env);
    let r3 = Address::generate(&env);
    let r4 = Address::generate(&env);

    let total_amount = 1000i128;
    token_admin_client.mint(&sender, &total_amount);

    let mut recipients = Vec::new(&env);
    recipients.push_back(RecipientShare { recipient: r1.clone(), percentage: 2500, amount: 0 });
    recipients.push_back(RecipientShare { recipient: r2.clone(), percentage: 2500, amount: 0 });
    recipients.push_back(RecipientShare { recipient: r3.clone(), percentage: 2500, amount: 0 });
    recipients.push_back(RecipientShare { recipient: r4.clone(), percentage: 2500, amount: 0 });

    client.create_and_execute_disbursement(&sender, &total_amount, &recipients);

    assert_eq!(token_client.balance(&sender), 0);
    assert_eq!(token_client.balance(&r1), 250);
    assert_eq!(token_client.balance(&r2), 250);
    assert_eq!(token_client.balance(&r3), 250);
    assert_eq!(token_client.balance(&r4), 250);
}

#[test]
fn test_disbursement_rounding_remainder() {
    let env = Env::default();
    let (client, admin, token_id, token_client, token_admin_client) = setup_test(&env);
    client.initialize(&admin, &token_id);

    let sender = Address::generate(&env);
    let r1 = Address::generate(&env);
    let r2 = Address::generate(&env);
    let r3 = Address::generate(&env);

    let total_amount = 1000i128;
    token_admin_client.mint(&sender, &total_amount);

    let mut recipients = Vec::new(&env);
    recipients.push_back(RecipientShare { recipient: r1.clone(), percentage: 3333, amount: 0 });
    recipients.push_back(RecipientShare { recipient: r2.clone(), percentage: 3333, amount: 0 });
    recipients.push_back(RecipientShare { recipient: r3.clone(), percentage: 3334, amount: 0 });

    client.create_and_execute_disbursement(&sender, &total_amount, &recipients);

    assert_eq!(token_client.balance(&sender), 0);
    assert_eq!(token_client.balance(&r1), 334); // gets remainder
    assert_eq!(token_client.balance(&r2), 333);
    assert_eq!(token_client.balance(&r3), 333);
}

#[test]
fn test_disbursement_count_increment() {
    let env = Env::default();
    let (client, admin, token_id, _, token_admin_client) = setup_test(&env);
    client.initialize(&admin, &token_id);

    let sender = Address::generate(&env);
    let r1 = Address::generate(&env);
    let total_amount = 100i128;
    token_admin_client.mint(&sender, &(total_amount * 2));

    let mut recipients = Vec::new(&env);
    recipients.push_back(RecipientShare { recipient: r1, percentage: 10000, amount: 0 });

    let id1 = client.create_and_execute_disbursement(&sender, &total_amount, &recipients);
    assert_eq!(id1, 0);

    let id2 = client.create_and_execute_disbursement(&sender, &total_amount, &recipients);
    assert_eq!(id2, 1);
}

#[test]
fn test_disbursement_events() {
    let env = Env::default();
    let (client, admin, token_id, _, token_admin_client) = setup_test(&env);
    client.initialize(&admin, &token_id);

    let sender = Address::generate(&env);
    let r1 = Address::generate(&env);
    let total_amount = 100i128;
    token_admin_client.mint(&sender, &total_amount);

    let mut recipients = Vec::new(&env);
    recipients.push_back(RecipientShare { recipient: r1, percentage: 10000, amount: 0 });

    client.create_and_execute_disbursement(&sender, &total_amount, &recipients);

    let mut found_created = false;
    let mut found_completed = false;

    for event in env.events().all().iter() {
        if event.contract_id == client.address {
            let topics = event.topics;
            if topics.len() > 0 {
                let event_type: Symbol = topics.get_unchecked(0).try_into_val(&env).unwrap();
                if event_type == Symbol::new(&env, "DisbursementCreated") {
                    found_created = true;
                } else if event_type == Symbol::new(&env, "DisbursementCompleted") {
                    found_completed = true;
                }
            }
        }
    }

    assert!(found_created, "DisbursementCreated event not found");
    assert!(found_completed, "DisbursementCompleted event not found");
}

#[test]
fn test_disbursement_not_initialized() {
    let env = Env::default();
    let (client, _, _, _, _) = setup_test(&env);
    let sender = Address::generate(&env);
    let recipients = Vec::new(&env);
    let res = client.try_create_and_execute_disbursement(&sender, &100, &recipients);
    assert_eq!(
        res,
        Err(Ok(soroban_sdk::Error::from_contract_error(
            ContractError::NotInitialized as u32
        )))
    );
}

#[test]
fn test_disbursement_empty_recipients() {
    let env = Env::default();
    let (client, admin, token_id, _, _) = setup_test(&env);
    client.initialize(&admin, &token_id);
    let sender = Address::generate(&env);
    let recipients = Vec::new(&env);
    let res = client.try_create_and_execute_disbursement(&sender, &100, &recipients);
    assert_eq!(
        res,
        Err(Ok(soroban_sdk::Error::from_contract_error(
            ContractError::EmptyRecipients as u32
        )))
    );
}

#[test]
fn test_disbursement_too_many_recipients() {
    let env = Env::default();
    let (client, admin, token_id, _, _) = setup_test(&env);
    client.initialize(&admin, &token_id);
    let sender = Address::generate(&env);

    let mut recipients = Vec::new(&env);
    for _ in 0..6 {
        recipients.push_back(RecipientShare {
            recipient: Address::generate(&env),
            percentage: 1666,
            amount: 0,
        });
    }

    let res = client.try_create_and_execute_disbursement(&sender, &100, &recipients);
    assert_eq!(
        res,
        Err(Ok(soroban_sdk::Error::from_contract_error(
            ContractError::TooManyRecipients as u32
        )))
    );
}

#[test]
fn test_disbursement_invalid_percentage_total() {
    let env = Env::default();
    let (client, admin, token_id, _, _) = setup_test(&env);
    client.initialize(&admin, &token_id);
    let sender = Address::generate(&env);
    let r1 = Address::generate(&env);

    let mut recipients = Vec::new(&env);
    recipients.push_back(RecipientShare { recipient: r1, percentage: 9999, amount: 0 });

    let res = client.try_create_and_execute_disbursement(&sender, &100, &recipients);
    assert_eq!(
        res,
        Err(Ok(soroban_sdk::Error::from_contract_error(
            ContractError::InvalidPercentageTotal as u32
        )))
    );
}

#[test]
fn test_disbursement_zero_amount() {
    let env = Env::default();
    let (client, admin, token_id, _, _) = setup_test(&env);
    client.initialize(&admin, &token_id);
    let sender = Address::generate(&env);
    let r1 = Address::generate(&env);

    let mut recipients = Vec::new(&env);
    recipients.push_back(RecipientShare { recipient: r1, percentage: 10000, amount: 0 });

    let res = client.try_create_and_execute_disbursement(&sender, &0, &recipients);
    assert_eq!(
        res,
        Err(Ok(soroban_sdk::Error::from_contract_error(
            ContractError::ZeroAmount as u32
        )))
    );
}

#[test]
fn test_disbursement_auth_verified() {
    let env = Env::default();
    let (client, admin, token_id, _, token_admin_client) = setup_test(&env);
    client.initialize(&admin, &token_id);

    let sender = Address::generate(&env);
    let r1 = Address::generate(&env);
    let total_amount = 100i128;
    token_admin_client.mint(&sender, &total_amount);

    let mut recipients = Vec::new(&env);
    recipients.push_back(RecipientShare { recipient: r1, percentage: 10000, amount: 0 });

    client.create_and_execute_disbursement(&sender, &total_amount, &recipients);

    let auths = env.auths();
    assert_eq!(auths.len(), 1);
    let (auth_address, _) = auths.get(0).unwrap();
    assert_eq!(auth_address, sender);
}
