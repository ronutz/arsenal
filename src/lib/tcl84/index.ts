// ============================================================================
// src/lib/tcl84/index.ts
// ----------------------------------------------------------------------------
// TCL 8.4 STRING AND LIST INDICES - what "3", "end" and "end-1" mean.
//
// Every string and list command that takes a position reads it the same way
// (TclGetIntForIndex in tclUtil.c, Tcl 8.4.6), and that reader has a few
// properties worth knowing because they surprise people:
//
//   * an index is read like an integer, so "010" is OCTAL (8) and "0x10" is 16;
//     "08" is an error that mentions invalid octal;
//   * "end" is the last position and "end-N" counts back from it; Tcl 8.4 has
//     no "end+N" and no "M+N" arithmetic (both arrived in 8.5);
//   * the "end" test only compares as many letters as were typed, so "e" and
//     "en" are accepted as "end" - a quirk, faithfully reproduced;
//   * "end--1" is accepted and means one PAST the end.
//
// Out-of-range indices are not errors here; each command decides what to do
// with them (string range clamps, string index returns "").
// ============================================================================

import { isCSpace, looksLikeBadOctal, readInteger } from "./numbers";

/** An index that could not be read, with Tcl 8.4's message. */
export class TclIndexError extends Error {
  /** Build the error. */
  constructor(message: string) {
    // Error carries the message.
    super(message);
    // A stable name.
    this.name = "TclIndexError";
  }
}

/** How an index was understood, for explanations. */
export interface IndexReading {
  // The resolved position (may be negative or past the end).
  value: number;
  // "int" for a plain integer, "end" for end / end-N.
  form: "int" | "end";
  // For an integer: the base it was written in.
  base?: 8 | 10 | 16;
  // For end-N: the offset N subtracted from the last position.
  offset?: number;
}

/** The 32-bit int range an index must fit (C int in TclGetIntForIndex). */
const INT32_MAX = 2147483647;

/**
 * Tcl_GetInt for the "end-N" suffix: strtoul base 0 with white space, then
 * the value must fit a 32-bit int. Returns null when it is not an integer.
 */
function getInt(s: string): number | null {
  // Reuse the strict integer reader (same strtoul rules).
  const r = readInteger(s);
  // Not an integer at all.
  if (!r.ok) return null;
  // Out of int range: Tcl_GetInt fails ("integer value too large to represent").
  if (r.value > BigInt(INT32_MAX) || r.value < BigInt(-INT32_MAX - 1)) return null;
  // The int.
  return Number(r.value);
}

/**
 * Read an index the way TclGetIntForIndex does in Tcl 8.4.6, with `endValue`
 * the position "end" stands for (length - 1 for strings). Throws
 * TclIndexError with Tcl's own wording.
 */
export function readIndex(text: string, endValue: number): IndexReading {
  // The generic message Tcl uses for every failure.
  const fail = (): never => {
    // Base wording.
    let msg = `bad index "${text}": must be integer or end?-integer?`;
    // Tcl skips a leading "end" before checking for a bad octal suffix.
    const tail = text.startsWith("end") ? text.slice(3) : text;
    // Append the octal hint when it applies.
    if (looksLikeBadOctal(tail)) msg += " (looks like invalid octal number)";
    // Raise it.
    throw new TclIndexError(msg);
  };
  // The "end" family: the first letter must be "e", and the prefix must match.
  if (text[0] === "e" && "end".startsWith(text.slice(0, Math.min(text.length, 3)))) {
    // "e", "en" and "end" all mean end.
    if (text.length <= 3) return { value: endValue, form: "end", offset: 0 };
    // "end-N" (at least one character after the dash).
    if (text.length > 4 && text[3] === "-") {
      // Tcl_GetInt reads N (octal and hex allowed, white space allowed).
      const n = getInt(text.slice(4));
      // A bad N falls through to the integer attempt, which also fails.
      if (n !== null) return { value: endValue - n, form: "end", offset: n };
    }
  }
  // A plain integer (read through the 64-bit path, then narrowed).
  const r = readInteger(text);
  // Not an integer: Tcl's error.
  if (!r.ok) return fail();
  // Beyond 32 bits the C code truncates silently; decline rather than mislead.
  if (r.value > BigInt(INT32_MAX) || r.value < BigInt(-INT32_MAX - 1)) throw new TclIndexError(`index "${text}" is outside the 32-bit range Tcl 8.4 indexes with; not modelled`);
  // The integer index, with the base it was written in.
  return { value: Number(r.value), form: "int", base: r.base };
}

/** True when a string has leading or trailing white space (for explanations). */
export function hasOuterSpace(s: string): boolean {
  // Either end being C white space.
  return s.length > 0 && (isCSpace(s[0]) || isCSpace(s[s.length - 1]));
}
