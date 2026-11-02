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
//
// PAGE LANGUAGE (02/11/2026): notes and input errors are built as EngineTexts
// (src/lib/tools/engine-text.ts): a stable id, the English exactly as before,
// and its values. planLocalisable() returns the reading with them in place;
// plan() and run(), the API's and the vectors' entries, return plainText() of
// the same reading, byte for byte what they returned. Input errors keep their
// class (PlannerInputError) and message and carry their sentence.
// ============================================================================

import { say, plainText, withEngineText, type EngineText } from "../engine-text"; // sentences with ids (02/11/2026)

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

/** S is string in the API's reading and EngineText in the page's (planLocalisable). */
export interface PlannerAnalysis<S = string> {
  /** The instant, normalized to UTC ISO. */
  instantUtc: string;
  readings: ZoneReading[];
  notes: S[];
}

export class PlannerInputError extends Error {}

/**
 * An input error carrying its sentence (02/11/2026): the message is the English, as before.
 * @param m the sentence
 * @returns the error to throw
 */
function inputError(m: EngineText): PlannerInputError {
  return withEngineText(new PlannerInputError(m.text), m); // the same class and message, plus the sentence
} // inputError

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

/** Plan one instant across many zones. First zone is the day-delta anchor (02/11/2026: the reading of planLocalisable() with every sentence as its English). */
export function plan(instantRaw: string, zones: string[]): PlannerAnalysis {
  return plainText(planLocalisable(instantRaw, zones)); // the same reading, sentences as their English
}

/**
 * The page's plan (02/11/2026): plan()'s reading with its notes as EngineTexts; input errors carry their sentence.
 * @param instantRaw the instant, as typed
 * @param zones the zones, as typed
 * @returns the reading with sentences as EngineTexts
 */
export function planLocalisable(instantRaw: string, zones: string[]): PlannerAnalysis<EngineText> {
  const s = String(instantRaw ?? "").trim();
  if (!s) throw inputError(say("err.enter", "Enter the meeting instant (ISO 8601 with Z or an offset, e.g. 2026-07-18T15:00Z)."));
  if (!/(Z|[+-]\d{2}:?\d{2})$/i.test(s)) {
    throw inputError(say("err.noOffset", "Add Z or an explicit offset (e.g. -03:00) to the instant: a meeting time without one is ambiguous, and this tool never guesses."));
  }
  const ms = Date.parse(s);
  if (Number.isNaN(ms)) throw inputError(say("err.unparseable", `"${s}" is not a parseable ISO 8601 timestamp.`, { value: s }));
  const list = (zones ?? []).map((z) => String(z).trim()).filter(Boolean);
  if (list.length === 0) throw inputError(say("err.noZone", "Add at least one IANA time zone (e.g. America/Sao_Paulo)."));
  for (const z of list) {
    if (!isValidZone(z)) throw inputError(say("err.badZone", `"${z}" is not an IANA time zone known to this runtime. The form is Area/City, e.g. Europe/Berlin.`, { zone: z }));
  }
  const base = readZone(ms, list[0]);
  const readings: ZoneReading[] = list.map((z) => {
    const r = readZone(ms, z);
    // Day delta by calendar-date comparison against the first zone.
    const dayDelta = r.localDate === base.localDate ? 0 : r.localDate > base.localDate ? 1 : -1;
    return { ...r, dayDelta };
  });
  const notes: EngineText[] = [];
  if (readings.some((r) => !r.businessHours)) {
    notes.push(say("note.workingHours", "Working hours are flagged for 09:00-17:59 local, Monday to Friday - the conventional envelope, adjust to taste."));
  }
  if (readings.some((r) => r.dayDelta !== 0)) {
    notes.push(say("note.dateShift", "At least one attendee is on a different calendar date - worth saying out loud in the invitation."));
  }
  return { instantUtc: new Date(ms).toISOString().replace(".000Z", "Z"), readings, notes };
}

/** API entrypoint (D-72). */
export function run(input: { instant: string; zones: string[] }): PlannerAnalysis {
  return plan(String(input?.instant ?? ""), Array.isArray(input?.zones) ? input.zones : []);
}

/** The page's entry for the same input (02/11/2026): the reading with sentences as EngineTexts. */
export function runLocalisable(input: { instant: string; zones: string[] }): PlannerAnalysis<EngineText> {
  return planLocalisable(String(input?.instant ?? ""), Array.isArray(input?.zones) ? input.zones : []); // the plan with sentence ids
}
