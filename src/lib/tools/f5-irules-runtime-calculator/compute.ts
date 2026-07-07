// ============================================================================
// src/lib/tools/f5-irules-runtime-calculator/compute.ts
// ----------------------------------------------------------------------------
// THE iRULES RUNTIME CALCULATOR.
//
// A faithful browser re-implementation of DevCentral's "F5DevCentral iRules
// Runtime Calculator" spreadsheet (JRahm, 2019; the workbook the community has
// hosted for years). Paste the per-event timing statistics from
//   tmsh show ltm rule <name> field-fmt
// give the platform's clock speed and core count, and it reproduces the
// spreadsheet's four tables, each with best / typical / worst columns:
//
//   1. run time / request (CPU cycles)      - min / avg / max, plus summed total
//   2. run time / request (microseconds)    = cycles * 1e6 / CyclesPerSec
//   3. % CPU utilization / request          = cycles / CyclesPerSec  (shown as %)
//   4. maximum number of requests / second  = CyclesPerSec / cycles
//
// The single input the spreadsheet asks a human for is "Cycles/Sec", which the
// original computes as cores x MHz x 1,000,000 (from /proc/cpuinfo). That is the
// default here; an optional override accepts a platform-specific figure.
//
// Grounded in F5's own material: the spreadsheet itself (its cells and formulas,
// verified against its shipped example: CyclesPerSec 2,903,000,097 turning a
// 591,600-cycle request into 203.79 microseconds and 4,907 req/s); the
// DevCentral article that regenerates it via the Python SDK; and "Intermediate
// iRules: Evaluating Performance" for the timing command's meaning. Average is
// the reliable figure and maximum is inflated by first-run compile-time
// optimization and once-per-tick OS scheduling; timing has been on by default
// since 11.5.0 and carries a ~70-100 cycle margin of error.
//
// Everything is local, deterministic arithmetic. No network, no secrets.
// ============================================================================

/** One row of the calculator: an event, or the summed Total. */
export interface EventRow {
  /** iRule event name, or "Total". */
  event: string;
  /** Total executions recorded (the "# of requests" column). */
  executions: number;
  /** CPU cycles: minimum, average, maximum. */
  cyclesMin: number;
  cyclesAvg: number;
  cyclesMax: number;
  /** Runtime in microseconds (cycles * 1e6 / CyclesPerSec), min/avg/max. */
  usMin: number;
  usAvg: number;
  usMax: number;
  /** CPU percent per request (cycles / CyclesPerSec * 100), min/avg/max. */
  cpuPctMin: number;
  cpuPctAvg: number;
  cpuPctMax: number;
  /**
   * Maximum requests per second (CyclesPerSec / cycles). reqAtMin uses the
   * minimum cycles, so it is the BEST-case throughput; reqAtMax is worst-case.
   */
  reqAtMin: number;
  reqAtAvg: number;
  reqAtMax: number;
}

export interface RuntimeCalcInput {
  /** Pasted output of `tmsh show ltm rule <name> field-fmt` (or a Cycles (min, avg, max) block). */
  timingOutput: string;
  /** TMM CPU clock speed in MHz (e.g. 2133.48), from /proc/cpuinfo. */
  clockMhz: number;
  /** Number of CPU cores (TMM instances). */
  cores: number;
  /** Optional: a platform-specific Cycles/Sec; when omitted, cores x MHz x 1e6 is used. */
  cyclesPerSecOverride?: number | null;
}

export interface RuntimeCalcResult {
  /** Per-event rows in parse order. */
  events: EventRow[];
  /** The summed Total row (cycles summed; other columns derived from those sums). */
  total: EventRow;
  /** Cycles per second actually used. */
  cyclesPerSec: number;
  /** Whether that came from the override or from cores x clock. */
  cyclesPerSecSource: "override" | "cores-x-clock";
  clockMhz: number;
  cores: number;
  /** How many event rows were parsed. */
  parsedCount: number;
  /** Caveats worth showing next to the numbers. */
  notes: string[];
}

/** Caveat strings, shared with the golden vectors so wording never drifts. */
export const NOTES = Object.freeze({
  avgReliable:
    "Average is the reliable column. Maximum is inflated because the first run of a freshly edited rule includes one-time compile-time optimization, and OS scheduling adds overhead at least once per tick; timing also carries a roughly 70 to 100 cycle margin of error. Push a large, representative load (ten thousand or more requests) and clear the stats once after the first hit.",
  coresXClock:
    "Cycles per second is cores x clock (cores x MHz x 1,000,000), exactly as the DevCentral spreadsheet computes it from /proc/cpuinfo. Supply a platform-specific figure in the override to use a different basis.",
  cmpDemotion:
    "These figures assume the work spreads across all cores (CMP). If the rule modifies a global variable it is demoted to a single core; recompute with cores = 1 for that case.",
  noneRecognised:
    "No timing lines were recognised. Paste the output of tmsh show ltm rule <name> field-fmt (blocks with avg-cycles / min-cycles / max-cycles / total-executions), or lines of the form: HTTP_REQUEST 729 total 0 fail 0 abort | Cycles (min, avg, max) = (3693, 3959, 53936).",
});

/** Deterministic fixed-decimal rounding so results are stable for golden vectors. */
function round(value: number, decimals: number): number {
  if (!isFinite(value)) return 0;
  const f = Math.pow(10, decimals);
  return Math.round(value * f) / f;
}

/** Expand a cycle token that may carry a K/M/G/T suffix (field-fmt uses 43.0K, 2.0K, ...). */
function expandCycles(token: string): number {
  const m = /^([0-9]*\.?[0-9]+)\s*([KMGT])?$/i.exec(token.trim());
  if (!m) return NaN;
  const value = parseFloat(m[1]);
  const suffix = (m[2] || "").toUpperCase();
  const mult =
    suffix === "K" ? 1e3 : suffix === "M" ? 1e6 : suffix === "G" ? 1e9 : suffix === "T" ? 1e12 : 1;
  return Math.round(value * mult);
}

interface RawEvent {
  event: string;
  executions: number;
  min: number;
  avg: number;
  max: number;
}

/**
 * Parse field-fmt blocks:
 *   ltm rule-event <name>:<EVENT> {
 *       avg-cycles 43.0K
 *       max-cycles 853.9K
 *       min-cycles 6.5K
 *       total-executions 2.0K
 *       event-type HTTP_RESPONSE
 *   }
 * Fields may appear in any order; event-type (falling back to the name:EVENT
 * token) names the row.
 */
function parseFieldFmt(text: string): RawEvent[] {
  const out: RawEvent[] = [];
  const blockRe = /rule-event\s+([^\s{]+)\s*\{([\s\S]*?)\}/g;
  let b: RegExpExecArray | null;
  while ((b = blockRe.exec(text)) !== null) {
    const header = b[1]; // e.g. event_order:HTTP_RESPONSE
    const body = b[2];
    const field = (name: string): string | null => {
      const m = new RegExp(`\\b${name}\\s+(\\S+)`).exec(body);
      return m ? m[1] : null;
    };
    const eventType = field("event-type") ?? (header.includes(":") ? header.split(":").pop()! : header);
    const avg = field("avg-cycles");
    const min = field("min-cycles");
    const max = field("max-cycles");
    const exec = field("total-executions");
    if (avg == null && min == null && max == null) continue; // not a timing block
    out.push({
      event: eventType,
      executions: exec != null ? expandCycles(exec) || 0 : 0,
      min: min != null ? expandCycles(min) || 0 : 0,
      avg: avg != null ? expandCycles(avg) || 0 : 0,
      max: max != null ? expandCycles(max) || 0 : 0,
    });
  }
  return out;
}

/**
 * Parse the classic one-line form:
 *   <EVENT> <n> total <f> fail <a> abort | Cycles (min, avg, max) = (<min>, <avg>, <max>)
 */
function parseCyclesLine(text: string): RawEvent[] {
  const re =
    /([A-Za-z][A-Za-z0-9_:]+)\s+(\d+)\s+total\s+(\d+)\s+fail\s+(\d+)\s+abort\s*\|\s*Cycles\s*\(min,\s*avg,\s*max\)\s*=\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g;
  const out: RawEvent[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    out.push({
      event: m[1],
      executions: parseInt(m[2], 10),
      min: parseInt(m[5], 10),
      avg: parseInt(m[6], 10),
      max: parseInt(m[7], 10),
    });
  }
  return out;
}

/** Build a fully-derived row from raw cycles and the CyclesPerSec basis. */
function deriveRow(
  event: string,
  executions: number,
  min: number,
  avg: number,
  max: number,
  cyclesPerSec: number,
): EventRow {
  const us = (c: number) => (cyclesPerSec > 0 ? round((c * 1e6) / cyclesPerSec, 4) : 0);
  const pct = (c: number) => (cyclesPerSec > 0 ? round((c / cyclesPerSec) * 100, 8) : 0);
  const req = (c: number) => (c > 0 ? round(cyclesPerSec / c, 2) : 0);
  return {
    event,
    executions,
    cyclesMin: min,
    cyclesAvg: avg,
    cyclesMax: max,
    usMin: us(min),
    usAvg: us(avg),
    usMax: us(max),
    cpuPctMin: pct(min),
    cpuPctAvg: pct(avg),
    cpuPctMax: pct(max),
    reqAtMin: req(min),
    reqAtAvg: req(avg),
    reqAtMax: req(max),
  };
}

/**
 * run - convert pasted iRule timing statistics into the calculator's tables.
 */
export function run(input: RuntimeCalcInput): RuntimeCalcResult {
  const clockMhz = Number(input?.clockMhz) || 0;
  const cores = Number(input?.cores) || 0;
  const override =
    input?.cyclesPerSecOverride != null && Number(input.cyclesPerSecOverride) > 0
      ? Number(input.cyclesPerSecOverride)
      : null;

  const text = (input?.timingOutput ?? "").toString();
  // field-fmt first (the documented method); fall back to the one-line form.
  let raw = parseFieldFmt(text);
  if (raw.length === 0) raw = parseCyclesLine(text);

  const cyclesPerSec = override ?? Math.round(cores * clockMhz * 1e6);
  const cyclesPerSecSource: "override" | "cores-x-clock" = override ? "override" : "cores-x-clock";

  const events = raw.map((e) => deriveRow(e.event, e.executions, e.min, e.avg, e.max, cyclesPerSec));

  const sum = (pick: (e: RawEvent) => number) => raw.reduce((s, e) => s + pick(e), 0);
  const totalExecutions = raw.reduce((mx, e) => Math.max(mx, e.executions), 0);
  const total = deriveRow(
    "Total",
    totalExecutions,
    sum((e) => e.min),
    sum((e) => e.avg),
    sum((e) => e.max),
    cyclesPerSec,
  );

  const notes: string[] = [];
  if (events.length === 0) {
    notes.push(NOTES.noneRecognised);
  } else {
    notes.push(NOTES.avgReliable);
    if (cyclesPerSecSource === "cores-x-clock") notes.push(NOTES.coresXClock);
    notes.push(NOTES.cmpDemotion);
  }

  return {
    events,
    total,
    cyclesPerSec,
    cyclesPerSecSource,
    clockMhz,
    cores,
    parsedCount: events.length,
    notes,
  };
}
