// ============================================================================
// src/lib/share/cases/f5-tmsh-config-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the tmsh config explainer: the configuration goes with every
// secret setting's value replaced (the tool's own share vectors pin the copy
// byte for byte); the values themselves never reach a link.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { TMSH_CONFIG_SHARE, type TmshShareState } from "../../tools/f5-tmsh-config-explainer/share"; // the spec
import { SHARE_VECTORS, TMSH_VECTORS } from "../../tools/f5-tmsh-config-explainer/golden-vectors"; // the tool's own vectors

/** A share vector by id. */
const sv = (id: string) => SHARE_VECTORS.find((v) => v.id === id)!; // pinned there
/** The first golden vector's configuration: a pool with members, no secret. */
const POOL = TMSH_VECTORS[0].input; // pinned there

/** The cases. */
export const F5_TMSH_CONFIG_SHARE_CASES = defineShareCases<TmshShareState, TmshShareState>({
  spec: TMSH_CONFIG_SHARE, // the spec
  accept: [
    { id: "no-secret", state: { input: POOL }, params: { input: POOL }, restored: { input: POOL } }, // nothing to replace: the paste
    ...["share-monitor-password-and-authorization", "share-snmp-auth-and-key-file", "share-one-line-form"].map((id) => ({ id, state: { input: sv(id).input }, params: { input: sv(id).expect }, restored: { input: sv(id).expect }, mustNotContain: sv(id).secrets })), // the values never travel
    { id: "irule-kept", state: { input: sv("share-none-and-irule-kept").input }, params: { input: sv("share-none-and-irule-kept").expect }, restored: { input: sv("share-none-and-irule-kept").expect } }, // "none" and the iRule body as pasted
  ],
  empty: [
    { id: "nothing", state: { input: "" } }, // no paste
    { id: "white-space", state: { input: " \n\t" } }, // nothing but white space
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: "   " } }, // white space
    { id: "absent", values: { input: null } }, // not there
  ],
});
