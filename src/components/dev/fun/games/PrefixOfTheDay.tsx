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
//
// On a phone (review R1-04, R1-10, 03/11/2026): a comma typed in an address
// or a mask becomes a dot as it is typed (the decimal keypad of a comma
// region, such as Brazil's, has no dot); the form repeats the address it is
// about, so it stays in sight with the keyboard open; and the rows still to
// come are drawn thin, so the form starts higher.
//
// Added on 03/11/2026 (PRIME: "Yes on all your suggested ideas"):
//   - the mask field also takes a prefix length ("/25" or "25") and shows the
//     dotted mask it means under the field;
//   - hard mode, a switch kept in the record's extra field ("hard"): a field
//     once right is locked, and every arrow must be followed; it can be turned
//     on only before the day's first try (or after the round, for the next
//     day), turning it off mid-round makes the day an ordinary one, and the
//     day's state remembers whether the whole round was hard, which the share
//     card then says;
//   - statistics after the daily round: played, win rate, current and best
//     streak, and how many tries each round took (1 to 6, or X), today's bar
//     highlighted. The tally lives in the record's extra field ("tally"),
//     merged in with updateRecord after each daily round; practice never
//     touches it. Since "Reset my stats" clears the counters but keeps the
//     extra field, a tally larger than the daily rounds played is a tally
//     from before a reset, and is dropped.
// ============================================================================

"use client";

// React's state, effects, memos, refs and stable ids; the style type for a bar's custom property.
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
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
// The one storage key: the record, its daily states, its extra field, and the live streak.
import { liveStreak, loadRecord, recordResult, saveDailyState, updateRecord, type GameRecord } from "@/lib/fun/storage";
// The CIDR calculator's input handoff (a fragment, never a query string).
import { handoffHref } from "@/lib/handoff";
// The rules.
import {
  BUCKETS,
  FIELDS,
  GAME_ID,
  MAX_TRIES,
  allOk,
  bucketOf,
  dailyPuzzle,
  formatAddress,
  grade,
  hardBounds,
  hardViolation,
  maskOf,
  parseAddress,
  parseHosts,
  parseMask,
  parsePrefixLength,
  practicePuzzle,
  puzzleLabel,
  solve,
  tierForDay,
  why,
  type Bounds,
  type Bucket,
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

/** What the store keeps for a day: the tries, each as [network, broadcast, mask, hosts], and whether it was hard. */
interface SavedDaily {
  /** The tries so far. */
  guesses: number[][];
  /** True when hard mode was on from the first try and never turned off (absent in states saved before it existed). */
  hard?: boolean;
}

/** The tries distribution kept in the record's extra field: daily rounds per bucket. */
type Tally = Record<Bucket, number>;

/**
 * A tally with no rounds in it.
 *
 * @returns zero in every bucket
 */
function emptyTally(): Tally {
  // Every bucket at zero.
  return { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, X: 0 };
}

/**
 * The stored tally, or null when there is none or it is malformed.
 *
 * @param v whatever the record's extra field holds under "tally"
 * @returns the tally
 */
function readTally(v: unknown): Tally | null {
  // Only an object is understood.
  if (!v || typeof v !== "object") return null;
  // The stored counts.
  const o = v as Record<string, unknown>;
  // Every bucket a whole number, none negative.
  if (!BUCKETS.every((k) => typeof o[k] === "number" && Number.isInteger(o[k]) && (o[k] as number) >= 0)) return null;
  // A clean copy, without any other field.
  return Object.fromEntries(BUCKETS.map((k) => [k, o[k] as number])) as Tally;
}

/**
 * The rounds in a tally.
 *
 * @param t the tally
 * @returns their number
 */
function tallyTotal(t: Tally): number {
  // Every bucket added up.
  return BUCKETS.reduce((s, k) => s + t[k], 0);
}

/**
 * A tally rebuilt from the finished days still kept in the record (the last seven), for a browser that played
 * before the statistics existed.
 *
 * @param daily the record's daily states
 * @param except a day to leave out, or null
 * @returns the tally of those days
 */
function rebuildTally(daily: Record<string, unknown>, except: string | null): Tally {
  // Nothing counted yet.
  const t = emptyTally();
  // Each kept day.
  for (const [day, state] of Object.entries(daily)) {
    // The day left out.
    if (day === except) continue;
    // Its bucket, if the round was finished (a malformed day key gives no puzzle worth counting, but never throws).
    const b = bucketOf(restoreGuesses(state), solve(dailyPuzzle(day)));
    // Counted.
    if (b) t[b] += 1;
  }
  // The tally.
  return t;
}

/**
 * The tally to show: the stored one, or one rebuilt from the kept days when none is stored; either is dropped when
 * it counts more rounds than the record has daily rounds played, which means "Reset my stats" ran since.
 *
 * @param r the record
 * @returns the tally
 */
function shownTally(r: GameRecord): Tally {
  // The stored tally, else the kept days.
  const t = readTally(r.extra.tally) ?? rebuildTally(r.daily, null);
  // More rounds than played: from before a reset.
  return tallyTotal(t) <= r.dailyPlayed ? t : emptyTally();
}

/**
 * Add today's finished round to the tally, inside one read-change-write (recordResult has already counted it).
 *
 * @param today the day
 * @param bucket the round's bucket
 */
function addToTally(today: string, bucket: Bucket): void {
  // Merged into the record's extra field, never replacing it.
  updateRecord(GAME_ID, (r) => {
    // The rounds before this one: the stored tally, or the kept days other than today.
    const before = readTally(r.extra.tally) ?? rebuildTally(r.daily, today);
    // A tally larger than the rounds played before today's is from before a reset: start again.
    const base = tallyTotal(before) <= r.dailyPlayed - 1 ? before : emptyTally();
    // Today's round added.
    const next: Tally = { ...base, [bucket]: base[bucket] + 1 };
    // The record with the new tally beside the other extra values.
    return { ...r, extra: { ...r.extra, tally: next } };
  });
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
 * Whether a saved day was played in hard mode throughout.
 *
 * @param saved whatever the store holds for the day
 * @returns true only when the state says so
 */
function restoreHard(saved: unknown): boolean {
  // Only an explicit true counts (states saved before hard mode existed have no flag).
  return (saved as SavedDaily | undefined)?.hard === true;
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
  /** Hard mode: a field once right is locked, every arrow must be followed (the daily round only). */
  hard?: boolean;
}

/**
 * One round: the rows of tries and, while it is open, the form.
 *
 * @param props see RoundProps
 * @returns the round
 */
function Round({ puzzle, guesses, onGuess, idBase, locale, hard = false }: RoundProps) {
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
  // The id of the line that names the form.
  const formTitleId = useId();
  // The id of the line under the mask field that spells out a typed prefix length.
  const maskMeansId = useId();
  // In hard mode, what the tries so far proved about each field (a fixed value locks the field).
  const bounds = useMemo(() => (hard ? hardBounds(guesses, answer) : null), [hard, guesses, answer]);
  // A typed prefix length ("/25" or "25"), shown as the dotted mask it means.
  const typedLength = parsePrefixLength(values.mask);

  // The words for one try's marks: "Network correct, Broadcast too low...".
  const summary = (m: Marks) => FIELDS.map((f) => `${t(COL_KEY[f])}: ${t(MARK_KEY[m[f]])}`).join(", ");
  // A field's value as the player reads it: dotted for addresses and masks, grouped digits for hosts.
  const valueText = (f: Field, n: number) => (f === "hosts" ? n.toLocaleString(locale) : formatAddress(n));
  // What hard mode says about a field the try ignored: keep it, go above, go below, or stay between two values.
  const hardMessage = (f: Field, b: Bounds) => {
    // The field's name, as the form labels it.
    const field = t(FIELD_KEY[f]);
    // Right before: it stays.
    if (b.fixed !== null) return t("hardKeep", { field, value: valueText(f, b.fixed) });
    // A floor and a ceiling.
    if (b.above !== null && b.below !== null) return t("hardBetween", { field, low: valueText(f, b.above), high: valueText(f, b.below) });
    // A floor only.
    if (b.above !== null) return t("hardHigher", { field, value: valueText(f, b.above) });
    // A ceiling only (hardViolation names a field only when one of the three is set).
    return t("hardLower", { field, value: valueText(f, b.below ?? 0) });
  };
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
    // Hard mode: a try that ignores an earlier hint costs nothing and is refused, with the hint spelt out.
    const broken = hard ? hardViolation(guesses, answer, guess) : null;
    // Refused: the message (also announced) and the cursor on the field.
    if (broken) {
      // What the hints say about that field.
      setError(hardMessage(broken.field, broken.bounds));
      // Focused and selected, ready for retyping.
      inputs.current[broken.field]?.select();
      // Nothing submitted.
      return;
    }
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
        <form className="fg-pod-form" onSubmit={submit} noValidate aria-labelledby={formTitleId}>
          {/* The address again, right above the fields, in sight while the keyboard is open. */}
          <p id={formTitleId} className="fg-pod-form-target">
            {t("formFor", { target: puzzleLabel(puzzle) })}
          </p>
          {FIELDS.map((f) => {
            // Hard mode locks a field once a try had it right: it is sent again exactly as it is.
            const locked = !!bounds && bounds[f].fixed !== null;
            // The mask field spells out a typed prefix length under it, and is described by that line.
            const means = f === "mask" && typedLength !== null;
            // The field.
            return (
              <div key={f} className="fg-pod-field">
                <label className="fg-label" htmlFor={`${idBase}-${f}`}>
                  {t(FIELD_KEY[f])}
                  {lastMarks && <span className={`fg-pod-hint fg-pod-hint-${lastMarks[f]}`}>{t(MARK_KEY[lastMarks[f]])}</span>}
                  {locked && <span className="fg-pod-hint fg-pod-hint-locked">{t("hardLocked")}</span>}
                </label>
                <input
                  id={`${idBase}-${f}`}
                  ref={(el) => {
                    // Kept for focus.
                    inputs.current[f] = el;
                  }}
                  className={`fg-input fg-pod-input${locked ? " fg-pod-input-locked" : ""}`}
                  type="text"
                  inputMode={f === "hosts" ? "numeric" : "decimal"}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  readOnly={locked}
                  aria-describedby={means ? maskMeansId : undefined}
                  placeholder={f === "hosts" ? "0" : f === "mask" ? t("maskPlaceholder") : "a.b.c.d"}
                  value={values[f]}
                  onChange={(e) => {
                    // A comma in an address or a mask is a dot (hosts keep theirs: there it groups thousands).
                    const text = f === "hosts" ? e.target.value : e.target.value.replace(/,/g, ".");
                    // Kept.
                    setValues((v) => ({ ...v, [f]: text }));
                  }}
                />
                {/* "/25" or "25" typed: the dotted mask it stands for. */}
                {means && (
                  <p id={maskMeansId} className="fg-pod-means fg-mono">
                    {t("maskMeans", { length: typedLength ?? 0, mask: formatAddress(maskOf(typedLength ?? 0)) })}
                  </p>
                )}
              </div>
            );
          })}
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

/** What the statistics panel needs: the day, today's bucket, and a counter that changes after each recorded round. */
interface StatsProps {
  /** Today's UTC day, for the live streak. */
  today: string;
  /** The bucket of today's round, highlighted. */
  bucket: Bucket | null;
  /** Bumped when a round is recorded, so the panel reads the record again at once. */
  version: number;
}

/**
 * The daily statistics, as a word-game player expects them: rounds played, how many were solved, the current and
 * best streak, and how many tries each round took, today's bar highlighted. Daily rounds only.
 *
 * @param props see StatsProps
 * @returns the panel
 */
function StatsPanel({ today, bucket, version }: StatsProps) {
  // The game's strings.
  const t = useTranslations("devFun.games.prefix-of-the-day");
  // The record, read after mount.
  const [record, setRecord] = useState<GameRecord | null>(null);
  // Read now, after each recorded round, and every two seconds: the shell's "Reset my stats" changes the record
  // without telling the game, and the panel must not keep showing what was just cleared.
  useEffect(() => {
    // One read.
    const read = () => setRecord((prev) => {
      // The record as stored.
      const next = loadRecord(GAME_ID);
      // Unchanged: keep the old object, so nothing re-renders.
      return prev && JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
    });
    // Now.
    read();
    // Then on a slow tick while the panel is shown.
    const id = window.setInterval(read, 2000);
    // Stopped when the panel goes.
    return () => window.clearInterval(id);
  }, [version]);
  // Nothing to show before the first read.
  if (!record) return null;
  // The tally of tries.
  const tally = shownTally(record);
  // Rounds played and solved, from the same tally, so the rate always matches the bars.
  const played = tallyTotal(tally);
  // Solved: every bucket but X.
  const solved = played - tally.X;
  // The tallest bar sets the scale.
  const tallest = Math.max(1, ...BUCKETS.map((k) => tally[k]));
  // Today's bar is highlighted only when today's round is in the tally (it is not after a reset).
  const mark = bucket && tally[bucket] > 0 ? bucket : null;
  // The panel.
  return (
    <section className="fg-pod-stats" aria-labelledby="pod-stats-title">
      <h2 id="pod-stats-title" className="fg-pod-stats-title">
        {t("statsTitle")}
      </h2>
      {/* Four numbers: played, win rate, current streak, best streak. */}
      <dl className="fg-pod-stat-row">
        <div className="fg-pod-stat">
          <dt>{t("statPlayed")}</dt>
          <dd className="fg-mono">{played}</dd>
        </div>
        <div className="fg-pod-stat">
          <dt>{t("statWinRate")}</dt>
          <dd className="fg-mono">{t("statWinRateValue", { rate: played ? solved / played : 0 })}</dd>
        </div>
        <div className="fg-pod-stat">
          <dt>{t("statStreak")}</dt>
          <dd className="fg-mono">{liveStreak(record, today)}</dd>
        </div>
        <div className="fg-pod-stat">
          <dt>{t("statBestStreak")}</dt>
          <dd className="fg-mono">{record.bestStreak}</dd>
        </div>
      </dl>
      {/* The tries distribution: one bar per bucket, the count at its end, today's in the accent colour. */}
      <h3 id="pod-dist-title" className="fg-pod-dist-title">
        {t("distTitle")}
      </h3>
      <ol className="fg-pod-dist" aria-labelledby="pod-dist-title">
        {BUCKETS.map((k) => {
          // How many rounds took this many tries.
          const n = tally[k];
          // Today's bucket.
          const isToday = mark === k;
          // The row's words for screen readers (the label, the bar and the count are drawn for the eye).
          const label = k === "X" ? t("distRowMissed", { n, today: isToday ? "yes" : "no" }) : t("distRowSolved", { tries: Number(k), n, today: isToday ? "yes" : "no" });
          // The row.
          return (
            <li key={k} className={`fg-pod-dist-row${isToday ? " fg-pod-dist-today" : ""}`}>
              <span className="sr-only">{label}</span>
              <span className="fg-pod-dist-key fg-mono" aria-hidden="true">
                {k}
              </span>
              <span className="fg-pod-dist-track" aria-hidden="true">
                {/* The bar's share of the tallest one, as a number from 0 to 1 the stylesheet turns into a width. */}
                <span className="fg-pod-dist-bar" style={{ "--fg-pod-share": n / tallest } as CSSProperties} />
                <span className="fg-pod-dist-n fg-mono">{n}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </section>
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
  // The hard-mode switch, as the player left it (kept in the record's extra field).
  const [hardOn, setHardOn] = useState(false);
  // Whether today's round is a hard one: on from its first try and never turned off since.
  const [dayHard, setDayHard] = useState(false);
  // The note under the switch after a press it cannot honour, announced politely; null when there is none.
  const [hardNote, setHardNote] = useState<string | null>(null);

  // Once the day is known, its saved tries come back, with whether the round is hard and the switch as left.
  useEffect(() => {
    // Not before mount.
    if (!today) return;
    // The record.
    const record = loadRecord(GAME_ID);
    // The stored state of the day.
    setDaily(restoreGuesses(record.daily[today]));
    // Hard throughout, or not.
    setDayHard(restoreHard(record.daily[today]));
    // The switch: only an explicit true turns it on.
    setHardOn(record.extra.hard === true);
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

  // Hard mode is in force on today's round: on now, and (after the first try) on since the first try.
  const hardActive = hardOn && (!daily || daily.length === 0 || dayHard);
  // The switch can be turned on only before the day's first try, or once the round is over (for the next day's).
  const canTurnOn = !!daily && (daily.length === 0 || done);

  /**
   * Save the day's state: the tries and whether the round is hard.
   *
   * @param tries the tries
   * @param hard hard throughout so far
   */
  const saveDay = (tries: Facts[], hard: boolean) => {
    // Only with the day known.
    if (!today) return;
    // Saved, so a reload shows the same rows and the share card knows the mode.
    saveDailyState(GAME_ID, today, { guesses: tries.map((f) => [f.network, f.broadcast, f.mask, f.hosts]), hard } satisfies SavedDaily);
  };

  // Press on the hard-mode switch.
  const onHardSwitch = () => {
    // Turning it on is allowed only before the first try (or after the round); otherwise say why, politely.
    if (!hardOn && !canTurnOn) {
      // The note, shown under the switch and announced.
      setHardNote(t("hardTooLate"));
      // Nothing changes.
      return;
    }
    // The new position.
    const next = !hardOn;
    // Shown.
    setHardOn(next);
    // Remembered with the game's other values, merged into the extra field.
    updateRecord(GAME_ID, (r) => ({ ...r, extra: { ...r.extra, hard: next } }));
    // Turned off in the middle of a hard round.
    const leftRound = !next && !!daily && daily.length > 0 && !done && dayHard;
    // That round is an ordinary one from now on, and saved as such.
    if (leftRound && daily) {
      // Not hard any more.
      setDayHard(false);
      // Saved.
      saveDay(daily, false);
    }
    // What the switch did, announced: on for today, on from the next puzzle, off, or off for the rest of this round.
    setHardNote(next ? (done ? t("hardOnNext") : t("hardOnNow")) : leftRound ? t("hardOffRound") : t("hardOff"));
  };

  // A daily try.
  const onDailyGuess = (g: Facts) => {
    // Only with the day and its answers known.
    if (!today || !daily || !answer) return;
    // The tries with this one.
    const next = [...daily, g];
    // The round is hard when the switch was on at the first try and has stayed on.
    const hard = daily.length === 0 ? hardOn : dayHard && hardOn;
    // Shown.
    setDaily(next);
    // Remembered for the share card.
    setDayHard(hard);
    // The switch's last note is stale now.
    setHardNote(null);
    // Saved, so a reload shows the same rows.
    saveDay(next, hard);
    // This try's verdict.
    const solved = allOk(grade(g, answer));
    // The round ends on a solve or on the last try.
    if (solved || next.length >= MAX_TRIES) {
      // Counted once, as the day's puzzle.
      recordResult(GAME_ID, { dayKey: today, won: solved, daily: true });
      // Its bucket in the tries distribution (daily rounds only), merged into the extra field.
      const b = bucketOf(next, answer);
      // Always set at the end of a round; checked for the type.
      if (b) addToTally(today, b);
      // The stats line and the statistics re-read.
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
            // "3/6", or "3/6 · Hard" when the whole round was played in hard mode.
            summary: dayHard ? t("shareHard", { result: `${won ? daily.length : "X"}/${MAX_TRIES}` }) : `${won ? daily.length : "X"}/${MAX_TRIES}`,
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
      <li>{t("rule6")}</li>
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
          {/* Hard mode: a switch kept with the game's values; it turns on only before the day's first try. */}
          {daily && (
            <div className="fg-pod-hard">
              <button
                type="button"
                role="switch"
                aria-checked={hardOn}
                aria-disabled={!hardOn && !canTurnOn ? true : undefined}
                aria-describedby="pod-hard-desc"
                className={`fg-pod-switch${hardOn ? " fg-pod-switch-on" : ""}`}
                onClick={onHardSwitch}
              >
                <span className="fg-pod-switch-track" aria-hidden="true">
                  <span className="fg-pod-switch-thumb" />
                </span>
                <span>{t("hardLabel")}</span>
              </button>
              {/* What it does, or why it cannot be turned on now. */}
              <p id="pod-hard-desc" className="fg-pod-hard-desc">
                {!hardOn && !canTurnOn ? t("hardTooLate") : t("hardDesc")}
              </p>
              {/* What the last press did, for screen readers. */}
              <p className="sr-only" aria-live="polite">
                {hardNote ?? ""}
              </p>
            </div>
          )}
          {/* The round, once the saved tries are read. */}
          {puzzle && daily ? (
            <Round key={`daily-${today}`} puzzle={puzzle} guesses={daily} onGuess={onDailyGuess} idBase="pod-daily" locale={locale} hard={hardActive} />
          ) : (
            <p className="fg-muted">{tc("loading")}</p>
          )}
          {/* The teaching line, after the round. */}
          {done && puzzle && <WhyPanel puzzle={puzzle} />}
          {/* The statistics, after the round (daily rounds only). */}
          {done && today && answer && daily && <StatsPanel today={today} bucket={bucketOf(daily, answer)} version={version} />}
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
