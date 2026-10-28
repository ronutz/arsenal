// ============================================================================
// src/lib/share/cases/f5-apm-sso-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the APM SSO method explainer: a method name the tool reads
// goes as typed; anything else (a configuration, a credential, an unknown
// word) gives no link and is refused on arrival.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { APM_SSO_SHARE, type ApmSsoShareState } from "../../tools/f5-apm-sso-explainer/share"; // the spec

/** The cases. */
export const APM_SSO_SHARE_CASES = defineShareCases<ApmSsoShareState, ApmSsoShareState>({
  spec: APM_SSO_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "kerberos", state: { input: "kerberos" }, params: { input: "kerberos" }, restored: { input: "kerberos" } }, // the Example
    { id: "catalogue", state: { input: "methods" }, params: { input: "methods" }, restored: { input: "methods" } }, // all eight cards
    { id: "alias-with-space", state: { input: "Forms Client Initiated" }, params: { input: "Forms Client Initiated" }, restored: { input: "Forms Client Initiated" } }, // an alias with spaces and capitals, as typed
  ],
  arrive: [ // decode only
    { id: "kcd-alias", values: { input: "kcd" }, restored: { input: "kcd" } }, // an alias the table knows
  ],
  empty: [ // nothing to share: the button is disabled
    { id: "nothing", state: { input: "" } }, // a blank box
    { id: "unknown-word", state: { input: "radius" } }, // not in the table: the page shows its message
    { id: "credentials", state: { input: "username admin password hunter2" } }, // never a link
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
    { id: "unknown", values: { input: "radius" } }, // not a method the tool reads
    { id: "configuration", values: { input: "apm sso kerberos /Common/kcd { account-name HTTP/web.example.com account-password secret }" } }, // a configuration is not a method name
  ],
});
