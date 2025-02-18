import { Address } from "@coral-xyz/anchor";
import {
  AddressUtil,
  Instruction,
  TokenUtil,
  TransactionBuilder,
  ZERO,
  resolveOrCreateATAs,
} from "@orca-so/common-sdk";
import { NATIVE_MINT, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import invariant from "tiny-invariant";
import { ElysiumPoolContext } from "../context";
import {
  DecreaseLiquidityInput,
  IncreaseLiquidityInput,
  collectFeesIx,
  collectRewardIx,
  decreaseLiquidityIx,
  increaseLiquidityIx,
  updateFeesAndRewardsIx,
} from "../instructions";
import {
  IGNORE_CACHE,
  PREFER_CACHE,
  ElysiumPoolAccountFetchOptions,
} from "../network/public/fetcher";
import { PositionData, TickArrayData, TickData, ElysiumPoolData } from "../types/public";
import { getTickArrayDataForPosition } from "../utils/builder/position-builder-util";
import { PDAUtil, PoolUtil, TickArrayUtil, TickUtil } from "../utils/public";
import {
  TokenMintTypes,
  getTokenMintsFromElysiumPools,
  resolveAtaForMints,
} from "../utils/pool-ata-utils";
import { Position } from "../pool-client";

export class PositionImpl implements Position {
  private data: PositionData;
  private poolData: ElysiumPoolData;
  private lowerTickArrayData: TickArrayData;
  private upperTickArrayData: TickArrayData;
  constructor(
    readonly ctx: ElysiumPoolContext,
    readonly address: PublicKey,
    data: PositionData,
    poolData: ElysiumPoolData,
    lowerTickArrayData: TickArrayData,
    upperTickArrayData: TickArrayData
  ) {
    this.data = data;
    this.poolData = poolData;
    this.lowerTickArrayData = lowerTickArrayData;
    this.upperTickArrayData = upperTickArrayData;
  }

  getAddress(): PublicKey {
    return this.address;
  }

  getData(): PositionData {
    return this.data;
  }

  getElysiumPoolData(): ElysiumPoolData {
    return this.poolData;
  }

  getLowerTickData(): TickData {
    return TickArrayUtil.getTickFromArray(
      this.lowerTickArrayData,
      this.data.tickLowerIndex,
      this.poolData.tickSpacing
    );
  }

  getUpperTickData(): TickData {
    return TickArrayUtil.getTickFromArray(
      this.upperTickArrayData,
      this.data.tickUpperIndex,
      this.poolData.tickSpacing
    );
  }

  async refreshData() {
    await this.refresh();
    return this.data;
  }

  async increaseLiquidity(
    liquidityInput: IncreaseLiquidityInput,
    resolveATA = true,
    sourceWallet?: Address,
    positionWallet?: Address,
    ataPayer?: Address
  ) {
    const sourceWalletKey = sourceWallet
      ? AddressUtil.toPubKey(sourceWallet)
      : this.ctx.wallet.publicKey;
    const positionWalletKey = positionWallet
      ? AddressUtil.toPubKey(positionWallet)
      : this.ctx.wallet.publicKey;
    const ataPayerKey = ataPayer ? AddressUtil.toPubKey(ataPayer) : this.ctx.wallet.publicKey;

    const pool = await this.ctx.fetcher.getPool(this.data.pool, IGNORE_CACHE);
    if (!pool) {
      throw new Error("Unable to fetch pool for this position.");
    }

    const txBuilder = new TransactionBuilder(
      this.ctx.provider.connection,
      this.ctx.provider.wallet,
      this.ctx.txBuilderOpts
    );

    let tokenOwnerAccountA: PublicKey;
    let tokenOwnerAccountB: PublicKey;

    if (resolveATA) {
      const [ataA, ataB] = await resolveOrCreateATAs(
        this.ctx.connection,
        sourceWalletKey,
        [
          { tokenMint: pool.tokenMintA, wrappedSolAmountIn: liquidityInput.tokenMaxA },
          { tokenMint: pool.tokenMintB, wrappedSolAmountIn: liquidityInput.tokenMaxB },
        ],
        () => this.ctx.fetcher.getAccountRentExempt(),
        ataPayerKey,
        undefined, // use default
        this.ctx.accountResolverOpts.allowPDAOwnerAddress,
        this.ctx.accountResolverOpts.createWrappedSolAccountMethod
      );
      const { address: ataAddrA, ...tokenOwnerAccountAIx } = ataA!;
      const { address: ataAddrB, ...tokenOwnerAccountBIx } = ataB!;
      tokenOwnerAccountA = ataAddrA;
      tokenOwnerAccountB = ataAddrB;
      txBuilder.addInstruction(tokenOwnerAccountAIx);
      txBuilder.addInstruction(tokenOwnerAccountBIx);
    } else {
      tokenOwnerAccountA = getAssociatedTokenAddressSync(
        pool.tokenMintA,
        sourceWalletKey,
        this.ctx.accountResolverOpts.allowPDAOwnerAddress
      );
      tokenOwnerAccountB = getAssociatedTokenAddressSync(
        pool.tokenMintB,
        sourceWalletKey,
        this.ctx.accountResolverOpts.allowPDAOwnerAddress
      );
    }
    const positionTokenAccount = getAssociatedTokenAddressSync(
      this.data.positionMint,
      positionWalletKey,
      this.ctx.accountResolverOpts.allowPDAOwnerAddress
    );

    const increaseIx = increaseLiquidityIx(this.ctx.program, {
      ...liquidityInput,
      pool: this.data.pool,
      position: this.address,
      positionTokenAccount,
      tokenOwnerAccountA,
      tokenOwnerAccountB,
      tokenVaultA: pool.tokenVaultA,
      tokenVaultB: pool.tokenVaultB,
      tickArrayLower: PDAUtil.getTickArray(
        this.ctx.program.programId,
        this.data.pool,
        TickUtil.getStartTickIndex(this.data.tickLowerIndex, pool.tickSpacing)
      ).publicKey,
      tickArrayUpper: PDAUtil.getTickArray(
        this.ctx.program.programId,
        this.data.pool,
        TickUtil.getStartTickIndex(this.data.tickUpperIndex, pool.tickSpacing)
      ).publicKey,
      positionAuthority: positionWalletKey,
    });
    txBuilder.addInstruction(increaseIx);
    return txBuilder;
  }

  async decreaseLiquidity(
    liquidityInput: DecreaseLiquidityInput,
    resolveATA = true,
    sourceWallet?: Address,
    positionWallet?: Address,
    ataPayer?: Address
  ) {
    const sourceWalletKey = sourceWallet
      ? AddressUtil.toPubKey(sourceWallet)
      : this.ctx.wallet.publicKey;
    const positionWalletKey = positionWallet
      ? AddressUtil.toPubKey(positionWallet)
      : this.ctx.wallet.publicKey;
    const ataPayerKey = ataPayer ? AddressUtil.toPubKey(ataPayer) : this.ctx.wallet.publicKey;
    const pool = await this.ctx.fetcher.getPool(this.data.pool, IGNORE_CACHE);

    if (!pool) {
      throw new Error("Unable to fetch pool for this position.");
    }

    const txBuilder = new TransactionBuilder(
      this.ctx.provider.connection,
      this.ctx.provider.wallet,
      this.ctx.txBuilderOpts
    );
    let tokenOwnerAccountA: PublicKey;
    let tokenOwnerAccountB: PublicKey;

    if (resolveATA) {
      const [ataA, ataB] = await resolveOrCreateATAs(
        this.ctx.connection,
        sourceWalletKey,
        [{ tokenMint: pool.tokenMintA }, { tokenMint: pool.tokenMintB }],
        () => this.ctx.fetcher.getAccountRentExempt(),
        ataPayerKey,
        undefined, // use default
        this.ctx.accountResolverOpts.allowPDAOwnerAddress,
        this.ctx.accountResolverOpts.createWrappedSolAccountMethod
      );
      const { address: ataAddrA, ...tokenOwnerAccountAIx } = ataA!;
      const { address: ataAddrB, ...tokenOwnerAccountBIx } = ataB!;
      tokenOwnerAccountA = ataAddrA;
      tokenOwnerAccountB = ataAddrB;
      txBuilder.addInstruction(tokenOwnerAccountAIx);
      txBuilder.addInstruction(tokenOwnerAccountBIx);
    } else {
      tokenOwnerAccountA = getAssociatedTokenAddressSync(
        pool.tokenMintA,
        sourceWalletKey,
        this.ctx.accountResolverOpts.allowPDAOwnerAddress
      );
      tokenOwnerAccountB = getAssociatedTokenAddressSync(
        pool.tokenMintB,
        sourceWalletKey,
        this.ctx.accountResolverOpts.allowPDAOwnerAddress
      );
    }

    const decreaseIx = decreaseLiquidityIx(this.ctx.program, {
      ...liquidityInput,
      pool: this.data.pool,
      position: this.address,
      positionTokenAccount: getAssociatedTokenAddressSync(
        this.data.positionMint,
        positionWalletKey,
        this.ctx.accountResolverOpts.allowPDAOwnerAddress
      ),
      tokenOwnerAccountA,
      tokenOwnerAccountB,
      tokenVaultA: pool.tokenVaultA,
      tokenVaultB: pool.tokenVaultB,
      tickArrayLower: PDAUtil.getTickArray(
        this.ctx.program.programId,
        this.data.pool,
        TickUtil.getStartTickIndex(this.data.tickLowerIndex, pool.tickSpacing)
      ).publicKey,
      tickArrayUpper: PDAUtil.getTickArray(
        this.ctx.program.programId,
        this.data.pool,
        TickUtil.getStartTickIndex(this.data.tickUpperIndex, pool.tickSpacing)
      ).publicKey,
      positionAuthority: positionWalletKey,
    });
    txBuilder.addInstruction(decreaseIx);
    return txBuilder;
  }

  async collectFees(
    updateFeesAndRewards: boolean = true,
    ownerTokenAccountMap?: Partial<Record<string, Address>>,
    destinationWallet?: Address,
    positionWallet?: Address,
    ataPayer?: Address,
    opts: ElysiumPoolAccountFetchOptions = PREFER_CACHE
  ): Promise<TransactionBuilder> {
    const [destinationWalletKey, positionWalletKey, ataPayerKey] = AddressUtil.toPubKeys([
      destinationWallet ?? this.ctx.wallet.publicKey,
      positionWallet ?? this.ctx.wallet.publicKey,
      ataPayer ?? this.ctx.wallet.publicKey,
    ]);

    const pool = await this.ctx.fetcher.getPool(this.data.pool, opts);
    if (!pool) {
      throw new Error(
        `Unable to fetch pool (${this.data.pool}) for this position (${this.address}).`
      );
    }

    let txBuilder = new TransactionBuilder(
      this.ctx.provider.connection,
      this.ctx.provider.wallet,
      this.ctx.txBuilderOpts
    );

    const accountExemption = await this.ctx.fetcher.getAccountRentExempt();

    let ataMap = { ...ownerTokenAccountMap };

    if (!ownerTokenAccountMap) {
      const affliatedMints = getTokenMintsFromElysiumPools([pool], TokenMintTypes.POOL_ONLY);
      const { ataTokenAddresses: affliatedTokenAtaMap, resolveAtaIxs } = await resolveAtaForMints(
        this.ctx,
        {
          mints: affliatedMints.mintMap,
          accountExemption,
          receiver: destinationWalletKey,
          payer: ataPayerKey,
        }
      );

      txBuilder.addInstructions(resolveAtaIxs);

      if (affliatedMints.hasNativeMint) {
        let { address: wSOLAta, ...resolveWSolIx } =
          TokenUtil.createWrappedNativeAccountInstruction(
            destinationWalletKey,
            ZERO,
            accountExemption,
            ataPayerKey,
            destinationWalletKey,
            this.ctx.accountResolverOpts.createWrappedSolAccountMethod
          );
        affliatedTokenAtaMap[NATIVE_MINT.toBase58()] = wSOLAta;
        txBuilder.addInstruction(resolveWSolIx);
      }

      ataMap = { ...affliatedTokenAtaMap };
    }

    const tokenOwnerAccountA = ataMap[pool.tokenMintA.toBase58()];
    invariant(
      !!tokenOwnerAccountA,
      `No owner token account provided for wallet ${destinationWalletKey.toBase58()} for token A ${pool.tokenMintA.toBase58()} `
    );
    const tokenOwnerAccountB = ataMap[pool.tokenMintB.toBase58()];
    invariant(
      !!tokenOwnerAccountB,
      `No owner token account provided for wallet ${destinationWalletKey.toBase58()} for token B ${pool.tokenMintB.toBase58()} `
    );

    const positionTokenAccount = getAssociatedTokenAddressSync(
      this.data.positionMint,
      positionWalletKey,
      this.ctx.accountResolverOpts.allowPDAOwnerAddress
    );

    if (updateFeesAndRewards && !this.data.liquidity.isZero()) {
      const updateIx = await this.updateFeesAndRewards();
      txBuilder.addInstruction(updateIx);
    }

    const ix = collectFeesIx(this.ctx.program, {
      pool: this.data.pool,
      position: this.address,
      positionTokenAccount,
      tokenOwnerAccountA: AddressUtil.toPubKey(tokenOwnerAccountA),
      tokenOwnerAccountB: AddressUtil.toPubKey(tokenOwnerAccountB),
      tokenVaultA: pool.tokenVaultA,
      tokenVaultB: pool.tokenVaultB,
      positionAuthority: positionWalletKey,
    });

    txBuilder.addInstruction(ix);

    return txBuilder;
  }

  async collectRewards(
    rewardsToCollect?: Address[],
    updateFeesAndRewards: boolean = true,
    ownerTokenAccountMap?: Partial<Record<string, Address>>,
    destinationWallet?: Address,
    positionWallet?: Address,
    ataPayer?: Address,
    opts: ElysiumPoolAccountFetchOptions = IGNORE_CACHE
  ): Promise<TransactionBuilder> {
    const [destinationWalletKey, positionWalletKey, ataPayerKey] = AddressUtil.toPubKeys([
      destinationWallet ?? this.ctx.wallet.publicKey,
      positionWallet ?? this.ctx.wallet.publicKey,
      ataPayer ?? this.ctx.wallet.publicKey,
    ]);

    const pool = await this.ctx.fetcher.getPool(this.data.pool, opts);
    if (!pool) {
      throw new Error(
        `Unable to fetch pool(${this.data.pool}) for this position(${this.address}).`
      );
    }

    const initializedRewards = pool.rewardInfos.filter((info) =>
      PoolUtil.isRewardInitialized(info)
    );

    const txBuilder = new TransactionBuilder(
      this.ctx.provider.connection,
      this.ctx.provider.wallet,
      this.ctx.txBuilderOpts
    );

    const accountExemption = await this.ctx.fetcher.getAccountRentExempt();

    let ataMap = { ...ownerTokenAccountMap };
    if (!ownerTokenAccountMap) {
      const rewardMints = getTokenMintsFromElysiumPools([pool], TokenMintTypes.REWARD_ONLY);
      const { ataTokenAddresses: affliatedTokenAtaMap, resolveAtaIxs } = await resolveAtaForMints(
        this.ctx,
        {
          mints: rewardMints.mintMap,
          accountExemption,
          receiver: destinationWalletKey,
          payer: ataPayerKey,
        }
      );

      if (rewardMints.hasNativeMint) {
        let { address: wSOLAta, ...resolveWSolIx } =
          TokenUtil.createWrappedNativeAccountInstruction(
            destinationWalletKey,
            ZERO,
            accountExemption,
            ataPayerKey,
            destinationWalletKey,
            this.ctx.accountResolverOpts.createWrappedSolAccountMethod
          );
        affliatedTokenAtaMap[NATIVE_MINT.toBase58()] = wSOLAta;
        txBuilder.addInstruction(resolveWSolIx);
      }

      txBuilder.addInstructions(resolveAtaIxs);

      ataMap = { ...affliatedTokenAtaMap };
    }

    const positionTokenAccount = getAssociatedTokenAddressSync(
      this.data.positionMint,
      positionWalletKey,
      this.ctx.accountResolverOpts.allowPDAOwnerAddress
    );
    if (updateFeesAndRewards && !this.data.liquidity.isZero()) {
      const updateIx = await this.updateFeesAndRewards();
      txBuilder.addInstruction(updateIx);
    }

    initializedRewards.forEach((info, index) => {
      if (
        rewardsToCollect &&
        !rewardsToCollect.some((r) => r.toString() === info.mint.toBase58())
      ) {
        // If rewardsToCollect is specified and this reward is not in it,
        // don't include collectIX for that in TX
        return;
      }

      const rewardOwnerAccount = ataMap[info.mint.toBase58()];
      invariant(
        !!rewardOwnerAccount,
        `No owner token account provided for wallet ${destinationWalletKey.toBase58()} for reward ${index} token ${info.mint.toBase58()} `
      );

      const ix = collectRewardIx(this.ctx.program, {
        pool: this.data.pool,
        position: this.address,
        positionTokenAccount,
        rewardIndex: index,
        rewardOwnerAccount: AddressUtil.toPubKey(rewardOwnerAccount),
        rewardVault: info.vault,
        positionAuthority: positionWalletKey,
      });

      txBuilder.addInstruction(ix);
    });

    return txBuilder;
  }

  private async refresh() {
    const positionAccount = await this.ctx.fetcher.getPosition(this.address, IGNORE_CACHE);
    if (!!positionAccount) {
      this.data = positionAccount;
    }
    const poolAccount = await this.ctx.fetcher.getPool(this.data.pool, IGNORE_CACHE);
    if (!!poolAccount) {
      this.poolData = poolAccount;
    }

    const [lowerTickArray, upperTickArray] = await getTickArrayDataForPosition(
      this.ctx,
      this.data,
      this.poolData,
      IGNORE_CACHE
    );
    if (lowerTickArray) {
      this.lowerTickArrayData = lowerTickArray;
    }
    if (upperTickArray) {
      this.upperTickArrayData = upperTickArray;
    }
  }

  private async updateFeesAndRewards(): Promise<Instruction> {
    const pool = await this.ctx.fetcher.getPool(this.data.pool);
    if (!pool) {
      throw new Error(
        `Unable to fetch pool(${this.data.pool}) for this position(${this.address}).`
      );
    }

    const [tickArrayLowerPda, tickArrayUpperPda] = [
      this.data.tickLowerIndex,
      this.data.tickUpperIndex,
    ].map((tickIndex) =>
      PDAUtil.getTickArrayFromTickIndex(
        tickIndex,
        pool.tickSpacing,
        this.data.pool,
        this.ctx.program.programId
      )
    );

    const updateIx = updateFeesAndRewardsIx(this.ctx.program, {
      pool: this.data.pool,
      position: this.address,
      tickArrayLower: tickArrayLowerPda.publicKey,
      tickArrayUpper: tickArrayUpperPda.publicKey,
    });

    return updateIx;
  }
}
