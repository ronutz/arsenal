// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/timezone-meeting-planner/index.ts — engine + tool manifest.
// ============================================================================

export { plan, isValidZone, run, PlannerInputError } from "./compute";
export type { PlannerAnalysis, ZoneReading } from "./compute";
export { GOLDEN_VECTOR_SET_ID, GOLDEN_VECTORS, verifyVectors } from "./golden-vectors";
export type { PlannerVector, VerifyReport } from "./golden-vectors";

/** Tool manifest. `sources` are surfaced on the tool page as reference links. */
export const manifest = Object.freeze({
  toolSlug: "timezone-meeting-planner",
  sources: [
    { id: "iana-tz", label: "IANA — Time Zone Database", type: "reference", url: "https://www.iana.org/time-zones", access_date: "2026-07-18", scope: "the zone and DST rules the runtime carries", status: "active" },
    { id: "ecma-intl", label: "ECMA-402 — Intl.DateTimeFormat and time zone handling", type: "spec", url: "https://tc39.es/ecma402/#datetimeformat-objects", access_date: "2026-07-18", scope: "how the readings are computed", status: "active" },
    { id: "rfc3339", label: "RFC 3339 — Date and Time on the Internet: Timestamps", type: "rfc", url: "https://www.rfc-editor.org/rfc/rfc3339", access_date: "2026-07-18", scope: "the instant's input format", status: "active" },
  ],
});
