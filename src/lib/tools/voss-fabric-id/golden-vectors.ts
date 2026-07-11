// ============================================================================
// src/lib/tools/voss-fabric-id/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors for the VOSS fabric-identifier decoder. The numeric values
// (I-SID hex, nickname <-> integer) were computed and verified against the
// definitions; the FAN I-SID (16777001) and the 02 system-id convention are
// grounded in Extreme documentation.
// ============================================================================

import { analyzeFabricId } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "voss-fabric-id/2026-07-11";

interface Vec {
  id: string;
  input: string;
  ok: boolean;
  kind?: string;
  isidHex?: string;
  nickValue?: number;
  nickFormatted?: string;
  local?: boolean;
  noteIncludes?: string;
  errorIncludes?: string;
}

const VECTORS: Vec[] = [
  { id: "isid-typical", input: "780001", ok: true, kind: "isid", isidHex: "0xBE6E1" },
  { id: "isid-max", input: "16777215", ok: true, kind: "isid", isidHex: "0xFFFFFF" },
  { id: "isid-fan", input: "16777001", ok: true, kind: "isid", noteIncludes: "FAN" },
  { id: "isid-over-range", input: "16777216", ok: false, errorIncludes: "24-bit" },
  { id: "isid-zero", input: "0", ok: false, errorIncludes: "1 to 16777215" },
  { id: "nickname-typical", input: "1.21.01", ok: true, kind: "nickname", nickValue: 73985, nickFormatted: "1.21.01" },
  { id: "nickname-server", input: "C.30.00", ok: true, kind: "nickname", nickValue: 798720 },
  { id: "nickname-zero", input: "0.00.00", ok: true, kind: "nickname", nickValue: 0, noteIncludes: "not a valid" },
  { id: "bmac-local", input: "02bb.0021.0001", ok: true, kind: "bmac", local: true },
  { id: "bmac-universal", input: "00bb.0021.0001", ok: true, kind: "bmac", local: false, noteIncludes: "02" },
  { id: "reject-garbage", input: "hello world", ok: false, errorIncludes: "Unrecognized" },
];

export function verifyVectors(): { passed: number; failed: number; failures: string[] } {
  const failures: string[] = [];
  let passed = 0;
  for (const v of VECTORS) {
    const r = analyzeFabricId(v.input);
    const errs: string[] = [];
    if (r.ok !== v.ok) errs.push(`ok: got ${r.ok} want ${v.ok}`);
    if (v.kind !== undefined && r.kind !== v.kind) errs.push(`kind: got ${r.kind} want ${v.kind}`);
    if (v.isidHex !== undefined && r.isid?.hex !== v.isidHex) errs.push(`isidHex: got ${r.isid?.hex} want ${v.isidHex}`);
    if (v.nickValue !== undefined && r.nickname?.value !== v.nickValue) errs.push(`nickValue: got ${r.nickname?.value} want ${v.nickValue}`);
    if (v.nickFormatted !== undefined && r.nickname?.formatted !== v.nickFormatted) errs.push(`nickFormatted: got ${r.nickname?.formatted} want ${v.nickFormatted}`);
    if (v.local !== undefined && r.bmac?.local !== v.local) errs.push(`local: got ${r.bmac?.local} want ${v.local}`);
    if (v.noteIncludes !== undefined && !(r.notes ?? []).some((n) => n.includes(v.noteIncludes as string))) errs.push(`note missing ${JSON.stringify(v.noteIncludes)}`);
    if (v.errorIncludes !== undefined && !(r.error?.message ?? "").includes(v.errorIncludes)) errs.push(`error missing ${JSON.stringify(v.errorIncludes)}`);
    if (errs.length) failures.push(`[${v.id}] ${errs.join("; ")}`);
    else passed++;
  }
  return { passed, failed: failures.length, failures };
}

export const goldenVectors = VECTORS.map((v) => v.id);
