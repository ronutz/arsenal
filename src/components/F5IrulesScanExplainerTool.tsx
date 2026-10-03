"use client";

// ============================================================================
// src/components/F5IrulesScanExplainerTool.tsx
// ----------------------------------------------------------------------------
// THE iRULES scan EXPLAINER (page UI). Give a value, a scan format and the
// variable names, and see each directive of the format line up against the
// characters it consumed: the value it produced, the variable that received
// it, and exactly where and why scanning stopped. The input is drawn on a
// ruler with each conversion's characters in its own colour.
//
// All answers come from src/lib/tools/f5-irules-scan-explainer (the shared
// Tcl 8.4 engine); this component only lays them out and words them.
// ============================================================================

import { useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { run, VECTORS, type ScanExplainerResult } from "@/lib/tools/f5-irules-scan-explainer";
import { TclPresets, TclRuler, TclPairs, type RulerSpan } from "@/components/TclTeachParts";

// D-83: the Example button loads a golden vector verbatim.
const EXAMPLE_ID = "time";

/** Spans for the ruler: skipped space, literals, each conversion, and the stop. */
function spansOf(r: ScanExplainerResult): RulerSpan[] {
  // The spans.
  const out: RulerSpan[] = [];
  // Conversions alternate colours so neighbours are told apart.
  let k = 0;
  // Each step.
  for (const s of r.steps) {
    // White space skipped before a value.
    if (s.valueStart > s.inputStart && r.directives[s.directive].kind === "conv") out.push({ from: s.inputStart, to: s.valueStart - 1, role: "skipped" });
    // Nothing consumed: nothing to colour (a stop is marked below).
    if (s.inputEnd <= s.valueStart && s.outcome !== "stopped") continue;
    // A literal or white space that matched.
    if (s.outcome === "matched") out.push({ from: s.valueStart, to: s.inputEnd - 1, role: "match" });
    // A conversion's characters.
    else if (s.outcome === "assigned" || s.outcome === "suppressed") out.push({ from: s.valueStart, to: s.inputEnd - 1, role: k++ % 2 === 0 ? "consumed" : "consumed-alt" });
    // Where scanning stopped (the character that failed, when there is one).
    else if (s.outcome === "stopped") out.push({ from: Math.max(s.valueStart, s.inputEnd - 1), to: Math.max(s.valueStart, s.inputEnd - 1), role: "stop" });
  }
  // Done.
  return out;
}

/** The page component. */
export default function F5IrulesScanExplainerTool() {
  // This tool's words.
  const t = useTranslations("tools.f5-irules-scan-explainer");
  // The example vector.
  const ex = VECTORS.find((v) => v.id === EXAMPLE_ID)!.input;
  // The value to take apart.
  const [input, setInput] = useState(ex.input);
  // The format.
  const [format, setFormat] = useState(ex.format);
  // The variable names.
  const [vars, setVars] = useState(ex.vars);
  // The preset currently loaded.
  const [active, setActive] = useState<string | undefined>(EXAMPLE_ID);
  // The explanation, recomputed as the inputs change.
  const out = useMemo((): { r?: ScanExplainerResult; error?: string } => {
    // The engine refuses oversized input with a message.
    try { return { r: run({ input, format, vars }) }; } catch (e) { return { error: (e as Error).message }; }
  }, [input, format, vars]);
  // Load a preset.
  const pick = (id: string) => {
    // The vector.
    const v = VECTORS.find((x) => x.id === id);
    // Unknown ids do nothing.
    if (!v) return;
    // Its fields.
    setInput(v.input.input); setFormat(v.input.format); setVars(v.input.vars);
    // Mark it.
    setActive(id);
  };
  // Inline code inside translated sentences.
  const rich = { c: (chunks: ReactNode) => <code>{chunks}</code> };
  // The explanation, when there is one.
  const r = out.r;
  // Draw.
  return (
    <div className="cidr-tool jwt-tool tcl-tool">
      {/* The inputs, with the Example / Clear buttons (D-83). */}
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="sc-input">{t("inputLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => pick(EXAMPLE_ID)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => { setInput(""); setFormat(""); setVars(""); setActive(undefined); }}>{t("clear")}</button>
          </div>
        </div>
        <input id="sc-input" className="cidr-input mono" value={input} onChange={(e) => { setInput(e.target.value); setActive(undefined); }} placeholder={t("inputPlaceholder")} spellCheck={false} autoComplete="off" />
        <div className="tcl-fields">
          <label className="tcl-inline-field"><span className="cidr-label">{t("formatLabel")}</span><input id="sc-format" className="cidr-input mono" value={format} onChange={(e) => { setFormat(e.target.value); setActive(undefined); }} spellCheck={false} autoComplete="off" /></label>
          <label className="tcl-inline-field"><span className="cidr-label">{t("varsLabel")}</span><input id="sc-vars" className="cidr-input mono" value={vars} onChange={(e) => { setVars(e.target.value); setActive(undefined); }} placeholder={t("varsPlaceholder")} spellCheck={false} autoComplete="off" /></label>
        </div>
      </div>
      <TclPresets items={VECTORS.map((v) => ({ id: v.id, label: t(`preset.${v.id}`) }))} label={t("presetsLabel")} onPick={pick} active={active} />

      {/* An oversized input. */}
      {out.error && <p className="tcl-verdict tcl-verdict-bad" role="status">{out.error}</p>}

      {/* The explanation. */}
      {r && (
        <div className="jwt-results" aria-live="polite">
          {/* The paste-ready command. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("commandTitle")}</h4>
            <pre className="jwt-json">{r.command}</pre>
          </section>

          {/* What scan returned, and what that number means. */}
          {r.ok ? (
            <div className="tcl-verdict tcl-verdict-ok">
              <p><span className="tcl-verdict-label">{t("resultLabel")}</span> <code className="tcl-big">{r.result === "" ? "∅" : r.result}</code></p>
              <p className="hmac-build-note">{r.assignments.length === 0 ? t("resultInline") : r.result === "-1" ? t("resultMinusOne") : t("resultCount", { n: Number(r.result) })}</p>
            </div>
          ) : (
            <p className="tcl-verdict tcl-verdict-bad"><span className="tcl-verdict-label">{t("errorLabel")}</span> {r.error}</p>
          )}

          {/* The input on a ruler, coloured by what consumed each character. */}
          {r.ok && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("rulerTitle")}</h4>
              <TclRuler text={input} spans={spansOf(r)} roleLabel={(role) => t(`role.${role}`)} truncatedLabel={t("rulerTruncated")} />
            </section>
          )}

          {/* The line-up: directive, characters, outcome, value, variable. */}
          {r.ok && r.steps.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("stepsTitle")}</h4>
              <div className="tcl-table-wrap">
                <table className="tcl-table">
                  <thead><tr><th scope="col">{t("colDirective")}</th><th scope="col">{t("colConsumed")}</th><th scope="col">{t("colOutcome")}</th><th scope="col">{t("colValue")}</th><th scope="col">{t("colVariable")}</th></tr></thead>
                  <tbody>
                    {r.steps.map((s, i) => {
                      // The directive this step ran.
                      const d = r.directives[s.directive];
                      // The row.
                      return (
                        <tr key={i}>
                          <td><code>{d.text === " " ? "␣" : d.text}</code><div className="tcl-muted tcl-small">{d.kind === "conv" ? t(`conv.${d.conv === "[" ? "set" : d.conv}`, { set: d.set ?? "" }) : t(`dirKind.${d.kind}`)}{d.width ? ` ${t("width", { n: d.width })}` : ""}{d.suppress ? ` ${t("suppressed")}` : ""}</div></td>
                          <td>{s.consumed === "" ? <span className="tcl-muted">{t("nothing")}</span> : <code>{s.consumed.replace(/ /g, "␣")}</code>}</td>
                          <td><span className={`tcl-pill tcl-out-${s.outcome}`}>{t(`outcome.${s.outcome}`)}</span></td>
                          <td>{s.value !== undefined ? <code>{s.value}</code> : <span className="tcl-muted">{"\u2013"}</span>}{s.base && s.base !== 10 ? <div className="tcl-muted tcl-small">{t("readBase", { base: String(s.base) })}</div> : null}{s.platformDependent ? <div className="tcl-small tcl-tone-warn">{t("int32Cell")}</div> : null}</td>
                          <td>{s.variable ? <code>{s.variable}</code> : <span className="tcl-muted">{"\u2013"}</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Why scanning ended. */}
              {r.stopped && <p className="hmac-build-note">{t.rich(`stopped.${r.stopped}`, rich)}</p>}
            </section>
          )}

          {/* Each variable and what it holds afterwards. */}
          {r.assignments.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("varsTitle")}</h4>
              <TclPairs rows={r.assignments.map((a) => ({ name: <code>{a.name}</code>, value: a.value }))} emptyLabel={t("notSet")} />
            </section>
          )}

          {/* Notes. */}
          {r.notes.length > 0 && (
            <ul className="tcl-notes">
              {r.notes.map((n) => <li key={n} className={n === "int32" || n === "n-bytes" ? "tcl-note tcl-note-flag" : "tcl-note"}>{t.rich(`note.${n}`, rich)}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
