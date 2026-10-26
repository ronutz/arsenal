// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/bfd-versus-hellos/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the BFD-versus-hellos lab (set 2026-10-26a). The
// detection times reproduce the article's own table (RFC 5880, 6.8.4) and its
// ratios (a 40-second dead interval about 44 times slower than 900 ms, a
// 90-second hold time 100 times); the two marked "checked" match the detection
// times the original interactive model gave on 2026-10-26. Reject vectors pin
// the stable error codes. verifyVectors() runs them all;
// scripts/run-golden-vectors runs it at prebuild and fails the build on drift.
// ============================================================================

import { BfdVersusHellosError, compute, type BfdVersusHellosErrorCode, type BfdVersusHellosInput, type BfdVersusHellosResult } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "bfd-versus-hellos/2026-10-26a";

/** A case the model must answer exactly so (every listed field compared). */
interface AcceptVector {
  /** Short stable name. */
  id: string;
  /** The reader's settings. */
  input: BfdVersusHellosInput;
  /** The fields of the result that must match. */
  expect: Partial<BfdVersusHellosResult>;
}

/** A case the model must refuse with a given code. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** Settings outside the lab's range (cast where the interface could never send them). */
  input: BfdVersusHellosInput;
  /** The code the refusal must carry. */
  code: BfdVersusHellosErrorCode;
}

/** The accept cases. */
export const BFD_VECTORS: readonly AcceptVector[] = Object.freeze([
  // Checked, and the article's first row: 300 by 300 by 3 is 900 ms; OSPF hears it, about 44 times sooner than its dead interval.
  { id: "frr-defaults-ospf", input: { client: "ospf", bfd: "registered", remoteTxMs: 300, localRxMs: 300, remoteMult: 3 }, expect: { agreedMs: 300, bfdMs: 900, protocolMs: 40000, detectedBy: "bfd", withdrawnMs: 900, speedup: 44.4 } },
  // Checked: remote TX 100, local RX 300, multiplier 5; the slower side sets the pace, 1500 ms.
  { id: "slower-side-sets-pace", input: { client: "ospf", bfd: "registered", remoteTxMs: 100, localRxMs: 300, remoteMult: 5 }, expect: { agreedMs: 300, bfdMs: 1500, withdrawnMs: 1500 } },
  // The article's second row, FRRouting's worked example: remote TX 300, local RX 200, multiplier 3.
  { id: "article-row-2", input: { client: "bgp", bfd: "registered", remoteTxMs: 300, localRxMs: 200, remoteMult: 3 }, expect: { agreedMs: 300, bfdMs: 900, protocolMs: 90000, withdrawnMs: 900, speedup: 100 } },
  // The article's third row: local RX 1000 makes it 3000 ms.
  { id: "article-row-3", input: { client: "ospf", bfd: "registered", remoteTxMs: 300, localRxMs: 1000, remoteMult: 3 }, expect: { agreedMs: 1000, bfdMs: 3000 } },
  // The article's fourth row: 100 by 9 is also 900 ms.
  { id: "article-row-4", input: { client: "ospf", bfd: "registered", remoteTxMs: 100, localRxMs: 100, remoteMult: 9 }, expect: { bfdMs: 900 } },
  // The article's sixth row: 16.7 ms by 3 is 50.1 ms.
  { id: "article-row-6", input: { client: "ospf", bfd: "registered", remoteTxMs: 16.7, localRxMs: 16.7, remoteMult: 3 }, expect: { bfdMs: 50.1 } },
  // BFD off: OSPF waits out its 40-second dead interval.
  { id: "no-bfd-ospf", input: { client: "ospf", bfd: "off", remoteTxMs: 300, localRxMs: 300, remoteMult: 3 }, expect: { bfdMs: null, detectedBy: "protocol", withdrawnMs: 40000, speedup: null } },
  // BFD off: BGP waits out its 90-second hold time.
  { id: "no-bfd-bgp", input: { client: "bgp", bfd: "off", remoteTxMs: 300, localRxMs: 300, remoteMult: 3 }, expect: { detectedBy: "protocol", withdrawnMs: 90000 } },
  // A static route with BFD asked for: withdrawn after 900 ms.
  { id: "static-with-bfd", input: { client: "static", bfd: "registered", remoteTxMs: 300, localRxMs: 300, remoteMult: 3 }, expect: { protocolMs: null, detectedBy: "bfd", withdrawnMs: 900, speedup: null } },
  // A static route without BFD: nothing ever removes it while the port is up.
  { id: "static-no-bfd", input: { client: "static", bfd: "off", remoteTxMs: 300, localRxMs: 300, remoteMult: 3 }, expect: { detectedBy: "nobody", withdrawnMs: null } },
  // BFD running but never asked for: the session goes down, the static route stays.
  { id: "static-unregistered", input: { client: "static", bfd: "unregistered", remoteTxMs: 300, localRxMs: 300, remoteMult: 3 }, expect: { bfdMs: 900, bfdHeard: false, detectedBy: "nobody", withdrawnMs: null } },
  // BFD not asked for by OSPF: the dead interval still decides.
  { id: "ospf-unregistered", input: { client: "ospf", bfd: "unregistered", remoteTxMs: 300, localRxMs: 300, remoteMult: 3 }, expect: { bfdHeard: false, detectedBy: "protocol", withdrawnMs: 40000 } },
  // BFD slower than the dead interval: 1000 ms by 50 is 50 s, so OSPF's 40 s wins.
  { id: "bfd-slower-than-ospf", input: { client: "ospf", bfd: "registered", remoteTxMs: 1000, localRxMs: 1000, remoteMult: 50 }, expect: { bfdMs: 50000, detectedBy: "protocol", withdrawnMs: 40000 } },
]);

/** The reject cases. */
export const BFD_REJECTS: readonly RejectVector[] = Object.freeze([
  // An interval of zero.
  { id: "bad-interval", input: { client: "ospf", bfd: "registered", remoteTxMs: 0, localRxMs: 300, remoteMult: 3 }, code: "bad-interval" },
  // A multiplier of zero, which RFC 5880 forbids.
  { id: "bad-mult", input: { client: "ospf", bfd: "registered", remoteTxMs: 300, localRxMs: 300, remoteMult: 0 }, code: "bad-mult" },
  // A client the select cannot produce.
  { id: "bad-choice", input: { client: "rip" as unknown as "ospf", bfd: "registered", remoteTxMs: 300, localRxMs: 300, remoteMult: 3 }, code: "bad-choice" },
]);

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures, one sentence each.
  const failures: string[] = [];
  // Each accept case: compute and compare every expected field.
  for (const v of BFD_VECTORS) {
    // The model's answer.
    const got = compute(v.input);
    // Each expected field in turn.
    for (const [k, want] of Object.entries(v.expect)) {
      // The answer's value for that field.
      const have = got[k as keyof BfdVersusHellosResult];
      // A difference is a failure naming the case and the field.
      if (have !== want) failures.push(`${v.id}: ${k} is ${String(have)}, expected ${String(want)}`);
    }
  }
  // Each reject case: it must throw with the right code.
  for (const r of BFD_REJECTS) {
    // The code it threw with, or null when it did not throw.
    let code: string | null = null;
    // Run it and catch the refusal.
    try {
      // Should throw.
      compute(r.input);
    } catch (e) {
      // Our error carries a code; anything else is reported as such.
      code = e instanceof BfdVersusHellosError ? e.code : `unexpected ${String(e)}`;
    }
    // Wrong code or no refusal is a failure.
    if (code !== r.code) failures.push(`${r.id}: refused with ${String(code)}, expected ${r.code}`);
  }
  // The report in the shape the runner reads.
  const total = BFD_VECTORS.length + BFD_REJECTS.length;
  // Passed is everything that did not fail (floored at zero).
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: Math.max(0, total - failures.length), failures };
}
