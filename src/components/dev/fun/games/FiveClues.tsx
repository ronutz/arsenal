// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/games/FiveClues.tsx
// ----------------------------------------------------------------------------
// FIVE CLUES, the board (PRIME 03/11/2026). A hidden IT category and up to
// five of its members, shown one at a time, the hardest first; the player
// guesses the category after each one. Fewer clues is better. Below it, the
// practice archive: the previous thirty days' puzzles and a few warm-ups,
// never a future one.
//
// The rules and the matcher live in src/lib/fun/games/five-clues/engine.ts,
// the puzzles in puzzles.ts beside it; this file shows clues, reads guesses
// and keeps the day's guesses in the shared store (src/lib/fun/storage.ts).
//
// Review R2, 03/11/2026: the clues not yet revealed are a row of small
// numbered marks instead of four full-width rows, so on a phone the guess box
// is on the first screen (R2-09); the category is named once at the end, in
// the round's reveal, and no longer again in the result panel (R2-12).
//
// Practice marks the puzzles already played (PRIME 03/11/2026): a past day
// whose daily round is still in the record (the last seven days) shows its
// result, and a puzzle played in practice shows that result (kept in the
// record's extra field as "practiced", by puzzle id, solved once is solved;
// pruned to the archive's puzzles and the warm-ups). In the picker each
// option reads "✓ solved" or "✗ not solved" after its name, and the line under
// it says, with a tick or a cross drawn beside the words, how the chosen
// puzzle went. The day's own result comes first when there are both.
// ============================================================================

"use client";

// React's state, effects, memos and refs.
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
// The strings.
import { useTranslations } from "next-intl";
// The frame: stats, rules, result.
import GameShell, { type ShellResult } from "./GameShell";
// The puzzle number of a day, and the day of a puzzle number (launch day plus n - 1).
import { addDays, LAUNCH_DAY, puzzleNumber } from "@/lib/fun/daily";
// Today's UTC day and the reduced-motion preference.
import { useReducedMotion, useToday } from "@/lib/fun/hooks";
// The share card.
import { shareText } from "@/lib/fun/share";
// The one storage key: the record, its daily states and its extra field.
import { loadRecord, recordResult, saveDailyState, updateRecord, type GameRecord } from "@/lib/fun/storage";
// The rules.
import { CLUES, GAME_ID, WARMUPS, archive, clueText, dailyFor, judge, langOf, puzzleFor, type Lang } from "@/lib/fun/games/five-clues/engine";
// The puzzle type.
import type { FivePuzzle } from "@/lib/fun/games/five-clues/puzzles";

/** The page slug, for the share card's address. */
const SLUG = "five-clues";

/** A round's progress: the guesses made (an empty string is a clue passed) and whether it was solved. */
interface Progress {
  /** One entry per clue used. */
  guesses: string[];
  /** Solved by the last guess. */
  solved: boolean;
}

/** A round not started. */
const FRESH: Progress = { guesses: [], solved: false };

/**
 * A day's saved progress, or a fresh round when the stored value is missing or malformed.
 *
 * @param saved whatever the store holds for the day
 * @returns the progress
 */
function restore(saved: unknown): Progress {
  // The stored object.
  const s = saved as Partial<Progress> | undefined;
  // Only an array of strings and a boolean are understood.
  if (!s || !Array.isArray(s.guesses) || !s.guesses.every((g) => typeof g === "string") || typeof s.solved !== "boolean") return FRESH;
  // At most five guesses.
  return { guesses: s.guesses.slice(0, CLUES), solved: s.solved };
}

/**
 * Whether a round is over.
 *
 * @param p its progress
 * @returns true when solved or out of clues
 */
function isOver(p: Progress): boolean {
  // Solved, or every clue used.
  return p.solved || p.guesses.length >= CLUES;
}

/** How a practice puzzle went before: on its day (from the daily states) or in practice, solved or not. */
interface PlayedMark {
  /** Where the result comes from. */
  from: "daily" | "practice";
  /** Solved. */
  solved: boolean;
  /** For a day's round: the clues it took. */
  clues: number;
}

/**
 * The practice results kept in the record's extra field, by puzzle id (true once solved), or none.
 *
 * @param v whatever the extra field holds under "practiced"
 * @returns the results
 */
function readPracticed(v: unknown): Record<string, boolean> {
  // Only an object is understood.
  if (!v || typeof v !== "object") return {};
  // Its boolean entries.
  return Object.fromEntries(Object.entries(v as Record<string, unknown>).filter(([, x]) => typeof x === "boolean")) as Record<string, boolean>;
}

/**
 * How a practice choice went before, if it was played: the day's own round first (kept for the last seven days),
 * then practice.
 *
 * @param key the choice: "n:<number>" for a past day, "w:<index>" for a warm-up
 * @param puzzle its puzzle
 * @param record the record, or null before it is read
 * @returns the mark, or null when it was never played (or nothing is known)
 */
function playedMark(key: string, puzzle: FivePuzzle, record: GameRecord | null): PlayedMark | null {
  // Nothing read yet.
  if (!record) return null;
  // A past day: its daily round, if the record still holds it and it was finished.
  if (key.startsWith("n:")) {
    // That day's state.
    const day = restore(record.daily[addDays(LAUNCH_DAY, Number(key.slice(2)) - 1)]);
    // A finished round is the mark.
    if (isOver(day)) return { from: "daily", solved: day.solved, clues: day.guesses.length };
  }
  // Practice: the stored result for this puzzle.
  const p = readPracticed(record.extra.practiced)[puzzle.id];
  // Played in practice, solved or not.
  return typeof p === "boolean" ? { from: "practice", solved: p, clues: 0 } : null;
}

/** A tick or a cross, drawn in the current colour; decorative (the words beside it carry the meaning). */
function MarkIcon({ solved }: { solved: boolean }) {
  // The SVG.
  return (
    <svg className="fg-five-mark-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {solved ? (
        <path d="M4.5 12.5l5 5L19.5 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      )}
    </svg>
  );
}

/** What a round needs from its owner. */
interface RoundProps {
  /** The puzzle. */
  puzzle: FivePuzzle;
  /** The language of the clues. */
  lang: Lang;
  /** The progress so far. */
  progress: Progress;
  /** Called with a guess that spends a clue (wrong, right, or passed). */
  onSpend: (guess: string, right: boolean) => void;
  /** A prefix for element ids. */
  idBase: string;
}

/**
 * One round: the clues revealed so far, the guesses after them, and the form while the round is open.
 *
 * @param props see RoundProps
 * @returns the round
 */
function Round({ puzzle, lang, progress, onSpend, idBase }: RoundProps) {
  // The game's strings.
  const t = useTranslations("devFun.games.five-clues");
  // Whether to skip the reveal pulse.
  const reduce = useReducedMotion();
  // The text being typed.
  const [text, setText] = useState("");
  // A hint that costs nothing ("close", "type something"), or null.
  const [note, setNote] = useState<string | null>(null);
  // The polite announcement.
  const [live, setLive] = useState("");
  // The input, for focus.
  const input = useRef<HTMLInputElement>(null);
  // Over: solved or out of clues.
  const done = isOver(progress);
  // How many clues are visible: one more than the guesses while playing, all five at the end.
  const visible = done ? CLUES : progress.guesses.length + 1;

  // A guess.
  const submit = (e: FormEvent) => {
    // No page reload.
    e.preventDefault();
    // The verdict.
    const v = judge(text, puzzle);
    // Nothing typed: say how to pass instead.
    if (v === "empty") {
      // The note.
      setNote(t("noteEmpty"));
      // Back to the box.
      input.current?.focus();
      // Nothing spent.
      return;
    }
    // Close: be more specific, no clue spent.
    if (v === "close") {
      // The note, announced too.
      setNote(t("noteClose", { guess: text.trim() }));
      // Announced.
      setLive(t("noteClose", { guess: text.trim() }));
      // Nothing spent.
      return;
    }
    // A clue is spent: right ends the round, wrong reveals the next clue.
    setNote(null);
    // Announced.
    setLive(v === "right" ? t("liveRight", { cat: puzzle.cat[lang] }) : progress.guesses.length + 1 >= CLUES ? t("liveOut", { cat: puzzle.cat[lang] }) : t("liveWrong", { guess: text.trim(), n: progress.guesses.length + 2, clue: clueText(puzzle.clues[progress.guesses.length + 1], lang) }));
    // Recorded by the owner.
    onSpend(text.trim(), v === "right");
    // The box empties for the next guess.
    setText("");
    // And keeps the focus.
    input.current?.focus();
  };

  // Pass: reveal the next clue without guessing (it costs the clue).
  const pass = () => {
    // Nothing to pass at the end.
    if (done) return;
    // No note.
    setNote(null);
    // Announced.
    setLive(progress.guesses.length + 1 >= CLUES ? t("liveOut", { cat: puzzle.cat[lang] }) : t("livePass", { n: progress.guesses.length + 2, clue: clueText(puzzle.clues[progress.guesses.length + 1], lang) }));
    // Spent.
    onSpend("", false);
    // Focus stays in the box.
    input.current?.focus();
  };

  // The round.
  return (
    <div className="fg-five-round">
      {/* The clues: revealed ones with the guess made after each, hidden ones as numbered blanks. */}
      <ol className="fg-five-clues" aria-label={t("cluesLabel")}>
        {puzzle.clues.map((c, i) => {
          // Not revealed yet: a small numbered mark, its words for screen readers only (review R2-09).
          if (i >= visible)
            return (
              <li key={i} className="fg-five-clue-hidden">
                <span className="fg-five-num" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="sr-only">{t("hiddenClue", { n: i + 1 })}</span>
              </li>
            );
          // The guess made after this clue, if any.
          const g = progress.guesses[i];
          // Whether that guess was the right one.
          const right = progress.solved && i === progress.guesses.length - 1;
          // A revealed clue.
          return (
            <li key={i} className={`fg-five-clue${!reduce && i === visible - 1 && !done ? " fg-pop" : ""}`}>
              <span className="fg-five-num" aria-hidden="true">
                {i + 1}
              </span>
              <span className="fg-five-text">
                <span className="sr-only">{t("clueN", { n: i + 1 })} </span>
                {clueText(c, lang)}
              </span>
              {g !== undefined && (
                <span className={`fg-five-guess ${right ? "fg-five-guess-right" : "fg-five-guess-wrong"}`}>
                  <span className="sr-only">{right ? t("srRight") : t("srWrong")} </span>
                  {g === "" ? t("passed") : g}
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {/* The form, while the round is open. */}
      {!done && (
        <form className="fg-five-form" onSubmit={submit} noValidate>
          <label className="fg-label" htmlFor={`${idBase}-guess`}>
            {t("guessLabel", { n: visible })}
          </label>
          <div className="fg-five-row">
            <input
              id={`${idBase}-guess`}
              ref={input}
              className="fg-input fg-five-input"
              type="text"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="send"
              placeholder={t("guessPlaceholder")}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button type="submit" className="fg-button fg-button-primary">
              {t("guess")}
            </button>
          </div>
          <div className="fg-buttons">
            <button type="button" className="fg-button" onClick={pass}>
              {visible >= CLUES ? t("giveUp") : t("nextClue")}
            </button>
          </div>
        </form>
      )}
      {note && <p className="fg-five-note">{note}</p>}

      {/* The answer and where the members come from, at the end. */}
      {done && (
        <div className="fg-five-reveal">
          <p className="fg-five-reveal-lead">{t("categoryWas")}</p>
          <p className="fg-five-reveal-cat">{puzzle.cat[lang]}</p>
          <p className="fg-small fg-muted">
            {t("sourceLead")}{" "}
            <a href={puzzle.source.url} target="_blank" rel="noopener noreferrer">
              {puzzle.source.label}
            </a>
          </p>
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {live}
      </p>
    </div>
  );
}

/**
 * The share card's squares: red for each clue spent without the answer, green for the one that found it, white for
 * the clues never needed.
 *
 * @param p the progress
 * @returns five squares
 */
function squares(p: Progress): string {
  // One per clue.
  return Array.from({ length: CLUES }, (_, i) => (i >= p.guesses.length ? "⬜" : p.solved && i === p.guesses.length - 1 ? "🟩" : "🟥")).join("");
}

/**
 * The game: the daily puzzle in the shell, the practice archive below it.
 *
 * @param props the page locale
 * @returns the game
 */
export default function FiveClues({ locale }: { locale: string }) {
  // The game's strings.
  const t = useTranslations("devFun.games.five-clues");
  // The shell's shared strings.
  const tc = useTranslations("devFun.games.common");
  // The clues' language.
  const lang = langOf(locale);
  // Today's UTC day, null until mount.
  const today = useToday();
  // Bumped after each recorded result.
  const [version, setVersion] = useState(0);
  // The day's progress, null until read.
  const [daily, setDaily] = useState<Progress | null>(null);
  // The practice choice: "n:<number>" for a past day, "w:<index>" for a warm-up.
  const [choice, setChoice] = useState("w:0");
  // The practice progress.
  const [practice, setPractice] = useState<Progress>(FRESH);
  // A counter that gives every practice round its own key.
  const [pRound, setPRound] = useState(0);
  // The fewest clues in a practice round, from the store.
  const [pBest, setPBest] = useState<number | null>(null);
  // The record, for the marks on the puzzles already played (read after mount and after every recorded result).
  const [record, setRecord] = useState<GameRecord | null>(null);

  // Once the day is known, its saved guesses come back.
  useEffect(() => {
    // Not before mount.
    if (!today) return;
    // The stored state.
    setDaily(restore(loadRecord(GAME_ID).daily[today]));
  }, [today]);

  // The practice best and the played marks follow every recorded result.
  useEffect(() => {
    // The record.
    const r = loadRecord(GAME_ID);
    // The best practice round.
    setPBest(r.best);
    // The marks' source.
    setRecord(r);
  }, [version]);

  // Today's number and puzzle.
  const n = today ? puzzleNumber(today) : 0;
  // The day's puzzle.
  const puzzle = useMemo(() => (today ? dailyFor(today) : null), [today]);
  // The practice options: past days (newest first), then the warm-ups, each with its puzzle and how it went before.
  const options = useMemo(() => {
    // Nothing before mount.
    if (!today) return [];
    // The choices with their names and puzzles.
    const plain = [
      ...archive(n).map((m) => ({ key: `n:${m}`, name: t("archiveDay", { n: m }), puzzle: puzzleFor(m) })),
      ...WARMUPS.map((w, i) => ({ key: `w:${i}`, name: t("warmup", { n: i + 1 }), puzzle: w })),
    ];
    // Each with its mark, and a label that says it in words after a tick or a cross.
    return plain.map((o) => {
      // How it went before, if it was played.
      const mark = playedMark(o.key, o.puzzle, record);
      // The option's text.
      const label = mark === null ? o.name : mark.solved ? t("markSolved", { label: o.name }) : t("markMissed", { label: o.name });
      // The option.
      return { ...o, mark, label };
    });
  }, [today, n, t, record]);
  // The practice puzzle.
  const pPuzzle = useMemo(() => (choice.startsWith("n:") ? puzzleFor(Number(choice.slice(2))) : WARMUPS[Number(choice.slice(2))] ?? WARMUPS[0]), [choice]);
  // How the chosen puzzle went before, for the line under the picker.
  const chosenMark = options.find((o) => o.key === choice)?.mark ?? null;
  // That line in words.
  const chosenText =
    chosenMark === null ? null
    : chosenMark.from === "daily" ? (chosenMark.solved ? t("statusDailyWon", { n: chosenMark.clues }) : t("statusDailyLost"))
    : chosenMark.solved ? t("statusPracticeWon")
    : t("statusPracticeLost");

  // A clue spent on the daily puzzle.
  const onDaily = (guess: string, right: boolean) => {
    // Only with the day known.
    if (!today || !daily) return;
    // The new progress.
    const next: Progress = { guesses: [...daily.guesses, guess], solved: right };
    // Shown.
    setDaily(next);
    // Saved.
    saveDailyState(GAME_ID, today, next);
    // Recorded once, at the end.
    if (isOver(next)) {
      // The day's puzzle, won or not.
      recordResult(GAME_ID, { dayKey: today, won: right, daily: true });
      // The stats re-read.
      setVersion((v) => v + 1);
    }
  };

  // A clue spent in practice.
  const onPractice = (guess: string, right: boolean) => {
    // Needs the day for the record.
    if (!today) return;
    // The new progress.
    const next: Progress = { guesses: [...practice.guesses, guess], solved: right };
    // Shown.
    setPractice(next);
    // Recorded at the end: clues used is the score, fewer is better.
    if (isOver(next)) {
      // A free round.
      recordResult(GAME_ID, { dayKey: today, won: right, score: right ? next.guesses.length : undefined, higherIsBetter: false });
      // The puzzles practice can offer today (the archive's and the warm-ups), so old marks do not pile up.
      const offered = new Set([...archive(n).map((m) => puzzleFor(m).id), ...WARMUPS.map((w) => w.id)]);
      // The puzzle's mark, merged into the extra field: solved once stays solved.
      updateRecord(GAME_ID, (r) => {
        // The marks kept, only for puzzles still offered.
        const kept = Object.fromEntries(Object.entries(readPracticed(r.extra.practiced)).filter(([id]) => offered.has(id)));
        // This one: solved now, or solved before.
        const practiced = { ...kept, [pPuzzle.id]: right || kept[pPuzzle.id] === true };
        // The record with the marks beside the other extra values.
        return { ...r, extra: { ...r.extra, practiced } };
      });
      // The stats and the marks re-read.
      setVersion((v) => v + 1);
    }
  };

  // Pick a practice puzzle.
  const pick = (key: string) => {
    // The choice.
    setChoice(key);
    // A fresh round.
    setPractice(FRESH);
    // Its own key.
    setPRound((r) => r + 1);
  };

  // The daily result.
  const result: ShellResult | null =
    daily && puzzle && today && isOver(daily)
      ? {
          won: daily.solved,
          headline: daily.solved ? t("won", { n: daily.guesses.length }) : t("lost"),
          // No detail line: the round's reveal just above names the category and its source (review R2-12).
          share: shareText({ title: `${t("shareName")} #${n}`, lines: [squares(daily)], summary: `${daily.solved ? daily.guesses.length : "X"}/${CLUES}`, locale, slug: SLUG }),
        }
      : null;

  // The rules.
  const rules = (
    <ol className="fg-five-rules-list">
      <li>{t("rule1")}</li>
      <li>{t("rule2")}</li>
      <li>{t("rule3")}</li>
      <li>{t("rule4")}</li>
    </ol>
  );

  // The page body.
  return (
    <>
      <GameShell gameId={GAME_ID} kind="daily" today={today} rules={rules} result={result} version={version}>
        <div className="fg-five-wrap">
          {puzzle && daily ? (
            <Round key={`daily-${today}`} puzzle={puzzle} lang={lang} progress={daily} onSpend={onDaily} idBase="five-daily" />
          ) : (
            <p className="fg-muted">{tc("loading")}</p>
          )}
        </div>
      </GameShell>

      {/* Practice: past puzzles and warm-ups, never a future one. */}
      <section className="fg-five-practice" aria-labelledby="five-practice-title">
        <h2 id="five-practice-title" className="fg-five-practice-title">
          {tc("practice")}
        </h2>
        <p className="fg-muted fg-five-practice-intro">{t("practiceIntro")}</p>
        {today ? (
          <>
            <div className="fg-five-pick">
              <label className="fg-label" htmlFor="five-archive">
                {t("archiveLabel")}
              </label>
              <select
                id="five-archive"
                className="fg-input fg-five-select"
                value={choice}
                onChange={(e) => pick(e.target.value)}
                aria-describedby={chosenText ? "five-archive-mark" : undefined}
              >
                {options.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
              {/* How the chosen puzzle went before: a tick or a cross, and the words. */}
              {chosenMark && chosenText && (
                <p id="five-archive-mark" className={`fg-five-mark ${chosenMark.solved ? "fg-five-mark-won" : "fg-five-mark-lost"}`}>
                  <MarkIcon solved={chosenMark.solved} />
                  <span>{chosenText}</span>
                </p>
              )}
            </div>
            <p className="fg-chip">{pBest === null ? t("practiceBestNone") : t("practiceBest", { n: pBest })}</p>
            <div className="fg-five-wrap">
              <Round key={`practice-${pRound}`} puzzle={pPuzzle} lang={lang} progress={practice} onSpend={onPractice} idBase="five-practice" />
              {isOver(practice) && (
                <div className={`fg-result ${practice.solved ? "fg-result-won" : "fg-result-lost"}`} role="status">
                  <p className="fg-result-headline">{practice.solved ? t("won", { n: practice.guesses.length }) : t("lost")}</p>
                  <div className="fg-result-actions">
                    <button type="button" className="fg-button fg-button-primary" onClick={() => pick(options[(options.findIndex((o) => o.key === choice) + 1) % options.length].key)}>
                      {t("nextPuzzle")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="fg-muted">{tc("loading")}</p>
        )}
      </section>
    </>
  );
}
