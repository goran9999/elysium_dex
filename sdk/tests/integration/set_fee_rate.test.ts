import * as anchor from "@coral-xyz/anchor";
import * as assert from "assert";
import { toTx, ElysiumPoolContext, ElysiumPoolData, ElysiumPoolIx } from "../../src";
import { IGNORE_CACHE } from "../../src/network/public/fetcher";
import { TickSpacing } from "../utils";
import { defaultConfirmOptions } from "../utils/const";
import { initTestPool } from "../utils/init-utils";
import { generateDefaultConfigParams } from "../utils/test-builders";

describe("set_fee_rate", () => {
  const provider = anchor.AnchorProvider.local(undefined, defaultConfirmOptions);

  const program = anchor.workspace.ElysiumPool;
  const ctx = ElysiumPoolContext.fromWorkspace(provider, program);
  const fetcher = ctx.fetcher;

  it("successfully sets_fee_rate", async () => {
    const { poolInitInfo, configInitInfo, configKeypairs, feeTierParams } = await initTestPool(
      ctx,
      TickSpacing.Standard
    );
    const poolKey = poolInitInfo.poolPda.publicKey;
    const poolsConfigKey = configInitInfo.poolsConfigKeypair.publicKey;
    const feeAuthorityKeypair = configKeypairs.feeAuthorityKeypair;

    const newFeeRate = 50;

    let pool = (await fetcher.getPool(poolKey, IGNORE_CACHE)) as ElysiumPoolData;

    assert.equal(pool.feeRate, feeTierParams.defaultFeeRate);

    const setFeeRateTx = toTx(
      ctx,
      ElysiumPoolIx.setFeeRateIx(program, {
        pool: poolKey,
        poolsConfig: poolsConfigKey,
        feeAuthority: feeAuthorityKeypair.publicKey,
        feeRate: newFeeRate,
      })
    ).addSigner(feeAuthorityKeypair);
    await setFeeRateTx.buildAndExecute();

    pool = (await fetcher.getPool(poolInitInfo.poolPda.publicKey, IGNORE_CACHE)) as ElysiumPoolData;
    assert.equal(pool.feeRate, newFeeRate);
  });

  it("successfully sets_fee_rate max", async () => {
    const { poolInitInfo, configInitInfo, configKeypairs, feeTierParams } = await initTestPool(
      ctx,
      TickSpacing.Standard
    );
    const poolKey = poolInitInfo.poolPda.publicKey;
    const poolsConfigKey = configInitInfo.poolsConfigKeypair.publicKey;
    const feeAuthorityKeypair = configKeypairs.feeAuthorityKeypair;

    const newFeeRate = 30_000;

    let pool = (await fetcher.getPool(poolKey, IGNORE_CACHE)) as ElysiumPoolData;

    assert.equal(pool.feeRate, feeTierParams.defaultFeeRate);

    const setFeeRateTx = toTx(
      ctx,
      ElysiumPoolIx.setFeeRateIx(program, {
        pool: poolKey,
        poolsConfig: poolsConfigKey,
        feeAuthority: feeAuthorityKeypair.publicKey,
        feeRate: newFeeRate,
      })
    ).addSigner(feeAuthorityKeypair);
    await setFeeRateTx.buildAndExecute();

    pool = (await fetcher.getPool(poolInitInfo.poolPda.publicKey, IGNORE_CACHE)) as ElysiumPoolData;
    assert.equal(pool.feeRate, newFeeRate);
  });

  it("fails when fee rate exceeds max", async () => {
    const { poolInitInfo, configInitInfo, configKeypairs } = await initTestPool(
      ctx,
      TickSpacing.Standard
    );
    const poolKey = poolInitInfo.poolPda.publicKey;
    const poolsConfigKey = configInitInfo.poolsConfigKeypair.publicKey;
    const feeAuthorityKeypair = configKeypairs.feeAuthorityKeypair;

    const newFeeRate = 30_000 + 1;
    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.setFeeRateIx(ctx.program, {
          poolsConfig: poolsConfigKey,
          pool: poolKey,
          feeAuthority: feeAuthorityKeypair.publicKey,
          feeRate: newFeeRate,
        })
      )
        .addSigner(configKeypairs.feeAuthorityKeypair)
        .buildAndExecute(),
      /0x178c/ // FeeRateMaxExceeded
    );
  });

  it("fails when fee authority is not signer", async () => {
    const { poolInitInfo, configInitInfo, configKeypairs } = await initTestPool(
      ctx,
      TickSpacing.Standard
    );
    const poolKey = poolInitInfo.poolPda.publicKey;
    const poolsConfigKey = configInitInfo.poolsConfigKeypair.publicKey;
    const feeAuthorityKeypair = configKeypairs.feeAuthorityKeypair;

    const newFeeRate = 1000;
    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.setFeeRateIx(ctx.program, {
          poolsConfig: poolsConfigKey,
          pool: poolKey,
          feeAuthority: feeAuthorityKeypair.publicKey,
          feeRate: newFeeRate,
        })
      ).buildAndExecute(),
      /.*signature verification fail.*/i
    );
  });

  it("fails when pool and pools config don't match", async () => {
    const { poolInitInfo, configInitInfo, configKeypairs } = await initTestPool(
      ctx,
      TickSpacing.Standard
    );
    const poolKey = poolInitInfo.poolPda.publicKey;
    const feeAuthorityKeypair = configKeypairs.feeAuthorityKeypair;

    const { configInitInfo: otherConfigInitInfo } = generateDefaultConfigParams(ctx);
    await toTx(
      ctx,
      ElysiumPoolIx.initializeConfigIx(ctx.program, otherConfigInitInfo)
    ).buildAndExecute();

    const newFeeRate = 1000;
    await assert.rejects(
      ctx.program.rpc.setFeeRate(newFeeRate, {
        accounts: {
          poolsConfig: otherConfigInitInfo.poolsConfigKeypair.publicKey,
          pool: poolKey,
          feeAuthority: feeAuthorityKeypair.publicKey,
        },
        signers: [configKeypairs.feeAuthorityKeypair],
      }),
      // message have been changed
      // https://github.com/coral-xyz/anchor/pull/2101/files#diff-e564d6832afe5358ef129e96970ba1e5180b5e74aba761831e1923c06d7b839fR412
      /A has[_ ]one constraint was violated/ // ConstraintHasOne
    );
  });

  it("fails when fee authority is invalid", async () => {
    const { poolInitInfo, configInitInfo } = await initTestPool(ctx, TickSpacing.Standard);
    const poolKey = poolInitInfo.poolPda.publicKey;

    const fakeAuthorityKeypair = anchor.web3.Keypair.generate();

    const newFeeRate = 1000;
    await assert.rejects(
      ctx.program.rpc.setFeeRate(newFeeRate, {
        accounts: {
          poolsConfig: configInitInfo.poolsConfigKeypair.publicKey,
          pool: poolKey,
          feeAuthority: fakeAuthorityKeypair.publicKey,
        },
        signers: [fakeAuthorityKeypair],
      }),
      /An address constraint was violated/ // ConstraintAddress
    );
  });
});
