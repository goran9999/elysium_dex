use anchor_lang::prelude::*;

use crate::state::ElysiumPoolsConfig;

#[derive(Accounts)]
pub struct SetDefaultProtocolFeeRate<'info> {
    #[account(mut)]
    pub pools_config: Account<'info, ElysiumPoolsConfig>,

    #[account(address = pools_config.fee_authority)]
    pub fee_authority: Signer<'info>,
}

pub fn handler(
    ctx: Context<SetDefaultProtocolFeeRate>,
    default_protocol_fee_rate: u16,
) -> Result<()> {
    Ok(ctx
        .accounts
        .pools_config
        .update_default_protocol_fee_rate(default_protocol_fee_rate)?)
}
