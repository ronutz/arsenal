// ============================================================================
// src/lib/tools/f5-apm-sso-explainer/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING APM SSO-METHOD EXPLAINER - {manifest, run, vectors}.
// ============================================================================

import { GOLDEN_VECTOR_SET_ID, SSO_VECTORS } from "./golden-vectors";

export { run, METHODS } from "./compute";
export type { ApmSsoResult, SsoMethod, ToolRunResult } from "./compute";
export { GOLDEN_VECTOR_SET_ID, SSO_VECTORS, verifyVectors } from "./golden-vectors";
export type { SsoVector } from "./golden-vectors";

export const manifest = Object.freeze({
  toolFamily: "F5 GTM, AFM & APM",
  toolSlug: "f5-apm-sso-explainer",
  canonicalAliases: ["apm-sso-explainer", "apm-sso-methods", "sso-methods"],
  inputDetectors: [
    { kind: "regex", pattern: "\\b(kerberos|kcd|ntlmv?2?|forms?-client-initiated|sso\\s+credential)\\b", priority: 6, example: "kerberos" },
  ],
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["reference-only"],
  shareSafetyDefault: "fragment",
  learnLinks: ["learn/bigip-apm-sso-methods"],
  relatedTools: ["f5-afm-rule-context", "saml-decoder"],
  sources: [
    { id: "apm-sso-methods-14", label: "BIG-IP APM: Authentication and Single Sign-On 14.0 - Single Sign-On Methods (the eight-method list; the isolation paragraph: a misconfigured object for Basic/NTLMv1/NTLMv2/Kerberos/OAuth Bearer/SAML can disable SSO for all methods in the session, the two form methods exempt; HTTP Basic's base64 header; the 225-character name bound)", type: "vendor-docs", url: "https://techdocs.f5.com/en-us/bigip-14-0-0/big-ip-access-policy-manager-authentication-and-single-sign-on-14-0-0/single-sign-on-methods.html", access_date: "2026-07-03", scope: "the method table's mechanisms and the isolation verdict on every card", status: "active" },
    { id: "apm-sso-methods-121", label: "BIG-IP APM 12.1 - Single Sign-On Methods (the NTLMv2 quirk verbatim: more than one WWW-Authenticate: NTLM header in a 401 makes NTLMv2 SSO fail, expected behavior)", type: "vendor-docs", url: "https://techdocs.f5.com/kb/en-us/products/big-ip_apm/manuals/product/apm-authentication-single-sign-on-12-1-0/23.html", access_date: "2026-07-03", scope: "the NTLMv2 quirk", status: "active" },
    { id: "apm-kerberos-sso-151", label: "BIG-IP APM 15.1 - Kerberos Single Sign-On Method (delegation account per server realm, SPN-format Account Name, uppercase realm, the no-keytab line verbatim, password-less front-door pairing; 17.1 adds the multi-realm RBCD guidance)", type: "vendor-docs", url: "https://techdocs.f5.com/en-us/bigip-15-1-0/big-ip-access-policy-manager-single-sign-on-concepts-configuration/kerberos-single-sign-on-method.html", access_date: "2026-07-03", scope: "the Kerberos card's prerequisites", status: "active" },
    { id: "apm-sso-config-guide", label: "BIG-IP APM Single Sign-On Configuration Guide (the Forms - Client Initiated flow: logon-page detection, inserted JavaScript, and the password parameter assigned a password token rather than the actual user password; NTLM Domain defaulting to session.logon.last.domain)", type: "vendor-docs", url: "https://techdocs.f5.com/en-us/bigip-17-1-0/big-ip-access-policy-manager-single-sign-on-concepts-configuration/single-sign-on-methods.html", access_date: "2026-07-03", scope: "the FBCI card and the session-variable wiring notes", status: "active" },
  ],
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

export const goldenVectors = SSO_VECTORS;
