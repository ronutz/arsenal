"use client";

// ============================================================================
// src/components/DigOutputExplainerTool.tsx
// ----------------------------------------------------------------------------
// Paste `dig` output, get a decoded, explained breakdown. The parse is pure
// and local (compute.ts); this component only renders it. UI chrome is
// localized via next-intl; the DNS reference meanings come from the engine's
// reference tables.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  parseDig,
  breakdownRdata,
  RCODE_MEANINGS,
  OPCODE_MEANINGS,
  FLAG_MEANINGS,
  RRTYPE_MEANINGS,
  RCODE_MEANINGS_PT,
  OPCODE_MEANINGS_PT,
  FLAG_MEANINGS_PT,
  RRTYPE_MEANINGS_PT,
  FIELD_LABELS_PT,
  type DigFlag,
  type DigRecord,
  type DigSection,
} from "@/lib/tools/dig-output-explainer";

const EXAMPLE = `; <<>> DiG 9.18.1 <<>> example.com A +dnssec
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 4321
;; flags: qr rd ra ad; QUERY: 1, ANSWER: 2, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags: do; udp: 1232
;; QUESTION SECTION:
;example.com.			IN	A

;; ANSWER SECTION:
example.com.		3600	IN	A	93.184.216.34
example.com.		3600	IN	RRSIG	A 13 2 3600 20260701000000 20260629000000 34505 example.com. abcDEF123==

;; Query time: 12 msec
;; SERVER: 1.1.1.1#53(1.1.1.1) (UDP)
;; WHEN: Mon Jun 30 12:00:00 UTC 2026
;; MSG SIZE  rcvd: 120`;

/** A small label/value row used throughout the panels. */
function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="dig-row">
      <span className="dig-row-label">{label}</span>
      <span className={mono ? "dig-row-value dig-mono" : "dig-row-value"}>{value}</span>
    </div>
  );
}

function RecordCard({ rec, rrtypeMeanings, fieldLabel }: { rec: DigRecord; rrtypeMeanings: Record<string, string>; fieldLabel: (label: string) => string }) {
  const meaning = rrtypeMeanings[rec.type];
  const fields = rec.isQuestion ? null : breakdownRdata(rec.type, rec.rdata);
  return (
    <div className="dig-record">
      <div className="dig-record-head">
        <span className="dig-type-badge">{rec.type}</span>
        <span className="dig-mono dig-record-name">{rec.name}</span>
        {rec.ttl !== null && <span className="dig-ttl">TTL {rec.ttl}s</span>}
        <span className="dig-class">{rec.class}</span>
      </div>
      {!rec.isQuestion && rec.rdata && !fields && (
        <div className="dig-mono dig-rdata">{rec.rdata}</div>
      )}
      {fields && (
        <div className="dig-rdata-fields">
          {fields.map((f, i) => (
            <Row key={i} label={fieldLabel(f.label)} value={f.value} mono />
          ))}
        </div>
      )}
      {meaning && <p className="dig-meaning">{meaning}</p>}
    </div>
  );
}

export default function DigOutputExplainerTool() {
  const t = useTranslations("tools.dig-output-explainer");
  const locale = useLocale();
  const pt = locale === "pt-BR";
  // In pt-BR, prefer the Portuguese meaning maps and fall back to English per
  // key for anything not translated. The protocol tokens themselves (NOERROR,
  // A, qr, ...) always stay in English, per the audience's convention.
  const rcodeMeanings = pt ? { ...RCODE_MEANINGS, ...RCODE_MEANINGS_PT } : RCODE_MEANINGS;
  const opcodeMeanings = pt ? { ...OPCODE_MEANINGS, ...OPCODE_MEANINGS_PT } : OPCODE_MEANINGS;
  const flagMeanings = pt ? { ...FLAG_MEANINGS, ...FLAG_MEANINGS_PT } : FLAG_MEANINGS;
  const rrtypeMeanings = pt ? { ...RRTYPE_MEANINGS, ...RRTYPE_MEANINGS_PT } : RRTYPE_MEANINGS;
  const fieldLabel = (label: string) => (pt ? FIELD_LABELS_PT[label] ?? label : label);
  const [input, setInput] = useState("");
  const parsed = useMemo(() => parseDig(input), [input]);
  const showResults = input.trim().length > 0 && parsed.hadHeader;
  const showNotDig = input.trim().length > 0 && !parsed.hadHeader;

  const sectionTitle = (name: DigSection["name"]) =>
    ({
      QUESTION: t("section.question"),
      ANSWER: t("section.answer"),
      AUTHORITY: t("section.authority"),
      ADDITIONAL: t("section.additional"),
    })[name];

  return (
    <div className="cidr-tool jwt-tool dig-tool">
      {/* -- input -- */}
      <div className="dig-input-head">
        <label htmlFor="dig-in" className="cidr-label">{t("input.label")}</label>
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("input.example")}</button>
          <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("input.clear")}</button>
        </div>
      </div>
      <textarea
        id="dig-in"
        className="cidr-input dig-textarea"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={t("input.placeholder")}
        spellCheck={false}
        rows={12}
      />
      <p className="cidr-privacy"><span className="cidr-lock">&#128274;</span> {t("privacy")}</p>

      {showNotDig && <div className="dig-notdig">{t("notDig")}</div>}

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

          {/* -- header -- */}
          {parsed.header && (
            <div className="jwt-panel">
              <div className="jwt-panel-title">{t("header.title")}</div>
              <Row label={t("header.opcode")} value={parsed.header.opcode} mono />
              {opcodeMeanings[parsed.header.opcode] && <p className="dig-meaning">{opcodeMeanings[parsed.header.opcode]}</p>}
              <Row label={t("header.status")} value={parsed.header.status} mono />
              {rcodeMeanings[parsed.header.status] && <p className="dig-meaning">{rcodeMeanings[parsed.header.status]}</p>}
              <Row label={t("header.id")} value={parsed.header.id} mono />
              {parsed.digVersion && <Row label={t("header.version")} value={parsed.digVersion} mono />}
              {parsed.queryArgs && <Row label={t("header.query")} value={parsed.queryArgs} mono />}
            </div>
          )}

          {/* -- flags -- */}
          {parsed.flags && (
            <div className="jwt-panel">
              <div className="jwt-panel-title">{t("flags.title")}</div>
              <div className="dig-flag-chips">
                {parsed.flags.flags.map((fl: DigFlag) => (
                  <span key={fl} className="dig-flag-chip" title={flagMeanings[fl]}>{fl}</span>
                ))}
              </div>
              {parsed.flags.flags.map((fl: DigFlag) => (
                <p key={fl} className="dig-meaning"><strong className="dig-mono">{fl}</strong> &mdash; {flagMeanings[fl]}</p>
              ))}
              <div className="dig-counts">
                <Row label={t("flags.question")} value={String(parsed.flags.counts.question)} />
                <Row label={t("flags.answer")} value={String(parsed.flags.counts.answer)} />
                <Row label={t("flags.authority")} value={String(parsed.flags.counts.authority)} />
                <Row label={t("flags.additional")} value={String(parsed.flags.counts.additional)} />
              </div>
            </div>
          )}

          {/* -- EDNS OPT -- */}
          {parsed.opt && (
            <div className="jwt-panel">
              <div className="jwt-panel-title">{t("opt.title")}</div>
              <Row label={t("opt.version")} value={parsed.opt.version || "0"} mono />
              <Row label={t("opt.flags")} value={parsed.opt.flags || "\u2014"} mono />
              {parsed.opt.udp !== null && <Row label={t("opt.udp")} value={`${parsed.opt.udp} bytes`} mono />}
              {parsed.opt.extra.map((x, i) => <Row key={i} label="OPT" value={x} mono />)}
              <p className="dig-meaning">{t("opt.help")}</p>
            </div>
          )}

          {/* -- sections -- */}
          {parsed.sections.map((sec, i) => (
            <div className="jwt-panel" key={`${sec.name}-${i}`}>
              <div className="jwt-panel-title">{sectionTitle(sec.name)} <span className="dig-sec-count">({sec.records.length})</span></div>
              {sec.records.length === 0 && <p className="dig-meaning">{t("section.empty")}</p>}
              {sec.records.map((rec, j) => (
                <RecordCard key={j} rec={rec} rrtypeMeanings={rrtypeMeanings} fieldLabel={fieldLabel} />
              ))}
            </div>
          ))}

          {/* -- footer / stats -- */}
          {(parsed.footer.queryTime || parsed.footer.server || parsed.footer.when || parsed.footer.msgSize) && (
            <div className="jwt-panel">
              <div className="jwt-panel-title">{t("footer.title")}</div>
              {parsed.footer.queryTime && <Row label={t("footer.queryTime")} value={parsed.footer.queryTime} mono />}
              {parsed.footer.server && <Row label={t("footer.server")} value={parsed.footer.server} mono />}
              {parsed.footer.when && <Row label={t("footer.when")} value={parsed.footer.when} mono />}
              {parsed.footer.msgSize && <Row label={t("footer.msgSize")} value={`${parsed.footer.msgSize} bytes`} mono />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
