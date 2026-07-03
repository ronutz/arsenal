"use client";

// ============================================================================
// src/components/IrulesCommandContextTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE iRULES COMMAND/CONTEXT EXPLAINER. Paste an iRule: every when
// block renders as a card with the event's identity (the Master List's own
// one-liner, linked), the commands inventoried with links to their reference
// pages, the priority evaluation order across duplicate events, and the CMP
// audit sourced to the CMP Compatibility page. Per-command validity tables
// are linked, never reproduced unverified - the honesty is the feature.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { run, type IRulesContextResult } from "@/lib/tools/f5-irules-command-context";

type LiveResult = { ok: true; value: IRulesContextResult } | { ok: false; message: string };

// D-83 example: fires the demotion finding, the static:: note, the priority
// ordering, a clean expressible block, and an uncurated event.
const EXAMPLE = `when RULE_INIT {
    set ::debug 1
    set static::api_pool "api_pool"
}
when HTTP_REQUEST priority 400 {
    if { [HTTP::uri] starts_with "/api" } {
        pool api_pool
    }
}
when HTTP_REQUEST {
    HTTP::header insert X-Client [IP::client_addr]
    log local0. "req [HTTP::host][HTTP::uri]"
}`;

export default function IrulesCommandContextTool() {
  const t = useTranslations("tools.f5-irules-command-context");
  const [input, setInput] = useState("");

  const live: LiveResult | null = useMemo(() => {
    if (!input.trim()) return null;
    try {
      return { ok: true, value: run(input) };
    } catch (e) {
      return { ok: false, message: (e as Error).message };
    }
  }, [input]);

  return (
    <div className="cidr-tool jwt-tool saml-tool json-tool tmsh-tool lbm-tool icc-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="icc-input">{t("inputLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
          </div>
        </div>
        <textarea id="icc-input" className="cidr-input mono saml-textarea json-input tmsh-input" value={input}
          onChange={(e) => setInput(e.target.value)} placeholder={t.raw("inputPlaceholder")} spellCheck={false} rows={12} aria-describedby="icc-privacy" />
        <p id="icc-privacy" className="cidr-privacy"><span className="cidr-lock" aria-hidden="true">&#9679;</span> {t("runsLocally")}</p>
        <p className="dve-posture">{t("notExecutedNote")}</p>
      </div>

      {live && !live.ok && <p className="cidr-error" role="alert">{live.message}</p>}

      {live && live.ok && (
        <div className="jwt-results icc-results">
          {live.value.notes.length > 0 && (
            <div className="jwt-panel"><div className="jwt-panel-title">{t("notesTitle")}</div>
              <ul className="dig-warning-list">{live.value.notes.map((n, i) => <li key={i}>{n}</li>)}</ul></div>
          )}

          {live.value.mode === "event" && live.value.event && (
            <article className="tmsh-object">
              <header className="tmsh-object-head">
                <span className="tmsh-type-badge mono">{live.value.event.name}</span>
                <span className="lbm-chip">{live.value.event.module}</span>
              </header>
              <p className="gdf-step-behavior">{live.value.event.description}</p>
              <p className="icc-ref"><a href={live.value.event.url} target="_blank" rel="noopener noreferrer" className="footer-contribute-link">{t("referencePage")} ↗</a></p>
            </article>
          )}

          {live.value.mode === "catalog" && live.value.catalog!.map((g) => (
            <div key={g.module}>
              <div className="jwt-panel"><div className="jwt-panel-title">{g.module} <span className="lbm-chip mono">{g.events.length}</span></div></div>
              {g.events.map((e) => (
                <article className="tmsh-object" key={e.name}>
                  <header className="tmsh-object-head"><span className="tmsh-type-badge mono">{e.name}</span></header>
                  <p className="gdf-step-behavior">{e.description}</p>
                </article>
              ))}
            </div>
          ))}

          {live.value.mode === "rule" && (
            <>
              {live.value.blocks!.map((b, i) => (
                <article className="tmsh-object icc-block" key={i}>
                  <header className="tmsh-object-head">
                    <span className="tmsh-type-badge mono">when {b.event}</span>
                    <span className="lbm-chip mono">priority {b.priority}{b.priorityExplicit ? "" : ` (${t("defaultLabel")})`}</span>
                    <span className="lbm-chip mono">line {b.line}</span>
                    {!b.info && <span className="lbm-chip dve-uncurated">{t("uncurated")}</span>}
                  </header>
                  {b.info && <p className="gdf-step-behavior">{b.info.description}</p>}
                  {b.commands.length > 0 && (
                    <dl className="lbm-settings">
                      {b.commands.map((c, j) => (
                        <div className="lbm-setting" key={j}>
                          <dt className="mono">{c.name}{c.count > 1 ? ` ×${c.count}` : ""}</dt>
                          <dd><a href={c.url} target="_blank" rel="noopener noreferrer" className="footer-contribute-link">{t("referencePage")} ↗</a></dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  {(b.cmpFindings.length > 0 || b.notes.length > 0) && (
                    <div className="jwt-panel dig-warnings gdf-obs">
                      <div className="jwt-panel-title">{t("observationsTitle")}</div>
                      <ul className="dig-warning-list">{[...b.cmpFindings, ...b.notes].map((o, k) => <li key={k}>{o}</li>)}</ul>
                    </div>
                  )}
                </article>
              ))}
              {(live.value.orderAnalysis!.length > 0 || live.value.ruleFindings.length > 0) && (
                <div className="jwt-panel dig-warnings">
                  <div className="jwt-panel-title">{t("ruleTitle")}</div>
                  <ul className="dig-warning-list">{[...live.value.orderAnalysis!, ...live.value.ruleFindings].map((o, k) => <li key={k}>{o}</li>)}</ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
