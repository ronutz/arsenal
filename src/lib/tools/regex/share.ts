// ============================================================================
// src/lib/tools/regex/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the regex toolkit (posture "input-caution"; the
// manifest: "the test text may be sensitive"). A link carries the pattern as
// typed (input), the flags (flags, when there are any) and the test text
// (text, when there is any), once there is a pattern: the explanation, the
// portability view and the matches all come from these three.
//
// The test text goes as pasted: the matches are the reading, and a value
// replaced in it would match differently. Before a link is offered the shared
// secrets check (src/lib/share/text-secrets.ts, the site's base check reused
// as is) reads the pattern and the test text: a credential a standard defines
// (a PEM private key, an Authorization or Cookie line, a JWT, a password in a
// URL, an AWS access key ID, a FortiOS ENC value) blocks the link, and the
// popover names the field and the line; a value whose name only looks like a
// secret is named in the caution line instead.
//
// Arrival: the three fields fill as the reader would type them, and the page
// explains and matches. A pattern the static check flags for catastrophic
// backtracking still waits behind "Run anyway": an arrival never gives that
// consent. A blank pattern is malformed; flags longer than any set of
// JavaScript flags (16 characters) are malformed; flags the browser refuses
// show the page's own error, as when typed.
// ============================================================================

import { blockedBySecret, findShareSecretsIn, type ShareSecretFinding } from "../../share/text-secrets"; // the shared secrets check
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The longest flags value a link may carry: every ECMAScript flag once is 8, so 16 is generous. */
const FLAGS_MAX = 16; // characters

/** The state: the pattern, the flags and the test text. */
export interface RegexShareState {
  /** The pattern as typed. */
  input: string;
  /** The flags as typed. */
  flags: string;
  /** The test text as pasted. */
  text: string;
}

/** What the check found, each finding tagged with its field ("input" for the pattern, "text"). */
export interface RegexSecrets {
  /** Credentials. */
  secrets: (ShareSecretFinding & { field: string })[];
  /** Secret-looking names. */
  maybe: (ShareSecretFinding & { field: string })[];
}

/**
 * The shared check over the pattern and the test text (none is read when together they are over the link bound).
 * @param s the state
 * @returns the findings, the pattern's first
 */
export function checkRegexText(s: RegexShareState): RegexSecrets {
  const r = findShareSecretsIn([["input", s.input], ["text", s.text]]); // both, in reading order
  return { secrets: r.secrets, maybe: r.maybe }; // tagged by field
} // checkRegexText

/**
 * Encode from the check's findings (the page computes them once for the button and the caution line).
 * @param s the state
 * @param found the findings
 * @returns the three fields, nothing, or blocked
 */
export function encodeRegexShare(s: RegexShareState, found: RegexSecrets): ShareEncoding {
  if (s.input === "") return { ok: false, reason: "empty" }; // no pattern: the page shows nothing
  return blockedBySecret(found.secrets) ?? { ok: true, params: { input: s.input, flags: s.flags, text: s.text } }; // blocked, or all three (empty ones carry nothing)
} // encodeRegexShare

/** The spec. */
export const REGEX_SHARE: ShareSpec<RegexShareState> = Object.freeze({
  tool: "regex", // the slug
  posture: "input-caution", // the fields as typed, with a caution line, after the secrets check
  carriesKey: "share.carries", // tools.regex.share.carries
  names: ["input", "flags", "text"], // the pattern first
  /** The three fields, nothing, or blocked (the spec checks them itself). */
  encode(s: RegexShareState): ShareEncoding {
    return encodeRegexShare(s, checkRegexText(s)); // checked, encoded
  },
  /** A pattern (any non-empty text), flags of a sane length, and any test text. */
  decode(v: Readonly<Record<string, string | null>>): RegexShareState | null {
    if (!v.input) return null; // no pattern
    const flags = v.flags ?? ""; // absent: the sender had none
    if (flags.length > FLAGS_MAX) return null; // not flags
    return { input: v.input, flags, text: v.text ?? "" }; // absent text: none
  },
});
