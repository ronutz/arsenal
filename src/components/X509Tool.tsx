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

  return (
    <div className="cidr-tool jwt-tool x509-tool">
      <div className="cidr-input-row">
        <label className="cidr-label" htmlFor="x509-input">
          {t("inputLabel")}
        </label>
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
