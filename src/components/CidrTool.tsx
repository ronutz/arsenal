"use client";

// ============================================================================
// src/components/CidrTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE CIDR TOOL — the first working tool on the site, proving the
// Engine -> site path end to end.
//
// PRIVACY/SECURITY (the architecture IS the control):
//   This component imports @ronutz/netcore and runs computeCidr ENTIRELY IN THE
//   BROWSER. The input never leaves the device — there is no fetch, no API call,
//   no server. That is the local-first privacy guarantee made concrete: nothing
//   to log, leak, or subpoena. (RB-02/SSRF does not apply: zero network egress.)
//   All output is rendered as text through React (auto-escaped); no
//   dangerouslySetInnerHTML, so even malformed input cannot inject markup (RB-01).
//
// i18n: every visible string comes from the message pack via useTranslations,
// so the tool is fully localized and falls back to English for stub locales.
// ============================================================================

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
// The Engine. Local link (file:../netcore) in dev; published package later.
import { cidrTool } from "@ronutz/netcore";

/** The shape computeCidr returns (kept local; mirrors the Engine's output). */
interface CidrResult {
  input: string;
  network: string;
  broadcast: string;
  netmask: string;
  wildcard: string;
  firstHost: string;
  lastHost: string;
  totalAddresses: number;
  usableHosts: number;
}

export default function CidrTool() {
  const t = useTranslations("tools.cidr");

  const [value, setValue] = useState("");
  const [result, setResult] = useState<CidrResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Run the calculation locally. We catch the Engine's thrown errors and map
  // them to a friendly, localized message rather than surfacing raw text.
  const calculate = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError(t("errors.empty"));
      setResult(null);
      return;
    }
    try {
      // This is the in-browser Engine call. No network involved.
      const r = cidrTool.run(trimmed) as CidrResult;
      setResult(r);
      setError(null);
    } catch {
      // Any malformed input throws in the Engine; show the localized hint.
      setError(t("errors.invalid"));
      setResult(null);
    }
  }, [value, t]);

  // Enter key triggers calculation (this is not a <form> to keep it simple and
  // avoid any default submission/navigation — purely client-side).
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      calculate();
    }
  }

  // The result rows, paired with their localized labels. Defined inline so the
  // label lookups are co-located with the values they describe.
  const rows: Array<{ label: string; value: string | number; mono?: boolean }> = result
    ? [
        { label: t("results.network"), value: result.network, mono: true },
        { label: t("results.broadcast"), value: result.broadcast, mono: true },
        { label: t("results.netmask"), value: result.netmask, mono: true },
        { label: t("results.wildcard"), value: result.wildcard, mono: true },
        { label: t("results.firstHost"), value: result.firstHost, mono: true },
        { label: t("results.lastHost"), value: result.lastHost, mono: true },
        { label: t("results.totalAddresses"), value: result.totalAddresses.toLocaleString() },
        { label: t("results.usableHosts"), value: result.usableHosts.toLocaleString() },
      ]
    : [];

  return (
    <div className="cidr-tool">
      <div className="cidr-head">
        <h3 className="cidr-title">{t("title")}</h3>
        <p className="cidr-desc">{t("description")}</p>
      </div>

      <div className="cidr-input-row">
        <label className="cidr-label" htmlFor="cidr-input">
          {t("inputLabel")}
        </label>
        <div className="cidr-controls">
          <input
            id="cidr-input"
            className="cidr-input mono"
            type="text"
            inputMode="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("inputPlaceholder")}
            autoComplete="off"
            spellCheck={false}
            aria-describedby="cidr-privacy"
          />
          <button type="button" className="cidr-button" onClick={calculate}>
            {t("compute")}
          </button>
        </div>
        <p id="cidr-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            ●
          </span>
          {t("runsLocally")}
        </p>
      </div>

      {/* Error state: direction, in the interface's voice (no apology). */}
      {error && (
        <p className="cidr-error" role="alert">
          {error}
        </p>
      )}

      {/* Results: a clean key/value grid. All values are escaped text. */}
      {result && (
        <dl className="cidr-results">
          {rows.map((row) => (
            <div className="cidr-result-row" key={row.label}>
              <dt className="cidr-result-label">{row.label}</dt>
              <dd className={"cidr-result-value" + (row.mono ? " mono" : "")}>{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
