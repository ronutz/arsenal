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
//
// PAGE LANGUAGE (02/11/2026): every step's WHY, every note and every error is
// built as an EngineText (src/lib/tools/engine-text.ts): a stable id, the
// English exactly as before, and its values. runLocalisable() returns the
// trace with those objects in place; run(), the API's and the vectors' entry,
// returns plainText() of the same trace, byte for byte what it was. Thrown
// errors keep their class and message and carry their sentence.
// ============================================================================

import { say, plainText, engineError, type EngineText } from "../engine-text"; // sentences with ids (02/11/2026)

export type Strategy = "bubble" | "selection" | "insertion" | "merge" | "quick";

export interface SortStep<S = string> {
  /** Array snapshot AFTER this step. */
  state: number[];
  /** Indices highlighted (compared or written) at this step. */
  focus: number[];
  /** compare | swap | write | note */
  kind: "compare" | "swap" | "write" | "note";
  /** One-line reasoning for the move. */
  why: S;
}

/** S is string in the API's trace and EngineText in the page's (runLocalisable). */
export interface SortTrace<S = string> {
  strategy: Strategy;
  input: number[];
  steps: SortStep<S>[];
  comparisons: number;
  writes: number;
  sorted: number[];
  notes: S[];
}

const MAX_ITEMS = 16;
const MAX_STEPS = 400;

/** Parse a whitespace/comma-separated list of numbers with anchored errors. */
export function parseList(text: string): number[] {
  const toks = text.split(/[\s,;]+/).filter(Boolean);
  if (toks.length === 0) throw engineError(say("err.empty", "Paste at least two numbers (e.g. 5 3 8 1)."));
  if (toks.length < 2) throw engineError(say("err.one", "A one-item list is already sorted - paste at least two numbers."));
  if (toks.length > MAX_ITEMS)
    throw engineError(say("err.tooMany", `That is ${toks.length} items - the stepper caps at ${MAX_ITEMS} so every step stays readable.`, { count: String(toks.length), max: String(MAX_ITEMS) }));
  return toks.map((t, i) => {
    const n = Number(t);
    if (!Number.isFinite(n)) throw engineError(say("err.notNumber", `Item ${i + 1} ("${t}") is not a number.`, { n: String(i + 1), token: t }));
    return n;
  });
}

class Tracer {
  steps: SortStep<EngineText>[] = [];
  comparisons = 0;
  writes = 0;
  constructor(private a: number[]) {}
  private guard() {
    if (this.steps.length >= MAX_STEPS)
      throw engineError(say("err.stepCap", `Step cap (${MAX_STEPS}) reached - try a smaller list.`, { max: String(MAX_STEPS) }));
  }
  compare(i: number, j: number, why: EngineText): number {
    this.guard();
    this.comparisons++;
    this.steps.push({ state: [...this.a], focus: [i, j], kind: "compare", why });
    return this.a[i] - this.a[j];
  }
  /** Compare the value at index i against a HELD value (insertion's probe). */
  compareVal(i: number, v: number, why: EngineText): number {
    this.guard();
    this.comparisons++;
    this.steps.push({ state: [...this.a], focus: [i], kind: "compare", why });
    return this.a[i] - v;
  }
  swap(i: number, j: number, why: EngineText): void {
    this.guard();
    [this.a[i], this.a[j]] = [this.a[j], this.a[i]];
    this.writes += 2;
    this.steps.push({ state: [...this.a], focus: [i, j], kind: "swap", why });
  }
  write(i: number, v: number, why: EngineText): void {
    this.guard();
    this.a[i] = v;
    this.writes++;
    this.steps.push({ state: [...this.a], focus: [i], kind: "write", why });
  }
  note(why: EngineText, focus: number[] = []): void {
    this.guard();
    this.steps.push({ state: [...this.a], focus, kind: "note", why });
  }
  get arr() { return this.a; }
}

function bubble(t: Tracer, n: number) {
  for (let pass = 0; pass < n - 1; pass++) {
    let swapped = false;
    for (let i = 0; i < n - 1 - pass; i++) {
      const c = t.compare(i, i + 1, say("bubble.compare", `Pass ${pass + 1}: compare neighbors at ${i} and ${i + 1}.`, { pass: String(pass + 1), i: String(i), j: String(i + 1) }));
      if (c > 0) { t.swap(i, i + 1, say("bubble.swap", `Out of order - swap so the larger bubbles right.`)); swapped = true; }
    }
    t.note(say("bubble.passEnd", `End of pass ${pass + 1}: the largest unsorted value has bubbled to position ${n - 1 - pass}.`, { pass: String(pass + 1), pos: String(n - 1 - pass) }), [n - 1 - pass]);
    if (!swapped) { t.note(say("bubble.early", "A full pass made no swaps - the list is sorted; bubble sort exits early.")); break; }
  }
}

function selection(t: Tracer, n: number) {
  for (let i = 0; i < n - 1; i++) {
    let min = i;
    for (let j = i + 1; j < n; j++) {
      if (t.compare(j, min, say("selection.scan", `Scan for the minimum of the unsorted tail: is index ${j} smaller than the current minimum at ${min}?`, { j: String(j), min: String(min) })) < 0) min = j;
    }
    if (min !== i) t.swap(i, min, say("selection.place", `Place that minimum at position ${i} - one swap per pass, no matter how far it traveled.`, { i: String(i) }));
    else t.note(say("selection.inPlace", `Position ${i} already holds the minimum - no swap needed.`, { i: String(i) }), [i]);
  }
}

function insertion(t: Tracer, n: number) {
  for (let i = 1; i < n; i++) {
    const v = t.arr[i];
    let j = i - 1;
    t.note(say("insertion.take", `Take the value ${v} at index ${i} - insert it into the sorted prefix [0..${i - 1}].`, { v: String(v), i: String(i), last: String(i - 1) }), [i]);
    while (j >= 0) {
      // Compare the prefix value against the HELD value v (not a live index -
      // once shifting starts, v no longer lives in the array).
      const bigger = t.compareVal(j, v, say("insertion.compare", `Is the prefix value at ${j} (${t.arr[j]}) bigger than ${v}? If so it shifts right.`, { j: String(j), value: String(t.arr[j]), v: String(v) })) > 0;
      if (!bigger) break;
      t.write(j + 1, t.arr[j], say("insertion.shift", `Shift ${t.arr[j]} one slot right to open space.`, { value: String(t.arr[j]) }));
      j--;
    }
    t.write(j + 1, v, say("insertion.drop", `Drop ${v} into its slot at index ${j + 1} - the prefix [0..${i}] is sorted again (the invariant).`, { v: String(v), slot: String(j + 1), i: String(i) }));
  }
}

function mergeSort(t: Tracer, lo: number, hi: number) {
  if (hi - lo < 2) return;
  const mid = (lo + hi) >> 1;
  t.note(say("merge.split", `Split [${lo}..${hi - 1}] into [${lo}..${mid - 1}] and [${mid}..${hi - 1}] - divide until trivially sorted.`, { lo: String(lo), hi: String(hi - 1), midLo: String(mid - 1), mid: String(mid) }));
  mergeSort(t, lo, mid);
  mergeSort(t, mid, hi);
  const left = t.arr.slice(lo, mid), right = t.arr.slice(mid, hi);
  let i = 0, j = 0, k = lo;
  while (i < left.length && j < right.length) {
    t.compare(lo + i <= mid - 1 ? lo + i : mid - 1, mid + j, say("merge.compare", `Merge: compare the heads of the two sorted halves (${left[i]} vs ${right[j]}).`, { a: String(left[i]), b: String(right[j]) }));
    if (left[i] <= right[j]) t.write(k++, left[i++], say("merge.takeLeft", `Take ${left[i - 1]} from the left half.`, { v: String(left[i - 1]) }));
    else t.write(k++, right[j++], say("merge.takeRight", `Take ${right[j - 1]} from the right half.`, { v: String(right[j - 1]) }));
  }
  while (i < left.length) t.write(k++, left[i++], say("merge.restLeft", `Left half remainder: copy ${left[i - 1]} across.`, { v: String(left[i - 1]) }));
  while (j < right.length) t.write(k++, right[j++], say("merge.restRight", `Right half remainder: copy ${right[j - 1]} across.`, { v: String(right[j - 1]) }));
  t.note(say("merge.done", `Merged: [${lo}..${hi - 1}] is now sorted.`, { lo: String(lo), hi: String(hi - 1) }));
}

function quick(t: Tracer, lo: number, hi: number) {
  if (lo >= hi) return;
  const pivot = t.arr[hi];
  t.note(say("quick.partition", `Partition [${lo}..${hi}]: pivot = ${pivot} (last element, Lomuto scheme).`, { lo: String(lo), hi: String(hi), pivot: String(pivot) }), [hi]);
  let i = lo - 1;
  for (let j = lo; j < hi; j++) {
    if (t.compare(j, hi, say("quick.compare", `Is index ${j} (${t.arr[j]}) <= pivot ${pivot}? If so it belongs to the left side.`, { j: String(j), value: String(t.arr[j]), pivot: String(pivot) })) <= 0) {
      i++;
      if (i !== j) t.swap(i, j, say("quick.grow", `Grow the <=pivot region: swap into position ${i}.`, { i: String(i) }));
    }
  }
  if (i + 1 !== hi) t.swap(i + 1, hi, say("quick.place", `Place the pivot between the sides - it is now in its FINAL sorted position ${i + 1}.`, { pos: String(i + 1) }));
  else t.note(say("quick.inPlace", `Pivot already sits at its final position ${hi}.`, { pos: String(hi) }), [hi]);
  quick(t, lo, i);
  quick(t, i + 2, hi);
}

/** Run the chosen strategy and return the full trace (02/11/2026: the trace of runLocalisable() with every sentence as its English). */
export function run(input: { text: string; strategy: Strategy }): SortTrace {
  return plainText(runLocalisable(input)); // the same trace, sentences as their English
}

/**
 * The page's trace (02/11/2026): run()'s trace with every sentence an EngineText (its id, its English, its values).
 * @param input the numbers as typed and the strategy
 * @returns the trace with sentences as EngineTexts
 */
export function runLocalisable(input: { text: string; strategy: Strategy }): SortTrace<EngineText> {
  const nums = parseList(input.text);
  const strategies: Strategy[] = ["bubble", "selection", "insertion", "merge", "quick"];
  if (!strategies.includes(input.strategy))
    throw engineError(say("err.strategy", `Strategy must be one of: ${strategies.join(", ")}.`, { values: strategies.join(", ") }));
  const t = new Tracer([...nums]);
  const n = nums.length;
  if (input.strategy === "bubble") bubble(t, n);
  else if (input.strategy === "selection") selection(t, n);
  else if (input.strategy === "insertion") insertion(t, n);
  else if (input.strategy === "merge") mergeSort(t, 0, n);
  else quick(t, 0, n - 1);

  const sorted = t.arr;
  for (let i = 1; i < sorted.length; i++)
    if (sorted[i - 1] > sorted[i]) throw engineError(say("err.invariant", "Internal invariant failure: output not sorted.")); // never - vector-guarded

  const notes: EngineText[] = [
    say("note.counters", `${t.comparisons} comparisons and ${t.writes} writes for ${n} items - re-run with a longer list and watch how each strategy's counters grow: that growth curve IS Big-O.`, { comparisons: String(t.comparisons), writes: String(t.writes), n: String(n) }),
  ];
  if (input.strategy === "quick") notes.push(say("note.quickSorted", "Try pasting an already-sorted list: Lomuto quicksort with a last-element pivot degrades toward its O(n\u00b2) worst case - the exact hazard the primer article describes."));
  if (input.strategy === "bubble") notes.push(say("note.bubbleSorted", "Try a sorted list here too: bubble sort's early-exit detects the clean pass and stops after one O(n) sweep."));
  return { strategy: input.strategy, input: nums, steps: t.steps, comparisons: t.comparisons, writes: t.writes, sorted, notes };
}
