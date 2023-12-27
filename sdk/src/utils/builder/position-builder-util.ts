import { ElysiumPoolContext } from "../..";
import { ElysiumPoolAccountFetchOptions } from "../../network/public/fetcher";
import { PositionData, ElysiumPoolData } from "../../types/public";
import { PDAUtil } from "../public";

export async function getTickArrayDataForPosition(
  ctx: ElysiumPoolContext,
  position: PositionData,
  pool: ElysiumPoolData,
  opts?: ElysiumPoolAccountFetchOptions
) {
  const lowerTickArrayKey = PDAUtil.getTickArrayFromTickIndex(
    position.tickLowerIndex,
    pool.tickSpacing,
    position.pool,
    ctx.program.programId
  ).publicKey;
  const upperTickArrayKey = PDAUtil.getTickArrayFromTickIndex(
    position.tickUpperIndex,
    pool.tickSpacing,
    position.pool,
    ctx.program.programId
  ).publicKey;

  return await ctx.fetcher.getTickArrays([lowerTickArrayKey, upperTickArrayKey], opts);
}
