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
// verdict's chime (the green check after an LGTM, and since PRIME's 15/11/2026
// 21:08 request a falling figure after "Changes requested") sounds by itself
// when Stamp is pressed, landing with the stamp, and its button stays to play
// it again at will (PRIME 16/11/2026 02:58: "sound the LGTM chimes
// automatically, and leave the buttons so the user can replay them at will").
// The example stamped on load stays silent: no tap, no sound. The audio is in
// src/components/dev/fun/lgtmAudio.ts, which also lets an iPhone in silent
// mode play it. Beside the stamp stands a little bot (PRIME 16/11/2026 03:06:
// "a happy green bot when the stamp is LGTM, and a sad red bot when the stamp
// is "changes requested""): an original drawing in the verdict's colour, arms
// up and hopping after an LGTM, slumped with a tear after changes requested;
// it moves only when motion is allowed. Clicking it (PRIME 16/11/2026 03:14:
// "let clicking on it make it repeat the animation - or, better yet, cycle
// through 3 more animations, then looping back restarting with the original
// one") plays its next move: the happy bot hops, spins, wiggles and boings
// (its antenna light blinking); the sad one slumps, shivers, shakes its head
// and sighs (its tear falling and forming again); the fifth click is the
// first move again. It is a button named for that, the drawing inside it
// hidden from screen readers (the stamp's words carry the verdict).
// The text box shows its line numbers in a gutter on its left (PRIME 16/11/2026 04:03: "In LGTM-stamp, show the line
// numbers"), the same numbers the findings quote; while the box still holds the text that was stamped, the numbers of
// the lines with a finding are marked in the verdict's colour. The box does not wrap lines, so each number sits beside
// its line, and the gutter scrolls with the box.
// ============================================================================

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { stamp, STAMP_EXAMPLE, type StampResult } from "@/lib/fun/lgtm/stamp";
import { playChime } from "@/components/dev/fun/lgtmAudio";

/** The stamp's fall in seconds: the lgtm-stamp-fall animation in src/app/fun-lgtm.css (0.2s), so the chime lands with it. */
const STAMP_FALL_S = 0.2;

/**
 * Whether the reader asked for reduced motion: then the stamp lands without falling, and the chime sounds at once.
 *
 * @returns true when reduced motion is set
 */
function reducedMotion(): boolean {
  // Read where the browser can answer; a browser that cannot is taken as not reduced.
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/** Shared stroke settings for the bot: round ends and joins, like the shelf's drawings (GameGlyph). */
const BOT_STROKE = { fill: "none", stroke: "currentColor", strokeWidth: 2.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** The bot's four moves, in click order, each a class of fun-lgtm.css (written out, so the stylesheet guards can read
 *  each name): the first is the move it makes when the stamp lands, played again on every fourth click. */
const BOT_MOVES = ["lgtm-bot-m0", "lgtm-bot-m1", "lgtm-bot-m2", "lgtm-bot-m3"] as const;

/**
 * The verdict's bot, drawn on a 64 by 72 grid in currentColor (green for LGTM, red for changes requested, set by its
 * class). Happy: antenna light on, smiling eyes and mouth, cheeks, a check on its chest, arms raised. Sad: antenna bent
 * and its light off, worried brows, a tear, a frown, a cross on its chest, arms hanging. A button: each click plays its
 * next move of four (PRIME 16/11/2026 03:14); the drawing itself is hidden from screen readers, since the stamp beside
 * it says the verdict, and the button is named by `label`.
 *
 * @param props.happy true for the LGTM bot, false for the changes-requested bot
 * @param props.label the button's accessible name, in the reader's language
 * @returns the bot
 */
function VerdictBot({ happy, label }: { happy: boolean; label: string }) {
  // Clicks so far: 0 is the move made on landing; each click plays the next of the four, round and round.
  const [step, setStep] = useState(0);
  // The move to play: none extra on landing (the entry animation runs), then BOT_MOVES in turn, the first again at 4.
  const move = step === 0 ? "" : ` ${BOT_MOVES[step % BOT_MOVES.length]}`;
  return (
    <button type="button" className="lgtm-bot-button" aria-label={label} onClick={() => setStep((s) => s + 1)}>
      <svg
        className={`lgtm-bot ${happy ? "lgtm-bot-happy" : "lgtm-bot-sad"}${move}`}
        viewBox="0 0 64 72"
        width="72"
        height="81"
        aria-hidden="true"
        focusable="false"
      >
        {happy ? (
          <>
            {/* The antenna, straight, its light on. */}
            <path d="M32 14V8" {...BOT_STROKE} />
            <circle cx="32" cy="5.5" r="3.2" fill="currentColor" className="lgtm-bot-bulb" />
          </>
        ) : (
          <>
            {/* The antenna, bent over, its light off. */}
            <path d="M32 14v-4q0-3.5 4.5-4.5" {...BOT_STROKE} />
            <circle cx="39" cy="5.5" r="2.8" {...BOT_STROKE} />
          </>
        )}
        {/* The head: a rounded screen, filled with the page's surface so the face reads in both themes. */}
        <rect x="14" y="14" width="36" height="28" rx="8" className="lgtm-bot-face" {...BOT_STROKE} />
        {happy ? (
          <>
            {/* Smiling eyes: two arcs bowed upwards. */}
            <path d="M21 28q4-5 8 0M35 28q4-5 8 0" {...BOT_STROKE} />
            {/* A wide smile. */}
            <path d="M24 33q8 7 16 0" {...BOT_STROKE} />
            {/* Cheeks, faint. */}
            <circle cx="19.5" cy="33" r="2.2" fill="currentColor" opacity="0.35" />
            <circle cx="44.5" cy="33" r="2.2" fill="currentColor" opacity="0.35" />
          </>
        ) : (
          <>
            {/* Worried brows: low at the outer ends, raised towards the middle (the other slant would read as anger). */}
            <path d="M21 26l7-2.5M43 26l-7-2.5" {...BOT_STROKE} />
            {/* Small eyes under them. */}
            <circle cx="25" cy="29.5" r="2" fill="currentColor" />
            <circle cx="39" cy="29.5" r="2" fill="currentColor" />
            {/* A tear from the left eye. */}
            <path d="M23 33q-2.2 3.2 0 4.8q2.2-1.6 0-4.8z" fill="currentColor" opacity="0.6" className="lgtm-bot-tear" />
            {/* A frown. */}
            <path d="M25 38.5q7-6 14 0" {...BOT_STROKE} />
          </>
        )}
        {/* The neck. */}
        <path d="M29 42v3M35 42v3" {...BOT_STROKE} />
        {/* The body. */}
        <rect x="18" y="45" width="28" height="19" rx="6" {...BOT_STROKE} />
        {/* On the chest, the verdict in a sign: a check, or a cross. */}
        {happy ? <path d="M26 55l4 4l8-8" {...BOT_STROKE} /> : <path d="M28 51l8 8M36 51l-8 8" {...BOT_STROKE} />}
        {/* The arms: raised in a cheer, or hanging. */}
        {happy ? <path d="M18 50L9 39M46 50L55 39" {...BOT_STROKE} /> : <path d="M18 50L12 62M46 50L52 62" {...BOT_STROKE} />}
        {/* The hands. */}
        {happy ? (
          <>
            <circle cx="8" cy="37.5" r="2.6" fill="currentColor" />
            <circle cx="56" cy="37.5" r="2.6" fill="currentColor" />
          </>
        ) : (
          <>
            <circle cx="11.3" cy="63.5" r="2.6" fill="currentColor" />
            <circle cx="52.7" cy="63.5" r="2.6" fill="currentColor" />
          </>
        )}
        {/* The feet. */}
        <path d="M25 64v5M39 64v5" {...BOT_STROKE} />
      </svg>
    </button>
  );
}

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
  // The text the verdict is about: the gutter marks the findings' lines only while the box still holds it.
  const [stamped, setStamped] = useState<string>(STAMP_EXAMPLE);
  // The gutter, scrolled with the box (PRIME 16/11/2026 04:03).
  const gutterRef = useRef<HTMLDivElement | null>(null);
  // How many lines the box holds (Windows line ends counted once, as the checks read them).
  const lineCount = useMemo(() => text.replace(/\r\n?/g, "\n").split("\n").length, [text]);
  // The lines with a finding, while the box still holds the stamped text (the whole-text finding has no line).
  const flagged = useMemo(
    () => new Set(result && text === stamped ? result.findings.map((f) => f.line).filter((n) => n > 0) : []),
    [result, text, stamped],
  );

  // Stamp the box's text.
  const onStamp = () => {
    // The checks.
    const next = stamp(text);
    setResult(next);
    // The text this verdict is about.
    setStamped(text);
    // A new fall.
    setRound((r) => r + 1);
    // The verdict's chime, by itself, inside this tap (an empty box has no verdict and no chime); it lands with the
    // stamp, or at once when the stamp does not fall (PRIME 16/11/2026 02:58).
    if (next.verdict !== "empty") playChime(next.verdict === "lgtm" ? "lgtm" : "changes", reducedMotion() ? 0 : STAMP_FALL_S);
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
        {/* The box and its line numbers in one frame: the gutter on the left, hidden from screen readers (the findings
            say each line number in words), the box beside it. */}
        <div className="lgtm-stamp-editor">
          <div
            className="lgtm-stamp-gutter"
            ref={gutterRef}
            aria-hidden="true"
            // Wide enough for the longest number plus the gutter's padding: the gutter's own size is contained (so its
            // numbers never stretch the box), so its width is given here.
            style={{ minWidth: `calc(${String(lineCount).length}ch + 1.3rem)` }}
          >
            {Array.from({ length: lineCount }, (_, i) => (
              // One number a line; a line with a finding is marked.
              <span key={i} className={flagged.has(i + 1) ? "lgtm-stamp-ln lgtm-stamp-ln-flagged" : "lgtm-stamp-ln"}>
                {i + 1}
              </span>
            ))}
          </div>
          <textarea
            id="lgtm-stamp-input"
            className="cidr-input jwt-input mono lgtm-stamp-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            // The gutter follows the box's vertical scroll, so each number stays beside its line.
            onScroll={(e) => {
              if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop;
            }}
            rows={10}
            wrap="off"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
          />
        </div>
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
            {/* The stamp and its bot, side by side: keyed by the press, so the stamp falls and the bot reacts again each
                time. */}
            <div key={round} className="lgtm-stamp-verdict">
              {/* The stamp. */}
              <p className={`lgtm-stamp-mark ${result.verdict === "lgtm" ? "lgtm-stamp-mark-ok" : "lgtm-stamp-mark-no"}`}>
                {result.verdict === "lgtm" ? t("verdictLgtm") : t("verdictChanges")}
              </p>
              {/* The bot: happy and green for LGTM, sad and red for changes requested (PRIME 16/11/2026 03:06). */}
              <VerdictBot happy={result.verdict === "lgtm"} label={t("botAgain")} />
            </div>
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
            {/* The verdict's chime again, at will: the green check after an LGTM, the falling figure after "Changes
                requested" (PRIME 15/11/2026 21:08); it already sounded once with the stamp (PRIME 16/11/2026 02:58). */}
            <button type="button" className="fg-button" onClick={() => playChime(result.verdict === "lgtm" ? "lgtm" : "changes")}>
              {t("chime")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
