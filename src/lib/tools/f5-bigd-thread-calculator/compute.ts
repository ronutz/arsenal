// ============================================================================
// src/lib/tools/f5-bigd-thread-calculator/compute.ts
// ----------------------------------------------------------------------------
// THE BIGD THREAD CALCULATOR - pure, deterministic: two formulas, a cap, and a
// platform-to-hyperthreading map.
//
// BIG-IP 21.1.0 rebuilt bigd as a MULTI-THREADED single-instance daemon able to
// serve up to 15,000 control-plane monitors, and documented exactly how the
// automatic thread count is derived from the vCPU count (techdocs 21.1.0 "New
// Features", section "BigD enhancements for large-scale configurations",
// fetched 2026-07-08). The two formulas, VERBATIM from that page:
//
//   Hyperthreaded systems:   Number of BigD Threads = (Number of vCPUs × 6) ÷ 10
//   Normal (non-HT) systems: Number of BigD Threads = (Number of vCPUs ÷ 2) − 1
//
// F5's stated rationale for the HT case: hyperthreaded cores run at roughly
// 60% of a real core's performance, so BigD is allocated "approximately 60% of
// the remaining half of the HT cores (assuming that TMM takes the other half)".
// The tool encodes the FORMULA as F5 states it; where the formula yields a
// fractional value (e.g. 8 vCPUs HT -> 4.8) the release notes do not state a
// rounding rule, so the tool reports BOTH the exact formula result and its
// floor, and says so - "compute, never guess".
//
// Manual override: the db variable bigd.numprocs sets the thread count by hand
// but is CAPPED at the number of available vCPUs; its default 0 means "use the
// formula automatically". Both behaviours are from the same techdocs section.
//
// PLATFORM MAP (which formula applies where) - all verbatim from F5's own
// platform documentation, fetched 2026-07-08:
//   - rSeries r5000 / r10000 / r12000: HYPERTHREADED. "In the high-end
//     (r10000) and mid-range (r5000) rSeries appliances, each Intel CPU core
//     runs hyperthreading and appears as two logical CPUs or vCPUs"; the
//     r12900-DS sizing tables use the same vCPU (hyperthread) counting.
//     (clouddocs rSeries Multitenancy + Performance and Sizing)
//   - rSeries r2000 / r4000: NOT hyperthreaded. "use a different class of
//     Intel CPU that does not utilize hyperthreading ... measured using
//     physical CPU core counts only"; "the number of logical cores is equal
//     to the number of physical cores". (same clouddocs pages)
//   - VELOS (BX110 / BX520): HYPERTHREADED. "Each CPU core has two
//     hyperthreads and the TMM will run on one of those hyperthreads ... 22
//     vCPUs ... equate to 11 physical CPUs due to hyperthreading"; tenants
//     leverage HT-Split per K15003. (clouddocs VELOS Points of Management)
//   - iSeries and VIPRION: HYPERTHREADED in F5's own sizing language ("all
//     previous sizing for iSeries/VIPRION refers to vCPUs (hyperthreaded on a
//     CPU core)"), BUT neither platform runs BIG-IP 21.x, so for them the
//     mapping is educational context: the multi-threaded BigD and these
//     formulas are 21.1 features they will never receive.
//   - Virtual Edition: DEPENDS on what the hypervisor exposes to the guest.
//     The honest answer is "check inside the guest" (lscpu: Thread(s) per
//     core), so the tool shows both formulas and says exactly that.
//
// PRECEDENCE: an explicit ht/normal word in the input always wins over the
// platform default (the operator may know something the map does not, e.g. a
// host with HT disabled in firmware); the result records which source decided
// so the UI can say so.
//
// DETERMINISM: input is a vCPU count plus optional mode and/or platform
// tokens; no clock, no device, no network. Same input -> same output (D-49).
// ============================================================================

// ----------------------------------------------------------------------------
// Errors
// ----------------------------------------------------------------------------

export type BigdCalcErrorCode = "empty" | "format" | "range";

export class BigdCalcError extends Error {
  code: BigdCalcErrorCode;
  constructor(code: BigdCalcErrorCode, message?: string) {
    super(message ?? code);
    this.name = "BigdCalcError";
    this.code = code;
  }
}

// ----------------------------------------------------------------------------
// Result shapes
// ----------------------------------------------------------------------------

/** One formula's outcome, kept honest about fractional results. */
export interface ThreadFormulaResult {
  /** The exact value the F5 formula yields (may be fractional or, for the
   *  normal formula at 2 vCPUs, zero). */
  exact: number;
  /** The exact value rendered for display (one decimal max, no trailing .0). */
  exactDisplay: string;
  /** floor(exact), never below 0 - the whole-thread reading of the formula. */
  floor: number;
  /** True when the formula landed on a whole number (no rounding question). */
  isInteger: boolean;
}

export type SystemMode = "ht" | "normal";

/** Platform identifiers the parser recognizes. */
export type PlatformId =
  | "rseries-high" // r5000 / r10000 / r12000 (hyperthreaded)
  | "rseries-low" // r2000 / r4000 (no hyperthreading)
  | "rseries-ambiguous" // bare "rseries" - the family split must be resolved
  | "velos" // VELOS BX110 / BX520 (hyperthreaded)
  | "iseries" // hyperthreaded, but cannot run 21.x
  | "viprion" // hyperthreaded, but cannot run 21.x
  | "ve"; // Virtual Edition - depends on the hypervisor/host

export interface PlatformInfo {
  id: PlatformId;
  /** What the platform implies for the formula choice. */
  ht: SystemMode | "depends";
  /** False for iSeries/VIPRION: 21.x (and thus these formulas) never runs there. */
  appliesTo21x: boolean;
  /** The exact token the parser matched, echoed for the UI. */
  matched: string;
}

export interface BigdCalcResult {
  /** The parsed vCPU count. */
  vcpus: number;
  /** The mode the calculation emphasizes: explicit word > platform default >
   *  null (both formulas shown side by side). */
  requested: SystemMode | null;
  /** Who decided `requested`: the user's explicit word, the platform map, or
   *  nobody (null when requested is null). */
  modeSource: "explicit" | "platform" | null;
  /** The recognized platform, if any token matched. */
  platform: PlatformInfo | null;
  /** Hyperthreaded formula: (vCPUs × 6) ÷ 10. */
  ht: ThreadFormulaResult;
  /** Normal formula: (vCPUs ÷ 2) − 1. */
  normal: ThreadFormulaResult;
  /** The bigd.numprocs manual-override cap for this system (== vcpus). */
  numprocsCap: number;
  /** The documented control-plane monitor ceiling for multi-threaded bigd. */
  monitorCeiling: 15000;
}

// ----------------------------------------------------------------------------
// Token tables
// ----------------------------------------------------------------------------

// Filler words silently ignored between the count and the meaningful tokens.
const FILLER = new Set(["vcpu", "vcpus", "core", "cores", "cpu", "cpus", "on", "a", "an"]);

// Mode words. Anything starting with "n" in this set means normal.
const MODE_WORDS: Record<string, SystemMode> = {
  ht: "ht",
  hyperthreaded: "ht",
  "hyper-threaded": "ht",
  hyperthreading: "ht",
  smt: "ht",
  normal: "normal",
  "non-ht": "normal",
  nonht: "normal",
};

/** One platform-matching rule; first match wins. All patterns are anchored
 *  and single-pass - linear, ReDoS-safe. */
interface PlatformRule {
  re: RegExp;
  id: PlatformId;
  ht: SystemMode | "depends";
  appliesTo21x: boolean;
}

const PLATFORM_RULES: PlatformRule[] = [
  // VELOS chassis or its blades - hyperthreaded (vCPU = hyperthread).
  { re: /^(velos|bx110|bx520)$/, id: "velos", ht: "ht", appliesTo21x: true },
  // rSeries mid/high-end: r5xxx / r10xxx / r12xxx incl -DS/-DF variants - HT.
  { re: /^r(?:5|10|12)\d{3}(?:-d[sf])?$/, id: "rseries-high", ht: "ht", appliesTo21x: true },
  { re: /^r(?:5000|10000|12000)$/, id: "rseries-high", ht: "ht", appliesTo21x: true },
  // rSeries low-end: r2xxx / r4xxx - physical cores only, no HT.
  { re: /^r(?:2|4)\d{3}$/, id: "rseries-low", ht: "normal", appliesTo21x: true },
  { re: /^r(?:2000|4000)$/, id: "rseries-low", ht: "normal", appliesTo21x: true },
  // Bare "rseries" - genuinely ambiguous, the family split must be resolved.
  { re: /^rseries$/, id: "rseries-ambiguous", ht: "depends", appliesTo21x: true },
  // iSeries appliances (i2600..i15800) - HT, but no 21.x.
  { re: /^(iseries|i\d{4,5})$/, id: "iseries", ht: "ht", appliesTo21x: false },
  // VIPRION chassis / blades (B2100..B4450) - HT in F5 sizing, no 21.x.
  { re: /^(viprion|b\d{4})$/, id: "viprion", ht: "ht", appliesTo21x: false },
  // Virtual Edition and common hypervisor names - depends on the host.
  { re: /^(ve|virtual-edition|vmware|esxi|kvm|hyper-?v|xen)$/, id: "ve", ht: "depends", appliesTo21x: true },
];

// ----------------------------------------------------------------------------
// Parsing
// ----------------------------------------------------------------------------

export interface ParsedInput {
  vcpus: number;
  explicitMode: SystemMode | null;
  platform: PlatformInfo | null;
}

/**
 * Parse "8 ht", "16 r4800", "8 vCPUs on r10900", "6 velos", or a bare "6".
 * Token-based: the first token must be the integer count; every remaining
 * token must be a known mode word, a known platform token, or filler -
 * anything else is a format error (never a silent guess).
 */
export function parseInput(input: string): ParsedInput {
  const tokens = input.trim().toLowerCase().split(/\s+/);
  if (tokens.length === 0 || tokens[0] === "") {
    throw new BigdCalcError("empty", "no input");
  }
  // The count may carry a glued unit, e.g. "8vcpus".
  const countMatch = /^(\d{1,4})(vcpus?|cores?|cpus?)?$/.exec(tokens[0]);
  if (!countMatch) throw new BigdCalcError("format", "first token must be the vCPU count");
  const vcpus = Number(countMatch[1]);
  if (vcpus < 1 || vcpus > 1024) {
    throw new BigdCalcError("range", "vCPU count must be between 1 and 1024");
  }

  let explicitMode: SystemMode | null = null;
  let platform: PlatformInfo | null = null;

  for (const raw of tokens.slice(1)) {
    if (FILLER.has(raw)) continue;
    if (raw in MODE_WORDS) {
      explicitMode = MODE_WORDS[raw];
      continue;
    }
    const rule = PLATFORM_RULES.find((r) => r.re.test(raw));
    if (rule) {
      platform = { id: rule.id, ht: rule.ht, appliesTo21x: rule.appliesTo21x, matched: raw };
      continue;
    }
    throw new BigdCalcError("format", `unrecognized token: ${raw}`);
  }

  return { vcpus, explicitMode, platform };
}

// ----------------------------------------------------------------------------
// The two formulas
// ----------------------------------------------------------------------------

/** Render a number with at most one decimal, dropping a trailing ".0". */
function display(n: number): string {
  const oneDp = Math.round(n * 10) / 10;
  return Number.isInteger(oneDp) ? String(oneDp) : oneDp.toFixed(1);
}

function formulaResult(exact: number): ThreadFormulaResult {
  const clamped = Math.max(exact, 0); // the normal formula can dip to 0 at 2 vCPUs
  return {
    exact: clamped,
    exactDisplay: display(clamped),
    floor: Math.floor(clamped),
    isInteger: Number.isInteger(clamped),
  };
}

/** Hyperthreaded: (vCPUs × 6) ÷ 10, verbatim per F5 techdocs 21.1.0. */
export function htThreads(vcpus: number): ThreadFormulaResult {
  return formulaResult((vcpus * 6) / 10);
}

/** Normal (non-HT): (vCPUs ÷ 2) − 1, verbatim per F5 techdocs 21.1.0. */
export function normalThreads(vcpus: number): ThreadFormulaResult {
  return formulaResult(vcpus / 2 - 1);
}

// ----------------------------------------------------------------------------
// run - the tool entry point
// ----------------------------------------------------------------------------

/**
 * run - parse a vCPU count (with optional ht/normal word and/or platform
 * token) and return both formula results plus which one the input selects.
 * Precedence: explicit mode word > platform default > none (both shown).
 * Throws BigdCalcError (empty / format / range).
 * @param input e.g. "8 ht", "16 r4800", "8 r10900", "6 velos", "4 ve", or "6"
 */
export function run(input: string): BigdCalcResult {
  const trimmed = input.trim();
  if (trimmed === "") throw new BigdCalcError("empty", "no input");
  const { vcpus, explicitMode, platform } = parseInput(trimmed);

  // Mode precedence: the operator's explicit word beats the platform map
  // (they may know HT is disabled in firmware); the platform map beats
  // nothing; "depends" platforms (VE, bare rseries) decide nothing.
  let requested: SystemMode | null = null;
  let modeSource: BigdCalcResult["modeSource"] = null;
  if (explicitMode !== null) {
    requested = explicitMode;
    modeSource = "explicit";
  } else if (platform && (platform.ht === "ht" || platform.ht === "normal")) {
    requested = platform.ht;
    modeSource = "platform";
  }

  return {
    vcpus,
    requested,
    modeSource,
    platform,
    ht: htThreads(vcpus),
    normal: normalThreads(vcpus),
    numprocsCap: vcpus,
    monitorCeiling: 15000,
  };
}
