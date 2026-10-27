// ============================================================================
// src/lib/share/cases/panos-policy-evaluation-order.ts
// ----------------------------------------------------------------------------
// Share cases of the PAN-OS policy evaluation order explainer: the rulebase
// goes as typed, alone, as the #input= handoff usePrefill reads (posture
// input-caution, raised: the popover adds the tool's caution line).
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { PANOS_POLICY_SHARE } from "../../tools/panos-policy-evaluation-order/share"; // the spec
import { PANOS_GOLDEN_VECTORS } from "../../tools/panos-policy-evaluation-order/golden-vectors"; // the tool's own vectors

/** The page's Example: five rules over four layers ("|" and "=" inside, padded columns, line breaks). */
const EXAMPLE = [
  "shared-pre | block-tor       | deny  | from=any to=any app=tor", // the first layer
  "dg-pre     | allow-dns       | allow | from=trust to=untrust app=dns svc=application-default", // device group pre
  "local      | web-out         | allow | from=trust to=untrust app=web-browsing", // local
  "local      | block-webmail   | deny  | from=trust to=untrust app=gmail-base", // local
  "dg-post    | catch-all-deny  | deny  | from=any to=any", // device group post
].join("\n"); // as PanosPolicyOrderTool's EXAMPLE

/** The cases. */
export const PANOS_POLICY_SHARE_CASES = defineShareCases(Object.freeze({
  spec: PANOS_POLICY_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // the whole rulebase, exactly
    ...PANOS_GOLDEN_VECTORS.slice(0, 2).map((v, i) => ({ id: `vector-${i + 1}`, state: { input: v.rules }, params: { input: v.rules }, restored: { input: v.rules } })), // two of the tool's vectors
  ],
  empty: [ // nothing to share: the button is disabled
    { id: "nothing", state: { input: "" } }, // a blank box
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
  ],
}));
