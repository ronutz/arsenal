// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/dev/fun/games/PrefixOfTheDay.tsx
// ----------------------------------------------------------------------------
// PREFIX OF THE DAY, the board (PRIME 03/11/2026). The day's address and
// prefix length, six tries at its network, broadcast, mask and usable hosts,
// one row of four marked squares per try, and a short "why" in binary at the
// end. Below it, endless practice rounds at three levels.
//
// The rules live in src/lib/fun/games/prefix-of-the-day/engine.ts; this file
// only reads input, shows marks and keeps the day's tries in the shared store
// (src/lib/fun/storage.ts), so a reload shows the same rows again.
// ============================================================================

"use client";

// React's state, effects, memos and refs.
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
// The strings.
import { useTranslations } from "next-intl";
// Locale-aware links inside the site.
import { Link } from "@/i18n/navigation";
// The frame: stats, rules, result.
import GameShell, { type ShellResult } from "./GameShell";
// The puzzle number of a day.
import { puzzleNumber } from "@/lib/fun/daily";
// Today's UTC day and the reduced-motion preference.
import { useReducedMotion, useToday } from "@/lib/fun/hooks";
// The share card.
import { shareText } from "@/lib/fun/share";
// The one storage key.
import { loadRecord, recordResult, saveDailyState } from "@/lib/fun/storage";
// The CIDR calculator's input handoff (a fragment, never a query string).
import { handoffHref } from "@/lib/handoff";
// The rules.
import {
  FIELDS,
  GAME_ID,
  MAX_TRIES,
  allOk,
  dailyPuzzle,
  formatAddress,
  grade,
  parseAddress,
  parseHosts,
  parseMask,
  practicePuzzle,
  puzzleLabel,
  solve,
  tierForDay,
  why,
  type Facts,
  type Field,
  type Mark,
  type Marks,
  type Puzzle,
} from "@/lib/fun/games/prefix-of-the-day/engine";

/** The page slug, for the share card's address. */
const SLUG = "prefix-of-the-day";

/** The share card's square per mark. */
const EMOJI: Record<Mark, string> = { ok: "🟩", up: "⬆️", down: "⬇️" };

/** The short column label of each field. */
const COL_KEY: Record<Field, string> = { network: "colNetwork", broadcast: "colBroadcast", mask: "colMask", hosts: "colHosts" };

/** The input label of each field. */
const FIELD_KEY: Record<Field, string> = { network: "fieldNetwork", broadcast: "fieldBroadcast", mask: "fieldMask", hosts: "fieldHosts" };

/** The spoken mark of each field. */
const MARK_KEY: Record<Mark, string> = { ok: "markOk", up: "markUp", down: "markDown" };

/** The practice levels and the weekday tier each one plays. */
const LEVELS = [
  { key: "levelEasy", tier: 1 },
  { key: "levelMedium", tier: 4 },
  { key: "levelHard", tier: 7 },
] as const;

/** The empty form. */
const EMPTY: Record<Field, string> = { network: "", broadcast: "", mask: "", hosts: "" };

/** What the store keeps for a day: the tries, each as [network, broadcast, mask, hosts]. */
interface SavedDaily {
  /** The tries so far. */
  guesses: number[][];
}

/**
 * The saved tries of a day, or none when the stored value is missing or malformed.
 *
 * @param saved whatever the store holds for the day
 * @returns the tries as Facts
 */
function restoreGuesses(saved: unknown): Facts[] {
  // Only an object with a guesses array is understood.
  const g = (saved as SavedDaily | undefined)?.guesses;
  // Anything else is a fresh day.
  if (!Array.isArray(g)) return [];
  // Each well-formed try, at most six.
  return g
    .filter((row) => Array.isArray(row) && row.length === 4 && row.every((n) => typeof n === "number" && Number.isFinite(n)))
    .slice(0, MAX_TRIES)
    .map((row) => ({ network: row[0], broadcast: row[1], mask: row[2], hosts: row[3] }));
}

/**
 * A try as typed text, to prefill the form after a reload.
 *
 * @param f the try
 * @returns the four fields as text
 */
function toTexts(f: Facts): Record<Field, string> {
  // Addresses and the mask dotted, hosts as plain digits.
  return { network: formatAddress(f.network), broadcast: formatAddress(f.broadcast), mask: formatAddress(f.mask), hosts: String(f.hosts) };
}

/**
 * A random 32-bit seed from the browser's generator, for a practice round.
 *
 * @returns an unsigned seed
 */
function freshSeed(): number {
  // One random word.
  const a = new Uint32Array(1);
  // Filled by the platform.
  crypto.getRandomValues(a);
  // The seed.
  return a[0];
}

/** One mark as a small drawing: a tick, an up arrow or a down arrow, in the current colour. */
function MarkIcon({ mark }: { mark: Mark }) {
  // The SVG, decorative (the row's label carries the words).
  return (
    <svg className="fg-pod-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {mark === "ok" && <path d="M4.5 12.5l5 5L19.5 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />}
      {mark === "up" && <path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />}
      {mark === "down" && <path d="M12 5v14M5.5 12.5L12 19l6.5-6.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

/** What a round needs from its owner. */
interface RoundProps {
  /** The puzzle. */
  puzzle: Puzzle;
  /** The tries so far. */
  guesses: Facts[];
  /** Called with a valid try. */
  onGuess: (f: Facts) => void;
  /** A prefix for the input ids, so the daily and practice forms never clash. */
  idBase: string;
  /** The locale, for number formatting. */
  locale: string;
}

/**
 * One round: the rows of tries and, while it is open, the form.
 *
 * @param props see RoundProps
 * @returns the round
 */
function Round({ puzzle, guesses, onGuess, idBase, locale }: RoundProps) {
  // The game's strings.
  const t = useTranslations("devFun.games.prefix-of-the-day");
  // The shell's shared strings.
  const tc = useTranslations("devFun.games.common");
  // Whether to skip the small landing pulse.
  const reduce = useReducedMotion();
  // The answers.
  const answer = useMemo(() => solve(puzzle), [puzzle]);
  // The marks of every try.
  const marks = useMemo(() => guesses.map((g) => grade(g, answer)), [guesses, answer]);
  // Solved or out of tries.
  const done = marks.some(allOk) || guesses.length >= MAX_TRIES;
  // The form's text, prefilled with the last try so only the wrong fields need retyping.
  const [values, setValues] = useState<Record<Field, string>>(() => (guesses.length ? toTexts(guesses[guesses.length - 1]) : EMPTY));
  // A validation message, or null.
  const [error, setError] = useState<string | null>(null);
  // The polite announcement of the last try.
  const [live, setLive] = useState("");
  // The inputs, for focus.
  const inputs = useRef<Record<Field, HTMLInputElement | null>>({ network: null, broadcast: null, mask: null, hosts: null });

  // The words for one try's marks: "Network correct, Broadcast too low...".
  const summary = (m: Marks) => FIELDS.map((f) => `${t(COL_KEY[f])}: ${t(MARK_KEY[m[f]])}`).join(", ");
  // A number as shown in a square: addresses and masks may wrap only after a dot.
  const shown = (f: Field, n: number) =>
    f === "hosts"
      ? n.toLocaleString(locale)
      : formatAddress(n)
          .split(".")
          .flatMap((part, i, all) => (i < all.length - 1 ? [`${part}.`, <wbr key={i} />] : [part]));

  // Read the form and hand a valid try to the owner.
  const submit = (e: FormEvent) => {
    // No page reload.
    e.preventDefault();
    // Each field parsed.
    const network = parseAddress(values.network);
    const broadcast = parseAddress(values.broadcast);
    const mask = parseMask(values.mask);
    const hosts = parseHosts(values.hosts);
    // The first field that does not parse, with its message.
    const bad: [Field, string] | null =
      network === null ? ["network", t("errAddress", { field: t("fieldNetwork") })]
      : broadcast === null ? ["broadcast", t("errAddress", { field: t("fieldBroadcast") })]
      : mask === null ? ["mask", t("errMask")]
      : hosts === null ? ["hosts", t("errHosts")]
      : null;
    // A bad field costs no try: say what is wrong and put the cursor there.
    if (bad) {
      // The message (also announced).
      setError(bad[1]);
      // The field.
      inputs.current[bad[0]]?.focus();
      // Nothing submitted.
      return;
    }
    // The try.
    const guess: Facts = { network: network!, broadcast: broadcast!, mask: mask!, hosts: hosts! };
    // Its marks, for the announcement and the focus.
    const m = grade(guess, answer);
    // No error any more.
    setError(null);
    // "Try 2 of 6: ...".
    setLive(t("liveTry", { n: guesses.length + 1, max: MAX_TRIES, summary: summary(m) }));
    // The owner records it.
    onGuess(guess);
    // The cursor goes to the first field still wrong.
    const firstWrong = FIELDS.find((f) => m[f] !== "ok");
    // Focused and selected, ready for retyping.
    if (firstWrong) window.setTimeout(() => inputs.current[firstWrong]?.select(), 0);
  };

  // The latest marks, shown beside each label.
  const lastMarks = marks.length ? marks[marks.length - 1] : null;

  // The round.
  return (
    <div className="fg-pod-round">
      {/* The rows: a header, one row per try, empty rows for the tries left. */}
      <div className="fg-pod-grid">
        <div className="fg-pod-head" aria-hidden="true">
          {FIELDS.map((f) => (
            <span key={f}>{t(COL_KEY[f])}</span>
          ))}
        </div>
        <ol className="fg-pod-rows" aria-label={t("rowsLabel")}>
          {Array.from({ length: MAX_TRIES }, (_, i) => {
            // A try made, or a row still to come.
            const g = guesses[i];
            // Its marks.
            const m = marks[i];
            // The newest row pulses once, unless motion is reduced.
            const fresh = !reduce && i === guesses.length - 1;
            // An empty row: dashed squares, hidden from screen readers.
            if (!g || !m)
              return (
                <li key={i} className="fg-pod-row" aria-hidden="true">
                  {FIELDS.map((f) => (
                    <span key={f} className="fg-pod-sq fg-pod-sq-empty" />
                  ))}
                </li>
              );
            // A try: four marked squares, read as one sentence.
            return (
              <li key={i} className="fg-pod-row" aria-label={t("rowLabel", { n: i + 1, summary: summary(m) })}>
                {FIELDS.map((f) => (
                  <span key={f} className={`fg-pod-sq fg-pod-sq-${m[f]}${fresh ? " fg-pop" : ""}`} aria-hidden="true">
                    <MarkIcon mark={m[f]} />
                    <span className="fg-pod-val">{shown(f, g[f])}</span>
                  </span>
                ))}
              </li>
            );
          })}
        </ol>
      </div>

      {/* The form, while tries are left. */}
      {!done && (
        <form className="fg-pod-form" onSubmit={submit} noValidate>
          {FIELDS.map((f) => (
            <div key={f} className="fg-pod-field">
              <label className="fg-label" htmlFor={`${idBase}-${f}`}>
                {t(FIELD_KEY[f])}
                {lastMarks && <span className={`fg-pod-hint fg-pod-hint-${lastMarks[f]}`}>{t(MARK_KEY[lastMarks[f]])}</span>}
              </label>
              <input
                id={`${idBase}-${f}`}
                ref={(el) => {
                  // Kept for focus.
                  inputs.current[f] = el;
                }}
                className="fg-input fg-pod-input"
                type="text"
                inputMode={f === "hosts" ? "numeric" : "decimal"}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                placeholder={f === "hosts" ? "0" : "a.b.c.d"}
                value={values[f]}
                onChange={(e) => setValues((v) => ({ ...v, [f]: e.target.value }))}
              />
            </div>
          ))}
          <div className="fg-pod-actions">
            <button type="submit" className="fg-button fg-button-primary">
              {tc("check")}
            </button>
            <span className="fg-pod-left fg-mono">{t("triesLeft", { n: MAX_TRIES - guesses.length })}</span>
          </div>
        </form>
      )}

      {/* What went wrong with the form, or what the last try said. */}
      {error && (
        <p className="fg-pod-error" role="alert">
          {error}
        </p>
      )}
      <p className="sr-only" aria-live="polite">
        {live}
      </p>
    </div>
  );
}

/**
 * The teaching line after a round: the octet where the boundary falls, its bits marked, and where to read more.
 *
 * @param props the puzzle
 * @returns the panel
 */
function WhyPanel({ puzzle }: { puzzle: Puzzle }) {
  // The game's strings.
  const t = useTranslations("devFun.games.prefix-of-the-day");
  // The interesting octet.
  const w = why(puzzle);
  // Which sentence fits: some network bits, none, or all eight.
  const sentence =
    w.bits === 0 ? t("whyNone", { octet: w.octet, value: w.value, binary: w.binary })
    : w.bits === 8 ? t("whyAll", { binary: w.binary })
    : t("whyBits", { octet: w.octet, value: w.value, binary: w.binary, bits: w.bits, netValue: w.netValue, block: w.block });
  // The panel.
  return (
    <div className="fg-pod-why">
      <p className="fg-pod-why-title">{t("whyTitle", { octet: w.octet })}</p>
      {/* The octet's bits: network bits underlined and in the accent colour, host bits muted. */}
      <p className="fg-pod-bits" aria-hidden="true">
        {w.binary.split("").map((b, i) => (
          <span key={i} className={i < w.bits ? "fg-pod-bit-net" : "fg-pod-bit-host"}>
            {b}
          </span>
        ))}
      </p>
      <p className="fg-pod-why-text">{sentence}</p>
      <p className="fg-pod-links">
        <Link href={handoffHref("/tools/cidr", puzzleLabel(puzzle))}>{t("linkCidr")}</Link>
        <Link href="/learn/subnetting-basics">{t("linkLearn")}</Link>
        <Link href="/learn/cidr-notation">{t("linkCidrNotation")}</Link>
      </p>
    </div>
  );
}

/**
 * The game: the daily puzzle in the shell, practice below it.
 *
 * @param props the page locale
 * @returns the game
 */
export default function PrefixOfTheDay({ locale }: { locale: string }) {
  // The game's strings.
  const t = useTranslations("devFun.games.prefix-of-the-day");
  // The shell's shared strings.
  const tc = useTranslations("devFun.games.common");
  // Today's UTC day, null until mount.
  const today = useToday();
  // Bumped after each recorded result, so the shell re-reads the stats.
  const [version, setVersion] = useState(0);
  // The day's tries, null until read from the store.
  const [daily, setDaily] = useState<Facts[] | null>(null);
  // The practice level (a weekday tier).
  const [tier, setTier] = useState<number>(1);
  // The practice puzzle, null until mount.
  const [practice, setPractice] = useState<Puzzle | null>(null);
  // The practice tries.
  const [pGuesses, setPGuesses] = useState<Facts[]>([]);
  // The practice round was given up.
  const [pGaveUp, setPGaveUp] = useState(false);
  // The fewest tries in a practice round, from the store.
  const [pBest, setPBest] = useState<number | null>(null);
  // A counter that gives every practice round its own key, so its form starts empty.
  const [pRound, setPRound] = useState(0);

  // Once the day is known, its saved tries come back.
  useEffect(() => {
    // Not before mount.
    if (!today) return;
    // The stored state of the day.
    setDaily(restoreGuesses(loadRecord(GAME_ID).daily[today]));
  }, [today]);

  // The first practice puzzle, drawn after mount (the browser's random seed is not available on the server).
  useEffect(() => {
    // A random seed at the easy level.
    setPractice(practicePuzzle(freshSeed(), 1));
  }, []);

  // The practice best follows every recorded result.
  useEffect(() => {
    // From the store.
    setPBest(loadRecord(GAME_ID).best);
  }, [version]);

  // The day's puzzle.
  const puzzle = useMemo(() => (today ? dailyPuzzle(today) : null), [today]);
  // Its answers.
  const answer = useMemo(() => (puzzle ? solve(puzzle) : null), [puzzle]);
  // The marks of the day's tries.
  const marks = useMemo(() => (daily && answer ? daily.map((g) => grade(g, answer)) : []), [daily, answer]);
  // Solved today.
  const won = marks.some(allOk);
  // Finished today.
  const done = !!daily && (won || daily.length >= MAX_TRIES);

  // A daily try.
  const onDailyGuess = (g: Facts) => {
    // Only with the day and its answers known.
    if (!today || !daily || !answer) return;
    // The tries with this one.
    const next = [...daily, g];
    // Shown.
    setDaily(next);
    // Saved, so a reload shows the same rows.
    saveDailyState(GAME_ID, today, { guesses: next.map((f) => [f.network, f.broadcast, f.mask, f.hosts]) } satisfies SavedDaily);
    // This try's verdict.
    const solved = allOk(grade(g, answer));
    // The round ends on a solve or on the last try.
    if (solved || next.length >= MAX_TRIES) {
      // Counted once, as the day's puzzle.
      recordResult(GAME_ID, { dayKey: today, won: solved, daily: true });
      // The stats line re-reads.
      setVersion((v) => v + 1);
    }
  };

  // The answers in words, for the result panels.
  const answerLine = (a: Facts) =>
    t("answerLine", { network: formatAddress(a.network), broadcast: formatAddress(a.broadcast), mask: formatAddress(a.mask), hosts: a.hosts.toLocaleString(locale) });

  // The daily result, once finished.
  const result: ShellResult | null =
    done && today && answer && daily
      ? {
          won,
          headline: won ? t("won", { n: daily.length }) : t("lost"),
          detail: answerLine(answer),
          share: shareText({
            title: `${t("shareName")} #${puzzleNumber(today)}`,
            lines: marks.map((m) => FIELDS.map((f) => EMOJI[m[f]]).join("")),
            summary: `${won ? daily.length : "X"}/${MAX_TRIES}`,
            locale,
            slug: SLUG,
          }),
        }
      : null;

  // Practice: its answers and marks.
  const pAnswer = useMemo(() => (practice ? solve(practice) : null), [practice]);
  // Solved.
  const pWon = !!pAnswer && pGuesses.some((g) => allOk(grade(g, pAnswer)));
  // Finished: solved, out of tries or given up.
  const pDone = pWon || pGuesses.length >= MAX_TRIES || pGaveUp;

  // A new practice round at a level.
  const newPractice = (lvl: number) => {
    // The level.
    setTier(lvl);
    // A fresh puzzle.
    setPractice(practicePuzzle(freshSeed(), lvl));
    // No tries yet.
    setPGuesses([]);
    // Not given up.
    setPGaveUp(false);
    // A new key for the round.
    setPRound((r) => r + 1);
  };

  // A practice try.
  const onPracticeGuess = (g: Facts) => {
    // Only with a puzzle.
    if (!pAnswer || !today) return;
    // The tries with this one.
    const next = [...pGuesses, g];
    // Shown.
    setPGuesses(next);
    // Its verdict.
    const solved = allOk(grade(g, pAnswer));
    // The round ends on a solve or the last try; a solve's tries are its score (fewer is better).
    if (solved || next.length >= MAX_TRIES) {
      // A free round, outside the streak.
      recordResult(GAME_ID, { dayKey: today, won: solved, score: solved ? next.length : undefined, higherIsBetter: false });
      // The stats re-read.
      setVersion((v) => v + 1);
    }
  };

  // Giving up a practice round shows the answers and counts as a round not won.
  const onGiveUp = () => {
    // Already over.
    if (pDone || !today) return;
    // Given up.
    setPGaveUp(true);
    // Counted.
    recordResult(GAME_ID, { dayKey: today, won: false });
    // The stats re-read.
    setVersion((v) => v + 1);
  };

  // The rules, as a list.
  const rules = (
    <ol className="fg-pod-rules-list">
      <li>{t("rule1")}</li>
      <li>{t("rule2")}</li>
      <li>{t("rule3")}</li>
      <li>{t("rule4")}</li>
      <li>{t("rule5")}</li>
    </ol>
  );

  // The page body.
  return (
    <>
      <GameShell gameId={GAME_ID} kind="daily" today={today} rules={rules} result={result} version={version}>
        <div className="fg-pod-wrap">
          {/* The day's block, or a neutral line before mount. */}
          <div className="fg-pod-puzzle">
            <p className="fg-pod-kicker">{t("todayBlock")}</p>
            <p className="fg-pod-target">{puzzle ? puzzleLabel(puzzle) : "-.-.-.-/-"}</p>
            <p className="fg-pod-tier">{today ? t(`tier${tierForDay(today)}`) : tc("loading")}</p>
          </div>
          {/* The round, once the saved tries are read. */}
          {puzzle && daily ? (
            <Round key={`daily-${today}`} puzzle={puzzle} guesses={daily} onGuess={onDailyGuess} idBase="pod-daily" locale={locale} />
          ) : (
            <p className="fg-muted">{tc("loading")}</p>
          )}
          {/* The teaching line, after the round. */}
          {done && puzzle && <WhyPanel puzzle={puzzle} />}
        </div>
      </GameShell>

      {/* Practice: endless puzzles, outside the streak. */}
      <section className="fg-pod-practice" aria-labelledby="pod-practice-title">
        <h2 id="pod-practice-title" className="fg-pod-practice-title">
          {tc("practice")}
        </h2>
        <p className="fg-muted fg-pod-practice-intro">{t("practiceIntro")}</p>
        <div className="fg-buttons" role="group" aria-label={t("levelLabel")}>
          {LEVELS.map((l) => (
            <button key={l.key} type="button" className="fg-button fg-pod-level" aria-pressed={tier === l.tier} onClick={() => newPractice(l.tier)}>
              {t(l.key)}
            </button>
          ))}
        </div>
        <p className="fg-chip">{pBest === null ? t("practiceBestNone") : t("practiceBest", { n: pBest })}</p>
        {practice ? (
          <div className="fg-pod-wrap">
            <p className="fg-pod-target fg-pod-target-small">{puzzleLabel(practice)}</p>
            {!pGaveUp && (
              <Round key={`practice-${pRound}`} puzzle={practice} guesses={pGuesses} onGuess={onPracticeGuess} idBase="pod-practice" locale={locale} />
            )}
            {pDone && pAnswer ? (
              <div className={`fg-result ${pWon ? "fg-result-won" : "fg-result-lost"}`} role="status">
                <p className="fg-result-headline">{pWon ? t("won", { n: pGuesses.length }) : t("lost")}</p>
                <p className="fg-result-detail">{answerLine(pAnswer)}</p>
                <div className="fg-result-actions">
                  <button type="button" className="fg-button fg-button-primary" onClick={() => newPractice(tier)}>
                    {tc("newRound")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="fg-buttons">
                <button type="button" className="fg-link-button" onClick={onGiveUp}>
                  {tc("giveUp")}
                </button>
              </div>
            )}
            {pDone && <WhyPanel puzzle={practice} />}
          </div>
        ) : (
          <p className="fg-muted">{tc("loading")}</p>
        )}
      </section>
    </>
  );
}
