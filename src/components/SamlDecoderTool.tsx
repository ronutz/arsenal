"use client";

// ============================================================================
// src/components/SamlDecoderTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE SAML 2.0 DECODER.
//
// Paste a SAML message - raw XML, a base64 HTTP-POST value, or a URL-encoded
// form field - and it decodes the Response / Assertion structure: issuer,
// status, every assertion's subject, conditions, audience, authn context, and
// attributes, plus whether each part is SIGNED and with which algorithm (weak
// algorithms are flagged) - against OASIS SAML 2.0, the W3C XML-DSig spec, and
// the OWASP SAML / XXE guidance.
//
// Everything runs IN THE BROWSER via the local, XXE-hardened saml-decoder module
// - no fetch, no API. A DOCTYPE or entity declaration is rejected outright. The
// tool DECODES and EXPLAINS; it never verifies or forges a signature and never
// decrypts an EncryptedAssertion. All output is escaped text through React.
// The decode is deterministic and clock-independent: it shows NotBefore /
// NotOnOrAfter for the reader to judge and never compares them to the clock.
// ============================================================================

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import {
  run,
  SamlParseError,
  type SamlReport,
  type AssertionInfo,
  type SignatureAlgorithms,
} from "@/lib/tools/saml-decoder";

// ----------------------------------------------------------------------------
// SAML web-browser SSO flow (SP-initiated), drawn as an always-visible,
// theme-aware diagram beneath the decoder. It is purely educational: it shows
// where a decoded message sits in the round trip between the Service Provider
// (SP) and the Identity Provider (IdP). Two lanes; the browser is the conduit
// that carries each redirect and POST between them.
//
// Each `code` is a SAML term kept verbatim — a message, a binding, or an
// element the decoder itself reports — so the diagram and the decoded fields
// share one vocabulary; `labelKey` is localized chrome. This mirrors the
// OIDC/PKCE flow diagrams so all three protocol tools read the same way.
type SamlFlowActor = "sp" | "idp";
const SAML_ACTOR_COLOR: Record<SamlFlowActor, string> = {
  sp: "var(--accent-primary)",
  idp: "var(--accent-amber)",
};
const SAML_FLOW: { actor: SamlFlowActor; labelKey: string; code: string }[] = [
  { actor: "sp", labelKey: "s1", code: "" },
  { actor: "sp", labelKey: "s2", code: "AuthnRequest" },
  { actor: "idp", labelKey: "s3", code: "HTTP-Redirect" },
  { actor: "idp", labelKey: "s4", code: "" },
  { actor: "idp", labelKey: "s5", code: "Assertion" },
  { actor: "sp", labelKey: "s6", code: "HTTP-POST" },
  { actor: "sp", labelKey: "s7", code: "Conditions" },
  { actor: "sp", labelKey: "s8", code: "" },
];

/** A label / value row, rendered only when the value is present. */
function Field({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  if (!value) return null;
  return (
    <div className="saml-field">
      <span className="saml-field-label">{label}</span>
      <span className={`saml-field-value${mono ? " mono" : ""}`}>{value}</span>
    </div>
  );
}

// D-83 Example samples — verbatim from this tool's golden vectors.
const EXAMPLE = "<samlp:Response xmlns:samlp=\"urn:oasis:names:tc:SAML:2.0:protocol\" xmlns:saml=\"urn:oasis:names:tc:SAML:2.0:assertion\" ID=\"_r\" Version=\"2.0\" IssueInstant=\"2026-06-29T12:00:00Z\"><saml:Issuer>https://idp.example.com</saml:Issuer><samlp:Status><samlp:StatusCode Value=\"urn:oasis:names:tc:SAML:2.0:status:Success\"/></samlp:Status><saml:Assertion ID=\"a\" Version=\"2.0\" IssueInstant=\"2026-06-29T12:00:00Z\"><saml:Subject><saml:NameID>u</saml:NameID></saml:Subject><saml:Conditions><saml:AudienceRestriction><saml:Audience>https://sp.example.com</saml:Audience></saml:AudienceRestriction></saml:Conditions></saml:Assertion></samlp:Response>";

export default function SamlDecoderTool() {
  const t = useTranslations("tools.saml-decoder");

  const [value, setValue] = useState("");
  const [report, setReport] = useState<SamlReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const decode = useCallback(
    (raw: string) => {
      if (!raw.trim()) {
        setReport(null);
        setError(null);
        return;
      }
      try {
        setReport(run(raw));
        setError(null);
      } catch (e) {
        const code = e instanceof SamlParseError ? e.code : "malformed";
        setError(t(`errors.${code}`));
        setReport(null);
      }
    },
    [t],
  );

  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    decode(e.target.value);
  }

  /** Localize one stable reason code, passing its optional value. */
  const reason = (r: { code: string; value?: string }) =>
    t(`reasons.${r.code}`, r.value !== undefined ? { value: r.value } : undefined);

  /** Render a signature line (algorithm + weak flag) for a signed element. */
  const signatureLine = (algos?: SignatureAlgorithms) => {
    if (!algos) return null;
    return (
      <div className="saml-sub">
        <Field label={t("fields.algorithm")} value={algos.sigLabel} mono />
        {algos.weakSig && <span className="saml-warn">{t("badges.weakAlgo")}</span>}
        <Field label={t("fields.digest")} value={algos.digestLabel} mono />
        {algos.weakDigest && <span className="saml-warn">{t("badges.weakDigest")}</span>}
        <Field label={t("fields.c14n")} value={algos.c14nLabel} mono />
      </div>
    );
  };

  const renderAssertion = (a: AssertionInfo, idx: number) => (
    <section className="jwt-panel saml-assertion" key={a.id ?? idx}>
      <h4 className="jwt-panel-title">
        {t("panels.assertion", { n: idx + 1 })}{" "}
        <span className={`saml-tag saml-tag--${a.signed ? "good" : "bad"}`}>
          {a.signed ? t("badges.signed") : t("badges.unsigned")}
        </span>
      </h4>

      <Field label={t("fields.issuer")} value={a.issuer} mono />
      <Field label={t("fields.id")} value={a.id} mono />
      <Field label={t("fields.issueInstant")} value={a.issueInstant} mono />
      {a.signed && signatureLine(a.signatureAlgorithms)}

      {a.subject && (
        <div className="saml-block">
          <h5 className="saml-block-title">{t("blocks.subject")}</h5>
          <Field label={t("fields.nameId")} value={a.subject.nameId} mono />
          <Field label={t("fields.nameIdFormat")} value={a.subject.nameIdFormatLabel} mono />
          <Field label={t("fields.confirmationMethod")} value={a.subject.confirmationMethodLabel} mono />
          <Field label={t("fields.notOnOrAfter")} value={a.subject.notOnOrAfter} mono />
          <Field label={t("fields.recipient")} value={a.subject.recipient} mono />
          <Field label={t("fields.inResponseTo")} value={a.subject.inResponseTo} mono />
        </div>
      )}

      {a.conditions && (
        <div className="saml-block">
          <h5 className="saml-block-title">{t("blocks.conditions")}</h5>
          <Field label={t("fields.notBefore")} value={a.conditions.notBefore} mono />
          <Field label={t("fields.notOnOrAfter")} value={a.conditions.notOnOrAfter} mono />
          {a.conditions.audiences.length > 0 && (
            <Field label={t("fields.audience")} value={a.conditions.audiences.join(", ")} mono />
          )}
        </div>
      )}

      {a.authn && (
        <div className="saml-block">
          <h5 className="saml-block-title">{t("blocks.authn")}</h5>
          <Field label={t("fields.authnContext")} value={a.authn.contextClassLabel} mono />
          <Field label={t("fields.authnInstant")} value={a.authn.authnInstant} mono />
          <Field label={t("fields.sessionIndex")} value={a.authn.sessionIndex} mono />
        </div>
      )}

      {a.attributes.length > 0 && (
        <div className="saml-block">
          <h5 className="saml-block-title">{t("blocks.attributes")}</h5>
          <ul className="saml-attrs">
            {a.attributes.map((at, i) => (
              <li key={`${at.name ?? "attr"}-${i}`} className="saml-attr">
                <span className="saml-attr-name mono">{at.friendlyName || at.name || t("attrUnnamed")}</span>
                <span className="saml-attr-values mono">
                  {at.values.length ? at.values.join(", ") : t("attrNoValue")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );

  const status = report?.message.status;
  const anySigned = !!report && (report.signedResponse || report.assertions.some((a) => a.signed));

  return (
    <div className="cidr-tool jwt-tool saml-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="saml-input">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setValue(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setValue("")}>{t("clear")}</button>
          </div>
        </div>
        <textarea
          id="saml-input"
          className="cidr-input mono saml-textarea"
          rows={8}
          value={value}
          onChange={onChange}
          placeholder={t("inputPlaceholder")}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-describedby="saml-privacy"
        />
        <p id="saml-privacy" className="cidr-privacy">
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

      {report && (
        <div className="jwt-results saml-results">
          {/* Headline badges */}
          <div className="jwt-badges saml-badges">
            <span className="jwt-badge saml-badge--type">{report.docType}</span>
            <span className={`jwt-badge saml-badge--${anySigned ? "ok" : "bad"}`}>
              {anySigned ? t("badges.signed") : t("badges.unsigned")}
            </span>
            {report.encryptedAssertionCount > 0 && (
              <span className="jwt-badge saml-badge--info">{t("badges.encrypted")}</span>
            )}
            {status && (
              <span className={`jwt-badge saml-badge--${status.success ? "ok" : "bad"}`}>
                {status.success
                  ? t("badges.statusSuccess")
                  : t("badges.statusFailure", { code: status.codeLabel ?? status.code ?? "" })}
              </span>
            )}
          </div>

          {report.reasons.length > 0 && (
            <ul className="sh-overall-reasons saml-reasons">
              {report.reasons.map((r, i) => (
                <li key={`${r.code}-${i}`} className="sh-overall-reason">
                  {reason(r)}
                </li>
              ))}
            </ul>
          )}

          {/* Message panel */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("panels.message")}</h4>
            <Field label={t("fields.docType")} value={report.docType} />
            <Field label={t("fields.issuer")} value={report.message.issuer} mono />
            <Field label={t("fields.id")} value={report.message.id} mono />
            <Field label={t("fields.issueInstant")} value={report.message.issueInstant} mono />
            <Field label={t("fields.destination")} value={report.message.destination} mono />
            <Field label={t("fields.inResponseTo")} value={report.message.inResponseTo} mono />
            {status && (
              <>
                <Field label={t("fields.status")} value={status.codeLabel ?? status.code} mono />
                <Field label={t("fields.statusMessage")} value={status.message} />
              </>
            )}
            {report.signedResponse && (
              <div className="saml-block">
                <h5 className="saml-block-title">{t("blocks.responseSignature")}</h5>
                {signatureLine(report.responseSignatureAlgorithms)}
              </div>
            )}
          </section>

          {/* Assertions */}
          {report.assertions.map(renderAssertion)}

          {/* Encrypted note */}
          {report.encryptedAssertionCount > 0 && (
            <p className="saml-note">{t("encryptedNote", { n: report.encryptedAssertionCount })}</p>
          )}

          {/* Always: this tool decodes, it does not verify */}
          <p className="saml-note saml-note--verify">{t("notVerifiedNote")}</p>
        </div>
      )}

      {/* SAML web-browser SSO flow (always shown; educational; theme-aware SVG).
          The codes are SAML messages/bindings/elements the decoder also reports. */}
      <section className="jwt-panel saml-flow-panel">
        <h4 className="hash-algo-title">{t("flow.heading")}</h4>
        <div className="saml-flow-legend">
          <span className="saml-flow-leg">
            <span className="saml-flow-swatch" style={{ background: SAML_ACTOR_COLOR.sp }} />
            {t("flow.laneSp")}
          </span>
          <span className="saml-flow-leg">
            <span className="saml-flow-swatch" style={{ background: SAML_ACTOR_COLOR.idp }} />
            {t("flow.laneIdp")}
          </span>
        </div>
        <svg
          className="saml-flow-svg"
          viewBox={`0 0 680 ${22 + (SAML_FLOW.length - 1) * 58 + 16 + 24}`}
          role="img"
          aria-label={t("flow.heading")}
        >
          {/* Vertical spine connecting every step. */}
          <line
            x1="92"
            y1={22 + 16}
            x2="92"
            y2={22 + (SAML_FLOW.length - 1) * 58 + 16}
            stroke="var(--border-strong)"
            strokeWidth="2"
          />
          {SAML_FLOW.map((step, i) => {
            const cy = 22 + i * 58 + 16;
            const color = SAML_ACTOR_COLOR[step.actor];
            return (
              <g key={step.labelKey}>
                {/* Step number */}
                <text x="74" y={cy + 4} textAnchor="end" className="saml-flow-num">
                  {i + 1}
                </text>
                {/* Connector + actor node (colour = which party acts) */}
                <line x1="99" y1={cy} x2="118" y2={cy} stroke="var(--border-strong)" strokeWidth="2" />
                <circle cx="92" cy={cy} r="6" fill={color} stroke="var(--canvas-primary)" strokeWidth="2" />
                {/* Step card */}
                <rect
                  x="118"
                  y={cy - 19}
                  width="552"
                  height="38"
                  rx="6"
                  fill="var(--surface-base)"
                  stroke="var(--border-subtle)"
                />
                {/* Left accent stripe in the acting party's colour */}
                <rect x="118" y={cy - 19} width="3" height="38" fill={color} />
                {/* Localized description + (optional) verbatim SAML term */}
                <text x="132" y={cy - 3} className="saml-flow-label">
                  {t(`flow.${step.labelKey}`)}
                </text>
                {step.code && (
                  <text x="132" y={cy + 12} className="saml-flow-code">
                    {step.code}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </section>
    </div>
  );
}
