"use client";

// ============================================================================
// src/components/F5xcDomainSniMatchResolverTool.tsx
// ----------------------------------------------------------------------------
// UI for the F5XC domain / SNI match resolver. Paste the domain lists of one or
// more HTTP LBs (JSON) and a test hostname; the resolver reports which LB and
// domain entry wins (exact > wildcard > default), plus structural warnings.
// All display text is localized from i18n keyed by resolution + warning code,
// so the compute stays language-free. Reuses cidr-* / jwt-* vocabulary.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { resolve, type LB, type MatchType } from "@/lib/tools/f5xc-domain-sni-match-resolver/compute";

const EXAMPLE_LBS = JSON.stringify(
  [
    { name: "app-b", domains: ["app-b.domain.com"] },
    { name: "wildcard", domains: ["*.domain.com"], default: true },
    { name: "apex", domains: ["domain.com"] },
  ],
  null,
  2,
);
const EXAMPLE_HOST = "other.domain.com";

const typeBadge: Record<MatchType, string> = { exact: "jwt-badge--ok", wildcard: "jwt-badge--warn", default: "" };

export default function F5xcDomainSniMatchResolverTool() {
  const t = useTranslations("tools.f5xc-domain-sni-match-resolver");
  const [lbsText, setLbsText] = useState("");
  const [hostname, setHostname] = useState("");

  const parsed = useMemo<{ lbs: LB[] | null; parseError: boolean }>(() => {
    if (lbsText.trim() === "") return { lbs: null, parseError: false };
    try {
      const j = JSON.parse(lbsText);
      const arr = Array.isArray(j) ? j : Array.isArray(j?.loadBalancers) ? j.loadBalancers : null;
      if (!Array.isArray(arr)) return { lbs: null, parseError: true };
      const lbs: LB[] = arr
        .filter((x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null)
        .map((x) => ({
          name: typeof x.name === "string" ? x.name : "(unnamed)",
          domains: Array.isArray(x.domains) ? (x.domains as unknown[]).filter((d): d is string => typeof d === "string") : [],
          default: x.default === true,
        }));
      return { lbs, parseError: false };
    } catch {
      return { lbs: null, parseError: true };
    }
  }, [lbsText]);

  const result = useMemo(() => {
    if (!parsed.lbs || hostname.trim() === "") return null;
    return resolve(parsed.lbs, hostname);
  }, [parsed.lbs, hostname]);

  const loadExample = () => {
    setLbsText(EXAMPLE_LBS);
    setHostname(EXAMPLE_HOST);
  };
  const clearAll = () => {
    setLbsText("");
    setHostname("");
  };

  return (
    <div className="cidr-tool jwt-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="lbs-json">
            {t("lbsLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={loadExample}>
              {t("example")}
            </button>
            <button type="button" className="b64-copy" onClick={clearAll}>
              {t("clear")}
            </button>
          </div>
        </div>
        <textarea id="lbs-json" className="cidr-input mono json-input" value={lbsText} onChange={(e) => setLbsText(e.target.value)} placeholder={t("lbsPlaceholder")} rows={7} autoComplete="off" spellCheck={false} />
        {parsed.parseError && (
          <p className="cidr-error" role="alert">
            {t("parseError")}
          </p>
        )}
        <div className="cidr-input-row" style={{ marginTop: "0.5rem" }}>
          <label className="cidr-label" htmlFor="host-in">
            {t("hostnameLabel")}
          </label>
          <input id="host-in" className="cidr-input mono" value={hostname} onChange={(e) => setHostname(e.target.value)} placeholder={t("hostnamePlaceholder")} autoComplete="off" spellCheck={false} />
        </div>
        <p className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            🔒
          </span>{" "}
          {t("runsLocally")}
        </p>
      </div>

      {result && result.ok && (
        <div className="jwt-results">
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">
              {t("resultTitle")}
              {result.winner && <span className={`jwt-badge mono ${typeBadge[result.winner.matchType]}`}>{t(`matchType.${result.winner.matchType}`)}</span>}
            </h4>
            <p className="cipher-note">
              {t(`resolution.${result.resolution}`, {
                host: result.hostname,
                lb: result.winner?.lbName ?? "",
                domain: result.winner?.domain ?? "",
              })}
            </p>
            {result.runnerUp && (
              <div className="jwt-claim-row">
                <span className="jwt-claim-label">{t("runnerUpLabel")}</span>
                <span className="jwt-claim-value mono">
                  {result.runnerUp.lbName} ({t(`matchType.${result.runnerUp.matchType}`)} on {result.runnerUp.domain})
                </span>
              </div>
            )}
          </section>

          {result.warnings.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("warningsLabel")}</h4>
              {result.warnings.map((w, i) => (
                <p className="cipher-note" key={i}>
                  ⚠ {t(`warn.${w.code}`, w.params)}
                </p>
              ))}
            </section>
          )}

          <p className="cipher-note">{t("teachingNote")}</p>
        </div>
      )}
    </div>
  );
}
