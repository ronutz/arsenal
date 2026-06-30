// ============================================================================
// src/lib/tools/syslog-pri-decoder/golden-vectors.ts
// ----------------------------------------------------------------------------
// Vectors for the syslog PRI decoder and encoder. Decode vectors include the
// two worked examples from RFC 5424 (<34> and <165>), the boundaries, the
// angle-bracket form, and the rejection cases. Encode vectors check the inverse
// and round-tripping.
// ============================================================================

import { decodePri, encodePri } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "syslog-pri-decoder-golden-v1";

export interface DecVector {
  id: string;
  description: string;
  input: string;
  expectOk: boolean;
  expectPri?: number;
  expectFacility?: number;
  expectSeverity?: number;
  expectFacilityNote?: boolean;
  expectErrorIncludes?: string;
}

export interface EncVector {
  id: string;
  description: string;
  facility: number;
  severity: number;
  expectOk: boolean;
  expectPri?: number;
  expectWire?: string;
  expectErrorIncludes?: string;
}

export const DECODE_VECTORS: DecVector[] = [
  { id: "rfc-34", description: "RFC 5424 example <34>: facility 4 (auth), severity 2 (crit)", input: "<34>", expectOk: true, expectPri: 34, expectFacility: 4, expectSeverity: 2 },
  { id: "rfc-165", description: "RFC 5424 example <165>: facility 20 (local4), severity 5 (notice)", input: "165", expectOk: true, expectPri: 165, expectFacility: 20, expectSeverity: 5 },
  { id: "default-134", description: "The common default PRI 134: local0, info", input: "134", expectOk: true, expectPri: 134, expectFacility: 16, expectSeverity: 6 },
  { id: "min-0", description: "PRI 0: kern, emerg (boundary)", input: "0", expectOk: true, expectPri: 0, expectFacility: 0, expectSeverity: 0 },
  { id: "max-191", description: "PRI 191: local7, debug (boundary)", input: "191", expectOk: true, expectPri: 191, expectFacility: 23, expectSeverity: 7 },
  { id: "brackets", description: "Angle brackets are accepted and stripped", input: "<23>", expectOk: true, expectPri: 23, expectFacility: 2, expectSeverity: 7 },
  { id: "varies-12-15", description: "PRI in the 12-15 facility band is flagged as implementation-varying", input: "100", expectOk: true, expectPri: 100, expectFacility: 12, expectSeverity: 4, expectFacilityNote: true },
  { id: "over-range", description: "PRI 192 is rejected as out of range", input: "192", expectOk: false, expectErrorIncludes: "out of range" },
  { id: "leading-zero", description: "Leading zeros are rejected", input: "<034>", expectOk: false, expectErrorIncludes: "leading zeros" },
  { id: "non-numeric", description: "Non-numeric input is rejected", input: "kern.info", expectOk: false, expectErrorIncludes: "0 to 191" },
  { id: "empty", description: "Empty input returns a prompt, not a crash", input: "  ", expectOk: false, expectErrorIncludes: "Enter a PRI" },
];

export const ENCODE_VECTORS: EncVector[] = [
  { id: "enc-rfc-165", description: "Encode local4 (20) + notice (5) = 165", facility: 20, severity: 5, expectOk: true, expectPri: 165, expectWire: "<165>" },
  { id: "enc-default", description: "Encode local0 (16) + info (6) = 134", facility: 16, severity: 6, expectOk: true, expectPri: 134, expectWire: "<134>" },
  { id: "enc-min", description: "Encode kern (0) + emerg (0) = 0", facility: 0, severity: 0, expectOk: true, expectPri: 0, expectWire: "<0>" },
  { id: "enc-max", description: "Encode local7 (23) + debug (7) = 191", facility: 23, severity: 7, expectOk: true, expectPri: 191, expectWire: "<191>" },
  { id: "enc-bad-facility", description: "Facility 24 is rejected", facility: 24, severity: 0, expectOk: false, expectErrorIncludes: "Facility must be" },
  { id: "enc-bad-severity", description: "Severity 8 is rejected", facility: 0, severity: 8, expectOk: false, expectErrorIncludes: "Severity must be" },
];

export function verifyVectors(): { passed: number; failed: number; failures: string[] } {
  const failures: string[] = [];
  let passed = 0;

  for (const v of DECODE_VECTORS) {
    const r = decodePri(v.input);
    const errs: string[] = [];
    if (r.ok !== v.expectOk) errs.push(`ok: got ${r.ok} want ${v.expectOk}`);
    if (v.expectPri !== undefined && r.pri !== v.expectPri) errs.push(`pri: got ${r.pri} want ${v.expectPri}`);
    if (v.expectFacility !== undefined && r.facility?.code !== v.expectFacility) errs.push(`facility: got ${r.facility?.code} want ${v.expectFacility}`);
    if (v.expectSeverity !== undefined && r.severity?.code !== v.expectSeverity) errs.push(`severity: got ${r.severity?.code} want ${v.expectSeverity}`);
    if (v.expectFacilityNote !== undefined && !!r.facilityNote !== v.expectFacilityNote) errs.push(`facilityNote: got ${!!r.facilityNote} want ${v.expectFacilityNote}`);
    if (v.expectErrorIncludes !== undefined && !(r.error?.message ?? "").includes(v.expectErrorIncludes)) errs.push(`error missing ${JSON.stringify(v.expectErrorIncludes)}`);
    if (errs.length) failures.push(`[decode:${v.id}] ${errs.join("; ")}`);
    else passed++;
  }

  for (const v of ENCODE_VECTORS) {
    const r = encodePri(v.facility, v.severity);
    const errs: string[] = [];
    if (r.ok !== v.expectOk) errs.push(`ok: got ${r.ok} want ${v.expectOk}`);
    if (v.expectPri !== undefined && r.pri !== v.expectPri) errs.push(`pri: got ${r.pri} want ${v.expectPri}`);
    if (v.expectWire !== undefined && r.wire !== v.expectWire) errs.push(`wire: got ${r.wire} want ${v.expectWire}`);
    if (v.expectErrorIncludes !== undefined && !(r.error?.message ?? "").includes(v.expectErrorIncludes)) errs.push(`error missing ${JSON.stringify(v.expectErrorIncludes)}`);
    if (errs.length) failures.push(`[encode:${v.id}] ${errs.join("; ")}`);
    else passed++;
  }

  return { passed, failed: failures.length, failures };
}
