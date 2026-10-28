// ============================================================================
// src/lib/tools/f5-irules-script-stepper/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the iRules script stepper (posture
// "input-caution"): a link carries what the run reads, by name:
//
//   input   the script
//   mode    "irules" (left out for plain Tcl 8.4, the default)
//   uri     the sample request's HTTP::uri    } iRules mode only, each left
//   host    the sample request's HTTP::host   } out at the value the page
//   method  the sample request's HTTP::method } starts with
//   agent   the sample User-Agent header      }
//
// A script is usually a piece of a real iRule: it can name internal hosts,
// pools and data groups (the caution line), and it can hold keys and
// credentials. The iRule secrets check (src/lib/tcl84/irule-secrets.ts)
// reads every field before a link is offered: a value in a place a standard
// or F5 defines as a key or credential blocks the link (code "secret", the
// popover names the field and line); a value whose name looks like a secret
// is named in the caution line instead of the general one.
//
// Arrival: the fields fill as typing would, and the page does NOT run the
// script until the reader presses Run (ROLLOUT section 8: the Tcl teaching
// interpreters fill only); editing any field runs it as usual. A mode other
// than tcl or irules, or a sample value in plain Tcl mode, makes the whole
// share malformed: ignored, never half applied.
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns
import { blockedBySecrets, findIruleSecretsIn, type FieldSecretFinding } from "../../tcl84/irule-secrets"; // the iRule secrets check
import { DEFAULT_SAMPLE } from "./compute"; // the sample request the page starts with

/** The User-Agent the page starts with. */
const DEFAULT_AGENT = DEFAULT_SAMPLE.headers["User-Agent"] ?? ""; // "curl/8.0"

/** The sample fields, by link name, with the value the page starts with. */
const SAMPLE: readonly (readonly ["uri" | "host" | "method" | "agent", string])[] = [["uri", DEFAULT_SAMPLE.uri], ["host", DEFAULT_SAMPLE.host], ["method", DEFAULT_SAMPLE.method], ["agent", DEFAULT_AGENT]]; // in the page's order

/** The state: what the run reads. */
export interface ScriptStepperShareState {
  /** The script. */
  input: string;
  /** Plain Tcl 8.4 or iRules. */
  mode: "tcl" | "irules";
  /** The sample HTTP::uri. */
  uri: string;
  /** The sample HTTP::host. */
  host: string;
  /** The sample HTTP::method. */
  method: string;
  /** The sample User-Agent header. */
  agent: string;
}

/**
 * The fields the secrets check reads, with their link names (the sample only in iRules mode, where it is read).
 * @param s the state
 * @returns name and text pairs
 */
export function scriptStepperFields(s: ScriptStepperShareState): [string, string][] {
  return [["input", s.input], ...(s.mode === "irules" ? SAMPLE.map(([n]) => [n, s[n]] as [string, string]) : [])]; // in the order the page shows them
} // scriptStepperFields

/**
 * Encode from a secrets report the page already made (it computes one for the button and the caution line).
 * @param s the state
 * @param secrets the secrets the check found in scriptStepperFields(s)
 * @returns the values, nothing, or blocked
 */
export function encodeScriptStepper(s: ScriptStepperShareState, secrets: readonly FieldSecretFinding[]): ShareEncoding {
  if (s.input.trim() === "") return { ok: false, reason: "empty" }; // no script: nothing run, nothing to share
  const blocked = blockedBySecrets(secrets); // a key or credential somewhere
  if (blocked) return blocked; // no link
  const p: Record<string, string> = { input: s.input }; // the script
  if (s.mode === "irules") { // iRules mode: the mode, and each sample field that differs from the page's start
    p.mode = "irules"; // not the default
    for (const [n, d] of SAMPLE) if (s[n] !== d) p[n] = s[n]; // changed
  } // irules
  return { ok: true, params: p }; // the values
} // encodeScriptStepper

/** The spec. */
export const IRULES_SCRIPT_STEPPER_SHARE: ShareSpec<ScriptStepperShareState> = Object.freeze({
  tool: "f5-irules-script-stepper", // the slug
  posture: "input-caution", // every field as typed, with a caution line, after the secrets check
  carriesKey: "share.carries", // tools.f5-irules-script-stepper.share.carries
  names: ["input", "mode", "uri", "host", "method", "agent"], // #input=...&mode=irules&host=...
  /** The values, nothing, or blocked (the spec checks the fields itself). */
  encode(s: ScriptStepperShareState): ShareEncoding {
    return encodeScriptStepper(s, findIruleSecretsIn(scriptStepperFields(s)).secrets); // checked, then encoded
  },
  /** A non-blank script, a known mode, and sample values only in iRules mode. */
  decode(v: Readonly<Record<string, string | null>>): ScriptStepperShareState | null {
    if (!v.input || v.input.trim() === "") return null; // no script: nothing to fill
    const mode = v.mode ?? "tcl"; // absent: plain Tcl
    if (mode !== "tcl" && mode !== "irules") return null; // not a mode the page offers
    if (mode === "tcl" && SAMPLE.some(([n]) => (v[n] ?? null) !== null)) return null; // a sample value plain Tcl does not read
    const out: ScriptStepperShareState = { input: v.input, mode, uri: DEFAULT_SAMPLE.uri, host: DEFAULT_SAMPLE.host, method: DEFAULT_SAMPLE.method, agent: DEFAULT_AGENT }; // absent values at the page's start
    for (const [n] of SAMPLE) { const x = v[n]; if (x !== null && x !== undefined) out[n] = x; } // the carried ones
    return out; // the state
  },
});
