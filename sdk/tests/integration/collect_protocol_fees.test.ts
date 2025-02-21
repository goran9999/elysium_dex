import * as anchor from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import { MathUtil } from "@orca-so/common-sdk";
import * as assert from "assert";
import Decimal from "decimal.js";
import { PDAUtil, toTx, ElysiumPoolContext, ElysiumPoolData, ElysiumPoolIx } from "../../src";
import { IGNORE_CACHE } from "../../src/network/public/fetcher";
import { createTokenAccount, getTokenBalance, TickSpacing, ZERO_BN } from "../utils";
import { defaultConfirmOptions } from "../utils/const";
import { ElysiumPoolTestFixture } from "../utils/fixture";
import { initTestPool } from "../utils/init-utils";

describe("collect_protocol_fees", () => {
  const provider = anchor.AnchorProvider.local(undefined, defaultConfirmOptions);

  const program = anchor.workspace.ElysiumPool;
  const ctx = ElysiumPoolContext.fromWorkspace(provider, program);
  const fetcher = ctx.fetcher;

  it("successfully collects fees", async () => {
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
      configKeypairs: { feeAuthorityKeypair, collectProtocolFeesAuthorityKeypair },
      configInitInfo: { poolsConfigKeypair: poolsConfigKeypair },
      tokenAccountA,
      tokenAccountB,
      positions,
    } = fixture.getInfos();

    await toTx(
      ctx,
      ElysiumPoolIx.setProtocolFeeRateIx(ctx.program, {
        pool: poolPda.publicKey,
        poolsConfig: poolsConfigKeypair.publicKey,
        feeAuthority: feeAuthorityKeypair.publicKey,
        protocolFeeRate: 2500,
      })
    )
      .addSigner(feeAuthorityKeypair)
      .buildAndExecute();

    const poolBefore = (await fetcher.getPool(poolPda.publicKey, IGNORE_CACHE)) as ElysiumPoolData;
    assert.ok(poolBefore?.protocolFeeOwedA.eq(ZERO_BN));
    assert.ok(poolBefore?.protocolFeeOwedB.eq(ZERO_BN));

    const tickArrayPda = positions[0].tickArrayLower;

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
        tickArray0: tickArrayPda,
        tickArray1: tickArrayPda,
        tickArray2: tickArrayPda,
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
        tickArray0: tickArrayPda,
        tickArray1: tickArrayPda,
        tickArray2: tickArrayPda,
        oracle: oraclePda.publicKey,
      })
    ).buildAndExecute();

    const poolAfter = (await fetcher.getPool(poolPda.publicKey, IGNORE_CACHE)) as ElysiumPoolData;
    assert.ok(poolAfter?.protocolFeeOwedA.eq(new BN(150)));
    assert.ok(poolAfter?.protocolFeeOwedB.eq(new BN(150)));

    const destA = await createTokenAccount(provider, tokenMintA, provider.wallet.publicKey);
    const destB = await createTokenAccount(provider, tokenMintB, provider.wallet.publicKey);

    await toTx(
      ctx,
      ElysiumPoolIx.collectProtocolFeesIx(ctx.program, {
        poolsConfig: poolsConfigKeypair.publicKey,
        pool: poolPda.publicKey,
        collectProtocolFeesAuthority: collectProtocolFeesAuthorityKeypair.publicKey,
        tokenVaultA: tokenVaultAKeypair.publicKey,
        tokenVaultB: tokenVaultBKeypair.publicKey,
        tokenOwnerAccountA: destA,
        tokenOwnerAccountB: destB,
      })
    )
      .addSigner(collectProtocolFeesAuthorityKeypair)
      .buildAndExecute();

    const balanceDestA = await getTokenBalance(provider, destA);
    const balanceDestB = await getTokenBalance(provider, destB);
    assert.equal(balanceDestA, "150");
    assert.equal(balanceDestB, "150");
    assert.ok(poolBefore?.protocolFeeOwedA.eq(ZERO_BN));
    assert.ok(poolBefore?.protocolFeeOwedB.eq(ZERO_BN));
  });

  it("fails to collect fees without the authority's signature", async () => {
    const tickSpacing = TickSpacing.Standard;
    const fixture = await new ElysiumPoolTestFixture(ctx).init({
      tickSpacing,
      positions: [
        {
          tickLowerIndex: 29440,
          tickUpperIndex: 33536,
          liquidityAmount: new anchor.BN(10_000_000),
        },
      ],
    });
    const {
      poolInitInfo: { poolPda, tokenVaultAKeypair, tokenVaultBKeypair },
      configKeypairs: { collectProtocolFeesAuthorityKeypair },
      configInitInfo: { poolsConfigKeypair },
      tokenAccountA,
      tokenAccountB,
    } = fixture.getInfos();

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.collectProtocolFeesIx(ctx.program, {
          poolsConfig: poolsConfigKeypair.publicKey,
          pool: poolPda.publicKey,
          collectProtocolFeesAuthority: collectProtocolFeesAuthorityKeypair.publicKey,
          tokenVaultA: tokenVaultAKeypair.publicKey,
          tokenVaultB: tokenVaultBKeypair.publicKey,
          tokenOwnerAccountA: tokenAccountA,
          tokenOwnerAccountB: tokenAccountB,
        })
      ).buildAndExecute(),
      /.*signature verification fail.*/i
    );
  });

  it("fails when collect_protocol_fees_authority is invalid", async () => {
    const tickSpacing = TickSpacing.Standard;
    const fixture = await new ElysiumPoolTestFixture(ctx).init({
      tickSpacing,
      positions: [
        {
          tickLowerIndex: 29440,
          tickUpperIndex: 33536,
          liquidityAmount: new anchor.BN(10_000_000),
        },
      ],
    });
    const {
      poolInitInfo: { poolPda, tokenVaultAKeypair, tokenVaultBKeypair },
      configKeypairs: { rewardEmissionsSuperAuthorityKeypair },
      configInitInfo: { poolsConfigKeypair },
      tokenAccountA,
      tokenAccountB,
    } = fixture.getInfos();

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.collectProtocolFeesIx(ctx.program, {
          poolsConfig: poolsConfigKeypair.publicKey,
          pool: poolPda.publicKey,
          collectProtocolFeesAuthority: rewardEmissionsSuperAuthorityKeypair.publicKey,
          tokenVaultA: tokenVaultAKeypair.publicKey,
          tokenVaultB: tokenVaultBKeypair.publicKey,
          tokenOwnerAccountA: tokenAccountA,
          tokenOwnerAccountB: tokenAccountB,
        })
      )
        .addSigner(rewardEmissionsSuperAuthorityKeypair)
        .buildAndExecute(),
      /0x7dc/ // ConstraintAddress
    );
  });

  it("fails when pool does not match config", async () => {
    const tickSpacing = TickSpacing.Standard;
    const fixture = await new ElysiumPoolTestFixture(ctx).init({
      tickSpacing,
      positions: [
        {
          tickLowerIndex: 29440,
          tickUpperIndex: 33536,
          liquidityAmount: new anchor.BN(10_000_000),
        },
      ],
    });
    const {
      poolInitInfo: { tokenVaultAKeypair, tokenVaultBKeypair },
      configKeypairs: { collectProtocolFeesAuthorityKeypair },
      configInitInfo: { poolsConfigKeypair },
      tokenAccountA,
      tokenAccountB,
    } = fixture.getInfos();
    const {
      poolInitInfo: { poolPda: poolPda2 },
    } = await initTestPool(ctx, tickSpacing);

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.collectProtocolFeesIx(ctx.program, {
          poolsConfig: poolsConfigKeypair.publicKey,
          pool: poolPda2.publicKey,
          collectProtocolFeesAuthority: collectProtocolFeesAuthorityKeypair.publicKey,
          tokenVaultA: tokenVaultAKeypair.publicKey,
          tokenVaultB: tokenVaultBKeypair.publicKey,
          tokenOwnerAccountA: tokenAccountA,
          tokenOwnerAccountB: tokenAccountB,
        })
      )
        .addSigner(collectProtocolFeesAuthorityKeypair)
        .buildAndExecute(),
      /0x7d1/ // ConstraintHasOne
    );
  });

  it("fails when vaults do not match pool vaults", async () => {
    const tickSpacing = TickSpacing.Standard;
    const fixture = await new ElysiumPoolTestFixture(ctx).init({
      tickSpacing,
      positions: [
        {
          tickLowerIndex: 29440,
          tickUpperIndex: 33536,
          liquidityAmount: new anchor.BN(10_000_000),
        },
      ],
    });
    const {
      poolInitInfo: { poolPda, tokenVaultAKeypair, tokenVaultBKeypair, tokenMintA, tokenMintB },
      configKeypairs: { collectProtocolFeesAuthorityKeypair },
      configInitInfo: { poolsConfigKeypair: poolsConfigKeypair },
      tokenAccountA,
      tokenAccountB,
    } = fixture.getInfos();

    const fakeVaultA = await createTokenAccount(provider, tokenMintA, provider.wallet.publicKey);
    const fakeVaultB = await createTokenAccount(provider, tokenMintB, provider.wallet.publicKey);

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.collectProtocolFeesIx(ctx.program, {
          poolsConfig: poolsConfigKeypair.publicKey,
          pool: poolPda.publicKey,
          collectProtocolFeesAuthority: collectProtocolFeesAuthorityKeypair.publicKey,
          tokenVaultA: fakeVaultA,
          tokenVaultB: tokenVaultBKeypair.publicKey,
          tokenOwnerAccountA: tokenAccountA,
          tokenOwnerAccountB: tokenAccountB,
        })
      )
        .addSigner(collectProtocolFeesAuthorityKeypair)
        .buildAndExecute(),
      /0x7dc/ // ConstraintAddress
    );

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.collectProtocolFeesIx(ctx.program, {
          poolsConfig: poolsConfigKeypair.publicKey,
          pool: poolPda.publicKey,
          collectProtocolFeesAuthority: collectProtocolFeesAuthorityKeypair.publicKey,
          tokenVaultA: tokenVaultAKeypair.publicKey,
          tokenVaultB: fakeVaultB,
          tokenOwnerAccountA: tokenAccountA,
          tokenOwnerAccountB: tokenAccountB,
        })
      )
        .addSigner(collectProtocolFeesAuthorityKeypair)
        .buildAndExecute(),
      /0x7dc/ // ConstraintAddress
    );
  });

  it("fails when destination mints do not match pool mints", async () => {
    const tickSpacing = TickSpacing.Standard;
    const fixture = await new ElysiumPoolTestFixture(ctx).init({
      tickSpacing,
      positions: [
        {
          tickLowerIndex: 29440,
          tickUpperIndex: 33536,
          liquidityAmount: new anchor.BN(10_000_000),
        },
      ],
    });
    const {
      poolInitInfo: { poolPda, tokenVaultAKeypair, tokenVaultBKeypair, tokenMintA, tokenMintB },
      configKeypairs: { collectProtocolFeesAuthorityKeypair },
      configInitInfo: { poolsConfigKeypair: poolsConfigKepair },
      tokenAccountA,
      tokenAccountB,
    } = fixture.getInfos();

    const invalidDestA = await createTokenAccount(provider, tokenMintB, provider.wallet.publicKey);
    const invalidDestB = await createTokenAccount(provider, tokenMintA, provider.wallet.publicKey);

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.collectProtocolFeesIx(ctx.program, {
          poolsConfig: poolsConfigKepair.publicKey,
          pool: poolPda.publicKey,
          collectProtocolFeesAuthority: collectProtocolFeesAuthorityKeypair.publicKey,
          tokenVaultA: tokenVaultAKeypair.publicKey,
          tokenVaultB: tokenVaultBKeypair.publicKey,
          tokenOwnerAccountA: invalidDestA,
          tokenOwnerAccountB: tokenAccountB,
        })
      )
        .addSigner(collectProtocolFeesAuthorityKeypair)
        .buildAndExecute(),
      /0x7d3/ // ConstraintRaw
    );

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.collectProtocolFeesIx(ctx.program, {
          poolsConfig: poolsConfigKepair.publicKey,
          pool: poolPda.publicKey,
          collectProtocolFeesAuthority: collectProtocolFeesAuthorityKeypair.publicKey,
          tokenVaultA: tokenVaultAKeypair.publicKey,
          tokenVaultB: tokenVaultBKeypair.publicKey,
          tokenOwnerAccountA: tokenAccountA,
          tokenOwnerAccountB: invalidDestB,
        })
      )
        .addSigner(collectProtocolFeesAuthorityKeypair)
        .buildAndExecute(),
      /0x7d3/ // ConstraintRaw
    );
  });
});
