// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/tcp-states/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the TCP states lab (set 2026-10-26a). The segments are
// checked against RFC 9293's own figures, read on 2026-10-26: the handshake
// against Figure 6 (<SEQ=100><CTL=SYN>, <SEQ=300><ACK=101><CTL=SYN,ACK>,
// <SEQ=101><ACK=301><CTL=ACK>), the close against Figure 12
// (<SEQ=100><ACK=300><CTL=FIN,ACK>, <SEQ=300><ACK=101><CTL=ACK>,
// <SEQ=300><ACK=101><CTL=FIN,ACK>, <SEQ=101><ACK=301><CTL=ACK>; A ends in
// TIME-WAIT, B in CLOSED) and the simultaneous close against Figure 13 (both
// FIN-WAIT-1, both CLOSING with <SEQ=101><ACK=301> and <SEQ=301><ACK=101>,
// both TIME-WAIT). The states after each step follow the state diagram,
// Figure 5, and section 3.10's event processing. Reject vectors pin the
// stable error codes. verifyVectors() runs them all; scripts/run-golden-vectors
// runs it at prebuild and fails the build on any drift.
// ============================================================================

import { compute, simulate, TcpStatesError, type Scenario, type TcpState, type TcpStatesErrorCode, type TcpStatesInput } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "tcp-states/2026-10-26a";

/** A whole scenario checked step by step: each step's states and the segment it sent, written as the RFC writes it. */
interface ScenarioVector {
  /** Short stable name. */
  id: string;
  /** The scenario. */
  scenario: Scenario;
  /** Per step: A's state, B's state, and the segment sent ("" when none). */
  steps: readonly (readonly [TcpState, TcpState, string])[];
}

/** A case the lab must answer exactly so for a given step. */
interface StepVector {
  /** Short stable name. */
  id: string;
  /** The reader's settings. */
  input: TcpStatesInput;
  /** A's state after the steps shown. */
  stateA: TcpState;
  /** B's state after the steps shown. */
  stateB: TcpState;
  /** The segments in flight, as the RFC writes them, oldest towards A first. */
  inFlight: readonly string[];
}

/** A case the model must refuse with a given code. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** Settings outside the lab's range (cast, as the interface could never send them). */
  input: TcpStatesInput;
  /** The code the refusal must carry. */
  code: TcpStatesErrorCode;
}

/** A segment in RFC 9293's abbreviated form, for comparison. */
function fmt(s: { seq: number; ack: number | null; flags: string[] } | null): string {
  // No segment.
  if (!s) return "";
  // <SEQ=...>, then <ACK=...> when the ACK flag is on, then <CTL=...>.
  return `<SEQ=${s.seq}>${s.ack === null ? "" : `<ACK=${s.ack}>`}<CTL=${s.flags.join(",")}>`;
}

/** Every scenario, step by step. */
export const TCP_STATES_SCENARIOS: readonly ScenarioVector[] = Object.freeze([
  // Figure 6, lines 2 to 4.
  {
    id: "open-figure-6",
    scenario: "open",
    steps: [
      ["SYN-SENT", "LISTEN", "<SEQ=100><CTL=SYN>"],
      ["SYN-SENT", "SYN-RECEIVED", "<SEQ=300><ACK=101><CTL=SYN,ACK>"],
      ["ESTABLISHED", "SYN-RECEIVED", "<SEQ=101><ACK=301><CTL=ACK>"],
      ["ESTABLISHED", "ESTABLISHED", ""],
    ],
  },
  // Figure 12, lines 2 to 6.
  {
    id: "close-client-figure-12",
    scenario: "close-client",
    steps: [
      ["FIN-WAIT-1", "ESTABLISHED", "<SEQ=100><ACK=300><CTL=FIN,ACK>"],
      ["FIN-WAIT-1", "CLOSE-WAIT", "<SEQ=300><ACK=101><CTL=ACK>"],
      ["FIN-WAIT-2", "CLOSE-WAIT", ""],
      ["FIN-WAIT-2", "LAST-ACK", "<SEQ=300><ACK=101><CTL=FIN,ACK>"],
      ["TIME-WAIT", "LAST-ACK", "<SEQ=101><ACK=301><CTL=ACK>"],
      ["TIME-WAIT", "CLOSED", ""],
      ["CLOSED", "CLOSED", ""],
    ],
  },
  // Figure 12 with B's acknowledgement riding on its FIN: A goes from FIN-WAIT-1 straight to TIME-WAIT (Figure 5, note 2).
  {
    id: "close-client-three-segments",
    scenario: "close-client-3",
    steps: [
      ["FIN-WAIT-1", "ESTABLISHED", "<SEQ=100><ACK=300><CTL=FIN,ACK>"],
      ["FIN-WAIT-1", "LAST-ACK", "<SEQ=300><ACK=101><CTL=FIN,ACK>"],
      ["TIME-WAIT", "LAST-ACK", "<SEQ=101><ACK=301><CTL=ACK>"],
      ["TIME-WAIT", "CLOSED", ""],
      ["CLOSED", "CLOSED", ""],
    ],
  },
  // Figure 12 mirrored: the server closes first and is the one left in TIME-WAIT.
  {
    id: "close-server-mirrored",
    scenario: "close-server",
    steps: [
      ["ESTABLISHED", "FIN-WAIT-1", "<SEQ=300><ACK=100><CTL=FIN,ACK>"],
      ["CLOSE-WAIT", "FIN-WAIT-1", "<SEQ=100><ACK=301><CTL=ACK>"],
      ["CLOSE-WAIT", "FIN-WAIT-2", ""],
      ["LAST-ACK", "FIN-WAIT-2", "<SEQ=100><ACK=301><CTL=FIN,ACK>"],
      ["LAST-ACK", "TIME-WAIT", "<SEQ=301><ACK=101><CTL=ACK>"],
      ["CLOSED", "TIME-WAIT", ""],
      ["CLOSED", "CLOSED", ""],
    ],
  },
  // Figure 13, lines 2 to 4: both FIN-WAIT-1, both CLOSING, both TIME-WAIT.
  {
    id: "close-simultaneous-figure-13",
    scenario: "close-simultaneous",
    steps: [
      ["FIN-WAIT-1", "ESTABLISHED", "<SEQ=100><ACK=300><CTL=FIN,ACK>"],
      ["FIN-WAIT-1", "FIN-WAIT-1", "<SEQ=300><ACK=100><CTL=FIN,ACK>"],
      ["CLOSING", "FIN-WAIT-1", "<SEQ=101><ACK=301><CTL=ACK>"],
      ["CLOSING", "CLOSING", "<SEQ=301><ACK=101><CTL=ACK>"],
      ["TIME-WAIT", "CLOSING", ""],
      ["TIME-WAIT", "TIME-WAIT", ""],
      ["CLOSED", "TIME-WAIT", ""],
      ["CLOSED", "CLOSED", ""],
    ],
  },
  // The ABORT call: <SEQ=SND.NXT><CTL=RST>, both ends CLOSED, no TIME-WAIT anywhere.
  {
    id: "abort-section-3-10-5",
    scenario: "abort",
    steps: [
      ["CLOSED", "ESTABLISHED", "<SEQ=100><CTL=RST>"],
      ["CLOSED", "CLOSED", ""],
    ],
  },
]);

/** Individual steps, with the network's contents. */
export const TCP_STATES_STEPS: readonly StepVector[] = Object.freeze([
  // The starting point of a close: both established, nothing in flight.
  { id: "close-start", input: { scenario: "close-client", step: 0 }, stateA: "ESTABLISHED", stateB: "ESTABLISHED", inFlight: [] },
  // The opening point of the handshake: CLOSED and LISTEN.
  { id: "open-start", input: { scenario: "open", step: 0 }, stateA: "CLOSED", stateB: "LISTEN", inFlight: [] },
  // The Example: both ends in TIME-WAIT, the network empty.
  { id: "example-both-time-wait", input: { scenario: "close-simultaneous", step: 6 }, stateA: "TIME-WAIT", stateB: "TIME-WAIT", inFlight: [] },
  // Both FINs crossing in the network after the second CLOSE (Figure 13, line 2).
  { id: "fins-crossing", input: { scenario: "close-simultaneous", step: 2 }, stateA: "FIN-WAIT-1", stateB: "FIN-WAIT-1", inFlight: ["<SEQ=300><ACK=100><CTL=FIN,ACK>", "<SEQ=100><ACK=300><CTL=FIN,ACK>"] },
  // The RST in flight after the abort: A already CLOSED, B still ESTABLISHED.
  { id: "rst-in-flight", input: { scenario: "abort", step: 1 }, stateA: "CLOSED", stateB: "ESTABLISHED", inFlight: ["<SEQ=100><CTL=RST>"] },
]);

/** The reject cases. */
export const TCP_STATES_REJECTS: readonly RejectVector[] = Object.freeze([
  // A scenario the lab does not offer.
  { id: "bad-scenario", input: { scenario: "simultaneous-open" as unknown as Scenario, step: 0 }, code: "bad-scenario" },
  // A step past the scenario's end (the abort has two).
  { id: "bad-step-past-end", input: { scenario: "abort", step: 3 }, code: "bad-step" },
  // A negative step.
  { id: "bad-step-negative", input: { scenario: "open", step: -1 }, code: "bad-step" },
  // A fractional step.
  { id: "bad-step-fraction", input: { scenario: "open", step: 1.5 }, code: "bad-step" },
]);

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures, one sentence each.
  const failures: string[] = [];
  // Each scenario, step by step.
  for (const v of TCP_STATES_SCENARIOS) {
    // The model's run.
    const { steps } = simulate(v.scenario);
    // The length must match.
    if (steps.length !== v.steps.length) failures.push(`${v.id}: ${steps.length} steps, expected ${v.steps.length}`);
    // Each step's two states and its segment.
    v.steps.forEach(([a, b, seg], i) => {
      // The model's step, if there is one.
      const s = steps[i];
      // Missing steps were reported above.
      if (!s) return;
      // A's state.
      if (s.stateA !== a) failures.push(`${v.id} step ${i + 1}: A is ${s.stateA}, expected ${a}`);
      // B's state.
      if (s.stateB !== b) failures.push(`${v.id} step ${i + 1}: B is ${s.stateB}, expected ${b}`);
      // The segment sent.
      if (fmt(s.sent) !== seg) failures.push(`${v.id} step ${i + 1}: sent ${fmt(s.sent) || "nothing"}, expected ${seg || "nothing"}`);
    });
  }
  // Each step case.
  for (const v of TCP_STATES_STEPS) {
    // The lab's answer.
    const r = compute(v.input);
    // A's state.
    if (r.stateA !== v.stateA) failures.push(`${v.id}: A is ${r.stateA}, expected ${v.stateA}`);
    // B's state.
    if (r.stateB !== v.stateB) failures.push(`${v.id}: B is ${r.stateB}, expected ${v.stateB}`);
    // The network, segment by segment.
    const got = r.inFlight.map(fmt).join(" ");
    // Compared as one string.
    if (got !== v.inFlight.join(" ")) failures.push(`${v.id}: in flight ${got || "nothing"}, expected ${v.inFlight.join(" ") || "nothing"}`);
  }
  // TIME-WAIT lands on the end that closed first, on both in the simultaneous close, on neither after an abort.
  const tw = (s: Scenario): string => compute({ scenario: s, step: 0 }).timeWait.join(",");
  // The client closed first.
  if (tw("close-client") !== "A") failures.push(`close-client: TIME-WAIT at ${tw("close-client")}, expected A`);
  // The server closed first.
  if (tw("close-server") !== "B") failures.push(`close-server: TIME-WAIT at ${tw("close-server")}, expected B`);
  // Both closed at once.
  if (tw("close-simultaneous") !== "A,B") failures.push(`close-simultaneous: TIME-WAIT at ${tw("close-simultaneous")}, expected A,B`);
  // An abort leaves no TIME-WAIT in this model.
  if (tw("abort") !== "") failures.push(`abort: TIME-WAIT at ${tw("abort")}, expected none`);
  // Each reject case: it must throw with the right code.
  for (const r of TCP_STATES_REJECTS) {
    // The code it threw with, or null when it did not throw.
    let code: string | null = null;
    // Run it and catch the refusal.
    try {
      // Should throw.
      compute(r.input);
    } catch (e) {
      // Our error carries a code; anything else is reported as such.
      code = e instanceof TcpStatesError ? e.code : `unexpected ${String(e)}`;
    }
    // Wrong code or no refusal is a failure.
    if (code !== r.code) failures.push(`${r.id}: refused with ${String(code)}, expected ${r.code}`);
  }
  // The report in the shape the runner reads: scenarios, steps, the four TIME-WAIT checks, rejects.
  const total = TCP_STATES_SCENARIOS.length + TCP_STATES_STEPS.length + 4 + TCP_STATES_REJECTS.length;
  // Passed is everything that did not fail (a case can fail on several fields, so floor at zero).
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: Math.max(0, total - failures.length), failures };
}
