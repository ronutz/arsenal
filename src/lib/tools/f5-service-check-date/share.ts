// ============================================================================
// src/lib/tools/f5-service-check-date/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the F5 service check date tool (posture
// "derived", raised on 2026-10-27 from the inventory's "input"): the field
// also takes a pasted /config/bigip.license or tmsh show sys license output,
// and a licence holds the registration key, which F5's tmsh reference (sys
// license, read 2026-10-27) says may be re-used "to relicense this or another
// VE instance". The page reads one line out of such a paste and shows it
// ("Service check date : 20230611"), so a link carries exactly that line, the
// engine's own matchedText, never the paste; the receiving page extracts the
// same date from it and shows the same line. A version or a date typed on its
// own goes as typed (trimmed), since it is the whole input.
//
// Arrival: the value fills the field as typing would, and the page computes.
// Any non-empty value is accepted, exactly as typing is.
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state to encode: the field, and the line the page read out of a paste (null when it read none). */
export interface ServiceCheckShareState {
  /** The field as typed or pasted. */
  input: string;
  /** The "Service check date" line the engine extracted (result.extractedFrom.matchedText), or null. */
  extracted: string | null;
}

/** The state an arrival restores: the field. */
export interface ServiceCheckArrival {
  /** The value for the field. */
  input: string;
}

/** The spec. */
export const SERVICE_CHECK_SHARE: ShareSpec<ServiceCheckShareState, ServiceCheckArrival> = Object.freeze({
  tool: "f5-service-check-date", // the slug
  posture: "derived", // the version or date, or only the service check date line of a pasted licence
  carriesKey: "share.carries", // tools.f5-service-check-date.share.carries
  names: ["input"], // #input=
  /** The extracted line, or the typed value, when there is one. */
  encode(s: ServiceCheckShareState): ShareEncoding {
    if (s.input.trim() === "") return { ok: false, reason: "empty" } as const; // nothing entered: the button is disabled
    if (s.extracted !== null && s.extracted !== "") return { ok: true, params: { input: s.extracted } } as const; // the one line, never the licence
    return { ok: true, params: { input: s.input.trim() } } as const; // a version or a date, as typed
  },
  /** Any non-empty value: the page reads it as typed. */
  decode(v: Readonly<Record<string, string | null>>): ServiceCheckArrival | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the value, or nothing
  },
});
