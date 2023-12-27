import * as anchor from "@coral-xyz/anchor";
import { MathUtil } from "@orca-so/common-sdk";
import * as assert from "assert";
import { BN } from "bn.js";
import Decimal from "decimal.js";
import { PDAUtil, PositionData, toTx, ElysiumPoolContext, ElysiumPoolIx } from "../../src";
import { IGNORE_CACHE } from "../../src/network/public/fetcher";
import { sleep, TickSpacing, ZERO_BN } from "../utils";
import { defaultConfirmOptions } from "../utils/const";
import { ElysiumPoolTestFixture } from "../utils/fixture";
import { initTestPool } from "../utils/init-utils";

describe("update_fees_and_rewards", () => {
  const provider = anchor.AnchorProvider.local(undefined, defaultConfirmOptions);

  const program = anchor.workspace.ElysiumPool;
  const ctx = ElysiumPoolContext.fromWorkspace(provider, program);
  const fetcher = ctx.fetcher;

  it("successfully updates fees and rewards", async () => {
    // In same tick array - start index 22528
    const tickLowerIndex = 29440;
    const tickUpperIndex = 33536;

    const tickSpacing = TickSpacing.Standard;
    const fixture = await new ElysiumPoolTestFixture(ctx).init({
      tickSpacing,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount: new anchor.BN(1_000_000) }],
      rewards: [
        { emissionsPerSecondX64: MathUtil.toX64(new Decimal(2)), vaultAmount: new BN(1_000_000) },
      ],
    });
    const {
      poolInitInfo: { poolPda, tokenVaultAKeypair, tokenVaultBKeypair },
      tokenAccountA,
      tokenAccountB,
      positions,
    } = fixture.getInfos();

    const tickArrayPda = PDAUtil.getTickArray(ctx.program.programId, poolPda.publicKey, 22528);

    const positionBefore = (await fetcher.getPosition(
      positions[0].publicKey,
      IGNORE_CACHE
    )) as PositionData;
    assert.ok(positionBefore.feeGrowthCheckpointA.eq(ZERO_BN));
    assert.ok(positionBefore.feeGrowthCheckpointB.eq(ZERO_BN));
    assert.ok(positionBefore.rewardInfos[0].amountOwed.eq(ZERO_BN));
    assert.ok(positionBefore.rewardInfos[0].growthInsideCheckpoint.eq(ZERO_BN));

    const oraclePda = PDAUtil.getOracle(ctx.program.programId, poolPda.publicKey);

    await toTx(
      ctx,
      ElysiumPoolIx.swapIx(ctx.program, {
        amount: new BN(100_000),
        otherAmountThreshold: ZERO_BN,
        sqrtPriceLimit: MathUtil.toX64(new Decimal(4.95)),
        amountSpecifiedIsInput: true,
        aToB: true,
        pool: poolPda.publicKey,
        tokenAuthority: ctx.wallet.publicKey,
        tokenOwnerAccountA: tokenAccountA,
        tokenVaultA: tokenVaultAKeypair.publicKey,
        tokenOwnerAccountB: tokenAccountB,
        tokenVaultB: tokenVaultBKeypair.publicKey,
        tickArray0: tickArrayPda.publicKey,
        tickArray1: tickArrayPda.publicKey,
        tickArray2: tickArrayPda.publicKey,
        oracle: oraclePda.publicKey,
      })
    ).buildAndExecute();

    await sleep(1_000);

    await toTx(
      ctx,
      ElysiumPoolIx.updateFeesAndRewardsIx(ctx.program, {
        pool: poolPda.publicKey,
        position: positions[0].publicKey,
        tickArrayLower: tickArrayPda.publicKey,
        tickArrayUpper: tickArrayPda.publicKey,
      })
    ).buildAndExecute();
    const positionAfter = (await fetcher.getPosition(
      positions[0].publicKey,
      IGNORE_CACHE
    )) as PositionData;
    assert.ok(positionAfter.feeOwedA.gt(positionBefore.feeOwedA));
    assert.ok(positionAfter.feeOwedB.eq(ZERO_BN));
    assert.ok(positionAfter.feeGrowthCheckpointA.gt(positionBefore.feeGrowthCheckpointA));
    assert.ok(positionAfter.feeGrowthCheckpointB.eq(positionBefore.feeGrowthCheckpointB));
    assert.ok(positionAfter.rewardInfos[0].amountOwed.gt(positionBefore.rewardInfos[0].amountOwed));
    assert.ok(
      positionAfter.rewardInfos[0].growthInsideCheckpoint.gt(
        positionBefore.rewardInfos[0].growthInsideCheckpoint
      )
    );
    assert.ok(positionAfter.liquidity.eq(positionBefore.liquidity));
  });

  it("fails when position has zero liquidity", async () => {
    // In same tick array - start index 22528
    const tickLowerIndex = 29440;
    const tickUpperIndex = 33536;

    const tickSpacing = TickSpacing.Standard;
    const fixture = await new ElysiumPoolTestFixture(ctx).init({
      tickSpacing,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount: ZERO_BN }],
    });
    const {
      poolInitInfo: { poolPda },
      positions,
    } = fixture.getInfos();

    const tickArrayPda = PDAUtil.getTickArray(ctx.program.programId, poolPda.publicKey, 22528);

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.updateFeesAndRewardsIx(ctx.program, {
          pool: poolPda.publicKey,
          position: positions[0].publicKey,
          tickArrayLower: tickArrayPda.publicKey,
          tickArrayUpper: tickArrayPda.publicKey,
        })
      ).buildAndExecute(),
      /0x177c/ // LiquidityZero
    );
  });

  it("fails when position does not match pool", async () => {
    const tickLowerIndex = 29440;
    const tickUpperIndex = 33536;

    const tickSpacing = TickSpacing.Standard;
    const {
      poolInitInfo: { poolPda },
    } = await initTestPool(ctx, tickSpacing);
    const tickArrayPda = PDAUtil.getTickArray(ctx.program.programId, poolPda.publicKey, 22528);

    const other = await new ElysiumPoolTestFixture(ctx).init({
      tickSpacing,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount: new anchor.BN(1_000_000) }],
    });
    const { positions: otherPositions } = other.getInfos();

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.updateFeesAndRewardsIx(ctx.program, {
          pool: poolPda.publicKey,
          position: otherPositions[0].publicKey,
          tickArrayLower: tickArrayPda.publicKey,
          tickArrayUpper: tickArrayPda.publicKey,
        })
      ).buildAndExecute(),
      /0xbbf/ // AccountOwnedByWrongProgram
    );
  });

  it("fails when tick arrays do not match position", async () => {
    // In same tick array - start index 22528
    const tickLowerIndex = 29440;
    const tickUpperIndex = 33536;

    const tickSpacing = TickSpacing.Standard;
    const fixture = await new ElysiumPoolTestFixture(ctx).init({
      tickSpacing,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount: new anchor.BN(1_000_000) }],
    });
    const {
      poolInitInfo: { poolPda },
      positions,
    } = fixture.getInfos();

    const tickArrayPda = PDAUtil.getTickArray(ctx.program.programId, poolPda.publicKey, 0);

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.updateFeesAndRewardsIx(ctx.program, {
          pool: poolPda.publicKey,
          position: positions[0].publicKey,
          tickArrayLower: tickArrayPda.publicKey,
          tickArrayUpper: tickArrayPda.publicKey,
        })
      ).buildAndExecute(),
      /0xbbf/ // AccountOwnedByWrongProgram
    );
  });

  it("fails when tick arrays do not match pool", async () => {
    // In same tick array - start index 22528
    const tickLowerIndex = 29440;
    const tickUpperIndex = 33536;

    const tickSpacing = TickSpacing.Standard;
    const fixture = await new ElysiumPoolTestFixture(ctx).init({
      tickSpacing,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount: ZERO_BN }],
    });
    const {
      poolInitInfo: { poolPda },
      positions,
    } = fixture.getInfos();

    const {
      poolInitInfo: { poolPda: otherElysiumPoolPda },
    } = await initTestPool(ctx, tickSpacing);

    const tickArrayPda = PDAUtil.getTickArray(
      ctx.program.programId,
      otherElysiumPoolPda.publicKey,
      22528
    );

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.updateFeesAndRewardsIx(ctx.program, {
          pool: poolPda.publicKey,
          position: positions[0].publicKey,
          tickArrayLower: tickArrayPda.publicKey,
          tickArrayUpper: tickArrayPda.publicKey,
        })
      ).buildAndExecute(),
      /0xbbf/ // AccountOwnedByWrongProgram
    );
  });
});
