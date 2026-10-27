"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/TclSubstitutionLab.tsx
// ----------------------------------------------------------------------------
// THE TCL SUBSTITUTION LAB (2026-10-27), embedded in "Tcl for Expect writers"
// as <Lab id="tcl-substitution" />. One line of Tcl, typed or picked from a
// menu of cases; the result is the line's words, one row each: as written, how
// (bare, double quotes, braces, {*}), the substitutions Tcl made in it, and the
// value; then the arguments the command receives, Tcl's error when it would
// stop (its own message), and notes for Expect writers. The lab's variables are
// listed under the controls. The model is src/lib/labs/tcl-substitution/
// compute.ts; its checked cases are the golden vectors beside it.
// Words: "learnLabs.tcl-substitution".
// ============================================================================

import { Fragment, useState } from "react";
import { useTranslations } from "next-intl";
import LabFrame, { LabField, LabSelect } from "./LabFrame";
import { ARRAYS, compute, DEFAULT_INPUT, EXAMPLE_INPUT, LINE_MAX, PRESETS, TclSubstError, VARIABLES, visible, type Part, type TclSubstResult, type TclWord } from "@/lib/labs/tcl-substitution/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "tcl-substitution";

/** The menu value for a line the reader typed. */
const CUSTOM = "custom";

export default function TclSubstitutionLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.tcl-substitution");
  // The line as typed, opening on the default.
  const [line, setLine] = useState<string>(DEFAULT_INPUT.line);

  // The model's answer, or the refusal's code.
  let r: TclSubstResult | null = null;
  let refused: string | null = null;
  try {
    // Read the line.
    r = compute({ line });
  } catch (e) {
    // Only the model's refusal is expected; anything else is a bug and must surface.
    if (!(e instanceof TclSubstError)) throw e;
    refused = e.code;
  }

  /** How a word was written, in words. */
  const how = (w: TclWord) => t(w.expand ? `how.expand-${w.written}` : `how.${w.written}`);

  /** One substitution, in words. */
  const partText = (p: Part) => {
    // A variable and its value.
    if (p.kind === "var") return t("part.var", { raw: p.raw, value: visible(p.value) });
    // A backslash sequence and what it stands for: the common control characters by name, others as their escape.
    if (p.kind === "backslash") {
      if (p.text === "\r") return t("part.cr", { raw: p.raw });
      if (p.text === "\n") return t("part.lf", { raw: p.raw });
      if (p.text === "\t") return t("part.tab", { raw: p.raw });
      if (/[\x00-\x1f\x7f]/.test(p.text)) return t("part.control", { raw: p.raw, value: visible(p.text) });
      return t("part.backslash", { raw: p.raw, value: p.text });
    }
    // A command substitution.
    if (p.kind === "cmd") return p.name === null ? t("part.cmdUnknownName", { raw: p.raw }) : t("part.cmd", { raw: p.raw, name: p.name });
    // Plain text is not a substitution.
    return null;
  };

  /** The substitutions in a word, or a sentence saying there were none. */
  const substitutions = (w: TclWord) => {
    // Braces substitute nothing.
    if (w.written === "braced") return [t("part.none")];
    // The substituting pieces.
    const list = w.parts.map(partText).filter((x): x is string => x !== null);
    // None at all.
    return list.length ? list : [t("part.none")];
  };

  /** A value for display: visible control characters, or the sentence for a command's result. */
  const shown = (v: string | null) => (v === null ? t("fromCommand") : v === "" ? t("emptyValue") : visible(v));

  /** The result block. */
  const resultBlock = (res: TclSubstResult) => {
    // An empty line.
    if (res.kind === "empty") return <p className="lab-note">{t("empty")}</p>;
    // A comment line.
    if (res.kind === "comment") return <p className="lab-verdict lab-verdict--ok">{t("comment")}</p>;
    return (
      <>
        {/* The words, one row each. */}
        {res.words.length > 0 && (
          <div className="lab-table-wrap">
            <table className="lab-table">
              <thead>
                <tr>
                  <th scope="col">{t("colWord")}</th>
                  <th scope="col">{t("colWritten")}</th>
                  <th scope="col">{t("colHow")}</th>
                  <th scope="col">{t("colSubst")}</th>
                  <th scope="col">{t("colValue")}</th>
                </tr>
              </thead>
              <tbody>
                {res.words.map((w, i) => (
                  <tr key={`${i}-${w.raw}`}>
                    <th scope="row">{i + 1}</th>
                    <td>
                      <code>{w.raw}</code>
                    </td>
                    <td>{how(w)}</td>
                    <td>
                      {substitutions(w).map((s, k) => (
                        <div key={k}>{s}</div>
                      ))}
                    </td>
                    <td>{w.value === null ? t("fromCommand") : <code>{shown(w.value)}</code>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* Tcl's error, when it stops. */}
        {res.error ? (
          <>
            <p>
              <span className="lab-verdict lab-verdict--stop">{res.error.word === null ? t("stopCommand") : t("stopWord", { word: res.error.word + 1 })}</span>
            </p>
            <dl className="lab-kv">
              <dt>{t("kvTclSays")}</dt>
              <dd>
                <code>{res.error.message}</code>
              </dd>
            </dl>
            <p className="lab-note">{t(`why.${res.error.code}`)}</p>
          </>
        ) : (
          <>
            {/* What the command receives. */}
            <p>
              <span className="lab-verdict lab-verdict--ok">
                {res.args.some((a) => a.unknownExpansion)
                  ? t("receivesUnknownCount", { command: res.command ?? "?" })
                  : res.command === null
                    ? t("receivesFromCommand", { count: res.args.length - 1 })
                    : t("receives", { command: res.command, count: res.args.length - 1 })}
              </span>
            </p>
            {/* The arguments after the command's name, in order. */}
            <ol className="lab-steps">
              {res.args.slice(1).map((a, i) => (
                <li className="lab-step" key={i}>
                  {a.unknownExpansion ? t("unknownExpansion") : a.value === null ? t("fromCommand") : <code>{shown(a.value)}</code>}
                </li>
              ))}
            </ol>
          </>
        )}
        {/* The notes for Expect writers. */}
        {res.notes.map((n, i) => (
          <p className="lab-note" key={`${n.code}-${i}`}>
            {t(`note.${n.code}`, { word: (n.word ?? 0) + 1 })}
          </p>
        ))}
      </>
    );
  };

  // The menu's value: the preset that equals the line, else custom.
  const preset = PRESETS.includes(line) ? line : CUSTOM;

  return (
    <LabFrame
      labId={ID}
      controls={
        <>
          <LabField id={`${ID}-preset`} label={t("preset")}>
            <LabSelect id={`${ID}-preset`} value={preset} options={[[CUSTOM, t("custom")] as const, ...PRESETS.map((p) => [p, p] as const)]} onChange={(v) => v !== CUSTOM && setLine(v)} />
          </LabField>
          <LabField id={`${ID}-line`} label={t("line")}>
            <input id={`${ID}-line`} className="lab-input mono" type="text" autoComplete="off" spellCheck={false} maxLength={LINE_MAX + 1} value={line} aria-invalid={refused ? "true" : undefined} onChange={(e) => setLine(e.target.value)} />
          </LabField>
          {/* The variables the line can read. */}
          <div className="lab-field">
            <p className="lab-label">{t("variables")}</p>
            <dl className="lab-kv">
              {Object.entries(VARIABLES).map(([k, v]) => (
                <Fragment key={k}>
                  <dt>
                    <code>{k}</code>
                  </dt>
                  <dd>
                    <code>{v}</code>
                  </dd>
                </Fragment>
              ))}
              {Object.entries(ARRAYS).flatMap(([a, els]) =>
                Object.entries(els).map(([k, v]) => (
                  <Fragment key={`${a}(${k})`}>
                    <dt>
                      <code>{`${a}(${k})`}</code>
                    </dt>
                    <dd>
                      <code>{v}</code>
                    </dd>
                  </Fragment>
                )),
              )}
            </dl>
          </div>
        </>
      }
      result={r ? resultBlock(r) : <p className="lab-error">{t(`error.${refused}`, { max: LINE_MAX })}</p>}
      onExample={() => setLine(EXAMPLE_INPUT.line)}
      onReset={() => setLine(DEFAULT_INPUT.line)}
      scope={t("scope")}
    />
  );
}
