// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/TimezoneMeetingPlannerTool.tsx — client UI for the
// multi-time-zone meeting planner. One instant, one zone per line; a table
// of local readings with day-shift and working-hours flags. The zone data is
// the browser's own IANA tzdata; all compute is local.
// ============================================================================
"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { plan, PlannerInputError, type PlannerAnalysis } from "@/lib/tools/timezone-meeting-planner";

type Result = { ok: true; data: PlannerAnalysis } | { ok: false; message: string };

// D-83 Example sample — verbatim from this tool's golden vectors (v1-july).
const EX_INSTANT = "2026-07-18T15:00Z";
const EX_ZONES = "America/Sao_Paulo\nEurope/Berlin\nAsia/Tokyo\nAmerica/Los_Angeles";

export default function TimezoneMeetingPlannerTool() {
  const t = useTranslations("tools.timezone-meeting-planner");
  const [instant, setInstant] = useState("");
  const [zones, setZones] = useState("");

  const result: Result | null = useMemo(() => {
    if (!instant.trim() && !zones.trim()) return null;
    try {
      return { ok: true, data: plan(instant, zones.split(/\n+/)) };
    } catch (e) {
      return { ok: false, message: e instanceof PlannerInputError ? e.message : t("errGeneric") };
    }
  }, [instant, zones, t]);

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
            <h3 className="cidr-h">{t("resultTitle")}</h3>
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
                      <td>{r.weekday}</td>
                      <td className="mono">{r.offset}</td>
                      <td className="mono">{r.dayDelta === 0 ? "±0" : r.dayDelta > 0 ? "+1" : "−1"}</td>
                      <td>{r.businessHours ? t("bhYes") : t("bhNo")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          {result.data.notes.map((n, i) => (<p key={i}>{n}</p>))}
        </div>
      )}
    </div>
  );
}
