import { Address } from "@coral-xyz/anchor";
import {
  AccountFetcher,
  ParsableEntity,
  ParsableMintInfo,
  ParsableTokenAccountInfo,
  SimpleAccountFetcher,
} from "@orca-so/common-sdk";
import { AccountLayout, Mint, Account as TokenAccount } from "@solana/spl-token";
import { Connection } from "@solana/web3.js";
import {
  DEFAULT_WHIRLPOOL_RETENTION_POLICY,
  ElysiumPoolAccountFetchOptions,
  ElysiumPoolAccountFetcherInterface,
  ElysiumPoolSupportedTypes,
} from "..";
import {
  FeeTierData,
  PositionBundleData,
  PositionData,
  TickArrayData,
  ElysiumPoolData,
  ElysiumPoolsConfigData,
} from "../../../types/public";
import {
  ParsableFeeTier,
  ParsablePosition,
  ParsablePositionBundle,
  ParsableTickArray,
  ParsableElysiumPool,
  ParsableElysiumPoolsConfig,
} from "../parsing";

/**
 * Build a default instance of {@link ElysiumPoolAccountFetcherInterface} with the default {@link AccountFetcher} implementation
 * @param connection An instance of {@link Connection} to use for fetching accounts
 * @returns An instance of {@link ElysiumPoolAccountFetcherInterface}
 * @category Network
 */
export const buildDefaultAccountFetcher = (connection: Connection) => {
  return new ElysiumPoolAccountFetcher(
    connection,
    new SimpleAccountFetcher(connection, DEFAULT_WHIRLPOOL_RETENTION_POLICY)
  );
};

/**
 * Fetcher and cache layer for fetching {@link ElysiumPoolSupportedTypes} from the network
 * Default implementation for {@link ElysiumPoolAccountFetcherInterface}
 * @category Network
 */
export class ElysiumPoolAccountFetcher implements ElysiumPoolAccountFetcherInterface {
  private _accountRentExempt: number | undefined;

  constructor(
    readonly connection: Connection,
    readonly fetcher: AccountFetcher<ElysiumPoolSupportedTypes, ElysiumPoolAccountFetchOptions>
  ) {}

  async getAccountRentExempt(refresh: boolean = false): Promise<number> {
    // This value should be relatively static or at least not break according to spec
    // https://docs.solana.com/developing/programming-model/accounts#rent-exemption
    if (!this._accountRentExempt || refresh) {
      this._accountRentExempt = await this.connection.getMinimumBalanceForRentExemption(
        AccountLayout.span
      );
    }
    return this._accountRentExempt;
  }

  getPool(
    address: Address,
    opts?: ElysiumPoolAccountFetchOptions
  ): Promise<ElysiumPoolData | null> {
    return this.fetcher.getAccount(address, ParsableElysiumPool, opts);
  }
  getPools(
    addresses: Address[],
    opts?: ElysiumPoolAccountFetchOptions
  ): Promise<ReadonlyMap<string, ElysiumPoolData | null>> {
    return this.fetcher.getAccounts(addresses, ParsableElysiumPool, opts);
  }
  getPosition(
    address: Address,
    opts?: ElysiumPoolAccountFetchOptions
  ): Promise<PositionData | null> {
    return this.fetcher.getAccount(address, ParsablePosition, opts);
  }
  getPositions(
    addresses: Address[],
    opts?: ElysiumPoolAccountFetchOptions
  ): Promise<ReadonlyMap<string, PositionData | null>> {
    return this.fetcher.getAccounts(addresses, ParsablePosition, opts);
  }
  getTickArray(
    address: Address,
    opts?: ElysiumPoolAccountFetchOptions
  ): Promise<TickArrayData | null> {
    return this.fetcher.getAccount(address, ParsableTickArray, opts);
  }
  getTickArrays(
    addresses: Address[],
    opts?: ElysiumPoolAccountFetchOptions
  ): Promise<ReadonlyArray<TickArrayData | null>> {
    return this.fetcher.getAccountsAsArray(addresses, ParsableTickArray, opts);
  }
  getFeeTier(address: Address, opts?: ElysiumPoolAccountFetchOptions): Promise<FeeTierData | null> {
    return this.fetcher.getAccount(address, ParsableFeeTier, opts);
  }
  getFeeTiers(
    addresses: Address[],
    opts?: ElysiumPoolAccountFetchOptions
  ): Promise<ReadonlyMap<string, FeeTierData | null>> {
    return this.fetcher.getAccounts(addresses, ParsableFeeTier, opts);
  }
  getTokenInfo(
    address: Address,
    opts?: ElysiumPoolAccountFetchOptions
  ): Promise<TokenAccount | null> {
    return this.fetcher.getAccount(address, ParsableTokenAccountInfo, opts);
  }
  getTokenInfos(
    addresses: Address[],
    opts?: ElysiumPoolAccountFetchOptions
  ): Promise<ReadonlyMap<string, TokenAccount | null>> {
    return this.fetcher.getAccounts(addresses, ParsableTokenAccountInfo, opts);
  }
  getMintInfo(address: Address, opts?: ElysiumPoolAccountFetchOptions): Promise<Mint | null> {
    return this.fetcher.getAccount(address, ParsableMintInfo, opts);
  }
  getMintInfos(
    addresses: Address[],
    opts?: ElysiumPoolAccountFetchOptions
  ): Promise<ReadonlyMap<string, Mint | null>> {
    return this.fetcher.getAccounts(addresses, ParsableMintInfo, opts);
  }
  getConfig(
    address: Address,
    opts?: ElysiumPoolAccountFetchOptions
  ): Promise<ElysiumPoolsConfigData | null> {
    return this.fetcher.getAccount(address, ParsableElysiumPoolsConfig, opts);
  }
  getConfigs(
    addresses: Address[],
    opts?: ElysiumPoolAccountFetchOptions
  ): Promise<ReadonlyMap<string, ElysiumPoolsConfigData | null>> {
    return this.fetcher.getAccounts(addresses, ParsableElysiumPoolsConfig, opts);
  }
  getPositionBundle(
    address: Address,
    opts?: ElysiumPoolAccountFetchOptions
  ): Promise<PositionBundleData | null> {
    return this.fetcher.getAccount(address, ParsablePositionBundle, opts);
  }
  getPositionBundles(
    addresses: Address[],
    opts?: ElysiumPoolAccountFetchOptions
  ): Promise<ReadonlyMap<string, PositionBundleData | null>> {
    return this.fetcher.getAccounts(addresses, ParsablePositionBundle, opts);
  }
  populateCache<T extends ElysiumPoolSupportedTypes>(
    accounts: ReadonlyMap<string, T>,
    parser: ParsableEntity<T>,
    now = Date.now()
  ): void {
    this.fetcher.populateAccounts(accounts, parser, now);
  }
}
