/** Custom error data for API errors. */
export interface ApiErrorData {
  /** The error code. */
  code: ApiErrorCode;
  /** The error message. */
  message: string;
  /** Additional error details. */
  details?: Record<string, unknown>;
}

export enum ApiErrorCode {
  // General errors.
  NotFound = "NotFound",
  NotAllowed = "NotAllowed",

  // Duel errors.
  UserAlreadyInDuel = "UserAlreadyInDuel",
  OtherUserAlreadyInDuel = "OtherUserAlreadyInDuel",
  DuelNotActive = "DuelNotActive",
  CantDuelTheDayBeforeWeeklyRandomDuels = "CantDuelTheDayBeforeWeeklyRandomDuels",
}
