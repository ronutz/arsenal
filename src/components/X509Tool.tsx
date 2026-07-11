"use client";

// ============================================================================
// src/components/X509Tool.tsx
// ----------------------------------------------------------------------------
// THE LIVE X.509 CERTIFICATE DECODER.
//
// PRIVACY/SECURITY (the architecture IS the control):
//   Decoding runs ENTIRELY IN THE BROWSER via the local x509 module - no fetch,
//   no API, no server, so the certificate never leaves the device. Fingerprints
//   are computed locally through the Web Crypto API (SHA-1 / SHA-256 over the
//   DER bytes). All output is rendered as escaped text through React (no
//   dangerouslySetInnerHTML), so even a hostile certificate cannot inject markup.
//
// The decode core (run) is deterministic and time-independent. Anything
// time-relative (expired? not-yet-valid?) is computed HERE against the live
// clock, so the pure module stays golden-vector-stable.
// ============================================================================

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { run, X509DecodeError, type DecodedCertificate } from "@/lib/tools/x509";
import { usePrefill } from "@/lib/use-prefill";

/** Hex-encode an ArrayBuffer, colon-grouped and upper-case (fingerprint form). */
function hexColon(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  const out: string[] = [];
  for (let i = 0; i < bytes.length; i++) out.push(bytes[i].toString(16).padStart(2, "0").toUpperCase());
  return out.join(":");
}

/** Largest-unit relative time ("in 2 years", "3 days ago") in the active locale. */
function relativeTime(deltaSeconds: number, locale: string): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const abs = Math.abs(deltaSeconds);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
    ["second", 1],
  ];
  for (const [unit, secs] of units) {
    if (abs >= secs || unit === "second") return rtf.format(Math.round(deltaSeconds / secs), unit);
  }
  return rtf.format(0, "second");
}

type ChainTier = "root" | "intermediate" | "leaf";
const CHAIN_TIERS: { key: ChainTier; labelKey: string; roleKey: string }[] = [
  { key: "root", labelKey: "tierRoot", roleKey: "roleRoot" },
  { key: "intermediate", labelKey: "tierIntermediate", roleKey: "roleIntermediate" },
  { key: "leaf", labelKey: "tierLeaf", roleKey: "roleLeaf" },
];
function cnOf(dn: { attributes: { type: string; value: string }[]; text: string }): string {
  return dn.attributes.find((a) => a.type === "CN")?.value ?? dn.text;
}
function truncateLabel(s: string, n = 46): string {
  return s.length > n ? s.slice(0, n - 1) + "\u2026" : s;
}

// D-83 Example samples — verbatim from this tool's golden vectors.
const EXAMPLE = "-----BEGIN CERTIFICATE-----\nMIIELDCCAxSgAwIBAgIGGis8TV5vMA0GCSqGSIb3DQEBCwUAMHoxCzAJBgNVBAYT\nAkJSMRIwEAYDVQQIDAlTYW8gUGF1bG8xEjAQBgNVBAcMCVNhbyBQYXVsbzEXMBUG\nA1UECgwOTlRaIFRlY2hub2xvZ3kxEDAOBgNVBAsMB0Fyc2VuYWwxGDAWBgNVBAMM\nD3Rlc3Qucm9udXR6LmNvbTAeFw0yNjA2MjYwNDI3MzRaFw0zNjA2MjMwNDI3MzRa\nMHoxCzAJBgNVBAYTAkJSMRIwEAYDVQQIDAlTYW8gUGF1bG8xEjAQBgNVBAcMCVNh\nbyBQYXVsbzEXMBUGA1UECgwOTlRaIFRlY2hub2xvZ3kxEDAOBgNVBAsMB0Fyc2Vu\nYWwxGDAWBgNVBAMMD3Rlc3Qucm9udXR6LmNvbTCCASIwDQYJKoZIhvcNAQEBBQAD\nggEPADCCAQoCggEBALwOgIj4c3kdS4Xg2PosyzzgJ06lZM9xD+3XHr4N857o56Hi\nqumKeYQM/4jkOJWhKz5StbWNXqZ1lbrjQwr9RV9kV6jqMo/iQYlmlmxsTeWoJ61Q\n6VYeAIsZrJSCr7tS0ZH9nAYzJYz/FnqtSjwm9EPEc/zahpMvSNLYS3R/d1m41EG4\nJhE1hL9tvF7Hb/7KaoxVuot86kOiAf20j5RsM86f/0LdXHAWro4VUAMvukqSW+Y2\nohhmRHq4OvAxNccxUBAVG6txUuaSVOxTNVj2tD+0ZFXWrLdZtLAWcXC1BmDi5UiB\n+0loZvGF4oqL1DlNJzg5C74wiQ0LzIznnm89hO8CAwEAAaOBtzCBtDAdBgNVHQ4E\nFgQUu2Q3pfojzu7xdoDhP2xGe0Xikz0wHwYDVR0jBBgwFoAUu2Q3pfojzu7xdoDh\nP2xGe0Xikz0wNQYDVR0RBC4wLIIPdGVzdC5yb251dHouY29tghN3d3cudGVzdC5y\nb251dHouY29thwTAAAIKMAwGA1UdEwEB/wQCMAAwDgYDVR0PAQH/BAQDAgWgMB0G\nA1UdJQQWMBQGCCsGAQUFBwMBBggrBgEFBQcDAjANBgkqhkiG9w0BAQsFAAOCAQEA\nZLJsSDfnqw1fq796la2eG4rvmiSSJjJ538572mwEy+onM7I3YLYCcB3WigGUzGCN\nZrCxxSjM8o0fxzsAC6lF0R8/TH2JGcIkbDs9AeKrxk2R6rzw9GX7piuY8coq3/as\nkajp304mXNvu3fDab2+ZS1V9GtxwFH85PfToN5le5Hj5r32C5li3COCd50MldjtA\nuxXXdP0pZ6kQXPiANQMEsd3Cw3WwajsDBVVoS51q0aBXwpaXYVZKOQseXYnxGLIx\nQtPSAxwFS8aeZ+jBOyChneaQiUdMc6QtK5NdWgGhSI3eAOr7T2sV/ZGgQqTxNd05\nPoj+ZRuLb3wyRtsDCQJiDw==\n-----END CERTIFICATE-----";

export default function X509Tool() {
  const t = useTranslations("tools.x509");
  const locale = useLocale();

  const [value, setValue] = useState("");
  const [decoded, setDecoded] = useState<DecodedCertificate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fingerprints, setFingerprints] = useState<{ sha1: string; sha256: string } | null>(null);

  // Decode locally. Empty input clears; malformed input maps the stable error
  // code to a friendly, localized message.
  const decode = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) {
        setDecoded(null);
        setError(null);
        return;
      }
      try {
        setDecoded(run(trimmed));
        setError(null);
      } catch (e) {
        const code = e instanceof X509DecodeError ? e.code : "format";
        setError(t(`errors.${code}`));
        setDecoded(null);
      }
    },
    [t]
  );

  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    decode(e.target.value);
  }

  // Fingerprints: hash the DER locally whenever a new certificate decodes.
  useEffect(() => {
    let cancelled = false;
    if (!decoded) {
      setFingerprints(null);
      return;
    }
    (async () => {
      try {
        // Copy into a fresh ArrayBuffer-backed view so the bytes satisfy
        // BufferSource (Web Crypto's digest excludes possibly-shared buffers).
        const der = new Uint8Array(decoded.der);
        const [s1, s256] = await Promise.all([
          crypto.subtle.digest("SHA-1", der),
          crypto.subtle.digest("SHA-256", der),
        ]);
        if (!cancelled) setFingerprints({ sha1: hexColon(s1), sha256: hexColon(s256) });
      } catch {
        if (!cancelled) setFingerprints(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [decoded]);

  // Time-relative validity, computed against the live clock (client-only path:
  // this only renders once `decoded` is set, which never happens at build).
  const nowSec = Date.now() / 1000;
  let validityBadge: { kind: "ok" | "bad" | "warn"; text: string } | null = null;
  if (decoded) {
    const nb = Date.parse(decoded.validity.notBefore) / 1000;
    const na = Date.parse(decoded.validity.notAfter) / 1000;
    if (na < nowSec) {
      validityBadge = { kind: "bad", text: t("status.expired", { rel: relativeTime(na - nowSec, locale) }) };
    } else if (nb > nowSec) {
      validityBadge = { kind: "warn", text: t("status.notYetValid", { rel: relativeTime(nb - nowSec, locale) }) };
    } else {
      validityBadge = { kind: "ok", text: t("status.valid", { rel: relativeTime(na - nowSec, locale) }) };
    }
  }

  const ext = decoded?.extensions;

  usePrefill((v) => {
    setValue(v);
    decode(v);
  });

  return (
    <div className="cidr-tool jwt-tool x509-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="x509-input">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => { setValue(EXAMPLE); decode(EXAMPLE); }}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => { setValue(""); decode(""); }}>{t("clear")}</button>
          </div>
        </div>
        <textarea
          id="x509-input"
          className="cidr-input jwt-input mono"
          value={value}
          onChange={onChange}
          placeholder={t("inputPlaceholder")}
          rows={6}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-describedby="x509-privacy"
        />
        <p id="x509-privacy" className="cidr-privacy">
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

      {decoded && (
        <div className="jwt-results x509-results">
          <div className="jwt-badges">
            {validityBadge && (
              <span className={`jwt-badge jwt-badge--${validityBadge.kind}`}>{validityBadge.text}</span>
            )}
            {decoded.selfIssued && <span className="jwt-badge jwt-badge--warn">{t("fields.selfSigned")}</span>}
            {ext?.basicConstraints?.ca && <span className="jwt-badge jwt-badge--warn">{t("ext.caTrue")}</span>}
          </div>

          {/* Chain of trust */}
          <section className="jwt-panel x509-chain-panel">
            <h4 className="jwt-panel-title">{t("chainHeading")}</h4>
            {(() => {
              const ca = !!ext?.basicConstraints?.ca;
              const certTier: ChainTier = decoded.selfIssued ? "root" : ca ? "intermediate" : "leaf";
              const subjCN = truncateLabel(cnOf(decoded.subject));
              const issCN = truncateLabel(cnOf(decoded.issuer));
              const boxH = 70;
              const gap = 30;
              const top = 8;
              const boxX = 60;
              const boxW = 560;
              const H = top + 3 * boxH + 2 * gap + 8;
              const yOf = (i: number) => top + i * (boxH + gap);
              return (
                <svg
                  className="x509-chain-svg"
                  viewBox={`0 0 680 ${H}`}
                  role="img"
                  aria-label={t("chainHeading")}
                >
                  {CHAIN_TIERS.map((tier, i) => {
                    const by = yOf(i);
                    const active = tier.key === certTier;
                    const accent = "var(--accent-primary)";
                    return (
                      <g key={tier.key}>
                        {i < 2 && (
                          <g>
                            <line x1="340" y1={by + boxH} x2="340" y2={by + boxH + gap} stroke="var(--border-strong)" strokeWidth="2" />
                            <path d={`M335 ${by + boxH + gap - 7} L340 ${by + boxH + gap} L345 ${by + boxH + gap - 7}`} fill="none" stroke="var(--border-strong)" strokeWidth="2" />
                            <text x="352" y={by + boxH + gap / 2 + 4} className="x509-chain-arrowlabel">{t("signs")}</text>
                          </g>
                        )}
                        <rect
                          x={boxX}
                          y={by}
                          width={boxW}
                          height={boxH}
                          rx="8"
                          fill={active ? "var(--surface-elevated)" : "var(--surface-base)"}
                          stroke={active ? accent : "var(--border-subtle)"}
                          strokeWidth={active ? "1.5" : "1"}
                          strokeDasharray={active ? undefined : "5 4"}
                        />
                        {active && <rect x={boxX} y={by} width="4" height={boxH} fill={accent} />}
                        <text x={boxX + 20} y={by + 24} className={active ? "x509-chain-tier x509-chain-tier-on" : "x509-chain-tier"}>
                          {t(tier.labelKey)}
                          {active ? `  \u00b7  ${t("thisCert")}` : ""}
                        </text>
                        {active ? (
                          <g>
                            <text x={boxX + 20} y={by + 44} className="x509-chain-cn">{subjCN}</text>
                            <text x={boxX + 20} y={by + 60} className="x509-chain-iss">
                              {decoded.selfIssued ? t("fields.selfSigned") : `${t("issuedBy")}: ${issCN}`}
                            </text>
                          </g>
                        ) : (
                          <text x={boxX + 20} y={by + 45} className="x509-chain-role">{t(tier.roleKey)}</text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              );
            })()}
            <p className="x509-chain-note">{t("trustNote")}</p>
          </section>

          {/* Subject */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("panels.subject")}</h4>
            <dl className="jwt-claims">
              {decoded.subject.attributes.map((a, i) => (
                <div className="jwt-claim-row" key={`s-${i}`}>
                  <dt className="jwt-claim-label">{a.type}</dt>
                  <dd className="jwt-claim-value mono">{a.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Issuer */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("panels.issuer")}</h4>
            <dl className="jwt-claims">
              {decoded.issuer.attributes.map((a, i) => (
                <div className="jwt-claim-row" key={`i-${i}`}>
                  <dt className="jwt-claim-label">{a.type}</dt>
                  <dd className="jwt-claim-value mono">{a.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Validity + details */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("panels.details")}</h4>
            <dl className="jwt-claims">
              <div className="jwt-claim-row">
                <dt className="jwt-claim-label">{t("fields.version")}</dt>
                <dd className="jwt-claim-value mono">v{decoded.version}</dd>
              </div>
              <div className="jwt-claim-row">
                <dt className="jwt-claim-label">{t("fields.serial")}</dt>
                <dd className="jwt-claim-value mono">{decoded.serialNumberHex}</dd>
              </div>
              <div className="jwt-claim-row">
                <dt className="jwt-claim-label">{t("fields.notBefore")}</dt>
                <dd className="jwt-claim-value mono">{decoded.validity.notBefore}</dd>
              </div>
              <div className="jwt-claim-row">
                <dt className="jwt-claim-label">{t("fields.notAfter")}</dt>
                <dd className="jwt-claim-value mono">{decoded.validity.notAfter}</dd>
              </div>
              <div className="jwt-claim-row">
                <dt className="jwt-claim-label">{t("fields.signatureAlgorithm")}</dt>
                <dd className="jwt-claim-value mono">{decoded.signatureAlgorithm}</dd>
              </div>
            </dl>
          </section>

          {/* Public key */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("panels.publicKey")}</h4>
            <dl className="jwt-claims">
              <div className="jwt-claim-row">
                <dt className="jwt-claim-label">{t("fields.algorithm")}</dt>
                <dd className="jwt-claim-value mono">{decoded.publicKey.algorithm}</dd>
              </div>
              {decoded.publicKey.keySizeBits !== undefined && (
                <div className="jwt-claim-row">
                  <dt className="jwt-claim-label">{t("fields.keySize")}</dt>
                  <dd className="jwt-claim-value mono">{t("fields.bits", { n: decoded.publicKey.keySizeBits })}</dd>
                </div>
              )}
              {decoded.publicKey.exponent !== undefined && (
                <div className="jwt-claim-row">
                  <dt className="jwt-claim-label">{t("fields.exponent")}</dt>
                  <dd className="jwt-claim-value mono">{decoded.publicKey.exponent}</dd>
                </div>
              )}
              {decoded.publicKey.curve !== undefined && (
                <div className="jwt-claim-row">
                  <dt className="jwt-claim-label">{t("fields.curve")}</dt>
                  <dd className="jwt-claim-value mono">{decoded.publicKey.curve}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Extensions */}
          {ext && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("panels.extensions")}</h4>
              <dl className="jwt-claims">
                {ext.subjectAltName && (
                  <div className="jwt-claim-row">
                    <dt className="jwt-claim-label">{t("ext.san")}</dt>
                    <dd className="jwt-claim-value mono">
                      {ext.subjectAltName.entries.map((s) => `${s.type}:${s.value}`).join(", ")}
                    </dd>
                  </div>
                )}
                {ext.keyUsage && (
                  <div className="jwt-claim-row">
                    <dt className="jwt-claim-label">{t("ext.keyUsage")}</dt>
                    <dd className="jwt-claim-value mono">{ext.keyUsage.usages.join(", ")}</dd>
                  </div>
                )}
                {ext.extendedKeyUsage && (
                  <div className="jwt-claim-row">
                    <dt className="jwt-claim-label">{t("ext.extKeyUsage")}</dt>
                    <dd className="jwt-claim-value mono">{ext.extendedKeyUsage.purposes.join(", ")}</dd>
                  </div>
                )}
                {ext.basicConstraints && (
                  <div className="jwt-claim-row">
                    <dt className="jwt-claim-label">{t("ext.basicConstraints")}</dt>
                    <dd className="jwt-claim-value mono">
                      {ext.basicConstraints.ca ? t("ext.caTrue") : t("ext.caFalse")}
                      {ext.basicConstraints.pathLen !== undefined
                        ? ` · ${t("ext.pathLen", { n: ext.basicConstraints.pathLen })}`
                        : ""}
                    </dd>
                  </div>
                )}
                {ext.subjectKeyId && (
                  <div className="jwt-claim-row">
                    <dt className="jwt-claim-label">{t("ext.subjectKeyId")}</dt>
                    <dd className="jwt-claim-value mono">{ext.subjectKeyId.keyId}</dd>
                  </div>
                )}
                {ext.authorityKeyId && ext.authorityKeyId.keyId && (
                  <div className="jwt-claim-row">
                    <dt className="jwt-claim-label">{t("ext.authorityKeyId")}</dt>
                    <dd className="jwt-claim-value mono">{ext.authorityKeyId.keyId}</dd>
                  </div>
                )}
                {ext.other.map((o, i) => (
                  <div className="jwt-claim-row" key={`x-${i}`}>
                    <dt className="jwt-claim-label">{o.name}</dt>
                    <dd className="jwt-claim-value mono">
                      {o.oid}
                      {o.critical ? ` · ${t("ext.critical")}` : ""}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* Certificate Transparency SCTs (RFC 6962), decoded structurally */}
          {ext && ext.signedCertificateTimestamps && ext.signedCertificateTimestamps.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("panels.sct")}</h4>
              <p className="x509-sct-intro">{t("sct.intro", { n: ext.signedCertificateTimestamps.length })}</p>
              <dl className="jwt-claims">
                {ext.signedCertificateTimestamps.map((s, i) => (
                  <div className="jwt-claim-row" key={`sct-${i}`}>
                    <dt className="jwt-claim-label">{t("sct.entry", { i: i + 1 })}</dt>
                    <dd className="jwt-claim-value mono">
                      <span className="x509-sct-line">
                        {t("sct.logId")}: {s.logIdHex}
                      </span>
                      <span className="x509-sct-line">
                        {t("sct.timestamp")}: {s.timestamp}
                      </span>
                      <span className="x509-sct-line">
                        {t("sct.signature")}: {s.signatureAlgorithm} / {s.hashAlgorithm}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="saml-note saml-note--verify">{t("sct.note")}</p>
            </section>
          )}

          {/* Revocation pointers (extracted from the cert; never a live lookup) */}
          {ext && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("panels.revocation")}</h4>
              <dl className="jwt-claims">
                {ext.revocation.crlUrls.length > 0 && (
                  <div className="jwt-claim-row">
                    <dt className="jwt-claim-label">{t("rev.crl")}</dt>
                    <dd className="jwt-claim-value mono">{ext.revocation.crlUrls.join(" · ")}</dd>
                  </div>
                )}
                {ext.revocation.ocspUrls.length > 0 && (
                  <div className="jwt-claim-row">
                    <dt className="jwt-claim-label">{t("rev.ocsp")}</dt>
                    <dd className="jwt-claim-value mono">{ext.revocation.ocspUrls.join(" · ")}</dd>
                  </div>
                )}
                {ext.revocation.caIssuerUrls.length > 0 && (
                  <div className="jwt-claim-row">
                    <dt className="jwt-claim-label">{t("rev.caIssuers")}</dt>
                    <dd className="jwt-claim-value mono">{ext.revocation.caIssuerUrls.join(" · ")}</dd>
                  </div>
                )}
                {ext.revocation.mustStaple && (
                  <div className="jwt-claim-row">
                    <dt className="jwt-claim-label">{t("rev.mustStaple")}</dt>
                    <dd className="jwt-claim-value mono">{t("rev.mustStapleYes")}</dd>
                  </div>
                )}
                {ext.revocation.crlUrls.length === 0 &&
                  ext.revocation.ocspUrls.length === 0 &&
                  ext.revocation.caIssuerUrls.length === 0 &&
                  !ext.revocation.mustStaple && (
                    <div className="jwt-claim-row">
                      <dt className="jwt-claim-label">{t("rev.none")}</dt>
                      <dd className="jwt-claim-value">{t("rev.noneDetail")}</dd>
                    </div>
                  )}
              </dl>
              <p className="saml-note saml-note--verify">{t("rev.note")}</p>
            </section>
          )}

          {/* Fingerprints (computed live via Web Crypto) */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("panels.fingerprints")}</h4>
            {fingerprints ? (
              <dl className="jwt-claims">
                <div className="jwt-claim-row">
                  <dt className="jwt-claim-label">{t("fp.sha256")}</dt>
                  <dd className="jwt-claim-value mono">{fingerprints.sha256}</dd>
                </div>
                <div className="jwt-claim-row">
                  <dt className="jwt-claim-label">{t("fp.sha1")}</dt>
                  <dd className="jwt-claim-value mono">{fingerprints.sha1}</dd>
                </div>
              </dl>
            ) : (
              <p className="jwt-verify-hint">{t("fp.computing")}</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
