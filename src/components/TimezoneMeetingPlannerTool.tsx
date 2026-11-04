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
//
// WITHOUT A KEYBOARD (03/11/2026): under the instant, a date-and-time picker
// (type="datetime-local") writes the field as typing would; the field stays
// typed text, because the engine requires an offset a picker cannot hold, so a
// pick keeps the field's seconds and offset, or adds Z (UTC) when it had none,
// as the label says. Under the zones, a select lists every IANA zone this
// browser knows (Intl.supportedValuesOf, the same data the plan reads) and a
// choice adds it as a new line. The list is read after the page loads, so the
// server's and the browser's first render agree.
// ============================================================================
"use client";

import { useEffect, useMemo, useState } from "react"; // useEffect reads the zone list once on the client (03/11/2026)
import { useTranslations } from "next-intl";
import { planLocalisable, PlannerInputError, type PlannerAnalysis } from "@/lib/tools/timezone-meeting-planner/compute"; // the reading with sentence ids (02/11/2026)
import { engineTexts } from "@/lib/tools/engine-text"; // engine sentences in the page's language
import { inPageLanguage } from "@/lib/tools/engine-text-page"; // a whole reading in the page's language
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { PLANNER_SHARE, encodePlannerShare } from "@/lib/tools/timezone-meeting-planner/share"; // this tool's share spec: the instant and the zones

type Result = { ok: true; data: PlannerAnalysis } | { ok: false; message: string };

/**
 * An instant split for the date-and-time picker: "2026-07-18T15:00:30-03:00" gives the picker's "2026-07-18T15:00"
 * and the tail ":30-03:00", kept when the reader picks.
 *
 * @param text the field as typed
 * @returns the picker's value ("" when the field holds no date and time it can show) and the tail to keep
 */
function pickerParts(text: string): { local: string; tail: string } {
  // A date, a T or a space, hours and minutes, optional seconds, an optional offset.
  const m = /^\s*(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(:\d{2}(?:\.\d+)?)?\s*(Z|[+-]\d{2}:?\d{2})?\s*$/i.exec(text);
  // Shown and kept, or an empty picker whose pick is read as UTC.
  return m ? { local: `${m[1]}T${m[2]}`, tail: (m[3] ?? "") + (m[4] ?? "Z") } : { local: "", tail: "Z" };
}

/**
 * Every IANA zone this browser knows, or none where the runtime cannot list them.
 *
 * @returns the zone names, sorted as the runtime gives them
 */
function knownZones(): string[] {
  // Intl.supportedValuesOf is ES2022; an older runtime simply offers no list (the field is still typed).
  const list = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf;
  // The zones, or none; a runtime that throws offers none too.
  try { return typeof list === "function" ? list("timeZone") : []; } catch { return []; }
}

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

  // ---- Without a keyboard (03/11/2026). ----
  /** What the instant's picker shows, and what a pick keeps. */
  const pick = pickerParts(instant); // from the field as typed
  /** Every zone the browser knows, read after the page loads (empty on the server and in the first render). */
  const [allZones, setAllZones] = useState<string[]>([]); // the select's options
  // Read once, on the client.
  useEffect(() => setAllZones(knownZones()), []);
  /** The zones already listed (trimmed lines), so the select does not offer them twice. */
  const listed = new Set(zones.split(/\n+/).map((z) => z.trim()).filter(Boolean)); // as the engine reads the lines
  /**
   * Add a zone as a new line, as typing it would.
   *
   * @param zone an IANA zone name
   */
  const addZone = (zone: string) => {
    // A choice of the prompt (the empty option) adds nothing.
    if (!zone) return;
    // The lines so far without trailing blank lines, then the new zone on its own line.
    setZones((cur) => (cur.trim() ? `${cur.replace(/\s+$/, "")}\n${zone}` : zone));
  };

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
        {/* Or the instant from a picker: a pick keeps the field's seconds and offset (Z when it had none). */}
        <label className="time-pick" htmlFor="tzp-instant-pick">
          <span className="time-pick-label">{t("pickLabel")}</span>
          {/* A cleared picker (an empty value) leaves the field as it is. */}
          <input id="tzp-instant-pick" type="datetime-local" className="cidr-input mono time-pick-input" value={pick.local} aria-label={t("pickAria", { field: t("instantLabel") })} onChange={(e) => { if (e.target.value) setInstant(e.target.value + pick.tail); }} />
        </label>
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
        {/* Or a zone from the browser's list, added as a new line; the select returns to its prompt after each choice.
            Shown only once the list is read (a browser that cannot list zones keeps the typed field alone). */}
        {allZones.length > 0 && (
          <label className="time-pick" htmlFor="tzp-add-zone">
            <span className="time-pick-label">{t("addZone")}</span>
            <select id="tzp-add-zone" className="cidr-input mono time-pick-input" value="" onChange={(e) => addZone(e.target.value)}>
              <option value="">{t("addZonePrompt")}</option>
              {allZones.filter((z) => !listed.has(z)).map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </label>
        )}
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
