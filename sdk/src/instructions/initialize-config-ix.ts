import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { ElysiumPool } from "../artifacts/pool";

import { Instruction } from "@orca-so/common-sdk";

/**
 * Parameters to initialize a ElysiumPoolsConfig account.
 *
 * @category Instruction Types
 * @param poolsConfigKeypair - Generated keypair for the ElysiumPoolsConfig.
 * @param feeAuthority - Authority authorized to initialize fee-tiers and set customs fees.
 * @param collect_protocol_fees_authority - Authority authorized to collect protocol fees.
 * @param rewardEmissionsSuperAuthority - Authority authorized to set reward authorities in pools.
 * @param defaultProtocolFeeRate - The default protocol fee rate. Stored as a basis point of the total fees collected by feeRate.
 * @param funder - The account that would fund the creation of this account
 */
export type InitConfigParams = {
  poolsConfigKeypair: Keypair;
  feeAuthority: PublicKey;
  collectProtocolFeesAuthority: PublicKey;
  rewardEmissionsSuperAuthority: PublicKey;
  defaultProtocolFeeRate: number;
  funder: PublicKey;
};

/**
 * Initializes a ElysiumPoolsConfig account that hosts info & authorities
 * required to govern a set of ElysiumPools.
 *
 * @category Instructions
 * @param context - Context object containing services required to generate the instruction
 * @param params - InitConfigParams object
 * @returns - Instruction to perform the action.
 */
export function initializeConfigIx(
  program: Program<ElysiumPool>,
  params: InitConfigParams
): Instruction {
  const {
    feeAuthority,
    collectProtocolFeesAuthority,
    rewardEmissionsSuperAuthority,
    defaultProtocolFeeRate,
    funder,
  } = params;

  const ix = program.instruction.initializeConfig(
    feeAuthority,
    collectProtocolFeesAuthority,
    rewardEmissionsSuperAuthority,
    defaultProtocolFeeRate,
    {
      accounts: {
        config: params.poolsConfigKeypair.publicKey,
        funder,
        systemProgram: SystemProgram.programId,
      },
    }
  );

  return {
    instructions: [ix],
    cleanupInstructions: [],
    signers: [params.poolsConfigKeypair],
  };
}
