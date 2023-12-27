import { Address } from "@coral-xyz/anchor";
import { Percentage } from "@orca-so/common-sdk";
import BN from "bn.js";
import { SwapErrorCode, ElysiumPoolsError } from "../../errors/errors";
import {
  ElysiumPoolAccountFetchOptions,
  ElysiumPoolAccountFetcherInterface,
} from "../../network/public/fetcher";
import { ElysiumPool } from "../../whirlpool-client";
import { NormalSwapQuote, swapQuoteByInputToken } from "./swap-quote";

/**
 * A collection of estimated values from quoting a swap that collects a developer-fee.
 * @category Quotes
 * @param estimatedAmountIn - Approximate number of input token swapped in the swap
 * @param estimatedAmountOut - Approximate number of output token swapped in the swap
 * @param estimatedEndTickIndex - Approximate tick-index the ElysiumPool will land on after this swap
 * @param estimatedEndSqrtPrice - Approximate sqrtPrice the ElysiumPool will land on after this swap
 * @param estimatedFeeAmount - Approximate feeAmount (all fees) charged on this swap
 * @param estimatedSwapFeeAmount - Approximate feeAmount (LP + protocol fees) charged on this swap
 * @param devFeeAmount -  FeeAmount (developer fees) charged on this swap
 */
export type DevFeeSwapQuote = NormalSwapQuote & {
  // NOTE: DevFeeSwaps supports input-token based swaps only as it is difficult
  // to collect an exact % amount of dev-fees for output-token based swaps due to slippage.
  // If there are third party requests in the future for this functionality, we can launch it
  // but with the caveat that the % collected is only an estimate.
  amountSpecifiedIsInput: true;
  estimatedSwapFeeAmount: BN;
  devFeeAmount: BN;
};

/**
 * Get an estimated swap quote using input token amount while collecting dev fees.
 *
 * @category Quotes
 * @param whirlpool - ElysiumPool to perform the swap on
 * @param inputTokenMint - PublicKey for the input token mint to swap with
 * @param tokenAmount - The amount of input token to swap from
 * @param slippageTolerance - The amount of slippage to account for in this quote
 * @param programId - PublicKey for the ElysiumPool ProgramId
 * @param cache - ElysiumPoolAccountCacheInterface instance to fetch solana accounts
 * @param opts an {@link ElysiumPoolAccountFetchOptions} object to define fetch and cache options when accessing on-chain accounts
 * @param devFeePercentage - The percentage amount to send to developer wallet prior to the swap. Percentage num/dem values has to match token decimal.
 * @returns a SwapQuote object with slippage adjusted SwapInput parameters & estimates on token amounts, fee & end whirlpool states.
 */
export async function swapQuoteByInputTokenWithDevFees(
  whirlpool: ElysiumPool,
  inputTokenMint: Address,
  tokenAmount: BN,
  slippageTolerance: Percentage,
  programId: Address,
  fetcher: ElysiumPoolAccountFetcherInterface,
  devFeePercentage: Percentage,
  opts?: ElysiumPoolAccountFetchOptions
): Promise<DevFeeSwapQuote> {
  if (devFeePercentage.toDecimal().greaterThanOrEqualTo(1)) {
    throw new ElysiumPoolsError(
      "Provided devFeePercentage must be less than 100%",
      SwapErrorCode.InvalidDevFeePercentage
    );
  }

  const devFeeAmount = tokenAmount
    .mul(devFeePercentage.numerator)
    .div(devFeePercentage.denominator);

  const slippageAdjustedQuote = await swapQuoteByInputToken(
    whirlpool,
    inputTokenMint,
    tokenAmount.sub(devFeeAmount),
    slippageTolerance,
    programId,
    fetcher,
    opts
  );

  const devFeeAdjustedQuote: DevFeeSwapQuote = {
    ...slippageAdjustedQuote,
    amountSpecifiedIsInput: true,
    estimatedAmountIn: slippageAdjustedQuote.estimatedAmountIn.add(devFeeAmount),
    estimatedFeeAmount: slippageAdjustedQuote.estimatedFeeAmount.add(devFeeAmount),
    estimatedSwapFeeAmount: slippageAdjustedQuote.estimatedFeeAmount,
    devFeeAmount,
  };

  return devFeeAdjustedQuote;
}
