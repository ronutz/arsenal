// ============================================================================
// src/lib/share/cases/cvss-vector-decoder.ts
// ----------------------------------------------------------------------------
// Share cases of the CVSS vector decoder: a vector the page decodes goes as
// typed; one it refuses, or one of a version it does not score, has nothing
// to share.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { CVSS_SHARE, type CvssShareState } from "../../tools/cvss-vector-decoder/share"; // the spec

/** The page's Example. */
const EXAMPLE = "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"; // verbatim
/** A CVSS 3.0 vector with temporal metrics and a changed scope. */
const TEMPORAL = "CVSS:3.0/AV:L/AC:H/PR:L/UI:R/S:C/C:L/I:L/A:N/E:P/RL:O/RC:C"; // base and temporal

/** The cases. */
export const CVSS_VECTOR_SHARE_CASES = defineShareCases<CvssShareState, CvssShareState>({
  spec: CVSS_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // the Example
    { id: "temporal", state: { input: TEMPORAL }, params: { input: TEMPORAL }, restored: { input: TEMPORAL } }, // temporal metrics too
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing typed
    { id: "not-a-vector", state: { input: "high severity" } }, // the page refuses it
    { id: "unsupported-version", state: { input: "CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N" } }, // a version the page does not score
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: " " } }, // white space
    { id: "absent", values: { input: null } }, // not there
  ],
});
