"use client";

// ============================================================================
// src/components/HttpMessageDecoderTool.tsx
// ----------------------------------------------------------------------------
// THE HTTP MESSAGE DECODER (page UI). Paste a raw HTTP/1.1 request or response
// and read it decoded: the start line against the registries, the framing
// decision RFC 9112 makes for the body (with the chunks decoded), the fields
// grouped by the part of the specification that defines them, the credentials
// and cookies the message carries (masked), the hand-offs to neighbouring tools,
// the message with flagged lines marked, and the findings by line.
//
// All answers come from src/lib/tools/http-message-decoder (the message is
// parsed, never sent); this component only lays them out and words them.
// ============================================================================

import { useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { run, VECTORS, type HttpMessageResult, type FieldLine } from "@/lib/tools/http-message-decoder";
import { TclCode, TclPresets } from "@/components/TclTeachParts";

// D-83: the Example button loads a golden vector verbatim.
const EXAMPLE_ID = "chunked-response";

// The vectors offered as presets (the rest stay vectors only).
const PRESET_IDS = ["chunked-response", "get-request", "ok-response-content-length", "smuggling-shape", "post-form-basic", "bearer-jwt", "set-cookie-response", "no-host-http11", "duplicate-host-space-colon", "no-content-304", "bad-content-length", "old-date-formats", "security-headers-response"];

// Fields whose values are secrets: the panels show the masked form from the engine instead.
const SECRET_FIELDS = new Set(["authorization", "proxy-authorization", "cookie", "set-cookie"]);

/** The page component. */
export default function HttpMessageDecoderTool() {
  // This tool's words.
  const t = useTranslations("tools.http-message-decoder");
  // Rich-text tags the sentences use.
  const rich = { code: (chunks: ReactNode) => <code>{chunks}</code> };
  // The message.
  const [message, setMessage] = useState(VECTORS.find((v) => v.id === EXAMPLE_ID)!.input.message);
  // The preset currently loaded.
  const [active, setActive] = useState<string | undefined>(EXAMPLE_ID);
  // The reading, recomputed as the message changes.
  const out = useMemo((): { r?: HttpMessageResult; error?: string } => {
    // Nothing to read.
    if (message.trim() === "") return {};
    // The engine refuses oversized input with a message.
    try { return { r: run({ message }) }; } catch (e) { return { error: (e as Error).message }; }
  }, [message]);
  // Load a preset.
  const pick = (id: string) => {
    // The vector.
    const v = VECTORS.find((x) => x.id === id);
    // Unknown ids do nothing.
    if (!v) return;
    // Its message.
    setMessage(v.input.message);
    // Mark it.
    setActive(id);
  };
  // The result, when there is one.
  const r = out.r;
  // The worst severity per line, for the code view.
  const marks = useMemo(() => {
    // Line to severity.
    const m = new Map<number, string>();
    // Severity order.
    const rank: Record<string, number> = { error: 3, warning: 2, info: 1 };
    // Each finding keeps the worst one.
    for (const f of r?.findings ?? []) if (!m.has(f.line) || rank[f.severity] > rank[m.get(f.line)!]) m.set(f.line, f.severity);
    // Done.
    return m;
  }, [r]);
  // A finding's sentence, by rule and its parameters.
  const messageFor = (rule: string, params?: Record<string, string | number>) => {
    // Parameters as they came: numbers stay numbers (plural forms need them), the rest is text.
    const p = Object.fromEntries(Object.entries(params ?? {}).map(([k, v]) => [k, typeof v === "number" ? v : String(v)]));
    // Each rule's sentences are keyed by variant ("main" when the rule has one).
    return t(`finding.${rule}.${typeof p.what === "string" ? p.what : "main"}`, p);
  };
  // The value shown for a field: masked when it carries a secret.
  const shownValue = (f: FieldLine): string => {
    // The lower-cased name.
    const n = f.name.toLowerCase();
    // Not a secret: as written.
    if (!SECRET_FIELDS.has(n) || !r) return f.value;
    // A credential: the engine's masked form.
    if (n === "authorization" || n === "proxy-authorization") { const c = r.credentials.find((x) => x.line === f.line); return c ? `${c.scheme} ${c.masked}` : f.value; }
    // Cookies sent: names with masked values.
    if (n === "cookie") return f.value.split(";").map((pair) => { const eq = pair.indexOf("="); const name = (eq >= 0 ? pair.slice(0, eq) : pair).trim(); const c = r.cookies.find((x) => x.name === name); return c ? `${c.name}=${c.masked}` : name; }).join("; ");
    // A Set-Cookie: the masked value and the attributes as written.
    const sc = r.setCookies.find((x) => x.line === f.line);
    // Rebuilt.
    return sc ? [`${sc.name}=${sc.masked}`, ...sc.attributes.map((a) => (a.value ? `${a.name}=${a.value}` : a.name))].join("; ") : f.value;
  };
  // The message with its CRLFs visible as line breaks (TclCode splits on \n).
  const codeView = message.replace(/\r\n/g, "\n").replace(/\r/g, "\\r");
  // Draw.
  return (
    <div className="cidr-tool jwt-tool tcl-tool">
      {/* The message, with the Example / Clear buttons (D-83). */}
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="hmd-src">{t("messageLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => pick(EXAMPLE_ID)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => { setMessage(""); setActive(undefined); }}>{t("clear")}</button>
          </div>
        </div>
        <textarea id="hmd-src" className="cidr-input mono json-input" rows={12} value={message} onChange={(e) => { setMessage(e.target.value); setActive(undefined); }} placeholder={t("messagePlaceholder")} spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="off" />
      </div>
      <TclPresets items={PRESET_IDS.map((id) => ({ id, label: t(`preset.${id}`) }))} label={t("presetsLabel")} onPick={pick} active={active} />

      {/* An oversized input. */}
      {out.error && <p className="tcl-verdict tcl-verdict-bad" role="status">{out.error}</p>}

      {/* The reading. */}
      {r && (
        <div className="jwt-results" aria-live="polite">
          {/* Summary: what it is, how many findings of each kind, the facts of the paste. */}
          <div className={r.kind === "unknown" || r.counts.error > 0 ? "tcl-verdict tcl-verdict-bad" : r.counts.warning > 0 ? "tcl-verdict tcl-verdict-warn" : "tcl-verdict tcl-verdict-ok"}>
            <p><span className="tcl-verdict-label">{t(`kind.${r.kind}`)}</span> {r.findings.length === 0 ? t("clean") : t("counts", { error: r.counts.error, warning: r.counts.warning, info: r.counts.info })}</p>
            <p className="hmac-build-note">{t("facts", { lines: r.facts.lines, headers: r.facts.headerLines, ending: r.facts.lineEnding, octets: r.framing.bodyOctets })}</p>
          </div>

          {/* The start line. */}
          {r.request && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("requestLineTitle")}</h4>
              <dl className="tcl-pairs">
                <dt className="tcl-pairs-name">{t("method")}</dt>
                <dd className="tcl-pairs-value">
                  <code>{r.request.method}</code>{" "}
                  {r.request.known ? (
                    <>
                      <span className={`tcl-pill ${r.request.known.safe ? "tcl-pill-true" : "tcl-pill-warn"}`}>{r.request.known.safe ? t("safe") : t("unsafe")}</span>{" "}
                      <span className={`tcl-pill ${r.request.known.idempotent ? "tcl-pill-true" : "tcl-pill-warn"}`}>{r.request.known.idempotent ? t("idempotent") : t("notIdempotent")}</span>{" "}
                      <span className="tcl-muted tcl-small">{t("methodSpec", { spec: r.request.known.spec })}</span>
                    </>
                  ) : <span className="tcl-pill tcl-pill-muted">{t("methodUnknown")}</span>}
                </dd>
                <dt className="tcl-pairs-name">{t("target")}</dt>
                <dd className="tcl-pairs-value"><code>{r.request.target}</code> <span className="tcl-pill tcl-pill-value">{t(`targetForm.${r.request.targetForm}`)}</span></dd>
                <dt className="tcl-pairs-name">{t("version")}</dt>
                <dd className="tcl-pairs-value"><code>{r.request.version || t("versionAbsent")}</code></dd>
                {r.request.url && (
                  <>
                    <dt className="tcl-pairs-name">{t("url")}</dt>
                    <dd className="tcl-pairs-value"><code>{r.request.url}</code> <span className="tcl-muted tcl-small">{r.request.targetForm === "origin" ? t("urlSchemeNote") : ""}</span></dd>
                  </>
                )}
              </dl>
            </section>
          )}
          {r.response && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("statusLineTitle")}</h4>
              <dl className="tcl-pairs">
                <dt className="tcl-pairs-name">{t("version")}</dt>
                <dd className="tcl-pairs-value"><code>{r.response.version}</code></dd>
                <dt className="tcl-pairs-name">{t("statusCode")}</dt>
                <dd className="tcl-pairs-value">
                  <code>{r.response.codeText}</code>{" "}
                  {r.response.klass !== null && <span className="tcl-pill tcl-pill-value">{t(`statusClass.${r.response.klass}`)}</span>}{" "}
                  {r.response.registryReason ? <span className="tcl-muted tcl-small">{t("registrySays", { reason: r.response.registryReason, reference: r.response.registryReference ?? "" })}</span> : <span className="tcl-pill tcl-pill-muted">{t("statusUnassigned")}</span>}
                </dd>
                <dt className="tcl-pairs-name">{t("reasonPhrase")}</dt>
                <dd className="tcl-pairs-value">{r.response.reason ? <code>{r.response.reason}</code> : <span className="tcl-muted">{t("reasonAbsent")}</span>}</dd>
              </dl>
            </section>
          )}

          {/* The framing decision. */}
          {r.kind !== "unknown" && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("framingTitle")}</h4>
              <p className="tcl-finding-msg">{t.rich(`framing.rule.${r.framing.rule}`, rich)}</p>
              <dl className="tcl-pairs">
                <dt className="tcl-pairs-name">{t("delimiter")}</dt>
                <dd className="tcl-pairs-value">{t(`framing.delimiter.${r.framing.delimiter}`)}</dd>
                <dt className="tcl-pairs-name">Content-Length</dt>
                <dd className="tcl-pairs-value">{r.framing.contentLengths.length === 0 ? <span className="tcl-muted">{t("absent")}</span> : <code>{r.framing.contentLengths.join(", ")}</code>}</dd>
                <dt className="tcl-pairs-name">Transfer-Encoding</dt>
                <dd className="tcl-pairs-value">{r.framing.transferCodings.length === 0 ? <span className="tcl-muted">{t("absent")}</span> : <code>{r.framing.transferCodings.join(", ")}</code>}</dd>
                <dt className="tcl-pairs-name">{t("bodyPasted")}</dt>
                <dd className="tcl-pairs-value">{t("octets", { n: r.framing.bodyOctets })}</dd>
              </dl>
              {/* The chunks. */}
              {r.framing.chunked && (
                <>
                  <h5 className="tcl-card-title">{t("chunksTitle", { n: r.framing.chunked.chunks.length })}</h5>
                  {r.framing.chunked.chunks.length > 0 && (
                    <div className="tcl-table-wrap">
                      <table className="tcl-table">
                        <thead><tr><th scope="col">#</th><th scope="col">{t("colLine")}</th><th scope="col">{t("colSize")}</th><th scope="col">{t("colExt")}</th><th scope="col">{t("colData")}</th></tr></thead>
                        <tbody>
                          {r.framing.chunked.chunks.map((c, i) => (
                            <tr key={i}>
                              <th scope="row">{i + 1}</th>
                              <td className="tcl-muted">{c.line}</td>
                              <td><code>{c.sizeHex}</code> <span className="tcl-muted tcl-small">= {c.size}</span>{c.truncated && <> <span className="tcl-pill tcl-pill-bad">{t("truncated")}</span></>}</td>
                              <td>{c.ext ? <code>{c.ext}</code> : <span className="tcl-muted">·</span>}</td>
                              <td><code>{c.preview}</code></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <p className="tcl-finding-msg">
                    {r.framing.chunked.lastChunk ? t("lastChunkYes") : t("lastChunkNo")}{" "}
                    {t("decodedLength", { n: r.framing.chunked.decodedLength })}{" "}
                    {r.framing.chunked.trailers.length > 0 && t("trailers", { list: r.framing.chunked.trailers.map((x) => `${x.name}: ${x.value}`).join("; ") })}
                  </p>
                  {r.framing.chunked.contentPreview && <code className="tcl-finding-snippet">{r.framing.chunked.contentPreview}</code>}
                </>
              )}
            </section>
          )}

          {/* The fields, grouped. */}
          {r.groups.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("fieldsTitle", { n: r.fields.length })}</h4>
              {r.groups.map((g) => (
                <div key={g.group} className="tcl-card">
                  <h5 className="tcl-card-title">{t(`group.${g.group}`)}</h5>
                  <ul className="tcl-pool-list">
                    {g.fields.map((k) => {
                      // The field.
                      const f = r.fields[k];
                      // Draw it.
                      return (
                        <li key={k}>
                          <code>{f.canonical}</code>: <code>{shownValue(f)}</code>{" "}
                          <span className="tcl-muted tcl-small">{t("lineShort", { n: f.line })}</span>{" "}
                          {f.status === "deprecated" && <span className="tcl-pill tcl-pill-warn">{t("deprecated")}</span>}
                          {f.status === "obsoleted" && <span className="tcl-pill tcl-pill-bad">{t("obsoleted")}</span>}
                          {f.status === "unregistered" && <span className="tcl-pill tcl-pill-muted">{f.xPrefixed ? t("xPrefixed") : t("unregistered")}</span>}
                          {f.reference && <span className="tcl-muted tcl-small"> {f.reference}</span>}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </section>
          )}

          {/* Credentials and cookies. */}
          {(r.credentials.length > 0 || r.cookies.length > 0 || r.setCookies.length > 0) && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("secretsTitle")}</h4>
              {r.credentials.map((c, i) => (
                <p key={`c${i}`} className="tcl-finding-msg">
                  <code>{c.field}</code>: {t("credential", { scheme: c.scheme })} <code>{c.masked}</code>
                  {c.userId !== null && <> {t("basicUser")} <code>{c.userId}</code> {t("basicPasswordHidden")}</>}
                  {c.jwtShaped && <> <span className="tcl-pill tcl-pill-value">JWT</span></>}
                </p>
              ))}
              {r.cookies.length > 0 && (
                <div className="tcl-table-wrap">
                  <table className="tcl-table">
                    <thead><tr><th scope="col">{t("colCookie")}</th><th scope="col">{t("colValue")}</th><th scope="col">{t("colLength")}</th></tr></thead>
                    <tbody>{r.cookies.map((c, i) => <tr key={i}><th scope="row"><code>{c.name}</code></th><td><code>{c.masked}</code></td><td>{c.length}</td></tr>)}</tbody>
                  </table>
                </div>
              )}
              {r.setCookies.length > 0 && (
                <div className="tcl-table-wrap">
                  <table className="tcl-table">
                    <thead><tr><th scope="col">{t("colCookie")}</th><th scope="col">Secure</th><th scope="col">HttpOnly</th><th scope="col">SameSite</th><th scope="col">{t("colAttributes")}</th></tr></thead>
                    <tbody>
                      {r.setCookies.map((c, i) => (
                        <tr key={i}>
                          <th scope="row"><code>{c.name}</code>{c.prefix && <> <span className={`tcl-pill ${c.prefixOk ? "tcl-pill-true" : "tcl-pill-bad"}`}>{c.prefix}</span></>}</th>
                          <td>{c.secure ? <span className="tcl-pill tcl-pill-true">{t("yes")}</span> : <span className="tcl-pill tcl-pill-warn">{t("no")}</span>}</td>
                          <td>{c.httpOnly ? <span className="tcl-pill tcl-pill-true">{t("yes")}</span> : <span className="tcl-pill tcl-pill-muted">{t("no")}</span>}</td>
                          <td>{c.sameSite ? <code>{c.sameSite}</code> : <span className="tcl-muted tcl-small">{t("sameSiteDefault")}</span>}</td>
                          <td><code>{c.attributes.filter((a) => !/^(secure|httponly|samesite)$/i.test(a.name)).map((a) => (a.value ? `${a.name}=${a.value}` : a.name)).join("; ") || "·"}</code></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* Hand-offs. */}
          {r.handoffs.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("handoffsTitle")}</h4>
              <ul className="tcl-pool-list">
                {r.handoffs.map((h, i) => (
                  <li key={i}>
                    <Link href={h.input ? `/tools/${h.tool}?input=${encodeURIComponent(h.input)}` : `/tools/${h.tool}`}>{t(`handoff.${h.kind}`)}</Link>
                    {h.input && <> <span className="tcl-muted tcl-small">({h.input})</span></>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* The message with flagged lines marked. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("codeTitle")}</h4>
            <TclCode code={codeView} marks={marks} label={t("codeTitle")} />
          </section>

          {/* The findings, by line. */}
          {r.findings.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("findingsTitle")}</h4>
              <ol className="tcl-findings">
                {r.findings.map((f, i) => (
                  <li key={i} className={`tcl-finding tcl-finding-${f.severity}`}>
                    <div className="tcl-finding-head">
                      <span className={`irl-sev irl-sev-${f.severity === "error" ? "high" : f.severity}`}>{t(`sev.${f.severity}`)}</span>
                      <span className="tcl-rule">{f.rule}</span>
                      <span className="tcl-muted tcl-small">{t("lineShort", { n: f.line })}</span>
                      <span className="tcl-finding-title">{t(`ruleName.${f.rule}`)}</span>
                    </div>
                    {f.snippet && <code className="tcl-finding-snippet">{f.snippet}</code>}
                    <p className="tcl-finding-msg">{messageFor(f.rule, f.params)}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* What the decoder cannot judge. */}
          <p className="hmac-build-note">{t("limits")}</p>
        </div>
      )}
    </div>
  );
}
