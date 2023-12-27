import { Program } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { ElysiumPool } from "../artifacts/pool";

import { Instruction } from "@orca-so/common-sdk";

/**
 * Parameters to collect fees from a position.
 *
 * @category Instruction Types
 * @param pool - PublicKey for the pool that the position will be opened for.
 * @param position - PublicKey for the  position will be opened for.
 * @param positionTokenAccount - PublicKey for the position token's associated token address.
 * @param tokenOwnerAccountA - PublicKey for the token A account that will be withdrawed from.
 * @param tokenOwnerAccountB - PublicKey for the token B account that will be withdrawed from.
 * @param tokenVaultA - PublicKey for the tokenA vault for this pool.
 * @param tokenVaultB - PublicKey for the tokenB vault for this pool.
 * @param positionAuthority - authority that owns the token corresponding to this desired position.
 */
export type CollectFeesParams = {
  pool: PublicKey;
  position: PublicKey;
  positionTokenAccount: PublicKey;
  tokenOwnerAccountA: PublicKey;
  tokenOwnerAccountB: PublicKey;
  tokenVaultA: PublicKey;
  tokenVaultB: PublicKey;
  positionAuthority: PublicKey;
};

/**
 * Collect fees accrued for this position.
 * Call updateFeesAndRewards before this to update the position to the newest accrued values.
 *
 * @category Instructions
 * @param context - Context object containing services required to generate the instruction
 * @param params - CollectFeesParams object
 * @returns - Instruction to perform the action.
 */
export function collectFeesIx(
  program: Program<ElysiumPool>,
  params: CollectFeesParams
): Instruction {
  const {
    pool,
    positionAuthority,
    position,
    positionTokenAccount,
    tokenOwnerAccountA,
    tokenOwnerAccountB,
    tokenVaultA,
    tokenVaultB,
  } = params;

  const ix = program.instruction.collectFees({
    accounts: {
      pool,
      positionAuthority,
      position,
      positionTokenAccount,
      tokenOwnerAccountA,
      tokenOwnerAccountB,
      tokenVaultA,
      tokenVaultB,
      tokenProgram: TOKEN_PROGRAM_ID,
    },
  });

  return {
    instructions: [ix],
    cleanupInstructions: [],
    signers: [],
  };
}
