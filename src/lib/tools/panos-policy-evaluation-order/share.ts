// ============================================================================
// src/lib/tools/panos-policy-evaluation-order/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the PAN-OS policy evaluation order explainer
// (posture "input-caution", raised from the inventory's "input"): a link
// carries the rulebase as typed, after the "#", and nothing else. The raise:
// the manifest's own header says "a policy rulebase names zones, subnets and
// users, which is exactly the kind of internal detail that should never leave
// the browser" (shareSafetyDefault "fragment"), and ROLLOUT.md section 2 puts
// a "fragment" tool whose comment names infrastructure in input-caution; the
// inventory read only the comment on the shareSafetyDefault line, which is
// empty. The popover therefore adds the tool's own caution line.
//
// The traffic to trace is not carried: the page's handoff carries one string
// (see Arrival), and the popover says so when a trace is on.
//
// Arrival: NOT useShareArrival. PanosPolicyOrderTool already reads #input=
// with usePrefill, which fills the rules box and computes as a paste would;
// that arrival is kept exactly as it is. encode gives exactly what usePrefill's
// apply accepts (one string), and decode mirrors readHandoff (any non-empty
// value).
// ============================================================================

import type { ShareSpec } from "../../share/spec"; // the spec shape

/** The state a share carries: the rules box as typed. */
export interface PanosPolicyShareState {
  /** The rulebase text. */
  input: string;
}

/** The spec. */
export const PANOS_POLICY_SHARE: ShareSpec<PanosPolicyShareState> = Object.freeze({
  tool: "panos-policy-evaluation-order", // the slug
  posture: "input-caution", // raised: the rulebase names zones, subnets and users (header comment above)
  carriesKey: "share.carries", // tools.panos-policy-evaluation-order.share.carries
  names: ["input"], // #input=, the handoff usePrefill reads
  /** The rules as typed, or nothing while the box is blank. */
  encode(state: PanosPolicyShareState) {
    if (state.input.trim() === "") return { ok: false, reason: "empty" } as const; // nothing to share: the button is disabled
    return { ok: true, params: { input: state.input } } as const; // the one value usePrefill's apply takes
  },
  /** Any non-empty value, as readHandoff hands it to usePrefill (the page refuses a malformed rulebase with its message). */
  decode(values: Readonly<Record<string, string | null>>) {
    const v = values.input; // the arriving value
    return v ? { input: v } : null; // the text, or nothing
  },
});
