import { Address } from "@coral-xyz/anchor";
import { AddressUtil } from "@orca-so/common-sdk";
import BN from "bn.js";
import invariant from "tiny-invariant";
import {
  ElysiumPoolAccountFetcherInterface,
  ElysiumPoolAccountFetchOptions,
} from "../network/public/fetcher";
import { SwapQuoteParam } from "../quotes/public";
import { PoolUtil, SwapDirection, SwapUtils } from "../utils/public";

export interface SwapQuoteRequest {
  pool: Address;
  tradeTokenMint: Address;
  tokenAmount: BN;
  amountSpecifiedIsInput: boolean;
}

export async function batchBuildSwapQuoteParams(
  quoteRequests: SwapQuoteRequest[],
  programId: Address,
  fetcher: ElysiumPoolAccountFetcherInterface,
  opts?: ElysiumPoolAccountFetchOptions
): Promise<SwapQuoteParam[]> {
  const pools = await fetcher.getPools(
    quoteRequests.map((req) => req.pool),
    opts
  );
  const program = AddressUtil.toPubKey(programId);

  const tickArrayRequests = quoteRequests.map((quoteReq) => {
    const { pool, tokenAmount, tradeTokenMint, amountSpecifiedIsInput } = quoteReq;
    const poolData = pools.get(AddressUtil.toString(pool))!;
    const swapMintKey = AddressUtil.toPubKey(tradeTokenMint);
    const swapTokenType = PoolUtil.getTokenType(poolData, swapMintKey);
    invariant(!!swapTokenType, "swapTokenMint does not match any tokens on this pool");
    const aToB =
      SwapUtils.getSwapDirection(poolData, swapMintKey, amountSpecifiedIsInput) ===
      SwapDirection.AtoB;
    return {
      poolData,
      tokenAmount,
      aToB,
      tickCurrentIndex: poolData.tickCurrentIndex,
      tickSpacing: poolData.tickSpacing,
      poolAddress: AddressUtil.toPubKey(pool),
      amountSpecifiedIsInput,
    };
  });

  const tickArrays = await SwapUtils.getBatchTickArrays(program, fetcher, tickArrayRequests, opts);

  return tickArrayRequests.map((req, index) => {
    const { poolData, tokenAmount, aToB, amountSpecifiedIsInput } = req;
    return {
      poolData,
      tokenAmount,
      aToB,
      amountSpecifiedIsInput,
      sqrtPriceLimit: SwapUtils.getDefaultSqrtPriceLimit(aToB),
      otherAmountThreshold: SwapUtils.getDefaultOtherAmountThreshold(amountSpecifiedIsInput),
      tickArrays: tickArrays[index],
    };
  });
}
