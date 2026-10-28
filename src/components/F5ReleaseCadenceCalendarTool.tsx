"use client";

// ============================================================================
// src/components/F5ReleaseCadenceCalendarTool.tsx
// ----------------------------------------------------------------------------
// Live F5 release cadence calendar. Defaults to the real "today" (computed on the
// client, so the static export is never frozen), highlights the next hardened
// release and the next security notification, and lists the upcoming schedule.
// All dates come from the compute layer; local, no network.
//
// SHARE RESULTS (2026-10-27): a button under the two headline dates builds,
// only when pressed, a link carrying the start date (unless it is today) and
// the number of months (unless it is 6) (spec:
// src/lib/tools/f5-release-cadence-calendar/share.ts); it is disabled while
// the form is untouched. An arriving link (useShareArrival) sets them; an
// absent date keeps the reader's own today. The address loses the values at
// once.
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { run, type CadenceResult } from "@/lib/tools/f5-release-cadence-calendar";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what a spec encodes
import { CADENCE_SHARE } from "@/lib/tools/f5-release-cadence-calendar/share"; // this tool's share spec: a start date and a count

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** ISO "YYYY-MM-DD" -> "Wed, Jul 15, 2026" (all cadence dates are Wednesdays). */
function fmt(iso: string): string {
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** Whole days between two ISO dates (UTC midnight, so timezone-safe). */
function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(toIso) - Date.parse(fromIso)) / 86400000);
}

export default function F5ReleaseCadenceCalendarTool() {
  const t = useTranslations("tools.f5-release-cadence-calendar");
  // "today" resolved on the client so a statically exported page stays current.
  const [today, setToday] = useState("2026-07-15");
  const [from, setFrom] = useState("2026-07-15");
  const [months, setMonths] = useState(6);

  useEffect(() => {
    const iso = new Date().toISOString().slice(0, 10);
    setToday(iso);
    setFrom(iso);
  }, []);

  const result: CadenceResult = useMemo(() => run({ from, months }), [from, months]);

  // An arriving share link: the start date (when carried) and the count are set; the page lists the dates.
  // Registered after the effect that sets today, so a carried date is applied after it on a fresh load.
  useShareArrival(CADENCE_SHARE, (state) => {
    // The start date, when the link carries one.
    if (state.from !== null) setFrom(state.from);
    // The count.
    setMonths(state.months);
  });
  // What Share results may carry: the date the schedule was computed from (unless today) and the count (unless 6).
  const share = useMemo<ShareEncoding>(() => CADENCE_SHARE.encode({ reference: result.referenceDate, months, today }), [result, months, today]); // memoised

  const relDays = (iso: string): string => {
    const d = daysBetween(today, iso);
    if (d === 0) return t("today");
    if (d > 0) return t("inDays", { n: d });
    return t("daysAgo", { n: -d });
  };

  const fillExample = useCallback(() => {
    setFrom("2026-07-01");
    setMonths(6);
  }, []);
  const clearAll = useCallback(() => {
    setFrom(today);
    setMonths(6);
  }, [today]);

  return (
    <div className="cidr-tool jwt-tool">
      {/* Controls */}
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="rc-from">
            {t("fromLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={fillExample}>
              {t("example")}
            </button>
            <button type="button" className="b64-copy" onClick={clearAll}>
              {t("clear")}
            </button>
          </div>
        </div>
        <div className="rc-controls">
          <input
            id="rc-from"
            type="date"
            className="cidr-input mono"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <label className="cidr-label rc-months-label" htmlFor="rc-months">
            {t("monthsLabel")}
          </label>
          <input
            id="rc-months"
            type="number"
            min={1}
            max={24}
            className="cidr-input mono rc-months-input"
            value={months}
            onChange={(e) => setMonths(parseInt(e.target.value, 10) || 1)}
          />
        </div>
      </div>

      {/* The two headline dates */}
      <div className="jwt-results">
        <div className="rc-next-row">
          <section className="jwt-panel rc-next">
            <h4 className="jwt-panel-title">{t("nextReleaseLabel")}</h4>
            <p className="rc-next-date">{fmt(result.nextHardenedRelease)}</p>
            <p className="hmac-build-note">{relDays(result.nextHardenedRelease)}</p>
          </section>
          <section className="jwt-panel rc-next">
            <h4 className="jwt-panel-title">{t("nextNotifLabel")}</h4>
            <p className="rc-next-date">{fmt(result.nextSecurityNotification)}</p>
            <p className="hmac-build-note">{relDays(result.nextSecurityNotification)}</p>
          </section>
        </div>

        {/* Share results: under the two headline dates, at the start of its own row. */}
        <div className="rdap-ask-row">
          <ShareResultsButton encoding={share} carries={t("share.carries", { from: share.ok && share.params.from ? "yes" : "no" })} title={t("name")} />
        </div>

        {/* The schedule. Four columns with long localized headers exceed a
            phone viewport (~430px on iPhone 16 Pro Max, reported by PRIME
            2026-07-07), so the table sits inside a horizontal-scroll wrapper:
            the card keeps its border and the table scrolls within it instead
            of bleeding past the card edge. Mirrors .admin-table-wrap. */}
        <div className="hash-out">
          <div className="rc-table-wrap">
          <table className="rc-table">
            <thead>
              <tr>
                <th>{t("colDate")}</th>
                <th>{t("colRelease")}</th>
                <th>{t("colNotification")}</th>
                <th>{t("colCovers")}</th>
              </tr>
            </thead>
            <tbody>
              {result.cycles.map((c) => (
                <tr key={c.date}>
                  <td className="mono">{fmt(c.date)}</td>
                  <td>{t("releaseYes")}</td>
                  <td>{c.notificationPublished ? t("releaseYes") : <span className="rc-none">{t("notifNone")}</span>}</td>
                  <td className="mono">{c.notificationCovers ? fmt(c.notificationCovers) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>{/* /.rc-table-wrap */}
        </div>

        <p className="hmac-build-note">{t("note1")}</p>
        <p className="hmac-build-note">{t("note2")}</p>
        <p className="hmac-build-note">
          {t("learnMore")}{" "}
          <Link href="/learn/f5-monthly-release-cadence" className="mb-titlebar-devfun">
            {t("learnLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
