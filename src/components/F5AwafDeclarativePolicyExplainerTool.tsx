"use client";

// ============================================================================
// src/components/F5AwafDeclarativePolicyExplainerTool.tsx
// ----------------------------------------------------------------------------
// Client UI for the F5 Advanced WAF declarative-policy explainer. Follows the
// house tool pattern (cidr-/dig-/jwt- classes, Row helper, textarea + privacy
// note): paste a declarative WAF policy JSON, and the pure engine decodes it on
// every keystroke. The section labels/summaries/details and the security-flag
// messages are English prose produced by the engine (F5's own terminology,
// consistent with the other F5 explainers); only the frame is localized.
// Nothing is fetched; nothing leaves the browser (D-49).
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { parseAwafPolicy, GROUPS } from "@/lib/tools/f5-awaf-declarative-policy-explainer";

// A demo policy chosen to exercise the value-reading callouts: transparent
// (monitor-only) + signature staging + XFF trust all raise flags, while Data
// Guard is on. Field names/values are taken from F5's v17.1 schema.
const EXAMPLE = JSON.stringify(
  {
    policy: {
      name: "shop-api-policy",
      description: "Storefront API",
      template: { name: "POLICY_TEMPLATE_API_SECURITY" },
      enforcementMode: "transparent",
      "server-technologies": [{ serverTechnologyName: "MySQL" }, { serverTechnologyName: "Unix/Linux" }],
      "signature-settings": { signatureStaging: true },
      general: { trustXff: true, enforcementReadinessPeriod: 7 },
      "data-guard": { enabled: true, creditCardNumbers: true },
      "policy-builder": { autoApply: false },
    },
  },
  null,
  2,
);

/** Severity glyphs: ▲ warn, ● note, • info. */
const MARK: Record<string, string> = { warn: "\u25B2", note: "\u25CF", info: "\u2022" };

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  if (!value) return null;
  return (
    <div className="dig-row">
      <span className="dig-row-label">{label}</span>
      <span className={mono ? "dig-row-value dig-mono" : "dig-row-value"}>{value}</span>
    </div>
  );
}

export default function F5AwafDeclarativePolicyExplainerTool() {
  const t = useTranslations("tools.f5-awaf-declarative-policy-explainer");
  const [input, setInput] = useState("");

  // The empty-textarea example is a literal JSON snippet, so it must bypass
  // ICU parsing (t.raw): the sample's braces read as ICU message arguments
  // and fail with INVALID_MESSAGE, collapsing the placeholder to a fallback
  // key path in every locale. Build-wide guard: scripts/check-icu-messages.mjs.
  const inputPlaceholder = t.raw("inputPlaceholder");

  // Pure, synchronous decode on every change. No effects, no fetching.
  const parsed = useMemo(() => parseAwafPolicy(input), [input]);

  const has = input.trim().length > 0;
  const show = has && parsed.recognized;
  const showNot = has && !parsed.recognized;

  return (
    <div className="cidr-tool jwt-tool dig-tool awaf-tool">
      <div className="dig-input-head">
        <label htmlFor="awaf-in" className="cidr-label">{t("inputLabel")}</label>
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
          <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
        </div>
      </div>
      <textarea
        id="awaf-in"
        className="cidr-input mono saml-textarea json-input tmsh-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={inputPlaceholder}
        spellCheck={false}
        rows={12}
      />
      <p className="cidr-privacy"><span className="cidr-lock">&#128274;</span> {t("runsLocally")}</p>

      {!has && <div className="awaf-empty">{t("empty")}</div>}

      {showNot && (
        <div className="dig-notdig">
          {parsed.parseError ? `${t("parseError")}: ${parsed.parseError}` : `${t("notRecognized")}. ${parsed.unrecognizedReason ?? ""}`}
        </div>
      )}

      {show && (
        <div className="awaf-result">
          {/* Overview: name / template / enforcement */}
          <div className="awaf-overview">
            {parsed.policyName && <Row label={t("overviewHeading")} value={parsed.policyName} mono />}
            <Row label={t("labelTemplate")} value={parsed.templateName ?? ""} mono />
            <Row label={t("labelEnforcement")} value={parsed.enforcement ?? ""} mono />
          </div>

          {/* The template-delta caveat (always shown for a recognized policy). */}
          <div className="awaf-note">{parsed.templateNote}</div>

          {/* Security notes (cross-cutting, value-derived callouts). */}
          {parsed.securityFlags.length > 0 && (
            <div className="jwt-panel awaf-flags">
              <div className="jwt-panel-title">{t("securityHeading")}</div>
              <ul className="awaf-flag-list">
                {parsed.securityFlags.map((f, i) => (
                  <li key={i} className={`awaf-flag awaf-flag-${f.severity}`}>
                    <span className="awaf-flag-mark">{MARK[f.severity] ?? MARK.info}</span> {f.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Sections, grouped in reading order. */}
          <div className="awaf-sections">
            <div className="jwt-panel-title awaf-sections-title">{t("sectionsHeading")}</div>
            {GROUPS.map((group) => {
              const secs = parsed.sections.filter((s) => s.group === group);
              if (secs.length === 0) return null;
              return (
                <div className="awaf-group" key={group}>
                  <h4 className="awaf-group-heading">{group}</h4>
                  {secs.map((s) => (
                    <div className="awaf-section" key={s.key}>
                      <div className="awaf-section-label">{s.label}</div>
                      <div className="awaf-section-summary">{s.summary}</div>
                      {s.detail && (
                        <div className={`awaf-section-detail awaf-detail-${s.severity ?? "info"}`}>{s.detail}</div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Present-but-not-explained keys, acknowledged. */}
          {parsed.unknownKeys.length > 0 && (
            <div className="awaf-unknown">
              <div className="jwt-panel-title">{t("unknownHeading")}</div>
              <p className="awaf-unknown-list dig-mono">{parsed.unknownKeys.join(", ")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
