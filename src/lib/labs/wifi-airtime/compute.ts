// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/wifi-airtime/compute.ts
// ----------------------------------------------------------------------------
// THE WI-FI AIRTIME LAB'S MODEL (2026-10-26), the interactive companion of the
// article "Wi-Fi: a shared medium pretending to be a cable". Up to four clients
// share one channel. Each sends frames of a size the reader picks at a data
// rate the reader picks: a legacy 802.11a/g OFDM rate or an 802.11ac (VHT)
// rate. The model prices one frame of each client in microseconds of airtime,
// then lets every client send one frame in turn (one round) and shows the share
// of the round each client holds, the bytes the cell moves per second of
// airtime, and what the round would give without its slowest client.
//
// IEEE 802.11 itself is behind a sign-in (the IEEE GET program page answered
// with an application shell on 2026-10-26), so every timing comes from one
// vendor's published design guide, read on 2026-10-26: HPE Aruba Networking's
// (then Aruba Networks') "Very High-Density 802.11ac Networks" Validated
// Reference Design, 2015: its Theory Guide (chapter T-3, Understanding
// Airtime), its Engineering and Configuration Guide (data rate tables) and its
// Wi-Fi Frame Time Calculator v2.0 (constants sheet):
//   - payload airtime (µs) = payload bytes * 8 / data rate (Mb/s) (Theory Guide);
//   - every frame starts with a legacy preamble of 20 µs (STF 8 + LTF 8 +
//     SIG 4), sent at 6 Mb/s; an 802.11ac frame adds a VHT preamble, which the
//     guide and the calculator count as 24 µs ("a minimum of 24 µs", longer
//     when more long training fields are needed);
//   - SIFS is 16 µs;
//   - control frames are sent at 6 Mb/s by default, each after its own legacy
//     preamble: RTS 20 bytes, CTS 14 bytes, Block Ack 32 bytes, Ack 14 bytes;
//   - an 802.11ac transmit opportunity is RTS, SIFS, CTS, SIFS, A-MPDU (each
//     MPDU preceded by a 4-byte delimiter), SIFS, Block Ack ("In 802.11ac,
//     virtually all TXOPs begin with an RTS/CTS exchange"); 512 bytes at
//     86.7 Mb/s come to 287.61 µs (Table T3-2), which the vectors reproduce;
//   - a legacy frame is priced as the calculator prices its parts: preamble and
//     payload, SIFS, then an Ack (preamble plus 14 bytes at the control rate);
//   - the rates offered are the guide's: legacy OFDM 6 to 54 Mb/s, and
//     802.11ac MCS rates from its Appendix EC-B (400 ns guard interval).
// With those, an 802.11ac frame costs 240 µs of fixed overhead plus its
// payload, and a legacy frame 74.67 µs plus its payload.
//
// What the model leaves out (the lab's scope note): arbitration before each
// frame (AIFS, 43 µs for best effort, and a random contention window of up to
// 279 µs on a first attempt, both in the guide), retries, aggregation of
// several MPDUs into one A-MPDU, the service field, padding and tail bits
// around the payload (drawn in the guide's preamble figure, T3-7), longer VHT
// preambles for more spatial streams ("generally one LTF required per spatial
// stream"), control rates other than the 6 Mb/s default, 802.11b (DSSS)
// clients, whose preamble times the documents read do not give, and 802.11n,
// 802.11ax and 802.11be.
//
// Pure and deterministic: the same input gives the same result, nothing is read
// from outside, and an invalid input is refused with a stable code.
// ============================================================================

/** The legacy (non-HT OFDM) preamble, µs: STF 8 + LTF 8 + SIG 4 (Aruba frame time calculator). */
export const LEGACY_PREAMBLE_US = 20;
/** The VHT preamble that follows it in an 802.11ac frame, µs (Aruba Theory Guide and calculator). */
export const VHT_PREAMBLE_US = 24;
/** The short interframe space, µs (aSIFSTime in the calculator). */
export const SIFS_US = 16;
/** The default control and management rate, Mb/s (Theory Guide). */
export const CONTROL_RATE_MBPS = 6;
/** RTS size, bytes. */
export const RTS_BYTES = 20;
/** CTS size, bytes. */
export const CTS_BYTES = 14;
/** Block Ack size, bytes. */
export const BA_BYTES = 32;
/** Ack size, bytes. */
export const ACK_BYTES = 14;
/** The A-MPDU delimiter before every MPDU in 802.11ac, bytes. */
export const DELIMITER_BYTES = 4;
/** The smallest frame the lab takes, bytes (the smallest size the guide charts). */
export const MIN_FRAME_BYTES = 64;
/** The largest frame the lab takes, bytes (the largest MPDU size the Theory Guide charts). */
export const MAX_FRAME_BYTES = 3028;

/** A client's PHY: legacy OFDM (802.11a/g) or 802.11ac (VHT). */
export type Phy = "legacy" | "vht";

/** One rate the lab offers. */
export interface RateDef {
  /** Stable id, used by the controls. */
  id: string;
  /** Its PHY. */
  phy: Phy;
  /** The data rate, Mb/s. */
  mbps: number;
  /** Spatial streams (802.11ac only). */
  ss: number | null;
  /** Channel width in MHz (802.11ac only). */
  mhz: number | null;
  /** The MCS index (802.11ac only). */
  mcs: number | null;
}

/** The rates offered: legacy OFDM rates and 802.11ac rates with a 400 ns guard interval (Aruba ECG, Appendix EC-B). */
export const RATES: readonly RateDef[] = Object.freeze([
  // Legacy 802.11a/g: the lowest rate, the default control and basic rate.
  { id: "legacy-6", phy: "legacy", mbps: 6, ss: null, mhz: null, mcs: null },
  // Legacy 12 Mb/s.
  { id: "legacy-12", phy: "legacy", mbps: 12, ss: null, mhz: null, mcs: null },
  // Legacy 24 Mb/s, the control rate the guide recommends for dense areas.
  { id: "legacy-24", phy: "legacy", mbps: 24, ss: null, mhz: null, mcs: null },
  // Legacy 54 Mb/s, the fastest.
  { id: "legacy-54", phy: "legacy", mbps: 54, ss: null, mhz: null, mcs: null },
  // 802.11ac, one stream, 20 MHz, MCS 0: the slowest VHT rate.
  { id: "vht-1ss-20-mcs0", phy: "vht", mbps: 7.2, ss: 1, mhz: 20, mcs: 0 },
  // 802.11ac, one stream, 20 MHz, MCS 4.
  { id: "vht-1ss-20-mcs4", phy: "vht", mbps: 43.3, ss: 1, mhz: 20, mcs: 4 },
  // 802.11ac, one stream, 20 MHz, MCS 8: the guide's reference rate.
  { id: "vht-1ss-20-mcs8", phy: "vht", mbps: 86.7, ss: 1, mhz: 20, mcs: 8 },
  // 802.11ac, two streams, 20 MHz, MCS 8.
  { id: "vht-2ss-20-mcs8", phy: "vht", mbps: 173.3, ss: 2, mhz: 20, mcs: 8 },
  // 802.11ac, one stream, 80 MHz, MCS 9.
  { id: "vht-1ss-80-mcs9", phy: "vht", mbps: 433.3, ss: 1, mhz: 80, mcs: 9 },
  // 802.11ac, two streams, 80 MHz, MCS 9.
  { id: "vht-2ss-80-mcs9", phy: "vht", mbps: 866.7, ss: 2, mhz: 80, mcs: 9 },
]);

/** One client as the reader sets it: a rate id, or "off" when the slot is empty, and a frame size. */
export interface ClientInput {
  /** The rate id, or "off". */
  rate: string;
  /** The frame (MPDU) size in bytes. */
  bytes: number;
}

/** The reader's settings: four client slots, the first always in use. */
export interface AirtimeInput {
  /** The four slots. */
  clients: readonly ClientInput[];
}

/** The parts of one frame's airtime, µs. */
export interface FrameParts {
  /** RTS, CTS and their preambles and SIFS (802.11ac only; 0 for legacy). */
  protection: number;
  /** The preamble(s) before the data. */
  preamble: number;
  /** The payload (with the A-MPDU delimiter for 802.11ac). */
  payload: number;
  /** SIFS and the acknowledgement (Ack or Block Ack) with its preamble. */
  ack: number;
  /** The whole. */
  total: number;
}

/** One client in the result. */
export interface ClientResult {
  /** Its slot, 0 to 3. */
  slot: number;
  /** Its rate. */
  rate: RateDef;
  /** Its frame size, bytes. */
  bytes: number;
  /** Its frame's airtime. */
  parts: FrameParts;
  /** The share of the frame's airtime that is payload (0 to 1). */
  payloadShare: number;
  /** The share of the round it holds (0 to 1). */
  roundShare: number;
}

/** The model's answer. */
export interface AirtimeResult {
  /** The clients in use, in slot order. */
  clients: ClientResult[];
  /** One round: every client sends one frame, µs. */
  roundUs: number;
  /** The payload bits the round moves divided by its airtime: the cell's rate, Mb/s. */
  cellMbps: number;
  /** The slowest client's slot (the longest frame; the lowest slot on a tie). */
  slowest: number;
  /** The round without the slowest client, µs (null with a single client). */
  roundWithoutUs: number | null;
  /** The cell's rate without the slowest client, Mb/s (null with a single client). */
  cellWithoutMbps: number | null;
}

/** The stable codes an invalid input is refused with. */
export type AirtimeErrorCode = "bad-rate" | "bad-bytes" | "no-clients";

/** An invalid input, refused with a stable code the interface can word. */
export class AirtimeError extends Error {
  /** The stable code. */
  readonly code: AirtimeErrorCode;
  /** The slot the refusal concerns, when it concerns one. */
  readonly slot: number | null;
  /** Build the refusal with its code, the slot and an English message for logs. */
  constructor(code: AirtimeErrorCode, slot: number | null, message: string) {
    // The message, for developers.
    super(message);
    // The code, for the interface.
    this.code = code;
    // The slot, for the field to mark.
    this.slot = slot;
  }
}

/** Airtime of a payload at a rate, µs: bytes * 8 / Mb/s (Aruba Theory Guide). */
export function payloadUs(bytes: number, mbps: number): number {
  // Bits over megabits per second is microseconds.
  return (bytes * 8) / mbps;
}

/** A control frame with its legacy preamble, at the default control rate, µs. */
export function controlFrameUs(bytes: number): number {
  // Preamble at 6 Mb/s, then the frame's bytes at the control rate.
  return LEGACY_PREAMBLE_US + payloadUs(bytes, CONTROL_RATE_MBPS);
}

/** One frame's airtime, part by part. */
export function frameParts(rate: RateDef, bytes: number): FrameParts {
  // 802.11ac: the guide's TXOP, RTS to Block Ack.
  if (rate.phy === "vht") {
    // RTS, SIFS, CTS, SIFS.
    const protection = controlFrameUs(RTS_BYTES) + SIFS_US + controlFrameUs(CTS_BYTES) + SIFS_US;
    // Legacy and VHT preambles.
    const preamble = LEGACY_PREAMBLE_US + VHT_PREAMBLE_US;
    // The MPDU and its delimiter at the data rate.
    const payload = payloadUs(bytes + DELIMITER_BYTES, rate.mbps);
    // SIFS and the Block Ack.
    const ack = SIFS_US + controlFrameUs(BA_BYTES);
    // The whole.
    return { protection, preamble, payload, ack, total: protection + preamble + payload + ack };
  }
  // Legacy: preamble, payload, SIFS, Ack.
  const preamble = LEGACY_PREAMBLE_US;
  // The frame at the data rate.
  const payload = payloadUs(bytes, rate.mbps);
  // SIFS and the Ack.
  const ack = SIFS_US + controlFrameUs(ACK_BYTES);
  // The whole.
  return { protection: 0, preamble, payload, ack, total: preamble + payload + ack };
}

/** Price every client's frame, then one round of one frame each. */
export function compute(input: AirtimeInput): AirtimeResult {
  // The clients in use.
  const clients: ClientResult[] = [];
  // Each slot in turn.
  input.clients.forEach((c, slot) => {
    // An empty slot is skipped (the first is never empty in the interface, but the model does not care).
    if (c.rate === "off") return;
    // The rate must be one the lab offers.
    const rate = RATES.find((x) => x.id === c.rate);
    // Refused otherwise.
    if (!rate) throw new AirtimeError("bad-rate", slot, `not a lab rate: ${String(c.rate)}`);
    // The frame size must be a whole number of bytes in range.
    if (!Number.isInteger(c.bytes) || c.bytes < MIN_FRAME_BYTES || c.bytes > MAX_FRAME_BYTES) throw new AirtimeError("bad-bytes", slot, `frame size must be 64 to 3028 bytes, got ${String(c.bytes)}`);
    // Its frame's airtime.
    const parts = frameParts(rate, c.bytes);
    // Its line (the round share is filled in below).
    clients.push({ slot, rate, bytes: c.bytes, parts, payloadShare: payloadUs(c.bytes, rate.mbps) / parts.total, roundShare: 0 });
  });
  // At least one client.
  if (clients.length === 0) throw new AirtimeError("no-clients", null, "no client in the cell");
  // One round: each client sends one frame.
  const roundUs = clients.reduce((s, c) => s + c.parts.total, 0);
  // Each client's share of the round.
  for (const c of clients) c.roundShare = c.parts.total / roundUs;
  // The payload bits the round moves (the delimiter is framing, not payload).
  const bits = clients.reduce((s, c) => s + c.bytes * 8, 0);
  // The slowest client: the longest frame, the lowest slot on a tie.
  const slowest = clients.reduce((a, c) => (c.parts.total > a.parts.total ? c : a), clients[0]).slot;
  // Without it, when there is anyone else.
  const others = clients.filter((c) => c.slot !== slowest);
  // The round without the slowest client.
  const roundWithoutUs = others.length ? others.reduce((s, c) => s + c.parts.total, 0) : null;
  // The cell's rate without it.
  const cellWithoutMbps = roundWithoutUs === null ? null : others.reduce((s, c) => s + c.bytes * 8, 0) / roundWithoutUs;
  // The full answer.
  return { clients, roundUs, cellMbps: bits / roundUs, slowest, roundWithoutUs, cellWithoutMbps };
}

/** The opening state: three 802.11ac clients at different rates, each sending 1,500-byte frames. */
export const DEFAULT_INPUT: AirtimeInput = {
  clients: [
    { rate: "vht-2ss-20-mcs8", bytes: 1500 },
    { rate: "vht-1ss-20-mcs8", bytes: 1500 },
    { rate: "vht-1ss-20-mcs4", bytes: 1500 },
    { rate: "off", bytes: 1500 },
  ],
};

/** The Example: the same cell plus one legacy client at 6 Mb/s, which holds most of every round. */
export const EXAMPLE_INPUT: AirtimeInput = {
  clients: [
    { rate: "vht-2ss-20-mcs8", bytes: 1500 },
    { rate: "vht-1ss-20-mcs8", bytes: 1500 },
    { rate: "vht-1ss-20-mcs4", bytes: 1500 },
    { rate: "legacy-6", bytes: 1500 },
  ],
};
