// ============================================================================
// GOLDEN VECTORS for the network operating system comparer.
//
// Two kinds of assertion here. The first checks the comparer behaves. The
// second - and the more important - checks the DATASET keeps its integrity:
// every entry has lineage, every entry has weaknesses, and no entry is allowed
// to become an advertisement.
// ============================================================================

import { compare, findOs, NETWORK_OSES } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "network-os-comparer/2026-08-14";

export interface OsVector {
  name: string;
  left: string;
  right: string;
  expect: {
    leftId?: string;
    rightId?: string;
    axisCount?: number;
    sharedContains?: string;
    noShared?: boolean;
    throws?: boolean;
  };
}

export const OS_VECTORS: readonly OsVector[] = Object.freeze([
  {
    name: "ids resolve",
    left: "ios", right: "junos",
    expect: { leftId: "ios", rightId: "junos", axisCount: 6 },
  },
  {
    name: "loose names resolve too",
    left: "Arista", right: "PAN-OS",
    expect: { leftId: "eos", rightId: "pan-os" },
  },
  {
    name: "*** two Linux systems are told what they SHARE ***",
    left: "eos", right: "junos-evolved",
    expect: { sharedContains: "Both run on Linux" },
  },
  {
    name: "two commit-model systems share that too",
    left: "ios-xr", right: "junos",
    expect: { sharedContains: "candidate-and-commit" },
  },
  {
    name: "same vendor is noted",
    left: "ios", right: "ios-xr",
    expect: { sharedContains: "Cisco systems" },
  },
  {
    name: "classic IOS and EOS share nothing on these axes",
    left: "ios", right: "eos",
    expect: { noShared: true },
  },
  {
    name: "comparing a system with itself throws",
    left: "junos", right: "junos",
    expect: { throws: true },
  },
  {
    name: "an unknown name throws rather than guessing",
    left: "ios", right: "not-a-real-os",
    expect: { throws: true },
  },
]);

/** Run every vector, then audit the dataset itself. */
export function verifyVectors(): string[] {
  const f: string[] = [];
  for (const v of OS_VECTORS) {
    let r;
    try {
      r = compare(v.left, v.right);
      if (v.expect.throws) { f.push(`${v.name}: expected a throw`); continue; }
    } catch (e) {
      if (!v.expect.throws) f.push(`${v.name}: threw ${(e as Error).message}`);
      continue;
    }
    const e = v.expect;
    if (e.leftId && r.left.id !== e.leftId) f.push(`${v.name}: left ${r.left.id} != ${e.leftId}`);
    if (e.rightId && r.right.id !== e.rightId) f.push(`${v.name}: right ${r.right.id} != ${e.rightId}`);
    if (e.axisCount !== undefined && r.differences.length !== e.axisCount) f.push(`${v.name}: ${r.differences.length} axes != ${e.axisCount}`);
    if (e.sharedContains && !r.shared.some((s) => s.includes(e.sharedContains!))) f.push(`${v.name}: nothing shared containing "${e.sharedContains}"`);
    if (e.noShared && r.shared.length > 0) f.push(`${v.name}: expected nothing shared, got ${r.shared.length}`);
  }

  // ---- THE DATASET AUDIT ------------------------------------------------
  // These are the assertions that keep the content honest. A entry that loses
  // its weaknesses has become marketing, and this is what notices.
  for (const os of NETWORK_OSES) {
    if (os.lineage.length === 0) f.push(`${os.id}: no lineage recorded`);
    if (os.strengths.length < 2) f.push(`${os.id}: fewer than two strengths`);
    if (os.weaknesses.length < 2) f.push(`${os.id}: *** FEWER THAN TWO WEAKNESSES - an entry with no cost listed is an advertisement ***`);
    if (!os.differentiator || os.differentiator.length < 40) f.push(`${os.id}: differentiator missing or too thin to be useful`);
    for (const field of ["base", "stateModel", "planes", "configModel", "upgrade"] as const) {
      if (!os[field] || String(os[field]).length < 30) f.push(`${os.id}: ${field} is empty or too short to say anything`);
    }
  }
  const ids = NETWORK_OSES.map((o) => o.id);
  if (new Set(ids).size !== ids.length) f.push("duplicate ids in the dataset");
  if (NETWORK_OSES.length < 12) f.push(`only ${NETWORK_OSES.length} systems - the comparison needs breadth to be worth making`);
  if (!findOs("tmos")) f.push("tmos missing");
  if (!findOs("f5os")) f.push("f5os missing");
  return f;
}
