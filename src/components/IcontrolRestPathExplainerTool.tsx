"use client";

// ============================================================================
// src/components/IcontrolRestPathExplainerTool.tsx
// ----------------------------------------------------------------------------
// Paste an iControl REST URL, get it decoded: module, collection, the
// tilde-encoded object path with its tmsh equivalent, sub-collections and query
// options. The parse is pure and local; this component only renders it.
//
// Same D-83 Example/Clear affordance and the same classes as the other
// explainers, so a reader who has used one already knows this one.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  decodeIControlPath,
  knownModules,
  IControlPathError,
  type IControlDecode,
} from "@/lib/tools/icontrol-rest-path-explainer";

const EXAMPLE = "/mgmt/tm/ltm/pool/~Common~apps~web_pool/members?expandSubcollections=true";

export default function IcontrolRestPathExplainerTool() {
  const t = useTranslations("tools.icontrol-rest-path-explainer");
  const [input, setInput] = useState("");

  const result = useMemo<{ ok: true; data: IControlDecode } | { ok: false; message: string } | null>(() => {
    if (!input.trim()) return null;
    try {
      return { ok: true, data: decodeIControlPath(input) };
    } catch (e) {
      if (e instanceof IControlPathError) return { ok: false, message: e.message };
      return { ok: false, message: (e as Error).message };
    }
  }, [input]);

  const modules = knownModules();

  return (
    <div className="tool-panel">
      <div className="dig-input-head">
        <label htmlFor="icr-in" className="cidr-label">{t("inputLabel")}</label>
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
          <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
        </div>
      </div>
      <textarea
        id="icr-in"
        className="cidr-input mono saml-textarea json-input tmsh-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={t("placeholder")}
        spellCheck={false}
        rows={3}
      />

      {result && !result.ok && <p className="cidr-error">{result.message}</p>}

      {result && result.ok && (
        <div className="dig-result">
          <section className="dig-section">
            <h3 className="dig-section-title">{t("overview.title")}</h3>
            <dl className="dig-kv">
              <dt>{t("overview.path")}</dt>
              <dd className="mono">{result.data.normalisedPath}</dd>
              {result.data.host && (<><dt>{t("overview.host")}</dt><dd className="mono">{result.data.host}</dd></>)}
              {result.data.root && (<><dt>{t("overview.root")}</dt><dd className="mono">/mgmt/{result.data.root}</dd></>)}
              {result.data.module && (<><dt>{t("overview.module")}</dt><dd className="mono">{result.data.module.module}</dd></>)}
              {result.data.unknownModule && (
                <><dt>{t("overview.module")}</dt><dd className="mono">{result.data.unknownModule} — {t("overview.moduleUnknown")}</dd></>
              )}
              {result.data.collection.length > 0 && (
                <><dt>{t("overview.collection")}</dt><dd className="mono">{result.data.collection.join(" / ")}</dd></>
              )}
            </dl>
            {result.data.module && <p className="dig-record-explain">{result.data.module.governs}</p>}
          </section>

          {/* THE OBJECT PATH. The tmsh equivalent is the point of the tool for
              most readers: it is the form they already know. */}
          {result.data.object && (
            <section className="dig-section">
              <h3 className="dig-section-title">{t("object.title")}</h3>
              <dl className="dig-kv">
                {result.data.object.partition && (<><dt>{t("object.partition")}</dt><dd className="mono">{result.data.object.partition}</dd></>)}
                {result.data.object.folders.length > 0 && (<><dt>{t("object.folders")}</dt><dd className="mono">{result.data.object.folders.join(" / ")}</dd></>)}
                <dt>{t("object.name")}</dt>
                <dd className="mono">{result.data.object.name}</dd>
                <dt>{t("object.tmsh")}</dt>
                <dd className="mono">{result.data.object.tmsh}</dd>
              </dl>
            </section>
          )}

          {result.data.subCollection && (
            <section className="dig-section">
              <h3 className="dig-section-title">{t("sub.title")}</h3>
              <dl className="dig-kv">
                <dt>{t("sub.name")}</dt>
                <dd className="mono">{result.data.subCollection}</dd>
                {result.data.subObject && (<><dt>{t("sub.member")}</dt><dd className="mono">{result.data.subObject.tmsh}</dd></>)}
              </dl>
            </section>
          )}

          {result.data.options.length > 0 && (
            <section className="dig-section">
              <h3 className="dig-section-title">{t("options.title")}</h3>
              <ol className="dig-records">
                {result.data.options.map((o, i) => (
                  <li key={`${o.key}-${i}`} className="dig-record">
                    <code className="mono">{o.key}{o.value ? `=${o.value}` : ""}</code>
                    <p className="dig-record-explain">{o.explain}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {result.data.notes.length > 0 && (
            <section className="dig-section">
              <h3 className="dig-section-title">{t("notes.title")}</h3>
              <ul className="dig-notes">{result.data.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
            </section>
          )}

          {result.data.warnings.length > 0 && (
            <section className="dig-section">
              <h3 className="dig-section-title">{t("warnings.title")}</h3>
              <ul className="dig-notes">{result.data.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
            </section>
          )}
        </div>
      )}

      <section className="dig-section">
        <h3 className="dig-section-title">{t("reference.title")}</h3>
        <p className="dig-record-explain">{t("reference.intro")}</p>
        <dl className="dig-kv">
          {modules.map((m) => (
            <div key={m.module}>
              <dt className="mono">{m.module}</dt>
              <dd>{m.governs}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
