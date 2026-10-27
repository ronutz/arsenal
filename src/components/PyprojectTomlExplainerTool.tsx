"use client";

// ============================================================================
// src/components/PyprojectTomlExplainerTool.tsx
// ----------------------------------------------------------------------------
// UI for the pyproject.toml explainer. Paste a pyproject.toml; the page shows,
// in this order: the TOML verdict (with the line, column and the line itself
// when the file is not TOML), the headline facts and the count of findings,
// the findings (errors, then warnings, then notes, each with its line and
// key), then every table with its keys explained: what the key is for, the
// core metadata field it fills, and the details the engine read (each
// dependency taken apart, the version normalized, the license expression in
// canonical case, the readme's content type, the people and the fields they
// fill, URL labels and the well-known ones, entry points, extras, dependency
// group includes, and each [tool] table's keys).
//
// The engine (src/lib/tools/pyproject-toml-explainer) does all the work in
// the browser; this component only lays it out and words it. Words:
// "tools.pyproject-toml-explainer". Styling reuses existing classes (cidr-*,
// json-*, jwt-*, tcl-*, irl-sev-*, dig-*); no new CSS class.
// ============================================================================

import { useMemo, useState } from "react"; // state and the memoised result
import { useTranslations } from "next-intl"; // this tool's messages
import { explainPyproject, MAX_TOML_CHARS, type Finding, type Item, type PyprojectResult, type RequirementItem } from "@/lib/tools/pyproject-toml-explainer/compute"; // the engine
import { FIELD_TYPE, markerToString, type MarkerNode, type MarkerField } from "@/lib/tools/pyproject-toml-explainer/pep508"; // markers
import type { SpecClause } from "@/lib/tools/wheel-filename-explainer/pep440"; // clauses
import { EXAMPLE_PYPROJECT } from "@/lib/tools/pyproject-toml-explainer/example"; // the Example (D-83)

/** Severity to the shared badge class. */
const SEV_CLASS: Record<string, string> = { error: "irl-sev-high", warning: "irl-sev-warning", note: "irl-sev-info" }; // badge classes

/**
 * The marker fields a marker uses, once each, in first-use order.
 * @param n the marker
 * @param out the list being filled
 * @returns the fields
 */
function fieldsOf(n: MarkerNode, out: MarkerField[] = []): MarkerField[] {
  // Walk the tree.
  if (n.k === "cmp") { for (const o of [n.left, n.right]) if ("field" in o && !out.includes(o.field)) out.push(o.field); return out; } // a comparison
  fieldsOf(n.left, out); // left
  return fieldsOf(n.right, out); // right
} // fieldsOf

/** The page component. */
export default function PyprojectTomlExplainerTool() {
  // This tool's words.
  const t = useTranslations("tools.pyproject-toml-explainer");
  // The file's text.
  const [input, setInput] = useState(""); // empty until pasted or Example

  // The explanation, recomputed on change; the engine never throws.
  const r = useMemo((): PyprojectResult | null => (input.trim() === "" ? null : explainPyproject(input)), [input]); // explained

  /** The message for one finding, with defaults for every placeholder its message may use. */
  const findingText = (f: Finding): string => {
    // Translated sub-codes first (marker rules, glob problems, URL issues, name problems, error codes).
    const p: Record<string, string | number> = { key: "", want: "", got: "", normalized: "", problem: "", at: 0, code: "", clause: "", file: "", value: "", charset: "", variant: "", canonical: "", id: "", token: "", pattern: "", why: "", name: "", email: "", label: "", length: 0, url: "", group: "", extra: "", other: "", extras: "", target: "", cycle: "", features: "", line: 0, marker: "", text: "", field: "", op: "", scheme: "", issue: "", classifier: "", ...f.params }; // defaults, then the finding's own values
    if (f.code === "requirement-marker") p.marker = t(`marker.${f.params.marker}`, { field: String(f.params.field ?? ""), op: String(f.params.op ?? ""), value: String(f.params.value ?? ""), written: String(f.params.written ?? ""), normalized: String(f.params.normalized ?? "") }); // the marker rule, worded
    if (f.code === "requirement-invalid" || f.code === "bs-requirement-invalid") p.code = t(`reqError.${f.params.code}`) + (f.params.clause ? ` (${f.params.clause})` : ""); // the parse error, worded, with the clause at fault when there is one
    if (f.code === "version-invalid") p.code = t(`versionError.${f.params.code}`); // the version error, worded
    if (f.code === "license-invalid") p.code = t(`licenseError.${f.params.code}`, { token: String(f.params.token || t("licenseEnd")) }); // the license error, worded (an empty token means the expression ended early)
    if (f.code === "license-files-invalid") p.why = t(`globProblem.${f.params.why}`); // the glob rule, worded
    if (f.code === "name-invalid") p.problem = t(`nameProblem.${f.params.problem}`); // the name rule, worded
    if (f.code === "requirement-url-unverified") p.issue = t(`urlIssue.${f.params.issue}`); // what is missing, worded
    if (f.code === "requires-python-invalid") p.code = (f.params.clause ? `${f.params.clause}: ` : "") + t(`specError.${f.params.code}`); // the clause at fault, then the specifier error, worded
    if (f.code === "wrong-type") { p.want = t(`typeWant.${f.params.want}`); p.got = t(`type.${f.params.got}`); } // both types, worded
    if (f.code === "toml-1-1") p.features = String(f.params.features).split(", ").map((x) => t(`toml11.${x}`)).join("; "); // the 1.1.0 features, worded
    return t(`finding.${f.code}`, p); // the message
  }; // findingText

  /** Words for one specifier clause. */
  const clauseText = (c: SpecClause): string => {
    // One message per operator.
    const v = c.version; // absent for ===
    if (c.op === "===") return t("clause.arbitrary", { v: c.versionText }); // text equality
    if (c.op === "~=") return t("clause.compatible", { a: c.compatible?.[0] ?? "", b: c.compatible?.[1] ?? "" }); // the pair
    if ((c.op === "==" || c.op === "!=") && c.wildcard) return t(c.op === "==" ? "clause.prefix" : "clause.notPrefix", { prefix: `${v?.epoch !== "0" ? `${v?.epoch}!` : ""}${v?.release.join(".")}` }); // prefix
    if (c.op === "==" || c.op === "!=") return t(c.op === "==" ? "clause.equal" : "clause.notEqual", { v: v?.normalized ?? "" }); // strict
    const key: Record<string, string> = { ">=": "clause.ge", "<=": "clause.le", "<": "clause.lt", ">": "clause.gt" }; // ordered
    return t(key[c.op], { v: v?.normalized ?? "" }); // ordered comparison
  }; // clauseText

  /** One requirement, taken apart. */
  const requirementView = (q: RequirementItem) => {
    // Invalid ones show only the error.
    if (!q.parse.ok) return <span className="tcl-pill tcl-pill-bad">{t(`reqError.${q.parse.error.code}`)}</span>; // invalid
    const r = q.parse.req; // the requirement
    return (
      <ul className="tcl-small">
        <li>{t("req.name", { name: r.name, normalized: r.normalizedName })}</li>
        {r.extras.length > 0 && <li>{t("req.extras", { list: r.extras.join(", ") })}</li>}
        {r.specifier && r.specifier.clauses.length > 0 && r.specifier.clauses.map((c, i) => (<li key={i}><code>{c.text}</code>: {clauseText(c)}</li>))}
        {r.specifier === null && r.url === null && <li>{t("req.anyVersion")}</li>}
        {r.url !== null && <li>{t("req.url", { url: r.url })}</li>}
        {r.marker && <li>{t("req.marker", { marker: markerToString(r.marker) })}</li>}
        {r.marker && fieldsOf(r.marker).map((f) => (<li key={f} className="tcl-muted">{t(`field.${f}`)} ({t(`fieldType.${FIELD_TYPE[f]}`)})</li>))}
      </ul>
    );
  }; // requirementView

  /** The details of one item, by kind. */
  const details = (it: Item) => (
    <>
      {it.version && <p className="tcl-small">{t("detail.version", { normalized: it.version.normalized })}</p>}
      {it.specifier && it.specifier.ok && (
        <ul className="tcl-small">
          {it.specifier.clauses.map((c, i) => (<li key={i}><code>{c.text}</code>: {clauseText(c)}</li>))}
        </ul>
      )}
      {it.license && it.license.valid && <p className="tcl-small">{t("detail.license", { canonical: it.license.canonical, list: it.license.licenses.join(", ") })}</p>}
      {it.readme && <p className="tcl-small">{it.readme.kind === "file" ? t("detail.readmeFile", { file: it.readme.file, type: it.readme.contentType || "?" }) : t("detail.readmeText", { type: it.readme.contentType || "?" })}</p>}
      {it.people && (
        <ul className="tcl-small">
          {it.people.map((p, i) => (<li key={i}>{t(p.name && p.email ? "detail.person" : p.name ? "detail.personName" : "detail.personEmail", { name: p.name, email: p.email, field: p.field })}</li>))}
        </ul>
      )}
      {it.urls && (
        <ul className="tcl-small">
          {it.urls.map((u, i) => (<li key={i}>{u.wellKnown ? t("detail.urlKnown", { label: u.label, normalized: u.normalized, known: u.wellKnown }) : t("detail.url", { label: u.label, normalized: u.normalized })}</li>))}
        </ul>
      )}
      {it.entries && (
        <ul className="tcl-small">
          {it.entries.map((e, i) => (<li key={i}><code>{e.name}</code>: {e.ref.valid ? t(e.ref.object ? "detail.entryObject" : "detail.entryModule", { module: e.ref.module, object: e.ref.object ?? "" }) : t("detail.entryInvalid")}</li>))}
        </ul>
      )}
      {it.extras && (
        <ul className="tcl-small">
          {it.extras.map((x, i) => (<li key={i}>{t("detail.extra", { name: x.name, normalized: x.normalized, n: x.count })}</li>))}
        </ul>
      )}
      {it.group && it.group.includes.length > 0 && <p className="tcl-small">{t("detail.includes", { list: it.group.includes.join(", ") })}</p>}
      {it.reference && it.reference.valid && <p className="tcl-small">{t(it.reference.object ? "detail.backendObject" : "detail.backendModule", { module: it.reference.module, object: it.reference.object ?? "" })}</p>}
      {it.keys && (
        <p className="tcl-small">
          {t("detail.keys", { n: it.keys.length })} {it.keys.slice(0, 40).map((k) => `${k.key} (${t(`type.${k.type}`)})`).join(", ")}{it.keys.length > 40 ? " …" : ""}
        </p>
      )}
      {it.requirements && it.requirements.length > 0 && (
        <ol className="tcl-small">
          {it.requirements.map((q) => (
            <li key={`${q.extra}-${q.index}`}>
              {q.extra && <span className="tcl-pill tcl-pill-value">{q.extra}</span>} <code>{q.text}</code>
              {requirementView(q)}
            </li>
          ))}
        </ol>
      )}
    </>
  ); // details

  /** The caret line under the error excerpt. */
  const caret = (col: number): string => " ".repeat(Math.max(0, col - 1)) + "^"; // spaces then ^

  return (
    <div className="cidr-tool jwt-tool tcl-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="ppx-input">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            {/* D-83 Example/Clear row: the Example is EXPLAIN_VECTORS[0]'s input. */}
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE_PYPROJECT)}>
              {t("example")}
            </button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>
              {t("clear")}
            </button>
          </div>
        </div>
        <textarea
          id="ppx-input"
          className="cidr-input mono json-input"
          rows={14}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("inputPlaceholder")}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-describedby="ppx-privacy"
        />
        <p id="ppx-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            ●
          </span>{" "}
          {t("runsLocally")}
        </p>
      </div>

      {r && r.status === "too-long" && <p className="tcl-verdict tcl-verdict-bad" role="alert">{t("tooLong", { max: MAX_TOML_CHARS })}</p>}

      {/* Not TOML: where and why, and the line itself. */}
      {r && r.status === "toml-error" && r.tomlError && (
        <div className="json-error-box" role="alert">
          <p className="json-error-headline">{t("tomlErrorTitle")}</p>
          <p className="json-error-location">
            {t("errorLocation", { line: r.tomlError.line, col: r.tomlError.col })}
            <span className="json-error-pointer">{r.tomlError.code}</span>
          </p>
          <p className="json-error-message">{t(`tomlError.${r.tomlError.code}`, { key: r.tomlError.key })}</p>
          <pre className="json-output mono" aria-label={t("excerptLabel")}>
            {(input.replace(/\r\n/g, "\n").split("\n")[r.tomlError.line - 1] ?? "").slice(0, 200) + "\n" + caret(Math.min(r.tomlError.col, 201))}
          </pre>
        </div>
      )}

      {r && r.status === "ok" && (
        <div className="jwt-results">
          {/* The headline facts. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("summaryTitle")}</h4>
            <p>
              {r.summary.name && <span className="tcl-pill tcl-pill-value">{t("sum.name", { name: r.summary.name })}</span>}{" "}
              {(r.summary.version || r.summary.versionDynamic) && <span className="tcl-pill tcl-pill-value">{r.summary.versionDynamic && !r.summary.version ? t("sum.versionDynamic") : t("sum.version", { version: r.summary.version })}</span>}{" "}
              {r.summary.backend && <span className="tcl-pill tcl-pill-value">{t("sum.backend", { backend: r.summary.backend })}</span>}{" "}
              <span className="tcl-pill tcl-pill-value">{t("sum.toml", { version: r.toml?.version ?? "" })}</span>{" "}
              <span className={`tcl-pill ${r.counts.error ? "tcl-pill-bad" : r.counts.warning ? "tcl-pill-warn" : "tcl-pill-true"}`}>{t("sum.counts", { error: r.counts.error, warning: r.counts.warning, note: r.counts.note })}</span>
            </p>
            <p className="tcl-muted tcl-small">{t("severityNote")}</p>
          </section>

          {/* The findings. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("findingsTitle")}</h4>
            {r.findings.length === 0 ? (
              <p className="tcl-verdict tcl-verdict-ok">{t("clean")}</p>
            ) : (
              <ul className="tcl-findings">
                {r.findings.map((f, i) => (
                  <li key={`${f.code}-${f.path}-${i}`} className={`tcl-finding tcl-finding-${f.severity === "note" ? "info" : f.severity}`}>
                    <div className="tcl-finding-head">
                      <span className={`irl-sev ${SEV_CLASS[f.severity]}`}>{t(`sev.${f.severity}`)}</span>{" "}
                      <span className="tcl-finding-title">{f.line > 0 ? t("lineShort", { n: f.line }) : t("noLine")}{f.path ? ` · ${f.path}` : ""}</span>
                    </div>
                    <p className="tcl-finding-msg">{findingText(f)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Each table, key by key. */}
          {r.sections.map((s) => (
            <section key={`${s.id}-${s.name}`} className="jwt-panel">
              <h4 className="jwt-panel-title">
                <code>[{s.name}]</code> {s.present ? t(`section.${s.id}`) : t(`section.absent.${s.id}`)}
              </h4>
              {s.items.length > 0 && (
                <div className="tcl-table-wrap">
                  <table className="tcl-table">
                    <thead>
                      <tr>
                        <th scope="col">{t("colKey")}</th>
                        <th scope="col">{t("colValue")}</th>
                        <th scope="col">{t("colMeaning")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {s.items.map((it) => (
                        <tr key={it.path}>
                          <th scope="row">
                            <code>{it.path}</code>
                            <span className="tcl-muted tcl-small"> {t("lineShort", { n: it.line })}</span>
                          </th>
                          <td>
                            <code>{it.display}</code>
                            {it.dynamic && <span className="tcl-pill tcl-pill-warn"> {t("dynamicPill")}</span>}
                          </td>
                          <td>
                            {t(`key.${it.known}`, { name: it.key })}
                            {it.coreField && <span className="tcl-muted tcl-small"> {t("coreField", { field: it.coreField })}</span>}
                            {details(it)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
