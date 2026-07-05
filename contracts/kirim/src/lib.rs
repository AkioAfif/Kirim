#![no_std]

mod types;

use soroban_sdk::{contract, contractimpl, Address, Env};
use types::{ContractError, DataKey};

#[contract]
pub struct KirimContract;

#[contractimpl]
impl KirimContract {
    /// Inisialisasi kontrak (Hanya boleh dipanggil sekali).
    /// Mengatur admin, alamat asset (TESTUSD SAC), dan counter Disbursement.
    pub fn initialize(env: Env, admin: Address, asset: Address) -> Result<(), ContractError> {
        // Cegah inisialisasi ganda dengan mengecek apakah Admin sudah ada
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(ContractError::AlreadyInitialized);
        }

        // Set admin dan allowed asset (TESTUSD)
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::AllowedAsset, &asset);
        
        // Inisialisasi DisbursementCount awal = 0
        env.storage().instance().set(&DataKey::DisbursementCount, &0u64);
        
        Ok(())
    }
}
