// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/vlsm-allocation-order/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the VLSM allocation-order lab (set 2026-10-26a). The
// four marked "article" reproduce the article's own tables exactly: largest
// first (184 used, free 203.0.113.184/29 and 203.0.113.192/26), the links as
// /31 (180 used, three free blocks), arrival order (Guest Wi-Fi does not fit,
// 152 used, free /29, /27 and /26) and smallest first (all five fit). The
// original interactive model was checked on 2026-10-26 on a different parent
// (10.40.0.0) with a growth allowance this lab does not carry, so its cases
// are not reused; the article's are the stronger check. Reject vectors pin
// the stable error codes. verifyVectors() runs them all;
// scripts/run-golden-vectors runs it at prebuild and fails the build on drift.
// ============================================================================

import { compute, VlsmError, type SegmentId, type VlsmErrorCode, type VlsmInput } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "vlsm-allocation-order/2026-10-26a";

/** What a case expects. */
interface Expect {
  /** Blocks in placement order, null for a segment that did not fit. */
  blocks: (string | null)[];
  /** Addresses used. */
  used: number;
  /** The free blocks, in address order. */
  freeBlocks: string[];
  /** The segments that did not fit. */
  notFitted: SegmentId[];
}

/** A case the model must answer exactly so. */
interface AcceptVector {
  /** Short stable name. */
  id: string;
  /** The reader's settings. */
  input: VlsmInput;
  /** What must match. */
  expect: Expect;
}

/** A case the model must refuse with a given code. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** Settings outside the lab's range (cast where the interface could never send them). */
  input: VlsmInput;
  /** The code the refusal must carry. */
  code: VlsmErrorCode;
}

/** The accept cases. */
export const VLSM_VECTORS: readonly AcceptVector[] = Object.freeze([
  // Article, Step 3 and Step 5: Office /25, Guest /27, Management /28, two /30s; 184 used, 72 free as a /29 and a /26.
  { id: "article-largest-first", input: { office: 100, guest: 25, management: 10, links: "30", order: "largest" }, expect: { blocks: ["203.0.113.0/25", "203.0.113.128/27", "203.0.113.160/28", "203.0.113.176/30", "203.0.113.180/30"], used: 184, freeBlocks: ["203.0.113.184/29", "203.0.113.192/26"], notFitted: [] } },
  // Article, "The same two links as /31": 180 used, free 203.0.113.180/30, .184/29 and .192/26.
  { id: "article-links-31", input: { office: 100, guest: 25, management: 10, links: "31", order: "largest" }, expect: { blocks: ["203.0.113.0/25", "203.0.113.128/27", "203.0.113.160/28", "203.0.113.176/31", "203.0.113.178/31"], used: 180, freeBlocks: ["203.0.113.180/30", "203.0.113.184/29", "203.0.113.192/26"], notFitted: [] } },
  // Article, "In the order the requests arrived": Guest Wi-Fi does not fit; 152 used; free .8/29, .32/27, .64/26.
  { id: "article-arrival", input: { office: 100, guest: 25, management: 10, links: "30", order: "arrival" }, expect: { blocks: ["203.0.113.0/30", "203.0.113.4/30", "203.0.113.16/28", "203.0.113.128/25", null], used: 152, freeBlocks: ["203.0.113.8/29", "203.0.113.32/27", "203.0.113.64/26"], notFitted: ["guest"] } },
  // Article: a true smallest-first order also fits all five (184 used; the 72 free are a /29 and a /26 inside the plan).
  { id: "article-smallest", input: { office: 100, guest: 25, management: 10, links: "30", order: "smallest" }, expect: { blocks: ["203.0.113.0/30", "203.0.113.4/30", "203.0.113.16/28", "203.0.113.32/27", "203.0.113.128/25"], used: 184, freeBlocks: ["203.0.113.8/29", "203.0.113.64/26"], notFitted: [] } },
  // Article, Step 1: a /26 holds only 62 hosts; 62 hosts still fit a /26 (64 addresses).
  { id: "office-62-is-26", input: { office: 62, guest: 25, management: 10, links: "30", order: "largest" }, expect: { blocks: ["203.0.113.0/26", "203.0.113.64/27", "203.0.113.96/28", "203.0.113.112/30", "203.0.113.116/30"], used: 120, freeBlocks: ["203.0.113.120/29", "203.0.113.128/25"], notFitted: [] } },
  // An office of 200 hosts needs a /24 by itself: nothing else fits beside it.
  { id: "office-takes-all", input: { office: 200, guest: 25, management: 10, links: "30", order: "largest" }, expect: { blocks: ["203.0.113.0/24", null, null, null, null], used: 256, freeBlocks: [], notFitted: ["guest", "management", "link-a", "link-b"] } },
]);

/** The reject cases. */
export const VLSM_REJECTS: readonly RejectVector[] = Object.freeze([
  // No hosts at all.
  { id: "bad-hosts", input: { office: 0, guest: 25, management: 10, links: "30", order: "largest" }, code: "bad-hosts" },
  // An order the select cannot produce.
  { id: "bad-choice", input: { office: 100, guest: 25, management: 10, links: "30", order: "random" as unknown as "largest" }, code: "bad-choice" },
]);

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures, one sentence each.
  const failures: string[] = [];
  // Each accept case: compute and compare.
  for (const v of VLSM_VECTORS) {
    // The model's answer.
    const got = compute(v.input);
    // The blocks, in placement order.
    const blocks = got.placements.map((p) => p.block);
    // Compared as text.
    if (JSON.stringify(blocks) !== JSON.stringify(v.expect.blocks)) failures.push(`${v.id}: blocks ${JSON.stringify(blocks)}, expected ${JSON.stringify(v.expect.blocks)}`);
    // Addresses used.
    if (got.used !== v.expect.used) failures.push(`${v.id}: used ${got.used}, expected ${v.expect.used}`);
    // The leftover.
    if (JSON.stringify(got.freeBlocks) !== JSON.stringify(v.expect.freeBlocks)) failures.push(`${v.id}: free ${JSON.stringify(got.freeBlocks)}, expected ${JSON.stringify(v.expect.freeBlocks)}`);
    // Who missed out.
    if (JSON.stringify(got.notFitted) !== JSON.stringify(v.expect.notFitted)) failures.push(`${v.id}: not fitted ${JSON.stringify(got.notFitted)}, expected ${JSON.stringify(v.expect.notFitted)}`);
  }
  // Each reject case: it must throw with the right code.
  for (const r of VLSM_REJECTS) {
    // The code it threw with, or null when it did not throw.
    let code: string | null = null;
    // Run it and catch the refusal.
    try {
      // Should throw.
      compute(r.input);
    } catch (e) {
      // Our error carries a code; anything else is reported as such.
      code = e instanceof VlsmError ? e.code : `unexpected ${String(e)}`;
    }
    // Wrong code or no refusal is a failure.
    if (code !== r.code) failures.push(`${r.id}: refused with ${String(code)}, expected ${r.code}`);
  }
  // The report in the shape the runner reads.
  const total = VLSM_VECTORS.length + VLSM_REJECTS.length;
  // Passed is everything that did not fail (floored at zero).
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: Math.max(0, total - failures.length), failures };
}
