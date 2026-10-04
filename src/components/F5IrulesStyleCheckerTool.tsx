"use client";

// ============================================================================
// src/components/F5IrulesStyleCheckerTool.tsx
// ----------------------------------------------------------------------------
// THE iRULES STYLE CHECKER (page UI). Paste an iRule and read it against the
// DevCentral iRules Style Guide: the guide's editor settings and its numbered
// rules, the points its comment thread added (D1, D2), plus a Tcl 8.4 syntax
// check (an error there stops the rule from loading at all). Findings are
// listed by line beside the numbered code, each naming the rule it comes from
// and what to change; characters are named from Unicode 18.0.0.
//
// All answers come from src/lib/tools/f5-irules-style-checker (the rule is
// parsed, never run); this component only lays them out and words them.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { run, VECTORS, type StyleCheckerResult } from "@/lib/tools/f5-irules-style-checker";
import { TclCode, TclPresets } from "@/components/TclTeachParts";

// D-83: the Example button loads a golden vector verbatim.
const EXAMPLE_ID = "messy";

/** The page component. */
export default function F5IrulesStyleCheckerTool() {
  // This tool's words.
  const t = useTranslations("tools.f5-irules-style-checker");
  // The iRule.
  const [irule, setIrule] = useState(VECTORS.find((v) => v.id === EXAMPLE_ID)!.input.irule);
  // The preset currently loaded.
  const [active, setActive] = useState<string | undefined>(EXAMPLE_ID);
  // The findings, recomputed as the rule changes.
  const out = useMemo((): { r?: StyleCheckerResult; error?: string } => {
    // Nothing to read.
    if (irule.trim() === "") return {};
    // The engine refuses oversized input with a message.
    try { return { r: run({ irule }) }; } catch (e) { return { error: (e as Error).message }; }
  }, [irule]);
  // Load a preset.
  const pick = (id: string) => {
    // The vector.
    const v = VECTORS.find((x) => x.id === id);
    // Unknown ids do nothing.
    if (!v) return;
    // Its rule.
    setIrule(v.input.irule);
    // Mark it.
    setActive(id);
  };
  // The findings, when there are some.
  const r = out.r;
  // The worst severity per line, for the code view.
  const marks = useMemo(() => {
    // Line to severity.
    const m = new Map<number, string>();
    // Severity order.
    const rank: Record<string, number> = { error: 3, warning: 2, info: 1 };
    // Each finding keeps the worst one.
    for (const f of r?.findings ?? []) if (!m.has(f.line) || rank[f.severity] > rank[m.get(f.line)!]) m.set(f.line, f.severity);
    // Done.
    return m;
  }, [r]);
  // A finding's sentence, by rule and its parameters.
  const message = (rule: string, params?: Record<string, string | number>) => {
    // Parameters as they came: numbers stay numbers (plural forms and digit grouping need them), the rest is text.
    const p = Object.fromEntries(Object.entries(params ?? {}).map(([k, v]) => [k, typeof v === "number" ? v : String(v)]));
    // Each rule's sentences are keyed by variant ("main" when the rule has one).
    return t(`finding.${rule}.${typeof p.what === "string" ? p.what : "main"}`, p);
  };
  // Draw.
  return (
    <div className="cidr-tool jwt-tool tcl-tool">
      {/* The rule, with the Example / Clear buttons (D-83). */}
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="st-src">{t("iruleLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => pick(EXAMPLE_ID)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => { setIrule(""); setActive(undefined); }}>{t("clear")}</button>
          </div>
        </div>
        <textarea id="st-src" className="cidr-input mono json-input" rows={12} value={irule} onChange={(e) => { setIrule(e.target.value); setActive(undefined); }} placeholder={t("irulePlaceholder")} spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="off" />
      </div>
      <TclPresets items={VECTORS.map((v) => ({ id: v.id, label: t(`preset.${v.id}`) }))} label={t("presetsLabel")} onPick={pick} active={active} />

      {/* An oversized input. */}
      {out.error && <p className="tcl-verdict tcl-verdict-bad" role="status">{out.error}</p>}

      {/* The reading. */}
      {r && (
        <div className="jwt-results" aria-live="polite">
          {/* Summary: does it load, and how many findings of each kind. */}
          <div className={!r.parses || r.counts.error > 0 ? "tcl-verdict tcl-verdict-bad" : r.counts.warning > 0 ? "tcl-verdict tcl-verdict-warn" : "tcl-verdict tcl-verdict-ok"}>
            <p><span className="tcl-verdict-label">{r.parses ? t("parsesYes") : t("parsesNo")}</span> {r.findings.length === 0 ? t("clean") : t("counts", { error: r.counts.error, warning: r.counts.warning, info: r.counts.info })}</p>
            <p className="hmac-build-note">{t("stats", { lines: r.lines, longest: r.longest })}</p>
          </div>

          {/* Events and their priorities (R16). */}
          {r.events.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("eventsTitle")}</h4>
              <ul className="tcl-pool-list">
                {r.events.map((e, i) => <li key={i}><code>{e.name}</code> <span className="tcl-muted">{t("lineShort", { n: e.line })}</span> {e.priority !== null ? <span className="tcl-pill tcl-pill-true">{t("priority", { p: e.priority })}</span> : <span className="tcl-pill tcl-pill-warn">{t("noPriority")}</span>}</li>)}
              </ul>
            </section>
          )}

          {/* The rule with flagged lines marked. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("codeTitle")}</h4>
            <TclCode code={irule} marks={marks} label={t("codeTitle")} />
          </section>

          {/* The findings, by line. */}
          {r.findings.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("findingsTitle")}</h4>
              <ol className="tcl-findings">
                {r.findings.map((f, i) => (
                  <li key={i} className={`tcl-finding tcl-finding-${f.severity}`}>
                    <div className="tcl-finding-head">
                      <span className={`irl-sev irl-sev-${f.severity === "error" ? "high" : f.severity}`}>{t(`sev.${f.severity}`)}</span>
                      <span className="tcl-rule">{f.rule === "syntax" ? t("ruleSyntax") : f.rule === "limit" ? t("ruleLimit") : f.rule}</span>
                      <span className="tcl-muted tcl-small">{t("lineShort", { n: f.line })}</span>
                      <span className="tcl-finding-title">{t(`ruleName.${f.rule}`)}</span>
                    </div>
                    {f.snippet && <code className="tcl-finding-snippet">{f.snippet}</code>}
                    <p className="tcl-finding-msg">{message(f.rule, f.params)}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* What the checker cannot judge. */}
          <p className="hmac-build-note">{t("limits")}</p>
        </div>
      )}
    </div>
  );
}
