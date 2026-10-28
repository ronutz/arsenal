// ============================================================================
// src/lib/share/cases/f5os-tenant-config-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the F5OS tenant config explainer: the block goes as typed
// (posture input-caution).
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { F5OS_TENANT_SHARE, type F5osTenantShareState } from "../../tools/f5os-tenant-config-explainer/share"; // the spec
import { TENANT_VECTORS } from "../../tools/f5os-tenant-config-explainer/golden-vectors"; // the tool's own vectors

/** Three of the tool's own inputs: the CLI form, the JSON form, and one under its minimum memory. */
const INPUTS = [...new Set(TENANT_VECTORS.map((v) => v.input))].slice(0, 3); // distinct, in order

/** The cases. */
export const F5OS_TENANT_SHARE_CASES = defineShareCases<F5osTenantShareState, F5osTenantShareState>({
  spec: F5OS_TENANT_SHARE, // the spec
  accept: INPUTS.map((input, i) => ({ id: `vector-input-${i + 1}`, state: { input }, params: { input }, restored: { input } })), // "[", "]", quotes, line breaks, as typed
  empty: [ // nothing to share: the button is disabled
    { id: "nothing", state: { input: "" } }, // a blank box
    { id: "white-space", state: { input: "\n \n" } }, // only white space
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
    { id: "blank", values: { input: " " } }, // only white space
  ],
});
