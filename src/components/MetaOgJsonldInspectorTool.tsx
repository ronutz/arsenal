"use client";

// ============================================================================
// src/components/MetaOgJsonldInspectorTool.tsx
// ----------------------------------------------------------------------------
// THE META, OPEN GRAPH & JSON-LD INSPECTOR (page UI). Paste a page or its head;
// out comes the title and encoding, every meta and link element classified,
// the Open Graph object, the twitter:* card, the robots rules, the viewport,
// every JSON-LD block outlined, and the findings with the sentence each rests
// on.
//
// All answers come from src/lib/tools/meta-og-jsonld-inspector; this component
// only lays them out and words them. Nothing is executed, fetched or rendered.
// ============================================================================

import { Fragment, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { run, VECTORS, HTML_MAX_CHARS, type HeadResult, type Finding, type MetaRow } from "@/lib/tools/meta-og-jsonld-inspector";
import { TclPresets } from "@/components/TclTeachParts";

// D-83: the Example button loads a golden vector verbatim.
const EXAMPLE_ID = "full-marks";

// The vectors offered as presets.
const PRESET_IDS = ["full-marks", "nothing-declared", "everything-wrong", "article-with-arrays", "open-graph-with-name", "twitter-only", "jsonld-graph", "jsonld-errors", "robots-rules", "charset-late-and-twice", "head-only-fragment", "pragmas-and-body-metas", "alternates-and-icons"];

// How many characters of a content value the tables show before cutting.
const VALUE_MAX = 160;

/** The page component. */
export default function MetaOgJsonldInspectorTool() {
  // This tool's words.
  const t = useTranslations("tools.meta-og-jsonld-inspector");
  // The example.
  const example = VECTORS.find((v) => v.id === EXAMPLE_ID)!;
  // The source.
  const [html, setHtml] = useState(example.input.html);
  // The preset currently loaded.
  const [active, setActive] = useState<string | undefined>(EXAMPLE_ID);
  // The reading.
  const out = useMemo((): { r?: HeadResult; error?: string } => {
    // Nothing to read.
    if (html.trim() === "") return {};
    // The engine refuses oversized input with a message.
    try { return { r: run({ html }) }; } catch (e) { return { error: (e as Error).message }; }
  }, [html]);
  // Load a preset.
  const pick = (id: string) => {
    // The vector.
    const v = VECTORS.find((x) => x.id === id);
    // Unknown ids do nothing.
    if (!v) return;
    // Its input.
    setHtml(v.input.html);
    // Mark it.
    setActive(id);
  };
  // The result.
  const r = out.r;
  // A value, cut for the table.
  const cut = (s: string | null) => s === null ? null : s.length > VALUE_MAX ? s.slice(0, VALUE_MAX - 1) + "…" : s;
  // The pill class for a meta classification.
  const clsPill = (m: MetaRow) => m.cls === "standard" || m.cls === "pragma" || m.cls === "charset" ? "tcl-pill tcl-pill-true" : m.cls === "registered" || m.cls === "opengraph" || m.cls === "twitter" || m.cls === "itemprop" ? "tcl-pill tcl-pill-value" : m.cls === "nonconforming" ? "tcl-pill tcl-pill-bad" : "tcl-pill tcl-pill-muted";
  // The severity label class.
  const sevClass = (s: Finding["severity"]) => s === "error" ? "irl-sev irl-sev-high" : s === "warning" ? "irl-sev irl-sev-warning" : s === "good" ? "tcl-pill tcl-pill-true" : "irl-sev irl-sev-info";
  // A finding's message: the rule's text with its params (variants keyed by "which" where the message defines them).
  const messageFor = (f: Finding) => t(`finding.${f.rule}`, { what: "", which: "other", n: 0, count: 0, seconds: 0, url: "", bytes: 0, ...f.params });
  // Absent marker.
  const absent = <span className="tcl-muted">{t("absent")}</span>;
  // Draw.
  return (
    <div className="cidr-tool jwt-tool tcl-tool">
      {/* The source. */}
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="mog-src">{t("inputLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => pick(EXAMPLE_ID)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => { setHtml(""); setActive(undefined); }}>{t("clear")}</button>
          </div>
        </div>
        <textarea id="mog-src" className="cidr-input mono json-input" rows={12} value={html} onChange={(e) => { setHtml(e.target.value); setActive(undefined); }} placeholder={t("placeholder")} spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="off" />
      </div>
      <TclPresets items={PRESET_IDS.map((id) => ({ id, label: t(`preset.${id}`) }))} label={t("presetsLabel")} onPick={pick} active={active} />

      {/* An oversized input. */}
      {out.error && <p className="tcl-verdict tcl-verdict-bad" role="status">{out.error}</p>}

      {/* The reading. */}
      {r && (
        <div className="jwt-results" aria-live="polite">
          {/* The verdict. */}
          <div className={r.counts.findings.error > 0 ? "tcl-verdict tcl-verdict-bad" : r.counts.findings.warning > 0 ? "tcl-verdict tcl-verdict-warn" : "tcl-verdict tcl-verdict-ok"}>
            <p>
              <span className="tcl-verdict-label">{t("summary", { metas: r.counts.metas, links: r.counts.links, og: r.counts.og, twitter: r.counts.twitter, jsonld: r.counts.jsonLd })}</span>{" "}
              {t("summaryFindings", { errors: r.counts.findings.error, warnings: r.counts.findings.warning, infos: r.counts.findings.info, goods: r.counts.findings.good })}
            </p>
          </div>

          {/* The basics. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("basicsTitle")}</h4>
            <dl className="tcl-pairs">
              <dt className="tcl-pairs-name">{t("fact.doctype")}</dt>
              <dd className="tcl-pairs-value">{r.doctype ? <span className="tcl-pill tcl-pill-true">{t("present")}</span> : <span className="tcl-pill tcl-pill-warn">{t("absent")}</span>} <span className={`tcl-pill ${r.mode === "no-quirks" ? "tcl-pill-true" : "tcl-pill-warn"}`}>{r.mode}</span></dd>
              <dt className="tcl-pairs-name">{t("fact.lang")}</dt>
              <dd className="tcl-pairs-value">{r.lang ? <code>{r.lang}</code> : absent}</dd>
              <dt className="tcl-pairs-name">{t("fact.title")}</dt>
              <dd className="tcl-pairs-value">{r.title.text ? <>{r.title.text} <span className="tcl-muted tcl-small">{t("chars", { n: r.title.length })}</span>{r.title.count > 1 && <> <span className="tcl-pill tcl-pill-bad">{t("times", { n: r.title.count })}</span></>}</> : absent}</dd>
              <dt className="tcl-pairs-name">{t("fact.charset")}</dt>
              <dd className="tcl-pairs-value">{r.charset.value ? <><code>{r.charset.value}</code> <span className="tcl-muted tcl-small">{t(`charsetSource.${r.charset.source ?? "charset"}`)}{r.charset.byteOffsetEnd !== null && <>, {t("bytes", { n: r.charset.byteOffsetEnd })}</>}</span></> : absent}</dd>
              <dt className="tcl-pairs-name">{t("fact.description")}</dt>
              <dd className="tcl-pairs-value">{(() => { const d = r.metas.find((m) => m.kind === "name" && (m.key ?? "").toLowerCase() === "description"); return d && d.content ? <>{cut(d.content)} <span className="tcl-muted tcl-small">{t("chars", { n: d.content.length })}</span></> : absent; })()}</dd>
              <dt className="tcl-pairs-name">{t("fact.canonical")}</dt>
              <dd className="tcl-pairs-value">{r.canonical.length ? r.canonical.map((c, i) => <code key={i} className="tcl-word">{c.href}</code>) : absent}</dd>
              <dt className="tcl-pairs-name">{t("fact.viewport")}</dt>
              <dd className="tcl-pairs-value">{r.viewport ? <><code>{r.viewport.raw}</code>{r.viewport.zoomRestricted && <> <span className="tcl-pill tcl-pill-warn">{t("zoomRestricted")}</span></>}</> : absent}</dd>
              <dt className="tcl-pairs-name">{t("fact.robots")}</dt>
              <dd className="tcl-pairs-value">{r.robots.length ? r.robots.map((row, i) => <span key={i}><code>{row.name}</code>: {row.tokens.map((tk, j) => <span key={j} className={`tcl-pill ${tk.status === "current" ? "tcl-pill-value" : tk.status === "retired" ? "tcl-pill-warn" : "tcl-pill-muted"}`}>{tk.raw}</span>)} </span>) : absent}</dd>
              {r.base !== null && <><dt className="tcl-pairs-name">{t("fact.base")}</dt><dd className="tcl-pairs-value"><code>{r.base}</code></dd></>}
              {r.refresh !== null && <><dt className="tcl-pairs-name">{t("fact.refresh")}</dt><dd className="tcl-pairs-value"><code>{r.refresh.raw}</code></dd></>}
              {r.hreflang.length > 0 && <><dt className="tcl-pairs-name">{t("fact.hreflang")}</dt><dd className="tcl-pairs-value">{r.hreflang.map((h, i) => <span key={i} className="tcl-pill tcl-pill-value" title={h.href ?? ""}>{h.lang}</span>)}</dd></>}
              {r.icons.length > 0 && <><dt className="tcl-pairs-name">{t("fact.icons")}</dt><dd className="tcl-pairs-value">{r.icons.map((ic, i) => <code key={i} className="tcl-word">{ic.rel}{ic.sizes ? ` ${ic.sizes}` : ""}{ic.type ? ` ${ic.type}` : ""}: {ic.href ?? ""}</code>)}</dd></>}
            </dl>
          </section>

          {/* The findings. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("findingsTitle")}</h4>
            <ol className="tcl-findings">
              {r.findings.map((f, i) => (
                <li key={i} className={`tcl-finding tcl-finding-${f.severity === "good" ? "info" : f.severity}`}>
                  <div className="tcl-finding-head">
                    <span className={sevClass(f.severity)}>{t(`sev.${f.severity}`)}</span>
                    <span className="tcl-rule">{f.rule}</span>
                    {f.line !== null && <span className="tcl-muted tcl-small">{t("lineShort", { n: f.line })}</span>}
                    <span className="tcl-finding-title">{t(`ruleName.${f.rule}`)}</span>
                  </div>
                  <p className="tcl-finding-msg">{messageFor(f)}</p>
                </li>
              ))}
            </ol>
            {r.findings.some((f) => f.rule === "M38") && <p className="hmac-build-note">{t("cspHandoff")} <Link href="/tools/csp-evaluator">{t("cspHandoffLink")}</Link>.</p>}
          </section>

          {/* The meta elements. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("metasTitle", { n: r.counts.metas })}</h4>
            {r.metas.length === 0 ? <p className="tcl-finding-msg">{t("noMetas")}</p> : (
              <div className="tcl-table-wrap">
                <table className="tcl-table">
                  <thead><tr><th scope="col">#</th><th scope="col">{t("colKey")}</th><th scope="col">{t("colContent")}</th><th scope="col">{t("colClass")}</th><th scope="col">{t("colLine")}</th></tr></thead>
                  <tbody>
                    {r.metas.map((m) => (
                      <tr key={m.id}>
                        <th scope="row">{m.id + 1}</th>
                        <td>
                          <code>{m.kind === "none" ? t("noKey") : `${m.kind}="${m.key ?? ""}"`}</code>
                          {m.media && <> <span className="tcl-muted tcl-small">media="{m.media}"</span></>}
                          {!m.inHead && <> <span className="tcl-pill tcl-pill-warn">{t("outsideHead")}</span></>}
                          {m.describe && <div className="tcl-muted tcl-small">{t(`describe.${m.describe}`)}</div>}
                        </td>
                        <td>{m.content === null ? absent : <code className="tcl-word">{cut(m.content)}</code>}</td>
                        <td><span className={clsPill(m)}>{t(`cls.${m.cls}`)}</span></td>
                        <td className="tcl-muted">{m.line ?? "·"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* The link elements. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("linksTitle", { n: r.counts.links })}</h4>
            {r.links.length === 0 ? <p className="tcl-finding-msg">{t("noLinks")}</p> : (
              <div className="tcl-table-wrap">
                <table className="tcl-table">
                  <thead><tr><th scope="col">#</th><th scope="col">{t("colRel")}</th><th scope="col">{t("colHref")}</th><th scope="col">{t("colAttrs")}</th><th scope="col">{t("colLine")}</th></tr></thead>
                  <tbody>
                    {r.links.map((l) => (
                      <tr key={l.id}>
                        <th scope="row">{l.id + 1}</th>
                        <td>{l.rels.length === 0 ? absent : l.rels.map((rel, i) => <span key={i} className={`tcl-pill ${l.knownRels.includes(rel) ? "tcl-pill-true" : "tcl-pill-muted"}`}>{rel}</span>)}</td>
                        <td>{l.href === null ? absent : <code className="tcl-word">{cut(l.href)}</code>}</td>
                        <td className="tcl-muted tcl-small">{[l.hreflang && `hreflang="${l.hreflang}"`, l.type && `type="${l.type}"`, l.sizes && `sizes="${l.sizes}"`, l.media && `media="${l.media}"`, l.as && `as="${l.as}"`, l.title && `title="${l.title}"`].filter(Boolean).join(" ")}</td>
                        <td className="tcl-muted">{l.line ?? "·"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Open Graph. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("ogTitle")}</h4>
            {!r.openGraph.present ? <p className="tcl-finding-msg">{t("noOg")}</p> : (
              <>
                <p className="tcl-finding-msg">
                  {(["og:title", "og:type", "og:image", "og:url"] as const).map((k) => <span key={k} className={`tcl-pill ${r.openGraph.required[k] ? "tcl-pill-true" : "tcl-pill-bad"}`}>{k}</span>)}{" "}
                  {t("ogType", { type: r.openGraph.type ?? "website" })}
                  {Object.keys(r.openGraph.namespaces).length > 0 && <> {t("ogNamespaces", { list: Object.entries(r.openGraph.namespaces).map(([k, n]) => `${k} (${n})`).join(", ") })}</>}
                </p>
                <dl className="tcl-pairs">
                  {Object.entries(r.openGraph.first).map(([k, v]) => (
                    <Fragment key={k}>
                      <dt className="tcl-pairs-name"><code>{k}</code>{(r.openGraph.counts[k] ?? 1) > 1 && <> <span className="tcl-pill tcl-pill-value">{t("times", { n: r.openGraph.counts[k] })}</span></>}</dt>
                      <dd className="tcl-pairs-value">{cut(v)}</dd>
                    </Fragment>
                  ))}
                </dl>
                {r.openGraph.media.length > 0 && (
                  <ul className="tcl-changes">
                    {r.openGraph.media.map((m, i) => (
                      <li key={i}><code>{m.root}</code> <code className="tcl-word">{cut(m.url)}</code> <span className="tcl-muted tcl-small">{[m.width && m.height ? `${m.width}×${m.height}` : null, m.type, m.secureUrl ? "secure_url" : null].filter(Boolean).join(", ")}</span> {m.root === "og:image" && (m.alt ? <span className="tcl-pill tcl-pill-true">alt</span> : <span className="tcl-pill tcl-pill-warn">{t("noAlt")}</span>)}</li>
                    ))}
                  </ul>
                )}
                {r.openGraph.properties.some((p) => p.structuredOf === null && p.namespace !== "og") && (
                  <ul className="tcl-changes">
                    {r.openGraph.properties.filter((p) => p.namespace !== "og").map((p, i) => <li key={i}><code>{p.property}</code> {cut(p.content)}{!p.known && <> <span className="tcl-pill tcl-pill-muted">{t("unlisted")}</span></>}</li>)}
                  </ul>
                )}
                {r.openGraph.properties.some((p) => p.orphan) && <p className="tcl-finding-msg">{t("ogOrphans", { list: r.openGraph.properties.filter((p) => p.orphan).map((p) => p.property).join(", ") })}</p>}
              </>
            )}
          </section>

          {/* twitter:* */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("twitterTitle")}</h4>
            {!r.twitter.present ? <p className="tcl-finding-msg">{t("noTwitter")}</p> : (
              <ul className="tcl-changes">
                {r.twitter.properties.map((p, i) => <li key={i}><code>{p.name}</code> {cut(p.content)} {p.registered ? <span className="tcl-pill tcl-pill-true">{t("registered")}</span> : <span className="tcl-pill tcl-pill-muted">{t("unlisted")}</span>}</li>)}
              </ul>
            )}
          </section>

          {/* JSON-LD. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("jsonldTitle", { n: r.counts.jsonLd })}</h4>
            {r.jsonLd.length === 0 ? <p className="tcl-finding-msg">{t("noJsonld")}</p> : (
              <ol className="tcl-steps">
                {r.jsonLd.map((b) => (
                  <li key={b.index} className="tcl-step">
                    <div className="tcl-step-head">
                      <span className="tcl-step-n">{b.index + 1}</span>
                      {b.valid ? <span className="tcl-pill tcl-pill-true">{t("validJson")}</span> : <span className="tcl-pill tcl-pill-bad">{t("invalidJson")}</span>}
                      {b.valid && <span className="tcl-muted tcl-small">{t("jsonldSummary", { context: b.context ?? t("absent"), nodes: b.nodeCount, graph: b.graph ? 1 : 0 })}</span>}
                      {b.line !== null && <span className="tcl-muted tcl-small">{t("lineShort", { n: b.line })}</span>}
                    </div>
                    {!b.valid && <p className="tcl-finding-msg"><code>{b.error}</code></p>}
                    {b.valid && b.nodes.length > 0 && (
                      <ol className="hsx-tree">
                        {b.nodes.map((nd, i) => (
                          <li key={i} className="hsx-node" style={{ "--hsx-depth": nd.depth } as React.CSSProperties}>
                            <code className="hsx-tag">{nd.type ?? t("untyped")}</code>
                            {nd.name && <span className="hsx-text">“{cut(nd.name)}”</span>}
                            {nd.id && <span className="hsx-attr">@id {cut(nd.id)}</span>}
                          </li>
                        ))}
                      </ol>
                    )}
                  </li>
                ))}
              </ol>
            )}
            {r.jsonLdLookalikes.length > 0 && <p className="tcl-finding-msg">{t("lookalikes", { n: r.jsonLdLookalikes.length })}</p>}
          </section>

          {/* Hand-offs and limits. */}
          <p className="hmac-build-note">
            {t("handoff")} <Link href="/tools/html-structure-explainer">{t("handoffTree")}</Link>, <Link href="/tools/css-selector-tester">{t("handoffSelectors")}</Link>. {t("limits", { max: HTML_MAX_CHARS })}
          </p>
        </div>
      )}
    </div>
  );
}
