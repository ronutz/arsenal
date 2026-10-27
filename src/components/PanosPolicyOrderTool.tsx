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

import { useCallback, useMemo, useState } from "react"; // useMemo holds the Share results encoding (2026-10-27)
import { useTranslations } from "next-intl";
import {
  run,
  PanosPolicyError,
  LAYER_LABEL,
  type PanosPolicyReport,
  type Traffic,
} from "@/lib/tools/panos-policy-evaluation-order";
import { usePrefill } from "@/lib/use-prefill";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-10-27)
import type { ShareEncoding } from "@/lib/share/spec"; // what the button is handed
import { PANOS_POLICY_SHARE } from "@/lib/tools/panos-policy-evaluation-order/share"; // this tool's share spec: the rulebase as #input=

/** Nothing to share: a constant, so the button sees no change between renders. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // the disabled state

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

  // The field's value goes to usePrefill too, so a Clear, an Example or an edit drops the handed-over value from the
  // address (#input=), and a share or reload no longer carries it (RT01, 2026-10-20).
  usePrefill((v: string) => {
    setRules(v);
    compute(v, useTraffic, traffic);
  }, rules);

  // What Share results may carry (2026-10-27): the rules as typed, once they read, as the same #input= the handoff
  // above reads (usePrefill is the arrival, unchanged; it carries one string, so the traffic to trace is not carried).
  const share = useMemo<ShareEncoding>(() => (report ? PANOS_POLICY_SHARE.encode({ input: rules }) : NOTHING), [report, rules]); // the encoding

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
    <div className="cidr-tool jwt-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="panos-rules">
            {t("rulesLabel")}
          </label>
          <div className="dig-input-actions">
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
        <p className="cidr-privacy">{t("runsLocally")}</p>
      </div>

      <div className="cidr-input-row">
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

      {error && <p className="cidr-error">{error}</p>}

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
            {/* Share results (2026-10-27): under the ordered rulebase, the first answer, at the start of its own row, so
                the popover opens below it. When a trace is on, the first line says the traced flow is not in the link (one
                line, not a second one: changed after looking). */}
            <div className="rdap-ask-row">
              <ShareResultsButton encoding={share} carries={t("share.carries", { trace: useTraffic ? "on" : "off" })} details={[t("share.caution")]} title={t("name")} />
            </div>
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
