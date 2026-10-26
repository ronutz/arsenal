// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/tcp-window-ceiling/compute.ts
// ----------------------------------------------------------------------------
// THE TCP WINDOW CEILING LAB'S MODEL (2026-10-26), the interactive companion of
// the article "TCP Connection Lifecycle" (its section "The middle act: how much
// can be in flight"). One TCP connection over one path: the reader sets the
// window the sender may have in flight, the round-trip time and the path's
// rate, and the model gives the two numbers that decide the throughput:
//
//   1. The window ceiling: at most one window is delivered per round trip, so
//      throughput cannot exceed window / RTT, whatever the link rate.
//   2. The bandwidth-delay product (BDP): the rate multiplied by the RTT, the
//      bytes that must be in flight to keep the path full.
//   3. The connection runs at the smaller of the window ceiling and the path
//      rate; when the window is smaller than the BDP, the window is the limit.
//   4. The TCP header's window field is 16 bits, so a window above 64 KiB
//      needs the window scale option; the scale exponent is limited to 14,
//      for a largest window of 1 GiB.
//
// The rules are the article's own, with its sources: a sender may have in
// flight no more than the smaller of the receiver's window and its congestion
// window (RFC 5681, section 2); the bandwidth*delay product and the 64 KiB
// limit of the 16-bit window field (RFC 7323, section 1.1); the Window Scale
// option and its 1 GiB maximum (RFC 7323, sections 2 and 2.3). The window here
// is that smaller value, whichever of the two it comes from. What the model
// leaves out is stated in the lab's scope note: slow start and congestion
// avoidance, loss and retransmission, header overhead, delayed ACKs, and the
// sender's and receiver's buffers.
//
// Pure and deterministic: the same input gives the same result, nothing is read
// from outside, and an invalid input is refused with a stable code.
// ============================================================================

/** Bytes in one KiB. */
export const KIB = 1024;
/** The largest window without window scaling: 2^16 bytes, 64 KiB (RFC 7323, section 1.1). */
export const UNSCALED_MAX_KIB = 64;
/** The largest window with the maximum scale exponent of 14: 2^30 bytes, 1 GiB (RFC 7323, section 2.3), in KiB. */
export const MAX_WINDOW_KIB = 1024 * 1024;
/** The longest round trip the lab accepts, in milliseconds (ten seconds: past any real path). */
export const MAX_RTT_MS = 10000;
/** The fastest path the lab accepts, in Mbit/s (one terabit per second). */
export const MAX_RATE_MBPS = 1000000;

/** The reader's settings. */
export interface TcpWindowInput {
  /** The window the sender may have in flight, in whole KiB. */
  windowKiB: number;
  /** The round-trip time, in milliseconds (fractions allowed). */
  rttMs: number;
  /** The path's rate, in Mbit/s (fractions allowed). */
  rateMbps: number;
}

/** What limits the connection's throughput. */
export type Limit = "window" | "path";

/** The model's answer. */
export interface TcpWindowResult {
  /** The window in bytes. */
  windowBytes: number;
  /** Rule 1: the most the window allows, window / RTT, in Mbit/s. */
  ceilingMbps: number;
  /** Rule 2: the bandwidth-delay product, in bytes. */
  bdpBytes: number;
  /** The smallest whole number of KiB that covers the BDP. */
  neededKiB: number;
  /** Rule 3: the throughput the connection can reach, the smaller of the ceiling and the path rate, in Mbit/s. */
  effectiveMbps: number;
  /** Rule 3: "window" when the ceiling is below the path rate, "path" otherwise. */
  limitedBy: Limit;
  /** The share of the path rate the connection can use, from 0 to 1. */
  utilisation: number;
  /** Rule 4: true when the window is larger than 64 KiB, so it needs the window scale option. */
  needsScaling: boolean;
  /** True when filling the path needs more than 64 KiB in flight. */
  bdpNeedsScaling: boolean;
}

/** The stable codes an invalid input is refused with. */
export type TcpWindowErrorCode = "bad-window" | "bad-rtt" | "bad-rate";

/** The error a refused input throws, with its stable code. */
export class TcpWindowError extends Error {
  /** The stable code, for vectors and for the interface's message. */
  readonly code: TcpWindowErrorCode;
  /** Build the error from its code and a message for developers. */
  constructor(code: TcpWindowErrorCode, message: string) {
    // The message for developers.
    super(message);
    // The code for everything else.
    this.code = code;
  }
}

/** True when a value is a finite number greater than zero and no greater than a maximum. */
function inRange(v: unknown, max: number): v is number {
  // A real number, positive, not past the cap.
  return typeof v === "number" && Number.isFinite(v) && v > 0 && v <= max;
}

/** Work out the window ceiling, the BDP and which of the two limits the connection. */
export function compute(input: TcpWindowInput): TcpWindowResult {
  // The window: a whole number of KiB, from 1 KiB to 1 GiB.
  if (!inRange(input.windowKiB, MAX_WINDOW_KIB) || !Number.isInteger(input.windowKiB)) throw new TcpWindowError("bad-window", `window must be a whole number of KiB from 1 to ${MAX_WINDOW_KIB}: ${String(input.windowKiB)}`);
  // The round trip: positive and no longer than the lab's cap.
  if (!inRange(input.rttMs, MAX_RTT_MS)) throw new TcpWindowError("bad-rtt", `RTT must be greater than 0 and at most ${MAX_RTT_MS} ms: ${String(input.rttMs)}`);
  // The rate: positive and no faster than the lab's cap.
  if (!inRange(input.rateMbps, MAX_RATE_MBPS)) throw new TcpWindowError("bad-rate", `rate must be greater than 0 and at most ${MAX_RATE_MBPS} Mbit/s: ${String(input.rateMbps)}`);
  // The window in bytes (exact: a whole number of KiB times 1,024).
  const windowBytes = input.windowKiB * KIB;
  // Rule 1: bits per round trip over the round trip in microseconds is megabits per second (one division, so it rounds once).
  const ceilingMbps = (windowBytes * 8) / (input.rttMs * 1000);
  // Rule 2: Mbit/s times ms is kilobits; times 1,000 / 8 is bytes, that is, times 125.
  const bdpBytes = input.rateMbps * input.rttMs * 125;
  // The KiB that cover the BDP, rounded up (a window must hold all of it).
  const neededKiB = Math.ceil(bdpBytes / KIB);
  // Rule 3: the window limits the connection only when its ceiling is below the path rate.
  const limitedBy: Limit = ceilingMbps < input.rateMbps ? "window" : "path";
  // Rule 3: the throughput is the smaller of the two.
  const effectiveMbps = limitedBy === "window" ? ceilingMbps : input.rateMbps;
  // Every answer, for the result panel.
  return {
    windowBytes,
    ceilingMbps,
    bdpBytes,
    neededKiB,
    effectiveMbps,
    limitedBy,
    utilisation: effectiveMbps / input.rateMbps,
    needsScaling: input.windowKiB > UNSCALED_MAX_KIB,
    bdpNeedsScaling: bdpBytes > UNSCALED_MAX_KIB * KIB,
  };
}

/** The lab's opening state: the article's own case, the 64 KiB unscaled window on a 100 Mbit/s path with a 100 ms round trip. */
export const DEFAULT_INPUT: TcpWindowInput = { windowKiB: 64, rttMs: 100, rateMbps: 100 };

/** The Example button's state: a gigabit path at 100 ms with a 1 MiB window, scaled and still far too small. */
export const EXAMPLE_INPUT: TcpWindowInput = { windowKiB: 1024, rttMs: 100, rateMbps: 1000 };
