import * as anchor from "@coral-xyz/anchor";
import * as assert from "assert";
import { toTx, ElysiumPoolContext, ElysiumPoolData, ElysiumPoolIx } from "../../src";
import { TickSpacing } from "../utils";
import { defaultConfirmOptions } from "../utils/const";
import { initTestPool } from "../utils/init-utils";

describe("set_reward_authority_by_super_authority", () => {
  const provider = anchor.AnchorProvider.local(undefined, defaultConfirmOptions);

  const program = anchor.workspace.ElysiumPool;
  const ctx = ElysiumPoolContext.fromWorkspace(provider, program);
  const fetcher = ctx.fetcher;

  it("successfully set_reward_authority_by_super_authority", async () => {
    const { configKeypairs, poolInitInfo, configInitInfo } = await initTestPool(
      ctx,
      TickSpacing.Standard
    );
    const newAuthorityKeypair = anchor.web3.Keypair.generate();
    await toTx(
      ctx,
      ElysiumPoolIx.setRewardAuthorityBySuperAuthorityIx(ctx.program, {
        poolsConfig: configInitInfo.poolsConfigKeypair.publicKey,
        pool: poolInitInfo.poolPda.publicKey,
        rewardEmissionsSuperAuthority:
          configKeypairs.rewardEmissionsSuperAuthorityKeypair.publicKey,
        newRewardAuthority: newAuthorityKeypair.publicKey,
        rewardIndex: 0,
      })
    )
      .addSigner(configKeypairs.rewardEmissionsSuperAuthorityKeypair)
      .buildAndExecute();
    const pool = (await fetcher.getPool(poolInitInfo.poolPda.publicKey)) as ElysiumPoolData;
    assert.ok(pool.rewardInfos[0].authority.equals(newAuthorityKeypair.publicKey));
  });

  it("fails if invalid pool provided", async () => {
    const { configKeypairs, configInitInfo } = await initTestPool(ctx, TickSpacing.Standard);
    const {
      poolInitInfo: { poolPda: invalidPool },
    } = await initTestPool(ctx, TickSpacing.Standard);

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.setRewardAuthorityBySuperAuthorityIx(ctx.program, {
          poolsConfig: configInitInfo.poolsConfigKeypair.publicKey,
          pool: invalidPool.publicKey,
          rewardEmissionsSuperAuthority:
            configKeypairs.rewardEmissionsSuperAuthorityKeypair.publicKey,
          newRewardAuthority: provider.wallet.publicKey,
          rewardIndex: 0,
        })
      )
        .addSigner(configKeypairs.rewardEmissionsSuperAuthorityKeypair)
        .buildAndExecute(),
      /0x7d1/ // A has_one constraint was violated
    );
  });

  it("fails if invalid super authority provided", async () => {
    const { poolInitInfo, configInitInfo } = await initTestPool(ctx, TickSpacing.Standard);
    const invalidSuperAuthorityKeypair = anchor.web3.Keypair.generate();

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.setRewardAuthorityBySuperAuthorityIx(ctx.program, {
          poolsConfig: configInitInfo.poolsConfigKeypair.publicKey,
          pool: poolInitInfo.poolPda.publicKey,
          rewardEmissionsSuperAuthority: invalidSuperAuthorityKeypair.publicKey,
          newRewardAuthority: provider.wallet.publicKey,
          rewardIndex: 0,
        })
      )
        .addSigner(invalidSuperAuthorityKeypair)
        .buildAndExecute(),
      /0x7dc/ // An address constraint was violated
    );
  });

  it("fails if super authority is not a signer", async () => {
    const { configKeypairs, poolInitInfo, configInitInfo } = await initTestPool(
      ctx,
      TickSpacing.Standard
    );

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.setRewardAuthorityBySuperAuthorityIx(ctx.program, {
          poolsConfig: configInitInfo.poolsConfigKeypair.publicKey,
          pool: poolInitInfo.poolPda.publicKey,
          rewardEmissionsSuperAuthority:
            configKeypairs.rewardEmissionsSuperAuthorityKeypair.publicKey,
          newRewardAuthority: provider.wallet.publicKey,
          rewardIndex: 0,
        })
      ).buildAndExecute(),
      /.*signature verification fail.*/i
    );
  });

  it("fails on invalid reward index", async () => {
    const { configKeypairs, poolInitInfo, configInitInfo } = await initTestPool(
      ctx,
      TickSpacing.Standard
    );

    assert.throws(() => {
      toTx(
        ctx,
        ElysiumPoolIx.setRewardAuthorityBySuperAuthorityIx(ctx.program, {
          poolsConfig: configInitInfo.poolsConfigKeypair.publicKey,
          pool: poolInitInfo.poolPda.publicKey,
          rewardEmissionsSuperAuthority:
            configKeypairs.rewardEmissionsSuperAuthorityKeypair.publicKey,
          newRewardAuthority: provider.wallet.publicKey,
          rewardIndex: -1,
        })
      )
        .addSigner(configKeypairs.rewardEmissionsSuperAuthorityKeypair)
        .buildAndExecute();
    }, /out of range/);

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.setRewardAuthorityBySuperAuthorityIx(ctx.program, {
          poolsConfig: configInitInfo.poolsConfigKeypair.publicKey,
          pool: poolInitInfo.poolPda.publicKey,
          rewardEmissionsSuperAuthority:
            configKeypairs.rewardEmissionsSuperAuthorityKeypair.publicKey,
          newRewardAuthority: provider.wallet.publicKey,
          rewardIndex: 200,
        })
      )
        .addSigner(configKeypairs.rewardEmissionsSuperAuthorityKeypair)
        .buildAndExecute(),
      /0x178a/ // InvalidRewardIndex
    );
  });
});
