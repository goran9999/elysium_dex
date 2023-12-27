import BN from "bn.js";
import { PoolUtil, TokenInfo } from "..";
import {
  ElysiumPoolAccountFetchOptions,
  ElysiumPoolAccountFetcherInterface,
} from "../network/public/fetcher";
import {
  TokenAccountInfo,
  ElysiumPoolData,
  ElysiumPoolRewardInfo,
  ElysiumPoolRewardInfoData,
} from "../types/public";

export async function getTokenMintInfos(
  fetcher: ElysiumPoolAccountFetcherInterface,
  data: ElysiumPoolData,
  opts?: ElysiumPoolAccountFetchOptions
): Promise<TokenInfo[]> {
  const mintA = data.tokenMintA;
  const infoA = await fetcher.getMintInfo(mintA, opts);
  if (!infoA) {
    throw new Error(`Unable to fetch MintInfo for mint - ${mintA}`);
  }
  const mintB = data.tokenMintB;
  const infoB = await fetcher.getMintInfo(mintB, opts);
  if (!infoB) {
    throw new Error(`Unable to fetch MintInfo for mint - ${mintB}`);
  }
  return [
    { mint: mintA, ...infoA },
    { mint: mintB, ...infoB },
  ];
}

export async function getRewardInfos(
  fetcher: ElysiumPoolAccountFetcherInterface,
  data: ElysiumPoolData,
  opts?: ElysiumPoolAccountFetchOptions
): Promise<ElysiumPoolRewardInfo[]> {
  const rewardInfos: ElysiumPoolRewardInfo[] = [];
  for (const rewardInfo of data.rewardInfos) {
    rewardInfos.push(await getRewardInfo(fetcher, rewardInfo, opts));
  }
  return rewardInfos;
}

async function getRewardInfo(
  fetcher: ElysiumPoolAccountFetcherInterface,
  data: ElysiumPoolRewardInfoData,
  opts?: ElysiumPoolAccountFetchOptions
): Promise<ElysiumPoolRewardInfo> {
  const rewardInfo = { ...data, initialized: false, vaultAmount: new BN(0) };
  if (PoolUtil.isRewardInitialized(data)) {
    const vaultInfo = await fetcher.getTokenInfo(data.vault, opts);
    if (!vaultInfo) {
      throw new Error(`Unable to fetch TokenAccountInfo for vault - ${data.vault}`);
    }
    rewardInfo.initialized = true;
    rewardInfo.vaultAmount = new BN(vaultInfo.amount.toString());
  }
  return rewardInfo;
}

export async function getTokenVaultAccountInfos(
  fetcher: ElysiumPoolAccountFetcherInterface,
  data: ElysiumPoolData,
  opts?: ElysiumPoolAccountFetchOptions
): Promise<TokenAccountInfo[]> {
  const vaultA = data.tokenVaultA;
  const vaultInfoA = await fetcher.getTokenInfo(vaultA, opts);
  if (!vaultInfoA) {
    throw new Error(`Unable to fetch TokenAccountInfo for vault - ${vaultA}`);
  }
  const vaultB = data.tokenVaultB;
  const vaultInfoB = await fetcher.getTokenInfo(vaultB, opts);
  if (!vaultInfoB) {
    throw new Error(`Unable to fetch TokenAccountInfo for vault - ${vaultB}`);
  }
  return [vaultInfoA, vaultInfoB];
}
