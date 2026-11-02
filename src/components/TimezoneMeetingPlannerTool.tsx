// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/TimezoneMeetingPlannerTool.tsx — client UI for the
// multi-time-zone meeting planner. One instant, one zone per line; a table
// of local readings with day-shift and working-hours flags. The zone data is
// the browser's own IANA tzdata; all compute is local.
//
// Share results (2026-11-01): a button under the table builds a link that
// carries the instant and the zones as typed. An arriving link
// (useShareArrival) fills both as the reader would.
//
// Page language (02/11/2026): the plan comes from planLocalisable() and is
// turned into the page's language by inPageLanguage(); input errors through
// engineTexts().error; the weekday (the runtime's English short form) is shown
// through the weekday.* messages. The English page reads exactly as before.
// ============================================================================
"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { planLocalisable, PlannerInputError, type PlannerAnalysis } from "@/lib/tools/timezone-meeting-planner/compute"; // the reading with sentence ids (02/11/2026)
import { engineTexts } from "@/lib/tools/engine-text"; // engine sentences in the page's language
import { inPageLanguage } from "@/lib/tools/engine-text-page"; // a whole reading in the page's language
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { PLANNER_SHARE, encodePlannerShare } from "@/lib/tools/timezone-meeting-planner/share"; // this tool's share spec: the instant and the zones

type Result = { ok: true; data: PlannerAnalysis } | { ok: false; message: string };

// D-83 Example sample — verbatim from this tool's golden vectors (v1-july).
const EX_INSTANT = "2026-07-18T15:00Z";
const EX_ZONES = "America/Sao_Paulo\nEurope/Berlin\nAsia/Tokyo\nAmerica/Los_Angeles";

export default function TimezoneMeetingPlannerTool() {
  const t = useTranslations("tools.timezone-meeting-planner");
  const tx = useMemo(() => engineTexts(t), [t]); // the engine's sentences in the page's language (02/11/2026)
  const [instant, setInstant] = useState("");
  const [zones, setZones] = useState("");

  const result: Result | null = useMemo(() => {
    if (!instant.trim() && !zones.trim()) return null;
    try {
      return { ok: true, data: inPageLanguage(planLocalisable(instant, zones.split(/\n+/)), tx) }; // the plan, in the page's language
    } catch (e) {
      return { ok: false, message: e instanceof PlannerInputError ? tx.error(e) : t("errGeneric") }; // the input error's sentence in the page's language
    }
  }, [instant, zones, t, tx]);

  // An arriving share link: the instant and the zones fill as the reader would type them, and the page plans.
  useShareArrival(PLANNER_SHARE, (s) => { setInstant(s.instant); setZones(s.zones); }); // as typed
  // What Share results carries: both fields, once the page has a plan (memoised).
  const share = useMemo(() => encodePlannerShare({ instant, zones }, !!result?.ok), [instant, zones, result]); // the encoding

  return (
    <div className="cidr-tool jwt-tool json-tool tmsh-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="tzp-instant">{t("instantLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => { setInstant(EX_INSTANT); setZones(EX_ZONES); }}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => { setInstant(""); setZones(""); }}>{t("clear")}</button>
          </div>
        </div>
        <input
          id="tzp-instant"
          className="cidr-input mono json-input"
          value={instant}
          onChange={(e) => setInstant(e.target.value)}
          placeholder="2026-07-18T15:00Z"
          autoComplete="off" spellCheck={false}
        />
        <label className="cidr-label" htmlFor="tzp-zones">{t("zonesLabel")}</label>
        <textarea
          id="tzp-zones"
          className="cidr-input mono saml-textarea json-input tmsh-input"
          rows={4}
          value={zones}
          onChange={(e) => setZones(e.target.value)}
          placeholder={"America/Sao_Paulo\nEurope/Berlin\nAsia/Tokyo"}
          autoComplete="off" spellCheck={false}
        />
        <p className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">●</span>
          {t("runsLocally")}
        </p>
      </div>

      {result && !result.ok && (
        <div className="json-error-box" role="alert">
          <p className="json-error-headline">{t("errorTitle")}</p>
          <p className="json-error-message">{result.message}</p>
        </div>
      )}

      {result && result.ok && (
        <div className="tmsh-results">
          <section>
            <h3 className="cidr-section-title">{t("resultTitle")}</h3>
            <p className="mono">{result.data.instantUtc} UTC</p>
            <div className="cidr-table-wrap">
              <table className="cidr-table">
                <thead>
                  <tr>
                    <th>{t("colZone")}</th><th>{t("colLocal")}</th><th>{t("colWeekday")}</th>
                    <th>{t("colOffset")}</th><th>{t("colDay")}</th><th>{t("colBusiness")}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.data.readings.map((r) => (
                    <tr key={r.zone}>
                      <td className="mono">{r.zone}</td>
                      <td className="mono">{r.localDate} {r.localTime}</td>
                      <td>{t.has(`weekday.${r.weekday}`) ? t(`weekday.${r.weekday}`) : r.weekday}</td>
                      <td className="mono">{r.offset}</td>
                      <td className="mono">{r.dayDelta === 0 ? "±0" : r.dayDelta > 0 ? "+1" : "−1"}</td>
                      <td>{r.businessHours ? t("bhYes") : t("bhNo")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          {/* Share results: under the table, at the start of its own row, before the notes. */}
          <div className="rdap-ask-row">
            <ShareResultsButton encoding={share} carries={t("share.carries")} title={t("name")} />
          </div>
          {result.data.notes.map((n, i) => (<p key={i}>{n}</p>))}
        </div>
      )}
    </div>
  );
}
