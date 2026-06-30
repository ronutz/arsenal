"use client";

// ============================================================================
// src/components/CipherTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE TLS CIPHER SUITE DECODER.
//
// Type a cipher suite in any common form - an IANA name (TLS_AES_128_GCM_SHA256),
// an OpenSSL name (ECDHE-RSA-AES128-GCM-SHA256), a GnuTLS name, or a hex code
// point (0x1301 / 0x13,0x01 / 1301) - and it resolves it against the vendored
// IANA TLS Cipher Suite registry and decodes the structure: key exchange,
// authentication, bulk cipher + key size + mode, MAC/PRF, plus a rule-based
// security assessment and the independent IANA "Recommended" flag.
//
// Everything runs IN THE BROWSER via the local cipher module - no fetch, no API.
// All output is escaped text through React (no dangerouslySetInnerHTML). The
// decode core is deterministic; nothing here is clock- or network-dependent.
// ============================================================================

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import {
  run,
  CipherDecodeError,
  NAMED_GROUPS,
  formatCodepoint,
  type DecodedCipherSuite,
} from "@/lib/tools/cipher";

// Which reason codes read as positive / negative / informational, for the
// colour-coded markers. (The text itself is localized in the message pack.)
const GOOD_REASONS = new Set(["aead", "fs", "tls13"]);
const BAD_REASONS = new Set([
  "nullCipher", "anon", "export40", "rc4", "singleDes", "rc2",
  "tripleDes", "md5Mac", "cbcMac", "ccm8", "noFs", "legacyCipher", "ianaD",
]);

/** Map a security rating to a badge kind. */
function ratingKind(rating: string): "ok" | "warn" | "bad" {
  if (rating === "recommended" || rating === "secure") return "ok";
  if (rating === "insecure") return "bad";
  return "warn"; // weak, unknown
}

/** Map the IANA Recommended flag to a badge kind. */
function ianaKind(rec: "Y" | "N" | "D"): "ok" | "warn" | "bad" {
  if (rec === "Y") return "ok";
  if (rec === "D") return "bad";
  return "warn";
}

export default function CipherTool() {
  const t = useTranslations("tools.cipher");

  const [value, setValue] = useState("");
  const [decoded, setDecoded] = useState<DecodedCipherSuite | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        const code = e instanceof CipherDecodeError ? e.code : "format";
        setError(t(`errors.${code}`));
        setDecoded(null);
      }
    },
    [t]
  );

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value);
    decode(e.target.value);
  }

  const c = decoded?.components;
  const yesNo = (b: boolean) => (b ? t("comp.yes") : t("comp.no"));

  return (
    <div className="cidr-tool jwt-tool cipher-tool">
      <div className="cidr-input-row">
        <label className="cidr-label" htmlFor="cipher-input">
          {t("inputLabel")}
        </label>
        <input
          id="cipher-input"
          type="text"
          className="cidr-input mono"
          value={value}
          onChange={onChange}
          placeholder={t("inputPlaceholder")}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-describedby="cipher-privacy"
        />
        <p id="cipher-privacy" className="cidr-privacy">
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
        <div className="jwt-results cipher-results">
          <div className="jwt-badges">
            <span className={`jwt-badge jwt-badge--${ratingKind(decoded.security.rating)}`}>
              {t(`ratings.${decoded.security.rating}`)}
            </span>
            <span className={`jwt-badge jwt-badge--${ianaKind(decoded.ianaRecommended)}`}>
              {t(`iana.${decoded.ianaRecommended}`)}
            </span>
            {decoded.tls13 && <span className="jwt-badge jwt-badge--ok">{t("badges.tls13")}</span>}
            {!decoded.inRegistry && (
              <span className="jwt-badge jwt-badge--warn">{t("badges.notInRegistry")}</span>
            )}
          </div>

          {/* Identity */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("panels.identity")}</h4>
            <dl className="jwt-claims">
              {decoded.inRegistry && (
                <div className="jwt-claim-row">
                  <dt className="jwt-claim-label">{t("fields.codePoint")}</dt>
                  <dd className="jwt-claim-value mono">{decoded.hex}</dd>
                </div>
              )}
              <div className="jwt-claim-row">
                <dt className="jwt-claim-label">{t("fields.name")}</dt>
                <dd className="jwt-claim-value mono">{decoded.name}</dd>
              </div>
              {decoded.openssl && (
                <div className="jwt-claim-row">
                  <dt className="jwt-claim-label">{t("fields.openssl")}</dt>
                  <dd className="jwt-claim-value mono">{decoded.openssl}</dd>
                </div>
              )}
              {decoded.gnutls && (
                <div className="jwt-claim-row">
                  <dt className="jwt-claim-label">{t("fields.gnutls")}</dt>
                  <dd className="jwt-claim-value mono">{decoded.gnutls}</dd>
                </div>
              )}
              <div className="jwt-claim-row">
                <dt className="jwt-claim-label">{t("fields.protocol")}</dt>
                <dd className="jwt-claim-value">
                  {decoded.tls13 ? t("protocol.tls13") : t("protocol.legacy")}
                </dd>
              </div>
              <div className="jwt-claim-row">
                <dt className="jwt-claim-label">{t("fields.dtls")}</dt>
                <dd className="jwt-claim-value">{yesNo(decoded.dtlsOk)}</dd>
              </div>
              {decoded.refs.length > 0 && (
                <div className="jwt-claim-row">
                  <dt className="jwt-claim-label">{t("fields.references")}</dt>
                  <dd className="jwt-claim-value">{decoded.refs.join(", ")}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Components */}
          {!decoded.signalling && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("panels.components")}</h4>
              <dl className="jwt-claims">
                <div className="jwt-claim-row">
                  <dt className="jwt-claim-label">{t("comp.keyExchange")}</dt>
                  <dd className="jwt-claim-value">
                    {c.keyExchange ?? t("comp.negotiatedSeparately")}
                  </dd>
                </div>
                <div className="jwt-claim-row">
                  <dt className="jwt-claim-label">{t("comp.authentication")}</dt>
                  <dd className="jwt-claim-value">
                    {c.authentication ?? t("comp.negotiatedSeparately")}
                  </dd>
                </div>
                <div className="jwt-claim-row">
                  <dt className="jwt-claim-label">{t("comp.forwardSecrecy")}</dt>
                  <dd className="jwt-claim-value">{yesNo(c.forwardSecrecy)}</dd>
                </div>
                <div className="jwt-claim-row">
                  <dt className="jwt-claim-label">{t("comp.cipher")}</dt>
                  <dd className="jwt-claim-value mono">
                    {c.cipherAlgorithm}
                    {c.cipherKeyBits !== undefined ? ` ${t("comp.bits", { n: c.cipherKeyBits })}` : ""}
                  </dd>
                </div>
                <div className="jwt-claim-row">
                  <dt className="jwt-claim-label">{t("comp.mode")}</dt>
                  <dd className="jwt-claim-value mono">{c.cipherMode}</dd>
                </div>
                <div className="jwt-claim-row">
                  <dt className="jwt-claim-label">{t("comp.aead")}</dt>
                  <dd className="jwt-claim-value">{yesNo(c.aead)}</dd>
                </div>
                <div className="jwt-claim-row">
                  <dt className="jwt-claim-label">{c.aead ? t("comp.prf") : t("comp.mac")}</dt>
                  <dd className="jwt-claim-value mono">{c.macOrPrf}</dd>
                </div>
              </dl>
            </section>
          )}

          {/* Security */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("panels.security")}</h4>
            <ul className="cipher-reasons">
              {decoded.security.reasons.map((r, i) => {
                const kind = GOOD_REASONS.has(r.code)
                  ? "good"
                  : BAD_REASONS.has(r.code)
                    ? "bad"
                    : "info";
                return (
                  <li key={`${r.code}-${i}`} className={`cipher-reason cipher-reason--${kind}`}>
                    <span>{t(`reasons.${r.code}`, r.value ? { value: r.value } : undefined)}</span>
                  </li>
                );
              })}
            </ul>
            {!decoded.inRegistry && <p className="cipher-note">{t("notInRegistryNote")}</p>}
          </section>
        </div>
      )}

      {/* Key-exchange groups reference (always shown; educational + PQ focus). */}
      <section className="jwt-panel cipher-groups-panel">
        <h4 className="jwt-panel-title">{t("groups.title")}</h4>
        <p className="cipher-groups-intro">{t("groups.intro")}</p>
        <ul className="cipher-groups-list">
          {NAMED_GROUPS.map((g) => {
            const classes =
              "cipher-group" +
              (g.pq === "hybrid-pq" ? " cipher-group--pq" : "") +
              (g.obsolete ? " cipher-group--obsolete" : "") +
              (g.legacy ? " cipher-group--legacy" : "");
            return (
              <li key={g.name} className={classes}>
                <div className="cipher-group-head">
                  <span className="cipher-group-name mono">{g.name}</span>
                  <span className="cipher-group-code mono">{formatCodepoint(g.codepoint)}</span>
                </div>
                <div className="cipher-group-tags">
                  <span className="cipher-group-tag">{t(`groups.kind.${g.kind}`)}</span>
                  <span
                    className={`cipher-group-tag cipher-group-tag--${
                      g.pq === "hybrid-pq" ? "pq" : "classical"
                    }`}
                  >
                    {t(`groups.pq.${g.pq}`)}
                  </span>
                  {g.recommended && (
                    <span className="cipher-group-tag cipher-group-tag--rec">
                      {t("groups.recommended")}
                    </span>
                  )}
                  {g.obsolete && (
                    <span className="cipher-group-tag cipher-group-tag--obsolete">
                      {t("groups.obsolete")}
                    </span>
                  )}
                  {g.legacy && (
                    <span className="cipher-group-tag cipher-group-tag--legacy">
                      {t("groups.legacy")}
                    </span>
                  )}
                </div>
                {g.combines && (
                  <p className="cipher-group-note">
                    {t("groups.combines", {
                      classical: g.combines.classical,
                      pq: g.combines.pq,
                    })}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
        <p className="cipher-groups-foot">{t("groups.foot")}</p>
      </section>
    </div>
  );
}
