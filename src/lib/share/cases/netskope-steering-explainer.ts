// ============================================================================
// src/lib/share/cases/netskope-steering-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the Netskope steering-method explainer (2026-11-01, wave 4B):
// a form; the seven answers go, always, as 1 or 0; a missing answer or another
// value is malformed.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { STEERING_METHOD_SHARE } from "../../tools/netskope-steering-explainer/share"; // the spec
import type { Situation } from "../../tools/netskope-steering-explainer/compute"; // the state

/** The page's opening answers. */
const DEFAULTS: Situation = { managedDevice: true, onPremises: false, canInstallCert: true, needUserIdentity: true, needPrivateApps: false, needNonWebPorts: false, existingProxy: false }; // as the component holds them
/** The page's Example. */
const EXAMPLE: Situation = { managedDevice: false, onPremises: true, canInstallCert: false, needUserIdentity: true, needPrivateApps: false, needNonWebPorts: true, existingProxy: true }; // as the component holds it
/** Every answer as a link writes it. */
const ALL_ONE = { managed: "1", onpremises: "1", cert: "1", identity: "1", privateapps: "1", nonwebports: "1", proxy: "1" }; // every box ticked

/** The cases. */
export const NETSKOPE_STEERING_METHOD_SHARE_CASES = defineShareCases<Situation, Situation>({
  spec: STEERING_METHOD_SHARE, // the spec
  accept: [
    { id: "defaults", state: DEFAULTS, params: { managed: "1", onpremises: "0", cert: "1", identity: "1", privateapps: "0", nonwebports: "0", proxy: "0" }, restored: DEFAULTS }, // the page as it opens: every answer written
    { id: "example", state: EXAMPLE, params: { managed: "0", onpremises: "1", cert: "0", identity: "1", privateapps: "0", nonwebports: "1", proxy: "1" }, restored: EXAMPLE }, // the Example
    { id: "all-ticked", state: { managedDevice: true, onPremises: true, canInstallCert: true, needUserIdentity: true, needPrivateApps: true, needNonWebPorts: true, existingProxy: true }, params: ALL_ONE, restored: { managedDevice: true, onPremises: true, canInstallCert: true, needUserIdentity: true, needPrivateApps: true, needNonWebPorts: true, existingProxy: true } }, // every box
  ],
  empty: [],
  blocked: [],
  reject: [
    { id: "missing-answer", values: { ...ALL_ONE, proxy: null } }, // every answer is written
    { id: "word-value", values: { ...ALL_ONE, cert: "yes" } }, // 1 or 0 only
    { id: "nothing", values: { managed: null, onpremises: null, cert: null, identity: null, privateapps: null, nonwebports: null, proxy: null } }, // no answers
  ],
});
