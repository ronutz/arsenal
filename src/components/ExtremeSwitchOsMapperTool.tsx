"use client";

// ============================================================================
// Extreme Universal switch OS-name mapper - the UI.
//
// The two naming pairs are shown ALWAYS, before any input. Somebody arriving
// because a document said one word and their switch says another needs the
// answer immediately, not after supplying a model number they may not have.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  mapOsName, universalFamilies, MapperInputError, type MapperResult,
} from "@/lib/tools/extreme-switch-os-mapper";

const EXAMPLES = ["5520", "7520", "5720", "X440-G2", "VOSS", "EXOS"];

export default function ExtremeSwitchOsMapperTool() {
  const t = useTranslations("tools.extreme-switch-os-mapper");
  const [input, setInput] = useState("");
  const families = universalFamilies();

  const result = useMemo<{ ok: true; data: MapperResult } | { ok: false; message: string } | null>(() => {
    if (!input.trim()) return null;
    try { return { ok: true, data: mapOsName(input) }; }
    catch (e) {
      if (e instanceof MapperInputError) return { ok: false, message: e.message };
      return { ok: false, message: (e as Error).message };
    }
  }, [input]);

  return (
    <div className="tool-panel">
      {/* The answer to the actual question, before anything is typed. */}
      <section className="dig-section">
        <h3 className="dig-section-title">{t("naming.title")}</h3>
        <dl className="dig-kv">
          <dt className="mono">ExtremeXOS (EXOS)</dt>
          <dd className="mono">Switch Engine</dd>
          <dt className="mono">VOSS</dt>
          <dd className="mono">Fabric Engine</dd>
        </dl>
        <p className="dig-record-explain">{t("naming.body")}</p>
      </section>

      <div className="dig-input-head">
        <label htmlFor="eos-in" className="cidr-label">{t("inputLabel")}</label>
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
        </div>
      </div>
      <input
        id="eos-in" className="cidr-input mono" value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={t("placeholder")} spellCheck={false}
      />
      <div className="dig-input-actions">
        {EXAMPLES.map((x) => (
          <button key={x} type="button" className="b64-copy mono" onClick={() => setInput(x)}>{x}</button>
        ))}
      </div>

      {result && !result.ok && <p className="cidr-error">{result.message}</p>}

      {result && result.ok && (
        <div className="dig-result">
          {result.data.facts.length > 0 && (
            <section className="dig-section">
              <h3 className="dig-section-title">{t("what.title")}</h3>
              <dl className="dig-kv">
                {result.data.facts.map((f, i) => (
                  <div key={`${f.label}-${i}`}>
                    <dt>{f.label}</dt>
                    <dd className="mono">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* Warnings ABOVE notes here, deliberately: one of them says the
              operation destroys the configuration. */}
          <section className="dig-section">
            <h3 className="dig-section-title">{t("warnings.title")}</h3>
            <ul className="dig-notes">{result.data.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
          </section>

          <section className="dig-section">
            <h3 className="dig-section-title">{t("notes.title")}</h3>
            <ul className="dig-notes">{result.data.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
          </section>
        </div>
      )}

      <section className="dig-section">
        <h3 className="dig-section-title">{t("families.title")}</h3>
        <p className="dig-record-explain">{t("families.intro")}</p>
        <p className="mono">{families.map((f) => f.series).join(" \u00b7 ")}</p>
      </section>
    </div>
  );
}
