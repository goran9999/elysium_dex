import { BN } from "@coral-xyz/anchor";
import { NATIVE_MINT } from "@solana/spl-token";
import { Keypair, PublicKey } from "@solana/web3.js";
import { TickSpacing, ZERO_BN } from ".";
import { InitConfigParams, InitPoolParams, TickUtil, ElysiumPoolContext } from "../../src";
import {
  FundedPositionInfo,
  FundedPositionParams,
  fundPositions,
  initRewardAndSetEmissions,
  initTestPoolWithTokens,
  initTickArray,
} from "./init-utils";

interface InitFixtureParams {
  tickSpacing: number;
  initialSqrtPrice?: BN;
  positions?: FundedPositionParams[];
  rewards?: RewardParam[];
  tokenAIsNative?: boolean;
}

interface RewardParam {
  emissionsPerSecondX64: BN;
  vaultAmount: BN;
}

interface InitializedRewardInfo {
  rewardMint: PublicKey;
  rewardVaultKeypair: Keypair;
}

export class ElysiumPoolTestFixture {
  private ctx: ElysiumPoolContext;
  private poolInitInfo: InitPoolParams = defaultPoolInitInfo;
  private configInitInfo: InitConfigParams = defaultConfigInitInfo;
  private configKeypairs = defaultConfigKeypairs;
  private positions: FundedPositionInfo[] = [];
  private rewards: InitializedRewardInfo[] = [];
  private tokenAccountA = PublicKey.default;
  private tokenAccountB = PublicKey.default;
  private initialized = false;

  constructor(ctx: ElysiumPoolContext) {
    this.ctx = ctx;
  }

  async init(params: InitFixtureParams): Promise<ElysiumPoolTestFixture> {
    const { tickSpacing, initialSqrtPrice, positions, rewards, tokenAIsNative } = params;

    const { poolInitInfo, configInitInfo, configKeypairs, tokenAccountA, tokenAccountB } =
      await initTestPoolWithTokens(
        this.ctx,
        tickSpacing,
        initialSqrtPrice,
        undefined,
        tokenAIsNative ? NATIVE_MINT : undefined
      );

    this.poolInitInfo = poolInitInfo;
    this.configInitInfo = configInitInfo;
    this.configKeypairs = configKeypairs;
    this.tokenAccountA = tokenAccountA;
    this.tokenAccountB = tokenAccountB;

    if (positions) {
      await initTickArrays(this.ctx, poolInitInfo, positions);

      this.positions = await fundPositions(
        this.ctx,
        poolInitInfo,
        tokenAccountA,
        tokenAccountB,
        positions
      );
    }

    if (rewards) {
      const initRewards: InitializedRewardInfo[] = [];
      for (let i = 0; i < rewards.length; i++) {
        // Iterate because we enforce sequential initialization on the smart contract
        initRewards.push(
          await initRewardAndSetEmissions(
            this.ctx,
            configKeypairs.rewardEmissionsSuperAuthorityKeypair,
            poolInitInfo.poolPda.publicKey,
            i,
            rewards[i].vaultAmount,
            rewards[i].emissionsPerSecondX64
          )
        );
      }
      this.rewards = initRewards;
    }
    this.initialized = true;
    return this;
  }

  getInfos() {
    if (!this.initialized) {
      throw new Error("Test fixture is not initialized");
    }
    return {
      poolInitInfo: this.poolInitInfo,
      configInitInfo: this.configInitInfo,
      configKeypairs: this.configKeypairs,
      tokenAccountA: this.tokenAccountA,
      tokenAccountB: this.tokenAccountB,
      positions: this.positions,
      rewards: this.rewards,
    };
  }
}

async function initTickArrays(
  ctx: ElysiumPoolContext,
  poolInitInfo: InitPoolParams,
  positions: FundedPositionParams[]
) {
  const startTickSet = new Set<number>();
  positions.forEach((p) => {
    startTickSet.add(TickUtil.getStartTickIndex(p.tickLowerIndex, poolInitInfo.tickSpacing));
    startTickSet.add(TickUtil.getStartTickIndex(p.tickUpperIndex, poolInitInfo.tickSpacing));
  });

  return Promise.all(
    Array.from(startTickSet).map((startTick) =>
      initTickArray(ctx, poolInitInfo.poolPda.publicKey, startTick)
    )
  );
}

const defaultPoolInitInfo: InitPoolParams = {
  initSqrtPrice: ZERO_BN,
  poolsConfig: PublicKey.default,
  tokenMintA: PublicKey.default,
  tokenMintB: PublicKey.default,
  poolPda: { publicKey: PublicKey.default, bump: 0 },
  tokenVaultAKeypair: Keypair.generate(),
  tokenVaultBKeypair: Keypair.generate(),
  tickSpacing: TickSpacing.Standard,
  feeTierKey: PublicKey.default,
  funder: PublicKey.default,
};

const defaultConfigInitInfo = {
  poolsConfigKeypair: Keypair.generate(),
  feeAuthority: PublicKey.default,
  collectProtocolFeesAuthority: PublicKey.default,
  rewardEmissionsSuperAuthority: PublicKey.default,
  defaultProtocolFeeRate: 0,
  funder: PublicKey.default,
};

const defaultConfigKeypairs = {
  feeAuthorityKeypair: Keypair.generate(),
  collectProtocolFeesAuthorityKeypair: Keypair.generate(),
  rewardEmissionsSuperAuthorityKeypair: Keypair.generate(),
};
