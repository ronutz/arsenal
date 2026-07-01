"use client";

// ============================================================================
// src/components/XmlDecoderTool.tsx
// ----------------------------------------------------------------------------
// Paste XML, get its structure decoded and its attack surface flagged. The
// parse is pure, local, and XXE-safe (compute.ts); this only renders it.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { parseXml, type XmlNode } from "@/lib/tools/xml-decoder";

const EXAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE catalog [
  <!ENTITY company "Acme Corp">
]>
<catalog xmlns="http://example.com/cat" xmlns:meta="http://example.com/meta">
  <book id="bk101" meta:rating="5">
    <title>XML Guide</title>
    <author>&company;</author>
    <!-- first edition -->
    <summary><![CDATA[Uses <tags> & symbols freely]]></summary>
  </book>
</catalog>`;

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="dig-row">
      <span className="dig-row-label">{label}</span>
      <span className={mono ? "dig-row-value dig-mono" : "dig-row-value"}>{value}</span>
    </div>
  );
}

function TreeNode({ node, t }: { node: XmlNode; t: ReturnType<typeof useTranslations> }) {
  if (node.kind === "text") {
    return <div className="xml-node xml-text">{node.value.trim()}</div>;
  }
  if (node.kind === "cdata") {
    return (
      <div className="xml-node xml-cdata">
        <span className="xml-nodetag">{t("node.cdata")}</span> {node.value}
      </div>
    );
  }
  if (node.kind === "comment") {
    return (
      <div className="xml-node xml-comment">
        <span className="xml-nodetag">{t("node.comment")}</span> {node.value.trim()}
      </div>
    );
  }
  if (node.kind === "pi") {
    return (
      <div className="xml-node xml-pi">
        <span className="xml-nodetag">{t("node.pi")}</span> <span className="dig-mono">{node.target} {node.data}</span>
      </div>
    );
  }
  // element
  const attrs = node.attributes.map((a) => (
    <span key={a.name} className={a.isNamespace ? "xml-attr xml-attr-ns" : "xml-attr"}>
      {" "}
      <span className="xml-attr-name">{a.name}</span>=<span className="xml-attr-val">&quot;{a.value}&quot;</span>
    </span>
  ));
  const openTag = (
    <span className="xml-tag">
      &lt;<span className="xml-el-name">{node.name}</span>
      {attrs}
      {node.selfClosing ? " /" : ""}&gt;
    </span>
  );
  if (node.selfClosing) {
    return <div className="xml-node">{openTag}</div>;
  }
  return (
    <div className="xml-node">
      {openTag}
      <div className="xml-children">
        {node.children.map((c, i) => (
          <TreeNode key={i} node={c} t={t} />
        ))}
      </div>
      <span className="xml-tag">
        &lt;/<span className="xml-el-name">{node.name}</span>&gt;
      </span>
    </div>
  );
}

export default function XmlDecoderTool() {
  const t = useTranslations("tools.xml-decoder");
  const [input, setInput] = useState("");
  const parsed = useMemo(() => parseXml(input), [input]);
  const show = input.trim().length > 0 && parsed.recognized;
  const showNot = input.trim().length > 0 && !parsed.recognized;

  const entityLabel = (kind: string) =>
    kind === "external-system" || kind === "external-public"
      ? t("doctype.entityExternal")
      : kind === "parameter"
        ? t("doctype.entityParameter")
        : t("doctype.entityInternal");

  return (
    <div className="cidr-tool jwt-tool dig-tool xml-tool">
      <div className="dig-input-head">
        <label htmlFor="xml-in" className="cidr-label">{t("input.label")}</label>
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("input.example")}</button>
          <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("input.clear")}</button>
        </div>
      </div>
      <textarea
        id="xml-in"
        className="cidr-input dig-textarea"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={t("input.placeholder")}
        spellCheck={false}
        rows={12}
      />
      <p className="cidr-privacy"><span className="cidr-lock">&#128274;</span> {t("privacy")}</p>

      {showNot && <div className="dig-notdig">{t("notXml")}</div>}

      {show && (
        <div className="jwt-results dig-results">
          {/* -- security analysis (headline) -- */}
          {parsed.warnings.filter((w) => w !== "not-well-formed").length > 0 && (
            <div className="jwt-panel dig-warnings xml-security">
              <div className="jwt-panel-title">{t("security.title")}</div>
              <ul className="dig-warning-list">
                {parsed.warnings
                  .filter((w) => w !== "not-well-formed")
                  .map((w) => (
                    <li key={w}><span className="dig-warn-mark">&#9650;</span> {t(`security.${w}`)}</li>
                  ))}
              </ul>
            </div>
          )}

          {/* -- well-formedness + errors -- */}
          <div className="jwt-panel">
            <div className="jwt-panel-title">{t("wellFormed.title")}</div>
            <Row label={t("wellFormed.title")} value={parsed.wellFormed ? t("wellFormed.yes") : t("wellFormed.no")} />
            {parsed.errors.length > 0 && (
              <ul className="dig-warning-list">
                {parsed.errors.map((e, i) => (
                  <li key={i}><span className="dig-warn-mark">&times;</span> {t(`errors.${e.code}`, { detail: e.detail })}</li>
                ))}
              </ul>
            )}
          </div>

          {/* -- declaration -- */}
          {parsed.declaration && (
            <div className="jwt-panel">
              <div className="jwt-panel-title">{t("declaration.title")}</div>
              <Row label={t("declaration.version")} value={parsed.declaration.version} mono />
              {parsed.declaration.encoding && <Row label={t("declaration.encoding")} value={parsed.declaration.encoding} mono />}
              {parsed.declaration.standalone && <Row label={t("declaration.standalone")} value={parsed.declaration.standalone} mono />}
            </div>
          )}

          {/* -- doctype + entities -- */}
          {parsed.doctype && (
            <div className="jwt-panel">
              <div className="jwt-panel-title">{t("doctype.title")}</div>
              <Row label={t("doctype.name")} value={parsed.doctype.name} mono />
              {parsed.doctype.externalId && <Row label={t("doctype.externalId")} value={parsed.doctype.externalId} mono />}
              {parsed.entities.length > 0 && (
                <div className="xml-entities">
                  <div className="dig-row-label">{t("doctype.entities")}</div>
                  {parsed.entities.map((e, i) => (
                    <div key={i} className="xml-entity">
                      <span className={e.kind === "internal" ? "xml-ent-badge" : "xml-ent-badge xml-ent-danger"}>{entityLabel(e.kind)}</span>
                      <span className="dig-mono xml-ent-name">{e.name}</span>
                      <span className="dig-mono xml-ent-val">{e.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* -- namespaces -- */}
          {parsed.namespaces.length > 0 && (
            <div className="jwt-panel">
              <div className="jwt-panel-title">{t("namespaces.title")}</div>
              {parsed.namespaces.map((ns, i) => (
                <Row key={i} label={ns.prefix ? ns.prefix : t("namespaces.default")} value={ns.uri} mono />
              ))}
            </div>
          )}

          {/* -- stats -- */}
          <div className="jwt-panel">
            <div className="jwt-panel-title">{t("stats.title")}</div>
            <Row label={t("stats.elements")} value={String(parsed.stats.elements)} />
            <Row label={t("stats.depth")} value={String(parsed.stats.maxDepth)} />
            <Row label={t("stats.attributes")} value={String(parsed.stats.attributes)} />
            {parsed.stats.comments > 0 && <Row label={t("stats.comments")} value={String(parsed.stats.comments)} />}
            {parsed.stats.cdata > 0 && <Row label={t("stats.cdata")} value={String(parsed.stats.cdata)} />}
            {parsed.stats.pis > 0 && <Row label={t("stats.pis")} value={String(parsed.stats.pis)} />}
          </div>

          {/* -- tree -- */}
          {(parsed.roots.length > 0 || parsed.prolog.length > 0) && (
            <div className="jwt-panel">
              <div className="jwt-panel-title">{t("tree.title")}</div>
              <div className="xml-tree dig-mono">
                {parsed.prolog.map((c, i) => <TreeNode key={`p${i}`} node={c} t={t} />)}
                {parsed.roots.map((c, i) => <TreeNode key={`r${i}`} node={c} t={t} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
