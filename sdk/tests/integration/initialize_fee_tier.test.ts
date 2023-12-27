import * as anchor from "@coral-xyz/anchor";
import * as assert from "assert";
import { FeeTierData, PDAUtil, toTx, ElysiumPoolContext, ElysiumPoolIx } from "../../src";
import { ONE_SOL, systemTransferTx, TickSpacing } from "../utils";
import { defaultConfirmOptions } from "../utils/const";
import { initFeeTier } from "../utils/init-utils";
import {
  generateDefaultConfigParams,
  generateDefaultInitFeeTierParams,
} from "../utils/test-builders";

describe("initialize_fee_tier", () => {
  const provider = anchor.AnchorProvider.local(undefined, defaultConfirmOptions);

  const program = anchor.workspace.ElysiumPool;
  const ctx = ElysiumPoolContext.fromWorkspace(provider, program);
  const fetcher = ctx.fetcher;

  it("successfully init a FeeRate stable account", async () => {
    const { configInitInfo, configKeypairs } = generateDefaultConfigParams(ctx);
    await toTx(
      ctx,
      ElysiumPoolIx.initializeConfigIx(ctx.program, configInitInfo)
    ).buildAndExecute();

    const testTickSpacing = TickSpacing.Stable;
    const { params } = await initFeeTier(
      ctx,
      configInitInfo,
      configKeypairs.feeAuthorityKeypair,
      testTickSpacing,
      800
    );

    const generatedPda = PDAUtil.getFeeTier(
      ctx.program.programId,
      configInitInfo.poolsConfigKeypair.publicKey,
      testTickSpacing
    );

    const feeTierAccount = (await fetcher.getFeeTier(generatedPda.publicKey)) as FeeTierData;

    assert.ok(feeTierAccount.tickSpacing == params.tickSpacing);
    assert.ok(feeTierAccount.defaultFeeRate == params.defaultFeeRate);
  });

  it("successfully init a FeeRate standard account", async () => {
    const { configInitInfo, configKeypairs } = generateDefaultConfigParams(ctx);
    await toTx(
      ctx,
      ElysiumPoolIx.initializeConfigIx(ctx.program, configInitInfo)
    ).buildAndExecute();

    const testTickSpacing = TickSpacing.Standard;
    const { params } = await initFeeTier(
      ctx,
      configInitInfo,
      configKeypairs.feeAuthorityKeypair,
      testTickSpacing,
      3000
    );

    const feeTierAccount = (await fetcher.getFeeTier(params.feeTierPda.publicKey)) as FeeTierData;

    assert.ok(feeTierAccount.tickSpacing == params.tickSpacing);
    assert.ok(feeTierAccount.defaultFeeRate == params.defaultFeeRate);
  });

  it("successfully init a FeeRate max account", async () => {
    const { configInitInfo, configKeypairs } = generateDefaultConfigParams(ctx);
    await toTx(
      ctx,
      ElysiumPoolIx.initializeConfigIx(ctx.program, configInitInfo)
    ).buildAndExecute();

    const testTickSpacing = TickSpacing.Standard;
    const { params } = await initFeeTier(
      ctx,
      configInitInfo,
      configKeypairs.feeAuthorityKeypair,
      testTickSpacing,
      30_000 // 3 %
    );

    const feeTierAccount = (await fetcher.getFeeTier(params.feeTierPda.publicKey)) as FeeTierData;

    assert.ok(feeTierAccount.tickSpacing == params.tickSpacing);
    assert.ok(feeTierAccount.defaultFeeRate == params.defaultFeeRate);
    assert.ok(params.defaultFeeRate === 30_000);
  });

  it("successfully init a FeeRate with another funder wallet", async () => {
    const { configInitInfo, configKeypairs } = generateDefaultConfigParams(ctx);
    await toTx(
      ctx,
      ElysiumPoolIx.initializeConfigIx(ctx.program, configInitInfo)
    ).buildAndExecute();
    const funderKeypair = anchor.web3.Keypair.generate();
    await systemTransferTx(provider, funderKeypair.publicKey, ONE_SOL).buildAndExecute();

    await initFeeTier(
      ctx,
      configInitInfo,
      configKeypairs.feeAuthorityKeypair,
      TickSpacing.Stable,
      3000,
      funderKeypair
    );
  });

  it("fails when default fee rate exceeds max", async () => {
    const { configInitInfo, configKeypairs } = generateDefaultConfigParams(ctx);
    await toTx(
      ctx,
      ElysiumPoolIx.initializeConfigIx(ctx.program, configInitInfo)
    ).buildAndExecute();

    await assert.rejects(
      initFeeTier(
        ctx,
        configInitInfo,
        configKeypairs.feeAuthorityKeypair,
        TickSpacing.Stable,
        30_000 + 1
      ),
      /0x178c/ // FeeRateMaxExceeded
    );
  });

  it("fails when fee authority is not a signer", async () => {
    const { configInitInfo } = generateDefaultConfigParams(ctx);
    await toTx(
      ctx,
      ElysiumPoolIx.initializeConfigIx(ctx.program, configInitInfo)
    ).buildAndExecute();

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.initializeFeeTierIx(
          ctx.program,
          generateDefaultInitFeeTierParams(
            ctx,
            configInitInfo.poolsConfigKeypair.publicKey,
            configInitInfo.feeAuthority,
            TickSpacing.Stable,
            3000
          )
        )
      ).buildAndExecute(),
      /.*signature verification fail.*/i
    );
  });

  it("fails when invalid fee authority provided", async () => {
    const { configInitInfo } = generateDefaultConfigParams(ctx);
    await toTx(
      ctx,
      ElysiumPoolIx.initializeConfigIx(ctx.program, configInitInfo)
    ).buildAndExecute();
    const fakeFeeAuthorityKeypair = anchor.web3.Keypair.generate();

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.initializeFeeTierIx(
          ctx.program,
          generateDefaultInitFeeTierParams(
            ctx,
            configInitInfo.poolsConfigKeypair.publicKey,
            fakeFeeAuthorityKeypair.publicKey,
            TickSpacing.Stable,
            3000
          )
        )
      )
        .addSigner(fakeFeeAuthorityKeypair)
        .buildAndExecute(),
      /0x7dc/ // ConstraintAddress
    );
  });
});
