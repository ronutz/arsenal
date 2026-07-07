"use client";

// ============================================================================
// src/components/LetsEncryptRateLimitsTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE LET'S ENCRYPT RATE-LIMIT PLANNER. Paste the hostnames you intend to
// put on certificates; it groups them by registered domain (eTLD+1) using the
// bundled Public Suffix List, then shows how they map onto Let's Encrypt's
// concrete limits: the fewest certificates they need (up to 100 names each),
// where a wildcard would collapse subdomains, and whether a one-cert-per-name
// approach would blow the 50-per-registered-domain-per-week limit.
//
// All local: PSL lookup + arithmetic against a dated, sourced limit snapshot.
// The numeric limits are rendered from result.limits (single source of truth)
// so the on-screen numbers can never drift from the vendored constants.
// ============================================================================

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { run, type LeRateLimitResult } from "@/lib/tools/letsencrypt-rate-limits";

// D-83 Example — the golden-vector set: two registered domains, wildcards on both.
const EXAMPLE_NAMES =
  "www.example.com\napi.example.com\nblog.example.com\nshop.example.co.uk\nwww.example.co.uk";

export default function LetsEncryptRateLimitsTool() {
  const t = useTranslations("tools.letsencrypt-rate-limits");

  const [names, setNames] = useState("");
  const [result, setResult] = useState<LeRateLimitResult | null>(null);
  const reqRef = useRef(0);

  const recompute = useCallback(async (value: string) => {
    if (value.trim() === "") {
      setResult(null);
      return;
    }
    const myReq = ++reqRef.current;
    const r = await run({ names: value });
    if (reqRef.current === myReq) setResult(r);
  }, []);

  const fillExample = () => {
    setNames(EXAMPLE_NAMES);
    recompute(EXAMPLE_NAMES);
  };
  const clearAll = () => {
    setNames("");
    setResult(null);
  };

  const limits = result?.limits;

  return (
    <div className="cidr-tool jwt-tool">
      {/* Intended certificate names */}
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="le-names">
            {t("namesLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={fillExample}>
              {t("example")}
            </button>
            <button type="button" className="b64-copy" onClick={clearAll}>
              {t("clear")}
            </button>
          </div>
        </div>
        <textarea
          id="le-names"
          className="cidr-input mono json-input"
          value={names}
          onChange={(e) => {
            setNames(e.target.value);
            recompute(e.target.value);
          }}
          placeholder={t("namesPlaceholder")}
          rows={6}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-describedby="le-privacy"
        />
        <p id="le-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            ●
          </span>
          {t("runsLocally")}
        </p>
      </div>

      {result && limits && (
        <div className="jwt-results">
          {/* Summary */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("summaryHeading")}</h4>
            <p className="hmac-build-note">
              {t("totalNamesLabel")}: <span className="mono">{result.totalNames}</span>
              {" · "}
              {t("domainsLabel")}: <span className="mono">{result.registeredDomainCount}</span>
              {" · "}
              {t("minCertsLabel")}: <span className="mono">{result.minCertificatesTotal}</span>
            </p>
            {result.anyDomainExceedsWeekly && (
              <p className="cidr-error">{t("exceedsWarning")}</p>
            )}
          </section>

          {/* Per registered domain */}
          {result.groups.map((g) => (
            <section className="jwt-panel" key={g.registeredDomain}>
              <h4 className="jwt-panel-title">
                <span className="mono">{g.registeredDomain}</span>
              </h4>
              <p className="hmac-build-note">
                {t("groupCountLabel")}:{" "}
                <span className="mono">
                  {g.count} / {limits.certsPerRegisteredDomainPerWeek}
                </span>
                {" · "}
                {t("minCertsForDomainLabel")}: <span className="mono">{g.minCertificates}</span>
              </p>
              {g.exceedsWeeklyIfOneCertPerName && (
                <p className="cidr-error">{t("groupExceeds")}</p>
              )}
              {g.wildcardCandidates.length > 0 && (
                <p className="hmac-build-note">
                  {t("wildcardLabel")}:{" "}
                  <span className="mono">{g.wildcardCandidates.join("  ")}</span>
                </p>
              )}
              <div className="hash-out">
                <div className="b64-output-head">
                  <span className="jwt-panel-title">{t("groupNamesLabel")}</span>
                </div>
                <pre className="jwt-json">
                  <code>{g.names.join("\n")}</code>
                </pre>
              </div>
            </section>
          ))}

          {/* IP addresses (own unit) */}
          {(result.ipAddresses.ipv4.length > 0 || result.ipAddresses.ipv6.length > 0) && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("ipHeading")}</h4>
              <p className="hmac-build-note">{t("ipNote")}</p>
              <pre className="jwt-json">
                <code>
                  {[...result.ipAddresses.ipv4, ...result.ipAddresses.ipv6].join("\n")}
                </code>
              </pre>
            </section>
          )}

          {/* Inputs that were not hostnames or IPs */}
          {result.invalid.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("invalidHeading")}</h4>
              <p className="hmac-build-note">{t("invalidNote")}</p>
              <pre className="jwt-json">
                <code>{result.invalid.join("\n")}</code>
              </pre>
            </section>
          )}

          {/* The limits, rendered from the vendored snapshot */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("limitsHeading")}</h4>
            <p className="hmac-build-note">
              {t("limitCertsPerDomain")}:{" "}
              <span className="mono">{limits.certsPerRegisteredDomainPerWeek}</span>
            </p>
            <p className="hmac-build-note">
              {t("limitOrders")}: <span className="mono">{limits.ordersPerAccountPer3h}</span>
            </p>
            <p className="hmac-build-note">
              {t("limitExactSet")}: <span className="mono">{limits.certsPerExactSetPerWeek}</span>
            </p>
            <p className="hmac-build-note">
              {t("limitMaxNames")}: <span className="mono">{limits.maxNamesPerCert}</span>
            </p>
            <p className="hmac-build-note">{t("ariNote")}</p>
            <p className="hmac-build-note">
              {t("snapshotNote")} <span className="mono">{limits.snapshotDate}</span>.{" "}
              <a href={limits.sourceUrl} target="_blank" rel="noopener noreferrer">
                {limits.sourceUrl}
              </a>
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
