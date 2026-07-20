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
// input stack, jwt-results panels, cipher-note) - no new CSS classes.
// ============================================================================
"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import {
  run,
  MethodCompareError,
  type MethodCompareResult,
  type MethodProperties,
} from "@/lib/tools/http-methods-comparison";

// D-83 Example sample - verbatim from this tool's golden vectors
// (get-vs-query): the question the new RFC exists to answer.
const EXAMPLE = "get vs query";

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
        </div>
      )}
    </div>
  );
}
