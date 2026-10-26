"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/PayloadByteOffsetsLab.tsx
// ----------------------------------------------------------------------------
// THE PAYLOAD BYTE-OFFSETS LAB (2026-10-26), embedded in "Rewriting Content on
// BIG-IP" as <Lab id="payload-byte-offsets" />. Two text fields (the body and
// the piece to find) and two number fields (the collect size and the
// connections collecting at once), then the text's length in characters and in
// UTF-8 octets, where the piece starts and how long it is in each count, a
// verdict on which figures an HTTP::payload edit needs, and the upper bound of
// the collect memory. The model is src/lib/labs/payload-byte-offsets/compute.ts;
// its checked cases are the golden vectors beside it.
// Words: "learnLabs.payload-byte-offsets".
// ============================================================================

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import LabFrame, { LabField } from "./LabFrame";
import { compute, DEFAULT_INPUT, EXAMPLE_INPUT, MAX_COLLECT_KIB, MAX_CONNECTIONS, MAX_TEXT_CODE_POINTS, PayloadError, type PayloadErrorCode, type PayloadInput, type PayloadResult } from "@/lib/labs/payload-byte-offsets/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "payload-byte-offsets";

/** The form as typed: number fields stay text so the reader can edit freely. */
interface Form {
  /** The body text. */
  text: string;
  /** The piece to find. */
  find: string;
  /** The collect size in KiB, as typed. */
  collectKiB: string;
  /** The connections collecting at once, as typed. */
  connections: string;
}

/** A model input as the form shows it. */
function toForm(i: PayloadInput): Form {
  // Text stays text; numbers become text.
  return { text: i.text, find: i.find, collectKiB: String(i.collectKiB), connections: String(i.connections) };
}

/** Read a typed number; an empty field is not a number. */
function readNumber(s: string): number {
  // Blank means nothing was entered.
  return s.trim() === "" ? Number.NaN : Number(s.trim());
}

export default function PayloadByteOffsetsLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.payload-byte-offsets");
  // The page's language, for number formatting.
  const locale = useLocale();
  // The reader's settings, opening on plain ASCII.
  const [form, setForm] = useState<Form>(toForm(DEFAULT_INPUT));
  // Whole numbers with grouping.
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  // Mebibytes with up to two decimals.
  const mf = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });

  // The model's answer, or the code it refused the input with.
  let r: PayloadResult | null = null;
  // The refusal code, when there is one.
  let err: PayloadErrorCode | null = null;
  // Run the pure model on the parsed form.
  try {
    // Parse and compute.
    r = compute({ text: form.text, find: form.find, collectKiB: readNumber(form.collectKiB), connections: readNumber(form.connections) });
  } catch (e) {
    // Only the model's own refusals are expected here.
    if (e instanceof PayloadError) err = e.code;
    // Anything else is a bug and must surface.
    else throw e;
  }
  // The refusal, worded for the reader.
  const errText =
    err === "too-long"
      ? t("errorTooLong", { max: nf.format(MAX_TEXT_CODE_POINTS) })
      : err === "bad-text"
        ? t("errorText")
        : err === "bad-collect"
          ? t("errorCollect", { max: nf.format(MAX_COLLECT_KIB) })
          : err === "bad-connections"
            ? t("errorConnections", { max: nf.format(MAX_CONNECTIONS) })
            : null;

  /** The result block for a valid input. */
  const resultBlock = (res: PayloadResult) => {
    // Where the match starts, in both counts, or why there is nothing to show.
    const matchAt =
      res.found === null ? t("noFind") : res.found ? t("matchAt", { chars: nf.format(res.charIndex ?? 0), bytes: nf.format(res.byteOffset ?? 0) }) : t("notFound");
    // How long the match is, in both counts.
    const matchLength = res.findCodePoints === null ? t("noFind") : t("matchLength", { chars: nf.format(res.findCodePoints), bytes: nf.format(res.findOctets ?? 0) });
    // The verdict on what an edit needs, only when there is a match.
    const verdict = res.found
      ? res.offsetsDiffer
        ? t("verdictDiffer", { offset: nf.format(res.byteOffset ?? 0), length: nf.format(res.findOctets ?? 0) })
        : t("verdictAgree", { offset: nf.format(res.byteOffset ?? 0), length: nf.format(res.findOctets ?? 0) })
      : null;
    return (
      <>
        {/* The figures, name and value. */}
        <dl className="lab-kv">
          <dt>{t("kvChars")}</dt>
          <dd>{nf.format(res.codePoints)}</dd>
          <dt>{t("kvOctets")}</dt>
          <dd>{nf.format(res.octets)}</dd>
          <dt>{t("kvMatchAt")}</dt>
          <dd>{matchAt}</dd>
          <dt>{t("kvMatchLength")}</dt>
          <dd>{matchLength}</dd>
          <dt>{t("kvMemory")}</dt>
          <dd>{t("memoryValue", { mib: mf.format(res.memoryMiB), bytes: nf.format(res.memoryBytes) })}</dd>
        </dl>
        {/* What an HTTP::payload edit needs; a warning when the counts part. */}
        {verdict && (
          <p>
            <span className={`lab-verdict lab-verdict--${res.offsetsDiffer ? "warn" : "ok"}`}>{verdict}</span>
          </p>
        )}
        {/* The memory bound, worded. */}
        <p className="lab-note">{t("memoryNote", { kib: nf.format(readNumber(form.collectKiB)), connections: nf.format(readNumber(form.connections)), mib: mf.format(res.memoryMiB) })}</p>
      </>
    );
  };

  return (
    <LabFrame
      labId={ID}
      controls={
        <>
          <LabField id={`${ID}-text`} label={t("text")}>
            <input id={`${ID}-text`} className="lab-input" type="text" value={form.text} aria-invalid={err === "too-long" || err === "bad-text" ? "true" : undefined} onChange={(e) => setForm({ ...form, text: e.target.value })} />
          </LabField>
          <LabField id={`${ID}-find`} label={t("find")}>
            <input id={`${ID}-find`} className="lab-input" type="text" value={form.find} aria-invalid={err === "too-long" || err === "bad-text" ? "true" : undefined} onChange={(e) => setForm({ ...form, find: e.target.value })} />
          </LabField>
          <LabField id={`${ID}-collect`} label={t("collect")}>
            <input id={`${ID}-collect`} className="lab-input" type="number" inputMode="decimal" min={1} max={MAX_COLLECT_KIB} step={1} value={form.collectKiB} aria-invalid={err === "bad-collect" ? "true" : undefined} onChange={(e) => setForm({ ...form, collectKiB: e.target.value })} />
          </LabField>
          <LabField id={`${ID}-connections`} label={t("connections")}>
            <input id={`${ID}-connections`} className="lab-input" type="number" inputMode="decimal" min={1} max={MAX_CONNECTIONS} step={1} value={form.connections} aria-invalid={err === "bad-connections" ? "true" : undefined} onChange={(e) => setForm({ ...form, connections: e.target.value })} />
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
