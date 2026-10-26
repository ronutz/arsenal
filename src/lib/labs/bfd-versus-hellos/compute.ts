// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/bfd-versus-hellos/compute.ts
// ----------------------------------------------------------------------------
// THE BFD-VERSUS-HELLOS LAB'S MODEL (2026-10-26), the interactive companion of
// the article "BFD: when a link is up and dead at the same time". A router's path to its
// neighbour fails while its own port stays up: the far end is gone behind a
// Layer 2 path, so the interface reports nothing. The reader picks what the
// route depends on (an OSPF neighbour, a BGP session or a static route),
// whether BFD runs and whether that protocol asked BFD to watch the path, and
// the BFD timers; the model says who notices the failure first, when, and
// when the route is withdrawn.
//
// The rules are the article's, each with its source there:
//   - BFD's detection time is the remote Detect Mult times the larger of the
//     local Required Min RX Interval and the remote Desired Min TX Interval
//     (RFC 5880, 6.8.4).
//   - Without BFD, the routing protocol notices only when its own timer runs
//     out: OSPF's RouterDeadInterval, 40 seconds from RFC 2328's 10-second
//     sample times four and FRRouting's default; BGP's hold time, 90 seconds,
//     RFC 4271's suggested default. A static route has no Hello at all, so
//     with its port up nothing removes it ("routing keeps sending traffic into
//     a black hole").
//   - BFD only advises: a client that asked for the session is told and acts,
//     OSPF tearing the neighbour down, BGP the session, and a static route
//     being withdrawn (RFC 5882, 2, 5, 10.1.2 and 10.2). A protocol that did
//     not ask hears nothing from BFD.
// What the model leaves out (the lab's scope note): the jitter on BFD packets,
// the slow rate before a session is Up, Echo and demand modes, graceful
// restart, the time a router then takes to recompute and reprogram its
// forwarding table, and anything the applications do on top.
//
// Pure and deterministic: the same input gives the same result, nothing is read
// from outside, and an invalid input is refused with a stable code.
// ============================================================================

/** What the route depends on. */
export type Client = "ospf" | "bgp" | "static";
/** Every value the client control can take. */
export const CLIENTS: readonly Client[] = ["ospf", "bgp", "static"];
/** Whether BFD runs, and whether the client asked it to watch the path. */
export type BfdMode = "off" | "registered" | "unregistered";
/** Every value the BFD control can take. */
export const BFD_MODES: readonly BfdMode[] = ["off", "registered", "unregistered"];

/** OSPF's dead interval in milliseconds: RFC 2328's 10 s sample times 4, FRRouting's default. */
export const OSPF_DEAD_MS = 40000;
/** BGP's hold time in milliseconds: RFC 4271's suggested default. */
export const BGP_HOLD_MS = 90000;
/** The longest BFD interval the lab accepts, in milliseconds. */
export const MAX_INTERVAL_MS = 60000;
/** The largest Detect Mult: an 8-bit field (RFC 5880, 4.1). */
export const MAX_MULT = 255;

/** The reader's settings. */
export interface BfdVersusHellosInput {
  /** What the route depends on. */
  client: Client;
  /** BFD off, on and asked for by the client, or on but not asked for. */
  bfd: BfdMode;
  /** The remote system's Desired Min TX Interval, in milliseconds. */
  remoteTxMs: number;
  /** The local system's Required Min RX Interval, in milliseconds. */
  localRxMs: number;
  /** The remote system's Detect Mult. */
  remoteMult: number;
}

/** Who notices the failure first. */
export type DetectedBy = "bfd" | "protocol" | "nobody";

/** The model's answer. */
export interface BfdVersusHellosResult {
  /** The agreed interval the local system expects packets at, in ms, or null without BFD. */
  agreedMs: number | null;
  /** BFD's detection time in ms, or null without BFD. */
  bfdMs: number | null;
  /** The protocol's own detection time in ms, or null for a static route (no Hello). */
  protocolMs: number | null;
  /** True when BFD's verdict reaches the client. */
  bfdHeard: boolean;
  /** Who notices first. */
  detectedBy: DetectedBy;
  /** When the route is withdrawn, in ms, or null when nothing ever removes it. */
  withdrawnMs: number | null;
  /** How many times faster BFD is than the protocol's own timer, or null when there is nothing to compare. */
  speedup: number | null;
}

/** The stable codes an invalid input is refused with. */
export type BfdVersusHellosErrorCode = "bad-interval" | "bad-mult" | "bad-choice";

/** An invalid input, refused with a stable code the interface can word. */
export class BfdVersusHellosError extends Error {
  /** The stable code. */
  readonly code: BfdVersusHellosErrorCode;
  /** Build the refusal with its code and an English message for logs. */
  constructor(code: BfdVersusHellosErrorCode, message: string) {
    // The message, for developers.
    super(message);
    // The code, for the interface.
    this.code = code;
  }
}

/** Round to three decimals, so 16.7 x 3 reads 50.1 and not 50.099999. */
function round3(x: number): number {
  // Scale, round, scale back.
  return Math.round(x * 1000) / 1000;
}

/** Compute who notices the failure, and when the route goes. */
export function compute(input: BfdVersusHellosInput): BfdVersusHellosResult {
  // Each interval must be a positive number of milliseconds within range.
  for (const v of [input.remoteTxMs, input.localRxMs]) if (!Number.isFinite(v) || v <= 0 || v > MAX_INTERVAL_MS) throw new BfdVersusHellosError("bad-interval", `intervals must be above 0 and at most ${MAX_INTERVAL_MS} ms`);
  // Detect Mult is a nonzero 8-bit integer.
  if (!Number.isInteger(input.remoteMult) || input.remoteMult < 1 || input.remoteMult > MAX_MULT) throw new BfdVersusHellosError("bad-mult", `remoteMult must be an integer from 1 to ${MAX_MULT}`);
  // The selects can only send these values.
  if (!CLIENTS.includes(input.client) || !BFD_MODES.includes(input.bfd)) throw new BfdVersusHellosError("bad-choice", "unknown client or BFD mode");

  // The protocol's own detection: the dead interval, the hold time, or nothing for a static route.
  const protocolMs = input.client === "ospf" ? OSPF_DEAD_MS : input.client === "bgp" ? BGP_HOLD_MS : null;
  // BFD runs in either "on" mode.
  const bfdOn = input.bfd !== "off";
  // The agreed interval: the larger of local RX and remote TX (RFC 5880, 6.8.4).
  const agreedMs = bfdOn ? Math.max(input.localRxMs, input.remoteTxMs) : null;
  // Detection time: the remote multiplier times that interval.
  const bfdMs = agreedMs === null ? null : round3(input.remoteMult * agreedMs);
  // BFD's verdict reaches the client only if the client asked for the session.
  const bfdHeard = input.bfd === "registered";
  // The candidates for the withdrawal: BFD when heard, the protocol's own timer when it has one.
  const candidates = [bfdHeard && bfdMs !== null ? bfdMs : null, protocolMs].filter((x): x is number => x !== null);
  // The route goes at the earliest of them, or never.
  const withdrawnMs = candidates.length ? Math.min(...candidates) : null;
  // Who got there first (BFD wins a tie: it is the one that told the client).
  const detectedBy: DetectedBy = withdrawnMs === null ? "nobody" : bfdHeard && bfdMs !== null && bfdMs <= withdrawnMs ? "bfd" : "protocol";
  // The comparison, when both numbers exist.
  const speedup = bfdMs !== null && protocolMs !== null ? Math.round((protocolMs / bfdMs) * 10) / 10 : null;
  // The full answer.
  return { agreedMs, bfdMs, protocolMs, bfdHeard, detectedBy, withdrawnMs, speedup };
}

/** The opening state: OSPF with BFD at FRRouting's defaults, 300 ms by 3. */
export const DEFAULT_INPUT: BfdVersusHellosInput = { client: "ospf", bfd: "registered", remoteTxMs: 300, localRxMs: 300, remoteMult: 3 };
/** The Example: a static route, BFD running but never asked for; nothing ever withdraws the route. */
export const EXAMPLE_INPUT: BfdVersusHellosInput = { client: "static", bfd: "unregistered", remoteTxMs: 300, localRxMs: 300, remoteMult: 3 };
