// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/snat-port-budget/compute.ts
// ----------------------------------------------------------------------------
// THE SNAT PORT BUDGET LAB'S MODEL (2026-10-26), the interactive companion of
// the article "SNAT and the Return-Traffic Problem" (its section "SNAT solves
// routing and buys you a port ceiling"). One virtual server, one busy pool
// member. The reader chooses whether the virtual server translates the client's
// source address, where the member's route back to the client goes, how many
// translation addresses there are and how many source ports the reader plans
// with on each, and the peak number of concurrent connections to the member:
//
//   1. Without SNAT the member sees the client's address and replies to it by
//      its own routing; when that route does not lead back through the BIG-IP,
//      the client receives a response whose source does not match the
//      destination of its request and rejects it. A SNAT for client-initiated
//      connections makes the server send its response back through the BIG-IP
//      (F5, "NATs and SNATs", Routing Administration, Applies To incl. 21.1.0).
//   2. TCP defines a connection by its pair of sockets, each an address and a
//      port (RFC 9293, sections 3.4.1 and 4), so concurrent connections from one
//      translation address to the same member address and port need different
//      source ports. The budget towards one member is therefore the translation
//      addresses multiplied by the source ports on each.
//   3. Past that budget the SNAT cannot process additional connections until
//      source ports become available again (F5, "NATs and SNATs", on ephemeral
//      port exhaustion).
//
// What the model leaves out, stated in the lab's scope note: the platform's own
// source-port range and how it picks ports, ports held in TIME-WAIT after a
// close, other members and virtual servers sharing the addresses, and UDP.
// The input bounds are the lab's, not the platform's.
//
// Pure and deterministic: the same input gives the same result, nothing is read
// from outside, and an invalid input is refused with a stable code.
// ============================================================================

/** The most translation addresses the lab accepts (a bound for the lab, not a platform limit). */
export const MAX_ADDRESSES = 4096;
/** The most source ports per address the lab accepts: a TCP port is a 16-bit number. */
export const MAX_PORTS = 65535;
/** The largest peak of concurrent connections the lab accepts. */
export const MAX_DEMAND = 100000000;

/** Whether the virtual server translates the client's source address. */
export type SnatMode = "none" | "snat";
/** Where the member's route back to the client goes when there is no SNAT. */
export type ReturnPath = "through" | "bypass";

/** The reader's settings. */
export interface SnatInput {
  /** No SNAT, or SNAT (automap or a pool: both translate to BIG-IP-owned addresses). */
  mode: SnatMode;
  /** Without SNAT: whether the member's route to the client goes back through the BIG-IP. */
  returnPath: ReturnPath;
  /** With SNAT: how many translation addresses are in use. */
  addresses: number;
  /** With SNAT: how many source ports the reader plans with on each address. */
  portsPerAddress: number;
  /** The peak number of concurrent connections to the busiest member (one address and port). */
  demand: number;
}

/** How the case ends. */
export type SnatOutcome = "no-snat-ok" | "reply-bypasses" | "fits" | "full" | "exceeds";

/** The model's answer. */
export interface SnatResult {
  /** Whose address the member sees as the source: the client's, or a translation address. */
  memberSees: "client" | "translation";
  /** Whether the member's reply comes back through the BIG-IP. */
  replyThroughBigip: boolean;
  /** Rule 2: the source-port budget towards one member, or null without SNAT. */
  budget: number | null;
  /** The share of the budget the demand uses (1 is all of it), or null without SNAT. */
  share: number | null;
  /** Ports left at the peak, or null without SNAT (0 when full or exceeded). */
  spare: number | null;
  /** Rule 3: connections at the peak with no source port to use, or null without SNAT (0 when they fit). */
  shortfall: number | null;
  /** How the case ends. */
  outcome: SnatOutcome;
}

/** The stable codes an invalid input is refused with. */
export type SnatErrorCode = "bad-mode" | "bad-addresses" | "bad-ports" | "bad-demand";

/** The error a refused input throws, with its stable code. */
export class SnatError extends Error {
  /** The stable code, for vectors and for the interface's message. */
  readonly code: SnatErrorCode;
  /** Build the error from its code and a message for developers. */
  constructor(code: SnatErrorCode, message: string) {
    // The message for developers.
    super(message);
    // The code for everything else.
    this.code = code;
  }
}

/** True when a value is a whole number from min to max. */
function wholeIn(v: number, min: number, max: number): boolean {
  // Whole and within the range.
  return Number.isInteger(v) && v >= min && v <= max;
}

/** Where the reply goes and, with SNAT, how much of the port budget the peak uses. */
export function compute(input: SnatInput): SnatResult {
  // The mode must be one of the two.
  if (input.mode !== "none" && input.mode !== "snat") throw new SnatError("bad-mode", `not a SNAT mode: ${String(input.mode)}`);
  // The return path must be one of the two.
  if (input.returnPath !== "through" && input.returnPath !== "bypass") throw new SnatError("bad-mode", `not a return path: ${String(input.returnPath)}`);
  // Rule 1, without SNAT: the member answers the client directly by its own routing.
  if (input.mode === "none") {
    // The reply comes back through the BIG-IP only when the member's route says so.
    const through = input.returnPath === "through";
    // No translation, so no port budget.
    return { memberSees: "client", replyThroughBigip: through, budget: null, share: null, spare: null, shortfall: null, outcome: through ? "no-snat-ok" : "reply-bypasses" };
  }
  // With SNAT, every count must be valid.
  if (!wholeIn(input.addresses, 1, MAX_ADDRESSES)) throw new SnatError("bad-addresses", `addresses must be 1 to ${MAX_ADDRESSES}`);
  // Ports per address.
  if (!wholeIn(input.portsPerAddress, 1, MAX_PORTS)) throw new SnatError("bad-ports", `ports must be 1 to ${MAX_PORTS}`);
  // The peak demand.
  if (!wholeIn(input.demand, 0, MAX_DEMAND)) throw new SnatError("bad-demand", `demand must be 0 to ${MAX_DEMAND}`);
  // Rule 2: the budget towards one member address and port.
  const budget = input.addresses * input.portsPerAddress;
  // The share of it the peak uses.
  const share = input.demand / budget;
  // Rule 3: what is left, or what is missing.
  const spare = Math.max(0, budget - input.demand);
  // Connections with no port to use.
  const shortfall = Math.max(0, input.demand - budget);
  // Rule 1, with SNAT: the reply is addressed to a BIG-IP-owned address and comes back through it.
  return {
    memberSees: "translation",
    replyThroughBigip: true,
    budget,
    share,
    spare,
    shortfall,
    outcome: input.demand < budget ? "fits" : input.demand === budget ? "full" : "exceeds",
  };
}

/** The lab's opening state: two translation addresses planned at 1,024 ports each, a peak of 2,000 connections to one member. */
export const DEFAULT_INPUT: SnatInput = { mode: "snat", returnPath: "bypass", addresses: 2, portsPerAddress: 1024, demand: 2000 };

/** The Example button's state: three addresses at 1,000 ports each against a peak of 4,500, the budget exceeded by half. */
export const EXAMPLE_INPUT: SnatInput = { mode: "snat", returnPath: "bypass", addresses: 3, portsPerAddress: 1000, demand: 4500 };
