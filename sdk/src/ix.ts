import { Program } from "@coral-xyz/anchor";
import { PDA } from "@orca-so/common-sdk";
import { ElysiumPool } from "./artifacts/whirlpool";
import * as ix from "./instructions";

/**
 * Instruction builders for the ElysiumPools program.
 *
 * @category Core
 */
export class ElysiumPoolIx {
  /**
   * Initializes a ElysiumPoolsConfig account that hosts info & authorities
   * required to govern a set of ElysiumPools.
   *
   * @param program - program object containing services required to generate the instruction
   * @param params - InitConfigParams object
   * @returns - Instruction to perform the action.
   */
  public static initializeConfigIx(program: Program<ElysiumPool>, params: ix.InitConfigParams) {
    return ix.initializeConfigIx(program, params);
  }

  /**
   * Initializes a fee tier account usable by ElysiumPools in this ElysiumPoolsConfig space.
   *
   *  Special Errors
   * `FeeRateMaxExceeded` - If the provided default_fee_rate exceeds MAX_FEE_RATE.
   *
   * @param program - program object containing services required to generate the instruction
   * @param params - InitFeeTierParams object
   * @returns - Instruction to perform the action.
   */
  public static initializeFeeTierIx(program: Program<ElysiumPool>, params: ix.InitFeeTierParams) {
    return ix.initializeFeeTierIx(program, params);
  }

  /**
   * Initializes a tick_array account to represent a tick-range in a ElysiumPool.
   *
   * Special Errors
   * `InvalidTokenMintOrder` - The order of mints have to be ordered by
   * `SqrtPriceOutOfBounds` - provided initial_sqrt_price is not between 2^-64 to 2^64
   *
   * @param program - program object containing services required to generate the instruction
   * @param params - InitPoolParams object
   * @returns - Instruction to perform the action.
   */
  public static initializePoolIx(program: Program<ElysiumPool>, params: ix.InitPoolParams) {
    return ix.initializePoolIx(program, params);
  }

  /**
   * Initialize reward for a ElysiumPool. A pool can only support up to a set number of rewards.
   * The initial emissionsPerSecond is set to 0.
   *
   * #### Special Errors
   * - `InvalidRewardIndex` - If the provided reward index doesn't match the lowest uninitialized index in this pool,
   *                          or exceeds NUM_REWARDS, or all reward slots for this pool has been initialized.
   *
   * @param program - program object containing services required to generate the instruction
   * @param params - InitializeRewardParams object
   * @returns - Instruction to perform the action.
   */
  public static initializeRewardIx(
    program: Program<ElysiumPool>,
    params: ix.InitializeRewardParams
  ) {
    return ix.initializeRewardIx(program, params);
  }

  /**
   * Initializes a TickArray account.
   *
   * #### Special Errors
   *  `InvalidStartTick` - if the provided start tick is out of bounds or is not a multiple of TICK_ARRAY_SIZE * tick spacing.
   *
   * @param program - program object containing services required to generate the instruction
   * @param params - InitTickArrayParams object
   * @returns - Instruction to perform the action.
   */
  public static initTickArrayIx(program: Program<ElysiumPool>, params: ix.InitTickArrayParams) {
    return ix.initTickArrayIx(program, params);
  }

  /**
   * Open a position in a ElysiumPool. A unique token will be minted to represent the position in the users wallet.
   * The position will start off with 0 liquidity.
   *
   * #### Special Errors
   * `InvalidTickIndex` - If a provided tick is out of bounds, out of order or not a multiple of the tick-spacing in this pool.
   *
   * @param program - program object containing services required to generate the instruction
   * @param params - OpenPositionParams object
   * @returns - Instruction to perform the action.
   */
  public static openPositionIx(program: Program<ElysiumPool>, params: ix.OpenPositionParams) {
    return ix.openPositionIx(program, params);
  }

  /**
   * Open a position in a ElysiumPool. A unique token will be minted to represent the position
   * in the users wallet. Additional Metaplex metadata is appended to identify the token.
   * The position will start off with 0 liquidity.
   *
   * #### Special Errors
   * `InvalidTickIndex` - If a provided tick is out of bounds, out of order or not a multiple of the tick-spacing in this pool.
   *
   * @param program - program object containing services required to generate the instruction
   * @param params - OpenPositionParams object and a derived PDA that hosts the position's metadata.
   * @returns - Instruction to perform the action.
   */
  public static openPositionWithMetadataIx(
    program: Program<ElysiumPool>,
    params: ix.OpenPositionParams & { metadataPda: PDA }
  ) {
    return ix.openPositionWithMetadataIx(program, params);
  }

  /**
   * Add liquidity to a position in the ElysiumPool. This call also updates the position's accrued fees and rewards.
   *
   * #### Special Errors
   * `LiquidityZero` - Provided liquidity amount is zero.
   * `LiquidityTooHigh` - Provided liquidity exceeds u128::max.
   * `TokenMaxExceeded` - The required token to perform this operation exceeds the user defined amount.
   *
   * @param program - program object containing services required to generate the instruction
   * @param params - IncreaseLiquidityParams object
   * @returns - Instruction to perform the action.
   */
  public static increaseLiquidityIx(
    program: Program<ElysiumPool>,
    params: ix.IncreaseLiquidityParams
  ) {
    return ix.increaseLiquidityIx(program, params);
  }

  /**
   * Remove liquidity to a position in the ElysiumPool. This call also updates the position's accrued fees and rewards.
   *
   * #### Special Errors
   * - `LiquidityZero` - Provided liquidity amount is zero.
   * - `LiquidityTooHigh` - Provided liquidity exceeds u128::max.
   * - `TokenMinSubceeded` - The required token to perform this operation subceeds the user defined amount.
   *
   * @param program - program object containing services required to generate the instruction
   * @param params - DecreaseLiquidityParams object
   * @returns - Instruction to perform the action.
   */
  public static decreaseLiquidityIx(
    program: Program<ElysiumPool>,
    params: ix.DecreaseLiquidityParams
  ) {
    return ix.decreaseLiquidityIx(program, params);
  }

  /**
   * Close a position in a ElysiumPool. Burns the position token in the owner's wallet.
   *
   * @param program - program object containing services required to generate the instruction
   * @param params - ClosePositionParams object
   * @returns - Instruction to perform the action.
   */
  public static closePositionIx(program: Program<ElysiumPool>, params: ix.ClosePositionParams) {
    return ix.closePositionIx(program, params);
  }

  /**
   * Perform a swap in this ElysiumPool
   *
   * #### Special Errors
   * - `ZeroTradableAmount` - User provided parameter `amount` is 0.
   * - `InvalidSqrtPriceLimitDirection` - User provided parameter `sqrt_price_limit` does not match the direction of the trade.
   * - `SqrtPriceOutOfBounds` - User provided parameter `sqrt_price_limit` is over Whirlppool's max/min bounds for sqrt-price.
   * - `InvalidTickArraySequence` - User provided tick-arrays are not in sequential order required to proceed in this trade direction.
   * - `TickArraySequenceInvalidIndex` - The swap loop attempted to access an invalid array index during the query of the next initialized tick.
   * - `TickArrayIndexOutofBounds` - The swap loop attempted to access an invalid array index during tick crossing.
   * - `LiquidityOverflow` - Liquidity value overflowed 128bits during tick crossing.
   * - `InvalidTickSpacing` - The swap pool was initialized with tick-spacing of 0.
   *
   * ### Parameters
   * @param program - program object containing services required to generate the instruction
   * @param params - {@link SwapParams}
   * @returns - Instruction to perform the action.
   */
  public static swapIx(program: Program<ElysiumPool>, params: ix.SwapParams) {
    return ix.swapIx(program, params);
  }

  /**
   * Perform a two-hop-swap in this ElysiumPool
   *
   * #### Special Errors
   * - `ZeroTradableAmount` - User provided parameter `amount` is 0.
   * - `InvalidSqrtPriceLimitDirection` - User provided parameter `sqrt_price_limit` does not match the direction of the trade.
   * - `SqrtPriceOutOfBounds` - User provided parameter `sqrt_price_limit` is over Whirlppool's max/min bounds for sqrt-price.
   * - `InvalidTickArraySequence` - User provided tick-arrays are not in sequential order required to proceed in this trade direction.
   * - `TickArraySequenceInvalidIndex` - The swap loop attempted to access an invalid array index during the query of the next initialized tick.
   * - `TickArrayIndexOutofBounds` - The swap loop attempted to access an invalid array index during tick crossing.
   * - `LiquidityOverflow` - Liquidity value overflowed 128bits during tick crossing.
   * - `InvalidTickSpacing` - The swap pool was initialized with tick-spacing of 0.
   * - `DuplicateTwoHopPool` - Swaps on the same pool are not allowed.
   * - `InvalidIntermediaryMint` - The first and second leg of the hops do not share a common token.
   *
   * ### Parameters
   * @param program - program object containing services required to generate the instruction
   * @param params - TwoHopSwapParams object
   * @returns - Instruction to perform the action.
   */
  public static twoHopSwapIx(program: Program<ElysiumPool>, params: ix.TwoHopSwapParams) {
    return ix.twoHopSwapIx(program, params);
  }

  /**
   * Update the accrued fees and rewards for a position.
   *
   * #### Special Errors
   * `TickNotFound` - Provided tick array account does not contain the tick for this position.
   * `LiquidityZero` - Position has zero liquidity and therefore already has the most updated fees and reward values.
   *
   * @param program - program object containing services required to generate the instruction
   * @param params - UpdateFeesAndRewardsParams object
   * @returns - Instruction to perform the action.
   */
  public static updateFeesAndRewardsIx(
    program: Program<ElysiumPool>,
    params: ix.UpdateFeesAndRewardsParams
  ) {
    return ix.updateFeesAndRewardsIx(program, params);
  }

  /**
   * Collect fees accrued for this position.
   * Call updateFeesAndRewards before this to update the position to the newest accrued values.
   *
   * @param program - program object containing services required to generate the instruction
   * @param params - CollectFeesParams object
   * @returns - Instruction to perform the action.
   */
  public static collectFeesIx(program: Program<ElysiumPool>, params: ix.CollectFeesParams) {
    return ix.collectFeesIx(program, params);
  }

  /**
   * Collect protocol fees accrued in this ElysiumPool.
   *
   * @param program - program object containing services required to generate the instruction
   * @param params - CollectProtocolFeesParams object
   * @returns - Instruction to perform the action.
   */
  public static collectProtocolFeesIx(
    program: Program<ElysiumPool>,
    params: ix.CollectProtocolFeesParams
  ) {
    return ix.collectProtocolFeesIx(program, params);
  }

  /**
   * Collect rewards accrued for this reward index in a position.
   * Call updateFeesAndRewards before this to update the position to the newest accrued values.
   *
   * @param program - program object containing services required to generate the instruction
   * @param params - CollectRewardParams object
   * @returns - Instruction to perform the action.
   */
  public static collectRewardIx(program: Program<ElysiumPool>, params: ix.CollectRewardParams) {
    return ix.collectRewardIx(program, params);
  }

  /**
   * Sets the fee authority to collect protocol fees for a ElysiumPoolsConfig.
   * Only the current collect protocol fee authority has permission to invoke this instruction.
   *
   * @param program - program object containing services required to generate the instruction
   * @param params - SetCollectProtocolFeesAuthorityParams object
   * @returns - Instruction to perform the action.
   */
  public static setCollectProtocolFeesAuthorityIx(
    program: Program<ElysiumPool>,
    params: ix.SetCollectProtocolFeesAuthorityParams
  ) {
    return ix.setCollectProtocolFeesAuthorityIx(program, params);
  }

  /**
   * Updates a fee tier account with a new default fee rate. The new rate will not retroactively update
   * initialized pools.
   *
   * #### Special Errors
   * - `FeeRateMaxExceeded` - If the provided default_fee_rate exceeds MAX_FEE_RATE.
   *
   * @param program - program object containing services required to generate the instruction
   * @param params - SetDefaultFeeRateParams object
   * @returns - Instruction to perform the action.
   */
  public static setDefaultFeeRateIx(
    program: Program<ElysiumPool>,
    params: ix.SetDefaultFeeRateParams
  ) {
    return ix.setDefaultFeeRateIx(program, params);
  }

  /**
   * Updates a ElysiumPoolsConfig with a new default protocol fee rate. The new rate will not retroactively update
   * initialized pools.
   *
   * #### Special Errors
   * - `ProtocolFeeRateMaxExceeded` - If the provided default_protocol_fee_rate exceeds MAX_PROTOCOL_FEE_RATE.
   *
   * @param program - program object containing services required to generate the instruction
   * @param params - SetDefaultFeeRateParams object
   * @returns - Instruction to perform the action.
   */
  public static setDefaultProtocolFeeRateIx(
    program: Program<ElysiumPool>,
    params: ix.SetDefaultProtocolFeeRateParams
  ) {
    return ix.setDefaultProtocolFeeRateIx(program, params);
  }

  /**
   * Sets the fee authority for a ElysiumPoolsConfig.
   * The fee authority can set the fee & protocol fee rate for individual pools or set the default fee rate for newly minted pools.
   * Only the current fee authority has permission to invoke this instruction.
   *
   * @param program - program object containing services required to generate the instruction
   * @param params - SetFeeAuthorityParams object
   * @returns - Instruction to perform the action.
   */
  public static setFeeAuthorityIx(program: Program<ElysiumPool>, params: ix.SetFeeAuthorityParams) {
    return ix.setFeeAuthorityIx(program, params);
  }

  /**
   * Sets the fee rate for a ElysiumPool.
   * Only the current fee authority has permission to invoke this instruction.
   *
   * #### Special Errors
   * - `FeeRateMaxExceeded` - If the provided fee_rate exceeds MAX_FEE_RATE.
   *
   * @param program - program object containing services required to generate the instruction
   * @param params - SetFeeRateParams object
   * @returns - Instruction to perform the action.
   */
  public static setFeeRateIx(program: Program<ElysiumPool>, params: ix.SetFeeRateParams) {
    return ix.setFeeRateIx(program, params);
  }

  /**
   * Sets the protocol fee rate for a ElysiumPool.
   * Only the current fee authority has permission to invoke this instruction.
   *
   * #### Special Errors
   * - `ProtocolFeeRateMaxExceeded` - If the provided default_protocol_fee_rate exceeds MAX_PROTOCOL_FEE_RATE.
   *
   * @param program - program object containing services required to generate the instruction
   * @param params - SetFeeRateParams object
   * @returns - Instruction to perform the action.
   */
  public static setProtocolFeeRateIx(
    program: Program<ElysiumPool>,
    params: ix.SetProtocolFeeRateParams
  ) {
    return ix.setProtocolFeeRateIx(program, params);
  }

  /**
   * Set the whirlpool reward authority at the provided `reward_index`.
   * Only the current reward super authority has permission to invoke this instruction.
   *
   * #### Special Errors
   * - `InvalidRewardIndex` - If the provided reward index doesn't match the lowest uninitialized index in this pool,
   *                          or exceeds NUM_REWARDS.
   *
   * @param program - program object containing services required to generate the instruction
   * @param params - SetRewardAuthorityParams object
   * @returns - Instruction to perform the action.
   */
  public static setRewardAuthorityBySuperAuthorityIx(
    program: Program<ElysiumPool>,
    params: ix.SetRewardAuthorityBySuperAuthorityParams
  ) {
    return ix.setRewardAuthorityBySuperAuthorityIx(program, params);
  }

  /**
   * Set the whirlpool reward authority at the provided `reward_index`.
   * Only the current reward authority for this reward index has permission to invoke this instruction.
   *
   * #### Special Errors
   * - `InvalidRewardIndex` - If the provided reward index doesn't match the lowest uninitialized index in this pool,
   *                          or exceeds NUM_REWARDS.
   *
   * @param program - program object containing services required to generate the instruction
   * @param params - SetRewardAuthorityParams object
   * @returns - Instruction to perform the action.
   */
  public static setRewardAuthorityIx(
    program: Program<ElysiumPool>,
    params: ix.SetRewardAuthorityParams
  ) {
    return ix.setRewardAuthorityIx(program, params);
  }

  /**
   * Set the reward emissions for a reward in a ElysiumPool.
   *
   * #### Special Errors
   * - `RewardVaultAmountInsufficient` - The amount of rewards in the reward vault cannot emit more than a day of desired emissions.
   * - `InvalidTimestamp` - Provided timestamp is not in order with the previous timestamp.
   * - `InvalidRewardIndex` - If the provided reward index doesn't match the lowest uninitialized index in this pool,
   *                          or exceeds NUM_REWARDS.
   *
   * @param program - program object containing services required to generate the instruction
   * @param params - SetRewardEmissionsParams object
   * @returns - Instruction to perform the action.
   */
  public static setRewardEmissionsIx(
    program: Program<ElysiumPool>,
    params: ix.SetRewardEmissionsParams
  ) {
    return ix.setRewardEmissionsIx(program, params);
  }

  /**
   * Set the whirlpool reward super authority for a ElysiumPoolsConfig
   * Only the current reward super authority has permission to invoke this instruction.
   * This instruction will not change the authority on any `ElysiumPoolRewardInfo` whirlpool rewards.
   *
   * @param program - program object containing services required to generate the instruction
   * @param params - SetRewardEmissionsSuperAuthorityParams object
   * @returns - Instruction to perform the action.
   */
  public static setRewardEmissionsSuperAuthorityIx(
    program: Program<ElysiumPool>,
    params: ix.SetRewardEmissionsSuperAuthorityParams
  ) {
    return ix.setRewardEmissionsSuperAuthorityIx(program, params);
  }

  /**
   * Initializes a PositionBundle account.
   *
   * @param program - program object containing services required to generate the instruction
   * @param params - InitializePositionBundleParams object
   * @returns - Instruction to perform the action.
   */
  public static initializePositionBundleIx(
    program: Program<ElysiumPool>,
    params: ix.InitializePositionBundleParams
  ) {
    return ix.initializePositionBundleIx(program, params);
  }

  /**
   * Initializes a PositionBundle account.
   * Additional Metaplex metadata is appended to identify the token.
   *
   * @param program - program object containing services required to generate the instruction
   * @param params - InitializePositionBundleParams object
   * @returns - Instruction to perform the action.
   */
  public static initializePositionBundleWithMetadataIx(
    program: Program<ElysiumPool>,
    params: ix.InitializePositionBundleParams & { positionBundleMetadataPda: PDA }
  ) {
    return ix.initializePositionBundleWithMetadataIx(program, params);
  }

  /**
   * Deletes a PositionBundle account.
   *
   * #### Special Errors
   * `PositionBundleNotDeletable` - The provided position bundle has open positions.
   *
   * @param program - program object containing services required to generate the instruction
   * @param params - DeletePositionBundleParams object
   * @returns - Instruction to perform the action.
   */
  public static deletePositionBundleIx(
    program: Program<ElysiumPool>,
    params: ix.DeletePositionBundleParams
  ) {
    return ix.deletePositionBundleIx(program, params);
  }

  /**
   * Open a bundled position in a ElysiumPool.
   * No new tokens are issued because the owner of the position bundle becomes the owner of the position.
   * The position will start off with 0 liquidity.
   *
   * #### Special Errors
   * `InvalidBundleIndex` - If the provided bundle index is out of bounds.
   * `InvalidTickIndex` - If a provided tick is out of bounds, out of order or not a multiple of the tick-spacing in this pool.
   *
   * @param program - program object containing services required to generate the instruction
   * @param params - OpenBundledPositionParams object
   * @returns - Instruction to perform the action.
   */
  public static openBundledPositionIx(
    program: Program<ElysiumPool>,
    params: ix.OpenBundledPositionParams
  ) {
    return ix.openBundledPositionIx(program, params);
  }

  /**
   * Close a bundled position in a ElysiumPool.
   *
   * #### Special Errors
   * `InvalidBundleIndex` - If the provided bundle index is out of bounds.
   * `ClosePositionNotEmpty` - The provided position account is not empty.
   *
   * @param program - program object containing services required to generate the instruction
   * @param params - CloseBundledPositionParams object
   * @returns - Instruction to perform the action.
   */
  public static closeBundledPositionIx(
    program: Program<ElysiumPool>,
    params: ix.CloseBundledPositionParams
  ) {
    return ix.closeBundledPositionIx(program, params);
  }
}
