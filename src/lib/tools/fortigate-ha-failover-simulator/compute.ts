// ============================================================================
// src/lib/tools/fortigate-ha-failover-simulator/compute.ts
// ----------------------------------------------------------------------------
// FORTIGATE FGCP HA ELECTION SIMULATOR — pure engine.
//
// WHAT IT ANSWERS
// "Why is the unit with the higher priority NOT the primary?" That question is
// asked constantly and the answer is almost always the same: with override
// disabled — the DEFAULT — FGCP compares AGE BEFORE PRIORITY. A unit that
// rebooted has low age, so it stays secondary no matter how high its priority
// is, until something resets the comparison.
//
// THE COMPARISON, IN ORDER
//   1. failed monitored interfaces  — FEWER wins
//   2. age                          — HIGHER wins   <- default position
//   3. priority                     — HIGHER wins
//   4. serial number                — HIGHER wins (deterministic tie-break)
// With override ENABLED, priority moves ABOVE age, so the preferred unit
// reclaims the primary role as soon as it returns — at the cost of the
// failback disruption the default exists to avoid.
//
// The engine also computes the COUNTERFACTUAL: who would be primary if
// override were toggled. That is the single most useful output, because it
// turns "why is this happening" into "here is the setting that decides it".
//
// Pure, bounded, never fetches, never evaluates input as code.
// ============================================================================

import { say, plainText, engineError, type EngineText } from "../engine-text"; // sentences with ids (02/11/2026)
// PAGE LANGUAGE (02/11/2026): every comparison, finding, warning and error is built as an EngineText (a stable id, the
// English as before, and its values). runLocalisable() returns them as such for the page (pack keys
// tools.fortigate-ha-failover-simulator.engine.<id>); run(), elect() and parseMembers() return plainText() of the same
// readings, so the API, the share spec and the golden vectors are unchanged.

const MAX_INPUT = 50_000;
const MAX_MEMBERS = 16;

export interface HaMember {
  readonly name: string;
  readonly serial: string;
  readonly priority: number;
  /** Seconds this unit has been in the cluster. Higher = longer. */
  readonly age: number;
  /** Count of MONITORED interfaces currently down. Fewer wins. */
  readonly failed: number;
}

/** The criteria compared, in evaluation order for the active override mode. */
export type HaCriterion = "failed" | "age" | "priority" | "serial";

/** S is string in the API's reading and EngineText in the page's (runLocalisable). */
export interface Comparison<S = string> {
  readonly criterion: HaCriterion;
  readonly winner: string;
  readonly detail: S; // a sentence
}

/** S is string in the API's reading and EngineText in the page's. */
export interface HaResult<S = string> {
  readonly mode: "simulate" | "reference";
  readonly override: boolean;
  readonly members: readonly HaMember[];
  readonly primary: HaMember | null;
  /** How the winner was decided, criterion by criterion. */
  readonly trace: readonly Comparison<S>[]; // each pairing
  /** Which criterion actually settled it. */
  readonly decidedBy: HaCriterion | null;
  /** Who would be primary with override toggled, when that differs. */
  readonly counterfactual: { readonly override: boolean; readonly primary: string } | null;
  readonly findings: readonly S[]; // each a sentence
  readonly parseWarnings: readonly S[]; // each a sentence
}

/** S is string in the API's reading and EngineText in the page's. */
export interface ToolRunResult<S = string> {
  readonly result: HaResult<S>; // the reading
}

/** Criterion order for a given override setting. Override moves priority
 *  ABOVE age; monitored interfaces always come first and serial always last. */
export function criterionOrder(override: boolean): readonly HaCriterion[] {
  return override
    ? (["failed", "priority", "age", "serial"] as const)
    : (["failed", "age", "priority", "serial"] as const);
}

/** Compare two members on one criterion. Positive = a wins. */
function cmp(a: HaMember, b: HaMember, c: HaCriterion): number {
  switch (c) {
    // Fewer failed monitored interfaces wins, so the sign is inverted.
    case "failed": return b.failed - a.failed;
    case "age": return a.age - b.age;
    case "priority": return a.priority - b.priority;
    // Serial is compared as a string; it exists only to guarantee the election
    // terminates, so any total order will do as long as it is deterministic.
    case "serial": return a.serial > b.serial ? 1 : a.serial < b.serial ? -1 : 0;
  }
}

function describe(c: HaCriterion, w: HaMember, l: HaMember): EngineText {
  const winner = w.name, loser = l.name; // the two units
  switch (c) {
    case "failed":
      return w.failed === 1 // one failed interface, or another count
        ? say("cmp.failedOne", `${winner} has ${w.failed} failed monitored interface against ${loser}'s ${l.failed}. Fewer wins, and this is compared before everything else.`, { winner, n: String(w.failed), loser, m: String(l.failed) }) // one
        : say("cmp.failedMany", `${winner} has ${w.failed} failed monitored interfaces against ${loser}'s ${l.failed}. Fewer wins, and this is compared before everything else.`, { winner, n: String(w.failed), loser, m: String(l.failed) }); // another count
    case "age":
      return say("cmp.age", `${winner} has been in the cluster longer (age ${w.age} vs ${l.age}). Higher age wins, and with override disabled age is compared BEFORE priority.`, { winner, a: String(w.age), b: String(l.age) }); // age
    case "priority":
      return say("cmp.priority", `${winner} has the higher priority (${w.priority} vs ${l.priority}).`, { winner, a: String(w.priority), b: String(l.priority) }); // priority
    case "serial":
      return say("cmp.serial", `Everything else tied, so the serial number decides: ${w.serial} over ${l.serial}. This exists only to make the election deterministic.`, { a: w.serial, b: l.serial }); // serial
  }
}

/** Run the election and record which criterion settled each pairing. */
export function elect(members: readonly HaMember[], override: boolean): {
  primary: HaMember | null; trace: Comparison[]; decidedBy: HaCriterion | null;
} {
  return plainText(electLocalisable(members, override)); // the same reading, as English (the API's)
} // elect

/** Run the election: the page's reading, each comparison's detail an EngineText. */
function electLocalisable(members: readonly HaMember[], override: boolean): {
  primary: HaMember | null; trace: Comparison<EngineText>[]; decidedBy: HaCriterion | null;
} {
  if (members.length === 0) return { primary: null, trace: [], decidedBy: null };
  const order = criterionOrder(override);
  const trace: Comparison<EngineText>[] = []; // each pairing, its detail with an id
  let decidedBy: HaCriterion | null = null;

  let best = members[0];
  for (let i = 1; i < members.length; i++) {
    const challenger = members[i];
    for (const c of order) {
      const d = cmp(best, challenger, c);
      if (d === 0) continue;
      const winner = d > 0 ? best : challenger;
      const loser = d > 0 ? challenger : best;
      trace.push({ criterion: c, winner: winner.name, detail: describe(c, winner, loser) });
      // The criterion that settles the FINAL winner is the one worth naming.
      if (winner !== best || members.length === 2) decidedBy = c;
      else decidedBy = decidedBy ?? c;
      best = winner;
      break;
    }
  }
  // With more than two members the last surviving comparison is the decisive
  // one; recompute it against the runner-up so the reported reason is exact.
  if (members.length > 2) {
    const others = members.filter((m) => m !== best);
    let closest: HaMember | null = null;
    let closestCrit: HaCriterion | null = null;
    for (const o of others) {
      for (const c of order) {
        const d = cmp(best, o, c);
        if (d !== 0) {
          if (closestCrit === null || order.indexOf(c) > order.indexOf(closestCrit)) {
            closest = o; closestCrit = c;
          }
          break;
        }
      }
    }
    if (closestCrit) decidedBy = closestCrit;
    void closest;
  }
  return { primary: best, trace, decidedBy };
}

/** Parse the `member:` and `override:` directive lines. */
export function parseMembers(text: string): { members: HaMember[]; override: boolean; warnings: string[] } {
  return plainText(parseMembersLocalisable(text)); // the same reading, as English (the API's)
} // parseMembers

/** Parse the directive lines: the page's reading, each warning an EngineText. */
function parseMembersLocalisable(text: string): { members: HaMember[]; override: boolean; warnings: EngineText[] } {
  const warnings: EngineText[] = []; // each warning with its id
  const members: HaMember[] = [];
  let override = false;

  const ov = /^\s*override\s*[:=]\s*(\w+)/im.exec(text);
  if (ov) override = /^(enable|on|true|yes)$/i.test(ov[1]);

  const re = /^\s*member\s*:\s*(.+)$/gim;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (members.length >= MAX_MEMBERS) { warnings.push(say("warn.capped", `Only the first ${MAX_MEMBERS} members were parsed.`, { max: String(MAX_MEMBERS) })); break; } // capped
    const f: Record<string, string> = {};
    for (const part of m[1].split(/\s*,\s*/)) {
      const kv = /^\s*([a-z]+)\s*=\s*(.+?)\s*$/i.exec(part);
      if (kv) f[kv[1].toLowerCase()] = kv[2];
    }
    const num = (k: string, dflt: number) => {
      const n = Number(f[k]);
      return Number.isFinite(n) ? n : dflt;
    };
    const name = f.name ?? f.serial ?? `member${members.length + 1}`;
    // FortiOS default priority is 128; assuming it is better than refusing to
    // parse a line that omitted it, and the default is documented.
    members.push({
      name,
      serial: f.serial ?? name,
      priority: num("priority", 128),
      age: num("age", 0),
      failed: num("failed", 0),
    });
  }
  if (members.length === 0) {
    warnings.push(say("warn.noMembers", "No members were recognised. Each member goes on its own line: member: name=FGT-A, serial=FG1, priority=200, age=8600, failed=0")); // none
  }
  if (members.length === 1) {
    warnings.push(say("warn.oneMember", "Only one member was supplied, so there is no election to run. Add at least a second member.")); // one
  }
  return { members, override, warnings };
}

/** Derive the plain-language readings, including the counterfactual. */
function derive(
  members: readonly HaMember[], override: boolean,
  primary: HaMember | null, decidedBy: HaCriterion | null,
  other: HaMember | null,
): EngineText[] {
  const out: EngineText[] = []; // each finding with its id
  if (!primary || members.length < 2) return out;

  // THE question this tool exists for.
  const highestPriority = [...members].sort((a, b) => b.priority - a.priority)[0];
  if (highestPriority.name !== primary.name) {
    if (!override && decidedBy === "age") {
      const highest = highestPriority.name, priority = String(highestPriority.priority), primaryName = primary.name; // the units and the value
      out.push(say("find.ageBeatsPriority", // the default at work
        `${highest} has the highest priority (${priority}) and is NOT primary. That is not a fault: with override DISABLED, which is the default, FGCP compares age before priority, and ${primaryName} has been in the cluster longer. The default exists so a flapping unit cannot repeatedly seize and lose the role, because each seizure is a disruption.`, { highest, priority, primaryName },
      ));
    } else if (!override) {
      const highest = highestPriority.name; // the unit
      const criterion = say(`crit.${decidedBy}`, `${decidedBy}`); // the criterion's name (catalogue crit.<name>)
      out.push(say("find.notPrimary", // decided earlier in the order
        `${highest} has the highest priority and is not primary, decided on ${criterion}. Priority is only consulted after that criterion.`, { highest, criterion },
      ));
    }
  }
  if (decidedBy === "failed") {
    out.push(say("find.byFailed", "The election was settled by monitored interface health, which is compared before every other criterion. Fix the down interface and the comparison moves on to the next criterion.")); // interface health
  }
  if (decidedBy === "serial") {
    out.push(say("find.bySerial", "Every other criterion tied, so the serial number decided. That is deterministic but arbitrary: if you want a specific unit preferred, set a priority rather than relying on this.")); // serial
  }
  if (override) {
    out.push(say("find.override", "Override is ENABLED, so priority is compared before age. The preferred unit reclaims the primary role as soon as it returns, which is usually what people want and does mean a failback disruption each time it comes back.")); // override on
  }
  void other;
  return out;
}

function referenceResult(): HaResult<EngineText> {
  return {
    mode: "reference", override: false, members: [], primary: null, trace: [],
    decidedBy: null, counterfactual: null,
    findings: [
      say("ref.order", "FGCP elects the primary by comparing, in order: failed monitored interfaces (fewer wins), age (higher wins), priority (higher wins), then serial number."), // the order
      say("ref.overrideOff", "With override DISABLED, which is the default, age is compared BEFORE priority. A rebooted unit therefore stays secondary even with a higher priority."), // override off
      say("ref.overrideOn", "With override ENABLED, priority is compared before age, so the preferred unit reclaims the role when it returns, at the cost of a failback disruption."), // override on
      say("ref.describe", "Describe the cluster and this tool runs the election and shows which criterion decided it."), // what to do
      say("ref.lineOverride", "override: disable"), // a sample line (code)
      say("ref.lineMemberA", "member: name=FGT-A, serial=FG100A, priority=200, age=120, failed=0"), // a sample line (code)
      say("ref.lineMemberB", "member: name=FGT-B, serial=FG100B, priority=128, age=8600, failed=0"), // a sample line (code)
    ],
    parseWarnings: [],
  };
}

/** Tool entry point: the API's reading (and the golden vectors'), every sentence in English, exactly as before. */
export function run(input: string): ToolRunResult {
  return plainText(runLocalisable(input)); // the same reading, sentences as their English
} // run

/** The page's reading: the same as run(), with every sentence an EngineText. Deterministic, bounded, never fetches. */
export function runLocalisable(input: string): ToolRunResult<EngineText> {
  if (typeof input !== "string") throw engineError(say("err.notString", "Input must be a string.")); // not text
  if (input.length > MAX_INPUT) {
    const chars = String(input.length), limit = String(MAX_INPUT); // the sizes
    throw engineError(say("err.tooLarge", `Input too large (${chars} chars; limit ${limit}).`, { chars, limit })); // too large
  }
  const text = input.trim();
  if (text === "") return { result: referenceResult() };
  const { members, override, warnings } = parseMembersLocalisable(text); // the members, warnings with ids
  if (members.length === 0) {
    return {
      result: {
        mode: "simulate", override, members: [], primary: null, trace: [],
        decidedBy: null, counterfactual: null, findings: [], parseWarnings: warnings,
      },
    };
  }

  const { primary, trace, decidedBy } = electLocalisable(members, override); // the election, details with ids

  // The counterfactual is the most useful single output: it names the setting
  // that decides the outcome rather than leaving the user to infer it.
  const flipped = elect(members, !override);
  const counterfactual =
    primary && flipped.primary && flipped.primary.name !== primary.name
      ? { override: !override, primary: flipped.primary.name }
      : null;

  const findings = derive(members, override, primary, decidedBy, null);
  if (counterfactual) {
    const other = counterfactual.primary; // who would win
    findings.push(counterfactual.override // the setting flipped on, or off
      ? say("find.counterOn", `With override ENABLED instead, ${other} would be primary. That single setting is what decides this cluster's outcome.`, { other }) // on
      : say("find.counterOff", `With override DISABLED instead, ${other} would be primary. That single setting is what decides this cluster's outcome.`, { other })); // off
  } else if (members.length >= 2) {
    findings.push(say("find.noCounter", "Toggling override would not change the outcome for this cluster, so the override setting is not what is deciding it here.")); // no difference
  }

  return {
    result: {
      mode: "simulate", override, members, primary, trace, decidedBy,
      counterfactual, findings, parseWarnings: warnings,
    },
  };
}
