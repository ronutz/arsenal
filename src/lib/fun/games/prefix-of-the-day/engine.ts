// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/fun/games/prefix-of-the-day/engine.ts
// ----------------------------------------------------------------------------
// PREFIX OF THE DAY, the rules (PRIME 03/11/2026: the shelf's flagship daily).
//
// One IPv4 address with a prefix length a day, the same for everyone on a UTC
// day. The player works out four facts about its block: the network address,
// the broadcast address, the dotted subnet mask and the number of usable
// hosts. Six tries; after each one every field is marked correct, or "the
// answer is higher" / "the answer is lower", addresses and masks compared as
// 32-bit unsigned numbers.
//
// The difficulty follows the weekday of the UTC day: Monday sits on octet
// boundaries (/8, /16, /24 and their neighbours), Sunday on odd boundaries in
// the middle of an octet, with the occasional /31 and /32.
//
// /31 and /32 follow RFC 3021 and the site's CIDR calculator: a /31 is a
// point-to-point link whose two addresses are both usable, a /32 is one host.
// Neither has a directed broadcast, so the "broadcast" field expects the last
// address of the block, exactly as the calculator shows it (for a /32, the
// address itself), and usable hosts are 2 and 1.
//
// The answers are computed here with this file's own arithmetic; selfTest()
// checks them against the site's CIDR engine (cidrAnalyze) for 400 daily
// puzzles and 2,000 practice puzzles. Pure: no DOM, no clock, no Math.random.
// ============================================================================

// The day arithmetic and the seeded generators.
import { addDays, dailyRng, epochDay, LAUNCH_DAY, makeRng, type Rng } from "../../daily";
// The self-test report shape.
import type { SelfTestReport } from "../../registry";
// The site's CIDR engine, the independent check of every answer.
import { cidrAnalyze } from "../../../tools/cidr/compute";

/** The game's stable id (storage key, daily seed, page slug). */
export const GAME_ID = "prefix-of-the-day";

/** Tries per puzzle. */
export const MAX_TRIES = 6;

/** The four facts the player fills in, in the order of the row. */
export type Field = "network" | "broadcast" | "mask" | "hosts";

/** The fields in display order. */
export const FIELDS: readonly Field[] = ["network", "broadcast", "mask", "hosts"];

/** A puzzle: an address, a prefix length, and the difficulty tier it was drawn at. */
export interface Puzzle {
  /** The address as an unsigned 32-bit number. */
  address: number;
  /** The prefix length, 8 to 32. */
  prefix: number;
  /** The difficulty tier, 1 (Monday, easiest) to 7 (Sunday, hardest). */
  tier: number;
}

/** The four answers (or a guess at them), each a plain number. */
export interface Facts {
  /** The network address (first address of the block). */
  network: number;
  /** The broadcast address (last address of the block; see the header for /31 and /32). */
  broadcast: number;
  /** The subnet mask as a 32-bit number. */
  mask: number;
  /** The usable hosts. */
  hosts: number;
}

/** The mark of one field: correct, or the direction of the answer from the guess. */
export type Mark = "ok" | "up" | "down";

/** The marks of one try. */
export type Marks = Record<Field, Mark>;

// ---- Address arithmetic ------------------------------------------------------

/** 2^32, the size of the IPv4 space. */
const SPACE = 4294967296;

/**
 * The mask of a prefix length as an unsigned 32-bit number.
 *
 * @param prefix the prefix length, 0 to 32
 * @returns the mask
 */
export function maskOf(prefix: number): number {
  // A /0 has no network bits (a shift by 32 would be a shift by 0 in JavaScript).
  if (prefix <= 0) return 0;
  // Ones in the top `prefix` bits, as unsigned.
  return (0xffffffff << (32 - prefix)) >>> 0;
}

/**
 * The four facts of a puzzle, computed here.
 *
 * @param p the puzzle
 * @returns network, broadcast, mask and usable hosts
 */
export function solve(p: Puzzle): Facts {
  // The mask.
  const mask = maskOf(p.prefix);
  // The network: the address with its host bits cleared.
  const network = (p.address & mask) >>> 0;
  // The number of addresses in the block.
  const size = Math.pow(2, 32 - p.prefix);
  // The last address of the block.
  const broadcast = network + size - 1;
  // RFC 3021: /31 and /32 reserve nothing; every other block loses the network and broadcast addresses.
  const hosts = p.prefix >= 31 ? size : size - 2;
  // The facts.
  return { network, broadcast, mask, hosts };
}

/**
 * Mark a guess against the answers.
 *
 * @param guess the player's four numbers
 * @param answer the puzzle's answers
 * @returns per field: ok, up (the answer is higher) or down (the answer is lower)
 */
export function grade(guess: Facts, answer: Facts): Marks {
  // One field's mark.
  const one = (g: number, a: number): Mark => (g === a ? "ok" : g < a ? "up" : "down");
  // All four.
  return {
    network: one(guess.network, answer.network),
    broadcast: one(guess.broadcast, answer.broadcast),
    mask: one(guess.mask, answer.mask),
    hosts: one(guess.hosts, answer.hosts),
  };
}

/**
 * Whether a try's marks are all correct.
 *
 * @param m the marks
 * @returns true when every field is right
 */
export function allOk(m: Marks): boolean {
  // Every field.
  return FIELDS.every((f) => m[f] === "ok");
}

/**
 * An address in dotted-quad form.
 *
 * @param n an unsigned 32-bit number
 * @returns "a.b.c.d"
 */
export function formatAddress(n: number): string {
  // Unsigned first.
  const u = n >>> 0;
  // The four octets, high to low.
  return [(u >>> 24) & 255, (u >>> 16) & 255, (u >>> 8) & 255, u & 255].join(".");
}

/**
 * The puzzle as the player sees it: "172.18.77.143/21".
 *
 * @param p the puzzle
 * @returns address and prefix length
 */
export function puzzleLabel(p: Puzzle): string {
  // Address, slash, length.
  return `${formatAddress(p.address)}/${p.prefix}`;
}

/** A dotted quad, with optional spaces around it; each part 1 to 3 digits. */
const DOTTED = /^\s*(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\s*$/;

/**
 * Read a dotted-quad address typed by the player.
 *
 * @param text what was typed
 * @returns the address as a number, or null when it is not a valid IPv4 address
 */
export function parseAddress(text: string): number | null {
  // The shape.
  const m = DOTTED.exec(text);
  // Not four dotted numbers.
  if (!m) return null;
  // The octets.
  const o = m.slice(1, 5).map(Number);
  // Each must fit in a byte.
  if (o.some((x) => x > 255)) return null;
  // Combined, high octet first (multiplication keeps it unsigned).
  return ((o[0] * 256 + o[1]) * 256 + o[2]) * 256 + o[3];
}

/**
 * Read a dotted subnet mask: a valid address whose one bits are contiguous from the top.
 *
 * @param text what was typed
 * @returns the mask as a number, or null when it is not a valid contiguous mask
 */
export function parseMask(text: string): number | null {
  // First, a valid dotted quad.
  const n = parseAddress(text);
  // Not even an address.
  if (n === null) return null;
  // The host part: the inverted mask.
  const inv = ~n >>> 0;
  // A contiguous mask inverts to 2^k - 1, so adding one gives a power of two (no common bits).
  return ((inv + 1) & inv) === 0 ? n : null;
}

/**
 * Read a host count; thousands separators (comma, dot, space, apostrophe, underscore) are ignored.
 *
 * @param text what was typed
 * @returns the count, or null when it is not a whole number up to 2^32
 */
export function parseHosts(text: string): number | null {
  // Separators out, including the narrow no-break space some keyboards insert.
  const digits = text.replace(/[\s,._'  ]/g, "");
  // Only digits, at most ten of them.
  if (!/^\d{1,10}$/.test(digits)) return null;
  // The number.
  const n = Number(digits);
  // Never more than the whole IPv4 space.
  return n <= SPACE ? n : null;
}

// ---- The puzzle generator ----------------------------------------------------

/**
 * The difficulty tier of a UTC day: Monday 1 to Sunday 7.
 *
 * @param dayKey the date as YYYY-MM-DD
 * @returns the tier
 */
export function tierForDay(dayKey: string): number {
  // 1970-01-01 was a Thursday, so (epoch day + 4) mod 7 is 0 on Sundays.
  const dow = (epochDay(dayKey) + 4) % 7;
  // Sunday is the hardest, the seventh tier; Monday to Saturday are 1 to 6.
  return dow === 0 ? 7 : dow;
}

/**
 * The prefix lengths each tier draws from (repeats weight a length).
 * Tier 1 stays on octet boundaries and next to them; tier 7 sits mid-octet, with /31 and /32 now and then.
 */
const TIER_PREFIXES: Record<number, readonly number[]> = {
  1: [24, 24, 24, 16, 16, 8, 25, 23],
  2: [24, 25, 25, 26, 23, 16, 22],
  3: [26, 27, 22, 23, 20, 25],
  4: [27, 28, 21, 20, 19, 26, 18],
  5: [28, 29, 19, 18, 21, 13, 12, 30],
  6: [29, 30, 11, 14, 17, 21, 19, 31],
  7: [9, 10, 11, 13, 14, 15, 17, 18, 19, 21, 22, 29, 30, 31, 32],
};

/** An address family the puzzle can be drawn from: blocks, the shortest prefix that stays inside them, a weight. */
interface Family {
  /** Short name, for the self-test's tally. */
  name: string;
  /** The blocks: network address and prefix length. */
  blocks: readonly { base: number; len: number }[];
  /** How often it is chosen, relative to the others. */
  weight: number;
}

/** RFC 1918 private space: 10/8, 172.16/12, 192.168/16. */
const PRIVATE: Family = {
  name: "rfc1918",
  blocks: [
    { base: 10 * 16777216, len: 8 },
    { base: 172 * 16777216 + 16 * 65536, len: 12 },
    { base: 192 * 16777216 + 168 * 65536, len: 16 },
  ],
  weight: 5,
};

/** RFC 5737 documentation space: 192.0.2/24, 198.51.100/24, 203.0.113/24. */
const DOCS: Family = {
  name: "rfc5737",
  blocks: [
    { base: 192 * 16777216 + 0 * 65536 + 2 * 256, len: 24 },
    { base: 198 * 16777216 + 51 * 65536 + 100 * 256, len: 24 },
    { base: 203 * 16777216 + 0 * 65536 + 113 * 256, len: 24 },
  ],
  weight: 2,
};

/**
 * First octets of ordinary unicast space: 1 to 223, leaving out 0/8 ("this network"), 10/8 (private), 100/8
 * (which holds 100.64/10, shared address space), 127/8 (loopback), 169/8 (which holds 169.254/16, link local),
 * 172/8, 192/8, 198/8 and 203/8 (which hold private, documentation, benchmarking and relay blocks); 224 and up
 * (multicast and the old class E) are never reached.
 */
const ORDINARY_FIRST_OCTETS: readonly number[] = Array.from({ length: 223 }, (_, i) => i + 1).filter(
  // Everything but the octets named above.
  (o) => ![10, 100, 127, 169, 172, 192, 198, 203].includes(o),
);

/** Ordinary unicast space: any of the first octets above, as /8 blocks. */
const ORDINARY: Family = {
  name: "unicast",
  blocks: ORDINARY_FIRST_OCTETS.map((o) => ({ base: o * 16777216, len: 8 })),
  weight: 3,
};

/** Every family. */
const FAMILIES: readonly Family[] = [PRIVATE, DOCS, ORDINARY];

/** How many draws a generator tries before it settles for the known-good puzzle. */
const MAX_ATTEMPTS = 8;

/** The known-good puzzle a generator falls back to (never reached in practice; the self-test counts it). */
export const FALLBACK: Puzzle = { address: 172 * 16777216 + 18 * 65536 + 77 * 256 + 143, prefix: 21, tier: 4 };

/** A generated puzzle and whether the generator had to fall back. */
export interface Generated {
  /** The puzzle. */
  puzzle: Puzzle;
  /** True when every attempt was rejected and FALLBACK was used. */
  fallback: boolean;
  /** The family the address came from. */
  family: string;
}

/**
 * Draw a puzzle of a tier from a generator.
 *
 * @param rng the generator (the day's, or a practice round's)
 * @param tier 1 to 7
 * @returns the puzzle, with the fallback flag and the family
 */
export function generate(rng: Rng, tier: number): Generated {
  // The tier's lengths (an out-of-range tier is treated as the middle one).
  const lengths = TIER_PREFIXES[tier] ?? TIER_PREFIXES[4];
  // Bounded attempts.
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // The prefix length.
    const prefix = rng.pick(lengths);
    // The families with a block at least as wide as the puzzle's block, so the whole block stays inside the family.
    const eligible = FAMILIES.filter((f) => f.blocks.some((b) => b.len <= prefix));
    // Their total weight.
    const total = eligible.reduce((s, f) => s + f.weight, 0);
    // A weighted draw among them.
    let roll = rng.next() * total;
    // The chosen family: walk the weights until the roll is used up.
    let family = eligible[eligible.length - 1];
    // Each eligible family in turn.
    for (const f of eligible) {
      // Inside this family's share.
      if (roll < f.weight) {
        // Chosen.
        family = f;
        // Stop walking.
        break;
      }
      // Past it.
      roll -= f.weight;
    }
    // The family's blocks that can hold the puzzle's block.
    const blocks = family.blocks.filter((b) => b.len <= prefix);
    // One of them.
    const block = rng.pick(blocks);
    // An address anywhere in it.
    const address = block.base + rng.int(Math.pow(2, 32 - block.len));
    // The puzzle.
    const puzzle: Puzzle = { address, prefix, tier };
    // For /31 and /32 every address is a fine puzzle.
    if (prefix >= 31) return { puzzle, fallback: false, family: family.name };
    // Otherwise the address should be a host, not the network or broadcast address itself (that gives two answers away).
    const facts = solve(puzzle);
    // A host address: accepted.
    if (address !== facts.network && address !== facts.broadcast) return { puzzle, fallback: false, family: family.name };
  }
  // Every attempt landed on a block edge: the known-good puzzle, at the requested tier.
  return { puzzle: { ...FALLBACK, tier }, fallback: true, family: "fallback" };
}

/**
 * The daily puzzle of a UTC day.
 *
 * @param dayKey the date as YYYY-MM-DD
 * @returns the day's puzzle
 */
export function dailyPuzzle(dayKey: string): Puzzle {
  // The day's generator and the day's tier.
  return generate(dailyRng(GAME_ID, dayKey), tierForDay(dayKey)).puzzle;
}

/**
 * A practice puzzle.
 *
 * @param seed an unsigned 32-bit seed chosen by the page
 * @param tier 1 to 7
 * @returns the puzzle
 */
export function practicePuzzle(seed: number, tier: number): Puzzle {
  // A generator for the seed.
  return generate(makeRng(seed), tier).puzzle;
}

// ---- The teaching line -------------------------------------------------------

/** The "why" of a puzzle: the octet where the prefix boundary falls, in binary. */
export interface Why {
  /** Which octet, 1 to 4. */
  octet: number;
  /** Its value in the address. */
  value: number;
  /** The same in eight binary digits. */
  binary: string;
  /** How many of its bits are network bits, 0 to 8. */
  bits: number;
  /** Its value in the network address. */
  netValue: number;
  /** The block size in that octet: 2^(8 - bits). */
  block: number;
}

/**
 * The interesting octet of a puzzle.
 *
 * @param p the puzzle
 * @returns the octet, its binary, its network bits and the block size there
 */
export function why(p: Puzzle): Why {
  // The octet holding the boundary (for a /24 the boundary is at the start of octet 4; /32 ends inside octet 4).
  const idx = Math.min(3, Math.floor(p.prefix / 8));
  // Network bits inside that octet.
  const bits = p.prefix - 8 * idx;
  // The octet's value in the address.
  const value = (p.address >>> (24 - 8 * idx)) & 255;
  // The octet's mask: its top `bits` bits.
  const octetMask = bits === 0 ? 0 : (0xff << (8 - bits)) & 0xff;
  // The result.
  return {
    octet: idx + 1,
    value,
    binary: value.toString(2).padStart(8, "0"),
    bits,
    netValue: value & octetMask,
    block: Math.pow(2, 8 - bits),
  };
}

// ---- The self-test -----------------------------------------------------------

/**
 * Compare a puzzle's own answers with the site's CIDR engine and check the puzzle is well formed.
 *
 * @param p the puzzle
 * @param where a label for any failure
 * @param failures where failures go
 */
function checkPuzzle(p: Puzzle, where: string, failures: string[]): void {
  // The block must be a legal length.
  if (!Number.isInteger(p.prefix) || p.prefix < 8 || p.prefix > 32) failures.push(`${where}: prefix /${p.prefix} out of range`);
  // The address must be ordinary unicast: first octet 1 to 223, never 0/8 or 127/8.
  const first = p.address >>> 24;
  // Out of the playable space.
  if (first < 1 || first > 223 || first === 127) failures.push(`${where}: address ${formatAddress(p.address)} outside ordinary unicast`);
  // This engine's answers.
  const mine = solve(p);
  // The CIDR engine's answers.
  const ref = cidrAnalyze(puzzleLabel(p));
  // Each fact, compared as text or number.
  if (formatAddress(mine.network) !== ref.network) failures.push(`${where}: network ${formatAddress(mine.network)} vs ${ref.network}`);
  // The last address.
  if (formatAddress(mine.broadcast) !== ref.broadcast) failures.push(`${where}: broadcast ${formatAddress(mine.broadcast)} vs ${ref.broadcast}`);
  // The mask.
  if (formatAddress(mine.mask) !== ref.netmask) failures.push(`${where}: mask ${formatAddress(mine.mask)} vs ${ref.netmask}`);
  // The usable hosts.
  if (mine.hosts !== ref.usableHosts) failures.push(`${where}: hosts ${mine.hosts} vs ${ref.usableHosts}`);
  // The correct answers, typed back in, must parse to themselves and grade all-correct (the puzzle is solvable).
  const typed: Facts = {
    network: parseAddress(ref.network) ?? -1,
    broadcast: parseAddress(ref.broadcast) ?? -1,
    mask: parseMask(ref.netmask) ?? -1,
    hosts: parseHosts(ref.usableHosts.toLocaleString("en-US")) ?? -1,
  };
  // Typed answers must be accepted.
  if (!allOk(grade(typed, mine))) failures.push(`${where}: the correct answers, typed in, do not grade as correct`);
}

/**
 * The self-test: 400 days of daily puzzles and 2,000 practice puzzles against the CIDR engine, determinism,
 * the weekday tiers, the grading directions and the input parsers.
 *
 * @returns what was checked and what failed
 */
export function selfTest(): SelfTestReport {
  // Problems found.
  const failures: string[] = [];
  // Cases checked.
  let checked = 0;
  // Fallbacks used.
  let fallbacks = 0;
  // The next 400 days from launch.
  for (let i = 0; i < 400; i++) {
    // The day.
    const day = addDays(LAUNCH_DAY, i);
    // Generated twice, independently.
    const a = generate(dailyRng(GAME_ID, day), tierForDay(day));
    // The second time.
    const b = generate(dailyRng(GAME_ID, day), tierForDay(day));
    // Identical both times.
    if (a.puzzle.address !== b.puzzle.address || a.puzzle.prefix !== b.puzzle.prefix) failures.push(`${day}: not deterministic`);
    // Fallbacks counted.
    if (a.fallback) fallbacks++;
    // The prefix must come from the day's tier.
    if (!TIER_PREFIXES[tierForDay(day)].includes(a.puzzle.prefix) && !a.fallback) failures.push(`${day}: /${a.puzzle.prefix} not in tier ${tierForDay(day)}`);
    // Checked against the CIDR engine.
    checkPuzzle(a.puzzle, day, failures);
    // One more.
    checked++;
  }
  // 2,000 practice puzzles from a fixed run of seeds, every tier.
  const seeds = makeRng(0x5eed1e55);
  // Each one.
  for (let i = 0; i < 2000; i++) {
    // A seed and a tier.
    const seed = seeds.int(4294967296);
    // Tiers in rotation.
    const tier = (i % 7) + 1;
    // The puzzle.
    const g = generate(makeRng(seed), tier);
    // Fallbacks counted.
    if (g.fallback) fallbacks++;
    // Checked.
    checkPuzzle(g.puzzle, `practice ${i} (seed ${seed}, tier ${tier})`, failures);
    // One more.
    checked++;
  }
  // The weekday tiers: 2026-11-02 was a Monday, 2026-11-08 a Sunday.
  if (tierForDay("2026-11-02") !== 1 || tierForDay("2026-11-04") !== 3 || tierForDay("2026-11-08") !== 7) failures.push("weekday tiers are off");
  // The grading directions: a lower guess points up, a higher one down.
  const g = grade({ network: 1, broadcast: 9, mask: 5, hosts: 5 }, { network: 2, broadcast: 8, mask: 5, hosts: 6 });
  // As expected.
  if (g.network !== "up" || g.broadcast !== "down" || g.mask !== "ok" || g.hosts !== "up") failures.push("grade directions are off");
  // Parsers: a non-contiguous mask is refused, separators in host counts are not.
  if (parseMask("255.0.255.0") !== null || parseMask("255.255.248.0") !== 4294965248) failures.push("parseMask is off");
  // Host counts in English and Brazilian styles.
  if (parseHosts("16,777,214") !== 16777214 || parseHosts("2.046") !== 2046 || parseHosts("12a") !== null) failures.push("parseHosts is off");
  // Addresses: out-of-range octets refused.
  if (parseAddress("10.0.0.256") !== null || parseAddress(" 10.1.2.3 ") !== 167838211) failures.push("parseAddress is off");
  // The fallback is reported as a failure only if it was ever needed, so it is seen.
  if (fallbacks > 0) failures.push(`generator fell back ${fallbacks} time(s)`);
  // The report.
  return { checked, failures };
}
