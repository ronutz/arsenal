"use client";

// ============================================================================
// Extreme Universal switch OS-name mapper - the UI.
//
// The two naming pairs are shown ALWAYS, before any input. Somebody arriving
// because a document said one word and their switch says another needs the
// answer immediately, not after supplying a model number they may not have.
//
// PAGE LANGUAGE (02/11/2026): the fact labels and values, notes, warnings and
// errors arrive as EngineTexts from mapOsNameLocalisable() and are shown
// through engineTexts(t) (keys under engine.* in the pack).
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  mapOsNameLocalisable, universalFamilies, type MapperResult,
} from "@/lib/tools/extreme-switch-os-mapper/compute"; // the reading with sentence ids (02/11/2026)
import { engineTexts, type EngineText } from "@/lib/tools/engine-text"; // engine sentences in the page's language
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // a shared link fills the page as typing would
import type { ShareEncoding } from "@/lib/share/spec"; // what the button is given
import { OS_MAPPER_SHARE } from "@/lib/tools/extreme-switch-os-mapper/share"; // this tool's share spec: the box as typed

const EXAMPLES = ["5520", "7520", "5720", "X440-G2", "VOSS", "EXOS"];

/** Share results with nothing to share: the button is disabled. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // module constant

export default function ExtremeSwitchOsMapperTool() {
  const t = useTranslations("tools.extreme-switch-os-mapper");
  const tx = engineTexts(t); // the engine's sentences in the page's language
  const [input, setInput] = useState("");
  const families = universalFamilies();

  const result = useMemo<{ ok: true; data: MapperResult<EngineText> } | { ok: false; error: unknown } | null>(() => {
    if (!input.trim()) return null;
    try { return { ok: true, data: mapOsNameLocalisable(input) }; } // the reading, sentences with ids
    catch (e) {
      return { ok: false, error: e }; // shown through tx.error (an input error carries its sentence)
    }
  }, [input]);

  // Share results (2026-11-01): the box as typed, only beside an answer.
  const share = useMemo<ShareEncoding>(() => (result && result.ok ? OS_MAPPER_SHARE.encode({ input }) : NOTHING), [result, input]); // the button's encoding
  // A shared link fills the box as typing would; the page maps it.
  useShareArrival(OS_MAPPER_SHARE, (s) => setInput(s.input));

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

      {result && !result.ok && <p className="cidr-error">{tx.error(result.error)}</p>}

      {result && result.ok && (
        <div className="dig-result">
          {result.data.facts.length > 0 && (
            <section className="dig-section">
              <h3 className="dig-section-title">{t("what.title")}</h3>
              <dl className="dig-kv">
                {result.data.facts.map((f, i) => (
                  <div key={`${f.label.id}-${i}`}>
                    <dt>{tx.say(f.label)}</dt>
                    <dd className="mono">{tx.say(f.value)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* Warnings ABOVE notes here, deliberately: one of them says the
              operation destroys the configuration. */}
          <section className="dig-section">
            <h3 className="dig-section-title">{t("warnings.title")}</h3>
            <ul className="dig-notes">{result.data.warnings.map((w, i) => <li key={i}>{tx.say(w)}</li>)}</ul>
          </section>

          <section className="dig-section">
            <h3 className="dig-section-title">{t("notes.title")}</h3>
            <ul className="dig-notes">{result.data.notes.map((n, i) => <li key={i}>{tx.say(n)}</li>)}</ul>
          </section>

          {/* Share results: under the answer (what it is, the warnings, the notes), at the start of its own row. */}
          <div className="rdap-ask-row">
            <ShareResultsButton encoding={share} carries={t("share.carries")} title={t("name")} />
          </div>
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
