// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/profile-inheritance/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the profile inheritance lab (set 2026-10-26a). The two
// cases marked "checked" were run in the original interactive model on
// 2026-10-26 and compared value for value: a parent at 600 s reaches both
// children; with B overridden to 90 s, B keeps 90 s while A follows the parent.
// The rest are worked by hand from F5's two rules (unmodified settings follow
// the parent, including later changes; a Custom setting keeps its value).
// Reject vectors pin the stable error codes. verifyVectors() runs them all;
// scripts/run-golden-vectors runs it at prebuild and fails the build on drift.
// ============================================================================

import { compute, InheritanceError, type ChildMode, type InheritanceErrorCode, type InheritanceInput, type InheritanceResult, type ProfileValues } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "profile-inheritance/2026-10-26a";

/** The fields a vector may pin: the flags directly, the three profiles as before/after pairs. */
interface Expect {
  /** The parent's before and after values. */
  parent?: [number, number];
  /** Child A's before and after values. */
  childA?: [number, number];
  /** Child B's before and after values. */
  childB?: [number, number];
  /** Whether B's value is inherited. */
  childBInherited?: boolean;
  /** The parent changed in the edit. */
  parentChanged?: boolean;
  /** B's override equals the parent's value before the edit. */
  overrideLooksInherited?: boolean;
  /** A and B differ after the edit. */
  childrenDiverge?: boolean;
}

/** A case the model must answer exactly so. */
interface AcceptVector {
  /** Short stable name. */
  id: string;
  /** The reader's settings. */
  input: InheritanceInput;
  /** What must match. */
  expect: Expect;
}

/** A case the model must refuse with a given code. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** Settings outside the lab's range. */
  input: InheritanceInput;
  /** The code the refusal must carry. */
  code: InheritanceErrorCode;
}

/** The accept cases. */
export const INHERITANCE_VECTORS: readonly AcceptVector[] = Object.freeze([
  // Checked: a parent at 600 s reaches both children when neither has its own value.
  { id: "checked-parent-600", input: { parentBefore: 600, parentAfter: 600, childB: "inherit", childBValue: 90 }, expect: { parent: [600, 600], childA: [600, 600], childB: [600, 600], childBInherited: true, parentChanged: false, childrenDiverge: false } },
  // Checked: B overridden to 90 s keeps 90 s while A follows the parent's 600 s.
  { id: "checked-override-90", input: { parentBefore: 600, parentAfter: 600, childB: "custom", childBValue: 90 }, expect: { childA: [600, 600], childB: [90, 90], childBInherited: false, overrideLooksInherited: false, childrenDiverge: true } },
  // The opening state: the tcp default 300 s raised to 600 s propagates to both inheriting children.
  { id: "edit-propagates", input: { parentBefore: 300, parentAfter: 600, childB: "inherit", childBValue: 90 }, expect: { parent: [300, 600], childA: [300, 600], childB: [300, 600], parentChanged: true, childrenDiverge: false } },
  // The Example: B set to 300 s by hand looks inherited before the edit and stays at 300 s after it.
  { id: "equal-override-stays", input: { parentBefore: 300, parentAfter: 600, childB: "custom", childBValue: 300 }, expect: { childA: [300, 600], childB: [300, 300], childBInherited: false, overrideLooksInherited: true, childrenDiverge: true } },
  // An override and an unchanged parent that happen to agree: nothing diverges until the parent moves.
  { id: "override-equal-no-edit", input: { parentBefore: 300, parentAfter: 300, childB: "custom", childBValue: 300 }, expect: { childA: [300, 300], childB: [300, 300], overrideLooksInherited: true, parentChanged: false, childrenDiverge: false } },
]);

/** The reject cases. */
export const INHERITANCE_REJECTS: readonly RejectVector[] = Object.freeze([
  // A parent timeout of zero seconds.
  { id: "zero-parent", input: { parentBefore: 0, parentAfter: 600, childB: "inherit", childBValue: 90 }, code: "bad-seconds" },
  // A custom child value beyond the lab's range.
  { id: "child-too-large", input: { parentBefore: 300, parentAfter: 600, childB: "custom", childBValue: 86401 }, code: "bad-seconds" },
  // A child mode the control cannot produce.
  { id: "bad-mode", input: { parentBefore: 300, parentAfter: 600, childB: "pinned" as unknown as ChildMode, childBValue: 90 }, code: "bad-mode" },
]);

/** A profile's values as a [before, after] pair. */
function pair(v: ProfileValues): [number, number] {
  // Before, then after.
  return [v.before, v.after];
}

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures, one sentence each.
  const failures: string[] = [];
  // Each accept case: compute and compare every expected field.
  for (const v of INHERITANCE_VECTORS) {
    // The model's answer, or the refusal it should not have made.
    let got: InheritanceResult;
    // Run it.
    try {
      // Should not throw.
      got = compute(v.input);
    } catch (e) {
      // An unexpected refusal fails the case.
      failures.push(`${v.id}: refused with ${e instanceof InheritanceError ? e.code : String(e)}`);
      // Nothing to compare.
      continue;
    }
    // The answer flattened to the vector's shape.
    const have: Required<Expect> = {
      parent: pair(got.parent),
      childA: pair(got.childA),
      childB: pair(got.childB),
      childBInherited: got.childB.inherited,
      parentChanged: got.parentChanged,
      overrideLooksInherited: got.overrideLooksInherited,
      childrenDiverge: got.childrenDiverge,
    };
    // Each expected field in turn, compared as text so pairs compare by value.
    for (const [k, want] of Object.entries(v.expect)) {
      // The answer's value for that field.
      const value = have[k as keyof Expect];
      // A difference is a failure naming the case and the field.
      if (JSON.stringify(value) !== JSON.stringify(want)) failures.push(`${v.id}: ${k} is ${JSON.stringify(value)}, expected ${JSON.stringify(want)}`);
    }
  }
  // Each reject case: it must throw with the right code.
  for (const r of INHERITANCE_REJECTS) {
    // The code it threw with, or null when it did not throw.
    let code: string | null = null;
    // Run it and catch the refusal.
    try {
      // Should throw.
      compute(r.input);
    } catch (e) {
      // Our error carries a code; anything else is reported as such.
      code = e instanceof InheritanceError ? e.code : `unexpected ${String(e)}`;
    }
    // Wrong code or no refusal is a failure.
    if (code !== r.code) failures.push(`${r.id}: refused with ${String(code)}, expected ${r.code}`);
  }
  // The report in the shape the runner reads.
  const total = INHERITANCE_VECTORS.length + INHERITANCE_REJECTS.length;
  // Passed is everything that did not fail (floored at zero).
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: Math.max(0, total - failures.length), failures };
}
