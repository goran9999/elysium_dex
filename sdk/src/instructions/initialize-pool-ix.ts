import { BN, Program } from "@coral-xyz/anchor";
import { Instruction, PDA } from "@orca-so/common-sdk";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { ElysiumPool } from "../artifacts/pool";
import { ElysiumPoolBumpsData } from "../types/public/anchor-types";

/**
 * Parameters to initialize a ElysiumPool account.
 *
 * @category Instruction Types
 * @param initSqrtPrice - The desired initial sqrt-price for this pool
 * @param poolsConfig - The public key for the ElysiumPoolsConfig this pool is initialized in
 * @param poolPda - PDA for the pool account that would be initialized
 * @param tokenMintA - Mint public key for token A
 * @param tokenMintB - Mint public key for token B
 * @param tokenVaultAKeypair - Keypair of the token A vault for this pool
 * @param tokenVaultBKeypair - Keypair of the token B vault for this pool
 * @param feeTierKey - PublicKey of the fee-tier account that this pool would use for the fee-rate
 * @param tickSpacing - The desired tick spacing for this pool.
 * @param funder - The account that would fund the creation of this account
 */
export type InitPoolParams = {
  initSqrtPrice: BN;
  poolsConfig: PublicKey;
  poolPda: PDA;
  tokenMintA: PublicKey;
  tokenMintB: PublicKey;
  tokenVaultAKeypair: Keypair;
  tokenVaultBKeypair: Keypair;
  feeTierKey: PublicKey;
  tickSpacing: number;
  funder: PublicKey;
};

/**
 * Initializes a tick_array account to represent a tick-range in a ElysiumPool.
 *
 * Special Errors
 * `InvalidTokenMintOrder` - The order of mints have to be ordered by
 * `SqrtPriceOutOfBounds` - provided initial_sqrt_price is not between 2^-64 to 2^64
 *
 * @category Instructions
 * @param context - Context object containing services required to generate the instruction
 * @param params - InitPoolParams object
 * @returns - Instruction to perform the action.
 */
export function initializePoolIx(
  program: Program<ElysiumPool>,
  params: InitPoolParams
): Instruction {
  const {
    initSqrtPrice,
    tokenMintA,
    tokenMintB,
    poolsConfig,
    poolPda,
    feeTierKey,
    tokenVaultAKeypair,
    tokenVaultBKeypair,
    tickSpacing,
    funder,
  } = params;

  const poolBumps: ElysiumPoolBumpsData = {
    poolBump: poolPda.bump,
  };

  const ix = program.instruction.initializePool(poolBumps, tickSpacing, initSqrtPrice, {
    accounts: {
      poolsConfig,
      tokenMintA,
      tokenMintB,
      funder,
      pool: poolPda.publicKey,
      tokenVaultA: tokenVaultAKeypair.publicKey,
      tokenVaultB: tokenVaultBKeypair.publicKey,
      feeTier: feeTierKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    },
  });

  return {
    instructions: [ix],
    cleanupInstructions: [],
    signers: [tokenVaultAKeypair, tokenVaultBKeypair],
  };
}
