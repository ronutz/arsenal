// ============================================================================
// src/lib/tools/wheel-filename-explainer/pep440.ts
// ----------------------------------------------------------------------------
// PEP 440 versions and version specifiers: parse, normalize, order, match.
// Shared by the wheel filename explainer (its version mode) and the
// pyproject.toml explainer (version, requires-python, dependency specifiers).
//
// THE RULES: Python Packaging User Guide, "Version specifiers" (originally PEP
// 440), packaging.python.org/en/latest/specifications/version-specifiers/,
// read 2026-10-27 (page "Last updated on Oct 27, 2026"; history up to "Jan
// 2026: The use of epochs was discouraged"). PEP 440 itself (Final) was read
// the same day.
//   - Public version scheme [N!]N(.N)*[{a|b|rc}N][.postN][.devN], local label
//     after "+" (ASCII letters, digits and periods, starting and ending with a
//     letter or digit).
//   - Normalization: case-insensitive, integers through int(), the separators
//     and spellings the "Normalization" section lists (alpha/beta/c/pre/
//     preview, rev/r, implicit numbers, the implicit post release "-N", local
//     "-" and "_" as ".", a leading "v", leading and trailing white space).
//     The accepted syntax is exactly the specification's appendix pattern
//     (VERSION_PATTERN), implemented here as a hand-written scanner that tries
//     the same alternatives in the same order (no regular expression, so no
//     backtracking blow-up: every optional part has a fixed, small number of
//     alternatives).
//   - Ordering: epoch, release padded with zeros, then .devN < aN < bN < rcN
//     < (none) < .postN within a release; dev of a pre or post release before
//     it; local labels segment by segment (numbers greater than letters,
//     longer greater when the shorter is a prefix); a local version after the
//     same public version.
//   - Specifiers: ~=, ==, !=, <=, >=, <, >, === with the semantics of the
//     sections "Compatible release" to "Arbitrary equality", and "Handling of
//     pre-releases".
//
// WHERE THE TEXT LEAVES ROOM, THIS MODULE FOLLOWS packaging (the PyPA library
// pip vendors; version 26.3 was installed in a throwaway environment on
// 2026-10-27 and used as the oracle for the golden vectors):
//   - white space trimmed is every character Python's str.isspace() accepts
//     (the specification's list "includes" space, tab, LF, CR, FF, VT);
//   - "== V.*" and "!= V.*" accept only a release segment before ".*"
//     (packaging refuses pre-, post-, dev- and local segments there; the
//     specification names dev and local explicitly);
//   - "> V" refuses a post-release, and "< V" a pre-release, whose epoch and
//     release equal V's; "> V" refuses any local version with V's epoch and
//     release;
//   - a specifier "names a pre-release" (and so opts into pre-releases) when
//     its operator is not "!=", it is not "== V.*", and its version is a
//     pre-release or a development release.
//
// Numbers are kept as decimal strings without leading zeros and compared by
// length then text, so any size is exact and results stay JSON-serializable.
// ============================================================================

import { asciiLower } from "./names"; // ASCII-only lower-casing

// ---------------------------------------------------------------------------
// Limits
// ---------------------------------------------------------------------------

/** The longest version string read (characters, after nothing is trimmed). */
export const MAX_VERSION_CHARS = 256; // generous: real versions are short
/** The longest specifier set read (characters). */
export const MAX_SPECIFIER_CHARS = 1024; // generous: real specifier sets are short

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The three pre-release phases, in their order. */
export type PrePhase = "a" | "b" | "rc";

/** What normalization changed, one code per rule (the docs and the component word them). */
export type VersionNote =
  | "whitespace" // leading or trailing white space was dropped
  | "leading-v" // a leading "v" was dropped
  | "case" // upper-case letters were lowered
  | "zeros" // a number had leading zeros, dropped by int()
  | "pre-separator" // a ".", "-" or "_" before or inside the pre-release segment was dropped
  | "pre-spelling" // alpha, beta, c, pre or preview spelled as a, b, rc
  | "pre-implicit" // a pre-release without a number got 0
  | "post-separator" // the post-release separator was written as "."
  | "post-spelling" // rev or r spelled as post
  | "post-implicit-number" // a post-release without a number got 0
  | "post-implicit" // "-N" read as ".postN"
  | "dev-separator" // the dev-release separator was written as "."
  | "dev-implicit" // a dev release without a number got 0
  | "local-separator" // "-" or "_" in the local label written as "."
  | "epoch-zero"; // an explicit 0! epoch is omitted from the normal form

/** A parsed version. Every number is a decimal string with no leading zeros. */
export interface Pep440Version {
  /** The input exactly as given. */
  input: string;
  /** The epoch ("0" when absent). */
  epoch: string;
  /** The release numbers. */
  release: string[];
  /** The pre-release phase and number, or null. */
  pre: { phase: PrePhase; n: string } | null;
  /** The post-release number, or null. */
  post: string | null;
  /** The development release number, or null. */
  dev: string | null;
  /** The local label's segments (lower case; numbers without leading zeros), or null. */
  local: string[] | null;
  /** The normal form (str(Version) in packaging). */
  normalized: string;
  /** The normal form without the local label. */
  public: string;
  /** Epoch (when not 0) and release only. */
  base: string;
  /** A pre-release or a development release (both count as pre-releases when handling them). */
  isPrerelease: boolean;
  /** Has a post-release segment. */
  isPostrelease: boolean;
  /** Has a development release segment. */
  isDevrelease: boolean;
  /** Written exactly in the canonical public form (no local label, nothing normalized). */
  isCanonical: boolean;
  /** What normalization changed. */
  notes: VersionNote[];
} // Pep440Version

/** Why a version could not be read. */
export type VersionErrorCode =
  | "empty" // nothing but white space
  | "too-long" // longer than MAX_VERSION_CHARS
  | "expected-number" // the release segment (or the epoch's) does not start with a digit
  | "bad-local" // the local label after "+" is empty or malformed
  | "unexpected"; // a character that no part of the scheme accepts here

/** A failed read, with the 0-based index (in the input) where it stopped. */
export interface VersionError {
  /** The stable code. */
  code: VersionErrorCode;
  /** Index into the input string (-1 when not applicable). */
  at: number;
  /** The offending character (empty when at the end). */
  char: string;
} // VersionError

/** The outcome of parseVersion. */
export type VersionParse = { ok: true; version: Pep440Version } | { ok: false; error: VersionError };

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

// The characters Python's str.isspace() accepts, which packaging's \s trims.
const PY_SPACE = new Set<string>([
  "\t", "\n", "\x0b", "\x0c", "\r", "\x1c", "\x1d", "\x1e", "\x1f", " ", "\x85", "\xa0", " ", // ASCII and Latin-1 white space, Ogham space mark
  " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", // the typographic spaces
  " ", " ", " ", " ", "　", // line and paragraph separators, narrow and ideographic spaces
]); // PY_SPACE

/**
 * Is the character white space as Python's str.isspace() defines it?
 * @param c one character
 * @returns true when Python would strip it
 */
export function isPySpace(c: string): boolean {
  // A set lookup.
  return PY_SPACE.has(c); // member or not
} // isPySpace

/**
 * Is the character an ASCII digit?
 * @param c one character (or undefined past the end)
 * @returns true for 0-9
 */
const isDigit = (c: string | undefined): boolean => c !== undefined && c >= "0" && c <= "9"; // 0-9

/**
 * Drop leading zeros from a run of digits (int() then str()).
 * @param d one or more ASCII digits
 * @returns the same number without leading zeros ("0" stays "0")
 */
export function normInt(d: string): string {
  // Skip zeros while at least one digit remains.
  let i = 0; // first kept digit
  while (i < d.length - 1 && d[i] === "0") i++; // leading zeros
  return d.slice(i); // the number
} // normInt

/**
 * Compare two normalized decimal strings numerically.
 * @param a a number
 * @param b another number
 * @returns -1, 0 or 1
 */
export function cmpInt(a: string, b: string): number {
  // Longer is larger (no leading zeros); equal lengths compare as text.
  if (a.length !== b.length) return a.length < b.length ? -1 : 1; // by length
  return a < b ? -1 : a > b ? 1 : 0; // by digits
} // cmpInt

// ---------------------------------------------------------------------------
// The scanner
// ---------------------------------------------------------------------------

/** One way the optional pre-release part can be read at a position. */
interface PreOption { end: number; phase: PrePhase; n: string | null; spelled: string; seps: number; } // where it ends and what it says
/** One way the optional post-release part can be read. */
interface PostOption { end: number; n: string | null; implicit: boolean; spelled: string; sep: string; sep2: boolean; } // where it ends and what it says
/** One way the optional dev part can be read. */
interface DevOption { end: number; n: string | null; sep: string; sep2: boolean; } // where it ends and what it says

// The pre-release spellings, in the order VERSION_PATTERN lists them (a|b|c|rc|alpha|beta|pre|preview), with their phase.
const PRE_SPELLINGS: ReadonlyArray<[string, PrePhase]> = [
  ["a", "a"], ["b", "b"], ["c", "rc"], ["rc", "rc"], ["alpha", "a"], ["beta", "b"], ["pre", "rc"], ["preview", "rc"],
]; // PRE_SPELLINGS
// The post-release spellings, in pattern order (post|rev|r).
const POST_SPELLINGS: ReadonlyArray<string> = ["post", "rev", "r"]; // POST_SPELLINGS
/** Is the character one of the separators ".", "-", "_"? */
const isSep = (c: string | undefined): boolean => c === "." || c === "-" || c === "_"; // the three separators

/**
 * Read a maximal run of digits.
 * @param s the lower-cased text
 * @param i where to start
 * @returns the index after the run (i when there is none)
 */
function digitsEnd(s: string, i: number): number {
  // Advance while digits.
  let j = i; // cursor
  while (isDigit(s[j])) j++; // digits
  return j; // end of the run
} // digitsEnd

/**
 * Every way the pre-release group [-_.]?(spelling)[-_.]?([0-9]+)? can match at i, greedy choices first.
 * @param s the lower-cased text
 * @param i the position
 * @returns the options, in the order a backtracking regular expression would try them
 */
function preOptions(s: string, i: number): PreOption[] {
  // The optional leading separator: taken first when present, then left.
  const out: PreOption[] = []; // collected options
  const starts = isSep(s[i]) ? [i + 1, i] : [i]; // with and without the separator
  for (const st of starts) { // each start
    for (const [sp, phase] of PRE_SPELLINGS) { // each spelling, in pattern order
      if (!s.startsWith(sp, st)) continue; // not here
      const afterWord = st + sp.length; // after the spelling
      const mids = isSep(s[afterWord]) ? [afterWord + 1, afterWord] : [afterWord]; // optional inner separator
      for (const m of mids) { // each inner choice
        const e = digitsEnd(s, m); // the number, if any
        const seps = (st !== i ? 1 : 0) + (m !== afterWord ? 1 : 0); // separators consumed
        if (e > m) out.push({ end: e, phase, n: normInt(s.slice(m, e)), spelled: sp, seps }); // with a number (greedy first)
        out.push({ end: m, phase, n: null, spelled: sp, seps }); // without one
      } // inner separators
    } // spellings
  } // starts
  return out; // the options
} // preOptions

/**
 * Every way the post-release group (-[0-9]+ | [-_.]?(post|rev|r)[-_.]?[0-9]*) can match at i.
 * @param s the lower-cased text
 * @param i the position
 * @returns the options, greedy first
 */
function postOptions(s: string, i: number): PostOption[] {
  // First alternative: the implicit post release "-N".
  const out: PostOption[] = []; // collected options
  if (s[i] === "-" && isDigit(s[i + 1])) { // "-" then digits
    const e = digitsEnd(s, i + 1); // the number
    out.push({ end: e, n: normInt(s.slice(i + 1, e)), implicit: true, spelled: "", sep: "-", sep2: false }); // read as .postN
  } // implicit
  const starts = isSep(s[i]) ? [i + 1, i] : [i]; // optional separator
  for (const st of starts) { // each start
    for (const sp of POST_SPELLINGS) { // post, rev, r
      if (!s.startsWith(sp, st)) continue; // not here
      const afterWord = st + sp.length; // after the spelling
      const mids = isSep(s[afterWord]) ? [afterWord + 1, afterWord] : [afterWord]; // optional inner separator
      for (const m of mids) { // each inner choice
        const e = digitsEnd(s, m); // the number, if any
        const sep = st !== i ? s[i] : ""; // the leading separator as written
        if (e > m) out.push({ end: e, n: normInt(s.slice(m, e)), implicit: false, spelled: sp, sep, sep2: m !== afterWord }); // with a number
        out.push({ end: m, n: null, implicit: false, spelled: sp, sep, sep2: m !== afterWord }); // without
      } // inner separators
    } // spellings
  } // starts
  return out; // the options
} // postOptions

/**
 * Every way the dev group [-_.]?dev[-_.]?[0-9]* can match at i.
 * @param s the lower-cased text
 * @param i the position
 * @returns the options, greedy first
 */
function devOptions(s: string, i: number): DevOption[] {
  // One spelling only.
  const out: DevOption[] = []; // collected options
  const starts = isSep(s[i]) ? [i + 1, i] : [i]; // optional separator
  for (const st of starts) { // each start
    if (!s.startsWith("dev", st)) continue; // not here
    const afterWord = st + 3; // after "dev"
    const mids = isSep(s[afterWord]) ? [afterWord + 1, afterWord] : [afterWord]; // optional inner separator
    for (const m of mids) { // each inner choice
      const e = digitsEnd(s, m); // the number, if any
      const sep = st !== i ? s[i] : ""; // the leading separator as written
      if (e > m) out.push({ end: e, n: normInt(s.slice(m, e)), sep, sep2: m !== afterWord }); // with a number
      out.push({ end: m, n: null, sep, sep2: m !== afterWord }); // without
    } // inner separators
  } // starts
  return out; // the options
} // devOptions

/**
 * Read the local label after "+": [a-z0-9]+([-_.][a-z0-9]+)* to the end.
 * @param s the lower-cased text
 * @param i the index just after "+"
 * @returns the segments and the separators seen, or the index of the first bad character
 */
function readLocal(s: string, i: number): { segs: string[]; nonDot: boolean } | { bad: number } {
  // Segments of letters and digits separated by single separators, ending at the end of the text.
  const segs: string[] = []; // the segments
  let nonDot = false; // a "-" or "_" separator was seen
  let j = i; // cursor
  for (;;) { // one segment per turn
    const st = j; // segment start
    while (j < s.length && ((s[j] >= "a" && s[j] <= "z") || isDigit(s[j]))) j++; // letters and digits
    if (j === st) return { bad: j }; // an empty segment (or a bad character)
    segs.push(s.slice(st, j)); // the segment
    if (j === s.length) return { segs, nonDot }; // the end of the text
    if (!isSep(s[j])) return { bad: j }; // anything but a separator ends badly
    if (s[j] !== ".") nonDot = true; // remember a separator to normalize
    j++; // past the separator
  } // segments
} // readLocal

/**
 * Parse one version string by the specification's scheme and normalization rules.
 * @param input the version as written
 * @returns the parsed version, or where and why it failed
 */
export function parseVersion(input: string): VersionParse {
  // Bound the work first.
  if (input.length > MAX_VERSION_CHARS) return { ok: false, error: { code: "too-long", at: -1, char: "" } }; // refused
  let a = 0; // first kept index
  let b = input.length; // one past the last kept index
  while (a < b && isPySpace(input[a])) a++; // leading white space
  while (b > a && isPySpace(input[b - 1])) b--; // trailing white space
  if (a === b) return { ok: false, error: { code: "empty", at: -1, char: "" } }; // nothing left
  const raw = input.slice(a, b); // the trimmed text
  const s = asciiLower(raw); // matched case-insensitively
  const notes = new Set<VersionNote>(); // what normalization changes
  if (a > 0 || b < input.length) notes.add("whitespace"); // white space trimmed
  if (raw !== s) notes.add("case"); // upper case lowered
  /** The error at a position of the trimmed text, reported as an index into the input. */
  const fail = (code: VersionErrorCode, at: number): VersionParse => ({ ok: false, error: { code, at: at + a, char: raw[at] ?? "" } }); // positioned failure
  let i = 0; // cursor
  if (s[i] === "v") { i++; notes.add("leading-v"); } // the optional leading v
  let e = digitsEnd(s, i); // the first number
  if (e === i) return fail("expected-number", i); // a version starts with a number
  let epoch = "0"; // the implicit epoch
  let epochWritten = false; // an explicit epoch was written
  if (s[e] === "!") { // that number was the epoch
    epoch = normInt(s.slice(i, e)); // its value
    if (s.slice(i, e) !== epoch) notes.add("zeros"); // leading zeros
    epochWritten = true; // written
    i = e + 1; // past "!"
    e = digitsEnd(s, i); // the release's first number
    if (e === i) return fail("expected-number", i); // the release is required
  } // epoch
  const release: string[] = []; // the release numbers
  for (;;) { // each release number
    const d = s.slice(i, e); // its digits
    const n = normInt(d); // its value
    if (d !== n) notes.add("zeros"); // leading zeros
    release.push(n); // kept
    i = e; // past it
    if (s[i] === "." && isDigit(s[i + 1])) { i++; e = digitsEnd(s, i); continue; } // another number
    break; // the release segment ends
  } // release
  // The optional parts, tried in the pattern's order; the first combination that reaches the end (or "+") wins.
  let best: { pre: PreOption | null; post: PostOption | null; dev: DevOption | null; end: number } | null = null; // the winning reading
  let furthest = i; // the furthest position any reading reached (for the error position)
  const preList: Array<PreOption | null> = [...preOptions(s, i), null]; // present readings first, then absent
  search: for (const pre of preList) { // each pre-release reading
    const p1 = pre ? pre.end : i; // after it
    const postList: Array<PostOption | null> = [...postOptions(s, p1), null]; // post readings, then absent
    for (const post of postList) { // each post-release reading
      const p2 = post ? post.end : p1; // after it
      const devList: Array<DevOption | null> = [...devOptions(s, p2), null]; // dev readings, then absent
      for (const dev of devList) { // each dev reading
        const p3 = dev ? dev.end : p2; // after it
        if (p3 > furthest) furthest = p3; // remember how far readings get
        if (p3 === s.length || s[p3] === "+") { best = { pre, post, dev, end: p3 }; break search; } // the end, or the local label
      } // dev
    } // post
  } // pre
  if (!best) return fail("unexpected", furthest); // no reading reaches the end
  let local: string[] | null = null; // the local label
  if (best.end < s.length) { // a "+" follows
    const r = readLocal(s, best.end + 1); // read it
    if ("bad" in r) return fail("bad-local", r.bad); // malformed
    if (r.nonDot) notes.add("local-separator"); // "-" or "_" written as "."
    local = r.segs.map((seg) => { // each segment
      if (/^[0-9]+$/.test(seg)) { const n = normInt(seg); if (n !== seg) notes.add("zeros"); return n; } // numbers through int()
      return seg; // letters kept, lower case
    }); // segments
  } // local
  const pre = best.pre ? { phase: best.pre.phase, n: best.pre.n ?? "0" } : null; // the pre-release
  if (best.pre) { // what its spelling changed
    if (best.pre.seps > 0) notes.add("pre-separator"); // separators dropped
    if (best.pre.spelled !== best.pre.phase) notes.add("pre-spelling"); // alpha, beta, c, pre, preview
    if (best.pre.n === null) notes.add("pre-implicit"); // no number
  } // pre notes
  let post: string | null = null; // the post-release
  if (best.post) { // present
    post = best.post.n ?? "0"; // implicit 0
    if (best.post.implicit) notes.add("post-implicit"); // "-N"
    else { // spelled
      if (best.post.sep !== "." || best.post.sep2) notes.add("post-separator"); // anything but a single "."
      if (best.post.spelled !== "post") notes.add("post-spelling"); // rev or r
      if (best.post.n === null) notes.add("post-implicit-number"); // no number
    } // spelled post
  } // post notes
  let dev: string | null = null; // the dev release
  if (best.dev) { // present
    dev = best.dev.n ?? "0"; // implicit 0
    if (best.dev.sep !== "." || best.dev.sep2) notes.add("dev-separator"); // anything but a single "."
    if (best.dev.n === null) notes.add("dev-implicit"); // no number
  } // dev notes
  // Raw digit runs inside the optional parts: leading zeros there are normalized too.
  for (const run of raw.slice(i, best.end).match(/[0-9]+/g) ?? []) if (run !== normInt(run)) notes.add("zeros"); // digit runs (one class, linear)
  if (epochWritten && epoch === "0") notes.add("epoch-zero"); // 0! is not written in the normal form
  const base = (epoch !== "0" ? `${epoch}!` : "") + release.join("."); // epoch and release
  const pub = base + (pre ? pre.phase + pre.n : "") + (post !== null ? `.post${post}` : "") + (dev !== null ? `.dev${dev}` : ""); // the public form
  const normalized = pub + (local ? `+${local.join(".")}` : ""); // with the local label
  const version: Pep440Version = { // the result
    input, epoch, release, pre, post, dev, local, normalized, public: pub, base, // the parts and forms
    isPrerelease: pre !== null || dev !== null, // pre or dev
    isPostrelease: post !== null, // post
    isDevrelease: dev !== null, // dev
    isCanonical: local === null && input === normalized, // already canonical
    notes: [...notes], // in insertion order
  }; // version
  return { ok: true, version }; // parsed
} // parseVersion

// ---------------------------------------------------------------------------
// Ordering
// ---------------------------------------------------------------------------

/**
 * Compare two release segments, padding the shorter with zeros.
 * @param a release numbers
 * @param b release numbers
 * @returns -1, 0 or 1
 */
export function cmpRelease(a: string[], b: string[]): number {
  // Element by element over the longer length; a missing element is 0.
  const n = Math.max(a.length, b.length); // compared length
  for (let i = 0; i < n; i++) { // each position
    const c = cmpInt(a[i] ?? "0", b[i] ?? "0"); // padded comparison
    if (c !== 0) return c; // decided
  } // positions
  return 0; // equal
} // cmpRelease

/** Rank of a pre-release phase (a < b < rc). */
const PHASE_RANK: Record<PrePhase, number> = { a: 0, b: 1, rc: 2 }; // ordering of phases

/**
 * Compare everything after the release: pre, post and dev segments.
 * @param x a version
 * @param y another version with the same epoch and release
 * @returns -1, 0 or 1
 */
function cmpSuffix(x: Pep440Version, y: Pep440Version): number {
  // The pre-release key: a dev release of the final release sorts before every pre-release; no pre sorts after all.
  const preKey = (v: Pep440Version): [number, number, string] => // [class, phase, n]
    v.pre ? [1, PHASE_RANK[v.pre.phase], v.pre.n] : v.post === null && v.dev !== null ? [0, 0, "0"] : [2, 0, "0"]; // -inf, phase, +inf
  const px = preKey(x); // x's key
  const py = preKey(y); // y's key
  if (px[0] !== py[0]) return px[0] < py[0] ? -1 : 1; // by class
  if (px[1] !== py[1]) return px[1] < py[1] ? -1 : 1; // by phase
  const pn = cmpInt(px[2], py[2]); // by number
  if (pn !== 0) return pn; // decided
  // The post key: none sorts before any post-release.
  if ((x.post === null) !== (y.post === null)) return x.post === null ? -1 : 1; // one has none
  if (x.post !== null && y.post !== null) { const c = cmpInt(x.post, y.post); if (c !== 0) return c; } // both have one
  // The dev key: none sorts after any dev release.
  if ((x.dev === null) !== (y.dev === null)) return x.dev === null ? 1 : -1; // one has none
  if (x.dev !== null && y.dev !== null) return cmpInt(x.dev, y.dev); // both have one
  return 0; // equal
} // cmpSuffix

/**
 * Compare two local labels (each a list of segments, or null for none).
 * @param a a label
 * @param b another label
 * @returns -1, 0 or 1
 */
export function cmpLocal(a: string[] | null, b: string[] | null): number {
  // No label sorts before any label.
  if (a === null || b === null) return a === b ? 0 : a === null ? -1 : 1; // one or both absent
  const n = Math.min(a.length, b.length); // shared length
  for (let i = 0; i < n; i++) { // segment by segment
    const an = /^[0-9]+$/.test(a[i]); // numeric segment (one class, linear)
    const bn = /^[0-9]+$/.test(b[i]); // numeric segment
    if (an && bn) { const c = cmpInt(a[i], b[i]); if (c !== 0) return c; continue; } // both numbers
    if (an !== bn) return an ? 1 : -1; // a number is greater than letters
    if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1; // letters as text (already lower case)
  } // segments
  return a.length === b.length ? 0 : a.length < b.length ? -1 : 1; // the longer is greater
} // cmpLocal

/**
 * Compare two versions by the specification's total order (local labels included).
 * @param x a version
 * @param y another version
 * @returns -1, 0 or 1
 */
export function compareVersions(x: Pep440Version, y: Pep440Version): number {
  // Epoch, release, suffixes, then local.
  const e = cmpInt(x.epoch, y.epoch); // epochs
  if (e !== 0) return e; // decided
  const r = cmpRelease(x.release, y.release); // releases
  if (r !== 0) return r; // decided
  const s = cmpSuffix(x, y); // pre, post, dev
  if (s !== 0) return s; // decided
  return cmpLocal(x.local, y.local); // local labels
} // compareVersions

/**
 * Compare two versions with the local label ignored.
 * @param x a version
 * @param y another version
 * @returns -1, 0 or 1
 */
export function comparePublic(x: Pep440Version, y: Pep440Version): number {
  // The same order, without the last step.
  const e = cmpInt(x.epoch, y.epoch); // epochs
  if (e !== 0) return e; // decided
  const r = cmpRelease(x.release, y.release); // releases
  if (r !== 0) return r; // decided
  return cmpSuffix(x, y); // pre, post, dev
} // comparePublic

/**
 * Do two versions share epoch and release (zero-padded)?
 * @param x a version
 * @param y another version
 * @returns true when their base versions are equal
 */
function sameBase(x: Pep440Version, y: Pep440Version): boolean {
  // Epoch and padded release.
  return cmpInt(x.epoch, y.epoch) === 0 && cmpRelease(x.release, y.release) === 0; // both equal
} // sameBase

/**
 * Is v a pre-release "of the specified version" s (exclusive "<" rule)? For a final release X: any pre-release or
 * development release of X (X.devN, XaN, XaN.postM ...). For a post-release X.postN: its development releases
 * X.postN.devM. (packaging 26.3 reads the rule this way; checked against it on 2026-10-27.)
 * @param v the candidate (already below s)
 * @param s the specified version (not itself a pre-release)
 * @returns true when v is one of s's own pre-releases
 */
function isPrereleaseOf(v: Pep440Version, s: Pep440Version): boolean {
  // Epoch and release first.
  if (!sameBase(v, s)) return false; // another release
  if (s.post === null) return v.isPrerelease; // X: its pre- and dev releases
  return v.pre === null && v.post === s.post && v.dev !== null; // X.postN: X.postN.devM
} // isPrereleaseOf

/**
 * Is v a post-release or a local version "of the specified version" s (exclusive ">" rule)? When s is a final or a
 * pre-release without post or dev segment: v shares s's epoch, release and pre-release (so v is s+local or a
 * post-release of s, with or without local or dev). When s has a post or dev segment (it cannot have post-releases
 * of its own): only s+local, the same public version with a local label.
 * @param v the candidate (already above s)
 * @param s the specified version
 * @returns true when v is excluded by the ">" rule
 */
function isPostOrLocalOf(v: Pep440Version, s: Pep440Version): boolean {
  // Epoch and release first.
  if (!sameBase(v, s)) return false; // another release
  const samePre = (v.pre === null && s.pre === null) || (v.pre !== null && s.pre !== null && v.pre.phase === s.pre.phase && cmpInt(v.pre.n, s.pre.n) === 0); // same pre-release
  if (!samePre) return false; // another pre-release
  if (s.post !== null || s.dev !== null) return v.post === s.post && v.dev === s.dev && v.local !== null; // only s+local
  return true; // s+local, or a post-release of s
} // isPostOrLocalOf

// ---------------------------------------------------------------------------
// Specifiers
// ---------------------------------------------------------------------------

/** The eight operators. */
export type SpecOperator = "~=" | "==" | "!=" | "<=" | ">=" | "<" | ">" | "===";

/** Why a specifier clause is not valid. */
export type SpecErrorCode =
  | "empty" // nothing in the clause (or the set)
  | "too-long" // longer than MAX_SPECIFIER_CHARS
  | "no-operator" // the clause does not start with one of the eight operators
  | "no-version" // an operator with nothing after it
  | "bad-version" // the version is not a valid PEP 440 version
  | "bad-characters" // a character outside the grammar's version characters
  | "local-not-allowed" // a local label with an operator other than == and !=
  | "wildcard-not-allowed" // ".*" with an operator other than == and !=
  | "wildcard-after-suffix" // ".*" after a pre-, post-, dev- or local segment
  | "compatible-one-segment"; // "~=" with a one-number release

/** One parsed clause. */
export interface SpecClause {
  /** The clause as written (trimmed). */
  text: string;
  /** The operator. */
  op: SpecOperator;
  /** The version text after the operator, as written (without ".*"). */
  versionText: string;
  /** True for "== V.*" or "!= V.*". */
  wildcard: boolean;
  /** The parsed version (null for "===", which compares text). */
  version: Pep440Version | null;
  /** The normal form of the clause (operator and normalized version, ".*" kept). */
  normalized: string;
  /** For "~=": the equivalent pair, e.g. [">=2.2", "==2.*"]. */
  compatible: [string, string] | null;
  /** The clause names a pre-release (and so opts the set into pre-releases). */
  namesPrerelease: boolean;
} // SpecClause

/** A clause that failed, with where. */
export interface SpecClauseError {
  /** The clause as written. */
  text: string;
  /** The stable code. */
  code: SpecErrorCode;
  /** The version error, for "bad-version". */
  versionError: VersionError | null;
} // SpecClauseError

/** The outcome of reading a specifier set. */
export interface SpecifierSetParse {
  /** True when every clause is valid. */
  ok: boolean;
  /** The valid clauses, in the order written. */
  clauses: SpecClause[];
  /** The invalid clauses. */
  errors: SpecClauseError[];
  /** A comma after the last clause (allowed since June 2024). */
  trailingComma: boolean;
} // SpecifierSetParse

// The operators, longest first so "===" is tried before "==" (the December 2025 grammar fix).
const OPERATORS: ReadonlyArray<SpecOperator> = ["===", "~=", "==", "!=", "<=", ">=", "<", ">"]; // detection order

/**
 * Is the character allowed in a version inside a specifier (letterOrDigit | - | _ | . | * | + | !)?
 * @param c one character
 * @returns true when the grammar allows it
 */
export function isVersionChar(c: string): boolean {
  // ASCII letters and digits plus six punctuation characters.
  return /^[A-Za-z0-9\-_.*+!]$/.test(c); // one class, anchored
} // isVersionChar

/**
 * Drop spaces and tabs (the grammar's wsp) from both ends, with two index walks.
 * @param s the text
 * @returns the text without leading or trailing spaces and tabs
 */
export function trimWsp(s: string): string {
  // Move both ends inwards past spaces and tabs.
  let a = 0; // first kept index
  let b = s.length; // one past the last kept index
  while (a < b && (s[a] === " " || s[a] === "\t")) a++; // leading
  while (b > a && (s[b - 1] === " " || s[b - 1] === "\t")) b--; // trailing
  return s.slice(a, b); // the middle
} // trimWsp

/**
 * Parse one clause such as ">= 1.0" or "== 2.*".
 * @param text the clause (white space around it is ignored)
 * @returns the clause or the reason it is invalid
 */
export function parseClause(text: string): SpecClause | SpecClauseError {
  // Trim spaces and tabs (the grammar's wsp) around the clause.
  const t = trimWsp(text); // the clause
  /** A failure for this clause. */
  const err = (code: SpecErrorCode, versionError: VersionError | null = null): SpecClauseError => ({ text: t, code, versionError }); // shorthand
  if (t === "") return err("empty"); // nothing
  const op = OPERATORS.find((o) => t.startsWith(o)); // the operator
  if (!op) return err("no-operator"); // none
  const v = trimWsp(t.slice(op.length)); // the version text after optional white space
  if (v === "") return err("no-version"); // missing
  for (const c of v) if (!isVersionChar(c)) return err("bad-characters"); // outside the grammar
  if (op === "===") { // arbitrary equality: text, no parsing
    return { text: t, op, versionText: v, wildcard: false, version: null, normalized: `===${v}`, compatible: null, namesPrerelease: false }; // compared as text
  } // ===
  const wildcard = v.endsWith(".*"); // a prefix match
  const vt = wildcard ? v.slice(0, -2) : v; // the version without ".*"
  if (wildcard && op !== "==" && op !== "!=") return err("wildcard-not-allowed"); // only == and !=
  const p = parseVersion(vt); // the version
  if (!p.ok) return err("bad-version", p.error); // not a version
  const ver = p.version; // parsed
  if (wildcard && (ver.pre || ver.post !== null || ver.dev !== null || ver.local)) return err("wildcard-after-suffix"); // only a release before .*
  if (ver.local && op !== "==" && op !== "!=") return err("local-not-allowed"); // local labels only with == and !=
  if (op === "~=" && ver.release.length < 2) return err("compatible-one-segment"); // ~=1 is not allowed
  let compatible: [string, string] | null = null; // the equivalent pair
  if (op === "~=") { // ~=V.N is >=V.N, ==V.*
    const prefix = (ver.epoch !== "0" ? `${ver.epoch}!` : "") + ver.release.slice(0, -1).join("."); // the release without its last number
    compatible = [`>=${ver.normalized}`, `==${prefix}.*`]; // the pair
  } // compatible
  const namesPrerelease = op !== "!=" && !wildcard && ver.isPrerelease; // opts into pre-releases
  return { text: t, op, versionText: vt, wildcard, version: ver, normalized: `${op}${ver.normalized}${wildcard ? ".*" : ""}`, compatible, namesPrerelease }; // the clause
} // parseClause

/**
 * Parse a comma-separated specifier set such as ">=1.0, <2, !=1.3.*".
 * @param text the set
 * @returns the clauses and any errors
 */
export function parseSpecifierSet(text: string): SpecifierSetParse {
  // Bound the work, then split at commas (versions never contain one).
  if (text.length > MAX_SPECIFIER_CHARS) return { ok: false, clauses: [], errors: [{ text: "", code: "too-long", versionError: null }], trailingComma: false }; // refused
  const parts = text.split(","); // the clauses as written
  let trailingComma = false; // a final empty part after a comma
  if (parts.length > 1 && parts[parts.length - 1].trim() === "") { parts.pop(); trailingComma = true; } // allowed: version_many ends with (',' wsp*)?
  const clauses: SpecClause[] = []; // valid ones
  const errors: SpecClauseError[] = []; // invalid ones
  if (parts.length === 1 && parts[0].trim() === "") { // nothing but white space (and perhaps a lone comma)
    if (trailingComma) return { ok: false, clauses, errors: [{ text: ",", code: "empty", versionError: null }], trailingComma }; // a comma needs a clause before it
    return { ok: true, clauses, errors, trailingComma }; // an empty set matches every version
  } // empty
  for (const part of parts) { // each clause
    const c = parseClause(part); // read it
    if ("code" in c) errors.push(c); else clauses.push(c); // sorted
  } // clauses
  return { ok: errors.length === 0, clauses, errors, trailingComma }; // the set
} // parseSpecifierSet

/**
 * Does the version fall in the clause's range? The pre-release policy is not applied here (see selectVersions).
 * @param v the candidate version
 * @param c the clause
 * @returns true when the clause matches
 */
export function clauseMatches(v: Pep440Version, c: SpecClause): boolean {
  // Arbitrary equality compares the candidate's text, case-insensitively.
  if (c.op === "===") return asciiLower(v.input) === asciiLower(c.versionText); // text equality, nothing trimmed
  const s = c.version as Pep440Version; // every other operator has a version
  switch (c.op) { // by operator
    case "==": // version matching
    case "!=": { // version exclusion: the same test, inverted
      let eq: boolean; // the matching result
      if (c.wildcard) { // prefix matching: epoch and the first n release numbers (zero-padded)
        const n = s.release.length; // the prefix length
        const padded = [...v.release, ...Array(Math.max(0, n - v.release.length)).fill("0")]; // the candidate padded
        eq = cmpInt(v.epoch, s.epoch) === 0 && padded.slice(0, n).every((x, i) => cmpInt(x, s.release[i]) === 0); // same prefix
      } else if (s.local) { // a local specifier: the local labels must match too
        eq = compareVersions(v, s) === 0; // full equality
      } else { // a public specifier: the candidate's local label is ignored
        eq = comparePublic(v, s) === 0; // public equality
      } // kinds of ==
      return c.op === "==" ? eq : !eq; // inverted for !=
    } // == and !=
    case ">=": return comparePublic(v, s) >= 0; // inclusive, local ignored
    case "<=": return comparePublic(v, s) <= 0; // inclusive, local ignored
    case "<": // exclusive: no pre-release of V unless V is one
      if (compareVersions(v, s) >= 0) return false; // not below
      return s.isPrerelease || !isPrereleaseOf(v, s); // a pre-release of V itself is excluded
    case ">": // exclusive: no post-release of V unless V is one, no local version of V
      if (compareVersions(v, s) <= 0) return false; // not above
      return !isPostOrLocalOf(v, s); // V's own post-releases and local versions are excluded
    case "~=": { // >= V and == prefix.*
      if (comparePublic(v, s) < 0) return false; // below V
      const n = s.release.length - 1; // the prefix length
      const padded = [...v.release, ...Array(Math.max(0, n - v.release.length)).fill("0")]; // the candidate padded
      return cmpInt(v.epoch, s.epoch) === 0 && padded.slice(0, n).every((x, i) => cmpInt(x, s.release[i]) === 0); // same prefix
    } // ~=
  } // switch
  return false; // unreachable: every operator is handled
} // clauseMatches

/**
 * Does the version fall in every clause of the set?
 * @param v the candidate
 * @param clauses the set's clauses
 * @returns true when all match (an empty set matches everything)
 */
export function setMatches(v: Pep440Version, clauses: SpecClause[]): boolean {
  // The comma is a logical and.
  return clauses.every((c) => clauseMatches(v, c)); // all of them
} // setMatches

/** What an installer would take from a list of candidates. */
export interface Selection {
  /** Indices (into the candidates) that fall in the set's range. */
  inRange: number[];
  /** Indices an installer would consider, after the pre-release rule. */
  selected: number[];
  /** Why pre-releases were or were not kept. */
  prereleasePolicy: "named" | "only-prereleases" | "excluded" | "none-in-range";
  /** The index of the latest selected version (the preferred one), or -1. */
  preferred: number;
} // Selection

/**
 * Apply a specifier set to candidate versions as an installer does by default ("Handling of pre-releases"):
 * pre-releases are kept when a clause names one, or when no final or post release falls in the range.
 * @param versions the candidates (parsed)
 * @param clauses the set's clauses
 * @returns the indices in range, the selected ones and the preferred one
 */
export function selectVersions(versions: Pep440Version[], clauses: SpecClause[]): Selection {
  // Range first.
  const inRange = versions.map((_, i) => i).filter((i) => setMatches(versions[i], clauses)); // matching indices
  const named = clauses.some((c) => c.namesPrerelease); // a clause names a pre-release
  let selected: number[]; // after the pre-release rule
  let prereleasePolicy: Selection["prereleasePolicy"]; // which rule applied
  if (inRange.length === 0) { selected = []; prereleasePolicy = "none-in-range"; } // nothing matches
  else if (named) { selected = inRange; prereleasePolicy = "named"; } // explicitly requested
  else { // the default
    const finals = inRange.filter((i) => !versions[i].isPrerelease); // final and post releases
    if (finals.length > 0) { selected = finals; prereleasePolicy = "excluded"; } // pre-releases left out
    else { selected = inRange; prereleasePolicy = "only-prereleases"; } // the only candidates are pre-releases
  } // policy
  let preferred = -1; // the latest selected
  for (const i of selected) if (preferred < 0 || compareVersions(versions[i], versions[preferred]) > 0) preferred = i; // keep the greatest
  return { inRange, selected, prereleasePolicy, preferred }; // the selection
} // selectVersions
