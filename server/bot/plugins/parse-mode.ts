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
        // @ts-expect-error TypeScript can't prove that `media` exists in `payload`.
        for (const media of payload.media) {
          media.parse_mode = parse_mode;
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
