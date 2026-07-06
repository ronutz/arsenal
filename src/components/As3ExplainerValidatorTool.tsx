"use client";

// ============================================================================
// src/components/As3ExplainerValidatorTool.tsx
// ----------------------------------------------------------------------------
// Client UI for the F5 BIG-IP AS3 declaration explainer + structural validator.
// Paste the JSON you POST to /mgmt/shared/appsvcs/declare and it reads back the
// document kind (full AS3 request vs ADC-only), the top-level options, the ADC
// metadata, the Tenant -> Application -> resource tree with each class
// explained, and the structural findings. Pure, decode-only engine; nothing is
// fetched and nothing leaves the browser (D-49). Class names and structural
// rules come from F5's AS3 user guide and schema reference.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { explainAs3, type Finding, type ObjectCategory } from "@/lib/tools/as3-explainer-validator";

// F5's Sample_02 HTTPS declaration (AS3 user guide) — the D-83 Example.
const EXAMPLE = JSON.stringify(
  {
    class: "AS3",
    action: "deploy",
    persist: true,
    declaration: {
      class: "ADC",
      schemaVersion: "3.0.0",
      id: "123abc",
      label: "Sample 2",
      remark: "HTTPS with predictive-node pool",
      Sample_02: {
        class: "Tenant",
        A1: {
          class: "Application",
          service: { class: "Service_HTTPS", virtualAddresses: ["192.0.2.11"], pool: "web_pool", serverTLS: "webtls" },
          web_pool: { class: "Pool", loadBalancingMode: "predictive-node", monitors: ["http"], members: [{ servicePort: 80, serverAddresses: ["192.0.2.12", "192.0.2.13"] }] },
          webtls: { class: "TLS_Server", certificates: [{ certificate: "webcert" }] },
        },
      },
    },
  },
  null,
  2,
);

// Category → severity-ish color class for the object chip.
const CAT_CLASS: Record<ObjectCategory, string> = {
  service: "as3-cat-service",
  pool: "as3-cat-pool",
  monitor: "as3-cat-monitor",
  tls: "as3-cat-tls",
  security: "as3-cat-security",
  policy: "as3-cat-policy",
  persistence: "as3-cat-persist",
  network: "as3-cat-network",
  irule: "as3-cat-irule",
  other: "as3-cat-other",
};

export default function As3ExplainerValidatorTool() {
  const t = useTranslations("tools.as3-explainer-validator");
  const [input, setInput] = useState("");
  const inputPlaceholder = t.raw("inputPlaceholder");
  const r = useMemo(() => explainAs3(input), [input]);
  const has = input.trim().length > 0;

  const findingText = (f: Finding): { sev: "warn" | "info"; text: string } => {
    switch (f.kind) {
      case "parse-error": return { sev: "warn", text: `${t("finding.parseError")}: ${f.detail}` };
      case "not-as3": return { sev: "warn", text: t("finding.notAs3") };
      case "adc-only": return { sev: "info", text: t("finding.adcOnly") };
      case "missing-schema-version": return { sev: "warn", text: t("finding.missingSchema") };
      case "no-tenant": return { sev: "warn", text: t("finding.noTenant") };
      case "empty-tenant": return { sev: "warn", text: t("finding.emptyTenant", { tenant: f.tenant }) };
      case "empty-application": return { sev: "warn", text: t("finding.emptyApp", { tenant: f.tenant, app: f.app }) };
      case "template-service-mismatch": return { sev: "warn", text: t("finding.templateMismatch", { tenant: f.tenant, app: f.app, template: f.template, needs: f.needs }) };
      case "invalid-name": return { sev: "warn", text: t("finding.invalidName", { name: f.name, where: f.where }) };
      case "reserved-name": return { sev: "info", text: t("finding.reservedName", { name: f.name, role: f.role }) };
      default: return { sev: "info", text: "" };
    }
  };

  const kindLabel = r ? (r.kind === "as3-request" ? t("kind.as3Request") : r.kind === "adc-only" ? t("kind.adcOnly") : t("kind.notAs3")) : "";
  const kindSev = r?.kind === "not-as3" ? "warn" : "ok";
  const showTree = r && (r.kind === "as3-request" || r.kind === "adc-only") && r.tenants.length > 0;

  return (
    <div className="cidr-tool jwt-tool dig-tool json-tool tmsh-tool as3-tool">
      <div className="dig-input-head">
        <label htmlFor="as3-in" className="cidr-label">{t("inputLabel")}</label>
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
          <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
        </div>
      </div>
      <textarea
        id="as3-in"
        className="cidr-input mono saml-textarea json-input tmsh-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={inputPlaceholder}
        spellCheck={false}
        rows={12}
      />
      <p className="cidr-privacy"><span className="cidr-lock">&#128274;</span> {t("runsLocally")}</p>

      {!has && <div className="awaf-empty">{t("empty")}</div>}

      {r && has && (
        <div className="tmsh-results as3-results">
          {/* Verdict + request/ADC summary */}
          <section className={`as3-verdict as3-verdict-${kindSev}`}>
            <h3 className="as3-verdict-head">{kindLabel}</h3>
            {r.request && (
              <div className="as3-meta-row">
                <span className="as3-chip">{t("req.action")}: <b>{r.request.action}</b></span>
                <span className="as3-chip">{t("req.persist")}: <b>{r.request.persist === true ? t("req.persistTrue") : r.request.persist === false ? t("req.persistFalse") : t("req.persistUnset")}</b></span>
              </div>
            )}
            {r.adc && (
              <div className="as3-meta-row">
                {r.adc.schemaVersion && <span className="as3-chip">{t("adc.schemaVersion")}: <b>{r.adc.schemaVersion}</b></span>}
                {r.adc.id && <span className="as3-chip">{t("adc.id")}: <b>{r.adc.id}</b></span>}
                {r.adc.label && <span className="as3-chip">{t("adc.label")}: <b>{r.adc.label}</b></span>}
                {r.adc.hasControls && <span className="as3-chip">{t("adc.controls")}</span>}
              </div>
            )}
            {r.adc?.remark && <p className="as3-remark">{r.adc.remark}</p>}
          </section>

          {/* Stats */}
          {showTree && (
            <div className="as3-stats">
              <div className="poison-stat"><span className="poison-stat-num">{r.stats.tenants}</span><span className="poison-stat-lbl">{t("stats.tenants")}</span></div>
              <div className="poison-stat"><span className="poison-stat-num">{r.stats.applications}</span><span className="poison-stat-lbl">{t("stats.applications")}</span></div>
              <div className="poison-stat"><span className="poison-stat-num">{r.stats.services}</span><span className="poison-stat-lbl">{t("stats.services")}</span></div>
              <div className="poison-stat"><span className="poison-stat-num">{r.stats.pools}</span><span className="poison-stat-lbl">{t("stats.pools")}</span></div>
            </div>
          )}

          {/* Findings */}
          {r.findings.length > 0 && (
            <section className="persist-section">
              <h3 className="persist-heading">{t("findingsHeading")}</h3>
              <ul className="awaf-flag-list">
                {r.findings.map((f, i) => {
                  const v = findingText(f);
                  if (!v.text) return null;
                  return (
                    <li key={i} className={`awaf-flag awaf-flag-${v.sev}`}>
                      <span className="awaf-flag-mark">{v.sev === "warn" ? "\u25B2" : "\u2022"}</span> {v.text}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* The Tenant -> Application -> resource tree */}
          {showTree && (
            <section className="persist-section">
              <h3 className="persist-heading">{t("treeHeading")}</h3>
              <div className="as3-tree">
                {r.tenants.map((ten) => (
                  <div className="as3-tenant" key={ten.name}>
                    <div className="as3-tenant-head">
                      <span className="as3-node-class">Tenant</span> <b>{ten.name}</b>
                      {ten.isCommon && <span className="as3-badge">{t("reserved.common")}</span>}
                      <span className="as3-node-note">{t("tenantPartition", { name: ten.name })}</span>
                    </div>
                    {ten.applications.map((app) => (
                      <div className="as3-app" key={app.name}>
                        <div className="as3-app-head">
                          <span className="as3-node-class">Application</span> <b>{app.name}</b>
                          {app.isShared && <span className="as3-badge">{t("reserved.shared")}</span>}
                          <span className="as3-node-note">
                            {t("appTemplate", { template: app.template ?? "" })}
                            {app.templateDefaulted ? ` ${t("templateDefault")}` : ""}
                          </span>
                        </div>
                        <ul className="as3-objects">
                          {app.objects.map((o) => (
                            <li className="as3-object" key={o.name}>
                              <span className={`as3-obj-chip ${CAT_CLASS[o.category]}`}>{o.className}</span>
                              <b className="as3-obj-name">{o.name}</b>
                              {o.name === "service" && <span className="as3-badge">{t("reserved.service")}</span>}
                              <span className="as3-obj-explain">— {o.explain}{o.unknown ? ` ${t("unknownClass")}` : ""}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          )}

          <p className="cipherstr-scope as3-foot">{t("scopeNote")}</p>
        </div>
      )}
    </div>
  );
}
