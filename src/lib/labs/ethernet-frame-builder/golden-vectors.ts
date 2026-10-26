// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/ethernet-frame-builder/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the Ethernet frame builder lab (set 2026-10-26a). Each
// case is worked by hand from the field sizes in compute.ts. The three marked
// "checked" were also run in the original interactive model on 2026-10-26 and
// agree on the bits and sizes; the two marked "article" reproduce the
// article's 64-octet minimum (84 octets on the wire, about 1.49 million frames
// a second at 1 Gb/s) and its 1518-octet maximum (1538 on the wire, about
// 81 000 a second). Reject vectors pin the stable error codes.
// verifyVectors() runs them all; scripts/run-golden-vectors runs it at
// prebuild and fails the build on drift.
// ============================================================================

import { compute, FrameError, type FrameErrorCode, type FrameInput, type FrameResult } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "ethernet-frame-builder/2026-10-26a";

/** A case the model must answer exactly so (every listed field compared; frames per second rounded down). */
interface AcceptVector {
  /** Short stable name. */
  id: string;
  /** The reader's settings. */
  input: FrameInput;
  /** The fields of the result that must match. */
  expect: Partial<Omit<FrameResult, "fields" | "maxFramesPerSecond" | "packetShare">> & { fps?: number };
}

/** A case the model must refuse with a given code. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** Settings outside the lab's range (cast where the interface could never send them). */
  input: FrameInput;
  /** The code the refusal must carry. */
  code: FrameErrorCode;
}

/** The accept cases. */
export const FRAME_VECTORS: readonly AcceptVector[] = Object.freeze([
  // Checked: 01:00:5e:00:00:01 has the I/G bit set: a group address.
  { id: "multicast-group", input: { destination: "01:00:5e:00:00:01", tagged: false, vid: 1, protocol: "ipv4", packet: 100, rate: "1G" }, expect: { destination: "01-00-5E-00-00-01", firstOctetBits: "00000001", group: true, local: false, broadcast: false } },
  // Checked: a universal unicast address, untagged, 60-octet packet: frame 78, wire 98.
  { id: "unicast-60", input: { destination: "00-1B-21-AA-BB-CC", tagged: false, vid: 1, protocol: "ipv4", packet: 60, rate: "1G" }, expect: { group: false, local: false, pad: 0, frame: 78, wire: 98 } },
  // Checked: a locally administered address, tagged, 1500-octet packet: frame 1522, wire 1542.
  { id: "local-tagged-1500", input: { destination: "02:00:00:00:00:10", tagged: true, vid: 10, protocol: "ipv4", packet: 1500, rate: "1G" }, expect: { group: false, local: true, frame: 1522, wire: 1542 } },
  // Article: the smallest frame, 64 octets, 84 on the wire, 1 488 095 a second at 1 Gb/s.
  { id: "article-minimum", input: { destination: "00-00-5E-00-53-01", tagged: false, vid: 1, protocol: "ipv4", packet: 46, rate: "1G" }, expect: { frame: 64, wire: 84, fps: 1488095 } },
  // Article: the largest untagged frame, 1518 octets, 1538 on the wire, 81 274 a second at 1 Gb/s.
  { id: "article-maximum", input: { destination: "00-00-5E-00-53-01", tagged: false, vid: 1, protocol: "ipv4", packet: 1500, rate: "1G" }, expect: { frame: 1518, wire: 1538, fps: 81274, etherType: "0x0800" } },
  // The Example: a 28-octet ARP request, broadcast on VLAN 10, padded by 18 to a 68-octet frame.
  { id: "arp-broadcast-tagged", input: { destination: "ff-ff-ff-ff-ff-ff", tagged: true, vid: 10, protocol: "arp", packet: 28, rate: "1G" }, expect: { broadcast: true, group: true, local: true, etherType: "0x0806", pad: 18, frame: 68, wire: 88, fps: 1420454 } },
  // An IPv6 packet, Cisco-style dotted address, at 10 Mb/s: 812 full frames a second, as RFC 2544 Appendix B tabulates.
  { id: "ipv6-dotted-10m", input: { destination: "3333.0000.0001", tagged: false, vid: 1, protocol: "ipv6", packet: 1500, rate: "10M" }, expect: { destination: "33-33-00-00-00-01", group: true, local: true, etherType: "0x86DD", frame: 1518, fps: 812 } },
]);

/** The reject cases. */
export const FRAME_REJECTS: readonly RejectVector[] = Object.freeze([
  // Eleven hex digits.
  { id: "bad-mac", input: { destination: "00-00-5E-00-53-0", tagged: false, vid: 1, protocol: "ipv4", packet: 100, rate: "1G" }, code: "bad-mac" },
  // VID 4095 is reserved.
  { id: "bad-vid", input: { destination: "00-00-5E-00-53-01", tagged: true, vid: 4095, protocol: "ipv4", packet: 100, rate: "1G" }, code: "bad-vid" },
  // More than the payload field holds.
  { id: "bad-packet", input: { destination: "00-00-5E-00-53-01", tagged: false, vid: 1, protocol: "ipv4", packet: 1501, rate: "1G" }, code: "bad-packet" },
  // A protocol the select cannot produce.
  { id: "bad-choice", input: { destination: "00-00-5E-00-53-01", tagged: false, vid: 1, protocol: "ipx" as unknown as "ipv4", packet: 100, rate: "1G" }, code: "bad-choice" },
]);

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures, one sentence each.
  const failures: string[] = [];
  // Each accept case: compute and compare every expected field.
  for (const v of FRAME_VECTORS) {
    // The model's answer.
    const got = compute(v.input);
    // Each expected field in turn.
    for (const [k, want] of Object.entries(v.expect)) {
      // Frames per second are compared rounded down; everything else as it is.
      const have = k === "fps" ? Math.floor(got.maxFramesPerSecond) : got[k as keyof FrameResult];
      // A difference is a failure naming the case and the field.
      if (have !== want) failures.push(`${v.id}: ${k} is ${String(have)}, expected ${String(want)}`);
    }
  }
  // Each reject case: it must throw with the right code.
  for (const r of FRAME_REJECTS) {
    // The code it threw with, or null when it did not throw.
    let code: string | null = null;
    // Run it and catch the refusal.
    try {
      // Should throw.
      compute(r.input);
    } catch (e) {
      // Our error carries a code; anything else is reported as such.
      code = e instanceof FrameError ? e.code : `unexpected ${String(e)}`;
    }
    // Wrong code or no refusal is a failure.
    if (code !== r.code) failures.push(`${r.id}: refused with ${String(code)}, expected ${r.code}`);
  }
  // The report in the shape the runner reads.
  const total = FRAME_VECTORS.length + FRAME_REJECTS.length;
  // Passed is everything that did not fail (floored at zero).
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: Math.max(0, total - failures.length), failures };
}
