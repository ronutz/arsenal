// ============================================================================
// src/lib/tools/bfd-timers/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the BFD timer calculator and packet decoder.
//
// Every accept vector names the document (and section) whose text fixes its
// expected numbers, or says the number is computed and from which rule. All
// documents were downloaded with curl on 2026-10-19 (HTTP 200) and are listed
// in the manifest in ./index.ts:
//   RFC 5880  https://www.rfc-editor.org/rfc/rfc5880.txt
//   RFC 5881  https://www.rfc-editor.org/rfc/rfc5881.txt
//   RFC 5883  https://www.rfc-editor.org/rfc/rfc5883.txt
//   RFC 7419  https://www.rfc-editor.org/rfc/rfc7419.txt (errata page: "No matching errata found.")
//   FRRouting https://docs.frrouting.org/en/latest/bfd.html
//   Junos 13.1 https://juniper.net/documentation/en_US/junos13.1/topics/reference/configuration-statement/bfd-liveness-detection-edit-protocols-bgp.html
//   IANA      https://www.iana.org/assignments/bfd-parameters/bfd-parameters-1.csv and -2.csv
// Packet bytes in the decode vectors are computed from the field layout of
// RFC 5880 section 4.1 (for example 300 ms = 300000 us = 0x000493e0).
// Reject vectors pin stable error codes. verifyVectors() runs the whole set
// and returns every failure it finds (the { setId, total, passed, failures }
// shape scripts/run-golden-vectors.mts reads).
// ============================================================================

import { run, runApi, BfdError, type BfdErrorCode, type TimersRequest, type TimersResult, type DecodeResult, type DirectionResult } from "./compute";

/** The set id; scripts/api-sync.json records it, and changing it reopens the API contract check. */
export const GOLDEN_VECTOR_SET_ID = "bfd-timers-golden-2026-10-19"; // first set, 2026-10-19

/** What one direction must show; absent keys are not checked. */
interface DirectionExpect {
  /** The agreed transmit interval, in microseconds. */
  intervalUs?: number;
  /** The receiver's Detection Time in microseconds, or null when none runs. */
  detectionUs?: number | null;
  /** The Detection Time rule used. */
  detectionKind?: "asynchronous" | "demand";
  /** Jitter bounds and average. */
  jitterMinUs?: number;
  jitterMaxUs?: number;
  jitterAverageUs?: number | null;
  /** Whether periodic Control packets flow, and why not. */
  periodic?: boolean;
  silentReason?: "rx-zero" | "demand" | null;
  /** Packets per second (computed, 3 decimals). */
  packetsPerSecond?: number;
  /** RFC 7419 Common Interval membership and the next larger one. */
  commonInterval?: boolean;
  nextCommonIntervalUs?: number | null;
  /** Echo verdict. */
  echoAllowed?: boolean;
  echoReason?: "session-not-up" | "receiver-zero" | "multihop" | null;
  echoMinUs?: number | null;
  /** Explanation ids that must be present. */
  explanationIds?: string[];
  /** A value that must fall inside the jitter range (an observed transmission interval). */
  withinJitterUs?: number;
} // DirectionExpect

/** One timers accept vector. */
interface TimersVector {
  /** Stable id. */
  id: string;
  /** The document and section that fix the expected numbers. */
  source: string;
  /** The request. */
  request: TimersRequest;
  /** A to B (B computes the Detection Time). */
  aToB?: DirectionExpect;
  /** B to A (A computes the Detection Time). */
  bToA?: DirectionExpect;
  /** The exact list of warning ids, in order. */
  warnings?: string[];
  /** The exact list of note ids, in order. */
  notes?: string[];
} // TimersVector

/** One decode accept vector. */
interface DecodeVector {
  /** Stable id. */
  id: string;
  /** The document and section that fix the expected values. */
  source: string;
  /** The packet as hex. */
  packet: string;
  /** Field values; absent keys are not checked. */
  expect: {
    version?: number;
    diag?: number;
    diagName?: string;
    state?: "AdminDown" | "Down" | "Init" | "Up";
    /** The set flag letters in packet order, e.g. "C" or "PF". */
    flags?: string;
    detectMult?: number;
    length?: number;
    my?: number;
    your?: number;
    txUs?: number;
    rxUs?: number;
    echoUs?: number;
    authType?: number | null;
    authName?: string;
    authLength?: number;
    /** The id of the discarding check, or null when no check discards the packet. */
    discardedBy?: string | null;
    /** Finding ids that must be present. */
    findingIds?: string[];
  };
} // DecodeVector

/** One reject vector: a request object, or a raw API string. */
interface RejectVector {
  /** Stable id. */
  id: string;
  /** The request: an object for run(), a string for runApi(). */
  request: unknown;
  /** The error code expected. */
  code: BfdErrorCode;
} // RejectVector

/** A system at FRRouting's documented defaults: 300 ms each way, Detect Mult 3. */
const FRR_DEFAULT = { desiredMinTx: "300ms", requiredMinRx: "300ms", detectMult: 3 } as const; // FRR bfd.html: "Defaults to 300ms", "The default value is 300 milliseconds", "The default value is 3."

/** The calculator vectors. */
export const BFD_TIMERS_VECTORS: readonly TimersVector[] = Object.freeze([
  {
    id: "frr-defaults-up",
    source: "FRRouting documentation, BFD: transmit-interval and receive-interval default 300 ms, detect-multiplier default 3; RFC 5880 s6.8.4 (3 x 300 ms = 900 ms) and s6.8.7 (jitter 0 to 25%, average roughly 12.5% less: 225 to 300 ms, 262.5 ms)",
    request: { a: { ...FRR_DEFAULT }, b: { ...FRR_DEFAULT } },
    aToB: { intervalUs: 300000, detectionUs: 900000, detectionKind: "asynchronous", jitterMinUs: 225000, jitterMaxUs: 300000, jitterAverageUs: 262500, periodic: true, packetsPerSecond: 3.333, commonInterval: false, nextCommonIntervalUs: 1000000, echoAllowed: false, echoReason: "receiver-zero", explanationIds: ["interval-both", "jitter", "rate", "detection-async", "not-common-interval", "echo-receiver-zero"] },
    bToA: { intervalUs: 300000, detectionUs: 900000 },
    warnings: [],
    notes: ["ports-single-hop"],
  },
  {
    id: "frr-detect-multiplier-example",
    source: 'FRRouting documentation, BFD, detect-multiplier: "when the local system has detect-multiplier 3 with transmit-interval 300, and the remote system has receive-interval 200 the remote system will detect failures only after 900 milliseconds"',
    request: { a: { desiredMinTx: "300ms", requiredMinRx: "300ms", detectMult: 3 }, b: { desiredMinTx: "300ms", requiredMinRx: "200ms", detectMult: 3 } },
    aToB: { intervalUs: 300000, detectionUs: 900000, explanationIds: ["interval-sender", "detection-async"] },
    bToA: { intervalUs: 300000, detectionUs: 900000, explanationIds: ["interval-both"] },
    warnings: [],
  },
  {
    id: "frr-show-peers-sample-not-up",
    source: 'FRRouting documentation, BFD, Status: the sample "show bfd peers" (Status: down; local receive and transmit 300ms, Detect-multiplier 3; remote receive and transmit 1000ms; "Transmission interval (actual with jitter): 970ms"; "Detection timeout: 3000ms"); RFC 5880 s6.8.3 (1 s while not Up)',
    request: { a: { desiredMinTx: "300ms", requiredMinRx: "300ms", detectMult: 3, requiredMinEchoRx: "50ms" }, b: { desiredMinTx: "1000ms", requiredMinRx: "1000ms", detectMult: 3 }, sessionUp: false },
    aToB: { intervalUs: 1000000, detectionUs: 3000000, withinJitterUs: 970000, commonInterval: true, explanationIds: ["slow-start-tx", "interval-both"] },
    bToA: { intervalUs: 1000000, detectionUs: 3000000, echoAllowed: false, echoReason: "session-not-up" },
    warnings: [],
    notes: ["slow-start", "ports-single-hop"],
  },
  {
    id: "rfc7419-100ms-times-9",
    source: 'RFC 7419 Appendix A: "100 msec sessions with multiplier 9 (9 x 100 msec), which could be replacing of 3 x 300 msec configurations"; RFC 7419 s3: 100 msec is a Common Interval',
    request: { a: { desiredMinTx: "100ms", requiredMinRx: "100ms", detectMult: 9 }, b: { desiredMinTx: "100ms", requiredMinRx: "100ms", detectMult: 9 } },
    aToB: { intervalUs: 100000, detectionUs: 900000, commonInterval: true, nextCommonIntervalUs: null, packetsPerSecond: 10, explanationIds: ["common-interval"] },
    bToA: { intervalUs: 100000, detectionUs: 900000 },
  },
  {
    id: "rfc5880-s7-aggressive-session",
    source: 'RFC 5880 s7: "a detection time of 50 milliseconds, by using a transmit interval of 16.7 milliseconds and a detect multiplier of 3, will generate 60 packets per second" (the RFC rounds: computed 3 x 16.7 ms = 50.1 ms and 1 s / 16.7 ms = 59.88)',
    request: { a: { desiredMinTx: "16.7ms", requiredMinRx: "16.7ms", detectMult: 3 }, b: { desiredMinTx: "16.7ms", requiredMinRx: "16.7ms", detectMult: 3 } },
    aToB: { intervalUs: 16700, detectionUs: 50100, packetsPerSecond: 59.88, commonInterval: false, nextCommonIntervalUs: 20000 },
    warnings: [],
  },
  {
    id: "rfc7419-s2-ten-versus-twenty",
    source: 'RFC 7419 s2: "A" sets up with 10 msec, "B" uses 20 msec for RequiredMinRxInterval and DesiredMinTxInterval; "Rx and Tx are negotiated as described in [RFC5880], which is 20 msec in this case" (detection 3 x 20 ms = 60 ms computed, RFC 5880 s6.8.4)',
    request: { a: { desiredMinTx: "10ms", requiredMinRx: "10ms", detectMult: 3 }, b: { desiredMinTx: "20ms", requiredMinRx: "20ms", detectMult: 3 } },
    aToB: { intervalUs: 20000, detectionUs: 60000, commonInterval: true, explanationIds: ["interval-receiver"] },
    bToA: { intervalUs: 20000, detectionUs: 60000, explanationIds: ["interval-sender"] },
  },
  {
    id: "asymmetric-receive-1000",
    source: "RFC 5880 s6.8.4 (the greater of bfd.RequiredMinRxInterval and the last received Desired Min TX Interval; different Detection Times in each direction): remote TX 300 ms against local RX 1000 ms gives 3 x 1000 = 3000 ms (computed, NF-2e fact sheet F35)",
    request: { a: { desiredMinTx: "300ms", requiredMinRx: "1000ms", detectMult: 3 }, b: { ...FRR_DEFAULT } },
    aToB: { intervalUs: 300000, detectionUs: 900000 },
    bToA: { intervalUs: 1000000, detectionUs: 3000000, explanationIds: ["interval-receiver"] },
    notes: ["asymmetric", "ports-single-hop"],
  },
  {
    id: "detect-mult-one-jitter",
    source: 'RFC 5880 s6.8.7: "If bfd.DetectMult is equal to 1, the interval between transmitted BFD Control packets MUST be no more than 90% of the negotiated transmission interval, and MUST be no less than 75%" (50 ms: 37.5 to 45 ms, computed)',
    request: { a: { desiredMinTx: "50ms", requiredMinRx: "50ms", detectMult: 1 }, b: { desiredMinTx: "50ms", requiredMinRx: "50ms", detectMult: 3 } },
    aToB: { intervalUs: 50000, detectionUs: 50000, jitterMinUs: 37500, jitterMaxUs: 45000, jitterAverageUs: null, explanationIds: ["jitter-mult-1"] },
    bToA: { intervalUs: 50000, detectionUs: 150000, jitterMinUs: 37500, jitterMaxUs: 50000, jitterAverageUs: 43750 },
  },
  {
    id: "required-min-rx-zero",
    source: 'RFC 5880 s4.1: "If this value is zero, the transmitting system does not want the remote system to send any periodic BFD Control packets"; s6.8.7: "A system MUST NOT periodically transmit BFD Control packets if bfd.RemoteMinRxInterval is zero"',
    request: { a: { ...FRR_DEFAULT }, b: { desiredMinTx: "300ms", requiredMinRx: "0", detectMult: 3 } }, // a bare "0" needs no unit
    aToB: { periodic: false, silentReason: "rx-zero", detectionUs: null, explanationIds: ["silent-rx-zero"] },
    bToA: { periodic: true, detectionUs: 900000 },
    warnings: ["rx-zero"],
  },
  {
    id: "demand-mode-on-b",
    source: "RFC 5880 s6.6 (the system receiving the Demand bit ceases periodic transmission) and s6.8.4 (in Demand mode the Detection Time is bfd.DetectMult times the greater of bfd.DesiredMinTxInterval and bfd.RemoteMinRxInterval): 3 x 300 ms = 900 ms after a Poll Sequence (computed)",
    request: { a: { ...FRR_DEFAULT }, b: { ...FRR_DEFAULT, demand: true } },
    aToB: { periodic: false, silentReason: "demand", detectionKind: "demand", detectionUs: 900000, explanationIds: ["silent-demand", "detection-demand"] },
    bToA: { periodic: true, detectionKind: "asynchronous", detectionUs: 900000 },
    warnings: [],
  },
  {
    id: "demand-requested-not-up",
    source: 'RFC 5880 s6.6: "the Demand bit MUST NOT be set unless both systems perceive the session to be Up"; s6.8.3 (1 s while not Up)',
    request: { a: { ...FRR_DEFAULT }, b: { ...FRR_DEFAULT, demand: true }, sessionUp: false },
    aToB: { periodic: true, detectionKind: "asynchronous", intervalUs: 1000000, detectionUs: 3000000 },
    notes: ["demand-not-up", "slow-start", "ports-single-hop"],
  },
  {
    id: "echo-single-hop",
    source: 'RFC 5880 s6.8.9: Echo packets only when Up and the last received Required Min Echo RX is nonzero, no faster than that value, "A 25% jitter MAY be applied" (50 ms: 37.5 ms, computed); s6.8.3 (with Echo active, Required Min RX SHOULD be at least 1 s)',
    request: { a: { desiredMinTx: "1s", requiredMinRx: "1s", detectMult: 3 }, b: { desiredMinTx: "1s", requiredMinRx: "300ms", detectMult: 3, requiredMinEchoRx: "50ms" } },
    aToB: { echoAllowed: true, echoReason: null, echoMinUs: 50000, explanationIds: ["echo-allowed"] },
    bToA: { echoAllowed: false, echoReason: "receiver-zero" },
  },
  {
    id: "echo-refused-multihop",
    source: 'RFC 5883 s3: "the Echo function MUST NOT be used over multiple hops"; s5: UDP destination port 4784',
    request: { a: { desiredMinTx: "1s", requiredMinRx: "1s", detectMult: 3 }, b: { desiredMinTx: "1s", requiredMinRx: "1s", detectMult: 3, requiredMinEchoRx: "50ms" }, path: "multihop" },
    aToB: { echoAllowed: false, echoReason: "multihop", echoMinUs: null, explanationIds: ["echo-multihop"] },
    warnings: ["echo-on-multihop"],
    notes: ["ports-multihop"],
  },
  {
    id: "below-vendor-floors",
    source: "FRRouting documentation, BFD: receive-interval (10-4294967) and transmit-interval (10-4294967) milliseconds; Junos OS 13.1 bfd-liveness-detection: Range 1 through 255,000 ms; RFC 7419 s3: 3.3 msec is a Common Interval",
    request: { a: { desiredMinTx: "3.3ms", requiredMinRx: "500us", detectMult: 3 }, b: { desiredMinTx: "3.3ms", requiredMinRx: "3.3ms", detectMult: 3 } },
    aToB: { intervalUs: 3300, detectionUs: 9900, commonInterval: true },
    bToA: { intervalUs: 3300, detectionUs: 9900 },
    warnings: ["below-vendor-minimum", "below-vendor-minimum", "below-vendor-minimum", "below-vendor-minimum", "below-vendor-minimum"],
  },
  {
    id: "units-are-equivalent",
    source: "RFC 5880 s4.1 (intervals are in microseconds): 300000 us, 300000 as a number, 0.3 s and 300 MS are the same 300 ms (computed)",
    request: { a: { desiredMinTx: "300000us", requiredMinRx: 300000, detectMult: "3" }, b: { desiredMinTx: "0.3s", requiredMinRx: "300 MS", detectMult: 3 } },
    aToB: { intervalUs: 300000, detectionUs: 900000 },
    bToA: { intervalUs: 300000, detectionUs: 900000 },
  },
  {
    id: "rfc7419-graceful-restart-10s-255",
    source: 'RFC 7419 Appendix A: "The recommended value for large intervals is 10 sec, allowing for a timeout of 42.5 minutes with a multiplier of 255" (255 x 10 s = 2550 s, computed)',
    request: { a: { desiredMinTx: "10s", requiredMinRx: "10s", detectMult: 255 }, b: { desiredMinTx: "10s", requiredMinRx: "10s", detectMult: 255 } },
    aToB: { intervalUs: 10000000, detectionUs: 2550000000, commonInterval: false, explanationIds: ["graceful-restart-interval"] },
  },
]);

/** The decoder vectors. */
export const BFD_DECODE_VECTORS: readonly DecodeVector[] = Object.freeze([
  {
    id: "up-300ms",
    source: "RFC 5880 s4.1 field layout; bytes computed: 0x20 version 1 diag 0, 0xc0 Up, Detect Mult 3, Length 24, 300 ms = 0x000493e0 (NF-2e fact sheet F21, F87)",
    packet: "20 c0 03 18 00 00 00 01 00 00 00 02 00 04 93 e0 00 04 93 e0 00 00 00 00",
    expect: { version: 1, diag: 0, diagName: "No Diagnostic", state: "Up", flags: "", detectMult: 3, length: 24, my: 1, your: 2, txUs: 300000, rxUs: 300000, echoUs: 0, authType: null, discardedBy: null, findingIds: ["diag", "state-up", "c-clear", "echo-zero"] },
  },
  {
    id: "down-slow-start",
    source: "RFC 5880 s4.1 (0x40 is Down; Your Discriminator zero while unknown) and s6.8.3 (1 s = 1000000 us = 0x000f4240 while not Up)",
    packet: "20400318 00000001 00000000 000f4240 000f4240 00000000",
    expect: { state: "Down", your: 0, txUs: 1000000, rxUs: 1000000, discardedBy: null, findingIds: ["your-disc-zero"] },
  },
  {
    id: "detection-expired-control-plane-independent",
    source: "RFC 5880 s4.1: Diag 1 Control Detection Time Expired (0x21 with version 1); Sta Down plus C (0x48)",
    packet: "21:48:03:18:00:00:00:07:00:00:00:00:00:0f:42:40:00:0f:42:40:00:00:00:00",
    expect: { diag: 1, diagName: "Control Detection Time Expired", state: "Down", flags: "C", findingIds: ["c-set"] },
  },
  {
    id: "discard-up-without-your-discriminator",
    source: 'RFC 5880 s6.8.6: "If the Your Discriminator field is zero and the State field is not Down or AdminDown, the packet MUST be discarded"',
    packet: "20c00318 00000001 00000000 000493e0 000493e0 00000000",
    expect: { state: "Up", your: 0, discardedBy: "discard-your-disc-zero" },
  },
  {
    id: "discard-version-2",
    source: 'RFC 5880 s6.8.6: "If the version number is not correct (1), the packet MUST be discarded"',
    packet: "40c00318 00000001 00000002 000493e0 000493e0 00000000",
    expect: { version: 2, discardedBy: "discard-version" },
  },
  {
    id: "poll-and-final-together",
    source: 'RFC 5880 s6.5: "A BFD Control packet MUST NOT have both the Poll (P) and Final (F) bits set" (0xf0 = Up 0xc0 + P 0x20 + F 0x10)',
    packet: "20f00318 00000001 00000002 000493e0 000493e0 00000000",
    expect: { flags: "PF", discardedBy: null, findingIds: ["poll-and-final"] },
  },
  {
    id: "down-advertising-300ms",
    source: "RFC 5880 s6.8.3: when bfd.SessionState is not Up, bfd.DesiredMinTxInterval MUST be at least one second; s6.8.7: Desired Min TX Interval is set to bfd.DesiredMinTxInterval",
    packet: "20400318 00000001 00000000 000493e0 000493e0 00000000",
    expect: { state: "Down", txUs: 300000, discardedBy: null, findingIds: ["tx-below-one-second"] },
  },
  {
    id: "keyed-sha1-authentication",
    source: "RFC 5880 s4.1 (A bit 0x04, Auth Type 4 Keyed SHA1) and s4.4 (Keyed SHA1: Auth Len 28); Length 24 + 28 = 52 (0x34)",
    packet: "20c40334 00000001 00000002 000493e0 000493e0 00000000 041c0000 00000000 00000000 00000000 00000000 00000000 00000000",
    expect: { flags: "A", length: 52, authType: 4, authName: "Keyed SHA1", authLength: 28, discardedBy: null, findingIds: ["auth"] },
  },
  {
    id: "discard-multipoint",
    source: 'RFC 5880 s6.8.6: "If the Multipoint (M) bit is nonzero, the packet MUST be discarded"',
    packet: "20c10318 00000001 00000002 000493e0 000493e0 00000000",
    expect: { flags: "M", discardedBy: "discard-multipoint" },
  },
  {
    id: "discard-detect-mult-zero",
    source: 'RFC 5880 s6.8.6: "If the Detect Mult field is zero, the packet MUST be discarded"',
    packet: "20c00018 00000001 00000002 000493e0 000493e0 00000000",
    expect: { detectMult: 0, discardedBy: "discard-mult-zero" },
  },
  {
    id: "discard-length-beyond-payload",
    source: 'RFC 5880 s6.8.6: "If the Length field is greater than the payload of the encapsulating protocol, the packet MUST be discarded" (Length 32, 24 bytes given)',
    packet: "20c00320 00000001 00000002 000493e0 000493e0 00000000",
    expect: { length: 32, discardedBy: "discard-length-long" },
  },
  {
    id: "echo-50ms",
    source: "RFC 5880 s4.1: Required Min Echo RX Interval in microseconds; 50 ms = 50000 us = 0x0000c350 (computed)",
    packet: "0x20c00318 00000001 00000002 000493e0 000493e0 0000c350",
    expect: { echoUs: 50000, findingIds: ["echo-nonzero"] },
  },
  {
    id: "diag-9-iana",
    source: "IANA BFD Diagnostic Codes registry (bfd-parameters-1.csv): 9, mis-connectivity defect, RFC 6428",
    packet: "29400318 00000001 00000000 000f4240 000f4240 00000000",
    expect: { diag: 9, diagName: "mis-connectivity defect", state: "Down" },
  },
]);

/** The reject vectors. */
export const BFD_REJECT_VECTORS: readonly RejectVector[] = Object.freeze([
  { id: "interval-without-unit", request: { a: { desiredMinTx: "300", requiredMinRx: "300ms", detectMult: 3 }, b: { ...FRR_DEFAULT } }, code: "interval-format" },
  { id: "fraction-of-a-microsecond", request: { a: { desiredMinTx: "0.5us", requiredMinRx: "300ms", detectMult: 3 }, b: { ...FRR_DEFAULT } }, code: "interval-format" },
  { id: "desired-tx-zero-reserved", request: { a: { desiredMinTx: "0ms", requiredMinRx: "300ms", detectMult: 3 }, b: { ...FRR_DEFAULT } }, code: "tx-zero" }, // RFC 5880 s4.1 "The value zero is reserved."
  { id: "detect-mult-zero", request: { a: { desiredMinTx: "300ms", requiredMinRx: "300ms", detectMult: 0 }, b: { ...FRR_DEFAULT } }, code: "mult-range" }, // RFC 5880 s6.8.1 nonzero
  { id: "detect-mult-256", request: { a: { desiredMinTx: "300ms", requiredMinRx: "300ms", detectMult: 256 }, b: { ...FRR_DEFAULT } }, code: "mult-range" }, // 8-bit field, s4.1
  { id: "interval-beyond-32-bits", request: { a: { desiredMinTx: "4294967296us", requiredMinRx: "300ms", detectMult: 3 }, b: { ...FRR_DEFAULT } }, code: "interval-range" }, // 2^32
  { id: "unknown-field", request: { a: { desiredTx: "300ms", desiredMinTx: "300ms", requiredMinRx: "300ms", detectMult: 3 }, b: { ...FRR_DEFAULT } }, code: "field" },
  { id: "missing-system-b", request: { a: { ...FRR_DEFAULT } }, code: "field" },
  { id: "unknown-mode", request: { mode: "simulate", a: { ...FRR_DEFAULT }, b: { ...FRR_DEFAULT } }, code: "field" },
  { id: "api-body-not-json", request: "{a:", code: "json" },
  { id: "packet-odd-digits", request: { mode: "decode", packet: "20c" }, code: "hex-length" },
  { id: "packet-23-bytes", request: { mode: "decode", packet: "20c003180000000100000002000493e0000493e0000000" }, code: "hex-length" },
  { id: "packet-not-hex", request: { mode: "decode", packet: "zz c0 03 18" }, code: "hex-format" },
]);

/**
 * Compare one direction with its expectations.
 * @param where the vector and direction, for messages
 * @param got the computed direction
 * @param want the expectations
 * @param failures the list to append to
 */
function checkDirection(where: string, got: DirectionResult, want: DirectionExpect, failures: string[]): void {
  // Flatten the fields the expectations name.
  const flat: Record<string, unknown> = {
    intervalUs: got.intervalUs, // agreed interval
    detectionUs: got.detection ? got.detection.timeUs : null, // Detection Time
    detectionKind: got.detection ? got.detection.kind : undefined, // rule
    jitterMinUs: got.jitter.minUs, // shortest gap
    jitterMaxUs: got.jitter.maxUs, // longest gap
    jitterAverageUs: got.jitter.averageUs, // average gap
    periodic: got.periodic, // periodic packets?
    silentReason: got.silentReason, // why not
    packetsPerSecond: got.packetsPerSecond, // rate
    commonInterval: got.commonInterval, // RFC 7419 set
    nextCommonIntervalUs: got.nextCommonIntervalUs, // next larger common
    echoAllowed: got.echo.allowed, // echo verdict
    echoReason: got.echo.reason, // echo reason
    echoMinUs: got.echo.minIntervalUs, // echo minimum
  };
  // Scalar expectations.
  for (const [k, v] of Object.entries(want)) {
    // The two list-shaped expectations are checked below.
    if (k === "explanationIds" || k === "withinJitterUs") continue;
    // Strict equality.
    if (flat[k] !== v) failures.push(`[${where}] ${k}: expected ${JSON.stringify(v)}, got ${JSON.stringify(flat[k])}`);
  } // scalars
  // Required explanation ids.
  for (const id of want.explanationIds ?? []) if (!got.explanations.some((e) => e.id === id)) failures.push(`[${where}] explanation ${id} missing (got ${got.explanations.map((e) => e.id).join(", ")})`);
  // An observed interval that must sit inside the jitter range.
  if (want.withinJitterUs !== undefined && (want.withinJitterUs < got.jitter.minUs || want.withinJitterUs > got.jitter.maxUs)) failures.push(`[${where}] ${want.withinJitterUs} us is outside the jitter range ${got.jitter.minUs}..${got.jitter.maxUs}`);
} // checkDirection

/** Run every vector and return every failure. */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Every failure, collected.
  const failures: string[] = [];
  // How many vectors ran.
  let total = 0;
  // Calculator vectors.
  for (const v of BFD_TIMERS_VECTORS) {
    total++; // one more
    const before = failures.length; // to count passes
    let r: TimersResult; // the result
    try {
      r = run(v.request) as TimersResult; // compute
    } catch (e) {
      failures.push(`[${v.id}] threw: ${(e as Error).message}`); // a vector must not throw
      continue; // next vector
    } // computed
    if (v.aToB) checkDirection(`${v.id} A->B`, r.directions[0], v.aToB, failures); // A to B
    if (v.bToA) checkDirection(`${v.id} B->A`, r.directions[1], v.bToA, failures); // B to A
    if (v.warnings) { const ids = r.warnings.map((w) => w.id).join(","); if (ids !== v.warnings.join(",")) failures.push(`[${v.id}] warnings: expected ${v.warnings.join(",")}, got ${ids}`); } // exact warnings
    if (v.notes) { const ids = r.notes.map((w) => w.id).join(","); if (ids !== v.notes.join(",")) failures.push(`[${v.id}] notes: expected ${v.notes.join(",")}, got ${ids}`); } // exact notes
    void before; // passes are counted at the end from the failure-free vectors
  } // calculator
  // Decoder vectors.
  for (const v of BFD_DECODE_VECTORS) {
    total++; // one more
    let r: DecodeResult; // the result
    try {
      r = run({ mode: "decode", packet: v.packet }) as DecodeResult; // decode
    } catch (e) {
      failures.push(`[${v.id}] threw: ${(e as Error).message}`); // a vector must not throw
      continue; // next vector
    } // decoded
    // The set flag letters, in packet order.
    const letters = (r.flags.poll ? "P" : "") + (r.flags.final ? "F" : "") + (r.flags.controlPlaneIndependent ? "C" : "") + (r.flags.authenticationPresent ? "A" : "") + (r.flags.demand ? "D" : "") + (r.flags.multipoint ? "M" : ""); // e.g. "PF"
    // Flatten.
    const flat: Record<string, unknown> = {
      version: r.version, diag: r.diagnostic.code, diagName: r.diagnostic.name, state: r.state.name, flags: letters, // header
      detectMult: r.detectMult, length: r.length, my: r.myDiscriminator, your: r.yourDiscriminator, // counters and discriminators
      txUs: r.desiredMinTxUs, rxUs: r.requiredMinRxUs, echoUs: r.requiredMinEchoRxUs, // intervals
      authType: r.auth ? r.auth.type : null, authName: r.auth?.name, authLength: r.auth?.length, // authentication header
      discardedBy: r.discardedBy ? r.discardedBy.id : null, // the receive check
    };
    // Scalar expectations.
    for (const [k, want] of Object.entries(v.expect)) {
      if (k === "findingIds") continue; // checked below
      if (flat[k] !== want) failures.push(`[${v.id}] ${k}: expected ${JSON.stringify(want)}, got ${JSON.stringify(flat[k])}`); // strict
    } // scalars
    // Required findings.
    for (const id of v.expect.findingIds ?? []) if (!r.findings.some((f) => f.id === id)) failures.push(`[${v.id}] finding ${id} missing (got ${r.findings.map((f) => f.id).join(", ")})`);
  } // decoder
  // Reject vectors.
  for (const v of BFD_REJECT_VECTORS) {
    total++; // one more
    try {
      // A string goes through the API entry point, an object through run().
      if (typeof v.request === "string") runApi(v.request); else run(v.request as TimersRequest); // must throw
      failures.push(`[${v.id}] expected rejection "${v.code}", but the input was accepted`); // it did not
    } catch (e) {
      if (!(e instanceof BfdError) || e.code !== v.code) failures.push(`[${v.id}] expected code "${v.code}", got ${e instanceof BfdError ? e.code : (e as Error).message}`); // wrong refusal
    } // refused
  } // rejects
  // Vectors with no failure line are passes; failures name their vector in brackets.
  const failedIds = new Set(failures.map((f) => /^\[([^\] ]+)/.exec(f)?.[1])); // vector ids that failed
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: total - failedIds.size, failures }; // the runner's VerifyReport shape
} // verifyVectors
