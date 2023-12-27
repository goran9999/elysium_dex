import { Program } from "@coral-xyz/anchor";
import { Instruction } from "@orca-so/common-sdk";
import { PublicKey } from "@solana/web3.js";
import { ElysiumPool } from "../artifacts/pool";

/**
 * Parameters to set the collect fee authority in a ElysiumPoolsConfig
 *
 * @category Instruction Types
 * @param poolsConfig - The public key for the ElysiumPoolsConfig this pool is initialized in
 * @param collectProtocolFeesAuthority - The current collectProtocolFeesAuthority in the ElysiumPoolsConfig
 * @param newCollectProtocolFeesAuthority - The new collectProtocolFeesAuthority in the ElysiumPoolsConfig
 */
export type SetCollectProtocolFeesAuthorityParams = {
  poolsConfig: PublicKey;
  collectProtocolFeesAuthority: PublicKey;
  newCollectProtocolFeesAuthority: PublicKey;
};

/**
 * Sets the fee authority to collect protocol fees for a ElysiumPoolsConfig.
 * Only the current collect protocol fee authority has permission to invoke this instruction.
 *
 * @category Instructions
 * @param context - Context object containing services required to generate the instruction
 * @param params - SetCollectProtocolFeesAuthorityParams object
 * @returns - Instruction to perform the action.
 */
export function setCollectProtocolFeesAuthorityIx(
  program: Program<ElysiumPool>,
  params: SetCollectProtocolFeesAuthorityParams
): Instruction {
  const { poolsConfig, collectProtocolFeesAuthority, newCollectProtocolFeesAuthority } = params;

  const ix = program.instruction.setCollectProtocolFeesAuthority({
    accounts: {
      poolsConfig,
      collectProtocolFeesAuthority,
      newCollectProtocolFeesAuthority,
    },
  });

  return {
    instructions: [ix],
    cleanupInstructions: [],
    signers: [],
  };
}
