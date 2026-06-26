"use client";

// ============================================================================
// src/components/Ipv6Tool.tsx
// ----------------------------------------------------------------------------
// THE LIVE IPv6 ADDRESS TOOLKIT.
//
// PRIVACY/SECURITY (the architecture IS the control):
//   Everything runs ENTIRELY IN THE BROWSER via the local ipv6 module - no
//   fetch, no API, no server. The address you type never leaves the device. All
//   output is rendered as escaped text through React (no dangerouslySetInnerHTML).
//
// The decode core (run) is deterministic; this component is a thin, synchronous
// view over it (no clock, no async), so the pure module stays golden-vector-stable.
// ============================================================================

import { useState } from "react";
import { useTranslations } from "next-intl";
import { run, Ipv6DecodeError, type DecodedIpv6 } from "@/lib/tools/ipv6";

export default function Ipv6Tool() {
  const t = useTranslations("tools.ipv6");

  const [value, setValue] = useState("");
  const [decoded, setDecoded] = useState<DecodedIpv6 | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setValue(raw);
    const trimmed = raw.trim();
    if (!trimmed) {
      setDecoded(null);
      setError(null);
      return;
    }
    try {
      setDecoded(run(trimmed));
      setError(null);
    } catch (err) {
      const code = err instanceof Ipv6DecodeError ? err.code : "format";
      setError(t(`errors.${code}`));
      setDecoded(null);
    }
  }

  const c = decoded?.classification;

  return (
    <div className="cidr-tool jwt-tool ipv6-tool">
      <div className="cidr-input-row">
        <label className="cidr-label" htmlFor="ipv6-input">
          {t("inputLabel")}
        </label>
        <input
          id="ipv6-input"
          className="cidr-input mono"
          type="text"
          value={value}
          onChange={onChange}
          placeholder={t("inputPlaceholder")}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-describedby="ipv6-privacy"
        />
        <p id="ipv6-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            ●
          </span>
          {t("runsLocally")}
        </p>
      </div>

      {error && (
        <p className="cidr-error" role="alert">
          {error}
        </p>
      )}

      {decoded && c && (
        <div className="jwt-results ipv6-results">
          <div className="jwt-badges">
            <span className="jwt-badge jwt-badge--ok">{c.type}</span>
            {c.scope && <span className="jwt-badge jwt-badge--warn">{c.scope}</span>}
            {c.isMulticast && <span className="jwt-badge jwt-badge--warn">{t("badges.multicast")}</span>}
          </div>

          {/* Canonical + expanded forms */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("panels.forms")}</h4>
            <dl className="jwt-claims">
              <div className="jwt-claim-row">
                <dt className="jwt-claim-label">{t("fields.compressed")}</dt>
                <dd className="jwt-claim-value mono">{decoded.compressed}</dd>
              </div>
              <div className="jwt-claim-row">
                <dt className="jwt-claim-label">{t("fields.expanded")}</dt>
                <dd className="jwt-claim-value mono">{decoded.expanded}</dd>
              </div>
            </dl>
          </section>

          {/* Classification */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("panels.classification")}</h4>
            <dl className="jwt-claims">
              <div className="jwt-claim-row">
                <dt className="jwt-claim-label">{t("fields.type")}</dt>
                <dd className="jwt-claim-value mono">
                  {c.type} <span className="ipv6-detail">{c.detail}</span>
                </dd>
              </div>
              {c.scope && (
                <div className="jwt-claim-row">
                  <dt className="jwt-claim-label">{t("fields.scope")}</dt>
                  <dd className="jwt-claim-value mono">{c.scope}</dd>
                </div>
              )}
              {c.embeddedIpv4 && (
                <div className="jwt-claim-row">
                  <dt className="jwt-claim-label">{t("fields.embeddedIpv4")}</dt>
                  <dd className="jwt-claim-value mono">{c.embeddedIpv4}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Prefix math */}
          {decoded.prefix && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">
                {t("panels.prefix")} /{decoded.prefix.prefixLength}
              </h4>
              <dl className="jwt-claims">
                <div className="jwt-claim-row">
                  <dt className="jwt-claim-label">{t("fields.network")}</dt>
                  <dd className="jwt-claim-value mono">{decoded.prefix.network}</dd>
                </div>
                <div className="jwt-claim-row">
                  <dt className="jwt-claim-label">{t("fields.firstAddress")}</dt>
                  <dd className="jwt-claim-value mono">{decoded.prefix.firstAddress}</dd>
                </div>
                <div className="jwt-claim-row">
                  <dt className="jwt-claim-label">{t("fields.lastAddress")}</dt>
                  <dd className="jwt-claim-value mono">{decoded.prefix.lastAddress}</dd>
                </div>
                <div className="jwt-claim-row">
                  <dt className="jwt-claim-label">{t("fields.count")}</dt>
                  <dd className="jwt-claim-value mono">
                    {decoded.prefix.countPow2}
                    <span className="ipv6-detail"> = {decoded.prefix.countExact}</span>
                  </dd>
                </div>
                <div className="jwt-claim-row">
                  <dt className="jwt-claim-label">{t("fields.hostBits")}</dt>
                  <dd className="jwt-claim-value mono">{decoded.prefix.hostBits}</dd>
                </div>
              </dl>
            </section>
          )}

          {/* Identifiers */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("panels.identifiers")}</h4>
            <dl className="jwt-claims">
              {decoded.eui64Mac && (
                <div className="jwt-claim-row">
                  <dt className="jwt-claim-label">{t("fields.eui64")}</dt>
                  <dd className="jwt-claim-value mono">{decoded.eui64Mac}</dd>
                </div>
              )}
              <div className="jwt-claim-row">
                <dt className="jwt-claim-label">{t("fields.reverseDns")}</dt>
                <dd className="jwt-claim-value mono ipv6-wrap">{decoded.reverseDns}</dd>
              </div>
            </dl>
          </section>
        </div>
      )}
    </div>
  );
}
