/**
 * Creates a standardized API error response.
 *
 * Under the hood, this function maps our internal API errors to the `H3Error`s.
 *
 * @param data The error data to include in the response.
 * @returns The `H3Error` instance.
 */
export function createApiError(data: ApiErrorData) {
  const [statusCode, statusMessage] = mapApiErrorToHttpStatus(data.code);
  return createError({ statusCode, statusMessage, data });
}

/**
 * Maps our internal API error codes to standard HTTP status codes.
 * @param code The API-specific error code.
 * @returns The most appropriate HTTP status code and message.
 */
function mapApiErrorToHttpStatus(code: ApiErrorCode): [code: number, message: string] {
  switch (code) {
    case ApiErrorCode.BadRequest:
      return [400, "Bad Request"];

    case ApiErrorCode.NotFound:
      return [404, "Not Found"];

    case ApiErrorCode.NotAllowed:
      return [403, "Forbidden"];

    case ApiErrorCode.UserAlreadyInDuel:
    case ApiErrorCode.DuelNotActive:
    case ApiErrorCode.CantDuelTheDayBeforeWeeklyRandomDuels:
      return [409, "Conflict"];

    default:
      return [500, "Internal Server Error"];
  }
}
