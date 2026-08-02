"use client";

// ============================================================================
// src/components/PingFederateOgnlExplainerTool.tsx
// ----------------------------------------------------------------------------
// UI for the PingFederate OGNL expression explainer.
//
// The context selector is not a convenience - it changes what the expression is
// SUPPOSED to return, and therefore which diagnostics are meaningful. A mapping
// yields a value; a criterion must yield a boolean. Getting that wrong is one
// of the more common configuration errors in the product, and a tool that did
// not ask would be unable to catch it.
//
// D-83: Example / Clear row, with a sample drawn from a golden vector.
// ============================================================================

import { useState } from "react";
import {
  explainExpression,
  type ExplainResult,
  type ExpressionContext,
} from "@/lib/tools/pingfederate-ognl-explainer";

const EXAMPLES: Record<ExpressionContext, string> = {
  "attribute-mapping": '#this.get("mail") == null ? "" : #this.get("mail").toString().toLowerCase()',
  "issuance-criterion": '#this.get("department").toString().contains("engineering")',
};

export default function PingFederateOgnlExplainerTool() {
  const [context, setContext] = useState<ExpressionContext>("attribute-mapping");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ExplainResult | null>(null);

  const run = (text: string, ctx: ExpressionContext) => {
    setInput(text);
    setContext(ctx);
    setResult(text.trim() ? explainExpression(text, ctx) : null);
  };

  return (
    <>
      <div className="dig-input-head">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => run(EXAMPLES[context], context)}
        >
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

      <label className="cidr-label" htmlFor="pf-ognl-context">
        Where the expression is used
      </label>
      <select
        id="pf-ognl-context"
        className="cidr-input mono"
        value={context}
        onChange={(e) => run(input, e.target.value as ExpressionContext)}
      >
        <option value="attribute-mapping">Attribute mapping &mdash; returns a value</option>
        <option value="issuance-criterion">Issuance criterion &mdash; returns true or false</option>
      </select>

      <label className="cidr-label" htmlFor="pf-ognl-input">
        Expression
      </label>
      <textarea
        id="pf-ognl-input"
        className="cidr-input mono saml-textarea"
        rows={4}
        spellCheck={false}
        value={input}
        placeholder='#this.get("mail") == null ? "" : #this.get("mail").toString().toLowerCase()'
        onChange={(e) => run(e.target.value, context)}
      />

      {result && (
        <>
          <div className="ztc-result">
            <h2 className="ztc-section-title">In this context</h2>
            <p className="ztc-notes">{result.expects}</p>
          </div>

          {result.parts.length > 0 ? (
            <div className="ztc-result">
              <h2 className="ztc-section-title">What it does</h2>
              <ul className="lbm-facts">
                {result.parts.map((p, i) => (
                  <li className="ztc-notes" key={i}>
                    <span className="mono">{p.fragment}</span>
                    <br />
                    {p.meaning}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="ztc-result">
              <h2 className="ztc-section-title">What it does</h2>
              <p className="ztc-notes">
                Nothing recognised. That may mean the expression uses a construct this tool does not
                know, or that what was pasted is not an expression at all.
              </p>
            </div>
          )}

          {result.diagnostics.length > 0 && (
            <div className="ztc-result">
              <h2 className="ztc-section-title">Worth checking</h2>
              <ul className="lbm-facts">
                {result.diagnostics.map((d, i) => (
                  <li className="ztc-notes" key={i}>
                    <span className="mono">{d.severity === "caution" ? "caution" : "note"}</span>
                    {" \u2014 "}
                    {d.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <p className="cidr-privacy">
        Read locally in your browser. The expression is parsed and described, never evaluated
        &mdash; which is the same reason the product itself puts expression authoring behind its own
        administrative role.
      </p>
    </>
  );
}
