"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/ExpectBufferMatchingLab.tsx
// ----------------------------------------------------------------------------
// THE EXPECT BUFFER-MATCHING LAB (2026-10-27), embedded in "Expect's patterns
// and its buffer" as <Lab id="expect-buffer-matching" />. The reader types a
// program's output, says whether it comes through a terminal and how it
// arrives, and writes up to four patterns (glob, -re or -ex, each with or
// without -nocase) as Expect receives them. The result: each pattern tried in
// order, the one that matched and when, expect_out(0,string), the groups,
// expect_out(buffer) and what the next expect finds; or that expect keeps
// waiting. The model is src/lib/labs/expect-buffer-matching/compute.ts (with
// are.ts for -re); its checked cases are the golden vectors beside it.
// Words: "learnLabs.expect-buffer-matching".
// ============================================================================

import { Fragment, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import LabFrame, { LabField, LabSelect } from "./LabFrame";
import { BufferMatchError, compute, DEFAULT_INPUT, EXAMPLE_INPUT, OUTPUT_MAX, PATTERN_MAX, type Arrival, type BufferMatchInput, type BufferMatchResult, type PatternKind } from "@/lib/labs/expect-buffer-matching/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "expect-buffer-matching";

/** Control characters made visible: \r, \n, \t; a printable character as itself. */
function visible(text: string): string {
  // Each control character becomes its escape.
  return text.replace(/[\x00-\x1f\x7f]/g, (c) => (c === "\r" ? "\\r" : c === "\n" ? "\\n" : c === "\t" ? "\\t" : "\\x" + c.charCodeAt(0).toString(16).padStart(2, "0")));
}

/** A deep copy of a model input, so the form never shares rows with the constants. */
function copy(i: BufferMatchInput): BufferMatchInput {
  // The rows copied one by one.
  return { ...i, patterns: i.patterns.map((r) => ({ ...r })) };
}

export default function ExpectBufferMatchingLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.expect-buffer-matching");
  // The page's language, for numbers.
  const locale = useLocale();
  // The settings, opening on the default.
  const [input, setInput] = useState<BufferMatchInput>(copy(DEFAULT_INPUT));
  // Whole numbers with the page's grouping.
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });

  // The model's answer, or its refusal.
  let r: BufferMatchResult | null = null;
  let refusal: BufferMatchError | null = null;
  try {
    // Run the model.
    r = compute(input);
  } catch (e) {
    // Only the model's refusal is expected; anything else is a bug and must surface.
    if (!(e instanceof BufferMatchError)) throw e;
    refusal = e;
  }

  /** Change one field of one row. */
  const setRow = (i: number, patch: Partial<BufferMatchInput["patterns"][number]>) => {
    // A new list with the row patched.
    setInput((cur) => ({ ...cur, patterns: cur.patterns.map((row, k) => (k === i ? { ...row, ...patch } : row)) }));
  };

  /** A value in code, or the word for empty. */
  const code = (v: string) => (v === "" ? <span>{t("emptyValue")}</span> : <code>{visible(v)}</code>);

  /** The refusal's sentence. */
  const refusalText = (e: BufferMatchError) => {
    // The row, counted from 1.
    const row = e.row === null ? 0 : e.row + 1;
    // -re refusals carry Tcl's reason or the construct.
    if (e.code === "re-invalid") return t("error.re-invalid", { row, reason: e.detail ?? "" });
    if (e.code === "re-not-modelled") return t("error.re-not-modelled", { row, what: t(`construct.${e.detail}`) });
    // The others by code.
    return t(`error.${e.code}`, { row, max: e.code === "output-too-long" ? OUTPUT_MAX : PATTERN_MAX });
  };

  /** The result block. */
  const resultBlock = (res: BufferMatchResult) => {
    // The used rows' trial lines, keyed by row.
    const trial = new Map(res.trials.map((x) => [x.row, x]));
    return (
      <>
        {/* What expect reads, after the terminal. */}
        <dl className="lab-kv">
          <dt>{t("kvBuffer")}</dt>
          <dd>{code(res.buffer)}</dd>
        </dl>
        {/* Each used row, in the order expect tries them. */}
        <div className="lab-table-wrap">
          <table className="lab-table">
            <thead>
              <tr>
                <th scope="col">{t("colRow")}</th>
                <th scope="col">{t("colPattern")}</th>
                <th scope="col">{t("colResult")}</th>
              </tr>
            </thead>
            <tbody>
              {input.patterns.map((row, i) => {
                // Unused rows are not listed.
                if (row.text === "") return null;
                // This row's trial at the deciding moment.
                const tr = trial.get(i);
                return (
                  <tr key={i}>
                    <th scope="row">{i + 1}</th>
                    <td>
                      <code>{`${row.nocase ? "-nocase " : ""}${row.kind === "glob" ? "" : `-${row.kind} `}${row.text}`}</code>
                    </td>
                    <td>{!tr ? t("notTried") : !tr.matched ? t("noMatch") : tr.start === tr.end ? t("matchEmpty", { at: nf.format(tr.start) }) : t("matchAt", { from: nf.format(tr.start + 1), to: nf.format(tr.end) })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* The verdict. */}
        <p>
          {res.winner === null ? (
            <span className="lab-verdict lab-verdict--warn">{t("verdictNone")}</span>
          ) : (
            <span className="lab-verdict lab-verdict--ok">{res.arrived === 0 ? t("verdictBefore", { row: res.winner + 1 }) : t("verdictMatch", { row: res.winner + 1, arrived: nf.format(res.arrived), total: nf.format(res.buffer.length) })}</span>
          )}
        </p>
        {/* expect_out and what is left. */}
        {res.winner !== null && res.match !== null && (
          <dl className="lab-kv">
            <dt>
              <code>expect_out(0,string)</code>
            </dt>
            <dd>{code(res.match)}</dd>
            {res.groups.map((g, k) => (
              <Fragment key={k}>
                <dt>
                  <code>{`expect_out(${k + 1},string)`}</code>
                </dt>
                <dd>{code(g)}</dd>
              </Fragment>
            ))}
            <dt>
              <code>expect_out(buffer)</code>
            </dt>
            <dd>{code(res.expectOutBuffer ?? "")}</dd>
            <dt>{t("kvLeft")}</dt>
            <dd>{code(res.left)}</dd>
          </dl>
        )}
        {/* The notes. */}
        {res.winner !== null && res.arrived === 0 && <p className="lab-note">{t("noteBefore")}</p>}
        {res.winner === null && <p className="lab-note">{t("noteWaiting")}</p>}
        {res.emptyAtStart && <p className="lab-note">{t("noteEmptyAtStart")}</p>}
        {res.backslashLetterRows.map((row) => (
          <p className="lab-note" key={`bl-${row}`}>
            {t("noteBackslashLetter", { row: row + 1 })}
          </p>
        ))}
        {res.nocaseBracketRows.map((row) => (
          <p className="lab-note" key={`nb-${row}`}>
            {t("noteNocaseBracket", { row: row + 1 })}
          </p>
        ))}
      </>
    );
  };

  return (
    <LabFrame
      labId={ID}
      controls={
        <>
          <LabField id={`${ID}-output`} label={t("output")}>
            <textarea id={`${ID}-output`} className="lab-input mono" rows={4} spellCheck={false} maxLength={OUTPUT_MAX + 1} value={input.output} aria-invalid={refusal && (refusal.code === "output-too-long" || refusal.code === "bad-output-char") ? "true" : undefined} onChange={(e) => setInput((cur) => ({ ...cur, output: e.target.value }))} />
          </LabField>
          <LabField id={`${ID}-arrival`} label={t("arrival")}>
            <LabSelect
              id={`${ID}-arrival`}
              value={input.arrival}
              options={[
                ["waiting", t("arrivalWaiting")],
                ["one-read", t("arrivalOneRead")],
                ["per-char", t("arrivalPerChar")],
              ]}
              onChange={(v) => setInput((cur) => ({ ...cur, arrival: v as Arrival }))}
            />
          </LabField>
          <label className="lab-input-row" htmlFor={`${ID}-pty`}>
            <input id={`${ID}-pty`} type="checkbox" checked={input.pty} onChange={(e) => setInput((cur) => ({ ...cur, pty: e.target.checked }))} />
            <span>{t("pty")}</span>
          </label>
          {/* The patterns, one row each, in the order the expect command lists them. */}
          <div className="lab-table-wrap">
            <table className="lab-table">
              <caption className="lab-label">{t("patternsCaption")}</caption>
              <thead>
                <tr>
                  <th scope="col">{t("colRow")}</th>
                  <th scope="col">{t("colKind")}</th>
                  <th scope="col">{t("colNocase")}</th>
                  <th scope="col">{t("colPattern")}</th>
                </tr>
              </thead>
              <tbody>
                {input.patterns.map((row, i) => (
                  <tr key={i}>
                    <th scope="row">{i + 1}</th>
                    <td>
                      <LabSelect
                        id={`${ID}-kind-${i + 1}`}
                        value={row.kind}
                        options={[
                          ["glob", t("kindGlob")],
                          ["re", "-re"],
                          ["ex", "-ex"],
                        ]}
                        onChange={(v) => setRow(i, { kind: v as PatternKind })}
                      />
                    </td>
                    <td>
                      <input id={`${ID}-nocase-${i + 1}`} type="checkbox" aria-label={t("nocaseLabel", { row: i + 1 })} checked={row.nocase} onChange={(e) => setRow(i, { nocase: e.target.checked })} />
                    </td>
                    <td>
                      <input id={`${ID}-pattern-${i + 1}`} className="lab-input mono" type="text" autoComplete="off" spellCheck={false} aria-label={t("patternLabel", { row: i + 1 })} maxLength={PATTERN_MAX + 1} value={row.text} aria-invalid={refusal && refusal.row === i ? "true" : undefined} onChange={(e) => setRow(i, { text: e.target.value })} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      }
      result={r ? resultBlock(r) : <p className="lab-error">{refusalText(refusal as BufferMatchError)}</p>}
      onExample={() => setInput(copy(EXAMPLE_INPUT))}
      onReset={() => setInput(copy(DEFAULT_INPUT))}
      scope={t("scope")}
    />
  );
}
