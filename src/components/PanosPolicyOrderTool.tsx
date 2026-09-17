"use client";

// ============================================================================
// src/components/PanosPolicyOrderTool.tsx
// ----------------------------------------------------------------------------
// UI for the PAN-OS / Prisma Access evaluation-order explainer.
//
// The layout follows the question people actually arrive with. The ORDERED
// rulebase comes first, because seeing local rules sitting between pre and post
// rules is usually the whole insight. The trace comes second, and shadowing
// last: shadowing is the finding you did not know to look for, so it reads
// better as a discovery at the end than as a warning at the top.
//
// Traffic is optional. A rulebase alone still produces the ordering and the
// shadowing report, which is the more common reason to open this.
// ============================================================================

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import {
  run,
  PanosPolicyError,
  LAYER_LABEL,
  type PanosPolicyReport,
  type Traffic,
} from "@/lib/tools/panos-policy-evaluation-order";
import { usePrefill } from "@/lib/use-prefill";

const EXAMPLE = [
  "shared-pre | block-tor       | deny  | from=any to=any app=tor",
  "dg-pre     | allow-dns       | allow | from=trust to=untrust app=dns svc=application-default",
  "local      | web-out         | allow | from=trust to=untrust app=web-browsing",
  "local      | block-webmail   | deny  | from=trust to=untrust app=gmail-base",
  "dg-post    | catch-all-deny  | deny  | from=any to=any",
].join("\n");

const EMPTY_TRAFFIC: Traffic = {
  fromZone: "trust",
  toZone: "untrust",
  source: "10.0.0.5",
  destination: "203.0.113.10",
  application: "web-browsing",
  service: "application-default",
  user: "any",
};

export default function PanosPolicyOrderTool() {
  const t = useTranslations("tools.panos-policy-evaluation-order");
  const [rules, setRules] = useState("");
  const [useTraffic, setUseTraffic] = useState(false);
  const [traffic, setTraffic] = useState<Traffic>(EMPTY_TRAFFIC);
  const [report, setReport] = useState<PanosPolicyReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const compute = useCallback(
    (text: string, withTraffic: boolean, tr: Traffic) => {
      if (!text.trim()) {
        setReport(null);
        setError(null);
        return;
      }
      try {
        setReport(run({ rules: text, traffic: withTraffic ? tr : undefined }));
        setError(null);
      } catch (e) {
        setReport(null);
        setError(
          e instanceof PanosPolicyError ? t(`errors.${e.code}`) : String((e as Error).message)
        );
      }
    },
    [t]
  );

  usePrefill((v: string) => {
    setRules(v);
    compute(v, useTraffic, traffic);
  });

  const onRules = (v: string) => {
    setRules(v);
    compute(v, useTraffic, traffic);
  };
  const onTrafficField = (k: keyof Traffic, v: string) => {
    const next = { ...traffic, [k]: v };
    setTraffic(next);
    compute(rules, useTraffic, next);
  };
  const onToggleTraffic = (on: boolean) => {
    setUseTraffic(on);
    compute(rules, on, traffic);
  };

  return (
    <div className="jwt-tool">
      <div className="jwt-field">
        <div className="jwt-label-row">
          <label className="jwt-label" htmlFor="panos-rules">
            {t("rulesLabel")}
          </label>
          <div className="jwt-label-actions">
            <button type="button" className="b64-copy" onClick={() => onRules(EXAMPLE)}>
              {t("example")}
            </button>
            <button type="button" className="b64-copy" onClick={() => onRules("")}>
              {t("clear")}
            </button>
          </div>
        </div>
        <textarea
          id="panos-rules"
          className="jwt-input panos-rules"
          rows={7}
          value={rules}
          onChange={(e) => onRules(e.target.value)}
          placeholder={t("rulesPlaceholder")}
          spellCheck={false}
        />
        <p className="jwt-hint">{t("runsLocally")}</p>
      </div>

      <div className="jwt-field">
        <label className="panos-toggle">
          <input
            type="checkbox"
            checked={useTraffic}
            onChange={(e) => onToggleTraffic(e.target.checked)}
          />
          <span>{t("traceLabel")}</span>
        </label>
        {useTraffic && (
          <div className="panos-traffic">
            {(Object.keys(EMPTY_TRAFFIC) as (keyof Traffic)[]).map((k) => (
              <label key={k} className="panos-traffic-field">
                <span>{t(`traffic.${k}`)}</span>
                <input
                  value={traffic[k]}
                  onChange={(e) => onTrafficField(k, e.target.value)}
                  spellCheck={false}
                  autoComplete="off"
                />
              </label>
            ))}
          </div>
        )}
      </div>

      {error && <p className="jwt-error">{error}</p>}

      {report && (
        <div className="jwt-results">
          {/* The ordering first: seeing local rules between pre and post is
              usually the whole insight. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("panels.order")}</h4>
            <ol className="panos-order">
              {report.ordered.map((r, i) => (
                <li key={`${r.layer}-${r.index}-${i}`} className={`panos-layer-${r.layer}`}>
                  <span className="panos-layer-tag">{LAYER_LABEL[r.layer]}</span>
                  <span className="panos-rule-name">{r.name}</span>
                  <span className={`panos-action panos-action-${r.action}`}>{r.action}</span>
                </li>
              ))}
              <li className="panos-layer-default">
                <span className="panos-layer-tag">{t("defaultsLabel")}</span>
                <span className="panos-rule-name">
                  intrazone-default (allow) &middot; interzone-default (deny)
                </span>
              </li>
            </ol>
          </section>

          {report.decision && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("panels.decision")}</h4>
              <p className="panos-decision">
                <strong>{report.decision.ruleName}</strong>{" "}
                <span className={`panos-action panos-action-${report.decision.action}`}>
                  {report.decision.action}
                </span>
              </p>
              {report.decision.byDefault && (
                <p className="opt43-warn">
                  {t(
                    report.decision.defaultRule === "intrazone-default"
                      ? "notes.intrazone-default-allow"
                      : "notes.interzone-default-deny"
                  )}
                </p>
              )}
              {report.trace && (
                <ol className="panos-trace">
                  {report.trace.map((s, i) => (
                    <li key={i} className={s.matched ? "panos-hit" : "panos-miss"}>
                      <span className="panos-rule-name">{s.name}</span>
                      <span className="panos-trace-why">
                        {s.matched
                          ? t("trace.matched")
                          : t("trace.failedOn", { field: s.failedOn ?? "" })}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          )}

          {/* Shadowing last: it is the finding you did not know to look for. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("panels.shadowing")}</h4>
            {report.shadowed.length === 0 ? (
              <p>{t("noShadowing")}</p>
            ) : (
              <ul className="panos-shadow">
                {report.shadowed.map((s, i) => (
                  <li key={i}>
                    <strong>{s.shadowedName}</strong>{" "}
                    {t("shadowedBy", { rule: s.shadowedByName })}
                    {s.crossesLayer && (
                      <span className="panos-cross">
                        {" "}
                        {t("crossesLayer", {
                          from: LAYER_LABEL[s.shadowedByLayer],
                          to: LAYER_LABEL[s.shadowedLayer],
                        })}
                      </span>
                    )}
                    {s.actionDiffers && (
                      <span className="panos-differs"> {t("actionDiffers")}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
