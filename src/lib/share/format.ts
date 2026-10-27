// ============================================================================
// src/lib/share/format.ts
// ----------------------------------------------------------------------------
// "SHARE RESULTS": THE ONE LINK FORMAT FOR EVERY TOOL (PRIME 27/10/2026: the
// button goes site-wide, three tools first, then family by family).
//
// A share link is the tool page's own address with the shared values after
// the "#", never in the query. It is the existing handoff format of
// src/lib/handoff.ts, extended to named values for tools with several fields:
//
//   single value  /pt-BR/tools/cidr#input=10.0.0.0%2F8
//   several       /en/tools/code-to-image#input=...&language=fortios&palette=dark
//
// THE RULES (ROLLOUT.md repeats them for the family helpers):
//   1. The primary value (the text a reader would paste) is always named
//      "input", so the 18 tools that already read #input= with usePrefill, and
//      the language switcher, which carries #input= across locales, keep
//      working unchanged.
//   2. Every other value has a name of 1 to 12 characters: a lowercase ASCII
//      letter, then lowercase letters or digits (SHARE_NAME_RE). Names are
//      stable once shipped (links live on in chats and tickets): a renamed
//      field keeps its old name in the link.
//   3. Values are text: an enumeration by its stable id ("dark"), a number in
//      decimal, a switch as "1" or "0".
//   4. The decoded values together are at most MAX_SHARE_CHARS (16,384 UTF-16
//      code units, the handoff bound); a longer share gets no link, and an
//      arriving one is ignored and stripped, never cut and parsed.
//   5. The fragment is never sent in a request (the reason handoff.ts moved
//      values there); it stays in the address bar and history of whoever opens
//      the link, which the popover says (share.stateNote) before anything is
//      copied.
//
// Pure functions only (no window, no React), so the central harness
// (share-vectors.ts) runs them in Node.
// ============================================================================

import { HANDOFF_PARAM, MAX_HANDOFF_CHARS, handoffHref, hrefWithFragmentParams, readAddressParams } from "../handoff"; // the existing fragment format

/** The name of the primary value: the handoff parameter every #input= reader already knows. */
export const SHARE_PRIMARY = HANDOFF_PARAM; // "input"

/** The most characters (UTF-16 code units) the decoded values of one share may hold together. */
export const MAX_SHARE_CHARS = MAX_HANDOFF_CHARS; // 16,384: the bound readHandoff applies to #input=

/** A valid value name: a lowercase ASCII letter, then up to eleven lowercase letters or digits. */
export const SHARE_NAME_RE = /^[a-z][a-z0-9]{0,11}$/; // anchored, bounded: linear

/** The values a share carries, by name ("input" for the primary one). */
export type ShareParams = Readonly<Record<string, string>>;

/** What building a link gave. */
export type ShareLink =
  | { kind: "link"; href: string; length: number } // the link, and the decoded length of what it carries
  | { kind: "empty" } // nothing to share (every value empty)
  | { kind: "too-long"; length: number; max: number } // over MAX_SHARE_CHARS: no link
  | { kind: "bad-name"; name: string }; // a name outside SHARE_NAME_RE (a defect in a tool's spec, pinned by the harness)

/**
 * Build a share link: the page's address with the values after the "#".
 * @param base the page's absolute address without a fragment (origin and path; a query, if any, is dropped)
 * @param params the values by name; empty values are left out
 * @returns the link, or why there is none
 */
export function buildShareLink(base: string, params: ShareParams): ShareLink {
  const entries = Object.entries(params).filter(([, v]) => v !== ""); // empty values carry nothing
  if (entries.length === 0) return { kind: "empty" }; // nothing to share
  for (const [name] of entries) if (!SHARE_NAME_RE.test(name)) return { kind: "bad-name", name }; // rule 2
  const length = entries.reduce((n, [, v]) => n + v.length, 0); // rule 4, in UTF-16 code units, as readHandoff counts
  if (length > MAX_SHARE_CHARS) return { kind: "too-long", length, max: MAX_SHARE_CHARS }; // no link
  const url = new URL(base); // parsed, so the parts are handled as parts
  url.search = ""; // never the query (rule 5)
  url.hash = ""; // any anchor is replaced: a link carries one share
  const primary = entries.find(([n]) => n === SHARE_PRIMARY); // the #input= value, if any
  let href = primary ? handoffHref(url.toString(), primary[1]) : url.toString(); // the handoff format first (rule 1)
  const others = entries.filter(([n]) => n !== SHARE_PRIMARY); // the named values
  if (others.length > 0) href = hrefWithFragmentParams(href, Object.fromEntries(others)); // appended after #input=
  return { kind: "link", href, length }; // done
} // buildShareLink

/** What reading an arriving address found. */
export type ShareRead =
  | { kind: "none" } // none of the names is in the fragment
  | { kind: "too-long"; length: number } // over MAX_SHARE_CHARS: ignored, never parsed
  | { kind: "values"; values: Readonly<Record<string, string | null>> }; // per name, the value or null

/**
 * Read a tool's values from an address's fragment (never from the query: share links never use it).
 * @param hash the fragment, with or without its "#"
 * @param names the names the tool's spec reads
 * @returns the values, or none, or a refusal for an over-long share
 */
export function readShareParams(hash: string, names: readonly string[]): ShareRead {
  // readAddressParams cuts each value to maxChars; asking for one more than the bound lets an over-long value show.
  const { values } = readAddressParams(hash, "", names, MAX_SHARE_CHARS + 1); // fragment only
  const present = names.filter((n) => values[n] !== null); // the names that carry something
  if (present.length === 0) return { kind: "none" }; // not a share for this tool
  const length = present.reduce((n, k) => n + (values[k] as string).length, 0); // decoded length together
  if (length > MAX_SHARE_CHARS) return { kind: "too-long", length }; // refused whole, never cut (rule 4)
  return { kind: "values", values }; // for the spec's decode
} // readShareParams

/**
 * The same address without a tool's share values: each name leaves the fragment and the query; other fragment pairs
 * stay, and an empty fragment leaves no "#".
 * @param href the full address
 * @param names the names to remove
 * @returns the cleaned address, or null when there was nothing to remove
 */
export function hrefWithoutShareParams(href: string, names: readonly string[]): string | null {
  const url = new URL(href); // parsed, to look at the parts
  const frag = url.hash.includes("=") ? new URLSearchParams(url.hash.slice(1)) : new URLSearchParams(); // an anchor holds no pairs
  if (!names.some((n) => frag.has(n) || url.searchParams.has(n))) return null; // nothing of this tool's in the address
  return hrefWithFragmentParams(href, Object.fromEntries(names.map((n) => [n, null]))); // every name removed, the rest kept
} // hrefWithoutShareParams
