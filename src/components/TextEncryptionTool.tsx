"use client";

// ============================================================================
// src/components/TextEncryptionTool.tsx
// ----------------------------------------------------------------------------
// UI for local text encryption. Two modes:
//   - Encrypt: the reader's text and passphrase (typed twice, masked until the
//     reader chooses Show) become one self-describing string,
//     aesgcm1.<iterations>.<salt>.<iv>.<ciphertext and tag>, with a Copy button.
//   - Decrypt: the string and the passphrase give the text back, or "wrong
//     passphrase or altered text" and nothing else. Before the passphrase is
//     typed, the page already shows what the string says (version, iteration
//     count, sizes) or why it is not such a string.
//
// RANDOMNESS LIVES HERE, NOT IN THE ENGINE (D-49): every encryption draws a new
// 16-byte salt and a new 12-byte IV with crypto.getRandomValues and passes
// them to encryptText, which is otherwise a pure function. That is why the
// same text and passphrase give a different string every time.
//
// NOTHING LEAVES THE PAGE: the text, the passphrase and the results live only
// in this component's state. No storage, no request, and the page writes
// nothing to its own address. The fields are not inside a form and have no
// name attribute, and spell checking is switched off on them
// (spellcheck="false"; the docs say why and what the attribute cannot
// promise).
//
// SHARE RESULTS (2026-10-27, PRIME): one button in each mode builds, only
// when pressed, a link that carries the encrypted string alone (the spec in
// src/lib/tools/text-encryption/share.ts; the button is ShareResultsButton).
// The button is handed the string and nothing else, never the passphrase or
// the plaintext. An arriving link (useShareArrival) is accepted only when its
// #input= is a well-formed string of this format: the page opens in Decrypt
// mode with it, says it came from a link, and decrypts only when the reader
// types the passphrase and presses Decrypt. Anything else is ignored. Either
// way the address loses the value at once (history.replaceState, not a
// request), so the page's own Share button and a reload carry nothing.
//
// The engine (src/lib/tools/text-encryption) does all the cryptography through
// the browser's Web Cryptography API. Styling reuses existing classes (cidr-*,
// jwt-*, json-*, seg-*, b64-copy, hpf-btn, cipher-note); no new CSS class.
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react"; // state, memoised values, the staleness ticket
import { useTranslations } from "next-intl"; // this tool's messages
import {
  decryptText, // open a string
  encryptText, // seal a text
  parseEnvelope, // read a string's fields
  passphraseFacts, // counts for the passphrase note
  DEFAULT_ITERATIONS, // 600,000
  MIN_ITERATIONS, // 1,000, for the messages
  MAX_ITERATIONS, // 10,000,000, for the messages
  MAX_TEXT_BYTES, // 1 MiB, for the messages
  MAX_PASSPHRASE_CHARS, // 1,024, for the messages
  MAX_INPUT_CHARS, // 2,000,000, for the messages
  SALT_BYTES, // 16
  IV_BYTES, // 12
  TAG_BYTES, // 16
  EXAMPLE_TEXT, // the Example's text (golden vector "example")
  EXAMPLE_PASSPHRASE, // the Example's passphrase, RFC 7914's published test password
  EXAMPLE_ENCRYPTED, // the Example's string (golden vector "example", fixed salt and IV)
  type DecryptResult, // what decryption gives
  type EncryptResult, // what encryption gives
  type TextEncryptionError, // a refusal
} from "@/lib/tools/text-encryption"; // the engine
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what the spec encodes
import { TEXT_ENCRYPTION_SHARE } from "@/lib/tools/text-encryption/share"; // this tool's share spec: the encrypted string only

/** Nothing to share (the button is disabled). */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // a constant, so the button sees no change

/** The two modes. */
type Mode = "encrypt" | "decrypt"; // which direction

/** Which Copy button last succeeded, for its "Copied" feedback. */
type CopiedWhat = "output" | "text" | null; // the encrypted string, the decrypted text, or neither

/** Local text encryption. */
export default function TextEncryptionTool() {
  const t = useTranslations("tools.text-encryption"); // this tool's messages

  const [mode, setMode] = useState<Mode>("encrypt"); // the direction
  const [text, setText] = useState(""); // Encrypt: the text
  const [encrypted, setEncrypted] = useState(""); // Decrypt: the pasted string
  const [passphrase, setPassphrase] = useState(""); // the passphrase, shared by both modes
  const [repeat, setRepeat] = useState(""); // Encrypt: the passphrase typed again
  const [shown, setShown] = useState(false); // whether the passphrase fields show their text
  const [busy, setBusy] = useState(false); // a derivation is running (600,000 iterations take a moment)
  const [encResult, setEncResult] = useState<EncryptResult | null>(null); // the last encryption
  const [decResult, setDecResult] = useState<DecryptResult | null>(null); // the last decryption
  const [copied, setCopied] = useState<CopiedWhat>(null); // the Copy feedback
  const [arrived, setArrived] = useState<string | null>(null); // the string an arriving share link filled in, while it is unchanged

  // A result belongs to the inputs it was computed from: every change bumps the ticket, and a result whose ticket is
  // no longer current is dropped when it arrives, so a slow derivation can never show an answer for older inputs.
  const ticketRef = useRef(0); // the current ticket

  // An arriving share link: only a well-formed encrypted string is accepted (the spec's decode); it opens Decrypt
  // mode, filled in, and nothing is decrypted until the reader asks. The hook has already cleaned the address.
  useShareArrival(TEXT_ENCRYPTION_SHARE, (state) => {
    ticketRef.current++; // any derivation in flight is now stale
    setBusy(false); // the page is free
    setEncResult(null); // results belong to older inputs
    setDecResult(null); // in either mode
    setMode("decrypt"); // the string is to be opened
    setEncrypted(state.encrypted); // the string, compact
    setPassphrase(""); // a new string is a new task: a passphrase typed for an earlier one does not carry over
    setRepeat(""); // nor its repetition
    setShown(false); // and the fields are masked again
    setArrived(state.encrypted); // say where it came from, while unchanged
  });

  /** Forget every result and any derivation in flight (called on every input change). */
  const invalidate = useCallback(() => {
    ticketRef.current++; // results in flight are now stale
    setBusy(false); // the page is free again
    setEncResult(null); // stale results never outlive their input
    setDecResult(null); // in either mode
    setCopied(null); // nor does the Copy feedback
  }, []); // stable

  // What the pasted string says, before any passphrase: read synchronously, no cryptography.
  const parsed = useMemo(() => (encrypted.trim() === "" ? null : parseEnvelope(encrypted)), [encrypted]); // null while empty

  // Counts about the passphrase (Encrypt mode): length and kinds of character, never a score.
  const facts = useMemo(() => (passphrase === "" ? null : passphraseFacts(passphrase)), [passphrase]); // null while empty

  /** Whether the two passphrase fields disagree (only once the second has been typed into). */
  const mismatch = repeat !== "" && repeat !== passphrase; // shown as a note

  /** Whether Encrypt may run. */
  const canEncrypt = !busy && text !== "" && passphrase !== "" && repeat === passphrase; // both fields equal

  /** Whether Decrypt may run. */
  const canDecrypt = !busy && parsed !== null && parsed.ok && passphrase !== ""; // a readable string and a passphrase

  // What Share results may carry: the encrypted string, from Encrypt's output or Decrypt's field, and nothing else.
  const encryptShare = useMemo(() => (encResult && encResult.ok ? TEXT_ENCRYPTION_SHARE.encode({ encrypted: encResult.output }) : NOTHING), [encResult]); // Encrypt mode
  const decryptShare = useMemo(() => (parsed && parsed.ok ? TEXT_ENCRYPTION_SHARE.encode({ encrypted }) : NOTHING), [parsed, encrypted]); // Decrypt mode

  /** Encrypt: draw a new salt and IV, then seal. */
  async function onEncrypt() {
    if (!canEncrypt) return; // the button is disabled anyway
    const c = (globalThis as { crypto?: Crypto }).crypto; // the browser's crypto object
    if (!c || typeof c.getRandomValues !== "function") { // no secure randomness on this page
      setEncResult({ ok: false, error: { code: "no-crypto" } }); // say so; nothing is encrypted
      return; // stop
    } // no crypto
    const salt = c.getRandomValues(new Uint8Array(SALT_BYTES)); // 128 random bits (W3C Web Crypto, getRandomValues)
    const iv = c.getRandomValues(new Uint8Array(IV_BYTES)); // 96 random bits, new for every encryption
    const ticket = ++ticketRef.current; // this run's ticket
    setBusy(true); // the derivation takes a moment
    setEncResult(null); // the previous string goes away while the new one is made
    const r = await encryptText({ text, passphrase, salt, iv, iterations: DEFAULT_ITERATIONS }); // the engine
    if (ticket !== ticketRef.current) return; // the inputs changed meanwhile: drop this result
    setBusy(false); // done
    setEncResult(r); // show it
  } // onEncrypt

  /** Decrypt: derive and open. */
  async function onDecrypt() {
    if (!canDecrypt) return; // the button is disabled anyway
    const ticket = ++ticketRef.current; // this run's ticket
    setBusy(true); // the derivation takes a moment
    setDecResult(null); // the previous text goes away while this runs
    const r = await decryptText({ input: encrypted, passphrase }); // the engine
    if (ticket !== ticketRef.current) return; // the inputs changed meanwhile: drop this result
    setBusy(false); // done
    setDecResult(r); // show the text, or the refusal (never both)
  } // onDecrypt

  /** Switch mode; results are cleared, the passphrase stays (so a string can be checked right after it is made). */
  function switchMode(next: Mode) {
    if (next === mode) return; // nothing to do
    invalidate(); // results belong to the other mode
    setMode(next); // switch
  } // switchMode

  /** After encrypting: open the new string in Decrypt mode, with the same passphrase, to check it. */
  function checkInDecrypt() {
    if (!encResult || !encResult.ok) return; // nothing to check
    const out = encResult.output; // the string just made
    invalidate(); // a new task
    setEncrypted(out); // the string
    setMode("decrypt"); // the other direction
  } // checkInDecrypt

  /** D-83 Example: verbatim from golden vector "example", in the current mode. */
  function loadExample() {
    invalidate(); // a new task
    setArrived(null); // the Example is not a shared link
    if (mode === "encrypt") { // the text and its passphrase, twice
      setText(EXAMPLE_TEXT); // the vector's text
      setRepeat(EXAMPLE_PASSPHRASE); // typed again
    } else { // the vector's string
      setEncrypted(EXAMPLE_ENCRYPTED); // made with a fixed salt and IV, 600,000 iterations
    } // mode
    setPassphrase(EXAMPLE_PASSPHRASE); // RFC 7914's published test password, marked as such below
  } // loadExample

  /** Clear: every field in both modes, every result, and the passphrase masked again. */
  function clearAll() {
    invalidate(); // nothing in flight, nothing shown
    setArrived(null); // the shared string is gone
    setText(""); // Encrypt's text
    setEncrypted(""); // Decrypt's string
    setPassphrase(""); // the passphrase
    setRepeat(""); // and its repetition
    setShown(false); // masked again
  } // clearAll

  /** Copy a value to the clipboard and say so for a moment. */
  function copy(value: string, what: Exclude<CopiedWhat, null>) {
    navigator.clipboard?.writeText(value).then(
      () => {
        setCopied(what); // show "Copied"
        setTimeout(() => setCopied((c) => (c === what ? null : c)), 1500); // then back to "Copy"
      },
      () => {}, // a refused clipboard changes nothing on the page
    ); // writeText
  } // copy

  /** The message for a refusal: its field when it has one, and the bounds as numbers the locale formats. */
  const errorMessage = (e: TextEncryptionError): string =>
    t(`errors.${e.code}`, {
      field: e.params?.field ?? "other", // ICU select on the field
      min: MIN_ITERATIONS, // 1,000
      max: MAX_ITERATIONS, // 10,000,000
      maxBytes: MAX_TEXT_BYTES, // 1 MiB
      maxChars: MAX_PASSPHRASE_CHARS, // 1,024
      maxInput: MAX_INPUT_CHARS, // 2,000,000
      tag: TAG_BYTES, // 16
    }); // the localised message

  /** The kinds of character present, as one localised list. */
  const kinds = facts
    ? [
        facts.lowercase && t("facts.lowercase"), // a-z and other lowercase letters
        facts.uppercase && t("facts.uppercase"), // A-Z and other uppercase letters
        facts.otherLetters && t("facts.otherLetters"), // letters without case
        facts.digits && t("facts.digits"), // digits
        facts.spaces && t("facts.spaces"), // spaces
        facts.symbols && t("facts.symbols"), // everything else
      ].filter(Boolean).join(", ") // joined
    : ""; // nothing typed

  /** The shared passphrase field (and, in Encrypt mode, its repetition). */
  const passphraseFields = (
    <div className="cidr-input-row">
      <div className="dig-input-head">
        <label className="cidr-label" htmlFor="tenc-pass">
          {t("passphraseLabel")}
        </label>
        <div className="dig-input-actions">
          {/* Show or hide both passphrase fields; the label names the action. */}
          <button type="button" className="b64-copy" aria-controls={mode === "encrypt" ? "tenc-pass tenc-repeat" : "tenc-pass"} onClick={() => setShown((s) => !s)}>
            {shown ? t("hide") : t("show")}
          </button>
        </div>
      </div>
      {/* Not inside a form, no name attribute: nothing can submit it anywhere. */}
      <input
        id="tenc-pass"
        className="cidr-input mono"
        type={shown ? "text" : "password"}
        value={passphrase}
        onChange={(e) => { invalidate(); setPassphrase(e.target.value); }}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        aria-describedby="tenc-pass-note"
      />
      {mode === "encrypt" && (
        <>
          <label className="cidr-label" htmlFor="tenc-repeat">
            {t("repeatLabel")}
          </label>
          <input
            id="tenc-repeat"
            className="cidr-input mono"
            type={shown ? "text" : "password"}
            value={repeat}
            onChange={(e) => { invalidate(); setRepeat(e.target.value); }}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
          {/* The two fields must agree: a typo here would lock the text away for good. */}
          {mismatch && <p className="cidr-error" role="alert">{t("mismatch")}</p>}
        </>
      )}
      <div id="tenc-pass-note">
        {/* The Example's passphrase is public: say so whenever it is in the field. */}
        {passphrase === EXAMPLE_PASSPHRASE && <p className="cidr-error">{t("examplePassphraseNote")}</p>}
        {/* Encrypt mode: counts, never a score. */}
        {mode === "encrypt" && facts && (
          <>
            <p className="json-stats">
              <span className="json-stat">{t("facts.length", { n: facts.characters, bytes: facts.utf8Bytes })}</span>
              {kinds !== "" && <span className="json-stat">{t("facts.contains", { kinds })}</span>}
            </p>
            {facts.edgeWhitespace && <p className="cipher-note">{t("facts.edgeWhitespace")}</p>}
            {facts.prepared && <p className="cipher-note">{t("facts.prepared")}</p>}
            <p className="cipher-note">{t("facts.noScore")}</p>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="cidr-tool jwt-tool">
      {/* The direction. */}
      <div className="seg-group">
        <div className="seg" role="group" aria-label={t("modeLabel")}>
          <button type="button" className={`seg-btn${mode === "encrypt" ? " seg-btn--active" : ""}`} aria-pressed={mode === "encrypt"} onClick={() => switchMode("encrypt")}>
            {t("modeEncrypt")}
          </button>
          <button type="button" className={`seg-btn${mode === "decrypt" ? " seg-btn--active" : ""}`} aria-pressed={mode === "decrypt"} onClick={() => switchMode("decrypt")}>
            {t("modeDecrypt")}
          </button>
        </div>
      </div>

      {/* The text (Encrypt) or the string (Decrypt), with the D-83 Example/Clear row. */}
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="tenc-input">
            {mode === "encrypt" ? t("textLabel") : t("encryptedLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={loadExample}>
              {t("example")}
            </button>
            <button type="button" className="b64-copy" onClick={clearAll}>
              {t("clear")}
            </button>
          </div>
        </div>
        <textarea
          id="tenc-input"
          className="cidr-input mono saml-textarea json-input"
          rows={mode === "encrypt" ? 8 : 5}
          value={mode === "encrypt" ? text : encrypted}
          onChange={(e) => { invalidate(); if (mode === "encrypt") setText(e.target.value); else setEncrypted(e.target.value); }}
          placeholder={mode === "encrypt" ? t("textPlaceholder") : t("encryptedPlaceholder")}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-describedby="tenc-privacy"
        />
        <p id="tenc-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            ●
          </span>{" "}
          {t("runsLocally")}
        </p>
      </div>

      {/* Decrypt: what the string says, before any passphrase. */}
      {mode === "decrypt" && parsed && !parsed.ok && (
        <div className="json-error-box" role="alert">
          <p className="json-error-headline">{t("notAStringTitle")}</p>
          <p className="json-error-message">{errorMessage(parsed.error)}</p>
        </div>
      )}
      {mode === "decrypt" && parsed && parsed.ok && (
        <dl className="jwt-claims">
          <div className="jwt-claim-row">
            <dt className="jwt-claim-label">{t("fields.version")}</dt>
            <dd className="jwt-claim-value mono">{parsed.envelope.version}</dd>
          </div>
          <div className="jwt-claim-row">
            <dt className="jwt-claim-label">{t("fields.iterations")}</dt>
            <dd className="jwt-claim-value">{t("fields.iterationsValue", { n: parsed.envelope.iterations })}</dd>
          </div>
          <div className="jwt-claim-row">
            <dt className="jwt-claim-label">{t("fields.sizes")}</dt>
            <dd className="jwt-claim-value">
              {t("fields.sizesValue", { salt: parsed.envelope.salt.length, iv: parsed.envelope.iv.length, ciphertext: parsed.envelope.sealed.length - TAG_BYTES, tag: TAG_BYTES })}
            </dd>
          </div>
        </dl>
      )}
      {/* The string came from a shared link: the passphrase never does. */}
      {mode === "decrypt" && arrived !== null && encrypted === arrived && <p className="cipher-note">{t("share.arrived")}</p>}

      {passphraseFields}

      {/* The action. */}
      <div className="hpf-actions">
        {mode === "encrypt" ? (
          <button type="button" className="hpf-btn" onClick={() => void onEncrypt()} disabled={!canEncrypt}>
            {busy ? t("working") : t("encryptButton")}
          </button>
        ) : (
          <button type="button" className="hpf-btn" onClick={() => void onDecrypt()} disabled={!canDecrypt}>
            {busy ? t("working") : t("decryptButton")}
          </button>
        )}
      </div>

      {/* Decrypt mode: share the string being opened (never the passphrase, never the decrypted text). After the
          Decrypt action, so the main path (string, passphrase, Decrypt) is not interrupted by a secondary one. */}
      {mode === "decrypt" && parsed && parsed.ok && (
        <div className="rdap-ask-row">
          <ShareResultsButton encoding={decryptShare} carries={t("share.carries")} title={t("name")} />
        </div>
      )}

      {/* Encrypt: the refusal. */}
      {mode === "encrypt" && encResult && !encResult.ok && (
        <div className="json-error-box" role="alert">
          <p className="json-error-headline">{t("encryptFailedTitle")}</p>
          <p className="json-error-message">{errorMessage(encResult.error)}</p>
        </div>
      )}

      {/* Encrypt: the string. */}
      {mode === "encrypt" && encResult && encResult.ok && (
        <div className="jwt-results">
          <section className="jwt-panel">
            <div className="json-output-head">
              <h4 className="jwt-panel-title">{t("outputTitle")}</h4>
              <button type="button" className="json-copy-btn" onClick={() => copy(encResult.output, "output")}>
                {copied === "output" ? t("copied") : t("copy")}
              </button>
            </div>
            {/* Read-only, so it wraps and can be selected; a read-only field is never spell-checked. */}
            <textarea className="cidr-input mono jwt-input" readOnly rows={4} value={encResult.output} aria-label={t("outputTitle")} spellCheck={false} />
            {/* Share results right under the string it shares, at the start of its own row (the popover opens below it). */}
            <div className="rdap-ask-row">
              <ShareResultsButton encoding={encryptShare} carries={t("share.carries")} title={t("name")} />
            </div>
            <p className="json-stats">
              <span className="json-stat">{t("stats.iterations", { n: encResult.iterations })}</span>
              <span className="json-stat">{t("stats.saltIv", { salt: SALT_BYTES, iv: IV_BYTES })}</span>
              <span className="json-stat">{t("stats.sizes", { text: encResult.textBytes, sealed: encResult.sealedBytes, tag: TAG_BYTES })}</span>
              <span className="json-stat">{t("stats.characters", { n: encResult.output.length })}</span>
            </p>
            {encResult.notes.includes("passphrase-prepared") && <p className="cipher-note">{t("notes.passphrase-prepared")}</p>}
            <p className="cipher-note">{t("freshEveryTime")}</p>
            <p className="cipher-note">{t("lengthShows")}</p>
            <div className="rdap-ask-row">
              <button type="button" className="b64-copy" onClick={checkInDecrypt}>
                {t("checkInDecrypt")}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Decrypt: the refusal, with no text at all. */}
      {mode === "decrypt" && decResult && !decResult.ok && (
        <div className="json-error-box" role="alert">
          <p className="json-error-headline">{decResult.error.code === "auth-failed" ? t("authFailedTitle") : t("decryptFailedTitle")}</p>
          <p className="json-error-message">{errorMessage(decResult.error)}</p>
        </div>
      )}

      {/* Decrypt: the authenticated text. */}
      {mode === "decrypt" && decResult && decResult.ok && (
        <div className="jwt-results">
          <section className="jwt-panel">
            <div className="json-output-head">
              <h4 className="jwt-panel-title">{t("decryptedTitle")}</h4>
              <button type="button" className="json-copy-btn" onClick={() => copy(decResult.text, "text")}>
                {copied === "text" ? t("copied") : t("copy")}
              </button>
            </div>
            <div className="jwt-badges">
              <span className="jwt-badge jwt-badge--ok mono">{t("authenticatedBadge")}</span>
            </div>
            <textarea className="cidr-input mono saml-textarea json-input" readOnly rows={6} value={decResult.text} aria-label={t("decryptedTitle")} spellCheck={false} />
            <p className="json-stats">
              <span className="json-stat">{t("stats.iterations", { n: decResult.iterations })}</span>
              <span className="json-stat">{t("stats.textBytes", { n: decResult.textBytes })}</span>
            </p>
            {decResult.notes.map((n) => (
              <p key={n} className="cipher-note">{t(`notes.${n}`)}</p>
            ))}
            <p className="cipher-note">{t("authenticatedNote")}</p>
          </section>
        </div>
      )}
    </div>
  );
}
