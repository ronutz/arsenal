// ============================================================================
// src/lib/tools/f5-cipher-string-expander/golden-vectors.ts
// ----------------------------------------------------------------------------
// Vectors for the F5 cipher-string explainer. They check set parsing and
// operator detection, keyword recognition, forward-secrecy detection, the
// weak-cipher concerns, the good-hardening positives, and pre-built rule
// expansion.
// ============================================================================

import { run } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "f5-cipher-string-expander-golden-v1";

export interface CVector {
  id: string;
  description: string;
  input: string;
  expectOk?: boolean;
  expectErrorIncludes?: string;
  expectSetCount?: number;
  expectOperators?: string[];
  expectPfs?: boolean;
  expectConcernIncludes?: string;
  expectNoConcerns?: boolean;
  expectPositiveIncludes?: string;
  expectRule?: { name: string; cipher: string };
  expectKeywordKnown?: { setIdx: number; kwIdx: number; known: boolean; category?: string };
}

export const C_VECTORS: CVector[] = [
  {
    id: "hardened-ecdhe",
    description: "A hardened ECDHE string has forward secrecy and exclusion positives, no concerns",
    input: "ECDHE:RSA:!SSLv3:!RC4:!EXP:!DES:!MD5:@STRENGTH",
    expectOk: true,
    expectSetCount: 8,
    expectOperators: ["include", "include", "exclude", "exclude", "exclude", "exclude", "exclude", "sort"],
    expectPfs: true,
    expectPositiveIncludes: "forward secrecy",
  },
  {
    id: "exclusion-positive",
    description: "Excluded weak ciphers are reported as good hardening",
    input: "ECDHE:!RC4:!SSLv3",
    expectOk: true,
    expectPositiveIncludes: "good hardening",
  },
  {
    id: "combined-keywords",
    description: "Keywords joined with + form one set with all keywords recognized",
    input: "TLSv1_2+ECDHE+AES-GCM+SHA384",
    expectOk: true,
    expectSetCount: 1,
    expectKeywordKnown: { setIdx: 0, kwIdx: 2, known: true, category: "bulk" },
    expectPfs: true,
  },
  {
    id: "rc4-concern",
    description: "Enabling RC4 raises a concern",
    input: "DEFAULT:RC4",
    expectOk: true,
    expectConcernIncludes: "RC4",
  },
  {
    id: "sslv3-concern",
    description: "Enabling SSLv3 raises a concern",
    input: "ALL:SSLv3",
    expectOk: true,
    expectConcernIncludes: "SSL 3.0",
  },
  {
    id: "3des-concern",
    description: "Enabling 3DES raises a Sweet32 concern",
    input: "DEFAULT:3DES",
    expectOk: true,
    expectConcernIncludes: "Triple DES",
  },
  {
    id: "compat-removed",
    description: "COMPAT is flagged as removed in 13.0+",
    input: "DEFAULT:COMPAT",
    expectOk: true,
    expectConcernIncludes: "REMOVED",
  },
  {
    id: "export-concern",
    description: "EXPORT ciphers are flagged",
    input: "ALL:EXPORT",
    expectOk: true,
    expectConcernIncludes: "EXPORT",
  },
  {
    id: "adh-concern",
    description: "Anonymous DH is flagged as no authentication",
    input: "DEFAULT:ADH",
    expectOk: true,
    expectConcernIncludes: "Anonymous",
  },
  {
    id: "null-concern",
    description: "NULL cipher is flagged",
    input: "ALL:NULL",
    expectOk: true,
    expectConcernIncludes: "No encryption",
  },
  {
    id: "prebuilt-f5-secure",
    description: "The f5-secure rule expands to its documented cipher string",
    input: "f5-secure",
    expectOk: true,
    expectRule: { name: "f5-secure", cipher: "ECDHE:RSA:!SSLV3:!RC4:!EXP:!DES" },
    expectPfs: true,
  },
  {
    id: "prebuilt-f5-ecc",
    description: "The f5-ecc rule expands to ECDHE:ECDHE_ECDSA",
    input: "f5-ecc",
    expectOk: true,
    expectRule: { name: "f5-ecc", cipher: "ECDHE:ECDHE_ECDSA" },
  },
  {
    id: "unknown-keyword",
    description: "An unrecognized keyword degrades gracefully",
    input: "WIDGET-FOO",
    expectOk: true,
    expectKeywordKnown: { setIdx: 0, kwIdx: 0, known: false },
  },
  {
    id: "empty",
    description: "Empty input returns an error, not a crash",
    input: "   ",
    expectOk: false,
    expectErrorIncludes: "Enter an F5 cipher string",
  },
];

export function verifyVectors(): { passed: number; failed: number; failures: string[] } {
  const failures: string[] = [];
  let passed = 0;

  for (const v of C_VECTORS) {
    const r = run(v.input);
    const errs: string[] = [];

    if (v.expectOk !== undefined && r.ok !== v.expectOk) errs.push(`ok: got ${r.ok} want ${v.expectOk}`);
    if (v.expectErrorIncludes !== undefined && !(r.error?.message ?? "").includes(v.expectErrorIncludes)) errs.push(`error missing ${JSON.stringify(v.expectErrorIncludes)}`);
    if (v.expectSetCount !== undefined && r.sets.length !== v.expectSetCount) errs.push(`set count: got ${r.sets.length} want ${v.expectSetCount}`);
    if (v.expectOperators !== undefined) {
      const got = r.sets.map((s) => s.operator);
      if (JSON.stringify(got) !== JSON.stringify(v.expectOperators)) errs.push(`operators: got ${JSON.stringify(got)} want ${JSON.stringify(v.expectOperators)}`);
    }
    if (v.expectPfs !== undefined && r.pfs !== v.expectPfs) errs.push(`pfs: got ${r.pfs} want ${v.expectPfs}`);
    if (v.expectConcernIncludes !== undefined && !r.concerns.some((c) => c.includes(v.expectConcernIncludes!))) errs.push(`no concern includes ${JSON.stringify(v.expectConcernIncludes)}: got ${JSON.stringify(r.concerns)}`);
    if (v.expectNoConcerns && r.concerns.length !== 0) errs.push(`expected no concerns, got ${JSON.stringify(r.concerns)}`);
    if (v.expectPositiveIncludes !== undefined && !r.positives.some((p) => p.includes(v.expectPositiveIncludes!))) errs.push(`no positive includes ${JSON.stringify(v.expectPositiveIncludes)}: got ${JSON.stringify(r.positives)}`);
    if (v.expectRule !== undefined) {
      if (!r.expandedFromRule) errs.push("expected rule expansion");
      else {
        if (r.expandedFromRule.name !== v.expectRule.name) errs.push(`rule name: got ${r.expandedFromRule.name} want ${v.expectRule.name}`);
        if (r.expandedFromRule.cipher !== v.expectRule.cipher) errs.push(`rule cipher: got ${r.expandedFromRule.cipher} want ${v.expectRule.cipher}`);
      }
    }
    if (v.expectKeywordKnown !== undefined) {
      const kw = r.sets[v.expectKeywordKnown.setIdx]?.keywords[v.expectKeywordKnown.kwIdx];
      if (!kw) errs.push(`keyword [${v.expectKeywordKnown.setIdx}][${v.expectKeywordKnown.kwIdx}] missing`);
      else {
        if (kw.known !== v.expectKeywordKnown.known) errs.push(`keyword known: got ${kw.known} want ${v.expectKeywordKnown.known}`);
        if (v.expectKeywordKnown.category && kw.category !== v.expectKeywordKnown.category) errs.push(`keyword category: got ${kw.category} want ${v.expectKeywordKnown.category}`);
      }
    }

    if (errs.length) failures.push(`[${v.id}] ${errs.join("; ")}`);
    else passed++;
  }

  return { passed, failed: failures.length, failures };
}
