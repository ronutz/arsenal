// ============================================================================
// GOLDEN VECTORS for the Extreme Universal switch OS-name mapper.
//
// Each asserts something checkable against Extreme's own documentation: which
// series are Universal, the two naming pairs, the series-specific caveats, and
// - the one that must never be dropped - that switching persona destroys the
// configuration.
// ============================================================================

import { mapOsName, universalFamilies } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "extreme-switch-os-mapper/2026-08-14";

export interface MapperVector {
  name: string;
  input: string;
  expect: {
    series?: string;
    universal?: boolean;
    noteContains?: string;
    warnContains?: string;
    throws?: boolean;
  };
}

export const MAPPER_VECTORS: readonly MapperVector[] = Object.freeze([
  {
    name: "a Universal series is recognised",
    input: "5520",
    expect: { series: "5520", universal: true, noteContains: "This is Universal hardware" },
  },
  {
    name: "*** the 5520 SysObjectID change is a WARNING, not a note ***",
    input: "5520",
    expect: { warnContains: "SysObjectID" },
  },
  {
    name: "the 5420 carries the same SysObjectID warning",
    input: "5420-48P-4XE",
    expect: { series: "5420", warnContains: "SysObjectID" },
  },
  {
    name: "*** 7520 stacking is a persona CONSTRAINT, not a preference ***",
    input: "7520",
    expect: { warnContains: "NOT when running Fabric Engine" },
  },
  {
    name: "5720 Fabric Engine starts at 8.7",
    input: "5720",
    expect: { noteContains: "8.7" },
  },
  {
    name: "5320 Fabric Engine starts at 8.6",
    input: "5320",
    expect: { noteContains: "8.6" },
  },
  {
    name: "a NON-Universal model is told the rename does not apply",
    input: "X440-G2",
    expect: { noteContains: "keep the ORIGINAL names" },
  },
  {
    name: "arriving from the OS name works too - EXOS",
    input: "EXOS",
    expect: { noteContains: "ExtremeXOS and Switch Engine are the same operating system" },
  },
  {
    name: "and from the new name - Fabric Engine",
    input: "Fabric Engine",
    expect: { noteContains: "VOSS and Fabric Engine are the same operating system" },
  },
  {
    name: "*** THE DESTRUCTIVE WARNING IS ALWAYS PRESENT ***",
    input: "4220",
    expect: { warnContains: "DELETES all configuration files" },
  },
  {
    name: "and it is present even for a bare OS-name lookup",
    input: "VOSS",
    expect: { warnContains: "DELETES all configuration files" },
  },
  {
    name: "the boot question is asked in the negative, and it says so",
    input: "5320",
    expect: { noteContains: "answering N keeps Switch Engine" },
  },
  {
    name: "empty input throws",
    input: "   ",
    expect: { throws: true },
  },
]);

/** Run every vector. Returns the failures, empty when all pass. */
export function verifyVectors(): string[] {
  const f: string[] = [];
  for (const v of MAPPER_VECTORS) {
    let r;
    try {
      r = mapOsName(v.input);
      if (v.expect.throws) { f.push(`${v.name}: expected a throw`); continue; }
    } catch (e) {
      if (!v.expect.throws) f.push(`${v.name}: threw ${(e as Error).message}`);
      continue;
    }
    const e = v.expect;
    if (e.series && r.family?.series !== e.series && !r.facts.some((x) => x.value === e.series)) {
      f.push(`${v.name}: series ${r.family?.series} != ${e.series}`);
    }
    if (e.universal !== undefined && r.family?.universal !== e.universal) f.push(`${v.name}: universal ${r.family?.universal} != ${e.universal}`);
    if (e.noteContains && !r.notes.some((n) => n.includes(e.noteContains!))) f.push(`${v.name}: no note containing "${e.noteContains}"`);
    if (e.warnContains && !r.warnings.some((n) => n.includes(e.warnContains!))) f.push(`${v.name}: no warning containing "${e.warnContains}"`);
  }

  /* BOTH naming pairs must always be returned. They are the whole point of the
     tool, and a change that made them conditional would quietly turn it into a
     model lookup. */
  const r = mapOsName("5520");
  if (r.naming.length !== 2) f.push(`naming pairs: ${r.naming.length} != 2`);
  if (!r.naming.some((n) => n.current === "Switch Engine")) f.push("naming: Switch Engine missing");
  if (!r.naming.some((n) => n.current === "Fabric Engine")) f.push("naming: Fabric Engine missing");
  if (universalFamilies().length !== 8) f.push(`universal families: ${universalFamilies().length} != 8`);
  return f;
}
