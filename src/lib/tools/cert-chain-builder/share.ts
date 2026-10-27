// ============================================================================
// src/lib/tools/cert-chain-builder/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the certificate chain builder (posture
// "input"): a link carries the certificates as pasted and, when the reader
// chose one, the "as of" date the validity is judged at. Without a chosen
// date the page judges at its own clock, so a link opened later judges at
// the opener's.
//
// The names: "certs" for the box and "asof" for the date, not "input". This
// page reads #input= with usePrefill (the handoff that fills the box), and a
// share that restores the box and the date together, validated as one, needs
// an arrival of its own (useShareArrival); with "input" among its names, both
// hooks would read the same value (ROLLOUT.md section 5). So the share uses
// names usePrefill never reads, and #input= keeps working exactly as before.
//
// One guard: a combined PEM file (fullchain plus key, as some servers load
// it) holds a private key the builder ignores. No link is offered then
// (blocked, "private-key"); the rule is src/lib/tools/x509/share.ts's.
//
// Arrival: the box and the date fill as a paste and a pick would; the page
// builds the path and checks the signatures in the browser, as it does for a
// paste. A date that is not YYYY-MM-DD makes the whole share malformed.
// ============================================================================

import { PEM_PRIVATE_KEY } from "../x509/share"; // the private-key boundary, one rule for the PKI tools
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box and the chosen date ("" for the page's clock). */
export interface CertChainBuilderShareState {
  /** The certificates as pasted. */
  certs: string;
  /** The "as of" date, YYYY-MM-DD, or "" when the page judges at its clock. */
  asOf: string;
}

/** A date as the date field gives it. */
const DATE = /^\d{4}-\d{2}-\d{2}$/; // anchored, fixed length: linear

/** Whether a text is a real calendar date in the date field's form (2026-02-30 is not). */
function isDate(s: string): boolean {
  if (!DATE.test(s)) return false; // the form
  const d = new Date(`${s}T00:00:00Z`); // read as UTC midnight
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s; // the same day back: a real date
} // isDate

/** The spec. */
export const CERT_CHAIN_BUILDER_SHARE: ShareSpec<CertChainBuilderShareState> = Object.freeze({
  tool: "cert-chain-builder", // the slug
  posture: "input", // the certificates as pasted
  carriesKey: "share.carries", // tools.cert-chain-builder.share.carries
  names: ["certs", "asof"], // #certs=...&asof=..., names usePrefill never reads
  /** The box and the date, when the box holds something and no private key. */
  encode(s: CertChainBuilderShareState): ShareEncoding {
    if (s.certs.trim() === "") return { ok: false, reason: "empty" } as const; // nothing pasted: the button is disabled
    if (PEM_PRIVATE_KEY.test(s.certs)) return { ok: false, reason: "blocked", code: "private-key" } as const; // never a key in a link
    return { ok: true, params: isDate(s.asOf) ? { certs: s.certs, asof: s.asOf } : { certs: s.certs } } as const; // the date only when chosen
  },
  /** The box, and an optional date in the date field's form. */
  decode(v: Readonly<Record<string, string | null>>): CertChainBuilderShareState | null {
    if (!v.certs || v.certs.trim() === "") return null; // nothing to fill
    const asOf = v.asof ?? ""; // absent: the page's clock
    if (asOf !== "" && !isDate(asOf)) return null; // a date the field cannot hold: malformed
    return { certs: v.certs, asOf }; // the state to fill
  },
});
