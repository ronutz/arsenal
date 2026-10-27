"use client";

// ============================================================================
// src/components/TcpdumpFilterExplainerTool.tsx
// ----------------------------------------------------------------------------
// Paste a tcpdump command line or a bare capture filter: the engine
// (src/lib/tools/tcpdump-filter-explainer) explains every option, parses the
// filter into a tree, makes the implicit defaults and inherited qualifiers
// explicit, shows how the operators grouped, decodes byte-offset tests, and
// places every error at its position. This component only renders. The
// explanations come from the engine in English and Portuguese; the page picks
// the reader's language. Chrome strings are in the message pack.
// Styling reuses the established vocabulary (cidr-* input, dig-* input head and
// rows, jwt-* panels, tcl-* tree, notes, tables and pills, json-error-* box):
// no new CSS classes.
// ============================================================================

import { useMemo, useState, type ReactNode } from "react"; // state and memo
import { useLocale, useTranslations } from "next-intl"; // locale and messages
import { Link } from "@/i18n/navigation"; // locale-aware links
import {
  explain, // the engine
  TcpdumpExplainerError, // its typed refusal
  ACCEPT_VECTORS, // the golden vectors, for the Example button (D-83)
  PAGE_VERSIONS, // the releases the explanations follow, and the development versions they mention
  type TcpdumpExplanation, // the result
  type XNode, // an explained node
  type XArith, // an explained arithmetic node
  type Note, // a remark
  type Bi, // a bilingual sentence
} from "@/lib/tools/tcpdump-filter-explainer";

// D-83 Example: the golden vector "example-syn-without-ack", byte for byte (a SYN-without-ACK capture on one host and port).
const EXAMPLE = ACCEPT_VECTORS.find((v) => v.id === "example-syn-without-ack")?.input ?? ""; // the vector's input

/** A label/value row (the dig explainer's row classes). */
function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="dig-row">
      {/* The label. */}
      <span className="dig-row-label">{label}</span>
      {/* The value. */}
      <span className={mono ? "dig-row-value dig-mono" : "dig-row-value"}>{value}</span>
    </div>
  );
}

export default function TcpdumpFilterExplainerTool() {
  const t = useTranslations("tools.tcpdump-filter-explainer"); // this tool's messages
  const pt = useLocale() === "pt-BR"; // Portuguese explanations when the page is pt-BR
  const L = (b: Bi | Note) => (pt ? b.pt : b.en); // pick the reader's language
  const [input, setInput] = useState(""); // the pasted text

  // The explanation: pure, so the same text always gives the same result.
  const result = useMemo((): { r: TcpdumpExplanation | null; refused: string | null } => {
    if (input.trim() === "") return { r: null, refused: null }; // nothing pasted
    try { return { r: explain(input), refused: null }; } // explained
    catch (e) { return { r: null, refused: e instanceof TcpdumpExplainerError ? e.code : "tooLong" }; } // refused as a whole
  }, [input]);
  const r = result.r; // shorthand

  /** A list of notes, flagged when they are errors. */
  const notes = (list: Note[], flag = false): ReactNode =>
    list.length === 0 ? null : (
      <ul className="tcl-notes">
        {/* One item per note, with the document it rests on. */}
        {list.map((n, i) => <li key={`${n.code}-${i}`} className={flag ? "tcl-note tcl-note-flag" : "tcl-note"}>{L(n)} <span className="dig-meaning">({t(`sources.${n.source}`)})</span></li>)}
      </ul>
    );

  /** An arithmetic node and its operands; parentheses are shown through to what they hold. */
  const arith = (a: XArith, key: string): ReactNode => a.kind === "paren" && a.children.length === 1 ? arith(a.children[0], key) : (
    <li key={key} className={a.errors.length ? "tcl-node tcl-node-error" : "tcl-node"}>
      {/* The source and, for a constant, its value. */}
      <div className="tcl-node-head">
        <code className="tcl-node-src">{a.text}</code>
        {a.value !== null && <><span className="tcl-node-arrow" aria-hidden="true">&#8594;</span><code className="tcl-pill tcl-pill-value">{a.value}</code></>}
      </div>
      {/* What it computes, its notes and errors. */}
      <ul className="tcl-node-notes">
        <li>{L(a.meaning)}</li>
        {a.notes.map((n, i) => <li key={`n${i}`}>{L(n)}</li>)}
        {a.errors.map((n, i) => <li key={`e${i}`} className="tcl-node-platform">{L(n)}</li>)}
      </ul>
      {/* Operands, nested; a constant or len has none. */}
      {a.children.length > 0 && <ol className="tcl-tree-kids">{a.children.map((c, i) => arith(c, `${key}.${i}`))}</ol>}
    </li>
  );

  /** A node of the Boolean tree and its children. */
  const node = (n: XNode, key: string): ReactNode => (
    <li key={key} className={n.errors.length ? "tcl-node tcl-node-error" : "tcl-node"}>
      {/* The node's line: its source text, its kind, and whether its qualifiers were inherited. */}
      <div className="tcl-node-head">
        <code className="tcl-node-src">{n.kind === "and" || n.kind === "or" || n.kind === "not" || n.kind === "group" ? n.label : n.text}</code>
        <span className="tcl-pill tcl-pill-muted">{t(`kinds.${n.kind}`)}</span>
        {n.inherited && n.qualifiers && <span className="tcl-held">{t("filter.inherited", { words: n.qualifiers })}</span>}
      </div>
      {/* The meaning, the defaults made explicit, the notes and the errors. */}
      <ul className="tcl-node-notes">
        <li>{L(n.meaning)}</li>
        {n.explicit && <li>{t("filter.explicit")} <code>{n.explicit}</code></li>}
        {n.notes.map((x, i) => <li key={`n${i}`}>{L(x)}</li>)}
        {n.errors.map((x, i) => <li key={`e${i}`} className="tcl-node-platform">{L(x)}</li>)}
      </ul>
      {/* A relation's two arithmetic sides. */}
      {n.left && n.right && <ol className="tcl-tree-kids">{arith(n.left, `${key}.l`)}{arith(n.right, `${key}.r`)}</ol>}
      {/* Child nodes, nested. */}
      {n.children.length > 0 && <ol className="tcl-tree-kids">{n.children.map((c, i) => node(c, `${key}.${i}`))}</ol>}
    </li>
  );

  const f = r?.filter ?? null; // the filter explanation
  const c = r?.command ?? null; // the command explanation

  return (
    <div className="cidr-tool jwt-tool tcpdump-explainer">
      {/* -- input -- */}
      <div className="dig-input-head">
        <label htmlFor="tcpdx-in" className="cidr-label">{t("input.label")}</label>
        <div className="dig-input-actions">
          {/* D-83 Example/Clear row: the sample is a golden vector, byte for byte. */}
          <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("input.example")}</button>
          <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("input.clear")}</button>
        </div>
      </div>
      <textarea
        id="tcpdx-in"
        className="cidr-input dig-textarea mono"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={t("input.placeholder")}
        spellCheck={false}
        rows={4}
      />
      <p className="cidr-privacy"><span className="cidr-lock" aria-hidden="true">&#128274;</span> {t("privacy")}</p>

      {/* -- the whole input refused -- */}
      {result.refused && <p className="cidr-error" role="alert">{t(`refused.${result.refused}`)}</p>}

      {r && (
        <div className="jwt-results dig-results">
          {/* -- what was recognised, and against which pages -- */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("summary.title")}</h4>
            <Row label={t("summary.mode")} value={t(r.mode === "command" ? "summary.modeCommand" : "summary.modeFilter")} />
            <p className="dig-meaning">{t("summary.versions", { tcpdump: PAGE_VERSIONS.tcpdump, libpcapStable: PAGE_VERSIONS.libpcapStable, libpcapTesting: PAGE_VERSIONS.libpcapTesting, tcpdumpDev: PAGE_VERSIONS.tcpdumpDev, libpcapDev: PAGE_VERSIONS.libpcapDev })}</p>
            {notes(r.shellNotes, true)}
          </section>

          {/* -- the command line -- */}
          {c && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("command.title")}</h4>
              {c.prefix.map((p) => <Row key={p.word} label={p.word} value={L(p.meaning)} />)}
              <Row label={t("command.program")} value={c.program ?? t("command.noProgram")} mono />
              <Row label={t("command.expressionFrom")} value={t(`command.from.${c.expressionFrom}`)} />
              {c.options.length > 0 && (
                <div className="tcl-table-wrap">
                  {/* Stacked one block per row on a phone (tcl-table-stack); the roles keep it a table for screen readers then. */}
                  <table className="tcl-table tcl-table-stack" role="table">
                    <thead role="rowgroup">
                      <tr role="row">
                        <th role="columnheader">{t("command.option")}</th>
                        <th role="columnheader">{t("command.argument")}</th>
                        <th role="columnheader">{t("command.meaning")}</th>
                      </tr>
                    </thead>
                    <tbody role="rowgroup">
                      {c.options.map((o, i) => (
                        <tr key={`${o.raw}-${i}`} role="row">
                          {/* The option as written, and its canonical flag. */}
                          <th role="rowheader"><code>{o.raw}</code>{o.count > 1 ? ` (${t("command.times", { n: o.count })})` : ""}</th>
                          {/* Its argument. */}
                          {/* Its argument, labelled with the column head when the row is stacked; empty cells are hidden then. */}
                          <td role="cell" data-label={t("command.argument")}>{o.arg !== null ? <code>{o.arg}</code> : null}</td>
                          {/* What it does, its notes and its problems. */}
                          <td role="cell">{L(o.meaning)}{notes(o.notes)}{notes(o.errors, true)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {notes(c.notes)}
              {notes(c.errors, true)}
            </section>
          )}

          {/* -- the filter -- */}
          {f && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("filter.title")}</h4>
              {/* The filter as typed; it wraps on a narrow screen instead of scrolling (tcpdump-explainer rule). */}
              <pre className="dig-mono">{f.text}</pre>
              {f.empty && <p className="dig-meaning">{t("filter.empty")}</p>}
              {/* A rejection before analysis: where, why, and the likely cause. */}
              {f.error && (
                <div className="json-error-box" role="alert">
                  <p className="json-error-headline">{t("filter.errorTitle", { pos: f.error.start + 1 })}</p>
                  <pre className="mono">{f.text}{"\n"}{" ".repeat(Math.min(f.error.start, f.text.length))}{"^".repeat(Math.max(1, Math.min(f.error.end - f.error.start, 40)))}</pre>
                  <p>{pt ? f.error.pt : f.error.en}</p>
                  {notes(f.error.hints)}
                </div>
              )}
              {/* An accepted parse: the verdict, the rewrite, the tree. */}
              {f.tree && (
                <>
                  <p className={f.ok ? "tcl-note" : "tcl-note tcl-note-flag"}>{t(f.ok ? "filter.ok" : "filter.notOk", { n: f.semanticErrors.length })}</p>
                  {f.canonical && <Row label={t("filter.canonical")} value={f.canonical} mono />}
                  <p className="dig-meaning">{t("filter.canonicalHelp")}</p>
                  <h4 className="jwt-panel-title">{t("filter.tree")}</h4>
                  <p className="dig-meaning">{t("filter.treeHelp")}</p>
                  <ol className="tcl-tree">{node(f.tree, "0")}</ol>
                  {f.semanticErrors.length > 0 && (
                    <>
                      <h4 className="jwt-panel-title">{t("filter.errors")}</h4>
                      <ul className="tcl-notes">
                        {/* Each refusal with its position in the expression. */}
                        {f.semanticErrors.map((e, i) => <li key={`${e.code}-${i}`} className="tcl-note tcl-note-flag"><code>{f.text.slice(e.start, e.end)}</code> {t("filter.at", { pos: e.start + 1 })}: {pt ? e.pt : e.en}</li>)}
                      </ul>
                    </>
                  )}
                </>
              )}
              {f.notes.length > 0 && <h4 className="jwt-panel-title">{t("filter.notes")}</h4>}
              {notes(f.notes)}
            </section>
          )}
        </div>
      )}

      {/* -- the builders this explainer complements (always shown) -- */}
      <p className="dig-meaning">
        {t("related.body")}{" "}
        <Link href="/tools/f5-bigip-tcpdump-builder">{t("related.f5")}</Link>{" · "}
        <Link href="/tools/fortios-sniffer-builder">{t("related.fortios")}</Link>
      </p>
    </div>
  );
}
