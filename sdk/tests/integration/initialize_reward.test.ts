import * as anchor from "@coral-xyz/anchor";
import * as assert from "assert";
import { toTx, ElysiumPoolContext, ElysiumPoolData, ElysiumPoolIx } from "../../src";
import { IGNORE_CACHE } from "../../src/network/public/fetcher";
import { createMint, ONE_SOL, systemTransferTx, TickSpacing } from "../utils";
import { defaultConfirmOptions } from "../utils/const";
import { initializeReward, initTestPool } from "../utils/init-utils";

describe("initialize_reward", () => {
  const provider = anchor.AnchorProvider.local(undefined, defaultConfirmOptions);

  const program = anchor.workspace.ElysiumPool;
  const ctx = ElysiumPoolContext.fromWorkspace(provider, program);
  const fetcher = ctx.fetcher;

  it("successfully initializes reward at index 0", async () => {
    const { poolInitInfo, configKeypairs } = await initTestPool(ctx, TickSpacing.Standard);

    const { params } = await initializeReward(
      ctx,
      configKeypairs.rewardEmissionsSuperAuthorityKeypair,
      poolInitInfo.poolPda.publicKey,
      0
    );

    const pool = (await fetcher.getPool(
      poolInitInfo.poolPda.publicKey,
      IGNORE_CACHE
    )) as ElysiumPoolData;

    assert.ok(pool.rewardInfos[0].mint.equals(params.rewardMint));
    assert.ok(pool.rewardInfos[0].vault.equals(params.rewardVaultKeypair.publicKey));

    await assert.rejects(
      initializeReward(
        ctx,
        configKeypairs.rewardEmissionsSuperAuthorityKeypair,
        poolInitInfo.poolPda.publicKey,
        0
      ),
      /custom program error: 0x178a/ // InvalidRewardIndex
    );

    const { params: params2 } = await initializeReward(
      ctx,
      configKeypairs.rewardEmissionsSuperAuthorityKeypair,
      poolInitInfo.poolPda.publicKey,
      1
    );

    const pool2 = (await fetcher.getPool(
      poolInitInfo.poolPda.publicKey,
      IGNORE_CACHE
    )) as ElysiumPoolData;

    assert.ok(pool2.rewardInfos[0].mint.equals(params.rewardMint));
    assert.ok(pool2.rewardInfos[0].vault.equals(params.rewardVaultKeypair.publicKey));
    assert.ok(pool2.rewardInfos[1].mint.equals(params2.rewardMint));
    assert.ok(pool2.rewardInfos[1].vault.equals(params2.rewardVaultKeypair.publicKey));
    assert.ok(pool2.rewardInfos[2].mint.equals(anchor.web3.PublicKey.default));
    assert.ok(pool2.rewardInfos[2].vault.equals(anchor.web3.PublicKey.default));
  });

  it("succeeds when funder is different than account paying for transaction fee", async () => {
    const { poolInitInfo, configKeypairs } = await initTestPool(ctx, TickSpacing.Standard);
    const funderKeypair = anchor.web3.Keypair.generate();
    await systemTransferTx(provider, funderKeypair.publicKey, ONE_SOL).buildAndExecute();
    await initializeReward(
      ctx,
      configKeypairs.rewardEmissionsSuperAuthorityKeypair,
      poolInitInfo.poolPda.publicKey,
      0,
      funderKeypair
    );
  });

  it("fails to initialize reward at index 1", async () => {
    const { poolInitInfo, configKeypairs } = await initTestPool(ctx, TickSpacing.Standard);

    await assert.rejects(
      initializeReward(
        ctx,
        configKeypairs.rewardEmissionsSuperAuthorityKeypair,
        poolInitInfo.poolPda.publicKey,
        1
      ),
      /custom program error: 0x178a/ // InvalidRewardIndex
    );
  });

  it("fails to initialize reward at out-of-bound index", async () => {
    const { poolInitInfo, configKeypairs } = await initTestPool(ctx, TickSpacing.Standard);

    await assert.rejects(
      initializeReward(
        ctx,
        configKeypairs.rewardEmissionsSuperAuthorityKeypair,
        poolInitInfo.poolPda.publicKey,
        3
      )
    );
  });

  it("fails to initialize if authority signature is missing", async () => {
    const { poolInitInfo, configKeypairs } = await initTestPool(ctx, TickSpacing.Standard);

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.initializeRewardIx(ctx.program, {
          rewardAuthority: configKeypairs.rewardEmissionsSuperAuthorityKeypair.publicKey,
          funder: provider.wallet.publicKey,
          pool: poolInitInfo.poolPda.publicKey,
          rewardMint: await createMint(provider),
          rewardVaultKeypair: anchor.web3.Keypair.generate(),
          rewardIndex: 0,
        })
      ).buildAndExecute()
    );
  });
});
