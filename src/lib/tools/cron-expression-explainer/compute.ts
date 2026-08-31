// ============================================================================
// src/lib/tools/cron-expression-explainer/compute.ts
// ----------------------------------------------------------------------------
// The engine for the cron expression explainer: parse a classic five-field
// crontab schedule (Vixie/POSIX dialect), explain every field structurally,
// surface the dialect's famous footguns, and compute the next occurrences
// deterministically from a caller-supplied reference instant.
//
// Grounding (manifest sources): crontab(5), man7.org, and the POSIX crontab
// specification. Facts encoded here, never guessed:
//   - Five fields: minute (0-59), hour (0-23), day-of-month (1-31),
//     month (1-12 or JAN-DEC), day-of-week (0-7 or SUN-SAT; 0 and 7 are
//     both Sunday).
//   - Syntax per field: "*", lists "a,b", ranges "a-b", steps "*/n" and
//     "a-b/n"; names allowed for month and day-of-week (Vixie), ranges of
//     names permitted, names in steps historically unreliable -> flagged.
//   - THE OR RULE (crontab(5)): when BOTH day-of-month and day-of-week are
//     restricted (neither is "*"), the command runs when EITHER matches.
//     This is the dialect's most-misread clause and is always surfaced.
//   - @macros: @yearly/@annually, @monthly, @weekly, @daily/@midnight,
//     @hourly expand to fixed five-field forms; @reboot has no schedule.
//   - Cron evaluates in the daemon's local time. This tool does date math on
//     the wall-clock of the reference instant you give it and does not apply
//     any time-zone database - stated, not hidden.
// Six/seven-field inputs (Quartz's seconds/years dialect) are rejected by
// name so the error teaches rather than confuses.
// ============================================================================

/** Machine-readable failure codes; the component maps them to i18n strings. */
export type CronErrorCode =
  | "empty"
  | "fieldCount"
  | "quartz"
  | "badToken"
  | "range"
  | "reversedRange"
  | "step"
  | "badName"
  | "badMacro";

/** A parse/validation failure carrying the offending token for the message. */
export class CronError extends Error {
  code: CronErrorCode;
  token?: string;
  constructor(code: CronErrorCode, token?: string) {
    super(`${code}${token ? `: ${token}` : ""}`);
    this.code = code;
    this.token = token;
  }
}

/** One parsed part of a field: star, star-slash-n, "a", "a-b", or "a-b/n". */
export interface CronPart {
  kind: "every" | "value" | "range" | "step";
  /** Numeric endpoints after name resolution; step carries from/to/by. */
  from?: number;
  to?: number;
  by?: number;
  value?: number;
  /** The raw token as typed, preserved for display. */
  raw: string;
}

/** A fully parsed field: its parts and the resolved set of matching values. */
export interface CronField {
  raw: string;
  parts: CronPart[];
  /** Sorted, de-duplicated matching values within the field's domain. */
  values: number[];
  /** True when the field is unrestricted ("*" alone). */
  unrestricted: boolean;
}

export type CronWarning =
  | "orRule"          // both DOM and DOW restricted -> OR semantics
  | "sundaySeven"     // 7 used for Sunday; normalized to 0
  | "nameStep"        // a name used inside a step or range-with-step
  | "localTime"       // always attached: cron runs in the daemon's local time
  | "unevenStep"       // the step does not divide the span evenly (wraps ragged)
  | "rebootNoSchedule"// @reboot: nothing to compute
  | "nextRunsCapped"; // the 6-year search window ended before `count` matches

export interface CronResult {
  expression: string;
  /** Set when the input was an @macro; the expansion drives the fields. */
  macro?: string;
  fields: {
    minute: CronField;
    hour: CronField;
    dayOfMonth: CronField;
    month: CronField;
    dayOfWeek: CronField;
  } | null; // null only for @reboot
  warnings: CronWarning[];
  /** ISO-8601 UTC instants of the next occurrences from opts.from. */
  nextRuns: string[];
}

// ---------------------------------------------------------------------------
// Field domains and name tables (crontab(5)).
// ---------------------------------------------------------------------------
interface Domain { min: number; max: number; names?: Record<string, number>; sevenIsZero?: boolean }
const MONTH_NAMES: Record<string, number> = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12 };
const DOW_NAMES: Record<string, number> = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };
const DOMAINS: Record<string, Domain> = {
  minute: { min: 0, max: 59 },
  hour: { min: 0, max: 23 },
  dayOfMonth: { min: 1, max: 31 },
  month: { min: 1, max: 12, names: MONTH_NAMES },
  dayOfWeek: { min: 0, max: 7, names: DOW_NAMES, sevenIsZero: true },
};

const MACROS: Record<string, string> = {
  "@yearly": "0 0 1 1 *",
  "@annually": "0 0 1 1 *",
  "@monthly": "0 0 1 * *",
  "@weekly": "0 0 * * 0",
  "@daily": "0 0 * * *",
  "@midnight": "0 0 * * *",
  "@hourly": "0 * * * *",
};

/** Resolve one atom (number or name) inside a field's domain. */
function atom(tok: string, d: Domain, warn: Set<CronWarning>, inStep: boolean): number {
  if (/^\d+$/.test(tok)) {
    let n = Number(tok);
    if (d.sevenIsZero && n === 7) { warn.add("sundaySeven"); n = 0; }
    if (n < d.min || n > (d.sevenIsZero ? 6 : d.max)) throw new CronError("range", tok);
    return n;
  }
  const up = tok.toUpperCase();
  if (d.names && up in d.names) {
    if (inStep) warn.add("nameStep");
    return d.names[up];
  }
  throw new CronError(d.names ? "badName" : "badToken", tok);
}

/** Parse one whole field (star-slash-15, "1,15-20/2", "MON-FRI", ...). */
function parseField(raw: string, name: keyof typeof DOMAINS, warn: Set<CronWarning>): CronField {
  const d = DOMAINS[name];
  if (raw === "") throw new CronError("badToken", "(empty field)");
  const hi = d.sevenIsZero ? 6 : d.max;
  const parts: CronPart[] = [];
  const values = new Set<number>();
  for (const tok of raw.split(",")) {
    if (tok === "") throw new CronError("badToken", raw);
    const stepSplit = tok.split("/");
    if (stepSplit.length > 2) throw new CronError("badToken", tok);
    const [core, stepStr] = stepSplit;
    let by: number | undefined;
    if (stepStr !== undefined) {
      if (!/^\d+$/.test(stepStr) || Number(stepStr) === 0) throw new CronError("step", tok);
      by = Number(stepStr);
    }
    if (core === "*") {
      if (by === undefined) {
        parts.push({ kind: "every", raw: tok });
        for (let v = d.min; v <= hi; v++) values.add(v);
      } else {
        parts.push({ kind: "step", from: d.min, to: hi, by, raw: tok });
        for (let v = d.min; v <= hi; v += by) values.add(v);
        if ((hi - d.min + 1) % by !== 0) warn.add("unevenStep");
      }
      continue;
    }
    const rangeSplit = core.split("-");
    if (rangeSplit.length > 2) throw new CronError("badToken", tok);
    if (rangeSplit.length === 2) {
      const a = atom(rangeSplit[0], d, warn, by !== undefined);
      const b = atom(rangeSplit[1], d, warn, by !== undefined);
      if (a > b) throw new CronError("reversedRange", tok);
      parts.push(by === undefined ? { kind: "range", from: a, to: b, raw: tok } : { kind: "step", from: a, to: b, by, raw: tok });
      for (let v = a; v <= b; v += by ?? 1) values.add(v);
      if (by !== undefined && (b - a + 1) % by !== 0) warn.add("unevenStep");
    } else {
      const a = atom(core, d, warn, by !== undefined);
      if (by === undefined) {
        parts.push({ kind: "value", value: a, raw: tok });
        values.add(a);
      } else {
        // "n/step" (Vixie treats it as n-max/step)
        parts.push({ kind: "step", from: a, to: hi, by, raw: tok });
        for (let v = a; v <= hi; v += by) values.add(v);
      }
    }
  }
  const sorted = [...values].sort((x, y) => x - y);
  const unrestricted = parts.length === 1 && parts[0].kind === "every";
  return { raw, parts, values: sorted, unrestricted };
}

/** Six years of minutes: the deterministic search ceiling for next runs. */
const SEARCH_MINUTES = 6 * 366 * 24 * 60;

/**
 * run - parse, explain, and project a cron expression.
 * @param input the schedule ("*\/15 2 * * 1-5", "@daily", ...)
 * @param opts.from  ISO instant the projection starts AFTER (default: now)
 * @param opts.count how many next occurrences to compute (default 5, max 10)
 */
export function run(input: string, opts?: { from?: string; count?: number }): CronResult {
  const expression = input.trim().replace(/\s+/g, " ");
  if (expression === "") throw new CronError("empty");
  const warn = new Set<CronWarning>();
  warn.add("localTime");

  let macro: string | undefined;
  let body = expression;
  if (expression.startsWith("@")) {
    const key = expression.toLowerCase();
    if (key === "@reboot") {
      return { expression, macro: "@reboot", fields: null, warnings: ["rebootNoSchedule", "localTime"], nextRuns: [] };
    }
    const exp = MACROS[key];
    if (!exp) throw new CronError("badMacro", expression);
    macro = key;
    body = exp;
  }

  const toks = body.split(" ");
  if (toks.length === 6 || toks.length === 7) throw new CronError("quartz", String(toks.length));
  if (toks.length !== 5) throw new CronError("fieldCount", String(toks.length));

  const fields = {
    minute: parseField(toks[0], "minute", warn),
    hour: parseField(toks[1], "hour", warn),
    dayOfMonth: parseField(toks[2], "dayOfMonth", warn),
    month: parseField(toks[3], "month", warn),
    dayOfWeek: parseField(toks[4], "dayOfWeek", warn),
  };

  // crontab(5): both DOM and DOW restricted -> the command runs when EITHER
  // matches. The single most-misread sentence in the man page.
  const orRule = !fields.dayOfMonth.unrestricted && !fields.dayOfWeek.unrestricted;
  if (orRule) warn.add("orRule");

  // --- next occurrences, minute by minute, in UTC on the given wall-clock ---
  const count = Math.min(Math.max(opts?.count ?? 5, 1), 10);
  const start = opts?.from ? new Date(opts.from) : new Date();
  if (Number.isNaN(start.getTime())) throw new CronError("badToken", String(opts?.from));
  const min = new Set(fields.minute.values);
  const hr = new Set(fields.hour.values);
  const dom = new Set(fields.dayOfMonth.values);
  const mon = new Set(fields.month.values);
  const dow = new Set(fields.dayOfWeek.values);
  const t = new Date(Date.UTC(
    start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate(),
    start.getUTCHours(), start.getUTCMinutes(), 0, 0,
  ));
  const nextRuns: string[] = [];
  for (let i = 0; i < SEARCH_MINUTES && nextRuns.length < count; i++) {
    t.setUTCMinutes(t.getUTCMinutes() + 1);
    if (!mon.has(t.getUTCMonth() + 1)) continue;
    if (!hr.has(t.getUTCHours())) continue;
    if (!min.has(t.getUTCMinutes())) continue;
    const domHit = dom.has(t.getUTCDate());
    const dowHit = dow.has(t.getUTCDay());
    const dayHit = orRule
      ? domHit || dowHit
      : (fields.dayOfMonth.unrestricted || domHit) && (fields.dayOfWeek.unrestricted || dowHit);
    if (!dayHit) continue;
    nextRuns.push(t.toISOString().slice(0, 16) + "Z");
  }
  if (nextRuns.length < count) warn.add("nextRunsCapped");

  return { expression, macro, fields, warnings: [...warn], nextRuns };
}
