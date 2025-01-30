use anchor_lang::prelude::*;

pub mod instructions;
pub mod states;
pub mod error;

// pub use constants::*;
pub use instructions::*;
pub use states::*;


declare_id!("aNnNq9mM4rTkrwkP5Gfz6mMPyGzRYUg6fsNBXBgxcor");

#[program]
pub mod nft_market {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, name: String, fee: u16) -> Result<()> {
        ctx.accounts.init(name, fee, &ctx.bumps)
    }

    pub fn list(ctx: Context<List>, price: u64) -> Result<()> {
        ctx.accounts.create_listing(price, &ctx.bumps)?;
        ctx.accounts.deposit_nft()
    }

    pub fn delist(ctx: Context<Delist>) -> Result<()> {
        ctx.accounts.withdraw_nft()
    }

    pub fn purchase(ctx: Context<Purchase>) -> Result<()> {
        ctx.accounts.send_sol_to_maker()?;
        ctx.accounts.transfer_nft_to_taker()?;
        ctx.accounts.close_vault()
    }
}