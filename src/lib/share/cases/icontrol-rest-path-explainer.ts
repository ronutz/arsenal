// ============================================================================
// src/lib/share/cases/icontrol-rest-path-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the iControl REST path explainer: the path goes with an auth
// token masked and a password or a header's credentials replaced (the tool's
// own share vectors pin the copy and that the receiving page reads the same).
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { ICONTROL_PATH_SHARE, type IcontrolPathShareState } from "../../tools/icontrol-rest-path-explainer/share"; // the spec
import { SHARE_VECTORS } from "../../tools/icontrol-rest-path-explainer/golden-vectors"; // the tool's own vectors

/** The cases. */
export const ICONTROL_PATH_SHARE_CASES = defineShareCases<IcontrolPathShareState, IcontrolPathShareState>({
  spec: ICONTROL_PATH_SHARE, // the spec
  accept: SHARE_VECTORS.map((v) => ({ id: v.name, state: { input: v.input }, params: { input: v.expect }, restored: { input: v.expect }, mustNotContain: v.secrets })), // each copy, never a credential
  empty: [
    { id: "nothing", state: { input: "" } }, // nothing typed
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
  ],
});
