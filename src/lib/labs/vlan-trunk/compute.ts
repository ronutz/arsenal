// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/vlan-trunk/compute.ts
// ----------------------------------------------------------------------------
// THE VLAN TRUNK LAB'S MODEL (2026-10-26), the interactive companion of the
// article "VLANs and 802.1Q trunking". Two switches joined by one 802.1Q trunk;
// a host on an access port of the left switch sends a frame to a host on an
// access port of the right switch. The reader sets each host's access VLAN, the
// VLANs the trunk allows (the same list on both ends) and each end's native
// VLAN, and the model follows the frame across:
//
//   1. On the left switch the frame belongs to the sender's access VLAN. It
//      leaves on the trunk only if the trunk allows that VLAN; it leaves
//      UNTAGGED when that VLAN is the left end's native VLAN, TAGGED otherwise.
//   2. The right switch classifies it: a tagged frame keeps its VID; an
//      untagged frame is put in the right end's native VLAN (the port's PVID).
//      It is accepted only if the trunk allows the VLAN it was classified into.
//   3. It can reach the receiver only if it was classified into the receiver's
//      access VLAN. When it lands in a VLAN other than the one it was sent in,
//      the frame has crossed between VLANs at layer 2: the native VLAN
//      mismatch the article describes.
//
// The rules are the article's own, with its sources: an access port is an
// untagged member of one VLAN and a trunk a tagged member of many (IEEE 802.1Q
// member and untagged sets); a trunk sends its native VLAN untagged and puts
// untagged frames it receives in its native VLAN; mismatched native VLANs leak
// frames between VLANs (Cisco's CDP guide reports exactly that mismatch).
// What the model leaves out is stated in the lab's own scope note: tagging the
// native VLAN, DTP, pruning, spanning tree, MAC learning and flooding.
//
// Pure and deterministic: the same input gives the same result, nothing is read
// from outside, and an invalid input is refused with a stable code.
// ============================================================================

/** The VLAN ids the lab offers: two user VLANs, enough to show every outcome. */
export const LAB_VLANS = [10, 20] as const;
/** One of the lab's VLAN ids. */
export type LabVlan = (typeof LAB_VLANS)[number];
/** What the trunk allows: both VLANs, or one of them. */
export type Allowed = "both" | "10" | "20";
/** Every value the allowed-list control can take. */
export const ALLOWED_VALUES: readonly Allowed[] = ["both", "10", "20"];

/** The reader's settings. */
export interface VlanTrunkInput {
  /** The sender's access VLAN on the left switch. */
  sender: LabVlan;
  /** The receiver's access VLAN on the right switch. */
  receiver: LabVlan;
  /** The VLANs both ends of the trunk allow. */
  allowed: Allowed;
  /** The native VLAN configured on the left end of the trunk. */
  nativeLeft: LabVlan;
  /** The native VLAN configured on the right end of the trunk. */
  nativeRight: LabVlan;
}

/** Where the frame's journey ends. */
export type Outcome = "delivered" | "dropped-left" | "dropped-right" | "wrong-vlan";

/** The model's answer, every step of it. */
export interface VlanTrunkResult {
  /** True when the frame leaves the left switch carrying an 802.1Q tag. */
  tagged: boolean;
  /** The VID in the tag, or null when the frame leaves untagged. */
  vid: number | null;
  /** True when the left end of the trunk allows the sender's VLAN out. */
  leftAllows: boolean;
  /** The VLAN the right switch puts the frame in (meaningful only when it left the left switch). */
  classifiedInto: number;
  /** True when the right end of the trunk allows the VLAN the frame was classified into. */
  rightAllows: boolean;
  /** True when the frame landed in a VLAN other than the one it was sent in (a layer 2 VLAN crossing). */
  crossed: boolean;
  /** True when the two ends' native VLANs differ, whatever happens to this frame. */
  nativeMismatch: boolean;
  /** How the journey ends. */
  outcome: Outcome;
}

/** The stable codes an invalid input is refused with. */
export type VlanTrunkErrorCode = "bad-vlan" | "bad-allowed";

/** The error a refused input throws, with its stable code. */
export class VlanTrunkError extends Error {
  /** The stable code, for vectors and for the interface's message. */
  readonly code: VlanTrunkErrorCode;
  /** Build the error from its code and a message for developers. */
  constructor(code: VlanTrunkErrorCode, message: string) {
    // The message for developers.
    super(message);
    // The code for everything else.
    this.code = code;
  }
}

/** True when a value is one of the lab's VLAN ids. */
function isLabVlan(v: unknown): v is LabVlan {
  // Only the offered ids, as numbers.
  return v === 10 || v === 20;
}

/** Follow one frame from the sender to the receiver across the trunk. */
export function compute(input: VlanTrunkInput): VlanTrunkResult {
  // Every VLAN setting must be one the lab offers.
  for (const v of [input.sender, input.receiver, input.nativeLeft, input.nativeRight]) {
    // A stray value is refused rather than guessed at.
    if (!isLabVlan(v)) throw new VlanTrunkError("bad-vlan", `not a lab VLAN: ${String(v)}`);
  }
  // The allowed list must be one of its three values.
  if (!ALLOWED_VALUES.includes(input.allowed)) throw new VlanTrunkError("bad-allowed", `not an allowed-list value: ${String(input.allowed)}`);
  // The set of VLANs the trunk allows, as numbers.
  const allowedSet = new Set<number>(input.allowed === "both" ? [10, 20] : [Number(input.allowed)]);
  // Step 1: the frame leaves untagged when its VLAN is the left end's native VLAN, tagged otherwise.
  const tagged = input.sender !== input.nativeLeft;
  // The left end sends it only if the trunk allows the sender's VLAN.
  const leftAllows = allowedSet.has(input.sender);
  // Step 2: a tagged frame keeps its VID; an untagged one is put in the right end's native VLAN.
  const classifiedInto = tagged ? input.sender : input.nativeRight;
  // The right end accepts it only if the trunk allows the VLAN it was classified into.
  const rightAllows = allowedSet.has(classifiedInto);
  // A crossing: the frame got through the trunk and landed in another VLAN than its own.
  const crossed = leftAllows && rightAllows && classifiedInto !== input.sender;
  // Step 3: the outcome, first failure first.
  const outcome: Outcome = !leftAllows
    ? "dropped-left"
    : !rightAllows
      ? "dropped-right"
      : classifiedInto !== input.receiver
        ? "wrong-vlan"
        : "delivered";
  // Every step, for the result panel.
  return {
    tagged,
    vid: tagged ? input.sender : null,
    leftAllows,
    classifiedInto,
    rightAllows,
    crossed,
    nativeMismatch: input.nativeLeft !== input.nativeRight,
    outcome,
  };
}

/** The lab's opening state and its Example: a clean trunk, both VLANs allowed, native VLANs matching, a tagged frame delivered. */
export const DEFAULT_INPUT: VlanTrunkInput = { sender: 20, receiver: 20, allowed: "both", nativeLeft: 10, nativeRight: 10 };

/** The Example button's state: the native VLAN mismatch that carries a VLAN 10 frame into VLAN 20. */
export const EXAMPLE_INPUT: VlanTrunkInput = { sender: 10, receiver: 20, allowed: "both", nativeLeft: 10, nativeRight: 20 };
