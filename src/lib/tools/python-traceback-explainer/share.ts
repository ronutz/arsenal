// ============================================================================
// src/lib/tools/python-traceback-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the Python traceback explainer (posture
// "derived"): a link carries the redacted copy the page already offers (user
// names in home directories replaced by <user>, every secrets-check finding by
// [redacted]; shareableTraceback in compute.ts), never the paste as typed.
// When some lines were too long for the secrets check, no link is offered and
// the page says why.
//
// Arrival: the copy fills the box as a paste would, and the page explains it.
// ============================================================================

import { explainTraceback, shareableFromReading, type TracebackResult } from "./compute"; // the reading and the derived form
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape

/**
 * Encode from a reading the page already made (the page passes its own; the spec's encode makes one).
 * @param r the reading
 * @returns the redacted copy as the one value, nothing, or blocked
 */
export function encodeTracebackReading(r: TracebackResult): ShareEncoding {
  const s = shareableFromReading(r); // the copy the page offers
  if (s.ok) return { ok: true, params: { input: s.text } }; // the one value
  if (s.reason === "secrets-skipped") return { ok: false, reason: "blocked", code: "secrets-skipped", values: { n: s.skipped, max: s.max } }; // said on the page
  return { ok: false, reason: "empty" }; // nothing read
} // encodeTracebackReading

/** The state: the paste (encode) or the redacted copy (arrival). */
export interface PythonTracebackShareState {
  /** The text in the box. */
  input: string;
}

/** The spec. */
export const PYTHON_TRACEBACK_SHARE: ShareSpec<PythonTracebackShareState> = Object.freeze({
  tool: "python-traceback-explainer", // the slug
  posture: "derived", // the redacted copy only
  carriesKey: "share.carries", // tools.python-traceback-explainer.share.carries
  names: ["input"], // #input=
  /** The redacted copy, or nothing, or blocked when lines went unchecked. */
  encode(state: PythonTracebackShareState) {
    return encodeTracebackReading(explainTraceback(state.input)); // read, then the copy
  },
  /** Any non-empty text: the page reads it as a paste (and refuses it there, with the reason, if it is not a traceback). */
  decode(values: Readonly<Record<string, string | null>>) {
    return values.input ? { input: values.input } : null; // the text, or nothing
  },
});
