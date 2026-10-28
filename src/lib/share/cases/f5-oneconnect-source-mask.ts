// ============================================================================
// src/lib/share/cases/f5-oneconnect-source-mask.ts
// ----------------------------------------------------------------------------
// Share cases of the OneConnect source-mask explainer: the box goes as typed.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { ONECONNECT_SHARE, type OneconnectShareState } from "../../tools/f5-oneconnect-source-mask/share"; // the spec

/** The page's Example: the sim-snat-collapse golden vector. */
const EXAMPLE = "mask 255.255.255.255 ips 10.1.1.5 10.9.9.9 172.16.0.4 snat 192.0.2.10"; // verbatim
/** A one-connect profile, as tmsh lists it. */
const PROFILE = "ltm profile one-connect oc_24 {\n    defaults-from oneconnect\n    source-mask 255.255.255.0\n    limit-type strict\n}"; // with braces and line breaks

/** The cases. */
export const F5_ONECONNECT_SHARE_CASES = defineShareCases<OneconnectShareState, OneconnectShareState>({
  spec: ONECONNECT_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // the mask simulation
    { id: "profile", state: { input: PROFILE }, params: { input: PROFILE }, restored: { input: PROFILE } }, // the option audit
    { id: "settings", state: { input: "settings" }, params: { input: "settings" }, restored: { input: "settings" } }, // the catalogue
  ],
  empty: [
    { id: "nothing", state: { input: "" } }, // nothing typed
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
  ],
});
