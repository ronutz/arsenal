// ============================================================================
// src/lib/tools/sorting-algorithm-stepper/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the sorting stepper: correctness on every strategy,
// the teaching behaviors (bubble early-exit, quicksort's sorted-input
// degradation, insertion's invariant narration), counter sanity, and the
// validation paths. GOLDEN_VECTOR_SET_ID: sorting-algorithm-stepper-golden-v1.
// ============================================================================

import { run, type Strategy } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "sorting-algorithm-stepper-golden-v1";

export interface StepperVector {
  name: string;
  input: { text: string; strategy: Strategy };
  expect: (r: ReturnType<typeof run>) => boolean;
  expectError?: RegExp;
}

const SORTED = (r: ReturnType<typeof run>) =>
  r.sorted.every((v, i, a) => i === 0 || a[i - 1] <= v);

export const STEPPER_VECTORS: StepperVector[] = [
  { name: "bubble sorts correctly", input: { text: "5 3 8 1 9 2", strategy: "bubble" },
    expect: (r) => SORTED(r) && r.sorted.join(",") === "1,2,3,5,8,9" },
  { name: "selection sorts correctly with one swap per pass narration", input: { text: "4 2 7 1", strategy: "selection" },
    expect: (r) => SORTED(r) && r.steps.some((s) => s.why.includes("one swap per pass")) },
  { name: "insertion narrates the sorted-prefix invariant", input: { text: "6 1 5 2", strategy: "insertion" },
    expect: (r) => SORTED(r) && r.steps.some((s) => s.why.includes("invariant")) },
  { name: "merge sorts correctly and logs splits and merges", input: { text: "9 4 6 2 8 1", strategy: "merge" },
    expect: (r) => SORTED(r) && r.steps.some((s) => s.why.startsWith("Split")) && r.steps.some((s) => s.why.startsWith("Merged")) },
  { name: "quick sorts correctly and announces pivot finality", input: { text: "3 7 1 6 2", strategy: "quick" },
    expect: (r) => SORTED(r) && r.steps.some((s) => s.why.includes("FINAL sorted position")) },
  { name: "bubble early-exits on sorted input", input: { text: "1 2 3 4 5", strategy: "bubble" },
    expect: (r) => r.steps.some((s) => s.why.includes("exits early")) && r.comparisons === 4 },
  { name: "quick on sorted input shows the degradation note", input: { text: "1 2 3 4 5 6", strategy: "quick" },
    expect: (r) => r.notes.some((n) => n.includes("worst case")) && r.comparisons >= 15 },
  { name: "counters: selection on n=5 makes exactly 10 comparisons", input: { text: "5 4 3 2 1", strategy: "selection" },
    expect: (r) => r.comparisons === 10 },
  { name: "duplicates and negatives handled", input: { text: "3 -1 3 0 -1", strategy: "merge" },
    expect: (r) => r.sorted.join(",") === "-1,-1,0,3,3" },
  { name: "single-item rejected helpfully", input: { text: "42", strategy: "bubble" },
    expect: () => false, expectError: /at least two numbers/ },
  { name: "non-numeric token rejected with position", input: { text: "1 2 banana", strategy: "quick" },
    expect: () => false, expectError: /Item 3 \("banana"\)/ },
  { name: "17 items rejected at the readability cap", input: { text: Array.from({ length: 17 }, (_, i) => String(i)).join(" "), strategy: "insertion" },
    expect: () => false, expectError: /caps at 16/ },
];

/** Run every vector; return failures (empty = all green). */
export function verifyVectors(): string[] {
  const failures: string[] = [];
  for (const v of STEPPER_VECTORS) {
    try {
      const r = run(v.input);
      if (v.expectError) failures.push(`${v.name}: expected error, got success`);
      else if (!v.expect(r)) failures.push(`${v.name}: expectation failed`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!v.expectError) failures.push(`${v.name}: unexpected error ${msg}`);
      else if (!v.expectError.test(msg)) failures.push(`${v.name}: error mismatch ${msg}`);
    }
  }
  return failures;
}
