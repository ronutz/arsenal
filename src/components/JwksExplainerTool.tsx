"use client";

// ============================================================================
// src/components/JwksExplainerTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE JWKS EXPLAINER AND KEY MATCHER.
//
// Explain mode: paste a JWK Set and every key is broken down (type, use, alg,
// size, parameters), with a clear flag on any key that carries private material.
// Match mode: paste a JWKS and a JWT, and the tool reads the JWT header and
// finds the key whose kid matches. Nothing leaves the browser; no jwks_uri is
// ever fetched.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { parseJwks, matchJwtToJwks, type KeyExplanation } from "@/lib/tools/jwks-explainer";

type Mode = "explain" | "match";

// ----------------------------------------------------------------------------
// kid-matching diagram (always shown beneath the tool). A JWT header carries a
// `kid`; a verifier finds the one key in the set whose `kid` matches, and uses
// that key to check the signature. The diagram is a fixed, illustrative example
// (k1/k2/k3 with k2 the match) — it does not depend on what is pasted, since the
// matching rule is always the same. Field names (kid, alg) are kept verbatim;
// only the column titles, arrow label, and note are localized.
const JWKS_DEMO_KEYS: { kid: string; match: boolean; y: number }[] = [
  { kid: "k1", match: false, y: 25 },
  { kid: "k2", match: true, y: 69 },
  { kid: "k3", match: false, y: 113 },
];

export default function JwksExplainerTool() {
  const t = useTranslations("tools.jwks-explainer");
  const [mode, setMode] = useState<Mode>("explain");
  const [jwks, setJwks] = useState("");
  const [jwt, setJwt] = useState("");

  const parsed = useMemo(() => (jwks.trim() ? parseJwks(jwks) : null), [jwks]);
  const matched = useMemo(() => {
    if (mode !== "match" || !jwt.trim() || !parsed) return null;
    return matchJwtToJwks(jwt, parsed);
  }, [mode, jwt, parsed]);

  function KeyCard({ k }: { k: KeyExplanation }) {
    return (
      <div className={`jwks-key${k.isPrivate ? " jwks-key--private" : ""}`}>
        <div className="jwks-key-top">
          <span className="jwks-key-kid mono">{k.kid ? k.kid : t("noKid")}</span>
          <span className="jwks-key-type">{k.ktyLabel}</span>
        </div>
        <dl className="jwks-key-fields">
          {k.use && (
            <div className="jwks-field">
              <dt>{t("useField")}</dt>
              <dd>{k.use === "sig" ? t("useSig") : k.use === "enc" ? t("useEnc") : k.use}</dd>
            </div>
          )}
          {k.alg && (
            <div className="jwks-field">
              <dt>{t("algField")}</dt>
              <dd className="mono">
                {k.alg}
                {k.algInfo ? ` · ${k.algInfo.detail}` : ""}
              </dd>
            </div>
          )}
          {(k.crv || k.bits) && (
            <div className="jwks-field">
              <dt>{t("sizeField")}</dt>
              <dd className="mono">
                {[k.crv, k.bits ? `${k.bits}-bit` : null].filter(Boolean).join(" · ")}
              </dd>
            </div>
          )}
          {k.publicParamsPresent.length > 0 && (
            <div className="jwks-field">
              <dt>{t("publicParamsField")}</dt>
              <dd className="mono">{k.publicParamsPresent.join(", ")}</dd>
            </div>
          )}
          {k.privateParamsPresent.length > 0 && (
            <div className="jwks-field">
              <dt>{t("privateParamsField")}</dt>
              <dd className="mono jwks-private-params">{k.privateParamsPresent.join(", ")}</dd>
            </div>
          )}
        </dl>
        {k.warnings.length > 0 && (
          <ul className="jwks-warnings">
            {k.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="cidr-tool jwt-tool saml-tool json-tool jwks-tool">
      <div className="bigip-mode" role="tablist" aria-label={t("modeLabel")}>
        <button type="button" role="tab" aria-selected={mode === "explain"} className={`bigip-mode-btn${mode === "explain" ? " is-active" : ""}`} onClick={() => setMode("explain")}>
          {t("modeExplain")}
        </button>
        <button type="button" role="tab" aria-selected={mode === "match"} className={`bigip-mode-btn${mode === "match" ? " is-active" : ""}`} onClick={() => setMode("match")}>
          {t("modeMatch")}
        </button>
      </div>

      <div className="cidr-input-row">
        <label className="cidr-label" htmlFor="jwks-input">
          {t("jwksInputLabel")}
        </label>
        <textarea
          id="jwks-input"
          className="json-input mono"
          value={jwks}
          onChange={(e) => setJwks(e.target.value)}
          placeholder={t("jwksInputPlaceholder")}
          rows={8}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-describedby="jwks-privacy"
        />
        <p id="jwks-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            ●
          </span>
          {t("runsLocally")}
        </p>
      </div>

      {parsed && !parsed.ok && parsed.error && (
        <div className="json-error-box" role="alert">
          <p className="json-error-message">{parsed.error.message}</p>
        </div>
      )}

      {mode === "match" && (
        <div className="cidr-input-row">
          <label className="cidr-label" htmlFor="jwt-input">
            {t("jwtInputLabel")}
          </label>
          <textarea
            id="jwt-input"
            className="json-input mono"
            value={jwt}
            onChange={(e) => setJwt(e.target.value)}
            placeholder={t("jwtInputPlaceholder")}
            rows={3}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        </div>
      )}

      {/* Explain mode output */}
      {mode === "explain" && parsed && parsed.ok && (
        <div className="jwks-result">
          <div className="jwks-summary">
            <span className="jwks-summary-count">{parsed.keys.length}</span>
            <span className="jwks-summary-label">{parsed.keys.length === 1 ? t("keySingular") : t("keyPlural")}</span>
          </div>
          {parsed.anyPrivate && <p className="jwks-private-banner">{t("privateBanner")}</p>}
          <div className="jwks-keys">
            {parsed.keys.map((k) => (
              <KeyCard key={k.index} k={k} />
            ))}
          </div>
        </div>
      )}

      {/* Match mode output */}
      {mode === "match" && matched && (
        <div className="jwks-result">
          {matched.error ? (
            <div className="json-error-box" role="alert">
              <p className="json-error-message">{matched.error.message}</p>
            </div>
          ) : (
            <>
              <div className="jwks-header-readout">
                <div className="jwks-field">
                  <dt>{t("headerKidField")}</dt>
                  <dd className="mono">{matched.headerKid ? matched.headerKid : t("noKid")}</dd>
                </div>
                <div className="jwks-field">
                  <dt>{t("headerAlgField")}</dt>
                  <dd className="mono">{matched.headerAlg ?? "-"}</dd>
                </div>
              </div>
              <p className={`jwks-match-note${matched.matches.length ? " jwks-match-note--hit" : " jwks-match-note--miss"}`}>{matched.note}</p>
              {matched.algMismatch && <p className="jwks-warnings jwks-alg-mismatch">{t("algMismatch")}</p>}
              <div className="jwks-keys">
                {matched.matches.map((k) => (
                  <KeyCard key={k.index} k={k} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* kid-matching diagram (always shown; educational; theme-aware SVG).
          A JWT header's kid selects the one matching key from the set. */}
      <section className="jwt-panel jwks-diag-panel">
        <h4 className="jwt-panel-title">{t("diag.heading")}</h4>
        <svg
          className="jwks-diag-svg"
          viewBox="0 0 680 160"
          role="img"
          aria-label={t("diag.heading")}
        >
          {/* Column titles */}
          <text x={121} y={14} textAnchor="middle" className="jwks-diag-coltitle">
            {t("diag.jwtHeader")}
          </text>
          <text x={547} y={14} textAnchor="middle" className="jwks-diag-coltitle">
            JWKS
          </text>
          {/* JWT header box (carries the kid the verifier looks up) */}
          <rect x={16} y={58} width={210} height={56} rx={6} fill="var(--surface-base)" stroke="var(--accent-amber)" strokeWidth={1.5} />
          <text x={28} y={84} className="jwks-diag-field">kid: k2</text>
          <text x={28} y={103} className="jwks-diag-field">alg: RS256</text>
          {/* The key set: one box per key; the matching kid is highlighted */}
          {JWKS_DEMO_KEYS.map((k) => (
            <g key={k.kid}>
              <rect
                x={430}
                y={k.y}
                width={234}
                height={34}
                rx={6}
                fill={k.match ? "var(--accent-primary)" : "var(--surface-base)"}
                fillOpacity={k.match ? 0.12 : 1}
                stroke={k.match ? "var(--accent-primary)" : "var(--border-subtle)"}
                strokeWidth={k.match ? 2 : 1}
              />
              <text
                x={442}
                y={k.y + 22}
                className={k.match ? "jwks-diag-field jwks-diag-field--match" : "jwks-diag-field"}
              >
                kid: {k.kid}
              </text>
            </g>
          ))}
          {/* Arrow from the JWT header to the matching key */}
          <line x1={226} y1={86} x2={424} y2={86} stroke="var(--accent-primary)" strokeWidth={1.5} />
          <path d="M424 82 L432 86 L424 90 Z" fill="var(--accent-primary)" />
          <text x={328} y={78} textAnchor="middle" className="jwks-diag-arrowlabel">
            {t("diag.matchLabel")}
          </text>
        </svg>
        <p className="jwks-diag-note">{t("diag.note")}</p>
      </section>
    </div>
  );
}
