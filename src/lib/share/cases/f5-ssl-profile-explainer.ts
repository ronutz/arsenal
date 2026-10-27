// ============================================================================
// src/lib/share/cases/f5-ssl-profile-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the F5 SSL profile explainer: the profile goes with every
// pass-phrase value replaced (the tool's own share vectors pin the copy byte
// for byte); the values themselves never reach a link.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { F5_SSL_PROFILE_SHARE, type F5SslProfileShareState } from "../../tools/f5-ssl-profile-explainer/share"; // the spec
import { GOLDEN_VECTORS, SHARE_VECTORS } from "../../tools/f5-ssl-profile-explainer/golden-vectors"; // the tool's own vectors

/** The Example (the first golden vector): no pass phrase. */
const EXAMPLE = GOLDEN_VECTORS[0].input; // pinned there
/** The cert-key-chain pass phrase vector. */
const CKC = SHARE_VECTORS.find((v) => v.id === "share-ckc-passphrase")!; // pinned there
/** The top-level and forward proxy CA vector. */
const TOP = SHARE_VECTORS.find((v) => v.id === "share-top-level-and-proxy-ca")!; // pinned there

/** The cases. */
export const F5_SSL_PROFILE_SHARE_CASES = defineShareCases<F5SslProfileShareState, F5SslProfileShareState>({
  spec: F5_SSL_PROFILE_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // nothing to replace: the paste
    { id: "ckc-passphrase", state: { input: CKC.input }, params: { input: CKC.expect }, restored: { input: CKC.expect }, mustNotContain: CKC.secrets }, // the encrypted value never travels
    { id: "top-level-and-proxy-ca", state: { input: TOP.input }, params: { input: TOP.expect }, restored: { input: TOP.expect }, mustNotContain: [...TOP.secrets, "lab only"] }, // a quoted phrase, in part or whole, never travels
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
