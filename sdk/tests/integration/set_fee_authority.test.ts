import * as anchor from "@coral-xyz/anchor";
import * as assert from "assert";
import { toTx, ElysiumPoolContext, ElysiumPoolIx, ElysiumPoolsConfigData } from "../../src";
import { defaultConfirmOptions } from "../utils/const";
import { generateDefaultConfigParams } from "../utils/test-builders";

describe("set_fee_authority", () => {
  const provider = anchor.AnchorProvider.local(undefined, defaultConfirmOptions);

  const program = anchor.workspace.ElysiumPool;
  const ctx = ElysiumPoolContext.fromWorkspace(provider, program);
  const fetcher = ctx.fetcher;

  it("successfully set_fee_authority", async () => {
    const {
      configInitInfo,
      configKeypairs: { feeAuthorityKeypair },
    } = generateDefaultConfigParams(ctx);
    await toTx(
      ctx,
      ElysiumPoolIx.initializeConfigIx(ctx.program, configInitInfo)
    ).buildAndExecute();
    const newAuthorityKeypair = anchor.web3.Keypair.generate();
    await toTx(
      ctx,
      ElysiumPoolIx.setFeeAuthorityIx(ctx.program, {
        poolsConfig: configInitInfo.poolsConfigKeypair.publicKey,
        feeAuthority: feeAuthorityKeypair.publicKey,
        newFeeAuthority: newAuthorityKeypair.publicKey,
      })
    )
      .addSigner(feeAuthorityKeypair)
      .buildAndExecute();
    const config = (await fetcher.getConfig(
      configInitInfo.poolsConfigKeypair.publicKey
    )) as ElysiumPoolsConfigData;
    assert.ok(config.feeAuthority.equals(newAuthorityKeypair.publicKey));
  });

  it("fails if current fee_authority is not a signer", async () => {
    const {
      configInitInfo,
      configKeypairs: { feeAuthorityKeypair },
    } = generateDefaultConfigParams(ctx);
    await toTx(
      ctx,
      ElysiumPoolIx.initializeConfigIx(ctx.program, configInitInfo)
    ).buildAndExecute();

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.setFeeAuthorityIx(ctx.program, {
          poolsConfig: configInitInfo.poolsConfigKeypair.publicKey,
          feeAuthority: feeAuthorityKeypair.publicKey,
          newFeeAuthority: provider.wallet.publicKey,
        })
      ).buildAndExecute(),
      /.*signature verification fail.*/i
    );
  });

  it("fails if invalid fee_authority provided", async () => {
    const { configInitInfo } = generateDefaultConfigParams(ctx);
    await toTx(
      ctx,
      ElysiumPoolIx.initializeConfigIx(ctx.program, configInitInfo)
    ).buildAndExecute();

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.setFeeAuthorityIx(ctx.program, {
          poolsConfig: configInitInfo.poolsConfigKeypair.publicKey,
          feeAuthority: provider.wallet.publicKey,
          newFeeAuthority: provider.wallet.publicKey,
        })
      ).buildAndExecute(),
      /0x7dc/ // An address constraint was violated
    );
  });
});
