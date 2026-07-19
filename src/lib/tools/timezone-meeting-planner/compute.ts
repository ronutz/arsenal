// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/timezone-meeting-planner/compute.ts
// ----------------------------------------------------------------------------
// MULTI-TIME-ZONE MEETING PLANNER - one instant, read in every attendee's
// IANA time zone: local date and time, UTC offset, day shift relative to the
// first zone, and a working-hours flag.
//
// Design decisions, stated openly:
// - The zone database is the RUNTIME'S IANA tzdata via the standard Intl API
//   (the same data the operating system and browsers keep current). The tool
//   computes from it deterministically; DST is whatever tzdata says for that
//   date - which is exactly why planning with a real date matters.
// - WORKING HOURS are flagged for 09:00-17:59 local, Monday-Friday - the
//   conventional envelope, stated rather than hidden.
// - The instant must carry Z or an explicit offset, so the plan never depends
//   on the machine the tool happens to run on.
// ============================================================================

export interface ZoneReading {
  /** The IANA zone as given (e.g. "America/Sao_Paulo"). */
  zone: string;
  /** Local calendar date (YYYY-MM-DD) and wall time (HH:MM). */
  localDate: string;
  localTime: string;
  /** Local weekday, English short form (Mon..Sun). */
  weekday: string;
  /** UTC offset as reported by tzdata for that instant (e.g. "GMT-3"). */
  offset: string;
  /** Day shift vs the FIRST zone in the list: -1, 0, or +1. */
  dayDelta: number;
  /** True when 09:00-17:59 local on a weekday. */
  businessHours: boolean;
}

export interface PlannerAnalysis {
  /** The instant, normalized to UTC ISO. */
  instantUtc: string;
  readings: ZoneReading[];
  notes: string[];
}

export class PlannerInputError extends Error {}

/** Validate a zone name against the runtime's tzdata. */
export function isValidZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/** Read one instant in one zone via Intl.formatToParts. */
function readZone(ms: number, zone: string): Omit<ZoneReading, "dayDelta"> {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
    weekday: "short", timeZoneName: "shortOffset",
  }).formatToParts(new Date(ms));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  // en-CA yields YYYY-MM-DD ordering; hour "24" can appear for midnight.
  const hour = get("hour") === "24" ? "00" : get("hour");
  const localDate = `${get("year")}-${get("month")}-${get("day")}`;
  const localTime = `${hour}:${get("minute")}`;
  const weekday = get("weekday");
  const offset = get("timeZoneName");
  const h = Number(hour);
  const businessHours = h >= 9 && h < 18 && !["Sat", "Sun"].includes(weekday);
  return { zone, localDate, localTime, weekday, offset, businessHours };
}

/** Plan one instant across many zones. First zone is the day-delta anchor. */
export function plan(instantRaw: string, zones: string[]): PlannerAnalysis {
  const s = String(instantRaw ?? "").trim();
  if (!s) throw new PlannerInputError("Enter the meeting instant (ISO 8601 with Z or an offset, e.g. 2026-07-18T15:00Z).");
  if (!/(Z|[+-]\d{2}:?\d{2})$/i.test(s)) {
    throw new PlannerInputError("Add Z or an explicit offset (e.g. -03:00) to the instant: a meeting time without one is ambiguous, and this tool never guesses.");
  }
  const ms = Date.parse(s);
  if (Number.isNaN(ms)) throw new PlannerInputError(`"${s}" is not a parseable ISO 8601 timestamp.`);
  const list = (zones ?? []).map((z) => String(z).trim()).filter(Boolean);
  if (list.length === 0) throw new PlannerInputError("Add at least one IANA time zone (e.g. America/Sao_Paulo).");
  for (const z of list) {
    if (!isValidZone(z)) throw new PlannerInputError(`"${z}" is not an IANA time zone known to this runtime. The form is Area/City, e.g. Europe/Berlin.`);
  }
  const base = readZone(ms, list[0]);
  const readings: ZoneReading[] = list.map((z) => {
    const r = readZone(ms, z);
    // Day delta by calendar-date comparison against the first zone.
    const dayDelta = r.localDate === base.localDate ? 0 : r.localDate > base.localDate ? 1 : -1;
    return { ...r, dayDelta };
  });
  const notes: string[] = [];
  if (readings.some((r) => !r.businessHours)) {
    notes.push("Working hours are flagged for 09:00-17:59 local, Monday to Friday - the conventional envelope, adjust to taste.");
  }
  if (readings.some((r) => r.dayDelta !== 0)) {
    notes.push("At least one attendee is on a different calendar date - worth saying out loud in the invitation.");
  }
  return { instantUtc: new Date(ms).toISOString().replace(".000Z", "Z"), readings, notes };
}

/** API entrypoint (D-72). */
export function run(input: { instant: string; zones: string[] }): PlannerAnalysis {
  return plan(String(input?.instant ?? ""), Array.isArray(input?.zones) ? input.zones : []);
}
