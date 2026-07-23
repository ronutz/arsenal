// ============================================================================
// src/lib/tools/digital-transformation-tracker/compute.ts
// ----------------------------------------------------------------------------
// Deterministic query over the milestone dataset. There is nothing predictive
// in this code: the forward-looking rows are DATA carrying their own
// attribution, and the engine's job is to filter, order, and enforce the
// integrity rule that makes the tool honest -
//
//   INVARIANT: any milestone that is not `shipped` MUST carry a source.
//
// A forecast without a named forecaster is a guess wearing a fact's clothes,
// so the engine treats a missing source as a dataset defect and says so rather
// than rendering it. (D-19.)
// ============================================================================

import { MILESTONES, DOMAINS, CERTAINTIES } from "./milestones";
import type { Milestone, Domain, Certainty } from "./milestones";

export type { Milestone, Domain, Certainty };

export interface TrackerInput {
  /** Restrict to these domains; empty or omitted means all. */
  domains?: Domain[];
  /** Restrict to these certainty tiers; empty or omitted means all. */
  certainties?: Certainty[];
  /** Inclusive lower bound on year. */
  fromYear?: number;
  /** Inclusive upper bound on year. */
  toYear?: number;
}

export interface TrackerResult {
  ok: true;
  /** Matching milestones, oldest first. */
  milestones: Milestone[];
  /** Count per certainty tier across the MATCHED set. */
  countsByCertainty: Record<Certainty, number>;
  /** Count per domain across the MATCHED set. */
  countsByDomain: Record<Domain, number>;
  /** Span of the matched set. */
  firstYear: number | null;
  lastYear: number | null;
  /** How many matched rows are historical fact rather than expectation. */
  settledCount: number;
  /** How many matched rows are forward-looking (scheduled/contested/forecast). */
  forwardCount: number;
}

export interface TrackerError {
  ok: false;
  error: string;
}

/** Dataset integrity: every non-shipped row must be attributed. Returns ids at fault. */
export function findUnattributed(): string[] {
  return MILESTONES.filter(
    (m) => m.certainty !== "shipped" && (!m.source || m.source.trim().length === 0),
  ).map((m) => m.id);
}

/** Dataset integrity: every contested row must explain what is changing. */
export function findContestedWithoutNote(): string[] {
  return MILESTONES.filter(
    (m) => m.certainty === "contested" && (!m.contestedNote || m.contestedNote.trim().length === 0),
  ).map((m) => m.id);
}

/** Query the dataset. Pure and deterministic. */
export function track(input: TrackerInput = {}): TrackerResult | TrackerError {
  const badDomain = (input.domains ?? []).find((d) => !DOMAINS.includes(d));
  if (badDomain) return { ok: false, error: `Unknown domain: ${badDomain}` };
  const badCertainty = (input.certainties ?? []).find((c) => !CERTAINTIES.includes(c));
  if (badCertainty) return { ok: false, error: `Unknown certainty: ${badCertainty}` };
  if (
    input.fromYear !== undefined &&
    input.toYear !== undefined &&
    input.fromYear > input.toYear
  ) {
    return { ok: false, error: "fromYear is later than toYear." };
  }

  const domains = input.domains?.length ? input.domains : DOMAINS;
  const certainties = input.certainties?.length ? input.certainties : CERTAINTIES;

  const matched = MILESTONES.filter(
    (m) =>
      domains.includes(m.domain) &&
      certainties.includes(m.certainty) &&
      (input.fromYear === undefined || m.year >= input.fromYear) &&
      (input.toYear === undefined || m.year <= input.toYear),
  ).sort((a, b) => a.year - b.year || a.id.localeCompare(b.id));

  const countsByCertainty = Object.fromEntries(
    CERTAINTIES.map((c) => [c, matched.filter((m) => m.certainty === c).length]),
  ) as Record<Certainty, number>;
  const countsByDomain = Object.fromEntries(
    DOMAINS.map((d) => [d, matched.filter((m) => m.domain === d).length]),
  ) as Record<Domain, number>;

  const settledCount = matched.filter(
    (m) => m.certainty === "shipped" || m.certainty === "inForce",
  ).length;

  return {
    ok: true,
    milestones: matched,
    countsByCertainty,
    countsByDomain,
    firstYear: matched.length ? matched[0].year : null,
    lastYear: matched.length ? matched[matched.length - 1].year : null,
    settledCount,
    forwardCount: matched.length - settledCount,
  };
}

/** Structured-run entry point (D-49 registry contract): JSON in, JSON out. */
export function run(inputJson: string): TrackerResult | TrackerError {
  let parsed: unknown;
  try {
    parsed = inputJson.trim() ? JSON.parse(inputJson) : {};
  } catch {
    return { ok: false, error: 'Input must be JSON, e.g. {"domains":["money"]}' };
  }
  if (typeof parsed !== "object" || parsed === null) {
    return { ok: false, error: "Input must be a JSON object." };
  }
  return track(parsed as TrackerInput);
}
