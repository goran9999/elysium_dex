import { Program } from "@coral-xyz/anchor";
import { Instruction } from "@orca-so/common-sdk";
import { PublicKey } from "@solana/web3.js";
import { ElysiumPool } from "../artifacts/pool";

/**
 * Parameters to set fee rate for a ElysiumPool.
 *
 * @category Instruction Types
 * @param pool - PublicKey for the pool to update. This pool has to be part of the provided ElysiumPoolsConfig space.
 * @param poolsConfig - The public key for the ElysiumPoolsConfig this pool is initialized in
 * @param feeAuthority - Authority authorized in the ElysiumPoolsConfig to set default fee rates.
 * @param protocolFeeRate - The new default protocol fee rate for this pool. Stored as a basis point of the total fees collected by feeRate.
 */
export type SetProtocolFeeRateParams = {
  pool: PublicKey;
  poolsConfig: PublicKey;
  feeAuthority: PublicKey;
  protocolFeeRate: number;
};

/**
 * Sets the protocol fee rate for a ElysiumPool.
 * Only the current fee authority has permission to invoke this instruction.
 *
 * #### Special Errors
 * - `ProtocolFeeRateMaxExceeded` - If the provided default_protocol_fee_rate exceeds MAX_PROTOCOL_FEE_RATE.
 *
 * @category Instructions
 * @param context - Context object containing services required to generate the instruction
 * @param params - SetFeeRateParams object
 * @returns - Instruction to perform the action.
 */
export function setProtocolFeeRateIx(
  program: Program<ElysiumPool>,
  params: SetProtocolFeeRateParams
): Instruction {
  const { poolsConfig, pool, feeAuthority, protocolFeeRate } = params;

  const ix = program.instruction.setProtocolFeeRate(protocolFeeRate, {
    accounts: {
      poolsConfig,
      pool,
      feeAuthority,
    },
  });

  return {
    instructions: [ix],
    cleanupInstructions: [],
    signers: [],
  };
}
