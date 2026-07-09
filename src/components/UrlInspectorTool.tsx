"use client";

// ============================================================================
// src/components/UrlInspectorTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE URL INSPECTOR.
//
// Paste a URL and see every component named: scheme, userinfo, host (with its
// type and, for an internationalized host, the Unicode form decoded from
// punycode), port (with the scheme's default), path split into segments, the
// query string broken out into percent-decoded parameters, and the fragment.
// An assessment flags embedded credentials, plaintext schemes, redundant ports,
// and characters that should be normalized.
//
// Everything runs IN THE BROWSER via the local module. All output is escaped
// through React.
// ============================================================================

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { run, UrlParseError, type UrlReport } from "@/lib/tools/url-inspector";

const HOST_TYPE_LABEL: Record<NonNullable<UrlReport["hostType"]>, string> = {
  ipv4: "ipv4",
  ipv6: "ipv6",
  "registered-name": "registeredName",
};

function Row({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  if (value === undefined || value === "") return null;
  return (
    <div className="jwt-claim-row">
      <dt className="jwt-claim-label">{label}</dt>
      <dd className={`jwt-claim-value${mono ? " mono" : ""}`}>{value}</dd>
    </div>
  );
}

// D-83 Example samples — verbatim from this tool's golden vectors.
const EXAMPLE = "https://user:pass@www.example.com:8443/path/to/page?a=1&b=hello%20world&c#section";

export default function UrlInspectorTool() {
  const t = useTranslations("tools.url-inspector");

  const [value, setValue] = useState("");
  const [report, setReport] = useState<UrlReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parse = useCallback(
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
        const code = e instanceof UrlParseError ? e.code : "empty";
        setError(t(`errors.${code}`));
        setReport(null);
      }
    },
    [t],
  );

  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    parse(e.target.value);
  }

  const reason = (r: { code: string; value?: string }) =>
    t(`reasons.${r.code}`, r.value !== undefined ? { value: r.value } : undefined);

  return (
    <div className="cidr-tool jwt-tool saml-tool url-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="url-input">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => { setValue(EXAMPLE); parse(EXAMPLE); }}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => { setValue(""); parse(""); }}>{t("clear")}</button>
          </div>
        </div>
        <textarea
          id="url-input"
          className="cidr-input mono saml-textarea"
          rows={3}
          value={value}
          onChange={onChange}
          placeholder={t("inputPlaceholder")}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-describedby="url-privacy"
        />
        <p id="url-privacy" className="cidr-privacy">
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
        <div className="jwt-results saml-results url-results">
          {/* Components */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("panels.components")}</h4>
            <dl className="jwt-claims">
              <Row label={t("fields.scheme")} value={report.scheme ?? undefined} mono />
              {report.userinfo && (
                <div className="jwt-claim-row">
                  <dt className="jwt-claim-label">{t("fields.userinfo")}</dt>
                  <dd className="jwt-claim-value mono">
                    {report.userinfo.user}
                    {report.userinfo.hasPassword && (
                      <span className="jwt-badge saml-badge--bad url-inline-badge">{t("credentials")}</span>
                    )}
                  </dd>
                </div>
              )}
              {report.host && (
                <div className="jwt-claim-row">
                  <dt className="jwt-claim-label">{t("fields.host")}</dt>
                  <dd className="jwt-claim-value mono">
                    {report.host}
                    {report.hostType && (
                      <span className="jwt-badge saml-badge--type url-inline-badge">
                        {t(`hostType.${HOST_TYPE_LABEL[report.hostType]}`)}
                      </span>
                    )}
                  </dd>
                </div>
              )}
              {report.hostUnicode && <Row label={t("fields.hostUnicode")} value={report.hostUnicode} mono />}
              {report.port !== null && (
                <div className="jwt-claim-row">
                  <dt className="jwt-claim-label">{t("fields.port")}</dt>
                  <dd className="jwt-claim-value mono">
                    {report.port}
                    {report.defaultPort !== null && report.port === report.defaultPort && (
                      <span className="url-port-note">{t("fields.isDefault")}</span>
                    )}
                  </dd>
                </div>
              )}
              {report.port === null && report.defaultPort !== null && (
                <Row label={t("fields.port")} value={t("fields.defaultImplied", { port: report.defaultPort })} mono />
              )}
              <Row label={t("fields.path")} value={report.path || "/"} mono />
              {report.pathSegments.length > 0 && (
                <Row label={t("fields.segments")} value={report.pathSegments.join("  /  ")} mono />
              )}
              {report.fragment !== null && <Row label={t("fields.fragment")} value={report.fragment || t("emptyValue")} mono />}
            </dl>
          </section>

          {/* Query parameters */}
          {report.query !== null && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">
                {t("panels.query")} {report.params.length > 0 ? `(${report.params.length})` : ""}
              </h4>
              {report.params.length > 0 ? (
                <dl className="jwt-claims">
                  {report.params.map((p, i) => (
                    <div className="jwt-claim-row" key={`p-${i}`}>
                      <dt className="jwt-claim-label mono">{p.key}</dt>
                      <dd className="jwt-claim-value mono">{p.value === null ? t("emptyValue") : p.value || t("emptyString")}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="saml-note">{t("emptyQuery")}</p>
              )}
            </section>
          )}

          {/* Assessment */}
          {report.reasons.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("panels.assessment")}</h4>
              <ul className="sh-overall-reasons saml-reasons">
                {report.reasons.map((r, i) => (
                  <li key={`${r.code}-${i}`} className="sh-overall-reason">
                    {reason(r)}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="saml-note saml-note--verify">{t("note")}</p>
        </div>
      )}
    </div>
  );
}
