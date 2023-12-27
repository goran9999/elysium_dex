import { BorshAccountsCoder, Idl } from "@coral-xyz/anchor";
import { ParsableEntity, staticImplements } from "@orca-so/common-sdk";
import { AccountInfo, PublicKey } from "@solana/web3.js";
import * as ElysiumPoolIDL from "../../artifacts/pool.json";
import {
  AccountName,
  FeeTierData,
  PositionBundleData,
  PositionData,
  TickArrayData,
  ElysiumPoolData,
  ElysiumPoolsConfigData,
} from "../../types/public";

/**
 * @category Network
 */
@staticImplements<ParsableEntity<ElysiumPoolsConfigData>>()
export class ParsableElysiumPoolsConfig {
  private constructor() {}

  public static parse(
    address: PublicKey,
    accountData: AccountInfo<Buffer> | undefined | null
  ): ElysiumPoolsConfigData | null {
    if (!accountData?.data) {
      return null;
    }

    try {
      return parseAnchorAccount(AccountName.ElysiumPoolsConfig, accountData);
    } catch (e) {
      console.error(`error while parsing ElysiumPoolsConfig: ${e}`);
      return null;
    }
  }
}

/**
 * @category Network
 */
@staticImplements<ParsableEntity<ElysiumPoolData>>()
export class ParsableElysiumPool {
  private constructor() {}

  public static parse(
    address: PublicKey,
    accountData: AccountInfo<Buffer> | undefined | null
  ): ElysiumPoolData | null {
    if (!accountData?.data) {
      return null;
    }

    try {
      return parseAnchorAccount(AccountName.ElysiumPool, accountData);
    } catch (e) {
      console.error(`error while parsing ElysiumPool: ${e}`);
      return null;
    }
  }
}

/**
 * @category Network
 */
@staticImplements<ParsableEntity<PositionData>>()
export class ParsablePosition {
  private constructor() {}

  public static parse(
    address: PublicKey,
    accountData: AccountInfo<Buffer> | undefined | null
  ): PositionData | null {
    if (!accountData?.data) {
      return null;
    }

    try {
      return parseAnchorAccount(AccountName.Position, accountData);
    } catch (e) {
      console.error(`error while parsing Position: ${e}`);
      return null;
    }
  }
}

/**
 * @category Network
 */
@staticImplements<ParsableEntity<TickArrayData>>()
export class ParsableTickArray {
  private constructor() {}

  public static parse(
    address: PublicKey,
    accountData: AccountInfo<Buffer> | undefined | null
  ): TickArrayData | null {
    if (!accountData?.data) {
      return null;
    }

    try {
      return parseAnchorAccount(AccountName.TickArray, accountData);
    } catch (e) {
      console.error(`error while parsing TickArray: ${e}`);
      return null;
    }
  }
}

/**
 * @category Network
 */
@staticImplements<ParsableEntity<FeeTierData>>()
export class ParsableFeeTier {
  private constructor() {}

  public static parse(
    address: PublicKey,
    accountData: AccountInfo<Buffer> | undefined | null
  ): FeeTierData | null {
    if (!accountData?.data) {
      return null;
    }

    try {
      return parseAnchorAccount(AccountName.FeeTier, accountData);
    } catch (e) {
      console.error(`error while parsing FeeTier: ${e}`);
      return null;
    }
  }
}

/**
 * @category Network
 */
@staticImplements<ParsableEntity<PositionBundleData>>()
export class ParsablePositionBundle {
  private constructor() {}

  public static parse(
    address: PublicKey,
    accountData: AccountInfo<Buffer> | undefined | null
  ): PositionBundleData | null {
    if (!accountData?.data) {
      return null;
    }

    try {
      return parseAnchorAccount(AccountName.PositionBundle, accountData);
    } catch (e) {
      console.error(`error while parsing PositionBundle: ${e}`);
      return null;
    }
  }
}

const ElysiumPoolCoder = new BorshAccountsCoder(ElysiumPoolIDL as Idl);

function parseAnchorAccount(accountName: AccountName, accountData: AccountInfo<Buffer>) {
  const data = accountData.data;
  const discriminator = BorshAccountsCoder.accountDiscriminator(accountName);
  if (discriminator.compare(data.slice(0, 8))) {
    console.error("incorrect account name during parsing");
    return null;
  }

  try {
    return ElysiumPoolCoder.decode(accountName, data);
  } catch (_e) {
    console.error("unknown account name during parsing");
    return null;
  }
}
