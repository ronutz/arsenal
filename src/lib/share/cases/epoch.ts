// ============================================================================
// src/lib/share/cases/epoch.ts
// ----------------------------------------------------------------------------
// Share cases of the epoch tool: a value the page reads goes as typed; one
// it refuses has no reading to share.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { EPOCH_SHARE, type EpochShareState } from "../../tools/epoch/share"; // the spec

/** The page's Example. */
const EXAMPLE = "1000000000"; // verbatim
/** A second reading: an ISO date. */
const SECOND = "2024-02-29T12:00:00Z"; // as typed

/** The cases. */
export const EPOCH_SHARE_CASES = defineShareCases<EpochShareState, EpochShareState>({
  spec: EPOCH_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // the Example
    { id: "second", state: { input: SECOND }, params: { input: SECOND }, restored: { input: SECOND } }, // an ISO date
    { id: "spaces-kept", state: { input: " " + EXAMPLE + " " }, params: { input: " " + EXAMPLE + " " }, restored: { input: " " + EXAMPLE + " " } }, // the box as typed, spaces and all
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing typed
    { id: "refused", state: { input: "not a date" } }, // the page refuses it: no reading
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: " " } }, // white space
    { id: "absent", values: { input: null } }, // not there
  ],
});
