// ============================================================================
// src/lib/share/share-vectors.ts
// ----------------------------------------------------------------------------
// THE CENTRAL SHARE HARNESS: one golden-vector set (run by
// scripts/run-golden-vectors.mts like any tool's) for the link format and for
// every tool's share cases. Adding a tool's cases changes this set's id, not
// the tool's, so a rollout across ~190 tools forces no api-sync re-check.
//
//   FORMAT_VECTORS  the link format itself: exact links for single and named
//                   values, every character class that must survive the
//                   fragment (space, +, &, #, %, =, line breaks, tabs, NUL,
//                   accents, astral characters), the 16,384-character bound
//                   on both sides, invalid names, a page address that brings
//                   a query or an anchor of its own;
//   ARRIVAL_VECTORS the arrival rule: what it reads, what it ignores, and the
//                   address it leaves (other fragment pairs kept, a legacy
//                   ?input= removed unread, a plain #anchor left alone);
//   SHARE_CASE_SETS each tool's round trips (cases/index.ts).
// ============================================================================

import { buildShareLink, hrefWithoutShareParams, readShareParams, MAX_SHARE_CHARS, type ShareLink, type ShareParams } from "./format"; // the format
import { resolveArrival, type ShareSpec } from "./spec"; // the arrival rule
import { SHARE_CASE_SETS } from "./cases/index"; // every tool's cases

/** The set id: changes whenever a vector or a tool's cases change. */
export const GOLDEN_VECTOR_SET_ID = "share-results-golden-2026-10-27c"; // c: wave 2 (F5 BIG-IP) tool cases added; b: waves 1A and 1B (2026-10-27)

/** The page address the vectors build links for. */
const BASE = "https://ronutz.com/en/tools/example-tool/"; // a tool page, with the trailing slash the static export uses

/** A format vector: values, and the exact link (or the refusal kind). */
export interface FormatVector { id: string; base?: string; params: ShareParams; expect: ShareLink }

/** The link format. */
export const FORMAT_VECTORS: readonly FormatVector[] = [
  { id: "single", params: { input: "10.0.0.0/8" }, expect: { kind: "link", href: `${BASE}#input=10.0.0.0%2F8`, length: 10 } }, // handoffHref's encoding
  { id: "single-space", params: { input: "a b" }, expect: { kind: "link", href: `${BASE}#input=a%20b`, length: 3 } }, // %20, not "+", while input is alone
  { id: "named", params: { input: "a b", language: "fortios", palette: "dark" }, expect: { kind: "link", href: `${BASE}#input=a+b&language=fortios&palette=dark`, length: 14 } }, // form encoding once names join; 3 + 7 + 4 characters
  { id: "named-only", params: { mode: "1", width: "4" }, expect: { kind: "link", href: `${BASE}#mode=1&width=4`, length: 2 } }, // no input at all
  { id: "empty-values-dropped", params: { input: "x", palette: "" }, expect: { kind: "link", href: `${BASE}#input=x`, length: 1 } }, // an empty value carries nothing
  { id: "all-empty", params: { input: "" }, expect: { kind: "empty" } }, // nothing
  { id: "no-values", params: {}, expect: { kind: "empty" } }, // nothing
  { id: "bad-name-upper", params: { input: "x", Language: "fortios" }, expect: { kind: "bad-name", name: "Language" } }, // lowercase only
  { id: "bad-name-long", params: { abcdefghijklm: "x" }, expect: { kind: "bad-name", name: "abcdefghijklm" } }, // 13 characters
  { id: "bad-name-digit-first", params: { "1x": "x" }, expect: { kind: "bad-name", name: "1x" } }, // a letter first
  { id: "bound-exact", params: { input: "a".repeat(MAX_SHARE_CHARS) }, expect: { kind: "link", href: `${BASE}#input=${"a".repeat(MAX_SHARE_CHARS)}`, length: MAX_SHARE_CHARS } }, // 16,384 fits
  { id: "bound-over", params: { input: "a".repeat(MAX_SHARE_CHARS + 1) }, expect: { kind: "too-long", length: MAX_SHARE_CHARS + 1, max: MAX_SHARE_CHARS } }, // one more does not
  { id: "bound-over-together", params: { input: "a".repeat(MAX_SHARE_CHARS), language: "x" }, expect: { kind: "too-long", length: MAX_SHARE_CHARS + 1, max: MAX_SHARE_CHARS } }, // counted together
  { id: "base-query-and-anchor", base: `${BASE}?input=legacy#main`, params: { input: "x" }, expect: { kind: "link", href: `${BASE}#input=x`, length: 1 } }, // never the query; the anchor replaced
];

/** Values that must come back exactly through a link, alone and with a named companion. */
export const ROUND_TRIP_VALUES: readonly string[] = [
  "a b+c&d=e#f%g?h/i", // every delimiter of a URL and of a form
  "line 1\nline 2\r\n\ttab", // line breaks and a tab
  "nul\u0000inside", // a NUL
  "coração, ação, São Paulo", // accents
  "lock \u{1F510} and \u{1F469}‍\u{1F4BB}", // astral characters and a joiner
  "%E0%A4%A", // text that looks percent-encoded, and a broken sequence
  "••••••••", // the code-to-image mask
];

/** An arrival vector: an address, and what the rule makes of it for a one-name spec ("input"). */
export interface ArrivalVector { id: string; href: string; state: string | null; cleaned: string | null }

/** A spec that takes any non-empty input (the arrival rule is the spec-independent part under test). */
const ANY_INPUT: ShareSpec<{ input: string }> = { tool: "example-tool", posture: "input", carriesKey: "share.carries", names: ["input"], encode: (s) => (s.input ? { ok: true, params: { input: s.input } } : { ok: false, reason: "empty" }), decode: (v) => (v.input ? { input: v.input } : null) }; // for the vectors only

/** The arrival rule. */
export const ARRIVAL_VECTORS: readonly ArrivalVector[] = [
  { id: "plain-page", href: BASE, state: null, cleaned: null }, // nothing to do
  { id: "anchor-only", href: `${BASE}#main`, state: null, cleaned: null }, // a skip-link anchor is not a share
  { id: "input", href: `${BASE}#input=abc`, state: "abc", cleaned: BASE }, // read, then gone from the address
  { id: "input-and-other-pair", href: `${BASE}#input=abc&q=keep`, state: "abc", cleaned: `${BASE}#q=keep` }, // another page's pair stays
  { id: "legacy-query-not-read", href: `${BASE}?input=abc`, state: null, cleaned: BASE }, // share links never use the query: removed unread
  { id: "over-long", href: `${BASE}#input=${"a".repeat(MAX_SHARE_CHARS + 1)}`, state: null, cleaned: BASE }, // ignored whole, never cut
  { id: "empty-value", href: `${BASE}#input=`, state: null, cleaned: BASE }, // nothing, and the empty pair goes
  { id: "repeated-first-wins", href: `${BASE}#input=a&input=b`, state: "a", cleaned: BASE }, // URLSearchParams.get, as readHandoff
];

/**
 * Run the format, arrival and tool vectors.
 * @returns the set id, the checks run and passed, and the failures
 */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  const failures: string[] = []; // every failure
  let total = 0; // checks run
  /** Record one check. */
  const check = (ok: boolean, msg: string): void => { total++; if (!ok) failures.push(msg); }; // counted, and kept when failed

  // The format, exactly.
  for (const v of FORMAT_VECTORS) { // each format vector
    const got = buildShareLink(v.base ?? BASE, v.params); // the engine
    check(JSON.stringify(got) === JSON.stringify(v.expect), `[format ${v.id}] got ${JSON.stringify(got).slice(0, 200)}`); // the exact result
  } // format

  // Every value survives a link, alone and with a named companion, and readShareParams gives it back.
  for (const value of ROUND_TRIP_VALUES) { // each value
    for (const params of [{ input: value }, { input: value, language: "tcl" }] as ShareParams[]) { // alone, then named
      const link = buildShareLink(BASE, params); // out
      const read = link.kind === "link" ? readShareParams(new URL(link.href).hash, Object.keys(params)) : { kind: "none" as const }; // back
      check(read.kind === "values" && Object.keys(params).every((k) => read.values[k] === params[k]), `[round-trip ${JSON.stringify(value)} ${Object.keys(params).join("+")}] came back as ${JSON.stringify(read)}`); // exactly
    } // forms
  } // values

  // The arrival rule.
  for (const v of ARRIVAL_VECTORS) { // each address
    const out = resolveArrival(v.href, ANY_INPUT); // the rule
    check((out.state?.input ?? null) === v.state && out.cleaned === v.cleaned, `[arrival ${v.id}] got ${JSON.stringify(out).slice(0, 200)}`); // what is read, what is left
  } // arrival
  check(hrefWithoutShareParams(`${BASE}#language=x&input=y&z=1`, ["input", "language"]) === `${BASE}#z=1`, "[strip] other pairs must stay"); // only the spec's names leave

  // Every tool's cases.
  const seen = new Set<string>(); // one case set per tool
  for (const set of SHARE_CASE_SETS) { // each tool
    check(!seen.has(set.tool), `[cases] ${set.tool} is registered twice`); // once
    seen.add(set.tool); // remembered
    check(set.count > 0, `[cases] ${set.tool} has no cases`); // something to run
    set.run(BASE.replace("example-tool", set.tool), check); // its round trips, on its own page
  } // tools

  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: total - failures.length, failures }; // the report
} // verifyVectors
