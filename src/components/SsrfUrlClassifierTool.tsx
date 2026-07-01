"use client";

// ============================================================================
// src/components/SsrfUrlClassifierTool.tsx
// ----------------------------------------------------------------------------
// Paste a URL; see where it points and whether a server fetching it would be
// steered at internal infrastructure. All classification is pure and local
// (compute.ts) and never touches the network - no DNS, no request (D-53); this
// component only renders the result. Category, risk, and flag text are rendered
// through translation keys (not the engine's English reasons), so the verdict is
// fully localized; the engine supplies only structured values (the decoded
// address, the obfuscation form, the scheme).
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { classifyUrl, type HostCategory, type RiskLevel } from "@/lib/tools/ssrf-url-classifier";

const EXAMPLE = "http://2130706433/latest/meta-data/";

// Categories in a stable display order (internal-first, so the risky ones lead).
const CATEGORY_ORDER: HostCategory[] = [
  "loopback",
  "cloud-metadata",
  "link-local",
  "private",
  "internal-name",
  "reserved",
  "cgnat",
  "public",
  "unresolved",
];

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="ssrf-field">
      <span className="ssrf-field-label">{label}</span>
      <span className="ssrf-field-value dig-mono">{value}</span>
    </div>
  );
}

export default function SsrfUrlClassifierTool() {
  const t = useTranslations("tools.ssrf-url-classifier");
  const [input, setInput] = useState("");

  const typed = input.trim().length > 0;
  const result = useMemo(() => {
    if (!typed) return null;
    try {
      return classifyUrl(input);
    } catch {
      return null;
    }
  }, [input, typed]);

  const riskLevel: RiskLevel | null = result ? result.risk : null;

  return (
    <div className="cidr-tool jwt-tool dig-tool ssrf-tool">
      <div className="b64-head">
        <label className="b64-label">{t("input.label")}</label>
        <div className="b64-actions">
          <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>
            {t("input.example")}
          </button>
          <button type="button" className="b64-copy" onClick={() => setInput("")}>
            {t("input.clear")}
          </button>
        </div>
      </div>

      <textarea
        className="b64-input dig-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={t("input.placeholder")}
        rows={2}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
      />

      <p className="dig-privacy">{t("privacy")}</p>

      {result && (
        <div className="dig-output">
          {/* Verdict headline: risk level + the category it points to. */}
          <div className={"ssrf-verdict ssrf-risk-" + riskLevel}>
            <div className="ssrf-verdict-risk">
              <span className="ssrf-verdict-risk-label">{t("verdict.riskLabel")}</span>
              <span className="ssrf-verdict-risk-value">{t("risk." + result.risk)}</span>
            </div>
            <div className="ssrf-verdict-cat">
              <span className="ssrf-verdict-cat-value">{t("category." + result.category)}</span>
              <span className="ssrf-verdict-cat-desc">{t("categoryDesc." + result.category)}</span>
            </div>
          </div>

          {/* What you pasted: structured, language-neutral values. */}
          <div className="jwt-panel ssrf-facts">
            <div className="jwt-panel-title">{t("facts.title")}</div>
            <div className="ssrf-field-list">
              {result.scheme && <Field label={t("facts.scheme")} value={result.scheme} />}
              {result.host && <Field label={t("facts.host")} value={result.host} />}
              {result.canonicalIp && result.canonicalIp !== result.host && (
                <Field label={t("facts.canonicalIp")} value={result.canonicalIp} />
              )}
              {result.ipVersion && <Field label={t("facts.ipVersion")} value={"IPv" + result.ipVersion} />}
              {result.port && <Field label={t("facts.port")} value={result.port} />}
              {result.path && result.path !== "/" && <Field label={t("facts.path")} value={result.path} />}
            </div>
          </div>

          {/* Flags: obfuscation, dangerous scheme, embedded credentials. */}
          {(result.obfuscated || result.schemeFlag || result.hasUserinfo) && (
            <div className="jwt-panel ssrf-flags">
              <div className="jwt-panel-title">{t("flags.title")}</div>
              <ul className="ssrf-flag-list">
                {result.obfuscated && result.obfuscationForm && result.canonicalIp && (
                  <li className="ssrf-flag ssrf-flag-warn">
                    {t("flags.obfuscated", {
                      form: t("form." + result.obfuscationForm),
                      ip: result.canonicalIp,
                    })}
                  </li>
                )}
                {result.schemeFlag && (
                  <li className="ssrf-flag ssrf-flag-warn">{t("flags.scheme", { scheme: result.schemeFlag })}</li>
                )}
                {result.hasUserinfo && <li className="ssrf-flag ssrf-flag-warn">{t("flags.userinfo")}</li>}
              </ul>
            </div>
          )}

          {/* Defenses: static, localized guidance. */}
          <div className="jwt-panel ssrf-defenses">
            <div className="jwt-panel-title">{t("defenses.title")}</div>
            <ul className="ssrf-defense-list">
              <li>{t("defenses.allowlist")}</li>
              <li>{t("defenses.blockRanges")}</li>
              <li>{t("defenses.resolveThenCheck")}</li>
              <li>{t("defenses.noRedirects")}</li>
              <li>{t("defenses.schemes")}</li>
            </ul>
          </div>

          <p className="ssrf-note">{t("classifierNote")}</p>
        </div>
      )}

      {/* A short legend of what each destination category means. */}
      {!result && (
        <div className="jwt-panel ssrf-legend">
          <div className="jwt-panel-title">{t("legend.title")}</div>
          <div className="ssrf-legend-list">
            {CATEGORY_ORDER.map((c) => (
              <div key={c} className="ssrf-legend-row">
                <span className={"ssrf-legend-dot ssrf-risk-" + riskForLegend(c)} />
                <span className="ssrf-legend-cat">{t("category." + c)}</span>
                <span className="ssrf-legend-desc">{t("categoryDesc." + c)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Mirror of the engine's risk mapping, for coloring the idle legend only.
function riskForLegend(c: HostCategory): RiskLevel {
  if (c === "public") return "low";
  if (c === "cgnat") return "medium";
  if (c === "unresolved") return "unknown";
  return "high";
}
