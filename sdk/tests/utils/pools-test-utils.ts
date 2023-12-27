import BN from "bn.js";
import { ElysiumPoolContext, ElysiumPoolData } from "../../src";
import { getTokenBalance } from "./token";

export type VaultAmounts = {
  tokenA: BN;
  tokenB: BN;
};

export async function getVaultAmounts(ctx: ElysiumPoolContext, poolData: ElysiumPoolData) {
  return {
    tokenA: new BN(await getTokenBalance(ctx.provider, poolData.tokenVaultA)),
    tokenB: new BN(await getTokenBalance(ctx.provider, poolData.tokenVaultB)),
  };
}
