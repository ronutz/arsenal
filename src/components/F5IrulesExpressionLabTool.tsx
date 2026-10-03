"use client";

// ============================================================================
// src/components/F5IrulesExpressionLabTool.tsx
// ----------------------------------------------------------------------------
// THE iRULES EXPRESSION LAB (page UI). Give variables their values with set
// commands, write an expression as it would sit between the braces of
// expr { ... } or if { ... }, and see the value, how precedence grouped the
// expression, every step of the evaluation as a tree, and (for a comparison)
// what ==, eq, < and > each make of the same two operands.
//
// All answers come from src/lib/tools/f5-irules-expression-lab (the shared
// Tcl 8.4 engine); this component only lays them out and words them.
// ============================================================================

import { useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { run, VECTORS, DEFAULT_SAMPLE, type ExpressionLabResult } from "@/lib/tools/f5-irules-expression-lab";
import { TclPresets, TclSeg, TclTree, TclPairs } from "@/components/TclTeachParts";

// D-83: the Example button loads a golden vector verbatim.
const EXAMPLE_ID = "octal-equality";

// The presets: every golden vector.
const PRESET_IDS = VECTORS.map((v) => v.id);

/** Turn note parameters into the strings ICU selects on. */
function strParams(p?: Record<string, string | number | boolean>): Record<string, string> {
  // Every value as text (booleans become "true" / "false"); ICU select keys cannot
  // contain hyphens, so the "why" code (left-text, ...) is written with underscores.
  return Object.fromEntries(Object.entries(p ?? {}).map(([k, v]) => [k, k === "why" ? String(v).replace(/-/g, "_") : String(v)]));
}

/** The page component. */
export default function F5IrulesExpressionLabTool() {
  // This tool's words.
  const t = useTranslations("tools.f5-irules-expression-lab");
  // The example vector.
  const ex = VECTORS.find((v) => v.id === EXAMPLE_ID)!.input;
  // The expression.
  const [expression, setExpression] = useState(ex.expression);
  // The set commands that give variables their values.
  const [setup, setSetup] = useState(ex.setup);
  // Plain Tcl 8.4 or iRules (F5's operators and commands).
  const [mode, setMode] = useState<"tcl" | "irules">(ex.mode);
  // The sample request's URI and Host (iRules mode).
  const [uri, setUri] = useState(DEFAULT_SAMPLE.uri);
  // The Host header.
  const [host, setHost] = useState(DEFAULT_SAMPLE.host);
  // The preset currently loaded.
  const [active, setActive] = useState<string | undefined>(EXAMPLE_ID);
  // The evaluation, recomputed as the inputs change.
  const out = useMemo((): { r?: ExpressionLabResult; error?: string } => {
    // Nothing to evaluate.
    if (expression.trim() === "") return {};
    // The engine refuses oversized input with a message.
    try { return { r: run({ expression, setup, mode, sample: { ...DEFAULT_SAMPLE, uri, host } }) }; } catch (e) { return { error: (e as Error).message }; }
  }, [expression, setup, mode, uri, host]);
  // Load a preset.
  const pick = (id: string) => {
    // The vector.
    const v = VECTORS.find((x) => x.id === id);
    // Unknown ids do nothing.
    if (!v) return;
    // Its fields.
    setExpression(v.input.expression); setSetup(v.input.setup); setMode(v.input.mode);
    // The default sample request.
    setUri(DEFAULT_SAMPLE.uri); setHost(DEFAULT_SAMPLE.host);
    // Mark it.
    setActive(id);
  };
  // Inline code inside translated sentences.
  const rich = { c: (chunks: ReactNode) => <code>{chunks}</code> };
  // A note's sentence.
  const noteText = (code: string, params?: Record<string, string | number | boolean>) => t.rich(`exprNote.${code}`, { ...rich, ...strParams(params) });
  // The evaluation, when there is one.
  const r = out.r;
  // Draw.
  return (
    <div className="cidr-tool jwt-tool tcl-tool">
      {/* Mode and presets. */}
      <div className="tcl-toolbar">
        <TclSeg label={t("modeLabel")} value={mode} onChange={(m) => { setMode(m); setActive(undefined); }} options={[{ value: "tcl", label: t("modeTcl") }, { value: "irules", label: t("modeIrules") }]} />
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={() => pick(EXAMPLE_ID)}>{t("example")}</button>
          <button type="button" className="b64-copy" onClick={() => { setExpression(""); setSetup(""); setActive(undefined); }}>{t("clear")}</button>
        </div>
      </div>
      <TclPresets items={PRESET_IDS.map((id) => ({ id, label: t(`preset.${id}`) }))} label={t("presetsLabel")} onPick={pick} active={active} />

      {/* The setup script. */}
      <div className="cidr-input-row">
        <label className="cidr-label" htmlFor="el-setup">{t("setupLabel")}</label>
        <textarea id="el-setup" className="cidr-input mono tcl-short" rows={2} value={setup} onChange={(e) => { setSetup(e.target.value); setActive(undefined); }} placeholder={t("setupPlaceholder")} spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="off" />
      </div>

      {/* The expression, shown inside the braces it would sit in. */}
      <div className="cidr-input-row">
        <label className="cidr-label" htmlFor="el-expr">{t("exprLabel")}</label>
        <div className="tcl-braced">
          <span className="tcl-braced-edge" aria-hidden="true">{"expr {"}</span>
          <input id="el-expr" className="cidr-input mono" value={expression} onChange={(e) => { setExpression(e.target.value); setActive(undefined); }} placeholder={t("exprPlaceholder")} spellCheck={false} autoComplete="off" />
          <span className="tcl-braced-edge" aria-hidden="true">{"}"}</span>
        </div>
      </div>

      {/* The sample request, in iRules mode. */}
      {mode === "irules" && (
        <details className="tcl-details">
          <summary>{t("sampleTitle")}</summary>
          <div className="tcl-fields">
            <label className="tcl-inline-field"><span className="cidr-label">{t("sampleUri")}</span><input id="el-uri" className="cidr-input mono" value={uri} onChange={(e) => setUri(e.target.value)} spellCheck={false} /></label>
            <label className="tcl-inline-field"><span className="cidr-label">{t("sampleHost")}</span><input id="el-host" className="cidr-input mono" value={host} onChange={(e) => setHost(e.target.value)} spellCheck={false} /></label>
          </div>
          <p className="hmac-build-note">{t("sampleNote")}</p>
        </details>
      )}

      {/* An oversized input. */}
      {out.error && <p className="tcl-verdict tcl-verdict-bad" role="status">{out.error}</p>}

      {/* The evaluation. */}
      {r && (
        <div className="jwt-results" aria-live="polite">
          {/* The outcome. */}
          {r.ok ? (
            <p className="tcl-verdict tcl-verdict-ok">
              <span className="tcl-verdict-label">{t("resultLabel")}</span> <code className="tcl-big">{r.value === "" ? "∅" : r.value}</code>
              {r.held && <span className="tcl-held">{t(`held.${r.held}`)}</span>}
            </p>
          ) : (
            <div className="tcl-verdict tcl-verdict-bad">
              <p><span className="tcl-verdict-label">{t(`stage.${r.stage ?? "run"}`)}</span> {r.error}</p>
              {/* Where a parse or compile error stopped, under the expression. */}
              {(r.stage === "parse" || r.stage === "compile") && r.errorPos !== undefined && (
                <pre className="tcl-caret" aria-hidden="true">{expression + "\n" + " ".repeat(Math.max(0, Math.min(r.errorPos, expression.length))) + "^"}</pre>
              )}
              <p className="hmac-build-note">{t(`stageNote.${r.stage ?? "run"}`)}</p>
            </div>
          )}

          {/* Precedence made visible. */}
          {r.grouping && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("groupingTitle")}</h4>
              <pre className="jwt-json">{r.grouping}</pre>
              <p className="hmac-build-note">{t("groupingNote")}</p>
            </section>
          )}

          {/* The evaluation tree. */}
          {r.tree && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("treeTitle")}</h4>
              <TclTree node={r.tree} noteText={noteText} heldLabel={(h) => t(`held.${h}`)} skippedLabel={t("skipped")} platformText={(p) => t(`platform.${p}`)} />
            </section>
          )}

          {/* The same two operands under each comparison operator. */}
          {r.comparison && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("compareTitle")}</h4>
              <div className="tcl-table-wrap">
                <table className="tcl-table">
                  <thead><tr><th scope="col">{t("compareExpr")}</th><th scope="col">{t("compareResult")}</th><th scope="col">{t("compareHow")}</th></tr></thead>
                  <tbody>
                    {r.comparison.results.map((c) => (
                      <tr key={c.op}>
                        <td><code>{`${r.comparison!.left} ${c.op} ${r.comparison!.right}`}</code></td>
                        <td>{c.ok ? <span className={c.result === "1" ? "tcl-pill tcl-pill-true" : "tcl-pill tcl-pill-false"}>{c.result}</span> : <span className="tcl-pill tcl-pill-bad">{c.result}</span>}</td>
                        <td className="tcl-muted">{t.rich(`compareWhy.${c.op === "eq" ? "eq" : "num"}`, rich)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* The variables the setup script left. */}
          {r.vars.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("varsTitle")}</h4>
              <TclPairs rows={r.vars.map((v) => ({ name: <code>{`$${v.name}`}</code>, value: v.value }))} emptyLabel={t("empty")} />
            </section>
          )}

          {/* Log lines and recorded actions from commands inside the expression. */}
          {(r.logs.length > 0 || r.actions.length > 0) && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("sideEffectsTitle")}</h4>
              <ul className="tcl-notes">
                {r.logs.map((l, i) => <li key={`l${i}`} className="tcl-note"><code>{`log ${l.facility}`}</code> {l.message}</li>)}
                {r.actions.map((a, i) => <li key={`a${i}`} className="tcl-note"><code>{[a.command, ...a.args].join(" ")}</code> <span className="tcl-muted">{t("recorded")}</span></li>)}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
