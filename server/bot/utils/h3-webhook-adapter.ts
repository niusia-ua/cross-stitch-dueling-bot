import type { Update } from "grammy/types";
import { getHeader, readBody, type H3Event } from "h3";

const SECRET_HEADER = "X-Telegram-Bot-Api-Secret-Token";
const WRONG_TOKEN_ERROR = "secret token is wrong";

// Copy-pasted from https://github.com/grammyjs/grammY/blob/fcbfc5b2e73df9f1fa332d1b98b54b874daf13ca/src/convenience/frameworks.ts#L19-L54.
/**
 * Abstraction over a request-response cycle, providing access to the update, as
 * well as a mechanism for responding to the request and to end it.
 */
export interface ReqResHandler<T = void> {
  /**
   * The update object sent from Telegram, usually resolves the request's JSON
   * body
   */
  update: Promise<Update>;
  /**
   * X-Telegram-Bot-Api-Secret-Token header of the request, or undefined if
   * not present
   */
  header?: string;
  /**
   * Ends the request immediately without body, called after every request
   * unless a webhook reply was performed
   */
  end: () => void;
  /**
   * Sends the specified JSON as a payload in the body, used for webhook
   * replies
   */
  respond: (json: string) => unknown | Promise<unknown>;
  /**
   * Responds that the request is unauthorized due to mismatching
   * X-Telegram-Bot-Api-Secret-Token headers
   */
  unauthorized: () => unknown | Promise<unknown>;
  /**
   * Some frameworks (e.g. Deno's std/http `listenAndServe`) assume that
   * handler returns something
   */
  handlerReturn?: Promise<T>;
}

export type H3Adapter = (event: H3Event) => ReqResHandler<Response>;

/** h3 web framework */
export const h3: H3Adapter = (event) => {
  let resolveResponse: (response: Response) => void;
  return {
    update: readBody<Update>(event),
    header: getHeader(event, SECRET_HEADER),
    end: () => resolveResponse(new Response(null, { status: 200 })),
    respond: (json) => resolveResponse(new Response(json, { headers: { "Content-Type": "application/json" } })),
    unauthorized: () => resolveResponse(new Response(WRONG_TOKEN_ERROR, { status: 401 })),
    handlerReturn: new Promise<Response>((resolve) => {
      resolveResponse = resolve;
    }),
  };
};
