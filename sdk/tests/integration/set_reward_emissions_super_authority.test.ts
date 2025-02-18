import * as anchor from "@coral-xyz/anchor";
import * as assert from "assert";
import { toTx, ElysiumPoolContext, ElysiumPoolIx, ElysiumPoolsConfigData } from "../../src";
import { defaultConfirmOptions } from "../utils/const";
import { generateDefaultConfigParams } from "../utils/test-builders";

describe("set_reward_emissions_super_authority", () => {
  const provider = anchor.AnchorProvider.local(undefined, defaultConfirmOptions);

  const program = anchor.workspace.ElysiumPool;
  const ctx = ElysiumPoolContext.fromWorkspace(provider, program);
  const fetcher = ctx.fetcher;

  it("successfully set_reward_emissions_super_authority with super authority keypair", async () => {
    const {
      configInitInfo,
      configKeypairs: { rewardEmissionsSuperAuthorityKeypair },
    } = generateDefaultConfigParams(ctx);

    await toTx(
      ctx,
      ElysiumPoolIx.initializeConfigIx(ctx.program, configInitInfo)
    ).buildAndExecute();
    const newAuthorityKeypair = anchor.web3.Keypair.generate();

    await toTx(
      ctx,
      ElysiumPoolIx.setRewardEmissionsSuperAuthorityIx(ctx.program, {
        poolsConfig: configInitInfo.poolsConfigKeypair.publicKey,
        rewardEmissionsSuperAuthority: rewardEmissionsSuperAuthorityKeypair.publicKey,
        newRewardEmissionsSuperAuthority: newAuthorityKeypair.publicKey,
      })
    )
      .addSigner(rewardEmissionsSuperAuthorityKeypair)
      .buildAndExecute();

    const config = (await fetcher.getConfig(
      configInitInfo.poolsConfigKeypair.publicKey
    )) as ElysiumPoolsConfigData;
    assert.ok(config.rewardEmissionsSuperAuthority.equals(newAuthorityKeypair.publicKey));
  });

  it("fails if current reward_emissions_super_authority is not a signer", async () => {
    const {
      configInitInfo,
      configKeypairs: { rewardEmissionsSuperAuthorityKeypair },
    } = generateDefaultConfigParams(ctx);
    await toTx(
      ctx,
      ElysiumPoolIx.initializeConfigIx(ctx.program, configInitInfo)
    ).buildAndExecute();

    await assert.rejects(
      ctx.program.rpc.setRewardEmissionsSuperAuthority({
        accounts: {
          poolsConfig: configInitInfo.poolsConfigKeypair.publicKey,
          rewardEmissionsSuperAuthority: rewardEmissionsSuperAuthorityKeypair.publicKey,
          newRewardEmissionsSuperAuthority: provider.wallet.publicKey,
        },
      }),
      /.*signature verification fail.*/i
    );
  });

  it("fails if incorrect reward_emissions_super_authority is passed in", async () => {
    const { configInitInfo } = generateDefaultConfigParams(ctx);
    await toTx(
      ctx,
      ElysiumPoolIx.initializeConfigIx(ctx.program, configInitInfo)
    ).buildAndExecute();

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.setRewardEmissionsSuperAuthorityIx(ctx.program, {
          poolsConfig: configInitInfo.poolsConfigKeypair.publicKey,
          rewardEmissionsSuperAuthority: provider.wallet.publicKey,
          newRewardEmissionsSuperAuthority: provider.wallet.publicKey,
        })
      ).buildAndExecute(),
      /0x7dc/ // An address constraint was violated
    );
  });
});
