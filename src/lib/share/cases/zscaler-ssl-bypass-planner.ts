// ============================================================================
// src/lib/share/cases/zscaler-ssl-bypass-planner.ts
// ----------------------------------------------------------------------------
// Share cases of the ZIA SSL bypass planner (input-caution): the box goes as pasted once the
// page reads it; a credential in an asset name or a comment blocks the
// link; a secret-looking name is only named; text the page refuses has
// nothing to share.
// The credentials are published examples (RFC 7519 section 3.1's JWT, AWS's
// AKIAIOSFODNN7EXAMPLE, RFC 6750 section 2.1's Bearer token) or invented ones.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { ZSCALER_SSL_BYPASS_SHARE, type SslBypassShareState } from "../../tools/zscaler-ssl-bypass-planner/share"; // the spec

/** The page's Example (verbatim from the component). */
const EXAMPLE = "# name | pinned|clean | regulated|general | agent|no-agent\ncrm-desktop-app | pinned | general | agent\niot-updater | pinned | general | no-agent\npatient-portal | clean | regulated | agent\ngeneral-saas | clean | general | agent"; // as the component holds it

/** The cases. */
export const ZSCALER_SSL_BYPASS_PLANNER_SHARE_CASES = defineShareCases<SslBypassShareState, SslBypassShareState>({
  spec: ZSCALER_SSL_BYPASS_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // the Example, as pasted
    { id: "pinned-no-agent", state: { input: "iot-updater | pinned | general | no-agent" }, params: { input: "iot-updater | pinned | general | no-agent" }, restored: { input: "iot-updater | pinned | general | no-agent" } }, // a pinned app without an agent (golden vector, verbatim)
    { id: "maybe-secret-name", state: { input: "# vendor_api_key=ask-procurement\ngeneral-saas | clean | general | agent" }, params: { input: "# vendor_api_key=ask-procurement\ngeneral-saas | clean | general | agent" }, restored: { input: "# vendor_api_key=ask-procurement\ngeneral-saas | clean | general | agent" } }, // a secret-looking name in a comment: named, not blocked
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing pasted
    { id: "refused", state: { input: "crm-desktop-app | pinned" } }, // a short row: the page's own error
  ],
  blocked: [
    { id: "aws-key-in-comment", state: { input: "# AKIAIOSFODNN7EXAMPLE\ngeneral-saas | clean | general | agent" }, code: "secret" }, // AWS's example access key ID in a comment
    { id: "jwt-as-name", state: { input: "eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk | clean | general | agent" }, code: "secret" }, // RFC 7519 section 3.1's example JWT as an asset name
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: " \n" } }, // white space
    { id: "absent", values: { input: null } }, // not there
    { id: "credential", values: { input: "# AKIAIOSFODNN7EXAMPLE\ngeneral-saas | clean | general | agent" } }, // a link this encoder never builds
  ],
});
