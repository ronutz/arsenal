"use client";

// ============================================================================
// src/components/GlobalClocks.tsx
// ----------------------------------------------------------------------------
// THE TEACHING WINDOWS: ten cities across the regions the courses are delivered
// in, each with its live local time and its IANA zone, the reader's own zone
// first, and a "class starts at" control that answers the one scheduling
// question an international training coordinator actually has: if the class
// starts at 09:00 in Singapore, what time is that for everyone else?
//
// Built for /training (PRIME, 2026-10-04, from the independent review of the
// page: "the global-delivery visualization could become a signature feature";
// PRIME: "a nice impressive useful visualization is priority, interactiveness
// only if it adds additional value"). The map was left out on purpose: time
// zones are longitudinal, and a band of clocks says what a map of pins cannot,
// which is the relationship between the regions.
//
// Correctness. Every time is computed by Intl.DateTimeFormat from the browser's
// own IANA zone data, so daylight saving is applied where it exists (Chicago,
// New York, London, Berlin, Sydney shift; São Paulo, Dubai, Mumbai and
// Singapore do not) and the abbreviation shown (PDT, CEST, AEDT...) is the one
// in force on that day. The "class starts at" conversion needs the inverse
// problem, a wall-clock time in one zone turned into an instant: the zone's
// offset at the guessed instant is read back through Intl and the guess is
// corrected, twice, which settles a DST edge within one step. Nothing is sent
// anywhere; the clocks tick from the device's own clock once a minute.
// ============================================================================

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

/** The ten cities, west to east, with their IANA zones. The keys are message ids. */
const CITIES: readonly { key: string; zone: string }[] = [
  { key: "sanfrancisco", zone: "America/Los_Angeles" },
  { key: "chicago", zone: "America/Chicago" },
  { key: "newyork", zone: "America/New_York" },
  { key: "saopaulo", zone: "America/Sao_Paulo" },
  { key: "london", zone: "Europe/London" },
  { key: "berlin", zone: "Europe/Berlin" },
  { key: "dubai", zone: "Asia/Dubai" },
  { key: "mumbai", zone: "Asia/Kolkata" },
  { key: "singapore", zone: "Asia/Singapore" },
  { key: "sydney", zone: "Australia/Sydney" },
];

/** "HH:MM" in a zone for an instant, 24-hour clock. */
function wallTime(at: Date, zone: string): string {
  // hourCycle h23 keeps midnight as 00, never 24.
  return new Intl.DateTimeFormat("en-GB", { timeZone: zone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(at);
}

/** The short zone name in force at an instant (PDT, BRT, GMT+4...). */
function zoneAbbrev(at: Date, zone: string, locale: string): string {
  // The timeZoneName part of a formatted date; falls back to the zone id if the engine gives none.
  const parts = new Intl.DateTimeFormat(locale, { timeZone: zone, timeZoneName: "short" }).formatToParts(at);
  return parts.find((p) => p.type === "timeZoneName")?.value ?? zone;
}

/** The civil date (y, m, d) and the minutes since midnight of an instant in a zone. */
function civil(at: Date, zone: string): { ymd: string; minutes: number } {
  // Numeric parts, read individually so no locale punctuation gets in the way.
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? "0");
  return { ymd: `${get("year")}-${String(get("month")).padStart(2, "0")}-${String(get("day")).padStart(2, "0")}`, minutes: get("hour") * 60 + get("minute") };
}

/** The offset of a zone at an instant, in minutes east of UTC, via the wall time Intl reports. */
function offsetMinutes(at: Date, zone: string): number {
  // Compare the zone's wall clock with the UTC wall clock of the same instant.
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? "0");
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUtc - at.getTime()) / 60000);
}

/** The instant at which the wall clock in `zone` reads `hh:mm` on the zone's current date. */
function instantFor(hhmm: string, zone: string, now: Date): Date {
  // The date in that zone today, then a UTC guess, corrected by the zone's offset at the guess (twice, for a DST edge).
  const [h, m] = hhmm.split(":").map(Number);
  const today = civil(now, zone).ymd.split("-").map(Number);
  let guess = Date.UTC(today[0], today[1] - 1, today[2], h, m, 0);
  for (let i = 0; i < 2; i++) guess = Date.UTC(today[0], today[1] - 1, today[2], h, m, 0) - offsetMinutes(new Date(guess), zone) * 60000;
  return new Date(guess);
}

export default function GlobalClocks() {
  const t = useTranslations("teach.clocks");
  // The instant the clocks show; refreshed each minute.
  const [now, setNow] = useState<Date | null>(null);
  // The class start: a wall-clock time and the zone it is stated in (São Paulo by default, the author's own).
  const [startTime, setStartTime] = useState("09:00");
  const [startZone, setStartZone] = useState("America/Sao_Paulo");
  // The reader's own zone, from the browser; filled after mount so the server render matches the first client render.
  const [ownZone, setOwnZone] = useState<string | null>(null);

  useEffect(() => {
    // First tick, then one per minute on the minute boundary.
    setNow(new Date());
    setOwnZone(Intl.DateTimeFormat().resolvedOptions().timeZone || null);
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  // The class instant, when a valid time is set.
  const classAt = useMemo(() => (now && /^\d{2}:\d{2}$/.test(startTime) ? instantFor(startTime, startZone, now) : null), [now, startTime, startZone]);
  // The reader's zone as a row of its own when it is not already one of the ten.
  const ownIsListed = ownZone !== null && CITIES.some((c) => c.zone === ownZone);
  // The locale for zone abbreviations.
  const locale = typeof navigator !== "undefined" ? navigator.language : "en";

  /** One row: the city, its zone, the live time and the class time with a day marker. */
  const row = (key: string, zone: string, label: string, own: boolean) => {
    // Before mount there is no instant to show; render the structure with placeholders so nothing jumps.
    const live = now ? wallTime(now, zone) : "--:--";
    const abbrev = now ? zoneAbbrev(now, zone, locale) : "";
    let cls = "--:--";
    let day = "";
    if (classAt) {
      // The class time in this zone, and whether its date differs from the date in the anchor zone.
      cls = wallTime(classAt, zone);
      const here = civil(classAt, zone).ymd;
      const anchor = civil(classAt, startZone).ymd;
      day = here === anchor ? "" : here > anchor ? t("nextDay") : t("prevDay");
    }
    return (
      <li key={key} className={"gclock" + (own ? " gclock--own" : "")}>
        <span className="gclock-city">{label}</span>
        <span className="gclock-zone mono">{zone}{abbrev ? ` · ${abbrev}` : ""}</span>
        <span className="gclock-now mono" aria-label={t("nowLabel")}>{live}</span>
        <span className="gclock-class mono" aria-label={t("classLabel")}>{cls}{day ? <span className="gclock-day"> {day}</span> : null}</span>
      </li>
    );
  };

  return (
    <div className="gclocks">
      {/* The control: a time and the zone it is stated in. */}
      <div className="gclocks-control">
        <label className="gclocks-label" htmlFor="gclocks-time">{t("startLabel")}</label>
        <input id="gclocks-time" className="curlb-input gclocks-time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} step={300} />
        <span className="gclocks-in">{t("startIn")}</span>
        <select id="gclocks-zone" className="curlb-select gclocks-zone" value={startZone} onChange={(e) => setStartZone(e.target.value)} aria-label={t("startIn")}>
          {CITIES.map((c) => <option key={c.zone} value={c.zone}>{t(`city.${c.key}`)}</option>)}
          {ownZone && !ownIsListed && <option value={ownZone}>{t("yourTime")} ({ownZone})</option>}
        </select>
      </div>
      {/* The column heads, then the rows. */}
      <ul className="gclocks-list">
        <li className="gclock gclock--head" aria-hidden="true">
          <span className="gclock-city" />
          <span className="gclock-zone" />
          <span className="gclock-now">{t("nowLabel")}</span>
          <span className="gclock-class">{t("classLabel")}</span>
        </li>
        {ownZone && !ownIsListed && row("own", ownZone, t("yourTime"), true)}
        {CITIES.map((c) => row(c.key, c.zone, t(`city.${c.key}`), ownZone === c.zone))}
      </ul>
      {/* The reader's zone, named, and the provenance of the arithmetic. */}
      <p className="hmac-build-note gclocks-note">{ownZone ? t("yourZone", { zone: ownZone }) + " " : ""}{t("note")}</p>
    </div>
  );
}
