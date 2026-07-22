// ============================================================================
// src/lib/tools/sorting-algorithm-stepper/compute.ts
// ----------------------------------------------------------------------------
// THE SORTING ALGORITHM STEPPER ENGINE. Paste a small list of numbers, pick a
// strategy (bubble, selection, insertion, merge, quick), and get the COMPLETE
// deterministic trace: every comparison, every swap/write, the array state
// after each step, and a one-line WHY for each move - plus the running
// comparison/write counters that make Big-O visible ("watch n-squared
// happen"). Textbook-canonical variants, chosen for teachability:
//   - bubble: classic adjacent-swap with early-exit on a clean pass
//   - selection: scan for minimum, single swap per pass
//   - insertion: grow a sorted prefix, shifting rightward
//   - merge: top-down recursive, trace logs the merges
//   - quick: Lomuto partition, last element as pivot (the common teaching
//     form; the worst-case-on-sorted-input behavior is a FEATURE here - the
//     tool lets you watch the O(n-squared) degradation the primer warns
//     about)
// Deterministic, bounded (16 items / 400 steps cap), local. (D-19.)
// ============================================================================

export type Strategy = "bubble" | "selection" | "insertion" | "merge" | "quick";

export interface SortStep {
  /** Array snapshot AFTER this step. */
  state: number[];
  /** Indices highlighted (compared or written) at this step. */
  focus: number[];
  /** compare | swap | write | note */
  kind: "compare" | "swap" | "write" | "note";
  /** One-line reasoning for the move. */
  why: string;
}

export interface SortTrace {
  strategy: Strategy;
  input: number[];
  steps: SortStep[];
  comparisons: number;
  writes: number;
  sorted: number[];
  notes: string[];
}

const MAX_ITEMS = 16;
const MAX_STEPS = 400;

/** Parse a whitespace/comma-separated list of numbers with anchored errors. */
export function parseList(text: string): number[] {
  const toks = text.split(/[\s,;]+/).filter(Boolean);
  if (toks.length === 0) throw new Error("Paste at least two numbers (e.g. 5 3 8 1).");
  if (toks.length < 2) throw new Error("A one-item list is already sorted - paste at least two numbers.");
  if (toks.length > MAX_ITEMS)
    throw new Error(`That is ${toks.length} items - the stepper caps at ${MAX_ITEMS} so every step stays readable.`);
  return toks.map((t, i) => {
    const n = Number(t);
    if (!Number.isFinite(n)) throw new Error(`Item ${i + 1} ("${t}") is not a number.`);
    return n;
  });
}

class Tracer {
  steps: SortStep[] = [];
  comparisons = 0;
  writes = 0;
  constructor(private a: number[]) {}
  private guard() {
    if (this.steps.length >= MAX_STEPS)
      throw new Error(`Step cap (${MAX_STEPS}) reached - try a smaller list.`);
  }
  compare(i: number, j: number, why: string): number {
    this.guard();
    this.comparisons++;
    this.steps.push({ state: [...this.a], focus: [i, j], kind: "compare", why });
    return this.a[i] - this.a[j];
  }
  /** Compare the value at index i against a HELD value (insertion's probe). */
  compareVal(i: number, v: number, why: string): number {
    this.guard();
    this.comparisons++;
    this.steps.push({ state: [...this.a], focus: [i], kind: "compare", why });
    return this.a[i] - v;
  }
  swap(i: number, j: number, why: string): void {
    this.guard();
    [this.a[i], this.a[j]] = [this.a[j], this.a[i]];
    this.writes += 2;
    this.steps.push({ state: [...this.a], focus: [i, j], kind: "swap", why });
  }
  write(i: number, v: number, why: string): void {
    this.guard();
    this.a[i] = v;
    this.writes++;
    this.steps.push({ state: [...this.a], focus: [i], kind: "write", why });
  }
  note(why: string, focus: number[] = []): void {
    this.guard();
    this.steps.push({ state: [...this.a], focus, kind: "note", why });
  }
  get arr() { return this.a; }
}

function bubble(t: Tracer, n: number) {
  for (let pass = 0; pass < n - 1; pass++) {
    let swapped = false;
    for (let i = 0; i < n - 1 - pass; i++) {
      const c = t.compare(i, i + 1, `Pass ${pass + 1}: compare neighbors at ${i} and ${i + 1}.`);
      if (c > 0) { t.swap(i, i + 1, `Out of order - swap so the larger bubbles right.`); swapped = true; }
    }
    t.note(`End of pass ${pass + 1}: the largest unsorted value has bubbled to position ${n - 1 - pass}.`, [n - 1 - pass]);
    if (!swapped) { t.note("A full pass made no swaps - the list is sorted; bubble sort exits early."); break; }
  }
}

function selection(t: Tracer, n: number) {
  for (let i = 0; i < n - 1; i++) {
    let min = i;
    for (let j = i + 1; j < n; j++) {
      if (t.compare(j, min, `Scan for the minimum of the unsorted tail: is index ${j} smaller than the current minimum at ${min}?`) < 0) min = j;
    }
    if (min !== i) t.swap(i, min, `Place that minimum at position ${i} - one swap per pass, no matter how far it traveled.`);
    else t.note(`Position ${i} already holds the minimum - no swap needed.`, [i]);
  }
}

function insertion(t: Tracer, n: number) {
  for (let i = 1; i < n; i++) {
    const v = t.arr[i];
    let j = i - 1;
    t.note(`Take the value ${v} at index ${i} - insert it into the sorted prefix [0..${i - 1}].`, [i]);
    while (j >= 0) {
      // Compare the prefix value against the HELD value v (not a live index -
      // once shifting starts, v no longer lives in the array).
      const bigger = t.compareVal(j, v, `Is the prefix value at ${j} (${t.arr[j]}) bigger than ${v}? If so it shifts right.`) > 0;
      if (!bigger) break;
      t.write(j + 1, t.arr[j], `Shift ${t.arr[j]} one slot right to open space.`);
      j--;
    }
    t.write(j + 1, v, `Drop ${v} into its slot at index ${j + 1} - the prefix [0..${i}] is sorted again (the invariant).`);
  }
}

function mergeSort(t: Tracer, lo: number, hi: number) {
  if (hi - lo < 2) return;
  const mid = (lo + hi) >> 1;
  t.note(`Split [${lo}..${hi - 1}] into [${lo}..${mid - 1}] and [${mid}..${hi - 1}] - divide until trivially sorted.`);
  mergeSort(t, lo, mid);
  mergeSort(t, mid, hi);
  const left = t.arr.slice(lo, mid), right = t.arr.slice(mid, hi);
  let i = 0, j = 0, k = lo;
  while (i < left.length && j < right.length) {
    t.compare(lo + i <= mid - 1 ? lo + i : mid - 1, mid + j, `Merge: compare the heads of the two sorted halves (${left[i]} vs ${right[j]}).`);
    if (left[i] <= right[j]) t.write(k++, left[i++], `Take ${left[i - 1]} from the left half.`);
    else t.write(k++, right[j++], `Take ${right[j - 1]} from the right half.`);
  }
  while (i < left.length) t.write(k++, left[i++], `Left half remainder: copy ${left[i - 1]} across.`);
  while (j < right.length) t.write(k++, right[j++], `Right half remainder: copy ${right[j - 1]} across.`);
  t.note(`Merged: [${lo}..${hi - 1}] is now sorted.`);
}

function quick(t: Tracer, lo: number, hi: number) {
  if (lo >= hi) return;
  const pivot = t.arr[hi];
  t.note(`Partition [${lo}..${hi}]: pivot = ${pivot} (last element, Lomuto scheme).`, [hi]);
  let i = lo - 1;
  for (let j = lo; j < hi; j++) {
    if (t.compare(j, hi, `Is index ${j} (${t.arr[j]}) <= pivot ${pivot}? If so it belongs to the left side.`) <= 0) {
      i++;
      if (i !== j) t.swap(i, j, `Grow the <=pivot region: swap into position ${i}.`);
    }
  }
  if (i + 1 !== hi) t.swap(i + 1, hi, `Place the pivot between the sides - it is now in its FINAL sorted position ${i + 1}.`);
  else t.note(`Pivot already sits at its final position ${hi}.`, [hi]);
  quick(t, lo, i);
  quick(t, i + 2, hi);
}

/** Run the chosen strategy and return the full trace. */
export function run(input: { text: string; strategy: Strategy }): SortTrace {
  const nums = parseList(input.text);
  const strategies: Strategy[] = ["bubble", "selection", "insertion", "merge", "quick"];
  if (!strategies.includes(input.strategy))
    throw new Error(`Strategy must be one of: ${strategies.join(", ")}.`);
  const t = new Tracer([...nums]);
  const n = nums.length;
  if (input.strategy === "bubble") bubble(t, n);
  else if (input.strategy === "selection") selection(t, n);
  else if (input.strategy === "insertion") insertion(t, n);
  else if (input.strategy === "merge") mergeSort(t, 0, n);
  else quick(t, 0, n - 1);

  const sorted = t.arr;
  for (let i = 1; i < sorted.length; i++)
    if (sorted[i - 1] > sorted[i]) throw new Error("Internal invariant failure: output not sorted."); // never - vector-guarded

  const notes: string[] = [
    `${t.comparisons} comparisons and ${t.writes} writes for ${n} items - re-run with a longer list and watch how each strategy's counters grow: that growth curve IS Big-O.`,
  ];
  if (input.strategy === "quick") notes.push("Try pasting an already-sorted list: Lomuto quicksort with a last-element pivot degrades toward its O(n\u00b2) worst case - the exact hazard the primer article describes.");
  if (input.strategy === "bubble") notes.push("Try a sorted list here too: bubble sort's early-exit detects the clean pass and stops after one O(n) sweep.");
  return { strategy: input.strategy, input: nums, steps: t.steps, comparisons: t.comparisons, writes: t.writes, sorted, notes };
}
