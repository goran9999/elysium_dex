import * as anchor from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import { MathUtil } from "@orca-so/common-sdk";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import * as assert from "assert";
import Decimal from "decimal.js";
import {
  PDAUtil,
  ElysiumPool,
  ElysiumPoolClient,
  ElysiumPoolContext,
  ElysiumPoolIx,
  buildElysiumPoolClient,
  collectFeesQuote,
  toTx,
} from "../../../src";
import { IGNORE_CACHE } from "../../../src/network/public/fetcher";
import { TickSpacing, ZERO_BN } from "../../utils";
import { defaultConfirmOptions } from "../../utils/const";
import { ElysiumPoolTestFixture } from "../../utils/fixture";

interface SharedTestContext {
  provider: anchor.AnchorProvider;
  program: ElysiumPool;
  poolCtx: ElysiumPoolContext;
  poolClient: ElysiumPoolClient;
}

describe("PositionImpl#collectFees()", () => {
  let testCtx: SharedTestContext;
  const tickLowerIndex = 29440;
  const tickUpperIndex = 33536;
  const tickSpacing = TickSpacing.Standard;
  const liquidityAmount = new BN(10_000_000);

  before(() => {
    const provider = anchor.AnchorProvider.local(undefined, defaultConfirmOptions);

    anchor.setProvider(provider);
    const program = anchor.workspace.ElysiumPool;
    const poolCtx = ElysiumPoolContext.fromWorkspace(provider, program);
    const poolClient = buildElysiumPoolClient(poolCtx);

    testCtx = {
      provider,
      program,
      poolCtx,
      poolClient,
    };
  });

  async function accrueFees(fixture: ElysiumPoolTestFixture) {
    const ctx = testCtx.poolCtx;
    const {
      poolInitInfo,
      positions: [positionInfo],
      tokenAccountA,
      tokenAccountB,
    } = fixture.getInfos();

    const { poolPda, tokenVaultAKeypair, tokenVaultBKeypair } = poolInitInfo;

    const tickArrayPda = PDAUtil.getTickArray(ctx.program.programId, poolPda.publicKey, 22528);
    const oraclePda = PDAUtil.getOracle(ctx.program.programId, poolPda.publicKey);

    const pool = await testCtx.poolClient.getPool(poolPda.publicKey);
    const position = await testCtx.poolClient.getPosition(positionInfo.publicKey);

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

    const poolData = await pool.refreshData();
    const positionData = await position.refreshData();
    const tickLowerData = position.getLowerTickData();
    const tickUpperData = position.getLowerTickData();

    const quote = collectFeesQuote({
      pool: poolData,
      position: positionData,
      tickLower: tickLowerData,
      tickUpper: tickUpperData,
    });

    assert.ok(quote.feeOwedA.gtn(0) || quote.feeOwedB.gtn(0));
  }

  context("when the pool is SPL-only", () => {
    it("should collect fees", async () => {
      const fixture = await new ElysiumPoolTestFixture(testCtx.poolCtx).init({
        tickSpacing,
        positions: [
          { tickLowerIndex, tickUpperIndex, liquidityAmount }, // In range position
        ],
      });

      await accrueFees(fixture);

      const { positions, poolInitInfo } = fixture.getInfos();

      const pool = await testCtx.poolClient.getPool(poolInitInfo.poolPda.publicKey);
      const position = await testCtx.poolClient.getPosition(positions[0].publicKey);

      const positionDataBefore = await testCtx.poolCtx.fetcher.getPosition(
        position.getAddress(),
        IGNORE_CACHE
      );

      const otherWallet = anchor.web3.Keypair.generate();

      const poolData = await pool.refreshData();
      const positionData = await position.refreshData();
      const tickLowerData = position.getLowerTickData();
      const tickUpperData = position.getLowerTickData();

      const quote = collectFeesQuote({
        pool: poolData,
        position: positionData,
        tickLower: tickLowerData,
        tickUpper: tickUpperData,
      });

      assert.notEqual(positionDataBefore, null);

      const tx = await position.collectFees(
        true,
        undefined,
        otherWallet.publicKey,
        testCtx.provider.wallet.publicKey,
        testCtx.provider.wallet.publicKey,
        IGNORE_CACHE
      );

      await tx.buildAndExecute();

      const positionDataAfter = await testCtx.poolCtx.fetcher.getPosition(
        position.getAddress(),
        IGNORE_CACHE
      );

      assert.notEqual(positionDataAfter, null);

      const accountAPubkey = getAssociatedTokenAddressSync(
        poolInitInfo.tokenMintA,
        otherWallet.publicKey
      );
      const accountA = await testCtx.poolCtx.fetcher.getTokenInfo(accountAPubkey, IGNORE_CACHE);
      assert.ok(accountA && new BN(accountA.amount.toString()).eq(quote.feeOwedA));

      const accountBPubkey = getAssociatedTokenAddressSync(
        poolInitInfo.tokenMintB,
        otherWallet.publicKey
      );
      const accountB = await testCtx.poolCtx.fetcher.getTokenInfo(accountBPubkey, IGNORE_CACHE);
      assert.ok(accountB && new BN(accountB.amount.toString()).eq(quote.feeOwedB));
    });
  });

  context("when the pool is SOL-SPL", () => {
    it("should collect fees", async () => {
      const fixture = await new ElysiumPoolTestFixture(testCtx.poolCtx).init({
        tickSpacing,
        positions: [
          { tickLowerIndex, tickUpperIndex, liquidityAmount }, // In range position
        ],
        tokenAIsNative: true,
      });

      await accrueFees(fixture);

      const { positions, poolInitInfo } = fixture.getInfos();

      const pool = await testCtx.poolClient.getPool(poolInitInfo.poolPda.publicKey);
      const position = await testCtx.poolClient.getPosition(positions[0].publicKey);

      const positionDataBefore = await testCtx.poolCtx.fetcher.getPosition(
        position.getAddress(),
        IGNORE_CACHE
      );

      const otherWallet = anchor.web3.Keypair.generate();

      const poolData = await pool.refreshData();
      const positionData = await position.refreshData();
      const tickLowerData = position.getLowerTickData();
      const tickUpperData = position.getLowerTickData();

      const quote = collectFeesQuote({
        pool: poolData,
        position: positionData,
        tickLower: tickLowerData,
        tickUpper: tickUpperData,
      });

      const solBalanceBefore = await testCtx.provider.connection.getBalance(otherWallet.publicKey);
      assert.notEqual(positionDataBefore, null);

      const tx = await position.collectFees(
        true,
        undefined,
        otherWallet.publicKey,
        testCtx.provider.wallet.publicKey,
        testCtx.provider.wallet.publicKey,
        IGNORE_CACHE
      );

      await tx.addSigner(otherWallet).buildAndExecute();

      const positionDataAfter = await testCtx.poolCtx.fetcher.getPosition(
        position.getAddress(),
        IGNORE_CACHE
      );

      assert.notEqual(positionDataAfter, null);

      const solBalanceAfter = await testCtx.provider.connection.getBalance(otherWallet.publicKey);
      const minAccountExempt = await testCtx.poolCtx.fetcher.getAccountRentExempt();
      assert.equal(
        solBalanceAfter - solBalanceBefore,
        quote.feeOwedA.toNumber() + minAccountExempt
      );

      const accountBPubkey = getAssociatedTokenAddressSync(
        poolInitInfo.tokenMintB,
        otherWallet.publicKey
      );
      const accountB = await testCtx.poolCtx.fetcher.getTokenInfo(accountBPubkey, IGNORE_CACHE);
      assert.ok(accountB && new BN(accountB.amount.toString()).eq(quote.feeOwedB));
    });
  });
});
