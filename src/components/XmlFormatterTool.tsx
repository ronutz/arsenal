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
//
// Share results (2026-11-01): a button under the verdict (or under the
// failing line) builds a link that carries the document as pasted and the
// three choices, with a caution line, after the XML decoder's secrets check
// (src/lib/tools/xml-formatter/share.ts): a credential blocks the link and
// the popover names its line. An arriving link (useShareArrival) fills the box
// and sets the choices as the reader would.
// ============================================================================

import { useMemo, useState } from "react"; // state and the memoised result
import { useTranslations } from "next-intl"; // this tool's messages
import { formatXml, SAML_COMPACT, type FormatOptions, type IndentStyle } from "@/lib/tools/xml-formatter"; // the engine and the Example
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { firstSharePlace } from "@/lib/share/text-secrets"; // the first finding and how many more places, for the popover
import type { ShareEncoding } from "@/lib/share/spec"; // what a spec encodes
import { checkXmlText } from "@/lib/tools/xml-decoder/share"; // the XML secrets check, shared with the XML decoder
import { XML_FORMATTER_SHARE, encodeXmlFormatterShare } from "@/lib/tools/xml-formatter/share"; // this tool's share spec: the box and the choices

/** Nothing to share (the button is disabled): a constant, so the button sees no change. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" };

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

  // An arriving share link: the text fills the box and the choices are set as the reader would set them.
  useShareArrival(XML_FORMATTER_SHARE, (s) => { setInput(s.input); setMode(s.mode); setIndent(s.indent); setKeepComments(s.comments === "keep"); }); // as pasted
  // The secrets check, once per change of the box, only when there is a verdict.
  const secrets = useMemo(() => (result ? checkXmlText(input) : null), [result, input]); // or null
  // What Share results carries: the box and the choices, or blocked by a credential (memoised).
  const share = useMemo<ShareEncoding>(() => (secrets ? encodeXmlFormatterShare({ input, mode, indent, comments: keepComments ? "keep" : "drop" }, secrets) : NOTHING), [secrets, input, mode, indent, keepComments]); // the encoding
  // The caution line: the first secret-looking name with its line, or the general caution.
  const maybe = secrets ? firstSharePlace(secrets.maybe) : null; // the first maybe-secret
  // One line.
  const caution = maybe ? t("share.maybeSecret", { line: maybe.line, label: maybe.label, more: maybe.more }) : t("share.caution");
  // The blocked line, naming the line.
  const blockedMessage = !share.ok && share.reason === "blocked" ? t("share.blockedSecret", { line: Number(share.values?.line ?? 0), label: String(share.values?.label ?? ""), more: Number(share.values?.more ?? 0) }) : ""; // only when blocked
  // The row: under the verdict, or under the failing line.
  const shareRow = (
    <div className="rdap-ask-row">
      <ShareResultsButton encoding={share} carries={t("share.carries")} details={[caution]} blockedMessage={blockedMessage} title={t("name")} />
    </div>
  ); // at the start of its own row

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
      {/* Share results: under the failing line (outside its alert), since the verdict is the reading. */}
      {result && !result.ok && shareRow}

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
          {/* Share results: under the verdict and its counts, at the start of its own row. */}
          {shareRow}
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
