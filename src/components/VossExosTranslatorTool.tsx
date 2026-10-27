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
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-10-27)
import type { ShareEncoding } from "@/lib/share/spec"; // what the button is handed
import { VOSS_EXOS_TRANSLATOR_SHARE } from "@/lib/tools/voss-exos-translator/share"; // this tool's share spec: the search as #input=

/** Nothing to share: a constant, so the button sees no change between renders. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // the disabled state

const EXAMPLE = "i-sid";

export default function VossExosTranslatorTool() {
  const t = useTranslations("tools.voss-exos-translator");
  const [query, setQuery] = useState("");

  const onChange = useCallback((value: string) => setQuery(value), []);
  // The field's value goes to usePrefill too, so a Clear, an Example or an edit drops the handed-over value from the
  // address (#input=), and a share or reload no longer carries it (RT01, 2026-10-20).
  usePrefill(onChange, query);

  const results = useMemo(() => searchMappings(query), [query]);

  // What Share results may carry (2026-10-27): the search as typed, when it finds something (a blank search lists every
  // mapping and needs no link), as the same #input= the handoff above reads (usePrefill is the arrival, unchanged).
  const share = useMemo<ShareEncoding>(() => (query.trim() !== "" && results.length > 0 ? VOSS_EXOS_TRANSLATOR_SHARE.encode({ input: query }) : NOTHING), [query, results]); // the encoding

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
        <p className="cidr-note">{t("hint")}</p>
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

      {/* Share results (2026-10-27): under the mappings it shares, at the start of its own row, so the popover opens below
          it; disabled while the search is blank (every mapping is listed then). First placed above the cards, where it
          read as part of the search field: moved after looking. */}
      <div className="rdap-ask-row">
        <ShareResultsButton encoding={share} carries={t("share.carries")} title={t("name")} />
      </div>
    </div>
  );
}
