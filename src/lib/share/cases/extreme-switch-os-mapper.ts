// ============================================================================
// src/lib/share/cases/extreme-switch-os-mapper.ts
// ----------------------------------------------------------------------------
// Share cases of the Extreme switch OS-name mapper (wave 4C, 2026-11-01): the
// link carries the box as typed. Values are the page's own one-tap examples.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { OS_MAPPER_SHARE, type OsMapperShareState } from "../../tools/extreme-switch-os-mapper/share"; // the spec

/** The cases. */
export const OS_MAPPER_SHARE_CASES = defineShareCases<OsMapperShareState, OsMapperShareState>({
  spec: OS_MAPPER_SHARE, // the spec
  accept: [
    { id: "series", state: { input: "5520" }, params: { input: "5520" }, restored: { input: "5520" } }, // a Universal series
    { id: "model-with-suffix", state: { input: "X440-G2" }, params: { input: "X440-G2" }, restored: { input: "X440-G2" } }, // a model name
    { id: "os-name", state: { input: " VOSS " }, params: { input: " VOSS " }, restored: { input: " VOSS " } }, // an OS name, blanks as typed
  ],
  empty: [
    { id: "blank", state: { input: "   " } }, // nothing typed
  ],
  blocked: [],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: "  " } }, // white space
    { id: "absent", values: { input: null } }, // not there
  ],
});
