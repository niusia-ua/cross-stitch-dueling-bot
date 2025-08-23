import type { H3Event } from "h3";

/**
 * Get the bearer token from the Authorization header.
 * @param event The `H3Event` object.
 * @returns The bearer token or undefined if not found.
 */
export function getBearerToken(event: H3Event) {
  const header = getHeader(event, "Authorization");
  if (!header) return;

  const parts = header.split(" ");
  if (parts.length !== 2) return;

  const [bearer, token] = parts;
  if (bearer !== "Bearer") return;

  return token;
}
