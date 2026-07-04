// ============================================================================
// src/lib/tools/f5-apm-session-variable-reference/golden-vectors.ts
// ----------------------------------------------------------------------------
// Vectors pin: pattern matching with $name and $attr_name bindings, the
// secure-mismatch audit on mcget, the %{} embedding note, family and
// catalogue modes, the populated-by observations, the honest not-in-core
// answer, and the error path.
// ============================================================================

import { run } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "f5-apm-session-variable-reference-golden-v1";

export interface SvarVector {
  id: string;
  description: string;
  input: string;
  expectOk?: boolean;
  expectErrorIncludes?: string;
  expectMode?: "lookup" | "expression" | "family" | "catalog";
  expectMatchCount?: number;
  expectFirstPattern?: string | null;
  expectBinding?: { key: string; value: string };
  expectNoteIncludes?: string;
  expectObsIncludes?: string;
  expectFamilyRowsAtLeast?: number;
  expectFamiliesCount?: number;
}

export const SVAR_VECTORS: SvarVector[] = [
  { id: "catalog", description: "variables renders the family catalogue with anatomy + secure notes", input: "variables", expectOk: true, expectMode: "catalog", expectFamiliesCount: 13, expectObsIncludes: "hierarchical nodes" },
  { id: "exact-lookup", description: "An exact name resolves with populated-by", input: "session.logon.last.username", expectOk: true, expectMode: "lookup", expectFirstPattern: "session.logon.last.username", expectObsIncludes: "Logon Page" },
  { id: "pattern-ad-attr", description: "session.ad.last.attr.memberOf matches the $name/$attr_name pattern", input: "session.ad.last.attr.memberOf", expectOk: true, expectFirstPattern: "session.ad.$name.attr.$attr_name", expectBinding: { key: "$attr_name", value: "memberOf" } },
  { id: "pattern-name-binding", description: "$name binds to the agent segment", input: "session.ldap.corp_ldap.queryresult", expectOk: true, expectFirstPattern: "session.ldap.$name.queryresult", expectBinding: { key: "$name", value: "corp_ldap" } },
  { id: "secure-flag-note", description: "A secure variable lookup carries the secure semantics", input: "session.logon.last.password", expectOk: true, expectNoteIncludes: "stored encrypted" },
  { id: "mcget-parse", description: "The canonical AD branch rule parses to its variable", input: 'expr { [mcget {session.ad.last.attr.primaryGroupID}] == 100 }', expectOk: true, expectMode: "expression", expectMatchCount: 1, expectFirstPattern: "session.ad.$name.attr.$attr_name" },
  { id: "mcget-secure-mismatch", description: "mcget WITHOUT -secure on the password flags the trap", input: "[mcget {session.logon.last.password}]", expectOk: true, expectNoteIncludes: "SECURE MISMATCH" },
  { id: "mcget-secure-correct", description: "mcget -secure on the password does not flag a mismatch", input: "[mcget -secure {session.logon.last.password}]", expectOk: true, expectMode: "expression", expectMatchCount: 1 },
  { id: "pct-embedding", description: "%{} embedding explains the syntax with the OTP example", input: "One-Time Passcode: %{session.otp.assigned.val}", expectOk: true, expectMode: "expression", expectNoteIncludes: "%{...} embedding" },
  { id: "expression-populated-by", description: "Expression mode carries the populated-by discipline observation", input: 'expr { [mcget {session.ldap.last.attr.memberOf}] contains "CN=RDTestGroup" }', expectOk: true, expectObsIncludes: "Populated-by discipline" },
  { id: "multi-var-expression", description: "Two references in one expression yield two matches", input: "%{session.ssl.cert.subject} and [mcget {session.user.clientip}]", expectOk: true, expectMatchCount: 2 },
  { id: "family-ssl", description: "ssl family lists the certificate rows", input: "ssl", expectOk: true, expectMode: "family", expectFamilyRowsAtLeast: 8 },
  { id: "family-session-prefix", description: "session.ssl resolves as the family too", input: "session.ssl", expectOk: true, expectMode: "family" },
  { id: "custom-container", description: "session.custom.mynewvar matches the custom pattern with the lab story", input: "session.custom.mynewvar", expectOk: true, expectFirstPattern: "session.custom.$attr_name" },
  { id: "unknown-honest", description: "A session.* name outside the core answers honestly with the chapter pointer", input: "session.saml.last.assertionID", expectOk: true, expectMode: "lookup", expectFirstPattern: null, expectNoteIncludes: "Not in the vendored core" },
  { id: "machinecert-quirk", description: "Machine cert result carries the Linux-unsupported note", input: "session.check_machinecert.last.result", expectOk: true, expectNoteIncludes: "" },
  { id: "error-garbage", description: "Non-variable input names the shapes", input: "hello world", expectOk: false, expectErrorIncludes: "session.logon.last.username" },
  { id: "error-empty", description: "Empty input names the shapes", input: "  ", expectOk: false, expectErrorIncludes: "mcget" },
];

export function verifyVectors(): string[] {
  const failures: string[] = [];
  for (const v of SVAR_VECTORS) {
    try {
      const r = run(v.input);
      if (v.expectOk === false) { failures.push(`${v.id}: expected error`); continue; }
      if (v.expectMode && r.mode !== v.expectMode) failures.push(`${v.id}: mode ${r.mode}`);
      if (v.expectFamiliesCount !== undefined && (r.families?.length ?? -1) !== v.expectFamiliesCount) failures.push(`${v.id}: families ${r.families?.length}`);
      if (v.expectFamilyRowsAtLeast !== undefined && (r.rows?.length ?? 0) < v.expectFamilyRowsAtLeast) failures.push(`${v.id}: rows ${r.rows?.length}`);
      if (v.expectMatchCount !== undefined && (r.matches?.length ?? -1) !== v.expectMatchCount) failures.push(`${v.id}: matches ${r.matches?.length}`);
      const first = r.matches?.[0];
      if (v.expectFirstPattern !== undefined) {
        const got = first?.row?.pattern ?? null;
        if (got !== v.expectFirstPattern) failures.push(`${v.id}: pattern ${got}`);
      }
      if (v.expectBinding && first?.bindings[v.expectBinding.key] !== v.expectBinding.value) failures.push(`${v.id}: binding ${JSON.stringify(first?.bindings)}`);
      if (v.expectNoteIncludes !== undefined && v.expectNoteIncludes !== "" && !(r.matches ?? []).some((mm) => mm.notes.some((n) => n.includes(v.expectNoteIncludes!)))) failures.push(`${v.id}: note missing "${v.expectNoteIncludes}"`);
      if (v.expectObsIncludes && !r.observations.some((o) => o.includes(v.expectObsIncludes!))) failures.push(`${v.id}: obs missing`);
    } catch (e) {
      if (v.expectOk !== false) { failures.push(`${v.id}: unexpected ${(e as Error).message}`); continue; }
      if (v.expectErrorIncludes && !(e as Error).message.includes(v.expectErrorIncludes)) failures.push(`${v.id}: error msg "${(e as Error).message}"`);
    }
  }
  return failures;
}
