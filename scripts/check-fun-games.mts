// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-fun-games.mts
// ----------------------------------------------------------------------------
// EVERY /dev/fun AND /arcade GAME'S PUZZLES ARE PLAYABLE (2026-11-03).
//
// Runs each registered engine's selfTest() (src/lib/fun/registry.ts) and fails
// on any failure: a daily puzzle with no solution, two solutions where one is
// promised, a generator that gives different puzzles for the same day, a level
// that cannot be finished. It also fails when a folder under
// src/lib/fun/games/ is not registered, so a new game cannot skip its test,
// and it holds the shelf's list (src/config/funGames.ts) to the files: every
// listed game has its page, a registered engine and its page and card strings
// in en and pt-BR, and every page that mounts a game is listed on the shelf.
// Since 08/11/2026 it also runs the public scoreboard's golden cases
// (src/lib/fun/verify.ts: a solved round verifies, a tampered one is refused)
// and its shared rules' cases (src/lib/fun/board-rules.ts), and holds the
// board's list of games to the shelf's daily games. Since PRIME's 23:14 of
// 08/11/2026 ("Yes move them") the arcade group's pages live under /arcade:
// every listed game's page must be in the section its group gives it
// (funPagePath), and a game page in either section must be listed.
// ============================================================================

// Folder listing and file reads.
import { readdirSync, existsSync, readFileSync } from "node:fs";
// The engines.
import { FUN_ENGINES } from "../src/lib/fun/registry";
// The shelf's list of games, and the page each one's group gives it (/arcade/<id> or /dev/fun/<id>).
import { FUN_GAMES, funPagePath, funSection } from "../src/config/funGames";
// The public scoreboard (08/11/2026): its honesty check's golden cases and its shared rules' own cases.
import { verifySelfTest } from "../src/lib/fun/verify";
import { BOARD_GAMES, rulesSelfTest } from "../src/lib/fun/board-rules";

// Problems found.
const problems: string[] = [];
// Puzzles checked in all.
let checked = 0;

// Each registered engine.
for (const engine of FUN_ENGINES) {
  // Its report, timed.
  const t0 = performance.now();
  // A throw is a failure too.
  try {
    // The self-test.
    const report = engine.selfTest();
    // Counted.
    checked += report.checked;
    // Each failure, labelled with the game.
    for (const f of report.failures) problems.push(`${engine.id}: ${f}`);
    // Its time, for the log.
    console.log(`[check-fun-games]   ${engine.id}: ${report.checked} checked in ${Math.round(performance.now() - t0)} ms`);
  } catch (err) {
    // The exception's message.
    problems.push(`${engine.id}: selfTest threw: ${(err as Error).message}`);
  }
}

// The scoreboard's checks (PRIME 08/11/2026): for each board game, a round built from the engine's own answer verifies
// with the expected score and the same round tampered with is refused; then the initials, the day window and the
// fields the browser sends. They run here, with the engines they rebuild the puzzles from.
for (const [label, test] of [["scoreboard verify", verifySelfTest], ["scoreboard rules", rulesSelfTest]] as const) {
  // Timed, like the engines.
  const t0 = performance.now();
  // A throw is a failure too.
  try {
    // The cases.
    const report = test();
    // Counted.
    checked += report.checked;
    // Each failure, labelled.
    for (const f of report.failures) problems.push(`${label}: ${f}`);
    // Its time, for the log.
    console.log(`[check-fun-games]   ${label}: ${report.checked} checked in ${Math.round(performance.now() - t0)} ms`);
  } catch (err) {
    // The exception's message.
    problems.push(`${label}: threw: ${(err as Error).message}`);
  }
}
// Every daily game on the shelf posts to the board, and the board names no game that is not a daily one on the shelf.
const dailyIds = FUN_GAMES.filter((g) => g.daily).map((g) => g.id);
// A daily game the board forgot.
for (const id of dailyIds) if (!BOARD_GAMES.some((g) => g.id === id)) problems.push(`${id}: a daily game with no entry in src/lib/fun/board-rules.ts BOARD_GAMES`);
// A board entry for something else.
for (const g of BOARD_GAMES) if (!dailyIds.includes(g.id)) problems.push(`${g.id}: on the board (src/lib/fun/board-rules.ts) but not a daily game on the shelf`);

// The game folders on disk.
const dir = "src/lib/fun/games";
// Every sub-folder (none yet is fine).
const folders = existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name) : [];
// The registered ids.
const ids = new Set(FUN_ENGINES.map((e) => e.id));
// A folder without a registry line.
for (const f of folders) if (!ids.has(f)) problems.push(`${f}: has an engine folder but no line in src/lib/fun/registry.ts`);

// The strings every game page and shelf card reads, in both authored packs.
const REQUIRED_KEYS = ["metaTitle", "metaDescription", "title", "tagline", "intro", "cardName", "cardBlurb"];
// The authored packs, parsed once.
const packs = Object.fromEntries(
  // en and pt-BR carry the games' copy; the other packs fall back per key.
  ["en", "pt-BR"].map((loc) => [loc, JSON.parse(readFileSync(`src/i18n/messages/${loc}.json`, "utf8"))]),
);
// The listed ids, for the reverse check below.
const listed = new Set(FUN_GAMES.map((g) => g.id));
// A game listed twice would draw two cards.
if (listed.size !== FUN_GAMES.length) problems.push("src/config/funGames.ts lists a game twice");
// Each listed game.
for (const game of FUN_GAMES) {
  // Its page, in the section its group gives it.
  const pageFile = `src/app/[locale]${funPagePath(game.id)}/page.tsx`;
  // Missing there (perhaps still in the other section, which the scan below reports too).
  if (!existsSync(pageFile)) problems.push(`${game.id}: listed on the shelf but has no page at ${pageFile}`);
  // Its engine.
  if (!ids.has(game.id)) problems.push(`${game.id}: listed on the shelf but no engine is registered under that id`);
  // Its strings, in each authored pack.
  for (const [loc, pack] of Object.entries(packs)) {
    // The game's namespace.
    const ns = pack?.devFun?.games?.[game.id];
    // Each required key, a non-empty string.
    for (const key of REQUIRED_KEYS) {
      // Missing or empty.
      if (typeof ns?.[key] !== "string" || !ns[key].trim()) problems.push(`${game.id}: ${loc} has no devFun.games.${game.id}.${key}`);
    }
  }
}
// The two sections a game page can live in (08/11/2026): the shelf's and the arcade's.
for (const section of ["/dev/fun", "/arcade"] as const) {
  // The section's page folders.
  const pagesDir = `src/app/[locale]${section}`;
  // Each one whose page mounts a game component must be on the shelf, and in this section.
  for (const entry of readdirSync(pagesDir, { withFileTypes: true })) {
    // Folders only.
    if (!entry.isDirectory()) continue;
    // Its page, if it has one.
    const page = `${pagesDir}/${entry.name}/page.tsx`;
    // A folder without a page is not a route.
    if (!existsSync(page)) continue;
    // A game page imports from the games' component folder; the toys and the scoreboard page do not.
    if (!readFileSync(page, "utf8").includes("@/components/dev/fun/games/")) continue;
    // Built, but no card leads to it.
    if (!listed.has(entry.name)) problems.push(`${entry.name}: a game page under ${section} that src/config/funGames.ts does not list`);
    // Listed, but its group puts it in the other section (a page left behind by a move).
    else if (funSection(entry.name) !== section) problems.push(`${entry.name}: its page is under ${section}, but its group puts it at ${funPagePath(entry.name)}`);
  }
}

// The verdict.
if (problems.length) {
  // Each problem.
  for (const p of problems) console.error(`[check-fun-games] FAIL: ${p}`);
  // A red guard stops the build.
  process.exit(1);
}
// All well.
console.log(`[check-fun-games] OK: ${FUN_ENGINES.length} game engine(s), ${checked} puzzle(s) or level(s) checked; every engine folder is registered; ${FUN_GAMES.length} game(s) on the shelf, each with its page, engine and strings in en and pt-BR.`);
