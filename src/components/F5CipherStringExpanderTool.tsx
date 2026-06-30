"use client";

// ============================================================================
// src/components/F5CipherStringExpanderTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE F5 CIPHER-STRING EXPLAINER.
//
// Paste an F5 cipher string (or a pre-built rule name) and get, live: a
// security read (forward secrecy, good exclusions, weak choices), then each
// cipher set in order with its operator and every keyword explained and colored
// by strength. An honest note states what this does and does not do. Parsing
// runs in the browser.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { run, type Operator } from "@/lib/tools/f5-cipher-string-expander";

export default function F5CipherStringExpanderTool() {
  const t = useTranslations("tools.f5-cipher-string-expander");
  const [input, setInput] = useState("");

  const result = useMemo(() => (input.trim() ? run(input) : null), [input]);

  const opLabel = (op: Operator): string =>
    op === "exclude" ? t("opExclude") : op === "delete" ? t("opDelete") : op === "lower-priority" ? t("opLowerPriority") : op === "sort" ? t("opSort") : t("opInclude");

  return (
    <div className="cidr-tool jwt-tool saml-tool json-tool tmsh-tool cipherstr-tool">
      <div className="cidr-input-row">
        <label className="cidr-label" htmlFor="cipherstr-input">
          {t("inputLabel")}
        </label>
        <textarea
          id="cipherstr-input"
          className="cidr-input mono saml-textarea json-input cipherstr-input"
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("inputPlaceholder")}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-describedby="cipherstr-privacy"
        />
        <p id="cipherstr-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            ●
          </span>
          {t("runsLocally")}
        </p>
        <p className="cipherstr-scope">{t("expansionNote")}</p>
      </div>

      {result && !result.ok && result.error && (
        <div className="json-error-box" role="alert">
          <p className="json-error-headline">{t("errorTitle")}</p>
          <p className="json-error-message">{result.error.message}</p>
        </div>
      )}

      {result && result.ok && (
        <div className="tmsh-results">
          {result.expandedFromRule && (
            <p className="cipherstr-ruleexp">
              {t("ruleExpands", { name: result.expandedFromRule.name })} <code className="mono">{result.expandedFromRule.cipher}</code>
            </p>
          )}

          <section className="cipherstr-security">
            <div className="cipherstr-secrow">
              <h3 className="persist-heading">{t("securityHeading")}</h3>
              <span className={`cipherstr-pfs ${result.pfs ? "cipherstr-pfs-yes" : "cipherstr-pfs-no"}`}>{result.pfs ? t("pfsYes") : t("pfsNo")}</span>
            </div>
            {result.positives.length > 0 && (
              <div className="cipherstr-good">
                <p className="cipherstr-good-head">{t("goodHeading")}</p>
                <ul className="cipherstr-list">
                  {result.positives.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.concerns.length > 0 && (
              <div className="json-warn-box cipherstr-concerns">
                <p className="json-warn-headline">{t("concernsHeading")}</p>
                <ul className="json-warn-list">
                  {result.concerns.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="persist-section">
            <h3 className="persist-heading">{t("setsHeading")}</h3>
            <ol className="cipherstr-sets">
              {result.sets.map((s, i) => (
                <li className="cipherstr-set" key={i}>
                  <div className="cipherstr-set-head">
                    <span className={`cipherstr-op cipherstr-op-${s.operator}`}>{opLabel(s.operator)}</span>
                    <code className="cipherstr-raw mono">{s.raw}</code>
                  </div>
                  {s.keywords.length > 0 && (
                    <div className="cipherstr-kws">
                      {s.keywords.map((k, j) => (
                        <span className={`cipherstr-kw cipherstr-kw-${k.security}${k.known ? "" : " cipherstr-kw-unknown"}`} key={j} title={k.note}>
                          <span className="cipherstr-kw-text mono">{k.text}</span>
                          <span className="cipherstr-kw-label">{k.known ? k.label : t("notRecognized")}</span>
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="cipherstr-summary">{s.summary}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </div>
  );
}
