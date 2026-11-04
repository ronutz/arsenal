"use client";

// ============================================================================
// src/components/HashPreimageFinderTool.tsx
// ----------------------------------------------------------------------------
// Paste a hash, pick an alphabet + length, and watch a bounded local brute-force
// search either recover a weak input or run out of keyspace. All hashing and
// searching is pure and local (compute.ts); this component only drives it and
// renders progress. The search is chunked with setTimeout so the Cancel button
// stays responsive and the page never fully locks, and it is hard-capped so it
// cannot run away. Every outcome is paired with the standard defenses, because
// the point of the tool is the lesson, not the crack.
//
// SHARE RESULTS (2026-10-27): under the search's result, a button builds a link
// only when pressed, carrying the search as set up (the hash, the alphabet,
// the length), never what a search found (src/lib/tools/hash-preimage-finder/
// share.ts, posture input-caution: whoever opens the link can repeat the
// search). An arriving link (useShareArrival) stops any search, fills the three
// fields and waits: a note asks for Start search, which only the reader presses.
//
// UP AND DOWN ARROWS (03/11/2026): the maximum length has a down and an up
// arrow beside it (src/components/NumberStepper.tsx), from 1 to the alphabet's
// cap, so it is set with a mouse or a finger too.
// ============================================================================

import { useCallback, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { StepperField } from "@/components/NumberStepper"; // the up and down arrows beside the length field
import {
  run,
  detectAlgorithm,
  keyspaceSize,
  CHARSETS,
  ALGO_META,
  type CharsetId,
  type HashAlgo,
  type PreimageResult,
} from "@/lib/tools/hash-preimage-finder";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what the spec encodes
import { PREIMAGE_SHARE } from "@/lib/tools/hash-preimage-finder/share"; // this tool's share spec: the search as set up

/** Nothing to share: a constant, so the button sees no change between renders. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // the button is disabled

// Candidates per chunk (keeps each timeout slice short so Cancel registers).
const TICK = 120_000;
// Overall browser budget: the search stops here even if the keyspace is larger,
// which is itself the lesson for high-entropy inputs.
const UI_CAP = 50_000_000;

const CHARSET_ORDER: CharsetId[] = ["digits", "lower", "lower-digits", "mixed-alpha", "mixed-alnum"];

function CopyButton({ text, label, done }: { text: string; label: string; done: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="hpf-copy"
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
    >
      {copied ? done : label}
    </button>
  );
}

/** A count in the page's number format. */
const fmt = (n: number, locale: string): string => n.toLocaleString(locale);
/** A count, or its exponent form from ten million up, in the page's number format. */
const fmtExp = (n: number, locale: string): string => (n >= 1e7 ? n.toExponential(1) : n.toLocaleString(locale));

interface Progress {
  attempts: number;
  elapsedMs: number;
  done: boolean;
}

// D-83 Example samples — verbatim from this tool's golden vectors.
const EXAMPLE = "d41d8cd98f00b204e9800998ecf8427e";

export default function HashPreimageFinderTool() {
  const t = useTranslations("tools.hash-preimage-finder");
  // The page's locale, for counts in its own number format (27/10/2026: they were always en-US).
  const locale = useLocale();

  const [hashInput, setHashInput] = useState("");
  const [charset, setCharset] = useState<CharsetId>("digits");
  const [maxLength, setMaxLength] = useState(6);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<Progress>({ attempts: 0, elapsedMs: 0, done: false });
  const [result, setResult] = useState<PreimageResult | null>(null);

  const cancelRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const target = hashInput.trim();
  const algo: HashAlgo | null = useMemo(() => detectAlgorithm(target), [target]);
  const preset = CHARSETS[charset];
  const effectiveMax = Math.max(1, Math.min(maxLength, preset.maxLength));
  const keyspace = useMemo(
    () => keyspaceSize(preset.chars.length, effectiveMax),
    [preset.chars.length, effectiveMax],
  );

  const stop = useCallback(() => {
    cancelRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    setRunning(false);
  }, []);

  const start = useCallback(() => {
    if (!algo) return;
    cancelRef.current = false;
    setResult(null);
    setRunning(true);
    const startTime = Date.now();
    let idx = 0;
    let attempts = 0;

    const tick = () => {
      if (cancelRef.current) {
        setRunning(false);
        setProgress({ attempts, elapsedMs: Date.now() - startTime, done: true });
        return;
      }
      const r = run({ hash: target, charset, maxLength: effectiveMax, maxCandidates: TICK, startIndex: idx });
      idx = r.nextIndex;
      attempts += r.attempts;
      const elapsedMs = Date.now() - startTime;

      if (r.found) {
        setResult(r);
        setRunning(false);
        setProgress({ attempts, elapsedMs, done: true });
        return;
      }
      if (r.exhausted) {
        setResult(r);
        setRunning(false);
        setProgress({ attempts, elapsedMs, done: true });
        return;
      }
      if (attempts >= UI_CAP) {
        // Stop at the browser budget; surface a "budget reached" result.
        setResult({ ...r, budgetReached: true, exhausted: false });
        setRunning(false);
        setProgress({ attempts, elapsedMs, done: true });
        return;
      }
      setProgress({ attempts, elapsedMs, done: false });
      timerRef.current = setTimeout(tick, 0);
    };
    timerRef.current = setTimeout(tick, 0);
  }, [algo, target, charset, effectiveMax]);

  // -- Share results --
  // The hash an arriving link filled in, until a search runs or the field changes.
  const [arrivedHash, setArrivedHash] = useState<string | null>(null);
  // An arriving share link: any search stops, the three fields fill, and nothing runs until the reader presses Start.
  useShareArrival(PREIMAGE_SHARE, (s) => {
    stop(); // a search in progress stops
    setResult(null); // no result from an earlier search
    setProgress({ attempts: 0, elapsedMs: 0, done: false }); // no progress either
    setHashInput(s.hash); // the hash
    setCharset(s.charset); // the alphabet
    setMaxLength(s.length); // the length
    setArrivedHash(s.hash); // the note
  });
  // What Share results may carry: the search as set up, once the page recognises the hash.
  const share = useMemo<ShareEncoding>(() => (algo ? PREIMAGE_SHARE.encode({ hash: target, charset, length: effectiveMax }) : NOTHING), [algo, target, charset, effectiveMax]); // memoised
  // True while an arrived search waits for Start.
  const awaitingStart = arrivedHash !== null && target === arrivedHash && !running && progress.attempts === 0; // the note shows

  const rate = progress.elapsedMs > 0 ? Math.round((progress.attempts / progress.elapsedMs) * 1000) : 0;
  const pct = keyspace > 0 ? Math.min(100, (progress.attempts / Math.min(keyspace, UI_CAP)) * 100) : 0;

  return (
    <div className="cidr-tool jwt-tool dig-tool hpf-tool">
      {/* --- Input --- */}
      <div className="dig-input-head">
        <label className="cidr-label" htmlFor="hpf-hash">{t("hashLabel")}</label>
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={() => setHashInput(EXAMPLE)}>{t("example")}</button>
          <button type="button" className="b64-copy" onClick={() => setHashInput("")}>{t("clear")}</button>
        </div>
      </div>
      <input
        id="hpf-hash"
        className="cidr-input dig-mono"
        value={hashInput}
        onChange={(e) => setHashInput(e.target.value)}
        placeholder={t("hashPlaceholder")}
        spellCheck={false}
        autoComplete="off"
      />
      <div className="hpf-detect">
        {target === "" ? (
          <span className="hpf-detect-none">{t("detectHint")}</span>
        ) : algo ? (
          <>
            <span className="hpf-algo-badge dig-mono">{algo.toUpperCase()}</span>
            {ALGO_META[algo].broken && <span className="hpf-broken">{t("brokenNote")}</span>}
          </>
        ) : (
          <span className="hpf-detect-bad">{t("notDetected")}</span>
        )}
      </div>

      {/* --- Keyspace controls --- */}
      <div className="hpf-controls">
        <div className="hpf-field">
          <span className="cidr-label">{t("charsetLabel")}</span>
          <div className="hpf-charset-row">
            {CHARSET_ORDER.map((id) => (
              <button
                key={id}
                type="button"
                className={"hpf-chip" + (charset === id ? " hpf-chip--on" : "")}
                onClick={() => setCharset(id)}
                disabled={running}
              >
                {t("charset." + id)}
              </button>
            ))}
          </div>
        </div>
        <div className="hpf-field hpf-field--len">
          <label className="cidr-label" htmlFor="hpf-len">{t("maxLengthLabel")}</label>
          {/* Up and down arrows: one character a press, whole lengths from 1 to the alphabet's cap, set as typing would; off while
              searching. */}
          <StepperField value={effectiveMax} onValue={(v) => setMaxLength(Number(v) || 1)} min={1} max={preset.maxLength} integer label={t("maxLengthLabel")} inputId="hpf-len" disabled={running}>
            <input
              id="hpf-len"
              type="number"
              min={1}
              max={preset.maxLength}
              value={effectiveMax}
              onChange={(e) => setMaxLength(Number(e.target.value) || 1)}
              className="cidr-input hpf-len-input dig-mono"
              disabled={running}
            />
          </StepperField>
          <span className="hpf-len-cap">{t("lengthCap", { max: preset.maxLength })}</span>
        </div>
      </div>

      <div className="hpf-keyspace">
        {t("keyspacePreview", { n: fmtExp(keyspace, locale) })}
        {keyspace > UI_CAP && <span className="hpf-keyspace-warn"> {t("keyspaceBeyond", { cap: fmtExp(UI_CAP, locale) })}</span>}
      </div>

      {/* --- Run / Cancel --- */}
      <div className="hpf-actions">
        {!running ? (
          <button type="button" className="hpf-btn" onClick={start} disabled={!algo}>
            {t("start")}
          </button>
        ) : (
          <button type="button" className="hpf-btn hpf-cancel" onClick={stop}>
            {t("cancel")}
          </button>
        )}
      </div>
      {/* After a link: the search waits for the reader. */}
      {awaitingStart && <p className="cipher-note">{t("share.arrived")}</p>}

      {/* --- Progress --- */}
      {(running || progress.attempts > 0) && (
        <div className="hpf-progress">
          <div className="hpf-progress-bar">
            <div className="hpf-progress-fill" style={{ width: pct + "%" }} />
          </div>
          <div className="hpf-progress-stats dig-mono">
            <span>{t("attemptsStat", { a: fmt(progress.attempts, locale) })}</span>
            {rate > 0 && <span>{t("rateStat", { r: fmt(rate, locale) })}</span>}
            <span>{(progress.elapsedMs / 1000).toFixed(1)}s</span>
          </div>
        </div>
      )}

      {/* --- Result --- */}
      {result && progress.done && (
        <div className={"hpf-result " + (result.found ? "hpf-result--found" : "hpf-result--miss")}>
          {result.found ? (
            <>
              <div className="hpf-result-head">{t("found")}</div>
              <div className="hpf-preimage dig-mono">
                <span>{result.preimage}</span>
                <CopyButton text={result.preimage ?? ""} label={t("copy")} done={t("copied")} />
              </div>
              <div className="hpf-result-sub">
                {t("foundIn", { attempts: fmt(progress.attempts, locale), ms: fmt(progress.elapsedMs, locale) })}
              </div>
            </>
          ) : (
            <>
              <div className="hpf-result-head">
                {result.exhausted ? t("notFoundExhausted") : t("notFoundBudget", { cap: fmtExp(UI_CAP, locale) })}
              </div>
              <div className="hpf-result-sub">
                {result.exhausted ? t("exhaustedSub") : t("budgetSub", { n: fmtExp(result.keyspaceSize, locale) })}
              </div>
            </>
          )}
        </div>
      )}

      {/* --- Share results: under the search and its result, before the lesson --- */}
      <div className="rdap-ask-row">
        <ShareResultsButton encoding={share} carries={t("share.carries")} details={[t("share.caution")]} title={t("name")} />
      </div>

      {/* --- The lesson (always shown) --- */}
      <div className="hpf-teach">
        <div className="hpf-teach-head">{t("teach.head")}</div>
        <p className="hpf-teach-intro">{t("teach.intro")}</p>
        <div className="hpf-teach-grid">
          <div className="hpf-teach-card">
            <div className="hpf-teach-title">{t("teach.salt.title")}</div>
            <p>{t("teach.salt.body")}</p>
          </div>
          <div className="hpf-teach-card">
            <div className="hpf-teach-title">{t("teach.kdf.title")}</div>
            <p>{t("teach.kdf.body")}</p>
          </div>
          <div className="hpf-teach-card">
            <div className="hpf-teach-title">{t("teach.algo.title")}</div>
            <p>{t("teach.algo.body")}</p>
          </div>
        </div>
      </div>

      <p className="hpf-disclaimer">{t("disclaimer")}</p>
    </div>
  );
}
