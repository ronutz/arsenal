"use client";

// ============================================================================
// FortiOS debug flow builder - the UI.
//
// A builder rather than a decoder, so the D-83 affordance is Example/Clear over
// the whole FORM rather than a single text box. The generated commands are the
// output, with a copy button, because the point of the tool is to paste them.
//
// Share results (2026-11-01): a button under the commands builds a link that
// carries every field of the form as typed, with a caution line; an arriving
// link replaces the whole form, and the page builds the commands.
//
// PAGE LANGUAGE (02/11/2026): the explanations, notes, warnings and errors
// arrive as EngineTexts from buildFlowDebugLocalisable(), and the pasteable
// text's headings are written by planToTextIn() in the page's language, all
// under engine.* in the pack; the commands are the same in every language.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what the button is handed
import { FORTIOS_FLOW_DEBUG_SHARE } from "@/lib/tools/fortios-flow-debug-builder/share"; // this tool's share spec
import {
  buildFlowDebugLocalisable,
  planToTextIn,
  type FlowDebugPlan,
} from "@/lib/tools/fortios-flow-debug-builder/compute"; // the plan with sentence ids (02/11/2026)
import { engineTexts, type EngineText } from "@/lib/tools/engine-text"; // engine sentences in the page's language

const EMPTY = { addr: "", saddr: "", daddr: "", port: "", sport: "", dport: "", proto: "", vdom: "", count: "100" };
const EXAMPLE = { ...EMPTY, addr: "10.1.1.5", dport: "443", proto: "tcp", count: "50" };
/** Nothing to share: a constant, so the button sees no change between renders. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // the disabled state

export default function FortiosFlowDebugBuilderTool() {
  const t = useTranslations("tools.fortios-flow-debug-builder");
  const tx = engineTexts(t); // the engine's sentences in the page's language
  const [f, setF] = useState(EMPTY);
  const [iprope, setIprope] = useState(false);
  const [timestamp, setTimestamp] = useState(false);
  const [copied, setCopied] = useState(false);

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  const result = useMemo<{ ok: true; plan: FlowDebugPlan<EngineText> } | { ok: false; error: unknown } | null>(() => {
    const any = Object.entries(f).some(([k, v]) => k !== "count" && k !== "vdom" && v.trim());
    if (!any) return null;
    try {
      return {
        ok: true,
        plan: buildFlowDebugLocalisable({ // the plan, sentences with ids
          addr: f.addr.trim() || undefined, saddr: f.saddr.trim() || undefined, daddr: f.daddr.trim() || undefined,
          port: f.port.trim() || undefined, sport: f.sport.trim() || undefined, dport: f.dport.trim() || undefined,
          proto: f.proto.trim() || undefined, vdom: f.vdom.trim() || undefined,
          count: Number(f.count) || undefined, iprope, timestamp,
        }),
      };
    } catch (e) {
      return { ok: false, error: e }; // shown through tx.error (a builder error carries its sentence)
    }
  }, [f, iprope, timestamp]);

  const text = result?.ok ? planToTextIn(result.plan, tx.say) : ""; // the pasteable text, headings in the page's language

  // An arriving share link (2026-11-01): the whole form is replaced by the link's values, and the page builds the commands.
  useShareArrival(FORTIOS_FLOW_DEBUG_SHARE, (s) => { setF({ ...s.fields }); setIprope(s.iprope); setTimestamp(s.timestamp); }); // the link's form
  // What Share results may carry: every field, beside built commands (memoised).
  const share = useMemo<ShareEncoding>(() => (result?.ok ? FORTIOS_FLOW_DEBUG_SHARE.encode({ fields: f, iprope, timestamp }) : NOTHING), [result, f, iprope, timestamp]); // the encoding

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

      {result && !result.ok && <p className="cidr-error">{tx.error(result.error)}</p>}

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
            {/* Share results (2026-11-01): under the commands, after Copy, at the start of its own row. */}
            <div className="rdap-ask-row">
              <ShareResultsButton encoding={share} carries={t("share.carries")} details={[t("share.caution")]} title={t("name")} />
            </div>
          </section>

          <section className="dig-section">
            <h3 className="dig-section-title">{t("output.lineByLine")}</h3>
            <ol className="dig-records">
              {[...result.plan.reset, ...result.plan.setup, ...result.plan.cleanup].map((l, i) => (
                <li key={`${l.cmd}-${i}`} className="dig-record">
                  <code className="mono">{l.cmd}</code>
                  <p className="dig-record-explain">{tx.say(l.why)}</p>
                </li>
              ))}
            </ol>
          </section>

          {result.plan.notes.length > 0 && (
            <section className="dig-section">
              <h3 className="dig-section-title">{t("notes.title")}</h3>
              <ul className="dig-notes">{result.plan.notes.map((n, i) => <li key={i}>{tx.say(n)}</li>)}</ul>
            </section>
          )}
          {result.plan.warnings.length > 0 && (
            <section className="dig-section">
              <h3 className="dig-section-title">{t("warnings.title")}</h3>
              <ul className="dig-notes">{result.plan.warnings.map((w, i) => <li key={i}>{tx.say(w)}</li>)}</ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
