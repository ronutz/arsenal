// ============================================================================
// src/lib/tools/f5-irules-string-extract/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the findstr, substr and getfield explainer
// (posture "input"): a link carries the command, the string and the command's
// argument fields, by name, each field left out when empty:
//
//   input       the string (#input=, the text a reader would paste)
//   command     findstr, substr or getfield
//   search, skip, terminator      findstr's fields
//   skip, terminator              substr's fields
//   separator, field              getfield's fields
//
// STRING_EXTRACT_ARGS is the page's own field table (the component reads it
// from here), so a field added to a command gets its link name here.
//
// Arrival: the command, the string and the fields fill as typing would (a
// field the link does not carry is emptied), and the page computes the result.
// An absent command is findstr, the page's first. An unknown command or a
// field the command does not take makes the whole share malformed: ignored,
// never half applied. Field text is accepted as typed (the page reports what
// F5 does not document, as it does for typing).
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns
import type { ExtractCommand } from "./compute"; // the three commands

/** One argument field after the string: its message key (and link name) and whether it may be left empty. */
export interface ExtractField {
  /** The message key (tools.f5-irules-string-extract.field.<key>), and the link name. */
  key: "search" | "skip" | "terminator" | "separator" | "field";
  /** May be left empty (trailing empty optional fields are not passed). */
  optional?: boolean;
}

/** Each command's argument fields after the string, in F5's order (the page's form). */
export const STRING_EXTRACT_ARGS: Readonly<Record<ExtractCommand, readonly ExtractField[]>> = Object.freeze({
  findstr: [{ key: "search" }, { key: "skip", optional: true }, { key: "terminator", optional: true }], // findstr <string> <search> [skip] [terminator]
  substr: [{ key: "skip" }, { key: "terminator", optional: true }], // substr <string> <skip> [terminator]
  getfield: [{ key: "separator" }, { key: "field" }], // getfield <string> <separator> <field>
});

/** Every argument field's link name. */
const ARG_NAMES = ["search", "skip", "terminator", "separator", "field"] as const; // all three commands' fields

/** The state: the command, the string, and one value per argument field (in the command's order). */
export interface StringExtractShareState {
  /** The command. */
  command: ExtractCommand;
  /** The string. */
  input: string;
  /** The argument fields' values, in the command's order. */
  args: string[];
}

/** The spec. */
export const IRULES_STRING_EXTRACT_SHARE: ShareSpec<StringExtractShareState> = Object.freeze({
  tool: "f5-irules-string-extract", // the slug
  posture: "input", // the form as filled in
  carriesKey: "share.carries", // tools.f5-irules-string-extract.share.carries
  names: ["input", "command", ...ARG_NAMES], // #input=...&command=findstr&search=user%3D&skip=5
  /** The command, the string and the non-empty fields; nothing while the string and every field are empty. */
  encode(s: StringExtractShareState): ShareEncoding {
    const fields: [string, string][] = STRING_EXTRACT_ARGS[s.command].map((f, i) => [f.key, s.args[i] ?? ""] as [string, string]).filter(([, x]) => x !== ""); // the fields that hold something
    if (s.input === "" && fields.length === 0) return { ok: false, reason: "empty" } as const; // nothing typed: nothing to share
    const p: Record<string, string> = s.input === "" ? {} : { input: s.input }; // the string first
    p.command = s.command; // then the command
    for (const [k, x] of fields) p[k] = x; // then its fields, in the page's order
    return { ok: true, params: p } as const; // the form
  },
  /** A known command (absent: findstr), only its own fields, and something to fill. */
  decode(v: Readonly<Record<string, string | null>>): StringExtractShareState | null {
    const command = v.command ?? "findstr"; // absent: the page's first command
    if (!Object.prototype.hasOwnProperty.call(STRING_EXTRACT_ARGS, command)) return null; // unknown: malformed
    const fields = STRING_EXTRACT_ARGS[command as ExtractCommand]; // its fields
    const own = new Set<string>(fields.map((f) => f.key)); // their names
    if (ARG_NAMES.some((n) => !own.has(n) && (v[n] ?? null) !== null)) return null; // a field of another command: malformed
    const s: StringExtractShareState = { command: command as ExtractCommand, input: v.input ?? "", args: fields.map((f) => v[f.key] ?? "") }; // absent fields empty
    return s.input === "" && s.args.every((x) => x === "") ? null : s; // nothing to fill, or the form
  },
});
