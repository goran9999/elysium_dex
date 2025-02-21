import { Program } from "@coral-xyz/anchor";
import { PDA } from "@orca-so/common-sdk";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { ElysiumPool } from "../artifacts/pool";

import { Instruction } from "@orca-so/common-sdk";

/**
 * Parameters to initialize a FeeTier account.
 *
 * @category Instruction Types
 * @param poolsConfig - PublicKey for the pool config space that the fee-tier will be initialized for.
 * @param feeTierPda - PDA for the fee-tier account that will be initialized
 * @param tickSpacing - The tick spacing this fee tier recommends its default fee rate for.
 * @param defaultFeeRate - The default fee rate for this fee-tier. Stored as a hundredths of a basis point.
 * @param feeAuthority - Authority authorized to initialize fee-tiers and set customs fees.
 * @param funder - The account that would fund the creation of this account
 */
export type InitFeeTierParams = {
  poolsConfig: PublicKey;
  feeTierPda: PDA;
  tickSpacing: number;
  defaultFeeRate: number;
  feeAuthority: PublicKey;
  funder: PublicKey;
};

/**
 * Initializes a fee tier account usable by ElysiumPools in this ElysiumPoolsConfig space.
 *
 *  Special Errors
 * `FeeRateMaxExceeded` - If the provided default_fee_rate exceeds MAX_FEE_RATE.
 *
 * @category Instructions
 * @param context - Context object containing services required to generate the instruction
 * @param params - InitFeeTierParams object
 * @returns - Instruction to perform the action.
 */
export function initializeFeeTierIx(
  program: Program<ElysiumPool>,
  params: InitFeeTierParams
): Instruction {
  const { feeTierPda, poolsConfig, tickSpacing, feeAuthority, defaultFeeRate, funder } = params;

  const ix = program.instruction.initializeFeeTier(tickSpacing, defaultFeeRate, {
    accounts: {
      config: poolsConfig,
      feeTier: feeTierPda.publicKey,
      feeAuthority,
      funder,
      systemProgram: SystemProgram.programId,
    },
  });

  return {
    instructions: [ix],
    cleanupInstructions: [],
    signers: [],
  };
}
