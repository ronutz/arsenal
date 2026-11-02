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
//
// Share results (2026-10-27): under the request line and its warnings, a
// button builds a link that carries a copy of the request with every
// credential, cookie value and body secret masked (src/lib/tools/
// http-request-translator/share.ts); the popover says how many were. An
// arriving link (useShareArrival) fills the box as a paste would.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { parseRequest } from "@/lib/tools/http-request-translator";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what a spec encodes
import { REQUEST_TRANSLATOR_SHARE, encodeRequestTranslator } from "@/lib/tools/http-request-translator/share"; // this tool's share spec: the copy, credentials masked
import { shareableRequest } from "@/lib/tools/http-request-translator/compute"; // the copy, and the count the popover gives

/** Nothing to share (the button is disabled): a constant, so the button sees no change. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" };

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
  // An arriving share link: the copy fills the box as a paste would.
  useShareArrival(REQUEST_TRANSLATOR_SHARE, (state) => setInput(state.input)); // the copy
  // The copy a link would carry, made once per change while the request reads (a linear pass over the lines).
  const copy = useMemo(() => (p.ok ? shareableRequest(input) : null), [p, input]); // credentials masked
  // What Share results may carry: the copy, or blocked when a key or token no rule can name is left.
  const share = useMemo<ShareEncoding>(() => (p.ok && copy ? encodeRequestTranslator({ input }, copy) : NOTHING), [p, copy, input]); // memoised
  // The popover's blocked line, when the copy still holds a secret.
  const blockedMessage = !share.ok && share.reason === "blocked" ? t("share.blocked", { line: Number(share.values?.line ?? 0), label: String(share.values?.label ?? "") }) : ""; // only when blocked

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
                <li className="curl-warn" key={w}>
                  {t("warn." + w)}
                </li>
              ))}
            </ul>
          )}

          {/* Share results: under the request line and its warnings (the first answer), at the start of its own row. */}
          <div className="rdap-ask-row">
            <ShareResultsButton encoding={share} carries={t("share.carries")} details={[t("share.redacted", { n: copy?.redacted ?? 0 })]} blockedMessage={blockedMessage} title={t("name")} />
          </div>

          {p.headers.length > 0 && (
            <div className="curlb-section">
              <h3 className="curlb-section-title">{t("headers")}</h3>
              {p.headers.map((h, i) => (
                <div className="curl-row" key={`${h.name}-${i}`}>
                  <div className="curl-row-key">{h.name}</div>
                  <div className="curl-row-val dig-mono">{h.value}</div>
                </div>
              ))}
            </div>
          )}

          <div className="curlb-section">
            <h3 className="curlb-section-title">{t("translations")}</h3>
            {codeBlocks.map(([id, code]) => (
              <div className="curl-code" key={id}>
                <div className="curl-code-head">
                  <span className="curl-code-lang">{t("out." + id)}</span>
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
