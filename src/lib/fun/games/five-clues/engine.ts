// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/fun/games/five-clues/engine.ts
// ----------------------------------------------------------------------------
// FIVE CLUES, the rules (PRIME 03/11/2026): guess the hidden IT category from
// up to five of its members, revealed one at a time, the hardest first.
//
// The day's puzzle: puzzle number n takes position (n - 1) mod the length of
// DAILY_ORDER (puzzles.ts), a fixed list of the daily pool's ids (the pool is
// puzzles.ts minus the practice-only warm-ups). So no puzzle comes back until
// the whole pool has been played, every puzzle comes back exactly one
// pool-length later, and a puzzle added at the end changes no day played.
//
// A guess is right when it matches any accepted answer of the puzzle, in
// either language: compared without case, accents, punctuation or spaces, and
// for answers of eight characters or more one slip is forgiven, but never a
// different digit, so "IPv4 header" is not "IPv6 header". A guess made only of words from an accepted answer ("DNS" for "DNS
// record types") is "close": the player is told to be more specific, and no
// clue is spent.
//
// Pure: no DOM, no clock, no Math.random.
// ============================================================================

// The day arithmetic and the launch day.
import { addDays, LAUNCH_DAY, puzzleNumber } from "../../daily";
// The self-test report shape.
import type { SelfTestReport } from "../../registry";
// The pool.
import { DAILY_ORDER, PUZZLES, type Clue, type FivePuzzle } from "./puzzles";

/** The game's stable id. */
export const GAME_ID = "five-clues";

/** Clues per puzzle. */
export const CLUES = 5;

/** How many past days the practice archive offers. */
export const ARCHIVE_DAYS = 30;

/** The two authored languages. */
export type Lang = "en" | "pt";

/** The puzzles that can be a daily puzzle. */
export const DAILY_POOL: readonly FivePuzzle[] = PUZZLES.filter((p) => !p.warmup);

/** The practice-only warm-ups. */
export const WARMUPS: readonly FivePuzzle[] = PUZZLES.filter((p) => p.warmup);

/** The fixed daily order, as positions in the daily pool (an id the pool lacks becomes -1, which the self-test reports). */
const ORDER: readonly number[] = DAILY_ORDER.map((id) => DAILY_POOL.findIndex((p) => p.id === id));

/**
 * The language of a locale: Brazilian Portuguese, or English for every other locale.
 *
 * @param locale the page locale
 * @returns "pt" or "en"
 */
export function langOf(locale: string): Lang {
  // Only pt-BR is authored besides English.
  return locale === "pt-BR" ? "pt" : "en";
}

/**
 * The puzzle of a puzzle number.
 *
 * @param n the puzzle number (1 on launch day)
 * @returns the puzzle
 */
export function puzzleFor(n: number): FivePuzzle {
  // The position in the order, wrapped (and kept non-negative for numbers before launch).
  const k = (((n - 1) % ORDER.length) + ORDER.length) % ORDER.length;
  // The puzzle there.
  return DAILY_POOL[ORDER[k]];
}

/**
 * The puzzle of a UTC day.
 *
 * @param dayKey the date as YYYY-MM-DD
 * @returns the day's puzzle
 */
export function dailyFor(dayKey: string): FivePuzzle {
  // Through the puzzle number.
  return puzzleFor(puzzleNumber(dayKey));
}

/**
 * The past puzzle numbers practice may offer on day n: the previous thirty days, never today or later.
 *
 * @param n today's puzzle number
 * @returns the numbers, newest first
 */
export function archive(n: number): number[] {
  // The numbers.
  const out: number[] = [];
  // From yesterday back thirty days, not before puzzle #1.
  for (let m = n - 1; m >= Math.max(1, n - ARCHIVE_DAYS); m--) out.push(m);
  // Newest first.
  return out;
}

/**
 * A clue in a language.
 *
 * @param c the clue
 * @param lang the language
 * @returns its text
 */
export function clueText(c: string | Clue, lang: Lang): string {
  // A plain string is the same in both languages.
  return typeof c === "string" ? c : c[lang];
}

// ---- Matching ----------------------------------------------------------------

/**
 * A guess or an answer reduced for comparison: no accents, lower case, "&" as "and", other punctuation as spaces.
 *
 * @param s the text
 * @returns the words, single-spaced
 */
export function normalise(s: string): string {
  // Accents off (decomposed, combining marks removed), then case.
  const plain = s.normalize("NFD").replace(/\p{M}+/gu, "").toLowerCase();
  // Ampersands spoken, everything else that is not a letter or digit a space.
  return plain.replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * The compact form: the normalised words run together, so "RFC1918" equals "RFC 1918".
 *
 * @param s the text
 * @returns the letters and digits only
 */
function compact(s: string): string {
  // Spaces out of the normalised form.
  return normalise(s).replace(/ /g, "");
}

/**
 * The edit distance between two strings, giving up above a limit.
 *
 * @param a one string
 * @param b the other
 * @param max the largest distance of interest
 * @returns the distance, or max + 1 when it is larger
 */
function editDistance(a: string, b: string, max: number): number {
  // A length difference alone can exceed the limit.
  if (Math.abs(a.length - b.length) > max) return max + 1;
  // The previous row of the table.
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  // Each character of a.
  for (let i = 1; i <= a.length; i++) {
    // The current row, starting with the cost of deleting i characters.
    const cur = [i];
    // The smallest value in the row, for the early exit.
    let rowMin = i;
    // Each character of b.
    for (let j = 1; j <= b.length; j++) {
      // Substitution, deletion or insertion, whichever is cheapest.
      const v = Math.min(prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1), prev[j] + 1, cur[j - 1] + 1);
      // Stored.
      cur.push(v);
      // Tracked.
      rowMin = Math.min(rowMin, v);
    }
    // The whole row is past the limit: so is the answer.
    if (rowMin > max) return max + 1;
    // Next row.
    prev = cur;
  }
  // The distance.
  return prev[b.length];
}

/** Words that never make a guess "close" on their own. */
const STOP = new Set(
  "the a an of in on for and or to types type kinds kind list names name values value o os as de do da dos das em no na nos nas e ou para tipos tipo nomes nome valores valor".split(" "),
);

/**
 * Every accepted answer of a puzzle: both languages' lists, both category names, and the category names without
 * their bracketed part ("Private IPv4 addresses" for "Private IPv4 addresses (RFC 1918)").
 *
 * @param p the puzzle
 * @returns the accepted answers, as written
 */
export function acceptedAnswers(p: FivePuzzle): string[] {
  // The category names without brackets.
  const bare = [p.cat.en, p.cat.pt].map((c) => c.replace(/\s*\([^)]*\)\s*/g, " ").trim());
  // All of them.
  return [...p.answers.en, ...p.answers.pt, p.cat.en, p.cat.pt, ...bare];
}

/** An accepted answer ready for comparison. */
interface Prepared {
  /** The compact form. */
  compact: string;
  /** Its digits. */
  digits: string;
  /** Its words. */
  words: Set<string>;
}

/** Prepared answers per puzzle, computed on first use. */
const PREPARED = new Map<string, Prepared[]>();

/**
 * A puzzle's accepted answers in comparable form, cached.
 *
 * @param p the puzzle
 * @returns the prepared answers
 */
function prepare(p: FivePuzzle): Prepared[] {
  // Already prepared.
  const hit = PREPARED.get(p.id);
  // Reused.
  if (hit) return hit;
  // Each answer: compact, digits, words.
  const out = acceptedAnswers(p).map((a) => {
    // The compact form.
    const c = compact(a);
    // The three forms.
    return { compact: c, digits: c.replace(/[^0-9]/g, ""), words: new Set(normalise(a).split(" ")) };
  });
  // Kept.
  PREPARED.set(p.id, out);
  // Returned.
  return out;
}

/** The verdict on a guess. */
export type Verdict = "right" | "close" | "wrong" | "empty";

/**
 * Judge a guess against a puzzle.
 *
 * @param guess what the player typed
 * @param p the puzzle
 * @returns right, close (only words of an answer: be more specific), wrong, or empty
 */
export function judge(guess: string, p: FivePuzzle): Verdict {
  // The guess, compact.
  const g = compact(guess);
  // Nothing typed.
  if (!g) return "empty";
  // Its digits, which must match exactly for a slip to be forgiven.
  const gDigits = g.replace(/[^0-9]/g, "");
  // The puzzle's answers, prepared once.
  const prepared = prepare(p);
  // Every accepted answer.
  for (const a of prepared) {
    // An exact match.
    if (g === a.compact) return "right";
    // One slip forgiven in an answer of eight characters or more, never in the digits.
    if (a.compact.length >= 8 && gDigits === a.digits && editDistance(g, a.compact, 1) <= 1) return "right";
  }
  // The guess's meaningful words.
  const words = normalise(guess)
    .split(" ")
    .filter((w) => w.length >= 2 && !STOP.has(w));
  // Close: every meaningful word belongs to one accepted answer.
  if (words.length > 0 && prepared.some((a) => words.every((w) => a.words.has(w)))) return "close";
  // Wrong.
  return "wrong";
}

// ---- The self-test -----------------------------------------------------------

/**
 * The self-test: the pool is complete in both languages, no clue gives its answer away, the categories cannot be
 * mistaken for each other, and 400 days give valid puzzles in a fixed order with no repeat inside a pool's length
 * and no future puzzle in the practice archive.
 *
 * @returns what was checked and what failed
 */
export function selfTest(): SelfTestReport {
  // Problems.
  const failures: string[] = [];
  // Cases checked.
  let checked = 0;
  // Ids seen.
  const ids = new Set<string>();
  // At least eighty daily puzzles.
  if (DAILY_POOL.length < 80) failures.push(`only ${DAILY_POOL.length} daily puzzles`);
  // Each puzzle.
  for (const p of PUZZLES) {
    // Unique id.
    if (ids.has(p.id)) failures.push(`${p.id}: duplicate id`);
    // Remembered.
    ids.add(p.id);
    // Both category names.
    if (!p.cat.en.trim() || !p.cat.pt.trim()) failures.push(`${p.id}: category missing in a language`);
    // Answers in both languages.
    if (p.answers.en.length === 0 || p.answers.pt.length === 0) failures.push(`${p.id}: answers missing in a language`);
    // Exactly five clues.
    if (p.clues.length !== CLUES) failures.push(`${p.id}: ${p.clues.length} clues`);
    // A first-party source.
    if (!/^https:\/\//.test(p.source.url) || !p.source.label.trim()) failures.push(`${p.id}: source missing`);
    // Each language.
    for (const lang of ["en", "pt"] as const) {
      // The clues in that language.
      const texts = p.clues.map((c) => clueText(c, lang));
      // None empty, all short.
      for (const c of texts) if (!c.trim() || c.length > 40) failures.push(`${p.id}: clue "${c}" empty or longer than 40 characters (${lang})`);
      // All different.
      if (new Set(texts.map(normalise)).size !== texts.length) failures.push(`${p.id}: repeated clue (${lang})`);
      // No clue contains a main answer or any longer accepted answer, as whole words.
      const giveaways = [p.answers.en[0], p.answers.pt[0], ...acceptedAnswers(p).filter((a) => normalise(a).length >= 6)];
      // Each clue against each give-away.
      for (const c of texts)
        for (const a of giveaways)
          if (` ${normalise(c)} `.includes(` ${normalise(a)} `)) failures.push(`${p.id}: clue "${c}" contains the answer "${a}"`);
      // A clue is never itself an accepted answer.
      for (const c of texts) if (judge(c, p) === "right") failures.push(`${p.id}: clue "${c}" is accepted as the answer`);
    }
    // The category names and every listed answer are accepted.
    for (const a of acceptedAnswers(p)) if (judge(a, p) !== "right") failures.push(`${p.id}: "${a}" is not accepted`);
    // Accents and case do not matter.
    if (judge(p.answers.pt[0].toUpperCase().normalize("NFD").replace(/\p{M}+/gu, ""), p) !== "right") failures.push(`${p.id}: accent-free capitals not accepted`);
    // One more.
    checked++;
  }
  // No answer of one puzzle is accepted by another.
  for (const p of PUZZLES)
    for (const q of PUZZLES) {
      // Not itself.
      if (p === q) continue;
      // Each of p's answers, tried on q.
      for (const a of acceptedAnswers(p)) if (judge(a, q) === "right") failures.push(`"${a}" (${p.id}) is also accepted by ${q.id}`);
    }
  // The order is a permutation of the pool.
  if (ORDER.includes(-1) || new Set(ORDER).size !== DAILY_POOL.length || ORDER.length !== DAILY_POOL.length) failures.push("DAILY_ORDER is not a permutation of the daily pool (an id missing, misspelt or repeated)");
  // 400 days.
  const lastSeen = new Map<string, number>();
  // Each day from launch.
  for (let i = 0; i < 400; i++) {
    // The day and its number.
    const day = addDays(LAUNCH_DAY, i);
    // Its number.
    const n = puzzleNumber(day);
    // Twice, identical.
    const p = dailyFor(day);
    // The second time.
    if (dailyFor(day) !== p) failures.push(`${day}: not deterministic`);
    // Never a warm-up.
    if (p.warmup) failures.push(`${day}: a warm-up came up as the daily puzzle`);
    // Its previous appearance.
    const prev = lastSeen.get(p.id);
    // A repeat must be a whole pool later, never sooner.
    if (prev !== undefined && n - prev !== DAILY_POOL.length) failures.push(`${day}: ${p.id} repeats after ${n - prev} days`);
    // Remembered.
    lastSeen.set(p.id, n);
    // The archive holds only the past, at most thirty days back.
    for (const m of archive(n)) if (m >= n || m < n - ARCHIVE_DAYS || m < 1) failures.push(`${day}: archive offers #${m}`);
    // One more.
    checked++;
  }
  // In the first pool-length of days every daily puzzle came up once.
  if (lastSeen.size !== DAILY_POOL.length) failures.push(`400 days used ${lastSeen.size} of ${DAILY_POOL.length} daily puzzles`);
  // The matcher's promises, on fixed cases.
  const dns = PUZZLES.find((p) => p.id === "dns-rr");
  // The DNS puzzle must exist for these.
  if (dns) {
    // Close, right with a slip, wrong.
    if (judge("DNS", dns) !== "close" || judge("dns recrd types", dns) !== "right" || judge("HTTP methods", dns) !== "wrong" || judge("  ", dns) !== "empty")
      failures.push("judge is off on the DNS cases");
    // Brazilian accents are optional.
    if (judge("tipos de registro dns", dns) !== "right") failures.push("judge is off on the accent-free Portuguese case");
  }
  // A different digit is never forgiven.
  const v4 = PUZZLES.find((p) => p.id === "ipv4-header");
  // IPv6 is not IPv4.
  if (v4 && judge("IPv6 header fields", v4) === "right") failures.push("judge forgives a different digit");
  // The report.
  return { checked, failures };
}
