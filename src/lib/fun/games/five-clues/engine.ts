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
// clue is spent. Since 09/11/2026 the answers of the other interface
// languages (answers-i18n.ts, empty until written) are accepted the same way,
// on every page and in the scoreboard's server check.
//
// Pure: no DOM, no clock, no Math.random.
// ============================================================================

// The day arithmetic and the launch day.
import { addDays, LAUNCH_DAY, puzzleNumber } from "../../daily";
// The self-test report shape.
import type { SelfTestReport } from "../../registry";
// The pool.
import { DAILY_ORDER, PUZZLES, type Clue, type FivePuzzle } from "./puzzles";
// The answers accepted in the interface languages beyond English and Portuguese (09/11/2026; empty until written).
import { LOCALE_ANSWERS } from "./answers-i18n";

/** The game's stable id. */
export const GAME_ID = "five-clues";

/** Clues per puzzle. */
export const CLUES = 5;


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
 * their bracketed part ("Private IPv4 addresses" for "Private IPv4 addresses (RFC 1918)"); then, since 09/11/2026,
 * every other interface locale's list for the puzzle (answers-i18n.ts), after the existing ones so the order of the
 * English and Portuguese answers (the first is the main answer) is unchanged.
 *
 * @param p the puzzle
 * @returns the accepted answers, as written
 */
export function acceptedAnswers(p: FivePuzzle): string[] {
  // The category names without brackets.
  const bare = [p.cat.en, p.cat.pt].map((c) => c.replace(/\s*\([^)]*\)\s*/g, " ").trim());
  // The other interface locales' answers for this puzzle, in the locales' order in the table (none yet).
  const others = Object.values(LOCALE_ANSWERS).flatMap((byPuzzle) => byPuzzle[p.id] ?? []);
  // All of them.
  return [...p.answers.en, ...p.answers.pt, p.cat.en, p.cat.pt, ...bare, ...others];
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

// ---- Comments on a wrong guess (PRIME 12/11/2026 18:20) -------------------------
//
// "Five clues needs to provide additional comments to the player's guesses, contextually analyzing and giving more
// contextual and relatable responses to the tries, instead of just 'Not "guess"'." The verdict stays judge()'s (the
// score, and the scoreboard's server check, are unchanged); explain() only says WHY a guess that is not right missed,
// from the guess's own words and the puzzle's data: a repeat, one word too many, a clue named back, another day's
// category, which of the player's words are in the answer, a word close in meaning, or nothing in common. It never
// shows a word of the answer the player did not type. Two of the kinds cost no clue (a repeat, and a guess that holds a
// whole accepted answer plus extra words), like "close". Pure and deterministic, so every player of the day reads the
// same comment for the same guess.

/** Why a guess that is not right missed. */
export type Explanation =
  /** The same guess as an earlier one (same words, any order or plural): no clue spent. */
  | { kind: "repeat" }
  /** Every word of an accepted answer is there, plus words that are not: no clue spent. */
  | { kind: "extra"; extra: string[] }
  /** The guess is one of the clues: the answer is what they have in common. */
  | { kind: "clue" }
  /** The guess is another puzzle's category. */
  | { kind: "otherCategory" }
  /** Some of the guess's words are in an answer (hits), others not (misses). */
  | { kind: "warm"; hits: string[]; misses: string[] }
  /** Every word is in some answer, but no one answer holds them together. */
  | { kind: "mixed"; hits: string[] }
  /** No word is in the answer, but one is close in meaning to a word that is. */
  | { kind: "near"; near: string[] }
  /** Nothing in common with any accepted answer. */
  | { kind: "cold" };

/**
 * A word reduced to a rough stem, so plurals meet their singulars in English and Portuguese ("phases" and "phase",
 * "mensagens" and "mensagem", "operacoes" and "operacao").
 *
 * @param w a normalised word
 * @returns its stem
 */
function stem(w: string): string {
  // Short words are left alone ("dns", "bgp", "ssl").
  if (w.length <= 3) return w;
  // Portuguese plurals first, then English.
  if (w.endsWith("oes") || w.endsWith("aes")) return w.slice(0, -3) + "ao";
  // "mensagens" -> "mensagem".
  if (w.endsWith("ns")) return w.slice(0, -2) + "m";
  // "nacionais" -> "nacional".
  if (w.endsWith("ais")) return w.slice(0, -3) + "al";
  // "entries" -> "entry".
  if (w.endsWith("ies")) return w.slice(0, -3) + "y";
  // "phases" -> "phase", but "class" stays "class".
  if (w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
  // Already a stem.
  return w;
}

/** Words close in meaning, as stems, each group checked against the answers' own words (English and Portuguese). */
const NEAR_GROUPS: readonly (readonly string[])[] = [
  ["phase", "stage", "step", "fase", "etapa", "passo"],
  ["message", "packet", "pdu", "frame", "datagram", "mensagem", "pacote", "quadro"],
  ["flag", "bit", "bandeira"],
  ["code", "number", "value", "codigo", "numero", "valor"],
  ["state", "status", "estado"],
  ["method", "verb", "operation", "metodo", "verbo", "operacao"],
  ["level", "severity", "nivel", "severidade"],
  ["attack", "intrusion", "threat", "ataque", "intrusao", "ameaca"],
  ["record", "entry", "registro", "entrada"],
  ["command", "instruction", "comando", "instrucao"],
  ["algorithm", "cipher", "algoritmo", "cifra"],
  ["port", "service", "porta", "servico"],
  ["address", "endereco"],
  ["error", "fault", "failure", "erro", "falha"],
];

/**
 * The meaningful words of a text, stemmed: no stop words, nothing shorter than two characters.
 *
 * @param s the text
 * @returns the stems, in order, without repeats
 */
function stems(s: string): string[] {
  // Normalised words, filtered, stemmed, de-duplicated in order.
  return [...new Set(normalise(s).split(" ").filter((w) => w.length >= 2 && !STOP.has(w)).map(stem))];
}

/**
 * Why a guess that is not right missed (call it only after judge() said "wrong").
 *
 * @param guess what the player typed
 * @param p the puzzle
 * @param earlier the guesses already spent in this round (passes are empty strings)
 * @param pool every puzzle, for the "another day's category" case (defaults to the whole pool)
 * @returns the explanation
 */
export function explain(guess: string, p: FivePuzzle, earlier: readonly string[], pool: readonly FivePuzzle[] = PUZZLES): Explanation {
  // The guess's stems, and as a set.
  const g = stems(guess);
  // Each stem back to the word as the player typed it, so a comment quotes "phases", not the stem "phase".
  const typed = new Map<string, string>();
  // Every typed token, and the normalised words inside it.
  for (const tok of guess.trim().split(/\s+/))
    for (const w of normalise(tok).split(" ")) if (w && !typed.has(stem(w))) typed.set(stem(w), tok.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "") || tok);
  // A stem as typed.
  const asTyped = (s: string) => typed.get(s) ?? s;
  // For membership tests.
  const gSet = new Set(g);
  // A repeat: the same compact text, or the same set of stems, as an earlier guess that was not a pass.
  for (const e of earlier) {
    // Passes are not guesses.
    if (!e.trim()) continue;
    // The earlier guess's stems.
    const es = stems(e);
    // Same text, or same words in any order.
    if (compact(e) === compact(guess) || (es.length > 0 && es.length === g.length && es.every((w) => gSet.has(w)))) return { kind: "repeat" };
  }
  // Each accepted answer's stems (only answers of two or more meaningful words can be "held with extras").
  const answerStems = acceptedAnswers(p).map(stems);
  // Every stem that appears in any accepted answer.
  const anyAnswer = new Set(answerStems.flat());
  // One word too many: some answer of two or more words is wholly inside the guess.
  for (const a of answerStems) {
    // Too short to be meaningful on its own.
    if (a.length < 2) continue;
    // All of the answer's words are in the guess.
    if (a.every((w) => gSet.has(w))) {
      // The extras, as the player typed them (stems are close enough to read).
      const extra = g.filter((w) => !a.includes(w));
      // Something extra is there (otherwise judge would have said right or close).
      if (extra.length > 0) return { kind: "extra", extra: extra.map(asTyped) };
    }
  }
  // A clue named back: the guess is a clue, or contains one as whole words.
  const n = ` ${normalise(guess)} `;
  // Any clue, in either language.
  for (const c of p.clues)
    for (const lang of ["en", "pt"] as const) {
      // The clue, normalised.
      const cn = normalise(clueText(c, lang));
      // Whole-word containment.
      if (cn && n.includes(` ${cn} `)) return { kind: "clue" };
    }
  // Another day's category.
  if (pool.some((q) => q.id !== p.id && judge(guess, q) === "right")) return { kind: "otherCategory" };
  // Which of the player's words are in some accepted answer.
  const hits = g.filter((w) => anyAnswer.has(w));
  // And which are not.
  const misses = g.filter((w) => !anyAnswer.has(w));
  // Some in, some out.
  if (hits.length > 0 && misses.length > 0) return { kind: "warm", hits: hits.map(asTyped), misses: misses.map(asTyped) };
  // All in, but not in one answer together.
  if (hits.length > 0) return { kind: "mixed", hits: hits.map(asTyped) };
  // None in: is any word close in meaning to a word of the answers?
  const near = g.filter((w) => NEAR_GROUPS.some((grp) => grp.includes(w) && grp.some((x) => x !== w && anyAnswer.has(x))));
  // Close in meaning.
  if (near.length > 0) return { kind: "near", near: near.map(asTyped) };
  // Nothing in common.
  return { kind: "cold" };
}

// ---- The self-test -----------------------------------------------------------

/**
 * The self-test: the pool is complete in both languages, no clue gives its answer away, the categories cannot be
 * mistaken for each other, and 400 days give valid puzzles in a fixed order with no repeat inside a pool's length
 * (earlier days are played from the games' Earlier puzzles list since 05/11/2026; practice keeps only the warm-ups).
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
  // The comments on wrong guesses (PRIME 12/11/2026 18:20), on the round in his screenshot (Cyber Kill Chain phases).
  const kc = PUZZLES.find((p) => p.id === "kill-chain");
  // The kill-chain puzzle must exist for these.
  if (kc) {
    // "cyber kill chain process" holds the accepted answer "Cyber Kill Chain" plus one word.
    const e1 = explain("cyber kill chain process", kc, []);
    if (e1.kind !== "extra" || e1.extra.join(" ") !== "process") failures.push(`explain: extra case gave ${JSON.stringify(e1)}`);
    // "attack chain phases": chain and phases are in, attack is not, and no accepted answer is wholly inside.
    const e2 = explain("attack chain phases", kc, []);
    if (e2.kind !== "warm" || e2.hits.join(" ") !== "chain phases" || e2.misses.join(" ") !== "attack") failures.push(`explain: warm case gave ${JSON.stringify(e2)}`);
    // "attack kill chain" holds the accepted answer "kill chain" plus "attack": one word too many, no clue spent.
    const e3 = explain("attack kill chain", kc, []);
    if (e3.kind !== "extra" || e3.extra.join(" ") !== "attack") failures.push(`explain: second extra case gave ${JSON.stringify(e3)}`);
    // The same words in another order is a repeat.
    if (explain("kill chain attack", kc, ["attack kill chain"]).kind !== "repeat") failures.push("explain: repeat in another order not seen");
    // A clue named back.
    if (explain(clueText(kc.clues[0], "en"), kc, []).kind !== "clue") failures.push("explain: clue case not seen");
    // Nothing in common.
    if (explain("routing protocols", kc, []).kind !== "cold") failures.push(`explain: cold case gave ${JSON.stringify(explain("routing protocols", kc, []))}`);
    // Close in meaning: "stages" for "phases".
    if (explain("stages", kc, []).kind !== "near") failures.push(`explain: near case gave ${JSON.stringify(explain("stages", kc, []))}`);
    // Another day's category.
    if (dns && explain(dns.answers.en[0], kc, []).kind !== "otherCategory") failures.push("explain: other category not seen");
  }
  // A different digit is never forgiven.
  const v4 = PUZZLES.find((p) => p.id === "ipv4-header");
  // IPv6 is not IPv4.
  if (v4 && judge("IPv6 header fields", v4) === "right") failures.push("judge forgives a different digit");
  // The report.
  return { checked, failures };
}
