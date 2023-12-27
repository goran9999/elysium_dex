export enum MathErrorCode {
  MultiplicationOverflow = `MultiplicationOverflow`,
  MulDivOverflow = `MulDivOverflow`,
  MultiplicationShiftRightOverflow = `MultiplicationShiftRightOverflow`,
  DivideByZero = `DivideByZero`,
}

export enum TokenErrorCode {
  TokenMaxExceeded = `TokenMaxExceeded`,
  TokenMinSubceeded = `TokenMinSubceeded`,
}

export enum SwapErrorCode {
  InvalidDevFeePercentage = `InvalidDevFeePercentage`,
  InvalidSqrtPriceLimitDirection = `InvalidSqrtPriceLimitDirection`,
  SqrtPriceOutOfBounds = `SqrtPriceOutOfBounds`,
  ZeroTradableAmount = `ZeroTradableAmount`,
  AmountOutBelowMinimum = `AmountOutBelowMinimum`,
  AmountInAboveMaximum = `AmountInAboveMaximum`,
  TickArrayCrossingAboveMax = `TickArrayCrossingAboveMax`,
  TickArrayIndexNotInitialized = `TickArrayIndexNotInitialized`,
  TickArraySequenceInvalid = `TickArraySequenceInvalid`,
}

export enum RouteQueryErrorCode {
  RouteDoesNotExist = "RouteDoesNotExist",
  TradeAmountTooHigh = "TradeAmountTooHigh",
  ZeroInputAmount = "ZeroInputAmount",
  General = "General",
}

export type ElysiumPoolsErrorCode =
  | TokenErrorCode
  | SwapErrorCode
  | MathErrorCode
  | RouteQueryErrorCode;

export class ElysiumPoolsError extends Error {
  message: string;
  errorCode?: ElysiumPoolsErrorCode;
  constructor(message: string, errorCode?: ElysiumPoolsErrorCode, stack?: string) {
    super(message);
    this.message = message;
    this.errorCode = errorCode;
    this.stack = stack;
  }

  public static isElysiumPoolsErrorCode(e: any, code: ElysiumPoolsErrorCode): boolean {
    return e instanceof ElysiumPoolsError && e.errorCode === code;
  }
}
