// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/interest/client.ts
// ----------------------------------------------------------------------------
// THE PAGE'S SIDE OF THE INTEREST COUNTS (PRIME 12/11/2026 02:35): the reader's
// choice, kept in this browser, and the one function that sends a count.
//
// NOTHING IS SENT WITHOUT A YES. track() returns at once unless the reader has
// answered yes (the prompt in InterestRuntime, or the switch on the Settings
// page) AND the browser is not sending Global Privacy Control or Do Not Track.
// Those two signals count as a no that needs no prompt: the reader has already
// said it to every site.
//
// WHAT IS SENT is exactly what src/lib/interest/shape.ts allows: a kind, a
// section, an item's slug, the page's language and, for a few kinds, one word
// from a fixed list. It goes to this site's own Worker (POST /api/e), with
// credentials omitted, so no cookie travels with it, and keepalive, so a count
// made while leaving a page still arrives. There is no queue, no retry and no
// identifier: a count that fails to send is simply not counted.
//
// The choice is one value in localStorage ("yes" or "no"); absent means not
// asked yet. Changing it tells the page's other parts through a window event,
// so the prompt and the Settings switch stay in step without a reload.
// ============================================================================

// The rules a count must meet, checked here before sending and again by the Worker.
import { checkInterest, pageItem, plainSearchTerm, type InterestKind, type InterestPayload, type InterestSection } from "./shape";
// The languages the site is published in, to read the page's language from its address.
import { LIVE_LOCALE_CODES } from "@/i18n/locales";

/** Where the choice is kept in this browser; versioned, so a later change of meaning can ask again. */
export const INTEREST_KEY = "ronutz:interest:v1";
/** The window event sent when the choice changes. */
export const INTEREST_EVENT = "ronutz:interest";
/** The Worker's endpoint for counts. */
const ENDPOINT = "/api/e";

/** The reader's choice: yes, no, or not asked yet. */
export type InterestChoice = "yes" | "no" | null;

/**
 * Whether the browser itself says "do not count me": Global Privacy Control, or the older Do Not Track.
 *
 * @returns true when either signal is on (always false on the server)
 */
export function browserSaysNo(): boolean {
  // No browser, no signal.
  if (typeof navigator === "undefined") return false;
  // Global Privacy Control, the current signal (a boolean on navigator where the browser supports it).
  if ((navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true) return true;
  // Do Not Track, the older one, still set by some browsers and extensions ("1" means do not).
  return navigator.doNotTrack === "1";
}

/**
 * The choice kept in this browser.
 *
 * @returns "yes", "no", or null when nothing was chosen (or storage cannot be read)
 */
export function readInterestChoice(): InterestChoice {
  // No browser, no choice.
  if (typeof window === "undefined") return null;
  // Storage can be missing or refuse (private modes, blocked site data): then there is no choice, so nothing is sent.
  try {
    // The stored value.
    const v = window.localStorage.getItem(INTEREST_KEY);
    // Only the two answers count.
    return v === "yes" || v === "no" ? v : null;
  } catch {
    return null;
  }
}

/**
 * Keep the reader's choice and tell the rest of the page.
 *
 * @param choice yes or no
 */
export function writeInterestChoice(choice: "yes" | "no"): void {
  // No browser, nothing to keep.
  if (typeof window === "undefined") return;
  // Kept where it can be; where storage refuses, the choice holds for this page only (and a no sends nothing anyway).
  try {
    window.localStorage.setItem(INTEREST_KEY, choice);
  } catch {
    /* storage unavailable */
  }
  // The prompt and the Settings switch listen for this.
  window.dispatchEvent(new CustomEvent(INTEREST_EVENT, { detail: choice }));
}

/**
 * Whether counts are sent from this browser right now: a yes, and no "do not count me" signal.
 *
 * @returns true when track() would send
 */
export function interestOn(): boolean {
  // Both must hold.
  return readInterestChoice() === "yes" && !browserSaysNo();
}

/**
 * The page's language, read from its address ("/pt-BR/tools/x/" is pt-BR).
 *
 * @returns the language code, or "" when the address has none the site publishes
 */
function pageLocale(): string {
  // The first part of the path.
  const first = window.location.pathname.split("/")[1] ?? "";
  // Only a published language.
  return LIVE_LOCALE_CODES.includes(first) ? first : "";
}

/**
 * Count one use, if the reader said yes. Never throws and never waits: a count is a side effect, not a step.
 *
 * @param kind what was done
 * @param section the part of the site
 * @param item the thing's slug (for a search: "hit" or "empty")
 * @param detail one of the kind's fixed words, the kept words of an empty search, or nothing
 */
export function track(kind: InterestKind, section: InterestSection, item: string, detail = ""): void {
  // Only in a browser, and only with a yes.
  if (typeof window === "undefined" || !interestOn()) return;
  // Everything below is best effort.
  try {
    // The count as it travels.
    const payload: InterestPayload = { k: kind, s: section, i: item, l: pageLocale(), d: detail };
    // Checked against the same rules the Worker applies: a count that would be refused is not sent at all.
    if (!checkInterest(payload, LIVE_LOCALE_CODES)) return;
    // Sent to this site's own Worker: no cookie (credentials omitted), delivered even while the page is being left
    // (keepalive), never cached, and the answer is not read.
    void fetch(ENDPOINT, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "content-type": "text/plain;charset=UTF-8" },
      credentials: "omit",
      keepalive: true,
      cache: "no-store",
    }).catch(() => undefined);
  } catch {
    /* a count that cannot be sent is not counted */
  }
}

/**
 * Count something done on "this page", whose section and item the address names (Share, a game's round).
 *
 * @param kind what was done
 * @param detail one of the kind's fixed words, or nothing
 */
export function trackPage(kind: InterestKind, detail = ""): void {
  // Only in a browser.
  if (typeof window === "undefined") return;
  // What the address names.
  const here = pageItem(window.location.pathname);
  // A page that names nothing countable is not counted.
  if (here) track(kind, here.section, here.item, detail);
}

/**
 * Count a site search once it has settled: whether it found anything and, when it found nothing and the words are
 * plain (src/lib/interest/shape.ts), the words, which are the list of what to write next.
 *
 * @param query what was searched for
 * @param found how many results came back
 * @param narrowed whether a filter was on (an empty result under a filter is not a gap in the site, so no words)
 */
export function trackSearch(query: string, found: number, narrowed: boolean): void {
  // Found something: counted without its words.
  if (found > 0) return track("search", "site", "hit");
  // Found nothing: the words only when no filter narrowed the search and they are plain.
  track("search", "site", "empty", narrowed ? "" : plainSearchTerm(query));
}
