// ============================================================================
// src/lib/tools/f5-apm-session-variable-reference/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING APM SESSION-VARIABLE REFERENCE - {manifest, run,
// vectors}. Engine and vectors arrived via a parallel ANVIL branch (second
// branch-merge event, 2026-07-03), verified green before adoption; this
// completion (index, component, registrations, docs, article) authored on
// the primary branch. Both branches consumed the same wrap-XI boot pack.
// ============================================================================

import { GOLDEN_VECTOR_SET_ID, SVAR_VECTORS } from "./golden-vectors";

export { run, VARS } from "./compute";
export type { SvarResult, SessionVar, VarMatch, ToolRunResult } from "./compute";
export { GOLDEN_VECTOR_SET_ID, SVAR_VECTORS, verifyVectors } from "./golden-vectors";
export type { SvarVector } from "./golden-vectors";

export const manifest = Object.freeze({
  toolFamily: "F5 GTM, AFM & APM",
  toolSlug: "f5-apm-session-variable-reference",
  canonicalAliases: ["apm-session-variables", "session-variable-reference", "mcget-explainer"],
  inputDetectors: [
    { kind: "regex", pattern: "\\bsession\\.[a-z0-9_]+\\.|\\bmcget\\b|%\\{session\\.", priority: 7, example: "mcget {session.logon.last.password}" },
  ],
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["reference-only", "vendored-snapshot"],
  shareSafetyDefault: "fragment",
  learnLinks: ["learn/bigip-apm-session-variables"],
  relatedTools: ["f5-apm-sso-explainer", "saml-decoder"],
  sources: [
    { id: "apm-vpe-session-vars-131", label: "BIG-IP APM Visual Policy Editor 13.1 - Session Variables chapter (the vendored table: policy results, session management and client variables, AD/LDAP/RADIUS families with the each-attribute-becomes-a-variable rule, the full session.ssl.cert family, endpoint checks including the always-zero hd.state quirk, OTP with the official percent-expansion example, resource assignment; the naming anatomy figure; the sessiondump command)", type: "vendor-docs", url: "https://techdocs.f5.com/kb/en-us/products/big-ip_apm/manuals/product/apm-visual-policy-editor-13-1-0/5.html", access_date: "2026-07-03", scope: "the vendored core of the variable table", status: "active" },
    { id: "f5-access-lab-secure", label: "F5 Access Solutions lab, VPE and Session Variables module (the secure contract verbatim: encrypted in the session db, hidden from the session report and the logging agent, -secure required for both mcget and access::session data get/set; the session.custom auto-container behavior; the active-sessions-only report note and the message-box pause trick; the mcget session.user.clientip and session.logon.last.upn examples)", type: "vendor-lab", url: "https://f5-agility-labs-iam.readthedocs.io/en/latest/class8/module4/module4.html", access_date: "2026-07-03", scope: "the secure-flag audit and the debug-surface observations", status: "active" },
    { id: "apm-per-request-ref-121", label: "BIG-IP APM Visual Policy Editor 12.1 - Per-Request Policy Reference (the official branch-rule expressions: expr { [mcget {session.ad.last.attr.primaryGroupID}] == 100 } and the memberOf shape; populated-by actions per family: AD Query, LDAP Query, RADIUS Auth/Acct, Local Database with session.localdb.groups)", type: "vendor-docs", url: "https://techdocs.f5.com/kb/en-us/products/big-ip_apm/manuals/product/apm-visual-policy-editor-12-1-0/5.html", access_date: "2026-07-03", scope: "the expression grammar and the populated-by attributions", status: "active" },
    { id: "apm-sso-config-guide", label: "BIG-IP APM Single Sign-On Configuration Guide 17.1 (the plumbing rows: NTLM Domain defaulting to session.logon.last.domain, the Form Based password source defaulting to session.sso.token.last.password, SSO Credential Mapping feeding session.sso.token.last.* from session.logon.last.*)", type: "vendor-docs", url: "https://techdocs.f5.com/en-us/bigip-17-1-0/big-ip-access-policy-manager-single-sign-on-concepts-configuration/single-sign-on-methods.html", access_date: "2026-07-03", scope: "the logon and sso family rows", status: "active" },
  ],
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

export const goldenVectors = SVAR_VECTORS;
