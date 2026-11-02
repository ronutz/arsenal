// ============================================================================
// src/lib/tools/f5-awaf-signature-accuracy-risk/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the AWAF signature accuracy and risk reader
// (posture "input": four choices that describe a signature, nothing of the
// reader's site). The tool is a form with nothing to paste, so a link carries
// named values only, no "input" (ROLLOUT 11.3), and it carries all four, so a
// link keeps opening the same reading even if the page's starting choices
// change later:
//   accuracy     low, medium or high (the signature's accuracy)
//   risk         low, medium or high (its risk)
//   system       in-stack, not-in-stack or unknown (does it target your stack)
//   enforcement  enforced-blocking, staged or transparent
//
// Arrival: the four choices are set and the page computes as it does on a
// change. An unknown id makes the whole share malformed: ignored.
// ============================================================================

import { DEFAULTS, LEVELS, type Enforcement, type Level, type SigInput, type SystemRelevance } from "./compute"; // the form's shape, lists and starting values
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** Whether the signature targets the reader's stack, as the form offers it. */
const RELEVANCE: readonly SystemRelevance[] = ["in-stack", "not-in-stack", "unknown"]; // the select's options
/** The enforcement states the form offers. */
const ENFORCE: readonly Enforcement[] = ["enforced-blocking", "staged", "transparent"]; // the select's options

/** The spec. */
export const SIGNATURE_RISK_SHARE: ShareSpec<SigInput> = Object.freeze({
  tool: "f5-awaf-signature-accuracy-risk", // the slug
  posture: "input", // four choices
  carriesKey: "share.carries", // tools.f5-awaf-signature-accuracy-risk.share.carries
  names: ["accuracy", "risk", "system", "enforcement"], // a form: no "input"
  /** All four choices: there is always a reading to share. */
  encode(s: SigInput): ShareEncoding {
    return { ok: true, params: { accuracy: s.accuracy, risk: s.risk, system: s.systemRelevance, enforcement: s.enforcement } }; // by stable id
  },
  /** The four choices, each one the page offers; a choice the link lacks takes the starting value. */
  decode(v: Readonly<Record<string, string | null>>): SigInput | null {
    const accuracy = v.accuracy ?? DEFAULTS.accuracy; // the accuracy
    const risk = v.risk ?? DEFAULTS.risk; // the risk
    if (!(LEVELS as readonly string[]).includes(accuracy) || !(LEVELS as readonly string[]).includes(risk)) return null; // low, medium or high
    const system = v.system ?? DEFAULTS.systemRelevance; // the relevance
    if (!(RELEVANCE as readonly string[]).includes(system)) return null; // one the page offers
    const enforcement = v.enforcement ?? DEFAULTS.enforcement; // the enforcement
    if (!(ENFORCE as readonly string[]).includes(enforcement)) return null; // one the page offers
    return { accuracy: accuracy as Level, risk: risk as Level, systemRelevance: system as SystemRelevance, enforcement: enforcement as Enforcement }; // the form
  },
});
