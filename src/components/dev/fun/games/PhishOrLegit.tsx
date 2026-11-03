// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/games/PhishOrLegit.tsx
// ----------------------------------------------------------------------------
// PHISH OR LEGIT, the board (PRIME 03/11/2026). One card at a time: a link or
// an email sender, the brand it claims to be and that brand's real domain.
// The player answers with two big buttons, the left and right arrow keys, or
// a horizontal swipe; each answer names the tell (the rules and the texts are
// in src/lib/fun/games/phish-or-legit/engine.ts).
// Three modes: the daily round (15 cards, the same for everyone on a UTC day,
// saved as it goes), endless practice, and a 60-second speed run.
// Every address is rendered as plain text, never as a link.
//
// Review R2, 03/11/2026: the daily round is recorded the moment its fifteenth
// answer is saved, so a reload before "See the result" cannot lose it (R2-01);
// a From line shows the display name in the page's language (R2-06); on a
// phone the card and the two answer buttons come up sooner (a tighter heads-up
// line and card, the progress strip moved under the buttons; R2-09); the
// answer buttons are described by the card, and a new practice run or each
// new card of a speed run is announced (R2-14).
// ============================================================================

"use client";

// React's state, effects, refs and memo.
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
// The game's strings and the shell's.
import { useTranslations } from "next-intl";
// The frame: stats, rules, result.
import GameShell, { type ShellResult } from "./GameShell";
// Today's UTC day, and the reduced-motion preference.
import { useReducedMotion, useToday } from "@/lib/fun/hooks";
// The puzzle number of a day.
import { puzzleNumber } from "@/lib/fun/daily";
// The share card's text.
import { shareText } from "@/lib/fun/share";
// The record: results and the day's saved state.
import { loadRecord, recordResult, saveDailyState } from "@/lib/fun/storage";
// The rules.
import {
  GAME_ID,
  DAILY_SIZE,
  PASS_MARK,
  SPEED_PENALTY,
  SPEED_SECONDS,
  TELLS,
  brandById,
  dailyRound,
  emojiLine,
  nextPracticeCard,
  practiceRng,
  scoreRun,
  type Card,
  type Lang,
  type Verdict,
} from "@/lib/fun/games/phish-or-legit/engine";

/** The game's address below /dev/fun/. */
const SLUG = "phish-or-legit";

/** How far a swipe must travel, in pixels, to count as an answer. */
const SWIPE_PX = 70;

/** The three modes. */
type Mode = "daily" | "practice" | "speed";

/** What is saved for the daily round: the answers given, as p (phish) and l (legit). */
interface DailySave {
  /** One letter per answered card. */
  picks: string;
}

/** One answered card, for the feedback and the review. */
interface Answered {
  /** The card. */
  card: Card;
  /** What the player said. */
  pick: Verdict;
  /** Whether that was right. */
  ok: boolean;
}

/**
 * A fresh seed for practice and speed runs (the component picks it; the engine stays pure).
 *
 * @returns an unsigned 32-bit number
 */
function freshSeed(): number {
  // The clock's milliseconds and sub-milliseconds, mixed.
  return (Date.now() ^ Math.floor(performance.now() * 1000)) >>> 0;
}

/** The card's element id: the answer buttons are described by it, so focusing one reads the card (review R2-14). */
const CARD_ID = "fg-pol-card";

/**
 * A card in words, as the screen shows it: its kind, the brand it claims to be, and the link or the From line.
 *
 * @param card the card
 * @param t the game's strings
 * @param lang the language of the brand's name and the display name
 * @returns one sentence for the announcer
 */
function describeCard(card: Card, t: (key: string, values?: Record<string, string | number>) => string, lang: Lang): string {
  // The brand it claims.
  const brand = brandById(card.brand);
  // The link, or the From line with its display name in this language.
  const body = card.kind === "url" ? card.text : `${t("fromLabel")} ${card.display?.[lang] ?? ""} <${card.text}>`;
  // Kind, claim, body, and the context line when there is one.
  return [`${t(card.kind === "url" ? "kindUrl" : "kindEmail")}.`, `${t("claims", { brand: brand.name[lang] })} ${t("realAt", { domain: brand.domain })}.`, body, card.context ? card.context[lang] : ""].filter((x) => x !== "").join(" ");
}

/**
 * The Phish or Legit game.
 *
 * @param props the page's locale
 * @returns the game in its shell
 */
export default function PhishOrLegit({ locale }: { locale: string }) {
  // The game's strings.
  const t = useTranslations("devFun.games.phish-or-legit");
  // The shell's strings.
  const tc = useTranslations("devFun.games.common");
  // The explanations' language: Portuguese for pt-BR, English elsewhere.
  const lang: Lang = locale === "pt-BR" ? "pt" : "en";
  // Today, after mount.
  const today = useToday();
  // Whether to keep motion down.
  const reduce = useReducedMotion();
  // The mode.
  const [mode, setMode] = useState<Mode>("daily");
  // The answers of the current run, in order.
  const [answers, setAnswers] = useState<Answered[]>([]);
  // The card on the table (practice and speed runs; the daily round derives its own).
  const [card, setCard] = useState<Card | null>(null);
  // Whether the last answer's explanation is showing (daily and practice).
  const [showing, setShowing] = useState(false);
  // Whether the run is over.
  const [over, setOver] = useState(false);
  // The daily round was restored from storage (so it is not recorded twice).
  const [restored, setRestored] = useState(false);
  // The stats line re-reads storage when this changes.
  const [version, setVersion] = useState(0);
  // The speed run: when it ends (performance.now() milliseconds), or null when not running.
  const [endsAt, setEndsAt] = useState<number | null>(null);
  // Seconds left, shown.
  const [left, setLeft] = useState(SPEED_SECONDS);
  // The polite announcement.
  const [say, setSay] = useState("");
  // The swipe's horizontal travel.
  const [dx, setDx] = useState(0);
  // Where the swipe started, or null.
  const startX = useRef<number | null>(null);
  // The practice and speed generator.
  const rngRef = useRef(practiceRng(freshSeed()));
  // The Next button, focused after an answer.
  const nextRef = useRef<HTMLButtonElement | null>(null);
  // The Phish button, focused for the next card.
  const phishRef = useRef<HTMLButtonElement | null>(null);

  // The day's cards.
  const daily = useMemo(() => (today ? dailyRound(today) : []), [today]);

  // Restore the daily round once the day is known.
  useEffect(() => {
    // Only for the daily round, once today is known.
    if (!today) return;
    // The saved state.
    const saved = loadRecord(GAME_ID).daily[today] as DailySave | undefined;
    // Nothing saved: a fresh round.
    if (!saved || typeof saved.picks !== "string") return;
    // The answers, replayed against the day's cards.
    const replay: Answered[] = [];
    // Each saved letter.
    for (let i = 0; i < saved.picks.length && i < daily.length; i++) {
      // Phish or legit.
      const pick: Verdict = saved.picks[i] === "p" ? "phish" : "legit";
      // Kept with its card.
      replay.push({ card: daily[i], pick, ok: pick === daily[i].verdict });
    }
    // Restored.
    setAnswers(replay);
    // Finished already when all were answered.
    setOver(replay.length >= DAILY_SIZE);
    // Remember it was restored.
    setRestored(true);
  }, [today, daily]);

  // The card in play: the daily round's next, or the practice card.
  const current: Card | null = mode === "daily" ? (showing ? answers[answers.length - 1]?.card ?? null : daily[answers.length] ?? null) : card;

  // Start a mode afresh.
  const startMode = useCallback(
    (m: Mode) => {
      // The mode.
      setMode(m);
      // No explanation showing.
      setShowing(false);
      // No swipe.
      setDx(0);
      // Speed run not running yet.
      setEndsAt(null);
      // Full time.
      setLeft(SPEED_SECONDS);
      // The daily round is restored from storage; the others start empty.
      if (m === "daily") {
        // Back to the saved state.
        const saved = today ? (loadRecord(GAME_ID).daily[today] as DailySave | undefined) : undefined;
        // Its answers.
        const picks = saved?.picks ?? "";
        // Replayed.
        const replay = Array.from(picks).slice(0, daily.length).map((ch, i) => {
          // The verdict.
          const pick: Verdict = ch === "p" ? "phish" : "legit";
          // With its card.
          return { card: daily[i], pick, ok: pick === daily[i].verdict };
        });
        // Restored.
        setAnswers(replay);
        // Over when complete.
        setOver(replay.length >= DAILY_SIZE);
        // Counted as restored.
        setRestored(true);
        // No practice card.
        setCard(null);
        // Done.
        return;
      }
      // A new generator for this run.
      rngRef.current = practiceRng(freshSeed());
      // Nothing answered.
      setAnswers([]);
      // Not over.
      setOver(false);
      // The first card.
      const first = nextPracticeCard(rngRef.current, []);
      // On the table.
      setCard(first);
      // Practice keeps the focus on its mode button, so its first card is spoken (a speed run focuses the answer buttons,
      // which the card describes; review R2-14).
      if (m === "practice") setSay(describeCard(first, t, lang));
    },
    [today, daily, t, lang],
  );

  // Answer the card in play.
  const answer = useCallback(
    (pick: Verdict) => {
      // Nothing to answer, or the explanation is up, or the run is over.
      if (!current || showing || over) return;
      // A speed run must be running.
      if (mode === "speed" && endsAt === null) return;
      // Right or wrong.
      const ok = pick === current.verdict;
      // The run so far, with this answer.
      const next = [...answers, { card: current, pick, ok }];
      // Kept.
      setAnswers(next);
      // The swipe resets.
      setDx(0);
      // The announcement.
      const verdictWord = t(current.verdict === "phish" ? "phish" : "legit");
      // Spoken politely.
      setSay(t(ok ? "announceRight" : "announceWrong", { verdict: verdictWord, tell: TELLS[current.tell].name[lang] }));
      // The daily round is saved after every answer.
      if (mode === "daily" && today) {
        // As letters.
        saveDailyState(GAME_ID, today, { picks: next.map((a) => (a.pick === "phish" ? "p" : "l")).join("") } satisfies DailySave);
        // The fifteenth answer finishes the round: recorded now, with the pass mark for the streak, so a reload before
        // "See the result" cannot lose it (the restore never records; review R2-01).
        if (next.length >= DAILY_SIZE) recordResult(GAME_ID, { dayKey: today, won: scoreRun(next.map((a) => a.ok)).correct >= PASS_MARK, daily: true });
      }
      // A speed run moves straight on; a wrong answer costs time.
      if (mode === "speed") {
        // The penalty.
        if (!ok) setEndsAt((e) => (e === null ? e : e - SPEED_PENALTY * 1000));
        // The next card, avoiding the last few.
        const following = nextPracticeCard(rngRef.current, next.slice(-12).map((a) => a.card.id));
        // On the table.
        setCard(following);
        // The focus stays on the buttons, so the new card is spoken after the verdict (review R2-14).
        setSay(`${t(ok ? "announceRight" : "announceWrong", { verdict: verdictWord, tell: TELLS[current.tell].name[lang] })} ${describeCard(following, t, lang)}`);
        // Done here.
        return;
      }
      // Daily and practice show the explanation.
      setShowing(true);
    },
    [current, showing, over, mode, endsAt, answers, t, lang, today],
  );

  // Move on from the explanation.
  const advance = useCallback(() => {
    // Only while an explanation shows.
    if (!showing) return;
    // Hidden.
    setShowing(false);
    // The answer buttons take the focus back once they render again.
    window.setTimeout(() => phishRef.current?.focus(), 0);
    // The daily round may be finished.
    if (mode === "daily") {
      // All answered: the round is over.
      if (answers.length >= DAILY_SIZE) {
        // Over (the result was recorded with the fifteenth answer).
        setOver(true);
        // The stats line re-reads, so the streak changes with the result.
        setVersion((v) => v + 1);
        // Not restored: this round was played now.
        setRestored(false);
      }
      // Done.
      return;
    }
    // Practice: the next card.
    setCard(nextPracticeCard(rngRef.current, answers.slice(-12).map((a) => a.card.id)));
  }, [showing, mode, answers]);

  // After an answer, focus Next; after Next, focus Phish, so the keyboard flow never gets lost.
  useEffect(() => {
    // The explanation's button, or the answer buttons.
    if (showing) nextRef.current?.focus();
  }, [showing]);

  // The speed run's clock.
  useEffect(() => {
    // Only while running.
    if (endsAt === null || over) return;
    // A few times a second.
    const id = window.setInterval(() => {
      // What is left.
      const ms = endsAt - performance.now();
      // Shown in whole seconds.
      setLeft(Math.max(0, Math.ceil(ms / 1000)));
      // Time is up.
      if (ms <= 0) {
        // Over.
        setOver(true);
        // Stopped.
        setEndsAt(null);
      }
    }, 200);
    // Cleared.
    return () => window.clearInterval(id);
  }, [endsAt, over]);

  // Record the speed run when it ends.
  const recordedSpeed = useRef(false);
  // When the run is over in speed mode.
  useEffect(() => {
    // Only a finished speed run, once.
    if (mode !== "speed" || !over || recordedSpeed.current || !today) return;
    // Recorded.
    recordedSpeed.current = true;
    // Its score: right answers.
    recordResult(GAME_ID, { dayKey: today, won: answers.some((a) => a.ok), score: scoreRun(answers.map((a) => a.ok)).correct, higherIsBetter: true });
    // The stats line re-reads.
    setVersion((v) => v + 1);
    // Announced.
    setSay(t("speedHeadline", { correct: scoreRun(answers.map((a) => a.ok)).correct }));
  }, [mode, over, today, answers, t]);

  // Show the speed run's start screen.
  const openSpeed = () => {
    // The mode.
    setMode("speed");
    // A clean slate.
    setOver(false);
    // No answers.
    setAnswers([]);
    // No card until it starts.
    setCard(null);
    // Not running.
    setEndsAt(null);
    // Full time.
    setLeft(SPEED_SECONDS);
    // No explanation.
    setShowing(false);
  };

  // Start the speed run.
  const startSpeed = () => {
    // A new run can be recorded.
    recordedSpeed.current = false;
    // Fresh.
    startMode("speed");
    // The clock starts now.
    setEndsAt(performance.now() + SPEED_SECONDS * 1000);
    // Focus the answer buttons.
    window.setTimeout(() => phishRef.current?.focus(), 0);
  };

  // The keyboard: left is phish, right is legit; Enter and Space go on from an explanation (the focused button does that natively).
  useEffect(() => {
    // One listener on the window.
    const onKey = (e: KeyboardEvent) => {
      // Not while typing, and not with modifier keys.
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      // The element in focus.
      const el = e.target as HTMLElement | null;
      // Inputs keep their keys.
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      // Left arrow: phish.
      if (e.key === "ArrowLeft" && current && !showing && !over) {
        // Not a page scroll.
        e.preventDefault();
        // Answered.
        answer("phish");
      } else if (e.key === "ArrowRight" && current && !showing && !over) {
        // Not a page scroll.
        e.preventDefault();
        // Answered.
        answer("legit");
      }
    };
    // Listening.
    window.addEventListener("keydown", onKey);
    // Stopped.
    return () => window.removeEventListener("keydown", onKey);
  }, [answer, current, showing, over]);

  // A swipe starts.
  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // Only when an answer is expected.
    if (!current || showing || over) return;
    // Where it started.
    startX.current = e.clientX;
    // Keep the pointer while it moves.
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  // A swipe moves.
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    // Not swiping.
    if (startX.current === null) return;
    // The travel so far.
    setDx(e.clientX - startX.current);
  };
  // A swipe ends.
  const onUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    // Not swiping.
    if (startX.current === null) return;
    // The travel.
    const travel = e.clientX - startX.current;
    // Done swiping.
    startX.current = null;
    // Far enough left: phish; right: legit; else nothing.
    if (travel <= -SWIPE_PX) answer("phish");
    // Right.
    else if (travel >= SWIPE_PX) answer("legit");
    // Back to the middle.
    else setDx(0);
  };

  // The run's score.
  const score = scoreRun(answers.map((a) => a.ok));
  // The last answer, for the explanation.
  const last = answers[answers.length - 1];

  // The result for the shell.
  let result: ShellResult | null = null;
  // The daily round, finished.
  if (mode === "daily" && over && today) {
    // Right or wrong per card.
    const oks = answers.map((a) => a.ok);
    // The result.
    result = {
      // Won at the pass mark.
      won: score.correct >= PASS_MARK,
      // n of 15.
      headline: t("dailyHeadline", { correct: score.correct, total: DAILY_SIZE }),
      // Points and the best streak.
      detail: t("dailyDetail", { points: score.points, streak: score.bestStreak }),
      // "Phish or Legit #N 13/15" and the squares.
      share: shareText({ title: t("shareTitle", { n: puzzleNumber(today), correct: score.correct, total: DAILY_SIZE }), lines: [emojiLine(oks)], summary: t("pointsNow", { n: score.points }), locale, slug: SLUG }),
    };
  } else if (mode === "speed" && over) {
    // The speed run's result.
    result = {
      // Any right answer is a finished run.
      won: score.correct > 0,
      // n right in 60 seconds.
      headline: t("speedHeadline", { correct: score.correct }),
      // Wrong answers and points.
      detail: t("speedDetail", { wrong: answers.length - score.correct, points: score.points }),
      // The card, with at most 30 squares.
      share: shareText({ title: t("shareSpeed", { correct: score.correct }), lines: [emojiLine(answers.slice(0, 30).map((a) => a.ok)) + (answers.length > 30 ? "…" : "")], locale, slug: SLUG }),
    };
  } else if (mode === "practice" && over) {
    // The practice session's result.
    result = {
      // Always a finish.
      won: true,
      // n of m.
      headline: t("practiceHeadline", { correct: score.correct, total: answers.length }),
      // Points.
      detail: t("pointsNow", { n: score.points }),
      // The card.
      share: shareText({ title: t("sharePractice", { correct: score.correct, total: answers.length }), lines: [emojiLine(answers.slice(-30).map((a) => a.ok))], locale, slug: SLUG }),
    };
  }

  // The rules.
  const rules = (
    <ul>
      {["rule1", "rule2", "rule3", "rule4", "rule5"].map((k) => (
        <li key={k}>{t(k)}</li>
      ))}
    </ul>
  );

  // The card's brand, for the claim line.
  const brand = current ? brandById(current.brand) : null;
  // The swipe's visual travel (none under reduced motion).
  const travel = reduce ? 0 : Math.max(-120, Math.min(120, dx));
  // Which way the swipe leans, for the hint colour.
  const lean = dx <= -SWIPE_PX / 2 ? "fg-pol-lean-phish" : dx >= SWIPE_PX / 2 ? "fg-pol-lean-legit" : "";

  // The board.
  return (
    <GameShell
      gameId={GAME_ID}
      kind={mode === "daily" ? "daily" : mode === "speed" ? "score" : "free"}
      today={today}
      rules={rules}
      result={result}
      onPlayAgain={mode === "speed" ? startSpeed : () => startMode("practice")}
      formatBest={(b) => t("bestFormat", { n: b })}
      version={version}
    >
      {/* The polite announcer. */}
      <p className="sr-only" aria-live="polite">
        {say}
      </p>

      {/* The modes. */}
      <div className="fg-pol-modes" role="group" aria-label={t("modesLabel")}>
        <button type="button" className="fg-button fg-pol-mode" aria-pressed={mode === "daily"} onClick={() => startMode("daily")}>
          {tc("daily")}
        </button>
        <button type="button" className="fg-button fg-pol-mode" aria-pressed={mode === "practice"} onClick={() => startMode("practice")}>
          {tc("practice")}
        </button>
        <button type="button" className="fg-button fg-pol-mode" aria-pressed={mode === "speed"} onClick={openSpeed}>
          {t("speed")}
        </button>
      </div>

      {/* Before mount: a neutral board, the same on the server and the first render. */}
      {!today && <p className="fg-muted">{tc("loading")}</p>}

      {/* The heads-up line: progress, points, streak or time. */}
      {today && !(mode === "speed" && endsAt === null && !over) && (
        <div className="fg-hud fg-pol-hud">
          {mode === "daily" && <span className="fg-readout">{t("progress", { n: Math.min(answers.length + (showing || over ? 0 : 1), DAILY_SIZE), total: DAILY_SIZE })}</span>}
          {mode === "speed" && <span className="fg-readout">{t("speedLeft", { s: left })}</span>}
          <span className="fg-readout">{t("pointsNow", { n: score.points })}</span>
          <span className="fg-chip">{t("inRow", { n: currentStreak(answers) })}</span>
        </div>
      )}

      {/* The speed run's start screen. */}
      {today && mode === "speed" && endsAt === null && !over && (
        <div className="fg-pol-start">
          <p className="fg-pol-start-text">{t("speedIntro")}</p>
          <button type="button" className="fg-button fg-button-primary" onClick={startSpeed}>
            {t("speedStart")}
          </button>
        </div>
      )}

      {/* The card. */}
      {today && current && brand && !over && (
        <div
          id={CARD_ID}
          className={`fg-pol-card ${lean}`}
          style={travel ? { transform: `translateX(${travel}px) rotate(${travel / 24}deg)` } : undefined}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={() => { startX.current = null; setDx(0); }}
        >
          <div className="fg-pol-card-head">
            <span className="fg-pol-kind">{t(current.kind === "url" ? "kindUrl" : "kindEmail")}</span>
            <span className="fg-pol-claim">
              {t("claims", { brand: brand.name[lang] })} <span className="fg-mono">{t("realAt", { domain: brand.domain })}</span>
            </span>
          </div>
          {current.kind === "url" ? (
            <p className="fg-pol-text">{current.text}</p>
          ) : (
            <p className="fg-pol-text">
              <span className="fg-pol-from">{t("fromLabel")}</span> {current.display?.[lang]} &lt;{current.text}&gt;
            </p>
          )}
          {current.context && <p className="fg-pol-context">{current.context[lang]}</p>}
        </div>
      )}

      {/* The answer buttons. */}
      {today && current && !over && !showing && !(mode === "speed" && endsAt === null) && (
        <div className="fg-pol-answers">
          <button type="button" ref={phishRef} className="fg-button fg-pol-answer fg-pol-answer-phish" aria-describedby={CARD_ID} onClick={() => answer("phish")}>
            <span aria-hidden="true">{"←"}</span> {t("phish")}
          </button>
          <button type="button" className="fg-button fg-pol-answer fg-pol-answer-legit" aria-describedby={CARD_ID} onClick={() => answer("legit")}>
            {t("legit")} <span aria-hidden="true">{"→"}</span>
          </button>
        </div>
      )}

      {/* The daily round's progress strip: one square per card, coloured once answered; under the buttons, so on a phone the
          card and the buttons come first (review R2-09). */}
      {today && mode === "daily" && (
        <ol className="fg-pol-strip" aria-label={t("stripLabel")}>
          {daily.map((c, i) => {
            // The answer for this card, if any.
            const a = answers[i];
            // Its state class.
            const cls = a ? (a.ok ? "fg-pol-dot fg-pol-dot-ok" : "fg-pol-dot fg-pol-dot-bad") : i === answers.length ? "fg-pol-dot fg-pol-dot-now" : "fg-pol-dot";
            // The square, labelled for screen readers.
            return <li key={c.id} className={cls} aria-label={a ? t(a.ok ? "dotRight" : "dotWrong", { n: i + 1 }) : t("dotOpen", { n: i + 1 })} />;
          })}
        </ol>
      )}

      {/* The keyboard and swipe hint. */}
      {today && current && !over && !showing && !(mode === "speed" && endsAt === null) && <p className="fg-muted fg-small fg-pol-hint">{t(mode === "speed" ? "keysHintSpeed" : "keysHint")}</p>}

      {/* The last answer in a speed run: one line, no pause. */}
      {mode === "speed" && last && !over && (
        <p className={`fg-pol-flash ${last.ok ? "fg-pol-ok" : "fg-pol-bad"}`}>
          {t(last.ok ? "right" : "wrong")} {t(last.card.verdict === "phish" ? "isPhish" : "isLegit")}: {TELLS[last.card.tell].name[lang]}
        </p>
      )}

      {/* The explanation of the last answer (daily and practice). */}
      {showing && last && (
        <div className={`fg-pol-feedback ${last.ok ? "fg-pol-ok" : "fg-pol-bad"}`}>
          <p className="fg-pol-verdict">
            {t(last.ok ? "right" : "wrong")} {t(last.card.verdict === "phish" ? "isPhish" : "isLegit")}
            <span className="fg-pol-tell">{TELLS[last.card.tell].name[lang]}</span>
          </p>
          <p className="fg-pol-explain">{last.card.explain[lang]}</p>
          {last.card.points.length > 0 && (
            <ul className="fg-pol-points" aria-label={t("pointsTitle")}>
              {last.card.points.map((p) => (
                <li key={p.cp} className="fg-mono">
                  <span className="fg-pol-glyph">{p.ch}</span> {p.cp} {p.name}
                </li>
              ))}
            </ul>
          )}
          <div className="fg-buttons">
            <button type="button" ref={nextRef} className="fg-button fg-button-primary" onClick={advance}>
              {mode === "daily" && answers.length >= DAILY_SIZE ? t("seeResult") : t("next")}
            </button>
            {mode === "practice" && (
              <button type="button" className="fg-button" onClick={() => { setShowing(false); setOver(true); }}>
                {t("endPractice")}
              </button>
            )}
          </div>
        </div>
      )}

      {/* The review once a run is over: every card, its answer and its tell. */}
      {over && answers.length > 0 && (
        <details className="fg-pol-review" open={mode !== "daily" || !restored}>
          <summary className="fg-pol-review-title">{t("reviewTitle")}</summary>
          <ol className="fg-pol-review-list">
            {answers.map((a, i) => (
              <li key={`${a.card.id}-${i}`} className={a.ok ? "fg-pol-review-ok" : "fg-pol-review-bad"}>
                <p className="fg-pol-review-text fg-mono">{a.card.kind === "email" ? `${a.card.display?.[lang] ?? ""} <${a.card.text}>` : a.card.text}</p>
                <p className="fg-small">
                  <strong>{t(a.ok ? "right" : "wrong")}</strong> {t(a.card.verdict === "phish" ? "isPhish" : "isLegit")}: {TELLS[a.card.tell].name[lang]}. {a.ok ? "" : a.card.explain[lang]}
                </p>
              </li>
            ))}
          </ol>
        </details>
      )}

      {/* Practice and speed runs can be started again from the board too. */}
      {mode === "practice" && !over && !showing && answers.length > 0 && (
        <button type="button" className="fg-link-button" onClick={() => setOver(true)}>
          {t("endPractice")}
        </button>
      )}
    </GameShell>
  );
}

/**
 * The streak at the end of a run of answers.
 *
 * @param answers the answers so far
 * @returns how many of the last answers were right in a row
 */
function currentStreak(answers: readonly Answered[]): number {
  // Counted from the end.
  let n = 0;
  // Back from the last answer until a wrong one.
  for (let i = answers.length - 1; i >= 0 && answers[i].ok; i--) n++;
  // The streak.
  return n;
}
