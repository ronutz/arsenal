// ============================================================================
// src/lib/tools/voss-exos-translator/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors for the VOSS <-> EXOS translator. Because the tool is a curated
// reference, the deterministic surface is the search/filter: a query maps to a
// stable set of entry ids. We also structurally check that every entry has a
// concept, at least one VOSS command, and a note.
// ============================================================================

import { MAPPINGS, searchIds } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "voss-exos-translator/2026-07-11";

interface Vec {
  id: string;
  query: string;
  expectIds: string[];
}

const VECTORS: Vec[] = [
  { id: "empty-returns-all", query: "", expectIds: MAPPINGS.map((m) => m.id) },
  { id: "nickname", query: "nick-name", expectIds: ["fabric-core"] },
  { id: "ipvpn", query: "ipvpn", expectIds: ["l3vsn"] },
  { id: "sharing", query: "sharing", expectIds: ["fabric-attach"] },
  { id: "create-vlan-exos", query: "create vlan v", expectIds: ["create-vlan"] },
  { id: "vlan-i-sid", query: "vlan i-sid", expectIds: ["l2vsn", "verify"] },
  { id: "no-match", query: "mpls", expectIds: [] },
];

function arrEq(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

export function verifyVectors(): { passed: number; failed: number; failures: string[] } {
  const failures: string[] = [];
  let passed = 0;

  for (const v of VECTORS) {
    const got = searchIds(v.query);
    if (arrEq(got, v.expectIds)) passed++;
    else failures.push(`[${v.id}] query ${JSON.stringify(v.query)}: got [${got.join(",")}] want [${v.expectIds.join(",")}]`);
  }

  // Structural integrity of the mapping table itself.
  for (const m of MAPPINGS) {
    const errs: string[] = [];
    if (!m.concept.trim()) errs.push("empty concept");
    if (!m.voss.length) errs.push("no VOSS commands");
    if (!m.note.trim()) errs.push("empty note");
    if (m.exos !== null && m.exos.length === 0) errs.push("exos is [] (use null for no-equivalent)");
    if (errs.length) failures.push(`[struct:${m.id}] ${errs.join("; ")}`);
    else passed++;
  }

  return { passed, failed: failures.length, failures };
}

export const goldenVectors = VECTORS.map((v) => v.id);
