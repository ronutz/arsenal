"use client";

// ============================================================================
// src/components/SecureHeadersTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE SECURE-HEADERS ANALYZER.
//
// Paste an HTTP response (status line + headers) or a raw header block and it
// parses the response, grades the security-header posture A-F, and explains
// every protective header (present, misconfigured, or missing), every cookie's
// Secure / HttpOnly / SameSite / prefix hygiene, and the cross-origin (CORS)
// exposure - against the OWASP Secure Headers Project, RFC 6797, CSP Level 3,
// and RFC 6265bis.
//
// Everything runs IN THE BROWSER via the local secure-headers module - no fetch,
// no API. All output is escaped text through React (no dangerouslySetInnerHTML).
// The analysis is deterministic; nothing here is clock- or network-dependent.
// Reason text is localized via the message pack; the engine emits stable codes.
// ============================================================================

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { run, HeaderParseError, type SecureHeadersReport, type HeaderRating } from "@/lib/tools/secure-headers";

/** Map a per-item rating to a marker kind (colour). */
function ratingKind(rating: HeaderRating): "good" | "ok" | "bad" | "info" {
  if (rating === "strong") return "good";
  if (rating === "adequate") return "ok";
  if (rating === "weak" || rating === "missing") return "bad";
  return "info";
}

/** Map the overall letter grade to a badge kind. */
function gradeKind(grade: string): "ok" | "warn" | "bad" {
  if (grade === "A" || grade === "B") return "ok";
  if (grade === "C") return "warn";
  return "bad"; // D, F
}

/** Sort order so problems surface first. */
const SEVERITY: Record<HeaderRating, number> = {
  missing: 0,
  weak: 1,
  info: 2,
  adequate: 3,
  strong: 4,
};

// D-83 Example samples — verbatim from this tool's golden vectors.
const EXAMPLE = "HTTP/2 200\nstrict-transport-security: max-age=63072000; includeSubDomains; preload\ncontent-security-policy: default-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'\nx-content-type-options: nosniff\nx-frame-options: DENY\nreferrer-policy: strict-origin-when-cross-origin\npermissions-policy: geolocation=(), camera=(), microphone=()\ncross-origin-opener-policy: same-origin\ncross-origin-resource-policy: same-origin\nset-cookie: __Host-session=abc; Secure; HttpOnly; SameSite=Lax; Path=/";

export default function SecureHeadersTool() {
  const t = useTranslations("tools.secure-headers");

  const [value, setValue] = useState("");
  const [report, setReport] = useState<SecureHeadersReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(
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
        const code = e instanceof HeaderParseError ? e.code : "no-headers";
        setError(t(`errors.${code}`));
        setReport(null);
      }
    },
    [t],
  );

  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    analyze(e.target.value);
  }

  /** Localize one stable reason code, passing its optional value. */
  const reason = (r: { code: string; value?: string }) =>
    t(`reasons.${r.code}`, r.value !== undefined ? { value: r.value } : undefined);

  const findings = report ? [...report.findings].sort((a, b) => SEVERITY[a.rating] - SEVERITY[b.rating]) : [];

  return (
    <div className="cidr-tool jwt-tool secure-headers-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="sh-input">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setValue(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setValue("")}>{t("clear")}</button>
          </div>
        </div>
        <textarea
          id="sh-input"
          className="cidr-input mono sh-textarea"
          rows={8}
          value={value}
          onChange={onChange}
          placeholder={t("inputPlaceholder")}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-describedby="sh-privacy"
        />
        <p id="sh-privacy" className="cidr-privacy">
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
        <div className="jwt-results secure-headers-results">
          {/* Overall grade */}
          <div className="jwt-badges sh-grade-row">
            <span
              className={`jwt-badge sh-grade sh-grade--${gradeKind(report.overall.grade)}`}
              aria-label={t("gradeAria", { grade: report.overall.grade })}
            >
              {t("gradeLabel", { grade: report.overall.grade })}
            </span>
            <span className="sh-score">
              {t("scoreLabel", { score: report.overall.score, max: report.overall.max })}
            </span>
          </div>
          {report.overall.reasons.length > 0 && (
            <ul className="sh-overall-reasons">
              {report.overall.reasons.map((r, i) => (
                <li key={`${r.code}-${i}`} className="sh-overall-reason">
                  {reason(r)}
                </li>
              ))}
            </ul>
          )}

          {/* Per-header findings */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("panels.headers")}</h4>
            <ul className="sh-findings">
              {findings.map((f) => (
                <li key={f.id} className={`sh-finding sh-finding--${ratingKind(f.rating)}`}>
                  <div className="sh-finding-head">
                    <span className="sh-finding-name mono">{f.name}</span>
                    <span className={`sh-rating sh-rating--${ratingKind(f.rating)}`}>
                      {t(`ratings.${f.rating}`)}
                    </span>
                  </div>
                  {f.value && <div className="sh-finding-value mono">{f.value}</div>}
                  {f.reasons.length > 0 && (
                    <ul className="sh-reasons">
                      {f.reasons.map((r, i) => (
                        <li key={`${r.code}-${i}`}>{reason(r)}</li>
                      ))}
                    </ul>
                  )}
                  {f.rating === "missing" && f.recommended && (
                    <div className="sh-reco">
                      <span className="sh-reco-label">{t("recommendedLabel")}</span>{" "}
                      <code className="mono">
                        {f.name}: {f.recommended}
                      </code>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {/* Cookies */}
          {report.cookies.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("panels.cookies")}</h4>
              <ul className="sh-findings">
                {report.cookies.map((ck, idx) => (
                  <li key={`${ck.name}-${idx}`} className={`sh-finding sh-finding--${ratingKind(ck.rating)}`}>
                    <div className="sh-finding-head">
                      <span className="sh-finding-name mono">{ck.name || t("cookieUnnamed")}</span>
                      <span className={`sh-rating sh-rating--${ratingKind(ck.rating)}`}>
                        {t(`ratings.${ck.rating}`)}
                      </span>
                    </div>
                    {ck.reasons.length > 0 && (
                      <ul className="sh-reasons">
                        {ck.reasons.map((r, i) => (
                          <li key={`${r.code}-${i}`}>{reason(r)}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
