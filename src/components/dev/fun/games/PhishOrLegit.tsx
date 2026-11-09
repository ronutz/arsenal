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
//
// Time (PRIME 08/11/2026: "Add time counting to Phish or Legit?"). The daily
// round and practice have a clock (the grid puzzles' useRoundClock, visible
// time only) that counts while a card waits for an answer and pauses while
// the explanation is read, so the time measures deciding, not reading. The
// daily round now waits for Start, as every timed game does (PRIME
// 06/11/2026): before it the card's place holds the cover and nothing of the
// day's cards is on the page. Its time is saved with its answers (e, and t
// once finished), so a reload resumes it running; it shows in the result and
// on the share card. The speed run keeps its own 60-second countdown.
//
// Languages (09/11/2026): the engine writes every text in English and
// Brazilian Portuguese; a pt-BR page reads the Portuguese, every other page
// reads its locale's own text for the English through useContentString()
// (src/i18n/content/<locale>/phish-or-legit.json, loaded by the page), and the
// English where none is written.
// ============================================================================

"use client";

// React's state, effects, refs and memo.
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
// The game's strings and the shell's.
import { useTranslations } from "next-intl";
// The strings this game keeps in code, in the page's language beyond en and pt-BR (09/11/2026).
import { useContentString } from "@/components/ContentStrings";
// The frame: stats, rules, result.
import GameShell, { type ShellResult } from "./GameShell";
// The Start cover and the clock that counts only visible time (shared with the grid puzzles).
import { StartCover, useRoundClock } from "./LogicPuzzleKit";
// Today's UTC day, and the reduced-motion preference.
import { useReducedMotion, useToday } from "@/lib/fun/hooks";
// The puzzle number of a day.
import { puzzleNumber } from "@/lib/fun/daily";
// The share card's text.
import { formatDuration, shareText } from "@/lib/fun/share";
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
  type Bi,
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
  /** Milliseconds counted so far (missing in a round saved before the clock existed: none). */
  e?: number;
  /** The final time, once the fifteenth card is answered. */
  t?: number;
}

/**
 * A usable time from a saved round (a missing or damaged field counts as none).
 *
 * @param x the stored value
 * @returns milliseconds, or null
 */
function savedMs(x: unknown): number | null {
  // A finite, non-negative number only.
  return typeof x === "number" && Number.isFinite(x) && x >= 0 ? x : null;
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

/**
 * The mark of a kept daily state, for days played before the marks existed (GameShell's gradeSaved): the fifteen picks against that day's cards, with the pass mark.
 *
 * @param day the round's day
 * @param state the kept state
 * @returns 1 passed, 0 finished below the mark, null not finished
 */
function gradeSaved(day: string, state: unknown): 0 | 1 | null {
  // The saved letters.
  const picks = (state as Partial<DailySave> | null)?.picks;
  // Finished means every card answered.
  if (typeof picks !== "string" || picks.length < DAILY_SIZE) return null;
  // The day's cards.
  const cards = dailyRound(day);
  // Each answer right or wrong, read as the game restores it ("p" phish, anything else legit).
  const oks = Array.from(picks.slice(0, DAILY_SIZE)).map((ch, i) => cards[i] !== undefined && (ch === "p" ? "phish" : "legit") === cards[i].verdict);
  // Passed or not.
  return scoreRun(oks).correct >= PASS_MARK ? 1 : 0;
}

/** The card's element id: the answer buttons are described by it, so focusing one reads the card (review R2-14). */
const CARD_ID = "fg-pol-card";

/**
 * A card in words, as the screen shows it: its kind, the brand it claims to be, and the link or the From line.
 *
 * @param card the card
 * @param t the game's strings
 * @param pick a text in the page's language (the brand's name, the display name, the context line)
 * @returns one sentence for the announcer
 */
function describeCard(card: Card, t: (key: string, values?: Record<string, string | number>) => string, pick: (b: Bi) => string): string {
  // The brand it claims.
  const brand = brandById(card.brand);
  // The link, or the From line with its display name in this language.
  const body = card.kind === "url" ? card.text : `${t("fromLabel")} ${card.display ? pick(card.display) : ""} <${card.text}>`;
  // Kind, claim, body, and the context line when there is one.
  return [`${t(card.kind === "url" ? "kindUrl" : "kindEmail")}.`, `${t("claims", { brand: pick(brand.name) })} ${t("realAt", { domain: brand.domain })}.`, body, card.context ? pick(card.context) : ""].filter((x) => x !== "").join(" ");
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
  // The explanations' language: Portuguese for pt-BR, English elsewhere (the source every other locale's text is keyed by).
  const lang: Lang = locale === "pt-BR" ? "pt" : "en";
  // The page's content strings: English in, the page's language out (the English where the locale has none written).
  const cs = useContentString();
  // A text in the page's language: the Portuguese inline on pt-BR, otherwise the English through the content strings.
  const inLang = useCallback((b: Bi) => (lang === "pt" ? b.pt : cs(b.en)), [lang, cs]);
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
  // The answers as saved letters, for the clock's own saves between renders.
  const picksRef = useRef("");
  // The clock of the daily round and of practice: it runs only while a card waits for an answer, and the daily round's
  // is saved with its answers when the page is hidden or closed and every few seconds (PRIME 08/11/2026).
  const clock = useRoundClock((ms) => {
    // Only the daily round keeps its time.
    if (mode === "daily" && today) saveDailyState(GAME_ID, today, { picks: picksRef.current, e: ms } satisfies DailySave);
  });
  // The time counted when the clock last paused for an explanation, to resume from.
  const pausedRef = useRef(0);
  // Whether the daily round has started (Start pressed, or a saved round came back).
  const [dailyStarted, setDailyStarted] = useState(false);
  // The finished run's time (the daily round's, or practice's), or null.
  const [finalMs, setFinalMs] = useState<number | null>(null);
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
    // The letters, for the clock's saves.
    picksRef.current = saved.picks;
    // The round had started.
    setDailyStarted(true);
    // Its time: final when finished, otherwise running again from where it was saved (a reload wins no time).
    const e = savedMs(saved.e) ?? 0;
    if (replay.length >= DAILY_SIZE) {
      // The final time (a round finished before the clock existed shows none).
      const fin = savedMs(saved.t);
      setFinalMs(fin);
      clock.reset(fin ?? 0);
    } else {
      // Running again.
      pausedRef.current = e;
      clock.start(e);
    }
    // The clock's functions are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, daily]);

  // The card in play: the daily round's next, or the practice card.
  const current: Card | null = mode === "daily" ? (showing ? answers[answers.length - 1]?.card ?? null : daily[answers.length] ?? null) : card;

  // Start a mode afresh.
  const startMode = useCallback(
    (m: Mode) => {
      // Leaving a running daily round: its time so far is saved, so coming back resumes it.
      if (mode === "daily" && m !== "daily" && dailyStarted && !over && today && clock.running) {
        // Stopped and banked.
        const ms = clock.stop();
        // Saved with its answers.
        saveDailyState(GAME_ID, today, { picks: picksRef.current, e: ms } satisfies DailySave);
      }
      // No final time on show until a run finishes.
      setFinalMs(null);
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
        // The letters, for the clock's saves.
        picksRef.current = picks;
        // Started if anything was saved (Start saves at once).
        const started = saved !== undefined;
        setDailyStarted(started);
        // Its time.
        const e = savedMs(saved?.e) ?? 0;
        if (replay.length >= DAILY_SIZE) {
          // Finished: the final time, stopped.
          const fin = savedMs(saved?.t);
          setFinalMs(fin);
          clock.reset(fin ?? 0);
        } else if (started) {
          // Running again from where it was left.
          pausedRef.current = e;
          clock.start(e);
        } else {
          // Not started: 0:00 until Start.
          clock.reset(0);
        }
        // Done.
        return;
      }
      // A new generator for this run.
      rngRef.current = practiceRng(freshSeed());
      // Nothing answered.
      setAnswers([]);
      // Not over.
      setOver(false);
      // Practice's clock starts with its first card; the speed run keeps its own countdown.
      if (m === "practice") {
        // From zero.
        pausedRef.current = 0;
        clock.start(0);
      } else clock.reset(0);
      // The first card.
      const first = nextPracticeCard(rngRef.current, []);
      // On the table.
      setCard(first);
      // Practice keeps the focus on its mode button, so its first card is spoken (a speed run focuses the answer buttons,
      // which the card describes; review R2-14).
      if (m === "practice") setSay(describeCard(first, t, inLang));
    },
    // The clock's functions are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [today, daily, t, inLang, mode, dailyStarted, over],
  );

  // Start the daily round: the first card and the clock together (PRIME 06/11/2026: timed games wait for Start).
  const startDaily = () => {
    // Only a daily round not started yet.
    if (mode !== "daily" || dailyStarted || !today || over) return;
    // Started.
    setDailyStarted(true);
    // The clock from zero.
    pausedRef.current = 0;
    clock.start(0);
    // Saved at once, so a reload resumes the round running rather than covered again.
    picksRef.current = "";
    saveDailyState(GAME_ID, today, { picks: "", e: 0 } satisfies DailySave);
    // The first card is spoken through the answer buttons, which it describes.
    window.setTimeout(() => phishRef.current?.focus(), 0);
  };

  // Answer the card in play.
  const answer = useCallback(
    (pick: Verdict) => {
      // Nothing to answer, or the explanation is up, or the run is over.
      if (!current || showing || over) return;
      // A speed run must be running, and the daily round must have started.
      if (mode === "speed" && endsAt === null) return;
      if (mode === "daily" && !dailyStarted) return;
      // Daily and practice: the clock pauses while the explanation is read (reading is free).
      const ms = mode === "speed" ? 0 : clock.stop();
      pausedRef.current = ms;
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
      setSay(t(ok ? "announceRight" : "announceWrong", { verdict: verdictWord, tell: inLang(TELLS[current.tell].name) }));
      // The daily round is saved after every answer.
      if (mode === "daily" && today) {
        // As letters.
        const picks = next.map((a) => (a.pick === "phish" ? "p" : "l")).join("");
        picksRef.current = picks;
        // The fifteenth answer fixes the round's time.
        const finished = next.length >= DAILY_SIZE;
        if (finished) setFinalMs(ms);
        // Saved with the time so far, or the final time.
        saveDailyState(GAME_ID, today, { picks, e: ms, ...(finished ? { t: ms } : {}) } satisfies DailySave);
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
        setSay(`${t(ok ? "announceRight" : "announceWrong", { verdict: verdictWord, tell: inLang(TELLS[current.tell].name) })} ${describeCard(following, t, inLang)}`);
        // Done here.
        return;
      }
      // Daily and practice show the explanation.
      setShowing(true);
    },
    // The clock's functions are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [current, showing, over, mode, endsAt, answers, t, inLang, today, dailyStarted],
  );

  // Move on from the explanation.
  const advance = useCallback(() => {
    // Only while an explanation shows.
    if (!showing) return;
    // Hidden.
    setShowing(false);
    // The clock runs again for the next card (not after the daily round's last one).
    if (!(mode === "daily" && answers.length >= DAILY_SIZE)) clock.start(pausedRef.current);
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
    // The clock's functions are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // End a practice session: the clock stops (or stays where the explanation paused it) and its time is kept.
  const endPractice = () => {
    // The explanation goes.
    setShowing(false);
    // The time.
    setFinalMs(clock.running ? clock.stop() : pausedRef.current);
    // Over.
    setOver(true);
  };

  // The daily round before Start: the cover instead of the card, so nothing of it is on the page yet.
  const covered = mode === "daily" && !!today && !dailyStarted && !over;
  // The time on show: the finished run's, else the clock's (daily once started, and practice).
  const shownTime = finalMs !== null && over ? finalMs : clock.ms;
  // Whether the time readout shows: the daily round once started, and practice.
  const timed = (mode === "daily" && (dailyStarted || over)) || mode === "practice";

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
      // Points and the best streak, and the time when the round had a clock.
      detail: `${t("dailyDetail", { points: score.points, streak: score.bestStreak })}${finalMs !== null ? ` ${t("timeTaken", { time: formatDuration(finalMs) })}` : ""}`,
      // "Phish or Legit #N 13/15", the squares, and the time when there is one.
      share: shareText({ title: t("shareTitle", { n: puzzleNumber(today), correct: score.correct, total: DAILY_SIZE }), lines: [emojiLine(oks), ...(finalMs !== null ? [`⏱️ ${formatDuration(finalMs)}`] : [])], summary: t("pointsNow", { n: score.points }), locale, slug: SLUG }),
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
      // Points, and the time.
      detail: `${t("pointsNow", { n: score.points })}${finalMs !== null ? `. ${t("timeTaken", { time: formatDuration(finalMs) })}` : ""}`,
      // The card.
      share: shareText({ title: t("sharePractice", { correct: score.correct, total: answers.length }), lines: [emojiLine(answers.slice(-30).map((a) => a.ok)), ...(finalMs !== null ? [`⏱️ ${formatDuration(finalMs)}`] : [])], locale, slug: SLUG }),
    };
  }

  // The rules.
  const rules = (
    <ul>
      {["rule1", "rule2", "rule3", "rule6", "rule4", "rule5"].map((k) => (
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
      gradeSaved={gradeSaved}
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
          {timed && (
            <span className="fg-readout" aria-label={`${tc("time")} ${formatDuration(shownTime)}`}>
              <span className="fg-small fg-muted">{tc("time")}</span> {formatDuration(shownTime)}
            </span>
          )}
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

      {/* The daily round before Start: the cover in the card's place (nothing of the round is on the page yet). */}
      {covered && <StartCover label={tc("start")} note={t("startNote")} onStart={startDaily} className="fg-pol-cover" />}

      {/* The card. */}
      {today && current && brand && !over && !covered && (
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
              {t("claims", { brand: inLang(brand.name) })} <span className="fg-mono">{t("realAt", { domain: brand.domain })}</span>
            </span>
          </div>
          {current.kind === "url" ? (
            <p className="fg-pol-text">{current.text}</p>
          ) : (
            <p className="fg-pol-text">
              <span className="fg-pol-from">{t("fromLabel")}</span> {current.display && inLang(current.display)} &lt;{current.text}&gt;
            </p>
          )}
          {current.context && <p className="fg-pol-context">{inLang(current.context)}</p>}
        </div>
      )}

      {/* The answer buttons. */}
      {today && current && !over && !showing && !covered && !(mode === "speed" && endsAt === null) && (
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
      {today && current && !over && !showing && !covered && !(mode === "speed" && endsAt === null) && <p className="fg-muted fg-small fg-pol-hint">{t(mode === "speed" ? "keysHintSpeed" : "keysHint")}</p>}

      {/* The last answer in a speed run: one line, no pause. */}
      {mode === "speed" && last && !over && (
        <p className={`fg-pol-flash ${last.ok ? "fg-pol-ok" : "fg-pol-bad"}`}>
          {t(last.ok ? "right" : "wrong")} {t(last.card.verdict === "phish" ? "isPhish" : "isLegit")}: {inLang(TELLS[last.card.tell].name)}
        </p>
      )}

      {/* The explanation of the last answer (daily and practice). */}
      {showing && last && (
        <div className={`fg-pol-feedback ${last.ok ? "fg-pol-ok" : "fg-pol-bad"}`}>
          <p className="fg-pol-verdict">
            {t(last.ok ? "right" : "wrong")} {t(last.card.verdict === "phish" ? "isPhish" : "isLegit")}
            <span className="fg-pol-tell">{inLang(TELLS[last.card.tell].name)}</span>
          </p>
          <p className="fg-pol-explain">{inLang(last.card.explain)}</p>
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
              <button type="button" className="fg-button" onClick={endPractice}>
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
                <p className="fg-pol-review-text fg-mono">{a.card.kind === "email" ? `${a.card.display ? inLang(a.card.display) : ""} <${a.card.text}>` : a.card.text}</p>
                <p className="fg-small">
                  <strong>{t(a.ok ? "right" : "wrong")}</strong> {t(a.card.verdict === "phish" ? "isPhish" : "isLegit")}: {inLang(TELLS[a.card.tell].name)}. {a.ok ? "" : inLang(a.card.explain)}
                </p>
              </li>
            ))}
          </ol>
        </details>
      )}

      {/* Practice and speed runs can be started again from the board too. */}
      {mode === "practice" && !over && !showing && answers.length > 0 && (
        <button type="button" className="fg-link-button" onClick={endPractice}>
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
