import * as anchor from "@coral-xyz/anchor";
import * as assert from "assert";
import { toTx, ElysiumPoolContext, ElysiumPoolData, ElysiumPoolIx } from "../../src";
import { IGNORE_CACHE } from "../../src/network/public/fetcher";
import { TickSpacing } from "../utils";
import { defaultConfirmOptions } from "../utils/const";
import { initTestPool } from "../utils/init-utils";
import { generateDefaultConfigParams } from "../utils/test-builders";

describe("set_protocol_fee_rate", () => {
  const provider = anchor.AnchorProvider.local(undefined, defaultConfirmOptions);
  const program = anchor.workspace.ElysiumPool;
  const ctx = ElysiumPoolContext.fromWorkspace(provider, program);
  const fetcher = ctx.fetcher;

  it("successfully sets_protocol_fee_rate", async () => {
    const { poolInitInfo, configInitInfo, configKeypairs } = await initTestPool(
      ctx,
      TickSpacing.Standard
    );
    const poolKey = poolInitInfo.poolPda.publicKey;
    const poolsConfigKey = configInitInfo.poolsConfigKeypair.publicKey;
    const feeAuthorityKeypair = configKeypairs.feeAuthorityKeypair;

    const newProtocolFeeRate = 50;

    let pool = (await fetcher.getPool(poolKey, IGNORE_CACHE)) as ElysiumPoolData;

    assert.equal(pool.protocolFeeRate, configInitInfo.defaultProtocolFeeRate);

    const txBuilder = toTx(
      ctx,
      ElysiumPoolIx.setProtocolFeeRateIx(program, {
        pool: poolKey,
        poolsConfig: poolsConfigKey,
        feeAuthority: feeAuthorityKeypair.publicKey,
        protocolFeeRate: newProtocolFeeRate,
      })
    ).addSigner(feeAuthorityKeypair);
    await txBuilder.buildAndExecute();

    pool = (await fetcher.getPool(poolInitInfo.poolPda.publicKey, IGNORE_CACHE)) as ElysiumPoolData;
    assert.equal(pool.protocolFeeRate, newProtocolFeeRate);
  });

  it("fails when protocol fee rate exceeds max", async () => {
    const { poolInitInfo, configInitInfo, configKeypairs } = await initTestPool(
      ctx,
      TickSpacing.Standard
    );
    const poolKey = poolInitInfo.poolPda.publicKey;
    const poolsConfigKey = configInitInfo.poolsConfigKeypair.publicKey;
    const feeAuthorityKeypair = configKeypairs.feeAuthorityKeypair;

    const newProtocolFeeRate = 3_000;
    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.setProtocolFeeRateIx(ctx.program, {
          poolsConfig: poolsConfigKey,
          pool: poolKey,
          feeAuthority: feeAuthorityKeypair.publicKey,
          protocolFeeRate: newProtocolFeeRate,
        })
      )
        .addSigner(configKeypairs.feeAuthorityKeypair)
        .buildAndExecute(),
      /0x178d/ // ProtocolFeeRateMaxExceeded
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

    const newProtocolFeeRate = 1000;
    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.setProtocolFeeRateIx(ctx.program, {
          poolsConfig: poolsConfigKey,
          pool: poolKey,
          feeAuthority: feeAuthorityKeypair.publicKey,
          protocolFeeRate: newProtocolFeeRate,
        })
      ).buildAndExecute(),
      /.*signature verification fail.*/i
    );
  });

  it("fails when pool and pools config don't match", async () => {
    const { poolInitInfo, configKeypairs } = await initTestPool(ctx, TickSpacing.Standard);
    const poolKey = poolInitInfo.poolPda.publicKey;
    const feeAuthorityKeypair = configKeypairs.feeAuthorityKeypair;

    const { configInitInfo: otherConfigInitInfo } = generateDefaultConfigParams(ctx);
    await toTx(
      ctx,
      ElysiumPoolIx.initializeConfigIx(ctx.program, otherConfigInitInfo)
    ).buildAndExecute();

    const newProtocolFeeRate = 1000;
    await assert.rejects(
      ctx.program.rpc.setProtocolFeeRate(newProtocolFeeRate, {
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

    const newProtocolFeeRate = 1000;
    await assert.rejects(
      ctx.program.rpc.setProtocolFeeRate(newProtocolFeeRate, {
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
