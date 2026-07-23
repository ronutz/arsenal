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
// ============================================================================

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

export interface MediaOption {
  /** Machine id, e.g. "cat6a", "om4-sr", "smf-lr". */
  id: string;
  /** Human label, e.g. "Cat 6A (F/UTP recommended)". */
  label: string;
  /** "copper" | "fiber". */
  medium: "copper" | "fiber";
  /** Max compliant distance for the requested speed, meters. */
  maxDistanceM: number;
  /** Governing rule, verbatim-citable. */
  rule: string;
  /** Environment / PoE notes appended for this option. */
  notes: string[];
}

export interface Exclusion {
  id: string;
  label: string;
  reason: string;
}

export interface PlannerResult {
  input: PlannerInput;
  options: MediaOption[];
  excluded: Exclusion[];
  /** One-paragraph plain-language verdict. */
  text: string;
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

function environmentNotes(env: Environment, medium: "copper" | "fiber"): string[] {
  const n: string[] = [];
  if (medium === "copper") {
    if (env === "industrial")
      n.push(
        "High-EMI environment: use a shielded construction (F/UTP or S/FTP) with properly grounded shields.",
      );
    if (env === "plenum")
      n.push("Air-handling space: plenum-rated (CMP) jacket required by fire code.");
    if (env === "outdoor")
      n.push(
        "Outdoor route: copper needs OSP-rated jacket and surge protection at entry; fiber avoids both concerns and is usually the better answer.",
      );
  } else {
    if (env === "plenum") n.push("Air-handling space: plenum-rated (OFNP) fiber jacket required.");
    if (env === "industrial")
      n.push("Fiber is immune to EMI - a natural fit for the electrically noisy environment.");
    if (env === "outdoor") n.push("Use OSP or armored fiber construction for the outdoor segment.");
  }
  return n;
}

function poeNotes(poe: PoeClass, medium: "copper" | "fiber"): string[] {
  if (poe === "none") return [];
  if (medium === "fiber")
    return [
      `PoE class ${poe} requested: fiber carries no power - budget a media converter or PoE switch at the far end, or reconsider copper if distance allows.`,
    ];
  const n: string[] = [
    `PoE 802.3${poe} is supported on any compliant Cat 5e-or-better channel.`,
  ];
  if (poe === "bt")
    n.push(
      "802.3bt (four-pair, up to 90 W PSE): prefer higher-category / larger-conductor cable and follow TIA TSB-184-A bundle-size guidance to limit heat rise.",
    );
  return n;
}

// ----------------------------------------------------------------------------
// The planner proper.
// ----------------------------------------------------------------------------

const ENVS: Environment[] = ["office", "industrial", "plenum", "outdoor"];
const POES: PoeClass[] = ["none", "af", "at", "bt"];

/** Validate + normalize raw input; throws with an anchored message on bad fields. */
export function parseInput(raw: unknown): PlannerInput {
  if (typeof raw !== "object" || raw === null) throw new Error("input: expected an object");
  const o = raw as Record<string, unknown>;
  const speed = Number(o.speedMbps);
  if (!SPEEDS.includes(speed as SpeedMbps))
    throw new Error(`speedMbps: expected one of ${SPEEDS.join(", ")} (got ${String(o.speedMbps)})`);
  const dist = Number(o.distanceM);
  if (!Number.isFinite(dist) || dist <= 0 || dist > 10000)
    throw new Error(`distanceM: expected a number in (0, 10000] meters (got ${String(o.distanceM)})`);
  const env = String(o.environment ?? "office") as Environment;
  if (!ENVS.includes(env)) throw new Error(`environment: expected one of ${ENVS.join(", ")}`);
  const poe = String(o.poe ?? "none") as PoeClass;
  if (!POES.includes(poe)) throw new Error(`poe: expected one of ${POES.join(", ")}`);
  return { speedMbps: speed, distanceM: dist, environment: env, poe };
}

/** Run the planner: every compliant option + every honest exclusion. */
export function run(rawInput: unknown): PlannerResult {
  const input = parseInput(rawInput);
  const { speedMbps, distanceM, environment, poe } = input;
  const speed = speedMbps as SpeedMbps;

  const options: MediaOption[] = [];
  const excluded: Exclusion[] = [];

  // Copper pass.
  for (const c of COPPER) {
    const max = c.reach[speed];
    if (max === undefined) {
      excluded.push({
        id: c.id,
        label: c.label,
        reason: `${c.label} is not specified for ${fmtSpeed(speed)}.`,
      });
      continue;
    }
    if (distanceM > max) {
      excluded.push({
        id: c.id,
        label: c.label,
        reason: `${c.label} carries ${fmtSpeed(speed)} only to ${max} m; the run is ${distanceM} m.`,
      });
      continue;
    }
    const notes = [
      ...(c.perSpeedNote?.[speed] ? [c.perSpeedNote[speed] as string] : []),
      ...environmentNotes(environment, "copper"),
      ...poeNotes(poe, "copper"),
    ];
    options.push({
      id: c.id,
      label: c.label,
      medium: "copper",
      maxDistanceM: max,
      rule: c.baseNote ?? "",
      notes,
    });
  }

  // Fiber pass.
  for (const f of FIBER) {
    const max = f.reach[speed];
    if (max === undefined) {
      excluded.push({
        id: f.id,
        label: f.label,
        reason: `${f.label} has no standard optic mapped for ${fmtSpeed(speed)} in this planner.`,
      });
      continue;
    }
    if (distanceM > max) {
      excluded.push({
        id: f.id,
        label: f.label,
        reason: `${f.label} with ${f.optic[speed] ?? "SR-class optics"} reaches ${max} m; the run is ${distanceM} m.`,
      });
      continue;
    }
    options.push({
      id: `${f.id}-${speed}`,
      label: f.label,
      medium: "fiber",
      maxDistanceM: max,
      rule: `${f.optic[speed] ?? ""} - ${f.baseNote}`,
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

function verdict(input: PlannerInput, options: MediaOption[]): string {
  const s = fmtSpeed(input.speedMbps as SpeedMbps);
  if (options.length === 0)
    return `No single compliant medium in this planner carries ${s} over ${input.distanceM} m. Split the run (an intermediate switch or media converter), or move to longer-reach optics (ER/ZR class) outside this planner's table.`;
  const copper = options.filter((o) => o.medium === "copper");
  const fiber = options.filter((o) => o.medium === "fiber");
  const parts: string[] = [];
  if (copper.length)
    parts.push(
      `${s} over ${input.distanceM} m works on copper: ${copper.map((c) => c.label).join(", ")}.`,
    );
  else parts.push(`${s} over ${input.distanceM} m exceeds every copper channel; this is a fiber run.`);
  if (fiber.length)
    parts.push(`Fiber options: ${fiber.map((f) => f.label).join(", ")}.`);
  return parts.join(" ");
}
