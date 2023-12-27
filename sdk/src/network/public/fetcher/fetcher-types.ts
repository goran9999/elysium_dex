import { Address } from "@coral-xyz/anchor";
import {
  BasicSupportedTypes,
  ParsableEntity,
  SimpleAccountFetchOptions,
} from "@orca-so/common-sdk";
import { Mint, Account as TokenAccount } from "@solana/spl-token";
import {
  FeeTierData,
  PositionBundleData,
  PositionData,
  TickArrayData,
  ElysiumPoolData,
  ElysiumPoolsConfigData,
} from "../../../types/public";

/**
 * Union type of all the {@link ParsableEntity} types that can be cached in the {@link ElysiumPoolAccountFetcherInterface}
 * @category Network
 */
export type ElysiumPoolSupportedTypes =
  | ElysiumPoolsConfigData
  | ElysiumPoolData
  | PositionData
  | TickArrayData
  | FeeTierData
  | PositionBundleData
  | BasicSupportedTypes;

/**
 * The default retention periods for each {@link ParsableEntity} type in the {@link ElysiumPoolAccountFetcherInterface}
 * @category Network
 */
export const DEFAULT_WHIRLPOOL_RETENTION_POLICY: ReadonlyMap<
  ParsableEntity<ElysiumPoolSupportedTypes>,
  number
> = new Map<ParsableEntity<ElysiumPoolSupportedTypes>, number>([]);

/**
 * Type to define fetch options for the {@link ElysiumPoolAccountFetcherInterface}
 * @category Network
 */
export type ElysiumPoolAccountFetchOptions = SimpleAccountFetchOptions;

/**
 * Default fetch option for always fetching when making an account request to the {@link ElysiumPoolAccountFetcherInterface}
 * @category Network
 */
export const IGNORE_CACHE: ElysiumPoolAccountFetchOptions = { maxAge: 0 };

/**
 * Default fetch option for always using the cached value for an account request to the {@link ElysiumPoolAccountFetcherInterface}
 * @category Network
 */
export const PREFER_CACHE: ElysiumPoolAccountFetchOptions = { maxAge: Number.POSITIVE_INFINITY };

/**
 * Fetcher interface for fetching {@link ElysiumPoolSupportedTypes} from the network
 * @category Network
 */
export interface ElysiumPoolAccountFetcherInterface {
  /**
   * Fetch and cache the rent exempt value
   * @param refresh If true, will always fetch from the network
   */
  getAccountRentExempt(refresh?: boolean): Promise<number>;

  /**
   * Fetch and cache the account for a given ElysiumPool addresses
   * @param address The mint address
   * @param opts {@link ElysiumPoolAccountFetchOptions} instance to dictate fetch behavior
   */
  getPool(address: Address, opts?: ElysiumPoolAccountFetchOptions): Promise<ElysiumPoolData | null>;

  /**
   * Fetch and cache the accounts for a given array of ElysiumPool addresses
   * @param addresses The array of mint addresses
   * @param opts {@link ElysiumPoolAccountFetchOptions} instance to dictate fetch behavior
   */
  getPools(
    addresses: Address[],
    opts?: ElysiumPoolAccountFetchOptions
  ): Promise<ReadonlyMap<string, ElysiumPoolData | null>>;

  /**
   * Fetch and cache the account for a given Position address
   * @param address The address of the position account
   * @param opts {@link ElysiumPoolAccountFetchOptions} instance to dictate fetch behavior
   */
  getPosition(
    address: Address,
    opts?: ElysiumPoolAccountFetchOptions
  ): Promise<PositionData | null>;

  /**
   * Fetch and cache the accounts for a given array of Position addresses
   * @param addresses The array of position account addresses
   * @param opts {@link ElysiumPoolAccountFetchOptions} instance to dictate fetch behavior
   */
  getPositions(
    addresses: Address[],
    opts?: ElysiumPoolAccountFetchOptions
  ): Promise<ReadonlyMap<string, PositionData | null>>;

  /**
   * Fetch and cache the account for a given TickArray address.
   * @param address The address of the tick array account
   * @param opts {@link ElysiumPoolAccountFetchOptions} instance to dictate fetch behavior
   */
  getTickArray(
    address: Address,
    opts?: ElysiumPoolAccountFetchOptions
  ): Promise<TickArrayData | null>;

  /**
   * Fetch and cache the accounts for a given array of TickArray addresses
   * @param addresses The array of tick array account addresses
   * @param opts {@link ElysiumPoolAccountFetchOptions} instance to dictate fetch behavior
   */
  getTickArrays(
    addresses: Address[],
    opts?: ElysiumPoolAccountFetchOptions
  ): Promise<ReadonlyArray<TickArrayData | null>>;

  /**
   * Fetch and cache the account for a given FeeTier address
   * @param address The address of the fee tier account
   * @param opts {@link ElysiumPoolAccountFetchOptions} instance to dictate fetch behavior
   */
  getFeeTier(address: Address, opts?: ElysiumPoolAccountFetchOptions): Promise<FeeTierData | null>;

  /**
   * Fetch and cache the accounts for a given array of FeeTier addresses
   * @param addresses The array of fee tier account addresses
   * @param opts {@link ElysiumPoolAccountFetchOptions} instance to dictate fetch behavior
   */
  getFeeTiers(
    addresses: Address[],
    opts?: ElysiumPoolAccountFetchOptions
  ): Promise<ReadonlyMap<string, FeeTierData | null>>;

  /**
   * Fetch and cache the account for a given TokenAccount address
   * @param address The address of the token account
   * @param opts {@link ElysiumPoolAccountFetchOptions} instance to dictate fetch behavior
   */
  getTokenInfo(
    address: Address,
    opts?: ElysiumPoolAccountFetchOptions
  ): Promise<TokenAccount | null>;

  /**
   * Fetch and cache the accounts for a given array of TokenAccount addresses
   * @param addresses The array of token account addresses
   * @param opts {@link ElysiumPoolAccountFetchOptions} instance to dictate fetch behavior
   */
  getTokenInfos(
    addresses: Address[],
    opts?: ElysiumPoolAccountFetchOptions
  ): Promise<ReadonlyMap<string, TokenAccount | null>>;

  /**
   * Fetch and cache the account for a given Mint address
   * @param address The address of the mint account
   * @param opts {@link ElysiumPoolAccountFetchOptions} instance to dictate fetch behavior
   */
  getMintInfo(address: Address, opts?: ElysiumPoolAccountFetchOptions): Promise<Mint | null>;

  /**
   * Fetch and cache the accounts for a given array of Mint addresses
   * @param addresses The array of mint account addresses
   * @param opts {@link ElysiumPoolAccountFetchOptions} instance to dictate fetch behavior
   */
  getMintInfos(
    addresses: Address[],
    opts?: ElysiumPoolAccountFetchOptions
  ): Promise<ReadonlyMap<string, Mint | null>>;

  /**
   * Fetch and cache the account for a given ElysiumPoolConfig address
   * @param address The address of the ElysiumPoolConfig account
   * @param opts {@link ElysiumPoolAccountFetchOptions} instance to dictate fetch behavior
   */
  getConfig(
    address: Address,
    opts?: ElysiumPoolAccountFetchOptions
  ): Promise<ElysiumPoolsConfigData | null>;

  /**
   * Fetch and cache the accounts for a given array of ElysiumPoolConfig addresses
   * @param addresses The array of ElysiumPoolConfig account addresses
   * @param opts {@link ElysiumPoolAccountFetchOptions} instance to dictate fetch behavior
   */
  getConfigs(
    addresses: Address[],
    opts?: ElysiumPoolAccountFetchOptions
  ): Promise<ReadonlyMap<string, ElysiumPoolsConfigData | null>>;

  /**
   * Fetch and cache the account for a given PositionBundle address
   * @param address The address of the position bundle account
   * @param opts {@link ElysiumPoolAccountFetchOptions} instance to dictate fetch behavior
   */
  getPositionBundle(
    address: Address,
    opts?: ElysiumPoolAccountFetchOptions
  ): Promise<PositionBundleData | null>;

  /**
   * Fetch and cache the accounts for a given array of PositionBundle addresses
   * @param addresses The array of position bundle account addresses
   * @param opts {@link ElysiumPoolAccountFetchOptions} instance to dictate fetch behavior
   */
  getPositionBundles(
    addresses: Address[],
    opts?: ElysiumPoolAccountFetchOptions
  ): Promise<ReadonlyMap<string, PositionBundleData | null>>;

  /**
   * Populate the fetcher's cache with the given {@link ElysiumPoolsData} accounts
   * @param accounts The map of addresses to on-chain account data
   * @param parser The {@link ParsableEntity} instance to parse the accounts
   * @param now The current timestamp to use for the cache
   */
  populateCache<T extends ElysiumPoolSupportedTypes>(
    accounts: ReadonlyMap<string, T>,
    parser: ParsableEntity<T>,
    now: number
  ): void;
}
