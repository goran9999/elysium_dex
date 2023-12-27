import { AnchorProvider, Idl, Program } from "@coral-xyz/anchor";
import {
  BuildOptions,
  LookupTableFetcher,
  TransactionBuilderOptions,
  Wallet,
  WrappedSolAccountCreateMethod,
} from "@orca-so/common-sdk";
import { Commitment, Connection, PublicKey, SendOptions } from "@solana/web3.js";
import { ElysiumPool } from "./artifacts/pool";
import ElysiumPoolIDL from "./artifacts/pool.json";
import { ElysiumPoolAccountFetcherInterface, buildDefaultAccountFetcher } from "./network/public/";
import { contextOptionsToBuilderOptions } from "./utils/txn-utils";

/**
 * Default settings used when interacting with transactions.
 * @category Core
 */
export type ElysiumPoolContextOpts = {
  userDefaultBuildOptions?: Partial<BuildOptions>;
  userDefaultSendOptions?: Partial<SendOptions>;
  userDefaultConfirmCommitment?: Commitment;
  accountResolverOptions?: AccountResolverOptions;
};

/**
 * Default settings used when resolving token accounts.
 * @category Core
 */
export type AccountResolverOptions = {
  createWrappedSolAccountMethod: WrappedSolAccountCreateMethod;
  allowPDAOwnerAddress: boolean;
};

const DEFAULT_ACCOUNT_RESOLVER_OPTS: AccountResolverOptions = {
  createWrappedSolAccountMethod: "keypair",
  allowPDAOwnerAddress: false,
};

/**
 * Context for storing environment classes and objects for usage throughout the SDK
 * @category Core
 */
export class ElysiumPoolContext {
  readonly connection: Connection;
  readonly wallet: Wallet;
  readonly program: Program<ElysiumPool>;
  readonly provider: AnchorProvider;
  readonly fetcher: ElysiumPoolAccountFetcherInterface;
  readonly lookupTableFetcher: LookupTableFetcher | undefined;
  readonly opts: ElysiumPoolContextOpts;
  readonly txBuilderOpts: TransactionBuilderOptions | undefined;
  readonly accountResolverOpts: AccountResolverOptions;

  public static from(
    connection: Connection,
    wallet: Wallet,
    programId: PublicKey,
    fetcher: ElysiumPoolAccountFetcherInterface = buildDefaultAccountFetcher(connection),
    lookupTableFetcher?: LookupTableFetcher,
    opts: ElysiumPoolContextOpts = {}
  ): ElysiumPoolContext {
    const anchorProvider = new AnchorProvider(connection, wallet, {
      commitment: opts.userDefaultConfirmCommitment || "confirmed",
      preflightCommitment: opts.userDefaultConfirmCommitment || "confirmed",
    });
    const program = new Program(ElysiumPoolIDL as Idl, programId, anchorProvider);
    return new ElysiumPoolContext(
      anchorProvider,
      anchorProvider.wallet,
      program,
      fetcher,
      lookupTableFetcher,
      opts
    );
  }

  public static fromWorkspace(
    provider: AnchorProvider,
    program: Program,
    fetcher: ElysiumPoolAccountFetcherInterface = buildDefaultAccountFetcher(provider.connection),
    lookupTableFetcher?: LookupTableFetcher,
    opts: ElysiumPoolContextOpts = {}
  ) {
    return new ElysiumPoolContext(
      provider,
      provider.wallet,
      program,
      fetcher,
      lookupTableFetcher,
      opts
    );
  }

  public static withProvider(
    provider: AnchorProvider,
    programId: PublicKey,
    fetcher: ElysiumPoolAccountFetcherInterface = buildDefaultAccountFetcher(provider.connection),
    lookupTableFetcher?: LookupTableFetcher,
    opts: ElysiumPoolContextOpts = {}
  ): ElysiumPoolContext {
    const program = new Program(ElysiumPoolIDL as Idl, programId, provider);
    return new ElysiumPoolContext(
      provider,
      provider.wallet,
      program,
      fetcher,
      lookupTableFetcher,
      opts
    );
  }

  public constructor(
    provider: AnchorProvider,
    wallet: Wallet,
    program: Program,
    fetcher: ElysiumPoolAccountFetcherInterface,
    lookupTableFetcher?: LookupTableFetcher,
    opts: ElysiumPoolContextOpts = {}
  ) {
    this.connection = provider.connection;
    this.wallet = wallet;
    // It's a hack but it works on Anchor workspace *shrug*
    this.program = program as unknown as Program<ElysiumPool>;
    this.provider = provider;
    this.fetcher = fetcher;
    this.lookupTableFetcher = lookupTableFetcher;
    this.opts = opts;
    this.txBuilderOpts = contextOptionsToBuilderOptions(this.opts);
    this.accountResolverOpts = opts.accountResolverOptions ?? DEFAULT_ACCOUNT_RESOLVER_OPTS;
  }

  // TODO: Add another factory method to build from on-chain IDL
}
