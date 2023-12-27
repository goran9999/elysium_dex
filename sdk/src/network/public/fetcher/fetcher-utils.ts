import { Address, AddressUtil } from "@orca-so/common-sdk";
import { Connection } from "@solana/web3.js";
import invariant from "tiny-invariant";
import {
  AccountName,
  WHIRLPOOL_CODER,
  ElysiumPoolData,
  getAccountSize,
} from "../../../types/public";
import { ParsableElysiumPool } from "../parsing";

/**
 * Retrieve a list of pool addresses and accounts filtered by the given params using
 * getProgramAccounts.
 * @category Network
 *
 * @param connection The connection to use to fetch accounts
 * @param programId The ElysiumPool program to search ElysiumPool accounts for
 * @param configId The {@link ElysiumPoolConfig} account program address to filter by
 * @returns tuple of pool addresses and accounts
 */
export async function getAllElysiumPoolAccountsForConfig({
  connection,
  programId,
  configId,
}: {
  connection: Connection;
  programId: Address;
  configId: Address;
}): Promise<ReadonlyMap<string, ElysiumPoolData>> {
  const filters = [
    { dataSize: getAccountSize(AccountName.ElysiumPool) },
    {
      memcmp: WHIRLPOOL_CODER.memcmp(
        AccountName.ElysiumPool,
        AddressUtil.toPubKey(configId).toBuffer()
      ),
    },
  ];

  const accounts = await connection.getProgramAccounts(AddressUtil.toPubKey(programId), {
    filters,
  });

  const parsedAccounts: [string, ElysiumPoolData][] = [];
  accounts.forEach(({ pubkey, account }) => {
    const parsedAccount = ParsableElysiumPool.parse(pubkey, account);
    invariant(!!parsedAccount, `could not parse pool: ${pubkey.toBase58()}`);
    parsedAccounts.push([AddressUtil.toString(pubkey), parsedAccount]);
  });

  return new Map(parsedAccounts.map(([address, pool]) => [AddressUtil.toString(address), pool]));
}
