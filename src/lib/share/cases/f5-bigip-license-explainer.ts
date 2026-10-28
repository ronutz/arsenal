// ============================================================================
// src/lib/share/cases/f5-bigip-license-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the BIG-IP licence explainer: the licence goes with every
// registration and add-on key, Dossier, Authorization, license_manager_key and
// pool_license_information value masked (the tool's own share vectors pin the
// copy and that the receiving page reads the same licence).
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { LICENSE_SHARE, type LicenseShareState } from "../../tools/f5-bigip-license-explainer/share"; // the spec
import { shareableLicense } from "../../tools/f5-bigip-license-explainer/compute"; // the copy, for the two fixtures (pinned by count and secrets in the tool's vectors)
import { SHARE_VECTORS } from "../../tools/f5-bigip-license-explainer/golden-vectors"; // the tool's own vectors

/** A share vector by id. */
const sv = (id: string) => SHARE_VECTORS.find((v) => v.id === id)!; // pinned there

/** The cases. */
export const F5_BIGIP_LICENSE_SHARE_CASES = defineShareCases<LicenseShareState, LicenseShareState>({
  spec: LICENSE_SHARE, // the spec
  accept: [
    { id: "k3782-key", state: { input: sv("share-k3782-key-exact").input }, params: { input: sv("share-k3782-key-exact").expect! }, restored: { input: sv("share-k3782-key-exact").expect! }, mustNotContain: sv("share-k3782-key-exact").secrets }, // pinned byte for byte
    ...["share-direct-fixture", "share-bigiq-fixture"].map((id) => ({ id, state: { input: sv(id).input }, params: { input: shareableLicense(sv(id).input).text }, restored: { input: shareableLicense(sv(id).input).text }, mustNotContain: sv(id).secrets })), // the page's Example and the BIG-IQ fixture: no key, no signature
  ],
  empty: [
    { id: "nothing", state: { input: "" } }, // no paste
    { id: "white-space", state: { input: "\n \n" } }, // nothing but white space
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
  ],
});
