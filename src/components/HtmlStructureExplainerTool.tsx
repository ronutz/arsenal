"use client";

// ============================================================================
// src/components/HtmlStructureExplainerTool.tsx
// ----------------------------------------------------------------------------
// THE HTML STRUCTURE & DOM EXPLAINER (page UI). Paste HTML; out comes the tree
// the parser builds (every node with its line and what the parser did to it),
// the parse errors by the standard's codes, the heading outline, the findings
// each tied to a sentence of the HTML Standard or WCAG 2.2, and what would have
// run and did not.
//
// All answers come from src/lib/tools/html-structure-explainer (parse5 plus the
// engine's reading of the tree); this component only lays them out and words
// them. Nothing is executed, fetched or rendered.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { run, VECTORS, NODE_LIST_MAX, HTML_MAX_CHARS, type HtmlStructureResult, type Finding, type TreeNode } from "@/lib/tools/html-structure-explainer";
import { TclPresets } from "@/components/TclTeachParts";

// D-83: the Example button loads a golden vector verbatim.
const EXAMPLE_ID = "table-foster-parenting";

// The vectors offered as presets (the whitespace-only vector stays a vector only).
const PRESET_IDS = ["table-foster-parenting", "misnested-formatting", "no-doctype-fragment", "legacy-doctype-and-obsolete", "headings-and-ids", "images-links-labels", "tokenizer-errors", "character-references", "raw-text-and-template", "svg-foreign-content", "misplaced-head-content", "javascript-inert", "clean-document"];

// How many characters of an attribute value the tree shows.
const ATTR_MAX = 60;

/** The page component. */
export default function HtmlStructureExplainerTool() {
  // This tool's words.
  const t = useTranslations("tools.html-structure-explainer");
  // The HTML.
  const [text, setText] = useState(VECTORS.find((v) => v.id === EXAMPLE_ID)!.input.html);
  // The preset currently loaded.
  const [active, setActive] = useState<string | undefined>(EXAMPLE_ID);
  // Whether the tree shows whitespace-free text nodes and comments (always) and attribute values in full (toggle).
  const [fullAttrs, setFullAttrs] = useState(false);
  // The reading.
  const out = useMemo((): { r?: HtmlStructureResult; error?: string } => {
    // Nothing to read.
    if (text.trim() === "") return {};
    // The engine refuses oversized input with a message.
    try { return { r: run({ html: text }) }; } catch (e) { return { error: (e as Error).message }; }
  }, [text]);
  // Load a preset.
  const pick = (id: string) => {
    // The vector.
    const v = VECTORS.find((x) => x.id === id);
    // Unknown ids do nothing.
    if (!v) return;
    // Its text.
    setText(v.input.html);
    // Mark it.
    setActive(id);
  };
  // The result.
  const r = out.r;
  // The message for a finding (variants keyed by params.what; the obsolete rules append the standard's advice).
  const messageFor = (f: Finding): string => {
    // The parameters as strings.
    const p = Object.fromEntries(Object.entries(f.params ?? {}).map(([k, v]) => [k, String(v)]));
    // The variant.
    const what = f.params && "what" in f.params ? `.${String(f.params.what)}` : "";
    // The base message.
    const base = t(`finding.${f.rule}${what}`, p);
    // The standard's advice for obsolete elements and attributes.
    if (f.rule === "D11") return `${base} ${t(`obsoleteElement.${p.advice}`)}`;
    if (f.rule === "D12") return `${base} ${t(`obsoleteAttribute.${p.group}`)}`;
    // Done.
    return base;
  };
  // Counts of findings by severity.
  const sev = (s: Finding["severity"]) => r?.findings.filter((f) => f.severity === s).length ?? 0;
  // One attribute, shown.
  const attrText = (a: { name: string; value: string }) => {
    // Cut long values unless asked for in full.
    const v = !fullAttrs && a.value.length > ATTR_MAX ? a.value.slice(0, ATTR_MAX - 1) + "…" : a.value;
    // Boolean attributes have no value.
    return a.value === "" ? a.name : `${a.name}="${v}"`;
  };
  // A node's pills.
  const pills = (n: TreeNode) => {
    // Collect.
    const out: { cls: string; text: string }[] = [];
    // The parser created it.
    if (n.implied) out.push({ cls: "tcl-pill-warn", text: t("pill.implied") });
    // The parser supplied the end tag.
    if (n.closing === "omitted") out.push({ cls: "tcl-pill-muted", text: t("pill.omitted") });
    // A void element.
    if (n.closing === "void") out.push({ cls: "tcl-pill-muted", text: t("pill.void") });
    // Self-closing foreign element.
    if (n.closing === "self-closing") out.push({ cls: "tcl-pill-muted", text: t("pill.selfClosing") });
    // A piece of a split element.
    if (n.piece !== null) out.push({ cls: "tcl-pill-warn", text: t("pill.piece", { n: n.piece }) });
    // Moved by foster parenting.
    if (n.fostered) out.push({ cls: "tcl-pill-warn", text: t("pill.fostered") });
    // Obsolete.
    if (n.obsolete) out.push({ cls: "tcl-pill-bad", text: t("pill.obsolete") });
    // Namespace.
    if (n.ns === "svg" || n.ns === "mathml") out.push({ cls: "tcl-pill-value", text: n.ns === "svg" ? "svg" : "mathml" });
    // Template content.
    if (n.inTemplate) out.push({ cls: "tcl-pill-value", text: t("pill.template") });
    // Done.
    return out;
  };
  // Draw.
  return (
    <div className="cidr-tool jwt-tool tcl-tool">
      {/* The HTML, with the Example / Clear buttons (D-83). */}
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="hsx-src">{t("htmlLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => pick(EXAMPLE_ID)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => { setText(""); setActive(undefined); }}>{t("clear")}</button>
          </div>
        </div>
        <textarea id="hsx-src" className="cidr-input mono json-input" rows={10} value={text} onChange={(e) => { setText(e.target.value); setActive(undefined); }} placeholder={t("placeholder")} spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="off" />
      </div>
      <TclPresets items={PRESET_IDS.map((id) => ({ id, label: t(`preset.${id}`) }))} label={t("presetsLabel")} onPick={pick} active={active} />

      {/* An oversized input. */}
      {out.error && <p className="tcl-verdict tcl-verdict-bad" role="status">{out.error}</p>}

      {/* The reading. */}
      {r && (
        <div className="jwt-results" aria-live="polite">
          {/* The verdict: mode, counts, errors, findings. */}
          <div className={sev("error") > 0 || r.errors.length > 0 ? "tcl-verdict tcl-verdict-warn" : "tcl-verdict tcl-verdict-ok"}>
            <p>
              <span className="tcl-verdict-label">{t(`mode.${r.mode}`)}</span>{" "}
              {t("summary", { elements: r.counts.elements, texts: r.counts.texts, comments: r.counts.comments, depth: r.counts.maxDepth, lines: r.counts.lines })}
            </p>
            <p>
              {t("errorsSummary", { n: r.errors.length })}{" "}
              {t("findingsSummary", { errors: sev("error"), warnings: sev("warning"), notes: sev("info") })}
            </p>
          </div>

          {/* The facts the head gives. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("factsTitle")}</h4>
            <dl className="tcl-pairs">
              <dt className="tcl-pairs-name">{t("fact.doctype")}</dt>
              <dd className="tcl-pairs-value">{r.doctype ? <code>{`<!DOCTYPE ${r.doctype.name}${r.doctype.publicId ? ` PUBLIC "${r.doctype.publicId}"` : ""}${r.doctype.systemId ? ` "${r.doctype.systemId}"` : ""}>`}</code> : <span className="tcl-muted">{t("absent")}</span>}</dd>
              <dt className="tcl-pairs-name">{t("fact.mode")}</dt>
              <dd className="tcl-pairs-value"><span className={`tcl-pill ${r.mode === "no-quirks" ? "tcl-pill-true" : "tcl-pill-warn"}`}>{r.mode}</span> {t(`modeNote.${r.mode}`)}</dd>
              <dt className="tcl-pairs-name">{t("fact.title")}</dt>
              <dd className="tcl-pairs-value">{r.title !== null && r.title !== "" ? r.title : <span className="tcl-muted">{t("absent")}</span>}</dd>
              <dt className="tcl-pairs-name">{t("fact.lang")}</dt>
              <dd className="tcl-pairs-value">{r.lang !== null && r.lang !== "" ? <code>{r.lang}</code> : <span className="tcl-muted">{t("absent")}</span>}</dd>
              <dt className="tcl-pairs-name">{t("fact.charset")}</dt>
              <dd className="tcl-pairs-value">{r.charset !== null ? <code>{r.charset}</code> : <span className="tcl-muted">{t("absent")}</span>}</dd>
              <dt className="tcl-pairs-name">{t("fact.topNames")}</dt>
              <dd className="tcl-pairs-value">{r.topNames.map((x) => <span key={x.name} className="tcl-pill tcl-pill-value"><code>{x.name}</code> {x.n}</span>)}</dd>
            </dl>
          </section>

          {/* The tree. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("treeTitle")}</h4>
            <p className="tcl-finding-msg">{t("treeIntro", { implied: r.counts.implied, omitted: r.counts.omitted, pieces: r.counts.pieces, fostered: r.counts.fostered, whitespace: r.counts.whitespaceTexts })}</p>
            <div className="dig-input-actions">
              <button type="button" className="b64-copy" onClick={() => setFullAttrs((v) => !v)} aria-pressed={fullAttrs}>{fullAttrs ? t("attrsCut") : t("attrsFull")}</button>
            </div>
            <ol className="hsx-tree">
              {r.nodes.map((n) => (
                <li key={n.id} className={`hsx-node hsx-node-${n.kind}${n.implied ? " hsx-node-implied" : ""}`} style={{ "--hsx-depth": n.depth } as React.CSSProperties}>
                  <span className="hsx-line">{n.line === null ? "·" : n.line}</span>
                  {n.kind === "element" && (
                    <code className="hsx-tag">
                      {"<"}{n.name}
                      {n.attrs.map((a, i) => <span key={i} className="hsx-attr"> {attrText(a)}</span>)}
                      {">"}
                    </code>
                  )}
                  {n.kind === "text" && <span className="hsx-text">“{n.text}”</span>}
                  {n.kind === "comment" && <code className="hsx-comment">{`<!--${n.text}-->`}</code>}
                  {n.kind === "doctype" && <code className="hsx-tag">{n.text}</code>}
                  {pills(n).map((p, i) => <span key={i} className={`tcl-pill ${p.cls}`}>{p.text}</span>)}
                </li>
              ))}
            </ol>
            {r.nodesTruncated && <p className="hmac-build-note">{t("treeTruncated", { n: NODE_LIST_MAX })}</p>}
            <p className="hmac-build-note">{t("treeLegend")}</p>
          </section>

          {/* The parse errors. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("errorsTitle", { n: r.errors.length })}</h4>
            {r.errors.length === 0 ? <p className="tcl-finding-msg">{t("noErrors")}</p> : (
              <div className="tcl-table-wrap">
                <table className="tcl-table">
                  <thead><tr><th scope="col">{t("colWhere")}</th><th scope="col">{t("colCode")}</th><th scope="col">{t("colMeaning")}</th></tr></thead>
                  <tbody>
                    {r.errors.map((e, i) => (
                      <tr key={i}>
                        <th scope="row">{e.line}:{e.col}</th>
                        <td><code>{e.code}</code> <span className={`tcl-pill ${e.named === "standard" ? "tcl-pill-value" : "tcl-pill-muted"}`}>{t(`named.${e.named}`)}</span></td>
                        <td>{t(`error.${e.code}`)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="hmac-build-note">{t("errorsNote")}</p>
          </section>

          {/* The outline. */}
          {r.headings.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("outlineTitle")}</h4>
              <ol className="hsx-tree">
                {r.headings.map((h, i) => (
                  <li key={i} className="hsx-node hsx-node-heading" style={{ "--hsx-depth": h.level - 1 } as React.CSSProperties}>
                    <span className="hsx-line">{h.line ?? "·"}</span>
                    <span className={`tcl-pill ${h.jump ? "tcl-pill-bad" : "tcl-pill-value"}`}>h{h.level}</span>
                    <span className="hsx-text">{h.text === "" ? <span className="tcl-muted">{t("emptyHeading")}</span> : h.text}</span>
                    {h.jump && <span className="tcl-pill tcl-pill-bad">{t("pill.jump")}</span>}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* The findings. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("findingsTitle", { n: r.findings.length })}</h4>
            {r.findings.length === 0 ? <p className="tcl-finding-msg">{t("noFindings")}</p> : (
              <ol className="tcl-findings">
                {r.findings.map((f, i) => (
                  <li key={i} className={`tcl-finding tcl-finding-${f.severity}`}>
                    <div className="tcl-finding-head">
                      <span className={`irl-sev irl-sev-${f.severity === "error" ? "high" : f.severity}`}>{t(`sev.${f.severity}`)}</span>
                      <span className="tcl-rule">{f.rule}</span>
                      {f.line !== null && <span className="tcl-muted tcl-small">{t("lineShort", { n: f.line })}</span>}
                      <span className="tcl-finding-title">{t(`ruleName.${f.rule}`)}</span>
                    </div>
                    {f.snippet && <code className="tcl-finding-snippet">{f.snippet}</code>}
                    <p className="tcl-finding-msg">{messageFor(f)}</p>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* What did not run. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("inertTitle")}</h4>
            <dl className="tcl-pairs">
              <dt className="tcl-pairs-name">{t("inert.scripts")}</dt>
              <dd className="tcl-pairs-value">{t("inert.scriptsValue", { n: r.inert.scripts, external: r.inert.externalScripts })}</dd>
              <dt className="tcl-pairs-name">{t("inert.handlers")}</dt>
              <dd className="tcl-pairs-value">{r.inert.inlineHandlers}</dd>
              <dt className="tcl-pairs-name">{t("inert.urls")}</dt>
              <dd className="tcl-pairs-value">{r.inert.javascriptUrls}</dd>
              <dt className="tcl-pairs-name">{t("inert.styles")}</dt>
              <dd className="tcl-pairs-value">{r.inert.styles}</dd>
              <dt className="tcl-pairs-name">{t("inert.iframes")}</dt>
              <dd className="tcl-pairs-value">{r.inert.iframes}</dd>
            </dl>
            <p className="hmac-build-note">{t("inertNote")}</p>
          </section>

          {/* Limits. */}
          <p className="hmac-build-note">{t("limits", { max: HTML_MAX_CHARS })}</p>
        </div>
      )}
    </div>
  );
}
