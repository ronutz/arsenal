// ============================================================================
// src/lib/tools/python-playground/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the Python playground (posture "input-caution";
// the manifest: "A program and its output may hold anything the reader typed:
// share with care"). A link carries the program (input) and the standard
// input box (stdin, when it holds anything). It never carries the output: the
// opener runs the program themselves, and only when they press Run.
//
// The program goes as typed: it is the thing being shared. Before a link is
// offered the shared secrets check (src/lib/share/text-secrets.ts, the site's
// base check reused as is) reads both boxes: a credential a standard defines
// (a PEM private key, an Authorization or Cookie line, a JWT, a password in a
// URL, an AWS access key ID, a FortiOS ENC value) blocks the link, and the
// popover names the box and the line; a value whose name only looks like a
// secret (api_key = "...", an assignment the check reads in Python's own
// form) is named in the caution line instead.
//
// Arrival (ROLLOUT section 8): the two boxes fill, any earlier output is
// cleared, and the page says the program came from a link. Nothing else
// happens: the 13 MB engine is not downloaded, and if it is already loaded the
// program is not run; the reader reads it and presses Run, as the iRules
// interpreters hold an arriving script until Evaluate or Run. A blank program
// is malformed.
// ============================================================================

import { blockedBySecret, findShareSecretsIn, type ShareSecretFinding } from "../../share/text-secrets"; // the shared secrets check
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the program and the standard input box. */
export interface PlaygroundShareState {
  /** The program as typed. */
  input: string;
  /** The standard input box as typed. */
  stdin: string;
}

/** What the check found, each finding tagged with its box ("input" for the program, "stdin"). */
export interface PlaygroundSecrets {
  /** Credentials. */
  secrets: (ShareSecretFinding & { field: string })[];
  /** Secret-looking names. */
  maybe: (ShareSecretFinding & { field: string })[];
}

/**
 * The shared check over both boxes (none is read when together they are over the link bound).
 * @param s the state
 * @returns the findings, the program's first
 */
export function checkPlaygroundText(s: PlaygroundShareState): PlaygroundSecrets {
  const r = findShareSecretsIn([["input", s.input], ["stdin", s.stdin]]); // both, in reading order
  return { secrets: r.secrets, maybe: r.maybe }; // tagged by box
} // checkPlaygroundText

/**
 * Encode from the check's findings (the page computes them once for the button and the caution line).
 * @param s the state
 * @param found the findings
 * @returns both boxes, nothing, or blocked
 */
export function encodePlaygroundShare(s: PlaygroundShareState, found: PlaygroundSecrets): ShareEncoding {
  if (s.input.trim() === "") return { ok: false, reason: "empty" }; // no program: nothing to share
  return blockedBySecret(found.secrets) ?? { ok: true, params: { input: s.input, stdin: s.stdin } }; // blocked, or both (an empty stdin carries nothing)
} // encodePlaygroundShare

/** The spec. */
export const PLAYGROUND_SHARE: ShareSpec<PlaygroundShareState> = Object.freeze({
  tool: "python-playground", // the slug
  posture: "input-caution", // the program as typed, with a caution line, after the secrets check
  carriesKey: "share.carries", // tools.python-playground.share.carries
  names: ["input", "stdin"], // the program first
  /** Both boxes, nothing, or blocked (the spec checks them itself). */
  encode(s: PlaygroundShareState): ShareEncoding {
    return encodePlaygroundShare(s, checkPlaygroundText(s)); // checked, encoded
  },
  /** A non-blank program, and any standard input. */
  decode(v: Readonly<Record<string, string | null>>): PlaygroundShareState | null {
    if (!v.input || v.input.trim() === "") return null; // no program
    return { input: v.input, stdin: v.stdin ?? "" }; // absent stdin: empty
  },
});
