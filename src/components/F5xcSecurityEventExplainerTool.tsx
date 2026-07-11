"use client";

// ============================================================================
// src/components/F5xcSecurityEventExplainerTool.tsx
// ----------------------------------------------------------------------------
// UI for the F5XC security event explainer. Paste a WAF / Bot Defense / Service
// Policy / API security event; the decoded type, disposition, request context,
// and per-type reason (signatures, violations, attack types, bot verdict,
// matched policy and rule, OpenAPI validation) are shown. Reuses cidr-/jwt-.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { explainSecurityEvent, type Disposition } from "@/lib/tools/f5xc-security-event-explainer/compute";

const EXAMPLE = JSON.stringify(
  {
    sec_event_type: "waf_sec_event",
    sec_event_name: "WAF",
    action: "block",
    calculated_action: "block",
    method: "GET",
    authority: "app.example.com",
    req_path: "/search",
    src_ip: "212.150.5.74",
    vh_name: "prod-lb",
    vh_type: "HTTP_LOAD_BALANCER",
    namespace: "prod",
    req_id: "18205860747014045721",
    signatures: [{ id: "200021069", name: "SQL-injc SELECT", accuracy: "high_accuracy", attack_type: "ATTACK_TYPE_SQL_INJECTION" }],
    violations: [{ name: "VIOL_ATTACK_SIGNATURE", context: "request" }],
    attack_types: ["ATTACK_TYPE_SQL_INJECTION"],
  },
  null,
  2,
);

const dispClass: Record<Disposition, string> = { blocked: "jwt-badge--bad", reported: "jwt-badge--warn", allowed: "jwt-badge--ok", unknown: "" };

export default function F5xcSecurityEventExplainerTool() {
  const t = useTranslations("tools.f5xc-security-event-explainer");
  const [text, setText] = useState("");
  const r = useMemo(() => (text.trim() !== "" ? explainSecurityEvent(text) : null), [text]);

  const row = (label: string, value?: string) =>
    value ? (
      <div className="jwt-claim-row">
        <span className="jwt-claim-label">{label}</span>
        <span className="jwt-claim-value mono">{value}</span>
      </div>
    ) : null;

  return (
    <div className="cidr-tool jwt-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="sec-json">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setText(EXAMPLE)}>
              {t("example")}
            </button>
            <button type="button" className="b64-copy" onClick={() => setText("")}>
              {t("clear")}
            </button>
          </div>
        </div>
        <textarea id="sec-json" className="cidr-input mono json-input" value={text} onChange={(e) => setText(e.target.value)} placeholder={t("placeholder")} rows={9} autoComplete="off" spellCheck={false} />
        <p className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            🔒
          </span>{" "}
          {t("runsLocally")}
        </p>
      </div>

      {r && !r.ok && (
        <p className="cidr-error" role="alert">
          {r.error}
        </p>
      )}
      {r && r.ok && !r.recognized && (
        <p className="cidr-error" role="alert">
          {r.notes[0] ?? t("unrecognized")}
        </p>
      )}

      {r && r.recognized && (
        <div className="jwt-results">
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">
              <span className="jwt-badge mono">{t(`eventType.${r.eventType}`)}</span>
              {r.eventName ? ` ${r.eventName} ` : " "}
              <span className={`jwt-badge mono ${dispClass[r.disposition]}`}>{t(`disposition.${r.disposition}`)}</span>
            </h4>
            {row(t("actionLabel"), r.action)}
            {row(t("recommendedLabel"), r.recommended)}
            {row(t("resultLabel"), r.result)}
          </section>

          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("requestTitle")}</h4>
            {row(t("method"), r.request.method)}
            {row(t("host"), r.request.host)}
            {row(t("path"), r.request.path)}
            {row(t("srcIp"), r.request.srcIp)}
            {row(t("lb"), r.request.lb ? `${r.request.lb}${r.request.lbType ? ` (${r.request.lbType})` : ""}` : undefined)}
            {row(t("namespace"), r.request.namespace)}
            {row(t("reqId"), r.request.reqId)}
            {row(t("time"), r.request.time)}
          </section>

          {r.waf && (r.waf.signatures.length > 0 || r.waf.violations.length > 0 || r.waf.attackTypes.length > 0 || r.waf.botClassification) && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("whyTitle")}</h4>
              {r.waf.signatures.map((sig, i) => (
                <div className="jwt-claim-row" key={`s${i}`}>
                  <span className="jwt-claim-label">
                    <span className="jwt-badge mono">{t("sigLabel")}</span>
                  </span>
                  <span className="jwt-claim-value mono">
                    {[sig.id, sig.name].filter(Boolean).join(" - ")}
                    {sig.accuracy ? ` (${sig.accuracy})` : ""}
                    {sig.attackType ? ` ${sig.attackType}` : ""}
                  </span>
                </div>
              ))}
              {r.waf.violations.map((v, i) => (
                <div className="jwt-claim-row" key={`v${i}`}>
                  <span className="jwt-claim-label">
                    <span className="jwt-badge mono jwt-badge--warn">{t("violLabel")}</span>
                  </span>
                  <span className="jwt-claim-value mono">
                    {v.name}
                    {v.context ? ` (${v.context})` : ""}
                  </span>
                </div>
              ))}
              {row(t("attackLabel"), r.waf.attackTypes.length ? r.waf.attackTypes.join(", ") : undefined)}
              {row(t("botLabel"), r.waf.botClassification)}
            </section>
          )}

          {r.bot && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("whyTitle")}</h4>
              {row(t("insightLabel"), r.bot.insight)}
              {row(t("automationLabel"), r.bot.automationType)}
              {row(t("recommendationLabel"), r.bot.recommendation)}
            </section>
          )}

          {r.svcPolicy && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("whyTitle")}</h4>
              {row(t("policyLabel"), r.svcPolicy.policy)}
              {row(t("ruleLabel"), r.svcPolicy.rule)}
              {row(t("setLabel"), r.svcPolicy.set)}
              {row(t("rateLimiterLabel"), r.svcPolicy.rateLimiter)}
              {row(t("maliciousUserLabel"), r.svcPolicy.maliciousUser)}
            </section>
          )}

          {r.api && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("whyTitle")}</h4>
              {row(t("policyLabel"), r.api.policy)}
              {row(t("ruleLabel"), r.api.rule)}
              {row(t("resultLabel"), r.api.result)}
              {row(t("oasReqLabel"), r.api.oasReq)}
              {row(t("oasRspLabel"), r.api.oasRsp)}
              {r.api.signatures.map((sig, i) => (
                <div className="jwt-claim-row" key={`as${i}`}>
                  <span className="jwt-claim-label">
                    <span className="jwt-badge mono">{t("sigLabel")}</span>
                  </span>
                  <span className="jwt-claim-value mono">{[sig.id, sig.name].filter(Boolean).join(" - ")}</span>
                </div>
              ))}
            </section>
          )}

          {r.notes.map((n, i) => (
            <p className="cipher-note" key={i}>
              {n}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
