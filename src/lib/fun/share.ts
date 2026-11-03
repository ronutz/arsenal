// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/fun/share.ts
// ----------------------------------------------------------------------------
// THE SHARE CARD of the /dev/fun games: a few lines of plain text, an emoji
// grid that shows how the round went without giving the answer away, and the
// game's address. It goes to the clipboard; the player pastes it wherever they
// like. Nothing is posted anywhere by the site, and no one is tracked by it:
// the address carries no query string.
// ============================================================================

/** The production origin, written into every share card. */
export const SHARE_ORIGIN = "https://ronutz.com";

/**
 * The text of a share card.
 *
 * @param opts the card's parts: a title line (game name and puzzle number), the result lines (usually an emoji
 *             grid), an optional summary line (time, score), the locale and the game's path below /dev/fun/
 * @returns the card as plain text, lines joined with newlines
 */
export function shareText(opts: { title: string; lines: string[]; summary?: string; locale: string; slug: string }): string {
  // The address of the game in the player's language, with the trailing slash the export uses.
  const url = `${SHARE_ORIGIN}/${opts.locale}/dev/fun/${opts.slug}/`;
  // Title, result, the optional summary, then the address, with a blank line before it.
  return [opts.title, ...opts.lines, ...(opts.summary ? [opts.summary] : []), "", url].join("\n");
}

/**
 * Copy text to the clipboard, with a fallback for browsers without the asynchronous Clipboard API.
 *
 * @param text what to copy
 * @returns true when the copy succeeded
 */
export async function copyText(text: string): Promise<boolean> {
  // The modern path, available on secure origins.
  try {
    // Only when the API exists.
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      // The copy itself.
      await navigator.clipboard.writeText(text);
      // Done.
      return true;
    }
  } catch {
    // Refused (permissions, an iframe): fall through to the old path.
  }
  // The old path: a hidden textarea, selected and copied.
  try {
    // Nothing to do outside a document.
    if (typeof document === "undefined") return false;
    // A textarea holding the text.
    const area = document.createElement("textarea");
    // The text.
    area.value = text;
    // Out of sight and out of the way of the layout.
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    // Into the page.
    document.body.appendChild(area);
    // Selected.
    area.select();
    // The legacy copy command; its result says whether it worked.
    const ok = document.execCommand("copy");
    // Out of the page again.
    document.body.removeChild(area);
    // The outcome.
    return ok;
  } catch {
    // Neither path worked.
    return false;
  }
}

/**
 * Format a duration in milliseconds as m:ss (or h:mm:ss past an hour), the way the games show times.
 *
 * @param ms the duration
 * @returns the formatted time
 */
export function formatDuration(ms: number): string {
  // Whole seconds, never negative.
  const total = Math.max(0, Math.floor(ms / 1000));
  // Hours, minutes and seconds.
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  // Two-digit seconds always; minutes padded only after an hour.
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}
