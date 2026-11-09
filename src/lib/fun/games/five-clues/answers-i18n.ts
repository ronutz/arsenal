// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/fun/games/five-clues/answers-i18n.ts
// ----------------------------------------------------------------------------
// FIVE CLUES, THE ANSWERS ACCEPTED IN THE INTERFACE LANGUAGES BEYOND en AND
// pt-BR (09/11/2026). The puzzles (puzzles.ts) carry the accepted answers in
// English and Brazilian Portuguese; a page in Spanish, Danish, German, Dutch or
// French shows the category's name in its own language (the game's content
// strings, src/i18n/content/<locale>/five-clues.json), so a player there must
// be able to answer in that language too.
//
// Why a module and not the content-string files: the guess is judged twice,
// on the page and again by the scoreboard's server check (src/lib/fun/
// verify.ts), which runs in the Worker and reads no files. acceptedAnswers()
// (engine.ts) adds every list below to the puzzle's own, for every locale at
// once, exactly as the English and Portuguese answers are accepted on every
// page today; the self-test then holds them to the same rules (no answer of
// one puzzle accepted by another, no clue accepted as the answer).
//
// Shape: locale code (as in src/i18n/locales.ts) -> puzzle id -> the answers,
// the first being the locale's main answer (the category's name as its page
// shows it). Empty until the writers deliver a locale; the English and
// Portuguese behaviour is unchanged while it is.
// ============================================================================

// Each locale's answers live in answers/<locale>.json (puzzle id -> answers, main answer first), written by that
// locale's writer and checked by the self-test; bundled at build time, so the Worker reads no files either.
import ES from "./answers/es.json"; // Spanish (International), 09/11/2026: 209 puzzles
import DE from "./answers/de.json"; // German, 09/11/2026: 209 puzzles, 1,055 answers

/** Accepted answers per interface locale beyond en and pt-BR, by puzzle id. */
export const LOCALE_ANSWERS: Record<string /* locale */, Record<string /* puzzle id */, readonly string[]>> = {
  // Spanish: the category names as the Spanish page shows them, then the other natural ways to say them.
  es: ES,
  // German: the category names as the German page shows them, then the other natural ways to say them.
  de: DE,
};
