import { Program } from "@coral-xyz/anchor";
import { Instruction } from "@orca-so/common-sdk";
import { PublicKey } from "@solana/web3.js";
import { ElysiumPool } from "../artifacts/whirlpool";

/**
 * Parameters to set the fee authority in a ElysiumPoolsConfig
 *
 * @category Instruction Types
 * @param whirlpoolsConfig - The public key for the ElysiumPoolsConfig this pool is initialized in
 * @param feeAuthority - The current feeAuthority in the ElysiumPoolsConfig
 * @param newFeeAuthority - The new feeAuthority in the ElysiumPoolsConfig
 */
export type SetFeeAuthorityParams = {
  whirlpoolsConfig: PublicKey;
  feeAuthority: PublicKey;
  newFeeAuthority: PublicKey;
};

/**
 * Sets the fee authority for a ElysiumPoolsConfig.
 * The fee authority can set the fee & protocol fee rate for individual pools or set the default fee rate for newly minted pools.
 * Only the current fee authority has permission to invoke this instruction.
 *
 * @category Instructions
 * @param context - Context object containing services required to generate the instruction
 * @param params - SetFeeAuthorityParams object
 * @returns - Instruction to perform the action.
 */
export function setFeeAuthorityIx(
  program: Program<ElysiumPool>,
  params: SetFeeAuthorityParams
): Instruction {
  const { whirlpoolsConfig, feeAuthority, newFeeAuthority } = params;

  const ix = program.instruction.setFeeAuthority({
    accounts: {
      whirlpoolsConfig,
      feeAuthority,
      newFeeAuthority,
    },
  });

  return {
    instructions: [ix],
    cleanupInstructions: [],
    signers: [],
  };
}
