// ============================================================================
// src/lib/tools/epoch/index.ts
// ----------------------------------------------------------------------------
// Public surface of the arsenal-local Unix-time converter. Pure and
// deterministic; liftable into an open library later.
// ============================================================================

export { analyzeEpoch, run, EpochInputError } from "./compute";
export type { EpochAnalysis, EpochUnit, InputKind } from "./compute";
export {
  GOLDEN_VECTOR_SET_ID,
  GOLDEN_VECTORS,
  verifyVectors,
} from "./golden-vectors";
export type { EpochVector, VerifyReport } from "./golden-vectors";

/** Tool manifest. `sources` are surfaced on the tool page as reference links. */
export const manifest = Object.freeze({
  toolSlug: "epoch",
  sources: [
    { id: "posix-epoch", label: "POSIX.1-2017 — Seconds Since the Epoch (IEEE Std 1003.1)", type: "spec", url: "https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap04.html#tag_04_16", access_date: "2026-06-29", scope: "definition of Unix time", status: "active" },
    { id: "rfc3339", label: "RFC 3339 — Date and Time on the Internet: Timestamps", type: "rfc", url: "https://www.rfc-editor.org/rfc/rfc3339", access_date: "2026-06-29", scope: "ISO 8601 profile, offsets", status: "active" },
    { id: "rfc9110", label: "RFC 9110 §5.6.7 — HTTP-date format", type: "rfc", url: "https://www.rfc-editor.org/rfc/rfc9110#section-5.6.7", access_date: "2026-06-29", scope: "HTTP/IMF-fixdate format", status: "active" },
    { id: "ecma-time", label: "ECMAScript — Time Values and the Date range (±8.64e15 ms)", type: "spec", url: "https://tc39.es/ecma262/#sec-time-values-and-time-range", access_date: "2026-06-29", scope: "representable date range", status: "active" },
  ],
});
