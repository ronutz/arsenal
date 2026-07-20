"use client";

// ============================================================================
// src/components/HttpRequestTranslatorTool.tsx
// ----------------------------------------------------------------------------
// Paste a curl command; get it explained and translated. All parsing is pure and
// local (compute.ts); this only renders it. Option and warning ids from the
// engine are turned into prose through translation keys, so the tool is fully
// localized. Nothing is sent and no request is run.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { parseCurl, type KV } from "@/lib/tools/http-request-translator";

const EXAMPLE = `curl -X POST https://api.example.com/v1/users \\
  -H "Authorization: Bearer tok_abc123" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Alice","role":"admin"}'`;

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

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="curl-row">
      <div className="curl-row-key">{label}</div>
      <div className="curl-row-val">{children}</div>
    </div>
  );
}


export default function HttpRequestTranslatorTool() {
  const t = useTranslations("tools.http-request-translator");
  const [input, setInput] = useState("");
  const [tab, setTab] = useState<"explain" | "translate">("explain");
  const p = useMemo(() => parseCurl(input), [input]);

  const codeBlocks = p.ok
    ? ([
        ["fetch", p.translations.fetch, "js"],
        ["http", p.translations.http, "http"],
        ["httpie", p.translations.httpie, "sh"],
        ["python", p.translations.python, "py"],
      ] as const)
    : [];

  return (
    <div className="cidr-tool jwt-tool dig-tool curl-tool">
      <label className="cidr-label" htmlFor="curl-in">
        {t("input")}
      </label>
      <textarea
        id="curl-in"
        className="cidr-input dig-input curl-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={EXAMPLE}
        rows={5}
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

      {input && !p.ok && <div className="dig-error curl-error">{t("err." + (p.errorId ?? "empty"))}</div>}

      {p.ok && (
        <>
          <div className="curl-reqline">
            <span className={"curl-method curl-method--" + p.method.toLowerCase()}>{p.method}</span>
            {p.methodInferred && <span className="curl-inferred">{t("methodInferred")}</span>}
            <span className="curl-url dig-mono">{p.url}</span>
          </div>

          <div className="curl-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={tab === "explain"} className={"curl-tab" + (tab === "explain" ? " curl-tab--on" : "")} onClick={() => setTab("explain")}>
              {t("tab.explain")}
            </button>
            <button type="button" role="tab" aria-selected={tab === "translate"} className={"curl-tab" + (tab === "translate" ? " curl-tab--on" : "")} onClick={() => setTab("translate")}>
              {t("tab.translate")}
            </button>
          </div>

          {p.warnings.length > 0 && (
            <ul className="curl-warnings">
              {p.warnings.map((w) => (
                <li key={w} className="curl-warn">
                  {t("warnings." + w)}
                </li>
              ))}
            </ul>
          )}

          {tab === "explain" && (
            <div className="curl-explain">
              {p.urlParts && (
                <Row label={t("url")}>
                  <div className="curl-urlparts">
                    <span><b>{t("scheme")}</b> {p.urlParts.scheme}</span>
                    <span><b>{t("host")}</b> {p.urlParts.host}</span>
                    {p.urlParts.port && <span><b>{t("port")}</b> {p.urlParts.port}</span>}
                    <span><b>{t("path")}</b> <code className="dig-mono">{p.urlParts.path}</code></span>
                  </div>
                  {p.urlParts.query.length > 0 && (
                    <table className="curl-kv">
                      <tbody>
                        {p.urlParts.query.map((kv: KV, i: number) => (
                          <tr key={i}>
                            <td className="curl-kv-k dig-mono">{kv.name}</td>
                            <td className="curl-kv-v dig-mono">{kv.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </Row>
              )}

              <Row label={t("headers")}>
                {p.headers.length === 0 ? (
                  <span className="curl-muted">{t("noHeaders")}</span>
                ) : (
                  <table className="curl-kv">
                    <tbody>
                      {p.headers.map((h, i) => (
                        <tr key={i}>
                          <td className="curl-kv-k dig-mono">{h.name}</td>
                          <td className="curl-kv-v dig-mono">{h.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Row>

              {p.auth && (
                <Row label={t("auth")}>
                  <span className="curl-tag">{t("authKind." + p.auth.kind)}</span>
                  {p.auth.user !== undefined && <span className="dig-mono"> {p.auth.user}</span>}
                </Row>
              )}

              {p.body ? (
                <Row label={t("body")}>
                  <div className="curl-body-meta">
                    <span className="curl-tag">{t("bodyKind." + p.body.kind)}</span>
                    <span className="dig-mono">{p.body.contentType}</span>
                    {p.body.contentTypeImplicit && <span className="curl-inferred">{t("ctImplicit")}</span>}
                  </div>
                  {p.body.kind === "form" ? (
                    <table className="curl-kv">
                      <tbody>
                        {(p.body.fields ?? []).map((f, i) => (
                          <tr key={i}>
                            <td className="curl-kv-k dig-mono">{f.name}</td>
                            <td className="curl-kv-v dig-mono">{f.isFile ? "@" + f.value : f.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <pre className="curl-body-text dig-mono">{p.body.text}</pre>
                  )}
                </Row>
              ) : (
                <Row label={t("body")}>
                  <span className="curl-muted">{t("noBody")}</span>
                </Row>
              )}

              {p.cookies && (
                <Row label={t("cookies")}>
                  <span className="dig-mono">{p.cookies}</span>
                </Row>
              )}

              {p.options.length > 0 && (
                <Row label={t("optionsLabel")}>
                  <ul className="curl-opts">
                    {p.options.map((o, i) => (
                      <li key={i}>
                        <code className="curl-flag dig-mono">{o.raw}</code>
                        <span className="curl-opt-desc">
                          {t("opt." + o.id)}
                          {o.value ? <span className="dig-mono"> {o.value}</span> : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Row>
              )}
            </div>
          )}

          {tab === "translate" && (
            <div className="curl-translate">
              {codeBlocks.map(([id, code]) => (
                <div className="curl-code" key={id}>
                  <div className="curl-code-head">
                    <span className="curl-code-lang">{t("lang." + id)}</span>
                    <CopyButton text={code} label={t("copy")} done={t("copied")} />
                  </div>
                  <pre className="curl-code-body dig-mono">{code}</pre>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
