// ============================================================================
// src/lib/share/cases/f5-persistence-method-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the persistence-method explainer: the profiles and virtual
// servers go through the tmsh explainer's copy, so a cookie encryption pass
// phrase (or any other secret setting) never reaches a link.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { PERSISTENCE_SHARE, type PersistenceShareState } from "../../tools/f5-persistence-method-explainer/share"; // the spec
import { P_VECTORS } from "../../tools/f5-persistence-method-explainer/golden-vectors"; // the tool's own vectors
import { SHARE_VECTORS } from "../../tools/f5-tmsh-config-explainer/golden-vectors"; // the copy's vectors

/** The page's Example: the cookie-profile vector's insert-mode cookie. */
const EXAMPLE = P_VECTORS.find((v) => v.id === "cookie-profile")!.input; // pinned there
/** The cookie profile with an encryption pass phrase. */
const ENC = SHARE_VECTORS.find((v) => v.id === "share-persistence-cookie-passphrase")!; // pinned there
/** A virtual server with a primary and a fallback method, and the cookie profile it uses (one line each). */
const VS_IN = `${ENC.input}\nltm virtual vs_app {\n    destination 192.0.2.80:443\n    fallback-persistence /Common/source_addr\n    persist { cookie_enc { default yes } }\n}`; // as pasted
/** The same, as the link carries it. */
const VS_OUT = `${ENC.expect}\nltm virtual vs_app {\n    destination 192.0.2.80:443\n    fallback-persistence /Common/source_addr\n    persist { cookie_enc { default yes } }\n}`; // the copy

/** The cases. */
export const F5_PERSISTENCE_SHARE_CASES = defineShareCases<PersistenceShareState, PersistenceShareState>({
  spec: PERSISTENCE_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // nothing to replace: the paste
    { id: "cookie-passphrase", state: { input: ENC.input }, params: { input: ENC.expect }, restored: { input: ENC.expect }, mustNotContain: ENC.secrets }, // the pass phrase never travels
    { id: "with-virtual", state: { input: VS_IN }, params: { input: VS_OUT }, restored: { input: VS_OUT }, mustNotContain: ENC.secrets }, // the chain stays, the pass phrase goes
  ],
  empty: [
    { id: "nothing", state: { input: "" } }, // no paste
    { id: "white-space", state: { input: "\n  " } }, // nothing but white space
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
  ],
});
