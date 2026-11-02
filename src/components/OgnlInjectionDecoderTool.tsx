"use client";

// ============================================================================
// src/components/OgnlInjectionDecoderTool.tsx
// ----------------------------------------------------------------------------
// UI for the OGNL injection decoder.
//
// The design carries one obligation the engine cannot: making it obvious that
// this reads a captured artefact rather than producing one. So the empty state
// says what to paste and where it came from, the findings are grouped by what
// they mean rather than by where they appeared, and the caveats about what the
// tool did NOT determine are always visible - not folded away behind a toggle,
// because the most dangerous reading of this page is somebody concluding "no
// findings, therefore fine".
//
// D-83: Example / Clear row, with a sample drawn from a golden vector so the
// button demonstrates a case the tests actually pin.
//
// PAGE LANGUAGE (02/11/2026): the chrome comes from tools.ognl-injection-
// decoder (it was English only); the reading's sentences arrive as EngineTexts
// from decodeOgnlLocalisable() and show through engineTexts(t), so the pt-BR
// page reads in Portuguese and the English page as before.
// ============================================================================

import { useState } from "react";
import { useTranslations } from "next-intl"; // the tool's messages (02/11/2026)
import { decodeOgnlLocalisable, type DecodeResult } from "@/lib/tools/ognl-injection-decoder/compute"; // the reading with sentence ids
import { engineTexts, type EngineText } from "@/lib/tools/engine-text"; // engine sentences in the page's language

const EXAMPLE =
  '%{(#_memberAccess["allowStaticMethodAccess"]=true).(@java.lang.Runtime@getRuntime().exec("id"))}';

const SIGNIFICANCE_ORDER = ["sandbox-escape", "execution", "reconnaissance", "structural"] as const;

/** The pack key of each significance group's heading (sig.<significance>). */
const SIGNIFICANCE_KEY: Record<string, string> = {
  "sandbox-escape": "sig.sandbox-escape", // Sandbox escape
  execution: "sig.execution", // Execution
  reconnaissance: "sig.reconnaissance", // Reconnaissance
  structural: "sig.structural", // Structure
};

export default function OgnlInjectionDecoderTool() {
  const t = useTranslations("tools.ognl-injection-decoder"); // the chrome
  const tx = engineTexts(t); // the reading's sentences in the page's language
  const [input, setInput] = useState("");
  const [result, setResult] = useState<DecodeResult<EngineText> | null>(null); // the reading, sentences with ids

  const run = (text: string) => {
    setInput(text);
    setResult(text.trim() ? decodeOgnlLocalisable(text) : null); // read on every change
  };

  return (
    <>
      <div className="dig-input-head">
        <button type="button" className="btn btn-secondary" onClick={() => run(EXAMPLE)}>
          {t("example")}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            setInput("");
            setResult(null);
          }}
        >
          {t("clear")}
        </button>
      </div>

      <label className="cidr-label" htmlFor="ognl-input">
        {t("inputLabel")}
      </label>
      <textarea
        id="ognl-input"
        className="cidr-input mono saml-textarea"
        rows={5}
        spellCheck={false}
        value={input}
        placeholder={t("placeholder")}
        onChange={(e) => run(e.target.value)}
      />

      {result && (
        <>
          <div className="ztc-result">
            <h2 className="ztc-section-title">{t("readingTitle")}</h2>
            <p className="ztc-notes">{tx.say(result.summary)}</p>
            {result.looksLikeOgnl && (
              <p className="tmsh-object-head mono">
                {t("flagsLine", { escape: t(result.hasEscape ? "present" : "absent"), execution: t(result.hasExecution ? "present" : "absent") })}
              </p>
            )}
          </div>

          {result.findings.length > 0 && (
            <div className="ztc-result">
              <h2 className="ztc-section-title">{t("findingsTitle")}</h2>
              {SIGNIFICANCE_ORDER.map((sig) => {
                const group = result.findings.filter((f) => f.significance === sig);
                if (group.length === 0) return null;
                return (
                  <div key={sig}>
                    <p className="tmsh-object-head mono">{t(SIGNIFICANCE_KEY[sig])}</p>
                    <ul className="lbm-facts">
                      {group.map((f, i) => (
                        <li className="ztc-notes" key={i}>
                          <strong>{tx.say(f.label)}</strong>: <span className="mono">{f.fragment}</span>
                          <br />
                          {tx.say(f.meaning)}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}

          {result.advisories.length > 0 && (
            <div className="ztc-result">
              <h2 className="ztc-section-title">{t("advisoriesTitle")}</h2>
              <ul className="lbm-facts">
                {result.advisories.map((a, i) => (
                  <li className="ztc-notes" key={i}>
                    <strong>{tx.say(a.id)}</strong>: {tx.say(a.what)}
                    <br />
                    <span className="mono">{t("carriedIn", { vector: tx.say(a.vector) })}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Always visible. The most dangerous reading of this page is
              "no findings, therefore fine", and these are the sentences that
              prevent it. */}
          <div className="ztc-result">
            <h2 className="ztc-section-title">{t("caveatsTitle")}</h2>
            <ul className="lbm-facts">
              {result.caveats.map((c, i) => (
                <li className="ztc-notes" key={i}>
                  {tx.say(c)}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <p className="cidr-privacy">{t("privacy")}</p>
    </>
  );
}
