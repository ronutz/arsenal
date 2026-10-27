// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/tcp-states/compute.ts
// ----------------------------------------------------------------------------
// THE TCP STATES LAB'S MODEL (2026-10-26), an interactive companion of the
// article "TCP Connection Lifecycle" (its section "Termination: the polite
// close and the abort"). Two TCP endpoints, the client A and the server B. The
// reader picks a scenario and steps through it one event at a time: a user call
// at one end (CLOSE, ABORT, an active OPEN), the arrival of the oldest segment
// in flight towards one end, or the expiry of one end's TIME-WAIT timer. After
// every event the model gives both ends' states, the segment sent or received,
// with its sequence and acknowledgement numbers, and the rule that moved it.
//
// The rules are RFC 9293's, read on 2026-10-26 (Internet Standard, STD 7):
//   - the eleven states and the state diagram, Figure 5, with its note 2 (a
//     FIN that arrives in FIN-WAIT-1 already acknowledging the local FIN leads
//     to TIME-WAIT) (section 3.3.2);
//   - OPEN: an active OPEN sends <SEQ=ISS><CTL=SYN> and enters SYN-SENT
//     (section 3.10.1); in LISTEN a SYN is answered with
//     <SEQ=ISS><ACK=RCV.NXT><CTL=SYN,ACK> and the end enters SYN-RECEIVED
//     (section 3.10.7.2); in SYN-SENT a SYN that acknowledges ours is answered
//     with <SEQ=SND.NXT><ACK=RCV.NXT><CTL=ACK> and the end enters ESTABLISHED
//     (section 3.10.7.3); in SYN-RECEIVED the ACK of our SYN leads to
//     ESTABLISHED (section 3.10.7.4, fifth step);
//   - SYN and FIN each occupy one sequence number, ACK and RST none (section
//     3.4 and the glossary, section 4); once a connection is established every
//     segment carries an acknowledgement number (section 3.1);
//   - CLOSE: from ESTABLISHED a FIN is sent and the end enters FIN-WAIT-1, from
//     CLOSE-WAIT a FIN is sent and it enters LAST-ACK (section 3.10.4);
//   - an arriving ACK of our FIN moves FIN-WAIT-1 to FIN-WAIT-2, CLOSING to
//     TIME-WAIT and LAST-ACK to CLOSED (section 3.10.7.4, fifth step); an
//     arriving FIN is acknowledged and moves ESTABLISHED to CLOSE-WAIT,
//     FIN-WAIT-1 to CLOSING (our FIN not yet acknowledged) or TIME-WAIT (it
//     is), FIN-WAIT-2 to TIME-WAIT (eighth step);
//   - the three closing cases and their segments, Figures 12 and 13 (section
//     3.6); the end that closes actively MUST linger in TIME-WAIT for 2 x MSL
//     (section 3.6.1), the MSL being taken as 2 minutes (section 3.4.2), and
//     the TIME-WAIT timeout deletes the connection and enters CLOSED (section
//     3.10.8);
//   - ABORT in ESTABLISHED sends <SEQ=SND.NXT><CTL=RST>, deletes the TCB and
//     enters CLOSED (section 3.10.5); a valid RST in a synchronized state moves
//     the receiver to CLOSED (sections 3.5.3 and 3.10.7.4, second step).
//     Section 3.5.2 adds that the side issuing a reset "should enter the
//     TIME-WAIT state"; the model follows the ABORT call's own text and the lab
//     names section 3.5.2 in a note.
// The numbers are the RFC's own: ISS 100 for A and 300 for B in the handshake
// (Figure 6), and sequence numbers 100 and 300 at the start of every close
// (Figures 12 and 13), so the lab's segments can be checked against the RFC.
// What the model leaves out (the lab's scope note): data and retransmission,
// lost segments, simultaneous open, a RST answering a SYN, half-duplex closes,
// RFC 5961's checks and reopening a connection from TIME-WAIT.
//
// Pure and deterministic: the same input gives the same result, nothing is read
// from outside, and an invalid input is refused with a stable code.
// ============================================================================

/** The eleven states of RFC 9293, section 3.3.2 (CLOSED being the fictional one: no TCB). */
export type TcpState =
  | "CLOSED"
  | "LISTEN"
  | "SYN-SENT"
  | "SYN-RECEIVED"
  | "ESTABLISHED"
  | "FIN-WAIT-1"
  | "FIN-WAIT-2"
  | "CLOSE-WAIT"
  | "CLOSING"
  | "LAST-ACK"
  | "TIME-WAIT";

/** The two ends: A is the client, B the server. */
export type Peer = "A" | "B";

/** The control flags the lab's segments carry, in the order RFC 9293 writes them (CTL=SYN,ACK; CTL=FIN,ACK). */
export type Flag = "SYN" | "FIN" | "RST" | "ACK";

/** One segment, as the RFC's figures abbreviate it: sequence number, acknowledgement field, control flags. */
export interface Segment {
  /** The end that sent it. */
  from: Peer;
  /** SEG.SEQ. */
  seq: number;
  /** SEG.ACK, or null when the ACK flag is off. */
  ack: number | null;
  /** The control flags, in RFC order. */
  flags: Flag[];
}

/** The scenarios the reader can pick. */
export type Scenario = "open" | "close-client" | "close-client-3" | "close-server" | "close-simultaneous" | "abort";

/** Every value the scenario control can take, in the order the control lists them. */
export const SCENARIOS: readonly Scenario[] = ["open", "close-client", "close-client-3", "close-server", "close-simultaneous", "abort"];

/** The rule that moved an end, one per transition the model knows (the words name each with its section). */
export type Rule =
  | "active-open"
  | "listen-syn"
  | "synsent-synack"
  | "synrcvd-ack"
  | "close-established"
  | "close-closewait"
  | "fin-established"
  | "fin-established-close"
  | "ack-finwait1"
  | "fin-finwait1"
  | "finack-finwait1"
  | "fin-finwait2"
  | "ack-closing"
  | "ack-lastack"
  | "timewait-timeout"
  | "abort"
  | "rst-received";

/** The Maximum Segment Lifetime RFC 9293 takes, in seconds (section 3.4.2: "the MSL is taken to be 2 minutes"). */
export const MSL_SECONDS = 120;
/** How long the end that closed actively lingers in TIME-WAIT, 2 x MSL, in seconds (section 3.6.1, MUST-13). */
export const TIME_WAIT_SECONDS = 2 * MSL_SECONDS;

/** One event of a scenario's script: a user call, a segment's arrival or a timer. */
type Action =
  | { kind: "call"; peer: Peer; call: "active-open" | "close" | "abort" }
  | { kind: "deliver"; peer: Peer; closeAtOnce?: boolean }
  | { kind: "timer"; peer: Peer };

/** One end's transmission control block, the little the lab needs of it. */
interface Tcb {
  /** Its state. */
  state: TcpState;
  /** Its initial send sequence number. */
  iss: number;
  /** SND.NXT: the next sequence number it will send. */
  sndNxt: number;
  /** RCV.NXT: the next sequence number it expects. */
  rcvNxt: number;
  /** The sequence number its FIN occupies, once it has sent one. */
  finSeq: number | null;
}

/** One step of a scenario, as the lab shows it. */
export interface Step {
  /** 1-based position in the scenario. */
  n: number;
  /** The end the event happened at. */
  peer: Peer;
  /** What happened: a user call, an arrival, or the TIME-WAIT timer. */
  event: "call" | "deliver" | "timer";
  /** The rule that moved the end. */
  rule: Rule;
  /** The segment that arrived, for an arrival. */
  received: Segment | null;
  /** The segment the end sent in response, if any. */
  sent: Segment | null;
  /** The state the end passed through on the way, when one event crossed two states (CLOSE-WAIT, FIN-WAIT-2). */
  via: TcpState | null;
  /** The end's state before the event. */
  before: TcpState;
  /** A's state after the event. */
  stateA: TcpState;
  /** B's state after the event. */
  stateB: TcpState;
  /** Segments still in the network after the event, oldest first. */
  inFlight: Segment[];
}

/** The reader's settings. */
export interface TcpStatesInput {
  /** The scenario. */
  scenario: Scenario;
  /** How many of its steps to show: 0 is the starting point, the scenario's length shows them all. */
  step: number;
}

/** The model's answer. */
export interface TcpStatesResult {
  /** Every step of the scenario. */
  steps: Step[];
  /** How many steps the scenario has. */
  total: number;
  /** The steps shown, the first `step` of them. */
  shown: Step[];
  /** A's state at the start of the scenario. */
  startA: TcpState;
  /** B's state at the start of the scenario. */
  startB: TcpState;
  /** A's state after the steps shown. */
  stateA: TcpState;
  /** B's state after the steps shown. */
  stateB: TcpState;
  /** Segments in the network after the steps shown. */
  inFlight: Segment[];
  /** The ends that entered TIME-WAIT at any point of the scenario. */
  timeWait: Peer[];
}

/** The stable codes an invalid input is refused with. */
export type TcpStatesErrorCode = "bad-scenario" | "bad-step" | "no-transition";

/** The error a refused input throws, with its stable code. */
export class TcpStatesError extends Error {
  /** The stable code, for vectors and for the interface's message. */
  readonly code: TcpStatesErrorCode;
  /** Build the error from its code and a message for developers. */
  constructor(code: TcpStatesErrorCode, message: string) {
    // The message for developers.
    super(message);
    // The code for everything else.
    this.code = code;
  }
}

/** The other end. */
function other(p: Peer): Peer {
  // Two ends: one or the other.
  return p === "A" ? "B" : "A";
}

/** A fresh TCB in a given state with given sequence variables. */
function tcb(state: TcpState, iss: number, sndNxt: number, rcvNxt: number): Tcb {
  // No FIN sent yet.
  return { state, iss, sndNxt, rcvNxt, finSeq: null };
}

/** True when the segment carries the flag. */
function has(seg: Segment, f: Flag): boolean {
  // A plain membership test.
  return seg.flags.includes(f);
}

/** True when the segment acknowledges this end's FIN (its ACK field is past the FIN's sequence number). */
function acksOurFin(t: Tcb, seg: Segment): boolean {
  // Only after a FIN was sent, and only with an ACK field beyond it.
  return t.finSeq !== null && seg.ack !== null && seg.ack > t.finSeq;
}

/** The segment an established end sends with the given extra flags: SEQ=SND.NXT, ACK=RCV.NXT (section 3.1). */
function synchronised(peer: Peer, t: Tcb, flags: Flag[]): Segment {
  // The ACK flag is always on once the connection is established.
  return { from: peer, seq: t.sndNxt, ack: t.rcvNxt, flags: [...flags, "ACK"] };
}

/** One scenario: the starting TCBs and the script of events. */
interface ScenarioDef {
  /** A's TCB at the start. */
  a: Tcb;
  /** B's TCB at the start. */
  b: Tcb;
  /** The events, in order. */
  script: Action[];
}

/** Every scenario, with the RFC's own numbers (Figure 6 for the handshake; Figures 12 and 13 for the closes). */
function scenarioDef(s: Scenario): ScenarioDef {
  // A and B established, A next sending 100 and expecting 300, B the reverse (Figures 12 and 13, line 1).
  const established = (): { a: Tcb; b: Tcb } => ({ a: tcb("ESTABLISHED", 99, 100, 300), b: tcb("ESTABLISHED", 299, 300, 100) });
  switch (s) {
    case "open":
      // Figure 6: A CLOSED with ISS 100, B LISTEN with ISS 300 (its passive OPEN already done).
      return {
        a: tcb("CLOSED", 100, 100, 0),
        b: tcb("LISTEN", 300, 300, 0),
        script: [
          // A's user opens actively: SYN.
          { kind: "call", peer: "A", call: "active-open" },
          // The SYN reaches B: SYN,ACK.
          { kind: "deliver", peer: "B" },
          // The SYN,ACK reaches A: ACK.
          { kind: "deliver", peer: "A" },
          // The ACK reaches B.
          { kind: "deliver", peer: "B" },
        ],
      };
    case "close-client":
      // Figure 12: A closes first.
      return {
        ...established(),
        script: [
          // A's user closes: FIN.
          { kind: "call", peer: "A", call: "close" },
          // The FIN reaches B: ACK, CLOSE-WAIT.
          { kind: "deliver", peer: "B" },
          // The ACK reaches A: FIN-WAIT-2.
          { kind: "deliver", peer: "A" },
          // B's user closes: FIN, LAST-ACK.
          { kind: "call", peer: "B", call: "close" },
          // B's FIN reaches A: ACK, TIME-WAIT.
          { kind: "deliver", peer: "A" },
          // A's ACK reaches B: CLOSED.
          { kind: "deliver", peer: "B" },
          // 2 x MSL later A's timer expires: CLOSED.
          { kind: "timer", peer: "A" },
        ],
      };
    case "close-client-3":
      // Figure 12 with B's ACK riding on its FIN (Figure 5, note 2): three segments.
      return {
        ...established(),
        script: [
          // A's user closes: FIN.
          { kind: "call", peer: "A", call: "close" },
          // The FIN reaches B, whose user closes at once: one FIN,ACK, LAST-ACK.
          { kind: "deliver", peer: "B", closeAtOnce: true },
          // B's FIN,ACK reaches A: straight to TIME-WAIT.
          { kind: "deliver", peer: "A" },
          // A's ACK reaches B: CLOSED.
          { kind: "deliver", peer: "B" },
          // 2 x MSL later A's timer expires: CLOSED.
          { kind: "timer", peer: "A" },
        ],
      };
    case "close-server":
      // Figure 12 with the roles swapped: B closes first.
      return {
        ...established(),
        script: [
          // B's user closes: FIN.
          { kind: "call", peer: "B", call: "close" },
          // The FIN reaches A: ACK, CLOSE-WAIT.
          { kind: "deliver", peer: "A" },
          // The ACK reaches B: FIN-WAIT-2.
          { kind: "deliver", peer: "B" },
          // A's user closes: FIN, LAST-ACK.
          { kind: "call", peer: "A", call: "close" },
          // A's FIN reaches B: ACK, TIME-WAIT.
          { kind: "deliver", peer: "B" },
          // B's ACK reaches A: CLOSED.
          { kind: "deliver", peer: "A" },
          // 2 x MSL later B's timer expires: CLOSED.
          { kind: "timer", peer: "B" },
        ],
      };
    case "close-simultaneous":
      // Figure 13: both users close before either FIN arrives.
      return {
        ...established(),
        script: [
          // A's user closes: FIN.
          { kind: "call", peer: "A", call: "close" },
          // B's user closes too, before A's FIN arrives: FIN.
          { kind: "call", peer: "B", call: "close" },
          // B's FIN reaches A, which still waits for the ACK of its own: CLOSING.
          { kind: "deliver", peer: "A" },
          // A's FIN reaches B, likewise: CLOSING.
          { kind: "deliver", peer: "B" },
          // B's ACK reaches A: TIME-WAIT.
          { kind: "deliver", peer: "A" },
          // A's ACK reaches B: TIME-WAIT.
          { kind: "deliver", peer: "B" },
          // A's timer expires: CLOSED.
          { kind: "timer", peer: "A" },
          // B's timer expires: CLOSED.
          { kind: "timer", peer: "B" },
        ],
      };
    case "abort":
      // A's user aborts an established connection.
      return {
        ...established(),
        script: [
          // A's user aborts: RST, CLOSED.
          { kind: "call", peer: "A", call: "abort" },
          // The RST reaches B: CLOSED.
          { kind: "deliver", peer: "B" },
        ],
      };
  }
}

/** The outcome of one event at one end: the rule, the segment sent, the state passed through. */
interface Transition {
  /** The rule applied. */
  rule: Rule;
  /** The segment sent, if any. */
  sent: Segment | null;
  /** An intermediate state crossed in the same event. */
  via: TcpState | null;
}

/** Apply a user call at one end (sections 3.10.1, 3.10.4 and 3.10.5). */
function applyCall(peer: Peer, t: Tcb, call: "active-open" | "close" | "abort"): Transition {
  // An active OPEN from CLOSED: <SEQ=ISS><CTL=SYN>, SND.NXT = ISS + 1, SYN-SENT (section 3.10.1).
  if (call === "active-open" && t.state === "CLOSED") {
    // The SYN.
    const sent: Segment = { from: peer, seq: t.iss, ack: null, flags: ["SYN"] };
    // The SYN occupies one sequence number.
    t.sndNxt = t.iss + 1;
    // The new state.
    t.state = "SYN-SENT";
    // Done.
    return { rule: "active-open", sent, via: null };
  }
  // CLOSE from ESTABLISHED: a FIN, FIN-WAIT-1 (section 3.10.4).
  if (call === "close" && t.state === "ESTABLISHED") {
    // The FIN, carrying the ACK field as every established segment does.
    const sent = synchronised(peer, t, ["FIN"]);
    // Remember where our FIN sits, then step over it.
    t.finSeq = t.sndNxt;
    // The FIN occupies one sequence number.
    t.sndNxt += 1;
    // The new state.
    t.state = "FIN-WAIT-1";
    // Done.
    return { rule: "close-established", sent, via: null };
  }
  // CLOSE from CLOSE-WAIT: a FIN, LAST-ACK (section 3.10.4).
  if (call === "close" && t.state === "CLOSE-WAIT") {
    // The FIN.
    const sent = synchronised(peer, t, ["FIN"]);
    // Remember it and step over it.
    t.finSeq = t.sndNxt;
    // One sequence number.
    t.sndNxt += 1;
    // The new state.
    t.state = "LAST-ACK";
    // Done.
    return { rule: "close-closewait", sent, via: null };
  }
  // ABORT from ESTABLISHED: <SEQ=SND.NXT><CTL=RST>, delete the TCB, CLOSED (section 3.10.5).
  if (call === "abort" && t.state === "ESTABLISHED") {
    // The RST carries no ACK field in the ABORT call's format.
    const sent: Segment = { from: peer, seq: t.sndNxt, ack: null, flags: ["RST"] };
    // The new state.
    t.state = "CLOSED";
    // Done.
    return { rule: "abort", sent, via: null };
  }
  // Any other combination is outside the scripts.
  throw new TcpStatesError("no-transition", `no ${call} transition from ${t.state}`);
}

/** Apply a segment's arrival at one end (sections 3.10.7.2, 3.10.7.3 and 3.10.7.4). */
function applyArrival(peer: Peer, t: Tcb, seg: Segment, closeAtOnce: boolean): Transition {
  // A RST in a synchronized state, valid because it carries exactly RCV.NXT: CLOSED (sections 3.5.3 and 3.10.7.4).
  if (has(seg, "RST")) {
    // Only an established connection receives one in the scripts, and only an exact sequence number is taken as valid.
    if (t.state !== "ESTABLISHED" || seg.seq !== t.rcvNxt) throw new TcpStatesError("no-transition", `RST not modelled in ${t.state}`);
    // The connection is gone.
    t.state = "CLOSED";
    // Nothing is sent in reply to a RST.
    return { rule: "rst-received", sent: null, via: null };
  }
  // LISTEN and a SYN: RCV.NXT = SEG.SEQ + 1, <SEQ=ISS><ACK=RCV.NXT><CTL=SYN,ACK>, SYN-RECEIVED (section 3.10.7.2).
  if (t.state === "LISTEN" && has(seg, "SYN") && !has(seg, "ACK")) {
    // Expect the byte after the SYN.
    t.rcvNxt = seg.seq + 1;
    // The SYN,ACK.
    const sent: Segment = { from: peer, seq: t.iss, ack: t.rcvNxt, flags: ["SYN", "ACK"] };
    // Our SYN occupies one sequence number.
    t.sndNxt = t.iss + 1;
    // The new state.
    t.state = "SYN-RECEIVED";
    // Done.
    return { rule: "listen-syn", sent, via: null };
  }
  // SYN-SENT and a SYN,ACK acknowledging our SYN: <SEQ=SND.NXT><ACK=RCV.NXT><CTL=ACK>, ESTABLISHED (section 3.10.7.3).
  if (t.state === "SYN-SENT" && has(seg, "SYN") && seg.ack === t.sndNxt) {
    // Expect the byte after their SYN.
    t.rcvNxt = seg.seq + 1;
    // The new state.
    t.state = "ESTABLISHED";
    // The ACK that completes the handshake.
    return { rule: "synsent-synack", sent: synchronised(peer, t, []), via: null };
  }
  // SYN-RECEIVED and the ACK of our SYN: ESTABLISHED (section 3.10.7.4, fifth step).
  if (t.state === "SYN-RECEIVED" && seg.ack === t.sndNxt && !has(seg, "SYN") && !has(seg, "FIN")) {
    // The new state; nothing is sent.
    t.state = "ESTABLISHED";
    // Done.
    return { rule: "synrcvd-ack", sent: null, via: null };
  }
  // From here on the segment may carry a FIN; the ACK field is processed first (fifth step), the FIN after (eighth step).
  const fin = has(seg, "FIN");
  // A FIN advances RCV.NXT over itself when it is processed (eighth step).
  const takeFin = (): void => {
    // The FIN occupies one sequence number.
    t.rcvNxt = seg.seq + 1;
  };
  // ESTABLISHED and a FIN: acknowledge it, CLOSE-WAIT; or, if the user closes at once, one FIN,ACK and LAST-ACK.
  if (t.state === "ESTABLISHED" && fin) {
    // Step over the FIN.
    takeFin();
    // The plain case: the ACK goes out on its own.
    if (!closeAtOnce) {
      // CLOSE-WAIT.
      t.state = "CLOSE-WAIT";
      // The acknowledgement of the FIN.
      return { rule: "fin-established", sent: synchronised(peer, t, []), via: null };
    }
    // The user closes before the acknowledgement leaves: the FIN carries it (sections 3.1 and 3.10.4).
    const sent = synchronised(peer, t, ["FIN"]);
    // Remember our FIN and step over it.
    t.finSeq = t.sndNxt;
    // One sequence number.
    t.sndNxt += 1;
    // Through CLOSE-WAIT to LAST-ACK in one event.
    t.state = "LAST-ACK";
    // Done.
    return { rule: "fin-established-close", sent, via: "CLOSE-WAIT" };
  }
  // FIN-WAIT-1: the ACK field first, then the FIN.
  if (t.state === "FIN-WAIT-1") {
    // Does this segment acknowledge our FIN?
    const acked = acksOurFin(t, seg);
    // An ACK of our FIN without a FIN: FIN-WAIT-2 (fifth step).
    if (acked && !fin) {
      // The new state; nothing is sent.
      t.state = "FIN-WAIT-2";
      // Done.
      return { rule: "ack-finwait1", sent: null, via: null };
    }
    // A FIN that also acknowledges ours: FIN-WAIT-2 on the ACK, then TIME-WAIT on the FIN (Figure 5, note 2).
    if (acked && fin) {
      // Step over the FIN.
      takeFin();
      // TIME-WAIT.
      t.state = "TIME-WAIT";
      // The acknowledgement of their FIN.
      return { rule: "finack-finwait1", sent: synchronised(peer, t, []), via: "FIN-WAIT-2" };
    }
    // A FIN while ours is unacknowledged: CLOSING (eighth step).
    if (fin) {
      // Step over the FIN.
      takeFin();
      // CLOSING.
      t.state = "CLOSING";
      // The acknowledgement of their FIN.
      return { rule: "fin-finwait1", sent: synchronised(peer, t, []), via: null };
    }
  }
  // FIN-WAIT-2 and a FIN: acknowledge it, TIME-WAIT (eighth step).
  if (t.state === "FIN-WAIT-2" && fin) {
    // Step over the FIN.
    takeFin();
    // TIME-WAIT.
    t.state = "TIME-WAIT";
    // The acknowledgement.
    return { rule: "fin-finwait2", sent: synchronised(peer, t, []), via: null };
  }
  // CLOSING and the ACK of our FIN: TIME-WAIT (fifth step).
  if (t.state === "CLOSING" && !fin && acksOurFin(t, seg)) {
    // TIME-WAIT; nothing is sent.
    t.state = "TIME-WAIT";
    // Done.
    return { rule: "ack-closing", sent: null, via: null };
  }
  // LAST-ACK and the ACK of our FIN: delete the TCB, CLOSED (fifth step).
  if (t.state === "LAST-ACK" && !fin && acksOurFin(t, seg)) {
    // CLOSED; nothing is sent.
    t.state = "CLOSED";
    // Done.
    return { rule: "ack-lastack", sent: null, via: null };
  }
  // Any other combination is outside the scripts.
  throw new TcpStatesError("no-transition", `no arrival transition in ${t.state} for ${seg.flags.join(",")}`);
}

/** Run a scenario's whole script: every step with both ends' states after it. */
export function simulate(s: Scenario): { steps: Step[]; startA: TcpState; startB: TcpState } {
  // A scenario the lab does not offer is refused.
  if (!SCENARIOS.includes(s)) throw new TcpStatesError("bad-scenario", `not a lab scenario: ${String(s)}`);
  // The scenario's starting point and script.
  const def = scenarioDef(s);
  // The two TCBs, mutated as the events run.
  const tcbs: Record<Peer, Tcb> = { A: def.a, B: def.b };
  // The starting states, kept for the result.
  const startA = def.a.state;
  // B's starting state.
  const startB = def.b.state;
  // Segments in the network, by the end they travel towards, oldest first.
  const queue: Record<Peer, Segment[]> = { A: [], B: [] };
  // The steps, built one per event.
  const steps: Step[] = [];
  // Run the events in order.
  for (const action of def.script) {
    // The end the event happens at.
    const peer = action.peer;
    // Its TCB.
    const t = tcbs[peer];
    // Its state before the event.
    const before = t.state;
    // The segment that arrives, for an arrival.
    let received: Segment | null = null;
    // The transition the event causes.
    let tr: Transition;
    // A user call.
    if (action.kind === "call") tr = applyCall(peer, t, action.call);
    // An arrival: the oldest segment travelling towards this end.
    else if (action.kind === "deliver") {
      // Take it off the network.
      const seg = queue[peer].shift();
      // The scripts never deliver from an empty network.
      if (!seg) throw new TcpStatesError("no-transition", `nothing in flight towards ${peer}`);
      // Keep it for the step.
      received = seg;
      // Process it.
      tr = applyArrival(peer, t, seg, action.closeAtOnce === true);
    }
    // The TIME-WAIT timer: only meaningful in TIME-WAIT (section 3.10.8).
    else {
      // Anything else is outside the scripts.
      if (t.state !== "TIME-WAIT") throw new TcpStatesError("no-transition", `no timer in ${t.state}`);
      // Delete the TCB, CLOSED.
      t.state = "CLOSED";
      // Nothing is sent.
      tr = { rule: "timewait-timeout", sent: null, via: null };
    }
    // A segment sent goes into the network towards the other end.
    if (tr.sent) queue[other(peer)].push(tr.sent);
    // The step, with a snapshot of both states and of the network.
    steps.push({
      n: steps.length + 1,
      peer,
      event: action.kind,
      rule: tr.rule,
      received,
      sent: tr.sent,
      via: tr.via,
      before,
      stateA: tcbs.A.state,
      stateB: tcbs.B.state,
      inFlight: [...queue.A, ...queue.B].map((x) => ({ ...x, flags: [...x.flags] })),
    });
  }
  // The whole run.
  return { steps, startA, startB };
}

/** The lab's answer: the scenario's steps and both ends' states after the steps shown. */
export function compute(input: TcpStatesInput): TcpStatesResult {
  // Run the scenario (refuses an unknown one).
  const { steps, startA, startB } = simulate(input.scenario);
  // The number of steps.
  const total = steps.length;
  // The step must be a whole number from 0 to the scenario's length.
  if (typeof input.step !== "number" || !Number.isInteger(input.step) || input.step < 0 || input.step > total) {
    // Refused with its own code.
    throw new TcpStatesError("bad-step", `step must be a whole number from 0 to ${total}: ${String(input.step)}`);
  }
  // The steps shown.
  const shown = steps.slice(0, input.step);
  // The last step shown, if any.
  const last = shown.length ? shown[shown.length - 1] : null;
  // Every end that entered TIME-WAIT somewhere in the scenario.
  const timeWait = (["A", "B"] as const).filter((p) => steps.some((s) => (p === "A" ? s.stateA : s.stateB) === "TIME-WAIT"));
  // The answer.
  return {
    steps,
    total,
    shown,
    startA,
    startB,
    stateA: last ? last.stateA : startA,
    stateB: last ? last.stateB : startB,
    inFlight: last ? last.inFlight : [],
    timeWait: [...timeWait],
  };
}

/** The number of steps a scenario has (for the step control). */
export function stepCount(s: Scenario): number {
  // Run it and count.
  return simulate(s).steps.length;
}

/** The lab's opening state: the client closes first, every step shown (Figure 12). */
export const DEFAULT_INPUT: TcpStatesInput = { scenario: "close-client", step: 7 };

/** The Example button's state: the simultaneous close, stopped where both ends sit in TIME-WAIT (Figure 13, line 4). */
export const EXAMPLE_INPUT: TcpStatesInput = { scenario: "close-simultaneous", step: 6 };
