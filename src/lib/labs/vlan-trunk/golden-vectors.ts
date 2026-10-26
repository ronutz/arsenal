// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/vlan-trunk/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the VLAN trunk lab (set 2026-10-26a). Each case is worked
// by hand from the three rules in compute.ts (native VLAN leaves untagged; an
// untagged arrival joins the receiving end's native VLAN; the allowed list
// filters both ends), and the two marked "checked" were also run in the
// original interactive model and compared outcome for outcome on 2026-10-26:
// the native-mismatch leak and the drop at the right end. Reject vectors pin the
// stable error codes. verifyVectors() runs them all; scripts/run-golden-vectors
// runs it at prebuild and fails the build on any drift.
// ============================================================================

import { compute, VlanTrunkError, type VlanTrunkErrorCode, type VlanTrunkInput, type VlanTrunkResult } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "vlan-trunk/2026-10-26a";

/** A case the model must answer exactly so (every listed field compared). */
interface AcceptVector {
  /** Short stable name. */
  id: string;
  /** The reader's settings. */
  input: VlanTrunkInput;
  /** The fields of the result that must match. */
  expect: Partial<VlanTrunkResult>;
}

/** A case the model must refuse with a given code. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** Settings outside the lab's range (cast, as the interface could never send them). */
  input: VlanTrunkInput;
  /** The code the refusal must carry. */
  code: VlanTrunkErrorCode;
}

/** The accept cases. */
export const VLAN_TRUNK_VECTORS: readonly AcceptVector[] = Object.freeze([
  // A clean trunk carries a non-native VLAN tagged and delivers it.
  { id: "clean-tagged", input: { sender: 20, receiver: 20, allowed: "both", nativeLeft: 10, nativeRight: 10 }, expect: { tagged: true, vid: 20, leftAllows: true, classifiedInto: 20, rightAllows: true, crossed: false, nativeMismatch: false, outcome: "delivered" } },
  // The native VLAN crosses untagged and, with matching natives, lands where it started.
  { id: "clean-untagged", input: { sender: 10, receiver: 10, allowed: "both", nativeLeft: 10, nativeRight: 10 }, expect: { tagged: false, vid: null, classifiedInto: 10, crossed: false, outcome: "delivered" } },
  // Checked: mismatched natives carry an untagged VLAN 10 frame into VLAN 20, where a VLAN 20 host can receive it.
  { id: "native-mismatch-leak", input: { sender: 10, receiver: 20, allowed: "both", nativeLeft: 10, nativeRight: 20 }, expect: { tagged: false, classifiedInto: 20, rightAllows: true, crossed: true, nativeMismatch: true, outcome: "delivered" } },
  // The same leak the other way round.
  { id: "native-mismatch-leak-reverse", input: { sender: 20, receiver: 10, allowed: "both", nativeLeft: 20, nativeRight: 10 }, expect: { tagged: false, classifiedInto: 10, crossed: true, nativeMismatch: true, outcome: "delivered" } },
  // Checked: the left end allows VLAN 10 out, the right end puts it in VLAN 20, which its allowed list refuses.
  { id: "right-drop", input: { sender: 10, receiver: 10, allowed: "10", nativeLeft: 10, nativeRight: 20 }, expect: { tagged: false, leftAllows: true, classifiedInto: 20, rightAllows: false, crossed: false, outcome: "dropped-right" } },
  // The left end refuses a VLAN its allowed list does not carry; the frame never reaches the trunk.
  { id: "left-drop", input: { sender: 20, receiver: 20, allowed: "10", nativeLeft: 10, nativeRight: 10 }, expect: { tagged: true, vid: 20, leftAllows: false, crossed: false, outcome: "dropped-left" } },
  // Different access VLANs with a healthy trunk: the frame stays in its own VLAN and never reaches the other host.
  { id: "different-vlans-no-crossing", input: { sender: 10, receiver: 20, allowed: "both", nativeLeft: 10, nativeRight: 10 }, expect: { tagged: false, classifiedInto: 10, crossed: false, nativeMismatch: false, outcome: "wrong-vlan" } },
  // A native mismatch does not touch tagged traffic: VLAN 20 keeps its tag and its VLAN.
  { id: "mismatch-spares-tagged", input: { sender: 20, receiver: 20, allowed: "both", nativeLeft: 10, nativeRight: 20 }, expect: { tagged: true, vid: 20, classifiedInto: 20, crossed: false, nativeMismatch: true, outcome: "delivered" } },
]);

/** The reject cases. */
export const VLAN_TRUNK_REJECTS: readonly RejectVector[] = Object.freeze([
  // A VLAN id the lab does not offer.
  { id: "bad-vlan", input: { sender: 30 as unknown as 10, receiver: 20, allowed: "both", nativeLeft: 10, nativeRight: 10 }, code: "bad-vlan" },
  // An allowed-list value the control cannot produce.
  { id: "bad-allowed", input: { sender: 10, receiver: 10, allowed: "30" as unknown as "10", nativeLeft: 10, nativeRight: 10 }, code: "bad-allowed" },
]);

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures, one sentence each.
  const failures: string[] = [];
  // Each accept case: compute and compare every expected field.
  for (const v of VLAN_TRUNK_VECTORS) {
    // The model's answer.
    const got = compute(v.input);
    // Each expected field in turn.
    for (const [k, want] of Object.entries(v.expect)) {
      // The answer's value for that field.
      const have = got[k as keyof VlanTrunkResult];
      // A difference is a failure naming the case and the field.
      if (have !== want) failures.push(`${v.id}: ${k} is ${String(have)}, expected ${String(want)}`);
    }
  }
  // Each reject case: it must throw with the right code.
  for (const r of VLAN_TRUNK_REJECTS) {
    // The code it threw with, or null when it did not throw.
    let code: string | null = null;
    // Run it and catch the refusal.
    try {
      // Should throw.
      compute(r.input);
    } catch (e) {
      // Our error carries a code; anything else is reported as such.
      code = e instanceof VlanTrunkError ? e.code : `unexpected ${String(e)}`;
    }
    // Wrong code or no refusal is a failure.
    if (code !== r.code) failures.push(`${r.id}: refused with ${String(code)}, expected ${r.code}`);
  }
  // The report in the shape the runner reads.
  const total = VLAN_TRUNK_VECTORS.length + VLAN_TRUNK_REJECTS.length;
  // Passed is everything that did not fail (a case can fail on several fields, so floor at zero).
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: Math.max(0, total - failures.length), failures };
}
