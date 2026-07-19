// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/time-calculator/index.ts — engine surface + tool manifest.
// ============================================================================

export { diff, shift, parseDuration, run, TimeInputError } from "./compute";
export type { TimeAnalysis, DurationBreakdown, DurationTotals } from "./compute";
export { GOLDEN_VECTOR_SET_ID, GOLDEN_VECTORS, verifyVectors } from "./golden-vectors";
export type { TimeVector, VerifyReport } from "./golden-vectors";

/** Tool manifest. `sources` are surfaced on the tool page as reference links. */
export const manifest = Object.freeze({
  toolSlug: "time-calculator",
  sources: [
    { id: "rfc3339", label: "RFC 3339 — Date and Time on the Internet: Timestamps", type: "rfc", url: "https://www.rfc-editor.org/rfc/rfc3339", access_date: "2026-07-18", scope: "timestamp format and offsets", status: "active" },
    { id: "iso8601-durations", label: "ISO 8601 — durations (PnDTnHnMnS)", type: "spec", url: "https://www.iso.org/iso-8601-date-and-time-format.html", access_date: "2026-07-18", scope: "duration syntax; why P1M is calendar arithmetic", status: "active" },
    { id: "posix-epoch", label: "POSIX.1-2017 — Seconds Since the Epoch", type: "spec", url: "https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap04.html#tag_04_16", access_date: "2026-07-18", scope: "the UTC timeline the arithmetic runs on", status: "active" },
  ],
});
