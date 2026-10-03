// ============================================================================
// src/lib/tools/f5-irules-string-workbench/compute.ts
// ----------------------------------------------------------------------------
// THE iRULES STRING WORKBENCH: run one `string` subcommand on a value and see
// WHERE it worked - every character numbered on a ruler (with the "end" and
// "end-N" names beside the numbers), the span that was cut or converted, how
// each index argument was read (010 is octal 8; "e" is accepted as "end"), the
// window string first / last searched, and every step of a string map pass.
//
// Semantics are Tcl 8.4.6's (src/lib/tcl84/strings.ts), checked against a real
// Tcl 8.4.6 interpreter, including its own Unicode case tables.
// ============================================================================

import { strLength, strByteLength, strCase, strRange, strIndex, strFirst, strLast, strMap, strCompare, strMatch, assertBmp, type MapStep } from "@/lib/tcl84/strings";
import { readIndex, type IndexReading } from "@/lib/tcl84/index";
import { formatElement } from "@/lib/tcl84/list";
import { getInt } from "@/lib/tcl84/value";
import { TclObj, TclError, errorMessage, limitInput } from "@/lib/tcl84/value";
import { tclToLower } from "@/lib/tcl84/casemap";

/** The subcommands the workbench runs. */
export type StringOp = "length" | "bytelength" | "tolower" | "toupper" | "range" | "index" | "first" | "last" | "map" | "match" | "compare" | "equal" | "trim" | "trimleft" | "trimright" | "replace" | "repeat";

/** The input: a subcommand and its arguments, in Tcl's order. */
export interface StringWorkbenchInput {
  // Which subcommand.
  op: StringOp;
  // The arguments after the subcommand, as Tcl takes them (e.g. for first: needle, string, ?start?).
  args: string[];
  // -nocase, where the subcommand accepts it (map, match, compare, equal).
  nocase?: boolean;
}

/** A span on the ruler, and what it means. */
export interface Span {
  // First character (inclusive).
  from: number;
  // Last character (inclusive).
  to: number;
  // "result" (the part returned or converted), "window" (searched), "match", "replaced",
  // "trimmed", or "differ" (the first character where two compared strings differ).
  role: "result" | "window" | "match" | "replaced" | "trimmed" | "differ";
}

/** How one index argument was read. */
export interface Reading {
  // Which argument ("first", "last", "start", "charIndex").
  label: string;
  // The text as typed.
  text: string;
  // The position it means.
  value: number;
  // "int" or "end".
  form: "int" | "end";
  // For integers: the base the text was read in.
  base?: number;
  // For end-N: N.
  offset?: number;
  // Clamped into the string (range, tolower/toupper, replace).
  clamped?: number;
}

/** The workbench's answer. */
export interface StringWorkbenchResult {
  // True when the command succeeded.
  ok: boolean;
  // The result, as Tcl prints it.
  result?: string;
  // Tcl's error message.
  error?: string;
  // The command line, ready to paste into an iRule.
  command: string;
  // The string shown on the ruler.
  subject: string;
  // Its characters: index, the character, its code point.
  chars: { i: number; ch: string; code: number }[];
  // Spans to highlight.
  spans: Span[];
  // How index arguments were read.
  readings: Reading[];
  // The string map pass, step by step.
  mapSteps?: MapStep[];
  // The parsed map pairs.
  mapPairs?: [string, string][];
  // Notes (codes the UI translates).
  notes: string[];
}

/** Which argument holds the string shown on the ruler. */
const SUBJECT_ARG: Record<StringOp, number> = { length: 0, bytelength: 0, tolower: 0, toupper: 0, range: 0, index: 0, first: 1, last: 1, map: 1, match: 1, compare: 0, equal: 0, trim: 0, trimleft: 0, trimright: 0, replace: 0, repeat: 0 };

/** Turn an IndexReading into a display reading. */
function reading(label: string, text: string, r: IndexReading): Reading {
  // Copy the parts that matter.
  return { label, text, value: r.value, form: r.form, base: r.base, offset: r.offset };
}

/** Run one subcommand. */
export function run(input: StringWorkbenchInput): StringWorkbenchResult {
  // Bounded inputs: at most four arguments (replace takes four), each bounded.
  if ((input.args ?? []).length > 4) throw new TclError("this tool takes at most four arguments after the subcommand");
  // Each argument.
  for (const x of input.args ?? []) limitInput("An argument", x, 20000);
  // The arguments.
  const a = input.args;
  // The option word, when used.
  const opt = input.nocase && ["map", "match", "compare", "equal"].includes(input.op) ? ["-nocase"] : [];
  // The paste-ready command.
  const command = ["string", input.op, ...opt, ...a].map((w, i) => (i < 2 ? w : formatElement(w))).join(" ");
  // The ruler's string.
  const subject = a[SUBJECT_ARG[input.op]] ?? "";
  // The result being built.
  const out: StringWorkbenchResult = { ok: false, command, subject, chars: [...subject].map((ch, i) => ({ i, ch, code: ch.charCodeAt(0) })), spans: [], readings: [], notes: [] };
  // Errors keep Tcl's wording.
  try {
    // Characters beyond the BMP are refused by every subcommand.
    for (const x of a) assertBmp(x);
    // Dispatch.
    switch (input.op) {
      // Characters.
      case "length": {
        // One argument.
        if (a.length !== 1) throw new Error('wrong # args: should be "string length string"');
        // The count.
        out.result = String(strLength(a[0] ?? ""));
        // The whole string counts.
        if (subject.length) out.spans.push({ from: 0, to: subject.length - 1, role: "result" });
        // Done.
        break;
      }
      // Bytes in Tcl's internal UTF-8.
      case "bytelength": {
        // One argument.
        if (a.length !== 1) throw new Error('wrong # args: should be "string bytelength string"');
        // The count.
        out.result = String(strByteLength(a[0] ?? ""));
        // Non-ASCII text makes the two counts differ.
        if (/[^\x01-\x7f]/.test(subject)) out.notes.push("bytes-differ");
        // Done.
        break;
      }
      // Case conversion, optionally on a span.
      case "tolower": case "toupper": {
        // One to three arguments.
        if (a.length < 1 || a.length > 3) throw new Error(`wrong # args: should be "string ${input.op} string ?first? ?last?"`);
        // Convert.
        const r = strCase(a[0] ?? "", input.op === "toupper", a[1], a[1] === undefined ? undefined : a[2]);
        // The result.
        out.result = r.value;
        // The readings.
        if (r.firstReading) out.readings.push({ ...reading("first", a[1], r.firstReading), clamped: r.first ?? undefined });
        // The last index.
        if (r.lastReading) out.readings.push({ ...reading("last", a[2], r.lastReading), clamped: r.last ?? undefined });
        // The converted span.
        if (r.first !== null && r.last !== null) out.spans.push({ from: r.first, to: r.last, role: "result" });
        // Nothing in range.
        else if (subject.length) out.notes.push("empty-span-unchanged");
        // Done.
        break;
      }
      // A range.
      case "range": {
        // Three arguments.
        if (a.length !== 3) throw new Error('wrong # args: should be "string range string first last"');
        // Cut.
        const r = strRange(a[0], a[1], a[2]);
        // The result.
        out.result = r.value;
        // Readings with their clamped positions.
        out.readings.push({ ...reading("first", a[1], r.firstReading), clamped: r.first }, { ...reading("last", a[2], r.lastReading), clamped: r.last });
        // The span.
        if (r.value !== "") out.spans.push({ from: r.first, to: r.last, role: "result" });
        // An empty result from crossed indices.
        else out.notes.push("range-empty");
        // Done.
        break;
      }
      // One character.
      case "index": {
        // Two arguments.
        if (a.length !== 2) throw new Error('wrong # args: should be "string index string charIndex"');
        // Pick it.
        const r = strIndex(a[0], a[1]);
        // The result.
        out.result = r.value;
        // The reading.
        out.readings.push(reading("charIndex", a[1], r.reading));
        // The character.
        if (r.value !== "") out.spans.push({ from: r.index, to: r.index, role: "result" });
        // Out of range.
        else out.notes.push("index-out-of-range");
        // Done.
        break;
      }
      // Search forward / backward.
      case "first": case "last": {
        // Two or three arguments.
        if (a.length < 2 || a.length > 3) throw new Error(`wrong # args: should be "string ${input.op} subString string ?startIndex?"`);
        // Search.
        const r = (input.op === "first" ? strFirst : strLast)(a[0], a[1], a[2]);
        // The result.
        out.result = String(r.value);
        // The start reading.
        if (r.reading) out.readings.push(reading(input.op === "first" ? "startIndex" : "lastIndex", a[2], r.reading));
        // The window a match could start in.
        if (r.windowLastStart >= r.windowStart && subject.length) out.spans.push({ from: Math.max(0, r.windowStart), to: Math.min(subject.length - 1, r.windowLastStart + Math.max(0, a[0].length - 1)), role: "window" });
        // The match.
        if (r.value >= 0) out.spans.push({ from: r.value, to: r.value + a[0].length - 1, role: "match" });
        // An empty needle never matches.
        if (a[0] === "") out.notes.push("empty-needle");
        // last: the whole match must end by lastIndex.
        if (input.op === "last" && a[2] !== undefined) out.notes.push("last-whole-match");
        // Done.
        break;
      }
      // One pass of replacements.
      case "map": {
        // Two arguments.
        if (a.length !== 2) throw new Error('wrong # args: should be "string map ?-nocase? charMap string"');
        // Map.
        const r = strMap(a[0], a[1], !!input.nocase);
        // The result.
        out.result = r.value;
        // The trace.
        out.mapSteps = r.steps;
        // The pairs.
        out.mapPairs = r.pairs;
        // Replaced spans.
        for (const st of r.steps) if (st.action === "replace") out.spans.push({ from: st.at, to: st.at + st.text.length - 1, role: "replaced" });
        // The one-pass rule.
        out.notes.push("map-one-pass");
        // Done.
        break;
      }
      // Glob match.
      case "match": {
        // Two arguments.
        if (a.length !== 2) throw new Error('wrong # args: should be "string match ?-nocase? pattern string"');
        // Match.
        out.result = String(strMatch(a[0], a[1], !!input.nocase));
        // Done.
        break;
      }
      // Ordering and equality.
      case "compare": case "equal": {
        // Two arguments.
        if (a.length !== 2) throw new Error(`wrong # args: should be "string ${input.op} ?-nocase? ?-length int? string1 string2"`);
        // Compare.
        const c = strCompare(a[0], a[1], !!input.nocase);
        // The result.
        out.result = String(input.op === "equal" ? (c === 0 ? 1 : 0) : c);
        // Where they first differ.
        const n = Math.min(a[0].length, a[1].length);
        // Find it.
        let k = 0;
        // The character as the comparison sees it (folded to lower case with -nocase).
        const fold = (ch: string) => (input.nocase ? tclToLower(ch) : ch);
        // Skip equal characters.
        while (k < n && fold(a[0][k]) === fold(a[1][k])) k++;
        // Mark it on the first string.
        if (k < a[0].length && c !== 0) out.spans.push({ from: k, to: k, role: "differ" });
        // Character codes decide.
        out.notes.push("compare-codes");
        // Done.
        break;
      }
      // Trimming.
      case "trim": case "trimleft": case "trimright": {
        // One or two arguments.
        if (a.length < 1 || a.length > 2) throw new Error(`wrong # args: should be "string ${input.op} string ?chars?"`);
        // The set.
        const chars = a[1] ?? " \t\n\r";
        // The string.
        const s = a[0];
        // Left edge.
        let L = 0;
        // Trim left.
        if (input.op !== "trimright") while (L < s.length && chars.includes(s[L])) L++;
        // Right edge.
        let Rr = s.length;
        // Trim right.
        if (input.op !== "trimleft") while (Rr > L && chars.includes(s[Rr - 1])) Rr--;
        // The result.
        out.result = s.slice(L, Rr);
        // Trimmed spans.
        if (L > 0) out.spans.push({ from: 0, to: L - 1, role: "trimmed" });
        // Right side.
        if (Rr < s.length) out.spans.push({ from: Rr, to: s.length - 1, role: "trimmed" });
        // The characters are a SET, not a word.
        if (a[1] !== undefined && a[1].length > 1) out.notes.push("trim-set");
        // Done.
        break;
      }
      // Replace a span.
      case "replace": {
        // Three or four arguments.
        if (a.length < 3 || a.length > 4) throw new Error('wrong # args: should be "string replace string first last ?string?"');
        // The string and its last position.
        const s = a[0], end = s.length - 1;
        // The indices.
        const f = readIndex(a[1], end), l = readIndex(a[2], end);
        // Readings.
        out.readings.push(reading("first", a[1], f), reading("last", a[2], l));
        // Unchanged when out of range.
        if (l.value < f.value || l.value < 0 || f.value > end) { out.result = s; out.notes.push("replace-unchanged"); break; }
        // The clamped start.
        const first = Math.max(0, f.value);
        // The replaced span.
        out.spans.push({ from: first, to: Math.min(end, l.value), role: "replaced" });
        // Splice.
        out.result = s.slice(0, first) + (a[3] ?? "") + (l.value < end ? s.slice(l.value + 1) : "");
        // Done.
        break;
      }
      // Repetition.
      case "repeat": {
        // Two arguments.
        if (a.length !== 2) throw new Error('wrong # args: should be "string repeat string count"');
        // The count (Tcl_GetIntFromObj).
        const k = Number(getInt(TclObj.fromString(a[1])));
        // A sane bound.
        if (k * a[0].length > 100000) throw new Error("the result would be too large for this page");
        // Repeat.
        out.result = k > 0 ? a[0].repeat(k) : "";
        // Done.
        break;
      }
    }
    // Success.
    out.ok = true;
  } catch (e) {
    // Tcl's message.
    out.error = errorMessage(e);
  }
  // Index readings: an octal or hex index is worth a note.
  if (out.readings.some((r) => r.form === "int" && r.base === 8 && r.value !== 0)) out.notes.push("octal-index");
  // The "e" / "en" quirk.
  if (out.readings.some((r) => r.form === "end" && /^en?(-|$)/.test(r.text) && !r.text.startsWith("end"))) out.notes.push("end-prefix");
  // Done.
  return out;
}
