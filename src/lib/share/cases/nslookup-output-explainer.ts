// ============================================================================
// src/lib/share/cases/nslookup-output-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the nslookup output explainer: the paste goes as typed,
// alone (posture input-caution: the popover adds the tool's caution line).
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { NSLOOKUP_OUTPUT_SHARE } from "../../tools/nslookup-output-explainer/share"; // the spec
import { NS_VECTORS } from "../../tools/nslookup-output-explainer/golden-vectors"; // the tool's own vectors

/** The page's Example: golden vector a-aaaa-nonauth, real nslookup output. */
const EXAMPLE = NS_VECTORS.find((v) => v.id === "a-aaaa-nonauth")?.input ?? ""; // byte for byte

/** The cases. */
export const NSLOOKUP_OUTPUT_SHARE_CASES = defineShareCases(Object.freeze({
  spec: NSLOOKUP_OUTPUT_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // the whole capture, exactly
    ...NS_VECTORS.filter((v) => v.id !== "a-aaaa-nonauth").slice(0, 2).map((v) => ({ id: `vector-${v.id}`, state: { input: v.input }, params: { input: v.input }, restored: { input: v.input } })), // two more captures
  ],
  empty: [ // nothing to share: the button is disabled
    { id: "nothing", state: { input: "" } }, // a blank box
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
    { id: "blank", values: { input: "  \n" } }, // only white space
  ],
}));
