"use client";

// ============================================================================
// src/components/F5xcObjectLinterTool.tsx
// ----------------------------------------------------------------------------
// UI for the F5XC object linter. Paste an origin_pool, http_loadbalancer, or
// app_firewall object; the flagged settings are shown with a severity and a
// localized, grounded explanation. Findings render from i18n keyed by code +
// params, keeping the compute language-free. Reuses cidr-/jwt- vocabulary.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { lintObject, type Severity } from "@/lib/tools/f5xc-object-linter/compute";

const EXAMPLE = JSON.stringify(
  {
    metadata: { name: "public-app" },
    spec: {
      domains: ["*.example.com", "example.com"],
      http: {},
      routes: [{ simple_route: { path: { prefix: "/" } } }, { simple_route: { path: { prefix: "/api" } } }],
    },
  },
  null,
  2,
);

const sevClass: Record<Severity, string> = { high: "jwt-badge--bad", warn: "jwt-badge--warn", info: "" };

export default function F5xcObjectLinterTool() {
  const t = useTranslations("tools.f5xc-object-linter");
  const [text, setText] = useState("");
  const r = useMemo(() => (text.trim() !== "" ? lintObject(text) : null), [text]);

  return (
    <div className="cidr-tool jwt-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="lint-json">
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
        <textarea id="lint-json" className="cidr-input mono json-input" value={text} onChange={(e) => setText(e.target.value)} placeholder={t("placeholder")} rows={9} autoComplete="off" spellCheck={false} />
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
          {t("unrecognized")}
        </p>
      )}

      {r && r.recognized && (
        <div className="jwt-results">
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">
              <span className="jwt-badge mono">{t(`objectType.${r.objectType}`)}</span>
              {r.objectName ? ` ${r.objectName}` : ""}
            </h4>

            {r.objectType === "service_policy" ? (
              <p className="cipher-note">{t("servicePolicyNote")}</p>
            ) : r.findings.length === 0 ? (
              <p className="cipher-note">{t("cleanMessage", { rules: r.rulesRun })}</p>
            ) : (
              r.findings.map((fnd, i) => (
                <div className="jwt-claim-row" key={i}>
                  <span className="jwt-claim-label">
                    <span className={`jwt-badge mono ${sevClass[fnd.severity]}`}>{t(`severity.${fnd.severity}`)}</span>
                  </span>
                  <span className="jwt-claim-value">{t(`finding.${fnd.code}`, fnd.params)}</span>
                </div>
              ))
            )}
          </section>
        </div>
      )}
    </div>
  );
}
