// ============================================================================
// src/lib/tools/f5-irules-expression-lab/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the iRules expression lab (posture "input"):
// a link carries what the evaluation reads, by name:
//
//   input  the expression, as written between the braces
//   setup  the set commands that run first (left out when empty)
//   mode   "irules" (left out for plain Tcl 8.4, the default)
//   uri    the sample request's HTTP::uri (iRules mode; left out at its default)
//   host   the sample request's HTTP::host (iRules mode; left out at its default)
//
// The set commands are where an iRule's values get pasted, keys included, so
// the iRule secrets check (src/lib/tcl84/irule-secrets.ts) reads every field
// before a link is offered: a value in a place a standard or F5 defines as a
// key or credential blocks the link (code "secret", the popover names the
// field and line); a value whose name looks like a secret is named in a
// caution line.
//
// Arrival: the fields fill as typing would, and the page does NOT evaluate
// them until the reader presses Evaluate (ROLLOUT section 8: the Tcl teaching
// interpreters fill only); editing any field evaluates as usual. A mode other
// than tcl or irules, or a sample value in plain Tcl mode, makes the whole
// share malformed: ignored, never half applied.
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns
import { blockedBySecrets, findIruleSecretsIn, type FieldSecretFinding } from "../../tcl84/irule-secrets"; // the iRule secrets check
import { DEFAULT_SAMPLE } from "./compute"; // the sample request the page starts with

/** The state: what the evaluation reads. */
export interface ExpressionLabShareState {
  /** The expression. */
  input: string;
  /** The set commands. */
  setup: string;
  /** Plain Tcl 8.4 or iRules. */
  mode: "tcl" | "irules";
  /** The sample HTTP::uri. */
  uri: string;
  /** The sample HTTP::host. */
  host: string;
}

/**
 * The fields the secrets check reads, with their link names (the sample only in iRules mode, where it is read).
 * @param s the state
 * @returns name and text pairs
 */
export function expressionLabFields(s: ExpressionLabShareState): [string, string][] {
  return [["input", s.input], ["setup", s.setup], ...(s.mode === "irules" ? ([["uri", s.uri], ["host", s.host]] as [string, string][]) : [])]; // in the order the page shows them
} // expressionLabFields

/**
 * Encode from a secrets report the page already made (it computes one for the button and the caution line).
 * @param s the state
 * @param secrets the secrets the check found in expressionLabFields(s)
 * @returns the values, nothing, or blocked
 */
export function encodeExpressionLab(s: ExpressionLabShareState, secrets: readonly FieldSecretFinding[]): ShareEncoding {
  if (s.input.trim() === "") return { ok: false, reason: "empty" }; // no expression: nothing evaluated, nothing to share
  const blocked = blockedBySecrets(secrets); // a key or credential somewhere
  if (blocked) return blocked; // no link
  const p: Record<string, string> = { input: s.input }; // the expression
  if (s.setup !== "") p.setup = s.setup; // the set commands, when there are any
  if (s.mode === "irules") { // iRules mode: the mode, and the sample where it differs from the default
    p.mode = "irules"; // not the default
    if (s.uri !== DEFAULT_SAMPLE.uri) p.uri = s.uri; // changed
    if (s.host !== DEFAULT_SAMPLE.host) p.host = s.host; // changed
  } // irules
  return { ok: true, params: p }; // the values
} // encodeExpressionLab

/** The spec. */
export const IRULES_EXPRESSION_LAB_SHARE: ShareSpec<ExpressionLabShareState> = Object.freeze({
  tool: "f5-irules-expression-lab", // the slug
  posture: "input", // every field as typed, after the secrets check
  carriesKey: "share.carries", // tools.f5-irules-expression-lab.share.carries
  names: ["input", "setup", "mode", "uri", "host"], // #input=...&setup=...&mode=irules
  /** The values, nothing, or blocked (the spec checks the fields itself). */
  encode(s: ExpressionLabShareState): ShareEncoding {
    return encodeExpressionLab(s, findIruleSecretsIn(expressionLabFields(s)).secrets); // checked, then encoded
  },
  /** A non-blank expression, a known mode, and sample values only in iRules mode. */
  decode(v: Readonly<Record<string, string | null>>): ExpressionLabShareState | null {
    if (!v.input || v.input.trim() === "") return null; // no expression: nothing to fill
    const mode = v.mode ?? "tcl"; // absent: plain Tcl
    if (mode !== "tcl" && mode !== "irules") return null; // not a mode the page offers
    if (mode === "tcl" && ((v.uri ?? null) !== null || (v.host ?? null) !== null)) return null; // a sample value plain Tcl does not read
    return { input: v.input, setup: v.setup ?? "", mode, uri: v.uri ?? DEFAULT_SAMPLE.uri, host: v.host ?? DEFAULT_SAMPLE.host }; // absent values at their defaults
  },
});
