import * as anchor from "@coral-xyz/anchor";
import * as assert from "assert";
import Decimal from "decimal.js";
import {
  buildElysiumPoolClient,
  InitPoolParams,
  PDAUtil,
  PriceMath,
  TickUtil,
  ElysiumPoolContext,
} from "../../../src";
import { IGNORE_CACHE } from "../../../src/network/public/fetcher";
import { ONE_SOL, systemTransferTx, TickSpacing } from "../../utils";
import { defaultConfirmOptions } from "../../utils/const";
import { buildTestPoolParams } from "../../utils/init-utils";

describe("pool-client-impl", () => {
  const provider = anchor.AnchorProvider.local(undefined, defaultConfirmOptions);

  const program = anchor.workspace.ElysiumPool;
  const ctx = ElysiumPoolContext.fromWorkspace(provider, program);
  const client = buildElysiumPoolClient(ctx);

  let funderKeypair: anchor.web3.Keypair;
  let poolInitInfo: InitPoolParams;
  beforeEach(async () => {
    funderKeypair = anchor.web3.Keypair.generate();
    await systemTransferTx(provider, funderKeypair.publicKey, ONE_SOL).buildAndExecute();
    poolInitInfo = (
      await buildTestPoolParams(
        ctx,
        TickSpacing.Standard,
        3000,
        PriceMath.priceToSqrtPriceX64(new Decimal(100), 6, 6),
        funderKeypair.publicKey
      )
    ).poolInitInfo;
  });

  it("successfully creates a new whirpool account and initial tick array account", async () => {
    const initalTick = TickUtil.getInitializableTickIndex(
      PriceMath.sqrtPriceX64ToTickIndex(poolInitInfo.initSqrtPrice),
      poolInitInfo.tickSpacing
    );

    const { poolKey: actualPubkey, tx } = await client.createPool(
      poolInitInfo.poolsConfig,
      poolInitInfo.tokenMintA,
      poolInitInfo.tokenMintB,
      poolInitInfo.tickSpacing,
      initalTick,
      funderKeypair.publicKey
    );

    const expectedPda = PDAUtil.getElysiumPool(
      ctx.program.programId,
      poolInitInfo.poolsConfig,
      poolInitInfo.tokenMintA,
      poolInitInfo.tokenMintB,
      poolInitInfo.tickSpacing
    );

    const startTickArrayPda = PDAUtil.getTickArrayFromTickIndex(
      initalTick,
      poolInitInfo.tickSpacing,
      expectedPda.publicKey,
      ctx.program.programId
    );

    assert.ok(expectedPda.publicKey.equals(actualPubkey));

    const [poolAccountBefore, tickArrayAccountBefore] = await Promise.all([
      ctx.fetcher.getPool(expectedPda.publicKey, IGNORE_CACHE),
      ctx.fetcher.getTickArray(startTickArrayPda.publicKey, IGNORE_CACHE),
    ]);

    assert.ok(poolAccountBefore === null);
    assert.ok(tickArrayAccountBefore === null);

    await tx.addSigner(funderKeypair).buildAndExecute();

    const [poolAccountAfter, tickArrayAccountAfter] = await Promise.all([
      ctx.fetcher.getPool(expectedPda.publicKey, IGNORE_CACHE),
      ctx.fetcher.getTickArray(startTickArrayPda.publicKey, IGNORE_CACHE),
    ]);

    assert.ok(poolAccountAfter !== null);
    assert.ok(tickArrayAccountAfter !== null);

    assert.ok(poolAccountAfter.feeGrowthGlobalA.eqn(0));
    assert.ok(poolAccountAfter.feeGrowthGlobalB.eqn(0));
    assert.ok(poolAccountAfter.feeRate === 3000);
    assert.ok(poolAccountAfter.liquidity.eqn(0));
    assert.ok(poolAccountAfter.protocolFeeOwedA.eqn(0));
    assert.ok(poolAccountAfter.protocolFeeOwedB.eqn(0));
    assert.ok(poolAccountAfter.protocolFeeRate === 300);
    assert.ok(poolAccountAfter.rewardInfos.length === 3);
    assert.ok(poolAccountAfter.rewardLastUpdatedTimestamp.eqn(0));
    assert.ok(poolAccountAfter.sqrtPrice.eq(PriceMath.tickIndexToSqrtPriceX64(initalTick)));
    assert.ok(poolAccountAfter.tickCurrentIndex === initalTick);
    assert.ok(poolAccountAfter.tickSpacing === poolInitInfo.tickSpacing);
    assert.ok(poolAccountAfter.tokenMintA.equals(poolInitInfo.tokenMintA));
    assert.ok(poolAccountAfter.tokenMintB.equals(poolInitInfo.tokenMintB));
    assert.ok(poolAccountAfter.poolBump[0] === expectedPda.bump);
    assert.ok(poolAccountAfter.poolsConfig.equals(poolInitInfo.poolsConfig));

    assert.ok(
      tickArrayAccountAfter.startTickIndex ===
        TickUtil.getStartTickIndex(initalTick, poolInitInfo.tickSpacing)
    );
    assert.ok(tickArrayAccountAfter.ticks.length > 0);
    assert.ok(tickArrayAccountAfter.pool.equals(expectedPda.publicKey));
  });

  it("throws an error when token order is incorrect", async () => {
    const initalTick = TickUtil.getInitializableTickIndex(
      PriceMath.sqrtPriceX64ToTickIndex(poolInitInfo.initSqrtPrice),
      poolInitInfo.tickSpacing
    );

    const invInitialTick = TickUtil.invertTick(initalTick);

    await assert.rejects(
      client.createPool(
        poolInitInfo.poolsConfig,
        poolInitInfo.tokenMintB,
        poolInitInfo.tokenMintA,
        poolInitInfo.tickSpacing,
        invInitialTick,
        funderKeypair.publicKey
      ),
      /Token order needs to be flipped to match the canonical ordering \(i.e. sorted on the byte repr. of the mint pubkeys\)/
    );
  });
});
