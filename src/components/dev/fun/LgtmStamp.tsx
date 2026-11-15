// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

"use client";

// ============================================================================
// src/components/dev/fun/LgtmStamp.tsx
// ----------------------------------------------------------------------------
// THE LGTM STAMP, THE TOY (queue 5d extra (a), PRIME 14/11/2026 22:09). The
// reader pastes a diff or a configuration and presses Stamp; the checks in
// src/lib/fun/lgtm/stamp.ts read every line (only the added lines of a diff)
// and the stamp comes down: "LGTM" only when they found nothing, otherwise
// "Changes requested" with every finding and its line number. A wry line per
// verdict, picked from the text so the same text always gets the same one.
//
// Local and deterministic: nothing is sent, stored or remembered; a secret-
// shaped value is masked in its finding. The Example/Clear row follows the
// tools' D-83 shape, the example being a golden example of the checks, and the
// page opens with it already stamped so the first look shows what the toy
// does. The stamp's fall is a CSS animation that reduced motion turns off; the
// chime after an LGTM plays only when pressed (src/components/dev/fun/
// lgtmAudio.ts, which also lets an iPhone in silent mode play it).
// ============================================================================

import { useState } from "react";
import { useTranslations } from "next-intl";
import { stamp, STAMP_EXAMPLE, type StampResult } from "@/lib/fun/lgtm/stamp";
import { playChime } from "@/components/dev/fun/lgtmAudio";

/**
 * The toy: the text box, the Example/Clear/Stamp row, the stamp and the findings.
 *
 * @returns the toy
 */
export default function LgtmStamp() {
  // The words, from the page's namespace.
  const t = useTranslations("devFun.lgtmStamp");
  // The text in the box: the example, so the page opens on a working state.
  const [text, setText] = useState<string>(STAMP_EXAMPLE);
  // The last verdict: the example's, computed the same way on the server and in the browser.
  const [result, setResult] = useState<StampResult | null>(() => stamp(STAMP_EXAMPLE));
  // Bumped at every press, so the stamp falls again even on the same verdict.
  const [round, setRound] = useState(0);

  // Stamp the box's text.
  const onStamp = () => {
    // The checks.
    setResult(stamp(text));
    // A new fall.
    setRound((r) => r + 1);
  };

  // The verdict's wry line: one of four per verdict.
  const quip = result && result.verdict !== "empty" ? t(result.verdict === "lgtm" ? `quipLgtm${result.quip}` : `quipChanges${result.quip}`) : "";

  return (
    <div className="lgtm-stamp-toy">
      {/* The text box, with the Example and Clear buttons on its heading (D-83). */}
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="lgtm-stamp-input">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            {/* The example, verbatim from the checks' golden examples. */}
            <button type="button" className="b64-copy" onClick={() => setText(STAMP_EXAMPLE)}>
              {t("example")}
            </button>
            {/* An empty box and no verdict. */}
            <button
              type="button"
              className="b64-copy"
              onClick={() => {
                // The box emptied.
                setText("");
                // The verdict cleared.
                setResult(null);
              }}
            >
              {t("clear")}
            </button>
          </div>
        </div>
        <textarea
          id="lgtm-stamp-input"
          className="cidr-input jwt-input mono lgtm-stamp-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />
      </div>

      {/* The one action. */}
      <div className="lgtm-stamp-actions">
        <button type="button" className="fg-button fg-button-primary" onClick={onStamp}>
          {t("stamp")}
        </button>
      </div>

      {/* The verdict, announced to screen readers when it changes. */}
      <div className="lgtm-stamp-result" aria-live="polite">
        {result?.verdict === "empty" && <p className="lgtm-stamp-empty">{t("empty")}</p>}
        {result && result.verdict !== "empty" && (
          <>
            {/* The stamp: keyed by the press, so it falls again each time. */}
            <p key={round} className={`lgtm-stamp-mark ${result.verdict === "lgtm" ? "lgtm-stamp-mark-ok" : "lgtm-stamp-mark-no"}`}>
              {result.verdict === "lgtm" ? t("verdictLgtm") : t("verdictChanges")}
            </p>
            {/* The wry line. */}
            <p className="lgtm-stamp-quip">{quip}</p>
            {/* How it read the text. */}
            {result.diff && <p className="lgtm-stamp-meta">{t("diffNote")}</p>}
            {/* The findings, counted and listed in line order. */}
            {result.findings.length > 0 && (
              <>
                <p className="lgtm-stamp-meta">{t("count", { n: result.findings.length })}</p>
                <ol className="lgtm-stamp-findings">
                  {result.findings.map((f, i) => (
                    <li key={`${f.line}-${f.kind}-${i}`} className="lgtm-stamp-finding">
                      {/* Where: a line number, or the whole text for the missing final newline. */}
                      <span className="lgtm-stamp-where fg-mono">{f.line === 0 ? t("wholeText") : t("lineN", { n: f.line })}</span>
                      {/* What. */}
                      <span className="lgtm-stamp-what">{t(`kind.${f.kind}`)}</span>
                      {/* The line itself, shortened, secrets masked. */}
                      {f.excerpt && <code className="lgtm-stamp-excerpt">{f.excerpt}</code>}
                    </li>
                  ))}
                </ol>
              </>
            )}
            {/* After an LGTM, the green-check chime on request. */}
            {result.verdict === "lgtm" && (
              <button type="button" className="fg-button" onClick={() => playChime()}>
                {t("chime")}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
