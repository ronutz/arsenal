"use client";

// ============================================================================
// src/components/OidcTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE OIDC DECODER.
//
// Paste an OpenID Connect ID token (a signed JWT) or a .well-known/openid-
// configuration discovery document, and it decodes and explains it. For an ID
// token it shows the core claims (iss, sub, aud, azp, nonce, acr, amr, auth_time)
// and the times, groups the standard profile / email / binding claims, and runs
// a security assessment (required claims, signing posture, nonce, audience). For
// a discovery document it lists the issuer, endpoints, and capabilities, and
// flags the "none" signing algorithm and missing PKCE S256.
//
// Everything runs IN THE BROWSER via the local oidc module - no fetch (it never
// calls the jwks_uri or any endpoint), no signature verification. Times are
// shown but never compared to the clock. All output is escaped through React.
// ============================================================================

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import {
  run,
  OidcParseError,
  type OidcReport,
  type IdTokenReport,
  type DiscoveryReport,
  type ClaimCategory,
} from "@/lib/tools/oidc";

/** Stable order for the non-core claim groups. */
const GROUP_ORDER: ClaimCategory[] = ["binding", "profile", "email", "address", "phone", "oauth", "other"];

// The two parties in the OIDC authorization-code flow (the user-agent rides
// with the Relying Party in the redirect model, so two lanes suffice). The
// diagram is static and educational: it describes the protocol, independent of
// whatever discovery document or ID token the tool happens to decode.
type FlowActor = "rp" | "op";
const ACTOR_COLOR: Record<FlowActor, string> = {
  rp: "var(--accent-primary)",
  op: "var(--accent-amber)",
};
// Each `code` is a protocol field / endpoint name taken straight from the
// discovery document (kept verbatim, so the diagram and the decoded fields use
// the same vocabulary); `labelKey` is localized chrome.
const FLOW: { actor: FlowActor; labelKey: string; code: string }[] = [
  { actor: "rp", labelKey: "s1", code: "authorization_endpoint" },
  { actor: "op", labelKey: "s2", code: "" },
  { actor: "op", labelKey: "s3", code: "code" },
  { actor: "rp", labelKey: "s4", code: "token_endpoint" },
  { actor: "op", labelKey: "s5", code: "id_token + access_token" },
  { actor: "rp", labelKey: "s6", code: "jwks_uri" },
  { actor: "rp", labelKey: "s7", code: "userinfo_endpoint" },
  { actor: "op", labelKey: "s8", code: "claims" },
];

/** Render any claim value as a display string. */
function valueToString(v: unknown): string {
  if (v === null) return "null";
  if (typeof v === "string") return v;
  if (typeof v === "boolean" || typeof v === "number") return String(v);
  return JSON.stringify(v);
}

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
const EXAMPLE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

export default function OidcTool() {
  const t = useTranslations("tools.oidc");

  const [value, setValue] = useState("");
  const [report, setReport] = useState<OidcReport | null>(null);
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
        const code = e instanceof OidcParseError ? e.code : "not-jwt";
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

  const reason = (r: { code: string; value?: string }) =>
    t(`reasons.${r.code}`, r.value !== undefined ? { value: r.value } : undefined);

  const renderIdToken = (tok: IdTokenReport) => {
    const c = tok.core;
    // Non-core claims, grouped by category for display.
    const groups = new Map<ClaimCategory, { name: string; value: string }[]>();
    for (const cl of tok.claims) {
      if (cl.category === "core") continue;
      const arr = groups.get(cl.category) ?? [];
      arr.push({ name: cl.name, value: valueToString(cl.value) });
      groups.set(cl.category, arr);
    }
    const algClassKind = tok.algClass === "asymmetric" ? "ok" : tok.algClass === "none" ? "bad" : "info";

    return (
      <>
        <div className="jwt-badges saml-badges">
          <span className="jwt-badge saml-badge--type">{t("badges.idToken")}</span>
          <span className={`jwt-badge saml-badge--${algClassKind}`}>
            {tok.alg ?? t("badges.algUnknown")}
          </span>
          <span className={`jwt-badge saml-badge--${tok.signed ? "ok" : "bad"}`}>
            {tok.signed ? t("badges.signed") : t("badges.unsigned")}
          </span>
        </div>

        {report && report.reasons.length > 0 && (
          <ul className="sh-overall-reasons saml-reasons">
            {report.reasons.map((r, i) => (
              <li key={`${r.code}-${i}`} className="sh-overall-reason">
                {reason(r)}
              </li>
            ))}
          </ul>
        )}

        {/* Header */}
        <section className="jwt-panel">
          <h4 className="jwt-panel-title">{t("panels.header")}</h4>
          <Field label={t("fields.alg")} value={tok.alg ?? undefined} mono />
          <Field label={t("fields.typ")} value={tok.typ ?? undefined} mono />
          <Field label={t("fields.kid")} value={tok.kid ?? undefined} mono />
        </section>

        {/* Core ID token claims */}
        <section className="jwt-panel">
          <h4 className="jwt-panel-title">{t("panels.coreClaims")}</h4>
          <Field label={t("fields.iss")} value={c.iss} mono />
          <Field label={t("fields.sub")} value={c.sub} mono />
          <Field label={t("fields.aud")} value={c.aud && c.aud.length ? c.aud.join(", ") : undefined} mono />
          <Field label={t("fields.azp")} value={c.azp} mono />
          <Field label={t("fields.nonce")} value={c.nonce} mono />
          <Field label={t("fields.acr")} value={c.acr} mono />
          <Field
            label={t("fields.amr")}
            value={c.amrLabels && c.amrLabels.length ? c.amrLabels.join(", ") : undefined}
            mono
          />
          <Field label={t("fields.authTime")} value={c.auth_time?.iso} mono />
          <Field label={t("fields.iat")} value={tok.times.iat?.iso} mono />
          <Field label={t("fields.nbf")} value={tok.times.nbf?.iso} mono />
          <Field label={t("fields.exp")} value={tok.times.exp?.iso} mono />
        </section>

        {/* Grouped non-core claims */}
        {GROUP_ORDER.filter((g) => groups.has(g)).map((g) => (
          <section className="jwt-panel" key={g}>
            <h4 className="jwt-panel-title">{t(`categories.${g}`)}</h4>
            {groups.get(g)!.map((cl, i) => (
              <Field key={`${cl.name}-${i}`} label={cl.name} value={cl.value} mono />
            ))}
          </section>
        ))}
      </>
    );
  };

  const renderDiscovery = (d: DiscoveryReport) => (
    <>
      <div className="jwt-badges saml-badges">
        <span className="jwt-badge saml-badge--type">{t("badges.discovery")}</span>
        {d.signingAlgs.includes("none") && (
          <span className="jwt-badge saml-badge--bad">{t("badges.algNone")}</span>
        )}
      </div>

      {report && report.reasons.length > 0 && (
        <ul className="sh-overall-reasons saml-reasons">
          {report.reasons.map((r, i) => (
            <li key={`${r.code}-${i}`} className="sh-overall-reason">
              {reason(r)}
            </li>
          ))}
        </ul>
      )}

      <section className="jwt-panel">
        <h4 className="jwt-panel-title">{t("panels.metadata")}</h4>
        <Field label={t("fields.issuer")} value={d.issuer} mono />
        {d.metadata.map((m, i) => (
          <Field key={`${m.name}-${i}`} label={m.name} value={m.value} mono />
        ))}
      </section>

      {d.endpoints.length > 0 && (
        <section className="jwt-panel">
          <h4 className="jwt-panel-title">{t("panels.endpoints")}</h4>
          {d.endpoints.map((ep, i) => (
            <Field key={`${ep.name}-${i}`} label={ep.name} value={ep.url} mono />
          ))}
        </section>
      )}

      {d.capabilities.length > 0 && (
        <section className="jwt-panel">
          <h4 className="jwt-panel-title">{t("panels.capabilities")}</h4>
          {d.capabilities.map((cap, i) => (
            <Field key={`${cap.name}-${i}`} label={cap.name} value={cap.values.join(", ")} mono />
          ))}
        </section>
      )}
    </>
  );

  return (
    <div className="cidr-tool jwt-tool saml-tool oidc-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="oidc-input">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setValue(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setValue("")}>{t("clear")}</button>
          </div>
        </div>
        <textarea
          id="oidc-input"
          className="cidr-input mono saml-textarea"
          rows={8}
          value={value}
          onChange={onChange}
          placeholder={t("inputPlaceholder")}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-describedby="oidc-privacy"
        />
        <p id="oidc-privacy" className="cidr-privacy">
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
        <div className="jwt-results saml-results oidc-results">
          {report.mode === "id-token" && report.idToken && renderIdToken(report.idToken)}
          {report.mode === "discovery" && report.discovery && renderDiscovery(report.discovery)}
          <p className="saml-note saml-note--verify">{t("notVerifiedNote")}</p>
        </div>
      )}

      {/* Authorization-code flow (always shown; educational; theme-aware SVG).
          Steps reference the same endpoint names the discovery decoder reports. */}
      <section className="jwt-panel oidc-flow-panel">
        <h4 className="hash-algo-title">{t("flow.heading")}</h4>
        <div className="oidc-flow-legend">
          <span className="oidc-flow-leg">
            <span className="oidc-flow-swatch" style={{ background: ACTOR_COLOR.rp }} />
            {t("flow.laneRp")}
          </span>
          <span className="oidc-flow-leg">
            <span className="oidc-flow-swatch" style={{ background: ACTOR_COLOR.op }} />
            {t("flow.laneOp")}
          </span>
        </div>
        <svg
          className="oidc-flow-svg"
          viewBox={`0 0 680 ${22 + (FLOW.length - 1) * 58 + 16 + 24}`}
          role="img"
          aria-label={t("flow.heading")}
        >
          {/* Spine */}
          <line
            x1="92"
            y1={22 + 16}
            x2="92"
            y2={22 + (FLOW.length - 1) * 58 + 16}
            stroke="var(--border-strong)"
            strokeWidth="2"
          />
          {FLOW.map((step, i) => {
            const cy = 22 + i * 58 + 16;
            const color = ACTOR_COLOR[step.actor];
            return (
              <g key={step.labelKey}>
                <text x="74" y={cy + 4} textAnchor="end" className="oidc-flow-num">
                  {i + 1}
                </text>
                <line x1="99" y1={cy} x2="118" y2={cy} stroke="var(--border-strong)" strokeWidth="2" />
                <circle cx="92" cy={cy} r="6" fill={color} stroke="var(--canvas-primary)" strokeWidth="2" />
                <rect
                  x="118"
                  y={cy - 19}
                  width="552"
                  height="38"
                  rx="6"
                  fill="var(--surface-base)"
                  stroke="var(--border-subtle)"
                />
                <rect x="118" y={cy - 19} width="3" height="38" fill={color} />
                <text x="132" y={cy - 3} className="oidc-flow-label">
                  {t(`flow.${step.labelKey}`)}
                </text>
                {step.code && (
                  <text x="132" y={cy + 12} className="oidc-flow-code">
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
