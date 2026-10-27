"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/PythonBytesAndTextLab.tsx
// ----------------------------------------------------------------------------
// THE BYTES-AND-TEXT LAB (Python run, 2026-10-27), embedded in "Python's bytes
// and text: encode, decode and the bugs in between" as
// <Lab id="python-bytes-and-text" />. One text field and four selects: the
// codec and error handler that encode the text, and the codec and handler that
// decode the bytes. The result follows the text through both steps as CPython
// 3.13 does: the text's repr, the bytes (repr and hex) or the
// UnicodeEncodeError, the text that comes back or the UnicodeDecodeError, a
// table of what each character became, a verdict, the surrogateescape round
// trip where it applies, and the whole operation as one Python expression. The
// model is src/lib/labs/python-bytes-and-text/compute.ts; its checked cases are
// the golden vectors beside it. Words: "learnLabs.python-bytes-and-text".
// ============================================================================

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import LabFrame, { LabField, LabSelect } from "./LabFrame";
import {
  compute,
  pyStrRepr,
  BytesTextError,
  CODECS,
  DECODE_HANDLERS,
  DEFAULT_INPUT,
  ENCODE_HANDLERS,
  EXAMPLE_INPUT,
  MAX_TEXT_CODE_POINTS,
  type BytesTextErrorCode,
  type BytesTextInput,
  type BytesTextResult,
  type Codec,
  type DecodeHandler,
  type EncodeHandler,
} from "@/lib/labs/python-bytes-and-text/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "python-bytes-and-text";

/** The message key of each codec's label. */
const CODEC_KEY: Readonly<Record<Codec, string>> = {
  // UTF-8.
  "utf-8": "codecUtf8",
  // UTF-16, little-endian.
  "utf-16-le": "codecUtf16le",
  // UTF-16, big-endian.
  "utf-16-be": "codecUtf16be",
  // Latin-1.
  "latin-1": "codecLatin1",
  // Windows-1252.
  cp1252: "codecCp1252",
  // ASCII.
  ascii: "codecAscii",
};

/** The message key of each handler's label. */
const HANDLER_KEY: Readonly<Record<EncodeHandler | DecodeHandler, string>> = {
  // Raise.
  strict: "handlerStrict",
  // Drop.
  ignore: "handlerIgnore",
  // ? or U+FFFD.
  replace: "handlerReplace",
  // An escape as text.
  backslashreplace: "handlerBackslashreplace",
  // &#num;.
  xmlcharrefreplace: "handlerXmlcharrefreplace",
  // U+DC80 to U+DCFF.
  surrogateescape: "handlerSurrogateescape",
};

/** The verdict's message key and its colour class. */
const VERDICT: Readonly<Record<BytesTextResult["verdict"], { key: string; tone: "ok" | "warn" | "stop" }>> = {
  // The same text came back.
  "round-trip": { key: "verdictRoundTrip", tone: "ok" },
  // Both steps worked; the codecs disagreed.
  mojibake: { key: "verdictMojibake", tone: "warn" },
  // The encode handler stood in for characters.
  "lossy-encode": { key: "verdictLossyEncode", tone: "warn" },
  // The decode handler stood in for bytes.
  "lossy-decode": { key: "verdictLossyDecode", tone: "warn" },
  // surrogateescape kept the bytes as surrogates.
  escaped: { key: "verdictEscaped", tone: "warn" },
  // Encoding raised.
  "encode-error": { key: "verdictEncodeError", tone: "stop" },
  // Decoding raised.
  "decode-error": { key: "verdictDecodeError", tone: "stop" },
};

/** A code point as U+XXXX (at least four upper-case hex digits). */
function uPlus(cp: number): string {
  // The Unicode notation.
  return `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`;
}

/** Bytes as spaced lower-case hex. */
function hexOf(bytes: readonly number[]): string {
  // Two digits each, one space between.
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join(" ");
}

export default function PythonBytesAndTextLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.python-bytes-and-text");
  // The page's language, for counts.
  const locale = useLocale();
  // Whole numbers with the page's grouping.
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  // The reader's settings, opening on a UTF-8 round trip.
  const [input, setInput] = useState<BytesTextInput>(DEFAULT_INPUT);

  // The model's answer, or the code it refused the input with.
  let r: BytesTextResult | null = null;
  // The refusal code, when there is one.
  let err: BytesTextErrorCode | null = null;
  // Run the pure model on the settings.
  try {
    // Encode, decode, judge.
    r = compute(input);
  } catch (e) {
    // Only the model's own refusals are expected here.
    if (e instanceof BytesTextError) err = e.code;
    // Anything else is a bug and must surface.
    else throw e;
  }
  // The refusal, worded for the reader.
  const errText = err === "too-long" ? t("errorTooLong", { max: nf.format(MAX_TEXT_CODE_POINTS) }) : err === "lone-surrogate" ? t("errorSurrogate") : err ? t("errorChoice") : null;

  // The codec options, labelled.
  const codecOptions = CODECS.map((c) => [c, t(CODEC_KEY[c])] as const);
  // The encoding handlers, labelled.
  const encodeOptions = ENCODE_HANDLERS.map((h) => [h, t(HANDLER_KEY[h])] as const);
  // The decoding handlers, labelled.
  const decodeOptions = DECODE_HANDLERS.map((h) => [h, t(HANDLER_KEY[h])] as const);

  /** The result block for a valid input. */
  const resultBlock = (res: BytesTextResult) => {
    // The verdict's words and tone.
    const v = VERDICT[res.verdict];
    // The count the verdict sentence uses.
    const count = res.verdict === "lossy-encode" ? res.encodeHandled : res.decodeHandled;
    return (
      <>
        {/* The three steps: the text, the bytes, the text again. */}
        <ol className="lab-steps">
          <li>
            <span className="lab-step-where">{t("stepText", { count: res.codePoints.length })}</span> <code>{res.textRepr}</code>
          </li>
          <li>
            {res.bytes ? (
              <>
                <span className="lab-step-where">{t("stepEncoded", { codec: input.encodeCodec, count: res.bytes.length })}</span> <code>{res.bytesRepr}</code>
                {res.bytes.length > 0 && (
                  <>
                    {" "}
                    {t("hexLabel")} <code>{res.bytesHex}</code>
                  </>
                )}
              </>
            ) : (
              <>
                <span className="lab-step-where">{t("stepEncodeFailed", { codec: input.encodeCodec })}</span> <code>{`UnicodeEncodeError: ${res.encodeFailure?.message ?? ""}`}</code>
              </>
            )}
          </li>
          <li>
            {res.decoded ? (
              <>
                <span className="lab-step-where">{t("stepDecoded", { codec: input.decodeCodec, count: res.decoded.length })}</span> <code>{res.decodedRepr}</code>
              </>
            ) : res.decodeFailure ? (
              <>
                <span className="lab-step-where">{t("stepDecodeFailed", { codec: input.decodeCodec })}</span> <code>{`UnicodeDecodeError: ${res.decodeFailure.message}`}</code>
              </>
            ) : (
              <span className="lab-step-where">{t("stepNotReached")}</span>
            )}
          </li>
        </ol>
        {/* The verdict: the words carry the meaning, the colour only adds. */}
        <p>
          <span className={`lab-verdict lab-verdict--${v.tone}`}>{t(v.key, { count, codec: input.decodeCodec })}</span>
        </p>
        {/* What each character became, in the encoding codec. */}
        {res.rows.length > 0 && (
          <div className="lab-table-wrap">
            <table className="lab-table">
              <caption>{t("tableCaption", { codec: input.encodeCodec })}</caption>
              <thead>
                <tr>
                  <th scope="col">{t("thChar")}</th>
                  <th scope="col">{t("thCodePoint")}</th>
                  <th scope="col">{t("thBytes")}</th>
                </tr>
              </thead>
              <tbody>
                {res.rows.map((row, i) => (
                  <tr key={i}>
                    <td>
                      <code>{pyStrRepr([row.cp])}</code>
                    </td>
                    <td>
                      <code>{uPlus(row.cp)}</code>
                    </td>
                    <td>
                      {/* Written bytes; the handler's bytes for a character the codec cannot write; or why there are none. */}
                      {row.bytes.length > 0 ? <code>{hexOf(row.bytes)}</code> : null}
                      {row.unencodable ? (row.bytes.length > 0 ? ` ${t("byHandler", { handler: input.encodeErrors })}` : input.encodeErrors === "strict" ? t("cannotEncode") : t("dropped")) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* surrogateescape's promise, checked: the same handler on the way back. */}
        {res.bytesBack && (
          <p className="lab-note">
            {res.bytesBack.failure
              ? t("noteBytesBackFailed", { codec: input.decodeCodec, message: `UnicodeEncodeError: ${res.bytesBack.failure.message}` })
              : res.bytesBack.same
                ? t("noteBytesBackSame", { codec: input.decodeCodec })
                : t("noteBytesBackDifferent", { codec: input.decodeCodec })}
          </p>
        )}
        {/* The whole operation as one line of Python, to run in a REPL or the playground. */}
        <p className="lab-note">
          {t("pythonLine")} <code>{res.python}</code>
        </p>
      </>
    );
  };

  return (
    <LabFrame
      labId={ID}
      controls={
        <>
          <LabField id={`${ID}-text`} label={t("text")}>
            <input id={`${ID}-text`} className="lab-input" type="text" autoComplete="off" spellCheck={false} value={input.text} aria-invalid={err === "too-long" || err === "lone-surrogate" ? "true" : undefined} onChange={(e) => setInput({ ...input, text: e.target.value })} />
          </LabField>
          <LabField id={`${ID}-encode-codec`} label={t("encodeCodec")}>
            <LabSelect id={`${ID}-encode-codec`} value={input.encodeCodec} options={codecOptions} onChange={(v) => setInput({ ...input, encodeCodec: v as Codec })} />
          </LabField>
          <LabField id={`${ID}-encode-errors`} label={t("encodeErrors")}>
            <LabSelect id={`${ID}-encode-errors`} value={input.encodeErrors} options={encodeOptions} onChange={(v) => setInput({ ...input, encodeErrors: v as EncodeHandler })} />
          </LabField>
          <LabField id={`${ID}-decode-codec`} label={t("decodeCodec")}>
            <LabSelect id={`${ID}-decode-codec`} value={input.decodeCodec} options={codecOptions} onChange={(v) => setInput({ ...input, decodeCodec: v as Codec })} />
          </LabField>
          <LabField id={`${ID}-decode-errors`} label={t("decodeErrors")}>
            <LabSelect id={`${ID}-decode-errors`} value={input.decodeErrors} options={decodeOptions} onChange={(v) => setInput({ ...input, decodeErrors: v as DecodeHandler })} />
          </LabField>
        </>
      }
      result={r ? resultBlock(r) : <p className="lab-error">{errText}</p>}
      onExample={() => setInput(EXAMPLE_INPUT)}
      onReset={() => setInput(DEFAULT_INPUT)}
      scope={t("scope")}
    />
  );
}
