"use client";

// ============================================================================
// src/components/VossExosTranslatorTool.tsx
// ----------------------------------------------------------------------------
// A reference translator: search the curated VOSS <-> EXOS mapping table and
// see how each fabric task is expressed in each CLI, side by side. Not a config
// generator; explicit where EXOS has no equivalent. Pure, browser-only.
// ============================================================================

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { searchMappings } from "@/lib/tools/voss-exos-translator/compute";
import { usePrefill } from "@/lib/use-prefill";

const EXAMPLE = "i-sid";

export default function VossExosTranslatorTool() {
  const t = useTranslations("tools.voss-exos-translator");
  const [query, setQuery] = useState("");

  const onChange = useCallback((value: string) => setQuery(value), []);
  usePrefill(onChange);

  const results = useMemo(() => searchMappings(query), [query]);

  return (
    <div className="cidr-tool jwt-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="vet-q">
            {t("searchLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => onChange(EXAMPLE)}>
              {t("example")}
            </button>
            <button type="button" className="b64-copy" onClick={() => onChange("")}>
              {t("clear")}
            </button>
          </div>
        </div>
        <input
          id="vet-q"
          className="cidr-input mono"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("searchPlaceholder")}
          autoComplete="off"
          spellCheck={false}
        />
        <p className="cidr-hint">{t("hint")}</p>
      </div>

      <div className="vet-list">
        {results.map((m) => (
          <div className="vet-card" key={m.id}>
            <div className="vet-concept">{m.concept}</div>
            <div className="vet-cols">
              <div className="vet-col">
                <div className="vet-os vet-os-voss">{t("voss")}</div>
                {m.voss.map((c, i) => (
                  <code className="vet-cmd mono" key={i}>
                    {c}
                  </code>
                ))}
              </div>
              <div className="vet-col">
                <div className="vet-os vet-os-exos">{t("exos")}</div>
                {m.exos ? (
                  m.exos.map((c, i) => (
                    <code className="vet-cmd mono" key={i}>
                      {c}
                    </code>
                  ))
                ) : (
                  <span className="vet-none">{t("noEquiv")}</span>
                )}
              </div>
            </div>
            <p className="vet-note">{m.note}</p>
          </div>
        ))}
        {results.length === 0 && <p className="ja4-error">{t("noResults")}</p>}
      </div>
    </div>
  );
}
