import * as anchor from "@coral-xyz/anchor";
import * as assert from "assert";
import {
  InitConfigParams,
  toTx,
  ElysiumPoolContext,
  ElysiumPoolIx,
  ElysiumPoolsConfigData,
} from "../../src";
import { ONE_SOL, systemTransferTx } from "../utils";
import { defaultConfirmOptions } from "../utils/const";
import { generateDefaultConfigParams } from "../utils/test-builders";

describe("initialize_config", () => {
  const provider = anchor.AnchorProvider.local(undefined, defaultConfirmOptions);

  const program = anchor.workspace.ElysiumPool;
  const ctx = ElysiumPoolContext.fromWorkspace(provider, program);
  const fetcher = ctx.fetcher;

  let initializedConfigInfo: InitConfigParams;

  it("successfully init a ElysiumPoolsConfig account", async () => {
    const { configInitInfo } = generateDefaultConfigParams(ctx);
    await toTx(
      ctx,
      ElysiumPoolIx.initializeConfigIx(ctx.program, configInitInfo)
    ).buildAndExecute();

    const configAccount = (await fetcher.getConfig(
      configInitInfo.poolsConfigKeypair.publicKey
    )) as ElysiumPoolsConfigData;

    assert.ok(
      configAccount.collectProtocolFeesAuthority.equals(configInitInfo.collectProtocolFeesAuthority)
    );

    assert.ok(configAccount.feeAuthority.equals(configInitInfo.feeAuthority));

    assert.ok(
      configAccount.rewardEmissionsSuperAuthority.equals(
        configInitInfo.rewardEmissionsSuperAuthority
      )
    );

    assert.equal(configAccount.defaultProtocolFeeRate, configInitInfo.defaultProtocolFeeRate);

    initializedConfigInfo = configInitInfo;
  });

  it("fail on passing in already initialized pool account", async () => {
    let infoWithDupeConfigKey = {
      ...generateDefaultConfigParams(ctx).configInitInfo,
      poolsConfigKeypair: initializedConfigInfo.poolsConfigKeypair,
    };
    await assert.rejects(
      toTx(
        ctx,
        ElysiumPoolIx.initializeConfigIx(ctx.program, infoWithDupeConfigKey)
      ).buildAndExecute(),
      /0x0/
    );
  });

  it("succeeds when funder is different than account paying for transaction fee", async () => {
    const funderKeypair = anchor.web3.Keypair.generate();
    await systemTransferTx(provider, funderKeypair.publicKey, ONE_SOL).buildAndExecute();
    const { configInitInfo } = generateDefaultConfigParams(ctx, funderKeypair.publicKey);
    await toTx(ctx, ElysiumPoolIx.initializeConfigIx(ctx.program, configInitInfo))
      .addSigner(funderKeypair)
      .buildAndExecute();
  });
});
