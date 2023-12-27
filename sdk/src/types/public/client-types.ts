import { Account, Mint } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { TickArrayData, ElysiumPoolRewardInfoData } from "./anchor-types";

/**
 * Extended Mint type to host token info.
 * @category ElysiumPoolClient
 */
export type TokenInfo = Mint & { mint: PublicKey };

/**
 * Extended (token) Account type to host account info for a Token.
 * @category ElysiumPoolClient
 */
export type TokenAccountInfo = Account;

/**
 * Type to represent a reward for a reward index on a ElysiumPool.
 * @category ElysiumPoolClient
 */
export type ElysiumPoolRewardInfo = ElysiumPoolRewardInfoData & {
  initialized: boolean;
  vaultAmount: BN;
};

/**
 * A wrapper class of a TickArray on a ElysiumPool
 * @category ElysiumPoolClient
 */
export type TickArray = {
  address: PublicKey;
  data: TickArrayData | null;
};
