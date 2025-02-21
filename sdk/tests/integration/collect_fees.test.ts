import * as anchor from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import { MathUtil } from "@orca-so/common-sdk";
import * as assert from "assert";
import Decimal from "decimal.js";
import {
  collectFeesQuote,
  PDAUtil,
  PositionData,
  TickArrayData,
  TickArrayUtil,
  toTx,
  ElysiumPoolContext,
  ElysiumPoolData,
  ElysiumPoolIx,
} from "../../src";
import { IGNORE_CACHE } from "../../src/network/public/fetcher";
import {
  approveToken,
  createTokenAccount,
  getTokenBalance,
  TickSpacing,
  transferToken,
  ZERO_BN,
} from "../utils";
import { defaultConfirmOptions } from "../utils/const";
import { ElysiumPoolTestFixture } from "../utils/fixture";
import { initTestPool } from "../utils/init-utils";

describe("collect_fees", () => {
  const provider = anchor.AnchorProvider.local(undefined, defaultConfirmOptions);
  const program = anchor.workspace.ElysiumPool;
  const ctx = ElysiumPoolContext.fromWorkspace(provider, program);
  const fetcher = ctx.fetcher;

  it("successfully collect fees", async () => {
    // In same tick array - start index 22528
    const tickLowerIndex = 29440;
    const tickUpperIndex = 33536;

    const tickSpacing = TickSpacing.Standard;
    const fixture = await new ElysiumPoolTestFixture(ctx).init({
      tickSpacing,
      positions: [
        { tickLowerIndex, tickUpperIndex, liquidityAmount: new anchor.BN(10_000_000) }, // In range position
        { tickLowerIndex: 0, tickUpperIndex: 128, liquidityAmount: new anchor.BN(1_000_000) }, // Out of range position
      ],
    });
    const {
      poolInitInfo: { poolPda, tokenVaultAKeypair, tokenVaultBKeypair, tokenMintA, tokenMintB },
      tokenAccountA,
      tokenAccountB,
      positions,
    } = fixture.getInfos();

    const tickArrayPda = PDAUtil.getTickArray(ctx.program.programId, poolPda.publicKey, 22528);
    const positionBeforeSwap = (await fetcher.getPosition(positions[0].publicKey)) as PositionData;
    assert.ok(positionBeforeSwap.feeOwedA.eq(ZERO_BN));
    assert.ok(positionBeforeSwap.feeOwedB.eq(ZERO_BN));

    const oraclePda = PDAUtil.getOracle(ctx.program.programId, poolPda.publicKey);

    // Accrue fees in token A
    await toTx(
      ctx,
      ElysiumPoolIx.swapIx(ctx.program, {
        amount: new BN(200_000),
        otherAmountThreshold: ZERO_BN,
        sqrtPriceLimit: MathUtil.toX64(new Decimal(4)),
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

    // Accrue fees in token B
    await toTx(
      ctx,
      ElysiumPoolIx.swapIx(ctx.program, {
        amount: new BN(200_000),
        otherAmountThreshold: ZERO_BN,
        sqrtPriceLimit: MathUtil.toX64(new Decimal(5)),
        amountSpecifiedIsInput: true,
        aToB: false,
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

    await toTx(
      ctx,
      ElysiumPoolIx.updateFeesAndRewardsIx(ctx.program, {
        pool: poolPda.publicKey,
        position: positions[0].publicKey,
        tickArrayLower: tickArrayPda.publicKey,
        tickArrayUpper: tickArrayPda.publicKey,
      })
    ).buildAndExecute();

    const positionBeforeCollect = (await fetcher.getPosition(
      positions[0].publicKey,
      IGNORE_CACHE
    )) as PositionData;
    assert.ok(positionBeforeCollect.feeOwedA.eq(new BN(581)));
    assert.ok(positionBeforeCollect.feeOwedB.eq(new BN(581)));

    const feeAccountA = await createTokenAccount(provider, tokenMintA, provider.wallet.publicKey);
    const feeAccountB = await createTokenAccount(provider, tokenMintB, provider.wallet.publicKey);

    // Generate collect fees expectation
    const poolData = (await fetcher.getPool(poolPda.publicKey)) as ElysiumPoolData;
    const tickArrayData = (await fetcher.getTickArray(tickArrayPda.publicKey)) as TickArrayData;
    const lowerTick = TickArrayUtil.getTickFromArray(tickArrayData, tickLowerIndex, tickSpacing);
    const upperTick = TickArrayUtil.getTickFromArray(tickArrayData, tickUpperIndex, tickSpacing);
    const expectation = collectFeesQuote({
      pool: poolData,
      position: positionBeforeCollect,
      tickLower: lowerTick,
      tickUpper: upperTick,
    });

    // Perform collect fees tx
    await toTx(
      ctx,
      ElysiumPoolIx.collectFeesIx(ctx.program, {
        pool: poolPda.publicKey,
        positionAuthority: provider.wallet.publicKey,
        position: positions[0].publicKey,
        positionTokenAccount: positions[0].tokenAccount,
        tokenOwnerAccountA: feeAccountA,
        tokenOwnerAccountB: feeAccountB,
        tokenVaultA: tokenVaultAKeypair.publicKey,
        tokenVaultB: tokenVaultBKeypair.publicKey,
      })
    ).buildAndExecute();
    const positionAfter = (await fetcher.getPosition(
      positions[0].publicKey,
      IGNORE_CACHE
    )) as PositionData;
    const feeBalanceA = await getTokenBalance(provider, feeAccountA);
    const feeBalanceB = await getTokenBalance(provider, feeAccountB);

    assert.equal(feeBalanceA, expectation.feeOwedA);
    assert.equal(feeBalanceB, expectation.feeOwedB);
    assert.ok(positionAfter.feeOwedA.eq(ZERO_BN));
    assert.ok(positionAfter.feeOwedB.eq(ZERO_BN));

    // Assert out of range position values
    await toTx(
      ctx,
      ElysiumPoolIx.updateFeesAndRewardsIx(ctx.program, {
        pool: poolPda.publicKey,
        position: positions[1].publicKey,
        tickArrayLower: positions[1].tickArrayLower,
        tickArrayUpper: positions[1].tickArrayUpper,
      })
    ).buildAndExecute();
    const outOfRangePosition = await fetcher.getPosition(positions[1].publicKey, IGNORE_CACHE);
    assert.ok(outOfRangePosition?.feeOwedA.eq(ZERO_BN));
    assert.ok(outOfRangePosition?.feeOwedB.eq(ZERO_BN));
  });

  it("successfully collect fees with approved delegate", async () => {
    const tickSpacing = TickSpacing.Standard;
    const fixture = await new ElysiumPoolTestFixture(ctx).init({
      tickSpacing,
      positions: [
        { tickLowerIndex: 0, tickUpperIndex: 128, liquidityAmount: new anchor.BN(10_000_000) }, // In range position
      ],
    });
    const {
      poolInitInfo: { poolPda, tokenVaultAKeypair, tokenVaultBKeypair },
      positions,
      tokenAccountA,
      tokenAccountB,
    } = fixture.getInfos();
    const position = positions[0];

    const delegate = anchor.web3.Keypair.generate();
    await approveToken(provider, position.tokenAccount, delegate.publicKey, 1);

    await toTx(
      ctx,
      ElysiumPoolIx.collectFeesIx(ctx.program, {
        pool: poolPda.publicKey,
        positionAuthority: delegate.publicKey,
        position: position.publicKey,
        positionTokenAccount: position.tokenAccount,
        tokenOwnerAccountA: tokenAccountA,
        tokenOwnerAccountB: tokenAccountB,
        tokenVaultA: tokenVaultAKeypair.publicKey,
        tokenVaultB: tokenVaultBKeypair.publicKey,
      })
    )
      .addSigner(delegate)
      .buildAndExecute();
  });

  it("successfully collect fees with owner even if there is approved delegate", async () => {
    const tickSpacing = TickSpacing.Standard;
    const fixture = await new ElysiumPoolTestFixture(ctx).init({
      tickSpacing,
      positions: [
        { tickLowerIndex: 0, tickUpperIndex: 128, liquidityAmount: new anchor.BN(10_000_000) }, // In range position
      ],
    });
    const {
      poolInitInfo: { poolPda, tokenVaultAKeypair, tokenVaultBKeypair },
      positions,
      tokenAccountA,
      tokenAccountB,
    } = fixture.getInfos();
    const position = positions[0];

    const delegate = anchor.web3.Keypair.generate();
    await approveToken(provider, position.tokenAccount, delegate.publicKey, 1);

    await toTx(
      ctx,
      ElysiumPoolIx.collectFeesIx(ctx.program, {
        pool: poolPda.publicKey,
        positionAuthority: provider.wallet.publicKey,
        position: position.publicKey,
        positionTokenAccount: position.tokenAccount,
        tokenOwnerAccountA: tokenAccountA,
        tokenOwnerAccountB: tokenAccountB,
        tokenVaultA: tokenVaultAKeypair.publicKey,
        tokenVaultB: tokenVaultBKeypair.publicKey,
      })
    ).buildAndExecute();
  });

  it("successfully collect fees with transferred position token", async () => {
    const tickSpacing = TickSpacing.Standard;
    const fixture = await new ElysiumPoolTestFixture(ctx).init({
      tickSpacing,
      positions: [
        { tickLowerIndex: 0, tickUpperIndex: 128, liquidityAmount: new anchor.BN(10_000_000) }, // In range position
      ],
    });
    const {
      poolInitInfo: { poolPda, tokenVaultAKeypair, tokenVaultBKeypair },
      positions,
      tokenAccountA,
      tokenAccountB,
    } = fixture.getInfos();
    const position = positions[0];

    const newOwner = anchor.web3.Keypair.generate();
    const newOwnerPositionTokenAccount = await createTokenAccount(
      provider,
      position.mintKeypair.publicKey,
      newOwner.publicKey
    );

    await transferToken(provider, position.tokenAccount, newOwnerPositionTokenAccount, 1);

    await toTx(
      ctx,
      ElysiumPoolIx.collectFeesIx(ctx.program, {
        pool: poolPda.publicKey,
        positionAuthority: newOwner.publicKey,
        position: position.publicKey,
        positionTokenAccount: newOwnerPositionTokenAccount,
        tokenOwnerAccountA: tokenAccountA,
        tokenOwnerAccountB: tokenAccountB,
        tokenVaultA: tokenVaultAKeypair.publicKey,
        tokenVaultB: tokenVaultBKeypair.publicKey,
      })
    )
      .addSigner(newOwner)
      .buildAndExecute();
  });

  it("fails when position does not match pool", async () => {
    // In same tick array - start index 22528
    const tickLowerIndex = 29440;
    const tickUpperIndex = 33536;
    const tickSpacing = TickSpacing.Standard;
    const fixture = await new ElysiumPoolTestFixture(ctx).init({
      tickSpacing,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount: new anchor.BN(10_000_000) }],
    });
    const {
      poolInitInfo: { tokenVaultAKeypair, tokenVaultBKeypair },
      tokenAccountA,
      tokenAccountB,
      positions,
    } = fixture.getInfos();

    const {
      poolInitInfo: { poolPda: poolPda2 },
    } = await initTestPool(ctx, tickSpacing);

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.collectFeesIx(ctx.program, {
          pool: poolPda2.publicKey,
          positionAuthority: provider.wallet.publicKey,
          position: positions[0].publicKey,
          positionTokenAccount: positions[0].tokenAccount,
          tokenOwnerAccountA: tokenAccountA,
          tokenOwnerAccountB: tokenAccountB,
          tokenVaultA: tokenVaultAKeypair.publicKey,
          tokenVaultB: tokenVaultBKeypair.publicKey,
        })
      ).buildAndExecute(),
      /0x7d1/ // ConstraintHasOne
    );
  });

  it("fails when position token account does not contain exactly one token", async () => {
    // In same tick array - start index 22528
    const tickLowerIndex = 29440;
    const tickUpperIndex = 33536;
    const tickSpacing = TickSpacing.Standard;
    const fixture = await new ElysiumPoolTestFixture(ctx).init({
      tickSpacing,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount: new anchor.BN(10_000_000) }],
    });
    const {
      poolInitInfo: { poolPda, tokenVaultAKeypair, tokenVaultBKeypair },
      tokenAccountA,
      tokenAccountB,
      positions,
    } = fixture.getInfos();

    const positionTokenAccount2 = await createTokenAccount(
      provider,
      positions[0].mintKeypair.publicKey,
      provider.wallet.publicKey
    );

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.collectFeesIx(ctx.program, {
          pool: poolPda.publicKey,
          positionAuthority: provider.wallet.publicKey,
          position: positions[0].publicKey,
          positionTokenAccount: positionTokenAccount2,
          tokenOwnerAccountA: tokenAccountA,
          tokenOwnerAccountB: tokenAccountB,
          tokenVaultA: tokenVaultAKeypair.publicKey,
          tokenVaultB: tokenVaultBKeypair.publicKey,
        })
      ).buildAndExecute(),
      /0x7d3/ // ConstraintRaw
    );

    await transferToken(provider, positions[0].tokenAccount, positionTokenAccount2, 1);

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.collectFeesIx(ctx.program, {
          pool: poolPda.publicKey,
          positionAuthority: provider.wallet.publicKey,
          position: positions[0].publicKey,
          positionTokenAccount: positions[0].tokenAccount,
          tokenOwnerAccountA: tokenAccountA,
          tokenOwnerAccountB: tokenAccountB,
          tokenVaultA: tokenVaultAKeypair.publicKey,
          tokenVaultB: tokenVaultBKeypair.publicKey,
        })
      ).buildAndExecute(),
      /0x7d3/ // ConstraintRaw
    );
  });

  it("fails when position authority is not approved delegate for position token account", async () => {
    // In same tick array - start index 22528
    const tickLowerIndex = 29440;
    const tickUpperIndex = 33536;
    const tickSpacing = TickSpacing.Standard;
    const fixture = await new ElysiumPoolTestFixture(ctx).init({
      tickSpacing,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount: new anchor.BN(10_000_000) }],
    });
    const {
      poolInitInfo: { poolPda, tokenVaultAKeypair, tokenVaultBKeypair },
      tokenAccountA,
      tokenAccountB,
      positions,
    } = fixture.getInfos();

    const delegate = anchor.web3.Keypair.generate();

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.collectFeesIx(ctx.program, {
          pool: poolPda.publicKey,
          positionAuthority: delegate.publicKey,
          position: positions[0].publicKey,
          positionTokenAccount: positions[0].tokenAccount,
          tokenOwnerAccountA: tokenAccountA,
          tokenOwnerAccountB: tokenAccountB,
          tokenVaultA: tokenVaultAKeypair.publicKey,
          tokenVaultB: tokenVaultBKeypair.publicKey,
        })
      )
        .addSigner(delegate)
        .buildAndExecute(),
      /0x1783/ // MissingOrInvalidDelegate
    );
  });

  it("fails when position authority is not authorized to transfer exactly one token", async () => {
    // In same tick array - start index 22528
    const tickLowerIndex = 29440;
    const tickUpperIndex = 33536;
    const tickSpacing = TickSpacing.Standard;
    const fixture = await new ElysiumPoolTestFixture(ctx).init({
      tickSpacing,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount: new anchor.BN(10_000_000) }],
    });
    const {
      poolInitInfo: { poolPda, tokenVaultAKeypair, tokenVaultBKeypair },
      tokenAccountA,
      tokenAccountB,
      positions,
    } = fixture.getInfos();

    const delegate = anchor.web3.Keypair.generate();
    await approveToken(provider, positions[0].tokenAccount, delegate.publicKey, 2);

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.collectFeesIx(ctx.program, {
          pool: poolPda.publicKey,
          positionAuthority: delegate.publicKey,
          position: positions[0].publicKey,
          positionTokenAccount: positions[0].tokenAccount,
          tokenOwnerAccountA: tokenAccountA,
          tokenOwnerAccountB: tokenAccountB,
          tokenVaultA: tokenVaultAKeypair.publicKey,
          tokenVaultB: tokenVaultBKeypair.publicKey,
        })
      )
        .addSigner(delegate)
        .buildAndExecute(),
      /0x1784/ // InvalidPositionTokenAmount
    );
  });

  it("fails when position authority is not a signer", async () => {
    // In same tick array - start index 22528
    const tickLowerIndex = 29440;
    const tickUpperIndex = 33536;
    const tickSpacing = TickSpacing.Standard;
    const fixture = await new ElysiumPoolTestFixture(ctx).init({
      tickSpacing,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount: new anchor.BN(10_000_000) }],
    });
    const {
      poolInitInfo: { poolPda, tokenVaultAKeypair, tokenVaultBKeypair },
      tokenAccountA,
      tokenAccountB,
      positions,
    } = fixture.getInfos();

    const delegate = anchor.web3.Keypair.generate();
    await approveToken(provider, positions[0].tokenAccount, delegate.publicKey, 1);

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.collectFeesIx(ctx.program, {
          pool: poolPda.publicKey,
          positionAuthority: delegate.publicKey,
          position: positions[0].publicKey,
          positionTokenAccount: positions[0].tokenAccount,
          tokenOwnerAccountA: tokenAccountA,
          tokenOwnerAccountB: tokenAccountB,
          tokenVaultA: tokenVaultAKeypair.publicKey,
          tokenVaultB: tokenVaultBKeypair.publicKey,
        })
      ).buildAndExecute(),
      /.*signature verification fail.*/i
    );
  });

  it("fails when position token account mint does not equal position mint", async () => {
    // In same tick array - start index 22528
    const tickLowerIndex = 29440;
    const tickUpperIndex = 33536;
    const tickSpacing = TickSpacing.Standard;
    const fixture = await new ElysiumPoolTestFixture(ctx).init({
      tickSpacing,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount: new anchor.BN(10_000_000) }],
    });
    const {
      poolInitInfo: { poolPda, tokenVaultAKeypair, tokenVaultBKeypair, tokenMintA },
      tokenAccountA,
      tokenAccountB,
      positions,
    } = fixture.getInfos();

    const fakePositionTokenAccount = await createTokenAccount(
      provider,
      tokenMintA,
      provider.wallet.publicKey
    );

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.collectFeesIx(ctx.program, {
          pool: poolPda.publicKey,
          positionAuthority: provider.wallet.publicKey,
          position: positions[0].publicKey,
          positionTokenAccount: fakePositionTokenAccount,
          tokenOwnerAccountA: tokenAccountA,
          tokenOwnerAccountB: tokenAccountB,
          tokenVaultA: tokenVaultAKeypair.publicKey,
          tokenVaultB: tokenVaultBKeypair.publicKey,
        })
      ).buildAndExecute(),
      /0x7d3/ // ConstraintRaw
    );
  });

  it("fails when token vault does not match pool token vault", async () => {
    // In same tick array - start index 22528
    const tickLowerIndex = 29440;
    const tickUpperIndex = 33536;
    const tickSpacing = TickSpacing.Standard;
    const fixture = await new ElysiumPoolTestFixture(ctx).init({
      tickSpacing,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount: new anchor.BN(10_000_000) }],
    });
    const {
      poolInitInfo: { poolPda, tokenVaultAKeypair, tokenVaultBKeypair, tokenMintA, tokenMintB },
      tokenAccountA,
      tokenAccountB,
      positions,
    } = fixture.getInfos();

    const fakeVaultA = await createTokenAccount(provider, tokenMintA, provider.wallet.publicKey);
    const fakeVaultB = await createTokenAccount(provider, tokenMintB, provider.wallet.publicKey);

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.collectFeesIx(ctx.program, {
          pool: poolPda.publicKey,
          positionAuthority: provider.wallet.publicKey,
          position: positions[0].publicKey,
          positionTokenAccount: positions[0].tokenAccount,
          tokenOwnerAccountA: tokenAccountA,
          tokenOwnerAccountB: tokenAccountB,
          tokenVaultA: fakeVaultA,
          tokenVaultB: tokenVaultBKeypair.publicKey,
        })
      ).buildAndExecute(),
      /0x7dc/ // ConstraintAddress
    );

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.collectFeesIx(ctx.program, {
          pool: poolPda.publicKey,
          positionAuthority: provider.wallet.publicKey,
          position: positions[0].publicKey,
          positionTokenAccount: positions[0].tokenAccount,
          tokenOwnerAccountA: tokenAccountA,
          tokenOwnerAccountB: tokenAccountB,
          tokenVaultA: tokenVaultAKeypair.publicKey,
          tokenVaultB: fakeVaultB,
        })
      ).buildAndExecute(),
      /0x7dc/ // ConstraintAddress
    );
  });

  it("fails when owner token account mint does not match pool token mint", async () => {
    // In same tick array - start index 22528
    const tickLowerIndex = 29440;
    const tickUpperIndex = 33536;
    const tickSpacing = TickSpacing.Standard;
    const fixture = await new ElysiumPoolTestFixture(ctx).init({
      tickSpacing,
      positions: [{ tickLowerIndex, tickUpperIndex, liquidityAmount: new anchor.BN(10_000_000) }],
    });
    const {
      poolInitInfo: { poolPda, tokenVaultAKeypair, tokenVaultBKeypair, tokenMintA, tokenMintB },
      tokenAccountA,
      tokenAccountB,
      positions,
    } = fixture.getInfos();

    const invalidOwnerAccountA = await createTokenAccount(
      provider,
      tokenMintB,
      provider.wallet.publicKey
    );
    const invalidOwnerAccountB = await createTokenAccount(
      provider,
      tokenMintA,
      provider.wallet.publicKey
    );

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.collectFeesIx(ctx.program, {
          pool: poolPda.publicKey,
          positionAuthority: provider.wallet.publicKey,
          position: positions[0].publicKey,
          positionTokenAccount: positions[0].tokenAccount,
          tokenOwnerAccountA: invalidOwnerAccountA,
          tokenOwnerAccountB: tokenAccountB,
          tokenVaultA: tokenVaultAKeypair.publicKey,
          tokenVaultB: tokenVaultBKeypair.publicKey,
        })
      ).buildAndExecute(),
      /0x7d3/ // ConstraintRaw
    );

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.collectFeesIx(ctx.program, {
          pool: poolPda.publicKey,
          positionAuthority: provider.wallet.publicKey,
          position: positions[0].publicKey,
          positionTokenAccount: positions[0].tokenAccount,
          tokenOwnerAccountA: tokenAccountA,
          tokenOwnerAccountB: invalidOwnerAccountB,
          tokenVaultA: tokenVaultAKeypair.publicKey,
          tokenVaultB: tokenVaultBKeypair.publicKey,
        })
      ).buildAndExecute(),
      /0x7d3/ // ConstraintRaw
    );
  });
});
