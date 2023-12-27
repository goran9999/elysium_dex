import { Address } from "@coral-xyz/anchor";
import { AddressUtil, Percentage } from "@orca-so/common-sdk";
import BN from "bn.js";
import invariant from "tiny-invariant";
import { SwapInput } from "../../instructions";
import {
  ElysiumPoolAccountFetchOptions,
  ElysiumPoolAccountFetcherInterface,
} from "../../network/public/fetcher";
import { TickArray, ElysiumPoolData } from "../../types/public";
import { PoolUtil, SwapDirection } from "../../utils/public";
import { SwapUtils } from "../../utils/public/swap-utils";
import { ElysiumPool } from "../../pool-client";
import { simulateSwap } from "../swap/swap-quote-impl";
import { DevFeeSwapQuote } from "./dev-fee-swap-quote";

/**
 * @category Quotes
 *
 * @param tokenAmount - The amount of input or output token to swap from (depending on amountSpecifiedIsInput).
 * @param otherAmountThreshold - The maximum/minimum of input/output token to swap into (depending on amountSpecifiedIsInput).
 * @param sqrtPriceLimit - The maximum/minimum price the swap will swap to.
 * @param aToB - The direction of the swap. True if swapping from A to B. False if swapping from B to A.
 * @param amountSpecifiedIsInput - Specifies the token the parameter `amount`represents. If true, the amount represents
 *                                 the input token of the swap.
 * @param tickArrays - An sequential array of tick-array objects in the direction of the trade to swap on
 */
export type SwapQuoteParam = {
  poolData: ElysiumPoolData;
  tokenAmount: BN;
  otherAmountThreshold: BN;
  sqrtPriceLimit: BN;
  aToB: boolean;
  amountSpecifiedIsInput: boolean;
  tickArrays: TickArray[];
};

/**
 * A collection of estimated values from quoting a swap.
 * @category Quotes
 * @link {BaseSwapQuote}
 * @link {DevFeeSwapQuote}
 */
export type SwapQuote = NormalSwapQuote | DevFeeSwapQuote;

/**
 * A collection of estimated values from quoting a swap.
 * @category Quotes
 * @param estimatedAmountIn - Approximate number of input token swapped in the swap
 * @param estimatedAmountOut - Approximate number of output token swapped in the swap
 * @param estimatedEndTickIndex - Approximate tick-index the ElysiumPool will land on after this swap
 * @param estimatedEndSqrtPrice - Approximate sqrtPrice the ElysiumPool will land on after this swap
 * @param estimatedFeeAmount - Approximate feeAmount (all fees) charged on this swap
 */
export type SwapEstimates = {
  estimatedAmountIn: BN;
  estimatedAmountOut: BN;
  estimatedEndTickIndex: number;
  estimatedEndSqrtPrice: BN;
  estimatedFeeAmount: BN;
};

/**
 * A collection of estimated values from quoting a swap. Object can be directly used in a swap transaction.
 * @category Quotes
 */
export type NormalSwapQuote = SwapInput & SwapEstimates;

/**
 * Get an estimated swap quote using input token amount.
 *
 * @category Quotes
 * @param pool - ElysiumPool to perform the swap on
 * @param inputTokenMint - PublicKey for the input token mint to swap with
 * @param tokenAmount - The amount of input token to swap from
 * @param slippageTolerance - The amount of slippage to account for in this quote
 * @param programId - PublicKey for the ElysiumPool ProgramId
 * @param cache - ElysiumPoolAccountCacheInterface instance object to fetch solana accounts
 * @param opts an {@link ElysiumPoolAccountFetchOptions} object to define fetch and cache options when accessing on-chain accounts
 * @returns a SwapQuote object with slippage adjusted SwapInput parameters & estimates on token amounts, fee & end pool states.
 */
export async function swapQuoteByInputToken(
  pool: ElysiumPool,
  inputTokenMint: Address,
  tokenAmount: BN,
  slippageTolerance: Percentage,
  programId: Address,
  fetcher: ElysiumPoolAccountFetcherInterface,
  opts?: ElysiumPoolAccountFetchOptions
): Promise<SwapQuote> {
  const params = await swapQuoteByToken(
    pool,
    inputTokenMint,
    tokenAmount,
    true,
    programId,
    fetcher,
    opts
  );
  return swapQuoteWithParams(params, slippageTolerance);
}

/**
 * Get an estimated swap quote using an output token amount.
 *
 * Use this quote to get an estimated amount of input token needed to receive
 * the defined output token amount.
 *
 * @category Quotes
 * @param pool - ElysiumPool to perform the swap on
 * @param outputTokenMint - PublicKey for the output token mint to swap into
 * @param tokenAmount - The maximum amount of output token to receive in this swap.
 * @param slippageTolerance - The amount of slippage to account for in this quote
 * @param programId - PublicKey for the ElysiumPool ProgramId
 * @param cache - ElysiumPoolAccountCacheInterface instance to fetch solana accounts
 * @param opts an {@link ElysiumPoolAccountFetchOptions} object to define fetch and cache options when accessing on-chain accounts
 * @returns a SwapQuote object with slippage adjusted SwapInput parameters & estimates on token amounts, fee & end pool states.
 */
export async function swapQuoteByOutputToken(
  pool: ElysiumPool,
  outputTokenMint: Address,
  tokenAmount: BN,
  slippageTolerance: Percentage,
  programId: Address,
  fetcher: ElysiumPoolAccountFetcherInterface,
  opts?: ElysiumPoolAccountFetchOptions
): Promise<SwapQuote> {
  const params = await swapQuoteByToken(
    pool,
    outputTokenMint,
    tokenAmount,
    false,
    programId,
    fetcher,
    opts
  );
  return swapQuoteWithParams(params, slippageTolerance);
}

/**
 * Perform a sync swap quote based on the basic swap instruction parameters.
 *
 * @category Quotes
 * @param params - SwapQuote parameters
 * @param slippageTolerance - The amount of slippage to account for when generating the final quote.
 * @returns a SwapQuote object with slippage adjusted SwapInput parameters & estimates on token amounts, fee & end pool states.
 */
export function swapQuoteWithParams(
  params: SwapQuoteParam,
  slippageTolerance: Percentage
): SwapQuote {
  const quote = simulateSwap(params);

  const slippageAdjustedQuote: SwapQuote = {
    ...quote,
    ...SwapUtils.calculateSwapAmountsFromQuote(
      quote.amount,
      quote.estimatedAmountIn,
      quote.estimatedAmountOut,
      slippageTolerance,
      quote.amountSpecifiedIsInput
    ),
  };

  return slippageAdjustedQuote;
}

async function swapQuoteByToken(
  pool: ElysiumPool,
  inputTokenMint: Address,
  tokenAmount: BN,
  amountSpecifiedIsInput: boolean,
  programId: Address,
  fetcher: ElysiumPoolAccountFetcherInterface,
  opts?: ElysiumPoolAccountFetchOptions
): Promise<SwapQuoteParam> {
  const poolData = pool.getData();
  const swapMintKey = AddressUtil.toPubKey(inputTokenMint);
  const swapTokenType = PoolUtil.getTokenType(poolData, swapMintKey);
  invariant(!!swapTokenType, "swapTokenMint does not match any tokens on this pool");

  const aToB =
    SwapUtils.getSwapDirection(poolData, swapMintKey, amountSpecifiedIsInput) ===
    SwapDirection.AtoB;

  const tickArrays = await SwapUtils.getTickArrays(
    poolData.tickCurrentIndex,
    poolData.tickSpacing,
    aToB,
    AddressUtil.toPubKey(programId),
    pool.getAddress(),
    fetcher,
    opts
  );

  return {
    poolData,
    tokenAmount,
    aToB,
    amountSpecifiedIsInput,
    sqrtPriceLimit: SwapUtils.getDefaultSqrtPriceLimit(aToB),
    otherAmountThreshold: SwapUtils.getDefaultOtherAmountThreshold(amountSpecifiedIsInput),
    tickArrays,
  };
}
