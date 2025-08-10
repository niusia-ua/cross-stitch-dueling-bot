import type { Transformer } from "grammy";

/**
 * Disables link previews for messages.
 * @returns A transformer function.
 */
export function disableLinkPreview(): Transformer {
  return (prev, method, payload, signal) => {
    if (["sendMessage", "editMessageText"].includes(method)) {
      if (!("link_preview_options" in payload)) {
        // @ts-expect-error TypeScript can't prove that `link_preview_options` exists in `payload`.
        payload.link_preview_options ??= { is_disabled: true };
      } else if (!("is_disabled" in payload.link_preview_options!)) {
        payload.link_preview_options!.is_disabled = true;
      }
    }
    return prev(method, payload, signal);
  };
}
