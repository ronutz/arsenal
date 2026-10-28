"use client";

// ============================================================================
// src/components/TmshConfigExplainerTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE bigip.conf EXPLAINER.
//
// Paste a tmsh configuration snippet and get, live: a count of the objects
// found, then a card per object with its type, name, a plain-English summary,
// an annotated field breakdown, any operational observations, and, for iRules,
// the verbatim Tcl body. Parsing runs IN THE BROWSER via the local module.
//
// SHARE RESULTS (2026-10-27): a button under the summary of what was found
// builds, only when pressed, a link carrying the configuration with every
// secret setting's value replaced by [redacted] (spec:
// src/lib/tools/f5-tmsh-config-explainer/share.ts); the popover says how many
// were, and that iRule bodies go as pasted when there are any. An arriving
// link (useShareArrival) fills the box as a paste would; the address loses
// the value at once.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { explainConfig, parseTmsh } from "@/lib/tools/f5-tmsh-config-explainer";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what a spec encodes
import { TMSH_CONFIG_SHARE } from "@/lib/tools/f5-tmsh-config-explainer/share"; // this tool's share spec: the configuration, secrets replaced
import { shareableTmsh } from "@/lib/tools/f5-tmsh-config-explainer/compute"; // the counts the popover gives

// D-83 Example samples — verbatim from this tool's golden vectors.
const EXAMPLE = "ltm virtual vip {\n    destination 10.0.0.9:443\n    ip-protocol tcp\n    pool web_pool\n    profiles { tcp { } http { } }\n}";

/** Nothing to share (the button is disabled): a constant, so the button sees no change. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" };

export default function TmshConfigExplainerTool() {
  const t = useTranslations("tools.f5-tmsh-config-explainer");
  const [input, setInput] = useState("");

  const result = useMemo(() => (input.trim() ? explainConfig(parseTmsh(input)) : null), [input]);
  // An arriving share link: the copy fills the box as a paste would.
  useShareArrival(TMSH_CONFIG_SHARE, (state) => setInput(state.input)); // the copy
  // Whether there is an explanation to share: at least one object read.
  const explained = !!result && result.objects.length > 0; // the cards are shown
  // What Share results may carry: the copy with every secret value replaced, only while something is explained.
  const share = useMemo<ShareEncoding>(() => (explained ? TMSH_CONFIG_SHARE.encode({ input }) : NOTHING), [explained, input]); // memoised
  // How many values the copy replaces and how many iRule bodies it keeps as pasted, for the popover (a cheap linear pass).
  const copy = useMemo(() => (explained ? shareableTmsh(input) : null), [explained, input]); // the counts
  // The popover's lines under the first: the count, then the iRule note when there is an iRule.
  const shareDetails = copy ? [t("share.redacted", { n: copy.redacted }), ...(copy.irules > 0 ? [t("share.irules", { n: copy.irules })] : [])] : []; // at most two short lines

  return (
    <div className="cidr-tool jwt-tool saml-tool json-tool tmsh-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="tmsh-input">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
          </div>
        </div>
        <textarea
          id="tmsh-input"
          className="cidr-input mono saml-textarea json-input tmsh-input"
          rows={10}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("inputPlaceholder")}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-describedby="tmsh-privacy"
        />
        <p id="tmsh-privacy" className="cidr-privacy">
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

      {result && result.objects.length === 0 && result.ok && <p className="tmsh-empty">{t("emptyState")}</p>}

      {result && result.objects.length > 0 && (
        <div className="tmsh-results">
          <div className="tmsh-summary-row" aria-label={t("summaryLabel")}>
            {Object.entries(result.counts).map(([type, n]) => (
              <span className="tmsh-chip" key={type}>
                <strong>{String(n)}</strong> {type || t("unknownType")}
              </span>
            ))}
          </div>

          {/* Share results: under the summary of what was found, at the start of its own row. */}
          <div className="rdap-ask-row">
            <ShareResultsButton encoding={share} carries={t("share.carries", { mark: "[redacted]" })} details={shareDetails} title={t("name")} />
          </div>

          {result.objects.map((o, idx) => (
            <article className="tmsh-object" key={idx}>
              <header className="tmsh-object-head">
                <span className="tmsh-type-badge">{o.type || t("unknownType")}</span>
                <span className="tmsh-object-name mono">{o.name}</span>
                {!o.known && <span className="tmsh-unknown-tag">{t("notExplained")}</span>}
                <span className="tmsh-object-line">{t("lineLabel", { line: o.line })}</span>
              </header>

              <p className="tmsh-summary">{o.summary}</p>

              {o.isIRule ? (
                <>
                  <p className="tmsh-irule-label">{t("iruleLabel")}</p>
                  <pre className="json-output mono tmsh-verbatim" aria-label={t("iruleLabel")}>
                    {(o.verbatim ?? "").replace(/^\n+/, "").replace(/\s+$/, "")}
                  </pre>
                </>
              ) : (
                o.fields.length > 0 && (
                  <dl className="tmsh-fields">
                    {o.fields.map((f, i) => (
                      <div className="tmsh-field" key={i}>
                        <dt className="tmsh-field-key">
                          <code>{f.key}</code>
                          {f.value && <span className="tmsh-field-value mono">{f.value}</span>}
                          {f.block && <span className="tmsh-block-tag">{t("blockTag")}</span>}
                        </dt>
                        {f.note && <dd className="tmsh-field-note">{f.note}</dd>}
                      </div>
                    ))}
                  </dl>
                )
              )}

              {o.notes.length > 0 && (
                <section className="json-warn-box tmsh-notes">
                  <p className="json-warn-headline">{t("notesHeading")}</p>
                  <ul className="json-warn-list">
                    {o.notes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </section>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
