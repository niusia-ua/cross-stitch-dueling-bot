import type { H3Event } from "h3";
import jwt from "jsonwebtoken";

import { JWT_COOKIE_NAME } from "~~/server/constants.js";

/**
 * Get the JWT authentication data from the request.
 *
 * This function retrieves the JWT from the cookie, verifies it, and returns the decoded user information.
 *
 * This function will throw an error if the JWT is not present or invalid.
 *
 * @param event The H3 event object representing the request.
 * @returns The decoded JWT payload containing user information.
 */
export function getJwtAuthData(event: H3Event) {
  const config = useRuntimeConfig(event);

  const cookie = getCookie(event, JWT_COOKIE_NAME);
  if (!cookie) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
      message: "No authentication token found",
    });
  }

  try {
    const decoded = jwt.verify(cookie, config.JWT_SECRET);
    return decoded as { userId: number } & jwt.JwtPayload;
  } catch (err) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
      message: "Invalid authentication token",
      cause: err,
    });
  }
}
