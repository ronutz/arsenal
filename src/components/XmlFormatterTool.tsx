"use client";

// ============================================================================
// src/components/XmlFormatterTool.tsx
// ----------------------------------------------------------------------------
// UI for the XML formatter-validator. Paste an XML document; choose pretty or
// minify, the indent (two spaces, four spaces or a tab) and whether comments
// are kept. The verdict comes first: well-formed, or the line, the column, the
// stable code, a plain message and the failing line with a caret under the
// column. When the document is well-formed the formatted text follows with a
// Copy button, the notes (a removed byte order mark, normalised line breaks, a
// DOCTYPE kept as text, entity names that could not be checked, an ignored
// xml:space value), and counts that say what was and was not reformatted.
//
// The engine (src/lib/tools/xml-formatter) does all the work, in the browser;
// this component only renders it. Styling reuses the JSON formatter's class
// vocabulary (json-controls, json-error-box, json-output, json-stats ...) and
// the shared input stack; no new CSS class.
// ============================================================================

import { useMemo, useState } from "react"; // state and the memoised result
import { useTranslations } from "next-intl"; // this tool's messages
import { formatXml, SAML_COMPACT, type FormatOptions, type IndentStyle } from "@/lib/tools/xml-formatter"; // the engine and the Example

// D-83 Example: verbatim the input of the golden vectors saml-pretty-2, -4 and -tab (a SAML-like Response on one
// line, as it arrives from a binding), imported from the vector file itself so the two cannot drift.
const EXAMPLE = SAML_COMPACT; // the sample

/** The XML formatter-validator. */
export default function XmlFormatterTool() {
  const t = useTranslations("tools.xml-formatter"); // this tool's messages

  const [input, setInput] = useState(""); // the pasted document
  const [mode, setMode] = useState<FormatOptions["mode"]>("pretty"); // pretty or minify
  const [indent, setIndent] = useState<IndentStyle>(2); // two spaces, four spaces or a tab
  const [keepComments, setKeepComments] = useState(true); // keep or drop comments
  const [copied, setCopied] = useState(false); // the Copy button's feedback

  // The engine runs on every change; it never throws, and an empty box shows nothing.
  const result = useMemo(() => {
    if (!input.trim()) return null; // nothing to check yet
    return formatXml(input, { mode, indent, comments: keepComments ? "keep" : "drop" }); // the verdict and the output
  }, [input, mode, indent, keepComments]); // recomputed when any of them changes

  /** Copy the output to the clipboard and say so for a moment. */
  function copy() {
    if (!result?.output) return; // nothing to copy
    navigator.clipboard?.writeText(result.output).then(
      () => {
        setCopied(true); // show "Copied"
        setTimeout(() => setCopied(false), 1500); // then back to "Copy"
      },
      () => {}, // a refused clipboard changes nothing on the page
    ); // writeText
  } // copy

  /** The caret line under the excerpt: tabs kept as tabs so the caret lines up, everything else a space. */
  const caretLine = (excerpt: string, column: number): string =>
    Array.from(excerpt).slice(0, column - 1).map((c) => (c === "\t" ? "\t" : " ")).join("") + "^"; // the pad, then the caret

  return (
    <div className="cidr-tool jwt-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="xmlfmt-input">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            {/* D-83 Example/Clear row: the sample is the golden vectors' own input. */}
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>
              {t("example")}
            </button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>
              {t("clear")}
            </button>
          </div>
        </div>
        <textarea
          id="xmlfmt-input"
          className="cidr-input mono saml-textarea json-input"
          rows={10}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("inputPlaceholder")}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-describedby="xmlfmt-privacy"
        />
        <p id="xmlfmt-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            ●
          </span>{" "}
          {t("runsLocally")}
        </p>
      </div>

      {/* The three choices. */}
      <div className="json-controls" role="group" aria-label={t("controlsLabel")}>
        <div className="json-control">
          <span className="json-control-label">{t("controls.mode")}</span>
          <div className="json-segmented">
            <button type="button" className={`json-seg${mode === "pretty" ? " is-active" : ""}`} onClick={() => setMode("pretty")} aria-pressed={mode === "pretty"}>
              {t("modePretty")}
            </button>
            <button type="button" className={`json-seg${mode === "minify" ? " is-active" : ""}`} onClick={() => setMode("minify")} aria-pressed={mode === "minify"}>
              {t("modeMinify")}
            </button>
          </div>
        </div>

        <div className="json-control">
          <label className="json-control-label" htmlFor="xmlfmt-indent">
            {t("controls.indent")}
          </label>
          <select
            id="xmlfmt-indent"
            className="json-select"
            value={String(indent)}
            disabled={mode === "minify"}
            onChange={(e) => setIndent(e.target.value === "tab" ? "tab" : e.target.value === "4" ? 4 : 2)}
          >
            <option value="2">{t("indentSpaces", { n: 2 })}</option>
            <option value="4">{t("indentSpaces", { n: 4 })}</option>
            <option value="tab">{t("indentTab")}</option>
          </select>
        </div>

        <div className="json-control">
          <label className="json-checkbox">
            <input type="checkbox" checked={keepComments} onChange={(e) => setKeepComments(e.target.checked)} />
            {t("controls.comments")}
          </label>
        </div>
      </div>

      {/* Not well-formed: where, why, and the line itself. */}
      {result && !result.ok && result.error && (
        <div className="json-error-box" role="alert">
          <p className="json-error-headline">{t("errorTitle")}</p>
          <p className="json-error-location">
            {t("errorLocation", { line: result.error.line, column: result.error.column })}
            <span className="json-error-pointer">{t("errorCode", { code: result.error.code })}</span>
          </p>
          <p className="json-error-message">{t(`errors.${result.error.code}`, result.error.params)}</p>
          {result.error.excerpt !== "" && (
            <pre className="json-output mono" aria-label={t("excerptLabel")}>
              {result.error.excerpt + "\n" + caretLine(result.error.excerpt, result.error.excerptColumn)}
            </pre>
          )}
        </div>
      )}

      {/* Well-formed: the verdict and counts, the notes, then the output. */}
      {result && result.ok && (
        <div className="jwt-results">
          {/* The verdict first, with the counts that say what was and was not reformatted. */}
          {result.stats && (
            <p className="json-stats">
              {t("verdictOk")}
              <span className="json-stat">{t("statElements", { n: result.stats.elements })}</span>
              <span className="json-stat">{t("statAttributes", { n: result.stats.attributes })}</span>
              <span className="json-stat">{t("statDepth", { n: result.stats.maxDepth })}</span>
              <span className="json-stat">{t("statWhitespace", { n: result.stats.insignificantWhitespaceNodes })}</span>
              <span className="json-stat">{t("statMixed", { n: result.stats.mixedContentElements })}</span>
              {result.stats.preserveElements > 0 && <span className="json-stat">{t("statPreserve", { n: result.stats.preserveElements })}</span>}
              {result.stats.comments > 0 && <span className="json-stat">{t("statComments", { n: result.stats.comments, dropped: result.stats.commentsDropped })}</span>}
              {result.stats.cdataSections > 0 && <span className="json-stat">{t("statCdata", { n: result.stats.cdataSections })}</span>}
              {result.stats.processingInstructions > 0 && <span className="json-stat">{t("statPis", { n: result.stats.processingInstructions })}</span>}
            </p>
          )}
          {result.notes.length > 0 && (
            <section className="json-warn-box">
              <p className="json-warn-headline">{t("notesTitle")}</p>
              <ul className="json-warn-list">
                {result.notes.map((n) => (
                  <li key={n}>{t(`notes.${n}`)}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="jwt-panel">
            <div className="json-output-head">
              <h4 className="jwt-panel-title">{mode === "pretty" ? t("outputTitlePretty") : t("outputTitleMinify")}</h4>
              <button type="button" className="json-copy-btn" onClick={copy}>
                {copied ? t("copied") : t("copy")}
              </button>
            </div>
            <pre className="json-output mono" aria-label={mode === "pretty" ? t("outputTitlePretty") : t("outputTitleMinify")}>
              {result.output}
            </pre>
            {/* What a formatter may change, and why a signed document must stay as it is. */}
            <p className="cipher-note">{t("whatChanged")}</p>
            <p className="cipher-note">{t("signedNote")}</p>
          </section>
        </div>
      )}
    </div>
  );
}
