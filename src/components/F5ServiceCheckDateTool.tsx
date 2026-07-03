"use client";

// ============================================================================
// src/components/F5ServiceCheckDateTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE F5 SERVICE-CHECK-DATE TOOL.
//
// One field, auto-detecting, two directions (the engine decides which):
//   * enter a BIG-IP version (17.1.3, 21.1, 16.1.x) -> the minimum service check
//     date the license must carry to be allowed to boot it, in ISO form and in
//     the bigip.license compact form, with the major.minor granularity note and
//     the "boots but won't load config" consequence;
//   * enter a service check date (20230611 / 2023-06-11 / 2023/06/11) -> the
//     newest version you can upgrade to, and the newer branches you cannot reach
//     yet with the date each one needs;
//   * paste /config/bigip.license contents or tmsh show sys license output ->
//     the service check date is extracted (file and tmsh line forms, flexible
//     case / colon / whitespace) and answered as above, with the matched line
//     echoed back for confirmation.
//
// Everything runs IN THE BROWSER via the local f5-service-check-date module,
// which looks up a vendored copy of F5's authoritative K7727 License Check Date
// table - no fetch, no API, no clock. All output is escaped text through React.
// A "verify against K7727 / /etc/version_date" note sits by the answer because
// this is vendor documentation, not a stable standard.
// ============================================================================

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import {
  run,
  ServiceCheckError,
  type LookupResult,
} from "@/lib/tools/f5-service-check-date";

export default function F5ServiceCheckDateTool() {
  const t = useTranslations("tools.f5-service-check-date");

  const [value, setValue] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const compute = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) {
        setResult(null);
        setError(null);
        return;
      }
      try {
        setResult(run(trimmed));
        setError(null);
      } catch (e) {
        const code = e instanceof ServiceCheckError ? e.code : "format";
        setError(t(`errors.${code}`));
        setResult(null);
      }
    },
    [t]
  );

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value);
    compute(e.target.value);
  }

  return (
    <div className="cidr-tool jwt-tool">
      <div className="cidr-input-row">
        <label className="cidr-label" htmlFor="scd-input">
          {t("inputLabel")}
        </label>
        <input
          id="scd-input"
          type="text"
          className="cidr-input mono"
          value={value}
          onChange={onChange}
          placeholder={t("inputPlaceholder")}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-describedby="scd-privacy"
        />
        <p id="scd-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            ●
          </span>
          {t("runsLocally")}
        </p>
        {/* Paste affordance: the same field also accepts a pasted
            /config/bigip.license or tmsh show sys license output. */}
        <p className="cidr-privacy" style={{ marginTop: "0.25rem" }}>
          {t("pasteHint")}
        </p>
      </div>

      {error && (
        <p className="cidr-error" role="alert">
          {error}
        </p>
      )}

      {/* VERSION mode: minimum service check date for the entered version. */}
      {result?.kind === "version" && (
        <div className="jwt-results">
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("version.heading")}</h4>
            <p className="jwt-claim-value">
              {t("version.forVersion", { label: result.matched.label })}
            </p>
            <div className="jwt-badges" style={{ marginTop: "0.5rem" }}>
              <span className="jwt-badge jwt-badge--ok mono">
                {result.minServiceCheckDateISO} {t("version.orLater")}
              </span>
            </div>
            <dl className="jwt-claims" style={{ marginTop: "0.75rem" }}>
              <div className="jwt-claim-row">
                <dt className="jwt-claim-label">{t("version.compactLabel")}</dt>
                <dd className="jwt-claim-value mono">
                  {result.minServiceCheckDateCompact}
                </dd>
              </div>
            </dl>
            {result.isMajorMinorRow && (
              <p className="cipher-note">
                {t("version.majorMinorNote", { label: result.matched.label })}
              </p>
            )}
            <p className="cipher-note">{t("version.consequence")}</p>
          </section>
        </div>
      )}

      {/* DATE mode: newest reachable version + the blocked branches. */}
      {result?.kind === "date" && (
        <div className="jwt-results">
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("date.heading")}</h4>
            {/* Echo the exact matched span so the user can confirm the right
                line was picked out of their paste. */}
            {result.extractedFrom && (
              <p className="cipher-note">
                {t("date.extractedFrom")}{" "}
                <code className="mono">{result.extractedFrom.matchedText}</code>
              </p>
            )}
            {result.newestReachable ? (
              <>
                <p className="jwt-claim-value">{t("date.newestReachable")}</p>
                <div className="jwt-badges" style={{ marginTop: "0.5rem" }}>
                  <span className="jwt-badge jwt-badge--ok mono">
                    {result.newestReachable.label}
                  </span>
                </div>
                <p className="cipher-note">
                  {t("date.withinNote", { label: result.newestReachable.label })}
                </p>
              </>
            ) : (
              <p className="cipher-note">{t("date.none")}</p>
            )}

            {result.blocked.length > 0 ? (
              <>
                <h4 className="jwt-panel-title" style={{ marginTop: "1rem" }}>
                  {t("date.blockedHeading")}
                </h4>
                <dl className="jwt-claims">
                  {/* nearest-blocked (lowest version) first = natural "next step" order */}
                  {result.blocked
                    .slice()
                    .reverse()
                    .map((e) => (
                      <div className="jwt-claim-row" key={e.label}>
                        <dt className="jwt-claim-label mono">{e.label}</dt>
                        <dd className="jwt-claim-value">
                          {t("date.needsDate", { date: e.dateISO })}
                        </dd>
                      </div>
                    ))}
                </dl>
                <p className="cipher-note">{t("date.blockedHint")}</p>
              </>
            ) : result.newestReachable ? (
              <p className="cipher-note">{t("date.allReachable")}</p>
            ) : null}
          </section>
        </div>
      )}

      {result && (
        <p className="cidr-privacy" style={{ marginTop: "1rem" }}>
          {t("verifyNote")}
        </p>
      )}
    </div>
  );
}
