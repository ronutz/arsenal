// ============================================================================
// src/lib/tools/epoch/compute.ts
// ----------------------------------------------------------------------------
// Unix timestamp <-> human date converter (arsenal-local, pure, deterministic).
//
// Paste a Unix timestamp (the unit — seconds, milliseconds, microseconds, or
// nanoseconds — is auto-detected by magnitude) or an ISO-8601 date, and get the
// instant rendered in every common form: UTC calendar breakdown, ISO 8601, the
// HTTP/RFC date, RFC 3339, and the timestamp in all four units.
//
// PURE: arithmetic and Date *with an explicit input value* only. It never calls
// Date.now() or new Date() with no argument, so it holds no dependency on the
// current time — same input always yields the same output. (A "relative to now"
// nicety, which by definition needs the wall clock, lives in the component, not
// here.) Liftable into an open library later.
//
// Sources: POSIX.1-2017 (IEEE Std 1003.1) definition of "Seconds Since the
// Epoch"; RFC 3339 (Date and Time on the Internet); RFC 9110 §5.6.7 (HTTP-date).
// ============================================================================

const MAX_INPUT = 200; // a timestamp or date string is short

export class EpochInputError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "EpochInputError";
    this.code = code;
  }
}

export type EpochUnit = "seconds" | "milliseconds" | "microseconds" | "nanoseconds";
export type InputKind = EpochUnit | "iso";

export interface EpochAnalysis {
  inputKind: InputKind;
  /** Canonical instant as integer milliseconds since 1970-01-01T00:00:00Z. */
  epochMillis: number;
  utc: {
    year: number;
    month: number; // 1-12
    day: number; // 1-31
    hour: number;
    minute: number;
    second: number;
    millisecond: number;
    weekday: string;
    dayOfYear: number;
  };
  formats: {
    iso8601: string; // 2023-11-14T22:13:20.000Z
    httpDate: string; // Tue, 14 Nov 2023 22:13:20 GMT
    rfc3339: string; // 2023-11-14T22:13:20+00:00
    unixSeconds: string;
    unixMillis: string;
    unixMicros: string;
    unixNanos: string;
  };
  notes: { level: "info" | "warn"; text: string }[];
}

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Bounds for the JS Date range: ±100,000,000 days from the epoch (ECMAScript).
const MIN_MS = -8.64e15;
const MAX_MS = 8.64e15;

/** Detect the unit of a numeric epoch by its magnitude. */
function detectUnit(absDigits: number): EpochUnit {
  // ~1.7e9 s, ~1.7e12 ms, ~1.7e15 us, ~1.7e18 ns for the current era.
  if (absDigits < 1e11) return "seconds";
  if (absDigits < 1e14) return "milliseconds";
  if (absDigits < 1e17) return "microseconds";
  return "nanoseconds";
}

function toMillis(value: number, unit: EpochUnit): number {
  switch (unit) {
    case "seconds":
      return value * 1000;
    case "milliseconds":
      return value;
    case "microseconds":
      return Math.floor(value / 1000);
    case "nanoseconds":
      return Math.floor(value / 1e6);
  }
}

function pad(n: number, width = 2): string {
  return String(Math.abs(n)).padStart(width, "0");
}

function dayOfYear(d: Date): number {
  const start = Date.UTC(d.getUTCFullYear(), 0, 1);
  const cur = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.floor((cur - start) / 86400000) + 1;
}

function buildAnalysis(epochMillis: number, inputKind: InputKind): EpochAnalysis {
  const d = new Date(epochMillis);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const hour = d.getUTCHours();
  const minute = d.getUTCMinutes();
  const second = d.getUTCSeconds();
  const millisecond = d.getUTCMilliseconds();

  const iso8601 = d.toISOString();
  const httpDate = d.toUTCString(); // "Tue, 14 Nov 2023 22:13:20 GMT"
  const sign = year < 0 ? "-" : "";
  const yyyy = pad(year, 4);
  const rfc3339 =
    `${sign}${yyyy}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}` +
    (millisecond ? `.${pad(millisecond, 3)}` : "") +
    "+00:00";

  const epochSeconds = Math.floor(epochMillis / 1000);
  const notes: EpochAnalysis["notes"] = [];

  if (epochMillis < 0) {
    notes.push({
      level: "info",
      text: "This instant is before 1970-01-01 (the Unix epoch), so the timestamp is negative.",
    });
  }
  // 32-bit signed seconds overflow: 2038-01-19T03:14:07Z = 2147483647.
  if (epochSeconds > 2_000_000_000 && epochSeconds <= 2_200_000_000) {
    notes.push({
      level: "warn",
      text: "This is close to 2038-01-19T03:14:07Z, where a signed 32-bit seconds counter overflows (the Year 2038 problem). 64-bit systems are unaffected.",
    });
  }
  if (year > 9999 || year < 1) {
    notes.push({
      level: "warn",
      text: "The year falls outside the usual 4-digit range; double-check the unit was detected correctly.",
    });
  }

  return {
    inputKind,
    epochMillis,
    utc: {
      year,
      month,
      day,
      hour,
      minute,
      second,
      millisecond,
      weekday: WEEKDAYS[d.getUTCDay()],
      dayOfYear: dayOfYear(d),
    },
    formats: {
      iso8601,
      httpDate,
      rfc3339,
      unixSeconds: String(epochSeconds),
      unixMillis: String(epochMillis),
      unixMicros: String(epochMillis * 1000),
      unixNanos: String(epochMillis * 1_000_000),
    },
    notes,
  };
}

export function analyzeEpoch(input: string): EpochAnalysis {
  if (input.length > MAX_INPUT) {
    throw new EpochInputError("tooLong", `input exceeds ${MAX_INPUT} characters`);
  }
  const text = input.trim();
  if (text.length === 0) throw new EpochInputError("empty", "no input");

  // Numeric epoch? (optionally signed, optionally a decimal fraction of seconds)
  if (/^-?\d+$/.test(text)) {
    const value = Number(text);
    if (!Number.isFinite(value)) throw new EpochInputError("invalid", "not a finite number");
    const unit = detectUnit(Math.abs(value));
    const ms = toMillis(value, unit);
    if (ms < MIN_MS || ms > MAX_MS) {
      throw new EpochInputError("outOfRange", "timestamp is outside the representable date range");
    }
    const analysis = buildAnalysis(ms, unit);
    analysis.notes.unshift({
      level: "info",
      text: `Read as ${unit} (${text.replace("-", "").length} digits).`,
    });
    return analysis;
  }

  // Decimal seconds, e.g. 1700000000.5
  if (/^-?\d+\.\d+$/.test(text)) {
    const value = Number(text);
    const ms = Math.round(value * 1000);
    if (ms < MIN_MS || ms > MAX_MS) {
      throw new EpochInputError("outOfRange", "timestamp is outside the representable date range");
    }
    const analysis = buildAnalysis(ms, "seconds");
    analysis.notes.unshift({ level: "info", text: "Read as fractional seconds." });
    return analysis;
  }

  // Otherwise, treat as a date string. Normalize a naive (no-timezone) datetime
  // to UTC so parsing is deterministic and not dependent on the runner's zone.
  let normalized = text;
  const hasZone = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(text);
  const looksDateTime = /^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}(:\d{2})?(\.\d+)?)?$/.test(text);
  if (looksDateTime && !hasZone) {
    normalized = text.replace(" ", "T");
    normalized += /T/.test(normalized) ? "Z" : "T00:00:00Z";
  }
  const parsed = Date.parse(normalized);
  if (Number.isNaN(parsed)) {
    throw new EpochInputError("invalid", "could not parse as a timestamp or ISO-8601 date");
  }
  const analysis = buildAnalysis(parsed, "iso");
  analysis.notes.unshift({
    level: "info",
    text: hasZone
      ? "Parsed as a date with an explicit time zone."
      : "Parsed as a date; a value with no time zone was read as UTC.",
  });
  return analysis;
}

/** Stable entry point for golden vectors and the manifest's run. */
export function run(input: string): EpochAnalysis {
  return analyzeEpoch(input);
}
