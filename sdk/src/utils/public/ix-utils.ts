import { Instruction, TransactionBuilder } from "@orca-so/common-sdk";
import { ElysiumPoolContext } from "../../context";

export function toTx(ctx: ElysiumPoolContext, ix: Instruction): TransactionBuilder {
  return new TransactionBuilder(
    ctx.provider.connection,
    ctx.provider.wallet,
    ctx.txBuilderOpts
  ).addInstruction(ix);
}
