// ============================================================================
// src/lib/share/cases/zcc-forwarding-decision-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the ZCC forwarding decision explainer (input): the box goes as pasted
// once the page reads it; a credential in a comment line blocks the link; a
// secret-looking name is only named; text the page refuses has nothing to
// share.
// The credentials are published examples (RFC 7519 section 3.1's JWT, AWS's
// AKIAIOSFODNN7EXAMPLE, RFC 6750 section 2.1's Bearer token) or invented ones.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { ZCC_FORWARDING_DECISION_SHARE, type ZccShareState } from "../../tools/zcc-forwarding-decision-explainer/share"; // the spec

/** The page's Example (verbatim from the component). */
const EXAMPLE = "# <key> = <value>\nnetwork = off-trusted\nzia-action = tunnel\ntunnel = zt2\nzpa-action = tunnel"; // as the component holds it

/** The cases. */
export const ZCC_FORWARDING_DECISION_EXPLAINER_SHARE_CASES = defineShareCases<ZccShareState, ZccShareState>({
  spec: ZCC_FORWARDING_DECISION_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // the Example, as pasted
    { id: "vpn-twlp", state: { input: "network = vpn\nzia-action = twlp" }, params: { input: "network = vpn\nzia-action = twlp" }, restored: { input: "network = vpn\nzia-action = twlp" } }, // a VPN posture (golden vector, verbatim)
    { id: "maybe-secret-name", state: { input: "# zia_api_key=kept-elsewhere\nnetwork = trusted\nzia-action = none" }, params: { input: "# zia_api_key=kept-elsewhere\nnetwork = trusted\nzia-action = none" }, restored: { input: "# zia_api_key=kept-elsewhere\nnetwork = trusted\nzia-action = none" } }, // a secret-looking name in a comment: named, not blocked
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing pasted
    { id: "refused", state: { input: "network = moon" } }, // the page's own error: nothing to share
  ],
  blocked: [
    { id: "jwt-in-comment", state: { input: "# token eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk\nnetwork = trusted\nzia-action = none" }, code: "secret" }, // RFC 7519 section 3.1's example JWT in a comment
    { id: "aws-key-in-comment", state: { input: "# AKIAIOSFODNN7EXAMPLE\nnetwork = vpn\nzia-action = twlp" }, code: "secret" }, // AWS's example access key ID in a comment
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: " \n" } }, // white space
    { id: "absent", values: { input: null } }, // not there
    { id: "credential", values: { input: "# token eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk\nnetwork = trusted\nzia-action = none" } }, // a link this encoder never builds
  ],
});
