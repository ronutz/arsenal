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
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { analyzeEpoch, EpochInputError, type EpochAnalysis } from "@/lib/tools/epoch";

type Result = { ok: true; data: EpochAnalysis } | { ok: false; code: string };

const FORMAT_ROWS: { key: keyof EpochAnalysis["formats"]; label: string }[] = [
  { key: "iso8601", label: "ISO 8601" },
  { key: "rfc3339", label: "RFC 3339" },
  { key: "httpDate", label: "HTTP date" },
  { key: "unixSeconds", label: "Unix — seconds" },
  { key: "unixMillis", label: "Unix — milliseconds" },
  { key: "unixMicros", label: "Unix — microseconds" },
  { key: "unixNanos", label: "Unix — nanoseconds" },
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
  const locale = useLocale();
  const [input, setInput] = useState("");
  // Captured once on mount; never ticks. A client-only convenience.
  const [nowMs] = useState(() => Date.now());

  const result: Result | null = useMemo(() => {
    const s = input.trim();
    if (!s) return null;
    try {
      return { ok: true, data: analyzeEpoch(s) };
    } catch (e) {
      return { ok: false, code: e instanceof EpochInputError ? e.code : "invalid" };
    }
  }, [input]);

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
          <input
            id="epoch-input"
            className="cidr-input mono saml-textarea json-input epoch-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("inputPlaceholder")}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-describedby="epoch-privacy"
          />
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
                  <dt className="epoch-format-lab">{row.label}</dt>
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
