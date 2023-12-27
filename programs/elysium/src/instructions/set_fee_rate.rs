use anchor_lang::prelude::*;

use crate::state::{ElysiumPool, ElysiumPoolsConfig};

#[derive(Accounts)]
pub struct SetFeeRate<'info> {
    pub whirlpools_config: Account<'info, ElysiumPoolsConfig>,

    #[account(mut, has_one = whirlpools_config)]
    pub whirlpool: Account<'info, ElysiumPool>,

    #[account(address = whirlpools_config.fee_authority)]
    pub fee_authority: Signer<'info>,
}

pub fn handler(ctx: Context<SetFeeRate>, fee_rate: u16) -> Result<()> {
    Ok(ctx.accounts.whirlpool.update_fee_rate(fee_rate)?)
}
