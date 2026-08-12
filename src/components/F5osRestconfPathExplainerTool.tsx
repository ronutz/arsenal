"use client";

// ============================================================================
// src/components/F5osRestconfPathExplainerTool.tsx
// ----------------------------------------------------------------------------
// Paste an F5OS RESTCONF path, get it decoded segment by segment. The parse is
// pure and local (compute.ts); this component only renders it. It contacts
// nothing.
//
// The D-83 Example/Clear affordance is present, using the same markup and the
// same classes as the other explainers rather than new ones - a reader who has
// used one tool on this site should not have to learn a second set of controls.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  decodeF5osPath,
  knownModules,
  F5osPathError,
  type F5osPathDecode,
} from "@/lib/tools/f5os-restconf-path-explainer";

const EXAMPLE =
  "https://velos.example.net:8888/restconf/data/f5-tenants:tenants/tenant=tenant1/config/running-state";

export default function F5osRestconfPathExplainerTool() {
  const t = useTranslations("tools.f5os-restconf-path-explainer");
  const [input, setInput] = useState("");

  const result = useMemo<{ ok: true; data: F5osPathDecode } | { ok: false; message: string } | null>(() => {
    if (!input.trim()) return null;
    try {
      return { ok: true, data: decodeF5osPath(input) };
    } catch (e) {
      if (e instanceof F5osPathError) return { ok: false, message: e.message };
      return { ok: false, message: (e as Error).message };
    }
  }, [input]);

  const modules = knownModules();

  return (
    <div className="tool-panel">
      <div className="dig-input-head">
        <label htmlFor="f5os-in" className="cidr-label">{t("inputLabel")}</label>
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
          <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
        </div>
      </div>
      <textarea
        id="f5os-in"
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
          {/* WHAT WAS ADDRESSED. Host and port first, because the port is the
              F5OS-specific thing a reader most often needs explained. */}
          <section className="dig-section">
            <h3 className="dig-section-title">{t("overview.title")}</h3>
            <dl className="dig-kv">
              <dt>{t("overview.path")}</dt>
              <dd className="mono">{result.data.normalisedPath}</dd>
              {result.data.host && (
                <>
                  <dt>{t("overview.host")}</dt>
                  <dd className="mono">{result.data.host}</dd>
                </>
              )}
              <dt>{t("overview.root")}</dt>
              <dd className="mono">
                {result.data.root === "unknown" ? t("overview.rootUnknown") : `/${result.data.root}`}
                {result.data.rootResource ? `/${result.data.rootResource}` : ""}
              </dd>
            </dl>
          </section>

          {/* SEGMENT BY SEGMENT. This is the whole point of the tool. */}
          <section className="dig-section">
            <h3 className="dig-section-title">{t("segments.title")}</h3>
            <ol className="dig-records">
              {result.data.segments.map((s, i) => (
                <li key={`${s.raw}-${i}`} className="dig-record">
                  <code className="mono">{s.raw}</code>
                  <span className="dig-record-type">{t(`segments.kind.${s.kind}`)}</span>
                  <p className="dig-record-explain">{s.explain}</p>
                </li>
              ))}
            </ol>
          </section>

          {result.data.modules.length > 0 && (
            <section className="dig-section">
              <h3 className="dig-section-title">{t("modules.title")}</h3>
              <dl className="dig-kv">
                {result.data.modules.map((m) => (
                  <div key={m.module}>
                    <dt className="mono">{m.module}</dt>
                    <dd>{m.governs}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {result.data.notes.length > 0 && (
            <section className="dig-section">
              <h3 className="dig-section-title">{t("notes.title")}</h3>
              <ul className="dig-notes">
                {result.data.notes.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            </section>
          )}

          {result.data.warnings.length > 0 && (
            <section className="dig-section">
              <h3 className="dig-section-title">{t("warnings.title")}</h3>
              <ul className="dig-notes">
                {result.data.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </section>
          )}
        </div>
      )}

      {/* THE MODULE TABLE, always visible. It states plainly that the list is
          finite, which is the honest framing: an unrecognised module is
          reported as unrecognised rather than described from a guess. */}
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
