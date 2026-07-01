"use client";

// ============================================================================
// src/components/NslookupOutputExplainerTool.tsx
// ----------------------------------------------------------------------------
// Paste nslookup output, get a decoded, explained breakdown. The parse is pure
// and local (compute.ts); this component only renders it. Reuses the dig tool's
// CSS classes. Reference meanings are shown in pt-BR for pt-BR users, English
// otherwise, following the audience's convention.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  parseNslookup,
  NS_TYPE_MEANINGS,
  NS_TYPE_MEANINGS_PT,
  FIELD_LABELS_PT,
  type NslookupRecord,
} from "@/lib/tools/nslookup-output-explainer";

const EXAMPLE = `Server:		1.1.1.1
Address:	1.1.1.1#53

Non-authoritative answer:
Name:	example.com
Address: 93.184.216.34
Name:	example.com
Address: 2606:2800:220:1:248:1893:25c8:1946`;

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="dig-row">
      <span className="dig-row-label">{label}</span>
      <span className={mono ? "dig-row-value dig-mono" : "dig-row-value"}>{value}</span>
    </div>
  );
}

function RecordCard({ rec, typeMeanings, fieldLabel }: { rec: NslookupRecord; typeMeanings: Record<string, string>; fieldLabel: (label: string) => string }) {
  const meaning = typeMeanings[rec.type];
  return (
    <div className="dig-record">
      <div className="dig-record-head">
        <span className="dig-type-badge">{rec.type}</span>
        <span className="dig-mono dig-record-name">{rec.name}</span>
      </div>
      {!rec.fields && rec.value && <div className="dig-mono dig-rdata">{rec.value}</div>}
      {rec.fields && (
        <div className="dig-rdata-fields">
          {rec.fields.map((f, i) => (
            <Row key={i} label={fieldLabel(f.label)} value={f.value} mono />
          ))}
        </div>
      )}
      {meaning && <p className="dig-meaning">{meaning}</p>}
    </div>
  );
}

export default function NslookupOutputExplainerTool() {
  const t = useTranslations("tools.nslookup-output-explainer");
  const locale = useLocale();
  const pt = locale === "pt-BR";
  // pt-BR meanings with per-key English fallback; protocol tokens stay English.
  const typeMeanings = pt ? { ...NS_TYPE_MEANINGS, ...NS_TYPE_MEANINGS_PT } : NS_TYPE_MEANINGS;
  const fieldLabel = (label: string) => (pt ? FIELD_LABELS_PT[label] ?? label : label);

  const [input, setInput] = useState("");
  const parsed = useMemo(() => parseNslookup(input), [input]);
  const showResults = input.trim().length > 0 && parsed.recognized;
  const showNot = input.trim().length > 0 && !parsed.recognized;

  const authorityLabel =
    parsed.authority === "non-authoritative"
      ? t("authority.nonAuthoritative")
      : parsed.authority === "authoritative"
        ? t("authority.authoritative")
        : t("authority.unknown");

  return (
    <div className="cidr-tool jwt-tool dig-tool">
      {/* -- input -- */}
      <div className="dig-input-head">
        <label htmlFor="ns-in" className="cidr-label">{t("input.label")}</label>
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("input.example")}</button>
          <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("input.clear")}</button>
        </div>
      </div>
      <textarea
        id="ns-in"
        className="cidr-input dig-textarea"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={t("input.placeholder")}
        spellCheck={false}
        rows={10}
      />
      <p className="cidr-privacy"><span className="cidr-lock">&#128274;</span> {t("privacy")}</p>

      {showNot && <div className="dig-notdig">{t("notNslookup")}</div>}

      {showResults && (
        <div className="jwt-results dig-results">
          {/* -- warnings -- */}
          {parsed.warnings.length > 0 && (
            <div className="jwt-panel dig-warnings">
              <div className="jwt-panel-title">{t("warnings.title")}</div>
              <ul className="dig-warning-list">
                {parsed.warnings.map((w) => (
                  <li key={w}><span className="dig-warn-mark">&#9650;</span> {t(`warnings.${w}`)}</li>
                ))}
              </ul>
            </div>
          )}

          {/* -- errors -- */}
          {parsed.errors.length > 0 && (
            <div className="jwt-panel">
              <div className="jwt-panel-title">{t("errors.title")}</div>
              {parsed.errors.map((e, i) => (
                <Row key={i} label={e.name || "\u2014"} value={e.code} mono />
              ))}
            </div>
          )}

          {/* -- resolver -- */}
          {parsed.server && (
            <div className="jwt-panel">
              <div className="jwt-panel-title">{t("server.title")}</div>
              <Row label={t("server.server")} value={parsed.server.server} mono />
              {parsed.server.address && <Row label={t("server.address")} value={parsed.server.address} mono />}
              <p className="dig-meaning">{t("server.help")}</p>
            </div>
          )}

          {/* -- authority -- */}
          {(parsed.records.length > 0 || parsed.authority !== "unknown") && (
            <div className="jwt-panel">
              <div className="jwt-panel-title">{t("authority.title")}</div>
              <Row label={t("authority.title")} value={authorityLabel} />
              {parsed.authority === "non-authoritative" && <p className="dig-meaning">{t("authority.nonAuthHelp")}</p>}
              {parsed.referralNote && <p className="dig-meaning">{t("referral.note")}</p>}
            </div>
          )}

          {/* -- records -- */}
          {parsed.records.length > 0 && (
            <div className="jwt-panel">
              <div className="jwt-panel-title">{t("records.title")} <span className="dig-sec-count">({parsed.records.length})</span></div>
              {parsed.records.map((rec, i) => (
                <RecordCard key={i} rec={rec} typeMeanings={typeMeanings} fieldLabel={fieldLabel} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
