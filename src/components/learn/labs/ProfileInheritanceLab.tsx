"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/ProfileInheritanceLab.tsx
// ----------------------------------------------------------------------------
// THE PROFILE INHERITANCE LAB (2026-10-26), embedded in "Profiles on a Virtual
// Server" as <Lab id="profile-inheritance" />. The parent profile's idle
// timeout before and after an edit, whether child B inherits it or carries its
// own value, and that value; then a table of the value in force on the parent
// and on both children before and after the edit, and a verdict on who
// followed. The model is src/lib/labs/profile-inheritance/compute.ts; its
// checked cases are the golden vectors beside it.
// Words: "learnLabs.profile-inheritance".
// ============================================================================

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import LabFrame, { LabField, LabSelect } from "./LabFrame";
import { compute, DEFAULT_INPUT, EXAMPLE_INPUT, InheritanceError, MAX_SECONDS, MIN_SECONDS, type ChildMode, type InheritanceErrorCode, type InheritanceInput, type InheritanceResult, type ProfileValues } from "@/lib/labs/profile-inheritance/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "profile-inheritance";

/** The form as typed: number fields stay text so the reader can edit freely. */
interface Form {
  /** The parent's timeout before the edit, as typed. */
  parentBefore: string;
  /** The parent's timeout after the edit, as typed. */
  parentAfter: string;
  /** Whether child B inherits or carries its own value. */
  childB: ChildMode;
  /** Child B's own value, as typed. */
  childBValue: string;
}

/** A model input as the form shows it. */
function toForm(i: InheritanceInput): Form {
  // Numbers become text; the mode stays as it is.
  return { parentBefore: String(i.parentBefore), parentAfter: String(i.parentAfter), childB: i.childB, childBValue: String(i.childBValue) };
}

/** Read a typed number; an empty field is not a number. */
function readNumber(s: string): number {
  // Blank means nothing was entered.
  return s.trim() === "" ? Number.NaN : Number(s.trim());
}

/** True when a typed value is not a whole number of seconds in range (the field to mark). */
function isBad(s: string): boolean {
  // The typed value as a number.
  const n = readNumber(s);
  // Whole and within the lab's range, or it is marked.
  return !(Number.isInteger(n) && n >= MIN_SECONDS && n <= MAX_SECONDS);
}

export default function ProfileInheritanceLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.profile-inheritance");
  // The page's language, for number formatting.
  const locale = useLocale();
  // The reader's settings, opening on the propagating edit.
  const [form, setForm] = useState<Form>(toForm(DEFAULT_INPUT));
  // Whole numbers with grouping.
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });

  // The model's answer, or the code it refused the input with.
  let r: InheritanceResult | null = null;
  // The refusal code, when there is one.
  let err: InheritanceErrorCode | null = null;
  // Run the pure model on the parsed form.
  try {
    // Parse and compute.
    r = compute({ parentBefore: readNumber(form.parentBefore), parentAfter: readNumber(form.parentAfter), childB: form.childB, childBValue: readNumber(form.childBValue) });
  } catch (e) {
    // Only the model's own refusals are expected here.
    if (e instanceof InheritanceError) err = e.code;
    // Anything else is a bug and must surface.
    else throw e;
  }
  // The refusal, worded for the reader.
  const errText = err === "bad-seconds" ? t("errorSeconds", { min: nf.format(MIN_SECONDS), max: nf.format(MAX_SECONDS) }) : err ? t("errorMode") : null;
  // Child B's choices.
  const modeOptions = [
    ["inherit", t("modeInherit")],
    ["custom", t("modeCustom")],
  ] as const;

  /** A number of seconds as the reader reads it. */
  const secs = (n: number) => t("seconds", { s: nf.format(n) });
  /** Where a child's value comes from. */
  const source = (v: ProfileValues) => (v.inherited ? t("sourceInherited") : t("sourceCustom"));

  /** The result block for a valid input. */
  const resultBlock = (res: InheritanceResult) => {
    // The verdict: who followed the parent's edit, and who did not.
    const verdict = !res.parentChanged
      ? res.childrenDiverge
        ? t("verdictOwnNoEdit", { b: nf.format(res.childB.after), parent: nf.format(res.parent.after) })
        : t("verdictNoEdit", { value: nf.format(res.parent.after) })
      : !res.childrenDiverge
        ? t("verdictFollow", { before: nf.format(res.parent.before), after: nf.format(res.parent.after) })
        : res.overrideLooksInherited
          ? t("verdictLookalike", { before: nf.format(res.parent.before), after: nf.format(res.parent.after), b: nf.format(res.childB.after) })
          : t("verdictOwn", { after: nf.format(res.parent.after), b: nf.format(res.childB.after) });
    // Following the parent is the expected case; a child left behind is the one to notice.
    const tone = res.childrenDiverge ? "warn" : "ok";
    return (
      <>
        {/* The value in force on each profile, before and after the parent's edit. */}
        <div className="lab-table-wrap">
          <table className="lab-table">
            <thead>
              <tr>
                <th scope="col">{t("colProfile")}</th>
                <th scope="col">{t("colBefore")}</th>
                <th scope="col">{t("colAfter")}</th>
                <th scope="col">{t("colSource")}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">{t("rowParent")}</th>
                <td>{secs(res.parent.before)}</td>
                <td>{secs(res.parent.after)}</td>
                <td>{t("sourceParent")}</td>
              </tr>
              <tr>
                <th scope="row">{t("rowA")}</th>
                <td>{secs(res.childA.before)}</td>
                <td>{secs(res.childA.after)}</td>
                <td>{source(res.childA)}</td>
              </tr>
              <tr>
                <th scope="row">{t("rowB")}</th>
                <td>{secs(res.childB.before)}</td>
                <td>{secs(res.childB.after)}</td>
                <td>{source(res.childB)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* Who followed. */}
        <p>
          <span className={`lab-verdict lab-verdict--${tone}`}>{verdict}</span>
        </p>
        {/* The trap, named while it is still invisible. */}
        {res.overrideLooksInherited && !res.parentChanged && <p className="lab-note">{t("lookalikeNote", { value: nf.format(res.childB.after) })}</p>}
      </>
    );
  };

  return (
    <LabFrame
      labId={ID}
      controls={
        <>
          <LabField id={`${ID}-parent-before`} label={t("parentBefore")}>
            <input id={`${ID}-parent-before`} className="lab-input" type="number" inputMode="decimal" min={MIN_SECONDS} max={MAX_SECONDS} step={1} value={form.parentBefore} aria-invalid={err === "bad-seconds" && isBad(form.parentBefore) ? "true" : undefined} onChange={(e) => setForm({ ...form, parentBefore: e.target.value })} />
          </LabField>
          <LabField id={`${ID}-parent-after`} label={t("parentAfter")}>
            <input id={`${ID}-parent-after`} className="lab-input" type="number" inputMode="decimal" min={MIN_SECONDS} max={MAX_SECONDS} step={1} value={form.parentAfter} aria-invalid={err === "bad-seconds" && isBad(form.parentAfter) ? "true" : undefined} onChange={(e) => setForm({ ...form, parentAfter: e.target.value })} />
          </LabField>
          <LabField id={`${ID}-child-b`} label={t("childB")}>
            <LabSelect id={`${ID}-child-b`} value={form.childB} options={modeOptions} onChange={(v) => setForm({ ...form, childB: v as ChildMode })} />
          </LabField>
          <LabField id={`${ID}-child-b-value`} label={t("childBValue")}>
            <input id={`${ID}-child-b-value`} className="lab-input" type="number" inputMode="decimal" min={MIN_SECONDS} max={MAX_SECONDS} step={1} value={form.childBValue} disabled={form.childB !== "custom"} aria-invalid={err === "bad-seconds" && form.childB === "custom" && isBad(form.childBValue) ? "true" : undefined} onChange={(e) => setForm({ ...form, childBValue: e.target.value })} />
          </LabField>
        </>
      }
      result={r ? resultBlock(r) : <p className="lab-error">{errText}</p>}
      onExample={() => setForm(toForm(EXAMPLE_INPUT))}
      onReset={() => setForm(toForm(DEFAULT_INPUT))}
      scope={t("scope")}
    />
  );
}
