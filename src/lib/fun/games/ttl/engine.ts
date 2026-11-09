// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/fun/games/ttl/engine.ts
// ----------------------------------------------------------------------------
// TTL, the rules (PRIME 08/11/2026: the arcade's first wave, "a packet that
// grows with each hop and dies at zero time to live. Traceroute as a game").
//
// A run is twelve packets steered across a 13 x 13 network. Packet n leaves
// with a Time to Live (TTL) of n, the way traceroute raises its probes' TTL
// one at a time (traceroute(8): "We start our probes with a ttl of one and
// increase by one"). The packet moves one cell a tick in the direction it was
// last steered:
//   - a router it enters forwards it and takes one off its TTL (RFC 1812,
//     section 5.3.1: "When a router forwards a packet, it MUST reduce the TTL
//     by at least one"): one hop, ten points, and its trail grows by one;
//   - a router that takes the TTL to zero discards it ("If the TTL is reduced
//     to zero (or less), the packet MUST be discarded", same section), and
//     the run ends there: that router sends ICMP Time Exceeded, code 0;
//   - the destination host accepts it at any TTL (RFC 1122, section 3.2.1.7:
//     "A host MUST NOT discard a datagram just because it was received with
//     TTL less than 2"): delivered, 25 points, and the next packet leaves
//     from that host with a fresh TTL and no trail yet;
//   - its own trail is a routing loop, the edge of the board is no route:
//     either ends the run.
// The twelfth delivery completes the run. One router and one destination are
// on the board at a time; each new one takes the next free cell from the
// day's own sequence of cells, so the day's network is the same for everyone
// who steers the same way, and a run is a pure function of its turns.
//
// Everything here is pure: no clock, no Math.random. The page keeps the real
// time and turns keys into turns; the engine counts ticks, and its own clock
// is the sum of each tick's length (the packets speed up from 200 ms a tick
// to 112 ms), so the time that breaks ties on the board is worked out from
// the turns as well. The server replays a posted run from its turns
// (verifySaved), and the self-test plays every day with bots.
// ============================================================================

// The day arithmetic and the string hash the day's cells are drawn from.
import { LAUNCH_DAY, addDays, fnv1a } from "../../daily";
// The self-test's report shape.
import type { SelfTestReport } from "../../registry";

/** The game's stable id (storage key, folder, page slug). */
export const GAME_ID = "ttl";
/** Columns of the board. */
export const COLS = 13;
/** Rows of the board. */
export const ROWS = 13;
/** Cells of the board, numbered row by row from the top left. */
export const CELLS = COLS * ROWS;
/** Packets in a run. */
export const PACKETS = 12;
/** Points for a hop: a router that forwarded the packet. */
export const POINTS_HOP = 10;
/** Points for a packet delivered to its host. */
export const POINTS_DELIVERY = 25;
/** The fewest steps (rows plus columns) between the packet and a new destination. */
export const MIN_DEST_DISTANCE = 5;
/** The fewest steps between the packet and a new router. */
const MIN_ROUTER_DISTANCE = 3;
/** The fewest steps between the start and the first router (which also stays off the start's row and column). */
const FIRST_ROUTER_DISTANCE = 4;
/** The most ticks a run is played for: a packet steered in circles for half an hour ends the run there. */
export const MAX_TICKS = 15_000;
/** The cell the first packet starts on: the middle column, three rows from the bottom, so moving up it has ten cells
 *  (two seconds at the first packet's pace) before the edge. */
export const START_CELL = (ROWS - 3) * COLS + Math.floor(COLS / 2);
/** How far into the day's sequence a new item looks for a free cell before scanning the board in order. */
const SPAWN_TRIES = 400;
/** The longest turn list read, in characters (a run's turns, well inside the board's request limit). */
export const MAX_TURNS_CHARS = 30_000;

/** A direction: up, down, left or right. */
export type Dir = "u" | "d" | "l" | "r";
/** The four directions, in a fixed order. */
export const DIRS: readonly Dir[] = ["u", "d", "l", "r"];
/** The direction the first packet starts in. */
export const START_DIR: Dir = "u";
/** Each direction's step across the columns. */
const DX: Readonly<Record<Dir, number>> = { u: 0, d: 0, l: -1, r: 1 };
/** Each direction's step across the rows. */
const DY: Readonly<Record<Dir, number>> = { u: -1, d: 1, l: 0, r: 0 };
/** Each direction's opposite. */
const OPPOSITE: Readonly<Record<Dir, Dir>> = { u: "d", d: "u", l: "r", r: "l" };
/** Each direction a quarter turn clockwise (the self-test's tight square). */
const CLOCKWISE: Readonly<Record<Dir, Dir>> = { u: "r", r: "d", d: "l", l: "u" };

/** How a run ends: all twelve delivered, discarded at TTL zero, a loop, off the network, or the tick limit. */
export type EndKind = "complete" | "expired" | "loop" | "noroute" | "cap";
/** How one packet ended. */
export type PacketEnd = "delivered" | "expired" | "loop" | "noroute" | "cap";
/** What happened on a tick. */
export type TtlEvent = "move" | "hop" | "deliver" | EndKind;

/** One packet's outcome, for the result and the share card. */
export interface PacketLog {
  /** The TTL it left with. */
  ttl: number;
  /** The routers that forwarded it. */
  hops: number;
  /** How it ended. */
  end: PacketEnd;
  /** Its TTL when it ended (0 when a router discarded it). */
  left: number;
}

/** One hop of the packet in flight, as a trace line: the router and the TTL it left the packet with. */
export interface HopLine {
  /** The router's cell. */
  cell: number;
  /** The TTL after that router took one off (0 for the router that discarded the packet). */
  ttl: number;
}

/** Where and how a run ended. */
export interface RunEnd {
  /** How. */
  kind: EndKind;
  /** The cell it ended on: the router that discarded the packet, the cell of the loop, the last cell before the edge. */
  cell: number;
  /** The packet that was in flight. */
  packet: number;
}

/** A run, as the engine keeps it: plain data, so it can be saved, compared and replayed. */
export interface Run {
  /** The key the day's (or the practice round's) cells are drawn with. */
  seed: string;
  /** The packet and its trail, head first (cell numbers). */
  body: number[];
  /** The direction it moves in. */
  dir: Dir;
  /** The packet in flight, 1 to PACKETS. */
  packet: number;
  /** Its TTL now. */
  ttl: number;
  /** Its hops so far. */
  hops: number;
  /** Hops over the whole run. */
  totalHops: number;
  /** Packets delivered. */
  delivered: number;
  /** The router's cell, or -1 when the board has no free cell for one. */
  router: number;
  /** The destination host's cell. */
  dest: number;
  /** How far the router sequence has been read. */
  ri: number;
  /** How far the destination sequence has been read. */
  di: number;
  /** Ticks played. */
  tick: number;
  /** The run's own clock: the sum of each tick's length, in milliseconds. */
  ms: number;
  /** Points. */
  score: number;
  /** The packets finished so far, in order. */
  log: PacketLog[];
  /** The hops of the packet in flight, as trace lines. */
  trace: HopLine[];
  /** How the run ended, or null while it goes on. */
  end: RunEnd | null;
}

/** One recorded turn: the tick it was applied on (0-based) and the new direction. */
export interface Turn {
  /** The tick whose move used the new direction. */
  t: number;
  /** The direction. */
  d: Dir;
}

/** What a daily run keeps in the browser and sends to the board: the turns, the ticks played, and whether it is over. */
export interface TtlSave {
  /** The turns, encoded by encodeTurns(). */
  turns: string;
  /** Ticks played. */
  ticks: number;
  /** The run is over. */
  done: boolean;
}

/**
 * The TTL a packet leaves with: its own number, as traceroute's probes go out with TTL 1, 2, 3.
 *
 * @param packet the packet's number, 1 to PACKETS
 * @returns its starting TTL
 */
export function startTtl(packet: number): number {
  // One more for each packet.
  return packet;
}

/**
 * How long a tick lasts while a packet is in flight: 200 ms for the first, 8 ms less for each one after.
 *
 * @param packet the packet's number
 * @returns the tick's length in milliseconds (never under 100)
 */
export function tickMs(packet: number): number {
  // Faster with each packet, down to a floor.
  return Math.max(100, 200 - 8 * (packet - 1));
}

/** The most hops a run can make: each packet one fewer than the TTL it leaves with (the next router would discard it). */
export const MAX_HOPS = Array.from({ length: PACKETS }, (_, i) => startTtl(i + 1) - 1).reduce((a, b) => a + b, 0);

/** The most points a run can score: every hop the TTLs allow, and every delivery. */
export const MAX_SCORE = MAX_HOPS * POINTS_HOP + PACKETS * POINTS_DELIVERY;

/**
 * A cell's column.
 *
 * @param cell the cell number
 * @returns 0 to COLS - 1
 */
export function cellX(cell: number): number {
  // The remainder of a row.
  return cell % COLS;
}

/**
 * A cell's row.
 *
 * @param cell the cell number
 * @returns 0 to ROWS - 1
 */
export function cellY(cell: number): number {
  // Whole rows before it.
  return Math.floor(cell / COLS);
}

/**
 * Steps between two cells, along rows and columns.
 *
 * @param a one cell
 * @param b the other
 * @returns the number of moves between them on an empty board
 */
export function distance(a: number, b: number): number {
  // Columns apart plus rows apart.
  return Math.abs(cellX(a) - cellX(b)) + Math.abs(cellY(a) - cellY(b));
}

/**
 * The cell one move away, or -1 off the board.
 *
 * @param cell where the packet is
 * @param dir where it goes
 * @returns the next cell, or -1 past an edge
 */
export function neighbour(cell: number, dir: Dir): number {
  // The new column and row.
  const x = cellX(cell) + DX[dir];
  const y = cellY(cell) + DY[dir];
  // Off the board.
  if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return -1;
  // On it.
  return y * COLS + x;
}

/**
 * The i-th cell of one of a run's sequences: a hash of the run's key, the sequence's name and the place in it.
 * Stateless, so a run only keeps how far it has read each sequence.
 *
 * @param seed the run's key
 * @param stream "r" for the routers, "d" for the destinations
 * @param i the place in the sequence
 * @returns a cell number
 */
function sequenceCell(seed: string, stream: string, i: number): number {
  // FNV-1a over the three parts, folded onto the board.
  return fnv1a(`ttl|${seed}|${stream}|${i}`) % CELLS;
}

/**
 * The next free cell of a sequence that a test accepts, and the place after it; after SPAWN_TRIES draws without one,
 * the board is scanned in order from the last draw (with the test, then without its distance part), so a cell is
 * always found while one is free.
 *
 * @param seed the run's key
 * @param stream the sequence's name
 * @param from where reading starts
 * @param ok the full test (free and far enough)
 * @param free the test without the distance part
 * @returns the cell (or -1 when no cell is free) and the next place to read from
 */
function nextCell(seed: string, stream: string, from: number, ok: (c: number) => boolean, free: (c: number) => boolean): [number, number] {
  // The draws.
  for (let k = 0; k < SPAWN_TRIES; k++) {
    // The cell at this place.
    const c = sequenceCell(seed, stream, from + k);
    // Taken when it passes.
    if (ok(c)) return [c, from + k + 1];
  }
  // The last draw, as the starting point of the scan.
  const start = sequenceCell(seed, stream, from + SPAWN_TRIES - 1);
  // The scan with the full test, then with the free test only.
  for (const test of [ok, free]) {
    // Every cell once, in order from the start.
    for (let k = 0; k < CELLS; k++) {
      // The cell.
      const c = (start + k) % CELLS;
      // Taken.
      if (test(c)) return [c, from + SPAWN_TRIES];
    }
  }
  // No free cell at all.
  return [-1, from + SPAWN_TRIES];
}

/**
 * A new run: the first packet near the bottom of the middle column, moving up, with TTL 1; its destination at least
 * MIN_DEST_DISTANCE away; the first router at least four steps away and off the start's row and column, so the first
 * packet, which no router can forward, is never steered into one by standing still.
 *
 * @param seed the run's key (dailySeedKey or practiceSeedKey)
 * @returns the run before its first tick
 */
export function newRun(seed: string): Run {
  // The packet, alone.
  const body = [START_CELL];
  // The destination.
  const [dest, di] = nextCell(seed, "d", 0, (c) => c !== START_CELL && distance(c, START_CELL) >= MIN_DEST_DISTANCE, (c) => c !== START_CELL);
  // The first router.
  const [router, ri] = nextCell(
    seed,
    "r",
    0,
    (c) => c !== START_CELL && c !== dest && distance(c, START_CELL) >= FIRST_ROUTER_DISTANCE && cellX(c) !== cellX(START_CELL) && cellY(c) !== cellY(START_CELL),
    (c) => c !== START_CELL && c !== dest,
  );
  // The run.
  return { seed, body, dir: START_DIR, packet: 1, ttl: startTtl(1), hops: 0, totalHops: 0, delivered: 0, router, dest, ri, di, tick: 0, ms: 0, score: 0, log: [], trace: [], end: null };
}

/**
 * The key of a day's run.
 *
 * @param day the date as YYYY-MM-DD
 * @returns the key its cells are drawn with
 */
export function dailySeedKey(day: string): string {
  // The day, marked as a day.
  return `day|${day}`;
}

/**
 * The key of a practice run.
 *
 * @param seed any number the page picks
 * @returns the key its cells are drawn with
 */
export function practiceSeedKey(seed: number): string {
  // The seed as an unsigned 32-bit number, marked as practice.
  return `seed|${seed >>> 0}`;
}

/**
 * The day's run, before its first tick: the same for everyone on a UTC day.
 *
 * @param day the date as YYYY-MM-DD
 * @returns the run
 */
export function dailyRun(day: string): Run {
  // The day's key.
  return newRun(dailySeedKey(day));
}

/**
 * A practice run, before its first tick.
 *
 * @param seed any number the page picks
 * @returns the run
 */
export function practiceRun(seed: number): Run {
  // The seed's key.
  return newRun(practiceSeedKey(seed));
}

/**
 * Whether steering a run in a direction changes anything: a new direction, and not straight back along the trail
 * (a packet with no trail yet may turn round).
 *
 * @param run the run
 * @param dir the direction asked for
 * @returns true when the turn would be taken
 */
export function canTurn(run: Run, dir: Dir): boolean {
  // The same direction is no turn; the opposite one is refused once there is a trail behind the packet.
  return dir !== run.dir && (run.body.length === 1 || dir !== OPPOSITE[run.dir]);
}

/**
 * Whether a direction, steered after another, would be a turn: the queue of keys the page keeps checks each key
 * against the one before it, so two quick keys between ticks make two turns.
 *
 * @param after the direction the packet will have
 * @param dir the direction asked for
 * @param trail whether the packet has a trail behind it
 * @returns true when the key would turn the packet
 */
export function turnsFrom(after: Dir, dir: Dir, trail: boolean): boolean {
  // The same rule as canTurn.
  return dir !== after && (!trail || dir !== OPPOSITE[after]);
}

/**
 * End a run: the packet in flight is logged with how it ended.
 *
 * @param run the run after the tick's move
 * @param kind how it ended
 * @param cell where
 * @returns the ended run
 */
function finish(run: Run, kind: Exclude<EndKind, "complete">, cell: number): Run {
  // The packet's line in the log.
  const line: PacketLog = { ttl: startTtl(run.packet), hops: run.hops, end: kind, left: run.ttl };
  // The run, over.
  return { ...run, log: [...run.log, line], end: { kind, cell, packet: run.packet } };
}

/**
 * One tick: the turn (if any) is taken, the packet moves one cell, and whatever is there acts on it.
 *
 * @param run the run before the tick
 * @param turn the direction steered for this tick, or null to keep going
 * @returns the run after it, what happened, and whether the turn was taken (only taken turns are recorded)
 */
export function step(run: Run, turn: Dir | null): { run: Run; event: TtlEvent; turned: boolean } {
  // An ended run does not move.
  if (run.end) return { run, event: run.end.kind, turned: false };
  // The turn, when it changes the direction.
  const turned = turn !== null && canTurn(run, turn);
  // The direction of this tick's move.
  const dir: Dir = turned ? (turn as Dir) : run.dir;
  // The packet's cell.
  const head = run.body[0];
  // The cell it moves to.
  const next = neighbour(head, dir);
  // The tick counts, and its length is added to the run's clock.
  const base: Run = { ...run, dir, tick: run.tick + 1, ms: run.ms + tickMs(run.packet) };
  // The outcome of the move, before the tick limit is checked.
  let out: { run: Run; event: TtlEvent };
  // Off the board: no route.
  if (next < 0) {
    // Ended where it was.
    out = { run: finish(base, "noroute", head), event: "noroute" };
  } else if (next === run.router) {
    // A router: it takes one off the TTL.
    const ttl = run.ttl - 1;
    // Taken to zero: the router discards the packet (the packet is drawn on the router that did it).
    if (ttl <= 0) {
      // The packet on the router, its trail behind it.
      const body = [next, ...run.body.slice(0, -1)];
      // The discarding router as the last trace line.
      const trace = [...run.trace, { cell: next, ttl: 0 }];
      // Ended, with TTL 0.
      out = { run: finish({ ...base, body, ttl: 0, trace }, "expired", next), event: "expired" };
    } else {
      // Forwarded: the packet moves on to the router's cell and its trail grows by one (the tail stays).
      const body = [next, ...run.body];
      // A new router, away from the packet, off the trail and off the destination.
      const [router, ri] = nextCell(run.seed, "r", run.ri, (c) => !body.includes(c) && c !== run.dest && distance(c, next) >= MIN_ROUTER_DISTANCE, (c) => !body.includes(c) && c !== run.dest);
      // The hop counted.
      out = {
        run: { ...base, body, ttl, hops: run.hops + 1, totalHops: run.totalHops + 1, score: run.score + POINTS_HOP, trace: [...run.trace, { cell: next, ttl }], router, ri },
        event: "hop",
      };
    }
  } else if (next === run.dest) {
    // The destination host: delivered, at whatever TTL is left.
    const line: PacketLog = { ttl: startTtl(run.packet), hops: run.hops, end: "delivered", left: run.ttl };
    // Counted.
    const delivered = run.delivered + 1;
    // The points.
    const score = run.score + POINTS_DELIVERY;
    // The last packet: the run is complete, the packet drawn on its host.
    if (delivered === PACKETS) {
      // The packet on the host.
      const body = [next, ...run.body.slice(0, -1)];
      // Complete.
      out = { run: { ...base, body, delivered, score, log: [...run.log, line], end: { kind: "complete", cell: next, packet: run.packet } }, event: "complete" };
    } else {
      // The next packet leaves from this host, with a fresh TTL and no trail.
      const packet = run.packet + 1;
      // Alone on the host.
      const body = [next];
      // Its destination, far enough away and off the router.
      const [dest, di] = nextCell(run.seed, "d", run.di, (c) => c !== next && c !== run.router && distance(c, next) >= MIN_DEST_DISTANCE, (c) => c !== next && c !== run.router);
      // The new packet in flight.
      out = { run: { ...base, body, packet, ttl: startTtl(packet), hops: 0, delivered, score, log: [...run.log, line], trace: [], dest, di }, event: "deliver" };
    }
  } else {
    // An ordinary move: the head goes on and the tail leaves its cell in the same tick.
    const body = [next, ...run.body.slice(0, -1)];
    // Onto its own trail (the cell the tail just left does not count): a routing loop.
    if (body.indexOf(next, 1) !== -1) out = { run: finish({ ...base, body }, "loop", next), event: "loop" };
    // Onwards.
    else out = { run: { ...base, body }, event: "move" };
  }
  // The tick limit ends a run still going.
  if (!out.run.end && out.run.tick >= MAX_TICKS) out = { run: finish(out.run, "cap", out.run.body[0]), event: "cap" };
  // The tick.
  return { ...out, turned };
}

/**
 * Turns as a compact string: each turn's tick, then its direction ("4r9u15l").
 *
 * @param turns the turns, in order
 * @returns the encoded string
 */
export function encodeTurns(turns: readonly Turn[]): string {
  // Tick and letter, run together.
  return turns.map((x) => `${x.t}${x.d}`).join("");
}

/**
 * Read an encoded turn list: digits then one of u d l r, ticks strictly rising and under MAX_TICKS. A plain loop over
 * the characters (no regular expression), bounded by MAX_TURNS_CHARS.
 *
 * @param s the encoded string
 * @returns the turns, or null when the string is malformed
 */
export function decodeTurns(s: unknown): Turn[] | null {
  // Only a string of bounded length.
  if (typeof s !== "string" || s.length > MAX_TURNS_CHARS) return null;
  // The turns read so far.
  const out: Turn[] = [];
  // The digits of the tick being read.
  let digits = "";
  // Each character.
  for (const ch of s) {
    // A digit: part of the tick (at most five).
    if (ch >= "0" && ch <= "9") {
      // Kept.
      digits += ch;
      // Too long for a tick.
      if (digits.length > 5) return null;
      // Next character.
      continue;
    }
    // A direction must follow a tick.
    if (digits === "" || !(DIRS as readonly string[]).includes(ch)) return null;
    // The tick.
    const t = Number(digits);
    // Rising, and inside the limit.
    if (t >= MAX_TICKS || (out.length > 0 && t <= out[out.length - 1].t)) return null;
    // The turn.
    out.push({ t, d: ch as Dir });
    // Ready for the next tick.
    digits = "";
  }
  // A tick with no direction after it.
  if (digits !== "") return null;
  // The list.
  return out;
}

/**
 * Replay a run from its turns for a number of ticks, strictly: every recorded turn must fall on a tick the run
 * reaches and must be a turn the engine takes, as an honest page records them.
 *
 * @param seed the run's key
 * @param turns the turns, in order
 * @param ticks how many ticks to play at most
 * @returns the run as it stands after them, and whether every turn was a genuine one
 */
export function replayTurns(seed: string, turns: readonly Turn[], ticks: number): { run: Run; ok: boolean } {
  // From the start.
  let run = newRun(seed);
  // The next turn to apply.
  let k = 0;
  // Every turn genuine so far.
  let ok = true;
  // Tick by tick, until the run ends or the ticks are played.
  while (!run.end && run.tick < ticks) {
    // The turn recorded for this tick, if any.
    const turn = k < turns.length && turns[k].t === run.tick ? turns[k].d : null;
    // The tick.
    const r = step(run, turn);
    // A recorded turn the engine did not take was never recorded by the page.
    if (turn !== null) {
      // Used.
      k++;
      // Not taken.
      if (!r.turned) ok = false;
    }
    // Onwards.
    run = r.run;
  }
  // Turns left over fall on ticks the run never reached.
  if (k < turns.length) ok = false;
  // The run and the verdict.
  return { run, ok };
}

/** A run re-checked from its saved state: what the board stores. */
export interface VerifiedRun {
  /** All twelve packets delivered. */
  won: boolean;
  /** Points, as the replay counts them. */
  score: number;
  /** The run's own clock, in milliseconds. */
  ms: number;
  /** The parts the result shows. */
  parts: { delivered: number; hops: number; ticks: number };
}

/**
 * Re-check a saved run of a day: the turns are replayed over the day's network and must end the run exactly on the
 * tick the save claims; every number comes from the replay, none from the save.
 *
 * @param day the puzzle's day, YYYY-MM-DD
 * @param state the saved run ({ turns, ticks, done })
 * @returns the run as it really went, or null when it is not a finished run of that day
 */
export function verifySaved(day: string, state: unknown): VerifiedRun | null {
  // Only a plain object.
  if (state === null || typeof state !== "object" || Array.isArray(state)) return null;
  // Its fields.
  const s = state as Record<string, unknown>;
  // Only a finished run, with a whole number of ticks inside the limit.
  if (s.done !== true || typeof s.ticks !== "number" || !Number.isInteger(s.ticks) || s.ticks < 1 || s.ticks > MAX_TICKS) return null;
  // The turns.
  const turns = decodeTurns(s.turns);
  // Malformed.
  if (!turns) return null;
  // Replayed over the day's network.
  const { run, ok } = replayTurns(dailySeedKey(day), turns, s.ticks);
  // Only genuine turns, a run that ended, and on the claimed tick.
  if (!ok || !run.end || run.tick !== s.ticks) return null;
  // The run as it went.
  return { won: run.end.kind === "complete", score: run.score, ms: run.ms, parts: { delivered: run.delivered, hops: run.totalHops, ticks: run.tick } };
}

/**
 * The grade of a saved daily run (for the earlier-puzzle marks): 1 when it was completed, 0 when it ended otherwise,
 * null while it is still open or not understood.
 *
 * @param day the run's day
 * @param state the saved run
 * @returns 1, 0 or null
 */
export function gradeSave(day: string, state: unknown): 0 | 1 | null {
  // Re-checked the same way as on the board.
  const v = verifySaved(day, state);
  // Not a finished run.
  if (!v) return null;
  // Completed or not.
  return v.won ? 1 : 0;
}

/**
 * The address shown for a cell: a router in 198.51.100.0/24, a host in 203.0.113.0/24 (the documentation blocks of
 * RFC 5737), or, in the IPv6 view, the same numbers under 2001:db8::/32 (RFC 3849). Never a real network.
 *
 * @param cell the cell
 * @param kind a router or a host
 * @param v6 the IPv6 view
 * @returns the address
 */
export function addressOf(cell: number, kind: "router" | "host", v6: boolean): string {
  // One to 169: a host number inside a /24.
  const n = cell + 1;
  // IPv6: the same number, in hexadecimal, under a documentation prefix of its own per kind.
  if (v6) return `2001:db8:${kind === "router" ? "100" : "113"}::${n.toString(16)}`;
  // IPv4: a router's block or a host's.
  return `${kind === "router" ? "198.51.100" : "203.0.113"}.${n}`;
}

/** The source the packets are sent from, as the trace names it: TEST-NET-1 (RFC 5737), or 2001:db8::1. */
export function sourceAddress(v6: boolean): string {
  // One fixed address per view.
  return v6 ? "2001:db8::1" : "192.0.2.1";
}

// ---- Bots, for the self-test and the board's golden cases ------------------------------------------------------

/**
 * The first move of a shortest path from the packet to a target, or null when there is none. The trail counts as it
 * will be: the segment n places from the tail has left its cell after n + 1 moves, so a path may run where the tail
 * is now. Cells in `avoid` are never entered (except the target).
 *
 * @param run the run
 * @param target the cell to reach
 * @param avoid cells to keep out of
 * @returns the first direction, or null
 */
function pathTo(run: Run, target: number, avoid: readonly number[]): Dir | null {
  // The packet's length, head included.
  const len = run.body.length;
  // When each cell is free: the move count after which its segment has gone (0 for a cell that is free now).
  const freeAt = new Int16Array(CELLS);
  // Every segment behind the head.
  for (let i = 1; i < len; i++) freeAt[run.body[i]] = len - i;
  // The first move of the path that reached each cell, or -1 before it is reached.
  const first = new Int8Array(CELLS).fill(-1);
  // The breadth-first queue: cells with the moves taken to reach them.
  const queue: [number, number][] = [[run.body[0], 0]];
  // The head is where the search starts.
  first[run.body[0]] = 4;
  // Each cell in turn.
  for (let q = 0; q < queue.length; q++) {
    // The cell and the moves taken.
    const [c, steps] = queue[q];
    // Each direction from it.
    for (let k = 0; k < DIRS.length; k++) {
      // The direction.
      const d = DIRS[k];
      // The packet's very first move cannot go straight back along its trail.
      if (steps === 0 && len > 1 && d === OPPOSITE[run.dir]) continue;
      // The cell it leads to.
      const n = neighbour(c, d);
      // Off the board, reached before, kept out of, or still under the trail at that moment.
      if (n < 0 || first[n] !== -1 || (n !== target && avoid.includes(n)) || freeAt[n] > steps + 1) continue;
      // Reached, with the first move of its path.
      first[n] = steps === 0 ? k : first[c];
      // The target: that first move.
      if (n === target) return DIRS[first[n]];
      // Searched on from there.
      queue.push([n, steps + 1]);
    }
  }
  // No path.
  return null;
}

/**
 * A move that does not end the run on the next tick, for a bot with no path: any direction that stays on the board,
 * off the trail and, at TTL 1, off the router.
 *
 * @param run the run
 * @returns a direction, or the current one when every move ends the run
 */
function safeMove(run: Run): Dir {
  // The directions, the current one first.
  const order = [run.dir, ...DIRS.filter((d) => d !== run.dir)];
  // The first that survives.
  for (const d of order) {
    // A reversal is not a move the engine takes.
    if (d !== run.dir && !canTurn(run, d)) continue;
    // Where it leads.
    const n = neighbour(run.body[0], d);
    // Off the board.
    if (n < 0) continue;
    // Onto the trail (the tail's cell is free by then).
    if (run.body.indexOf(n) !== -1 && n !== run.body[run.body.length - 1]) continue;
    // A router that would discard the packet.
    if (n === run.router && run.ttl <= 1) continue;
    // Safe.
    return d;
  }
  // Nothing is safe.
  return run.dir;
}

/** A bot: the direction it wants for the next tick. */
type Policy = (run: Run) => Dir;

/**
 * The safe bot: every packet straight to its host, never through a router (it proves every day can be completed).
 *
 * @param run the run
 * @returns its direction
 */
const safePolicy: Policy = (run) => pathTo(run, run.dest, [run.router]) ?? safeMove(run);

/**
 * The greedy bot: every hop a packet's TTL allows (routers while the TTL is above 1), then its host.
 *
 * @param run the run
 * @returns its direction
 */
const greedyPolicy: Policy = (run) => (run.ttl > 1 && run.router >= 0 ? pathTo(run, run.router, [run.dest]) : pathTo(run, run.dest, [run.router])) ?? safeMove(run);

/**
 * Play a run with a bot to its end, recording the turns the engine takes.
 *
 * @param seed the run's key
 * @param policy the bot
 * @param check called after every tick, for the self-test's invariants
 * @returns the turns and the ended run
 */
function playBot(seed: string, policy: Policy, check?: (run: Run) => void): { turns: Turn[]; run: Run } {
  // From the start.
  let run = newRun(seed);
  // The turns taken.
  const turns: Turn[] = [];
  // To the end (the tick limit stops a bot that circles).
  while (!run.end) {
    // The bot's direction.
    const want = policy(run);
    // The tick.
    const r = step(run, want);
    // A taken turn is recorded with the tick it was taken on.
    if (r.turned) turns.push({ t: run.tick, d: want });
    // Onwards.
    run = r.run;
    // The invariants.
    if (check) check(run);
  }
  // The run.
  return { turns, run };
}

/**
 * The safe bot's saved run of a day, completed: the board's golden case (src/lib/fun/verify.ts).
 *
 * @param day the date as YYYY-MM-DD
 * @returns the save
 */
export function goldenSave(day: string): TtlSave {
  // Played to the end.
  const { turns, run } = playBot(dailySeedKey(day), safePolicy);
  // As the page saves it.
  return { turns: encodeTurns(turns), ticks: run.tick, done: true };
}

// ---- The self-test --------------------------------------------------------------------------------------------

/**
 * The run's invariants after a tick: the trail is on the board with no cell twice (until a loop ends it), the TTL and
 * the hops agree with the packet's number, the score and the clock agree with their parts, and the router and the
 * destination are off the trail and apart.
 *
 * @param run the run
 * @returns the problems, empty when all is well
 */
function invariants(run: Run): string[] {
  // Problems.
  const bad: string[] = [];
  // Every cell on the board.
  if (!run.body.every((c) => Number.isInteger(c) && c >= 0 && c < CELLS)) bad.push("a trail cell off the board");
  // No cell twice, except in the tick a loop ended the run.
  if (new Set(run.body).size !== run.body.length && run.end?.kind !== "loop") bad.push("the trail crosses itself");
  // The length is the hops plus the packet itself (a discarded packet keeps its length).
  if (run.body.length !== run.hops + 1) bad.push(`length ${run.body.length} with ${run.hops} hops`);
  // The TTL is what is left after the hops (zero only when a router discarded the packet).
  if (run.ttl !== startTtl(run.packet) - run.hops && !(run.end?.kind === "expired" && run.ttl === 0)) bad.push(`TTL ${run.ttl} after ${run.hops} hops of packet ${run.packet}`);
  // The score is the hops and the deliveries.
  if (run.score !== run.totalHops * POINTS_HOP + run.delivered * POINTS_DELIVERY) bad.push(`score ${run.score}`);
  // Never above the most a run can score.
  if (run.score > MAX_SCORE) bad.push(`score ${run.score} above ${MAX_SCORE}`);
  // While the run goes on, the router and the destination are off the trail and apart.
  if (!run.end && (run.body.includes(run.dest) || (run.router >= 0 && run.body.includes(run.router)) || run.router === run.dest)) bad.push("an item on the trail");
  // The log holds one line per finished packet.
  if (run.log.length !== run.delivered + (run.end && run.end.kind !== "complete" ? 1 : 0)) bad.push(`log of ${run.log.length} for ${run.delivered} delivered`);
  // The problems.
  return bad;
}

/**
 * The self-test: 400 daily runs from launch and 100 practice seeds.
 *
 * For each: the start is built twice and is the same; it is well formed (the destination far enough away, the first
 * router off the start's row and column); a packet left alone ends the run; the safe bot completes all twelve
 * packets (every day can be won) and its run replays, from its encoded turns, to the same run, verifies as won on a
 * day, and is refused with a tick cut off or a turn added; the greedy bot's invariants hold on every tick, and when
 * it completes, it scores the most a run can; the first packet steered into a router is discarded with TTL 0; and a
 * packet with four hops behind it that turns in a tight square runs into its own trail.
 *
 * @returns the report
 */
export function selfTest(): SelfTestReport {
  // Problems found.
  const failures: string[] = [];
  // Runs checked.
  let checked = 0;
  // Greedy runs completed, those with the most points, and tight squares tried.
  let greedyDone = 0;
  let greedyMax = 0;
  let squares = 0;
  // The cases: 400 days from launch, then 100 practice seeds.
  const cases: { label: string; seed: string; day: string | null }[] = [];
  // The daily runs.
  for (let d = 0; d < 400; d++) {
    // The day.
    const day = addDays(LAUNCH_DAY, d);
    // Its case.
    cases.push({ label: day, seed: dailySeedKey(day), day });
  }
  // The practice seeds (a fixed spread of 32-bit values).
  for (let k = 0; k < 100; k++) {
    // A seed far from the others.
    const seed = Math.imul(k + 1, 0x9e3779b1) >>> 0;
    // Its case.
    cases.push({ label: `seed ${seed}`, seed: practiceSeedKey(seed), day: null });
  }
  // The most points, worked out by hand: 10 x (0 + 1 + ... + 11) + 25 x 12.
  if (MAX_SCORE !== 960) failures.push(`MAX_SCORE is ${MAX_SCORE}, not 960`);
  // Each case.
  for (const c of cases) {
    // Built twice.
    const a = newRun(c.seed);
    const b = newRun(c.seed);
    // The same, field for field.
    if (JSON.stringify(a) !== JSON.stringify(b)) failures.push(`${c.label}: not deterministic`);
    // The destination on the board, off the start, far enough.
    if (a.dest < 0 || a.dest >= CELLS || distance(a.dest, START_CELL) < MIN_DEST_DISTANCE) failures.push(`${c.label}: destination ${a.dest}`);
    // The first router on the board, apart from the destination, off the start's row and column, far enough.
    if (a.router < 0 || a.router === a.dest || cellX(a.router) === cellX(START_CELL) || cellY(a.router) === cellY(START_CELL) || distance(a.router, START_CELL) < FIRST_ROUTER_DISTANCE) failures.push(`${c.label}: first router ${a.router}`);
    // Left alone, the packet ends the run (at the edge, a router or after a delivery straight ahead), well within a
    // few rows.
    let idle = a;
    // At most three board heights of ticks.
    for (let t = 0; t < 3 * ROWS && !idle.end; t++) idle = step(idle, null).run;
    // Ended, and not won.
    if (!idle.end || idle.end.kind === "complete") failures.push(`${c.label}: a packet left alone did not end the run`);
    // The safe bot, with the invariants on every tick.
    const safe = playBot(c.seed, safePolicy, (r) => {
      // Each problem, labelled.
      for (const p of invariants(r)) failures.push(`${c.label}: safe bot tick ${r.tick}: ${p}`);
    });
    // Every packet delivered, none through a router.
    if (safe.run.end?.kind !== "complete" || safe.run.delivered !== PACKETS || safe.run.totalHops !== 0) failures.push(`${c.label}: the safe bot ended with ${safe.run.end?.kind} after ${safe.run.delivered} packets`);
    // Its points: the deliveries only.
    if (safe.run.score !== PACKETS * POINTS_DELIVERY) failures.push(`${c.label}: safe score ${safe.run.score}`);
    // The turns survive encoding.
    const decoded = decodeTurns(encodeTurns(safe.turns));
    // Read back the same.
    if (!decoded || JSON.stringify(decoded) !== JSON.stringify(safe.turns)) failures.push(`${c.label}: turns do not survive encoding`);
    // Replayed from them, the same run.
    const again = replayTurns(c.seed, decoded ?? [], safe.run.tick);
    // Identical, and every turn genuine.
    if (!again.ok || JSON.stringify(again.run) !== JSON.stringify(safe.run)) failures.push(`${c.label}: the replay differs from the run`);
    // A day's run is re-checked as the board does it.
    if (c.day) {
      // The save.
      const save: TtlSave = { turns: encodeTurns(safe.turns), ticks: safe.run.tick, done: true };
      // Verified as won, with the replay's own numbers.
      const v = verifySaved(c.day, save);
      // Won, scored and timed as played.
      if (!v || !v.won || v.score !== safe.run.score || v.ms !== safe.run.ms) failures.push(`${c.label}: the safe run does not verify`);
      // One tick short of its end: refused.
      if (verifySaved(c.day, { ...save, ticks: save.ticks - 1 }) !== null) failures.push(`${c.label}: a cut run verified`);
      // An open run: refused.
      if (verifySaved(c.day, { ...save, done: false }) !== null) failures.push(`${c.label}: an open run verified`);
      // A turn on a tick past the end: refused.
      if (verifySaved(c.day, { ...save, turns: `${save.turns}${safe.run.tick + 5}r` }) !== null) failures.push(`${c.label}: a turn past the end verified`);
      // Another day's network: the same turns are not the same completed run there (its hosts are elsewhere).
      const other = verifySaved(addDays(c.day, 1), save);
      // Completed in the same time on the next day too would mean the day does not matter.
      if (other !== null && other.won && other.ms === safe.run.ms) failures.push(`${c.label}: the run verifies on the next day too`);
    }
    // The greedy bot, with the invariants on every tick, and the tight square tried once along the way.
    let tried = false;
    // Played.
    const greedy = playBot(c.seed, greedyPolicy, (r) => {
      // Each problem, labelled.
      for (const p of invariants(r)) failures.push(`${c.label}: greedy bot tick ${r.tick}: ${p}`);
      // Once, with four hops behind the packet and room for a tight square.
      if (!tried && !r.end && r.hops >= 4) {
        // Three quarter turns the same way: the third move comes back onto the cell just behind the head.
        const d1 = CLOCKWISE[r.dir];
        const d2 = CLOCKWISE[d1];
        const d3 = CLOCKWISE[d2];
        // The first two cells of the square.
        const p1 = neighbour(r.body[0], d1);
        const p2 = p1 < 0 ? -1 : neighbour(p1, d2);
        // On the board, clear of the trail, the router and the host.
        const clear = [p1, p2].every((p) => p >= 0 && p !== r.router && p !== r.dest && !r.body.includes(p));
        // Not here.
        if (!clear) return;
        // The third is the trail's first segment, by the square's geometry.
        if (neighbour(p2, d3) !== r.body[1]) failures.push(`${c.label}: the tight square does not close on the trail`);
        // Tried now.
        tried = true;
        squares++;
        // The three turns.
        let sq = r;
        // Each one a tick.
        for (const d of [d1, d2, d3]) sq = step(sq, d).run;
        // A routing loop, on the trail's segment.
        if (sq.end?.kind !== "loop" || sq.end.cell !== r.body[1]) failures.push(`${c.label}: the tight square ended with ${sq.end?.kind ?? "nothing"}`);
      }
    });
    // A completed greedy run is counted (it delivers early, with fewer hops, when no path to a router is left).
    if (greedy.run.end?.kind === "complete") greedyDone++;
    // One that took every hop it could scored exactly the most a run can.
    if (greedy.run.end?.kind === "complete" && greedy.run.totalHops === MAX_HOPS && greedy.run.score !== MAX_SCORE) failures.push(`${c.label}: every hop taken but ${greedy.run.score} points`);
    // Counted apart.
    if (greedy.run.end?.kind === "complete" && greedy.run.score === MAX_SCORE) greedyMax++;
    // The first packet steered into a router: discarded, TTL 0, nothing scored.
    let reckless = a;
    // Toward the router, ignoring the host, for at most a board's worth of ticks.
    for (let t = 0; t < CELLS && !reckless.end; t++) reckless = step(reckless, pathTo(reckless, reckless.router, [reckless.dest]) ?? safeMove(reckless)).run;
    // Time Exceeded at the first router.
    if (reckless.end?.kind !== "expired" || reckless.ttl !== 0 || reckless.score !== 0 || reckless.end.cell !== a.router) failures.push(`${c.label}: the first router did not discard the first packet (${reckless.end?.kind})`);
    // One more case.
    checked++;
  }
  // The greedy bot should finish most runs, most of them with every hop taken: a sharp fall means the board or the rules
  // changed (the most points are reachable, and reached on most days).
  if (greedyDone < cases.length * 0.5 || greedyMax < cases.length * 0.5) failures.push(`the greedy bot completed ${greedyDone} of ${cases.length} runs, ${greedyMax} with every hop`);
  // The tight square was tried on most runs.
  if (squares < cases.length * 0.5) failures.push(`the tight square was tried on only ${squares} runs`);
  // Malformed turn lists are refused.
  for (const bad of ["r", "4", "4x", "5r3u", "5r5u", "999999r", 7]) if (decodeTurns(bad) !== null) failures.push(`decodeTurns accepted ${JSON.stringify(bad)}`);
  // The report.
  return { checked, failures };
}
