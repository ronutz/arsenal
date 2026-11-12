// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/interest/shape.ts
// ----------------------------------------------------------------------------
// WHAT AN "INTEREST COUNT" MAY HOLD, in one place, read by both sides: the
// page that sends one (src/lib/interest/client.ts) and the Worker that writes
// it (worker/events.ts). PRIME 12/11/2026 02:35, on analytics: no third-party
// tracker; with the reader's consent, the site's own count of what is USED
// (a tool worked with, a game played, a search that found nothing, an article
// read to its end), so the parts that get interest get the development.
//
// THE RULE THAT SHAPES IT. A count names a thing on the site and what was done
// with it, and nothing about who did it: a kind from the fixed list below, a
// section, an item's slug, the page's language, and for a few kinds one word
// from a fixed list (won or lost, link or results). There is no field for an
// identifier, a value typed into a tool, an address, a time finer than the
// row's own, or free text, with ONE exception stated plainly:
//
// A SEARCH THAT FOUND NOTHING carries the words searched for, because those
// words are the site's list of what to write next. Only when they pass
// plainSearchTerm() below: a few plain words, at most four digits in all, no
// @, no long token. Anything else (an address, a number, a key, a sentence) is
// counted as an empty search with no words at all. The same function runs in
// the page before sending and in the Worker before writing, so a page that
// was tampered with cannot make the Worker keep more.
//
// Pure functions and constants only: no window, no fetch, no storage, so the
// Worker can import this file (it does, by relative path).
// ============================================================================

/** The kinds of use that are counted. Adding one is a change to the privacy page as well as to this list. */
export const INTEREST_KINDS = [
  "tool_use", // a tool was worked with: the first typing or button press inside it, once per page view
  "share", // the page's Share control was used
  "game_start", // a round of a game or puzzle started
  "game_end", // a round finished (won or lost)
  "read_end", // the end of an article or a glossary entry was reached after a while on the page
  "search", // a site search settled on its results (found something, or nothing)
  "out_red", // a link to Red Education was followed
  // An item was saved to My desk (PRIME 12/11/2026 12:42): sent once, when the reader saves it, named by the item's
  // section and slug and carrying no detail. Never sent on unsaving, read marks, paths or the desk's layout, and never
  // by the desk's own page: only through track() and the same yes as every other kind.
  "save",
] as const;

/** One of the kinds above. */
export type InterestKind = (typeof INTEREST_KINDS)[number];

/** The parts of the site a count can belong to. */
export const INTEREST_SECTIONS = ["tools", "learn", "glossary", "fun", "site"] as const;

/** One of the sections above. */
export type InterestSection = (typeof INTEREST_SECTIONS)[number];

/**
 * The fixed words a kind may carry as its detail; a kind not listed carries none ("" only). Search is handled apart.
 * "save" is deliberately not listed: a save says which item, and nothing about how or where it was saved.
 */
export const INTEREST_DETAILS: Readonly<Partial<Record<InterestKind, readonly string[]>>> = {
  // How the page was shared: the address copied, the system's share sheet, or a tool's results.
  share: ["link", "sheet", "results"],
  // How the round ended.
  game_end: ["won", "lost"],
};

/** A slug as the site writes them: lower-case letters, digits and hyphens, a letter or digit first, at most 96 long. */
export const INTEREST_SLUG = /^[a-z0-9][a-z0-9-]{0,95}$/;

/** The two items a search count can have: it found something, or it found nothing. */
export const SEARCH_ITEMS = ["hit", "empty"] as const;

/** The longest search term kept, in characters. */
const TERM_MAX = 40;
/** The most words a kept search term has. */
const TERM_WORDS = 4;
/** The longest single word in a kept search term (longer runs are tokens, hashes and pasted values). */
const WORD_MAX = 24;
/** The most digits a kept search term has in all ("802.1x" and "rfc 9293" fit; an address, a phone number or an id do not). */
const TERM_DIGITS = 4;
/** The most hyphens one word of a kept search term has. */
const WORD_HYPHENS = 3;
/** A word of a kept search term: letters (any script) and digits, with . + # / - inside it. */
const TERM_WORD = /^[\p{L}\p{N}][\p{L}\p{N}.+#/-]*$/u;

/**
 * The words of a search, as they may be kept when the search found nothing, or "" when they may not.
 *
 * Kept: one to four plain words in lower case, such as "bfd echo", "802.1x" or "segurança de borda". Not kept, and
 * returned as "": anything with an @, more than four digits in all, a word longer than 24 characters, more than four
 * words, more than 40 characters, a character outside letters, digits and . + # / -, or a word with more than one
 * dot, more than one slash, both a dot and a slash, or more than three hyphens (a host name with a subdomain, a path,
 * a short IP address such as 10.0.0.1, a hardware address).
 *
 * @param query what was typed into the search field
 * @returns the normalized words, or "" when the search is counted without them
 */
export function plainSearchTerm(query: string): string {
  // Only text.
  if (typeof query !== "string") return "";
  // Lower case, outer spaces dropped, inner runs of white space made one space.
  const q = query.normalize("NFC").toLowerCase().trim().replace(/\s+/g, " ");
  // Nothing typed, or too long to be a term.
  if (q === "" || q.length > TERM_MAX) return "";
  // The words.
  const words = q.split(" ");
  // A sentence is not a term.
  if (words.length > TERM_WORDS) return "";
  // Each word plain and short, and not shaped like a host name, a path or a hardware address: at most one dot, at
  // most one slash and never both ("802.1x", "node.js" and "tcp/ip" fit; "10.0.0.1", "fw01.corp.example.com" and
  // "example.com/login" do not), and at most three hyphens ("man-in-the-middle" fits; "aa-bb-cc-dd-ee-ff" does not).
  for (const w of words) {
    if (w.length > WORD_MAX || !TERM_WORD.test(w)) return "";
    const dots = w.split(".").length - 1;
    const slashes = w.split("/").length - 1;
    if (dots > 1 || slashes > 1 || (dots > 0 && slashes > 0) || w.split("-").length - 1 > WORD_HYPHENS) return "";
  }
  // Few digits: enough for a standard's number, too few for an address, a phone number or an identifier.
  if ((q.match(/\p{N}/gu) ?? []).length > TERM_DIGITS) return "";
  // A term that may be kept.
  return q;
}

/** One count as it travels from the page to the Worker: k kind, s section, i item, l locale, d detail. */
export interface InterestPayload {
  /** The kind. */
  k: string;
  /** The section. */
  s: string;
  /** The item's slug (for a search: "hit" or "empty"). */
  i: string;
  /** The page's language, as the address spells it. */
  l: string;
  /** The detail: one of the kind's fixed words, the kept words of an empty search, or "". */
  d: string;
}

/** A count that passed every rule, ready to be written. */
export interface InterestRow {
  /** The kind. */
  kind: InterestKind;
  /** The section. */
  section: InterestSection;
  /** The item. */
  item: string;
  /** The language. */
  locale: string;
  /** The detail. */
  detail: string;
}

/**
 * Check a payload against every rule. Anything outside the lists is refused, never repaired: a row is exactly what
 * this file says it may be, or it is not written.
 *
 * @param p what arrived (already parsed from JSON, so of unknown shape)
 * @param locales the languages the site is published in
 * @returns the row to write, or null when the payload breaks a rule
 */
export function checkInterest(p: unknown, locales: readonly string[]): InterestRow | null {
  // An object with the five fields, all text.
  if (!p || typeof p !== "object") return null;
  const { k, s, i, l, d } = p as Record<string, unknown>;
  if (typeof k !== "string" || typeof s !== "string" || typeof i !== "string" || typeof l !== "string" || typeof d !== "string") return null;
  // A kind, a section and a language from the lists.
  if (!(INTEREST_KINDS as readonly string[]).includes(k)) return null;
  if (!(INTEREST_SECTIONS as readonly string[]).includes(s)) return null;
  if (!locales.includes(l)) return null;
  // The kind, typed.
  const kind = k as InterestKind;
  // A search: the item says whether it found anything, and only an empty one may carry its words.
  if (kind === "search") {
    // Found or not.
    if (!(SEARCH_ITEMS as readonly string[]).includes(i)) return null;
    // Words only on an empty search, and only as plainSearchTerm keeps them (a tampered page gains nothing).
    const detail = i === "empty" && d !== "" && plainSearchTerm(d) === d ? d : "";
    // The search's row.
    return { kind, section: "site", item: i, locale: l, detail };
  }
  // Every other kind names an item by its slug.
  if (!INTEREST_SLUG.test(i)) return null;
  // Its detail is one of the kind's fixed words, or nothing.
  const allowed = INTEREST_DETAILS[kind];
  if (allowed ? !allowed.includes(d) : d !== "") return null;
  // The row.
  return { kind, section: s as InterestSection, item: i, locale: l, detail: d };
}

/**
 * The section and item a page's address names, for the kinds that count "this page" (Share, a game's round).
 *
 * @param pathname the address path, with its language first ("/en/tools/cidr/")
 * @returns the section and the item's slug, or null when the page is not one of the countable kinds
 */
export function pageItem(pathname: string): { section: InterestSection; item: string } | null {
  // The path's parts, without the language.
  const parts = pathname.split("/").filter(Boolean).slice(1);
  // The first two parts decide.
  const [a, b, c] = parts;
  // A tool, an article or a glossary entry: the section and the slug after it.
  if ((a === "tools" || a === "learn" || a === "glossary") && b && INTEREST_SLUG.test(b)) return { section: a, item: b };
  // A daily puzzle or a toy under /dev/fun/, and an arcade game under /arcade/.
  if (a === "dev" && b === "fun" && c && INTEREST_SLUG.test(c)) return { section: "fun", item: c };
  if (a === "arcade" && b && INTEREST_SLUG.test(b)) return { section: "fun", item: b };
  // Any other page: the site, named by its first part (the home page is "home").
  const first = a ?? "home";
  return INTEREST_SLUG.test(first) ? { section: "site", item: first } : null;
}
