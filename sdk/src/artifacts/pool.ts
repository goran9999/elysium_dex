export type ElysiumPool = {
  version: "0.2.0";
  name: "pool";
  instructions: [
    {
      name: "initializeConfig";
      docs: [
        "Initializes a ElysiumPoolsConfig account that hosts info & authorities",
        "required to govern a set of ElysiumPools.",
        "",
        "### Parameters",
        "- `fee_authority` - Authority authorized to initialize fee-tiers and set customs fees.",
        "- `collect_protocol_fees_authority` - Authority authorized to collect protocol fees.",
        "- `reward_emissions_super_authority` - Authority authorized to set reward authorities in pools."
      ];
      accounts: [
        {
          name: "config";
          isMut: true;
          isSigner: true;
        },
        {
          name: "funder";
          isMut: true;
          isSigner: true;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "feeAuthority";
          type: "publicKey";
        },
        {
          name: "collectProtocolFeesAuthority";
          type: "publicKey";
        },
        {
          name: "rewardEmissionsSuperAuthority";
          type: "publicKey";
        },
        {
          name: "defaultProtocolFeeRate";
          type: "u16";
        }
      ];
    },
    {
      name: "initializePool";
      docs: [
        "Initializes a ElysiumPool account.",
        "Fee rate is set to the default values on the config and supplied fee_tier.",
        "",
        "### Parameters",
        "- `bumps` - The bump value when deriving the PDA of the ElysiumPool address.",
        "- `tick_spacing` - The desired tick spacing for this pool.",
        "- `initial_sqrt_price` - The desired initial sqrt-price for this pool",
        "",
        "#### Special Errors",
        "`InvalidTokenMintOrder` - The order of mints have to be ordered by",
        "`SqrtPriceOutOfBounds` - provided initial_sqrt_price is not between 2^-64 to 2^64",
        ""
      ];
      accounts: [
        {
          name: "poolsConfig";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenMintA";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenMintB";
          isMut: false;
          isSigner: false;
        },
        {
          name: "funder";
          isMut: true;
          isSigner: true;
        },
        {
          name: "pool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenVaultA";
          isMut: true;
          isSigner: true;
        },
        {
          name: "tokenVaultB";
          isMut: true;
          isSigner: true;
        },
        {
          name: "feeTier";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "rent";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "bumps";
          type: {
            defined: "ElysiumPoolBumps";
          };
        },
        {
          name: "tickSpacing";
          type: "u16";
        },
        {
          name: "initialSqrtPrice";
          type: "u128";
        }
      ];
    },
    {
      name: "initializeTickArray";
      docs: [
        "Initializes a tick_array account to represent a tick-range in a ElysiumPool.",
        "",
        "### Parameters",
        "- `start_tick_index` - The starting tick index for this tick-array.",
        "Has to be a multiple of TickArray size & the tick spacing of this pool.",
        "",
        "#### Special Errors",
        "- `InvalidStartTick` - if the provided start tick is out of bounds or is not a multiple of",
        "TICK_ARRAY_SIZE * tick spacing."
      ];
      accounts: [
        {
          name: "pool";
          isMut: false;
          isSigner: false;
        },
        {
          name: "funder";
          isMut: true;
          isSigner: true;
        },
        {
          name: "tickArray";
          isMut: true;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "startTickIndex";
          type: "i32";
        }
      ];
    },
    {
      name: "initializeFeeTier";
      docs: [
        "Initializes a fee_tier account usable by ElysiumPools in a ElysiumPoolConfig space.",
        "",
        "### Authority",
        '- "fee_authority" - Set authority in the ElysiumPoolConfig',
        "",
        "### Parameters",
        "- `tick_spacing` - The tick-spacing that this fee-tier suggests the default_fee_rate for.",
        "- `default_fee_rate` - The default fee rate that a pool will use if the pool uses this",
        "fee tier during initialization.",
        "",
        "#### Special Errors",
        "- `FeeRateMaxExceeded` - If the provided default_fee_rate exceeds MAX_FEE_RATE."
      ];
      accounts: [
        {
          name: "config";
          isMut: false;
          isSigner: false;
        },
        {
          name: "feeTier";
          isMut: true;
          isSigner: false;
        },
        {
          name: "funder";
          isMut: true;
          isSigner: true;
        },
        {
          name: "feeAuthority";
          isMut: false;
          isSigner: true;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "tickSpacing";
          type: "u16";
        },
        {
          name: "defaultFeeRate";
          type: "u16";
        }
      ];
    },
    {
      name: "initializeReward";
      docs: [
        "Initialize reward for a ElysiumPool. A pool can only support up to a set number of rewards.",
        "",
        "### Authority",
        '- "reward_authority" - assigned authority by the reward_super_authority for the specified',
        "reward-index in this ElysiumPool",
        "",
        "### Parameters",
        "- `reward_index` - The reward index that we'd like to initialize. (0 <= index <= NUM_REWARDS)",
        "",
        "#### Special Errors",
        "- `InvalidRewardIndex` - If the provided reward index doesn't match the lowest uninitialized",
        "index in this pool, or exceeds NUM_REWARDS, or",
        "all reward slots for this pool has been initialized."
      ];
      accounts: [
        {
          name: "rewardAuthority";
          isMut: false;
          isSigner: true;
        },
        {
          name: "funder";
          isMut: true;
          isSigner: true;
        },
        {
          name: "pool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "rewardMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "rewardVault";
          isMut: true;
          isSigner: true;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "rent";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "rewardIndex";
          type: "u8";
        }
      ];
    },
    {
      name: "setRewardEmissions";
      docs: [
        "Set the reward emissions for a reward in a ElysiumPool.",
        "",
        "### Authority",
        '- "reward_authority" - assigned authority by the reward_super_authority for the specified',
        "reward-index in this ElysiumPool",
        "",
        "### Parameters",
        "- `reward_index` - The reward index (0 <= index <= NUM_REWARDS) that we'd like to modify.",
        "- `emissions_per_second_x64` - The amount of rewards emitted in this pool.",
        "",
        "#### Special Errors",
        "- `RewardVaultAmountInsufficient` - The amount of rewards in the reward vault cannot emit",
        "more than a day of desired emissions.",
        "- `InvalidTimestamp` - Provided timestamp is not in order with the previous timestamp.",
        "- `InvalidRewardIndex` - If the provided reward index doesn't match the lowest uninitialized",
        "index in this pool, or exceeds NUM_REWARDS, or",
        "all reward slots for this pool has been initialized."
      ];
      accounts: [
        {
          name: "pool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "rewardAuthority";
          isMut: false;
          isSigner: true;
        },
        {
          name: "rewardVault";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "rewardIndex";
          type: "u8";
        },
        {
          name: "emissionsPerSecondX64";
          type: "u128";
        }
      ];
    },
    {
      name: "openPosition";
      docs: [
        "Open a position in a ElysiumPool. A unique token will be minted to represent the position",
        "in the users wallet. The position will start off with 0 liquidity.",
        "",
        "### Parameters",
        "- `tick_lower_index` - The tick specifying the lower end of the position range.",
        "- `tick_upper_index` - The tick specifying the upper end of the position range.",
        "",
        "#### Special Errors",
        "- `InvalidTickIndex` - If a provided tick is out of bounds, out of order or not a multiple of",
        "the tick-spacing in this pool."
      ];
      accounts: [
        {
          name: "funder";
          isMut: true;
          isSigner: true;
        },
        {
          name: "owner";
          isMut: false;
          isSigner: false;
        },
        {
          name: "position";
          isMut: true;
          isSigner: false;
        },
        {
          name: "positionMint";
          isMut: true;
          isSigner: true;
        },
        {
          name: "positionTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "pool";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "rent";
          isMut: false;
          isSigner: false;
        },
        {
          name: "associatedTokenProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "bumps";
          type: {
            defined: "OpenPositionBumps";
          };
        },
        {
          name: "tickLowerIndex";
          type: "i32";
        },
        {
          name: "tickUpperIndex";
          type: "i32";
        }
      ];
    },
    {
      name: "openPositionWithMetadata";
      docs: [
        "Open a position in a ElysiumPool. A unique token will be minted to represent the position",
        "in the users wallet. Additional Metaplex metadata is appended to identify the token.",
        "The position will start off with 0 liquidity.",
        "",
        "### Parameters",
        "- `tick_lower_index` - The tick specifying the lower end of the position range.",
        "- `tick_upper_index` - The tick specifying the upper end of the position range.",
        "",
        "#### Special Errors",
        "- `InvalidTickIndex` - If a provided tick is out of bounds, out of order or not a multiple of",
        "the tick-spacing in this pool."
      ];
      accounts: [
        {
          name: "funder";
          isMut: true;
          isSigner: true;
        },
        {
          name: "owner";
          isMut: false;
          isSigner: false;
        },
        {
          name: "position";
          isMut: true;
          isSigner: false;
        },
        {
          name: "positionMint";
          isMut: true;
          isSigner: true;
        },
        {
          name: "positionMetadataAccount";
          isMut: true;
          isSigner: false;
          docs: [
            "https://github.com/metaplex-foundation/metaplex-program-library/blob/master/token-metadata/program/src/utils.rs#L873"
          ];
        },
        {
          name: "positionTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "pool";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "rent";
          isMut: false;
          isSigner: false;
        },
        {
          name: "associatedTokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "metadataProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "metadataUpdateAuth";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "bumps";
          type: {
            defined: "OpenPositionWithMetadataBumps";
          };
        },
        {
          name: "tickLowerIndex";
          type: "i32";
        },
        {
          name: "tickUpperIndex";
          type: "i32";
        }
      ];
    },
    {
      name: "increaseLiquidity";
      docs: [
        "Add liquidity to a position in the ElysiumPool. This call also updates the position's accrued fees and rewards.",
        "",
        "### Authority",
        "- `position_authority` - authority that owns the token corresponding to this desired position.",
        "",
        "### Parameters",
        "- `liquidity_amount` - The total amount of Liquidity the user is willing to deposit.",
        "- `token_max_a` - The maximum amount of tokenA the user is willing to deposit.",
        "- `token_max_b` - The maximum amount of tokenB the user is willing to deposit.",
        "",
        "#### Special Errors",
        "- `LiquidityZero` - Provided liquidity amount is zero.",
        "- `LiquidityTooHigh` - Provided liquidity exceeds u128::max.",
        "- `TokenMaxExceeded` - The required token to perform this operation exceeds the user defined amount."
      ];
      accounts: [
        {
          name: "pool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "positionAuthority";
          isMut: false;
          isSigner: true;
        },
        {
          name: "position";
          isMut: true;
          isSigner: false;
        },
        {
          name: "positionTokenAccount";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenOwnerAccountA";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenOwnerAccountB";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenVaultA";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenVaultB";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tickArrayLower";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tickArrayUpper";
          isMut: true;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "liquidityAmount";
          type: "u128";
        },
        {
          name: "tokenMaxA";
          type: "u64";
        },
        {
          name: "tokenMaxB";
          type: "u64";
        }
      ];
    },
    {
      name: "decreaseLiquidity";
      docs: [
        "Withdraw liquidity from a position in the ElysiumPool. This call also updates the position's accrued fees and rewards.",
        "",
        "### Authority",
        "- `position_authority` - authority that owns the token corresponding to this desired position.",
        "",
        "### Parameters",
        "- `liquidity_amount` - The total amount of Liquidity the user desires to withdraw.",
        "- `token_min_a` - The minimum amount of tokenA the user is willing to withdraw.",
        "- `token_min_b` - The minimum amount of tokenB the user is willing to withdraw.",
        "",
        "#### Special Errors",
        "- `LiquidityZero` - Provided liquidity amount is zero.",
        "- `LiquidityTooHigh` - Provided liquidity exceeds u128::max.",
        "- `TokenMinSubceeded` - The required token to perform this operation subceeds the user defined amount."
      ];
      accounts: [
        {
          name: "pool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "positionAuthority";
          isMut: false;
          isSigner: true;
        },
        {
          name: "position";
          isMut: true;
          isSigner: false;
        },
        {
          name: "positionTokenAccount";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenOwnerAccountA";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenOwnerAccountB";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenVaultA";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenVaultB";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tickArrayLower";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tickArrayUpper";
          isMut: true;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "liquidityAmount";
          type: "u128";
        },
        {
          name: "tokenMinA";
          type: "u64";
        },
        {
          name: "tokenMinB";
          type: "u64";
        }
      ];
    },
    {
      name: "updateFeesAndRewards";
      docs: [
        "Update the accrued fees and rewards for a position.",
        "",
        "#### Special Errors",
        "- `TickNotFound` - Provided tick array account does not contain the tick for this position.",
        "- `LiquidityZero` - Position has zero liquidity and therefore already has the most updated fees and reward values."
      ];
      accounts: [
        {
          name: "pool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "position";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tickArrayLower";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tickArrayUpper";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "collectFees";
      docs: [
        "Collect fees accrued for this position.",
        "",
        "### Authority",
        "- `position_authority` - authority that owns the token corresponding to this desired position."
      ];
      accounts: [
        {
          name: "pool";
          isMut: false;
          isSigner: false;
        },
        {
          name: "positionAuthority";
          isMut: false;
          isSigner: true;
        },
        {
          name: "position";
          isMut: true;
          isSigner: false;
        },
        {
          name: "positionTokenAccount";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenOwnerAccountA";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenVaultA";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenOwnerAccountB";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenVaultB";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "collectReward";
      docs: [
        "Collect rewards accrued for this position.",
        "",
        "### Authority",
        "- `position_authority` - authority that owns the token corresponding to this desired position."
      ];
      accounts: [
        {
          name: "pool";
          isMut: false;
          isSigner: false;
        },
        {
          name: "positionAuthority";
          isMut: false;
          isSigner: true;
        },
        {
          name: "position";
          isMut: true;
          isSigner: false;
        },
        {
          name: "positionTokenAccount";
          isMut: false;
          isSigner: false;
        },
        {
          name: "rewardOwnerAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "rewardVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "rewardIndex";
          type: "u8";
        }
      ];
    },
    {
      name: "collectProtocolFees";
      docs: [
        "Collect the protocol fees accrued in this ElysiumPool",
        "",
        "### Authority",
        "- `collect_protocol_fees_authority` - assigned authority in the ElysiumPoolConfig that can collect protocol fees"
      ];
      accounts: [
        {
          name: "poolsConfig";
          isMut: false;
          isSigner: false;
        },
        {
          name: "pool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "collectProtocolFeesAuthority";
          isMut: false;
          isSigner: true;
        },
        {
          name: "tokenVaultA";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenVaultB";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenDestinationA";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenDestinationB";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "swap";
      docs: [
        "Perform a swap in this ElysiumPool",
        "",
        "### Authority",
        '- "token_authority" - The authority to withdraw tokens from the input token account.',
        "",
        "### Parameters",
        "- `amount` - The amount of input or output token to swap from (depending on amount_specified_is_input).",
        "- `other_amount_threshold` - The maximum/minimum of input/output token to swap into (depending on amount_specified_is_input).",
        "- `sqrt_price_limit` - The maximum/minimum price the swap will swap to.",
        "- `amount_specified_is_input` - Specifies the token the parameter `amount`represents. If true, the amount represents the input token of the swap.",
        "- `a_to_b` - The direction of the swap. True if swapping from A to B. False if swapping from B to A.",
        "",
        "#### Special Errors",
        "- `ZeroTradableAmount` - User provided parameter `amount` is 0.",
        "- `InvalidSqrtPriceLimitDirection` - User provided parameter `sqrt_price_limit` does not match the direction of the trade.",
        "- `SqrtPriceOutOfBounds` - User provided parameter `sqrt_price_limit` is over Whirlppool's max/min bounds for sqrt-price.",
        "- `InvalidTickArraySequence` - User provided tick-arrays are not in sequential order required to proceed in this trade direction.",
        "- `TickArraySequenceInvalidIndex` - The swap loop attempted to access an invalid array index during the query of the next initialized tick.",
        "- `TickArrayIndexOutofBounds` - The swap loop attempted to access an invalid array index during tick crossing.",
        "- `LiquidityOverflow` - Liquidity value overflowed 128bits during tick crossing.",
        "- `InvalidTickSpacing` - The swap pool was initialized with tick-spacing of 0."
      ];
      accounts: [
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenAuthority";
          isMut: false;
          isSigner: true;
        },
        {
          name: "pool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenOwnerAccountA";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenVaultA";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenOwnerAccountB";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenVaultB";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tickArray0";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tickArray1";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tickArray2";
          isMut: true;
          isSigner: false;
        },
        {
          name: "oracle";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        },
        {
          name: "otherAmountThreshold";
          type: "u64";
        },
        {
          name: "sqrtPriceLimit";
          type: "u128";
        },
        {
          name: "amountSpecifiedIsInput";
          type: "bool";
        },
        {
          name: "aToB";
          type: "bool";
        }
      ];
    },
    {
      name: "closePosition";
      docs: [
        "Close a position in a ElysiumPool. Burns the position token in the owner's wallet.",
        "",
        "### Authority",
        '- "position_authority" - The authority that owns the position token.',
        "",
        "#### Special Errors",
        "- `ClosePositionNotEmpty` - The provided position account is not empty."
      ];
      accounts: [
        {
          name: "positionAuthority";
          isMut: false;
          isSigner: true;
        },
        {
          name: "receiver";
          isMut: true;
          isSigner: false;
        },
        {
          name: "position";
          isMut: true;
          isSigner: false;
        },
        {
          name: "positionMint";
          isMut: true;
          isSigner: false;
        },
        {
          name: "positionTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "setDefaultFeeRate";
      docs: [
        "Set the default_fee_rate for a FeeTier",
        "Only the current fee authority has permission to invoke this instruction.",
        "",
        "### Authority",
        '- "fee_authority" - Set authority in the ElysiumPoolConfig',
        "",
        "### Parameters",
        "- `default_fee_rate` - The default fee rate that a pool will use if the pool uses this",
        "fee tier during initialization.",
        "",
        "#### Special Errors",
        "- `FeeRateMaxExceeded` - If the provided default_fee_rate exceeds MAX_FEE_RATE."
      ];
      accounts: [
        {
          name: "poolsConfig";
          isMut: false;
          isSigner: false;
        },
        {
          name: "feeTier";
          isMut: true;
          isSigner: false;
        },
        {
          name: "feeAuthority";
          isMut: false;
          isSigner: true;
        }
      ];
      args: [
        {
          name: "defaultFeeRate";
          type: "u16";
        }
      ];
    },
    {
      name: "setDefaultProtocolFeeRate";
      docs: [
        "Sets the default protocol fee rate for a ElysiumPoolConfig",
        "Protocol fee rate is represented as a basis point.",
        "Only the current fee authority has permission to invoke this instruction.",
        "",
        "### Authority",
        '- "fee_authority" - Set authority that can modify pool fees in the ElysiumPoolConfig',
        "",
        "### Parameters",
        "- `default_protocol_fee_rate` - Rate that is referenced during the initialization of a ElysiumPool using this config.",
        "",
        "#### Special Errors",
        "- `ProtocolFeeRateMaxExceeded` - If the provided default_protocol_fee_rate exceeds MAX_PROTOCOL_FEE_RATE."
      ];
      accounts: [
        {
          name: "poolsConfig";
          isMut: true;
          isSigner: false;
        },
        {
          name: "feeAuthority";
          isMut: false;
          isSigner: true;
        }
      ];
      args: [
        {
          name: "defaultProtocolFeeRate";
          type: "u16";
        }
      ];
    },
    {
      name: "setFeeRate";
      docs: [
        "Sets the fee rate for a ElysiumPool.",
        "Fee rate is represented as hundredths of a basis point.",
        "Only the current fee authority has permission to invoke this instruction.",
        "",
        "### Authority",
        '- "fee_authority" - Set authority that can modify pool fees in the ElysiumPoolConfig',
        "",
        "### Parameters",
        "- `fee_rate` - The rate that the pool will use to calculate fees going onwards.",
        "",
        "#### Special Errors",
        "- `FeeRateMaxExceeded` - If the provided fee_rate exceeds MAX_FEE_RATE."
      ];
      accounts: [
        {
          name: "poolsConfig";
          isMut: false;
          isSigner: false;
        },
        {
          name: "pool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "feeAuthority";
          isMut: false;
          isSigner: true;
        }
      ];
      args: [
        {
          name: "feeRate";
          type: "u16";
        }
      ];
    },
    {
      name: "setProtocolFeeRate";
      docs: [
        "Sets the protocol fee rate for a ElysiumPool.",
        "Protocol fee rate is represented as a basis point.",
        "Only the current fee authority has permission to invoke this instruction.",
        "",
        "### Authority",
        '- "fee_authority" - Set authority that can modify pool fees in the ElysiumPoolConfig',
        "",
        "### Parameters",
        "- `protocol_fee_rate` - The rate that the pool will use to calculate protocol fees going onwards.",
        "",
        "#### Special Errors",
        "- `ProtocolFeeRateMaxExceeded` - If the provided default_protocol_fee_rate exceeds MAX_PROTOCOL_FEE_RATE."
      ];
      accounts: [
        {
          name: "poolsConfig";
          isMut: false;
          isSigner: false;
        },
        {
          name: "pool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "feeAuthority";
          isMut: false;
          isSigner: true;
        }
      ];
      args: [
        {
          name: "protocolFeeRate";
          type: "u16";
        }
      ];
    },
    {
      name: "setFeeAuthority";
      docs: [
        "Sets the fee authority for a ElysiumPoolConfig.",
        "The fee authority can set the fee & protocol fee rate for individual pools or",
        "set the default fee rate for newly minted pools.",
        "Only the current fee authority has permission to invoke this instruction.",
        "",
        "### Authority",
        '- "fee_authority" - Set authority that can modify pool fees in the ElysiumPoolConfig'
      ];
      accounts: [
        {
          name: "poolsConfig";
          isMut: true;
          isSigner: false;
        },
        {
          name: "feeAuthority";
          isMut: false;
          isSigner: true;
        },
        {
          name: "newFeeAuthority";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "setCollectProtocolFeesAuthority";
      docs: [
        "Sets the fee authority to collect protocol fees for a ElysiumPoolConfig.",
        "Only the current collect protocol fee authority has permission to invoke this instruction.",
        "",
        "### Authority",
        '- "fee_authority" - Set authority that can collect protocol fees in the ElysiumPoolConfig'
      ];
      accounts: [
        {
          name: "poolsConfig";
          isMut: true;
          isSigner: false;
        },
        {
          name: "collectProtocolFeesAuthority";
          isMut: false;
          isSigner: true;
        },
        {
          name: "newCollectProtocolFeesAuthority";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "setRewardAuthority";
      docs: [
        "Set the pool reward authority at the provided `reward_index`.",
        "Only the current reward authority for this reward index has permission to invoke this instruction.",
        "",
        "### Authority",
        '- "reward_authority" - Set authority that can control reward emission for this particular reward.',
        "",
        "#### Special Errors",
        "- `InvalidRewardIndex` - If the provided reward index doesn't match the lowest uninitialized",
        "index in this pool, or exceeds NUM_REWARDS, or",
        "all reward slots for this pool has been initialized."
      ];
      accounts: [
        {
          name: "pool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "rewardAuthority";
          isMut: false;
          isSigner: true;
        },
        {
          name: "newRewardAuthority";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "rewardIndex";
          type: "u8";
        }
      ];
    },
    {
      name: "setRewardAuthorityBySuperAuthority";
      docs: [
        "Set the pool reward authority at the provided `reward_index`.",
        "Only the current reward super authority has permission to invoke this instruction.",
        "",
        "### Authority",
        '- "reward_authority" - Set authority that can control reward emission for this particular reward.',
        "",
        "#### Special Errors",
        "- `InvalidRewardIndex` - If the provided reward index doesn't match the lowest uninitialized",
        "index in this pool, or exceeds NUM_REWARDS, or",
        "all reward slots for this pool has been initialized."
      ];
      accounts: [
        {
          name: "poolsConfig";
          isMut: false;
          isSigner: false;
        },
        {
          name: "pool";
          isMut: true;
          isSigner: false;
        },
        {
          name: "rewardEmissionsSuperAuthority";
          isMut: false;
          isSigner: true;
        },
        {
          name: "newRewardAuthority";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "rewardIndex";
          type: "u8";
        }
      ];
    },
    {
      name: "setRewardEmissionsSuperAuthority";
      docs: [
        "Set the pool reward super authority for a ElysiumPoolConfig",
        "Only the current reward super authority has permission to invoke this instruction.",
        "This instruction will not change the authority on any `ElysiumPoolRewardInfo` pool rewards.",
        "",
        "### Authority",
        '- "reward_emissions_super_authority" - Set authority that can control reward authorities for all pools in this config space.'
      ];
      accounts: [
        {
          name: "poolsConfig";
          isMut: true;
          isSigner: false;
        },
        {
          name: "rewardEmissionsSuperAuthority";
          isMut: false;
          isSigner: true;
        },
        {
          name: "newRewardEmissionsSuperAuthority";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "twoHopSwap";
      docs: [
        "Perform a two-hop swap in this ElysiumPool",
        "",
        "### Authority",
        '- "token_authority" - The authority to withdraw tokens from the input token account.',
        "",
        "### Parameters",
        "- `amount` - The amount of input or output token to swap from (depending on amount_specified_is_input).",
        "- `other_amount_threshold` - The maximum/minimum of input/output token to swap into (depending on amount_specified_is_input).",
        "- `amount_specified_is_input` - Specifies the token the parameter `amount`represents. If true, the amount represents the input token of the swap.",
        "- `a_to_b_one` - The direction of the swap of hop one. True if swapping from A to B. False if swapping from B to A.",
        "- `a_to_b_two` - The direction of the swap of hop two. True if swapping from A to B. False if swapping from B to A.",
        "- `sqrt_price_limit_one` - The maximum/minimum price the swap will swap to in the first hop.",
        "- `sqrt_price_limit_two` - The maximum/minimum price the swap will swap to in the second hop.",
        "",
        "#### Special Errors",
        "- `ZeroTradableAmount` - User provided parameter `amount` is 0.",
        "- `InvalidSqrtPriceLimitDirection` - User provided parameter `sqrt_price_limit` does not match the direction of the trade.",
        "- `SqrtPriceOutOfBounds` - User provided parameter `sqrt_price_limit` is over Whirlppool's max/min bounds for sqrt-price.",
        "- `InvalidTickArraySequence` - User provided tick-arrays are not in sequential order required to proceed in this trade direction.",
        "- `TickArraySequenceInvalidIndex` - The swap loop attempted to access an invalid array index during the query of the next initialized tick.",
        "- `TickArrayIndexOutofBounds` - The swap loop attempted to access an invalid array index during tick crossing.",
        "- `LiquidityOverflow` - Liquidity value overflowed 128bits during tick crossing.",
        "- `InvalidTickSpacing` - The swap pool was initialized with tick-spacing of 0.",
        "- `InvalidIntermediaryMint` - Error if the intermediary mint between hop one and two do not equal.",
        "- `DuplicateTwoHopPool` - Error if pool one & two are the same pool."
      ];
      accounts: [
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenAuthority";
          isMut: false;
          isSigner: true;
        },
        {
          name: "poolOne";
          isMut: true;
          isSigner: false;
        },
        {
          name: "poolTwo";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenOwnerAccountOneA";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenVaultOneA";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenOwnerAccountOneB";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenVaultOneB";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenOwnerAccountTwoA";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenVaultTwoA";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenOwnerAccountTwoB";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenVaultTwoB";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tickArrayOne0";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tickArrayOne1";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tickArrayOne2";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tickArrayTwo0";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tickArrayTwo1";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tickArrayTwo2";
          isMut: true;
          isSigner: false;
        },
        {
          name: "oracleOne";
          isMut: false;
          isSigner: false;
        },
        {
          name: "oracleTwo";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        },
        {
          name: "otherAmountThreshold";
          type: "u64";
        },
        {
          name: "amountSpecifiedIsInput";
          type: "bool";
        },
        {
          name: "aToBOne";
          type: "bool";
        },
        {
          name: "aToBTwo";
          type: "bool";
        },
        {
          name: "sqrtPriceLimitOne";
          type: "u128";
        },
        {
          name: "sqrtPriceLimitTwo";
          type: "u128";
        }
      ];
    },
    {
      name: "initializePositionBundle";
      docs: [
        "Initializes a PositionBundle account that bundles several positions.",
        "A unique token will be minted to represent the position bundle in the users wallet."
      ];
      accounts: [
        {
          name: "positionBundle";
          isMut: true;
          isSigner: false;
        },
        {
          name: "positionBundleMint";
          isMut: true;
          isSigner: true;
        },
        {
          name: "positionBundleTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "positionBundleOwner";
          isMut: false;
          isSigner: false;
        },
        {
          name: "funder";
          isMut: true;
          isSigner: true;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "rent";
          isMut: false;
          isSigner: false;
        },
        {
          name: "associatedTokenProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "initializePositionBundleWithMetadata";
      docs: [
        "Initializes a PositionBundle account that bundles several positions.",
        "A unique token will be minted to represent the position bundle in the users wallet.",
        "Additional Metaplex metadata is appended to identify the token."
      ];
      accounts: [
        {
          name: "positionBundle";
          isMut: true;
          isSigner: false;
        },
        {
          name: "positionBundleMint";
          isMut: true;
          isSigner: true;
        },
        {
          name: "positionBundleMetadata";
          isMut: true;
          isSigner: false;
          docs: [
            "https://github.com/metaplex-foundation/metaplex-program-library/blob/773a574c4b34e5b9f248a81306ec24db064e255f/token-metadata/program/src/utils/metadata.rs#L100"
          ];
        },
        {
          name: "positionBundleTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "positionBundleOwner";
          isMut: false;
          isSigner: false;
        },
        {
          name: "funder";
          isMut: true;
          isSigner: true;
        },
        {
          name: "metadataUpdateAuth";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "rent";
          isMut: false;
          isSigner: false;
        },
        {
          name: "associatedTokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "metadataProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "deletePositionBundle";
      docs: [
        "Delete a PositionBundle account. Burns the position bundle token in the owner's wallet.",
        "",
        "### Authority",
        "- `position_bundle_owner` - The owner that owns the position bundle token.",
        "",
        "### Special Errors",
        "- `PositionBundleNotDeletable` - The provided position bundle has open positions."
      ];
      accounts: [
        {
          name: "positionBundle";
          isMut: true;
          isSigner: false;
        },
        {
          name: "positionBundleMint";
          isMut: true;
          isSigner: false;
        },
        {
          name: "positionBundleTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "positionBundleOwner";
          isMut: false;
          isSigner: true;
        },
        {
          name: "receiver";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "openBundledPosition";
      docs: [
        "Open a bundled position in a ElysiumPool. No new tokens are issued",
        "because the owner of the position bundle becomes the owner of the position.",
        "The position will start off with 0 liquidity.",
        "",
        "### Authority",
        "- `position_bundle_authority` - authority that owns the token corresponding to this desired position bundle.",
        "",
        "### Parameters",
        "- `bundle_index` - The bundle index that we'd like to open.",
        "- `tick_lower_index` - The tick specifying the lower end of the position range.",
        "- `tick_upper_index` - The tick specifying the upper end of the position range.",
        "",
        "#### Special Errors",
        "- `InvalidBundleIndex` - If the provided bundle index is out of bounds.",
        "- `InvalidTickIndex` - If a provided tick is out of bounds, out of order or not a multiple of",
        "the tick-spacing in this pool."
      ];
      accounts: [
        {
          name: "bundledPosition";
          isMut: true;
          isSigner: false;
        },
        {
          name: "positionBundle";
          isMut: true;
          isSigner: false;
        },
        {
          name: "positionBundleTokenAccount";
          isMut: false;
          isSigner: false;
        },
        {
          name: "positionBundleAuthority";
          isMut: false;
          isSigner: true;
        },
        {
          name: "pool";
          isMut: false;
          isSigner: false;
        },
        {
          name: "funder";
          isMut: true;
          isSigner: true;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "rent";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "bundleIndex";
          type: "u16";
        },
        {
          name: "tickLowerIndex";
          type: "i32";
        },
        {
          name: "tickUpperIndex";
          type: "i32";
        }
      ];
    },
    {
      name: "closeBundledPosition";
      docs: [
        "Close a bundled position in a ElysiumPool.",
        "",
        "### Authority",
        "- `position_bundle_authority` - authority that owns the token corresponding to this desired position bundle.",
        "",
        "### Parameters",
        "- `bundle_index` - The bundle index that we'd like to close.",
        "",
        "#### Special Errors",
        "- `InvalidBundleIndex` - If the provided bundle index is out of bounds.",
        "- `ClosePositionNotEmpty` - The provided position account is not empty."
      ];
      accounts: [
        {
          name: "bundledPosition";
          isMut: true;
          isSigner: false;
        },
        {
          name: "positionBundle";
          isMut: true;
          isSigner: false;
        },
        {
          name: "positionBundleTokenAccount";
          isMut: false;
          isSigner: false;
        },
        {
          name: "positionBundleAuthority";
          isMut: false;
          isSigner: true;
        },
        {
          name: "receiver";
          isMut: true;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "bundleIndex";
          type: "u16";
        }
      ];
    }
  ];
  accounts: [
    {
      name: "poolsConfig";
      type: {
        kind: "struct";
        fields: [
          {
            name: "feeAuthority";
            type: "publicKey";
          },
          {
            name: "collectProtocolFeesAuthority";
            type: "publicKey";
          },
          {
            name: "rewardEmissionsSuperAuthority";
            type: "publicKey";
          },
          {
            name: "defaultProtocolFeeRate";
            type: "u16";
          }
        ];
      };
    },
    {
      name: "feeTier";
      type: {
        kind: "struct";
        fields: [
          {
            name: "poolsConfig";
            type: "publicKey";
          },
          {
            name: "tickSpacing";
            type: "u16";
          },
          {
            name: "defaultFeeRate";
            type: "u16";
          }
        ];
      };
    },
    {
      name: "positionBundle";
      type: {
        kind: "struct";
        fields: [
          {
            name: "positionBundleMint";
            type: "publicKey";
          },
          {
            name: "positionBitmap";
            type: {
              array: ["u8", 32];
            };
          }
        ];
      };
    },
    {
      name: "position";
      type: {
        kind: "struct";
        fields: [
          {
            name: "pool";
            type: "publicKey";
          },
          {
            name: "positionMint";
            type: "publicKey";
          },
          {
            name: "liquidity";
            type: "u128";
          },
          {
            name: "tickLowerIndex";
            type: "i32";
          },
          {
            name: "tickUpperIndex";
            type: "i32";
          },
          {
            name: "feeGrowthCheckpointA";
            type: "u128";
          },
          {
            name: "feeOwedA";
            type: "u64";
          },
          {
            name: "feeGrowthCheckpointB";
            type: "u128";
          },
          {
            name: "feeOwedB";
            type: "u64";
          },
          {
            name: "rewardInfos";
            type: {
              array: [
                {
                  defined: "PositionRewardInfo";
                },
                3
              ];
            };
          }
        ];
      };
    },
    {
      name: "tickArray";
      type: {
        kind: "struct";
        fields: [
          {
            name: "startTickIndex";
            type: "i32";
          },
          {
            name: "ticks";
            type: {
              array: [
                {
                  defined: "Tick";
                },
                88
              ];
            };
          },
          {
            name: "pool";
            type: "publicKey";
          }
        ];
      };
    },
    {
      name: "pool";
      type: {
        kind: "struct";
        fields: [
          {
            name: "poolsConfig";
            type: "publicKey";
          },
          {
            name: "poolBump";
            type: {
              array: ["u8", 1];
            };
          },
          {
            name: "tickSpacing";
            type: "u16";
          },
          {
            name: "tickSpacingSeed";
            type: {
              array: ["u8", 2];
            };
          },
          {
            name: "feeRate";
            type: "u16";
          },
          {
            name: "protocolFeeRate";
            type: "u16";
          },
          {
            name: "liquidity";
            type: "u128";
          },
          {
            name: "sqrtPrice";
            type: "u128";
          },
          {
            name: "tickCurrentIndex";
            type: "i32";
          },
          {
            name: "protocolFeeOwedA";
            type: "u64";
          },
          {
            name: "protocolFeeOwedB";
            type: "u64";
          },
          {
            name: "tokenMintA";
            type: "publicKey";
          },
          {
            name: "tokenVaultA";
            type: "publicKey";
          },
          {
            name: "feeGrowthGlobalA";
            type: "u128";
          },
          {
            name: "tokenMintB";
            type: "publicKey";
          },
          {
            name: "tokenVaultB";
            type: "publicKey";
          },
          {
            name: "feeGrowthGlobalB";
            type: "u128";
          },
          {
            name: "rewardLastUpdatedTimestamp";
            type: "u64";
          },
          {
            name: "rewardInfos";
            type: {
              array: [
                {
                  defined: "ElysiumPoolRewardInfo";
                },
                3
              ];
            };
          }
        ];
      };
    }
  ];
  types: [
    {
      name: "OpenPositionBumps";
      type: {
        kind: "struct";
        fields: [
          {
            name: "positionBump";
            type: "u8";
          }
        ];
      };
    },
    {
      name: "OpenPositionWithMetadataBumps";
      type: {
        kind: "struct";
        fields: [
          {
            name: "positionBump";
            type: "u8";
          },
          {
            name: "metadataBump";
            type: "u8";
          }
        ];
      };
    },
    {
      name: "PositionRewardInfo";
      type: {
        kind: "struct";
        fields: [
          {
            name: "growthInsideCheckpoint";
            type: "u128";
          },
          {
            name: "amountOwed";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "Tick";
      type: {
        kind: "struct";
        fields: [
          {
            name: "initialized";
            type: "bool";
          },
          {
            name: "liquidityNet";
            type: "i128";
          },
          {
            name: "liquidityGross";
            type: "u128";
          },
          {
            name: "feeGrowthOutsideA";
            type: "u128";
          },
          {
            name: "feeGrowthOutsideB";
            type: "u128";
          },
          {
            name: "rewardGrowthsOutside";
            type: {
              array: ["u128", 3];
            };
          }
        ];
      };
    },
    {
      name: "ElysiumPoolRewardInfo";
      docs: [
        "Stores the state relevant for tracking liquidity mining rewards at the `ElysiumPool` level.",
        "These values are used in conjunction with `PositionRewardInfo`, `Tick.reward_growths_outside`,",
        "and `ElysiumPool.reward_last_updated_timestamp` to determine how many rewards are earned by open",
        "positions."
      ];
      type: {
        kind: "struct";
        fields: [
          {
            name: "mint";
            docs: ["Reward token mint."];
            type: "publicKey";
          },
          {
            name: "vault";
            docs: ["Reward vault token account."];
            type: "publicKey";
          },
          {
            name: "authority";
            docs: [
              "Authority account that has permission to initialize the reward and set emissions."
            ];
            type: "publicKey";
          },
          {
            name: "emissionsPerSecondX64";
            docs: [
              "Q64.64 number that indicates how many tokens per second are earned per unit of liquidity."
            ];
            type: "u128";
          },
          {
            name: "growthGlobalX64";
            docs: [
              "Q64.64 number that tracks the total tokens earned per unit of liquidity since the reward",
              "emissions were turned on."
            ];
            type: "u128";
          }
        ];
      };
    },
    {
      name: "ElysiumPoolBumps";
      type: {
        kind: "struct";
        fields: [
          {
            name: "poolBump";
            type: "u8";
          }
        ];
      };
    },
    {
      name: "CurrIndex";
      type: {
        kind: "enum";
        variants: [
          {
            name: "Below";
          },
          {
            name: "Inside";
          },
          {
            name: "Above";
          }
        ];
      };
    },
    {
      name: "TickLabel";
      type: {
        kind: "enum";
        variants: [
          {
            name: "Upper";
          },
          {
            name: "Lower";
          }
        ];
      };
    },
    {
      name: "Direction";
      type: {
        kind: "enum";
        variants: [
          {
            name: "Left";
          },
          {
            name: "Right";
          }
        ];
      };
    }
  ];
  errors: [
    {
      code: 6000;
      name: "InvalidEnum";
      msg: "Enum value could not be converted";
    },
    {
      code: 6001;
      name: "InvalidStartTick";
      msg: "Invalid start tick index provided.";
    },
    {
      code: 6002;
      name: "TickArrayExistInPool";
      msg: "Tick-array already exists in this pool";
    },
    {
      code: 6003;
      name: "TickArrayIndexOutofBounds";
      msg: "Attempt to search for a tick-array failed";
    },
    {
      code: 6004;
      name: "InvalidTickSpacing";
      msg: "Tick-spacing is not supported";
    },
    {
      code: 6005;
      name: "ClosePositionNotEmpty";
      msg: "Position is not empty It cannot be closed";
    },
    {
      code: 6006;
      name: "DivideByZero";
      msg: "Unable to divide by zero";
    },
    {
      code: 6007;
      name: "NumberCastError";
      msg: "Unable to cast number into BigInt";
    },
    {
      code: 6008;
      name: "NumberDownCastError";
      msg: "Unable to down cast number";
    },
    {
      code: 6009;
      name: "TickNotFound";
      msg: "Tick not found within tick array";
    },
    {
      code: 6010;
      name: "InvalidTickIndex";
      msg: "Provided tick index is either out of bounds or uninitializable";
    },
    {
      code: 6011;
      name: "SqrtPriceOutOfBounds";
      msg: "Provided sqrt price out of bounds";
    },
    {
      code: 6012;
      name: "LiquidityZero";
      msg: "Liquidity amount must be greater than zero";
    },
    {
      code: 6013;
      name: "LiquidityTooHigh";
      msg: "Liquidity amount must be less than i64::MAX";
    },
    {
      code: 6014;
      name: "LiquidityOverflow";
      msg: "Liquidity overflow";
    },
    {
      code: 6015;
      name: "LiquidityUnderflow";
      msg: "Liquidity underflow";
    },
    {
      code: 6016;
      name: "LiquidityNetError";
      msg: "Tick liquidity net underflowed or overflowed";
    },
    {
      code: 6017;
      name: "TokenMaxExceeded";
      msg: "Exceeded token max";
    },
    {
      code: 6018;
      name: "TokenMinSubceeded";
      msg: "Did not meet token min";
    },
    {
      code: 6019;
      name: "MissingOrInvalidDelegate";
      msg: "Position token account has a missing or invalid delegate";
    },
    {
      code: 6020;
      name: "InvalidPositionTokenAmount";
      msg: "Position token amount must be 1";
    },
    {
      code: 6021;
      name: "InvalidTimestampConversion";
      msg: "Timestamp should be convertible from i64 to u64";
    },
    {
      code: 6022;
      name: "InvalidTimestamp";
      msg: "Timestamp should be greater than the last updated timestamp";
    },
    {
      code: 6023;
      name: "InvalidTickArraySequence";
      msg: "Invalid tick array sequence provided for instruction.";
    },
    {
      code: 6024;
      name: "InvalidTokenMintOrder";
      msg: "Token Mint in wrong order";
    },
    {
      code: 6025;
      name: "RewardNotInitialized";
      msg: "Reward not initialized";
    },
    {
      code: 6026;
      name: "InvalidRewardIndex";
      msg: "Invalid reward index";
    },
    {
      code: 6027;
      name: "RewardVaultAmountInsufficient";
      msg: "Reward vault requires amount to support emissions for at least one day";
    },
    {
      code: 6028;
      name: "FeeRateMaxExceeded";
      msg: "Exceeded max fee rate";
    },
    {
      code: 6029;
      name: "ProtocolFeeRateMaxExceeded";
      msg: "Exceeded max protocol fee rate";
    },
    {
      code: 6030;
      name: "MultiplicationShiftRightOverflow";
      msg: "Multiplication with shift right overflow";
    },
    {
      code: 6031;
      name: "MulDivOverflow";
      msg: "Muldiv overflow";
    },
    {
      code: 6032;
      name: "MulDivInvalidInput";
      msg: "Invalid div_u256 input";
    },
    {
      code: 6033;
      name: "MultiplicationOverflow";
      msg: "Multiplication overflow";
    },
    {
      code: 6034;
      name: "InvalidSqrtPriceLimitDirection";
      msg: "Provided SqrtPriceLimit not in the same direction as the swap.";
    },
    {
      code: 6035;
      name: "ZeroTradableAmount";
      msg: "There are no tradable amount to swap.";
    },
    {
      code: 6036;
      name: "AmountOutBelowMinimum";
      msg: "Amount out below minimum threshold";
    },
    {
      code: 6037;
      name: "AmountInAboveMaximum";
      msg: "Amount in above maximum threshold";
    },
    {
      code: 6038;
      name: "TickArraySequenceInvalidIndex";
      msg: "Invalid index for tick array sequence";
    },
    {
      code: 6039;
      name: "AmountCalcOverflow";
      msg: "Amount calculated overflows";
    },
    {
      code: 6040;
      name: "AmountRemainingOverflow";
      msg: "Amount remaining overflows";
    },
    {
      code: 6041;
      name: "InvalidIntermediaryMint";
      msg: "Invalid intermediary mint";
    },
    {
      code: 6042;
      name: "DuplicateTwoHopPool";
      msg: "Duplicate two hop pool";
    },
    {
      code: 6043;
      name: "InvalidBundleIndex";
      msg: "Bundle index is out of bounds";
    },
    {
      code: 6044;
      name: "BundledPositionAlreadyOpened";
      msg: "Position has already been opened";
    },
    {
      code: 6045;
      name: "BundledPositionAlreadyClosed";
      msg: "Position has already been closed";
    },
    {
      code: 6046;
      name: "PositionBundleNotDeletable";
      msg: "Unable to delete PositionBundle with open positions";
    }
  ];
};

export const IDL: ElysiumPool = {
  version: "0.2.0",
  name: "pool",
  instructions: [
    {
      name: "initializeConfig",
      docs: [
        "Initializes a ElysiumPoolsConfig account that hosts info & authorities",
        "required to govern a set of ElysiumPools.",
        "",
        "### Parameters",
        "- `fee_authority` - Authority authorized to initialize fee-tiers and set customs fees.",
        "- `collect_protocol_fees_authority` - Authority authorized to collect protocol fees.",
        "- `reward_emissions_super_authority` - Authority authorized to set reward authorities in pools.",
      ],
      accounts: [
        {
          name: "config",
          isMut: true,
          isSigner: true,
        },
        {
          name: "funder",
          isMut: true,
          isSigner: true,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "feeAuthority",
          type: "publicKey",
        },
        {
          name: "collectProtocolFeesAuthority",
          type: "publicKey",
        },
        {
          name: "rewardEmissionsSuperAuthority",
          type: "publicKey",
        },
        {
          name: "defaultProtocolFeeRate",
          type: "u16",
        },
      ],
    },
    {
      name: "initializePool",
      docs: [
        "Initializes a ElysiumPool account.",
        "Fee rate is set to the default values on the config and supplied fee_tier.",
        "",
        "### Parameters",
        "- `bumps` - The bump value when deriving the PDA of the ElysiumPool address.",
        "- `tick_spacing` - The desired tick spacing for this pool.",
        "- `initial_sqrt_price` - The desired initial sqrt-price for this pool",
        "",
        "#### Special Errors",
        "`InvalidTokenMintOrder` - The order of mints have to be ordered by",
        "`SqrtPriceOutOfBounds` - provided initial_sqrt_price is not between 2^-64 to 2^64",
        "",
      ],
      accounts: [
        {
          name: "poolsConfig",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenMintA",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenMintB",
          isMut: false,
          isSigner: false,
        },
        {
          name: "funder",
          isMut: true,
          isSigner: true,
        },
        {
          name: "pool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenVaultA",
          isMut: true,
          isSigner: true,
        },
        {
          name: "tokenVaultB",
          isMut: true,
          isSigner: true,
        },
        {
          name: "feeTier",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "bumps",
          type: {
            defined: "ElysiumPoolBumps",
          },
        },
        {
          name: "tickSpacing",
          type: "u16",
        },
        {
          name: "initialSqrtPrice",
          type: "u128",
        },
      ],
    },
    {
      name: "initializeTickArray",
      docs: [
        "Initializes a tick_array account to represent a tick-range in a ElysiumPool.",
        "",
        "### Parameters",
        "- `start_tick_index` - The starting tick index for this tick-array.",
        "Has to be a multiple of TickArray size & the tick spacing of this pool.",
        "",
        "#### Special Errors",
        "- `InvalidStartTick` - if the provided start tick is out of bounds or is not a multiple of",
        "TICK_ARRAY_SIZE * tick spacing.",
      ],
      accounts: [
        {
          name: "pool",
          isMut: false,
          isSigner: false,
        },
        {
          name: "funder",
          isMut: true,
          isSigner: true,
        },
        {
          name: "tickArray",
          isMut: true,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "startTickIndex",
          type: "i32",
        },
      ],
    },
    {
      name: "initializeFeeTier",
      docs: [
        "Initializes a fee_tier account usable by ElysiumPools in a ElysiumPoolConfig space.",
        "",
        "### Authority",
        '- "fee_authority" - Set authority in the ElysiumPoolConfig',
        "",
        "### Parameters",
        "- `tick_spacing` - The tick-spacing that this fee-tier suggests the default_fee_rate for.",
        "- `default_fee_rate` - The default fee rate that a pool will use if the pool uses this",
        "fee tier during initialization.",
        "",
        "#### Special Errors",
        "- `FeeRateMaxExceeded` - If the provided default_fee_rate exceeds MAX_FEE_RATE.",
      ],
      accounts: [
        {
          name: "config",
          isMut: false,
          isSigner: false,
        },
        {
          name: "feeTier",
          isMut: true,
          isSigner: false,
        },
        {
          name: "funder",
          isMut: true,
          isSigner: true,
        },
        {
          name: "feeAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "tickSpacing",
          type: "u16",
        },
        {
          name: "defaultFeeRate",
          type: "u16",
        },
      ],
    },
    {
      name: "initializeReward",
      docs: [
        "Initialize reward for a ElysiumPool. A pool can only support up to a set number of rewards.",
        "",
        "### Authority",
        '- "reward_authority" - assigned authority by the reward_super_authority for the specified',
        "reward-index in this ElysiumPool",
        "",
        "### Parameters",
        "- `reward_index` - The reward index that we'd like to initialize. (0 <= index <= NUM_REWARDS)",
        "",
        "#### Special Errors",
        "- `InvalidRewardIndex` - If the provided reward index doesn't match the lowest uninitialized",
        "index in this pool, or exceeds NUM_REWARDS, or",
        "all reward slots for this pool has been initialized.",
      ],
      accounts: [
        {
          name: "rewardAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "funder",
          isMut: true,
          isSigner: true,
        },
        {
          name: "pool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "rewardMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rewardVault",
          isMut: true,
          isSigner: true,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "rewardIndex",
          type: "u8",
        },
      ],
    },
    {
      name: "setRewardEmissions",
      docs: [
        "Set the reward emissions for a reward in a ElysiumPool.",
        "",
        "### Authority",
        '- "reward_authority" - assigned authority by the reward_super_authority for the specified',
        "reward-index in this ElysiumPool",
        "",
        "### Parameters",
        "- `reward_index` - The reward index (0 <= index <= NUM_REWARDS) that we'd like to modify.",
        "- `emissions_per_second_x64` - The amount of rewards emitted in this pool.",
        "",
        "#### Special Errors",
        "- `RewardVaultAmountInsufficient` - The amount of rewards in the reward vault cannot emit",
        "more than a day of desired emissions.",
        "- `InvalidTimestamp` - Provided timestamp is not in order with the previous timestamp.",
        "- `InvalidRewardIndex` - If the provided reward index doesn't match the lowest uninitialized",
        "index in this pool, or exceeds NUM_REWARDS, or",
        "all reward slots for this pool has been initialized.",
      ],
      accounts: [
        {
          name: "pool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "rewardAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "rewardVault",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "rewardIndex",
          type: "u8",
        },
        {
          name: "emissionsPerSecondX64",
          type: "u128",
        },
      ],
    },
    {
      name: "openPosition",
      docs: [
        "Open a position in a ElysiumPool. A unique token will be minted to represent the position",
        "in the users wallet. The position will start off with 0 liquidity.",
        "",
        "### Parameters",
        "- `tick_lower_index` - The tick specifying the lower end of the position range.",
        "- `tick_upper_index` - The tick specifying the upper end of the position range.",
        "",
        "#### Special Errors",
        "- `InvalidTickIndex` - If a provided tick is out of bounds, out of order or not a multiple of",
        "the tick-spacing in this pool.",
      ],
      accounts: [
        {
          name: "funder",
          isMut: true,
          isSigner: true,
        },
        {
          name: "owner",
          isMut: false,
          isSigner: false,
        },
        {
          name: "position",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionMint",
          isMut: true,
          isSigner: true,
        },
        {
          name: "positionTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "pool",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "bumps",
          type: {
            defined: "OpenPositionBumps",
          },
        },
        {
          name: "tickLowerIndex",
          type: "i32",
        },
        {
          name: "tickUpperIndex",
          type: "i32",
        },
      ],
    },
    {
      name: "openPositionWithMetadata",
      docs: [
        "Open a position in a ElysiumPool. A unique token will be minted to represent the position",
        "in the users wallet. Additional Metaplex metadata is appended to identify the token.",
        "The position will start off with 0 liquidity.",
        "",
        "### Parameters",
        "- `tick_lower_index` - The tick specifying the lower end of the position range.",
        "- `tick_upper_index` - The tick specifying the upper end of the position range.",
        "",
        "#### Special Errors",
        "- `InvalidTickIndex` - If a provided tick is out of bounds, out of order or not a multiple of",
        "the tick-spacing in this pool.",
      ],
      accounts: [
        {
          name: "funder",
          isMut: true,
          isSigner: true,
        },
        {
          name: "owner",
          isMut: false,
          isSigner: false,
        },
        {
          name: "position",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionMint",
          isMut: true,
          isSigner: true,
        },
        {
          name: "positionMetadataAccount",
          isMut: true,
          isSigner: false,
          docs: [
            "https://github.com/metaplex-foundation/metaplex-program-library/blob/master/token-metadata/program/src/utils.rs#L873",
          ],
        },
        {
          name: "positionTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "pool",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "metadataProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "metadataUpdateAuth",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "bumps",
          type: {
            defined: "OpenPositionWithMetadataBumps",
          },
        },
        {
          name: "tickLowerIndex",
          type: "i32",
        },
        {
          name: "tickUpperIndex",
          type: "i32",
        },
      ],
    },
    {
      name: "increaseLiquidity",
      docs: [
        "Add liquidity to a position in the ElysiumPool. This call also updates the position's accrued fees and rewards.",
        "",
        "### Authority",
        "- `position_authority` - authority that owns the token corresponding to this desired position.",
        "",
        "### Parameters",
        "- `liquidity_amount` - The total amount of Liquidity the user is willing to deposit.",
        "- `token_max_a` - The maximum amount of tokenA the user is willing to deposit.",
        "- `token_max_b` - The maximum amount of tokenB the user is willing to deposit.",
        "",
        "#### Special Errors",
        "- `LiquidityZero` - Provided liquidity amount is zero.",
        "- `LiquidityTooHigh` - Provided liquidity exceeds u128::max.",
        "- `TokenMaxExceeded` - The required token to perform this operation exceeds the user defined amount.",
      ],
      accounts: [
        {
          name: "pool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "positionAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "position",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionTokenAccount",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenOwnerAccountA",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenOwnerAccountB",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenVaultA",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenVaultB",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tickArrayLower",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tickArrayUpper",
          isMut: true,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "liquidityAmount",
          type: "u128",
        },
        {
          name: "tokenMaxA",
          type: "u64",
        },
        {
          name: "tokenMaxB",
          type: "u64",
        },
      ],
    },
    {
      name: "decreaseLiquidity",
      docs: [
        "Withdraw liquidity from a position in the ElysiumPool. This call also updates the position's accrued fees and rewards.",
        "",
        "### Authority",
        "- `position_authority` - authority that owns the token corresponding to this desired position.",
        "",
        "### Parameters",
        "- `liquidity_amount` - The total amount of Liquidity the user desires to withdraw.",
        "- `token_min_a` - The minimum amount of tokenA the user is willing to withdraw.",
        "- `token_min_b` - The minimum amount of tokenB the user is willing to withdraw.",
        "",
        "#### Special Errors",
        "- `LiquidityZero` - Provided liquidity amount is zero.",
        "- `LiquidityTooHigh` - Provided liquidity exceeds u128::max.",
        "- `TokenMinSubceeded` - The required token to perform this operation subceeds the user defined amount.",
      ],
      accounts: [
        {
          name: "pool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "positionAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "position",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionTokenAccount",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenOwnerAccountA",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenOwnerAccountB",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenVaultA",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenVaultB",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tickArrayLower",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tickArrayUpper",
          isMut: true,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "liquidityAmount",
          type: "u128",
        },
        {
          name: "tokenMinA",
          type: "u64",
        },
        {
          name: "tokenMinB",
          type: "u64",
        },
      ],
    },
    {
      name: "updateFeesAndRewards",
      docs: [
        "Update the accrued fees and rewards for a position.",
        "",
        "#### Special Errors",
        "- `TickNotFound` - Provided tick array account does not contain the tick for this position.",
        "- `LiquidityZero` - Position has zero liquidity and therefore already has the most updated fees and reward values.",
      ],
      accounts: [
        {
          name: "pool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "position",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tickArrayLower",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tickArrayUpper",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "collectFees",
      docs: [
        "Collect fees accrued for this position.",
        "",
        "### Authority",
        "- `position_authority` - authority that owns the token corresponding to this desired position.",
      ],
      accounts: [
        {
          name: "pool",
          isMut: false,
          isSigner: false,
        },
        {
          name: "positionAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "position",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionTokenAccount",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenOwnerAccountA",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenVaultA",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenOwnerAccountB",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenVaultB",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "collectReward",
      docs: [
        "Collect rewards accrued for this position.",
        "",
        "### Authority",
        "- `position_authority` - authority that owns the token corresponding to this desired position.",
      ],
      accounts: [
        {
          name: "pool",
          isMut: false,
          isSigner: false,
        },
        {
          name: "positionAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "position",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionTokenAccount",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rewardOwnerAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "rewardVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "rewardIndex",
          type: "u8",
        },
      ],
    },
    {
      name: "collectProtocolFees",
      docs: [
        "Collect the protocol fees accrued in this ElysiumPool",
        "",
        "### Authority",
        "- `collect_protocol_fees_authority` - assigned authority in the ElysiumPoolConfig that can collect protocol fees",
      ],
      accounts: [
        {
          name: "poolsConfig",
          isMut: false,
          isSigner: false,
        },
        {
          name: "pool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "collectProtocolFeesAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "tokenVaultA",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenVaultB",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenDestinationA",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenDestinationB",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "swap",
      docs: [
        "Perform a swap in this ElysiumPool",
        "",
        "### Authority",
        '- "token_authority" - The authority to withdraw tokens from the input token account.',
        "",
        "### Parameters",
        "- `amount` - The amount of input or output token to swap from (depending on amount_specified_is_input).",
        "- `other_amount_threshold` - The maximum/minimum of input/output token to swap into (depending on amount_specified_is_input).",
        "- `sqrt_price_limit` - The maximum/minimum price the swap will swap to.",
        "- `amount_specified_is_input` - Specifies the token the parameter `amount`represents. If true, the amount represents the input token of the swap.",
        "- `a_to_b` - The direction of the swap. True if swapping from A to B. False if swapping from B to A.",
        "",
        "#### Special Errors",
        "- `ZeroTradableAmount` - User provided parameter `amount` is 0.",
        "- `InvalidSqrtPriceLimitDirection` - User provided parameter `sqrt_price_limit` does not match the direction of the trade.",
        "- `SqrtPriceOutOfBounds` - User provided parameter `sqrt_price_limit` is over Whirlppool's max/min bounds for sqrt-price.",
        "- `InvalidTickArraySequence` - User provided tick-arrays are not in sequential order required to proceed in this trade direction.",
        "- `TickArraySequenceInvalidIndex` - The swap loop attempted to access an invalid array index during the query of the next initialized tick.",
        "- `TickArrayIndexOutofBounds` - The swap loop attempted to access an invalid array index during tick crossing.",
        "- `LiquidityOverflow` - Liquidity value overflowed 128bits during tick crossing.",
        "- `InvalidTickSpacing` - The swap pool was initialized with tick-spacing of 0.",
      ],
      accounts: [
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "pool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenOwnerAccountA",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenVaultA",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenOwnerAccountB",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenVaultB",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tickArray0",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tickArray1",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tickArray2",
          isMut: true,
          isSigner: false,
        },
        {
          name: "oracle",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "amount",
          type: "u64",
        },
        {
          name: "otherAmountThreshold",
          type: "u64",
        },
        {
          name: "sqrtPriceLimit",
          type: "u128",
        },
        {
          name: "amountSpecifiedIsInput",
          type: "bool",
        },
        {
          name: "aToB",
          type: "bool",
        },
      ],
    },
    {
      name: "closePosition",
      docs: [
        "Close a position in a ElysiumPool. Burns the position token in the owner's wallet.",
        "",
        "### Authority",
        '- "position_authority" - The authority that owns the position token.',
        "",
        "#### Special Errors",
        "- `ClosePositionNotEmpty` - The provided position account is not empty.",
      ],
      accounts: [
        {
          name: "positionAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "receiver",
          isMut: true,
          isSigner: false,
        },
        {
          name: "position",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionMint",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "setDefaultFeeRate",
      docs: [
        "Set the default_fee_rate for a FeeTier",
        "Only the current fee authority has permission to invoke this instruction.",
        "",
        "### Authority",
        '- "fee_authority" - Set authority in the ElysiumPoolConfig',
        "",
        "### Parameters",
        "- `default_fee_rate` - The default fee rate that a pool will use if the pool uses this",
        "fee tier during initialization.",
        "",
        "#### Special Errors",
        "- `FeeRateMaxExceeded` - If the provided default_fee_rate exceeds MAX_FEE_RATE.",
      ],
      accounts: [
        {
          name: "poolsConfig",
          isMut: false,
          isSigner: false,
        },
        {
          name: "feeTier",
          isMut: true,
          isSigner: false,
        },
        {
          name: "feeAuthority",
          isMut: false,
          isSigner: true,
        },
      ],
      args: [
        {
          name: "defaultFeeRate",
          type: "u16",
        },
      ],
    },
    {
      name: "setDefaultProtocolFeeRate",
      docs: [
        "Sets the default protocol fee rate for a ElysiumPoolConfig",
        "Protocol fee rate is represented as a basis point.",
        "Only the current fee authority has permission to invoke this instruction.",
        "",
        "### Authority",
        '- "fee_authority" - Set authority that can modify pool fees in the ElysiumPoolConfig',
        "",
        "### Parameters",
        "- `default_protocol_fee_rate` - Rate that is referenced during the initialization of a ElysiumPool using this config.",
        "",
        "#### Special Errors",
        "- `ProtocolFeeRateMaxExceeded` - If the provided default_protocol_fee_rate exceeds MAX_PROTOCOL_FEE_RATE.",
      ],
      accounts: [
        {
          name: "poolsConfig",
          isMut: true,
          isSigner: false,
        },
        {
          name: "feeAuthority",
          isMut: false,
          isSigner: true,
        },
      ],
      args: [
        {
          name: "defaultProtocolFeeRate",
          type: "u16",
        },
      ],
    },
    {
      name: "setFeeRate",
      docs: [
        "Sets the fee rate for a ElysiumPool.",
        "Fee rate is represented as hundredths of a basis point.",
        "Only the current fee authority has permission to invoke this instruction.",
        "",
        "### Authority",
        '- "fee_authority" - Set authority that can modify pool fees in the ElysiumPoolConfig',
        "",
        "### Parameters",
        "- `fee_rate` - The rate that the pool will use to calculate fees going onwards.",
        "",
        "#### Special Errors",
        "- `FeeRateMaxExceeded` - If the provided fee_rate exceeds MAX_FEE_RATE.",
      ],
      accounts: [
        {
          name: "poolsConfig",
          isMut: false,
          isSigner: false,
        },
        {
          name: "pool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "feeAuthority",
          isMut: false,
          isSigner: true,
        },
      ],
      args: [
        {
          name: "feeRate",
          type: "u16",
        },
      ],
    },
    {
      name: "setProtocolFeeRate",
      docs: [
        "Sets the protocol fee rate for a ElysiumPool.",
        "Protocol fee rate is represented as a basis point.",
        "Only the current fee authority has permission to invoke this instruction.",
        "",
        "### Authority",
        '- "fee_authority" - Set authority that can modify pool fees in the ElysiumPoolConfig',
        "",
        "### Parameters",
        "- `protocol_fee_rate` - The rate that the pool will use to calculate protocol fees going onwards.",
        "",
        "#### Special Errors",
        "- `ProtocolFeeRateMaxExceeded` - If the provided default_protocol_fee_rate exceeds MAX_PROTOCOL_FEE_RATE.",
      ],
      accounts: [
        {
          name: "poolsConfig",
          isMut: false,
          isSigner: false,
        },
        {
          name: "pool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "feeAuthority",
          isMut: false,
          isSigner: true,
        },
      ],
      args: [
        {
          name: "protocolFeeRate",
          type: "u16",
        },
      ],
    },
    {
      name: "setFeeAuthority",
      docs: [
        "Sets the fee authority for a ElysiumPoolConfig.",
        "The fee authority can set the fee & protocol fee rate for individual pools or",
        "set the default fee rate for newly minted pools.",
        "Only the current fee authority has permission to invoke this instruction.",
        "",
        "### Authority",
        '- "fee_authority" - Set authority that can modify pool fees in the ElysiumPoolConfig',
      ],
      accounts: [
        {
          name: "poolsConfig",
          isMut: true,
          isSigner: false,
        },
        {
          name: "feeAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "newFeeAuthority",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "setCollectProtocolFeesAuthority",
      docs: [
        "Sets the fee authority to collect protocol fees for a ElysiumPoolConfig.",
        "Only the current collect protocol fee authority has permission to invoke this instruction.",
        "",
        "### Authority",
        '- "fee_authority" - Set authority that can collect protocol fees in the ElysiumPoolConfig',
      ],
      accounts: [
        {
          name: "poolsConfig",
          isMut: true,
          isSigner: false,
        },
        {
          name: "collectProtocolFeesAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "newCollectProtocolFeesAuthority",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "setRewardAuthority",
      docs: [
        "Set the pool reward authority at the provided `reward_index`.",
        "Only the current reward authority for this reward index has permission to invoke this instruction.",
        "",
        "### Authority",
        '- "reward_authority" - Set authority that can control reward emission for this particular reward.',
        "",
        "#### Special Errors",
        "- `InvalidRewardIndex` - If the provided reward index doesn't match the lowest uninitialized",
        "index in this pool, or exceeds NUM_REWARDS, or",
        "all reward slots for this pool has been initialized.",
      ],
      accounts: [
        {
          name: "pool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "rewardAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "newRewardAuthority",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "rewardIndex",
          type: "u8",
        },
      ],
    },
    {
      name: "setRewardAuthorityBySuperAuthority",
      docs: [
        "Set the pool reward authority at the provided `reward_index`.",
        "Only the current reward super authority has permission to invoke this instruction.",
        "",
        "### Authority",
        '- "reward_authority" - Set authority that can control reward emission for this particular reward.',
        "",
        "#### Special Errors",
        "- `InvalidRewardIndex` - If the provided reward index doesn't match the lowest uninitialized",
        "index in this pool, or exceeds NUM_REWARDS, or",
        "all reward slots for this pool has been initialized.",
      ],
      accounts: [
        {
          name: "poolsConfig",
          isMut: false,
          isSigner: false,
        },
        {
          name: "pool",
          isMut: true,
          isSigner: false,
        },
        {
          name: "rewardEmissionsSuperAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "newRewardAuthority",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "rewardIndex",
          type: "u8",
        },
      ],
    },
    {
      name: "setRewardEmissionsSuperAuthority",
      docs: [
        "Set the pool reward super authority for a ElysiumPoolConfig",
        "Only the current reward super authority has permission to invoke this instruction.",
        "This instruction will not change the authority on any `ElysiumPoolRewardInfo` pool rewards.",
        "",
        "### Authority",
        '- "reward_emissions_super_authority" - Set authority that can control reward authorities for all pools in this config space.',
      ],
      accounts: [
        {
          name: "poolsConfig",
          isMut: true,
          isSigner: false,
        },
        {
          name: "rewardEmissionsSuperAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "newRewardEmissionsSuperAuthority",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "twoHopSwap",
      docs: [
        "Perform a two-hop swap in this ElysiumPool",
        "",
        "### Authority",
        '- "token_authority" - The authority to withdraw tokens from the input token account.',
        "",
        "### Parameters",
        "- `amount` - The amount of input or output token to swap from (depending on amount_specified_is_input).",
        "- `other_amount_threshold` - The maximum/minimum of input/output token to swap into (depending on amount_specified_is_input).",
        "- `amount_specified_is_input` - Specifies the token the parameter `amount`represents. If true, the amount represents the input token of the swap.",
        "- `a_to_b_one` - The direction of the swap of hop one. True if swapping from A to B. False if swapping from B to A.",
        "- `a_to_b_two` - The direction of the swap of hop two. True if swapping from A to B. False if swapping from B to A.",
        "- `sqrt_price_limit_one` - The maximum/minimum price the swap will swap to in the first hop.",
        "- `sqrt_price_limit_two` - The maximum/minimum price the swap will swap to in the second hop.",
        "",
        "#### Special Errors",
        "- `ZeroTradableAmount` - User provided parameter `amount` is 0.",
        "- `InvalidSqrtPriceLimitDirection` - User provided parameter `sqrt_price_limit` does not match the direction of the trade.",
        "- `SqrtPriceOutOfBounds` - User provided parameter `sqrt_price_limit` is over Whirlppool's max/min bounds for sqrt-price.",
        "- `InvalidTickArraySequence` - User provided tick-arrays are not in sequential order required to proceed in this trade direction.",
        "- `TickArraySequenceInvalidIndex` - The swap loop attempted to access an invalid array index during the query of the next initialized tick.",
        "- `TickArrayIndexOutofBounds` - The swap loop attempted to access an invalid array index during tick crossing.",
        "- `LiquidityOverflow` - Liquidity value overflowed 128bits during tick crossing.",
        "- `InvalidTickSpacing` - The swap pool was initialized with tick-spacing of 0.",
        "- `InvalidIntermediaryMint` - Error if the intermediary mint between hop one and two do not equal.",
        "- `DuplicateTwoHopPool` - Error if pool one & two are the same pool.",
      ],
      accounts: [
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "poolOne",
          isMut: true,
          isSigner: false,
        },
        {
          name: "poolTwo",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenOwnerAccountOneA",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenVaultOneA",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenOwnerAccountOneB",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenVaultOneB",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenOwnerAccountTwoA",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenVaultTwoA",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenOwnerAccountTwoB",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenVaultTwoB",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tickArrayOne0",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tickArrayOne1",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tickArrayOne2",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tickArrayTwo0",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tickArrayTwo1",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tickArrayTwo2",
          isMut: true,
          isSigner: false,
        },
        {
          name: "oracleOne",
          isMut: false,
          isSigner: false,
        },
        {
          name: "oracleTwo",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "amount",
          type: "u64",
        },
        {
          name: "otherAmountThreshold",
          type: "u64",
        },
        {
          name: "amountSpecifiedIsInput",
          type: "bool",
        },
        {
          name: "aToBOne",
          type: "bool",
        },
        {
          name: "aToBTwo",
          type: "bool",
        },
        {
          name: "sqrtPriceLimitOne",
          type: "u128",
        },
        {
          name: "sqrtPriceLimitTwo",
          type: "u128",
        },
      ],
    },
    {
      name: "initializePositionBundle",
      docs: [
        "Initializes a PositionBundle account that bundles several positions.",
        "A unique token will be minted to represent the position bundle in the users wallet.",
      ],
      accounts: [
        {
          name: "positionBundle",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionBundleMint",
          isMut: true,
          isSigner: true,
        },
        {
          name: "positionBundleTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionBundleOwner",
          isMut: false,
          isSigner: false,
        },
        {
          name: "funder",
          isMut: true,
          isSigner: true,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "initializePositionBundleWithMetadata",
      docs: [
        "Initializes a PositionBundle account that bundles several positions.",
        "A unique token will be minted to represent the position bundle in the users wallet.",
        "Additional Metaplex metadata is appended to identify the token.",
      ],
      accounts: [
        {
          name: "positionBundle",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionBundleMint",
          isMut: true,
          isSigner: true,
        },
        {
          name: "positionBundleMetadata",
          isMut: true,
          isSigner: false,
          docs: [
            "https://github.com/metaplex-foundation/metaplex-program-library/blob/773a574c4b34e5b9f248a81306ec24db064e255f/token-metadata/program/src/utils/metadata.rs#L100",
          ],
        },
        {
          name: "positionBundleTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionBundleOwner",
          isMut: false,
          isSigner: false,
        },
        {
          name: "funder",
          isMut: true,
          isSigner: true,
        },
        {
          name: "metadataUpdateAuth",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "metadataProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "deletePositionBundle",
      docs: [
        "Delete a PositionBundle account. Burns the position bundle token in the owner's wallet.",
        "",
        "### Authority",
        "- `position_bundle_owner` - The owner that owns the position bundle token.",
        "",
        "### Special Errors",
        "- `PositionBundleNotDeletable` - The provided position bundle has open positions.",
      ],
      accounts: [
        {
          name: "positionBundle",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionBundleMint",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionBundleTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionBundleOwner",
          isMut: false,
          isSigner: true,
        },
        {
          name: "receiver",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "openBundledPosition",
      docs: [
        "Open a bundled position in a ElysiumPool. No new tokens are issued",
        "because the owner of the position bundle becomes the owner of the position.",
        "The position will start off with 0 liquidity.",
        "",
        "### Authority",
        "- `position_bundle_authority` - authority that owns the token corresponding to this desired position bundle.",
        "",
        "### Parameters",
        "- `bundle_index` - The bundle index that we'd like to open.",
        "- `tick_lower_index` - The tick specifying the lower end of the position range.",
        "- `tick_upper_index` - The tick specifying the upper end of the position range.",
        "",
        "#### Special Errors",
        "- `InvalidBundleIndex` - If the provided bundle index is out of bounds.",
        "- `InvalidTickIndex` - If a provided tick is out of bounds, out of order or not a multiple of",
        "the tick-spacing in this pool.",
      ],
      accounts: [
        {
          name: "bundledPosition",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionBundle",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionBundleTokenAccount",
          isMut: false,
          isSigner: false,
        },
        {
          name: "positionBundleAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "pool",
          isMut: false,
          isSigner: false,
        },
        {
          name: "funder",
          isMut: true,
          isSigner: true,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "bundleIndex",
          type: "u16",
        },
        {
          name: "tickLowerIndex",
          type: "i32",
        },
        {
          name: "tickUpperIndex",
          type: "i32",
        },
      ],
    },
    {
      name: "closeBundledPosition",
      docs: [
        "Close a bundled position in a ElysiumPool.",
        "",
        "### Authority",
        "- `position_bundle_authority` - authority that owns the token corresponding to this desired position bundle.",
        "",
        "### Parameters",
        "- `bundle_index` - The bundle index that we'd like to close.",
        "",
        "#### Special Errors",
        "- `InvalidBundleIndex` - If the provided bundle index is out of bounds.",
        "- `ClosePositionNotEmpty` - The provided position account is not empty.",
      ],
      accounts: [
        {
          name: "bundledPosition",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionBundle",
          isMut: true,
          isSigner: false,
        },
        {
          name: "positionBundleTokenAccount",
          isMut: false,
          isSigner: false,
        },
        {
          name: "positionBundleAuthority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "receiver",
          isMut: true,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "bundleIndex",
          type: "u16",
        },
      ],
    },
  ],
  accounts: [
    {
      name: "poolsConfig",
      type: {
        kind: "struct",
        fields: [
          {
            name: "feeAuthority",
            type: "publicKey",
          },
          {
            name: "collectProtocolFeesAuthority",
            type: "publicKey",
          },
          {
            name: "rewardEmissionsSuperAuthority",
            type: "publicKey",
          },
          {
            name: "defaultProtocolFeeRate",
            type: "u16",
          },
        ],
      },
    },
    {
      name: "feeTier",
      type: {
        kind: "struct",
        fields: [
          {
            name: "poolsConfig",
            type: "publicKey",
          },
          {
            name: "tickSpacing",
            type: "u16",
          },
          {
            name: "defaultFeeRate",
            type: "u16",
          },
        ],
      },
    },
    {
      name: "positionBundle",
      type: {
        kind: "struct",
        fields: [
          {
            name: "positionBundleMint",
            type: "publicKey",
          },
          {
            name: "positionBitmap",
            type: {
              array: ["u8", 32],
            },
          },
        ],
      },
    },
    {
      name: "position",
      type: {
        kind: "struct",
        fields: [
          {
            name: "pool",
            type: "publicKey",
          },
          {
            name: "positionMint",
            type: "publicKey",
          },
          {
            name: "liquidity",
            type: "u128",
          },
          {
            name: "tickLowerIndex",
            type: "i32",
          },
          {
            name: "tickUpperIndex",
            type: "i32",
          },
          {
            name: "feeGrowthCheckpointA",
            type: "u128",
          },
          {
            name: "feeOwedA",
            type: "u64",
          },
          {
            name: "feeGrowthCheckpointB",
            type: "u128",
          },
          {
            name: "feeOwedB",
            type: "u64",
          },
          {
            name: "rewardInfos",
            type: {
              array: [
                {
                  defined: "PositionRewardInfo",
                },
                3,
              ],
            },
          },
        ],
      },
    },
    {
      name: "tickArray",
      type: {
        kind: "struct",
        fields: [
          {
            name: "startTickIndex",
            type: "i32",
          },
          {
            name: "ticks",
            type: {
              array: [
                {
                  defined: "Tick",
                },
                88,
              ],
            },
          },
          {
            name: "pool",
            type: "publicKey",
          },
        ],
      },
    },
    {
      name: "pool",
      type: {
        kind: "struct",
        fields: [
          {
            name: "poolsConfig",
            type: "publicKey",
          },
          {
            name: "poolBump",
            type: {
              array: ["u8", 1],
            },
          },
          {
            name: "tickSpacing",
            type: "u16",
          },
          {
            name: "tickSpacingSeed",
            type: {
              array: ["u8", 2],
            },
          },
          {
            name: "feeRate",
            type: "u16",
          },
          {
            name: "protocolFeeRate",
            type: "u16",
          },
          {
            name: "liquidity",
            type: "u128",
          },
          {
            name: "sqrtPrice",
            type: "u128",
          },
          {
            name: "tickCurrentIndex",
            type: "i32",
          },
          {
            name: "protocolFeeOwedA",
            type: "u64",
          },
          {
            name: "protocolFeeOwedB",
            type: "u64",
          },
          {
            name: "tokenMintA",
            type: "publicKey",
          },
          {
            name: "tokenVaultA",
            type: "publicKey",
          },
          {
            name: "feeGrowthGlobalA",
            type: "u128",
          },
          {
            name: "tokenMintB",
            type: "publicKey",
          },
          {
            name: "tokenVaultB",
            type: "publicKey",
          },
          {
            name: "feeGrowthGlobalB",
            type: "u128",
          },
          {
            name: "rewardLastUpdatedTimestamp",
            type: "u64",
          },
          {
            name: "rewardInfos",
            type: {
              array: [
                {
                  defined: "ElysiumPoolRewardInfo",
                },
                3,
              ],
            },
          },
        ],
      },
    },
  ],
  types: [
    {
      name: "OpenPositionBumps",
      type: {
        kind: "struct",
        fields: [
          {
            name: "positionBump",
            type: "u8",
          },
        ],
      },
    },
    {
      name: "OpenPositionWithMetadataBumps",
      type: {
        kind: "struct",
        fields: [
          {
            name: "positionBump",
            type: "u8",
          },
          {
            name: "metadataBump",
            type: "u8",
          },
        ],
      },
    },
    {
      name: "PositionRewardInfo",
      type: {
        kind: "struct",
        fields: [
          {
            name: "growthInsideCheckpoint",
            type: "u128",
          },
          {
            name: "amountOwed",
            type: "u64",
          },
        ],
      },
    },
    {
      name: "Tick",
      type: {
        kind: "struct",
        fields: [
          {
            name: "initialized",
            type: "bool",
          },
          {
            name: "liquidityNet",
            type: "i128",
          },
          {
            name: "liquidityGross",
            type: "u128",
          },
          {
            name: "feeGrowthOutsideA",
            type: "u128",
          },
          {
            name: "feeGrowthOutsideB",
            type: "u128",
          },
          {
            name: "rewardGrowthsOutside",
            type: {
              array: ["u128", 3],
            },
          },
        ],
      },
    },
    {
      name: "ElysiumPoolRewardInfo",
      docs: [
        "Stores the state relevant for tracking liquidity mining rewards at the `ElysiumPool` level.",
        "These values are used in conjunction with `PositionRewardInfo`, `Tick.reward_growths_outside`,",
        "and `ElysiumPool.reward_last_updated_timestamp` to determine how many rewards are earned by open",
        "positions.",
      ],
      type: {
        kind: "struct",
        fields: [
          {
            name: "mint",
            docs: ["Reward token mint."],
            type: "publicKey",
          },
          {
            name: "vault",
            docs: ["Reward vault token account."],
            type: "publicKey",
          },
          {
            name: "authority",
            docs: [
              "Authority account that has permission to initialize the reward and set emissions.",
            ],
            type: "publicKey",
          },
          {
            name: "emissionsPerSecondX64",
            docs: [
              "Q64.64 number that indicates how many tokens per second are earned per unit of liquidity.",
            ],
            type: "u128",
          },
          {
            name: "growthGlobalX64",
            docs: [
              "Q64.64 number that tracks the total tokens earned per unit of liquidity since the reward",
              "emissions were turned on.",
            ],
            type: "u128",
          },
        ],
      },
    },
    {
      name: "ElysiumPoolBumps",
      type: {
        kind: "struct",
        fields: [
          {
            name: "poolBump",
            type: "u8",
          },
        ],
      },
    },
    {
      name: "CurrIndex",
      type: {
        kind: "enum",
        variants: [
          {
            name: "Below",
          },
          {
            name: "Inside",
          },
          {
            name: "Above",
          },
        ],
      },
    },
    {
      name: "TickLabel",
      type: {
        kind: "enum",
        variants: [
          {
            name: "Upper",
          },
          {
            name: "Lower",
          },
        ],
      },
    },
    {
      name: "Direction",
      type: {
        kind: "enum",
        variants: [
          {
            name: "Left",
          },
          {
            name: "Right",
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: "InvalidEnum",
      msg: "Enum value could not be converted",
    },
    {
      code: 6001,
      name: "InvalidStartTick",
      msg: "Invalid start tick index provided.",
    },
    {
      code: 6002,
      name: "TickArrayExistInPool",
      msg: "Tick-array already exists in this pool",
    },
    {
      code: 6003,
      name: "TickArrayIndexOutofBounds",
      msg: "Attempt to search for a tick-array failed",
    },
    {
      code: 6004,
      name: "InvalidTickSpacing",
      msg: "Tick-spacing is not supported",
    },
    {
      code: 6005,
      name: "ClosePositionNotEmpty",
      msg: "Position is not empty It cannot be closed",
    },
    {
      code: 6006,
      name: "DivideByZero",
      msg: "Unable to divide by zero",
    },
    {
      code: 6007,
      name: "NumberCastError",
      msg: "Unable to cast number into BigInt",
    },
    {
      code: 6008,
      name: "NumberDownCastError",
      msg: "Unable to down cast number",
    },
    {
      code: 6009,
      name: "TickNotFound",
      msg: "Tick not found within tick array",
    },
    {
      code: 6010,
      name: "InvalidTickIndex",
      msg: "Provided tick index is either out of bounds or uninitializable",
    },
    {
      code: 6011,
      name: "SqrtPriceOutOfBounds",
      msg: "Provided sqrt price out of bounds",
    },
    {
      code: 6012,
      name: "LiquidityZero",
      msg: "Liquidity amount must be greater than zero",
    },
    {
      code: 6013,
      name: "LiquidityTooHigh",
      msg: "Liquidity amount must be less than i64::MAX",
    },
    {
      code: 6014,
      name: "LiquidityOverflow",
      msg: "Liquidity overflow",
    },
    {
      code: 6015,
      name: "LiquidityUnderflow",
      msg: "Liquidity underflow",
    },
    {
      code: 6016,
      name: "LiquidityNetError",
      msg: "Tick liquidity net underflowed or overflowed",
    },
    {
      code: 6017,
      name: "TokenMaxExceeded",
      msg: "Exceeded token max",
    },
    {
      code: 6018,
      name: "TokenMinSubceeded",
      msg: "Did not meet token min",
    },
    {
      code: 6019,
      name: "MissingOrInvalidDelegate",
      msg: "Position token account has a missing or invalid delegate",
    },
    {
      code: 6020,
      name: "InvalidPositionTokenAmount",
      msg: "Position token amount must be 1",
    },
    {
      code: 6021,
      name: "InvalidTimestampConversion",
      msg: "Timestamp should be convertible from i64 to u64",
    },
    {
      code: 6022,
      name: "InvalidTimestamp",
      msg: "Timestamp should be greater than the last updated timestamp",
    },
    {
      code: 6023,
      name: "InvalidTickArraySequence",
      msg: "Invalid tick array sequence provided for instruction.",
    },
    {
      code: 6024,
      name: "InvalidTokenMintOrder",
      msg: "Token Mint in wrong order",
    },
    {
      code: 6025,
      name: "RewardNotInitialized",
      msg: "Reward not initialized",
    },
    {
      code: 6026,
      name: "InvalidRewardIndex",
      msg: "Invalid reward index",
    },
    {
      code: 6027,
      name: "RewardVaultAmountInsufficient",
      msg: "Reward vault requires amount to support emissions for at least one day",
    },
    {
      code: 6028,
      name: "FeeRateMaxExceeded",
      msg: "Exceeded max fee rate",
    },
    {
      code: 6029,
      name: "ProtocolFeeRateMaxExceeded",
      msg: "Exceeded max protocol fee rate",
    },
    {
      code: 6030,
      name: "MultiplicationShiftRightOverflow",
      msg: "Multiplication with shift right overflow",
    },
    {
      code: 6031,
      name: "MulDivOverflow",
      msg: "Muldiv overflow",
    },
    {
      code: 6032,
      name: "MulDivInvalidInput",
      msg: "Invalid div_u256 input",
    },
    {
      code: 6033,
      name: "MultiplicationOverflow",
      msg: "Multiplication overflow",
    },
    {
      code: 6034,
      name: "InvalidSqrtPriceLimitDirection",
      msg: "Provided SqrtPriceLimit not in the same direction as the swap.",
    },
    {
      code: 6035,
      name: "ZeroTradableAmount",
      msg: "There are no tradable amount to swap.",
    },
    {
      code: 6036,
      name: "AmountOutBelowMinimum",
      msg: "Amount out below minimum threshold",
    },
    {
      code: 6037,
      name: "AmountInAboveMaximum",
      msg: "Amount in above maximum threshold",
    },
    {
      code: 6038,
      name: "TickArraySequenceInvalidIndex",
      msg: "Invalid index for tick array sequence",
    },
    {
      code: 6039,
      name: "AmountCalcOverflow",
      msg: "Amount calculated overflows",
    },
    {
      code: 6040,
      name: "AmountRemainingOverflow",
      msg: "Amount remaining overflows",
    },
    {
      code: 6041,
      name: "InvalidIntermediaryMint",
      msg: "Invalid intermediary mint",
    },
    {
      code: 6042,
      name: "DuplicateTwoHopPool",
      msg: "Duplicate two hop pool",
    },
    {
      code: 6043,
      name: "InvalidBundleIndex",
      msg: "Bundle index is out of bounds",
    },
    {
      code: 6044,
      name: "BundledPositionAlreadyOpened",
      msg: "Position has already been opened",
    },
    {
      code: 6045,
      name: "BundledPositionAlreadyClosed",
      msg: "Position has already been closed",
    },
    {
      code: 6046,
      name: "PositionBundleNotDeletable",
      msg: "Unable to delete PositionBundle with open positions",
    },
  ],
};
