"use client";

// ============================================================================
// FortiOS CLI config explainer - the UI.
// The tree is rendered by indenting on depth, so the structure is visible
// before any of the explanations are read.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { decodeConfig, ConfigParseError, type ConfigDecode } from "@/lib/tools/fortios-cli-config-explainer";

const EXAMPLE = `config firewall policy
    edit 10
        set name "allow-web"
        set srcintf "port1"
        set dstintf "port2"
        set srcaddr "internal-net"
        set dstaddr "all"
        set service "HTTPS"
        set action accept
    next
end`;

export default function FortiosCliConfigExplainerTool() {
  const t = useTranslations("tools.fortios-cli-config-explainer");
  const [input, setInput] = useState("");

  const result = useMemo<{ ok: true; data: ConfigDecode } | { ok: false; message: string } | null>(() => {
    if (!input.trim()) return null;
    try { return { ok: true, data: decodeConfig(input) }; }
    catch (e) {
      if (e instanceof ConfigParseError) return { ok: false, message: e.message };
      return { ok: false, message: (e as Error).message };
    }
  }, [input]);

  return (
    <div className="tool-panel">
      <div className="dig-input-head">
        <label htmlFor="fcc-in" className="cidr-label">{t("inputLabel")}</label>
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
          <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
        </div>
      </div>
      <textarea
        id="fcc-in" className="cidr-input mono saml-textarea json-input tmsh-input"
        value={input} onChange={(e) => setInput(e.target.value)}
        placeholder={t("placeholder")} spellCheck={false} rows={12}
      />

      {result && !result.ok && <p className="cidr-error">{result.message}</p>}

      {result && result.ok && (
        <div className="dig-result">
          {/* Warnings first: one of them says a list has been silently emptied. */}
          {result.data.warnings.length > 0 && (
            <section className="dig-section">
              <h3 className="dig-section-title">{t("warnings.title")}</h3>
              <ul className="dig-notes">{result.data.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
            </section>
          )}

          <section className="dig-section">
            <div className="dig-input-head">
              <h3 className="dig-section-title">{t("tree.title")}</h3>
              <span className="dig-record-type">
                {result.data.balanced ? t("tree.balanced") : t("tree.unbalanced")}
              </span>
            </div>
            <ol className="dig-records">
              {result.data.lines.map((l) => (
                <li key={l.line} className="dig-record">
                  <code className="mono">
                    {/* Indent by the depth the line sits at, so the block
                        structure reads at a glance. */}
                    {"\u00a0".repeat(Math.max(0, (l.verb === "config" || l.verb === "edit" ? l.depth - 1 : l.depth) * 4))}
                    {l.verb} {l.rest}
                  </code>
                  <span className="dig-record-type">{t(`verbs.${l.verb}`)}</span>
                  <p className="dig-record-explain">{l.explain}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="dig-section">
            <h3 className="dig-section-title">{t("notes.title")}</h3>
            <ul className="dig-notes">{result.data.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
          </section>
        </div>
      )}
    </div>
  );
}
