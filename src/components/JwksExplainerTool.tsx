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
//
// SHARE RESULTS (2026-10-27): under the summary of the keys (in Match mode,
// under the match), a button builds a link only when pressed, carrying a copy
// of the key set with every private value replaced by "[redacted]" (the member
// names stay, so the receiving page flags the same private material), and in
// Match mode the JWT's header only (src/lib/tools/jwks-explainer/share.ts,
// posture derived; shareableJwks in compute.ts). The popover counts the values
// replaced. An arriving link (useShareArrival) fills the boxes and the mode.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { parseJwks, matchJwtToJwks, type KeyExplanation } from "@/lib/tools/jwks-explainer";
import { SHARE_REDACTED, shareableJwks } from "@/lib/tools/jwks-explainer/compute"; // the shareable copy, made once per change
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what the spec encodes
import { JWKS_SHARE } from "@/lib/tools/jwks-explainer/share"; // this tool's share spec: the copy, and a token's header only

/** Nothing to share: a constant, so the button sees no change between renders. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // the button is disabled

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

// D-83 Example samples — verbatim from this tool's golden vectors.
const EXAMPLE = "{\n  \"keys\": [\n    {\n      \"kty\": \"EC\",\n      \"crv\": \"P-256\",\n      \"x\": \"MKBCTNIcKUSDii11ySs3526iDZ8AiTo7Tu6KPAqv7D4\",\n      \"y\": \"4Etl6SRW2YiLUrN5vfvVHuhp7x8PxltmWWlbbM4IFyM\",\n      \"use\": \"enc\",\n      \"kid\": \"1\"\n    },\n    {\n      \"kty\": \"RSA\",\n      \"n\": \"0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtVT86zwu1RK7aPFFxuhDR1L6tSoc_BJECPebWKRXjBZCiFV4n3oknjhMstn64tZ_2W-5JsGY4Hc5n9yBXArwl93lqt7_RN5w6Cf0h4QyQ5v-65YGjQR0_FDW2QvzqY368QQMicAtaSqzs8KJZgnYb9c7d0zgdAZHzu6qMQvRL5hajrn1n91CbOpbISD08qNLyrdkt-bFTWhAI4vMQFh6WeZu0fM4lFd2NcRwr3XPksINHaQ-G_xBniIqbw0Ls1jF44-csFCur-kEgU8awapJzKnqDKgw\",\n      \"e\": \"AQAB\",\n      \"alg\": \"RS256\",\n      \"use\": \"sig\",\n      \"kid\": \"2011-04-29\"\n    }\n  ]\n}";

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

  // An arriving share link: the copy fills the key set box, the mode opens, and a header fills the JWT box.
  useShareArrival(JWKS_SHARE, (s) => { setJwks(s.jwks); setMode(s.mode); if (s.jwt !== null) setJwt(s.jwt); }); // filled
  // The shareable copy: every private value replaced. Linear, once per change of the box.
  const copy = useMemo(() => (parsed && parsed.ok ? shareableJwks(jwks) : null), [parsed, jwks]); // the copy
  // What Share results may carry: the copy, the mode, and the JWT's header in Match mode.
  const share = useMemo<ShareEncoding>(() => (parsed && parsed.ok && copy ? JWKS_SHARE.encode({ jwks, parsedOk: true, mode, jwt, copy }) : NOTHING), [parsed, copy, jwks, mode, jwt]); // memoised
  // The Share results row, in either mode.
  const shareRow = (
    <div className="rdap-ask-row">
      <ShareResultsButton
        encoding={share}
        carries={t("share.carries", { mode, redacted: SHARE_REDACTED })}
        details={[t("share.redacted", { n: copy && copy.ok ? copy.redacted : 0 })]}
        blockedMessage={!share.ok && share.reason === "blocked" ? t("share.blockedKey", { members: String(share.values?.members ?? "") }) : ""}
        title={t("name")}
      />
    </div>
  ); // one row

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
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="jwks-input">
            {t("jwksInputLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setJwks(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => { setJwks(""); setJwt(""); }}>{t("clear")}</button>
          </div>
        </div>
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
          {/* Share results: under the summary, before the key cards. */}
          {shareRow}
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
              {/* Share results: under the match, before the matched keys. */}
              {shareRow}
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
