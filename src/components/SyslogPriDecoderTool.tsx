"use client";

// ============================================================================
// src/components/SyslogPriDecoderTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE SYSLOG PRI DECODER AND ENCODER.
//
// Decode mode: type a PRI (134 or <134>) and get its facility and severity, with
// the formula and a note when the facility band is implementation-varying.
// Encode mode: pick a facility and a severity and get the PRI and its wire form.
// Everything runs in the browser.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { decodePri, encodePri, FACILITIES, SEVERITIES } from "@/lib/tools/syslog-pri-decoder";
import { usePrefill } from "@/lib/use-prefill";

type Mode = "decode" | "encode";

// D-83 Example samples — verbatim from this tool's golden vectors.
const EXAMPLE = "<34>";

export default function SyslogPriDecoderTool() {
  const t = useTranslations("tools.syslog-pri-decoder");
  const [mode, setMode] = useState<Mode>("decode");

  const [input, setInput] = useState("");
  const [facility, setFacility] = useState(16);
  const [severity, setSeverity] = useState(6);

  const decoded = useMemo(() => (input.trim() ? decodePri(input) : null), [input]);
  const encoded = useMemo(() => encodePri(facility, severity), [facility, severity]);

  usePrefill(setInput);

  return (
    <div className="cidr-tool jwt-tool saml-tool json-tool syslogpri-tool">
      <div className="bigip-mode" role="tablist" aria-label={t("modeLabel")}>
        <button type="button" role="tab" aria-selected={mode === "decode"} className={`bigip-mode-btn${mode === "decode" ? " is-active" : ""}`} onClick={() => setMode("decode")}>
          {t("modeDecode")}
        </button>
        <button type="button" role="tab" aria-selected={mode === "encode"} className={`bigip-mode-btn${mode === "encode" ? " is-active" : ""}`} onClick={() => setMode("encode")}>
          {t("modeEncode")}
        </button>
      </div>

      <p className="syslogpri-formula mono">{t("formula")}</p>

      {mode === "decode" ? (
        <>
          <div className="cidr-input-row">
            <div className="dig-input-head">
              <label className="cidr-label" htmlFor="syslogpri-input">
                {t("decodeInputLabel")}
              </label>
              <div className="dig-input-actions">
                <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
                <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
              </div>
            </div>
            <input
              id="syslogpri-input"
              className="cidr-input mono"
              type="text"
              inputMode="numeric"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("decodeInputPlaceholder")}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-describedby="syslogpri-privacy"
            />
            <p id="syslogpri-privacy" className="cidr-privacy">
              <span className="cidr-lock" aria-hidden="true">
                ●
              </span>
              {t("runsLocally")}
            </p>
          </div>

          {decoded && !decoded.ok && decoded.error && (
            <div className="json-error-box" role="alert">
              <p className="json-error-message">{decoded.error.message}</p>
            </div>
          )}

          {decoded && decoded.ok && decoded.facility && decoded.severity && (
            <div className="syslogpri-result">
              <div className="syslogpri-privals">
                <div className="syslogpri-prival">
                  <span className="syslogpri-prival-label">{t("priLabel")}</span>
                  <span className="syslogpri-prival-value mono">{decoded.pri}</span>
                </div>
                <div className="syslogpri-prival">
                  <span className="syslogpri-prival-label">{t("wireLabel")}</span>
                  <span className="syslogpri-prival-value mono">{decoded.wire}</span>
                </div>
              </div>

              <div className="syslogpri-parts">
                <div className="syslogpri-part">
                  <span className="syslogpri-part-head">{t("facilityHeading")}</span>
                  <span className="syslogpri-part-code mono">
                    {decoded.facility.code} · {decoded.facility.keyword}
                  </span>
                  <span className="syslogpri-part-desc">{decoded.facility.description}</span>
                  {decoded.facility.commonUse && <span className="syslogpri-common">{decoded.facility.commonUse}</span>}
                </div>
                <div className="syslogpri-part">
                  <span className="syslogpri-part-head">{t("severityHeading")}</span>
                  <span className="syslogpri-part-code mono">
                    {decoded.severity.code} · {decoded.severity.keyword}
                  </span>
                  <span className="syslogpri-part-desc">
                    {decoded.severity.label}: {decoded.severity.meaning}
                  </span>
                </div>
              </div>

              {decoded.facilityNote && <p className="syslogpri-vary">{t("facilityVaries")}</p>}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="syslogpri-selects">
            <div className="syslogpri-select-row">
              <label className="cidr-label" htmlFor="syslogpri-facility">
                {t("encodeFacilityLabel")}
              </label>
              <select id="syslogpri-facility" className="cidr-input" value={facility} onChange={(e) => setFacility(parseInt(e.target.value, 10))}>
                {FACILITIES.map((f) => (
                  <option key={f.code} value={f.code}>
                    {f.code} · {f.keyword} ({f.description})
                  </option>
                ))}
              </select>
            </div>
            <div className="syslogpri-select-row">
              <label className="cidr-label" htmlFor="syslogpri-severity">
                {t("encodeSeverityLabel")}
              </label>
              <select id="syslogpri-severity" className="cidr-input" value={severity} onChange={(e) => setSeverity(parseInt(e.target.value, 10))}>
                {SEVERITIES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.code} · {s.keyword} ({s.label})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {encoded.ok && (
            <div className="syslogpri-result">
              <p className="syslogpri-encmath mono">
                {facility} × 8 + {severity} = {encoded.pri}
              </p>
              <div className="syslogpri-privals">
                <div className="syslogpri-prival">
                  <span className="syslogpri-prival-label">{t("priLabel")}</span>
                  <span className="syslogpri-prival-value mono">{encoded.pri}</span>
                </div>
                <div className="syslogpri-prival">
                  <span className="syslogpri-prival-label">{t("wireLabel")}</span>
                  <span className="syslogpri-prival-value mono">{encoded.wire}</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* PRI decomposition (always shown; educational; theme-aware SVG). A single
          PRI integer splits into facility (÷ 8, the quotient) and severity
          (mod 8, the remainder). The example uses PRI 134. Box headings reuse the
          tool's own localized labels; the numbers and operators are verbatim. */}
      <section className="jwt-panel syslogpri-split-panel">
        <h4 className="jwt-panel-title">{t("struct.heading")}</h4>
        <svg
          className="syslogpri-split-svg"
          viewBox="0 0 680 172"
          role="img"
          aria-label={t("struct.heading")}
        >
          {/* Branch lines: PRI down, then out to the two fields */}
          <line x1={340} y1={62} x2={340} y2={84} stroke="var(--border-strong)" strokeWidth={1.5} />
          <line x1={340} y1={84} x2={215} y2={116} stroke="var(--border-strong)" strokeWidth={1.5} />
          <line x1={340} y1={84} x2={465} y2={116} stroke="var(--border-strong)" strokeWidth={1.5} />
          {/* The operation on each branch */}
          <text x={250} y={104} textAnchor="middle" className="syslogpri-split-op">÷ 8</text>
          <text x={430} y={104} textAnchor="middle" className="syslogpri-split-op">mod 8</text>
          {/* PRI — the composite value */}
          <rect x={285} y={16} width={110} height={46} rx={6} fill="var(--accent-amber)" fillOpacity={0.12} stroke="var(--accent-amber)" strokeWidth={1.5} />
          <text x={340} y={33} textAnchor="middle" className="syslogpri-split-head">{t("priLabel")}</text>
          <text x={340} y={52} textAnchor="middle" className="syslogpri-split-val">134</text>
          {/* Facility — the quotient */}
          <rect x={110} y={116} width={210} height={48} rx={6} fill="var(--accent-primary)" fillOpacity={0.12} stroke="var(--accent-primary)" strokeWidth={1.5} />
          <text x={215} y={134} textAnchor="middle" className="syslogpri-split-head">{t("facilityHeading")}</text>
          <text x={215} y={155} textAnchor="middle" className="syslogpri-split-val">16</text>
          {/* Severity — the remainder */}
          <rect x={360} y={116} width={210} height={48} rx={6} fill="var(--accent-green)" fillOpacity={0.12} stroke="var(--accent-green)" strokeWidth={1.5} />
          <text x={465} y={134} textAnchor="middle" className="syslogpri-split-head">{t("severityHeading")}</text>
          <text x={465} y={155} textAnchor="middle" className="syslogpri-split-val">6</text>
        </svg>
        <p className="syslogpri-split-note">{t("struct.note")}</p>
      </section>
    </div>
  );
}
