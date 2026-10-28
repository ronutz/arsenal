// ============================================================================
// src/lib/tools/f5-irules-runtime-calculator/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the iRules runtime calculator (posture "input";
// the manifest: cycle counts and clock speeds are not sensitive): a link
// carries the four fields as typed, each left out when empty:
//
//   input     the timing output pasted from tmsh show ltm rule ... field-fmt
//   clock     the CPU clock speed in MHz
//   cores     the CPU core count
//   override  the optional Cycles/Sec override
//
// The timing output names the iRule and its events (myrule:HTTP_REQUEST),
// which the standard warning covers: anyone with the link can read it.
//
// Arrival: the four fields fill as typing would (one the link does not carry
// is emptied, as the sender had it), and the tables are computed. The timing
// output is accepted as pasted (the page says when it finds no events); a
// number field longer than 32 characters is not a number anyone types, and
// makes the whole share malformed: ignored, never half applied.
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The longest number field an arrival accepts. */
const MAX_NUMBER_CHARS = 32; // "3400.606" is 8

/** The state: the four fields as typed. */
export interface RuntimeCalculatorShareState {
  /** The timing output. */
  input: string;
  /** The clock speed in MHz. */
  clock: string;
  /** The core count. */
  cores: string;
  /** The Cycles/Sec override. */
  override: string;
}

/** The spec. */
export const IRULES_RUNTIME_CALCULATOR_SHARE: ShareSpec<RuntimeCalculatorShareState> = Object.freeze({
  tool: "f5-irules-runtime-calculator", // the slug
  posture: "input", // the fields as typed
  carriesKey: "share.carries", // tools.f5-irules-runtime-calculator.share.carries
  names: ["input", "clock", "cores", "override"], // #input=...&clock=3400.606&cores=2
  /** The timing output and the non-empty number fields; nothing while no timing output is pasted. */
  encode(s: RuntimeCalculatorShareState): ShareEncoding {
    if (s.input.trim() === "") return { ok: false, reason: "empty" } as const; // no timing output: no tables to share
    const p: Record<string, string> = { input: s.input }; // the timing output
    if (s.clock !== "") p.clock = s.clock; // the clock speed
    if (s.cores !== "") p.cores = s.cores; // the cores
    if (s.override !== "") p.override = s.override; // the override
    return { ok: true, params: p } as const; // the fields
  },
  /** A non-blank timing output; number fields of at most 32 characters; absent ones empty. */
  decode(v: Readonly<Record<string, string | null>>): RuntimeCalculatorShareState | null {
    if (!v.input || v.input.trim() === "") return null; // no timing output: nothing to compute
    const s = { input: v.input, clock: v.clock ?? "", cores: v.cores ?? "", override: v.override ?? "" }; // absent fields empty
    if ([s.clock, s.cores, s.override].some((x) => x.length > MAX_NUMBER_CHARS)) return null; // not a number anyone types
    return s; // the fields
  },
});
