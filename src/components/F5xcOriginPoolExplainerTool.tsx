"use client";

// ============================================================================
// src/components/F5xcOriginPoolExplainerTool.tsx
// ----------------------------------------------------------------------------
// UI for the F5XC origin pool explainer. Paste an origin_pool spec; the decoded
// origin servers, pool settings (port, algorithm, endpoint selection, health
// checks), and TLS-to-origin block (level, SNI, server verification, mTLS) are
// shown, with notes and warnings. Reuses cidr-* / jwt-* vocabulary.
//
// Share results (2026-11-01, wave 4B): a button under the origin servers
// builds a link, only when pressed, carrying a copy of the pool with every
// SecretType secret (an mTLS certificate's private key) replaced (src/lib/
// tools/f5xc-origin-pool-explainer/share.ts, posture derived). An arriving
// link fills the box, and the page reads it.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { explainOriginPool } from "@/lib/tools/f5xc-origin-pool-explainer/compute";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { firstSharePlace } from "@/lib/share/text-secrets"; // the first maybe-secret, for the popover line
import { ORIGIN_POOL_SHARE, encodePoolShare, poolShareCopy } from "@/lib/tools/f5xc-origin-pool-explainer/share"; // this tool's share spec

const EXAMPLE = JSON.stringify(
  {
    metadata: { name: "buytime-pool" },
    spec: {
      origin_servers: [
        { public_name: { dns_name: "webserver.example.com" }, labels: { tier: "web" } },
        { k8s_service: { service_name: "frontend.hipster", site_locator: { site: { name: "ce-site-1" } } } },
      ],
      port: 443,
      loadbalancer_algorithm: "ROUND_ROBIN",
      endpoint_selection: "LOCAL_PREFERRED",
      healthcheck: [{ name: "http-hc" }],
      use_tls: { tls_config: { default_security: {} }, use_host_header_as_sni: {}, volterra_trusted_ca: {}, no_mtls: {} },
    },
  },
  null,
  2,
);

export default function F5xcOriginPoolExplainerTool() {
  const t = useTranslations("tools.f5xc-origin-pool-explainer");
  const [text, setText] = useState("");
  const r = useMemo(() => (text.trim() !== "" ? explainOriginPool(text) : null), [text]);
  // An arriving share link (2026-11-01): the box fills as a paste would, and the page reads it.
  useShareArrival(ORIGIN_POOL_SHARE, (s) => setText(s.input)); // the link's text
  // The pool's copy, once per change of the box (only while there is a pool to share).
  const shareCopy = useMemo(() => (r && r.recognized ? poolShareCopy(text, r) : null), [r, text]); // or null
  // What Share results may carry: the copy, nothing, or blocked.
  const share = useMemo(() => encodePoolShare(shareCopy), [shareCopy]); // the encoding
  // The first secret-looking name with a value, named in place of the plain caution.
  const maybe = shareCopy && shareCopy.copy.ok ? firstSharePlace(shareCopy.copy.report.maybe) : null; // or null
  // The popover's lines under the first: how many values were replaced, then the caution (or the maybe line).
  const shareDetails = shareCopy && shareCopy.copy.ok ? [t("share.replaced", { n: shareCopy.copy.replaced }), maybe ? t("share.maybeSecret", { line: maybe.line, label: maybe.label, more: maybe.more }) : t("share.caution")] : []; // two lines
  // Why there is no link, when there is none.
  const shareBlocked = !share.ok && share.reason === "blocked" ? (share.code === "secret" ? t("share.blockedSecret", { line: Number(share.values?.line ?? 0), label: String(share.values?.label ?? ""), more: Number(share.values?.more ?? 0) }) : t("share.blockedCopy")) : ""; // or nothing

  return (
    <div className="cidr-tool jwt-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="pool-json">
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
        <textarea id="pool-json" className="cidr-input mono json-input" value={text} onChange={(e) => setText(e.target.value)} placeholder={t("placeholder")} rows={8} autoComplete="off" spellCheck={false} />
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
          {r.warnings[0] ?? t("unrecognized")}
        </p>
      )}

      {r && r.recognized && (
        <div className="jwt-results">
          {/* origin servers */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{r.name ? t("poolTitle", { name: r.name }) : t("originsTitle")}</h4>
            {r.origins.map((o, i) => (
              <div className="jwt-claim-row" key={i}>
                <span className="jwt-claim-label">
                  <span className="jwt-badge mono">{o.typeLabel}</span>
                </span>
                <span className="jwt-claim-value mono">
                  {o.address}
                  {o.location ? ` @ ${o.location}` : ""}
                  {o.labels.length ? `  [${o.labels.join(", ")}]` : ""}
                </span>
              </div>
            ))}
          </section>

          {/* Share results (2026-11-01): under the origin servers, the first answer, at the start of its own row. */}
          <div className="rdap-ask-row">
            <ShareResultsButton encoding={share} carries={t("share.carries")} details={shareDetails} blockedMessage={shareBlocked} title={t("name")} />
          </div>

          {/* pool settings */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("settingsTitle")}</h4>
            <div className="jwt-claim-row">
              <span className="jwt-claim-label">{t("portLabel")}</span>
              <span className="jwt-claim-value mono">
                {t(`port.${r.port.kind}`)}
                {r.port.value != null ? ` ${r.port.value}` : ""}
              </span>
            </div>
            {r.algorithm && (
              <div className="jwt-claim-row">
                <span className="jwt-claim-label">{t("algoLabel")}</span>
                <span className="jwt-claim-value mono">{r.algorithm}</span>
              </div>
            )}
            {r.endpointSelection && (
              <div className="jwt-claim-row">
                <span className="jwt-claim-label">{t("endpointLabel")}</span>
                <span className="jwt-claim-value mono">{r.endpointSelection}</span>
              </div>
            )}
            <div className="jwt-claim-row">
              <span className="jwt-claim-label">{t("hcLabel")}</span>
              <span className="jwt-claim-value mono">{r.healthchecks.length ? r.healthchecks.join(", ") : t("hcNone")}</span>
            </div>
          </section>

          {/* TLS to origin */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">
              {t("tlsTitle")}{" "}
              <span className={`jwt-badge mono ${r.tls.enabled ? "jwt-badge--ok" : ""}`}>{r.tls.enabled ? t("tlsOn") : t("tlsOff")}</span>
            </h4>
            {r.tls.enabled && (
              <>
                <div className="jwt-claim-row">
                  <span className="jwt-claim-label">{t("levelLabel")}</span>
                  <span className="jwt-claim-value mono">
                    {r.tls.level === "custom" ? t("level.custom") : `${r.tls.level} (${r.tls.minTls} - ${r.tls.maxTls})`}
                  </span>
                </div>
                <div className="jwt-claim-row">
                  <span className="jwt-claim-label">{t("sniLabel")}</span>
                  <span className="jwt-claim-value mono">
                    {t(`sni.${r.tls.sni}`)}
                    {r.tls.sniValue ? ` ${r.tls.sniValue}` : ""}
                  </span>
                </div>
                <div className="jwt-claim-row">
                  <span className="jwt-claim-label">{t("verifyLabel")}</span>
                  <span className={`jwt-badges`}>
                    <span className={`jwt-badge mono ${r.tls.serverVerify === "skip" ? "jwt-badge--bad" : ""}`}>{t(`verify.${r.tls.serverVerify}`)}</span>
                  </span>
                </div>
                <div className="jwt-claim-row">
                  <span className="jwt-claim-label">{t("mtlsLabel")}</span>
                  <span className="jwt-claim-value mono">{r.tls.mtls ? t("mtlsOn") : t("mtlsOff")}</span>
                </div>
              </>
            )}
          </section>

          {r.warnings.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("warningsLabel")}</h4>
              {r.warnings.map((w, i) => (
                <p className="cipher-note" key={i}>
                  ⚠ {w}
                </p>
              ))}
            </section>
          )}
          {r.notes.map((n, i) => (
            <p className="cipher-note" key={i}>
              {n}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
