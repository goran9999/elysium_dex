import { Program } from "@coral-xyz/anchor";
import { Instruction } from "@orca-so/common-sdk";
import { PublicKey } from "@solana/web3.js";
import { ElysiumPool } from "../artifacts/whirlpool";

/**
 * Parameters to set fee rate for a ElysiumPool.
 *
 * @category Instruction Types
 * @param whirlpool - PublicKey for the whirlpool to update. This whirlpool has to be part of the provided ElysiumPoolsConfig space.
 * @param whirlpoolsConfig - The public key for the ElysiumPoolsConfig this pool is initialized in
 * @param feeAuthority - Authority authorized in the ElysiumPoolsConfig to set default fee rates.
 * @param feeRate - The new fee rate for this fee-tier. Stored as a hundredths of a basis point.
 */
export type SetFeeRateParams = {
  whirlpool: PublicKey;
  whirlpoolsConfig: PublicKey;
  feeAuthority: PublicKey;
  feeRate: number;
};

/**
 * Sets the fee rate for a ElysiumPool.
 * Only the current fee authority has permission to invoke this instruction.
 *
 * #### Special Errors
 * - `FeeRateMaxExceeded` - If the provided fee_rate exceeds MAX_FEE_RATE.
 *
 * @category Instructions
 * @param context - Context object containing services required to generate the instruction
 * @param params - SetFeeRateParams object
 * @returns - Instruction to perform the action.
 */
export function setFeeRateIx(program: Program<ElysiumPool>, params: SetFeeRateParams): Instruction {
  const { whirlpoolsConfig, whirlpool, feeAuthority, feeRate } = params;

  const ix = program.instruction.setFeeRate(feeRate, {
    accounts: {
      whirlpoolsConfig,
      whirlpool,
      feeAuthority,
    },
  });

  return {
    instructions: [ix],
    cleanupInstructions: [],
    signers: [],
  };
}
