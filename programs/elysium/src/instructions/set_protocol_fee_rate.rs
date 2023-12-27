use anchor_lang::prelude::*;

use crate::state::{ElysiumPool, ElysiumPoolsConfig};

#[derive(Accounts)]
pub struct SetProtocolFeeRate<'info> {
    pub pools_config: Account<'info, ElysiumPoolsConfig>,

    #[account(mut, has_one = pools_config)]
    pub pool: Account<'info, ElysiumPool>,

    #[account(address = pools_config.fee_authority)]
    pub fee_authority: Signer<'info>,
}

pub fn handler(ctx: Context<SetProtocolFeeRate>, protocol_fee_rate: u16) -> Result<()> {
    Ok(ctx
        .accounts
        .pool
        .update_protocol_fee_rate(protocol_fee_rate)?)
}
