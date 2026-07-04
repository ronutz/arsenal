// ============================================================================
// src/lib/tools/f5-apm-sso-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// Vectors pin: the eight-method catalogue, alias resolution, the isolation
// verdict on both sides of the split, the Kerberos prerequisites (delegation
// account, SPN, the no-keytab line), the NTLMv2 single-header quirk, the
// FBCI password token, the form-based defaults, and the error paths.
// ============================================================================

import { run, METHODS } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "f5-apm-sso-explainer-golden-v1";

export interface SsoVector {
  id: string;
  description: string;
  input: string;
  expectOk?: boolean;
  expectErrorIncludes?: string;
  expectMode?: "method" | "catalog";
  expectMethodId?: string;
  expectIsolation?: "poisons-session-sso" | "isolated";
  expectMechanismIncludes?: string;
  expectPrereqIncludes?: string;
  expectQuirkIncludes?: string;
  expectCredIncludes?: string;
  expectObsIncludes?: string;
  expectCatalogCount?: number;
}

export const SSO_VECTORS: SsoVector[] = [
  { id: "catalog", description: "methods renders all eight cards with the isolation note", input: "methods", expectOk: true, expectMode: "catalog", expectCatalogCount: 8, expectObsIncludes: "disable SSO for ALL" },
  { id: "kerberos-lookup", description: "kerberos resolves with the KCD prerequisites", input: "kerberos", expectOk: true, expectMethodId: "kerberos", expectPrereqIncludes: "does not need or use a keytab" },
  { id: "kcd-alias", description: "kcd alias resolves to Kerberos", input: "kcd", expectOk: true, expectMethodId: "kerberos" },
  { id: "kerberos-spn", description: "The SPN-format prerequisite is present", input: "kerberos", expectOk: true, expectPrereqIncludes: "SPN format" },
  { id: "kerberos-front-doors", description: "Password-less front-door pairing stated", input: "kerberos", expectOk: true, expectCredIncludes: "client certificates" },
  { id: "ntlmv2-quirk", description: "The single WWW-Authenticate quirk is on the NTLMv2 card", input: "ntlmv2", expectOk: true, expectQuirkIncludes: "more than one WWW-Authenticate" },
  { id: "ntlm-alias-v1", description: "Bare ntlm resolves to v1", input: "ntlm", expectOk: true, expectMethodId: "ntlmv1" },
  { id: "basic-mechanism", description: "HTTP Basic explains the base64 header verbatim in spirit", input: "basic", expectOk: true, expectMechanismIncludes: "base64 encoding of username, colon, password" },
  { id: "basic-poisons", description: "Basic sits on the poisons side with the observation", input: "basic", expectOk: true, expectIsolation: "poisons-session-sso", expectObsIncludes: "poisons side" },
  { id: "forms-isolated", description: "Form Based is exempt, and the observation says so", input: "forms", expectOk: true, expectIsolation: "isolated", expectObsIncludes: "exempt" },
  { id: "forms-defaults", description: "Form Based carries the Start URI and password-source defaults", input: "form-based", expectOk: true, expectCredIncludes: "session.sso.token.last.password", expectMechanismIncludes: "Start URI" },
  { id: "fbci-token", description: "FBCI's password token indirection stated", input: "fbci", expectOk: true, expectMethodId: "forms-client-initiated", expectCredIncludes: "password token rather than the actual user password" },
  { id: "saml-lookup", description: "SAML resolves on the poisons side", input: "saml", expectOk: true, expectIsolation: "poisons-session-sso" },
  { id: "plumbing-note", description: "Every method card carries the credentials-plumbing observation", input: "oauth", expectOk: true, expectObsIncludes: "SSO Credential Mapping" },
  { id: "error-unknown", description: "Unknown method names the catalogue", input: "magic-sso", expectOk: false, expectErrorIncludes: "methods" },
  { id: "error-empty", description: "Empty input names the shapes", input: "  ", expectOk: false, expectErrorIncludes: "kerberos" },
];

export function verifyVectors(): string[] {
  const failures: string[] = [];
  for (const v of SSO_VECTORS) {
    try {
      const r = run(v.input);
      if (v.expectOk === false) { failures.push(`${v.id}: expected error`); continue; }
      if (v.expectMode && r.mode !== v.expectMode) failures.push(`${v.id}: mode ${r.mode}`);
      if (v.expectCatalogCount !== undefined && (r.catalog?.length ?? -1) !== v.expectCatalogCount) failures.push(`${v.id}: catalog ${r.catalog?.length}`);
      const m = r.method;
      if (v.expectMethodId && m?.id !== v.expectMethodId) failures.push(`${v.id}: id ${m?.id}`);
      if (v.expectIsolation && m?.isolation !== v.expectIsolation) failures.push(`${v.id}: isolation ${m?.isolation}`);
      if (v.expectMechanismIncludes && !(m?.mechanism ?? "").includes(v.expectMechanismIncludes)) failures.push(`${v.id}: mechanism missing`);
      if (v.expectPrereqIncludes && !(m?.prerequisites ?? []).some((p) => p.includes(v.expectPrereqIncludes!))) failures.push(`${v.id}: prereq missing`);
      if (v.expectQuirkIncludes && !(m?.quirks ?? []).some((q) => q.includes(v.expectQuirkIncludes!))) failures.push(`${v.id}: quirk missing`);
      if (v.expectCredIncludes && !(m?.credentials ?? "").includes(v.expectCredIncludes)) failures.push(`${v.id}: credentials missing`);
      if (v.expectObsIncludes && !r.observations.some((o) => o.includes(v.expectObsIncludes!))) failures.push(`${v.id}: obs missing "${v.expectObsIncludes}"`);
    } catch (e) {
      if (v.expectOk !== false) { failures.push(`${v.id}: unexpected ${(e as Error).message}`); continue; }
      if (v.expectErrorIncludes && !(e as Error).message.includes(v.expectErrorIncludes)) failures.push(`${v.id}: error msg "${(e as Error).message}"`);
    }
  }
  return failures;
}
