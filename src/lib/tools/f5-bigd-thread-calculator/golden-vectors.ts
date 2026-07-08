// ============================================================================
// src/lib/tools/f5-bigd-thread-calculator/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the BigD thread calculator.
//
// Accept vectors pin (a) the two verbatim F5 formulas (techdocs 21.1.0 "BigD
// enhancements for large-scale configurations") and (b) the platform-to-
// hyperthreading map (clouddocs rSeries/VELOS platform docs + K15003), both
// fetched 2026-07-08, against concrete inputs in exact and floor form, so any
// drift in arithmetic, parsing, or the platform table breaks the build.
// Reject vectors assert stable error codes. verifyVectors() runs the set.
// ============================================================================

import {
  run,
  BigdCalcError,
  type BigdCalcErrorCode,
  type SystemMode,
  type PlatformId,
} from "./compute";

export const GOLDEN_VECTOR_SET_ID = "f5-bigd-thread-calculator/2026-07-08b";

interface AcceptVector {
  id: string;
  description: string;
  input: string;
  expect: {
    vcpus: number;
    requested: SystemMode | null;
    modeSource: "explicit" | "platform" | null;
    platformId: PlatformId | null;
    appliesTo21x: boolean | null; // null when no platform token was given
    htExact: number;
    htFloor: number;
    normalExact: number;
    normalFloor: number;
  };
}

interface RejectVector {
  id: string;
  description: string;
  input: string;
  expectCode: BigdCalcErrorCode;
}

export const BIGD_CALC_GOLDEN_VECTORS: AcceptVector[] = [
  // ---- The formulas themselves (mode words, no platform) ----
  {
    id: "ht-8",
    description: "8 vCPUs hyperthreaded: (8×6)÷10 = 4.8 exact, 4 whole threads",
    input: "8 ht",
    expect: { vcpus: 8, requested: "ht", modeSource: "explicit", platformId: null, appliesTo21x: null, htExact: 4.8, htFloor: 4, normalExact: 3, normalFloor: 3 },
  },
  {
    id: "ht-10",
    description: "10 vCPUs hyperthreaded lands whole: (10×6)÷10 = 6",
    input: "10 hyperthreaded",
    expect: { vcpus: 10, requested: "ht", modeSource: "explicit", platformId: null, appliesTo21x: null, htExact: 6, htFloor: 6, normalExact: 4, normalFloor: 4 },
  },
  {
    id: "ht-40",
    description: "40 vCPUs hyperthreaded: 24 threads",
    input: "40 HT",
    expect: { vcpus: 40, requested: "ht", modeSource: "explicit", platformId: null, appliesTo21x: null, htExact: 24, htFloor: 24, normalExact: 19, normalFloor: 19 },
  },
  {
    id: "normal-4",
    description: "4 vCPUs normal: (4÷2)−1 = 1 thread",
    input: "4 normal",
    expect: { vcpus: 4, requested: "normal", modeSource: "explicit", platformId: null, appliesTo21x: null, htExact: 2.4, htFloor: 2, normalExact: 1, normalFloor: 1 },
  },
  {
    id: "normal-16",
    description: "16 vCPUs normal: 7 threads",
    input: "16 cores normal",
    expect: { vcpus: 16, requested: "normal", modeSource: "explicit", platformId: null, appliesTo21x: null, htExact: 9.6, htFloor: 9, normalExact: 7, normalFloor: 7 },
  },
  {
    id: "normal-2-edge",
    description: "2 vCPUs normal: the formula's honest edge, (2÷2)−1 = 0",
    input: "2 normal",
    expect: { vcpus: 2, requested: "normal", modeSource: "explicit", platformId: null, appliesTo21x: null, htExact: 1.2, htFloor: 1, normalExact: 0, normalFloor: 0 },
  },
  {
    id: "bare-number",
    description: "a bare vCPU count computes both formulas with no requested mode",
    input: "6",
    expect: { vcpus: 6, requested: null, modeSource: null, platformId: null, appliesTo21x: null, htExact: 3.6, htFloor: 3, normalExact: 2, normalFloor: 2 },
  },
  {
    id: "vcpus-word",
    description: "unit words are tolerated: '12 vCPUs ht'",
    input: "12 vCPUs ht",
    expect: { vcpus: 12, requested: "ht", modeSource: "explicit", platformId: null, appliesTo21x: null, htExact: 7.2, htFloor: 7, normalExact: 5, normalFloor: 5 },
  },

  // ---- The platform map (clouddocs rSeries/VELOS docs, K15003) ----
  {
    id: "platform-r10900",
    description: "r10900 is hyperthreaded (r5000/r10000/r12000 count vCPUs as hyperthreads)",
    input: "8 r10900",
    expect: { vcpus: 8, requested: "ht", modeSource: "platform", platformId: "rseries-high", appliesTo21x: true, htExact: 4.8, htFloor: 4, normalExact: 3, normalFloor: 3 },
  },
  {
    id: "platform-r12900-ds",
    description: "r12900-DS variant matches the hyperthreaded high-end family",
    input: "20 r12900-ds",
    expect: { vcpus: 20, requested: "ht", modeSource: "platform", platformId: "rseries-high", appliesTo21x: true, htExact: 12, htFloor: 12, normalExact: 9, normalFloor: 9 },
  },
  {
    id: "platform-r4800",
    description: "r4800 has no hyperthreading: physical cores, normal formula",
    input: "16 r4800",
    expect: { vcpus: 16, requested: "normal", modeSource: "platform", platformId: "rseries-low", appliesTo21x: true, htExact: 9.6, htFloor: 9, normalExact: 7, normalFloor: 7 },
  },
  {
    id: "platform-velos",
    description: "VELOS tenants run on hyperthreads (vCPU = hyperthread)",
    input: "22 velos",
    expect: { vcpus: 22, requested: "ht", modeSource: "platform", platformId: "velos", appliesTo21x: true, htExact: 13.2, htFloor: 13, normalExact: 10, normalFloor: 10 },
  },
  {
    id: "platform-iseries-context",
    description: "iSeries is hyperthreaded but cannot run 21.x - context only",
    input: "8 i15800",
    expect: { vcpus: 8, requested: "ht", modeSource: "platform", platformId: "iseries", appliesTo21x: false, htExact: 4.8, htFloor: 4, normalExact: 3, normalFloor: 3 },
  },
  {
    id: "platform-viprion-context",
    description: "VIPRION sizing counts hyperthreads but the platform cannot run 21.x",
    input: "12 viprion",
    expect: { vcpus: 12, requested: "ht", modeSource: "platform", platformId: "viprion", appliesTo21x: false, htExact: 7.2, htFloor: 7, normalExact: 5, normalFloor: 5 },
  },
  {
    id: "platform-ve-depends",
    description: "Virtual Edition depends on the host: both formulas, no selection",
    input: "8 ve",
    expect: { vcpus: 8, requested: null, modeSource: null, platformId: "ve", appliesTo21x: true, htExact: 4.8, htFloor: 4, normalExact: 3, normalFloor: 3 },
  },
  {
    id: "platform-rseries-ambiguous",
    description: "bare 'rseries' is ambiguous (r2000/r4000 vs r5000+): both formulas shown",
    input: "8 rseries",
    expect: { vcpus: 8, requested: null, modeSource: null, platformId: "rseries-ambiguous", appliesTo21x: true, htExact: 4.8, htFloor: 4, normalExact: 3, normalFloor: 3 },
  },
  {
    id: "explicit-overrides-platform",
    description: "an explicit mode word beats the platform default (HT disabled in firmware, say)",
    input: "16 r10900 normal",
    expect: { vcpus: 16, requested: "normal", modeSource: "explicit", platformId: "rseries-high", appliesTo21x: true, htExact: 9.6, htFloor: 9, normalExact: 7, normalFloor: 7 },
  },
];

export const BIGD_CALC_REJECT_VECTORS: RejectVector[] = [
  { id: "empty", description: "empty input", input: "   ", expectCode: "empty" },
  { id: "not-a-number", description: "no vCPU count present", input: "lots ht", expectCode: "format" },
  { id: "zero", description: "0 vCPUs is out of range", input: "0 ht", expectCode: "range" },
  { id: "huge", description: "beyond the 1024 sanity ceiling", input: "4096 normal", expectCode: "range" },
  { id: "bad-mode", description: "an unrecognized token is a format error, never a guess", input: "8 turbo", expectCode: "format" },
  { id: "bad-rseries", description: "a nonexistent rSeries family is not silently mapped", input: "8 r9900", expectCode: "format" },
];

export interface VectorReport {
  setId: string;
  total: number;
  passed: number;
  failures: string[];
}

/** Run every vector; used by the standalone check and available to CI. */
export function verifyVectors(): VectorReport {
  const failures: string[] = [];
  for (const v of BIGD_CALC_GOLDEN_VECTORS) {
    try {
      const r = run(v.input);
      const ok =
        r.vcpus === v.expect.vcpus &&
        r.requested === v.expect.requested &&
        r.modeSource === v.expect.modeSource &&
        (r.platform?.id ?? null) === v.expect.platformId &&
        (r.platform ? r.platform.appliesTo21x : null) === v.expect.appliesTo21x &&
        r.ht.exact === v.expect.htExact &&
        r.ht.floor === v.expect.htFloor &&
        r.normal.exact === v.expect.normalExact &&
        r.normal.floor === v.expect.normalFloor &&
        r.numprocsCap === r.vcpus &&
        r.monitorCeiling === 15000;
      if (!ok) failures.push(`${v.id}: mismatch (got ${JSON.stringify(r)})`);
    } catch (e) {
      failures.push(`${v.id}: threw ${(e as Error).message}`);
    }
  }
  for (const v of BIGD_CALC_REJECT_VECTORS) {
    try {
      run(v.input);
      failures.push(`${v.id}: expected ${v.expectCode}, got a result`);
    } catch (e) {
      if (!(e instanceof BigdCalcError) || e.code !== v.expectCode) {
        failures.push(`${v.id}: expected ${v.expectCode}, got ${(e as Error).message}`);
      }
    }
  }
  const total = BIGD_CALC_GOLDEN_VECTORS.length + BIGD_CALC_REJECT_VECTORS.length;
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: total - failures.length, failures };
}
