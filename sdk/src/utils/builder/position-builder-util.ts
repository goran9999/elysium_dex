import { ElysiumPoolContext } from "../..";
import { ElysiumPoolAccountFetchOptions } from "../../network/public/fetcher";
import { PositionData, ElysiumPoolData } from "../../types/public";
import { PDAUtil } from "../public";

export async function getTickArrayDataForPosition(
  ctx: ElysiumPoolContext,
  position: PositionData,
  whirlpool: ElysiumPoolData,
  opts?: ElysiumPoolAccountFetchOptions
) {
  const lowerTickArrayKey = PDAUtil.getTickArrayFromTickIndex(
    position.tickLowerIndex,
    whirlpool.tickSpacing,
    position.whirlpool,
    ctx.program.programId
  ).publicKey;
  const upperTickArrayKey = PDAUtil.getTickArrayFromTickIndex(
    position.tickUpperIndex,
    whirlpool.tickSpacing,
    position.whirlpool,
    ctx.program.programId
  ).publicKey;

  return await ctx.fetcher.getTickArrays([lowerTickArrayKey, upperTickArrayKey], opts);
}
