import * as anchor from "@coral-xyz/anchor";
import * as assert from "assert";
import { toTx, ElysiumPoolIx } from "../../../src";
import { ElysiumPoolContext } from "../../../src/context";
import { TickSpacing } from "../../utils";
import { defaultConfirmOptions } from "../../utils/const";
import { initTestPool, openPosition } from "../../utils/init-utils";
import { generateDefaultOpenPositionParams } from "../../utils/test-builders";

describe("position management tests", () => {
  const provider = anchor.AnchorProvider.local(undefined, defaultConfirmOptions);

  const program = anchor.workspace.ElysiumPool;
  const ctx = ElysiumPoolContext.fromWorkspace(provider, program);
  const fetcher = ctx.fetcher;

  it("successfully closes and opens a position in one transaction", async () => {
    const { poolInitInfo } = await initTestPool(ctx, TickSpacing.Standard);

    const { params } = await openPosition(ctx, poolInitInfo.poolPda.publicKey, 0, 128);
    const receiverKeypair = anchor.web3.Keypair.generate();

    const { params: newParams, mint } = await generateDefaultOpenPositionParams(
      ctx,
      poolInitInfo.poolPda.publicKey,
      0,
      128,
      ctx.wallet.publicKey,
      ctx.wallet.publicKey
    );

    await toTx(
      ctx,
      ElysiumPoolIx.closePositionIx(ctx.program, {
        positionAuthority: provider.wallet.publicKey,
        receiver: receiverKeypair.publicKey,
        position: params.positionPda.publicKey,
        positionMint: params.positionMintAddress,
        positionTokenAccount: params.positionTokenAccount,
      })
    )
      .addInstruction(ElysiumPoolIx.openPositionIx(ctx.program, newParams))
      .addSigner(mint)
      .buildAndExecute();

    const closedResponse = await provider.connection.getTokenSupply(params.positionMintAddress);
    assert.equal(closedResponse.value.uiAmount, 0);
    const openResponse = await provider.connection.getTokenSupply(newParams.positionMintAddress);
    assert.equal(openResponse.value.uiAmount, 1);
  });
});
