"use client";

// ============================================================================
// Terminal stack explainer - the UI.
//
// The four one-line definitions are shown ALWAYS, not only after input. They
// are the point of the tool, and a reader who arrives confused about the words
// should not have to paste something before the page tells them anything.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  explainDevice, theFourWords, TerminalInputError, type DeviceFacts,
} from "@/lib/tools/terminal-stack-explainer";

const EXAMPLES = ["/dev/pts/3", "/dev/tty2", "/dev/ttyS0", "/dev/tty", "/dev/console", "not a tty"];

export default function TerminalStackExplainerTool() {
  const t = useTranslations("tools.terminal-stack-explainer");
  const [input, setInput] = useState("");
  const words = theFourWords();

  const result = useMemo<{ ok: true; data: DeviceFacts } | { ok: false; message: string } | null>(() => {
    if (!input.trim()) return null;
    try { return { ok: true, data: explainDevice(input) }; }
    catch (e) {
      if (e instanceof TerminalInputError) return { ok: false, message: e.message };
      return { ok: false, message: (e as Error).message };
    }
  }, [input]);

  return (
    <div className="tool-panel">
      {/* The definitions come FIRST and stay put. */}
      <section className="dig-section">
        <h3 className="dig-section-title">{t("words.title")}</h3>
        <dl className="dig-kv">
          {words.map((w) => (
            <div key={w.term}>
              <dt className="mono">{w.term}</dt>
              <dd>{t(`words.${w.term}`)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="dig-input-head">
        <label htmlFor="tse-in" className="cidr-label">{t("inputLabel")}</label>
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
        </div>
      </div>
      <p className="dig-record-explain">{t("inputHint")}</p>
      <input
        id="tse-in" className="cidr-input mono" value={input}
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
          <section className="dig-section">
            <h3 className="dig-section-title">{t("what.title")}</h3>
            <dl className="dig-kv">
              <dt>{t("what.kind")}</dt>
              <dd className="mono">{result.data.kind}</dd>
              <dt>{t("what.otherEnd")}</dt>
              <dd>{result.data.otherEnd}</dd>
              {result.data.facts.map((f, i) => (
                <div key={`${f.label}-${i}`}>
                  <dt>{f.label}</dt>
                  <dd className="mono">{f.value}</dd>
                </div>
              ))}
            </dl>
          </section>

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
    </div>
  );
}
