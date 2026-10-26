// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/dhcp-lease-states/compute.ts
// ----------------------------------------------------------------------------
// THE DHCP LEASE LAB'S MODEL (2026-10-26), the interactive companion of the
// article "DHCP: the Lease Lifecycle Behind Automatic Addressing". One IPv4
// client, one DHCP server. The reader sets the lease length, how far into the
// lease the client is, whether it holds a lease at all, where the server sits
// (same subnet, another subnet behind a relay agent, another subnet with no
// relay) and whether the server answers. The model says which state the client
// is in at that moment, what it sends and to whom, and how the exchange ends.
//
// The rules are the article's, each with its source there:
//   - T1 defaults to 0.5 x lease and T2 to 0.875 x lease (RFC 2131, 4.4.5);
//     the client is BOUND before T1, RENEWING from T1, REBINDING from T2, and
//     at expiry it "MUST immediately stop any other network processing" and
//     starts again from INIT (4.4.5).
//   - A client with no lease broadcasts DHCPDISCOVER from 0.0.0.0 to
//     255.255.255.255; a willing server answers and the exchange ends in
//     DHCPACK, BOUND (3.1, 4.4.1).
//   - RENEWING unicasts DHCPREQUEST to the server that issued the lease;
//     REBINDING broadcasts it to any server (4.4.5, table 4 of 4.3.6).
//   - The limited broadcast is not forwarded (IANA special-purpose registry),
//     so a server on another subnet hears a broadcast only through a relay
//     agent; a unicast to its address is routed like any other packet.
//   - Unanswered, the client waits half the time left to T2 (RENEWING) or to
//     expiry (REBINDING), never less than 60 seconds, before sending again
//     (4.4.5). Until expiry it keeps its address (3.7).
// What the model leaves out (the lab's scope note): the random fuzz on T1 and
// T2, timers the server sets itself, DHCPNAK, DHCPDECLINE and the address
// probe, several competing servers, and the relay agent's own fields.
//
// Pure and deterministic: the same input gives the same result, nothing is read
// from outside, and an invalid input is refused with a stable code.
// ============================================================================

/** Where the server sits relative to the client. */
export type ServerPlace = "same-subnet" | "remote-relay" | "remote-no-relay";
/** Every value the server control can take. */
export const SERVER_PLACES: readonly ServerPlace[] = ["same-subnet", "remote-relay", "remote-no-relay"];
/** Whether the client starts with no lease or holds one. */
export type ClientStart = "no-lease" | "holding";
/** Every value the start control can take. */
export const CLIENT_STARTS: readonly ClientStart[] = ["no-lease", "holding"];

/** The reader's settings. */
export interface DhcpLeaseInput {
  /** The lease length in seconds (option 51). */
  lease: number;
  /** How far into the lease the client is, in per cent of the lease (ignored with no lease). */
  elapsedPct: number;
  /** No lease yet, or holding one. */
  start: ClientStart;
  /** Where the server is. */
  server: ServerPlace;
  /** True when the server is running and answers. */
  answers: boolean;
}

/** The client's state at the moment the reader picked, before anything is sent. */
export type StateNow = "INIT" | "BOUND" | "RENEWING" | "REBINDING" | "EXPIRED";
/** What the client sends at that moment. */
export type Message = "none" | "discover" | "request-unicast" | "request-broadcast";
/** How the moment ends. */
export type Outcome = "bound-quiet" | "leased" | "no-offer" | "renewed" | "waiting-renewing" | "rebound" | "waiting-rebinding";
/** Why a message went unanswered. */
export type FailReason = "none" | "no-relay" | "server-silent";

/** The model's answer. */
export interface DhcpLeaseResult {
  /** T1 in seconds from the start of the lease. */
  t1: number;
  /** T2 in seconds from the start of the lease. */
  t2: number;
  /** Expiry in seconds from the start of the lease (the lease length). */
  expiry: number;
  /** Seconds since the lease started (zero with no lease). */
  elapsed: number;
  /** The state at this moment. */
  stateNow: StateNow;
  /** True when the lease has run out and the client stopped network processing. */
  expired: boolean;
  /** What the client sends. */
  message: Message;
  /** True when that message reaches a server (a relay counts as reaching it). */
  reaches: boolean;
  /** True when a relay agent carries the message to the server. */
  viaRelay: boolean;
  /** How it ends. */
  outcome: Outcome;
  /** Why it went unanswered, or "none". */
  failReason: FailReason;
  /** The client's state after the exchange (SELECTING while it waits for an offer). */
  stateAfter: "BOUND" | "RENEWING" | "REBINDING" | "SELECTING";
  /** True when the client may use its address after this moment. */
  addressUsable: boolean;
  /** Seconds before the next retransmission when unanswered in RENEWING or REBINDING, else null. */
  nextRetry: number | null;
  /** Seconds until the next timer (T1, T2 or expiry) while the client waits, else null. */
  untilNext: number | null;
}

/** The stable codes an invalid input is refused with. */
export type DhcpLeaseErrorCode = "bad-lease" | "bad-elapsed" | "bad-choice";

/** An invalid input, refused with a stable code the interface can word. */
export class DhcpLeaseError extends Error {
  /** The stable code. */
  readonly code: DhcpLeaseErrorCode;
  /** Build the refusal with its code and an English message for logs. */
  constructor(code: DhcpLeaseErrorCode, message: string) {
    // The message, for developers.
    super(message);
    // The code, for the interface.
    this.code = code;
  }
}

/** The shortest lease the lab accepts, in seconds (the retransmission floor). */
export const MIN_LEASE = 60;
/** The longest finite lease: 0xffffffff means infinity (RFC 2131, 3.3), so one less. */
export const MAX_LEASE = 4294967294;
/** The largest elapsed share the lab accepts, in per cent: half a lease past expiry. */
export const MAX_ELAPSED_PCT = 150;
/** The retransmission floor in RENEWING and REBINDING, in seconds (RFC 2131, 4.4.5). */
export const RETRY_FLOOR = 60;

/** Compute what the client does at the moment the reader picked. */
export function compute(input: DhcpLeaseInput): DhcpLeaseResult {
  // The lease must be a whole number of seconds in range.
  if (!Number.isInteger(input.lease) || input.lease < MIN_LEASE || input.lease > MAX_LEASE) throw new DhcpLeaseError("bad-lease", `lease must be an integer from ${MIN_LEASE} to ${MAX_LEASE}`);
  // The elapsed share must be a finite number in range.
  if (!Number.isFinite(input.elapsedPct) || input.elapsedPct < 0 || input.elapsedPct > MAX_ELAPSED_PCT) throw new DhcpLeaseError("bad-elapsed", `elapsedPct must be from 0 to ${MAX_ELAPSED_PCT}`);
  // The selects can only send these values; anything else is a programming error.
  if (!SERVER_PLACES.includes(input.server) || !CLIENT_STARTS.includes(input.start) || typeof input.answers !== "boolean") throw new DhcpLeaseError("bad-choice", "unknown server, start or answers value");

  // T1, half the lease (RFC 2131, 4.4.5).
  const t1 = input.lease * 0.5;
  // T2, seven eighths of the lease (same section).
  const t2 = input.lease * 0.875;
  // Expiry, the lease itself.
  const expiry = input.lease;
  // Seconds into the lease; a client with no lease has none.
  const elapsed = input.start === "holding" ? (input.lease * input.elapsedPct) / 100 : 0;
  // A broadcast reaches the server on the same subnet, or through a relay agent.
  const broadcastReaches = input.server !== "remote-no-relay";
  // A relay agent is involved only for a server on another subnet.
  const relayUsed = input.server === "remote-relay";

  // No lease at all: INIT, a broadcast DHCPDISCOVER.
  if (input.start === "no-lease") return initial(t1, t2, expiry, elapsed, "INIT", false, broadcastReaches, relayUsed, input.answers);
  // The lease has run out: stop, then INIT again.
  if (elapsed >= expiry) return initial(t1, t2, expiry, elapsed, "EXPIRED", true, broadcastReaches, relayUsed, input.answers);
  // Before T1 the client is BOUND and sends nothing.
  if (elapsed < t1) {
    // Quiet until T1.
    return { t1, t2, expiry, elapsed, stateNow: "BOUND", expired: false, message: "none", reaches: false, viaRelay: false, outcome: "bound-quiet", failReason: "none", stateAfter: "BOUND", addressUsable: true, nextRetry: null, untilNext: t1 - elapsed };
  }
  // From T1 to T2: RENEWING, a unicast DHCPREQUEST to the leasing server, routed wherever it is.
  if (elapsed < t2) {
    // Answered: the lease restarts and the client is BOUND again.
    if (input.answers) return { t1, t2, expiry, elapsed, stateNow: "RENEWING", expired: false, message: "request-unicast", reaches: true, viaRelay: false, outcome: "renewed", failReason: "none", stateAfter: "BOUND", addressUsable: true, nextRetry: null, untilNext: null };
    // Unanswered: wait half the time left to T2, at least 60 seconds, and keep the address.
    return { t1, t2, expiry, elapsed, stateNow: "RENEWING", expired: false, message: "request-unicast", reaches: true, viaRelay: false, outcome: "waiting-renewing", failReason: "server-silent", stateAfter: "RENEWING", addressUsable: true, nextRetry: Math.max(RETRY_FLOOR, (t2 - elapsed) / 2), untilNext: t2 - elapsed };
  }
  // From T2 to expiry: REBINDING, a broadcast DHCPREQUEST to any server.
  const answered = broadcastReaches && input.answers;
  // Answered: BOUND again.
  if (answered) return { t1, t2, expiry, elapsed, stateNow: "REBINDING", expired: false, message: "request-broadcast", reaches: true, viaRelay: relayUsed, outcome: "rebound", failReason: "none", stateAfter: "BOUND", addressUsable: true, nextRetry: null, untilNext: null };
  // Unanswered: the broadcast died at the router, or the server is silent.
  return { t1, t2, expiry, elapsed, stateNow: "REBINDING", expired: false, message: "request-broadcast", reaches: broadcastReaches, viaRelay: broadcastReaches && relayUsed, outcome: "waiting-rebinding", failReason: broadcastReaches ? "server-silent" : "no-relay", stateAfter: "REBINDING", addressUsable: true, nextRetry: Math.max(RETRY_FLOOR, (expiry - elapsed) / 2), untilNext: expiry - elapsed };
}

/** The INIT path, for a client with no lease or one whose lease has expired. */
function initial(t1: number, t2: number, expiry: number, elapsed: number, stateNow: "INIT" | "EXPIRED", expired: boolean, reaches: boolean, viaRelay: boolean, answers: boolean): DhcpLeaseResult {
  // A broadcast DHCPDISCOVER: it gets an offer only if it reaches a server that answers.
  const leased = reaches && answers;
  // The four messages end in DHCPACK and BOUND; otherwise the client waits in SELECTING with no address.
  return {
    // The lease's timers, for display.
    t1,
    // T2.
    t2,
    // Expiry.
    expiry,
    // Where the client is in the old lease, if any.
    elapsed,
    // INIT, or EXPIRED on the way back to INIT.
    stateNow,
    // Whether the client had to stop network processing first.
    expired,
    // Always a broadcast DHCPDISCOVER.
    message: "discover",
    // Whether the broadcast reaches a server.
    reaches,
    // Whether a relay agent carried it.
    viaRelay: reaches && viaRelay,
    // Leased, or no offer.
    outcome: leased ? "leased" : "no-offer",
    // Why not, when not.
    failReason: leased ? "none" : reaches ? "server-silent" : "no-relay",
    // BOUND after the exchange, or still waiting for an offer.
    stateAfter: leased ? "BOUND" : "SELECTING",
    // An address only once the exchange ends in DHCPACK.
    addressUsable: leased,
    // The SELECTING retransmission schedule is not modelled.
    nextRetry: null,
    // No timer runs without a lease.
    untilNext: null,
  };
}

/** The opening state: a client 60 per cent into an eight-day lease, its server behind a relay agent, renewing. */
export const DEFAULT_INPUT: DhcpLeaseInput = { lease: 691200, elapsedPct: 60, start: "holding", server: "remote-relay", answers: true };
/** The Example: the same client at 90 per cent with no relay agent, stuck in REBINDING although the server is up. */
export const EXAMPLE_INPUT: DhcpLeaseInput = { lease: 691200, elapsedPct: 90, start: "holding", server: "remote-no-relay", answers: true };
