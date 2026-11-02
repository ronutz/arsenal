// ============================================================================
// src/lib/tools/diff/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the text diff (posture "input-caution", raised
// from "input" on 2026-11-01: the manifest says "The compared text may be
// private"). A link carries both texts as pasted, "original" and "changed",
// and the two options (ignorespace, ignorecase: 1 or 0, always written, as a
// form carries every field), once the page has compared them. The page has
// two boxes of equal rank, so the link names each by its field (ROLLOUT
// section 1, rule 3) and carries no "input"; an empty box carries nothing.
//
// The texts go as pasted: the reading is which lines changed, and a value
// replaced in both boxes could hide a change. Before a link is offered the
// shared secrets check (src/lib/share/text-secrets.ts, the site's base check
// reused as is) reads both boxes: a credential a standard defines (a PEM
// private key, an Authorization or Cookie line, a JWT, a password in a URL,
// an AWS access key ID, a FortiOS ENC value) blocks the link, and the popover
// names the box and the line; a value whose name only looks like a secret is
// named in the caution line instead.
//
// Arrival: both boxes and both options fill as the reader would set them, and
// the page compares. At least one box must hold text and both options must be
// 1 or 0; anything else is malformed and ignored.
// ============================================================================

import { diffLines } from "./compute"; // the page's own engine
import { blockedBySecret, findShareSecretsIn, type ShareSecretFinding } from "../../share/text-secrets"; // the shared secrets check
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the two boxes and the two options. */
export interface DiffShareState {
  /** The original text. */
  original: string;
  /** The changed text. */
  changed: string;
  /** Ignore whitespace. */
  ignoreSpace: boolean;
  /** Ignore case. */
  ignoreCase: boolean;
}

/** What the check found in both boxes, each finding tagged with its box ("original" or "changed"). */
export interface DiffSecrets {
  /** Credentials. */
  secrets: (ShareSecretFinding & { field: string })[];
  /** Secret-looking names. */
  maybe: (ShareSecretFinding & { field: string })[];
}

/**
 * The shared check over both boxes (none is read when together they are over the link bound).
 * @param s the state
 * @returns the findings of both, "original" first
 */
export function checkDiffText(s: DiffShareState): DiffSecrets {
  const r = findShareSecretsIn([["original", s.original], ["changed", s.changed]]); // both, in reading order
  return { secrets: r.secrets, maybe: r.maybe }; // tagged by box
} // checkDiffText

/**
 * Whether the page has a comparison: some text, within the engine's size guard.
 * @param s the state
 * @returns true when there is one
 */
export function diffHasResult(s: DiffShareState): boolean {
  if (s.original === "" && s.changed === "") return false; // nothing pasted
  try { diffLines(s.original, s.changed, { ignoreWhitespace: s.ignoreSpace, ignoreCase: s.ignoreCase }); return true; } catch { return false; } // the size guard throws: no comparison
} // diffHasResult

/**
 * Encode from what the page already computed.
 * @param s the state
 * @param compared whether the page has a comparison
 * @param found the check's findings on both boxes
 * @returns both boxes and the options, nothing, or blocked
 */
export function encodeDiffShare(s: DiffShareState, compared: boolean, found: DiffSecrets): ShareEncoding {
  if (!compared) return { ok: false, reason: "empty" }; // nothing compared
  return blockedBySecret(found.secrets) ?? { ok: true, params: { original: s.original, changed: s.changed, ignorespace: s.ignoreSpace ? "1" : "0", ignorecase: s.ignoreCase ? "1" : "0" } }; // blocked, or everything (an empty box carries nothing)
} // encodeDiffShare

/** The spec. */
export const DIFF_SHARE: ShareSpec<DiffShareState> = Object.freeze({
  tool: "diff", // the slug
  posture: "input-caution", // both boxes as pasted, with a caution line, after the secrets check
  carriesKey: "share.carries", // tools.diff.share.carries
  names: ["original", "changed", "ignorespace", "ignorecase"], // two boxes of equal rank: no input
  /** Both boxes and the options, nothing, or blocked (the spec compares and checks them itself). */
  encode(s: DiffShareState): ShareEncoding {
    return encodeDiffShare(s, diffHasResult(s), checkDiffText(s)); // compared, checked, encoded
  },
  /** Some text in at least one box, and both options as 1 or 0. */
  decode(v: Readonly<Record<string, string | null>>): DiffShareState | null {
    const original = v.original ?? ""; // absent: an empty box
    const changed = v.changed ?? ""; // absent: an empty box
    if (original === "" && changed === "") return null; // nothing to compare
    const flag = (x: string | null): boolean | null => (x === "1" ? true : x === "0" ? false : null); // 1 or 0, nothing else
    const ignoreSpace = flag(v.ignorespace); // the first option
    const ignoreCase = flag(v.ignorecase); // the second
    if (ignoreSpace === null || ignoreCase === null) return null; // missing or malformed
    return { original, changed, ignoreSpace, ignoreCase }; // the state
  },
});
