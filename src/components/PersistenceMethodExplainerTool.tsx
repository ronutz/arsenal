"use client";

// ============================================================================
// src/components/PersistenceMethodExplainerTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE BIG-IP PERSISTENCE EXPLAINER.
//
// Paste persistence profiles and/or virtual servers and get, live: each
// virtual's primary -> fallback persistence chain with plain-English notes,
// then each profile's method, what it keys on, how it behaves, its annotated
// fields, and the failure modes to watch for. Parsing runs in the browser.
//
// SHARE RESULTS (2026-10-27): a button at the head of the reading builds,
// only when pressed, a link carrying the configuration with every secret
// setting's value (a cookie encryption pass phrase above all) replaced by
// [redacted], through the tmsh explainer's copy (spec:
// src/lib/tools/f5-persistence-method-explainer/share.ts); the popover says
// how many were, and that iRule bodies go as pasted when there are any. An
// arriving link (useShareArrival) fills the box as a paste would; the address
// loses the value at once.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { run } from "@/lib/tools/f5-persistence-method-explainer";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what a spec encodes
import { PERSISTENCE_SHARE } from "@/lib/tools/f5-persistence-method-explainer/share"; // this tool's share spec: the configuration, secrets replaced
import { shareableTmsh } from "@/lib/tools/f5-tmsh-config-explainer/compute"; // the counts the popover gives

// D-83 Example samples — verbatim from this tool's golden vectors.
const EXAMPLE = "ltm persistence cookie c1 {\n    defaults-from cookie\n    cookie-name BIGipServer_app\n    method insert\n}";

/** Nothing to share (the button is disabled): a constant, so the button sees no change. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" };

export default function PersistenceMethodExplainerTool() {
  const t = useTranslations("tools.f5-persistence-method-explainer");
  const [input, setInput] = useState("");

  const result = useMemo(() => (input.trim() ? run(input) : null), [input]);
  const hasOutput = result && (result.methods.length > 0 || result.chains.length > 0);
  // An arriving share link: the copy fills the box as a paste would.
  useShareArrival(PERSISTENCE_SHARE, (state) => setInput(state.input)); // the copy
  // What Share results may carry: the copy with every secret value replaced, only while there is a reading.
  const share = useMemo<ShareEncoding>(() => (hasOutput ? PERSISTENCE_SHARE.encode({ input }) : NOTHING), [hasOutput, input]); // memoised
  // How many values the copy replaces and how many iRule bodies it keeps as pasted, for the popover (a cheap linear pass).
  const copy = useMemo(() => (hasOutput ? shareableTmsh(input) : null), [hasOutput, input]); // the counts
  // The popover's lines under the first: the count, then the iRule note when there is an iRule.
  const shareDetails = copy ? [t("share.redacted", { n: copy.redacted }), ...(copy.irules > 0 ? [t("share.irules", { n: copy.irules })] : [])] : []; // at most two short lines

  return (
    <div className="cidr-tool jwt-tool saml-tool json-tool tmsh-tool persist-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="persist-input">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
          </div>
        </div>
        <textarea
          id="persist-input"
          className="cidr-input mono saml-textarea json-input tmsh-input"
          rows={10}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("inputPlaceholder")}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-describedby="persist-privacy"
        />
        <p id="persist-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            ●
          </span>
          {t("runsLocally")}
        </p>
      </div>

      {result && !result.ok && result.error && (
        <div className="json-error-box" role="alert">
          <p className="json-error-headline">{t("errorTitle")}</p>
          {result.error.line !== undefined && <p className="json-error-location">{t("lineLabel", { line: result.error.line })}</p>}
          <p className="json-error-message">{result.error.message}</p>
        </div>
      )}

      {result && result.ok && !hasOutput && <p className="tmsh-empty">{t("emptyState")}</p>}

      {hasOutput && (
        <div className="tmsh-results">
          {/* Share results: at the head of the reading (chains, then profiles), at the start of its own row. */}
          <div className="rdap-ask-row">
            <ShareResultsButton encoding={share} carries={t("share.carries", { mark: "[redacted]" })} details={shareDetails} title={t("name")} />
          </div>
          {result.chains.length > 0 && (
            <section className="persist-section">
              <h3 className="persist-heading">{t("chainsHeading")}</h3>
              {result.chains.map((c, i) => (
                <article className="tmsh-object persist-chain" key={i}>
                  <header className="tmsh-object-head">
                    <span className="tmsh-type-badge">ltm virtual</span>
                    <span className="tmsh-object-name mono">{c.virtualName}</span>
                    <span className="tmsh-object-line">{t("lineLabel", { line: c.line })}</span>
                  </header>
                  <div className="persist-flow">
                    <span className="persist-step">
                      <span className="persist-role">{t("primaryLabel")}</span>
                      {c.primary ? (
                        <>
                          <span className="persist-method-badge">{c.primary.label}</span>
                          <span className="persist-profile mono">{c.primary.name}</span>
                        </>
                      ) : (
                        <span className="persist-method-badge persist-none">{t("noneLabel")}</span>
                      )}
                    </span>
                    <span className="persist-arrow" aria-hidden="true">
                      →
                    </span>
                    <span className="persist-step">
                      <span className="persist-role">{t("fallbackLabel")}</span>
                      {c.fallback ? (
                        <>
                          <span className="persist-method-badge">{c.fallback.label}</span>
                          <span className="persist-profile mono">{c.fallback.name}</span>
                        </>
                      ) : (
                        <span className="persist-method-badge persist-none">{t("noneLabel")}</span>
                      )}
                    </span>
                  </div>
                  {c.notes.length > 0 && (
                    <ul className="persist-notes">
                      {c.notes.map((n, j) => (
                        <li key={j}>{n}</li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </section>
          )}

          {result.methods.length > 0 && (
            <section className="persist-section">
              <h3 className="persist-heading">{t("profilesHeading")}</h3>
              {result.methods.map((m, i) => (
                <article className="tmsh-object" key={i}>
                  <header className="tmsh-object-head">
                    <span className="tmsh-type-badge">{m.methodType || t("unknownMethod")}</span>
                    <span className="tmsh-object-name mono">{m.profileName}</span>
                    {!m.known && <span className="tmsh-unknown-tag">{t("notExplained")}</span>}
                    <span className="tmsh-object-line">{t("lineLabel", { line: m.line })}</span>
                  </header>

                  <p className="persist-method-title">{m.label}</p>
                  {m.keysOn && (
                    <p className="persist-keys">
                      <span className="persist-keys-label">{t("keysOnLabel")}</span> {m.keysOn}
                    </p>
                  )}
                  <p className="tmsh-summary">{m.howItWorks}</p>
                  {m.goodFor && (
                    <p className="persist-goodfor">
                      <span className="persist-keys-label">{t("goodForLabel")}</span> {m.goodFor}
                    </p>
                  )}

                  {m.fields.length > 0 && (
                    <dl className="tmsh-fields">
                      {m.fields.map((f, j) => (
                        <div className="tmsh-field" key={j}>
                          <dt className="tmsh-field-key">
                            <code>{f.key}</code>
                            {f.value && <span className="tmsh-field-value mono">{f.value}</span>}
                            {f.block && <span className="tmsh-block-tag">{t("blockTag")}</span>}
                          </dt>
                          {f.note && <dd className="tmsh-field-note">{f.note}</dd>}
                        </div>
                      ))}
                    </dl>
                  )}

                  {m.caveats.length > 0 && (
                    <section className="json-warn-box tmsh-notes">
                      <p className="json-warn-headline">{t("caveatsHeading")}</p>
                      <ul className="json-warn-list">
                        {m.caveats.map((cav, j) => (
                          <li key={j}>{cav}</li>
                        ))}
                      </ul>
                    </section>
                  )}
                </article>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
