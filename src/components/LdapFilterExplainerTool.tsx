"use client";
// ============================================================================
// src/components/LdapFilterExplainerTool.tsx
// ----------------------------------------------------------------------------
// UI for the ldap-filter-explainer: one wrapping paste box (tmsh-input stack,
// per the paste-box CSS rule), Example/Clear per D-83, and the parsed tree
// rendered as nested tmsh-object blocks with type badges - the same stepper
// vocabulary as cable-run-planner; NO new CSS classes. All strings i18n. (D-19.)
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { explainFilter, type FilterNode } from "@/lib/tools/ldap-filter-explainer";

/** The D-83 golden-vector-faithful example (V09's famous AD idiom, wrapped in the classic user query). */
const EXAMPLE =
  "(&(objectClass=user)(|(cn=Rod*)(mail=*@ronutz.com))(!(userAccountControl:1.2.840.113556.1.4.803:=2)))";

/** Recursive tree node renderer - nested tmsh-object blocks. */
function Node({ n, t }: { n: FilterNode; t: ReturnType<typeof useTranslations> }) {
  const badge =
    n.kind === "item" ? (n.matchType ?? "item") : n.kind === "and" ? "AND" : n.kind === "or" ? "OR" : "NOT";
  return (
    <div className="tmsh-object">
      <div className="tmsh-object-head">
        <span className="type-badge">{badge}</span>
        {n.kind === "item" && n.attribute ? <code>{n.attribute}</code> : null}
      </div>
      <p>{n.explanation}</p>
      {n.kind === "item" && n.decodedValue !== undefined && n.matchType !== "presence" ? (
        <p>
          {t("valueLabel")} <code>{n.decodedValue}</code>
        </p>
      ) : null}
      {n.note ? <p className="lbm-facts">{n.note}</p> : null}
      {n.children?.map((c, i) => (
        <Node key={i} n={c} t={t} />
      ))}
    </div>
  );
}

export default function LdapFilterExplainerTool() {
  const t = useTranslations("tools.ldap-filter-explainer");
  const [filter, setFilter] = useState("");

  const result = useMemo(() => (filter.trim() ? explainFilter(filter) : null), [filter]);

  return (
    <div className="tool-panel">
      <div className="dig-input-head">
        <label className="cidr-label" htmlFor="ldap-filter-input">
          {t("inputLabel")}
        </label>
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={() => setFilter(EXAMPLE)}>
            {t("example")}
          </button>
          <button type="button" className="b64-copy" onClick={() => setFilter("")}>
            {t("clear")}
          </button>
        </div>
      </div>
      <textarea
        id="ldap-filter-input"
        className="cidr-input mono tmsh-input"
        rows={4}
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder={t("placeholder")}
        spellCheck={false}
      />

      {result === null ? (
        <p className="ztc-empty">{t("emptyState")}</p>
      ) : !result.ok ? (
        <div className="json-error">
          <p className="json-error-title">{t("errorTitle")}</p>
          <p>
            {result.error} {t("errorAt")} {result.pos}.
          </p>
          <pre className="mono">
            {filter}
            {"\n"}
            {" ".repeat(Math.min(result.pos, filter.length))}^
          </pre>
        </div>
      ) : (
        <div className="ztc-result">
          <p className="lbm-facts">
            {t("statsItems")} {result.itemCount} - {t("statsDepth")} {result.depth}
            {result.escapesSeen.length > 0
              ? ` - ${t("statsEscapes")} ${result.escapesSeen.map((e) => `${e.raw}\u2192${e.decoded}`).join(", ")}`
              : ""}
          </p>
          <Node n={result.root} t={t} />
          <p className="ztc-notes">{t("runsLocally")}</p>
        </div>
      )}
    </div>
  );
}
