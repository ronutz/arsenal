"use client";

// ============================================================================
// src/components/PacketFilterExplainerTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE PACKET-FILTER EXPLAINER. Paste net packet-filter stanzas for the
// ordered first-match walk with the man page's own semantics and the
// always-on platform context; add a sim: line for the honest three-state
// which-rule-matches simulator.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { run, type PacketFilterResult, type SimVerdict } from "@/lib/tools/f5-packet-filter-explainer";

type LiveResult = { ok: true; value: PacketFilterResult } | { ok: false; message: string };

// D-83 example: the man page's three official rules + a spoofed-source
// simulation that hits the blocker.
const EXAMPLE = `net packet-filter spoof_blocker {
    order 5
    action discard
    vlan external
    logging enabled
    rule "(src net 172.19.255.0/24)"
}
net packet-filter management_ssh {
    order 10
    action accept
    logging enabled
    rule "(proto TCP) and (src host 172.19.254.10) and (dst port 22)"
}
net packet-filter virtuals {
    order 20
    action accept
    vlan external
    rule "(dst host 172.19.254.80)"
}
sim: tcp src 172.19.255.7 dst 172.19.254.80 dport 443 vlan external`;

const VERDICT_CLASS: Record<SimVerdict, string> = {
  match: "pfe-match",
  "no-match": "pfe-nomatch",
  "cannot-evaluate": "pfe-unknown",
  "vlan-skip": "pfe-skip",
};

export default function PacketFilterExplainerTool() {
  const t = useTranslations("tools.f5-packet-filter-explainer");
  const [input, setInput] = useState("");

  const live: LiveResult | null = useMemo(() => {
    if (!input.trim()) return null;
    try {
      return { ok: true, value: run(input) };
    } catch (e) {
      return { ok: false, message: (e as Error).message };
    }
  }, [input]);

  const verdictLabel = (v: SimVerdict) =>
    v === "match" ? t("vMatch") : v === "no-match" ? t("vNoMatch") : v === "vlan-skip" ? t("vVlanSkip") : t("vUnknown");

  return (
    <div className="cidr-tool jwt-tool saml-tool json-tool tmsh-tool lbm-tool pfe-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="pfe-input">{t("inputLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
          </div>
        </div>
        <textarea id="pfe-input" className="cidr-input mono saml-textarea json-input tmsh-input" value={input}
          onChange={(e) => setInput(e.target.value)} placeholder={t.raw("inputPlaceholder")} spellCheck={false} rows={13} aria-describedby="pfe-privacy" />
        <p id="pfe-privacy" className="cidr-privacy"><span className="cidr-lock" aria-hidden="true">&#9679;</span> {t("runsLocally")}</p>
        <p className="dve-posture">{t("postureNote")}</p>
      </div>

      {live && !live.ok && <p className="cidr-error" role="alert">{live.message}</p>}

      {live && live.ok && (
        <div className="jwt-results pfe-results">
          {live.value.errors.map((e, i) => <p className="cidr-error" key={i}>{e}</p>)}

          <div className="jwt-panel">
            <div className="jwt-panel-title">{t("walkTitle")}</div>
            <ol className="dig-warning-list pfe-walk mono">{live.value.orderWalk.map((w, i) => <li key={i}>{w}</li>)}</ol>
          </div>

          {live.value.rules.map((r) => (
            <article className="tmsh-object pfe-rule" key={r.name}>
              <header className="tmsh-object-head">
                <span className="tmsh-type-badge mono">{r.name}</span>
                <span className="lbm-chip mono">order {r.order ?? "?"}</span>
                <span className="lbm-chip mono">{r.action ?? "?"}</span>
                <span className="lbm-chip mono">{r.vlan ?? t("allVlans")}</span>
              </header>
              {r.rule !== null && <pre className="tmsh-input mono ivp-sketch">{r.rule === "" ? t("emptyExpression") : r.rule}</pre>}
              {(r.issues.length > 0 || r.notes.length > 0) && (
                <div className={`jwt-panel gdf-obs ${r.issues.length > 0 ? "dig-warnings" : ""}`}>
                  <div className="jwt-panel-title">{t("observationsTitle")}</div>
                  <ul className="dig-warning-list">{[...r.issues, ...r.notes].map((o, k) => <li key={k}>{o}</li>)}</ul>
                </div>
              )}
            </article>
          ))}

          {live.value.simulation && (
            <>
              <div className="jwt-panel">
                <div className="jwt-panel-title">{t("simTitle")}</div>
                {live.value.simulation.steps.map((s, i) => (
                  <p className={`gdf-step-behavior pfe-step ${VERDICT_CLASS[s.verdict]}`} key={i}>
                    <span className="mono">{s.ruleName}</span>: <span className={`lbm-chip pfe-verdict ${VERDICT_CLASS[s.verdict]}`}>{verdictLabel(s.verdict)}</span> {s.detail}
                  </p>
                ))}
              </div>
              <div className="jwt-panel dig-warnings">
                <div className="jwt-panel-title">{t("outcomeTitle")}</div>
                <p className="gdf-step-behavior">{live.value.simulation.outcome}</p>
              </div>
            </>
          )}

          <div className="jwt-panel">
            <div className="jwt-panel-title">{t("contextTitle")}</div>
            <ul className="dig-warning-list">{live.value.contextNotes.map((c, i) => <li key={i}>{c}</li>)}</ul>
          </div>
        </div>
      )}
    </div>
  );
}
