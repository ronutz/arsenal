// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/fun/share.ts
// ----------------------------------------------------------------------------
// THE SHARE CARD of the /dev/fun games: a few lines of plain text, an emoji
// grid that shows how the round went without giving the answer away, and the
// game's address. It goes to the clipboard; the player pastes it wherever they
// like. Nothing is posted anywhere by the site, and no one is tracked by it:
// the address carries no query string, except on an earlier puzzle (PRIME
// 05/11/2026), whose card says it was played later and whose address carries
// that puzzle's date (?day=), so whoever opens it plays the same puzzle.
// ============================================================================

// The earlier puzzle in play (?day=), if any, and the address of a day's puzzle.
import { DAY_PARAM, earlierDayInPlay } from "./archive";
// The puzzle number of a day.
import { puzzleNumber } from "./daily";

/** The production origin, written into every share card. */
export const SHARE_ORIGIN = "https://ronutz.com";

/** The words after an earlier puzzle's title, by language: the games' words are authored in English and Portuguese, and
 *  every other language reads the English ones, as it does the rest of the games' text. */
const PLAYED_LATER: Record<string, string> = { en: "played later", "pt-BR": "jogado depois" };

/**
 * The text of a share card.
 *
 * @param opts the card's parts: a title line (game name and puzzle number), the result lines (usually an emoji
 *             grid), an optional summary line (time, score), the locale and the game's path below /dev/fun/
 * @returns the card as plain text, lines joined with newlines
 */
export function shareText(opts: { title: string; lines: string[]; summary?: string; locale: string; slug: string }): string {
  // The earlier puzzle on this page, if any (null on today's puzzle and on the server), and only when this card is that
  // puzzle's: every daily card's title carries its number (#n), a practice round's or a toy's does not.
  const inPlay = earlierDayInPlay();
  const earlier = inPlay !== null && new RegExp(`#${puzzleNumber(inPlay)}(?!\\d)`).test(opts.title) ? inPlay : null;
  // The address of the game in the player's language, with the trailing slash the export uses, and an earlier puzzle's
  // date after it.
  const url = `${SHARE_ORIGIN}/${opts.locale}/dev/fun/${opts.slug}/${earlier ? `?${DAY_PARAM}=${earlier}` : ""}`;
  // The title, marked as played later on an earlier puzzle, so the card is not taken for a result of the day.
  const title = earlier ? `${opts.title} · ${PLAYED_LATER[opts.locale] ?? PLAYED_LATER.en}` : opts.title;
  // Title, result, the optional summary, then the address, with a blank line before it.
  return [title, ...opts.lines, ...(opts.summary ? [opts.summary] : []), "", url].join("\n");
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
