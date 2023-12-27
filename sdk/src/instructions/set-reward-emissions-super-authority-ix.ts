import { Program } from "@coral-xyz/anchor";
import { Instruction } from "@orca-so/common-sdk";
import { PublicKey } from "@solana/web3.js";
import { ElysiumPool } from "../artifacts/pool";

/**
 * Parameters to set rewards emissions for a reward in a ElysiumPool
 *
 * @category Instruction Types
 * @param poolsConfig - PublicKey for the ElysiumPoolsConfig that we want to update.
 * @param rewardEmissionsSuperAuthority - Current reward emission super authority in this ElysiumPoolsConfig
 * @param newRewardEmissionsSuperAuthority - New reward emission super authority for this ElysiumPoolsConfig
 */
export type SetRewardEmissionsSuperAuthorityParams = {
  poolsConfig: PublicKey;
  rewardEmissionsSuperAuthority: PublicKey;
  newRewardEmissionsSuperAuthority: PublicKey;
};

/**
 * Set the pool reward super authority for a ElysiumPoolsConfig
 * Only the current reward super authority has permission to invoke this instruction.
 * This instruction will not change the authority on any `ElysiumPoolRewardInfo` pool rewards.
 *
 * @category Instructions
 * @param context - Context object containing services required to generate the instruction
 * @param params - SetRewardEmissionsSuperAuthorityParams object
 * @returns - Instruction to perform the action.
 */
export function setRewardEmissionsSuperAuthorityIx(
  program: Program<ElysiumPool>,
  params: SetRewardEmissionsSuperAuthorityParams
): Instruction {
  const { poolsConfig, rewardEmissionsSuperAuthority, newRewardEmissionsSuperAuthority } = params;

  const ix = program.instruction.setRewardEmissionsSuperAuthority({
    accounts: {
      poolsConfig,
      rewardEmissionsSuperAuthority: rewardEmissionsSuperAuthority,
      newRewardEmissionsSuperAuthority,
    },
  });

  return {
    instructions: [ix],
    cleanupInstructions: [],
    signers: [],
  };
}
