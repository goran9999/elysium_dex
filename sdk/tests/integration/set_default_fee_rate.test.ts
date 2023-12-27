import * as anchor from "@coral-xyz/anchor";
import * as assert from "assert";
import {
  InitPoolParams,
  PDAUtil,
  toTx,
  ElysiumPoolContext,
  ElysiumPoolData,
  ElysiumPoolIx,
} from "../../src";
import { TickSpacing } from "../utils";
import { defaultConfirmOptions } from "../utils/const";
import { initTestPool } from "../utils/init-utils";
import { createInOrderMints, generateDefaultConfigParams } from "../utils/test-builders";

describe("set_default_fee_rate", () => {
  const provider = anchor.AnchorProvider.local(undefined, defaultConfirmOptions);

  const program = anchor.workspace.ElysiumPool;
  const ctx = ElysiumPoolContext.fromWorkspace(provider, program);
  const fetcher = ctx.fetcher;

  it("successfully set_default_fee_rate", async () => {
    const { poolInitInfo, configInitInfo, configKeypairs, feeTierParams } = await initTestPool(
      ctx,
      TickSpacing.Standard
    );
    const poolKey = poolInitInfo.poolPda.publicKey;
    const poolsConfigKey = configInitInfo.poolsConfigKeypair.publicKey;
    const feeAuthorityKeypair = configKeypairs.feeAuthorityKeypair;

    const newDefaultFeeRate = 45;

    // Fetch initial pool and check it is default
    let pool_0 = (await fetcher.getPool(poolKey)) as ElysiumPoolData;
    assert.equal(pool_0.feeRate, feeTierParams.defaultFeeRate);

    await toTx(
      ctx,
      ElysiumPoolIx.setDefaultFeeRateIx(ctx.program, {
        poolsConfig: poolsConfigKey,
        feeAuthority: feeAuthorityKeypair.publicKey,
        tickSpacing: TickSpacing.Standard,
        defaultFeeRate: newDefaultFeeRate,
      })
    )
      .addSigner(feeAuthorityKeypair)
      .buildAndExecute();

    // Setting the default rate did not change existing pool fee rate
    pool_0 = (await fetcher.getPool(poolInitInfo.poolPda.publicKey)) as ElysiumPoolData;
    assert.equal(pool_0.feeRate, feeTierParams.defaultFeeRate);

    // Newly initialized pools have new default fee rate
    const [tokenMintA, tokenMintB] = await createInOrderMints(ctx);
    const poolPda = PDAUtil.getElysiumPool(
      ctx.program.programId,
      poolsConfigKey,
      tokenMintA,
      tokenMintB,
      TickSpacing.Stable
    );
    const tokenVaultAKeypair = anchor.web3.Keypair.generate();
    const tokenVaultBKeypair = anchor.web3.Keypair.generate();

    const newPoolInitInfo: InitPoolParams = {
      ...poolInitInfo,
      tokenMintA,
      tokenMintB,
      poolPda,
      tokenVaultAKeypair,
      tokenVaultBKeypair,
      tickSpacing: TickSpacing.Stable,
    };
    await toTx(ctx, ElysiumPoolIx.initializePoolIx(ctx.program, newPoolInitInfo)).buildAndExecute();

    const pool_1 = (await fetcher.getPool(poolPda.publicKey)) as ElysiumPoolData;
    assert.equal(pool_1.feeRate, newDefaultFeeRate);
  });

  it("successfully set_default_fee_rate max", async () => {
    const { poolInitInfo, configInitInfo, configKeypairs, feeTierParams } = await initTestPool(
      ctx,
      TickSpacing.Standard
    );
    const poolsConfigKey = configInitInfo.poolsConfigKeypair.publicKey;
    const feeAuthorityKeypair = configKeypairs.feeAuthorityKeypair;

    const newDefaultFeeRate = 30_000;

    await toTx(
      ctx,
      ElysiumPoolIx.setDefaultFeeRateIx(ctx.program, {
        poolsConfig: poolsConfigKey,
        feeAuthority: feeAuthorityKeypair.publicKey,
        tickSpacing: TickSpacing.Standard,
        defaultFeeRate: newDefaultFeeRate,
      })
    )
      .addSigner(feeAuthorityKeypair)
      .buildAndExecute();

    // Newly initialized pools have new default fee rate
    const [tokenMintA, tokenMintB] = await createInOrderMints(ctx);
    const poolPda = PDAUtil.getElysiumPool(
      ctx.program.programId,
      poolsConfigKey,
      tokenMintA,
      tokenMintB,
      TickSpacing.Stable
    );
    const tokenVaultAKeypair = anchor.web3.Keypair.generate();
    const tokenVaultBKeypair = anchor.web3.Keypair.generate();

    const newPoolInitInfo: InitPoolParams = {
      ...poolInitInfo,
      tokenMintA,
      tokenMintB,
      poolPda,
      tokenVaultAKeypair,
      tokenVaultBKeypair,
      tickSpacing: TickSpacing.Stable,
    };
    await toTx(ctx, ElysiumPoolIx.initializePoolIx(ctx.program, newPoolInitInfo)).buildAndExecute();

    const pool_1 = (await fetcher.getPool(poolPda.publicKey)) as ElysiumPoolData;
    assert.equal(pool_1.feeRate, newDefaultFeeRate);
  });

  it("fails when default fee rate exceeds max", async () => {
    const { configInitInfo, configKeypairs } = await initTestPool(ctx, TickSpacing.Standard);
    const poolsConfigKey = configInitInfo.poolsConfigKeypair.publicKey;
    const feeAuthorityKeypair = configKeypairs.feeAuthorityKeypair;

    const newDefaultFeeRate = 30_000 + 1;
    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.setDefaultFeeRateIx(ctx.program, {
          poolsConfig: poolsConfigKey,
          feeAuthority: feeAuthorityKeypair.publicKey,
          tickSpacing: TickSpacing.Standard,
          defaultFeeRate: newDefaultFeeRate,
        })
      )
        .addSigner(feeAuthorityKeypair)
        .buildAndExecute(),
      /0x178c/ // FeeRateMaxExceeded
    );
  });

  it("fails when fee tier account has not been initialized", async () => {
    const { configInitInfo, configKeypairs } = generateDefaultConfigParams(ctx);
    await toTx(
      ctx,
      ElysiumPoolIx.initializeConfigIx(ctx.program, configInitInfo)
    ).buildAndExecute();
    const feeAuthorityKeypair = configKeypairs.feeAuthorityKeypair;

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.setDefaultFeeRateIx(ctx.program, {
          poolsConfig: configInitInfo.poolsConfigKeypair.publicKey,
          feeAuthority: feeAuthorityKeypair.publicKey,
          tickSpacing: TickSpacing.Standard,
          defaultFeeRate: 500,
        })
      )
        .addSigner(feeAuthorityKeypair)
        .buildAndExecute(),
      /0xbc4/ // AccountNotInitialized
    );
  });

  it("fails when fee authority is not a signer", async () => {
    const { configInitInfo, configKeypairs } = await initTestPool(ctx, TickSpacing.Standard);
    const poolsConfigKey = configInitInfo.poolsConfigKeypair.publicKey;
    const feeAuthorityKeypair = configKeypairs.feeAuthorityKeypair;
    const feeTierPda = PDAUtil.getFeeTier(
      ctx.program.programId,
      configInitInfo.poolsConfigKeypair.publicKey,
      TickSpacing.Standard
    );

    const newDefaultFeeRate = 1000;
    await assert.rejects(
      program.rpc.setDefaultFeeRate(newDefaultFeeRate, {
        accounts: {
          poolsConfig: poolsConfigKey,
          feeTier: feeTierPda.publicKey,
          feeAuthority: feeAuthorityKeypair.publicKey,
        },
      }),
      /.*signature verification fail.*/i
    );
  });

  it("fails when invalid fee authority provided", async () => {
    const { configInitInfo } = await initTestPool(ctx, TickSpacing.Standard);
    const poolsConfigKey = configInitInfo.poolsConfigKeypair.publicKey;
    const fakeFeeAuthorityKeypair = anchor.web3.Keypair.generate();
    const feeTierPda = PDAUtil.getFeeTier(
      ctx.program.programId,
      configInitInfo.poolsConfigKeypair.publicKey,
      TickSpacing.Standard
    );

    const newDefaultFeeRate = 1000;
    await assert.rejects(
      program.rpc.setDefaultFeeRate(newDefaultFeeRate, {
        accounts: {
          poolsConfig: poolsConfigKey,
          feeTier: feeTierPda.publicKey,
          feeAuthority: fakeFeeAuthorityKeypair.publicKey,
        },
        signers: [fakeFeeAuthorityKeypair],
      }),
      /An address constraint was violated/ // ConstraintAddress
    );
  });
});
