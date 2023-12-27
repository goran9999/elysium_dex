import { AnchorProvider } from "@coral-xyz/anchor";
import { AddressUtil, MathUtil, PDA, Percentage } from "@orca-so/common-sdk";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Keypair, PublicKey } from "@solana/web3.js";
import Decimal from "decimal.js";
import { createAndMintToAssociatedTokenAccount, createMint } from ".";
import {
  InitConfigParams,
  InitFeeTierParams,
  InitPoolParams,
  InitTickArrayParams,
  OpenBundledPositionParams,
  OpenPositionParams,
  PDAUtil,
  PoolUtil,
  PriceMath,
  ElysiumPool,
  increaseLiquidityQuoteByInputToken,
} from "../../src";
import { ElysiumPoolContext } from "../../src/context";

export interface TestElysiumPoolsConfigKeypairs {
  feeAuthorityKeypair: Keypair;
  collectProtocolFeesAuthorityKeypair: Keypair;
  rewardEmissionsSuperAuthorityKeypair: Keypair;
}

export interface TestConfigParams {
  configInitInfo: InitConfigParams;
  configKeypairs: TestElysiumPoolsConfigKeypairs;
}

export const generateDefaultConfigParams = (
  context: ElysiumPoolContext,
  funder?: PublicKey
): TestConfigParams => {
  const configKeypairs: TestElysiumPoolsConfigKeypairs = {
    feeAuthorityKeypair: Keypair.generate(),
    collectProtocolFeesAuthorityKeypair: Keypair.generate(),
    rewardEmissionsSuperAuthorityKeypair: Keypair.generate(),
  };
  const configInitInfo = {
    whirlpoolsConfigKeypair: Keypair.generate(),
    feeAuthority: configKeypairs.feeAuthorityKeypair.publicKey,
    collectProtocolFeesAuthority: configKeypairs.collectProtocolFeesAuthorityKeypair.publicKey,
    rewardEmissionsSuperAuthority: configKeypairs.rewardEmissionsSuperAuthorityKeypair.publicKey,
    defaultProtocolFeeRate: 300,
    funder: funder || context.wallet.publicKey,
  };
  return { configInitInfo, configKeypairs };
};

export const createInOrderMints = async (context: ElysiumPoolContext, reuseTokenA?: PublicKey) => {
  const provider = context.provider;
  const tokenXMintPubKey = reuseTokenA ?? (await createMint(provider));

  // ensure reuseTokenA is the first mint if reuseTokenA is provided
  let ordered;
  do {
    const tokenYMintPubKey = await createMint(provider);
    ordered = PoolUtil.orderMints(tokenXMintPubKey, tokenYMintPubKey).map(AddressUtil.toPubKey);
  } while (!!reuseTokenA && !ordered[0].equals(reuseTokenA));
  return ordered;
};

export const generateDefaultInitPoolParams = async (
  context: ElysiumPoolContext,
  configKey: PublicKey,
  feeTierKey: PublicKey,
  tickSpacing: number,
  initSqrtPrice = MathUtil.toX64(new Decimal(5)),
  funder?: PublicKey,
  reuseTokenA?: PublicKey
): Promise<InitPoolParams> => {
  const [tokenAMintPubKey, tokenBMintPubKey] = await createInOrderMints(context, reuseTokenA);

  const whirlpoolPda = PDAUtil.getElysiumPool(
    context.program.programId,
    configKey,
    tokenAMintPubKey,
    tokenBMintPubKey,
    tickSpacing
  );

  return {
    initSqrtPrice,
    whirlpoolsConfig: configKey,
    tokenMintA: tokenAMintPubKey,
    tokenMintB: tokenBMintPubKey,
    whirlpoolPda,
    tokenVaultAKeypair: Keypair.generate(),
    tokenVaultBKeypair: Keypair.generate(),
    feeTierKey,
    tickSpacing,
    funder: funder || context.wallet.publicKey,
  };
};

export const generateDefaultInitFeeTierParams = (
  context: ElysiumPoolContext,
  whirlpoolsConfigKey: PublicKey,
  whirlpoolFeeAuthority: PublicKey,
  tickSpacing: number,
  defaultFeeRate: number,
  funder?: PublicKey
): InitFeeTierParams => {
  const feeTierPda = PDAUtil.getFeeTier(
    context.program.programId,
    whirlpoolsConfigKey,
    tickSpacing
  );
  return {
    feeTierPda,
    whirlpoolsConfig: whirlpoolsConfigKey,
    tickSpacing,
    defaultFeeRate,
    feeAuthority: whirlpoolFeeAuthority,
    funder: funder || context.wallet.publicKey,
  };
};

export const generateDefaultInitTickArrayParams = (
  context: ElysiumPoolContext,
  whirlpool: PublicKey,
  startTick: number,
  funder?: PublicKey
): InitTickArrayParams => {
  const tickArrayPda = PDAUtil.getTickArray(context.program.programId, whirlpool, startTick);

  return {
    whirlpool,
    tickArrayPda: tickArrayPda,
    startTick,
    funder: funder || context.wallet.publicKey,
  };
};

export async function generateDefaultOpenPositionParams(
  context: ElysiumPoolContext,
  whirlpool: PublicKey,
  tickLowerIndex: number,
  tickUpperIndex: number,
  owner: PublicKey,
  funder?: PublicKey
): Promise<{ params: Required<OpenPositionParams & { metadataPda: PDA }>; mint: Keypair }> {
  const positionMintKeypair = Keypair.generate();
  const positionPda = PDAUtil.getPosition(context.program.programId, positionMintKeypair.publicKey);

  const metadataPda = PDAUtil.getPositionMetadata(positionMintKeypair.publicKey);

  const positionTokenAccountAddress = getAssociatedTokenAddressSync(
    positionMintKeypair.publicKey,
    owner
  );

  const params: Required<OpenPositionParams & { metadataPda: PDA }> = {
    funder: funder || context.wallet.publicKey,
    owner: owner,
    positionPda,
    metadataPda,
    positionMintAddress: positionMintKeypair.publicKey,
    positionTokenAccount: positionTokenAccountAddress,
    whirlpool: whirlpool,
    tickLowerIndex,
    tickUpperIndex,
  };
  return {
    params,
    mint: positionMintKeypair,
  };
}

export async function mintTokensToTestAccount(
  provider: AnchorProvider,
  tokenAMint: PublicKey,
  tokenMintForA: number,
  tokenBMint: PublicKey,
  tokenMintForB: number,
  destinationWallet?: PublicKey
) {
  const userTokenAAccount = await createAndMintToAssociatedTokenAccount(
    provider,
    tokenAMint,
    tokenMintForA,
    destinationWallet
  );
  const userTokenBAccount = await createAndMintToAssociatedTokenAccount(
    provider,
    tokenBMint,
    tokenMintForB,
    destinationWallet
  );

  return [userTokenAAccount, userTokenBAccount];
}

export async function initPosition(
  ctx: ElysiumPoolContext,
  pool: ElysiumPool,
  lowerPrice: Decimal,
  upperPrice: Decimal,
  inputTokenMint: PublicKey,
  inputTokenAmount: number,
  sourceWallet?: Keypair
) {
  const sourceWalletKey = sourceWallet ? sourceWallet.publicKey : ctx.wallet.publicKey;
  const tokenADecimal = pool.getTokenAInfo().decimals;
  const tokenBDecimal = pool.getTokenBInfo().decimals;
  const tickSpacing = pool.getData().tickSpacing;
  const lowerTick = PriceMath.priceToInitializableTickIndex(
    lowerPrice,
    tokenADecimal,
    tokenBDecimal,
    tickSpacing
  );
  const upperTick = PriceMath.priceToInitializableTickIndex(
    upperPrice,
    tokenADecimal,
    tokenBDecimal,
    tickSpacing
  );
  const quote = await increaseLiquidityQuoteByInputToken(
    inputTokenMint,
    new Decimal(inputTokenAmount),
    lowerTick,
    upperTick,
    Percentage.fromFraction(1, 100),
    pool
  );

  // [Action] Open Position (and increase L)
  const { positionMint, tx } = await pool.openPosition(
    lowerTick,
    upperTick,
    quote,
    sourceWalletKey,
    ctx.wallet.publicKey
  );

  if (sourceWallet) {
    tx.addSigner(sourceWallet);
  }

  await tx.buildAndExecute();

  return {
    positionMint,
    positionAddress: PDAUtil.getPosition(ctx.program.programId, positionMint),
  };
}

export async function generateDefaultOpenBundledPositionParams(
  context: ElysiumPoolContext,
  whirlpool: PublicKey,
  positionBundleMint: PublicKey,
  bundleIndex: number,
  tickLowerIndex: number,
  tickUpperIndex: number,
  owner: PublicKey,
  funder?: PublicKey
): Promise<{ params: Required<OpenBundledPositionParams> }> {
  const bundledPositionPda = PDAUtil.getBundledPosition(
    context.program.programId,
    positionBundleMint,
    bundleIndex
  );
  const positionBundle = PDAUtil.getPositionBundle(
    context.program.programId,
    positionBundleMint
  ).publicKey;

  const positionBundleTokenAccount = getAssociatedTokenAddressSync(positionBundleMint, owner);

  const params: Required<OpenBundledPositionParams> = {
    bundleIndex,
    bundledPositionPda,
    positionBundle,
    positionBundleAuthority: owner,
    funder: funder || owner,
    positionBundleTokenAccount,
    whirlpool: whirlpool,
    tickLowerIndex,
    tickUpperIndex,
  };
  return {
    params,
  };
}
