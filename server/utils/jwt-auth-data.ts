import type { H3Event } from "h3";
import jwt from "jsonwebtoken";

const JWT_COOKIE_NAME = "cross-stitch-dueling-bot-jwt";

interface JwtPayload {
  userId: number;
}

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
    return jwt.verify(cookie, config.JWT_SECRET) as JwtPayload;
  } catch (err) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
      message: "Invalid authentication token",
      cause: err,
    });
  }
}

/**
 * Set the JWT authentication data in the response.
 * @param event The H3 event object representing the request.
 * @param payload The JWT payload containing user information.
 */
export function setJwtAuthData(event: H3Event, payload: JwtPayload) {
  const config = useRuntimeConfig(event);

  const token = jwt.sign(payload, config.JWT_SECRET);
  setCookie(event, JWT_COOKIE_NAME, token, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
}
