"use client";

// ============================================================================
// src/components/CurlCommandBuilderTool.tsx
// ----------------------------------------------------------------------------
// CURL COMMAND BUILDER - pick any of the 27 protocols curl speaks, fill the
// protocol-aware fields, toggle the options that matter, and watch the exact
// command assemble live, every flag explained, warnings surfaced. All state
// feeds the pure engine (compute.ts); nothing is executed or sent (D-49).
// The per-protocol explainer panel and the assembler read the SAME protocol
// table, so the teaching text and the behavior cannot drift apart.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  buildCurl,
  PROTOCOLS,
  PROTOCOL_MAP,
  type BuilderState,
  type KV,
  type ProtocolInfo,
} from "@/lib/tools/curl-command-builder";

/** Group display order for the protocol picker. */
const GROUPS = ["web", "transfer", "mail", "messaging", "lookup"] as const;

/** Path-field label key per protocol path flavor. */
const PATH_LABEL: Record<ProtocolInfo["pathKind"], string> = {
  urlpath: "pathUrl",
  remotepath: "pathRemote",
  topic: "pathTopic",
  mailbox: "pathMailbox",
  word: "pathWord",
  localfile: "pathLocal",
  share: "pathShare",
  none: "",
};

const EMPTY: BuilderState = { protocol: "https" };

function CopyBtn({ text, label, done }: { text: string; label: string; done: string }) {
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

export default function CurlCommandBuilderTool() {
  const t = useTranslations("tools.curl-command-builder");
  const [s, setS] = useState<BuilderState>(EMPTY);
  const p = PROTOCOL_MAP.get(s.protocol)!;
  const r = useMemo(() => buildCurl(s), [s]);

  /** Merge a partial into the state (single source of truth for the engine). */
  const up = (patch: Partial<BuilderState>) => setS((cur) => ({ ...cur, ...patch }));

  /** Switch protocol, keeping only fields the new protocol understands. */
  const pick = (key: string) => setS({ protocol: key });

  /** D-83 Example: load this protocol's example state from the engine table. */
  const loadExample = () => setS({ protocol: p.key, ...p.example });

  // -- Small helpers for repeated KV lists (headers, form fields) -----------
  const setKv = (field: "headers" | "form", i: number, patch: Partial<KV>) => {
    const list = [...(s[field] ?? [])];
    list[i] = { ...list[i], ...patch };
    up({ [field]: list });
  };
  const addKv = (field: "headers" | "form") => up({ [field]: [...(s[field] ?? []), { name: "", value: "" }] });
  const rmKv = (field: "headers" | "form", i: number) => up({ [field]: (s[field] ?? []).filter((_, j) => j !== i) });

  const sup = p.supports;
  const isWeb = p.group === "web";

  return (
    <div className="cidr-tool curlb-tool">
      {/* ---- 1. Protocol picker: grouped chips + live explainer card ---- */}
      <div className="curlb-groups">
        {GROUPS.map((g) => (
          <div className="curlb-group" key={g}>
            <div className="curlb-group-label">{t("ui.group_" + g)}</div>
            <div className="curlb-chips" role="tablist">
              {PROTOCOLS.filter((x) => x.group === g).map((x) => (
                <button
                  key={x.key}
                  type="button"
                  role="tab"
                  aria-selected={x.key === p.key}
                  className={"curlb-chip" + (x.key === p.key ? " curlb-chip--on" : "")}
                  onClick={() => pick(x.key)}
                >
                  {x.scheme}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Protocol explainer: name, description, port/TLS meta, Example row. */}
      <div className="curlb-proto-card">
        <div className="curlb-proto-head">
          <span className="curlb-proto-name">{t("proto." + p.key + ".name")}</span>
          <span className="curlb-meta-chip">{p.scheme + "://"}</span>
          {p.port && <span className="curlb-meta-chip">{t("ui.portDefault")} {p.port}</span>}
          <span className={"curlb-meta-chip curlb-tls--" + p.tls}>{t("tls." + p.tls)}</span>
        </div>
        <p className="curlb-proto-desc">{t("proto." + p.key + ".desc")}</p>
        <div className="curl-actions">
          <button type="button" className="cidr-example-btn" onClick={loadExample}>{t("ui.example")}</button>
          <button type="button" className="cidr-example-btn" onClick={() => setS(EMPTY)}>{t("ui.clear")}</button>
          <button type="button" className="cidr-example-btn" onClick={() => setS({ protocol: p.key })}>{t("ui.clearFields")}</button>
        </div>
      </div>

      {/* ---- 2. The adaptive form ---- */}
      <div className="curlb-form">
        {/* Target */}
        <div className="curlb-section">
          <div className="curlb-section-title">{t("ui.sec_target")}</div>
          <div className="curlb-grid">
            {p.key !== "file" && (
              <label className="curlb-field">
                <span className="curlb-field-label">{t("ui.host")}</span>
                <input className="curlb-input" value={s.host ?? ""} onChange={(e) => up({ host: e.target.value })} placeholder={p.example.host ?? ""} spellCheck={false} />
              </label>
            )}
            {p.key !== "file" && (
              <label className="curlb-field curlb-field--narrow">
                <span className="curlb-field-label">{t("ui.port")}</span>
                <input className="curlb-input" value={s.port ?? ""} onChange={(e) => up({ port: e.target.value })} placeholder={p.port} spellCheck={false} />
              </label>
            )}
            {p.pathKind !== "none" && (
              <label className="curlb-field curlb-field--wide">
                <span className="curlb-field-label">{t("ui." + PATH_LABEL[p.pathKind])}</span>
                <input className="curlb-input" value={s.path ?? ""} onChange={(e) => up({ path: e.target.value })} placeholder={p.example.path ?? ""} spellCheck={false} />
              </label>
            )}
          </div>
        </div>

        {/* Request shaping (HTTP-flavored) */}
        {(sup.method || sup.headers || sup.data || sup.form) && (
          <div className="curlb-section">
            <div className="curlb-section-title">{t("ui.sec_request")}</div>
            <div className="curlb-grid">
              {sup.method && (
                <label className="curlb-field curlb-field--narrow">
                  <span className="curlb-field-label">{t("ui.method")}</span>
                  <select className="curlb-select" value={s.headOnly ? "HEAD" : (s.method ?? "GET")} onChange={(e) => {
                    const v = e.target.value;
                    if (v === "HEAD") up({ headOnly: true, method: undefined });
                    else up({ headOnly: false, method: v as BuilderState["method"] });
                  }}>
                    {["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].map((m) => <option key={m}>{m}</option>)}
                  </select>
                </label>
              )}
              {sup.httpVersion && (
                <label className="curlb-field curlb-field--narrow">
                  <span className="curlb-field-label">{t("ui.httpVersion")}</span>
                  <select className="curlb-select" value={s.httpVersion ?? ""} onChange={(e) => up({ httpVersion: e.target.value as BuilderState["httpVersion"] })}>
                    <option value="">{t("ui.httpAuto")}</option>
                    <option value="http1.1">HTTP/1.1</option>
                    <option value="http2">HTTP/2</option>
                    <option value="http3">HTTP/3</option>
                  </select>
                </label>
              )}
            </div>

            {sup.headers && (
              <div className="curlb-kvs">
                <div className="curlb-field-label">{t("ui.headers")}</div>
                {(s.headers ?? []).map((h, i) => (
                  <div className="curlb-kv-row" key={i}>
                    <input className="curlb-input" value={h.name} placeholder={t("ui.headerName")} onChange={(e) => setKv("headers", i, { name: e.target.value })} spellCheck={false} />
                    <input className="curlb-input" value={h.value} placeholder={t("ui.headerValue")} onChange={(e) => setKv("headers", i, { value: e.target.value })} spellCheck={false} />
                    <button type="button" className="curl-copy" onClick={() => rmKv("headers", i)} aria-label={t("ui.remove")}>×</button>
                  </div>
                ))}
                <button type="button" className="cidr-example-btn" onClick={() => addKv("headers")}>{t("ui.add")}</button>
              </div>
            )}

            {sup.data && (
              <div className="curlb-kvs">
                <label className="curlb-field curlb-field--wide">
                  <span className="curlb-field-label">{t("ui.data")}</span>
                  <textarea className="curlb-input curlb-data" rows={3} value={s.data ?? ""} onChange={(e) => up({ data: e.target.value })} spellCheck={false} />
                </label>
                <label className="curlb-check">
                  <input type="checkbox" checked={s.dataMode === "urlencode"} onChange={(e) => up({ dataMode: e.target.checked ? "urlencode" : "raw" })} />
                  <span>{t("ui.dataUrlencode")}</span>
                </label>
              </div>
            )}

            {sup.form && (
              <div className="curlb-kvs">
                <div className="curlb-field-label">{t("ui.form")}</div>
                {(s.form ?? []).map((f, i) => (
                  <div className="curlb-kv-row" key={i}>
                    <input className="curlb-input" value={f.name} placeholder={t("ui.headerName")} onChange={(e) => setKv("form", i, { name: e.target.value })} spellCheck={false} />
                    <input className="curlb-input" value={f.value} placeholder={t("ui.headerValue")} onChange={(e) => setKv("form", i, { value: e.target.value })} spellCheck={false} />
                    <label className="curlb-check curlb-check--inline">
                      <input type="checkbox" checked={!!f.isFile} onChange={(e) => setKv("form", i, { isFile: e.target.checked })} />
                      <span>{t("ui.formFile")}</span>
                    </label>
                    <button type="button" className="curl-copy" onClick={() => rmKv("form", i)} aria-label={t("ui.remove")}>×</button>
                  </div>
                ))}
                <button type="button" className="cidr-example-btn" onClick={() => addKv("form")}>{t("ui.add")}</button>
              </div>
            )}
          </div>
        )}

        {/* Credentials */}
        {sup.auth && (
          <div className="curlb-section">
            <div className="curlb-section-title">{t("ui.sec_auth")}</div>
            <div className="curlb-grid">
              <label className="curlb-field">
                <span className="curlb-field-label">{t("ui.user")}</span>
                <input className="curlb-input" value={s.user ?? ""} onChange={(e) => up({ user: e.target.value })} spellCheck={false} />
              </label>
              <label className="curlb-field">
                <span className="curlb-field-label">{t("ui.pass")}</span>
                <input className="curlb-input" value={s.pass ?? ""} onChange={(e) => up({ pass: e.target.value })} spellCheck={false} />
              </label>
            </div>
            <p className="curl-muted">{t("ui.passNote")}</p>
          </div>
        )}

        {/* Mail envelope */}
        {sup.mail && (
          <div className="curlb-section">
            <div className="curlb-section-title">{t("ui.sec_mail")}</div>
            <div className="curlb-grid">
              <label className="curlb-field">
                <span className="curlb-field-label">{t("ui.mailFrom")}</span>
                <input className="curlb-input" value={s.mailFrom ?? ""} onChange={(e) => up({ mailFrom: e.target.value })} spellCheck={false} />
              </label>
              <label className="curlb-field">
                <span className="curlb-field-label">{t("ui.mailRcpt")}</span>
                <input className="curlb-input" value={(s.mailRcpt ?? []).join(", ")} onChange={(e) => up({ mailRcpt: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} spellCheck={false} />
              </label>
            </div>
          </div>
        )}

        {/* Transfer */}
        {(sup.upload || sup.listOnly || true) && (
          <div className="curlb-section">
            <div className="curlb-section-title">{t("ui.sec_transfer")}</div>
            <div className="curlb-grid">
              {sup.upload && (
                <label className="curlb-field">
                  <span className="curlb-field-label">{t("ui.upload")}</span>
                  <input className="curlb-input" value={s.upload ?? ""} onChange={(e) => up({ upload: e.target.value })} placeholder="localfile.txt" spellCheck={false} />
                </label>
              )}
              <label className="curlb-field curlb-field--narrow">
                <span className="curlb-field-label">{t("ui.output")}</span>
                <select className="curlb-select" value={s.output ?? "stdout"} onChange={(e) => up({ output: e.target.value as BuilderState["output"] })}>
                  <option value="stdout">{t("ui.outStdout")}</option>
                  <option value="remoteName">{t("ui.outRemote")}</option>
                  <option value="file">{t("ui.outFile")}</option>
                </select>
              </label>
              {s.output === "file" && (
                <label className="curlb-field">
                  <span className="curlb-field-label">{t("ui.outFileName")}</span>
                  <input className="curlb-input" value={s.outputFile ?? ""} onChange={(e) => up({ outputFile: e.target.value })} spellCheck={false} />
                </label>
              )}
            </div>
            {sup.listOnly && (
              <label className="curlb-check">
                <input type="checkbox" checked={!!s.listOnly} onChange={(e) => up({ listOnly: e.target.checked })} />
                <span>{t("ui.listOnly")}</span>
              </label>
            )}
          </div>
        )}

        {/* Connection, TLS & timing */}
        <div className="curlb-section">
          <div className="curlb-section-title">{t("ui.sec_connection")}</div>
          <div className="curlb-grid">
            <label className="curlb-field">
              <span className="curlb-field-label">{t("ui.proxy")}</span>
              <input className="curlb-input" value={s.proxy ?? ""} onChange={(e) => up({ proxy: e.target.value })} placeholder="http://proxy:3128" spellCheck={false} />
            </label>
            <label className="curlb-field">
              <span className="curlb-field-label">{t("ui.resolve")}</span>
              <input className="curlb-input" value={s.resolve ?? ""} onChange={(e) => up({ resolve: e.target.value })} placeholder="example.com:443:203.0.113.7" spellCheck={false} />
            </label>
            <label className="curlb-field">
              <span className="curlb-field-label">{t("ui.cacert")}</span>
              <input className="curlb-input" value={s.cacert ?? ""} onChange={(e) => up({ cacert: e.target.value })} placeholder="ca.pem" spellCheck={false} />
            </label>
            <label className="curlb-field curlb-field--narrow">
              <span className="curlb-field-label">{t("ui.connectTimeout")}</span>
              <input className="curlb-input" value={s.connectTimeout ?? ""} onChange={(e) => up({ connectTimeout: e.target.value })} placeholder="5" spellCheck={false} />
            </label>
            <label className="curlb-field curlb-field--narrow">
              <span className="curlb-field-label">{t("ui.maxTime")}</span>
              <input className="curlb-input" value={s.maxTime ?? ""} onChange={(e) => up({ maxTime: e.target.value })} placeholder="30" spellCheck={false} />
            </label>
            <label className="curlb-field curlb-field--narrow">
              <span className="curlb-field-label">{t("ui.retry")}</span>
              <input className="curlb-input" value={s.retry ?? ""} onChange={(e) => up({ retry: e.target.value })} placeholder="3" spellCheck={false} />
            </label>
          </div>
          <label className="curlb-check">
            <input type="checkbox" checked={!!s.insecure} onChange={(e) => up({ insecure: e.target.checked })} />
            <span>{t("ui.insecure")}</span>
          </label>
        </div>

        {/* Behavior & verbosity */}
        <div className="curlb-section">
          <div className="curlb-section-title">{t("ui.sec_behavior")}</div>
          {isWeb && (
            <div className="curlb-grid">
              <label className="curlb-field">
                <span className="curlb-field-label">{t("ui.cookie")}</span>
                <input className="curlb-input" value={s.cookie ?? ""} onChange={(e) => up({ cookie: e.target.value })} placeholder="name=value" spellCheck={false} />
              </label>
              <label className="curlb-field">
                <span className="curlb-field-label">{t("ui.cookieJar")}</span>
                <input className="curlb-input" value={s.cookieJar ?? ""} onChange={(e) => up({ cookieJar: e.target.value })} placeholder="jar.txt" spellCheck={false} />
              </label>
              <label className="curlb-field">
                <span className="curlb-field-label">{t("ui.userAgent")}</span>
                <input className="curlb-input" value={s.userAgent ?? ""} onChange={(e) => up({ userAgent: e.target.value })} spellCheck={false} />
              </label>
            </div>
          )}
          <div className="curlb-checks">
            {isWeb && (
              <label className="curlb-check"><input type="checkbox" checked={!!s.followRedirects} onChange={(e) => up({ followRedirects: e.target.checked })} /><span>{t("ui.followRedirects")}</span></label>
            )}
            {isWeb && (
              <label className="curlb-check"><input type="checkbox" checked={!!s.compressed} onChange={(e) => up({ compressed: e.target.checked })} /><span>{t("ui.compressed")}</span></label>
            )}
            {isWeb && (
              <label className="curlb-check"><input type="checkbox" checked={!!s.include} onChange={(e) => up({ include: e.target.checked })} /><span>{t("ui.include")}</span></label>
            )}
            <label className="curlb-check"><input type="checkbox" checked={!!s.verbose} onChange={(e) => up({ verbose: e.target.checked })} /><span>{t("ui.verbose")}</span></label>
            <label className="curlb-check"><input type="checkbox" checked={!!s.silent} onChange={(e) => up({ silent: e.target.checked })} /><span>{t("ui.silent")}</span></label>
          </div>
        </div>
      </div>

      {/* ---- 3. Live preview: the command, warnings, every flag explained ---- */}
      <div className="curlb-preview">
        <div className="curlb-preview-head">
          <span className="curl-code-lang">{t("ui.preview")}</span>
          {r.ok && (
            <span className="curlb-preview-actions">
              <CopyBtn text={r.pretty} label={t("ui.copyPretty")} done={t("ui.copied")} />
              <CopyBtn text={r.command} label={t("ui.copyLine")} done={t("ui.copied")} />
            </span>
          )}
        </div>
        {r.ok ? (
          <pre className="curl-code-body dig-mono curlb-cmd">{r.pretty}</pre>
        ) : (
          <div className="curl-error">{t("ui.err_" + (r.errorId ?? "host"))}</div>
        )}
        <p className="curl-muted curlb-shellnote">{t("ui.windowsNote")}</p>
      </div>

      {r.ok && r.warnings.length > 0 && (
        <ul className="curl-warnings">
          {r.warnings.map((w) => <li key={w} className="curl-warn">{t("warn." + w)}</li>)}
        </ul>
      )}

      {r.ok && r.parts.length > 0 && (
        <div className="curlb-parts">
          <div className="curlb-section-title">{t("ui.partsTitle")}</div>
          {r.parts.map((part, i) => (
            <div className="curlb-part" key={i}>
              <code className="curl-flag dig-mono">{part.flag}</code>
              <span className="curl-opt-desc">
                {t("opt." + part.explainId)}
                {part.value !== undefined && <span className="dig-mono curlb-part-val"> {part.value}</span>}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="cidr-privacy">{t("ui.privacy")}</p>
    </div>
  );
}
