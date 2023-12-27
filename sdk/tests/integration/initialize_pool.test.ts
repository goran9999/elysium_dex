import * as anchor from "@coral-xyz/anchor";
import { MathUtil, PDA } from "@orca-so/common-sdk";
import * as assert from "assert";
import Decimal from "decimal.js";
import {
  InitPoolParams,
  MAX_SQRT_PRICE,
  MIN_SQRT_PRICE,
  PDAUtil,
  PriceMath,
  ElysiumPoolContext,
  ElysiumPoolData,
  ElysiumPoolIx,
  toTx,
} from "../../src";
import {
  ONE_SOL,
  TickSpacing,
  ZERO_BN,
  asyncAssertTokenVault,
  createMint,
  systemTransferTx,
} from "../utils";
import { defaultConfirmOptions } from "../utils/const";
import { buildTestPoolParams, initTestPool } from "../utils/init-utils";

describe("initialize_pool", () => {
  const provider = anchor.AnchorProvider.local(undefined, defaultConfirmOptions);

  const program = anchor.workspace.ElysiumPool;
  const ctx = ElysiumPoolContext.fromWorkspace(provider, program);
  const fetcher = ctx.fetcher;

  it("successfully init a Standard account", async () => {
    const price = MathUtil.toX64(new Decimal(5));
    const { configInitInfo, poolInitInfo, feeTierParams } = await initTestPool(
      ctx,
      TickSpacing.Standard,
      price
    );
    const pool = (await fetcher.getPool(poolInitInfo.poolPda.publicKey)) as ElysiumPoolData;

    const expectedElysiumPoolPda = PDAUtil.getElysiumPool(
      program.programId,
      configInitInfo.poolsConfigKeypair.publicKey,
      poolInitInfo.tokenMintA,
      poolInitInfo.tokenMintB,
      TickSpacing.Standard
    );

    assert.ok(poolInitInfo.poolPda.publicKey.equals(expectedElysiumPoolPda.publicKey));
    assert.equal(expectedElysiumPoolPda.bump, pool.poolBump[0]);

    assert.ok(pool.poolsConfig.equals(poolInitInfo.poolsConfig));
    assert.ok(pool.tokenMintA.equals(poolInitInfo.tokenMintA));
    assert.ok(pool.tokenVaultA.equals(poolInitInfo.tokenVaultAKeypair.publicKey));

    assert.ok(pool.tokenMintB.equals(poolInitInfo.tokenMintB));
    assert.ok(pool.tokenVaultB.equals(poolInitInfo.tokenVaultBKeypair.publicKey));

    assert.equal(pool.feeRate, feeTierParams.defaultFeeRate);
    assert.equal(pool.protocolFeeRate, configInitInfo.defaultProtocolFeeRate);

    assert.ok(pool.sqrtPrice.eq(new anchor.BN(poolInitInfo.initSqrtPrice.toString())));
    assert.ok(pool.liquidity.eq(ZERO_BN));

    assert.equal(
      pool.tickCurrentIndex,
      PriceMath.sqrtPriceX64ToTickIndex(poolInitInfo.initSqrtPrice)
    );

    assert.ok(pool.protocolFeeOwedA.eq(ZERO_BN));
    assert.ok(pool.protocolFeeOwedB.eq(ZERO_BN));
    assert.ok(pool.feeGrowthGlobalA.eq(ZERO_BN));
    assert.ok(pool.feeGrowthGlobalB.eq(ZERO_BN));

    assert.ok(pool.tickSpacing === TickSpacing.Standard);

    await asyncAssertTokenVault(program, poolInitInfo.tokenVaultAKeypair.publicKey, {
      expectedOwner: poolInitInfo.poolPda.publicKey,
      expectedMint: poolInitInfo.tokenMintA,
    });
    await asyncAssertTokenVault(program, poolInitInfo.tokenVaultBKeypair.publicKey, {
      expectedOwner: poolInitInfo.poolPda.publicKey,
      expectedMint: poolInitInfo.tokenMintB,
    });

    pool.rewardInfos.forEach((rewardInfo) => {
      assert.equal(rewardInfo.emissionsPerSecondX64, 0);
      assert.equal(rewardInfo.growthGlobalX64, 0);
      assert.ok(rewardInfo.authority.equals(configInitInfo.rewardEmissionsSuperAuthority));
      assert.ok(rewardInfo.mint.equals(anchor.web3.PublicKey.default));
      assert.ok(rewardInfo.vault.equals(anchor.web3.PublicKey.default));
    });
  });

  it("successfully init a Stable account", async () => {
    const price = MathUtil.toX64(new Decimal(5));
    const { configInitInfo, poolInitInfo, feeTierParams } = await initTestPool(
      ctx,
      TickSpacing.Stable,
      price
    );
    const pool = (await fetcher.getPool(poolInitInfo.poolPda.publicKey)) as ElysiumPoolData;

    assert.ok(pool.poolsConfig.equals(poolInitInfo.poolsConfig));
    assert.ok(pool.tokenMintA.equals(poolInitInfo.tokenMintA));
    assert.ok(pool.tokenVaultA.equals(poolInitInfo.tokenVaultAKeypair.publicKey));

    assert.ok(pool.tokenMintB.equals(poolInitInfo.tokenMintB));
    assert.ok(pool.tokenVaultB.equals(poolInitInfo.tokenVaultBKeypair.publicKey));

    assert.equal(pool.feeRate, feeTierParams.defaultFeeRate);
    assert.equal(pool.protocolFeeRate, configInitInfo.defaultProtocolFeeRate);

    assert.ok(pool.sqrtPrice.eq(new anchor.BN(poolInitInfo.initSqrtPrice.toString())));
    assert.ok(pool.liquidity.eq(ZERO_BN));

    assert.equal(
      pool.tickCurrentIndex,
      PriceMath.sqrtPriceX64ToTickIndex(poolInitInfo.initSqrtPrice)
    );

    assert.ok(pool.protocolFeeOwedA.eq(ZERO_BN));
    assert.ok(pool.protocolFeeOwedB.eq(ZERO_BN));
    assert.ok(pool.feeGrowthGlobalA.eq(ZERO_BN));
    assert.ok(pool.feeGrowthGlobalB.eq(ZERO_BN));

    assert.ok(pool.tickSpacing === TickSpacing.Stable);

    await asyncAssertTokenVault(program, poolInitInfo.tokenVaultAKeypair.publicKey, {
      expectedOwner: poolInitInfo.poolPda.publicKey,
      expectedMint: poolInitInfo.tokenMintA,
    });
    await asyncAssertTokenVault(program, poolInitInfo.tokenVaultBKeypair.publicKey, {
      expectedOwner: poolInitInfo.poolPda.publicKey,
      expectedMint: poolInitInfo.tokenMintB,
    });

    pool.rewardInfos.forEach((rewardInfo) => {
      assert.equal(rewardInfo.emissionsPerSecondX64, 0);
      assert.equal(rewardInfo.growthGlobalX64, 0);
      assert.ok(rewardInfo.authority.equals(configInitInfo.rewardEmissionsSuperAuthority));
      assert.ok(rewardInfo.mint.equals(anchor.web3.PublicKey.default));
      assert.ok(rewardInfo.vault.equals(anchor.web3.PublicKey.default));
    });
  });

  it("succeeds when funder is different than account paying for transaction fee", async () => {
    const funderKeypair = anchor.web3.Keypair.generate();
    await systemTransferTx(provider, funderKeypair.publicKey, ONE_SOL).buildAndExecute();
    await initTestPool(ctx, TickSpacing.Standard, MathUtil.toX64(new Decimal(5)), funderKeypair);
  });

  it("fails when tokenVaultA mint does not match tokenA mint", async () => {
    const { poolInitInfo } = await buildTestPoolParams(ctx, TickSpacing.Standard);
    const otherTokenPublicKey = await createMint(provider);

    const modifiedPoolInitInfo: InitPoolParams = {
      ...poolInitInfo,
      tokenMintA: otherTokenPublicKey,
    };

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.initializePoolIx(ctx.program, modifiedPoolInitInfo)
      ).buildAndExecute(),
      /custom program error: 0x7d6/ // ConstraintSeeds
    );
  });

  it("fails when tokenVaultB mint does not match tokenB mint", async () => {
    const { poolInitInfo } = await buildTestPoolParams(ctx, TickSpacing.Standard);
    const otherTokenPublicKey = await createMint(provider);

    const modifiedPoolInitInfo: InitPoolParams = {
      ...poolInitInfo,
      tokenMintB: otherTokenPublicKey,
    };

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.initializePoolIx(ctx.program, modifiedPoolInitInfo)
      ).buildAndExecute(),
      /custom program error: 0x7d6/ // ConstraintSeeds
    );
  });

  it("fails when token mints are in the wrong order", async () => {
    const { poolInitInfo, configInitInfo } = await buildTestPoolParams(ctx, TickSpacing.Standard);

    const poolPda = PDAUtil.getElysiumPool(
      ctx.program.programId,
      configInitInfo.poolsConfigKeypair.publicKey,
      poolInitInfo.tokenMintB,
      poolInitInfo.tokenMintA,
      TickSpacing.Stable
    );

    const modifiedPoolInitInfo: InitPoolParams = {
      ...poolInitInfo,
      poolPda,
      tickSpacing: TickSpacing.Stable,
      tokenMintA: poolInitInfo.tokenMintB,
      tokenMintB: poolInitInfo.tokenMintA,
    };

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.initializePoolIx(ctx.program, modifiedPoolInitInfo)
      ).buildAndExecute(),
      /custom program error: 0x1788/ // InvalidTokenMintOrder
    );
  });

  it("fails when the same token mint is passed in", async () => {
    const { poolInitInfo, configInitInfo } = await buildTestPoolParams(ctx, TickSpacing.Standard);

    const poolPda = PDAUtil.getElysiumPool(
      ctx.program.programId,
      configInitInfo.poolsConfigKeypair.publicKey,
      poolInitInfo.tokenMintA,
      poolInitInfo.tokenMintA,
      TickSpacing.Stable
    );

    const modifiedPoolInitInfo: InitPoolParams = {
      ...poolInitInfo,
      poolPda,
      tickSpacing: TickSpacing.Stable,
      tokenMintB: poolInitInfo.tokenMintA,
    };

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.initializePoolIx(ctx.program, modifiedPoolInitInfo)
      ).buildAndExecute(),
      /custom program error: 0x1788/ // InvalidTokenMintOrder
    );
  });

  it("fails when sqrt-price exceeds max", async () => {
    const { poolInitInfo } = await buildTestPoolParams(ctx, TickSpacing.Standard);
    const otherTokenPublicKey = await createMint(provider);

    const modifiedPoolInitInfo: InitPoolParams = {
      ...poolInitInfo,
      initSqrtPrice: new anchor.BN(MAX_SQRT_PRICE).add(new anchor.BN(1)),
    };

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.initializePoolIx(ctx.program, modifiedPoolInitInfo)
      ).buildAndExecute(),
      /custom program error: 0x177b/ // SqrtPriceOutOfBounds
    );
  });

  it("fails when sqrt-price subceeds min", async () => {
    const { poolInitInfo } = await buildTestPoolParams(ctx, TickSpacing.Standard);

    const modifiedPoolInitInfo: InitPoolParams = {
      ...poolInitInfo,
      initSqrtPrice: new anchor.BN(MIN_SQRT_PRICE).sub(new anchor.BN(1)),
    };

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.initializePoolIx(ctx.program, modifiedPoolInitInfo)
      ).buildAndExecute(),
      /custom program error: 0x177b/ // SqrtPriceOutOfBounds
    );
  });

  it("ignore passed bump", async () => {
    const { poolInitInfo } = await buildTestPoolParams(ctx, TickSpacing.Standard);

    const poolPda = poolInitInfo.poolPda;
    const validBump = poolPda.bump;
    const invalidBump = (validBump + 1) % 256; // +1 shift mod 256
    const modifiedElysiumPoolPda: PDA = {
      publicKey: poolPda.publicKey,
      bump: invalidBump,
    };

    const modifiedPoolInitInfo: InitPoolParams = {
      ...poolInitInfo,
      poolPda: modifiedElysiumPoolPda,
    };

    await toTx(
      ctx,
      ElysiumPoolIx.initializePoolIx(ctx.program, modifiedPoolInitInfo)
    ).buildAndExecute();

    // check if passed invalid bump was ignored
    const pool = (await fetcher.getPool(poolInitInfo.poolPda.publicKey)) as ElysiumPoolData;
    assert.equal(pool.poolBump, validBump);
    assert.notEqual(pool.poolBump, invalidBump);
  });
});
