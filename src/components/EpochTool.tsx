"use client";

// ============================================================================
// src/components/EpochTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE UNIX-TIME CONVERTER.
//
// Type a Unix timestamp (unit auto-detected) or an ISO-8601 date and get the
// instant in every common form. The conversion comes from the pure engine; two
// conveniences that genuinely need the wall clock — a "Now" button and a
// "relative to your device clock" line — live here in the client, clearly
// separated from the deterministic core. Everything runs in the browser.
//
// Share results (2026-11-01): a button under the headline builds a link that
// carries the box as typed (the relative line is the opener's, from their own
// clock). An arriving link (useShareArrival) fills the box as a paste would.
//
// Page language (02/11/2026): the reading comes from analyzeEpochLocalisable()
// and is turned into the page's language by inPageLanguage() (the notes and the
// weekday name); the format names come from the formatLabel.* messages. The
// English page reads exactly as before.
//
// No keyboard needed (03/11/2026): while the box holds a number, up and down
// arrows (StepperField, and Arrow Up and Down) step it by one in the unit it
// was read in (a second, a millisecond...); a date in the box disables them,
// since a step of "one" means nothing there. Now still fills the box.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { analyzeEpochLocalisable, EpochInputError, type EpochAnalysis } from "@/lib/tools/epoch/compute"; // the reading with sentence ids (02/11/2026)
import { engineTexts } from "@/lib/tools/engine-text"; // engine sentences in the page's language
import { inPageLanguage } from "@/lib/tools/engine-text-page"; // a whole reading in the page's language
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { EPOCH_SHARE, encodeEpochShare } from "@/lib/tools/epoch/share"; // this tool's share spec: the box as typed
import { StepperField, stepperKeyDown } from "@/components/NumberStepper"; // up and down arrows for a timestamp (03/11/2026)

type Result = { ok: true; data: EpochAnalysis } | { ok: false; code: string };

// Each label is the English the formatLabel.<key> message carries (02/11/2026); it is the fallback when a pack lacks it.
const FORMAT_ROWS: { key: keyof EpochAnalysis["formats"]; label: string }[] = [
  { key: "iso8601", label: "ISO 8601" },
  { key: "rfc3339", label: "RFC 3339" },
  { key: "httpDate", label: "HTTP date" },
  { key: "unixSeconds", label: "Unix - seconds" },
  { key: "unixMillis", label: "Unix - milliseconds" },
  { key: "unixMicros", label: "Unix - microseconds" },
  { key: "unixNanos", label: "Unix - nanoseconds" },
];

function relativeTime(targetMs: number, nowMs: number, locale: string): string {
  const diff = targetMs - nowMs;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000_000],
    ["month", 2_592_000_000],
    ["day", 86_400_000],
    ["hour", 3_600_000],
    ["minute", 60_000],
    ["second", 1000],
  ];
  for (const [unit, ms] of units) {
    if (Math.abs(diff) >= ms || unit === "second") {
      return rtf.format(Math.round(diff / ms), unit);
    }
  }
  return rtf.format(0, "second");
}

// D-83 Example samples — verbatim from this tool's golden vectors.
const EXAMPLE = "1000000000";

export default function EpochTool() {
  const t = useTranslations("tools.epoch");
  const tx = useMemo(() => engineTexts(t), [t]); // the engine's sentences in the page's language (02/11/2026)
  const locale = useLocale();
  const [input, setInput] = useState("");
  // Captured once on mount; never ticks. A client-only convenience.
  const [nowMs] = useState(() => Date.now());

  const result: Result | null = useMemo(() => {
    const s = input.trim();
    if (!s) return null;
    try {
      return { ok: true, data: inPageLanguage(analyzeEpochLocalisable(s), tx) }; // the reading, in the page's language
    } catch (e) {
      return { ok: false, code: e instanceof EpochInputError ? e.code : "invalid" };
    }
  }, [input, tx]);

  // An arriving share link: the value fills the box as a paste would, and the page converts it.
  useShareArrival(EPOCH_SHARE, (s) => setInput(s.input)); // as typed
  // What Share results carries: the box, once the page has a reading (memoised).
  const share = useMemo(() => encodeEpochShare({ input }, !!result?.ok), [input, result]); // the encoding

  // The arrows step a timestamp (a whole or decimal number, signed); a date or anything else leaves them disabled.
  const stepsAsNumber = input.trim() === "" || /^-?\d+(\.\d+)?$/.test(input.trim());

  const errMsg = (code: string): string => {
    const known = ["empty", "invalid", "tooLong", "outOfRange"];
    return known.includes(code) ? t(`err_${code}`) : t("err_invalid");
  };

  return (
    <div className="cidr-tool jwt-tool saml-tool json-tool tmsh-tool epoch-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="epoch-input">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
          </div>
        </div>
        <div className="epoch-input-wrap">
          {/* Up and down arrows: one unit a press while the box holds a number (no bounds: the engine checks the range). */}
          <StepperField value={input.trim()} onValue={setInput} label={t("inputLabel")} inputId="epoch-input" disabled={!stepsAsNumber} className="epoch-num">
            <input
              id="epoch-input"
              className="cidr-input mono saml-textarea json-input epoch-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              // Arrow Up and Down step a timestamp by one; in a date they keep their usual caret moves.
              onKeyDown={(e) => { if (stepsAsNumber) stepperKeyDown({ value: input.trim(), onValue: setInput })(e); }}
              placeholder={t("inputPlaceholder")}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-describedby="epoch-privacy"
            />
          </StepperField>
          <button
            type="button"
            className="epoch-now-btn"
            onClick={() => setInput(String(Math.floor(Date.now() / 1000)))}
          >
            {t("nowButton")}
          </button>
        </div>
        <p id="epoch-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            ●
          </span>
          {t("runsLocally")}
        </p>
        <p className="cipherstr-scope">{t("scopeNote")}</p>
      </div>

      {result && !result.ok && (
        <div className="json-error-box" role="alert">
          <p className="json-error-headline">{t("errorTitle")}</p>
          <p className="json-error-message">{errMsg(result.code)}</p>
        </div>
      )}

      {result && result.ok && (
        <div className="tmsh-results epoch-results">
          <section className="epoch-headline">
            <code className="epoch-iso mono">{result.data.formats.iso8601}</code>
            <p className="epoch-rel">
              {relativeTime(result.data.epochMillis, nowMs, locale)}
              <span className="epoch-rel-note"> · {t("relativeNote")}</span>
            </p>
          </section>

          {/* Share results: under the headline, at the start of its own row, before the breakdown. */}
          <div className="rdap-ask-row">
            <ShareResultsButton encoding={share} carries={t("share.carries")} title={t("name")} />
          </div>

          <section className="persist-section">
            <h3 className="persist-heading">{t("utcHeading")}</h3>
            <div className="epoch-utc-grid">
              <div className="epoch-utc-cell">
                <span className="epoch-utc-val mono">
                  {result.data.utc.year}-{String(result.data.utc.month).padStart(2, "0")}-
                  {String(result.data.utc.day).padStart(2, "0")}
                </span>
                <span className="epoch-utc-lab">{result.data.utc.weekday}</span>
              </div>
              <div className="epoch-utc-cell">
                <span className="epoch-utc-val mono">
                  {String(result.data.utc.hour).padStart(2, "0")}:
                  {String(result.data.utc.minute).padStart(2, "0")}:
                  {String(result.data.utc.second).padStart(2, "0")}
                  {result.data.utc.millisecond
                    ? "." + String(result.data.utc.millisecond).padStart(3, "0")
                    : ""}
                </span>
                <span className="epoch-utc-lab">UTC</span>
              </div>
              <div className="epoch-utc-cell">
                <span className="epoch-utc-val mono">{result.data.utc.dayOfYear}</span>
                <span className="epoch-utc-lab">{t("dayOfYearLabel")}</span>
              </div>
            </div>
          </section>

          <section className="persist-section">
            <h3 className="persist-heading">{t("formatsHeading")}</h3>
            <dl className="epoch-formats">
              {FORMAT_ROWS.map((row) => (
                <div key={row.key} className="epoch-format-row">
                  <dt className="epoch-format-lab">{t.has(`formatLabel.${row.key}`) ? t(`formatLabel.${row.key}`) : row.label}</dt>
                  <dd className="epoch-format-val mono">{result.data.formats[row.key]}</dd>
                </div>
              ))}
            </dl>
          </section>

          {result.data.notes.length > 0 && (
            <ul className="epoch-notes">
              {result.data.notes.map((n, i) => (
                <li key={i} className={`epoch-note epoch-note-${n.level}`}>
                  {n.text}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
