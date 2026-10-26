// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/ethernet-transfer-budget/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the Ethernet transfer budget lab (set 2026-10-26a). Each
// case is worked by hand from the field sizes in compute.ts. The three marked
// "checked" were also run in the original interactive model on 2026-10-26 and
// agree on packets, wire bytes, time and efficiency; the original only warned
// about an IPv6 MTU below 1280, which this lab refuses. The case marked
// "article" reproduces the article's 94.93 % for full TCP/IPv4 frames.
// Reject vectors pin the stable error codes. verifyVectors() runs them all;
// scripts/run-golden-vectors runs it at prebuild and fails the build on drift.
// ============================================================================

import { compute, TransferError, type TransferErrorCode, type TransferInput, type TransferResult } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "ethernet-transfer-budget/2026-10-26a";

/** A case the model must answer exactly so (times and efficiency compared at the stated rounding). */
interface AcceptVector {
  /** Short stable name. */
  id: string;
  /** The reader's settings. */
  input: TransferInput;
  /** Integer fields compared exactly. */
  expect: Partial<Pick<TransferResult, "bytes" | "perPacket" | "packets" | "lastBytes" | "pad" | "wireBytes">>;
  /** Wire time in milliseconds, to four decimals. */
  wireMs?: number;
  /** Efficiency in per cent, to two decimals. */
  efficiency?: number;
}

/** A case the model must refuse with a given code. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** Settings outside the lab's range (cast where the interface could never send them). */
  input: TransferInput;
  /** The code the refusal must carry. */
  code: TransferErrorCode;
}

/** Round to a number of decimals. */
function round(x: number, d: number): number {
  // Scale, round, scale back.
  return Math.round(x * 10 ** d) / 10 ** d;
}

/** The accept cases. */
export const TRANSFER_VECTORS: readonly AcceptVector[] = Object.freeze([
  // Checked: 10 MB at 100 Mb/s, TCP/IPv4, MTU 1500: 6850 packets, 10 534 300 octets, 842.744 ms, 94.93 %.
  { id: "10mb-tcp4", input: { size: 10, unit: "MB", rate: "100M", transport: "tcp4", mtu: 1500, tagged: false }, expect: { bytes: 10000000, perPacket: 1460, packets: 6850, lastBytes: 460, wireBytes: 10534300 }, wireMs: 842.744, efficiency: 94.93 },
  // Checked: 10 MiB at 1 Gb/s, TCP/IPv6, MTU 1280, tagged: 8595 packets, 11 362 450 octets, 90.8996 ms, 92.28 %.
  { id: "10mib-tcp6-tagged", input: { size: 10, unit: "MiB", rate: "1G", transport: "tcp6", mtu: 1280, tagged: true }, expect: { bytes: 10485760, perPacket: 1220, packets: 8595, lastBytes: 1080, wireBytes: 11362450 }, wireMs: 90.8996, efficiency: 92.28 },
  // Checked: 1 MB at 10 Mb/s, UDP/IPv4, MTU 576: 1825 packets, 1 120 450 octets, 896.36 ms, 89.25 %.
  { id: "1mb-udp4-576", input: { size: 1, unit: "MB", rate: "10M", transport: "udp4", mtu: 576, tagged: false }, expect: { perPacket: 548, packets: 1825, wireBytes: 1120450 }, wireMs: 896.36, efficiency: 89.25 },
  // Article: a file that fills full TCP/IPv4 frames exactly runs at 1460 of 1538, 94.93 %.
  { id: "article-full-frames", input: { size: 1.46, unit: "MB", rate: "1G", transport: "tcp4", mtu: 1500, tagged: false }, expect: { bytes: 1460000, packets: 1000, lastBytes: 0, wireBytes: 1538000 }, efficiency: 94.93 },
  // A tiny file: 1 byte in one packet, padded from 41 to 46 octets.
  { id: "one-byte", input: { size: 0.000001, unit: "MB", rate: "1G", transport: "tcp4", mtu: 1500, tagged: false }, expect: { bytes: 1, packets: 1, lastBytes: 1, pad: 5, wireBytes: 84 } },
  // The opening state: 1 GB at 1 Gb/s takes 8.4274 s on the wire, not 8.
  { id: "default-1gb", input: { size: 1, unit: "GB", rate: "1G", transport: "tcp4", mtu: 1500, tagged: false }, expect: { packets: 684932, lastBytes: 740, wireBytes: 1053424696 }, wireMs: 8427.3976 },
]);

/** The reject cases. */
export const TRANSFER_REJECTS: readonly RejectVector[] = Object.freeze([
  // A size of zero.
  { id: "bad-size", input: { size: 0, unit: "MB", rate: "1G", transport: "tcp4", mtu: 1500, tagged: false }, code: "bad-size" },
  // An MTU above Ethernet's payload field.
  { id: "bad-mtu", input: { size: 1, unit: "MB", rate: "1G", transport: "tcp4", mtu: 9000, tagged: false }, code: "bad-mtu" },
  // Checked as a warning in the original: IPv6 with an MTU of 1000.
  { id: "ipv6-mtu", input: { size: 1, unit: "MB", rate: "1G", transport: "tcp6", mtu: 1000, tagged: false }, code: "ipv6-mtu" },
  // A unit the select cannot produce.
  { id: "bad-choice", input: { size: 1, unit: "TB" as unknown as "MB", rate: "1G", transport: "tcp4", mtu: 1500, tagged: false }, code: "bad-choice" },
]);

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures, one sentence each.
  const failures: string[] = [];
  // Each accept case: compute and compare.
  for (const v of TRANSFER_VECTORS) {
    // The model's answer.
    const got = compute(v.input);
    // Each integer field in turn.
    for (const [k, want] of Object.entries(v.expect)) {
      // The answer's value for that field.
      const have = got[k as keyof TransferResult];
      // A difference is a failure naming the case and the field.
      if (have !== want) failures.push(`${v.id}: ${k} is ${String(have)}, expected ${String(want)}`);
    }
    // Wire time to four decimals.
    if (v.wireMs !== undefined && round(got.wireMs, 4) !== v.wireMs) failures.push(`${v.id}: wireMs is ${got.wireMs}, expected ${v.wireMs}`);
    // Efficiency to two decimals.
    if (v.efficiency !== undefined && round(got.efficiency, 2) !== v.efficiency) failures.push(`${v.id}: efficiency is ${got.efficiency}, expected ${v.efficiency}`);
  }
  // Each reject case: it must throw with the right code.
  for (const r of TRANSFER_REJECTS) {
    // The code it threw with, or null when it did not throw.
    let code: string | null = null;
    // Run it and catch the refusal.
    try {
      // Should throw.
      compute(r.input);
    } catch (e) {
      // Our error carries a code; anything else is reported as such.
      code = e instanceof TransferError ? e.code : `unexpected ${String(e)}`;
    }
    // Wrong code or no refusal is a failure.
    if (code !== r.code) failures.push(`${r.id}: refused with ${String(code)}, expected ${r.code}`);
  }
  // The report in the shape the runner reads.
  const total = TRANSFER_VECTORS.length + TRANSFER_REJECTS.length;
  // Passed is everything that did not fail (floored at zero).
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: Math.max(0, total - failures.length), failures };
}
