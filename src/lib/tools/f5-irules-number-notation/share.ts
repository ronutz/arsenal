// ============================================================================
// src/lib/tools/f5-irules-number-notation/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the iRules number notation converter (posture
// "input"): a link carries the value as typed (#input=, spaces kept: they are
// part of the value Tcl reads) and the value it is compared with (`other`,
// left out when that field is empty). A number written in an iRule is not
// sensitive; the standard warning says the rest.
//
// Arrival: both fields fill as typing would, and the page reads the value. An
// absent `other` leaves that field empty, as the sender had it. Any non-empty
// value is accepted, as typing is: the page says what Tcl makes of it.
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the two fields. */
export interface NumberNotationShareState {
  /** The value, as written in the iRule. */
  input: string;
  /** The value it is compared with. */
  other: string;
}

/** The spec. */
export const IRULES_NUMBER_NOTATION_SHARE: ShareSpec<NumberNotationShareState> = Object.freeze({
  tool: "f5-irules-number-notation", // the slug
  posture: "input", // the two values as typed
  carriesKey: "share.carries", // tools.f5-irules-number-notation.share.carries
  names: ["input", "other"], // #input=010&other=8
  /** The value and, when set, the one compared with; nothing while the value is empty (the page reads nothing). */
  encode(s: NumberNotationShareState): ShareEncoding {
    if (s.input === "") return { ok: false, reason: "empty" } as const; // nothing typed (a lone space is a value Tcl reads)
    return { ok: true, params: s.other === "" ? { input: s.input } : { input: s.input, other: s.other } } as const; // as typed
  },
  /** A non-empty value; an absent `other` is empty. */
  decode(v: Readonly<Record<string, string | null>>): NumberNotationShareState | null {
    if (!v.input) return null; // no value: nothing to read
    return { input: v.input, other: v.other ?? "" }; // as typed
  },
});
