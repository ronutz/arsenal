"use client";

// ============================================================================
// FortiOS debug flow builder - the UI.
//
// A builder rather than a decoder, so the D-83 affordance is Example/Clear over
// the whole FORM rather than a single text box. The generated commands are the
// output, with a copy button, because the point of the tool is to paste them.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  buildFlowDebug,
  planToText,
  FlowDebugError,
  type FlowDebugPlan,
} from "@/lib/tools/fortios-flow-debug-builder";

const EMPTY = { addr: "", saddr: "", daddr: "", port: "", sport: "", dport: "", proto: "", vdom: "", count: "100" };
const EXAMPLE = { ...EMPTY, addr: "10.1.1.5", dport: "443", proto: "tcp", count: "50" };

export default function FortiosFlowDebugBuilderTool() {
  const t = useTranslations("tools.fortios-flow-debug-builder");
  const [f, setF] = useState(EMPTY);
  const [iprope, setIprope] = useState(false);
  const [timestamp, setTimestamp] = useState(false);
  const [copied, setCopied] = useState(false);

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  const result = useMemo<{ ok: true; plan: FlowDebugPlan } | { ok: false; message: string } | null>(() => {
    const any = Object.entries(f).some(([k, v]) => k !== "count" && k !== "vdom" && v.trim());
    if (!any) return null;
    try {
      return {
        ok: true,
        plan: buildFlowDebug({
          addr: f.addr.trim() || undefined, saddr: f.saddr.trim() || undefined, daddr: f.daddr.trim() || undefined,
          port: f.port.trim() || undefined, sport: f.sport.trim() || undefined, dport: f.dport.trim() || undefined,
          proto: f.proto.trim() || undefined, vdom: f.vdom.trim() || undefined,
          count: Number(f.count) || undefined, iprope, timestamp,
        }),
      };
    } catch (e) {
      if (e instanceof FlowDebugError) return { ok: false, message: e.message };
      return { ok: false, message: (e as Error).message };
    }
  }, [f, iprope, timestamp]);

  const text = result?.ok ? planToText(result.plan) : "";

  return (
    <div className="tool-panel">
      <div className="dig-input-head">
        <label className="cidr-label">{t("formLabel")}</label>
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={() => setF(EXAMPLE)}>{t("example")}</button>
          <button type="button" className="b64-copy" onClick={() => { setF(EMPTY); setIprope(false); setTimestamp(false); }}>{t("clear")}</button>
        </div>
      </div>

      <div className="dig-kv">
        {(["addr", "saddr", "daddr", "port", "sport", "dport", "proto", "vdom", "count"] as const).map((k) => (
          <div key={k}>
            <label htmlFor={`ffd-${k}`} className="cidr-label">{t(`fields.${k}`)}</label>
            <input id={`ffd-${k}`} className="cidr-input mono" value={f[k]} onChange={set(k)} spellCheck={false} />
          </div>
        ))}
      </div>

      <div className="dig-input-actions">
        <label><input type="checkbox" checked={iprope} onChange={(e) => setIprope(e.target.checked)} /> {t("fields.iprope")}</label>
        <label><input type="checkbox" checked={timestamp} onChange={(e) => setTimestamp(e.target.checked)} /> {t("fields.timestamp")}</label>
      </div>

      {result && !result.ok && <p className="cidr-error">{result.message}</p>}

      {result && result.ok && (
        <div className="dig-result">
          <section className="dig-section">
            <div className="dig-input-head">
              <h3 className="dig-section-title">{t("output.title")}</h3>
              <button type="button" className="b64-copy" onClick={() => { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
                {copied ? t("output.copied") : t("output.copy")}
              </button>
            </div>
            <pre className="cidr-input mono json-input">{text}</pre>
          </section>

          <section className="dig-section">
            <h3 className="dig-section-title">{t("output.lineByLine")}</h3>
            <ol className="dig-records">
              {[...result.plan.reset, ...result.plan.setup, ...result.plan.cleanup].map((l, i) => (
                <li key={`${l.cmd}-${i}`} className="dig-record">
                  <code className="mono">{l.cmd}</code>
                  <p className="dig-record-explain">{l.why}</p>
                </li>
              ))}
            </ol>
          </section>

          {result.plan.notes.length > 0 && (
            <section className="dig-section">
              <h3 className="dig-section-title">{t("notes.title")}</h3>
              <ul className="dig-notes">{result.plan.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
            </section>
          )}
          {result.plan.warnings.length > 0 && (
            <section className="dig-section">
              <h3 className="dig-section-title">{t("warnings.title")}</h3>
              <ul className="dig-notes">{result.plan.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
