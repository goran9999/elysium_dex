import { Program } from "@coral-xyz/anchor";
import { Instruction } from "@orca-so/common-sdk";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { ElysiumPool } from "../artifacts/pool";

/**
 * Parameters to collect protocol fees for a ElysiumPool
 *
 * @category Instruction Types
 * @param poolsConfig - The public key for the ElysiumPoolsConfig this pool is initialized in
 * @param pool - PublicKey for the pool that the position will be opened for.
 * @param tokenVaultA - PublicKey for the tokenA vault for this pool.
 * @param tokenVaultB - PublicKey for the tokenB vault for this pool.
 * @param tokenOwnerAccountA - PublicKey for the associated token account for tokenA in the collection wallet
 * @param tokenOwnerAccountB - PublicKey for the associated token account for tokenA in the collection wallet
 * @param collectProtocolFeesAuthority - assigned authority in the ElysiumPoolsConfig that can collect protocol fees
 */
export type CollectProtocolFeesParams = {
  poolsConfig: PublicKey;
  pool: PublicKey;
  tokenVaultA: PublicKey;
  tokenVaultB: PublicKey;
  tokenOwnerAccountA: PublicKey;
  tokenOwnerAccountB: PublicKey;
  collectProtocolFeesAuthority: PublicKey;
};

/**
 * Collect protocol fees accrued in this ElysiumPool.
 *
 * @category Instructions
 * @param context - Context object containing services required to generate the instruction
 * @param params - CollectProtocolFeesParams object
 * @returns - Instruction to perform the action.
 */
export function collectProtocolFeesIx(
  program: Program<ElysiumPool>,
  params: CollectProtocolFeesParams
): Instruction {
  const {
    poolsConfig,
    pool,
    collectProtocolFeesAuthority,
    tokenVaultA,
    tokenVaultB,
    tokenOwnerAccountA: tokenDestinationA,
    tokenOwnerAccountB: tokenDestinationB,
  } = params;

  const ix = program.instruction.collectProtocolFees({
    accounts: {
      poolsConfig,
      pool,
      collectProtocolFeesAuthority,
      tokenVaultA,
      tokenVaultB,
      tokenDestinationA,
      tokenDestinationB,
      tokenProgram: TOKEN_PROGRAM_ID,
    },
  });

  return {
    instructions: [ix],
    cleanupInstructions: [],
    signers: [],
  };
}
