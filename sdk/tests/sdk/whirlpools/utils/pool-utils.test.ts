import * as assert from "assert";
import { TokenType, PoolUtil } from "../../../../src";
import { testElysiumPoolData } from "../../../utils/testDataTypes";
import { Keypair } from "@solana/web3.js";

describe("PoolUtils tests", () => {
  describe("getTokenType", () => {
    it("Token is tokenA", async () => {
      const poolData = testElysiumPoolData;
      const result = PoolUtil.getTokenType(poolData, poolData.tokenMintA);
      assert.equal(result, TokenType.TokenA);
    });

    it("Token is tokenB", async () => {
      const poolData = testElysiumPoolData;
      const result = PoolUtil.getTokenType(poolData, poolData.tokenMintB);
      assert.equal(result, TokenType.TokenB);
    });

    it("Token is some other token", async () => {
      const poolData = testElysiumPoolData;
      const result = PoolUtil.getTokenType(poolData, Keypair.generate().publicKey);
      assert.ok(result === undefined);
    });
  });
});
