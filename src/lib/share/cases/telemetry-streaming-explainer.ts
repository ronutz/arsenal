// ============================================================================
// src/lib/share/cases/telemetry-streaming-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the Telemetry Streaming explainer (posture derived): every share vector of the
// tool (golden-vectors.ts, SHARE_VECTORS) becomes a round trip here. The link
// carries the copy, never the paste, and no secret the vector names is in it
// in any spelling; a paste that is not JSON and names a secret gets no link.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { TS_SHARE, type TsShareState, type TsShareStateInput } from "../../tools/telemetry-streaming-explainer/share"; // the spec
import { SHARE_VECTORS } from "../../tools/telemetry-streaming-explainer/golden-vectors"; // the tool's own share vectors

/** The vectors that make a copy (or go as typed). */
const COPIES = SHARE_VECTORS.filter((v) => v.expect !== null); // the accept cases
/** The vectors that make none. */
const NO_COPY = SHARE_VECTORS.filter((v) => v.expect === null); // the blocked cases

/** The cases. */
export const TS_SHARE_CASES = defineShareCases<TsShareStateInput, TsShareState>({
  spec: TS_SHARE, // the spec
  accept: COPIES.map((v) => ({ id: v.id, state: { input: v.input }, params: { input: v.expect ?? "" }, restored: { input: v.expect ?? "" }, mustNotContain: v.secrets })), // the copy goes; the secrets never do
  empty: [ // nothing to share: the button is disabled
    { id: "nothing", state: { input: "" } }, // a blank box
    { id: "white-space", state: { input: " \n\t" } }, // only white space
  ],
  blocked: NO_COPY.map((v) => ({ id: v.id, state: { input: v.input }, code: "unparsed-secret" })), // broken JSON naming a secret
  reject: [ // malformed arrivals: ignored and stripped
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
    { id: "blank", values: { input: "\n" } }, // only white space
  ],
});
