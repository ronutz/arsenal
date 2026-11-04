"use client";

// ============================================================================
// src/components/F5ServiceCheckDateTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE F5 SERVICE-CHECK-DATE TOOL.
//
// One field, auto-detecting, two directions (the engine decides which):
//   * enter a BIG-IP version (17.1.3, 21.1, 16.1.x) -> the minimum service check
//     date the license must carry to be allowed to boot it, in ISO form and in
//     the bigip.license compact form, with the major.minor granularity note and
//     the "boots but won't load config" consequence;
//   * enter a service check date (20230611 / 2023-06-11 / 2023/06/11) -> the
//     newest version you can upgrade to, and the newer branches you cannot reach
//     yet with the date each one needs;
//   * paste /config/bigip.license contents or tmsh show sys license output ->
//     the service check date is extracted (file and tmsh line forms, flexible
//     case / colon / whitespace) and answered as above, with the matched line
//     echoed back for confirmation.
//
// Everything runs IN THE BROWSER via the local f5-service-check-date module,
// which looks up a vendored copy of F5's authoritative K7727 License Check Date
// table - no fetch, no API, no clock. All output is escaped text through React.
// A "verify against K7727 / /etc/version_date" note sits by the answer because
// this is vendor documentation, not a stable standard.
//
// SHARE RESULTS (2026-10-27): a button under the answer builds, only when
// pressed, a link carrying the version or the date as typed, or, from a
// pasted licence, only the service check date line the page read out of it,
// never the licence (spec: src/lib/tools/f5-service-check-date/share.ts). An
// arriving link (useShareArrival) fills the field as typing would and
// computes; the address loses the value at once.
//
// WITHOUT A KEYBOARD (03/11/2026, PRIME: values set "through the click of a
// mouse (or press of the touchscreen)"): under the field, a date picker and a
// version list fill it as typing would. The date picker writes yyyy-mm-dd
// (one of the three forms the engine reads), within the engine's 1990 to 2100;
// the list holds every K7727 row the tool carries, by F5's own label, and
// writes a version that row covers (17.1.x for a branch, 10.2.2 for "10.2.2 -
// 10.2.4"). Each shows the field's value when it holds one of its own.
// ============================================================================

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  run,
  ServiceCheckError,
  parseServiceCheckDate,
  LICENSE_CHECK_TABLE,
  ANY_PATCH,
  type LookupResult,
} from "@/lib/tools/f5-service-check-date";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what a spec encodes
import { SERVICE_CHECK_SHARE } from "@/lib/tools/f5-service-check-date/share"; // this tool's share spec: the value, or a licence's one line

// D-83 Example samples — verbatim from this tool's golden vectors.
const EXAMPLE = "17.1.3";

/** Nothing to share (the button is disabled): a constant, so the button sees no change. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" };

/** The version list: each K7727 row by F5's label, with a version the engine reads that the row covers. */
const VERSION_CHOICES = LICENSE_CHECK_TABLE.map((e) => ({
  // F5's label, shown in the list ("17.1.x", "11.3.0", "10.2.2 - 10.2.4").
  label: e.label,
  // A branch row: major.minor.x; a single release or a range: its first version.
  value: e.hi[2] === ANY_PATCH ? `${e.lo[0]}.${e.lo[1]}.x` : e.lo.join("."),
}));

/** The years the engine accepts in a service check date (compute.ts parseServiceCheckDate), as the picker's bounds. */
const DATE_MIN = "1990-01-01";
// The last day it accepts.
const DATE_MAX = "2100-12-31";

/**
 * The field's value as the date picker shows it: yyyy-mm-dd when the field holds a valid service check date in any
 * of its three forms, otherwise nothing (the picker is then empty).
 *
 * @param text the field's text
 * @returns the ISO date, or ""
 */
function pickerDate(text: string): string {
  // The engine's own reading of a date.
  try {
    // Its ISO form.
    return parseServiceCheckDate(text).iso;
  } catch {
    // Not a date (a version, a licence, or nothing).
    return "";
  }
}

export default function F5ServiceCheckDateTool() {
  const t = useTranslations("tools.f5-service-check-date");

  const [value, setValue] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const compute = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) {
        setResult(null);
        setError(null);
        return;
      }
      try {
        setResult(run(trimmed));
        setError(null);
      } catch (e) {
        const code = e instanceof ServiceCheckError ? e.code : "format";
        setError(t(`errors.${code}`));
        setResult(null);
      }
    },
    [t]
  );

  // An arriving share link: the value fills the field as typing would, and the page computes.
  useShareArrival(SERVICE_CHECK_SHARE, (state) => {
    // The field.
    setValue(state.input);
    // The answer.
    compute(state.input);
  });
  // The line the page read out of a pasted licence, when it did.
  const extracted = result?.kind === "date" && result.extractedFrom ? result.extractedFrom.matchedText : null; // or none
  // What Share results may carry: the value, or only that line, while there is an answer.
  const share = useMemo<ShareEncoding>(() => (result ? SERVICE_CHECK_SHARE.encode({ input: value, extracted }) : NOTHING), [result, value, extracted]); // memoised

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value);
    compute(e.target.value);
  }
  // The field set from the date picker or the version list, exactly as typing the same text would set it.
  const fill = (text: string) => {
    // The field shows it.
    setValue(text);
    // The page answers.
    compute(text);
  };
  // The list's selection: the row whose version the field holds, if any.
  const pickedVersion = VERSION_CHOICES.some((c) => c.value === value.trim()) ? value.trim() : "";

  return (
    <div className="cidr-tool jwt-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="scd-input">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => { setValue(EXAMPLE); compute(EXAMPLE); }}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => { setValue(""); compute(""); }}>{t("clear")}</button>
          </div>
        </div>
        <input
          id="scd-input"
          type="text"
          className="cidr-input mono"
          value={value}
          onChange={onChange}
          placeholder={t("inputPlaceholder")}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-describedby="scd-privacy"
        />
        <p id="scd-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            ●
          </span>
          {t("runsLocally")}
        </p>
        {/* Without a keyboard: a date picker and the version list, each filling the field above as typing would. */}
        <div className="scd-pickers">
          <div className="scd-picker">
            {/* The date picker's name. */}
            <label className="cidr-label" htmlFor="scd-date">{t("pickDateLabel")}</label>
            <input
              id="scd-date"
              type="date"
              className="cidr-input mono"
              // The field's date, when it holds one.
              value={pickerDate(value)}
              // The years the engine accepts.
              min={DATE_MIN}
              max={DATE_MAX}
              // A picked date fills the field in yyyy-mm-dd; a cleared picker leaves the field as it is.
              onChange={(e) => { if (e.target.value) fill(e.target.value); }}
            />
          </div>
          <div className="scd-picker">
            {/* The version list's name. */}
            <label className="cidr-label" htmlFor="scd-version">{t("pickVersionLabel")}</label>
            <select
              id="scd-version"
              className="cidr-input mono"
              // The field's version, when it is one of the list's.
              value={pickedVersion}
              // A chosen row fills the field with its version; the first entry leaves the field as it is.
              onChange={(e) => { if (e.target.value) fill(e.target.value); }}
            >
              {/* No row chosen. */}
              <option value="">{t("pickVersionNone")}</option>
              {/* Every K7727 row, newest first, by F5's label. */}
              {VERSION_CHOICES.map((c) => <option key={c.label} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>
        {/* Paste affordance: the same field also accepts a pasted
            /config/bigip.license or tmsh show sys license output. */}
        <p className="cidr-privacy" style={{ marginTop: "0.25rem" }}>
          {t("pasteHint")}
        </p>
      </div>

      {error && (
        <p className="cidr-error" role="alert">
          {error}
        </p>
      )}

      {/* VERSION mode: minimum service check date for the entered version. */}
      {result?.kind === "version" && (
        <div className="jwt-results">
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("version.heading")}</h4>
            <p className="jwt-claim-value">
              {t("version.forVersion", { label: result.matched.label })}
            </p>
            <div className="jwt-badges" style={{ marginTop: "0.5rem" }}>
              <span className="jwt-badge jwt-badge--ok mono">
                {result.minServiceCheckDateISO} {t("version.orLater")}
              </span>
            </div>
            <dl className="jwt-claims" style={{ marginTop: "0.75rem" }}>
              <div className="jwt-claim-row">
                <dt className="jwt-claim-label">{t("version.compactLabel")}</dt>
                <dd className="jwt-claim-value mono">
                  {result.minServiceCheckDateCompact}
                </dd>
              </div>
            </dl>
            {result.isMajorMinorRow && (
              <p className="cipher-note">
                {t("version.majorMinorNote", { label: result.matched.label })}
              </p>
            )}
            <p className="cipher-note">{t("version.consequence")}</p>
          </section>
        </div>
      )}

      {/* DATE mode: newest reachable version + the blocked branches. */}
      {result?.kind === "date" && (
        <div className="jwt-results">
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("date.heading")}</h4>
            {/* Echo the exact matched span so the user can confirm the right
                line was picked out of their paste. */}
            {result.extractedFrom && (
              <p className="cipher-note">
                {t("date.extractedFrom")}{" "}
                <code className="mono">{result.extractedFrom.matchedText}</code>
              </p>
            )}
            {result.newestReachable ? (
              <>
                <p className="jwt-claim-value">{t("date.newestReachable")}</p>
                <div className="jwt-badges" style={{ marginTop: "0.5rem" }}>
                  <span className="jwt-badge jwt-badge--ok mono">
                    {result.newestReachable.label}
                  </span>
                </div>
                <p className="cipher-note">
                  {t("date.withinNote", { label: result.newestReachable.label })}
                </p>
              </>
            ) : (
              <p className="cipher-note">{t("date.none")}</p>
            )}

            {result.blocked.length > 0 ? (
              <>
                <h4 className="jwt-panel-title" style={{ marginTop: "1rem" }}>
                  {t("date.blockedHeading")}
                </h4>
                <dl className="jwt-claims">
                  {/* nearest-blocked (lowest version) first = natural "next step" order */}
                  {result.blocked
                    .slice()
                    .reverse()
                    .map((e) => (
                      <div className="jwt-claim-row" key={e.label}>
                        <dt className="jwt-claim-label mono">{e.label}</dt>
                        <dd className="jwt-claim-value">
                          {t("date.needsDate", { date: e.dateISO })}
                        </dd>
                      </div>
                    ))}
                </dl>
                <p className="cipher-note">{t("date.blockedHint")}</p>
              </>
            ) : result.newestReachable ? (
              <p className="cipher-note">{t("date.allReachable")}</p>
            ) : null}
          </section>
        </div>
      )}

      {/* Share results: under the answer, at the start of its own row. */}
      {result && (
        <div className="rdap-ask-row">
          <ShareResultsButton encoding={share} carries={t("share.carries", { licence: extracted ? "yes" : "no" })} title={t("name")} />
        </div>
      )}

      {result && (
        <p className="cidr-privacy" style={{ marginTop: "1rem" }}>
          {t("verifyNote")}
        </p>
      )}
    </div>
  );
}
