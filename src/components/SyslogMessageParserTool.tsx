"use client";

// ============================================================================
// src/components/SyslogMessageParserTool.tsx
// ----------------------------------------------------------------------------
// THE SYSLOG MESSAGE PARSER (page UI). One syslog message or TCP frame in;
// out comes the grammar that matched (RFC 5424 or the BSD form of RFC 3164),
// the framing if any, the PRI opened into facility and severity, every field
// named in its RFC's order with what is non-compliant said in the RFC's
// words, the structured data opened element by element, and the transport
// notes (UDP 514, TCP framing, TLS 6514).
//
// All answers come from src/lib/tools/syslog-message-parser (pure parsing);
// this component only lays them out and words them.
// ============================================================================

import { Fragment, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { run, VECTORS, type SyslogDecodeResult, type Field } from "@/lib/tools/syslog-message-parser";
import { TclPresets } from "@/components/TclTeachParts";

// D-83: the Example button loads a golden vector verbatim.
const EXAMPLE_ID = "rfc5424-example-3";

// The vectors offered as presets.
const PRESET_IDS = ["rfc5424-example-1", "rfc5424-example-2", "rfc5424-example-3", "rfc5424-example-4", "iana-sd", "bsd-rfc3164", "bsd-space-padded-day", "octet-counting", "non-transparent", "timestamp-findings", "sd-problems", "field-lengths", "pri-then-text"];

/** The page component. */
export default function SyslogMessageParserTool() {
  // This tool's words.
  const t = useTranslations("tools.syslog-message-parser");
  // The message.
  const [text, setText] = useState(VECTORS.find((v) => v.id === EXAMPLE_ID)!.input.text);
  // The preset currently loaded.
  const [active, setActive] = useState<string | undefined>(EXAMPLE_ID);
  // The reading.
  const r = useMemo((): SyslogDecodeResult | null => (text.trim() === "" ? null : run({ text })), [text]);
  // Load a preset.
  const pick = (id: string) => {
    // The vector.
    const v = VECTORS.find((x) => x.id === id);
    // Unknown ids do nothing.
    if (!v) return;
    // Its text.
    setText(v.input.text);
    // Mark it.
    setActive(id);
  };
  // The verdict tone: any finding anywhere is a warning, no PRI is bad, nothing is good.
  const findingsCount = (res: SyslogDecodeResult) => res.findings.length + res.framing.findings.length + res.fields.reduce((n, f) => n + f.findings.length, 0) + res.structuredData.reduce((n, e) => n + e.findings.length, 0);
  // A field's value as shown: the NILVALUE named, a BOM named, text otherwise.
  const shown = (f: Field) => (f.nil ? <span className="tcl-pill tcl-pill-muted">{t("nil")}</span> : f.value === null ? <span className="tcl-muted">{t("absent")}</span> : <code>{f.value}</code>);
  // Draw.
  return (
    <div className="cidr-tool jwt-tool tcl-tool">
      {/* The message, with the Example / Clear buttons (D-83). */}
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="smp-src">{t("inputLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => pick(EXAMPLE_ID)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => { setText(""); setActive(undefined); }}>{t("clear")}</button>
          </div>
        </div>
        <textarea id="smp-src" className="cidr-input mono json-input" rows={4} value={text} onChange={(e) => { setText(e.target.value); setActive(undefined); }} placeholder={t("placeholder")} spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="off" />
      </div>
      <TclPresets items={PRESET_IDS.map((id) => ({ id, label: t(`preset.${id}`) }))} label={t("presetsLabel")} onPick={pick} active={active} />

      {/* The reading. */}
      {r && (
        <div className="jwt-results" aria-live="polite">
          {/* The verdict: the grammar, the framing, the count of findings. */}
          <div className={r.grammar === "unknown" ? "tcl-verdict tcl-verdict-bad" : findingsCount(r) > 0 ? "tcl-verdict tcl-verdict-warn" : "tcl-verdict tcl-verdict-ok"}>
            <p>
              <span className="tcl-verdict-label">{t(`grammar.${r.grammar}`)}</span>{" "}
              {r.framing.kind !== "none" && t(`framing.${r.framing.kind}`, { declared: r.framing.declared ?? 0, actual: r.framing.actual ?? 0 })}{" "}
              {t("lengthLine", { octets: r.length.octets, chars: r.length.chars })}{" "}
              {findingsCount(r) === 0 ? t("noFindings") : t("findingsCount", { n: findingsCount(r) })}
              {r.truncated && <> {t("truncated")}</>}
            </p>
          </div>

          {/* The PRI, opened. */}
          {r.pri && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("priTitle")}</h4>
              <div className="tcl-pairs">
                <span className="tcl-pairs-name">PRI</span><span className="tcl-pairs-value"><code>&lt;{r.pri.value}&gt;</code> = {r.pri.facility.code} × 8 + {r.pri.severity.code}</span>
                <span className="tcl-pairs-name">{t("facility")}</span><span className="tcl-pairs-value">{r.pri.facility.code} <code>{r.pri.facility.keyword}</code> <span className="tcl-muted">{r.pri.facility.description}</span></span>
                <span className="tcl-pairs-name">{t("severity")}</span><span className="tcl-pairs-value">{r.pri.severity.code} <code>{r.pri.severity.keyword}</code> {r.pri.severity.label} <span className="tcl-muted">{r.pri.severity.meaning}</span></span>
              </div>
            </section>
          )}

          {/* The fields, in the RFC's order. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("fieldsTitle")}</h4>
            <div className="tcl-table-wrap">
              <table className="tcl-table">
                <thead><tr><th scope="col">{t("colField")}</th><th scope="col">{t("colValue")}</th><th scope="col">{t("colReading")}</th></tr></thead>
                <tbody>
                  {r.fields.map((f, i) => (
                    <tr key={`${f.name}-${i}`}>
                      <th scope="row"><code>{f.name}</code></th>
                      <td>{shown(f)}</td>
                      <td>
                        {/* The field's meaning in the grammar, then its findings in the RFC's words, then the decoded parts. */}
                        <span className="tcl-small">{t(`field.${r.grammar === "bsd" && (f.name === "TIMESTAMP" || f.name === "HOSTNAME") ? "bsd-" + f.name : f.name}`)}</span>
                        {f.findings.map((code) => <Fragment key={code}>{" "}<span className={`tcl-pill ${/leading-zero|too-long|not-printusascii|unclosed|malformed|duplicate|missing|out-of-range|not-1|leap|lowercase|fraction|no-space|no-header|short/.test(code) ? "tcl-pill-warn" : "tcl-pill-muted"}`} title={code}>{t(`finding.${code}`)}</span></Fragment>)}
                        {f.decoded && f.name === "TIMESTAMP" && r.grammar === "rfc5424" && <span className="tcl-small tcl-muted"> {t("timestampParts", { date: String(f.decoded.date), time: String(f.decoded.time), offset: String(f.decoded.offset) })}</span>}
                        {f.decoded && f.name === "TIMESTAMP" && r.grammar === "bsd" && <span className="tcl-small tcl-muted"> {t("bsdTimestampParts")}</span>}
                        {f.decoded && f.name === "MSG" && <span className="tcl-small tcl-muted"> {f.decoded.utf8Bom ? t("bomYes") : t("bomNo")}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* The structured data, element by element. */}
          {r.structuredData.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("sdTitle", { n: r.structuredData.length })}</h4>
              <ul className="tcl-pool-list">
                {r.structuredData.map((e, i) => (
                  <li key={`${e.id}-${i}`}>
                    <code>{e.id}</code> <span className={`tcl-pill ${e.registry === "non-compliant" ? "tcl-pill-warn" : "tcl-pill-value"}`}>{t(`registry.${e.registry}`)}</span>
                    {e.findings.map((code) => <Fragment key={code}>{" "}<span className="tcl-pill tcl-pill-warn" title={code}>{t(`finding.${code}`)}</span></Fragment>)}
                    {e.params.length > 0 && (
                      <div className="tcl-pairs">
                        {e.params.map((p, j) => (
                          <Fragment key={`${p.name}-${j}`}>
                            <span className="tcl-pairs-name"><code>{p.name}</code></span>
                            <span className="tcl-pairs-value"><code>&quot;{p.value}&quot;</code>{e.registry === "iana" && t.has(`sdParam.${e.id}.${p.name}`) ? <span className="tcl-muted tcl-small"> {t(`sdParam.${e.id}.${p.name}`)}</span> : null}</span>
                          </Fragment>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Message-level findings, the length against the limits, and the transports. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("notesTitle")}</h4>
            <ul className="tcl-pool-list">
              {r.findings.map((code) => <li key={code}><span className="tcl-pill tcl-pill-warn" title={code}>{t(`finding.${code}`)}</span></li>)}
              {r.framing.findings.map((code) => <li key={code}><span className="tcl-pill tcl-pill-warn" title={code}>{t(`finding.${code}`)}</span></li>)}
              <li>{t(r.grammar === "bsd" ? "limits.bsd" : "limits.rfc5424", { octets: r.length.octets })}</li>
              <li>{t("transports")}</li>
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
