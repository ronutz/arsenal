// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/wifi-airtime/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the Wi-Fi airtime lab (set 2026-10-26a). Two cases
// reproduce HPE Aruba's own published figures: Table T3-2 of the Very
// High-Density 802.11ac Theory Guide (a 512-byte MPDU at 86.7 Mb/s with a
// 6 Mb/s control rate: 287.61 µs for the TXOP, the payload 16.4 % of it) and
// the Frame Time Calculator v2.0's scenario 1 (a 90-byte MPDU at 86.7 Mb/s:
// 248.67 µs for the TXOP only). The others were produced by a second,
// independent implementation of the same arithmetic (Python, 2026-10-26).
// Values are compared at four decimals, as strings, so the comparison is
// exact. Reject vectors pin the stable error codes. verifyVectors() runs them
// all; scripts/run-golden-vectors runs it at prebuild and fails on any drift.
// ============================================================================

import { AirtimeError, compute, type AirtimeErrorCode, type AirtimeInput, type AirtimeResult } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "wifi-airtime/2026-10-26a";

/** The compared summary of a result, every number at four decimals. */
interface Summary {
  /** Each client's frame airtime, µs. */
  totals: string;
  /** Each client's share of the round. */
  shares: string;
  /** Each client's payload share of its own frame. */
  payloadShares: string;
  /** The round, µs. */
  round: string;
  /** The cell's rate, Mb/s. */
  cell: string;
  /** The slowest client's slot. */
  slowest: string;
  /** The round without the slowest client, µs, or "null". */
  roundWithout: string;
  /** The cell's rate without it, Mb/s, or "null". */
  cellWithout: string;
  /** The first client's parts: protection, preamble, payload, ack, total. */
  parts0: string;
}

/** A number at four decimals, or "null". */
function f4(v: number | null): string {
  // toFixed is deterministic for these magnitudes.
  return v === null ? "null" : v.toFixed(4);
}

/** Reduce a result to its compared summary. */
export function summarise(r: AirtimeResult): Summary {
  // The first client's parts, in order.
  const p = r.clients[0].parts;
  // Each part.
  return {
    // Frame airtimes.
    totals: r.clients.map((c) => f4(c.parts.total)).join(" "),
    // Round shares.
    shares: r.clients.map((c) => f4(c.roundShare)).join(" "),
    // Payload shares.
    payloadShares: r.clients.map((c) => f4(c.payloadShare)).join(" "),
    // The round.
    round: f4(r.roundUs),
    // The cell's rate.
    cell: f4(r.cellMbps),
    // The slowest client.
    slowest: String(r.slowest),
    // Without it.
    roundWithout: f4(r.roundWithoutUs),
    // The rate without it.
    cellWithout: f4(r.cellWithoutMbps),
    // The first client's parts.
    parts0: [p.protection, p.preamble, p.payload, p.ack, p.total].map(f4).join(" "),
  };
}

/** A case the model must answer exactly so (every listed part compared). */
interface AcceptVector {
  /** Short stable name. */
  id: string;
  /** The reader's settings. */
  input: AirtimeInput;
  /** The parts of the summary that must match. */
  expect: Partial<Summary>;
}

/** A case the model must refuse with a given code. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** Settings outside the lab's range (cast where the interface could never send them). */
  input: AirtimeInput;
  /** The code the refusal must carry. */
  code: AirtimeErrorCode;
}

/** An empty slot. */
const OFF = { rate: "off", bytes: 1500 };

/** The accept cases. */
export const AIRTIME_VECTORS: readonly AcceptVector[] = Object.freeze([
  // Aruba's Table T3-2: 512 bytes at 86.7 Mb/s, RTS/CTS and Block Ack at 6 Mb/s: 287.61 µs, payload 16.4 %.
  { id: "aruba-table-t3-2", input: { clients: [{ rate: "vht-1ss-20-mcs8", bytes: 512 }, OFF, OFF, OFF] }, expect: { totals: "287.6125", payloadShares: "0.1643", parts0: "117.3333 44.0000 47.6125 78.6667 287.6125", roundWithout: "null" } },
  // Aruba's calculator, scenario 1: a 90-byte TCP ack at 86.7 Mb/s, 248.67 µs for the TXOP only; payload 3.3 %.
  { id: "aruba-calculator-tcp-ack", input: { clients: [{ rate: "vht-1ss-20-mcs8", bytes: 90 }, OFF, OFF, OFF] }, expect: { totals: "248.6736", payloadShares: "0.0334" } },
  // The opening state: three 802.11ac clients, 1,500-byte frames.
  { id: "default", input: { clients: [{ rate: "vht-2ss-20-mcs8", bytes: 1500 }, { rate: "vht-1ss-20-mcs8", bytes: 1500 }, { rate: "vht-1ss-20-mcs4", bytes: 1500 }, OFF] }, expect: { totals: "309.4287 378.7774 517.8753", shares: "0.2566 0.3141 0.4294", round: "1206.0814", cell: "29.8487", slowest: "2", roundWithout: "688.2061", cellWithout: "34.8733" } },
  // The Example: one legacy client at 6 Mb/s holds 63 % of the round and halves the cell's rate, 29.85 to 14.63 Mb/s.
  { id: "example-legacy-client", input: { clients: [{ rate: "vht-2ss-20-mcs8", bytes: 1500 }, { rate: "vht-1ss-20-mcs8", bytes: 1500 }, { rate: "vht-1ss-20-mcs4", bytes: 1500 }, { rate: "legacy-6", bytes: 1500 }] }, expect: { totals: "309.4287 378.7774 517.8753 2074.6667", shares: "0.0943 0.1155 0.1579 0.6324", round: "3280.7481", cell: "14.6308", slowest: "3", roundWithout: "1206.0814", cellWithout: "29.8487" } },
  // A legacy frame at 54 Mb/s: preamble 20, payload 222.22, SIFS and Ack 54.67.
  { id: "legacy-54", input: { clients: [{ rate: "legacy-54", bytes: 1500 }, OFF, OFF, OFF] }, expect: { parts0: "0.0000 20.0000 222.2222 54.6667 296.8889", cell: "40.4192" } },
  // At 866.7 Mb/s a 64-byte frame is 0.25 % payload; even 3,028 bytes are only 10.4 %.
  { id: "small-fast", input: { clients: [{ rate: "vht-2ss-80-mcs9", bytes: 64 }, { rate: "vht-2ss-80-mcs9", bytes: 3028 }, OFF, OFF] }, expect: { totals: "240.6277 267.9866", payloadShares: "0.0025 0.1043", slowest: "1", cell: "48.6341" } },
  // The slowest 802.11ac rate against the slowest legacy rate.
  { id: "mcs0-vs-legacy6", input: { clients: [{ rate: "vht-1ss-20-mcs0", bytes: 1500 }, { rate: "legacy-6", bytes: 1500 }, OFF, OFF] }, expect: { totals: "1911.1111 2074.6667", slowest: "1" } },
  // Two equal clients: equal shares, and the lower slot counts as the slowest.
  { id: "tie", input: { clients: [{ rate: "legacy-12", bytes: 1000 }, { rate: "legacy-12", bytes: 1000 }, OFF, OFF] }, expect: { totals: "741.3333 741.3333", shares: "0.5000 0.5000", slowest: "0", cell: "10.7914", cellWithout: "10.7914" } },
  // Only the third slot in use.
  { id: "only-slot-3", input: { clients: [OFF, OFF, { rate: "legacy-24", bytes: 700 }, OFF] }, expect: { totals: "308.0000", slowest: "2", cell: "18.1818", roundWithout: "null", cellWithout: "null" } },
]);

/** The reject cases. */
export const AIRTIME_REJECTS: readonly RejectVector[] = Object.freeze([
  // A rate the lab does not offer.
  { id: "bad-rate", input: { clients: [{ rate: "dsss-1", bytes: 1500 }, OFF, OFF, OFF] }, code: "bad-rate" },
  // Smaller than the smallest frame the guide charts.
  { id: "bad-bytes-small", input: { clients: [{ rate: "legacy-6", bytes: 10 }, OFF, OFF, OFF] }, code: "bad-bytes" },
  // A blank field reaches the model as NaN.
  { id: "bad-bytes-blank", input: { clients: [{ rate: "legacy-6", bytes: Number.NaN }, OFF, OFF, OFF] }, code: "bad-bytes" },
  // Every slot empty.
  { id: "no-clients", input: { clients: [OFF, OFF, OFF, OFF] }, code: "no-clients" },
]);

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures, one sentence each.
  const failures: string[] = [];
  // Each accept case: compute, summarise and compare every expected part.
  for (const v of AIRTIME_VECTORS) {
    // The model's answer, summarised.
    const got = summarise(compute(v.input));
    // Each expected part in turn.
    for (const [k, want] of Object.entries(v.expect)) {
      // The answer's value for that part.
      const have = got[k as keyof Summary];
      // A difference is a failure naming the case and the part.
      if (have !== want) failures.push(`${v.id}: ${k} is "${have}", expected "${want}"`);
    }
  }
  // Each reject case: it must throw with the right code.
  for (const r of AIRTIME_REJECTS) {
    // The code it threw with, or null when it did not throw.
    let code: string | null = null;
    // Run it and catch the refusal.
    try {
      // Should throw.
      compute(r.input);
    } catch (e) {
      // Our error carries a code; anything else is reported as such.
      code = e instanceof AirtimeError ? e.code : `unexpected ${String(e)}`;
    }
    // Wrong code or no refusal is a failure.
    if (code !== r.code) failures.push(`${r.id}: refused with ${String(code)}, expected ${r.code}`);
  }
  // The report in the shape the runner reads.
  const total = AIRTIME_VECTORS.length + AIRTIME_REJECTS.length;
  // Passed is everything that did not fail (a case can fail on several parts, so floor at zero).
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: Math.max(0, total - failures.length), failures };
}
