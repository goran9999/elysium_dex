import * as anchor from "@coral-xyz/anchor";
import { Address } from "@coral-xyz/anchor";
import { Percentage } from "@orca-so/common-sdk";
import { Keypair } from "@solana/web3.js";
import * as assert from "assert";
import BN from "bn.js";
import {
  buildElysiumPoolClient,
  PriceMath,
  swapQuoteByInputToken,
  ElysiumPool,
  ElysiumPoolContext,
} from "../../../../src";
import { SwapErrorCode, ElysiumPoolsError } from "../../../../src/errors/errors";
import { IGNORE_CACHE } from "../../../../src/network/public/fetcher";
import { swapQuoteByInputTokenWithDevFees } from "../../../../src/quotes/public/dev-fee-swap-quote";
import {
  assertDevFeeQuotes,
  assertDevTokenAmount,
  assertQuoteAndResults,
  TickSpacing,
} from "../../../utils";
import { defaultConfirmOptions } from "../../../utils/const";
import {
  arrayTickIndexToTickIndex,
  buildPosition,
  setupSwapTest,
} from "../../../utils/swap-test-utils";
import { getVaultAmounts } from "../../../utils/pools-test-utils";

describe("pool-dev-fee-swap", () => {
  const provider = anchor.AnchorProvider.local(undefined, defaultConfirmOptions);

  const program = anchor.workspace.ElysiumPool;
  const ctx = ElysiumPoolContext.fromWorkspace(provider, program);
  const client = buildElysiumPoolClient(ctx);
  const tickSpacing = TickSpacing.SixtyFour;
  const slippageTolerance = Percentage.fromFraction(0, 100);

  it("swap with dev-fee 0% equals swap", async () => {
    const currIndex = arrayTickIndexToTickIndex({ arrayIndex: -1, offsetIndex: 22 }, tickSpacing);
    const devWallet = Keypair.generate();
    const aToB = false;
    const pool = await setupSwapTest({
      ctx,
      client,
      tickSpacing,
      initSqrtPrice: PriceMath.tickIndexToSqrtPriceX64(currIndex),
      initArrayStartTicks: [-5632, 0, 5632],
      fundedPositions: [
        buildPosition(
          // a
          { arrayIndex: -1, offsetIndex: 10 },
          { arrayIndex: 1, offsetIndex: 23 },
          tickSpacing,
          new anchor.BN(250_000_000)
        ),
      ],
    });

    const devFeePercentage = Percentage.fromFraction(0, 1000); // 0%
    const inputTokenAmount = new BN(119500000);
    const postFeeTokenAmount = inputTokenAmount.sub(
      inputTokenAmount.mul(devFeePercentage.numerator).div(devFeePercentage.denominator)
    );
    const poolData = await pool.refreshData();
    const beforeVaultAmounts = await getVaultAmounts(ctx, poolData);
    const inputTokenQuote = await swapQuoteByInputToken(
      pool,
      poolData.tokenMintB,
      inputTokenAmount,
      slippageTolerance,
      ctx.program.programId,
      ctx.fetcher,
      IGNORE_CACHE
    );
    const postFeeInputTokenQuote = await swapQuoteByInputToken(
      pool,
      poolData.tokenMintB,
      postFeeTokenAmount,
      slippageTolerance,
      ctx.program.programId,
      ctx.fetcher,
      IGNORE_CACHE
    );
    const inputTokenQuoteWithDevFees = await swapQuoteByInputTokenWithDevFees(
      pool,
      poolData.tokenMintB,
      inputTokenAmount,
      slippageTolerance,
      ctx.program.programId,
      ctx.fetcher,
      devFeePercentage,
      IGNORE_CACHE
    );
    assertDevFeeQuotes(inputTokenQuote, postFeeInputTokenQuote, inputTokenQuoteWithDevFees);
    await (
      await pool.swapWithDevFees(inputTokenQuoteWithDevFees, devWallet.publicKey)
    ).buildAndExecute();

    const newData = await pool.refreshData();
    const afterVaultAmounts = await getVaultAmounts(ctx, poolData);
    assertQuoteAndResults(aToB, inputTokenQuote, newData, beforeVaultAmounts, afterVaultAmounts);
  });

  it("swap with dev-fee 0.1%", async () => {
    const currIndex = arrayTickIndexToTickIndex({ arrayIndex: -1, offsetIndex: 22 }, tickSpacing);
    const devWallet = Keypair.generate();
    const aToB = false;
    const pool = await setupSwapTest({
      ctx,
      client,
      tickSpacing,
      initSqrtPrice: PriceMath.tickIndexToSqrtPriceX64(currIndex),
      initArrayStartTicks: [-5632, 0, 5632],
      fundedPositions: [
        buildPosition(
          // a
          { arrayIndex: -1, offsetIndex: 10 },
          { arrayIndex: 1, offsetIndex: 23 },
          tickSpacing,
          new anchor.BN(250_000_000)
        ),
      ],
    });

    const devFeePercentage = Percentage.fromFraction(1, 1000); // 0.1%
    const inputTokenAmount = new BN(1195000);
    const postFeeTokenAmount = inputTokenAmount.sub(
      inputTokenAmount.mul(devFeePercentage.numerator).div(devFeePercentage.denominator)
    );

    const poolData = await pool.refreshData();
    const swapToken = aToB ? poolData.tokenMintA : poolData.tokenMintB;
    const beforeVaultAmounts = await getVaultAmounts(ctx, poolData);

    const { inputTokenQuote, postFeeInputTokenQuote, inputTokenQuoteWithDevFees } = await getQuotes(
      ctx,
      pool,
      swapToken,
      inputTokenAmount,
      postFeeTokenAmount,
      slippageTolerance,
      devFeePercentage
    );
    assertDevFeeQuotes(inputTokenQuote, postFeeInputTokenQuote, inputTokenQuoteWithDevFees);
    await (
      await pool.swapWithDevFees(inputTokenQuoteWithDevFees, devWallet.publicKey)
    ).buildAndExecute();

    const newData = await pool.refreshData();
    const afterVaultAmounts = await getVaultAmounts(ctx, poolData);
    assertQuoteAndResults(
      aToB,
      postFeeInputTokenQuote,
      newData,
      beforeVaultAmounts,
      afterVaultAmounts
    );
    await assertDevTokenAmount(ctx, inputTokenQuoteWithDevFees, swapToken, devWallet.publicKey);
  });

  it("swap with dev-fee 1%", async () => {
    const currIndex = arrayTickIndexToTickIndex({ arrayIndex: 1, offsetIndex: 22 }, tickSpacing);
    const devWallet = Keypair.generate();
    const aToB = true;
    const pool = await setupSwapTest({
      ctx,
      client,
      tickSpacing,
      initSqrtPrice: PriceMath.tickIndexToSqrtPriceX64(currIndex),
      initArrayStartTicks: [-5632, 0, 5632],
      fundedPositions: [
        buildPosition(
          // a
          { arrayIndex: -1, offsetIndex: 10 },
          { arrayIndex: 1, offsetIndex: 23 },
          tickSpacing,
          new anchor.BN(250_000_000)
        ),
      ],
    });

    const devFeePercentage = Percentage.fromFraction(1, 100); // 1%
    const inputTokenAmount = new BN(119500000);
    const postFeeTokenAmount = inputTokenAmount.sub(
      inputTokenAmount.mul(devFeePercentage.numerator).div(devFeePercentage.denominator)
    );

    const poolData = await pool.refreshData();
    const swapToken = aToB ? poolData.tokenMintA : poolData.tokenMintB;
    const beforeVaultAmounts = await getVaultAmounts(ctx, poolData);
    const { inputTokenQuote, postFeeInputTokenQuote, inputTokenQuoteWithDevFees } = await getQuotes(
      ctx,
      pool,
      swapToken,
      inputTokenAmount,
      postFeeTokenAmount,
      slippageTolerance,
      devFeePercentage
    );
    assertDevFeeQuotes(inputTokenQuote, postFeeInputTokenQuote, inputTokenQuoteWithDevFees);
    await (
      await pool.swapWithDevFees(inputTokenQuoteWithDevFees, devWallet.publicKey)
    ).buildAndExecute();

    const newData = await pool.refreshData();
    const afterVaultAmounts = await getVaultAmounts(ctx, poolData);
    assertQuoteAndResults(
      aToB,
      postFeeInputTokenQuote,
      newData,
      beforeVaultAmounts,
      afterVaultAmounts
    );
    await assertDevTokenAmount(ctx, inputTokenQuoteWithDevFees, swapToken, devWallet.publicKey);
  });

  it("swap with input-token as NATIVE_MINT & dev-fee 1%", async () => {
    const currIndex = arrayTickIndexToTickIndex({ arrayIndex: 1, offsetIndex: 1 }, tickSpacing);
    const aToB = true;
    const tokenAIsNative = true;
    const pool = await setupSwapTest(
      {
        ctx,
        client,
        tickSpacing,
        initSqrtPrice: PriceMath.tickIndexToSqrtPriceX64(currIndex),
        initArrayStartTicks: [-16896, -11264, -5632, 0, 5632],
        fundedPositions: [
          buildPosition(
            // a
            { arrayIndex: -1, offsetIndex: 10 },
            { arrayIndex: 1, offsetIndex: 23 },
            tickSpacing,
            new anchor.BN(990_000_000)
          ),
          buildPosition(
            // a
            { arrayIndex: -1, offsetIndex: 10 },
            { arrayIndex: 0, offsetIndex: 23 },
            tickSpacing,
            new anchor.BN(990_000_000)
          ),
          buildPosition(
            // a
            { arrayIndex: 0, offsetIndex: 22 },
            { arrayIndex: 1, offsetIndex: 23 },
            tickSpacing,
            new anchor.BN(1_990_000_000)
          ),
          buildPosition(
            // a
            { arrayIndex: 0, offsetIndex: 23 },
            { arrayIndex: 1, offsetIndex: 23 },
            tickSpacing,
            new anchor.BN(990_000_000)
          ),
        ],
      },
      tokenAIsNative
    );

    const { devWallet, balance: preDevWalletBalance } = await setupDevWallet(ctx, 10_000_000);

    const devFeePercentage = Percentage.fromFraction(1, 10000); // 0.01%
    const inputTokenAmount = new BN(1_000_000_000); // Swap 1SOL
    const postFeeTokenAmount = inputTokenAmount.sub(
      inputTokenAmount.mul(devFeePercentage.numerator).div(devFeePercentage.denominator)
    );

    const poolData = await pool.refreshData();
    const swapToken = aToB ? poolData.tokenMintA : poolData.tokenMintB;
    const beforeVaultAmounts = await getVaultAmounts(ctx, poolData);

    const { inputTokenQuote, postFeeInputTokenQuote, inputTokenQuoteWithDevFees } = await getQuotes(
      ctx,
      pool,
      swapToken,
      inputTokenAmount,
      postFeeTokenAmount,
      slippageTolerance,
      devFeePercentage
    );

    assertDevFeeQuotes(inputTokenQuote, postFeeInputTokenQuote, inputTokenQuoteWithDevFees);
    await (
      await pool.swapWithDevFees(inputTokenQuoteWithDevFees, devWallet.publicKey)
    ).buildAndExecute();

    const newData = await pool.refreshData();
    const afterVaultAmounts = await getVaultAmounts(ctx, poolData);
    assertQuoteAndResults(
      aToB,
      postFeeInputTokenQuote,
      newData,
      beforeVaultAmounts,
      afterVaultAmounts
    );
    await assertDevTokenAmount(
      ctx,
      inputTokenQuoteWithDevFees,
      swapToken,
      devWallet.publicKey,
      preDevWalletBalance
    );
  });

  it("swap with dev-fee 50%", async () => {
    const currIndex = arrayTickIndexToTickIndex({ arrayIndex: -1, offsetIndex: 22 }, tickSpacing);
    const devWallet = Keypair.generate();
    const aToB = false;
    const pool = await setupSwapTest({
      ctx,
      client,
      tickSpacing,
      initSqrtPrice: PriceMath.tickIndexToSqrtPriceX64(currIndex),
      initArrayStartTicks: [-5632, 0, 5632],
      fundedPositions: [
        buildPosition(
          // a
          { arrayIndex: -1, offsetIndex: 10 },
          { arrayIndex: 1, offsetIndex: 23 },
          tickSpacing,
          new anchor.BN(250_000_000)
        ),
      ],
    });

    const devFeePercentage = Percentage.fromFraction(500000, 1000000); // 50%
    const inputTokenAmount = new BN(119500000);
    const postFeeTokenAmount = inputTokenAmount.sub(
      inputTokenAmount.mul(devFeePercentage.numerator).div(devFeePercentage.denominator)
    );

    const poolData = await pool.refreshData();
    const swapToken = aToB ? poolData.tokenMintA : poolData.tokenMintB;
    const beforeVaultAmounts = await getVaultAmounts(ctx, poolData);
    const { inputTokenQuote, postFeeInputTokenQuote, inputTokenQuoteWithDevFees } = await getQuotes(
      ctx,
      pool,
      swapToken,
      inputTokenAmount,
      postFeeTokenAmount,
      slippageTolerance,
      devFeePercentage
    );
    assertDevFeeQuotes(inputTokenQuote, postFeeInputTokenQuote, inputTokenQuoteWithDevFees);
    await (
      await pool.swapWithDevFees(inputTokenQuoteWithDevFees, devWallet.publicKey)
    ).buildAndExecute();

    const newData = await pool.refreshData();
    const afterVaultAmounts = await getVaultAmounts(ctx, poolData);
    assertQuoteAndResults(
      aToB,
      postFeeInputTokenQuote,
      newData,
      beforeVaultAmounts,
      afterVaultAmounts
    );
    await assertDevTokenAmount(ctx, inputTokenQuoteWithDevFees, swapToken, devWallet.publicKey);
  });

  it("swap with dev-fee of 100%", async () => {
    const currIndex = arrayTickIndexToTickIndex({ arrayIndex: -1, offsetIndex: 22 }, tickSpacing);
    const pool = await setupSwapTest({
      ctx,
      client,
      tickSpacing,
      initSqrtPrice: PriceMath.tickIndexToSqrtPriceX64(currIndex),
      initArrayStartTicks: [-5632, 0, 5632],
      fundedPositions: [
        buildPosition(
          // a
          { arrayIndex: -1, offsetIndex: 10 },
          { arrayIndex: 1, offsetIndex: 23 },
          tickSpacing,
          new anchor.BN(250_000_000)
        ),
      ],
    });

    const devFeePercentage = Percentage.fromFraction(100, 100); // 100%
    const inputTokenAmount = new BN(119500000);
    const poolData = await pool.refreshData();
    const swapToken = poolData.tokenMintB;

    assert.rejects(
      () =>
        swapQuoteByInputTokenWithDevFees(
          pool,
          swapToken,
          inputTokenAmount,
          slippageTolerance,
          ctx.program.programId,
          ctx.fetcher,
          devFeePercentage,
          IGNORE_CACHE
        ),
      (err) => (err as ElysiumPoolsError).errorCode === SwapErrorCode.InvalidDevFeePercentage
    );
  });

  it("swap with dev-fee of 200%", async () => {
    const currIndex = arrayTickIndexToTickIndex({ arrayIndex: -1, offsetIndex: 22 }, tickSpacing);
    const pool = await setupSwapTest({
      ctx,
      client,
      tickSpacing,
      initSqrtPrice: PriceMath.tickIndexToSqrtPriceX64(currIndex),
      initArrayStartTicks: [-5632, 0, 5632],
      fundedPositions: [
        buildPosition(
          // a
          { arrayIndex: -1, offsetIndex: 10 },
          { arrayIndex: 1, offsetIndex: 23 },
          tickSpacing,
          new anchor.BN(250_000_000)
        ),
      ],
    });

    const devFeePercentage = Percentage.fromFraction(200, 100); // 200%
    const inputTokenAmount = new BN(119500000);
    const poolData = await pool.refreshData();
    const swapToken = poolData.tokenMintB;

    assert.rejects(
      () =>
        swapQuoteByInputTokenWithDevFees(
          pool,
          swapToken,
          inputTokenAmount,
          slippageTolerance,
          ctx.program.programId,
          ctx.fetcher,
          devFeePercentage,
          IGNORE_CACHE
        ),
      (err) => (err as ElysiumPoolsError).errorCode === SwapErrorCode.InvalidDevFeePercentage
    );
  });
});

async function getQuotes(
  ctx: ElysiumPoolContext,
  pool: ElysiumPool,
  swapToken: Address,
  inputTokenAmount: BN,
  postFeeTokenAmount: BN,
  slippageTolerance: Percentage,
  devFeePercentage: Percentage
) {
  const inputTokenQuote = await swapQuoteByInputToken(
    pool,
    swapToken,
    inputTokenAmount,
    slippageTolerance,
    ctx.program.programId,
    ctx.fetcher,
    IGNORE_CACHE
  );
  const postFeeInputTokenQuote = await swapQuoteByInputToken(
    pool,
    swapToken,
    postFeeTokenAmount,
    slippageTolerance,
    ctx.program.programId,
    ctx.fetcher,
    IGNORE_CACHE
  );
  const inputTokenQuoteWithDevFees = await swapQuoteByInputTokenWithDevFees(
    pool,
    swapToken,
    inputTokenAmount,
    slippageTolerance,
    ctx.program.programId,
    ctx.fetcher,
    devFeePercentage,
    IGNORE_CACHE
  );

  return { inputTokenQuote, postFeeInputTokenQuote, inputTokenQuoteWithDevFees };
}

async function setupDevWallet(ctx: ElysiumPoolContext, airdrop: number) {
  // Setup dev-wallet. Airdrop some tokens in or it'll be difficult to account for
  // rent-tokens when we do assertion
  const devWallet = Keypair.generate();
  const txn = await ctx.provider.connection.requestAirdrop(devWallet.publicKey, airdrop);
  await ctx.provider.connection.confirmTransaction(txn);
  const balance = await ctx.provider.connection.getBalance(devWallet.publicKey);
  return { devWallet, balance };
}
