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

// D-83 Example samples — verbatim from this tool's golden vectors.
const EXAMPLE = "2001:db8:0:0:8:800:200c:417a";

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
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="ipv6-input">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setValue(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setValue("")}>{t("clear")}</button>
          </div>
        </div>
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

          {/* Address structure */}
          <section className="jwt-panel ipv6-struct-panel">
            <h4 className="jwt-panel-title">{t("segHeading")}</h4>
            {(() => {
              const hextets = decoded.expanded.split(":");
              const hasPrefix = decoded.prefixLength != null;
              const bp = decoded.prefixLength ?? 64;
              const x0 = 24;
              const x1 = 656;
              const W = x1 - x0;
              const cellW = W / 8;
              const sy = 40;
              const sh = 40;
              const bitToX = (b: number) => x0 + (b / 128) * W;
              const bx = bitToX(bp);
              const ticks = [0, 16, 32, 48, 64, 80, 96, 112, 128];
              const hostLabel = bp === 64 ? t("ifaceId") : t("hostBits");
              const showNet = bx - x0 > 48;
              const showHost = x1 - bx > 48;
              return (
                <svg className="ipv6-struct-svg" viewBox="0 0 680 116" role="img" aria-label={t("segHeading")}>
                  {bx > x0 && (
                    <rect x={x0} y={sy} width={bx - x0} height={sh} fill="var(--accent-primary)" fillOpacity="0.12" />
                  )}
                  {showNet && (
                    <text x={(x0 + bx) / 2} y={30} textAnchor="middle" className="ipv6-struct-seg">{t("networkSeg")}</text>
                  )}
                  {showHost && (
                    <text x={(bx + x1) / 2} y={30} textAnchor="middle" className="ipv6-struct-seg">{hostLabel}</text>
                  )}
                  {hextets.map((h, i) => {
                    const cx = x0 + i * cellW;
                    return (
                      <g key={i}>
                        <rect x={cx} y={sy} width={cellW} height={sh} fill="none" stroke="var(--border-subtle)" strokeWidth="1" />
                        <text x={cx + cellW / 2} y={sy + 25} textAnchor="middle" className="ipv6-struct-hex">{h}</text>
                      </g>
                    );
                  })}
                  <line x1={bx} y1={sy - 5} x2={bx} y2={sy + sh + 6} stroke="var(--accent-primary)" strokeWidth="2" strokeDasharray={hasPrefix ? undefined : "5 4"} />
                  <text x={bx} y={16} textAnchor="middle" className="ipv6-struct-bound">/{bp}</text>
                  {ticks.map((b) => {
                    const tx = bitToX(b);
                    return (
                      <g key={`t${b}`}>
                        <line x1={tx} y1={sy + sh} x2={tx} y2={sy + sh + 5} stroke="var(--border-strong)" strokeWidth="1" />
                        <text x={tx} y={sy + sh + 17} textAnchor="middle" className="ipv6-struct-tick">{b}</text>
                      </g>
                    );
                  })}
                </svg>
              );
            })()}
            <p className="ipv6-struct-note">
              {decoded.prefixLength != null ? t("prefixNote") : t("conventionNote")}
            </p>
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
