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
import { createInOrderMints } from "../utils/test-builders";

describe("set_default_protocol_fee_rate", () => {
  const provider = anchor.AnchorProvider.local(undefined, defaultConfirmOptions);

  const program = anchor.workspace.ElysiumPool;
  const ctx = ElysiumPoolContext.fromWorkspace(provider, program);
  const fetcher = ctx.fetcher;

  it("successfully set_default_protocol_fee_rate", async () => {
    const { poolInitInfo, configInitInfo, configKeypairs } = await initTestPool(
      ctx,
      TickSpacing.Standard
    );
    const poolKey = poolInitInfo.poolPda.publicKey;
    const poolsConfigKey = configInitInfo.poolsConfigKeypair.publicKey;
    const feeAuthorityKeypair = configKeypairs.feeAuthorityKeypair;

    const newDefaultProtocolFeeRate = 45;

    // Fetch initial pool and check it is default
    let pool_0 = (await fetcher.getPool(poolKey)) as ElysiumPoolData;
    assert.equal(pool_0.protocolFeeRate, configInitInfo.defaultProtocolFeeRate);

    await toTx(
      ctx,
      ElysiumPoolIx.setDefaultProtocolFeeRateIx(ctx.program, {
        poolsConfig: poolsConfigKey,
        feeAuthority: feeAuthorityKeypair.publicKey,
        defaultProtocolFeeRate: newDefaultProtocolFeeRate,
      })
    )
      .addSigner(feeAuthorityKeypair)
      .buildAndExecute();

    // Setting the default rate did not change existing pool fee rate
    pool_0 = (await fetcher.getPool(poolKey)) as ElysiumPoolData;
    assert.equal(pool_0.protocolFeeRate, configInitInfo.defaultProtocolFeeRate);

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
    assert.equal(pool_1.protocolFeeRate, newDefaultProtocolFeeRate);
  });

  it("fails when default fee rate exceeds max", async () => {
    const { configInitInfo, configKeypairs } = await initTestPool(ctx, TickSpacing.Standard);
    const poolsConfigKey = configInitInfo.poolsConfigKeypair.publicKey;
    const feeAuthorityKeypair = configKeypairs.feeAuthorityKeypair;

    const newDefaultProtocolFeeRate = 20_000;
    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.setDefaultProtocolFeeRateIx(ctx.program, {
          poolsConfig: poolsConfigKey,
          feeAuthority: feeAuthorityKeypair.publicKey,
          defaultProtocolFeeRate: newDefaultProtocolFeeRate,
        })
      )
        .addSigner(feeAuthorityKeypair)
        .buildAndExecute(),
      /0x178d/ // ProtocolFeeRateMaxExceeded
    );
  });

  it("fails when fee authority is not a signer", async () => {
    const { configInitInfo, configKeypairs } = await initTestPool(ctx, TickSpacing.Standard);
    const poolsConfigKey = configInitInfo.poolsConfigKeypair.publicKey;
    const feeAuthorityKeypair = configKeypairs.feeAuthorityKeypair;

    const newDefaultProtocolFeeRate = 1000;
    await assert.rejects(
      program.rpc.setDefaultProtocolFeeRate(newDefaultProtocolFeeRate, {
        accounts: {
          poolsConfig: poolsConfigKey,
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

    const newDefaultProtocolFeeRate = 1000;
    await assert.rejects(
      program.rpc.setDefaultProtocolFeeRate(newDefaultProtocolFeeRate, {
        accounts: {
          poolsConfig: poolsConfigKey,
          feeAuthority: fakeFeeAuthorityKeypair.publicKey,
        },
        signers: [fakeFeeAuthorityKeypair],
      }),
      /An address constraint was violated/
    );
  });
});
