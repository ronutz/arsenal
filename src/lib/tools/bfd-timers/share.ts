// ============================================================================
// src/lib/tools/bfd-timers/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the BFD timer calculator and packet decoder
// (posture "input", with one blocked case). A link carries, after the "#":
//   Decode mode  the packet's hex as typed, as the primary value
//                (#input=20+c0+03+18+...);
//   Timers mode  both systems' fields as typed, by short names (atx, arx,
//                amult, aecho, ademand, btx, ...), the session state when it
//                is not Up (up=0) and the path when it is multihop.
// The presence of "input" says which mode a link opens; a link that mixes the
// two is malformed. The manifest: "timer values and a captured BFD header are
// not sensitive; authentication data is never displayed".
//
// THE BLOCKED CASE (added in this rollout, with its reason): a Control packet
// with the Authentication Present (A) bit set and bytes past the 24-byte
// Mandatory Section carries an Authentication Section: with Simple Password
// authentication (RFC 5880 section 4.2) that is the password itself. The page
// never shows those bytes; a link of the hex as typed would carry them, so no
// link is offered and the popover says why (code "auth-data"). The rest of the
// tool keeps the inventory's posture, "input".
//
// Arrival (useShareArrival in BfdTimersTool): the mode opens and its fields
// fill as typing would (a timers link replaces both systems, the state and the
// path; a decode link replaces the hex); the other mode keeps its values, and
// the page computes. Field text is left to the engine, which refuses a
// malformed interval or hex with its own message, as typing would.
// ============================================================================

import { run, type DecodeResult } from "./compute"; // the decoder, for the blocked check when the page has not decoded
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape

/** One system's form fields, as typed (the page's SystemForm). */
export interface BfdSystemShare {
  /** Desired Min TX Interval. */
  tx: string;
  /** Required Min RX Interval. */
  rx: string;
  /** Detect Mult. */
  mult: string;
  /** Required Min Echo RX Interval ("" when not given). */
  echo: string;
  /** Demand mode requested. */
  demand: boolean;
}

/** What an arrival restores. */
export type BfdShareState =
  | { mode: "timers"; a: BfdSystemShare; b: BfdSystemShare; sessionUp: boolean; path: "single-hop" | "multihop" } // the calculator
  | { mode: "decode"; packet: string }; // the decoder

/** What the page encodes: the state, plus (decode mode) the result it already has, which saves a second decode. */
export type BfdShareInput = BfdShareState | { mode: "decode"; packet: string; decoded?: DecodeResult };

/** The text fields of a system: the form's key and the suffix of its link name. */
const SYSTEM_TEXT: readonly { key: "tx" | "rx" | "mult" | "echo"; suffix: string; required: boolean }[] = [
  { key: "tx", suffix: "tx", required: true }, // Desired Min TX
  { key: "rx", suffix: "rx", required: true }, // Required Min RX
  { key: "mult", suffix: "mult", required: true }, // Detect Mult
  { key: "echo", suffix: "echo", required: false }, // Required Min Echo RX (optional)
];

/** The timers names, both systems, then the state and the path. */
const TIMER_NAMES: readonly string[] = [...["a", "b"].flatMap((s) => [...SYSTEM_TEXT.map((f) => s + f.suffix), `${s}demand`]), "up", "path"]; // atx ... bdemand, up, path

/** The two paths; the first is the default. */
const PATHS: readonly ("single-hop" | "multihop")[] = ["single-hop", "multihop"]; // as the page offers them

/**
 * Whether a decoded packet carries authentication data a link must not carry: the A bit set and bytes past the
 * 24-byte Mandatory Section (the Authentication Section, whose data the page never shows).
 * @param r the decode result
 * @returns true when no link may carry the packet as typed
 */
export function bfdPacketHoldsAuthData(r: DecodeResult): boolean {
  return r.flags.authenticationPresent && r.bytes > 24; // RFC 5880 section 4.1: the section follows byte 24
} // bfdPacketHoldsAuthData

/**
 * Encode a decode-mode share from a result the page already has.
 * @param packet the hex as typed
 * @param r the page's decode result of that text
 * @returns the hex as the one value, or blocked when it holds authentication data
 */
export function encodeBfdDecoded(packet: string, r: DecodeResult): ShareEncoding {
  if (bfdPacketHoldsAuthData(r)) return { ok: false, reason: "blocked", code: "auth-data" }; // the popover says why
  return { ok: true, params: { input: packet } }; // the hex as typed
} // encodeBfdDecoded

/** The spec. */
export const BFD_TIMERS_SHARE: ShareSpec<BfdShareInput, BfdShareState> = Object.freeze({
  tool: "bfd-timers", // the slug
  posture: "input", // the inputs as typed, with the standard warning; one blocked case above
  carriesKey: "share.carries", // tools.bfd-timers.share.carries (an ICU select on the mode)
  names: ["input", ...TIMER_NAMES], // #input=<hex>, or the timers names
  /** Decode mode: the hex (or blocked); Timers mode: the fields typed; nothing for an empty form. */
  encode(state: BfdShareInput): ShareEncoding {
    if (state.mode === "decode") { // the decoder
      if (state.packet.trim() === "") return { ok: false, reason: "empty" }; // nothing to share
      let r: DecodeResult | undefined = "decoded" in state ? state.decoded : undefined; // the page's own result, if given
      if (!r) { try { r = run({ mode: "decode", packet: state.packet }) as DecodeResult; } catch { return { ok: false, reason: "empty" }; } } // no result: nothing to share
      return encodeBfdDecoded(state.packet, r); // the hex, or blocked
    } // decode
    const params: Record<string, string> = {}; // the timers values
    for (const [s, sys] of [["a", state.a], ["b", state.b]] as const) { // each system
      for (const f of SYSTEM_TEXT) if (sys[f.key].trim() !== "") params[s + f.suffix] = sys[f.key]; // as typed
      if (sys.demand) params[`${s}demand`] = "1"; // Demand requested
    } // systems
    if (Object.keys(params).length === 0) return { ok: false, reason: "empty" }; // an empty form: nothing to share
    if (!state.sessionUp) params.up = "0"; // not Up (Up is the default)
    if (state.path !== PATHS[0]) params.path = state.path; // multihop (single-hop is the default)
    return { ok: true, params }; // the values
  },
  /** A decode link (input only) or a complete timers link; a mix, an unknown path or a switch other than 1 or 0 is ignored. */
  decode(values: Readonly<Record<string, string | null>>): BfdShareState | null {
    const has = (n: string): boolean => values[n] !== null && values[n] !== undefined; // carried
    if (has("input")) { // a decode link
      if (TIMER_NAMES.some(has)) return null; // two modes in one link: malformed
      const packet = values.input as string; // the hex
      return packet.trim() === "" ? null : { mode: "decode", packet }; // the hex as typed
    } // decode
    /** One system back, or null when a required field is missing or a switch is malformed. */
    const system = (s: string): BfdSystemShare | null => {
      const text: Record<string, string> = {}; // the text fields
      for (const f of SYSTEM_TEXT) { // each field
        const v = values[s + f.suffix] ?? ""; // its value, "" when absent
        if (f.required && v.trim() === "") return null; // the page computes only with all three
        text[f.key] = v; // as typed
      } // fields
      const d = values[`${s}demand`] ?? "0"; // the switch, off when absent
      if (d !== "0" && d !== "1") return null; // a switch is 1 or 0
      return { tx: text.tx, rx: text.rx, mult: text.mult, echo: text.echo, demand: d === "1" }; // the system
    }; // system
    const a = system("a"); // system A
    const b = system("b"); // system B
    if (!a || !b) return null; // incomplete: nothing to fill
    const up = values.up ?? "1"; // Up when absent
    if (up !== "0" && up !== "1") return null; // a switch is 1 or 0
    const path = (values.path ?? PATHS[0]) as "single-hop" | "multihop"; // single-hop when absent
    if (!PATHS.includes(path)) return null; // not a path the page offers
    return { mode: "timers", a, b, sessionUp: up === "1", path }; // the state to fill
  },
});
