// ============================================================================
// src/lib/tools/f5-bigd-thread-calculator/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the BigD thread calculator (posture "input"): a
// link carries the one line as typed ("8 r10900"), a vCPU count with an
// optional platform or "ht" / "normal", which the manifest calls
// non-sensitive.
//
// Arrival: the line fills the field as typing would, and the page computes.
// Any non-empty line is accepted, exactly as typing is: a line the engine
// cannot read shows the page's own error message.
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the field. */
export interface BigdShareState {
  /** The line as typed. */
  input: string;
}

/** The spec. */
export const BIGD_SHARE: ShareSpec<BigdShareState> = Object.freeze({
  tool: "f5-bigd-thread-calculator", // the slug
  posture: "input", // the line as typed
  carriesKey: "share.carries", // tools.f5-bigd-thread-calculator.share.carries
  names: ["input"], // #input=
  /** The line, when it holds something. */
  encode(s: BigdShareState): ShareEncoding {
    if (s.input.trim() === "") return { ok: false, reason: "empty" } as const; // nothing typed: the button is disabled
    return { ok: true, params: { input: s.input } } as const; // the one value
  },
  /** Any non-empty line: the page reads it as typed. */
  decode(v: Readonly<Record<string, string | null>>): BigdShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the line, or nothing
  },
});
