use anchor_lang::prelude::*;

pub mod instructions;
pub mod states;

pub use instructions::*;
pub use states::*;

declare_id!("2MLhrjTfTYXDXhKPxeQSEFyq3FG7eaTd2PCDBF8r6bxn");

#[program]
pub mod vault {

    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Initializing vault");
        ctx.accounts.initialize(&ctx.bumps)?;
        Ok(())
    }

    pub fn deposit(ctx: Context<Payment>, amount: u64) -> Result<()> {
        msg!("Depositing {} lamports", amount);
        ctx.accounts.deposit(amount)?;

        Ok(())
    }

    pub fn withdraw(ctx: Context<Payment>, amount: u64) -> Result<()> {
        msg!("Withdrwaing {} lamports", amount);
        ctx.accounts.withdraw(amount)?;

        Ok(())
    }

    pub fn close(ctx: Context<Close>) -> Result<()> {
        msg!("Closing vault");
        ctx.accounts.close()?;

        Ok(())
    }
}
