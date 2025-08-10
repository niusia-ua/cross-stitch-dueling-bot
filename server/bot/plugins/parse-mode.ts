import type { Transformer } from "grammy";
import type { ParseMode } from "grammy/types";

/**
 * Sets the parse mode for messages.
 * @param parse_mode The parse mode to set.
 * @returns A transformer function.
 */
export function parseMode(parse_mode: ParseMode): Transformer {
  return (prev, method, payload, signal) => {
    if ("parse_mode" in payload) return prev(method, payload, signal);
    switch (method) {
      case "sendMediaGroup":
      case "editMessageMedia": {
        if ("media" in payload && !("parse_mode" in payload.media)) {
          // @ts-expect-error TypeScript can't prove that `media.parse_mode` exists in `payload`.
          payload.media.parse_mode = parse_mode;
        }
        break;
      }

      default: {
        // @ts-expect-error TypeScript can't prove that `parse_mode` exists in `payload`.
        payload.parse_mode = parse_mode;
      }
    }
    return prev(method, payload, signal);
  };
}
