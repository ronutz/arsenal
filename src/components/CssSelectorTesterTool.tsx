"use client";

// ============================================================================
// src/components/CssSelectorTesterTool.tsx
// ----------------------------------------------------------------------------
// THE CSS SELECTOR TESTER (page UI). HTML on one side, selectors on the other;
// out come the matched elements (highlighted in the parsed tree, with their
// path and line), each selector's count and specificity, and the notes on what
// a static document cannot answer.
//
// All answers come from src/lib/tools/css-selector-tester (parse5 for the
// tree, the in-house matcher for the selectors); this component only lays them
// out and words them. Nothing is executed, fetched or rendered.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { run, VECTORS, HTML_MAX_CHARS, SELECTORS_MAX_LINES, type SelectorTestResult, type SelectorReport } from "@/lib/tools/css-selector-tester";
import { TclPresets } from "@/components/TclTeachParts";

// D-83: the Example button loads a golden vector verbatim.
const EXAMPLE_ID = "menu-basics";

// The vectors offered as presets.
const PRESET_IDS = ["menu-basics", "empty-and-not", "has-relational", "form-states", "nth-of-type-and-of-s", "table-cells", "escapes-and-namespaces", "lang-and-dir", "static-document", "invalid-selectors", "forgiving-lists", "closed-at-the-end", "specificity-ranking"];

// How many characters of an attribute value the tree shows.
const ATTR_MAX = 40;

/** The page component. */
export default function CssSelectorTesterTool() {
  // This tool's words.
  const t = useTranslations("tools.css-selector-tester");
  // The example.
  const example = VECTORS.find((v) => v.id === EXAMPLE_ID)!;
  // The HTML and the selectors.
  const [html, setHtml] = useState(example.input.html);
  const [selectors, setSelectors] = useState(example.input.selectors);
  // The preset currently loaded.
  const [active, setActive] = useState<string | undefined>(EXAMPLE_ID);
  // Which selector's matches are highlighted in the tree (null = all).
  const [focus, setFocus] = useState<number | null>(null);
  // The reading.
  const out = useMemo((): { r?: SelectorTestResult; error?: string } => {
    // Nothing to read.
    if (html.trim() === "" && selectors.trim() === "") return {};
    // The engine refuses oversized input with a message.
    try { return { r: run({ html, selectors }) }; } catch (e) { return { error: (e as Error).message }; }
  }, [html, selectors]);
  // Load a preset.
  const pick = (id: string) => {
    // The vector.
    const v = VECTORS.find((x) => x.id === id);
    // Unknown ids do nothing.
    if (!v) return;
    // Its inputs.
    setHtml(v.input.html);
    setSelectors(v.input.selectors);
    // Mark it.
    setActive(id);
    setFocus(null);
  };
  // The result.
  const r = out.r;
  // One attribute, shown.
  const attrText = (a: { name: string; value: string }) => a.value === "" ? a.name : `${a.name}="${a.value.length > ATTR_MAX ? a.value.slice(0, ATTR_MAX - 1) + "…" : a.value}"`;
  // The pill class for a selector by its state.
  const selClass = (s: SelectorReport) => !s.valid ? "tcl-pill tcl-pill-bad" : s.count === 0 ? "tcl-pill tcl-pill-muted" : "tcl-pill tcl-pill-true";
  // Draw.
  return (
    <div className="cidr-tool jwt-tool tcl-tool">
      {/* The HTML. */}
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="cst-html">{t("htmlLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => pick(EXAMPLE_ID)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => { setHtml(""); setSelectors(""); setActive(undefined); setFocus(null); }}>{t("clear")}</button>
          </div>
        </div>
        <textarea id="cst-html" className="cidr-input mono json-input" rows={8} value={html} onChange={(e) => { setHtml(e.target.value); setActive(undefined); }} placeholder={t("htmlPlaceholder")} spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="off" />
      </div>
      {/* The selectors. */}
      <div className="cidr-input-row">
        <label className="cidr-label" htmlFor="cst-selectors">{t("selectorsLabel", { max: SELECTORS_MAX_LINES })}</label>
        <textarea id="cst-selectors" className="cidr-input mono json-input" rows={4} value={selectors} onChange={(e) => { setSelectors(e.target.value); setActive(undefined); setFocus(null); }} placeholder={t("selectorsPlaceholder")} spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="off" />
      </div>
      <TclPresets items={PRESET_IDS.map((id) => ({ id, label: t(`preset.${id}`) }))} label={t("presetsLabel")} onPick={pick} active={active} />

      {/* An oversized input. */}
      {out.error && <p className="tcl-verdict tcl-verdict-bad" role="status">{out.error}</p>}

      {/* The reading. */}
      {r && (
        <div className="jwt-results" aria-live="polite">
          {/* The verdict. */}
          <div className={r.selectors.some((s) => !s.valid) ? "tcl-verdict tcl-verdict-warn" : "tcl-verdict tcl-verdict-ok"}>
            <p>
              <span className="tcl-verdict-label">{t("summary", { elements: r.counts.elements, selectors: r.counts.selectors })}</span>{" "}
              {t("summaryMatches", { valid: r.counts.valid, invalid: r.counts.selectors - r.counts.valid, matched: r.counts.matchedElements })}{" "}
              {r.mode !== "no-quirks" && t("quirksNote", { mode: r.mode })}
            </p>
          </div>

          {/* The selectors table. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("selectorsTitle")}</h4>
            {r.selectors.length === 0 ? <p className="tcl-finding-msg">{t("noSelectors")}</p> : (
              <div className="tcl-table-wrap">
                <table className="tcl-table">
                  <thead><tr><th scope="col">#</th><th scope="col">{t("colSelector")}</th><th scope="col">{t("colMatches")}</th><th scope="col">{t("colSpecificity")}</th><th scope="col">{t("colNotes")}</th></tr></thead>
                  <tbody>
                    {r.selectors.map((s) => (
                      <tr key={s.index} className={focus === s.index ? "cst-row-focus" : undefined}>
                        <th scope="row"><button type="button" className={`tcl-pill ${focus === s.index ? "tcl-pill-value" : "tcl-pill-muted"}`} onClick={() => setFocus(focus === s.index ? null : s.index)} aria-pressed={focus === s.index} title={t("focusTitle")}>{s.index + 1}</button></th>
                        <td><code>{s.selector}</code>{s.pseudoElement && <> <span className="tcl-pill tcl-pill-warn">{t("pseudoElement", { name: s.pseudoElement })}</span></>}</td>
                        <td>{s.valid ? <span className={selClass(s)}>{t("matchCount", { n: s.count })}</span> : <span className="tcl-pill tcl-pill-bad">{t("invalid")}</span>}</td>
                        <td>{s.specificity ? <code>{s.specificity.join(",")}</code> : <span className="tcl-muted">·</span>}</td>
                        <td>
                          {!s.valid && s.error && <span className="tcl-finding-msg">{t(`error.${s.error.code}`, { at: s.error.at + 1 })}</span>}
                          {s.valid && s.notes.map((n, i) => <span key={i} className="tcl-finding-msg">{t(`note.${n.code}`, { what: n.what })} </span>)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="hmac-build-note">{t("selectorsNote")}</p>
          </section>

          {/* The matched elements, per selector. */}
          {r.selectors.some((s) => s.valid && s.count > 0) && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("matchesTitle")}</h4>
              <ol className="tcl-steps">
                {r.selectors.filter((s) => s.valid && s.count > 0 && (focus === null || focus === s.index)).map((s) => (
                  <li key={s.index} className="tcl-step">
                    <div className="tcl-step-head">
                      <span className="tcl-step-n">{s.index + 1}</span>
                      <code className="tcl-step-src">{s.selector}</code>
                      <span className="tcl-pill tcl-pill-true">{t("matchCount", { n: s.count })}</span>
                    </div>
                    <ul className="tcl-changes">
                      {s.matches.slice(0, 12).map((id) => {
                        const el = r.elements[id];
                        return <li key={id}><code>{el.path}</code>{el.line !== null && <span className="tcl-muted tcl-small"> {t("lineShort", { n: el.line })}</span>}{el.text && <span className="tcl-muted"> “{el.text}”</span>}</li>;
                      })}
                      {s.count > 12 && <li className="tcl-muted">{t("moreMatches", { n: s.count - 12 })}</li>}
                    </ul>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* The tree with highlights. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("treeTitle")}</h4>
            <p className="tcl-finding-msg">{focus === null ? t("treeIntroAll") : t("treeIntroOne", { n: focus + 1, selector: r.selectors[focus]?.selector ?? "" })}</p>
            <ol className="hsx-tree">
              {r.elements.map((el) => {
                // Highlighted when matched by the focused selector, or by any when none is focused.
                const hit = focus === null ? el.matchedBy.length > 0 : el.matchedBy.includes(focus);
                return (
                  <li key={el.id} className={`hsx-node${hit ? " cst-hit" : ""}${el.line === null ? " hsx-node-implied" : ""}`} style={{ "--hsx-depth": el.depth } as React.CSSProperties}>
                    <span className="hsx-line">{el.line === null ? "·" : el.line}</span>
                    <code className="hsx-tag">{"<"}{el.name}{el.attrs.map((a, i) => <span key={i} className="hsx-attr"> {attrText(a)}</span>)}{">"}</code>
                    {el.text && <span className="hsx-text">“{el.text}”</span>}
                    {el.matchedBy.length > 0 && <span className="cst-marks">{el.matchedBy.map((k) => <span key={k} className={`tcl-pill ${focus === null || focus === k ? "tcl-pill-true" : "tcl-pill-muted"}`}>{k + 1}</span>)}</span>}
                  </li>
                );
              })}
            </ol>
            {r.elementsTruncated && <p className="hmac-build-note">{t("treeTruncated")}</p>}
          </section>

          {/* Hand-offs and limits. */}
          <p className="hmac-build-note">
            {t("handoff")} <Link href="/tools/html-structure-explainer">{t("handoffTree")}</Link>, <Link href="/tools/css-specificity-calculator">{t("handoffSpecificity")}</Link>. {t("limits", { max: HTML_MAX_CHARS })}
          </p>
        </div>
      )}
    </div>
  );
}
