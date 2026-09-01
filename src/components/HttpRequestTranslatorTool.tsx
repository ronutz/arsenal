"use client";

// ============================================================================
// src/components/HttpRequestTranslatorTool.tsx
// ----------------------------------------------------------------------------
// Paste a raw HTTP/1.1 request; get it translated to curl, fetch, HTTPie,
// Python requests and PowerShell. All parsing is pure and local (compute.ts);
// this only renders it. Warning ids from the engine become prose through
// translation keys, so the tool is fully localized. Nothing is sent and no
// request is run - which matters here, because a captured request usually
// carries an Authorization header or a session cookie.
//
// Reuses the curl-tool class vocabulary rather than inventing a parallel one:
// the two tools are inverses and should look like siblings.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { parseRequest } from "@/lib/tools/http-request-translator";

const EXAMPLE = `POST /v1/users HTTP/1.1
Host: api.example.com
Content-Type: application/json
Authorization: Bearer tok_abc123

{"name":"Alice","role":"admin"}`;

function CopyButton({ text, label, done }: { text: string; label: string; done: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      className="curl-copy"
      onClick={() => {
        try {
          void navigator.clipboard.writeText(text);
          setOk(true);
          setTimeout(() => setOk(false), 1200);
        } catch {
          /* clipboard unavailable; no-op */
        }
      }}
    >
      {ok ? done : label}
    </button>
  );
}

export default function HttpRequestTranslatorTool() {
  const t = useTranslations("tools.http-request-translator");
  const [input, setInput] = useState("");
  const p = useMemo(() => parseRequest(input), [input]);

  const codeBlocks = p.ok
    ? ([
        ["curl", p.translations.curl, "sh"],
        ["fetch", p.translations.fetch, "js"],
        ["httpie", p.translations.httpie, "sh"],
        ["python", p.translations.python, "py"],
        ["powershell", p.translations.powershell, "ps"],
      ] as const)
    : [];

  return (
    <div className="cidr-tool jwt-tool dig-tool curl-tool">
      <label className="cidr-label" htmlFor="req-in">
        {t("input")}
      </label>
      <textarea
        id="req-in"
        className="cidr-input dig-input curl-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={EXAMPLE}
        rows={8}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
      />
      <div className="curl-actions">
        <button type="button" className="cidr-example-btn" onClick={() => setInput(EXAMPLE)}>
          {t("example")}
        </button>
        {input && (
          <button type="button" className="cidr-example-btn" onClick={() => setInput("")}>
            {t("clear")}
          </button>
        )}
      </div>
      <p className="cidr-privacy dig-privacy">{t("privacy")}</p>

      {input && !p.ok && <div className="dig-error curl-error">{t("err.notARequest")}</div>}

      {p.ok && (
        <>
          <div className="curl-reqline">
            <span className={"curl-method curl-method--" + p.method.toLowerCase()}>{p.method}</span>
            <span className="curl-url dig-mono">{p.url}</span>
            <span className="curl-inferred">{p.version}</span>
          </div>

          {p.warnings.length > 0 && (
            <ul className="curl-warnings">
              {p.warnings.map((w) => (
                <li className="curl-warning" key={w}>
                  {t("warn." + w)}
                </li>
              ))}
            </ul>
          )}

          {p.headers.length > 0 && (
            <div className="curl-section">
              <h3 className="curl-section-title">{t("headers")}</h3>
              {p.headers.map((h, i) => (
                <div className="curl-row" key={`${h.name}-${i}`}>
                  <div className="curl-row-key">{h.name}</div>
                  <div className="curl-row-val dig-mono">{h.value}</div>
                </div>
              ))}
            </div>
          )}

          <div className="curl-section">
            <h3 className="curl-section-title">{t("translations")}</h3>
            {codeBlocks.map(([id, code]) => (
              <div className="curl-block" key={id}>
                <div className="curl-block-head">
                  <span className="curl-block-name">{t("out." + id)}</span>
                  <CopyButton text={code} label={t("copy")} done={t("copied")} />
                </div>
                <pre className="curl-code dig-mono">{code}</pre>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
