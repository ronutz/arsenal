"use client";

// ============================================================================
// src/components/F5IrulesNumberNotationTool.tsx
// ----------------------------------------------------------------------------
// THE iRULES NUMBER NOTATION CONVERTER (page UI). Type a value the way it is
// written in an iRule and see how Tcl 8.4.6 reads it: integer or double, the
// base it was written in, the same value in other notations, the two places
// Tcl reads numbers (a literal in an expression, a value in a variable), and
// how ==, eq, < and > compare it with another value.
//
// All answers come from src/lib/tools/f5-irules-number-notation (the shared
// Tcl 8.4 engine); this component only lays them out and words them.
// ============================================================================

import { useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { run, VECTORS, type NumberNotationResult } from "@/lib/tools/f5-irules-number-notation";
import { TclPresets } from "@/components/TclTeachParts";
import { formatElement } from "@/lib/tcl84/list";

// D-83: the Example button loads a golden vector verbatim.
const EXAMPLE = VECTORS.find((v) => v.id === "octal-010")!.input;

// The presets: every golden vector, labelled by the value it reads.
const PRESETS = VECTORS.map((v) => ({ id: v.id, label: v.input.text.trim() === v.input.text ? v.input.text : JSON.stringify(v.input.text) }));

/** The page component. */
export default function F5IrulesNumberNotationTool() {
  // This tool's words.
  const t = useTranslations("tools.f5-irules-number-notation");
  // The value as typed.
  const [text, setText] = useState(EXAMPLE.text);
  // The value it is compared with.
  const [other, setOther] = useState(EXAMPLE.other ?? "8");
  // The preset currently loaded (for the pressed state).
  const [active, setActive] = useState<string | undefined>("octal-010");
  // The reading, recomputed as the inputs change.
  const out = useMemo((): { r?: NumberNotationResult; error?: string } => {
    // Nothing typed: nothing to read.
    if (text === "") return {};
    // The engine refuses oversized input with a message.
    try { return { r: run({ text, other }) }; } catch (e) { return { error: (e as Error).message }; }
  }, [text, other]);
  // Load a preset.
  const pick = (id: string) => {
    // The vector.
    const v = VECTORS.find((x) => x.id === id);
    // Unknown ids do nothing.
    if (!v) return;
    // Its input.
    setText(v.input.text);
    // Its comparison value.
    setOther(v.input.other ?? "8");
    // Mark it.
    setActive(id);
  };
  // The reading, when there is one.
  const r = out.r;
  // Inline code inside translated sentences.
  const rich = { c: (chunks: ReactNode) => <code>{chunks}</code> };
  // Draw.
  return (
    <div className="cidr-tool jwt-tool tcl-tool">
      {/* The inputs. */}
      <div className="cidr-input-row">
        {/* Label and the Example / Clear buttons (D-83). */}
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="nn-text">{t("valueLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => pick("octal-010")}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => { setText(""); setOther(""); setActive(undefined); }}>{t("clear")}</button>
          </div>
        </div>
        {/* The two fields side by side (they stack on a narrow screen). */}
        <div className="tcl-fields">
          {/* The value. */}
          <input id="nn-text" className="cidr-input mono" value={text} onChange={(e) => { setText(e.target.value); setActive(undefined); }} placeholder={t("valuePlaceholder")} spellCheck={false} autoComplete="off" />
          {/* The comparison value. */}
          <label className="tcl-inline-field">
            <span className="cidr-label">{t("otherLabel")}</span>
            <input id="nn-other" className="cidr-input mono" value={other} onChange={(e) => { setOther(e.target.value); setActive(undefined); }} spellCheck={false} autoComplete="off" />
          </label>
        </div>
        {/* The slide values, one click each. */}
        <TclPresets items={PRESETS} label={t("presetsLabel")} onPick={pick} active={active} />
      </div>

      {/* An oversized input. */}
      {out.error && <p className="tcl-verdict tcl-verdict-bad" role="status">{out.error}</p>}

      {/* The reading. */}
      {r && (
        <div className="jwt-results" aria-live="polite">
          {/* Headline: what kind of value, and how Tcl prints it. */}
          <section className="tcl-hero">
            {/* The kind, with the base for integers. */}
            <p className="tcl-hero-kind">
              <span className={`tcl-badge tcl-badge-${r.kind}`}>{t(`kind.${r.kind}`)}</span>
              {r.base && <span className="tcl-muted"> {t(`base.${r.base}`)}</span>}
              {r.special && <span className="tcl-muted"> {t(`special.${r.special}`)}</span>}
            </p>
            {/* The canonical value, large. */}
            {r.canonical !== undefined ? (
              <p className="tcl-hero-value"><span className="tcl-muted tcl-hero-label">{t("canonicalLabel")}</span> <code>{r.canonical}</code></p>
            ) : (
              <p className="tcl-hero-value"><span className="tcl-muted tcl-hero-label">{t("noCanonical")}</span></p>
            )}
          </section>

          {/* The notes, in plain words. */}
          {r.notes.length > 0 && (
            <ul className="tcl-notes">
              {r.notes.map((n) => <li key={n} className={n === "invalid-octal" || n === "too-large" || n === "wrapped64" ? "tcl-note tcl-note-flag" : "tcl-note"}>{t.rich(`note.${n}`, { ...rich, text: r.input.trim(), value: r.canonical ?? "" })}</li>)}
            </ul>
          )}

          {/* Integers: the same value in other notations. */}
          {r.forms && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("formsTitle")}</h4>
              <div className="tcl-table-wrap">
                <table className="tcl-table">
                  <thead><tr><th scope="col">{t("formsNotation")}</th><th scope="col">{t("formsDigits")}</th><th scope="col">{t("formsWrite")}</th></tr></thead>
                  <tbody>
                    {/* Decimal. */}
                    <tr><th scope="row">{t("forms.decimal")}</th><td><code>{r.forms.decimal}</code></td><td><code>{r.forms.decimal}</code></td></tr>
                    {/* Hexadecimal. */}
                    <tr><th scope="row">{t("forms.hex")}</th><td><code>{r.forms.hex}</code></td><td><code>{r.forms.tclHex}</code></td></tr>
                    {/* Octal. */}
                    <tr><th scope="row">{t("forms.octal")}</th><td><code>{r.forms.octal}</code></td><td><code>{r.forms.tclOctal}</code></td></tr>
                    {/* Binary: Tcl 8.4 has no binary literal. */}
                    <tr><th scope="row">{t("forms.binary")}</th><td><code>{r.forms.binary}</code></td><td className="tcl-muted">{t("formsNoBinary")}</td></tr>
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Doubles: what the printed digits hide. */}
          {r.doubleDetail && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("doubleTitle")}</h4>
              <dl className="tcl-pairs">
                {/* Tcl 8.4's print (tcl_precision 12). */}
                <dt className="tcl-pairs-name">{t("double.printed")}</dt><dd className="tcl-pairs-value"><code>{r.doubleDetail.printed}</code></dd>
                {/* The shortest exact round trip. */}
                <dt className="tcl-pairs-name">{t("double.roundTrip")}</dt><dd className="tcl-pairs-value"><code>{r.doubleDetail.roundTrip}</code></dd>
                {/* The exact binary value. */}
                <dt className="tcl-pairs-name">{t("double.exact")}</dt><dd className="tcl-pairs-value"><code className="tcl-wrap">{r.doubleDetail.exact}</code></dd>
              </dl>
            </section>
          )}

          {/* The two places Tcl reads numbers. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("placesTitle")}</h4>
            <div className="tcl-two">
              {/* A literal written in the expression. */}
              <div className="tcl-card">
                <p className="tcl-card-title">{t("literalTitle")}</p>
                <pre className="jwt-json">{`expr {${r.literal.expr || text}}`}</pre>
                <p className={r.literal.ok ? "tcl-outcome tcl-tone-ok" : "tcl-outcome tcl-tone-bad"}>{r.literal.ok ? <code>{r.literal.result}</code> : r.literal.result || t("literalEmpty")}</p>
                <p className="hmac-build-note">{t("literalNote")}</p>
              </div>
              {/* A value held in a variable. */}
              <div className="tcl-card">
                <p className="tcl-card-title">{t("variableTitle")}</p>
                <pre className="jwt-json">{`set x ${formatElement(text)}\nexpr {$x + 0}`}</pre>
                <p className={r.probes[0].ok ? "tcl-outcome tcl-tone-ok" : "tcl-outcome tcl-tone-bad"}>{r.probes[0].ok ? <code>{r.probes[0].result}</code> : r.probes[0].result}</p>
                <p className="hmac-build-note">{t("variableNote")}</p>
              </div>
            </div>
          </section>

          {/* Comparisons with the other value. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("probesTitle", { other })}</h4>
            <div className="tcl-table-wrap">
              <table className="tcl-table">
                <thead><tr><th scope="col">{t("probesExpr")}</th><th scope="col">{t("probesResult")}</th><th scope="col">{t("probesWhy")}</th></tr></thead>
                <tbody>
                  {r.probes.slice(1).map((p) => (
                    <tr key={p.expr}>
                      {/* The expression, as an iRule would write it. */}
                      <td><code>{`expr {${p.expr}}`}</code></td>
                      {/* The result. */}
                      <td>{p.ok ? <span className={p.result === "1" ? "tcl-pill tcl-pill-true" : "tcl-pill tcl-pill-false"}>{p.result}</span> : <span className="tcl-pill tcl-pill-bad">{p.result}</span>}</td>
                      {/* Why. */}
                      <td className="tcl-muted">{t.rich(`probeWhy.${p.expr.includes(" eq ") ? "eq" : "num"}`, rich)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Where x and y come from. */}
            <p className="hmac-build-note">{t.rich("probesNote", { ...rich, text: formatElement(text), other: formatElement(other) })}</p>
          </section>
        </div>
      )}
    </div>
  );
}
