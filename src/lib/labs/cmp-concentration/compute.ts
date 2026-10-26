// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/cmp-concentration/compute.ts
// ----------------------------------------------------------------------------
// THE CMP CONCENTRATION LAB'S MODEL (2026-10-26), the interactive companion of
// the article "iRules, CMP, and the static:: namespace" (its sections on the
// global variable and on the crowded subtable). One virtual server with an
// iRule, a request rate, a number of TMM instances, and one of three ways the
// iRule keeps shared state:
//
//   1. No shared mutable state (constants in static::, data in data groups):
//      the virtual server's requests run across every TMM, and the lab spreads
//      them evenly. CMP is on by default for a virtual server (tmsh reference,
//      ltm virtual, cmp-enabled default yes).
//   2. A global variable that the iRule modifies: "Global variables modified by
//      an iRule will demote the execution of the virtual to a single processor
//      core" (F5 iRules reference, RULE_INIT), so all of its requests run on one
//      TMM and the others sit idle for its traffic.
//   3. Shared state kept in one session-table subtable: the requests still run
//      across every TMM, but "All of the entries in a given subtable are on the
//      same processor" (F5 iRules reference, table), so every table operation
//      on that subtable lands on one processor, with its memory.
//
// The guide this lab rebuilds treated case 3 as if the whole virtual server's
// request work moved to one TMM; the table reference concentrates the
// subtable's entries, so the model concentrates the table operations and keeps
// the requests spread.
//
// What the model leaves out, stated in the lab's scope note: the even split is
// an idealisation (real traffic is placed connection by connection and is never
// exactly even), per-request cost, the cost of a table operation, other
// virtual servers on the same TMMs, and platforms where CMP does not apply.
//
// Pure and deterministic: the same input gives the same result, nothing is read
// from outside, and an invalid input is refused with a stable code.
// ============================================================================

/** The highest request rate the lab accepts, per second. */
export const MAX_RATE = 10000000;
/** The most TMM instances the lab accepts (a bound for the lab, not a platform limit). */
export const MAX_TMMS = 128;
/** The most table operations per request the lab accepts. */
export const MAX_TABLE_OPS = 100;

/** How the iRule keeps state shared across requests. */
export type StatePattern = "spread" | "global" | "subtable";

/** The reader's settings. */
export interface CmpInput {
  /** The virtual server's requests per second. */
  rate: number;
  /** The number of TMM instances. */
  tmms: number;
  /** How the iRule keeps shared state. */
  pattern: StatePattern;
  /** Table operations each request makes on the shared subtable (used only with the subtable pattern). */
  tableOpsPerRequest: number;
}

/** The model's answer. */
export interface CmpResult {
  /** Requests per second on the busiest TMM. */
  busiestRequests: number;
  /** The busiest TMM's share of the virtual server's requests, from 0 to 1. */
  busiestShare: number;
  /** TMMs left with none of this virtual server's requests. */
  idleTmms: number;
  /** Rule 3: table operations per second on the processor that holds the subtable, or null when there is no subtable. */
  subtableOpsOnOne: number | null;
  /** True when the virtual server's request work is on one TMM. */
  demoted: boolean;
}

/** The stable codes an invalid input is refused with. */
export type CmpErrorCode = "bad-rate" | "bad-tmms" | "bad-ops" | "bad-pattern";

/** The error a refused input throws, with its stable code. */
export class CmpError extends Error {
  /** The stable code, for vectors and for the interface's message. */
  readonly code: CmpErrorCode;
  /** Build the error from its code and a message for developers. */
  constructor(code: CmpErrorCode, message: string) {
    // The message for developers.
    super(message);
    // The code for everything else.
    this.code = code;
  }
}

/** Where the virtual server's requests and, with a subtable, its table work land. */
export function compute(input: CmpInput): CmpResult {
  // The pattern must be one of the three.
  if (input.pattern !== "spread" && input.pattern !== "global" && input.pattern !== "subtable") throw new CmpError("bad-pattern", `not a pattern: ${String(input.pattern)}`);
  // The rate must be a positive number within the lab's range (fractions allowed).
  if (!Number.isFinite(input.rate) || input.rate <= 0 || input.rate > MAX_RATE) throw new CmpError("bad-rate", `rate must be above 0 and at most ${MAX_RATE}`);
  // The TMM count must be a whole number within the lab's range.
  if (!Number.isInteger(input.tmms) || input.tmms < 1 || input.tmms > MAX_TMMS) throw new CmpError("bad-tmms", `TMMs must be 1 to ${MAX_TMMS}`);
  // The table operations matter only with the subtable, and must then be a whole number in range.
  if (input.pattern === "subtable" && (!Number.isInteger(input.tableOpsPerRequest) || input.tableOpsPerRequest < 0 || input.tableOpsPerRequest > MAX_TABLE_OPS)) throw new CmpError("bad-ops", `table operations must be 0 to ${MAX_TABLE_OPS}`);
  // Rule 2: a modified global puts every request on one TMM.
  const demoted = input.pattern === "global";
  // Rules 1 and 3: otherwise the requests spread evenly across the TMMs.
  const busiestRequests = demoted ? input.rate : input.rate / input.tmms;
  // The busiest TMM's share of the requests.
  const busiestShare = demoted ? 1 : 1 / input.tmms;
  // Rule 3: every operation on the subtable lands on the one processor that holds it.
  const subtableOpsOnOne = input.pattern === "subtable" ? input.rate * input.tableOpsPerRequest : null;
  // Every figure, for the result panel.
  return { busiestRequests, busiestShare, idleTmms: demoted ? input.tmms - 1 : 0, subtableOpsOnOne, demoted };
}

/** The lab's opening state: 10,000 requests per second on 8 TMMs with no shared mutable state. */
export const DEFAULT_INPUT: CmpInput = { rate: 10000, tmms: 8, pattern: "spread", tableOpsPerRequest: 1 };

/** The Example button's state: the same virtual server with a global variable, demoted to one TMM. */
export const EXAMPLE_INPUT: CmpInput = { rate: 10000, tmms: 8, pattern: "global", tableOpsPerRequest: 1 };
