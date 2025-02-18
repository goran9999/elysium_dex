import * as anchor from "@coral-xyz/anchor";
import { Percentage } from "@orca-so/common-sdk";
import { PublicKey } from "@solana/web3.js";
import * as assert from "assert";
import { BN } from "bn.js";
import {
  buildElysiumPoolClient,
  InitPoolParams,
  PDAUtil,
  swapQuoteByInputToken,
  swapQuoteByOutputToken,
  toTx,
  twoHopSwapQuoteFromSwapQuotes,
  ElysiumPoolContext,
  ElysiumPoolIx,
} from "../../src";
import { TwoHopSwapParams } from "../../src/instructions";
import { IGNORE_CACHE } from "../../src/network/public/fetcher";
import { getTokenBalance, TickSpacing } from "../utils";
import { defaultConfirmOptions } from "../utils/const";
import {
  buildTestAquariums,
  FundedPositionParams,
  getDefaultAquarium,
  getTokenAccsForPools,
  InitAquariumParams,
} from "../utils/init-utils";

describe("two-hop swap", () => {
  const provider = anchor.AnchorProvider.local(undefined, defaultConfirmOptions);

  const program = anchor.workspace.ElysiumPool;
  const ctx = ElysiumPoolContext.fromWorkspace(provider, program);
  const fetcher = ctx.fetcher;
  const client = buildElysiumPoolClient(ctx);

  let aqConfig: InitAquariumParams;
  beforeEach(async () => {
    aqConfig = getDefaultAquarium();
    // Add a third token and account and a second pool
    aqConfig.initMintParams.push({});
    aqConfig.initTokenAccParams.push({ mintIndex: 2 });
    aqConfig.initPoolParams.push({ mintIndices: [1, 2], tickSpacing: TickSpacing.Standard });

    // Add tick arrays and positions
    const aToB = false;
    aqConfig.initTickArrayRangeParams.push({
      poolIndex: 0,
      startTickIndex: 22528,
      arrayCount: 3,
      aToB,
    });
    aqConfig.initTickArrayRangeParams.push({
      poolIndex: 1,
      startTickIndex: 22528,
      arrayCount: 3,
      aToB,
    });
    const fundParams: FundedPositionParams[] = [
      {
        liquidityAmount: new anchor.BN(10_000_000),
        tickLowerIndex: 29440,
        tickUpperIndex: 33536,
      },
    ];
    aqConfig.initPositionParams.push({ poolIndex: 0, fundParams });
    aqConfig.initPositionParams.push({ poolIndex: 1, fundParams });
  });

  describe("fails [2] with two-hop swap, invalid accounts", () => {
    let baseIxParams: TwoHopSwapParams;
    beforeEach(async () => {
      const aquarium = (await buildTestAquariums(ctx, [aqConfig]))[0];
      const { tokenAccounts, mintKeys, pools } = aquarium;

      const poolOneKey = pools[0].poolPda.publicKey;
      const poolTwoKey = pools[1].poolPda.publicKey;
      const poolOne = await client.getPool(poolOneKey, IGNORE_CACHE);
      const poolTwo = await client.getPool(poolTwoKey, IGNORE_CACHE);

      const [inputToken, intermediaryToken, _outputToken] = mintKeys;

      const quote = await swapQuoteByInputToken(
        poolOne,
        inputToken,
        new BN(1000),
        Percentage.fromFraction(1, 100),
        ctx.program.programId,
        fetcher,
        IGNORE_CACHE
      );

      const quote2 = await swapQuoteByInputToken(
        poolTwo,
        intermediaryToken,
        quote.estimatedAmountOut,
        Percentage.fromFraction(1, 100),
        ctx.program.programId,
        fetcher,
        IGNORE_CACHE
      );

      const twoHopQuote = twoHopSwapQuoteFromSwapQuotes(quote, quote2);
      baseIxParams = {
        ...twoHopQuote,
        ...getParamsFromPools([pools[0], pools[1]], tokenAccounts),
        tokenAuthority: ctx.wallet.publicKey,
      };
    });

    it("fails invalid pool", async () => {
      await rejectParams(
        {
          ...baseIxParams,
          poolOne: baseIxParams.poolTwo,
        },
        /0x7d3/ // ConstraintRaw
      );
    });

    it("fails invalid token account", async () => {
      await rejectParams(
        {
          ...baseIxParams,
          tokenOwnerAccountOneA: baseIxParams.tokenOwnerAccountOneB,
        },
        /0x7d3/ // ConstraintRaw
      );
    });

    it("fails invalid token vault", async () => {
      await rejectParams(
        {
          ...baseIxParams,
          tokenVaultOneA: baseIxParams.tokenVaultOneB,
        },
        /0x7dc/ // ConstraintAddress
      );
    });

    it("fails invalid oracle one address", async () => {
      await rejectParams(
        {
          ...baseIxParams,
          oracleOne: PublicKey.unique(),
        },
        /0x7d6/ // Constraint Seeds
      );
    });

    it("fails invalid oracle two address", async () => {
      await rejectParams(
        {
          ...baseIxParams,
          oracleTwo: PublicKey.unique(),
        },
        /0x7d6/ // Constraint Seeds
      );
    });

    it("fails invalid tick array one", async () => {
      await rejectParams(
        {
          ...baseIxParams,
          tickArrayOne0: PublicKey.unique(),
        },
        /0xbbf/ // AccountOwnedByWrongProgram
      );
      await rejectParams(
        {
          ...baseIxParams,
          tickArrayOne1: PublicKey.unique(),
        },
        /0xbbf/ // AccountOwnedByWrongProgram
      );
      await rejectParams(
        {
          ...baseIxParams,
          tickArrayOne2: PublicKey.unique(),
        },
        /0xbbf/ // AccountOwnedByWrongProgram
      );
    });

    it("fails invalid tick array two", async () => {
      await rejectParams(
        {
          ...baseIxParams,
          tickArrayTwo0: PublicKey.unique(),
        },
        /0xbbf/ // AccountOwnedByWrongProgram
      );
      await rejectParams(
        {
          ...baseIxParams,
          tickArrayTwo1: PublicKey.unique(),
        },
        /0xbbf/ // AccountOwnedByWrongProgram
      );
      await rejectParams(
        {
          ...baseIxParams,
          tickArrayTwo2: PublicKey.unique(),
        },
        /0xbbf/ // AccountOwnedByWrongProgram
      );
    });

    async function rejectParams(params: TwoHopSwapParams, error: assert.AssertPredicate) {
      await assert.rejects(
        toTx(ctx, ElysiumPoolIx.twoHopSwapIx(ctx.program, params)).buildAndExecute(),
        error
      );
    }
  });

  it("swaps [2] with two-hop swap, amountSpecifiedIsInput=true", async () => {
    const aquarium = (await buildTestAquariums(ctx, [aqConfig]))[0];
    const { tokenAccounts, mintKeys, pools } = aquarium;

    let tokenBalances = await getTokenBalances(tokenAccounts.map((acc) => acc.account));

    const tokenVaultBalances = await getTokenBalancesForVaults(pools);

    const poolOneKey = pools[0].poolPda.publicKey;
    const poolTwoKey = pools[1].poolPda.publicKey;
    let poolOne = await client.getPool(poolOneKey, IGNORE_CACHE);
    let poolTwo = await client.getPool(poolTwoKey, IGNORE_CACHE);

    const [inputToken, intermediaryToken, _outputToken] = mintKeys;

    const quote = await swapQuoteByInputToken(
      poolOne,
      inputToken,
      new BN(1000),
      Percentage.fromFraction(1, 100),
      ctx.program.programId,
      fetcher,
      IGNORE_CACHE
    );

    const quote2 = await swapQuoteByInputToken(
      poolTwo,
      intermediaryToken,
      quote.estimatedAmountOut,
      Percentage.fromFraction(1, 100),
      ctx.program.programId,
      fetcher,
      IGNORE_CACHE
    );

    const twoHopQuote = twoHopSwapQuoteFromSwapQuotes(quote, quote2);

    await toTx(
      ctx,
      ElysiumPoolIx.twoHopSwapIx(ctx.program, {
        ...twoHopQuote,
        ...getParamsFromPools([pools[0], pools[1]], tokenAccounts),
        tokenAuthority: ctx.wallet.publicKey,
      })
    ).buildAndExecute();

    assert.deepEqual(await getTokenBalancesForVaults(pools), [
      tokenVaultBalances[0].add(quote.estimatedAmountIn),
      tokenVaultBalances[1].sub(quote.estimatedAmountOut),
      tokenVaultBalances[2].add(quote2.estimatedAmountIn),
      tokenVaultBalances[3].sub(quote2.estimatedAmountOut),
    ]);

    const prevTbs = [...tokenBalances];
    tokenBalances = await getTokenBalances(tokenAccounts.map((acc) => acc.account));

    assert.deepEqual(tokenBalances, [
      prevTbs[0].sub(quote.estimatedAmountIn),
      prevTbs[1],
      prevTbs[2].add(quote2.estimatedAmountOut),
    ]);

    poolOne = await client.getPool(poolOneKey, IGNORE_CACHE);
    poolTwo = await client.getPool(poolTwoKey, IGNORE_CACHE);
  });

  it("swaps [2] with two-hop swap, amountSpecifiedIsInput=true, A->B->A", async () => {
    // Add another mint and update pool so there is no overlapping mint
    aqConfig.initFeeTierParams.push({ tickSpacing: TickSpacing.ThirtyTwo });
    aqConfig.initPoolParams[1] = {
      mintIndices: [0, 1],
      tickSpacing: TickSpacing.ThirtyTwo,
      feeTierIndex: 1,
    };
    aqConfig.initTickArrayRangeParams.push({
      poolIndex: 1,
      startTickIndex: 22528,
      arrayCount: 12,
      aToB: true,
    });
    aqConfig.initTickArrayRangeParams.push({
      poolIndex: 1,
      startTickIndex: 22528,
      arrayCount: 12,
      aToB: false,
    });

    const aquarium = (await buildTestAquariums(ctx, [aqConfig]))[0];
    const { tokenAccounts, mintKeys, pools } = aquarium;

    let tokenBalances = await getTokenBalances(tokenAccounts.map((acc) => acc.account));

    const tokenVaultBalances = await getTokenBalancesForVaults(pools);

    const poolOneKey = pools[0].poolPda.publicKey;
    const poolTwoKey = pools[1].poolPda.publicKey;
    let poolOne = await client.getPool(poolOneKey, IGNORE_CACHE);
    let poolTwo = await client.getPool(poolTwoKey, IGNORE_CACHE);

    const [tokenA, tokenB, _outputToken] = mintKeys;

    const quote = await swapQuoteByInputToken(
      poolOne,
      tokenA,
      new BN(1000),
      Percentage.fromFraction(1, 100),
      ctx.program.programId,
      fetcher,
      IGNORE_CACHE
    );

    const quote2 = await swapQuoteByInputToken(
      poolTwo,
      tokenB,
      quote.estimatedAmountOut,
      Percentage.fromFraction(1, 100),
      ctx.program.programId,
      fetcher,
      IGNORE_CACHE
    );

    const twoHopQuote = twoHopSwapQuoteFromSwapQuotes(quote, quote2);

    await toTx(
      ctx,
      ElysiumPoolIx.twoHopSwapIx(ctx.program, {
        ...twoHopQuote,
        ...getParamsFromPools([pools[0], pools[1]], tokenAccounts),
        tokenAuthority: ctx.wallet.publicKey,
      })
    ).buildAndExecute();

    assert.deepEqual(await getTokenBalancesForVaults(pools), [
      tokenVaultBalances[0].add(quote.estimatedAmountIn),
      tokenVaultBalances[1].sub(quote.estimatedAmountOut),
      tokenVaultBalances[2].sub(quote2.estimatedAmountOut),
      tokenVaultBalances[3].add(quote2.estimatedAmountIn),
    ]);

    const prevTbs = [...tokenBalances];
    tokenBalances = await getTokenBalances(tokenAccounts.map((acc) => acc.account));

    assert.deepEqual(tokenBalances, [
      prevTbs[0].sub(quote.estimatedAmountIn).add(quote2.estimatedAmountOut),
      prevTbs[1].add(quote.estimatedAmountOut).sub(quote2.estimatedAmountIn),
      prevTbs[2],
    ]);
  });

  it("fails swaps [2] with top-hop swap, amountSpecifiedIsInput=true, slippage", async () => {
    const aquarium = (await buildTestAquariums(ctx, [aqConfig]))[0];
    const { tokenAccounts, mintKeys, pools } = aquarium;

    const poolOneKey = pools[0].poolPda.publicKey;
    const poolTwoKey = pools[1].poolPda.publicKey;
    const poolOne = await client.getPool(poolOneKey, IGNORE_CACHE);
    const poolTwo = await client.getPool(poolTwoKey, IGNORE_CACHE);

    const [inputToken, intermediaryToken, _outputToken] = mintKeys;

    const quote = await swapQuoteByInputToken(
      poolOne,
      inputToken,
      new BN(1000),
      Percentage.fromFraction(1, 100),
      ctx.program.programId,
      fetcher,
      IGNORE_CACHE
    );

    const quote2 = await swapQuoteByInputToken(
      poolTwo,
      intermediaryToken,
      quote.estimatedAmountOut,
      Percentage.fromFraction(1, 100),
      ctx.program.programId,
      fetcher,
      IGNORE_CACHE
    );

    const twoHopQuote = twoHopSwapQuoteFromSwapQuotes(quote, quote2);

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.twoHopSwapIx(ctx.program, {
          ...twoHopQuote,
          ...getParamsFromPools([pools[0], pools[1]], tokenAccounts),
          otherAmountThreshold: new BN(613309),
          tokenAuthority: ctx.wallet.publicKey,
        })
      ).buildAndExecute(),
      /0x1794/ // Above Out Below Minimum
    );
  });

  it("swaps [2] with two-hop swap, amountSpecifiedIsInput=false", async () => {
    const aquarium = (await buildTestAquariums(ctx, [aqConfig]))[0];
    const { tokenAccounts, mintKeys, pools } = aquarium;

    const preSwapBalances = await getTokenBalances(tokenAccounts.map((acc) => acc.account));
    const tokenVaultBalances = await getTokenBalancesForVaults(pools);

    const poolOneKey = pools[0].poolPda.publicKey;
    const poolTwoKey = pools[1].poolPda.publicKey;
    const poolOne = await client.getPool(poolOneKey, IGNORE_CACHE);
    const poolTwo = await client.getPool(poolTwoKey, IGNORE_CACHE);

    const [_inputToken, intermediaryToken, outputToken] = mintKeys;

    const quote2 = await swapQuoteByOutputToken(
      poolTwo,
      outputToken,
      new BN(1000),
      Percentage.fromFraction(1, 100),
      ctx.program.programId,
      fetcher,
      IGNORE_CACHE
    );

    const quote = await swapQuoteByOutputToken(
      poolOne,
      intermediaryToken,
      quote2.estimatedAmountIn,
      Percentage.fromFraction(1, 100),
      ctx.program.programId,
      fetcher,
      IGNORE_CACHE
    );

    const twoHopQuote = twoHopSwapQuoteFromSwapQuotes(quote, quote2);

    await toTx(
      ctx,
      ElysiumPoolIx.twoHopSwapIx(ctx.program, {
        ...twoHopQuote,
        ...getParamsFromPools([pools[0], pools[1]], tokenAccounts),
        tokenAuthority: ctx.wallet.publicKey,
      })
    ).buildAndExecute();

    assert.deepEqual(await getTokenBalancesForVaults(pools), [
      tokenVaultBalances[0].add(quote.estimatedAmountIn),
      tokenVaultBalances[1].sub(quote.estimatedAmountOut),
      tokenVaultBalances[2].add(quote2.estimatedAmountIn),
      tokenVaultBalances[3].sub(quote2.estimatedAmountOut),
    ]);

    assert.deepEqual(await getTokenBalances(tokenAccounts.map((acc) => acc.account)), [
      preSwapBalances[0].sub(quote.estimatedAmountIn),
      preSwapBalances[1],
      preSwapBalances[2].add(quote2.estimatedAmountOut),
    ]);
  });

  it("fails swaps [2] with two-hop swap, amountSpecifiedIsInput=false slippage", async () => {
    const aquarium = (await buildTestAquariums(ctx, [aqConfig]))[0];
    const { tokenAccounts, mintKeys, pools } = aquarium;

    const preSwapBalances = await getTokenBalances(tokenAccounts.map((acc) => acc.account));
    const tokenVaultBalances = await getTokenBalancesForVaults(pools);

    const poolOneKey = pools[0].poolPda.publicKey;
    const poolTwoKey = pools[1].poolPda.publicKey;
    const poolOne = await client.getPool(poolOneKey, IGNORE_CACHE);
    const poolTwo = await client.getPool(poolTwoKey, IGNORE_CACHE);

    const [_inputToken, intermediaryToken, outputToken] = mintKeys;

    const quote2 = await swapQuoteByOutputToken(
      poolTwo,
      outputToken,
      new BN(1000),
      Percentage.fromFraction(1, 100),
      ctx.program.programId,
      fetcher,
      IGNORE_CACHE
    );

    const quote = await swapQuoteByOutputToken(
      poolOne,
      intermediaryToken,
      quote2.estimatedAmountIn,
      Percentage.fromFraction(1, 100),
      ctx.program.programId,
      fetcher,
      IGNORE_CACHE
    );

    const twoHopQuote = twoHopSwapQuoteFromSwapQuotes(quote, quote2);

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.twoHopSwapIx(ctx.program, {
          ...twoHopQuote,
          ...getParamsFromPools([pools[0], pools[1]], tokenAccounts),
          otherAmountThreshold: new BN(2),
          tokenAuthority: ctx.wallet.publicKey,
        })
      ).buildAndExecute(),
      /0x1795/ // Above In Above Maximum
    );
  });

  it("fails swaps [2] with two-hop swap, no overlapping mints", async () => {
    // Add another mint and update pool so there is no overlapping mint
    aqConfig.initMintParams.push({});
    aqConfig.initTokenAccParams.push({ mintIndex: 3 });
    aqConfig.initPoolParams[1].mintIndices = [2, 3];
    const aquarium = (await buildTestAquariums(ctx, [aqConfig]))[0];
    const { tokenAccounts, mintKeys, pools } = aquarium;

    const poolOneKey = pools[0].poolPda.publicKey;
    const poolTwoKey = pools[1].poolPda.publicKey;
    const poolOne = await client.getPool(poolOneKey, IGNORE_CACHE);
    const poolTwo = await client.getPool(poolTwoKey, IGNORE_CACHE);

    const [_inputToken, intermediaryToken, outputToken] = mintKeys;

    const quote2 = await swapQuoteByOutputToken(
      poolTwo,
      outputToken,
      new BN(1000),
      Percentage.fromFraction(1, 100),
      ctx.program.programId,
      fetcher,
      IGNORE_CACHE
    );

    const quote = await swapQuoteByOutputToken(
      poolOne,
      intermediaryToken,
      quote2.estimatedAmountIn,
      Percentage.fromFraction(1, 100),
      ctx.program.programId,
      fetcher,
      IGNORE_CACHE
    );

    const twoHopQuote = twoHopSwapQuoteFromSwapQuotes(quote, quote2);

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.twoHopSwapIx(ctx.program, {
          ...twoHopQuote,
          ...getParamsFromPools([pools[0], pools[1]], tokenAccounts),
          tokenAuthority: ctx.wallet.publicKey,
        })
      ).buildAndExecute(),
      /0x1799/ // Invalid intermediary mint
    );
  });

  it("swaps [2] with two-hop swap, amount_specified_is_input=true, first swap price limit", async () => {
    const aquarium = (await buildTestAquariums(ctx, [aqConfig]))[0];
    const { tokenAccounts, mintKeys, pools } = aquarium;

    const poolOneKey = pools[0].poolPda.publicKey;
    const poolTwoKey = pools[1].poolPda.publicKey;
    let poolOne = await client.getPool(poolOneKey, IGNORE_CACHE);
    let poolTwo = await client.getPool(poolTwoKey, IGNORE_CACHE);

    const [inputToken, intermediaryToken, _outputToken] = mintKeys;

    const quote = await swapQuoteByInputToken(
      poolOne,
      inputToken,
      new BN(1000),
      Percentage.fromFraction(0, 100),
      ctx.program.programId,
      fetcher,
      IGNORE_CACHE
    );

    const quote2 = await swapQuoteByInputToken(
      poolTwo,
      intermediaryToken,
      quote.estimatedAmountOut,
      Percentage.fromFraction(1, 100),
      ctx.program.programId,
      fetcher,
      IGNORE_CACHE
    );

    // Set a price limit that is less than the 1% slippage threshold,
    // which will allow the swap to go through
    quote.sqrtPriceLimit = quote.estimatedEndSqrtPrice.add(
      poolOne
        .getData()
        .sqrtPrice.sub(quote.estimatedEndSqrtPrice)
        .mul(new anchor.BN("5"))
        .div(new anchor.BN("1000"))
    );

    const twoHopQuote = twoHopSwapQuoteFromSwapQuotes(quote, quote2);

    await toTx(
      ctx,
      ElysiumPoolIx.twoHopSwapIx(ctx.program, {
        ...twoHopQuote,
        ...getParamsFromPools([pools[0], pools[1]], tokenAccounts),
        tokenAuthority: ctx.wallet.publicKey,
      })
    ).buildAndExecute();

    poolOne = await client.getPool(poolOneKey, IGNORE_CACHE);
    poolTwo = await client.getPool(poolTwoKey, IGNORE_CACHE);

    assert.equal(poolOne.getData().sqrtPrice.eq(quote.sqrtPriceLimit), true);
  });

  it("swaps [2] with two-hop swap, amount_specified_is_input=true, second swap price limit", async () => {
    const aquarium = (await buildTestAquariums(ctx, [aqConfig]))[0];
    const { tokenAccounts, mintKeys, pools } = aquarium;

    const poolOneKey = pools[0].poolPda.publicKey;
    const poolTwoKey = pools[1].poolPda.publicKey;
    let poolOne = await client.getPool(poolOneKey, IGNORE_CACHE);
    let poolTwo = await client.getPool(poolTwoKey, IGNORE_CACHE);

    const [inputToken, intermediaryToken, _outputToken] = mintKeys;

    const quote = await swapQuoteByInputToken(
      poolOne,
      inputToken,
      new BN(1000),
      Percentage.fromFraction(0, 100),
      ctx.program.programId,
      fetcher,
      IGNORE_CACHE
    );

    const quote2 = await swapQuoteByInputToken(
      poolTwo,
      intermediaryToken,
      quote.estimatedAmountOut,
      Percentage.fromFraction(1, 100),
      ctx.program.programId,
      fetcher,
      IGNORE_CACHE
    );

    // Set a price limit that is less than the 1% slippage threshold,
    // which will allow the swap to go through
    quote2.sqrtPriceLimit = quote2.estimatedEndSqrtPrice.add(
      poolTwo
        .getData()
        .sqrtPrice.sub(quote2.estimatedEndSqrtPrice)
        .mul(new anchor.BN("5"))
        .div(new anchor.BN("1000"))
    );

    const twoHopQuote = twoHopSwapQuoteFromSwapQuotes(quote, quote2);

    await toTx(
      ctx,
      ElysiumPoolIx.twoHopSwapIx(ctx.program, {
        ...twoHopQuote,
        ...getParamsFromPools([pools[0], pools[1]], tokenAccounts),
        tokenAuthority: ctx.wallet.publicKey,
      })
    ).buildAndExecute();

    poolOne = await client.getPool(poolOneKey, IGNORE_CACHE);
    poolTwo = await client.getPool(poolTwoKey, IGNORE_CACHE);

    assert.equal(poolTwo.getData().sqrtPrice.eq(quote2.sqrtPriceLimit), true);
  });

  it("fails swaps [2] with two-hop swap, amount_specified_is_input=true, first swap price limit", async () => {
    const aquarium = (await buildTestAquariums(ctx, [aqConfig]))[0];
    const { tokenAccounts, mintKeys, pools } = aquarium;

    const poolOneKey = pools[0].poolPda.publicKey;
    const poolTwoKey = pools[1].poolPda.publicKey;
    let poolOne = await client.getPool(poolOneKey, IGNORE_CACHE);
    let poolTwo = await client.getPool(poolTwoKey, IGNORE_CACHE);

    const [inputToken, intermediaryToken, _outputToken] = mintKeys;

    const quote = await swapQuoteByInputToken(
      poolOne,
      inputToken,
      new BN(1000),
      Percentage.fromFraction(0, 100),
      ctx.program.programId,
      fetcher,
      IGNORE_CACHE
    );

    const quote2 = await swapQuoteByInputToken(
      poolTwo,
      intermediaryToken,
      quote.estimatedAmountOut,
      Percentage.fromFraction(1, 100),
      ctx.program.programId,
      fetcher,
      IGNORE_CACHE
    );

    // Set a price limit that is less than the 1% slippage threshold,
    // which will allow the swap to go through
    quote.sqrtPriceLimit = quote.estimatedEndSqrtPrice.add(
      poolOne
        .getData()
        .sqrtPrice.sub(quote.estimatedEndSqrtPrice)
        .mul(new anchor.BN("15"))
        .div(new anchor.BN("1000"))
    );

    const twoHopQuote = twoHopSwapQuoteFromSwapQuotes(quote, quote2);

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.twoHopSwapIx(ctx.program, {
          ...twoHopQuote,
          ...getParamsFromPools([pools[0], pools[1]], tokenAccounts),
          tokenAuthority: ctx.wallet.publicKey,
        })
      ).buildAndExecute()
    );
  });

  it("fails swaps [2] with two-hop swap, amount_specified_is_input=true, second swap price limit", async () => {
    const aquarium = (await buildTestAquariums(ctx, [aqConfig]))[0];
    const { tokenAccounts, mintKeys, pools } = aquarium;

    const poolOneKey = pools[0].poolPda.publicKey;
    const poolTwoKey = pools[1].poolPda.publicKey;
    let poolOne = await client.getPool(poolOneKey, IGNORE_CACHE);
    let poolTwo = await client.getPool(poolTwoKey, IGNORE_CACHE);

    const [inputToken, intermediaryToken, _outputToken] = mintKeys;

    const quote = await swapQuoteByInputToken(
      poolOne,
      inputToken,
      new BN(1000),
      Percentage.fromFraction(0, 100),
      ctx.program.programId,
      fetcher,
      IGNORE_CACHE
    );

    const quote2 = await swapQuoteByInputToken(
      poolTwo,
      intermediaryToken,
      quote.estimatedAmountOut,
      Percentage.fromFraction(1, 100),
      ctx.program.programId,
      fetcher,
      IGNORE_CACHE
    );

    // Set a price limit that is greater than the 1% slippage threshold,
    // which will cause the swap to fail
    quote2.sqrtPriceLimit = quote2.estimatedEndSqrtPrice.add(
      poolTwo
        .getData()
        .sqrtPrice.sub(quote2.estimatedEndSqrtPrice)
        .mul(new anchor.BN("15"))
        .div(new anchor.BN("1000"))
    );

    const twoHopQuote = twoHopSwapQuoteFromSwapQuotes(quote, quote2);

    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.twoHopSwapIx(ctx.program, {
          ...twoHopQuote,
          ...getParamsFromPools([pools[0], pools[1]], tokenAccounts),
          tokenAuthority: ctx.wallet.publicKey,
        })
      ).buildAndExecute()
    );
  });

  function getParamsFromPools(
    pools: [InitPoolParams, InitPoolParams],
    tokenAccounts: { mint: PublicKey; account: PublicKey }[]
  ) {
    const tokenAccKeys = getTokenAccsForPools(pools, tokenAccounts);

    const poolOne = pools[0].poolPda.publicKey;
    const poolTwo = pools[1].poolPda.publicKey;
    const oracleOne = PDAUtil.getOracle(ctx.program.programId, poolOne).publicKey;
    const oracleTwo = PDAUtil.getOracle(ctx.program.programId, poolTwo).publicKey;
    return {
      poolOne: pools[0].poolPda.publicKey,
      poolTwo: pools[1].poolPda.publicKey,
      tokenOwnerAccountOneA: tokenAccKeys[0],
      tokenVaultOneA: pools[0].tokenVaultAKeypair.publicKey,
      tokenOwnerAccountOneB: tokenAccKeys[1],
      tokenVaultOneB: pools[0].tokenVaultBKeypair.publicKey,
      tokenOwnerAccountTwoA: tokenAccKeys[2],
      tokenVaultTwoA: pools[1].tokenVaultAKeypair.publicKey,
      tokenOwnerAccountTwoB: tokenAccKeys[3],
      tokenVaultTwoB: pools[1].tokenVaultBKeypair.publicKey,
      oracleOne,
      oracleTwo,
    };
  }

  async function getTokenBalancesForVaults(pools: InitPoolParams[]) {
    const accs = [];
    for (const pool of pools) {
      accs.push(pool.tokenVaultAKeypair.publicKey);
      accs.push(pool.tokenVaultBKeypair.publicKey);
    }
    return getTokenBalances(accs);
  }

  async function getTokenBalances(keys: PublicKey[]) {
    return Promise.all(
      keys.map(async (key) => new anchor.BN(await getTokenBalance(provider, key)))
    );
  }
});
