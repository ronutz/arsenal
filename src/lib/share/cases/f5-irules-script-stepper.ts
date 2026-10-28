// ============================================================================
// src/lib/share/cases/f5-irules-script-stepper.ts
// ----------------------------------------------------------------------------
// Share cases of the iRules script stepper: the script as #input=, the mode
// and (in iRules mode) each sample request field that differs from the
// page's own; a key or credential written out in any field gets no link
// (code "secret").
// ============================================================================

import { defineShareCases, type ShareCases } from "./define"; // the case shape
import { IRULES_SCRIPT_STEPPER_SHARE, type ScriptStepperShareState } from "../../tools/f5-irules-script-stepper/share"; // the spec and its state
import { DEFAULT_SAMPLE, VECTORS } from "../../tools/f5-irules-script-stepper"; // the page's sample request and the tool's own vectors

/** The sample request the page starts with. */
const S = { uri: DEFAULT_SAMPLE.uri, host: DEFAULT_SAMPLE.host, method: DEFAULT_SAMPLE.method, agent: DEFAULT_SAMPLE.headers["User-Agent"] ?? "" }; // the four fields
/** The page's Example (the if-elseif vector). */
const IF_ELSEIF = VECTORS.find((v) => v.id === "if-elseif")!.input.script; // pinned there

/** The cases. */
export const IRULES_SCRIPT_STEPPER_SHARE_CASES = defineShareCases(Object.freeze<ShareCases<ScriptStepperShareState, ScriptStepperShareState>>({ // typed, so the cases check as one list
  spec: IRULES_SCRIPT_STEPPER_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "if-elseif", state: { input: IF_ELSEIF, mode: "irules", ...S }, params: { input: IF_ELSEIF, mode: "irules" }, restored: { input: IF_ELSEIF, mode: "irules", ...S } }, // the page's Example with the page's sample
    { id: "changed-sample", state: { input: "pool web_pool", mode: "irules", uri: "/api/v2?a=1&b=2", host: S.host, method: "POST", agent: "Mozilla/5.0 (X11; Linux x86_64)" }, params: { input: "pool web_pool", mode: "irules", uri: "/api/v2?a=1&b=2", method: "POST", agent: "Mozilla/5.0 (X11; Linux x86_64)" }, restored: { input: "pool web_pool", mode: "irules", uri: "/api/v2?a=1&b=2", host: S.host, method: "POST", agent: "Mozilla/5.0 (X11; Linux x86_64)" } }, // changed fields only
    { id: "plain-tcl", state: { input: "set a 1\nincr a", mode: "tcl", ...S, host: "x.example" }, params: { input: "set a 1\nincr a" }, restored: { input: "set a 1\nincr a", mode: "tcl", ...S } }, // plain Tcl reads no sample
  ],
  arrive: [ // decode only
    { id: "irules-defaults", values: { input: "log local0. [HTTP::host]", mode: "irules" }, restored: { input: "log local0. [HTTP::host]", mode: "irules", ...S } }, // the page's sample request
  ],
  empty: [ // nothing to share
    { id: "no-script", state: { input: "\n ", mode: "irules", ...S } }, // nothing to run
  ],
  blocked: [ // a key or credential written out: no link
    { id: "cookie-passphrase-in-script", state: { input: "HTTP::cookie encrypt session \"phrase-123\"\npool web_pool", mode: "irules", ...S }, code: "secret" }, // HTTP::cookie encrypt <name> <pass phrase>
    { id: "password-in-sample-uri", state: { input: "pool web_pool", mode: "irules", ...S, uri: "/proxy?to=https://bob:hunter2@10.0.0.5/" }, code: "secret" }, // RFC 3986 3.2.1, in the sample URI
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "no-script", values: { input: null, mode: "irules" } }, // nothing to run
    { id: "unknown-mode", values: { input: "set a 1", mode: "jacl" } }, // not a mode the page offers
    { id: "sample-in-tcl-mode", values: { input: "set a 1", agent: "curl/8.0" } }, // plain Tcl reads no sample
  ],
}));
