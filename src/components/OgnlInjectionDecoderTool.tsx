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
// ============================================================================

import { useState } from "react";
import { decodeOgnl, type DecodeResult } from "@/lib/tools/ognl-injection-decoder";

const EXAMPLE =
  '%{(#_memberAccess["allowStaticMethodAccess"]=true).(@java.lang.Runtime@getRuntime().exec("id"))}';

const SIGNIFICANCE_ORDER = ["sandbox-escape", "execution", "reconnaissance", "structural"] as const;

const SIGNIFICANCE_LABEL: Record<string, string> = {
  "sandbox-escape": "Sandbox escape",
  execution: "Execution",
  reconnaissance: "Reconnaissance",
  structural: "Structure",
};

export default function OgnlInjectionDecoderTool() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<DecodeResult | null>(null);

  const run = (text: string) => {
    setInput(text);
    setResult(text.trim() ? decodeOgnl(text) : null);
  };

  return (
    <>
      <div className="dig-input-head">
        <button type="button" className="btn btn-secondary" onClick={() => run(EXAMPLE)}>
          Example
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            setInput("");
            setResult(null);
          }}
        >
          Clear
        </button>
      </div>

      <label className="cidr-label" htmlFor="ognl-input">
        Payload from a log entry
      </label>
      <textarea
        id="ognl-input"
        className="cidr-input mono saml-textarea"
        rows={5}
        spellCheck={false}
        value={input}
        placeholder="Paste the value your WAF or application logged. URL-decode it first if it arrived encoded."
        onChange={(e) => run(e.target.value)}
      />

      {result && (
        <>
          <div className="ztc-result">
            <h2 className="ztc-section-title">Reading</h2>
            <p className="ztc-notes">{result.summary}</p>
            {result.looksLikeOgnl && (
              <p className="tmsh-object-head mono">
                sandbox escape: {result.hasEscape ? "present" : "absent"} · execution:{" "}
                {result.hasExecution ? "present" : "absent"}
              </p>
            )}
          </div>

          {result.findings.length > 0 && (
            <div className="ztc-result">
              <h2 className="ztc-section-title">What is in it</h2>
              {SIGNIFICANCE_ORDER.map((sig) => {
                const group = result.findings.filter((f) => f.significance === sig);
                if (group.length === 0) return null;
                return (
                  <div key={sig}>
                    <p className="tmsh-object-head mono">{SIGNIFICANCE_LABEL[sig]}</p>
                    <ul className="lbm-facts">
                      {group.map((f, i) => (
                        <li className="ztc-notes" key={i}>
                          <strong>{f.label}</strong> &mdash; <span className="mono">{f.fragment}</span>
                          <br />
                          {f.meaning}
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
              <h2 className="ztc-section-title">Consistent with</h2>
              <ul className="lbm-facts">
                {result.advisories.map((a, i) => (
                  <li className="ztc-notes" key={i}>
                    <strong>{a.id}</strong> &mdash; {a.what}
                    <br />
                    <span className="mono">carried in: {a.vector}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Always visible. The most dangerous reading of this page is
              "no findings, therefore fine", and these are the sentences that
              prevent it. */}
          <div className="ztc-result">
            <h2 className="ztc-section-title">What this does not tell you</h2>
            <ul className="lbm-facts">
              {result.caveats.map((c, i) => (
                <li className="ztc-notes" key={i}>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <p className="cidr-privacy">
        Read locally in your browser. Nothing is sent anywhere, and nothing in the payload is
        evaluated &mdash; the tool recognises syntax and describes it.
      </p>
    </>
  );
}
