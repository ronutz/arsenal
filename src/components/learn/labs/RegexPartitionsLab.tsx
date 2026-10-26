"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/RegexPartitionsLab.tsx
// ----------------------------------------------------------------------------
// THE REGEX PARTITIONS LAB (2026-10-26), embedded in "Catastrophic
// Backtracking and ReDoS" as <Lab id="regex-partitions" />. One number input
// (how many a's come before the "!"); the result is the input string, the
// number of ways (a+)+ can split the run and the number with one more a, a
// step-by-step account of the count, and, for short runs, every split written
// out. The lab counts; it never runs a regular expression, so no setting can
// make the page slow. The model is src/lib/labs/regex-partitions/compute.ts;
// its checked cases are the golden vectors beside it.
// Words: "learnLabs.regex-partitions".
// ============================================================================

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import LabFrame, { LabField } from "./LabFrame";
import { compute, DEFAULT_INPUT, EXAMPLE_INPUT, MAX_LENGTH, MIN_LENGTH, RegexPartitionsError, type RegexPartitionsResult } from "@/lib/labs/regex-partitions/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "regex-partitions";

/** Read a typed number, accepting a decimal comma; an empty field is not a number. */
function readNumber(s: string): number {
  // Blank means nothing was entered.
  return s.trim() === "" ? Number.NaN : Number(s.trim().replace(",", "."));
}

export default function RegexPartitionsLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.regex-partitions");
  // The page's language, for number formatting.
  const locale = useLocale();
  // The reader's setting as typed, opening on four a's.
  const [length, setLength] = useState<string>(String(DEFAULT_INPUT.length));
  // Whole numbers with the page's grouping.
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });

  // The model's answer, or null when it refused the input.
  let r: RegexPartitionsResult | null = null;
  // Run the pure model on the parsed field.
  try {
    // Parse and compute.
    r = compute({ length: readNumber(length) });
  } catch (e) {
    // Only the model's own refusal is expected here; anything else is a bug and must surface.
    if (!(e instanceof RegexPartitionsError)) throw e;
  }

  /** The result block for a valid input. */
  const resultBlock = (res: RegexPartitionsResult) => {
    // The number of a's, back from the gaps.
    const n = res.gaps + 1;
    // Step 2: the count, worded for one a or for several.
    const splitsLine = res.gaps === 0 ? t("splitsOne") : t("splitsLine", { gaps: res.gaps, splits: nf.format(res.splits) });
    // The verdict: never a match, and the price of one more a.
    const verdict = res.gaps === 0 ? t("verdictOne") : t("verdict", { splits: nf.format(res.splits), next: nf.format(res.nextSplits) });
    return (
      <>
        {/* The input and the two counts. */}
        <dl className="lab-kv">
          <dt>{t("kvSubject")}</dt>
          <dd>
            <code>{res.subject}</code>
          </dd>
          <dt>{t("kvSplits")}</dt>
          <dd>{nf.format(res.splits)}</dd>
          <dt>{t("kvNext")}</dt>
          <dd>{nf.format(res.nextSplits)}</dd>
        </dl>
        {/* How the count is reached. */}
        <ol className="lab-steps">
          <li className="lab-step">
            <span className="lab-step-where">{t("stepGaps")}</span> {t("gapsLine", { n, gaps: res.gaps })}
          </li>
          <li className="lab-step">
            <span className="lab-step-where">{t("stepSplits")}</span> {splitsLine}
          </li>
          <li className="lab-step">
            <span className="lab-step-where">{t("stepVerdict")}</span> <span className="lab-verdict lab-verdict--warn">{verdict}</span>
          </li>
        </ol>
        {/* Every split, while the list is short. */}
        {res.listed && (
          <>
            <p className="lab-note">{t("listHeading")}</p>
            <ul>
              {res.listed.map((s) => (
                <li key={s}>
                  <code>{s}</code>
                </li>
              ))}
            </ul>
          </>
        )}
        {/* The structural fix. */}
        <p className="lab-note">{t("noteFix")}</p>
      </>
    );
  };

  return (
    <LabFrame
      labId={ID}
      controls={
        <LabField id={`${ID}-length`} label={t("length")}>
          <input id={`${ID}-length`} className="lab-input" type="number" inputMode="decimal" min={MIN_LENGTH} max={MAX_LENGTH} step={1} value={length} aria-invalid={r ? undefined : "true"} onChange={(e) => setLength(e.target.value)} />
        </LabField>
      }
      result={r ? resultBlock(r) : <p className="lab-error">{t("errorLength", { min: MIN_LENGTH, max: MAX_LENGTH })}</p>}
      onExample={() => setLength(String(EXAMPLE_INPUT.length))}
      onReset={() => setLength(String(DEFAULT_INPUT.length))}
      scope={t("scope")}
    />
  );
}
