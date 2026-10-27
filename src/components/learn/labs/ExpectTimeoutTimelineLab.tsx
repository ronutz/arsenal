"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/ExpectTimeoutTimelineLab.tsx
// ----------------------------------------------------------------------------
// THE EXPECT TIMEOUT TIMELINE LAB (2026-10-27), embedded in "Expect's timeouts,
// eof and loops" as <Lab id="expect-timeout-timeline" />. Four selects (how the
// script sets timeout, the arm for the device's progress line, how the device's
// output ends, the keyword arms) and up to four number inputs (the N of "set
// timeout N", the gap between progress lines, how many there are, the second of
// the prompt or the eof). The result shows the expect being modelled as code, a
// short summary, the wait second by second (each progress line, each restart of
// the timer, the moment it returns and the arm that ran), the verdict, and how
// the other exp_continue form would have ended. The model is
// src/lib/labs/expect-timeout-timeline/compute.ts; its checked cases are the
// golden vectors beside it. Words: "learnLabs.expect-timeout-timeline".
// ============================================================================

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import LabFrame, { LabField, LabSelect } from "./LabFrame";
import {
  compute,
  DEFAULT_INPUT,
  DEFAULT_TIMEOUT_S,
  EXAMPLE_INPUT,
  MAX_END_S,
  MAX_EVERY_S,
  MAX_PROGRESS,
  MAX_TIMEOUT_S,
  TimeoutTimelineError,
  type Ending,
  type KeywordArms,
  type Outcome,
  type ProgressArm,
  type TimelineStep,
  type TimeoutMode,
  type TimeoutTimelineErrorCode,
  type TimeoutTimelineInput,
  type TimeoutTimelineResult,
} from "@/lib/labs/expect-timeout-timeline/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "expect-timeout-timeline";

/** The number fields, kept as text so the reader can edit freely. */
type NumberKey = "timeoutS" | "progressEveryS" | "progressCount" | "endAtS";

/** The form as typed: the selects as their values, the numbers as text. */
interface Form {
  /** How the script sets timeout. */
  timeoutMode: TimeoutMode;
  /** The arm for the progress line. */
  progressArm: ProgressArm;
  /** How the device's output ends. */
  ending: Ending;
  /** The keyword arms. */
  arms: KeywordArms;
  /** The number fields, as typed. */
  numbers: Record<NumberKey, string>;
}

/** A model input as the form shows it. */
function toForm(i: TimeoutTimelineInput): Form {
  // Selects as they are, numbers as text.
  return {
    timeoutMode: i.timeoutMode,
    progressArm: i.progressArm,
    ending: i.ending,
    arms: i.arms,
    numbers: { timeoutS: String(i.timeoutS), progressEveryS: String(i.progressEveryS), progressCount: String(i.progressCount), endAtS: String(i.endAtS) },
  };
}

/** Read a typed number; an empty field is not a number (the model refuses it where it is used). */
function readNumber(s: string): number {
  // Blank means nothing was entered; a decimal comma is read as a point (and then refused as not whole).
  return s.trim() === "" ? Number.NaN : Number(s.trim().replace(",", "."));
}

/** The fields each refusal points at, for aria-invalid. */
const FIELDS_AT_FAULT: Record<TimeoutTimelineErrorCode, NumberKey[]> = {
  // A select value no control can produce: no field to mark.
  "bad-choice": [],
  // The N of set timeout N.
  "bad-timeout": ["timeoutS"],
  // The gap between progress lines.
  "bad-progress-every": ["progressEveryS"],
  // How many progress lines.
  "bad-progress-count": ["progressCount"],
  // The second of the ending.
  "bad-end-time": ["endAtS"],
  // The ending against the progress lines: all three are involved.
  "end-before-progress": ["endAtS", "progressEveryS", "progressCount"],
};

/** An outcome or form as an ICU select keyword: hyphens become camel case ("timeout-null" -> "timeoutNull"). */
function key(v: string): string {
  // Each hyphen and the letter after it become that letter in upper case.
  return v.replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase());
}

/** The outcomes that leave the script knowing what happened, those that leave it blind, and the good one. */
function toneOf(o: Outcome): "ok" | "warn" | "stop" {
  // The prompt matched.
  if (o === "prompt") return "ok";
  // An arm noticed the failure: the script can report it.
  if (o === "timeout-arm" || o === "default-timeout" || o === "eof-arm" || o === "default-eof") return "warn";
  // Blind, early or forever.
  return "stop";
}

export default function ExpectTimeoutTimelineLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.expect-timeout-timeline");
  // The page's language, for numbers.
  const locale = useLocale();
  // Whole numbers in the page's language.
  const nf = new Intl.NumberFormat(locale);
  // The reader's settings, opening on the working case.
  const [form, setForm] = useState<Form>(toForm(DEFAULT_INPUT));

  // The parsed input (kept for the sentences and the code).
  const input: TimeoutTimelineInput = {
    timeoutMode: form.timeoutMode,
    timeoutS: readNumber(form.numbers.timeoutS),
    progressArm: form.progressArm,
    progressEveryS: readNumber(form.numbers.progressEveryS),
    progressCount: readNumber(form.numbers.progressCount),
    ending: form.ending,
    endAtS: readNumber(form.numbers.endAtS),
    arms: form.arms,
  };
  // The model's answer, or the code it refused the input with.
  let r: TimeoutTimelineResult | null = null;
  // The refusal code, when there is one.
  let err: TimeoutTimelineErrorCode | null = null;
  // Run the pure model.
  try {
    // Compute.
    r = compute(input);
  } catch (e) {
    // Only the model's own refusals are expected here.
    if (e instanceof TimeoutTimelineError) err = e.code;
    // Anything else is a bug and must surface.
    else throw e;
  }
  // The fields to mark invalid.
  const bad = new Set<NumberKey>(err ? FIELDS_AT_FAULT[err] : []);
  // The refusal, worded for the reader.
  const errText =
    err === "bad-timeout"
      ? t("errorTimeout", { max: MAX_TIMEOUT_S })
      : err === "bad-progress-every"
        ? t("errorEvery", { max: MAX_EVERY_S })
        : err === "bad-progress-count"
          ? t("errorCount", { max: MAX_PROGRESS })
          : err === "bad-end-time"
            ? t("errorEndTime", { max: MAX_END_S })
            : err === "end-before-progress"
              ? t("errorEndBefore", { last: nf.format((Number.isFinite(input.progressCount) ? input.progressCount : 0) * (Number.isFinite(input.progressEveryS) ? input.progressEveryS : 0)) })
              : err
                ? t("errorChoice")
                : null;

  /** A whole number of seconds, formatted. */
  const sec = (n: number): string => nf.format(n);
  /** Set one select field. */
  const setSel = <K extends "timeoutMode" | "progressArm" | "ending" | "arms">(key: K) => (v: string) => setForm({ ...form, [key]: v as Form[K] });

  /** One number input, labelled, with its own id and invalid state. */
  const field = (key: NumberKey, slug: string, label: string, min: number, max: number) => (
    <LabField id={`${ID}-${slug}`} label={label}>
      <input
        id={`${ID}-${slug}`}
        className="lab-input"
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        value={form.numbers[key]}
        aria-invalid={bad.has(key) ? "true" : undefined}
        onChange={(e) => setForm({ ...form, numbers: { ...form.numbers, [key]: e.target.value } })}
      />
    </LabField>
  );

  /** The expect command being modelled, as Tcl, built from the settings (code is not translated; its comment is). */
  const code = (): string => {
    // The lines.
    const lines: string[] = [];
    // How timeout is set.
    if (form.timeoutMode === "default") lines.push(t("codeNoTimeout", { s: DEFAULT_TIMEOUT_S }));
    // A number, as typed (the model checks it).
    else if (form.timeoutMode === "value") lines.push(`set timeout ${form.numbers.timeoutS.trim() || "N"}`);
    // No limit.
    else lines.push("set timeout -1");
    // The expect and its arms, one per line (the braced form must span lines).
    lines.push("expect {");
    // The progress arm, when there is one.
    if (form.progressArm === "continue") lines.push(`    "${t("codeProgress")}" { exp_continue }`);
    // With -continue_timer.
    else if (form.progressArm === "continue-timer") lines.push(`    "${t("codeProgress")}" { exp_continue -continue_timer }`);
    // A body without exp_continue.
    else if (form.progressArm === "return") lines.push(`    "${t("codeProgress")}" { incr waits }`);
    // The prompt.
    lines.push(`    "${t("codePrompt")}" { set ready 1 }`);
    // The timeout arm.
    if (form.arms === "timeout-eof" || form.arms === "timeout") lines.push("    timeout { exit 1 }");
    // The eof arm.
    if (form.arms === "timeout-eof" || form.arms === "eof") lines.push("    eof { exit 2 }");
    // The default arm.
    if (form.arms === "default") lines.push("    default { exit 1 }");
    // Close.
    lines.push("}");
    // One block of text.
    return lines.join("\n");
  };

  /** One step, worded. */
  const stepText = (s: TimelineStep): string => {
    // By kind.
    switch (s.kind) {
      case "start":
        // With or without a deadline.
        return s.deadlineS === null ? t("stepStartForever") : t("stepStart", { deadline: sec(s.deadlineS) });
      case "progress-unmatched":
        // Text that moves nothing.
        return s.deadlineS === null ? t("stepUnmatchedForever") : t("stepUnmatched", { deadline: sec(s.deadlineS) });
      case "progress-restart":
        // exp_continue restarts the timer.
        return s.deadlineS === null ? t("stepRestartForever") : t("stepRestart", { deadline: sec(s.deadlineS) });
      case "progress-keep":
        // -continue_timer keeps the deadline.
        return s.deadlineS === null ? t("stepKeepForever") : t("stepKeep", { deadline: sec(s.deadlineS) });
      case "progress-return":
        // The arm returns.
        return t("stepReturn");
      case "prompt":
        // Matched.
        return t("stepPrompt");
      case "eof-arm":
        // The eof arm.
        return t("stepEofArm");
      case "default-eof":
        // The default arm on eof.
        return t("stepDefaultEof");
      case "eof-no-arm":
        // No arm for eof.
        return t("stepEofNoArm");
      case "timeout-arm":
        // The timeout arm.
        return t("stepTimeoutArm");
      case "default-timeout":
        // The default arm on timeout.
        return t("stepDefaultTimeout");
      default:
        // The implicit null action.
        return t("stepTimeoutNull");
    }
  };

  /** The result block for a valid input. */
  const resultBlock = (res: TimeoutTimelineResult) => {
    // The verdict, by outcome.
    const at = res.returnsAtS === null ? "" : sec(res.returnsAtS);
    // The sentence.
    const verdict =
      res.outcome === "prompt"
        ? t("verdictPrompt", { at })
        : res.outcome === "progress-arm"
          ? t("verdictProgressArm", { at })
          : res.outcome === "timeout-arm" || res.outcome === "default-timeout"
            ? t("verdictTimeoutArm", { at })
            : res.outcome === "timeout-null"
              ? t("verdictTimeoutNull", { at })
              : res.outcome === "eof-arm" || res.outcome === "default-eof"
                ? t("verdictEofArm", { at })
                : res.outcome === "eof-no-arm"
                  ? t("verdictEofNoArm", { at })
                  : t("verdictForever");
    // Colour adds to the words.
    const tone = toneOf(res.outcome);
    return (
      <>
        {/* The expect being modelled. */}
        <p className="lab-note">{t("codeLabel")}</p>
        <pre>
          <code>{code()}</code>
        </pre>
        {/* The summary. */}
        <dl className="lab-kv">
          <dt>{t("kvTimeout")}</dt>
          <dd>{res.timeoutS === null ? t("noLimit") : t("seconds", { s: sec(res.timeoutS) })}</dd>
          <dt>{t("kvReturns")}</dt>
          <dd>{res.returnsAtS === null ? t("never") : t("atSecondValue", { s: sec(res.returnsAtS) })}</dd>
          <dt>{t("kvRan")}</dt>
          <dd>{t("outcomeShort", { outcome: key(res.outcome) })}</dd>
          <dt>{t("kvRestarts")}</dt>
          <dd>{nf.format(res.restarts)}</dd>
          <dt>{t("kvLines")}</dt>
          <dd>{t("linesValue", { matched: res.progressMatched, unmatched: res.progressUnmatched })}</dd>
        </dl>
        {/* The wait, second by second. */}
        <ol className="lab-steps">
          {res.steps.map((s, i) => (
            <li key={`${s.atS}-${s.kind}-${i}`}>
              <span className="lab-step-where">{t("atSecond", { s: sec(s.atS) })}</span> {stepText(s)}
            </li>
          ))}
          {res.outcome === "forever" && <li>{t("stepForever")}</li>}
          <li>
            <span className="lab-step-where">{t("stepResult")}</span> <span className={`lab-verdict lab-verdict--${tone}`}>{verdict}</span>
          </li>
        </ol>
        {/* The other exp_continue form, on the same device. */}
        {res.alternative && (
          <p className="lab-note">
            {t("alternative", {
              form: key(res.alternative.progressArm),
              outcome: key(res.alternative.outcome),
              at: res.alternative.returnsAtS === null ? "" : sec(res.alternative.returnsAtS),
            })}
          </p>
        )}
        {/* What a timeout no arm handles leaves behind. */}
        {res.outcome === "timeout-null" && <p className="lab-note">{t("noteTimeoutNull")}</p>}
        {/* What an eof leaves behind, handled or not. */}
        {(res.outcome === "eof-arm" || res.outcome === "default-eof" || res.outcome === "eof-no-arm") && <p className="lab-note">{t("noteEofNoArm")}</p>}
      </>
    );
  };

  return (
    <LabFrame
      labId={ID}
      controls={
        <>
          <LabField id={`${ID}-timeout-mode`} label={t("timeoutMode")}>
            <LabSelect
              id={`${ID}-timeout-mode`}
              value={form.timeoutMode}
              options={[
                ["default", t("modeDefault", { s: DEFAULT_TIMEOUT_S })],
                ["value", t("modeValue")],
                ["infinite", t("modeInfinite")],
              ]}
              onChange={setSel("timeoutMode")}
            />
          </LabField>
          {form.timeoutMode === "value" && field("timeoutS", "timeout", t("timeoutS"), 0, MAX_TIMEOUT_S)}
          <LabField id={`${ID}-progress-arm`} label={t("progressArm")}>
            <LabSelect
              id={`${ID}-progress-arm`}
              value={form.progressArm}
              options={[
                ["none", t("armNone")],
                ["continue", t("armContinue")],
                ["continue-timer", t("armContinueTimer")],
                ["return", t("armReturn")],
              ]}
              onChange={setSel("progressArm")}
            />
          </LabField>
          {field("progressEveryS", "progress-every", t("progressEvery"), 1, MAX_EVERY_S)}
          {field("progressCount", "progress-count", t("progressCount"), 0, MAX_PROGRESS)}
          <LabField id={`${ID}-ending`} label={t("ending")}>
            <LabSelect
              id={`${ID}-ending`}
              value={form.ending}
              options={[
                ["prompt", t("endPrompt")],
                ["eof", t("endEof")],
                ["silence", t("endSilence")],
              ]}
              onChange={setSel("ending")}
            />
          </LabField>
          {form.ending !== "silence" && field("endAtS", "end-at", t("endAt"), 1, MAX_END_S)}
          <LabField id={`${ID}-arms`} label={t("arms")}>
            <LabSelect
              id={`${ID}-arms`}
              value={form.arms}
              options={[
                ["timeout-eof", t("armsTimeoutEof")],
                ["timeout", t("armsTimeout")],
                ["eof", t("armsEof")],
                ["default", t("armsDefault")],
                ["none", t("armsNone")],
              ]}
              onChange={setSel("arms")}
            />
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
