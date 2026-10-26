// ============================================================================
// src/lib/handoff.ts
// ----------------------------------------------------------------------------
// THE PAGE-TO-TOOL HANDOFF, CARRIED IN THE FRAGMENT (Round 1 RT01, 2026-10-20).
//
// One page hands a value to a tool by address: the home page's quick CIDR box
// hands its block to the full calculator, the HTTP message decoder hands a
// header value to the tool that reads it, the serial console hands a detected
// token to its tool, the ASCII table and the Unicode inspector hand a character
// to each other. Until this date the value travelled in the QUERY
// (/tools/cidr?input=10.10.1.1%2F31), and a query is part of the HTTP request:
// following such a link sent the entered value to the hosting layer, although
// the calculation itself runs in the browser (production audit of 2026-10-19,
// RT01). The value now travels in the FRAGMENT (/tools/cidr#input=...): a
// browser never puts the fragment in an HTTP request line, never in a Referer
// header (the Fetch standard strips it), and never in a client-side router's
// data request, so the value stays in the browser that typed it.
//
// What the fragment does NOT hide, stated wherever the copy speaks of it: it
// stays in the address bar and in the browser's history, and a copied or
// shared address carries it, so whoever receives the link can read the value.
//
// LEGACY LINKS. An address of the old shape (?input=) that someone bookmarked
// still opens the tool with its value, but that request has already carried the
// value to the host before any script ran; nothing here can undo that, and the
// copy says so. After reading it, the page rewrites its own address to the
// fragment form with history.replaceState, which sends nothing (it is not a
// navigation), so a later reload, bookmark or share no longer sends it again.
//
// Pure functions only: no React, no window, so the unit checks can run them in
// Node (scratchpad check-handoff.mts) and the hook (src/lib/use-prefill.ts)
// stays a thin shell around them.
// ============================================================================

/** The parameter name, the same word the query used, so a legacy link and a new one read alike. */
export const HANDOFF_PARAM = "input";

/**
 * The longest value accepted from an address, in UTF-16 code units. Generous enough for a PEM chain handed over
 * from the serial console; anything longer is refused rather than parsed, so a crafted address cannot hand a tool
 * an unbounded string (the tools' own validators still judge every accepted value).
 */
export const MAX_HANDOFF_CHARS = 16_384;

/** Where a value was found: the fragment (the current form) or the query (a legacy link). */
export type HandoffSource = "fragment" | "query";

/** What reading an address found. */
export type HandoffRead =
  // A value within bounds, and where it came from.
  | { kind: "value"; value: string; source: HandoffSource }
  // A value longer than MAX_HANDOFF_CHARS: refused, never handed to a tool.
  | { kind: "tooLong"; source: HandoffSource; length: number }
  // No handoff in the address (or an empty one).
  | { kind: "none" };

/**
 * Parse a fragment's text ("#input=..." or "input=...") as form-encoded pairs, the same decoding the query used,
 * so "+" still reads as a space and %2B as a plus. URLSearchParams never throws: a broken percent sequence decodes
 * to U+FFFD, which the receiving tool's validator then rejects with its own readable message.
 */
function fragmentParams(hash: string): URLSearchParams {
  // Drop the leading "#" when the caller passes location.hash as it is.
  return new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
}

/**
 * Read the handoff value from an address's fragment, falling back to its query for a legacy link.
 * A repeated parameter (#input=a&input=b) yields its first value, as URLSearchParams.get does, the same rule the
 * query followed before; the fragment wins over the query when both are present, because it is the current form.
 * @param hash the address's fragment, with or without its "#"
 * @param search the address's query, with or without its "?"
 * @returns the value and its source, a refusal for an over-long value, or none
 */
export function readHandoff(hash: string, search: string): HandoffRead {
  // The fragment first: the form every link built since 2026-10-20 uses.
  const fromFragment = fragmentParams(hash).get(HANDOFF_PARAM);
  // Then the query: an older bookmark or a link from outside the site.
  const fromQuery = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get(HANDOFF_PARAM);
  // The source that carries a non-empty value, fragment preferred.
  const source: HandoffSource | null = fromFragment ? "fragment" : fromQuery ? "query" : null;
  // Nothing to hand over.
  if (source === null) return { kind: "none" };
  // The value from that source (non-null by the test above).
  const value = (source === "fragment" ? fromFragment : fromQuery) as string;
  // Over the bound: refused, so no tool ever parses it.
  if (value.length > MAX_HANDOFF_CHARS) return { kind: "tooLong", source, length: value.length };
  // A value a tool may receive.
  return { kind: "value", value, source };
}

/**
 * Build a link that hands a value to a page in the fragment. Only the fragment carries the value; the path and any
 * query of `path` are kept as given (callers pass site paths, which carry no query).
 * @param path the target path, for example "/tools/cidr" or "/en/tools/ascii-table/"
 * @param value the value to hand over
 * @returns the path with "#input=<encoded value>", or the bare path when there is nothing to hand over
 */
export function handoffHref(path: string, value: string): string {
  // Any fragment already on the path is replaced: a link carries one handoff at most.
  const base = path.split("#")[0];
  // An empty value hands nothing over, so the link stays a plain link.
  if (value === "") return base;
  // encodeURIComponent leaves no "#", "&" or "+" unescaped, so the value reads back exactly.
  return `${base}#${HANDOFF_PARAM}=${encodeURIComponent(value)}`;
}

/**
 * The same address with the handoff moved from a legacy query into the fragment: the query loses its input
 * parameter (other parameters stay), and the fragment becomes #input=<value>. Used once, after a legacy link has
 * been read, with history.replaceState, which changes the address without a request.
 * @param href the full current address
 * @param value the value read from it
 * @returns the rewritten address, or null when the address carries no query handoff (nothing to rewrite)
 */
export function migrateLegacyHref(href: string, value: string): string | null {
  // Parsed, so the query and the fragment are handled as parts rather than as text.
  const url = new URL(href);
  // Nothing to move when the query has no input parameter.
  if (!url.searchParams.has(HANDOFF_PARAM)) return null;
  // The value leaves the query (every repetition of it).
  url.searchParams.delete(HANDOFF_PARAM);
  // And lands in the fragment, replacing whatever anchor was there (a handoff page has no anchors to keep).
  url.hash = `${HANDOFF_PARAM}=${encodeURIComponent(value)}`;
  // The address to put in place of the current one.
  return url.toString();
}

/**
 * The same address with no handoff at all: the input parameter leaves the fragment (other fragment parameters
 * stay) and the query, and an empty fragment leaves no "#" behind. Used when the reader clears or edits the value,
 * so the address stops describing a value the page no longer shows, and a share or reload no longer carries it.
 * @param href the full current address
 * @returns the address without the handoff, or null when it carried none (nothing to rewrite)
 */
export function hrefWithoutHandoff(href: string): string | null {
  // Parsed, as above.
  const url = new URL(href);
  // The fragment's own pairs.
  const frag = fragmentParams(url.hash);
  // Whether either part carries the parameter.
  const inFragment = frag.has(HANDOFF_PARAM);
  const inQuery = url.searchParams.has(HANDOFF_PARAM);
  // Nothing to remove.
  if (!inFragment && !inQuery) return null;
  // Out of the query.
  url.searchParams.delete(HANDOFF_PARAM);
  // Out of the fragment, keeping any other pair in it.
  frag.delete(HANDOFF_PARAM);
  // The remaining fragment text, if any.
  const rest = frag.toString();
  // URL drops a lone "#" when the hash is set to the empty string.
  url.hash = rest === "" ? "" : rest;
  // The clean address.
  return url.toString();
}

/**
 * Whether an address's fragment carries a handoff value, for the share control's notice (a shared address carries
 * the value, so the reader is told before sharing it).
 * @param hash the address's fragment, with or without its "#"
 * @returns true when the fragment holds a non-empty input parameter
 */
export function fragmentCarriesHandoff(hash: string): boolean {
  // Present and non-empty: an empty "#input=" hands nothing over.
  return Boolean(fragmentParams(hash).get(HANDOFF_PARAM));
}

/**
 * The handoff part of the current fragment, ready to append to another path (the language switcher keeps the value
 * when the reader changes language), or the empty string when there is none.
 * @param hash the address's fragment, with or without its "#"
 * @returns "#input=<encoded value>" or ""
 */
export function handoffFragment(hash: string): string {
  // The value as the fragment holds it, decoded.
  const value = fragmentParams(hash).get(HANDOFF_PARAM);
  // Re-encoded the one way handoffHref encodes, so the new address reads back the same value.
  return value && value.length <= MAX_HANDOFF_CHARS ? `#${HANDOFF_PARAM}=${encodeURIComponent(value)}` : "";
}

// ============================================================================
// PAGE STATE IN THE FRAGMENT (Round 2, 2026-10-25; PRIME's decision of that day)
// ----------------------------------------------------------------------------
// The same rule for a page that keeps its own settings in the address, first
// the certification hub's find field (q) and retired switch (retired): the
// reader's typed words live after the "#", which no request carries, and a
// legacy ?q= address is read once and moved there. The two functions below are
// the general form of readHandoff / migrateLegacyHref for any named parameters.
// ============================================================================

/**
 * Read named parameters from an address, each from the fragment first and, failing that, from the query (a legacy
 * address). Values longer than `maxChars` are cut to it, as the hub always did with its find text.
 * @param hash the address's fragment, with or without its "#"
 * @param search the address's query, with or without its "?"
 * @param names the parameter names to read
 * @param maxChars the longest value kept
 * @returns per name, the value (or null when absent or empty), and whether any value came from the query
 */
export function readAddressParams(
  hash: string,
  search: string,
  names: readonly string[],
  maxChars: number = MAX_HANDOFF_CHARS,
): { values: Record<string, string | null>; fromQuery: boolean } {
  // Both parts, decoded the same form-encoded way.
  const frag = fragmentParams(hash);
  const query = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  // Collected values, and whether the legacy query supplied any.
  const values: Record<string, string | null> = {};
  let fromQuery = false;
  for (const name of names) {
    // The fragment's value, if present and non-empty.
    const f = frag.get(name);
    // Else the query's (legacy).
    const q = f ? null : query.get(name);
    if (!f && q) fromQuery = true;
    // Bounded, never longer than maxChars.
    const v = f || q || null;
    values[name] = v === null ? null : v.slice(0, maxChars);
  }
  // The read.
  return { values, fromQuery };
}

/**
 * The same address with named parameters written into the fragment (a null or empty value removes the name) and
 * removed from the query, so the page state never travels in a request. Other fragment pairs and query parameters
 * are kept; an empty fragment leaves no "#".
 * @param href the full current address
 * @param values per name, the value to keep in the fragment, or null to remove it
 * @returns the rewritten address (equal to href when nothing changes)
 */
export function hrefWithFragmentParams(href: string, values: Record<string, string | null>): string {
  // Parsed, so the parts are handled as parts.
  const url = new URL(href);
  // A fragment with no "=" is a plain anchor (#main after the skip link, for example), not state: it is set aside,
  // replaced while there is state to keep, and left as it was when there is none.
  const anchor = url.hash !== "" && !url.hash.includes("=") ? url.hash : "";
  // The fragment's own pairs (none when it is an anchor).
  const frag = anchor ? new URLSearchParams() : fragmentParams(url.hash);
  for (const [name, value] of Object.entries(values)) {
    // Never in the query again.
    url.searchParams.delete(name);
    // In the fragment when set, absent when not.
    if (value) frag.set(name, value);
    else frag.delete(name);
  }
  // The remaining fragment text; an empty one leaves the anchor (if there was one) or no "#" at all.
  const rest = frag.toString();
  url.hash = rest === "" ? anchor : rest;
  // The address to put in place.
  return url.toString();
}
