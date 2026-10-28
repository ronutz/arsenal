// ============================================================================
// src/lib/share/cases/f5-l4-profile-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the LTM L4 protocol profile explainer: the name goes as
// typed.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { L4_PROFILE_SHARE, type L4ProfileShareState } from "../../tools/f5-l4-profile-explainer/share"; // the spec

/** The cases. */
export const F5_L4_PROFILE_SHARE_CASES = defineShareCases<L4ProfileShareState, L4ProfileShareState>({
  spec: L4_PROFILE_SHARE, // the spec
  accept: [
    { id: "example", state: { input: "fastl4" }, params: { input: "fastl4" }, restored: { input: "fastl4" } }, // the page's Example
    { id: "catalogue", state: { input: "profiles" }, params: { input: "profiles" }, restored: { input: "profiles" } }, // every card
    { id: "dashed", state: { input: "f5-tcp-progressive" }, params: { input: "f5-tcp-progressive" }, restored: { input: "f5-tcp-progressive" } }, // a built-in with dashes
  ],
  empty: [
    { id: "nothing", state: { input: "" } }, // nothing typed
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
  ],
});
