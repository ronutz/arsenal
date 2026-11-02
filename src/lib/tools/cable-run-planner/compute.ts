// ============================================================================
// src/lib/tools/cable-run-planner/compute.ts
// ----------------------------------------------------------------------------
// THE CABLE RUN PLANNER ENGINE - deterministic media selection for one link.
// Inputs: target speed, one-way channel distance, environment, and required
// PoE class. Output: every compliant medium option (twisted-pair category or
// fiber grade + optic), each with the governing rule cited (ANSI/TIA-568
// channel limits, IEEE 802.3 clause reaches), plus honest exclusions saying
// exactly WHY a medium fails (distance cap, speed cap, environment).
// No scoring magic: the rules table below IS the tool, every row traceable
// to the cited standard. Where the industry practice exceeds the letter of a
// spec (e.g. Cat 8 being shielded in practice), the note says so. (D-19.)
//
// PAGE LANGUAGE (02/11/2026): every sentence the page shows (labels, rules,
// notes, exclusion reasons, the verdict, input errors) is built as an
// EngineText (src/lib/tools/engine-text.ts): a stable id, the English exactly
// as before, and its values. runLocalisable() returns the reading with those
// objects in place; run(), the API's and the vectors' entry, returns
// plainText() of the same reading, byte for byte what it was. Thrown errors
// keep their class and message and carry their sentence.
// ============================================================================

import { say, plainText, listOf, engineError, type EngineText } from "../engine-text"; // sentences with ids (02/11/2026)

/** Supported link speeds, in Mb/s. Named tiers keep the UI honest. */
export const SPEEDS = [100, 1000, 2500, 5000, 10000, 25000, 40000, 100000] as const;
export type SpeedMbps = (typeof SPEEDS)[number];

/** Deployment environment - drives shielding + jacket guidance. */
export type Environment = "office" | "industrial" | "plenum" | "outdoor";

/** Required PoE class per IEEE 802.3 (none | af | at | bt). */
export type PoeClass = "none" | "af" | "at" | "bt";

export interface PlannerInput {
  speedMbps: number;
  distanceM: number;
  environment: Environment;
  poe: PoeClass;
}

export interface MediaOption<S = string> {
  /** Machine id, e.g. "cat6a", "om4-sr", "smf-lr". */
  id: string;
  /** Human label, e.g. "Cat 6A (F/UTP recommended)". */
  label: S;
  /** "copper" | "fiber". */
  medium: "copper" | "fiber";
  /** Max compliant distance for the requested speed, meters. */
  maxDistanceM: number;
  /** Governing rule, verbatim-citable. */
  rule: S;
  /** Environment / PoE notes appended for this option. */
  notes: S[];
}

export interface Exclusion<S = string> {
  id: string;
  label: S;
  reason: S;
}

/** S is string in the API's reading and EngineText in the page's (runLocalisable). */
export interface PlannerResult<S = string> {
  input: PlannerInput;
  options: MediaOption<S>[];
  excluded: Exclusion<S>[];
  /** One-paragraph plain-language verdict. */
  text: S;
}

// ----------------------------------------------------------------------------
// The rules table. Every row cites its source standard. Distances are the
// standard channel/reach limits; where a limit is a range in the standard
// (Cat 6 at 10G), the commonly-cited upper figure is used and the note says
// the range. This table is what the golden vectors pin.
// ----------------------------------------------------------------------------

interface CopperRule {
  id: string;
  label: string;
  /** speed (Mb/s) -> max channel meters; absent speed = not supported. */
  reach: Partial<Record<SpeedMbps, number>>;
  perSpeedNote?: Partial<Record<SpeedMbps, string>>;
  baseNote?: string;
}

const COPPER: CopperRule[] = [
  {
    id: "cat5e",
    label: "Cat 5e",
    reach: { 100: 100, 1000: 100, 2500: 100 },
    perSpeedNote: {
      2500: "2.5GBASE-T is specified for Cat 5e at 100 m by IEEE 802.3bz.",
    },
    baseNote: "ANSI/TIA-568 100 m channel (90 m permanent link + 10 m cords).",
  },
  {
    id: "cat6",
    label: "Cat 6",
    reach: { 100: 100, 1000: 100, 2500: 100, 5000: 100, 10000: 55 },
    perSpeedNote: {
      5000: "5GBASE-T is specified for Cat 6 at 100 m by IEEE 802.3bz.",
      10000:
        "10GBASE-T on Cat 6 is limited to roughly 37-55 m depending on alien crosstalk (TIA TSB-155 guidance); 55 m is the ceiling used here.",
    },
    baseNote: "ANSI/TIA-568 100 m channel; 250 MHz certified bandwidth.",
  },
  {
    id: "cat6a",
    label: "Cat 6A",
    reach: { 100: 100, 1000: 100, 2500: 100, 5000: 100, 10000: 100 },
    baseNote:
      "ANSI/TIA-568 100 m channel; 500 MHz certified bandwidth - 10GBASE-T at the full 100 m.",
  },
  {
    id: "cat8",
    label: "Cat 8",
    reach: { 25000: 30, 40000: 30 },
    baseNote:
      "ANSI/TIA-568.2-D Category 8: 2000 MHz, 25G/40GBASE-T to a 30 m channel; shielded construction in practice. Intended for short data-center runs, not horizontal cabling.",
  },
];

interface FiberRule {
  id: string;
  label: string;
  medium: "fiber";
  /** speed -> reach meters for the named optic on this fiber grade. */
  reach: Partial<Record<SpeedMbps, number>>;
  optic: Partial<Record<SpeedMbps, string>>;
  baseNote: string;
}

const FIBER: FiberRule[] = [
  {
    id: "om3",
    label: "OM3 multimode",
    medium: "fiber",
    reach: { 1000: 550, 10000: 300, 25000: 70, 40000: 100, 100000: 70 },
    optic: {
      1000: "1000BASE-SX",
      10000: "10GBASE-SR (IEEE 802.3ae): 300 m on OM3",
      25000: "25GBASE-SR (IEEE 802.3by): 70 m on OM3",
      40000: "40GBASE-SR4 (IEEE 802.3ba): 100 m on OM3",
      100000: "100GBASE-SR4 (IEEE 802.3bm): 70 m on OM3",
    },
    baseNote: "Laser-optimized 50 um multimode; aqua jacket by convention.",
  },
  {
    id: "om4",
    label: "OM4 multimode",
    medium: "fiber",
    reach: { 1000: 550, 10000: 400, 25000: 100, 40000: 150, 100000: 100 },
    optic: {
      1000: "1000BASE-SX",
      10000: "10GBASE-SR: 400 m on OM4",
      25000: "25GBASE-SR: 100 m on OM4",
      40000: "40GBASE-SR4: 150 m on OM4",
      100000: "100GBASE-SR4: 100 m on OM4",
    },
    baseNote: "Higher-bandwidth 50 um multimode; extends SR-class reach over OM3.",
  },
  {
    id: "smf",
    label: "Single-mode (OS2)",
    medium: "fiber",
    reach: { 1000: 10000, 10000: 10000, 25000: 10000, 40000: 10000, 100000: 10000 },
    optic: {
      1000: "1000BASE-LX (up to 10 km class)",
      10000: "10GBASE-LR (IEEE 802.3ae): 10 km",
      25000: "25GBASE-LR: 10 km",
      40000: "40GBASE-LR4 (IEEE 802.3ba): 10 km",
      100000: "100GBASE-LR4 (IEEE 802.3bm): 10 km",
    },
    baseNote:
      "OS2 single-mode with LR-class optics; 10 km is the standard reach class - longer ER/ZR classes exist beyond this planner's scope.",
  },
];

// ----------------------------------------------------------------------------
// Environment + PoE guidance (recommendations layered ON TOP of the hard
// distance/speed rules; they never silently exclude an option).
// ----------------------------------------------------------------------------

function environmentNotes(env: Environment, medium: "copper" | "fiber"): EngineText[] {
  const n: EngineText[] = [];
  if (medium === "copper") {
    if (env === "industrial")
      n.push(
        say("env.copper.industrial", "High-EMI environment: use a shielded construction (F/UTP or S/FTP) with properly grounded shields."),
      );
    if (env === "plenum")
      n.push(say("env.copper.plenum", "Air-handling space: plenum-rated (CMP) jacket required by fire code."));
    if (env === "outdoor")
      n.push(
        say("env.copper.outdoor", "Outdoor route: copper needs OSP-rated jacket and surge protection at entry; fiber avoids both concerns and is usually the better answer."),
      );
  } else {
    if (env === "plenum") n.push(say("env.fiber.plenum", "Air-handling space: plenum-rated (OFNP) fiber jacket required."));
    if (env === "industrial")
      n.push(say("env.fiber.industrial", "Fiber is immune to EMI - a natural fit for the electrically noisy environment."));
    if (env === "outdoor") n.push(say("env.fiber.outdoor", "Use OSP or armored fiber construction for the outdoor segment."));
  }
  return n;
}

function poeNotes(poe: PoeClass, medium: "copper" | "fiber"): EngineText[] {
  if (poe === "none") return [];
  if (medium === "fiber")
    return [
      say("poe.fiber", `PoE class ${poe} requested: fiber carries no power - budget a media converter or PoE switch at the far end, or reconsider copper if distance allows.`, { poe }),
    ];
  const n: EngineText[] = [
    say("poe.copper", `PoE 802.3${poe} is supported on any compliant Cat 5e-or-better channel.`, { poe }),
  ];
  if (poe === "bt")
    n.push(
      say("poe.bt", "802.3bt (four-pair, up to 90 W PSE): prefer higher-category / larger-conductor cable and follow TIA TSB-184-A bundle-size guidance to limit heat rise."),
    );
  return n;
}

// ----------------------------------------------------------------------------
// The planner proper.
// ----------------------------------------------------------------------------

const ENVS: Environment[] = ["office", "industrial", "plenum", "outdoor"];
const POES: PoeClass[] = ["none", "af", "at", "bt"];

/** Validate + normalize raw input; throws with an anchored message on bad fields (02/11/2026: each message is a sentence with an id, carried by the error). */
export function parseInput(raw: unknown): PlannerInput {
  if (typeof raw !== "object" || raw === null) throw engineError(say("err.object", "input: expected an object"));
  const o = raw as Record<string, unknown>;
  const speed = Number(o.speedMbps);
  if (!SPEEDS.includes(speed as SpeedMbps))
    throw engineError(say("err.speed", `speedMbps: expected one of ${SPEEDS.join(", ")} (got ${String(o.speedMbps)})`, { speeds: SPEEDS.join(", "), got: String(o.speedMbps) }));
  const dist = Number(o.distanceM);
  if (!Number.isFinite(dist) || dist <= 0 || dist > 10000)
    throw engineError(say("err.distance", `distanceM: expected a number in (0, 10000] meters (got ${String(o.distanceM)})`, { got: String(o.distanceM) }));
  const env = String(o.environment ?? "office") as Environment;
  if (!ENVS.includes(env)) throw engineError(say("err.environment", `environment: expected one of ${ENVS.join(", ")}`, { values: ENVS.join(", ") }));
  const poe = String(o.poe ?? "none") as PoeClass;
  if (!POES.includes(poe)) throw engineError(say("err.poe", `poe: expected one of ${POES.join(", ")}`, { values: POES.join(", ") }));
  return { speedMbps: speed, distanceM: dist, environment: env, poe };
}

/** Run the planner: every compliant option + every honest exclusion (02/11/2026: the reading of runLocalisable() with every sentence as its English). */
export function run(rawInput: unknown): PlannerResult {
  return plainText(runLocalisable(rawInput)); // the same reading, sentences as their English
}

/**
 * The page's reading (02/11/2026): run()'s reading with every sentence an EngineText (its id, its English, its
 * values), so the page can show it in its own language. Input errors are thrown as before, carrying their sentence.
 * @param rawInput the four fields
 * @returns the reading with sentences as EngineTexts
 */
export function runLocalisable(rawInput: unknown): PlannerResult<EngineText> {
  const input = parseInput(rawInput);
  const { speedMbps, distanceM, environment, poe } = input;
  const speed = speedMbps as SpeedMbps;
  const options: MediaOption<EngineText>[] = [];
  const excluded: Exclusion<EngineText>[] = [];
  const s = fmtSpeed(speed); // the speed as the sentences write it (the same in every language)

  // Copper pass.
  for (const c of COPPER) {
    const max = c.reach[speed];
    const label = say(`label.${c.id}`, c.label); // pack key engine.label.<id>
    if (max === undefined) {
      excluded.push({
        id: c.id,
        label,
        reason: say("ex.copperUnsupported", `${c.label} is not specified for ${s}.`, { label, speed: s }),
      });
      continue;
    }
    if (distanceM > max) {
      excluded.push({
        id: c.id,
        label,
        reason: say("ex.copperShort", `${c.label} carries ${s} only to ${max} m; the run is ${distanceM} m.`, { label, speed: s, max: String(max), distance: String(distanceM) }),
      });
      continue;
    }
    const notes = [
      ...(c.perSpeedNote?.[speed] ? [say(`speedNote.${c.id}.${speed}`, c.perSpeedNote[speed] as string)] : []), // pack key engine.speedNote.<id>.<speed>
      ...environmentNotes(environment, "copper"),
      ...poeNotes(poe, "copper"),
    ];
    options.push({
      id: c.id,
      label,
      medium: "copper",
      maxDistanceM: max,
      rule: c.baseNote ? say(`note.${c.id}`, c.baseNote) : say("note.none", ""), // pack key engine.note.<id>
      notes,
    });
  }

  // Fiber pass.
  for (const f of FIBER) {
    const max = f.reach[speed];
    const label = say(`label.${f.id}`, f.label); // pack key engine.label.<id>
    const optic = f.optic[speed] !== undefined ? say(`optic.${f.id}.${speed}`, f.optic[speed] as string) : undefined; // pack key engine.optic.<id>.<speed>
    if (max === undefined) {
      excluded.push({
        id: f.id,
        label,
        reason: say("ex.fiberUnmapped", `${f.label} has no standard optic mapped for ${s} in this planner.`, { label, speed: s }),
      });
      continue;
    }
    if (distanceM > max) {
      const o = optic ?? say("optic.fallback", "SR-class optics"); // the optic, or the class
      excluded.push({
        id: f.id,
        label,
        reason: say("ex.fiberShort", `${f.label} with ${o.text} reaches ${max} m; the run is ${distanceM} m.`, { label, optic: o, max: String(max), distance: String(distanceM) }),
      });
      continue;
    }
    options.push({
      id: `${f.id}-${speed}`,
      label,
      medium: "fiber",
      maxDistanceM: max,
      rule: optic ? say("rule.fiber", `${optic.text} - ${f.baseNote}`, { optic, note: say(`note.${f.id}`, f.baseNote) }) : say("rule.fiberNoOptic", ` - ${f.baseNote}`, { note: say(`note.${f.id}`, f.baseNote) }), // the optic, then the grade's note
      notes: [...environmentNotes(environment, "fiber"), ...poeNotes(poe, "fiber")],
    });
  }

  // Ordering: copper first (cheapest install where compliant), each medium by
  // ascending headroom (tightest-but-compliant option first is deliberate: it
  // is the one whose limit the reader must understand).
  options.sort((a, b) =>
    a.medium !== b.medium ? (a.medium === "copper" ? -1 : 1) : a.maxDistanceM - b.maxDistanceM,
  );

  const text = verdict(input, options);
  return { input, options, excluded, text };
}

function fmtSpeed(s: SpeedMbps): string {
  return s >= 1000 ? `${s / 1000} Gb/s` : `${s} Mb/s`;
}

function verdict(input: PlannerInput, options: MediaOption<EngineText>[]): EngineText {
  const s = fmtSpeed(input.speedMbps as SpeedMbps);
  const d = String(input.distanceM); // the run, as written
  if (options.length === 0)
    return say("verdict.none", `No single compliant medium in this planner carries ${s} over ${input.distanceM} m. Split the run (an intermediate switch or media converter), or move to longer-reach optics (ER/ZR class) outside this planner's table.`, { speed: s, distance: d });
  const copper = options.filter((o) => o.medium === "copper");
  const fiber = options.filter((o) => o.medium === "fiber");
  const parts: EngineText[] = [];
  if (copper.length)
    parts.push(
      say("verdict.copper", `${s} over ${input.distanceM} m works on copper: ${copper.map((c) => c.label.text).join(", ")}.`, { speed: s, distance: d, list: listOf(copper.map((c) => c.label), ", ") }),
    );
  else parts.push(say("verdict.fiberOnly", `${s} over ${input.distanceM} m exceeds every copper channel; this is a fiber run.`, { speed: s, distance: d }));
  if (fiber.length)
    parts.push(say("verdict.fiber", `Fiber options: ${fiber.map((f) => f.label.text).join(", ")}.`, { list: listOf(fiber.map((f) => f.label), ", ") }));
  return parts.length === 2 ? say("verdict.both", `${parts[0].text} ${parts[1].text}`, { first: parts[0], second: parts[1] }) : parts[0]; // the parts, joined by a space
}
