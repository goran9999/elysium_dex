import { Address } from "@coral-xyz/anchor";
import { ElysiumPoolRouter } from ".";
import { ElysiumPoolContext } from "../..";
import { PoolGraph, PoolGraphBuilder } from "../../utils/public";
import { ElysiumPoolRouterImpl } from "../router-impl";

/**
 * Builder to build instances of the {@link ElysiumPoolRouter}
 * @category Router
 */
export class ElysiumPoolRouterBuilder {
  /**
   * Builds a {@link ElysiumPoolRouter} with a prebuilt {@link PoolGraph}
   *
   * @param ctx A {@link ElysiumPoolContext} for the current execution environment
   * @param graph A {@link PoolGraph} that represents the connections between all pools.
   * @returns A {@link ElysiumPoolRouter} that can be used to find routes and execute swaps
   */
  static buildWithPoolGraph(ctx: ElysiumPoolContext, graph: PoolGraph): ElysiumPoolRouter {
    return new ElysiumPoolRouterImpl(ctx, graph);
  }

  /**
   * Fetch and builds a {@link ElysiumPoolRouter} with a list of pool addresses.
   * @param ctx A {@link ElysiumPoolContext} for the current execution environment
   * @param pools A list of {@link Address}es that the router will find routes through.
   * @returns A {@link ElysiumPoolRouter} that can be used to find routes and execute swaps
   */
  static async buildWithPools(
    ctx: ElysiumPoolContext,
    pools: Address[]
  ): Promise<ElysiumPoolRouter> {
    const poolGraph = await PoolGraphBuilder.buildPoolGraphWithFetch(pools, ctx.fetcher);
    return new ElysiumPoolRouterImpl(ctx, poolGraph);
  }
}
