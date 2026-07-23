// ============================================================================
// src/lib/tools/ldap-filter-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// 14 golden vectors pinning the RFC 4515 parser: every match type, nesting,
// the AD bit-filter idiom, escape decoding, and 4 anchored failures. (D-19.)
// ============================================================================

import { explainFilter, type ExplainResult } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "ldap-filter-explainer-golden-v1";

export interface FilterVector {
  id: string;
  filter: string;
  expect: (r: ExplainResult) => boolean;
  describe: string;
}

export const FILTER_VECTORS: FilterVector[] = [
  {
    id: "V01-equality",
    filter: "(cn=Rodolfo)",
    describe: "simple equality item",
    expect: (r) => r.ok && r.root.kind === "item" && r.root.matchType === "equality" && r.root.attribute === "cn",
  },
  {
    id: "V02-presence",
    filter: "(mail=*)",
    describe: "presence test",
    expect: (r) => r.ok && r.root.matchType === "presence",
  },
  {
    id: "V03-substring",
    filter: "(cn=Rod*fo*Manoel)",
    describe: "substring with initial/any/final",
    expect: (r) =>
      r.ok &&
      r.root.matchType === "substring" &&
      r.root.substringParts?.length === 3 &&
      r.root.substringParts[0].position === "initial" &&
      r.root.substringParts[2].position === "final",
  },
  {
    id: "V04-and",
    filter: "(&(objectClass=person)(sn=Nutzmann))",
    describe: "AND of two items",
    expect: (r) => r.ok && r.root.kind === "and" && r.root.children?.length === 2,
  },
  {
    id: "V05-or-nested",
    filter: "(|(cn=a)(&(sn=b)(givenName=c)))",
    describe: "OR containing nested AND, depth 3",
    expect: (r) => r.ok && r.root.kind === "or" && r.depth === 3 && r.itemCount === 3,
  },
  {
    id: "V06-not",
    filter: "(!(userAccountControl=514))",
    describe: "NOT wrapper",
    expect: (r) => r.ok && r.root.kind === "not" && r.root.children?.[0].matchType === "equality",
  },
  {
    id: "V07-ge-le",
    filter: "(&(createTimestamp>=20240101000000Z)(uidNumber<=5000))",
    describe: ">= and <= operators",
    expect: (r) =>
      r.ok &&
      r.root.children?.[0].matchType === "greaterOrEqual" &&
      r.root.children?.[1].matchType === "lessOrEqual",
  },
  {
    id: "V08-approx",
    filter: "(sn~=Nutsman)",
    describe: "approximate match",
    expect: (r) => r.ok && r.root.matchType === "approx",
  },
  {
    id: "V09-ad-bitfilter",
    filter: "(userAccountControl:1.2.840.113556.1.4.803:=2)",
    describe: "the famous AD bit-AND (disabled accounts) with a recognized-rule note",
    expect: (r) =>
      r.ok &&
      r.root.matchType === "extensible" &&
      r.root.matchingRule === "1.2.840.113556.1.4.803" &&
      typeof r.root.note === "string" &&
      r.root.note.includes("BIT_AND"),
  },
  {
    id: "V10-escapes",
    filter: "(cn=Parens \\28ok\\29 star \\2a slash \\5c)",
    describe: "RFC 4515 escapes decoded and reported",
    expect: (r) =>
      r.ok &&
      r.root.decodedValue === "Parens (ok) star * slash \\" &&
      r.escapesSeen.length === 4,
  },
  {
    id: "V11-err-unbalanced",
    filter: "(&(cn=a)(sn=b)",
    describe: "unbalanced parenthesis is anchored",
    expect: (r) => !r.ok && r.pos === 14,
  },
  {
    id: "V12-err-empty",
    filter: "",
    describe: "empty input fails cleanly",
    expect: (r) => !r.ok && r.pos === 0,
  },
  {
    id: "V13-err-no-operator",
    filter: "(justwords)",
    describe: "item without '=' fails with position",
    expect: (r) => !r.ok && r.error.includes("no '='"),
  },
  {
    id: "V14-err-bad-escape",
    filter: "(cn=bad\\zzescape)",
    describe: "malformed hex escape rejected",
    expect: (r) => !r.ok && r.error.includes("two hex digits"),
  },
];

/** Verify every vector; returns the ids that FAILED (empty = all green). */
export function verifyVectors(): string[] {
  const bad: string[] = [];
  for (const v of FILTER_VECTORS) {
    let r: ExplainResult;
    try {
      r = explainFilter(v.filter);
    } catch {
      bad.push(v.id);
      continue;
    }
    if (!v.expect(r)) bad.push(v.id);
  }
  return bad;
}
