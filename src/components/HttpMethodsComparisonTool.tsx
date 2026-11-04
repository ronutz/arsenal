// ============================================================================
// src/components/HttpMethodsComparisonTool.tsx
// ----------------------------------------------------------------------------
// UI for the HTTP methods comparison tool. One input line: 1-4 method names
// ("QUERY", "get vs query", "get,post,put"). The engine in
// src/lib/tools/http-methods-comparison holds the registry-fact table; this
// component only renders it.
//
// Layout: one panel per method (its six protocol properties + a one-line
// story), and when two or more methods are requested, a closing panel that
// names exactly the properties where they differ - the actual answer to
// "GET vs QUERY". Styling reuses the established tool vocabulary (cidr-*
// input stack, jwt-results panels, cipher-note) - no new CSS classes, but for
// the touch-size modifier of the method buttons added on 03/11/2026 below.
//
// Share results (2026-10-27): under the panels, a button builds a link that
// carries the line as typed (src/lib/tools/http-methods-comparison/share.ts).
// An arriving link (useShareArrival) fills the field as typing would.
//
// WITHOUT A KEYBOARD (03/11/2026): under the field, one pressed-or-not button
// per method in the engine's table (KNOWN_METHODS). A press adds the method to
// the line, or removes it when the line has it (in any case), and the line is
// written back as "GET vs QUERY", exactly what typing it would give; at four
// methods, the engine's limit, the others wait. The line is still typed, and
// the buttons reuse the site's preset-chip vocabulary (tcl-presets-row,
// tcl-chip), 44 px tall on a touch screen
// (tcl-presets-row--tap).
// ============================================================================
"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what a spec encodes
import { HTTP_METHODS_SHARE } from "@/lib/tools/http-methods-comparison/share"; // this tool's share spec: the line as typed
import {
  run,
  KNOWN_METHODS, // every method in the table, one button each (03/11/2026)
  MethodCompareError,
  type MethodCompareResult,
  type MethodProperties,
} from "@/lib/tools/http-methods-comparison";

// D-83 Example sample - verbatim from this tool's golden vectors
// (get-vs-query): the question the new RFC exists to answer.
const EXAMPLE = "get vs query";

/** Nothing to share (the button is disabled): a constant, so the button sees no change. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" };

/** The most methods the engine compares at once (it refuses a fifth). */
const MAX_METHODS = 4; // run() throws "too-many" past four

/**
 * The method names in a line, as the engine splits them (spaces or commas; "vs" and "versus" are only joiners).
 *
 * @param line the line as typed
 * @returns the names, in order, as typed
 */
function methodTokens(line: string): string[] {
  // The same split and filter as run().
  return line.trim().split(/[\s,]+/).filter((x) => x !== "" && x.toLowerCase() !== "vs" && x.toLowerCase() !== "versus");
}

export default function HttpMethodsComparisonTool() {
  const t = useTranslations("tools.http-methods-comparison");

  const [value, setValue] = useState("");
  const [result, setResult] = useState<MethodCompareResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const compute = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (trimmed === "") {
        setResult(null);
        setError(null);
        return;
      }
      try {
        setResult(run(trimmed));
        setError(null);
      } catch (e) {
        if (e instanceof MethodCompareError) {
          setError(t(`errors.${e.code}`, { token: e.token ?? "" }));
        } else {
          setError(t("errors.format", { token: "" }));
        }
        setResult(null);
      }
    },
    [t],
  );

  const onChange = useCallback(
    (raw: string) => {
      setValue(raw);
      compute(raw);
    },
    [compute],
  );

  // An arriving share link: the line fills the field as typing would, and the page compares.
  useShareArrival(HTTP_METHODS_SHARE, (state) => onChange(state.input)); // as typed
  // What Share results may carry: the line, while it gives a comparison.
  const share = useMemo<ShareEncoding>(() => (result ? HTTP_METHODS_SHARE.encode({ input: value }) : NOTHING), [result, value]); // memoised

  // ---- Without a keyboard (03/11/2026): the method buttons. ----
  /** The names in the line now. */
  const picked = methodTokens(value); // as typed
  /** The distinct methods named (upper case, as the engine counts them). */
  const pickedIds = new Set(picked.map((x) => x.toUpperCase())); // GET, QUERY
  /**
   * Add a method to the line, or take it out when the line has it; the line is written back as typing it would be.
   *
   * @param id the method, upper case
   */
  const toggleMethod = (id: string) => {
    // The names kept: all but this method (in any case) when it is there, or all of them plus it.
    const next = pickedIds.has(id) ? picked.filter((x) => x.toUpperCase() !== id) : [...picked, id];
    // "GET vs QUERY", through the field's own setter (the page compares at once).
    onChange(next.join(" vs "));
  };

  /** One yes/no/enum property line inside a method panel. */
  const prop = (label: string, val: string) => (
    <li>
      {label} <span className="mono">{val}</span>
    </li>
  );

  const methodPanel = (m: MethodProperties) => (
    <section className="jwt-panel" key={m.id}>
      <h4 className="jwt-panel-title">
        <span className="mono">{m.id}</span> · <span className="mono">{m.spec}</span>
      </h4>
      <ul>
        {prop(t("props.safe"), t(m.safe ? "values.yes" : "values.no"))}
        {prop(t("props.idempotent"), t(m.idempotent ? "values.yes" : "values.no"))}
        {prop(t("props.cacheable"), t(`values.cache.${m.cacheable}`))}
        {prop(t("props.body"), t(`values.body.${m.body}`))}
        {prop(t("props.cors"), t(m.corsSafelisted ? "values.corsYes" : "values.corsNo"))}
        {prop(t("props.form"), t(m.htmlForm ? "values.yes" : "values.no"))}
      </ul>
      {/* The one-line story: why this method's row looks the way it does. */}
      <p className="cipher-note">{t(`methods.${m.id}.story`)}</p>
    </section>
  );

  return (
    <div className="cidr-tool jwt-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="httpm-input">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            {/* D-83 Example/Clear row: the sample is golden-vector-faithful. */}
            <button type="button" className="b64-copy" onClick={() => onChange(EXAMPLE)}>
              {t("example")}
            </button>
            <button type="button" className="b64-copy" onClick={() => onChange("")}>
              {t("clear")}
            </button>
          </div>
        </div>
        <input
          id="httpm-input"
          className="cidr-input mono"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("inputPlaceholder")}
          aria-describedby="httpm-privacy"
          autoComplete="off"
          spellCheck={false}
        />
        {/* One button per method in the table: pressed when the line names it; a press adds or removes it. Past four
            named, the unpressed ones wait (the engine compares at most four). */}
        <div className="tcl-presets-row tcl-presets-row--tap" role="group" aria-label={t("pickLabel")}>
          {KNOWN_METHODS.map((id) => (
            <button key={id} type="button" className="tcl-chip mono" aria-pressed={pickedIds.has(id)} disabled={!pickedIds.has(id) && pickedIds.size >= MAX_METHODS} onClick={() => toggleMethod(id)}>
              {id}
            </button>
          ))}
        </div>
        <p id="httpm-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            🔒
          </span>{" "}
          {t("runsLocally")}
        </p>
      </div>

      {error && (
        <p className="cidr-error" role="alert">
          {error}
        </p>
      )}

      {result && (
        <div className="jwt-results">
          {result.methods.map(methodPanel)}

          {/* The comparison verdict: exactly which properties differ. */}
          {result.methods.length > 1 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("diff.heading")}</h4>
              {result.differences.length === 0 ? (
                <p>{t("diff.none")}</p>
              ) : (
                <ul>
                  {result.differences.map((k) => (
                    <li key={k}>
                      {t(`props.${k === "corsSafelisted" ? "cors" : k === "htmlForm" ? "form" : k}`)}:{" "}
                      {result.methods.map((m, i) => (
                        <span key={m.id}>
                          {i > 0 && " · "}
                          <span className="mono">
                            {m.id}{" "}
                            {k === "cacheable"
                              ? t(`values.cache.${m.cacheable}`)
                              : k === "body"
                                ? t(`values.body.${m.body}`)
                                : k === "corsSafelisted"
                                  ? t(m.corsSafelisted ? "values.corsYes" : "values.corsNo")
                                  : t(m[k] ? "values.yes" : "values.no")}
                          </span>
                        </span>
                      ))}
                    </li>
                  ))}
                </ul>
              )}
              <p className="cipher-note">{t("diff.note")}</p>
            </section>
          )}

          {/* Share results: under the panels and the comparison (the answer), at the start of its own row. */}
          <div className="rdap-ask-row">
            <ShareResultsButton encoding={share} carries={t("share.carries")} title={t("name")} />
          </div>
        </div>
      )}
    </div>
  );
}
