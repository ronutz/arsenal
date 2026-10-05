"use client";

// ============================================================================
// src/components/CspEvaluatorTool.tsx
// ----------------------------------------------------------------------------
// THE CSP EVALUATOR (page UI). Paste a Content-Security-Policy (header value,
// header line, Report-Only header, <meta> element, or several); out comes each
// policy parsed as CSP Level 3 parses it, every directive and source
// expression explained, the effective policy per destination through the
// fallback list, and the graded findings, each quoting the specification.
//
// All answers come from src/lib/tools/csp-evaluator (pure parsing); this
// component only lays them out and words them. Nothing is fetched.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { run, VECTORS, POLICY_MAX_CHARS, type CspResult, type PolicyReport, type Finding, type SourceRow } from "@/lib/tools/csp-evaluator";
import { TclPresets } from "@/components/TclTeachParts";

// D-83: the Example button loads a golden vector verbatim.
const EXAMPLE_ID = "legacy-allowlist";

// The vectors offered as presets.
const PRESET_IDS = ["legacy-allowlist", "strict-nonce", "strict-hash", "unquoted-keywords", "missing-semicolon", "meta-ignored", "report-only-header", "two-policies", "strict-dynamic-alone", "wildcards-and-schemes", "obsolete-directives", "trusted-types", "nothing-for-script"];

/** The page component. */
export default function CspEvaluatorTool() {
  // This tool's words.
  const t = useTranslations("tools.csp-evaluator");
  // The policy text.
  const [text, setText] = useState(VECTORS.find((v) => v.id === EXAMPLE_ID)!.input.policy);
  // The preset currently loaded.
  const [active, setActive] = useState<string | undefined>(EXAMPLE_ID);
  // The reading.
  const out = useMemo((): { r?: CspResult; error?: string } => {
    // Nothing to read.
    if (text.trim() === "") return {};
    // The engine refuses oversized input with a message.
    try { return { r: run({ policy: text }) }; } catch (e) { return { error: (e as Error).message }; }
  }, [text]);
  // Load a preset.
  const pick = (id: string) => {
    // The vector.
    const v = VECTORS.find((x) => x.id === id);
    // Unknown ids do nothing.
    if (!v) return;
    // Its text.
    setText(v.input.policy);
    // Mark it.
    setActive(id);
  };
  // The result.
  const r = out.r;
  // The pill class for a severity.
  const sevClass = (s: Finding["severity"]) => s === "high" ? "irl-sev irl-sev-high" : s === "medium" ? "irl-sev irl-sev-warning" : s === "good" ? "tcl-pill tcl-pill-true" : "irl-sev irl-sev-info";
  // The finding card class.
  const cardClass = (s: Finding["severity"]) => s === "high" ? "tcl-finding tcl-finding-error" : s === "medium" ? "tcl-finding tcl-finding-warning" : "tcl-finding tcl-finding-info";
  // The message for a finding: variants by params.what / which / overridden.
  const messageFor = (f: Finding): string => {
    // The parameters as strings.
    const p = Object.fromEntries(Object.entries(f.params ?? {}).map(([k, v]) => [k, String(v)]));
    // The variant key.
    const variant = p.what ? `.${p.what}` : p.which ? `.${p.which}` : p.overridden ? `.${p.overridden}` : p.delivery ? `.${p.delivery}` : p.withReportTo ? `.${p.withReportTo}` : "";
    // Render.
    return t(`finding.${f.rule}${variant}`, { ...p, directive: f.directive ?? "", value: f.value ?? "" });
  };
  // The class for a source chip by kind.
  const chipClass = (v: SourceRow) => `tcl-pill ${v.kind === "invalid" || v.kind === "unquoted-keyword" || v.kind === "directive-name" ? "tcl-pill-bad" : v.kind === "nonce" || v.kind === "hash" ? "tcl-pill-true" : v.kind === "keyword" && (v.keyword === "unsafe-inline" || v.keyword === "unsafe-eval") ? "tcl-pill-warn" : v.kind === "host" && v.host === "*" ? "tcl-pill-warn" : "tcl-pill-value"}`;
  // The grade pill class.
  const gradeClass = (g: PolicyReport["grade"]) => g === "strict" || g === "good" ? "tcl-pill tcl-pill-true" : g === "fair" ? "tcl-pill tcl-pill-warn" : "tcl-pill tcl-pill-bad";
  // Draw.
  return (
    <div className="cidr-tool jwt-tool tcl-tool">
      {/* The policy, with the Example / Clear buttons (D-83). */}
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="csp-src">{t("policyLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => pick(EXAMPLE_ID)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => { setText(""); setActive(undefined); }}>{t("clear")}</button>
          </div>
        </div>
        <textarea id="csp-src" className="cidr-input mono json-input" rows={5} value={text} onChange={(e) => { setText(e.target.value); setActive(undefined); }} placeholder={t("placeholder")} spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="off" />
      </div>
      <TclPresets items={PRESET_IDS.map((id) => ({ id, label: t(`preset.${id}`) }))} label={t("presetsLabel")} onPick={pick} active={active} />

      {/* An oversized input. */}
      {out.error && <p className="tcl-verdict tcl-verdict-bad" role="status">{out.error}</p>}

      {/* Nothing parsed. */}
      {r && r.count === 0 && <p className="tcl-verdict tcl-verdict-warn" role="status">{t("noPolicy")}</p>}

      {/* Each policy. */}
      {r && r.policies.map((p) => (
        <div key={p.index} className="jwt-results" aria-live="polite">
          {/* The verdict. */}
          <div className={p.grade === "strict" || p.grade === "good" ? "tcl-verdict tcl-verdict-ok" : p.grade === "fair" ? "tcl-verdict tcl-verdict-warn" : "tcl-verdict tcl-verdict-bad"}>
            <p>
              {r.count > 1 && <span className="tcl-verdict-label">{t("policyN", { n: p.index, total: r.count })}</span>}{" "}
              <span className={gradeClass(p.grade)}>{t(`grade.${p.grade}`)}</span>{" "}
              {t(`gradeText.${p.grade}`)}{" "}
              {t(`delivery.${p.delivery}`)}
            </p>
            <p>
              {t(`scriptInline.${p.script.inline}`)}{" "}
              {t("scriptEval", { eval: p.script.eval ? "yes" : "no", wasm: p.script.wasm ? "yes" : "no" })}{" "}
              {p.script.strictDynamic && t("scriptStrictDynamic")}{" "}
              {t("scriptNoncesHashes", { nonces: p.script.nonces, hashes: p.script.hashes })}
            </p>
            <p>{t("countsLine", { high: p.counts.high, medium: p.counts.medium, low: p.counts.low, info: p.counts.info, good: p.counts.good })}</p>
          </div>

          {/* The directives, one row each. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("directivesTitle", { n: p.directives.length })}</h4>
            {p.directives.length === 0 ? <p className="tcl-finding-msg">{t("noDirectives")}</p> : (
              <ol className="tcl-steps">
                {p.directives.map((d, i) => (
                  <li key={i} className={`tcl-step${d.ignoredDuplicate || d.ignoredHere || d.status === "unknown" ? " tcl-step-error" : ""}`}>
                    <div className="tcl-step-head">
                      <code className="tcl-step-src">{d.rawName}</code>
                      <span className={`tcl-pill ${d.status === "standard" || d.status === "extension" ? "tcl-pill-value" : d.status === "unknown" || d.status === "obsolete" ? "tcl-pill-bad" : "tcl-pill-warn"}`}>{t(`status.${d.status}`)}</span>
                      <span className="tcl-muted tcl-small">{t(`category.${d.category}`)}</span>
                      {d.ignoredDuplicate && <span className="tcl-pill tcl-pill-bad">{t("pill.duplicate")}</span>}
                      {d.ignoredHere && <span className="tcl-pill tcl-pill-bad">{t("pill.ignoredHere")}</span>}
                    </div>
                    <p className="tcl-finding-msg">{t(`directive.${d.status === "unknown" ? "unknown" : d.name}`)}</p>
                    <div className="tcl-words">
                      {d.values.length === 0 ? <span className="tcl-muted tcl-small">{t("emptyValue")}</span> : d.values.map((v, j) => (
                        <span key={j} className="tcl-word" title={t(`kind.${v.kind}`)}>
                          <code>{v.raw}</code> <span className={chipClass(v)}>{t(`kindShort.${v.kind}`)}</span>
                        </span>
                      ))}
                    </div>
                    {/* The notes on the expressions. */}
                    {d.values.some((v) => v.kind === "keyword" || v.kind === "host" || v.kind === "scheme" || v.kind === "nonce" || v.kind === "hash") && (
                      <ul className="tcl-changes">
                        {d.values.filter((v) => v.kind === "keyword").map((v, j) => <li key={`k${j}`}><code>{v.raw}</code>: {t(`keyword.${v.keyword}`)}</li>)}
                        {d.values.filter((v) => v.kind === "host").slice(0, 8).map((v, j) => <li key={`h${j}`}><code>{v.raw}</code>: {t("hostNote", { scheme: v.scheme ?? t("anyScheme"), host: v.host ?? "", port: v.port ?? t("anyPort"), path: v.path ?? t("anyPath"), wildcard: v.wildcardHost ? "yes" : "no" })}</li>)}
                        {d.values.filter((v) => v.kind === "scheme").map((v, j) => <li key={`s${j}`}><code>{v.raw}</code>: {t("schemeNote", { scheme: v.scheme ?? "" })}</li>)}
                        {d.values.filter((v) => v.kind === "nonce" || v.kind === "hash").slice(0, 4).map((v, j) => <li key={`n${j}`}><code>{v.raw.length > 40 ? v.raw.slice(0, 37) + "…" : v.raw}</code>: {v.kind === "nonce" ? t("nonceNote", { length: v.valueLength ?? 0 }) : t("hashNote", { algorithm: v.algorithm ?? "" })}</li>)}
                      </ul>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* The effective policy. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("effectiveTitle")}</h4>
            <p className="tcl-finding-msg">{t("effectiveIntro")}</p>
            <div className="tcl-table-wrap">
              <table className="tcl-table">
                <thead><tr><th scope="col">{t("colGoverns")}</th><th scope="col">{t("colFrom")}</th><th scope="col">{t("colSources")}</th></tr></thead>
                <tbody>
                  {p.effective.map((e) => (
                    <tr key={e.directive}>
                      <th scope="row"><code>{e.directive}</code> <span className="tcl-muted tcl-small">{t(`governs.${e.directive}`)}</span></th>
                      <td>{e.from === null ? <span className="tcl-pill tcl-pill-warn">{t("unrestricted")}</span> : e.from === e.directive ? <code>{e.from}</code> : <span><code>{e.from}</code> <span className="tcl-muted tcl-small">{t("viaFallback")}</span></span>}</td>
                      <td>{e.sources === null ? <span className="tcl-muted">{t("anything")}</span> : e.sources.length === 0 ? <code>'none'</code> : e.sources.map((s, k) => <code key={k} className="tcl-pill tcl-pill-value">{s}</code>)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="hmac-build-note">{t("effectiveNote")}</p>
          </section>

          {/* The findings. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("findingsTitle", { n: p.findings.length })}</h4>
            <ol className="tcl-findings">
              {p.findings.map((f, i) => (
                <li key={i} className={cardClass(f.severity)}>
                  <div className="tcl-finding-head">
                    <span className={sevClass(f.severity)}>{t(`sev.${f.severity}`)}</span>
                    <span className="tcl-rule">{f.rule}</span>
                    {f.directive && <code className="tcl-muted tcl-small">{f.directive}</code>}
                    <span className="tcl-finding-title">{t(`ruleName.${f.rule}`)}</span>
                  </div>
                  {f.value && <code className="tcl-finding-snippet">{f.value}</code>}
                  <p className="tcl-finding-msg">{messageFor(f)}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      ))}

      {/* Hand-off and limits. */}
      {r && r.count > 0 && (
        <p className="hmac-build-note">
          {t("handoff")} <Link href="/tools/secure-headers">{t("handoffLink")}</Link>. {t("limits", { max: POLICY_MAX_CHARS })}
        </p>
      )}
    </div>
  );
}
