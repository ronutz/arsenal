// ============================================================================
// src/lib/share/cases/checkpoint-policy-layer-evaluator.ts
// ----------------------------------------------------------------------------
// Share cases of the Check Point ordered-layer evaluator (input-caution): the box goes as
// pasted once the page evaluates it; a credential in a rule name or a
// comment blocks the link; a secret-looking name is only named; text the
// page refuses has nothing to share.
// The credentials are published examples (RFC 7519 section 3.1's JWT, AWS's
// AKIAIOSFODNN7EXAMPLE, RFC 6750 section 2.1's Bearer token) or invented ones.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { CHECKPOINT_POLICY_LAYER_SHARE, type CpLayerShareState } from "../../tools/checkpoint-policy-layer-evaluator/share"; // the spec

/** The page's Example (verbatim from the component). */
const EXAMPLE = "# Two ordered layers. Layer 1 accepts, layer 2 decides.\nlayer Network ordered\n1 | permit internal | accept | src=10.0.0.0/8\n2 | cleanup | drop |\nlayer Application ordered\n1 | https only | accept | svc=443\n2 | cleanup | drop |\n\n# Port 80 clears the network layer and dies in the application layer.\ntest src=10.1.1.5 dst=93.184.216.34 svc=80"; // as the component holds it

/** The cases. */
export const CHECKPOINT_POLICY_LAYER_EVALUATOR_SHARE_CASES = defineShareCases<CpLayerShareState, CpLayerShareState>({
  spec: CHECKPOINT_POLICY_LAYER_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // the Example, as pasted
    { id: "early-permit", state: { input: "layer A ordered\n1 | allow all | accept |\nlayer B ordered\n1 | block that host | drop | dst=93.184.216.34\n2 | cleanup | drop |\ntest src=10.1.1.5 dst=93.184.216.34 svc=443" }, params: { input: "layer A ordered\n1 | allow all | accept |\nlayer B ordered\n1 | block that host | drop | dst=93.184.216.34\n2 | cleanup | drop |\ntest src=10.1.1.5 dst=93.184.216.34 svc=443" }, restored: { input: "layer A ordered\n1 | allow all | accept |\nlayer B ordered\n1 | block that host | drop | dst=93.184.216.34\n2 | cleanup | drop |\ntest src=10.1.1.5 dst=93.184.216.34 svc=443" } }, // an early permit cannot override a later drop (golden vector, verbatim)
    { id: "maybe-secret-name", state: { input: "# smartconsole_password=not-here\nlayer A ordered\n1 | allow all | accept |\ntest src=10.1.1.5 dst=10.2.2.2 svc=22" }, params: { input: "# smartconsole_password=not-here\nlayer A ordered\n1 | allow all | accept |\ntest src=10.1.1.5 dst=10.2.2.2 svc=22" }, restored: { input: "# smartconsole_password=not-here\nlayer A ordered\n1 | allow all | accept |\ntest src=10.1.1.5 dst=10.2.2.2 svc=22" } }, // a secret-looking name in a comment: named, not blocked
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing pasted
    { id: "refused", state: { input: "layer A ordered\n1 | allow all | accept |" } }, // no test line: the page's own error
  ],
  blocked: [
    { id: "jwt-in-comment", state: { input: "# eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk\nlayer A ordered\n1 | allow all | accept |\ntest src=10.1.1.5 dst=10.2.2.2 svc=22" }, code: "secret" }, // RFC 7519 section 3.1's example JWT in a comment
    { id: "url-password-in-name", state: { input: "layer A ordered\n1 | sync https://admin:not-a-real-password@mgmt.example.com | accept |\ntest src=10.1.1.5 dst=10.2.2.2 svc=22" }, code: "secret" }, // a password in a URL (RFC 3986 section 3.2.1) in a rule name
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: " \n" } }, // white space
    { id: "absent", values: { input: null } }, // not there
    { id: "credential", values: { input: "# eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk\nlayer A ordered\n1 | allow all | accept |\ntest src=10.1.1.5 dst=10.2.2.2 svc=22" } }, // a link this encoder never builds
  ],
});
