"use client";

// ============================================================================
// src/components/JsonYamlConvertTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE JSON <-> YAML CONVERTER.
//
// Pick a direction, paste the source, and the converted text updates live.
// JSON parse errors carry line, column, and a JSON Pointer; YAML parse errors
// carry line and column. Conversion notes call out the lossy edges (dropped
// comments, expanded anchors, literal merge keys, number precision). If the
// pasted text looks like the other format, a one-tap hint offers to switch.
//
// All conversion runs IN THE BROWSER via the local module.
//
// Share results (2026-11-01): a button first in the reading (or under the
// parse error) builds a link that carries the box as pasted, the direction and
// the indent, with a caution line, after the JSON and YAML secrets check
// (src/lib/tools/json-formatter/share-secrets.ts): a credential blocks the
// link and the popover names its line. An arriving link (useShareArrival)
// fills the box and sets the choices as the reader would.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { convert, detectFormat, type Direction, type IndentWidth } from "@/lib/tools/json-yaml-convert";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { firstSharePlace } from "@/lib/share/text-secrets"; // the first finding and how many more places, for the popover
import type { ShareEncoding } from "@/lib/share/spec"; // what a spec encodes
import { checkStructuredText } from "@/lib/tools/json-formatter/share-secrets"; // the JSON and YAML secrets check
import { JSON_YAML_SHARE, encodeJsonYamlShare } from "@/lib/tools/json-yaml-convert/share"; // this tool's share spec: the box and the choices

/** Nothing to share (the button is disabled): a constant, so the button sees no change. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" };

const NOTE_CODES = ["COMMENTS_DROPPED", "ANCHORS_EXPANDED", "MERGE_KEYS_LITERAL", "LARGE_NUMBER"] as const;

// D-83 Example samples — verbatim from this tool's golden vectors.
const EXAMPLE = "name: api\nport: 80";

export default function JsonYamlConvertTool() {
  const t = useTranslations("tools.json-yaml-convert");

  const [input, setInput] = useState("");
  const [direction, setDirection] = useState<Direction>("json-to-yaml");
  const [indent, setIndent] = useState<IndentWidth>(2);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!input.trim()) return null;
    return convert(input, { direction, indent });
  }, [input, direction, indent]);

  const detected = useMemo(() => detectFormat(input), [input]);
  const sourceFormat = direction === "json-to-yaml" ? "json" : "yaml";
  const mismatch = detected !== "unknown" && detected !== sourceFormat ? detected : null;

  // An arriving share link: the text fills the box and the choices are set as the reader would set them.
  useShareArrival(JSON_YAML_SHARE, (s) => { setInput(s.input); setDirection(s.direction); setIndent(s.indent); }); // as pasted
  // The secrets check, once per change of the box, only when there is an answer.
  const secrets = useMemo(() => (result ? checkStructuredText(input) : null), [result, input]); // or null
  // What Share results carries: the box and the choices, or blocked by a credential (memoised).
  const share = useMemo<ShareEncoding>(() => (secrets ? encodeJsonYamlShare({ input, direction, indent }, secrets) : NOTHING), [secrets, input, direction, indent]); // the encoding
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

  const pointerLabel = (p?: string) => (p === undefined || p === "" ? t("rootPointer") : p);

  return (
    <div className="cidr-tool jwt-tool saml-tool json-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="jy-input">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            {/* The Example is YAML, so it also selects YAML to JSON: pressed on the default direction (JSON to YAML) it opened
                on a parse error (01/11/2026, wave 4D's note). */}
            <button type="button" className="b64-copy" onClick={() => { setInput(EXAMPLE); setDirection("yaml-to-json"); }}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
          </div>
        </div>
        <textarea
          id="jy-input"
          className="cidr-input mono saml-textarea json-input"
          rows={8}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("inputPlaceholder")}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-describedby="jy-privacy"
        />
        <p id="jy-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            ●
          </span>
          {t("runsLocally")}
        </p>
      </div>

      {/* Controls */}
      <div className="json-controls" role="group" aria-label={t("controlsLabel")}>
        <div className="json-control">
          <span className="json-control-label">{t("controls.direction")}</span>
          <div className="json-segmented">
            <button type="button" className={`json-seg${direction === "json-to-yaml" ? " is-active" : ""}`} onClick={() => setDirection("json-to-yaml")} aria-pressed={direction === "json-to-yaml"}>
              {t("dirJsonToYaml")}
            </button>
            <button type="button" className={`json-seg${direction === "yaml-to-json" ? " is-active" : ""}`} onClick={() => setDirection("yaml-to-json")} aria-pressed={direction === "yaml-to-json"}>
              {t("dirYamlToJson")}
            </button>
          </div>
        </div>

        <div className="json-control">
          <label className="json-control-label" htmlFor="jy-indent">
            {t("controls.indent")}
          </label>
          <select id="jy-indent" className="json-select" value={String(indent)} onChange={(e) => setIndent(Number(e.target.value) as IndentWidth)}>
            <option value="2">{t("indentSpaces", { n: 2 })}</option>
            <option value="4">{t("indentSpaces", { n: 4 })}</option>
          </select>
        </div>
      </div>

      {/* Direction-mismatch hint */}
      {mismatch && (
        <div className="json-hint">
          <span>{mismatch === "json" ? t("mismatchJson") : t("mismatchYaml")}</span>
          <button type="button" className="json-hint-btn" onClick={() => setDirection(mismatch === "json" ? "json-to-yaml" : "yaml-to-json")}>
            {t("switchTo")}
          </button>
        </div>
      )}

      {/* Error */}
      {result && !result.ok && result.error && (
        <div className="json-error-box" role="alert">
          <p className="json-error-headline">{t("errorTitle")}</p>
          {result.error.line !== undefined && (
            <p className="json-error-location">
              {t("errorLocation", { line: result.error.line, column: result.error.column ?? 1 })}
              {result.error.pointer !== undefined && <span className="json-error-pointer">{t("errorAt", { pointer: pointerLabel(result.error.pointer) })}</span>}
            </p>
          )}
          <p className="json-error-message">{result.error.message}</p>
        </div>
      )}
      {/* Share results: under the parse error (outside its alert), since the error is the answer. */}
      {result && !result.ok && shareRow}

      {/* Output */}
      {result && result.ok && (
        <div className="jwt-results saml-results json-results">
          {/* Share results: first in the reading (the output can run long), at the start of its own row. */}
          {shareRow}
          {result.notes.length > 0 && (
            <section className="json-warn-box">
              <p className="json-warn-headline">{t("notesTitle")}</p>
              <ul className="json-warn-list">
                {NOTE_CODES.filter((c) => result.notes.includes(c)).map((c) => (
                  <li key={c}>{t(`notes.${c}`)}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="jwt-panel json-output-panel">
            <div className="json-output-head">
              <h4 className="jwt-panel-title">{result.targetFormat === "yaml" ? t("outputYaml") : t("outputJson")}</h4>
              <button type="button" className="json-copy-btn" onClick={copy}>
                {copied ? t("copied") : t("copy")}
              </button>
            </div>
            <pre className="json-output mono" aria-label={result.targetFormat === "yaml" ? t("outputYaml") : t("outputJson")}>
              {result.output}
            </pre>
          </section>
        </div>
      )}
    </div>
  );
}
