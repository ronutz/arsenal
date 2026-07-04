"use client";

// ============================================================================
// src/components/JwtTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE JWT DECODER & VERIFIER - second tool on the site.
//
// PRIVACY/SECURITY (the architecture IS the control):
//   Decoding runs ENTIRELY IN THE BROWSER via the local jwt module - no fetch,
//   no API, no server, so the token never leaves the device. Signature
//   verification also runs locally through the Web Crypto API (HMAC); the secret
//   you paste is used only to compute an HMAC in-page and is never transmitted.
//   All output is rendered as escaped text through React (no
//   dangerouslySetInnerHTML), so even a hostile token cannot inject markup.
//
// The decode core (run) is deterministic and time-independent. Anything
// time-relative (expired? not-yet-valid?) is computed HERE against the live
// clock, so the pure module stays golden-vector-stable.
// ============================================================================

import { useCallback, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { run, JwtDecodeError, type DecodedJwt } from "@/lib/tools/jwt";

// ----------------------------------------------------------------------------
// JWT anatomy diagram (always shown beneath the decoder). A JWT is three
// base64url segments joined by dots: header . payload . signature. The diagram
// colour-codes the three parts, shows what each carries (field names kept
// verbatim, language-neutral, so the diagram and the decoded panels share one
// vocabulary), and brackets header+payload as the "signing input" — the exact
// bytes the signature is computed over. It is educational and does not depend
// on the pasted token, since every JWT has this same shape. The label keys
// reuse the existing, already-localized panel titles (Header/Payload/Signature).
const JWT_SEGMENTS: { labelKey: string; desc: string; color: string; x: number; w: number }[] = [
  { labelKey: "panels.header", desc: "alg · typ", color: "var(--accent-primary)", x: 16, w: 192 },
  { labelKey: "panels.payload", desc: "iss · sub · exp", color: "var(--accent-amber)", x: 240, w: 224 },
  { labelKey: "panels.signature", desc: "HMAC · RSA · ECDSA", color: "var(--accent-green)", x: 488, w: 176 },
];

/** HMAC algorithms we can verify in-browser, mapped to their Web Crypto hash. */
const HMAC_HASHES: Record<string, string> = {
  HS256: "SHA-256",
  HS384: "SHA-384",
  HS512: "SHA-512",
};

/** base64url-encode an ArrayBuffer (for comparing a computed HMAC). */
function base64UrlFromBuffer(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Largest-unit relative time ("in 2 hours", "3 days ago") in the active locale. */
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
    if (abs >= secs || unit === "second") {
      return rtf.format(Math.round(deltaSeconds / secs), unit);
    }
  }
  return rtf.format(0, "second");
}

type VerifyState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "valid" }
  | { kind: "invalid" }
  | { kind: "algNone" }
  | { kind: "unsupported"; alg: string };

// D-83 Example samples — verbatim from this tool's golden vectors.
const EXAMPLE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

export default function JwtTool() {
  const t = useTranslations("tools.jwt");
  const locale = useLocale();

  const [value, setValue] = useState("");
  const [decoded, setDecoded] = useState<DecodedJwt | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [secret, setSecret] = useState("");
  const [verify, setVerify] = useState<VerifyState>({ kind: "idle" });

  // Decode locally. Empty input clears; malformed input maps the stable error
  // code to a friendly, localized message.
  const decode = useCallback(
    (raw: string) => {
      setVerify({ kind: "idle" });
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
        const code = e instanceof JwtDecodeError ? e.code : "format";
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

  // Verify the signature in-browser with the pasted secret (HMAC family only).
  const onVerify = useCallback(async () => {
    if (!decoded) return;
    const alg = decoded.alg ?? "";
    if (alg === "none") {
      setVerify({ kind: "algNone" });
      return;
    }
    const hash = HMAC_HASHES[alg];
    if (!hash) {
      setVerify({ kind: "unsupported", alg: alg || "?" });
      return;
    }
    setVerify({ kind: "checking" });
    try {
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        enc.encode(secret),
        { name: "HMAC", hash },
        false,
        ["sign"]
      );
      const signingInput = `${decoded.segments.header}.${decoded.segments.payload}`;
      const sig = await crypto.subtle.sign("HMAC", key, enc.encode(signingInput));
      const computed = base64UrlFromBuffer(sig);
      setVerify({ kind: computed === decoded.segments.signature ? "valid" : "invalid" });
    } catch {
      setVerify({ kind: "invalid" });
    }
  }, [decoded, secret]);

  // Time-relative status, computed against the live clock (client-only path:
  // this only renders once `decoded` is set, which never happens at build).
  const nowSec = Date.now() / 1000;
  const badges: Array<{ kind: "ok" | "bad" | "warn"; text: string }> = [];
  if (decoded) {
    const exp = decoded.times.exp?.epoch;
    const nbf = decoded.times.nbf?.epoch;
    if (exp != null) {
      badges.push(
        exp < nowSec
          ? { kind: "bad", text: t("status.expired", { rel: relativeTime(exp - nowSec, locale) }) }
          : { kind: "ok", text: t("status.expiresIn", { rel: relativeTime(exp - nowSec, locale) }) }
      );
    } else {
      badges.push({ kind: "warn", text: t("status.noExpiry") });
    }
    if (nbf != null && nbf > nowSec) {
      badges.push({ kind: "warn", text: t("status.notYetValid", { rel: relativeTime(nbf - nowSec, locale) }) });
    }
  }

  // Recognized claims, humanized. Times show ISO + relative; aud may be a list.
  const claimRows: Array<{ key: string; label: string; value: string }> = [];
  if (decoded) {
    const p = decoded.payload;
    const add = (key: string, value: string) => claimRows.push({ key, label: t(`claims.${key}`), value });
    if (typeof p.iss === "string") add("iss", p.iss);
    if (typeof p.sub === "string") add("sub", p.sub);
    if (p.aud != null) add("aud", Array.isArray(p.aud) ? p.aud.join(", ") : String(p.aud));
    if (typeof p.jti === "string") add("jti", p.jti);
    for (const tk of ["iat", "nbf", "exp"] as const) {
      const time = decoded.times[tk];
      if (time) add(tk, `${time.iso}  (${relativeTime(time.epoch - nowSec, locale)})`);
    }
  }

  return (
    <div className="cidr-tool jwt-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="jwt-input">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setValue(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => { setValue(""); setSecret(""); }}>{t("clear")}</button>
          </div>
        </div>
        <textarea
          id="jwt-input"
          className="cidr-input jwt-input mono"
          value={value}
          onChange={onChange}
          placeholder={t("inputPlaceholder")}
          rows={4}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-describedby="jwt-privacy"
        />
        <p id="jwt-privacy" className="cidr-privacy">
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
        <div className="jwt-results">
          {badges.length > 0 && (
            <div className="jwt-badges">
              {badges.map((b, i) => (
                <span key={i} className={`jwt-badge jwt-badge--${b.kind}`}>
                  {b.text}
                </span>
              ))}
            </div>
          )}

          {/* Header */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("panels.header")}</h4>
            <pre className="jwt-json">
              <code>{JSON.stringify(decoded.header, null, 2)}</code>
            </pre>
          </section>

          {/* Payload */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("panels.payload")}</h4>
            {claimRows.length > 0 && (
              <dl className="jwt-claims">
                {claimRows.map((row) => (
                  <div className="jwt-claim-row" key={row.key}>
                    <dt className="jwt-claim-label">{row.label}</dt>
                    <dd className="jwt-claim-value mono">{row.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            <pre className="jwt-json">
              <code>{JSON.stringify(decoded.payload, null, 2)}</code>
            </pre>
          </section>

          {/* Signature + in-browser verification */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("panels.signature")}</h4>
            <p className="jwt-sig mono">{decoded.signature || t("panels.noSignature")}</p>

            <div className="jwt-verify">
              <label className="cidr-label" htmlFor="jwt-secret">
                {t("verify.label")}
              </label>
              <div className="cidr-controls">
                <input
                  id="jwt-secret"
                  className="cidr-input mono"
                  type="text"
                  value={secret}
                  onChange={(e) => {
                    setSecret(e.target.value);
                    setVerify({ kind: "idle" });
                  }}
                  placeholder={t("verify.placeholder")}
                  autoComplete="off"
                  spellCheck={false}
                />
                <button type="button" className="cidr-button" onClick={onVerify}>
                  {t("verify.button")}
                </button>
              </div>
              {verify.kind === "valid" && (
                <p className="jwt-badge jwt-badge--ok">{t("verify.valid")}</p>
              )}
              {verify.kind === "invalid" && (
                <p className="jwt-badge jwt-badge--bad">{t("verify.invalid")}</p>
              )}
              {verify.kind === "algNone" && (
                <p className="jwt-badge jwt-badge--warn">{t("verify.algNone")}</p>
              )}
              {verify.kind === "unsupported" && (
                <p className="jwt-badge jwt-badge--warn">
                  {t("verify.unsupportedAlg", { alg: verify.alg })}
                </p>
              )}
              <p className="jwt-verify-hint">{t("verify.hint")}</p>
            </div>
          </section>
        </div>
      )}

      {/* JWT anatomy (always shown; educational; theme-aware SVG). Three
          colour-coded base64url segments joined by dots, with header+payload
          bracketed as the signing input. Descriptors are verbatim field names. */}
      <section className="jwt-panel jwt-struct-panel">
        <h4 className="jwt-panel-title">{t("struct.heading")}</h4>
        <svg
          className="jwt-struct-svg"
          viewBox="0 0 680 128"
          role="img"
          aria-label={t("struct.heading")}
        >
          {/* Three colour-coded segments (header / payload / signature) */}
          {JWT_SEGMENTS.map((s) => (
            <g key={s.labelKey}>
              <rect
                x={s.x}
                y={30}
                width={s.w}
                height={48}
                rx={6}
                fill={s.color}
                fillOpacity={0.1}
                stroke={s.color}
                strokeWidth={1.5}
              />
              <text
                x={s.x + s.w / 2}
                y={52}
                textAnchor="middle"
                className="jwt-struct-seg-label"
                style={{ fill: s.color }}
              >
                {t(s.labelKey)}
              </text>
              <text x={s.x + s.w / 2} y={69} textAnchor="middle" className="jwt-struct-seg-desc">
                {s.desc}
              </text>
            </g>
          ))}
          {/* Dot separators, mirroring the literal "." that joins the segments */}
          <text x={224} y={60} textAnchor="middle" className="jwt-struct-dot">
            .
          </text>
          <text x={476} y={60} textAnchor="middle" className="jwt-struct-dot">
            .
          </text>
          {/* Bracket grouping header+payload as the signing input */}
          <path d="M16 92 L16 100 L464 100 L464 92" fill="none" stroke="var(--border-strong)" strokeWidth="1.5" />
          <text x={240} y={117} textAnchor="middle" className="jwt-struct-bracket">
            {t("struct.signingInput")}
          </text>
        </svg>
        <p className="jwt-struct-note">{t("struct.note")}</p>
      </section>
    </div>
  );
}
