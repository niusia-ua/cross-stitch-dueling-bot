import type { H3Error } from "h3";
import { FetchError } from "ofetch";

export type ApiError = FetchError<H3Error<ApiErrorData>>;
export { FetchError };

export * as AuthApi from "./auth.js";
export * as DuelsApi from "./duels.js";
export * as UsersApi from "./users.js";
