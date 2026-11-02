// ============================================================================
// src/lib/tools/expect-script-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the Expect script explainer (posture "derived",
// raised from "input-caution" on 2026-11-01; the manifest: "a script may carry
// a secret"). Expect scripts often type a password in clear, and this page's
// own rule E1 finds it: a literal sent right after a password question, or a
// literal set into a variable named like a password; the page masks it with
// one bullet per character in the dialogue and the finding.
//
// So the link carries a COPY of the script (input) in which every secret E1
// flags is replaced by those same bullets (the engine's shareableScript,
// pinned by the share vectors of the set expect-script-explainer/2026-11-01).
// The copy reads the same: E1 still fires on the same line with the same
// masked preview, and the dialogue, the other findings and the facts are
// unchanged (sameShareReading; if a copy ever read differently, no link is
// offered: blocked "copy"). A secret written with escape sequences cannot be
// replaced character for character, so it gets no link (blocked "escaped",
// with its line). Then the shared secrets check (src/lib/share/
// text-secrets.ts, the site's base check reused as is) reads the copy: any
// other credential a standard defines (a PEM private key, an Authorization
// line in a send, a password in a URL, an AWS access key ID ...) blocks the
// link with its line, and a value whose name only looks like a secret is
// named in the caution line.
//
// No reveal switch: the bullets are what this page shows for a clear-text
// password, which rule E1 calls an error; the copy loses nothing of the
// reading, and the password is never needed to read the script.
//
// Arrival: the copy fills the box as a paste would and the page reads it
// (statically: nothing is spawned, run or sent). Any non-blank text is
// accepted, as a paste is.
// ============================================================================

import { run, sameShareReading, shareableScript, SCRIPT_MAX_CHARS } from "./compute"; // the engine and its share copy
import { blockedBySecret, findShareSecrets, type ShareSecretReport } from "../../share/text-secrets"; // the shared secrets check
import { MAX_SHARE_CHARS } from "../../share/format"; // the link bound
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box (the script as pasted when encoding; the copy, as the link carries it, on arrival). */
export interface ExpectExplainerShareState {
  /** The script. */
  input: string;
}

/** Everything a share needs, computed once from the script (the page memoises it). */
export interface ExpectExplainerSharePrep {
  /** The copy a link carries, or null when a secret could not be replaced. */
  copy: string | null;
  /** How many secrets the copy replaced. */
  replaced: number;
  /** The line of a secret written with escapes, or 0. */
  escapedLine: number;
  /** Whether the copy reads as the script did. */
  sameReading: boolean;
  /** The shared check's report on the copy. */
  report: ShareSecretReport;
}

/**
 * Prepare a share of a script: the copy, its count, the reading test and the check on the copy.
 * @param input the script as pasted
 * @returns the preparation (nothing is read when the script is blank, over the link bound or over the page's bound)
 */
export function prepareExpectExplainerShare(input: string): ExpectExplainerSharePrep {
  const none: ShareSecretReport = { secrets: [], maybe: [], skipped: true }; // nothing read
  if (input.trim() === "" || input.length > MAX_SHARE_CHARS || input.length > SCRIPT_MAX_CHARS) return { copy: input, replaced: 0, escapedLine: 0, sameReading: true, report: none }; // no link could carry it anyway
  const c = shareableScript(input); // the copy
  if (!c.ok) return { copy: null, replaced: 0, escapedLine: c.line, sameReading: true, report: none }; // a secret written with escapes
  const sameReading = c.replaced === 0 || sameShareReading(run({ script: input }), run({ script: c.copy })); // the copy reads the same
  return { copy: c.copy, replaced: c.replaced, escapedLine: 0, sameReading, report: findShareSecrets(c.copy) }; // the check reads the copy
} // prepareExpectExplainerShare

/**
 * Encode from a preparation the page already made.
 * @param s the state (the script as pasted)
 * @param p its preparation
 * @returns the copy, nothing, or blocked
 */
export function encodeExpectExplainerShare(s: ExpectExplainerShareState, p: ExpectExplainerSharePrep): ShareEncoding {
  if (s.input.trim() === "") return { ok: false, reason: "empty" }; // nothing pasted: the button is disabled
  if (p.copy === null) return { ok: false, reason: "blocked", code: "escaped", values: { line: p.escapedLine } }; // a secret the copy cannot replace
  if (!p.sameReading) return { ok: false, reason: "blocked", code: "copy" }; // the copy would read differently
  return blockedBySecret(p.report.secrets) ?? { ok: true, params: { input: p.copy } }; // another credential, or the copy (over the bound, the button says so)
} // encodeExpectExplainerShare

/** The spec. */
export const EXPECT_EXPLAINER_SHARE: ShareSpec<ExpectExplainerShareState> = Object.freeze({
  tool: "expect-script-explainer", // the slug
  posture: "derived", // a copy with E1's secrets replaced by bullets
  carriesKey: "share.carries", // tools.expect-script-explainer.share.carries
  names: ["input"], // #input=
  /** The copy, nothing, or blocked (the spec prepares it itself). */
  encode(s: ExpectExplainerShareState): ShareEncoding {
    return encodeExpectExplainerShare(s, prepareExpectExplainerShare(s.input)); // prepared, encoded
  },
  /** Any non-blank text: the page reads it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): ExpectExplainerShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the text, or nothing
  },
});
