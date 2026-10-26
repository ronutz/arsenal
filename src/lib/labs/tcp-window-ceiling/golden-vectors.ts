// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/tcp-window-ceiling/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the TCP window ceiling lab (set 2026-10-26a). Each case is
// worked by hand from the rules in compute.ts (ceiling = window x 8 / RTT;
// BDP = rate x RTT; the connection runs at the smaller of the ceiling and the
// rate). The cases marked "checked" were also run in the original interactive
// guide (TRN-02) on 2026-10-26 and compared number for number: 1,024 KiB at
// 100 ms on 1,000 Mbit/s gives 83.89 Mbit/s and a BDP of 12,500,000 bytes;
// 64 KiB at 10 ms on 100 Mbit/s gives 52.43 Mbit/s and 125,000 bytes;
// 16,384 KiB at 1 ms on 1 Mbit/s is limited by the path; a window of 0 or of
// 64.5 KiB is refused. The 64 KiB, 100 ms, 100 Mbit/s case is the article's own
// (about 5.24 Mbit/s, 1,250,000 bytes). Reject vectors pin the stable codes.
// verifyVectors() runs them all; scripts/run-golden-vectors runs it at prebuild
// and fails the build on any drift.
// ============================================================================

import { compute, TcpWindowError, type TcpWindowErrorCode, type TcpWindowInput, type TcpWindowResult } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "tcp-window-ceiling/2026-10-26a";

/** A case the model must answer so (every listed field compared; numbers to one part in a billion). */
interface AcceptVector {
  /** Short stable name. */
  id: string;
  /** The reader's settings. */
  input: TcpWindowInput;
  /** The fields of the result that must match. */
  expect: Partial<TcpWindowResult>;
}

/** A case the model must refuse with a given code. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** Settings outside the lab's range (the interface's parser can produce every one of them). */
  input: TcpWindowInput;
  /** The code the refusal must carry. */
  code: TcpWindowErrorCode;
}

/** The accept cases. */
export const TCP_WINDOW_VECTORS: readonly AcceptVector[] = Object.freeze([
  // The article's case: the unscaled 64 KiB window caps a 100 ms connection at 5.24288 Mbit/s on a 100 Mbit/s path.
  { id: "article-64k-100ms", input: { windowKiB: 64, rttMs: 100, rateMbps: 100 }, expect: { windowBytes: 65536, ceilingMbps: 5.24288, bdpBytes: 1250000, neededKiB: 1221, effectiveMbps: 5.24288, limitedBy: "window", needsScaling: false, bdpNeedsScaling: true } },
  // Checked: a 1 MiB window on a gigabit path at 100 ms, 83.88608 Mbit/s, needs scaling and is still the limit.
  { id: "checked-1m-gigabit", input: { windowKiB: 1024, rttMs: 100, rateMbps: 1000 }, expect: { windowBytes: 1048576, ceilingMbps: 83.88608, bdpBytes: 12500000, neededKiB: 12208, effectiveMbps: 83.88608, limitedBy: "window", needsScaling: true, bdpNeedsScaling: true } },
  // Checked: the same 64 KiB at a tenth of the RTT goes ten times as fast, 52.4288 Mbit/s.
  { id: "checked-64k-10ms", input: { windowKiB: 64, rttMs: 10, rateMbps: 100 }, expect: { ceilingMbps: 52.4288, bdpBytes: 125000, neededKiB: 123, effectiveMbps: 52.4288, limitedBy: "window", bdpNeedsScaling: true } },
  // Checked: a huge window on a slow, short path: the path is the limit and the connection uses all of it.
  { id: "checked-path-limited", input: { windowKiB: 16384, rttMs: 1, rateMbps: 1 }, expect: { windowBytes: 16777216, ceilingMbps: 134217.728, bdpBytes: 125, neededKiB: 1, effectiveMbps: 1, limitedBy: "path", utilisation: 1, needsScaling: true, bdpNeedsScaling: false } },
  // A window exactly equal to the BDP fills the path: the ceiling equals the rate, so the path is the limit.
  { id: "window-equals-bdp", input: { windowKiB: 1, rttMs: 8.192, rateMbps: 1 }, expect: { windowBytes: 1024, ceilingMbps: 1, bdpBytes: 1024, neededKiB: 1, effectiveMbps: 1, limitedBy: "path", utilisation: 1 } },
  // The largest window RFC 7323 allows, 1 GiB, is accepted.
  { id: "max-window", input: { windowKiB: 1048576, rttMs: 100, rateMbps: 100000 }, expect: { windowBytes: 1073741824, ceilingMbps: 85899.34592, bdpBytes: 1250000000, limitedBy: "window", needsScaling: true } },
  // A half-used path: 64 KiB at 10 ms on a 104.8576 Mbit/s path uses half of it.
  { id: "half-used", input: { windowKiB: 64, rttMs: 10, rateMbps: 104.8576 }, expect: { ceilingMbps: 52.4288, limitedBy: "window", utilisation: 0.5 } },
]);

/** The reject cases. */
export const TCP_WINDOW_REJECTS: readonly RejectVector[] = Object.freeze([
  // Checked: a window of zero.
  { id: "window-zero", input: { windowKiB: 0, rttMs: 100, rateMbps: 100 }, code: "bad-window" },
  // Checked: a fraction of a KiB.
  { id: "window-fraction", input: { windowKiB: 64.5, rttMs: 100, rateMbps: 100 }, code: "bad-window" },
  // One KiB past the largest window RFC 7323 allows.
  { id: "window-past-1gib", input: { windowKiB: 1048577, rttMs: 100, rateMbps: 100 }, code: "bad-window" },
  // A round trip of zero.
  { id: "rtt-zero", input: { windowKiB: 64, rttMs: 0, rateMbps: 100 }, code: "bad-rtt" },
  // An empty RTT field, which the interface reads as not a number.
  { id: "rtt-empty", input: { windowKiB: 64, rttMs: Number.NaN, rateMbps: 100 }, code: "bad-rtt" },
  // A negative rate.
  { id: "rate-negative", input: { windowKiB: 64, rttMs: 100, rateMbps: -1 }, code: "bad-rate" },
]);

/** True when two values agree: numbers to one part in a billion, anything else exactly. */
function same(have: unknown, want: unknown): boolean {
  // Numbers: a relative tolerance, because a decimal like 8.192 has no exact binary form.
  if (typeof have === "number" && typeof want === "number") return Math.abs(have - want) <= 1e-9 * Math.max(1, Math.abs(want));
  // Strings and booleans: exact.
  return have === want;
}

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures, one sentence each.
  const failures: string[] = [];
  // Each accept case: compute and compare every expected field.
  for (const v of TCP_WINDOW_VECTORS) {
    // The model's answer.
    const got = compute(v.input);
    // Each expected field in turn.
    for (const [k, want] of Object.entries(v.expect)) {
      // The answer's value for that field.
      const have = got[k as keyof TcpWindowResult];
      // A difference is a failure naming the case and the field.
      if (!same(have, want)) failures.push(`${v.id}: ${k} is ${String(have)}, expected ${String(want)}`);
    }
  }
  // Each reject case: it must throw with the right code.
  for (const r of TCP_WINDOW_REJECTS) {
    // The code it threw with, or null when it did not throw.
    let code: string | null = null;
    // Run it and catch the refusal.
    try {
      // Should throw.
      compute(r.input);
    } catch (e) {
      // Our error carries a code; anything else is reported as such.
      code = e instanceof TcpWindowError ? e.code : `unexpected ${String(e)}`;
    }
    // Wrong code or no refusal is a failure.
    if (code !== r.code) failures.push(`${r.id}: refused with ${String(code)}, expected ${r.code}`);
  }
  // The report in the shape the runner reads.
  const total = TCP_WINDOW_VECTORS.length + TCP_WINDOW_REJECTS.length;
  // Passed is everything that did not fail (a case can fail on several fields, so floor at zero).
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: Math.max(0, total - failures.length), failures };
}
