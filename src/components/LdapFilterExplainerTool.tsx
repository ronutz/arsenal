"use client";
// ============================================================================
// src/components/LdapFilterExplainerTool.tsx
// ----------------------------------------------------------------------------
// UI for the ldap-filter-explainer: one wrapping paste box (tmsh-input stack,
// per the paste-box CSS rule), Example/Clear per D-83, and the parsed tree
// rendered as nested tmsh-object blocks with type badges - the same stepper
// vocabulary as cable-run-planner; NO new CSS classes. All strings i18n. (D-19.)
//
// SHARE RESULTS (2026-10-27): under the counts (or under the anchored error of
// a filter that does not parse), a button builds a link only when pressed,
// carrying the filter as typed (src/lib/tools/ldap-filter-explainer/share.ts,
// posture input-caution; blocked when the filter asserts a password value).
// An arriving link (useShareArrival) fills the box and the page explains it.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { explainFilterLocalisable, type FilterNode } from "@/lib/tools/ldap-filter-explainer/compute"; // the parse with sentence ids (02/11/2026)
import { engineTexts, type EngineText, type EngineTexts } from "@/lib/tools/engine-text"; // engine sentences in the page's language
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what the spec encodes
import { LDAP_FILTER_SHARE } from "@/lib/tools/ldap-filter-explainer/share"; // this tool's share spec: the filter as typed

/** Nothing to share: a constant, so the button sees no change between renders. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // the button is disabled

/** The D-83 golden-vector-faithful example (V09's famous AD idiom, wrapped in the classic user query). */
const EXAMPLE =
  "(&(objectClass=user)(|(cn=Rod*)(mail=*@ronutz.com))(!(userAccountControl:1.2.840.113556.1.4.803:=2)))";

/** Recursive tree node renderer - nested tmsh-object blocks. */
function Node({ n, t, tx }: { n: FilterNode<EngineText>; t: ReturnType<typeof useTranslations>; tx: EngineTexts }) {
  const badge =
    n.kind === "item" ? (n.matchType ?? "item") : n.kind === "and" ? "AND" : n.kind === "or" ? "OR" : "NOT";
  return (
    <div className="tmsh-object">
      <div className="tmsh-object-head">
        <span className="tmsh-type-badge">{badge}</span>
        {n.kind === "item" && n.attribute ? <code>{n.attribute}</code> : null}
      </div>
      <p>{tx.say(n.explanation)}</p>
      {n.kind === "item" && n.decodedValue !== undefined && n.matchType !== "presence" ? (
        <p>
          {t("valueLabel")} <code>{n.decodedValue}</code>
        </p>
      ) : null}
      {n.note ? <p className="lbm-facts">{tx.say(n.note)}</p> : null}
      {n.children?.map((c, i) => (
        <Node key={i} n={c} t={t} tx={tx} />
      ))}
    </div>
  );
}

export default function LdapFilterExplainerTool() {
  const t = useTranslations("tools.ldap-filter-explainer");
  const tx = engineTexts(t); // PAGE LANGUAGE (02/11/2026): the engine's sentences under engine.*, else its English
  const [filter, setFilter] = useState("");

  const result = useMemo(() => (filter.trim() ? explainFilterLocalisable(filter) : null), [filter]); // sentences with ids

  // An arriving share link: the filter fills the box, and the page explains it.
  useShareArrival(LDAP_FILTER_SHARE, (s) => setFilter(s.input)); // filled
  // What Share results may carry: the filter as typed, parsed or not.
  const share = useMemo<ShareEncoding>(() => (result ? LDAP_FILTER_SHARE.encode({ input: filter }) : NOTHING), [result, filter]); // memoised
  // The Share results row, the same under the counts and under an error.
  const shareRow = (
    <div className="rdap-ask-row">
      <ShareResultsButton
        encoding={share}
        carries={t("share.carries")}
        details={[t("share.caution")]}
        blockedMessage={!share.ok && share.reason === "blocked" ? t("share.blocked", { attribute: String(share.values?.attribute ?? "") }) : ""}
        title={t("name")}
      />
    </div>
  ); // one row

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
        <div className="json-error-box">
          <p className="json-error-headline">{t("errorTitle")}</p>
          <p>
            {tx.say(result.error)} {t("errorAt")} {result.pos}.
          </p>
          <pre className="mono">
            {filter}
            {"\n"}
            {" ".repeat(Math.min(result.pos, filter.length))}^
          </pre>
          {/* Share results: a filter that does not parse goes too; its anchored error is the reading. */}
          {shareRow}
        </div>
      ) : (
        <div className="ztc-result">
          <p className="lbm-facts">
            {t("statsItems")} {result.itemCount} - {t("statsDepth")} {result.depth}
            {result.escapesSeen.length > 0
              ? ` - ${t("statsEscapes")} ${result.escapesSeen.map((e) => `${e.raw}\u2192${e.decoded}`).join(", ")}`
              : ""}
          </p>
          {/* Share results: under the counts, before the tree. */}
          {shareRow}
          <Node n={result.root} t={t} tx={tx} />
          <p className="ztc-notes">{t("runsLocally")}</p>
        </div>
      )}
    </div>
  );
}
