"use client";

// ============================================================================
// src/components/JsonFormatterTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE JSON FORMATTER & VALIDATOR.
//
// Paste JSON; choose pretty-print or minify, the indent width, and whether to
// sort keys. Output updates live. On a parse error you get the exact line,
// column, and JSON Pointer path with a readable message. Duplicate keys are
// surfaced as warnings, and a small stat line summarizes the document.
//
// All parsing and formatting run IN THE BROWSER via the local module.
//
// Share results (2026-11-01): a button first in the reading (or under the
// parse error) builds a link that carries the box as pasted and the three
// choices, with a caution line, after the JSON and YAML secrets check
// (src/lib/tools/json-formatter/share-secrets.ts): a credential blocks the
// link and the popover names its line. An arriving link (useShareArrival)
// fills the box and sets the choices as the reader would.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { formatJson, type FormatOptions, type IndentStyle } from "@/lib/tools/json-formatter";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { firstSharePlace } from "@/lib/share/text-secrets"; // the first finding and how many more places, for the popover
import type { ShareEncoding } from "@/lib/share/spec"; // what a spec encodes
import { checkStructuredText } from "@/lib/tools/json-formatter/share-secrets"; // the JSON and YAML secrets check
import { JSON_FORMATTER_SHARE, encodeJsonFormatterShare } from "@/lib/tools/json-formatter/share"; // this tool's share spec: the box and the choices

/** Nothing to share (the button is disabled): a constant, so the button sees no change. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" };

// D-83 Example samples — verbatim from this tool's golden vectors.
const EXAMPLE = "  42  ";

export default function JsonFormatterTool() {
  const t = useTranslations("tools.json-formatter");

  const [input, setInput] = useState("");
  const [mode, setMode] = useState<FormatOptions["mode"]>("pretty");
  const [indent, setIndent] = useState<IndentStyle>(2);
  const [sortKeys, setSortKeys] = useState(false);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!input.trim()) return null;
    return formatJson(input, { mode, indent, sortKeys });
  }, [input, mode, indent, sortKeys]);

  // An arriving share link: the text fills the box and the choices are set as the reader would set them.
  useShareArrival(JSON_FORMATTER_SHARE, (s) => { setInput(s.input); setMode(s.mode); setIndent(s.indent); setSortKeys(s.sortKeys); }); // as pasted
  // The secrets check, once per change of the box, only when there is a verdict.
  const secrets = useMemo(() => (result ? checkStructuredText(input) : null), [result, input]); // or null
  // What Share results carries: the box and the choices, or blocked by a credential (memoised).
  const share = useMemo<ShareEncoding>(() => (secrets ? encodeJsonFormatterShare({ input, mode, indent, sortKeys }, secrets) : NOTHING), [secrets, input, mode, indent, sortKeys]); // the encoding
  // The caution line: the first secret-looking name with its line, or the general caution.
  const maybe = secrets ? firstSharePlace(secrets.maybe) : null; // the first maybe-secret
  // One line.
  const caution = maybe ? t("share.maybeSecret", { line: maybe.line, label: maybe.label, more: maybe.more }) : t("share.caution");
  // The blocked line, naming the line.
  const blockedMessage = !share.ok && share.reason === "blocked" ? t("share.blockedSecret", { line: Number(share.values?.line ?? 0), label: String(share.values?.label ?? ""), more: Number(share.values?.more ?? 0) }) : ""; // only when blocked
  // The row: first in the reading, or under the parse error.
  const shareRow = (
    <div className="rdap-ask-row">
      <ShareResultsButton encoding={share} carries={t("share.carries")} details={[caution]} blockedMessage={blockedMessage} title={t("name")} />
    </div>
  ); // at the start of its own row

  function copy() {
    if (!result?.output) return;
    navigator.clipboard?.writeText(result.output).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => {},
    );
  }

  const pointerLabel = (p: string) => (p === "" ? t("rootPointer") : p);

  return (
    <div className="cidr-tool jwt-tool saml-tool json-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="json-input">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
          </div>
        </div>
        <textarea
          id="json-input"
          className="cidr-input mono saml-textarea json-input"
          rows={8}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("inputPlaceholder")}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-describedby="json-privacy"
        />
        <p id="json-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            ●
          </span>
          {t("runsLocally")}
        </p>
      </div>

      {/* Controls */}
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
          <label className="json-control-label" htmlFor="json-indent">
            {t("controls.indent")}
          </label>
          <select
            id="json-indent"
            className="json-select"
            value={String(indent)}
            disabled={mode === "minify"}
            onChange={(e) => setIndent(e.target.value === "tab" ? "tab" : (Number(e.target.value) as IndentStyle))}
          >
            <option value="2">{t("indentSpaces", { n: 2 })}</option>
            <option value="3">{t("indentSpaces", { n: 3 })}</option>
            <option value="4">{t("indentSpaces", { n: 4 })}</option>
            <option value="tab">{t("indentTab")}</option>
          </select>
        </div>

        <div className="json-control">
          <label className="json-checkbox">
            <input type="checkbox" checked={sortKeys} onChange={(e) => setSortKeys(e.target.checked)} />
            {t("controls.sortKeys")}
          </label>
        </div>
      </div>

      {/* Error */}
      {result && !result.ok && result.error && (
        <div className="json-error-box" role="alert">
          <p className="json-error-headline">{t("errorTitle")}</p>
          <p className="json-error-location">
            {t("errorLocation", { line: result.error.line, column: result.error.column })}
            <span className="json-error-pointer">{t("errorAt", { pointer: pointerLabel(result.error.pointer) })}</span>
          </p>
          <p className="json-error-message">{result.error.message}</p>
        </div>
      )}
      {/* Share results: under the parse error (outside its alert), since the error is the reading. */}
      {result && !result.ok && shareRow}

      {/* Valid output */}
      {result && result.ok && (
        <div className="jwt-results saml-results json-results">
          {/* Share results: first in the reading (the output can run long), at the start of its own row. */}
          {shareRow}
          {/* Duplicate-key warnings */}
          {result.duplicateKeys.length > 0 && (
            <section className="json-warn-box">
              <p className="json-warn-headline">{t("duplicatesTitle", { count: result.duplicateKeys.length })}</p>
              <ul className="json-warn-list">
                {result.duplicateKeys.map((d, i) => (
                  <li key={`${d.pointer}-${d.key}-${i}`} className="mono">
                    {t("duplicateItem", { key: d.key, pointer: pointerLabel(d.pointer) })}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Output */}
          <section className="jwt-panel json-output-panel">
            <div className="json-output-head">
              <h4 className="jwt-panel-title">{t("outputTitle")}</h4>
              <button type="button" className="json-copy-btn" onClick={copy}>
                {copied ? t("copied") : t("copy")}
              </button>
            </div>
            <pre className="json-output mono" aria-label={t("outputTitle")}>
              {result.output}
            </pre>
          </section>

          {/* Stats */}
          {result.stats && (
            <p className="json-stats">
              {t("statsValid")}
              <span className="json-stat">{t("statBytes", { n: result.stats.bytes })}</span>
              <span className="json-stat">{t("statKeys", { n: result.stats.keys })}</span>
              <span className="json-stat">{t("statObjects", { n: result.stats.objects })}</span>
              <span className="json-stat">{t("statArrays", { n: result.stats.arrays })}</span>
              <span className="json-stat">{t("statDepth", { n: result.stats.maxDepth })}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
