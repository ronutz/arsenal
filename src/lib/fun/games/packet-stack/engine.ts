// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/fun/games/packet-stack/engine.ts
// ----------------------------------------------------------------------------
// PACKET STACK, the rules (PRIME 08/11/2026: the arcade's first wave, "frames
// with headers drop; complete a valid encapsulation (Ethernet, IP, TCP,
// payload) to clear the row"). The falling-blocks formula, themed on the frame
// on the wire: each block is one header (or the payload), a row of the well is
// one frame read left to right, and a full row is delivered only when every
// header names the one to its right, as a real receiver demultiplexes it:
//   - the Ethernet header's EtherType names the IP version: 0x0800 IPv4
//     (RFC 894), 0x86DD IPv6 (RFC 2464); 0x0806 would hand the frame to the
//     Address Resolution Protocol (ARP) instead (the IANA list of EtherTypes,
//     which the IEEE Registration Authority assigns, RFC 9542);
//   - the IPv4 header's Protocol field (RFC 791), and the IPv6 header's Next
//     Header, which uses the same values (RFC 8200), name the transport: 6 the
//     Transmission Control Protocol (TCP), 17 the User Datagram Protocol (UDP);
//     1 would be ICMP and 58 ICMPv6 (the IANA Protocol Numbers registry);
//   - the transport header's destination port names the application, as each
//     application's own document gives it and the IANA port registry records:
//     HTTP on TCP 80 and HTTPS on TCP 443 (RFC 9110), SSH on TCP 22 (RFC 4253),
//     DNS on UDP or TCP 53 (RFC 1035), NTP on UDP 123 (RFC 5905), syslog on
//     UDP 514 (RFC 5426).
// The player steers each block into a column and sets its field (the
// formula's "rotate" cycles the field's value). A full row whose chain breaks
// is dropped, as a receiver drops it, and stays at the bottom of the well;
// four frames delivered in a row clear the oldest dropped one. A block that
// cannot enter the well ends the run.
//
// THE DEAL. Frames are generated in pairs (a "bag" of eight blocks) and each
// bag is shuffled under two rules: within each layer the first frame's block
// comes first, so the rows the blocks fall into are the frames they came from;
// and a header's right-hand neighbour is never more than PREVIEW blocks behind
// it, so the block it must name is always on screen (in the well or in the
// queue) when the player sets the field. Every deal can therefore be played
// perfectly, and the self-test proves it with a bot that sees only what a
// player sees.
//
// Everything is pure: the daily deal is drawn from dailyRng (the same for
// everyone on a UTC day), practice from a seed the page picks, and a run is a
// fold over its placements, one hexadecimal digit each (column * 4 + the
// field's option), so the scoreboard can replay a posted run and score it
// again (src/lib/fun/verify.ts).
// ============================================================================

// The seeded generators, the daily seed and the day arithmetic.
import { addDays, dailyRng, LAUNCH_DAY, makeRng, type Rng } from "../../daily";
// The self-test's report shape.
import type { SelfTestReport } from "../../registry";

/** The game's stable id (storage key, folder, page slug, board id). */
export const GAME_ID = "packet-stack";
/** Columns in the well: the four layers of a frame, left to right. */
export const COLS = 4;
/** Rows in the well. */
export const ROWS = 8;
/** Blocks shown in the queue after the falling one. */
export const PREVIEW = 4;
/** Frames in the daily run (two per bag). */
export const DAILY_FRAMES = 16;
/** Blocks in the daily run: four per frame. */
export const DAILY_BLOCKS = DAILY_FRAMES * COLS;
/** Frames delivered that count the daily run as won (and keep the streak). */
export const PASS_MARK = 12;
/** Points for a delivered frame, before the streak bonus. */
export const FRAME_POINTS = 100;
/** Extra points per frame already in the current streak. */
export const STREAK_STEP = 25;
/** The streak bonus stops growing after this many earlier frames in the streak. */
export const STREAK_CAP = 4;
/** Frames delivered in a row that clear the oldest dropped frame. */
export const DRAIN_EVERY = 4;
/** Rows resolved (delivered or dropped) per level of speed. */
export const ROWS_PER_LEVEL = 3;
/** Bags in a practice deal: 400 frames, longer than any human run. */
export const PRACTICE_BAGS = 200;
/** The fall interval at level 1, in milliseconds per row. */
const BASE_FALL_MS = 800;
/** Each level multiplies the interval by this. */
const FALL_FACTOR = 0.8;
/** The fastest fall interval, in milliseconds per row. */
const MIN_FALL_MS = 80;
/** How many shuffles a bag may try before it falls back to the frames in order. */
const MAX_SHUFFLES = 5000;

/** The headers, and the payloads they carry. */
export type Kind = "eth" | "ipv4" | "ipv6" | "tcp" | "udp" | "http" | "https" | "ssh" | "dns" | "ntp" | "syslog";
/** The payloads: the application data at the right end of a frame. */
export type AppKind = "http" | "https" | "ssh" | "dns" | "ntp" | "syslog";
/** What a field value can name: a header or payload of the game, or a protocol the game never deals (a decoy). */
export type Named = Kind | "arp" | "icmp" | "icmpv6";
/** The field a header carries, by its document's name. */
export type FieldName = "ethertype" | "protocol" | "nextHeader" | "port";

/** Every kind, in layer order. */
export const KINDS: readonly Kind[] = ["eth", "ipv4", "ipv6", "tcp", "udp", "http", "https", "ssh", "dns", "ntp", "syslog"];
/** The payloads, in the order the weights below list them. */
export const APPS: readonly AppKind[] = ["http", "https", "ssh", "dns", "ntp", "syslog"];

/** The column (layer) each kind belongs in: 0 link, 1 internet, 2 transport, 3 application (RFC 1122's four layers). */
export const LAYER_OF: Readonly<Record<Kind, number>> = {
  // The link layer's header.
  eth: 0,
  // The internet layer's two headers.
  ipv4: 1,
  ipv6: 1,
  // The transport layer's two headers.
  tcp: 2,
  udp: 2,
  // The application data.
  http: 3,
  https: 3,
  ssh: 3,
  dns: 3,
  ntp: 3,
  syslog: 3,
};

/** The field of each header, or null for a payload (it names nothing). */
export const FIELD_OF: Readonly<Record<Kind, FieldName | null>> = {
  // Ethernet II: the EtherType after the two addresses (RFC 894, RFC 9542).
  eth: "ethertype",
  // IPv4's Protocol field (RFC 791).
  ipv4: "protocol",
  // IPv6's Next Header, with the same values (RFC 8200).
  ipv6: "nextHeader",
  // The destination port (RFC 9293, RFC 768).
  tcp: "port",
  udp: "port",
  // The payloads carry no field of the game.
  http: null,
  https: null,
  ssh: null,
  dns: null,
  ntp: null,
  syslog: null,
};

/**
 * The values each header's field can be set to, in the order "rotate" cycles them, with what each one names. The
 * decoys (ARP, ICMP, ICMPv6) are real assignments that no block of the game can follow, so choosing one always drops
 * the frame. A payload has none.
 */
export const OPTIONS: Readonly<Record<Kind, readonly { value: number; names: Named }[]>> = {
  // EtherTypes (IANA's list of IEEE 802 numbers): IPv4, IPv6, ARP.
  eth: [
    { value: 0x0800, names: "ipv4" },
    { value: 0x86dd, names: "ipv6" },
    { value: 0x0806, names: "arp" },
  ],
  // IP protocol numbers (IANA): TCP, UDP, ICMP.
  ipv4: [
    { value: 6, names: "tcp" },
    { value: 17, names: "udp" },
    { value: 1, names: "icmp" },
  ],
  // The same numbers in IPv6's Next Header: TCP, UDP, ICMPv6.
  ipv6: [
    { value: 6, names: "tcp" },
    { value: 17, names: "udp" },
    { value: 58, names: "icmpv6" },
  ],
  // TCP destination ports: HTTP, HTTPS, SSH, DNS.
  tcp: [
    { value: 80, names: "http" },
    { value: 443, names: "https" },
    { value: 22, names: "ssh" },
    { value: 53, names: "dns" },
  ],
  // UDP destination ports: DNS, NTP, syslog.
  udp: [
    { value: 53, names: "dns" },
    { value: 123, names: "ntp" },
    { value: 514, names: "syslog" },
  ],
  // Payloads: nothing to set.
  http: [],
  https: [],
  ssh: [],
  dns: [],
  ntp: [],
  syslog: [],
};

/** The transports each application runs over in the game, from its own document (DNS over both, RFC 1035). */
export const APP_TRANSPORTS: Readonly<Record<AppKind, readonly ("tcp" | "udp")[]>> = {
  // HTTP and HTTPS: TCP 80 and 443 (RFC 9110).
  http: ["tcp"],
  https: ["tcp"],
  // SSH: TCP 22 (RFC 4253).
  ssh: ["tcp"],
  // DNS: UDP and TCP 53 (RFC 1035).
  dns: ["udp", "tcp"],
  // NTP: UDP 123 (RFC 5905).
  ntp: ["udp"],
  // Syslog: UDP 514 (RFC 5426).
  syslog: ["udp"],
};

/** How often each application is dealt, out of 100. */
const APP_WEIGHTS: readonly number[] = [15, 25, 10, 25, 12, 13];
/** Out of 100, how often a DNS frame rides on TCP rather than UDP. */
const DNS_TCP_PERCENT = 15;
/** Out of 100, how often a frame carries IPv6 rather than IPv4. */
const IPV6_PERCENT = 40;

/** One block of the deal: what it is, the column it appears over, and the field value it arrives with. */
export interface Block {
  /** The header or payload. */
  kind: Kind;
  /** The column it appears in at the top of the well, 0 to COLS - 1. */
  spawn: number;
  /** The index of the field value it arrives with (0 for a payload). */
  init: number;
}

/** A block at rest in the well: what it is and the field value it was locked with. */
export interface Cell {
  /** The header or payload. */
  kind: Kind;
  /** The index of its field value in OPTIONS[kind] (0 for a payload). */
  v: number;
}

/** Why a full row was dropped: a block in another layer's slot, or a field that names something else. */
export type Problem =
  | {
      /** A header or payload in a column of another layer. */
      code: "slot";
      /** The column. */
      col: number;
      /** What sits there. */
      kind: Kind;
    }
  | {
      /** A field that does not name what follows it. */
      code: "chain";
      /** The column of the header whose field is wrong. */
      col: number;
      /** That header. */
      kind: Kind;
      /** Its field's value. */
      value: number;
      /** What the value names. */
      names: Named;
      /** What actually follows. */
      next: Kind;
    };

/** A run in progress or finished: the well, the counters, and the placements so far. */
export interface Run {
  /** The live columns above the dropped frames, bottom first. */
  cols: Cell[][];
  /** The dropped frames kept at the bottom of the well, bottom first. */
  jam: Cell[][];
  /** The index in the deal of the block now falling (the deal's length once every block is placed). */
  next: number;
  /** Frames delivered. */
  delivered: number;
  /** Frames dropped. */
  dropped: number;
  /** Frames delivered in a row, now. */
  streak: number;
  /** The longest such run. */
  bestStreak: number;
  /** Points. */
  score: number;
  /** Rows resolved, delivered or dropped (the level follows it). */
  rows: number;
  /** Each resolved row in order: "d" delivered, "x" dropped. */
  outcomes: string;
  /** Dropped frames cleared by a streak. */
  drained: number;
  /** The run is over: every block placed, or the well full. */
  over: boolean;
  /** The run ended because a block could not enter the well. */
  toppedOut: boolean;
  /** The placements so far: one hexadecimal digit each, column * 4 + option index. */
  moves: string;
}

/** What one placement did, for the page to show. */
export type PlaceEvent =
  | {
      /** The block came to rest; no row was full. */
      kind: "rest";
    }
  | {
      /** A full row read as a valid frame and was delivered. */
      kind: "delivered";
      /** The frame's cells, left to right. */
      row: Cell[];
      /** The points it scored. */
      points: number;
      /** Whether it cleared the oldest dropped frame. */
      drained: boolean;
    }
  | {
      /** A full row broke the chain and was dropped. */
      kind: "dropped";
      /** The frame's cells, left to right. */
      row: Cell[];
      /** The first thing wrong with it. */
      problem: Problem;
    };

// ---- The rule ------------------------------------------------------------------------------------------------------

/**
 * What a header's field names at a given option.
 *
 * @param kind the header
 * @param v the option index
 * @returns what it names, or null for a payload or an index out of range
 */
export function namesOf(kind: Kind, v: number): Named | null {
  // The option, if any.
  const opt = OPTIONS[kind][v];
  // A payload, or no such option.
  return opt ? opt.names : null;
}

/**
 * The value a header's field holds at a given option.
 *
 * @param kind the header
 * @param v the option index
 * @returns the number (an EtherType, a protocol number, a port), or null for a payload
 */
export function valueOf(kind: Kind, v: number): number | null {
  // The option, if any.
  const opt = OPTIONS[kind][v];
  // Its number.
  return opt ? opt.value : null;
}

/**
 * Whether a kind is a payload (the application column's).
 *
 * @param kind the kind
 * @returns true for a payload
 */
export function isApp(kind: Kind): kind is AppKind {
  // The application layer.
  return LAYER_OF[kind] === 3;
}

/**
 * Read a full row as a receiver would: every block in its layer's column, then every field naming what follows.
 *
 * @param row the four cells, left to right
 * @returns the first problem, or null for a valid frame
 */
export function rowVerdict(row: readonly Cell[]): Problem | null {
  // Every block in its own layer's column first: a frame is read Ethernet, IP, transport, payload.
  for (let c = 0; c < COLS; c++) if (LAYER_OF[row[c].kind] !== c) return { code: "slot", col: c, kind: row[c].kind };
  // Then each header's field against the block to its right.
  for (let c = 0; c < COLS - 1; c++) {
    // The header and its field's meaning.
    const cell = row[c];
    const names = namesOf(cell.kind, cell.v);
    // What follows.
    const next = row[c + 1].kind;
    // A field that names something else breaks the chain here.
    if (names !== next) return { code: "chain", col: c, kind: cell.kind, value: valueOf(cell.kind, cell.v) ?? 0, names: names ?? "arp", next };
  }
  // Every header names the next one.
  return null;
}

/**
 * The option index of a header's field that names a given kind.
 *
 * @param kind the header
 * @param target what should follow it
 * @returns the index, or -1 when no value of this header names it
 */
export function optionFor(kind: Kind, target: Kind): number {
  // The first option that names the target.
  return OPTIONS[kind].findIndex((o) => o.names === target);
}

// ---- The deal ------------------------------------------------------------------------------------------------------

/** One frame of the deal, before it is shuffled into blocks. */
interface FrameSpec {
  /** The IP version. */
  ip: "ipv4" | "ipv6";
  /** The transport. */
  l4: "tcp" | "udp";
  /** The payload. */
  app: AppKind;
}

/**
 * Draw one frame: an application by weight, a transport it runs over, and an IP version.
 *
 * @param rng the generator
 * @returns the frame
 */
function drawFrame(rng: Rng): FrameSpec {
  // A number out of 100 for the application.
  let roll = rng.int(100);
  // The application whose weight band holds it.
  let app: AppKind = APPS[APPS.length - 1];
  // Walk the bands.
  for (let i = 0; i < APPS.length; i++) {
    // Inside this band.
    if (roll < APP_WEIGHTS[i]) {
      // Chosen.
      app = APPS[i];
      // Done.
      break;
    }
    // On to the next band.
    roll -= APP_WEIGHTS[i];
  }
  // The transport: DNS sometimes over TCP, every other application over its one transport.
  const l4 = app === "dns" ? (rng.int(100) < DNS_TCP_PERCENT ? "tcp" : "udp") : APP_TRANSPORTS[app][0];
  // The IP version.
  const ip = rng.int(100) < IPV6_PERCENT ? "ipv6" : "ipv4";
  // The frame.
  return { ip, l4, app };
}

/**
 * Whether a bag's order is fair: within each layer the first frame's block comes first (so rows are frames), and
 * each header's right-hand neighbour is at most PREVIEW blocks after it (so it is on screen when the field is set).
 *
 * @param order the bag's block ids in deal order (id = frame * 4 + layer)
 * @returns true when both rules hold
 */
export function fairOrder(order: readonly number[]): boolean {
  // Each id's position.
  const pos: number[] = [];
  // Read the order.
  order.forEach((id, i) => (pos[id] = i));
  // Rule 1: frame 0's block of each layer before frame 1's.
  for (let c = 0; c < COLS; c++) if (pos[c] > pos[COLS + c]) return false;
  // Rule 2: a neighbour that comes later is within reach of the queue.
  for (let f = 0; f < 2; f++) {
    // Each header of the frame and the block to its right.
    for (let c = 0; c < COLS - 1; c++) {
      // Where the two are.
      const a = pos[f * COLS + c];
      const b = pos[f * COLS + c + 1];
      // Too far behind to be seen.
      if (b > a && b - a > PREVIEW) return false;
    }
  }
  // Fair.
  return true;
}

/**
 * Deal one bag: two frames, shuffled fairly, each block with its spawn column and the field value it arrives with.
 *
 * @param rng the generator
 * @returns eight blocks
 */
function dealBag(rng: Rng): Block[] {
  // The two frames.
  const frames = [drawFrame(rng), drawFrame(rng)];
  // Their eight kinds, by id (frame * 4 + layer).
  const kinds: Kind[] = frames.flatMap((f) => ["eth", f.ip, f.l4, f.app] as Kind[]);
  // A fair order: shuffled until both rules hold, or the frames in order if no shuffle does (it always does in practice).
  let order: number[] = kinds.map((_, i) => i);
  // Bounded attempts.
  for (let tries = 0; tries < MAX_SHUFFLES; tries++) {
    // One shuffle.
    const o = rng.shuffle(kinds.map((_, i) => i));
    // Kept when fair.
    if (fairOrder(o)) {
      // This one.
      order = o;
      // Done.
      break;
    }
  }
  // The blocks in that order, each with a spawn column and a starting value.
  return order.map((id) => {
    // The kind.
    const kind = kinds[id];
    // Its options.
    const n = OPTIONS[kind].length;
    // The block.
    return { kind, spawn: rng.int(COLS), init: n > 0 ? rng.int(n) : 0 };
  });
}

/**
 * The day's run: DAILY_FRAMES frames in fair bags, the same for everyone on a UTC day.
 *
 * @param day the puzzle's day, YYYY-MM-DD
 * @returns DAILY_BLOCKS blocks
 */
export function dailyDeal(day: string): Block[] {
  // The day's generator.
  const rng = dailyRng(GAME_ID, day);
  // The blocks.
  const out: Block[] = [];
  // Two frames per bag.
  for (let b = 0; b < DAILY_FRAMES / 2; b++) out.push(...dealBag(rng));
  // The deal.
  return out;
}

/**
 * A practice deal from a seed the page picks: PRACTICE_BAGS fair bags.
 *
 * @param seed an unsigned 32-bit seed
 * @returns the blocks
 */
export function practiceDeal(seed: number): Block[] {
  // The seed's generator.
  const rng = makeRng(seed);
  // The blocks.
  const out: Block[] = [];
  // Bag after bag.
  for (let b = 0; b < PRACTICE_BAGS; b++) out.push(...dealBag(rng));
  // The deal.
  return out;
}

// ---- The run -------------------------------------------------------------------------------------------------------

/**
 * A run before its first placement.
 *
 * @returns an empty well
 */
export function newRun(): Run {
  // Nothing placed, nothing scored.
  return { cols: Array.from({ length: COLS }, () => []), jam: [], next: 0, delivered: 0, dropped: 0, streak: 0, bestStreak: 0, score: 0, rows: 0, outcomes: "", drained: 0, over: false, toppedOut: false, moves: "" };
}

/**
 * How many rows the live part of the well holds above the dropped frames.
 *
 * @param run the run
 * @returns the rows left
 */
export function capacity(run: Run): number {
  // The well less its dropped frames.
  return ROWS - run.jam.length;
}

/**
 * Whether a block at the top of the well can be in a column (its top cell is free).
 *
 * @param run the run
 * @param col the column
 * @returns true when there is room
 */
export function hasRoom(run: Run, col: number): boolean {
  // The column's stack is below the top.
  return col >= 0 && col < COLS && run.cols[col].length < capacity(run);
}

/**
 * Whether a block that appears over one column can be steered into another along the top row: every column on the
 * way, both ends included, has room.
 *
 * @param run the run
 * @param from the spawn column
 * @param to the target column
 * @returns true when the path is open
 */
export function reachable(run: Run, from: number, to: number): boolean {
  // The span between the two.
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);
  // Every column in it.
  for (let c = lo; c <= hi; c++) if (!hasRoom(run, c)) return false;
  // Open.
  return true;
}

/**
 * The block now falling, or null when the run is over.
 *
 * @param run the run
 * @param deal the deal
 * @returns the block
 */
export function currentBlock(run: Run, deal: readonly Block[]): Block | null {
  // None once over.
  return run.over ? null : (deal[run.next] ?? null);
}

/**
 * The blocks after the falling one that the queue shows.
 *
 * @param run the run
 * @param deal the deal
 * @param n how many (PREVIEW by default)
 * @returns up to n blocks
 */
export function upcoming(run: Run, deal: readonly Block[], n = PREVIEW): Block[] {
  // The slice after the current block.
  return run.over ? [] : deal.slice(run.next + 1, run.next + 1 + n);
}

/**
 * The run's speed level: 1, then one more every ROWS_PER_LEVEL rows resolved.
 *
 * @param run the run
 * @returns the level
 */
export function level(run: Run): number {
  // Whole steps of rows.
  return 1 + Math.floor(run.rows / ROWS_PER_LEVEL);
}

/**
 * How long a block takes to fall one row at a level (the page's clock; the score never depends on it).
 *
 * @param lvl the level
 * @returns milliseconds per row
 */
export function fallMs(lvl: number): number {
  // A geometric speed-up, never faster than the floor.
  return Math.max(MIN_FALL_MS, Math.round(BASE_FALL_MS * FALL_FACTOR ** (lvl - 1)));
}

/**
 * The points of a delivered frame at a streak length (counting this frame).
 *
 * @param streak the streak with this frame
 * @returns the points
 */
export function framePoints(streak: number): number {
  // The base, plus a step per earlier frame in the streak, capped.
  return FRAME_POINTS + STREAK_STEP * Math.min(Math.max(0, streak - 1), STREAK_CAP);
}

/**
 * The best score a deal of a number of frames allows: every frame delivered, in one streak.
 *
 * @param frames how many frames
 * @returns the points
 */
export function perfectScore(frames: number): number {
  // The sum over the streak.
  let total = 0;
  // Each frame in turn.
  for (let k = 1; k <= frames; k++) total += framePoints(k);
  // The sum.
  return total;
}

/**
 * Lock the falling block into a column with a field value: the row it completes (if any) is read, delivered or
 * dropped, and the next block appears (or the run ends).
 *
 * @param run the run before
 * @param deal the deal
 * @param col the column it locks in
 * @param v the field's option index (0 for a payload)
 * @returns the run after and what happened, or null when the placement is not one the game allows
 */
export function place(run: Run, deal: readonly Block[], col: number, v: number): { run: Run; event: PlaceEvent } | null {
  // The falling block.
  const block = currentBlock(run, deal);
  // No block, or the run is over.
  if (!block) return null;
  // A column it cannot reach along the top row.
  if (!Number.isInteger(col) || !reachable(run, block.spawn, col)) return null;
  // A field value the header does not have (a payload takes only 0).
  if (!Number.isInteger(v) || v < 0 || v >= Math.max(1, OPTIONS[block.kind].length)) return null;
  // A copy of the well, the block on top of its column.
  const cols = run.cols.map((c, i) => (i === col ? [...c, { kind: block.kind, v }] : c.slice()));
  // The run after, before any row is read.
  const out: Run = { ...run, cols, jam: run.jam.slice(), next: run.next + 1, moves: run.moves + (col * 4 + v).toString(16) };
  // What happened: nothing yet.
  let event: PlaceEvent = { kind: "rest" };
  // The bottom live row is full: every column has a block in it (rows fill bottom up, so only this one can be).
  if (cols.every((c) => c.length > 0)) {
    // The row, left to right, taken out of the live columns.
    const row = cols.map((c) => c.shift() as Cell);
    // One more row resolved.
    out.rows = run.rows + 1;
    // Read.
    const problem = rowVerdict(row);
    // A valid frame.
    if (problem === null) {
      // One more in the streak.
      out.streak = run.streak + 1;
      out.bestStreak = Math.max(run.bestStreak, out.streak);
      // Delivered and scored.
      out.delivered = run.delivered + 1;
      const points = framePoints(out.streak);
      out.score = run.score + points;
      out.outcomes = run.outcomes + "d";
      // Every DRAIN_EVERY in a row clear the oldest dropped frame, if there is one.
      const drained = out.streak % DRAIN_EVERY === 0 && out.jam.length > 0;
      // Cleared from the bottom.
      if (drained) {
        // The oldest one out.
        out.jam.shift();
        // Counted.
        out.drained = run.drained + 1;
      }
      // Reported.
      event = { kind: "delivered", row, points, drained };
    } else {
      // Dropped: the streak breaks and the row stays at the bottom.
      out.streak = 0;
      out.dropped = run.dropped + 1;
      out.outcomes = run.outcomes + "x";
      out.jam.push(row);
      // Reported.
      event = { kind: "dropped", row, problem };
    }
  }
  // Every block placed: the run is over.
  if (out.next >= deal.length) out.over = true;
  // The next block cannot appear: the well is full over its column (or the dropped frames fill the well).
  else if (!hasRoom(out, deal[out.next].spawn)) {
    // Over, topped out.
    out.over = true;
    out.toppedOut = true;
  }
  // The run and the event.
  return { run: out, event };
}

/**
 * Replay a run from its placements.
 *
 * @param deal the deal
 * @param moves the placements, one hexadecimal digit each
 * @returns the run, or null when any placement is malformed or not allowed
 */
export function replay(deal: readonly Block[], moves: string): Run | null {
  // Only hexadecimal digits, no more than the deal has blocks.
  if (typeof moves !== "string" || moves.length > deal.length || !/^[0-9a-f]*$/.test(moves)) return null;
  // From an empty well.
  let run = newRun();
  // Each placement in turn.
  for (const ch of moves) {
    // Its column and option.
    const d = parseInt(ch, 16);
    // Applied (null when not allowed, including a placement after the run is over).
    const r = place(run, deal, Math.floor(d / 4), d % 4);
    // Refused.
    if (!r) return null;
    // Carried on.
    run = r.run;
  }
  // The run.
  return run;
}

// ---- A player who sees only the screen -------------------------------------------------------------------------------

/** The move a player who reads the screen makes, and whether they had to guess. */
export interface ScreenMove {
  /** The column (the block's own layer). */
  col: number;
  /** The field's option index. */
  v: number;
  /** True when the block the field must name was neither in the well nor in the queue. */
  blind: boolean;
}

/**
 * The move a player makes who puts each block in its own layer's column and sets its field from what the screen
 * shows: the block to the right of where it will land, or, when that cell is still empty, the block of the next layer
 * that will fill it, found in the queue (PREVIEW blocks). The self-test plays it on every deal.
 *
 * @param run the run
 * @param deal the deal
 * @returns the move, or null when the run is over
 */
export function screenMove(run: Run, deal: readonly Block[]): ScreenMove | null {
  // The falling block.
  const block = currentBlock(run, deal);
  // Nothing to play.
  if (!block) return null;
  // Its own column.
  const col = LAYER_OF[block.kind];
  // A payload names nothing.
  if (col === COLS - 1) return { col, v: 0, blind: false };
  // The row it will land in (counted in the live part of the well).
  const r = run.cols[col].length;
  // The column to its right.
  const right = run.cols[col + 1];
  // The block to the right of the landing cell, when it is already there.
  let neighbour: Kind | null = right.length > r ? right[r].kind : null;
  // Otherwise, the block of the next layer that will fill that cell: the (r - height)th of that layer in the queue.
  if (neighbour === null) {
    // How many of that layer must land first.
    let skip = r - right.length;
    // The queue.
    for (const b of upcoming(run, deal)) {
      // Only the next layer's blocks fill that column.
      if (LAYER_OF[b.kind] !== col + 1) continue;
      // This is the one.
      if (skip === 0) {
        // Found.
        neighbour = b.kind;
        // Done.
        break;
      }
      // Not yet.
      skip--;
    }
  }
  // Not on screen: a guess (the value it arrived with).
  if (neighbour === null) return { col, v: block.init, blind: true };
  // The value that names it (or the first, when none does).
  const v = optionFor(block.kind, neighbour);
  // The move.
  return { col, v: v < 0 ? 0 : v, blind: false };
}

/**
 * Play a whole deal with screenMove().
 *
 * @param deal the deal
 * @param limit the most blocks to play (all by default)
 * @returns the final run and how many fields had to be guessed
 */
export function playFromScreen(deal: readonly Block[], limit = deal.length): { run: Run; blind: number } {
  // From an empty well.
  let run = newRun();
  // Guesses.
  let blind = 0;
  // Until the run ends or the limit is reached.
  while (!run.over && run.next < limit) {
    // The move.
    const m = screenMove(run, deal) as ScreenMove;
    // A guess counted.
    if (m.blind) blind++;
    // Played (a refusal would leave the run unchanged and stop the loop).
    const r = place(run, deal, m.col, m.v);
    // Stopped.
    if (!r) break;
    // Carried on.
    run = r.run;
  }
  // The result.
  return { run, blind };
}

/**
 * Play a whole deal without touching anything: every block locks where it appears, with the value it arrived with
 * (what happens when the clock runs every block down untouched).
 *
 * @param deal the deal
 * @returns the final run
 */
export function playIdle(deal: readonly Block[]): Run {
  // From an empty well.
  let run = newRun();
  // Until it ends.
  while (!run.over) {
    // The falling block.
    const b = currentBlock(run, deal) as Block;
    // Locked where it is.
    const r = place(run, deal, b.spawn, b.init);
    // Cannot happen (its column has room, or the run would be over), but never loop forever.
    if (!r) break;
    // Carried on.
    run = r.run;
  }
  // The result.
  return run;
}

// ---- Self-test -----------------------------------------------------------------------------------------------------

/**
 * A synthetic deal of whole frames in order, every block appearing in its own column with value 0, for the hand cases.
 *
 * @param frames the frames' kinds, four each
 * @returns the blocks
 */
function inOrder(frames: readonly (readonly Kind[])[]): Block[] {
  // Each frame's blocks, left to right.
  return frames.flatMap((f) => f.map((kind) => ({ kind, spawn: LAYER_OF[kind], init: 0 })));
}

/**
 * The self-test, run before every build (scripts/check-fun-games.mts): the rule tables, hand cases of the rule, the
 * replay's refusals, the dropped-frame drain, 400 daily deals and 100 practice deals, each well formed, the same when
 * built twice, fair in every bag, and played perfectly by a player who sees only the screen.
 *
 * @returns what was checked and what failed
 */
export function selfTest(): SelfTestReport {
  // Problems found.
  const failures: string[] = [];
  // Cases checked.
  let checked = 0;
  // One case: a label and whether it held.
  const ok = (label: string, cond: boolean) => {
    // Counted.
    checked++;
    // Reported when false.
    if (!cond) failures.push(label);
  };

  // The tables: every header has options that fit a hexadecimal digit, every payload has none, and every application
  // has a transport and a port that name it.
  for (const k of KINDS) {
    // Headers have 2 to 4 options; payloads none.
    ok(`${k} options`, isApp(k) ? OPTIONS[k].length === 0 : OPTIONS[k].length >= 2 && OPTIONS[k].length <= 4);
    // A field name for headers only.
    ok(`${k} field`, isApp(k) === (FIELD_OF[k] === null));
  }
  // Each application is reachable over each of its transports.
  for (const app of APPS) for (const l4 of APP_TRANSPORTS[app]) ok(`${app} over ${l4} has a port`, optionFor(l4, app) >= 0);
  // The two EtherTypes and the two protocol numbers the frames need.
  ok("0x0800 names IPv4", valueOf("eth", optionFor("eth", "ipv4")) === 0x0800);
  ok("0x86DD names IPv6", valueOf("eth", optionFor("eth", "ipv6")) === 0x86dd);
  ok("IPv4 6 names TCP", valueOf("ipv4", optionFor("ipv4", "tcp")) === 6);
  ok("IPv6 17 names UDP", valueOf("ipv6", optionFor("ipv6", "udp")) === 17);
  // The perfect daily score.
  ok("perfect daily score is 2950", perfectScore(DAILY_FRAMES) === 2950);

  // Hand cases of the rule: every documented combination is a valid frame, with both IP versions.
  for (const ip of ["ipv4", "ipv6"] as const) {
    // Each application and transport.
    for (const app of APPS) {
      // Each of its transports.
      for (const l4 of APP_TRANSPORTS[app]) {
        // The frame with every field set to name the next.
        const row: Cell[] = [
          { kind: "eth", v: optionFor("eth", ip) },
          { kind: ip, v: optionFor(ip, l4) },
          { kind: l4, v: optionFor(l4, app) },
          { kind: app, v: 0 },
        ];
        // Valid.
        ok(`${ip}/${l4}/${app} is a valid frame`, rowVerdict(row) === null);
      }
    }
  }
  // A decoy EtherType breaks the chain at the Ethernet header.
  const arp = rowVerdict([{ kind: "eth", v: 2 }, { kind: "ipv4", v: 0 }, { kind: "tcp", v: 0 }, { kind: "http", v: 0 }]);
  ok("0x0806 before IPv4 is dropped at column 0", arp?.code === "chain" && arp.col === 0 && arp.names === "arp");
  // The wrong IP version.
  const v6 = rowVerdict([{ kind: "eth", v: 0 }, { kind: "ipv6", v: 0 }, { kind: "tcp", v: 0 }, { kind: "http", v: 0 }]);
  ok("0x0800 before IPv6 is dropped at column 0", v6?.code === "chain" && v6.col === 0 && v6.next === "ipv6");
  // ICMP is a real protocol number no block follows.
  const icmp = rowVerdict([{ kind: "eth", v: 0 }, { kind: "ipv4", v: 2 }, { kind: "tcp", v: 0 }, { kind: "http", v: 0 }]);
  ok("protocol 1 before TCP is dropped at column 1", icmp?.code === "chain" && icmp.col === 1 && icmp.names === "icmp");
  // A port that names another application.
  const port = rowVerdict([{ kind: "eth", v: 0 }, { kind: "ipv4", v: 1 }, { kind: "udp", v: 1 }, { kind: "dns", v: 0 }]);
  ok("UDP 123 before DNS is dropped at column 2", port?.code === "chain" && port.col === 2 && port.value === 123);
  // A header in another layer's slot.
  const slot = rowVerdict([{ kind: "ipv4", v: 0 }, { kind: "eth", v: 0 }, { kind: "tcp", v: 0 }, { kind: "http", v: 0 }]);
  ok("IPv4 in the Ethernet slot is dropped at column 0", slot?.code === "slot" && slot.col === 0 && slot.kind === "ipv4");

  // The replay's refusals.
  const day0 = dailyDeal(LAUNCH_DAY);
  ok("replay refuses a character that is not hexadecimal", replay(day0, "0g") === null);
  ok("replay refuses more placements than blocks", replay(day0, "0".repeat(day0.length + 1)) === null);
  // A payload's field takes only 0: find the first payload and give it option 1.
  const firstApp = day0.findIndex((b) => isApp(b.kind));
  const before = playFromScreen(day0, firstApp).run.moves;
  ok("replay refuses a payload with a field value", replay(day0, before + (3 * 4 + 1).toString(16)) === null);
  // A full column blocks the way along the top row: eight blocks appearing over column 0 stacked in column 1, then one
  // steered from column 0 to column 2.
  const wall: Block[] = Array.from({ length: 10 }, () => ({ kind: "eth" as Kind, spawn: 0, init: 0 }));
  ok("a full column blocks the path", replay(wall, "44444444") !== null && replay(wall, "444444448") === null);
  // A block that cannot appear ends the run: eight in column 0, and the ninth appears over it.
  const top = replay(wall, "00000000");
  ok("a full spawn column tops the run out", top !== null && top.over && top.toppedOut && top.next === 8);
  ok("nothing is placed after the run is over", replay(wall, "000000000") === null);

  // The drain: one dropped frame, then four delivered, clear it.
  const http: Kind[] = ["eth", "ipv4", "tcp", "http"];
  const drainDeal = inOrder([http, http, http, http, http]);
  // The first frame's Ethernet names IPv6 (option 1, digit 1): dropped; the next four are right (each header's option 0
  // names the next one here, so the digits are column * 4: 0, 4, 8 and c).
  const drainRun = replay(drainDeal, "148c" + "048c".repeat(4));
  ok("a dropped frame stays at the bottom", replay(drainDeal, "148c")?.jam.length === 1);
  ok("four delivered in a row clear it", !!drainRun && drainRun.jam.length === 0 && drainRun.drained === 1 && drainRun.delivered === 4 && drainRun.dropped === 1);
  // The scores of a streak: 100, 125, 150, 175 after a drop.
  ok("streak points 100, 125, 150, 175", drainRun?.score === 550);

  // The daily deals: 400 days from launch.
  let idleTopped = 0;
  // Each day.
  for (let d = 0; d < 400; d++) {
    // The day.
    const day = addDays(LAUNCH_DAY, d);
    // Built twice.
    const deal = dailyDeal(day);
    ok(`${day}: deterministic`, JSON.stringify(deal) === JSON.stringify(dailyDeal(day)));
    // Its size.
    ok(`${day}: ${DAILY_BLOCKS} blocks`, deal.length === DAILY_BLOCKS);
    // Every block well formed.
    ok(`${day}: blocks well formed`, deal.every((b) => KINDS.includes(b.kind) && Number.isInteger(b.spawn) && b.spawn >= 0 && b.spawn < COLS && b.init >= 0 && b.init < Math.max(1, OPTIONS[b.kind].length)));
    // Each bag: two blocks of each layer.
    for (let b = 0; b < DAILY_BLOCKS; b += 2 * COLS) {
      // The bag's layers.
      const layers = deal.slice(b, b + 2 * COLS).map((x) => LAYER_OF[x.kind]);
      // Two of each.
      ok(`${day}: bag ${b / 8} has two of each layer`, [0, 1, 2, 3].every((c) => layers.filter((l) => l === c).length === 2));
    }
    // Played from the screen: never a guess, every frame delivered, the perfect score.
    const screen = playFromScreen(deal);
    ok(`${day}: the screen always shows the block a field must name`, screen.blind === 0);
    ok(`${day}: played from the screen, all ${DAILY_FRAMES} frames delivered`, screen.run.over && !screen.run.toppedOut && screen.run.delivered === DAILY_FRAMES && screen.run.dropped === 0);
    ok(`${day}: the perfect score`, screen.run.score === perfectScore(DAILY_FRAMES));
    // The same run replayed from its placements.
    ok(`${day}: replay gives the same run`, JSON.stringify(replay(deal, screen.run.moves)) === JSON.stringify(screen.run));
    // Untouched, the blocks do far worse.
    const idle = playIdle(deal);
    ok(`${day}: an untouched run scores less`, idle.score < screen.run.score && idle.delivered < DAILY_FRAMES);
    // Counted when it fills the well.
    if (idle.toppedOut) idleTopped++;
  }
  // The well is a real threat: untouched runs fill it on most days.
  ok(`untouched runs top out on most days (${idleTopped} of 400)`, idleTopped >= 300);

  // Practice deals: 100 seeds, the whole deal played from the screen.
  for (let k = 0; k < 100; k++) {
    // A seed far from the others.
    const seed = Math.imul(k + 1, 0x9e3779b1) >>> 0;
    // Built twice.
    const deal = practiceDeal(seed);
    ok(`seed ${seed}: deterministic`, JSON.stringify(deal) === JSON.stringify(practiceDeal(seed)));
    // Its size.
    ok(`seed ${seed}: size`, deal.length === PRACTICE_BAGS * 2 * COLS);
    // Played from the screen.
    const screen = playFromScreen(deal);
    ok(`seed ${seed}: played from the screen, every frame delivered`, screen.blind === 0 && screen.run.delivered === PRACTICE_BAGS * 2 && screen.run.dropped === 0);
  }

  // The report.
  return { checked, failures };
}
