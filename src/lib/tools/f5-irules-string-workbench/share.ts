// ============================================================================
// src/lib/tools/f5-irules-string-workbench/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the iRules string workbench (posture "input"):
// the page is a form (a subcommand and its argument fields), so a link carries
// named values only (ROLLOUT section 11.3), no "input": which field holds the
// text being worked on changes with the subcommand (string, haystack,
// string1 ...), so each field goes by its own name.
//
//   op       the subcommand (length, range, first, map ...)
//   string, first, last, charindex, needle, haystack, startindex, lastindex,
//   mapping, pattern, string1, string2, chars, newstring, count
//            the subcommand's argument fields, by their names on the page,
//            each left out when empty
//   nocase   1 when -nocase is ticked (map, match, compare and equal only)
//
// STRING_WORKBENCH_FIELDS is the page's own field table (the component reads
// it from here), so a field added to a subcommand gets its link name here.
// Names are a contract once shipped: a renamed field keeps its old name.
//
// Arrival: the subcommand and its fields fill as typing would, and the page
// computes the result. An unknown subcommand, a field the subcommand does not
// take, or a -nocase where it does not apply makes the whole share malformed:
// ignored, never half applied. Field text is accepted as typed (the page shows
// Tcl's own error for a bad index, as it does for typing).
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns
import type { StringOp } from "./compute"; // the subcommands

/** One argument field: its message key (tools.f5-irules-string-workbench.field.<key>) and whether it may be left out. */
export interface WorkbenchField {
  /** The message key, and (lower-cased) the link name. */
  key: string;
  /** May be left empty (trailing empty optional fields are not passed to Tcl). */
  optional?: boolean;
}

/** The argument fields of each subcommand, in Tcl's order (the page's form). */
export const STRING_WORKBENCH_FIELDS: Readonly<Record<StringOp, readonly WorkbenchField[]>> = Object.freeze({
  length: [{ key: "string" }], // string length string
  bytelength: [{ key: "string" }], // string bytelength string
  tolower: [{ key: "string" }, { key: "first", optional: true }, { key: "last", optional: true }], // string tolower string ?first? ?last?
  toupper: [{ key: "string" }, { key: "first", optional: true }, { key: "last", optional: true }], // string toupper string ?first? ?last?
  range: [{ key: "string" }, { key: "first" }, { key: "last" }], // string range string first last
  index: [{ key: "string" }, { key: "charIndex" }], // string index string charIndex
  first: [{ key: "needle" }, { key: "haystack" }, { key: "startIndex", optional: true }], // string first needle haystack ?startIndex?
  last: [{ key: "needle" }, { key: "haystack" }, { key: "lastIndex", optional: true }], // string last needle haystack ?lastIndex?
  map: [{ key: "mapping" }, { key: "string" }], // string map ?-nocase? mapping string
  match: [{ key: "pattern" }, { key: "string" }], // string match ?-nocase? pattern string
  compare: [{ key: "string1" }, { key: "string2" }], // string compare ?-nocase? string1 string2
  equal: [{ key: "string1" }, { key: "string2" }], // string equal ?-nocase? string1 string2
  trim: [{ key: "string" }, { key: "chars", optional: true }], // string trim string ?chars?
  trimleft: [{ key: "string" }, { key: "chars", optional: true }], // string trimleft string ?chars?
  trimright: [{ key: "string" }, { key: "chars", optional: true }], // string trimright string ?chars?
  replace: [{ key: "string" }, { key: "first" }, { key: "last" }, { key: "newString", optional: true }], // string replace string first last ?newString?
  repeat: [{ key: "string" }, { key: "count" }], // string repeat string count
});

/** The subcommands that take -nocase. */
export const STRING_WORKBENCH_NOCASE: readonly StringOp[] = ["map", "match", "compare", "equal"]; // Tcl 8.4 string(n)

/** Every field's link name: its key, lower-cased (charIndex -> charindex). */
const FIELD_NAMES: readonly string[] = [...new Set(Object.values(STRING_WORKBENCH_FIELDS).flat().map((f) => f.key.toLowerCase()))]; // 15 names

/** The state: the subcommand, one value per field (in the subcommand's order), and -nocase. */
export interface StringWorkbenchShareState {
  /** The subcommand. */
  op: StringOp;
  /** The fields' values, in the subcommand's order. */
  values: string[];
  /** -nocase is ticked (meaningful only where the subcommand takes it). */
  nocase: boolean;
}

/** The spec. */
export const IRULES_STRING_WORKBENCH_SHARE: ShareSpec<StringWorkbenchShareState> = Object.freeze({
  tool: "f5-irules-string-workbench", // the slug
  posture: "input", // the form as filled in
  carriesKey: "share.carries", // tools.f5-irules-string-workbench.share.carries
  names: ["op", ...FIELD_NAMES, "nocase"], // #op=range&string=...&first=0&last=end-1
  /** The subcommand and its non-empty fields; nothing while every field is empty. */
  encode(s: StringWorkbenchShareState): ShareEncoding {
    const fields = STRING_WORKBENCH_FIELDS[s.op]; // this subcommand's fields
    const p: Record<string, string> = { op: s.op }; // the subcommand
    fields.forEach((f, i) => { const x = s.values[i] ?? ""; if (x !== "") p[f.key.toLowerCase()] = x; }); // each field that holds something
    if (Object.keys(p).length === 1) return { ok: false, reason: "empty" } as const; // nothing typed: nothing to share
    if (s.nocase && STRING_WORKBENCH_NOCASE.includes(s.op)) p.nocase = "1"; // -nocase, where it applies
    return { ok: true, params: p } as const; // the form
  },
  /** A known subcommand, only its own fields (at least one), and -nocase only where it applies. */
  decode(v: Readonly<Record<string, string | null>>): StringWorkbenchShareState | null {
    const op = v.op; // the subcommand
    if (!op || !Object.prototype.hasOwnProperty.call(STRING_WORKBENCH_FIELDS, op)) return null; // unknown: malformed
    const fields = STRING_WORKBENCH_FIELDS[op as StringOp]; // its fields
    const own = new Set(fields.map((f) => f.key.toLowerCase())); // their link names
    if (FIELD_NAMES.some((n) => !own.has(n) && (v[n] ?? null) !== null)) return null; // a field of another subcommand: malformed
    const values = fields.map((f) => v[f.key.toLowerCase()] ?? ""); // each field, empty when not carried
    if (values.every((x) => x === "")) return null; // nothing to fill
    const nc = v.nocase ?? null; // -nocase, if carried
    if (nc !== null && (nc !== "1" && nc !== "0")) return null; // not a switch value
    if (nc === "1" && !STRING_WORKBENCH_NOCASE.includes(op as StringOp)) return null; // -nocase where the subcommand takes none
    return { op: op as StringOp, values, nocase: nc === "1" }; // the form
  },
});
