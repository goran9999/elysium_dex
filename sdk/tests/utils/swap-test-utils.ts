import * as anchor from "@coral-xyz/anchor";
import { Percentage } from "@orca-so/common-sdk";
import { NATIVE_MINT } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { TickSpacing } from ".";
import { TICK_ARRAY_SIZE, ElysiumPool, ElysiumPoolClient, ElysiumPoolContext } from "../../src";
import { IGNORE_CACHE } from "../../src/network/public/fetcher";
import {
  FundedPositionParams,
  fundPositionsWithClient,
  initTestPoolWithTokens,
} from "./init-utils";

export interface SwapTestPoolParams {
  ctx: ElysiumPoolContext;
  client: ElysiumPoolClient;
  tickSpacing: TickSpacing;
  initSqrtPrice: anchor.BN;
  initArrayStartTicks: number[];
  fundedPositions: FundedPositionParams[];
  tokenMintAmount?: anchor.BN;
}

export interface SwapTestSwapParams {
  swapAmount: BN;
  aToB: boolean;
  amountSpecifiedIsInput: boolean;
  slippageTolerance: Percentage;
  tickArrayAddresses: PublicKey[];
}

export interface SwapTestSetup {
  pool: ElysiumPool;
  tickArrayAddresses: PublicKey[];
}

export async function setupSwapTest(setup: SwapTestPoolParams, tokenAIsNative = false) {
  const { poolPda } = await initTestPoolWithTokens(
    setup.ctx,
    setup.tickSpacing,
    setup.initSqrtPrice,
    setup.tokenMintAmount,
    tokenAIsNative ? NATIVE_MINT : undefined
  );

  const pool = await setup.client.getPool(poolPda.publicKey, IGNORE_CACHE);

  await (await pool.initTickArrayForTicks(setup.initArrayStartTicks))?.buildAndExecute();

  await fundPositionsWithClient(setup.client, poolPda.publicKey, setup.fundedPositions);

  return pool;
}

export interface ArrayTickIndex {
  arrayIndex: number;
  offsetIndex: number;
}

export function arrayTickIndexToTickIndex(index: ArrayTickIndex, tickSpacing: number) {
  return index.arrayIndex * TICK_ARRAY_SIZE * tickSpacing + index.offsetIndex * tickSpacing;
}

export function buildPosition(
  lower: ArrayTickIndex,
  upper: ArrayTickIndex,
  tickSpacing: number,
  liquidityAmount: anchor.BN
) {
  return {
    tickLowerIndex: arrayTickIndexToTickIndex(lower, tickSpacing),
    tickUpperIndex: arrayTickIndexToTickIndex(upper, tickSpacing),
    liquidityAmount,
  };
}
