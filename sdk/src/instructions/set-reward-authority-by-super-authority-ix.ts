import { Program } from "@coral-xyz/anchor";
import { Instruction } from "@orca-so/common-sdk";
import { PublicKey } from "@solana/web3.js";
import { ElysiumPool } from "../artifacts/pool";

/**
 * Parameters to update the reward authority at a particular rewardIndex on a ElysiumPool.
 *
 * @category Instruction Types
 * @param pool - PublicKey for the pool to update. This pool has to be part of the provided ElysiumPoolsConfig space.
 * @param poolsConfig - The public key for the ElysiumPoolsConfig this pool is initialized in
 * @param rewardIndex - The reward index that we'd like to update. (0 <= index <= NUM_REWARDS).
 * @param rewardEmissionsSuperAuthority - The current rewardEmissionsSuperAuthority in the ElysiumPoolsConfig
 * @param newRewardAuthority - The new rewardAuthority in the ElysiumPool at the rewardIndex
 */
export type SetRewardAuthorityBySuperAuthorityParams = {
  pool: PublicKey;
  poolsConfig: PublicKey;
  rewardIndex: number;
  rewardEmissionsSuperAuthority: PublicKey;
  newRewardAuthority: PublicKey;
};

/**
 * Set the pool reward authority at the provided `reward_index`.
 * Only the current reward super authority has permission to invoke this instruction.
 *
 * #### Special Errors
 * - `InvalidRewardIndex` - If the provided reward index doesn't match the lowest uninitialized index in this pool,
 *                          or exceeds NUM_REWARDS.
 *
 * @category Instructions
 * @param context - Context object containing services required to generate the instruction
 * @param params - SetRewardAuthorityParams object
 * @returns - Instruction to perform the action.
 */
export function setRewardAuthorityBySuperAuthorityIx(
  program: Program<ElysiumPool>,
  params: SetRewardAuthorityBySuperAuthorityParams
): Instruction {
  const { poolsConfig, pool, rewardEmissionsSuperAuthority, newRewardAuthority, rewardIndex } =
    params;

  const ix = program.instruction.setRewardAuthorityBySuperAuthority(rewardIndex, {
    accounts: {
      poolsConfig,
      pool,
      rewardEmissionsSuperAuthority,
      newRewardAuthority,
    },
  });

  return {
    instructions: [ix],
    cleanupInstructions: [],
    signers: [],
  };
}
