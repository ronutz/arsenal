// ============================================================================
// src/lib/share/cases/oauth-flow-chooser.ts
// ----------------------------------------------------------------------------
// Share cases of the OAuth flow chooser: a form, so named values only, the
// application type by its stable id and each question answered yes as "1".
// ============================================================================

import { defineShareCases, type ShareCases } from "./define"; // the case shape
import { OAUTH_CHOOSER_SHARE, type OauthChooserShareState } from "../../tools/oauth-flow-chooser/share"; // the spec

/** The cases. */
const CASES: ShareCases<OauthChooserShareState, OauthChooserShareState> = {
  spec: OAUTH_CHOOSER_SHARE, // the spec
  accept: [
    { id: "example-spa", state: { appType: "spa", wantsIdentity: true, needsOffline: true }, params: { app: "spa", identity: "1", offline: "1" }, restored: { appType: "spa", wantsIdentity: true, needsOffline: true } }, // the page's Example
    { id: "service-alone", state: { appType: "service", wantsIdentity: false, needsOffline: false }, params: { app: "service" }, restored: { appType: "service", wantsIdentity: false, needsOffline: false } }, // no question answered yes
    { id: "device-offline", state: { appType: "device", wantsIdentity: false, needsOffline: true }, params: { app: "device", offline: "1" }, restored: { appType: "device", wantsIdentity: false, needsOffline: true } }, // one yes
  ],
  arrive: [
    { id: "explicit-no", values: { app: "native", identity: "0", offline: "0" }, restored: { appType: "native", wantsIdentity: false, needsOffline: false } }, // "0" reads as no
  ],
  empty: [
    { id: "no-type", state: { appType: "", wantsIdentity: true, needsOffline: false } }, // no recommendation without a type
  ],
  reject: [
    { id: "unknown-type", values: { app: "mainframe", identity: null, offline: null } }, // not offered
    { id: "no-type", values: { app: null, identity: "1", offline: null } }, // required
    { id: "switch-not-1-or-0", values: { app: "spa", identity: "yes", offline: null } }, // 1 or 0 only
  ],
};

/** The runner. */
export const OAUTH_FLOW_CHOOSER_SHARE_CASES = defineShareCases(CASES); // the central harness runs it
