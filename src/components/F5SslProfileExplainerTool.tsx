"use client";

// ============================================================================
// src/components/F5SslProfileExplainerTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE F5 SSL PROFILE EXPLAINER.
//
// Paste a tmsh `ltm profile client-ssl` or `server-ssl` block and get, live:
// the profile's role, the TLS protocol matrix derived from `options`, a
// security assessment (🟢/🟡/🟠/🔴), and every recognized setting explained —
// cert-key-chain, ciphers, renegotiation, SNI, OCSP stapling, peer validation.
// Parsing runs entirely in the browser; it never contacts a device.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  explainSslProfile,
  SslProfileInputError,
  type SslProfileAnalysis,
  type Level,
} from "@/lib/tools/f5-ssl-profile-explainer";

type Result =
  | { ok: true; data: SslProfileAnalysis }
  | { ok: false; code: string };

// D-83 Example samples — verbatim from this tool's golden vectors.
const EXAMPLE = "ltm profile client-ssl /Common/web_clientssl {\n      cert-key-chain { rsa { cert /Common/www.crt key /Common/www.key chain /Common/int.crt } }\n      cipher-group /Common/f5-secure\n      ciphers none\n      options { dont-insert-empty-fragments cipher-server-preference no-sslv3 no-tlsv1 no-tlsv1.1 }\n      renegotiation disabled\n      secure-renegotiation require\n      server-name www.example.com\n      sni-default true\n      ocsp-stapling enabled\n    }";

export default function F5SslProfileExplainerTool() {
  const t = useTranslations("tools.f5-ssl-profile-explainer");
  const [input, setInput] = useState("");

  const result: Result | null = useMemo(() => {
    const s = input.trim();
    if (!s) return null;
    try {
      return { ok: true, data: explainSslProfile(s) };
    } catch (e) {
      const code = e instanceof SslProfileInputError ? e.code : "invalid";
      return { ok: false, code };
    }
  }, [input]);

  const errMsg = (code: string): string => {
    const known = ["empty", "noHeader", "noBody", "tooLong"];
    return known.includes(code) ? t(`err_${code}`) : t("err_invalid");
  };

  const levelDot = (level: Level): string =>
    level === "high" ? "🔴" : level === "medium" ? "🟠" : level === "low" ? "🟡" : "🟢";

  return (
    <div className="cidr-tool jwt-tool saml-tool json-tool tmsh-tool ssl-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="ssl-input">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
          </div>
        </div>
        <textarea
          id="ssl-input"
          className="cidr-input mono saml-textarea json-input ssl-input"
          rows={8}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("inputPlaceholder")}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-describedby="ssl-privacy"
        />
        <p id="ssl-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            ●
          </span>
          {t("runsLocally")}
        </p>
        <p className="cipherstr-scope">{t("scopeNote")}</p>
      </div>

      {result && !result.ok && (
        <div className="json-error-box" role="alert">
          <p className="json-error-headline">{t("errorTitle")}</p>
          <p className="json-error-message">{errMsg(result.code)}</p>
        </div>
      )}

      {result && result.ok && (
        <div className="tmsh-results ssl-results">
          {/* Header: type + role */}
          <section className="ssl-header">
            <div className="ssl-header-row">
              <span className={`ssl-type ssl-type-${result.data.profileType}`}>
                {result.data.profileType}
              </span>
              {result.data.name && (
                <code className="ssl-name mono">
                  {result.data.partition ? `/${result.data.partition}/` : ""}
                  {result.data.name}
                </code>
              )}
            </div>
            <p className="ssl-role">{result.data.role}</p>
          </section>

          {/* Data-path topology */}
          <section className="persist-section ssl-topo-section">
            <h3 className="persist-heading">{t("topoHeading")}</h3>
            {(() => {
              const isClient = result.data.profileType === "client-ssl";
              const pname = result.data.name ?? "";
              const nodes = [
                { key: "client", label: t("nodeClient"), x: 18, w: 118 },
                { key: "bigip", label: t("nodeBigip"), x: 281, w: 118 },
                { key: "pool", label: t("nodePool"), x: 544, w: 118 },
              ];
              const nodeY = 40;
              const nodeH = 44;
              const legY = nodeY + nodeH / 2;
              const accent = "var(--accent-primary)";
              const muted = "var(--border-strong)";
              const padlock = (cx: number, cy: number, color: string) => (
                <g>
                  <rect x={cx - 7} y={cy - 1} width="14" height="11" rx="2" fill={color} />
                  <path d={`M ${cx - 4} ${cy - 1} v-3 a4 4 0 0 1 8 0 v3`} fill="none" stroke={color} strokeWidth="1.5" />
                </g>
              );
              const renderLeg = (x1: number, x2: number, active: boolean, nameKey: string) => {
                const mid = (x1 + x2) / 2;
                const color = active ? accent : muted;
                return (
                  <g key={nameKey}>
                    <line x1={x1} y1={legY} x2={x2} y2={legY} stroke={color} strokeWidth={active ? 2.5 : 1.5} strokeDasharray={active ? undefined : "5 4"} />
                    <text x={mid} y={legY - 16} textAnchor="middle" className={active ? "ssl-topo-leg ssl-topo-leg-on" : "ssl-topo-leg"}>{t(nameKey)}</text>
                    {active && padlock(mid, legY, accent)}
                    {active && <text x={mid} y={legY + 17} textAnchor="middle" className="ssl-topo-this">{t("thisProfile")}</text>}
                    {active && pname && <text x={mid} y={legY + 31} textAnchor="middle" className="ssl-topo-pname">{pname}</text>}
                  </g>
                );
              };
              return (
                <svg className="ssl-topo-svg" viewBox="0 0 680 108" role="img" aria-label={t("topoHeading")}>
                  {renderLeg(136, 281, isClient, "clientLeg")}
                  {renderLeg(399, 544, !isClient, "serverLeg")}
                  {nodes.map((n) => (
                    <g key={n.key}>
                      <rect x={n.x} y={nodeY} width={n.w} height={nodeH} rx="8" fill="var(--surface-elevated)" stroke="var(--border-strong)" />
                      <text x={n.x + n.w / 2} y={nodeY + nodeH / 2 + 4} textAnchor="middle" className="ssl-topo-node">{n.label}</text>
                    </g>
                  ))}
                </svg>
              );
            })()}
            <p className="ssl-topo-note">
              {result.data.profileType === "client-ssl" ? t("clientNote") : t("serverNote")}
            </p>
          </section>

          {/* Protocol matrix */}
          <section className="persist-section">
            <h3 className="persist-heading">{t("protocolsHeading")}</h3>
            <div className="ssl-proto-grid">
              {result.data.protocols.map((p) => (
                <div
                  key={p.name}
                  className={`ssl-proto ssl-proto-${p.enabled ? "on" : "off"} ssl-lvl-${p.level}`}
                >
                  <span className="ssl-proto-name mono">{p.name}</span>
                  <span className="ssl-proto-state">
                    {p.enabled ? t("permitted") : t("disabled")}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Findings */}
          <section className="persist-section">
            <h3 className="persist-heading">{t("findingsHeading")}</h3>
            <ul className="ssl-findings">
              {result.data.findings.map((f, i) => (
                <li key={i} className={`ssl-finding ssl-lvl-${f.level}`}>
                  <span className="ssl-finding-dot" aria-hidden="true">
                    {levelDot(f.level)}
                  </span>
                  <div className="ssl-finding-body">
                    <span className="ssl-finding-title">{f.title}</span>
                    <span className="ssl-finding-detail">{f.detail}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Settings explained */}
          {result.data.fields.length > 0 && (
            <section className="persist-section">
              <h3 className="persist-heading">{t("settingsHeading")}</h3>
              <dl className="ssl-fields">
                {result.data.fields.map((f, i) => (
                  <div key={i} className="ssl-field">
                    <dt className="ssl-field-key">
                      <code className="mono">{f.key}</code>
                      <code className="ssl-field-val mono">{f.value}</code>
                    </dt>
                    <dd className="ssl-field-explain">{f.explain}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
