// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/bit-numbering-and-order/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the bit numbering and bit order tool (posture
// "input", the manifest's shareSafetyDefault "param": a number, a printed bit
// string or a MAC address is not sensitive, as for the OUI lookup). The link
// carries, after the "#":
//   always      input (the field as typed), mode (value, printed or mac)
//   value       width when typed, layout when not none, and numbering, from
//               and to when a field is asked for (to only when typed)
//   printed     order, layout when not none, and the field as in value mode
//   mac         form
// A link exists once the page shows a reading; an input the engine refuses has
// none. The other modes' fields are not carried.
//
// Arrival (useShareArrival in BitNumberingAndOrderTool): the mode and its
// fields are set as typing would set them (an absent optional field is blank
// or its default), the other modes keep their values, and the page computes.
// An unknown mode, layout, order, form or numbering, a field of another mode,
// a width or bit number that is not one to three digits, a "to" without a
// "from", a numbering without a "from", or a value over one line or longer
// than the engine reads makes the whole share malformed. Anything else is left
// to the engine, which refuses a bad value with its own message, exactly as
// typing would.
// ============================================================================

import { run, LAYOUTS, MAX_FIELD, type BitRequest } from "./compute"; // the page's own engine, to know whether there is a reading
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state an arrival restores and the page encodes: the form as typed. */
export interface BitShareState {
  /** The mode. */
  mode: "value" | "printed" | "mac";
  /** The field as typed. */
  input: string;
  /** Value mode: the width as typed ("" for inferred). */
  width: string;
  /** Value and printed modes: the layout ("none" for none). */
  layout: string;
  /** Printed mode: the order. */
  order: "msb-first" | "lsb-first";
  /** MAC mode: how the address is written. */
  form: "canonical" | "reversed";
  /** Value and printed modes: the numbering of the field. */
  numbering: "lsb0" | "msb0" | "one";
  /** Value and printed modes: the field's first bit as typed ("" for no field). */
  from: string;
  /** Value and printed modes: its last bit as typed ("" for one bit). */
  to: string;
}

/** The names each mode may carry besides input and mode. */
const MODE_NAMES: Readonly<Record<BitShareState["mode"], readonly string[]>> = Object.freeze({
  value: ["width", "layout", "numbering", "from", "to"], // value mode
  printed: ["order", "layout", "numbering", "from", "to"], // printed mode
  mac: ["form"], // MAC mode
}); // by mode

/** Every name the link uses, "input" first. */
const NAMES = Object.freeze(["input", "mode", "width", "layout", "order", "form", "numbering", "from", "to"]); // the fragment names

/**
 * The engine request for a state, as the page builds it.
 * @param s the state
 * @returns the request
 */
export function requestOf(s: BitShareState): BitRequest {
  if (s.mode === "mac") return { mode: "mac", input: s.input, form: s.form }; // the MAC
  const field = s.from.trim() === "" ? {} : { numbering: s.numbering, from: s.from, to: s.to }; // the field, when asked for
  if (s.mode === "printed") return { mode: "printed", input: s.input, order: s.order, layout: s.layout, ...field }; // printed
  return { mode: "value", input: s.input, width: s.width, layout: s.layout, ...field }; // value
} // requestOf

/**
 * Whether the engine reads a state (a link exists only then).
 * @param s the state
 * @returns true when run() gives a reading
 */
function reads(s: BitShareState): boolean {
  try {
    run(requestOf(s)); // the page's own engine
    return true; // a reading
  } catch {
    return false; // refused: no link
  } // ran
} // reads

/**
 * The link's values for a state.
 * @param s the state
 * @param hasReading whether the page shows a reading for it (the page passes what it computed; the spec computes it)
 * @returns the encoding
 */
export function encodeBitShare(s: BitShareState, hasReading?: boolean): ShareEncoding {
  if (s.input.trim() === "" || !(hasReading ?? reads(s))) return { ok: false, reason: "empty" }; // nothing to share yet
  const params: Record<string, string> = { input: s.input, mode: s.mode }; // always
  if (s.mode === "mac") { params.form = s.form; return { ok: true, params }; } // the MAC's form
  if (s.mode === "value" && s.width.trim() !== "") params.width = s.width.trim(); // the width when typed
  if (s.mode === "printed") params.order = s.order; // the printed order, always
  if (s.layout !== "none" && s.layout !== "") params.layout = s.layout; // the layout when one is chosen
  if (s.from.trim() !== "") { // the field
    params.numbering = s.numbering; // its numbering
    params.from = s.from.trim(); // its first bit
    if (s.to.trim() !== "") params.to = s.to.trim(); // its last bit when typed
  } // field
  return { ok: true, params }; // the values
} // encodeBitShare

/** One to three digits (a width or a bit number). */
const SMALL_NUMBER = /^[0-9]{1,3}$/; // 0 to 999; the engine refuses what is out of range

/**
 * The state for an arriving link's values, or null when malformed.
 * @param v the values read from the fragment
 * @returns the state
 */
export function decodeBitShare(v: Readonly<Record<string, string | null>>): BitShareState | null {
  const mode = v.mode; // the mode
  if (mode !== "value" && mode !== "printed" && mode !== "mac") return null; // always written
  const input = v.input; // the field
  if (!input || input.trim() === "" || input.includes("\n") || input.length > MAX_FIELD) return null; // one line, bounded
  for (const name of NAMES.slice(2)) if (v[name] != null && !MODE_NAMES[mode].includes(name)) return null; // a field of another mode
  const layout = v.layout ?? "none"; // none when absent
  if (!(LAYOUTS as readonly string[]).includes(layout)) return null; // a known layout
  const order = v.order ?? "msb-first"; // the usual order when absent
  if (order !== "msb-first" && order !== "lsb-first") return null; // a known order
  const form = v.form ?? "canonical"; // canonical when absent
  if (form !== "canonical" && form !== "reversed") return null; // a known form
  const numbering = v.numbering ?? "lsb0"; // LSB 0 when absent
  if (numbering !== "lsb0" && numbering !== "msb0" && numbering !== "one") return null; // a known numbering
  for (const name of ["width", "from", "to"]) if (v[name] != null && !SMALL_NUMBER.test(v[name] as string)) return null; // digits only
  if (v.to != null && v.from == null) return null; // a last bit needs a first
  if (v.numbering != null && v.from == null) return null; // a numbering belongs to a field
  return { mode, input, width: v.width ?? "", layout, order, form, numbering, from: v.from ?? "", to: v.to ?? "" }; // the state
} // decodeBitShare

/** The spec. */
export const BIT_NUMBERING_SHARE: ShareSpec<BitShareState> = Object.freeze({
  tool: "bit-numbering-and-order", // the slug
  posture: "input", // a number, bits or a MAC address: not sensitive
  carriesKey: "share.carries", // tools.bit-numbering-and-order.share.carries
  names: NAMES, // "input" first
  encode: (s: BitShareState) => encodeBitShare(s), // state to values (the engine decides whether there is a reading)
  decode: decodeBitShare, // values to state
}); // the spec
