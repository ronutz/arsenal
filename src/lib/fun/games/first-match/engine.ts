// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/fun/games/first-match/engine.ts
// ----------------------------------------------------------------------------
// FIRST MATCH (PRIME 03/11/2026): access-list rule ordering, part puzzle, part
// tower defence. A level states a policy in plain words and deals a hand of
// Cisco IOS extended access-list entries, some of them traps (too broad, the
// wrong port, the port on the wrong side, a subnet mask where a wildcard
// belongs, a deny that shadows a permit). The player picks entries and orders
// them, then sends a wave of packets; each packet is judged first-match.
//
// THE JUDGE IS THE SITE'S OWN ENGINE: every verdict comes from
// analyseAclLocalisable() in src/lib/tools/acl-first-match-evaluator/compute.ts
// (its parser, its walk, its implicit deny, its empty-list rule). Nothing here
// re-decides a packet. The solver below searches orderings quickly with a
// match table that the same engine fills in (does entry c alone match packet
// p?), and every solution it reports is confirmed by the engine on the whole
// list before the self-test accepts it.
//
// THE DAILY LEVEL is generated from dailyRng("first-match", day): a policy of
// two or three clauses (a service to a server from a source, sometimes with
// one excepted host), the cards that implement it, two to four traps drawn
// from the kinds above, and a wave of packets with a probe aimed at every
// trap. A generated level is kept only when the engine proves it solvable,
// every trap is out of every shortest solution, and every trap does harm
// (put first, or swapped for the entry it imitates, it misjudges a packet);
// after a bounded number of attempts it falls back to a hand-made level.
//
// Pure and deterministic: no DOM, no clock, no Math.random.
// ============================================================================

// The site's access-list engine: the reading, the walk and the verdict.
import { analyseAclLocalisable, type AclPacketInput } from "../../../tools/acl-first-match-evaluator/compute";
// The daily seed and the seeded generator.
import { dailyRng, addDays, LAUNCH_DAY, type Rng } from "../../daily";
// The self-test's report shape.
import type { SelfTestReport } from "../../registry";

/** The game's stable id. */
export const FM_ID = "first-match";

/** What a packet should meet, or met. */
export type FmAction = "permit" | "deny";

/** One packet of a wave. */
export interface FmPacket {
  /** tcp, udp or icmp. */
  proto: "tcp" | "udp" | "icmp";
  /** The source address. */
  src: string;
  /** The destination address. */
  dst: string;
  /** The source port (TCP and UDP), else null. */
  sport: number | null;
  /** The destination port (TCP and UDP), else null. */
  dport: number | null;
  /** TCP only: ACK or RST set (a reply) or not (an opening SYN); null for UDP and ICMP. */
  ack: boolean | null;
  /** The verdict the policy asks for. */
  expect: FmAction;
}

/** One card of the hand: an access-list entry as typed after the sequence number. */
export interface FmCard {
  /** A stable id inside the level ("c1", "c2", ...). */
  id: string;
  /** The entry, for example "permit tcp any host 10.0.0.10 eq 80". */
  line: string;
  /** Whether the level designer meant it as a trap (the self-test proves each one). */
  trap: boolean;
  /** For a trap: the id of the correct card it imitates (swapping them must break the list), or null. */
  imitates: string | null;
}

/** Where a daily clause's traffic may come from. */
export interface FmSource {
  /** anywhere, a /24 network, or one host. */
  kind: "any" | "net" | "host";
  /** The network or host address (0.0.0.0 for anywhere). */
  addr: string;
}

/** The services a daily clause can name. */
export type FmService = "web" | "https" | "ssh" | "dns" | "ntp" | "smtp";

/** One clause of a generated policy: a service, to a server, from a source, maybe minus one host. */
export interface FmClause {
  /** The service. */
  svc: FmService;
  /** The server's address. */
  host: string;
  /** Who may reach it. */
  src: FmSource;
  /** One host of that source that may not, or null. */
  except: string | null;
}

/** A level: hand-made (key l01 to l20) or the day's (key "daily"). */
export interface FmLevel {
  /** l01 ... l20, or daily. */
  key: string;
  /** The hand, in the order shown. */
  cards: FmCard[];
  /** The wave, in the order it is sent. */
  packets: FmPacket[];
  /** The fewest entries that pass, proven by the self-test. */
  par: number;
  /** The generated policy (daily only); a hand level's policy is in the message pack. */
  clauses: FmClause[] | null;
}

/** How the engine judged one packet against the player's list. */
export interface FmJudgement {
  /** What happened to the packet. */
  action: FmAction;
  /** What decided: an entry, the implicit deny, or the empty-list rule. */
  by: "entry" | "implicit-deny" | "empty-list";
  /** The 0-based position in the player's list of the deciding entry, or null. */
  rule: number | null;
  /** Whether that is what the policy asked for. */
  correct: boolean;
}

/** The services: protocol, port, and a near-miss port the "wrong port" trap uses. */
export const SERVICES: Readonly<Record<FmService, { proto: "tcp" | "udp"; port: number; near: number }>> = Object.freeze({
  web: { proto: "tcp", port: 80, near: 8080 }, // HTTP, and the port people confuse it with
  https: { proto: "tcp", port: 443, near: 8443 }, // HTTPS
  ssh: { proto: "tcp", port: 22, near: 2222 }, // SSH
  dns: { proto: "udp", port: 53, near: 5353 }, // DNS over UDP
  ntp: { proto: "udp", port: 123, near: 124 }, // NTP, and the next port up
  smtp: { proto: "tcp", port: 25, near: 2525 }, // SMTP
}); // SERVICES

/** The list name the game writes above the player's entries. */
const LIST_HEADER = "ip access-list extended FIRST-MATCH";

/**
 * The text of an access list from entries, as the engine reads it: a named extended block.
 *
 * @param lines the entries, top first
 * @returns the configuration text
 */
export function aclText(lines: readonly string[]): string {
  // The header line, then one entry per line (the engine numbers them 10, 20, ...).
  return [LIST_HEADER, ...lines].join("\n");
}

/**
 * A packet in the engine's input form.
 *
 * @param p the packet
 * @returns the engine's packet input
 */
function packetInput(p: FmPacket): AclPacketInput {
  // Ports as text, as the engine reads typed fields; ACK or RST only for TCP.
  return { protocol: p.proto, source: p.src, destination: p.dst, sourcePort: p.sport === null ? "" : String(p.sport), destinationPort: p.dport === null ? "" : String(p.dport), ackOrRst: p.ack === true };
}

/**
 * Judge a wave against a list: the site's engine walks the list for each packet.
 *
 * @param lines the player's entries, top first
 * @param packets the wave
 * @returns one judgement per packet
 */
export function judge(lines: readonly string[], packets: readonly FmPacket[]): FmJudgement[] {
  // The list text, built once.
  const acl = aclText(lines);
  // Each packet through the engine.
  return packets.map((p) => {
    // The engine's reading of this list and this packet.
    const reading = analyseAclLocalisable({ acl, packet: packetInput(p) });
    // The verdict; with a list and a valid packet the engine always gives one.
    const v = reading.verdict;
    // A missing verdict would be a defect in the level data: judged as a failure, never hidden.
    if (!v) return { action: "deny", by: "implicit-deny", rule: null, correct: false };
    // Line 1 is the header, so the entry on line n is the player's entry n - 2 (0-based).
    const rule = v.line === null ? null : v.line - 2;
    // The judgement.
    return { action: v.action, by: v.by, rule, correct: v.action === p.expect };
  });
}

/**
 * Whether every card of a hand reads cleanly: one list, every line an entry, no line refused.
 *
 * @param cards the hand
 * @returns null when clean, else a description of the problem
 */
export function handProblem(cards: readonly FmCard[]): string | null {
  // The whole hand as one list.
  const reading = analyseAclLocalisable({ acl: aclText(cards.map((c) => c.line)) });
  // Any line not read (a typo, a duplicate entry) is a defect.
  if (reading.issues.length > 0) return `line not read: ${reading.issues[0].text}`;
  // Exactly one list, holding every card.
  if (reading.lists.length !== 1 || reading.lists[0].entries.length !== cards.length) return "the hand does not read as one list";
  // Clean.
  return null;
}

// ---------------------------------------------------------------------------
// The solver: shortest passing lists, searched on an engine-filled match table.
// ---------------------------------------------------------------------------

/** What the solver needs about a level, filled in by the engine. */
interface MatchTable {
  /** matches[c][p]: card c, alone in a list, decides packet p (the engine's verdict is by that entry). */
  matches: boolean[][];
  /** The action of each card, as the engine read it. */
  actions: FmAction[];
}

/**
 * Fill the match table with the engine.
 *
 * @param level the level
 * @returns the table
 */
function matchTable(level: FmLevel): MatchTable {
  // Each card's action, read by the engine from the card alone.
  const actions = level.cards.map((c) => analyseAclLocalisable({ acl: aclText([c.line]) }).lists[0]?.entries[0]?.action ?? "deny");
  // For each card, which packets it decides when alone.
  const matches = level.cards.map((c) => judge([c.line], level.packets).map((j) => j.by === "entry"));
  // The table.
  return { matches, actions };
}

/**
 * Whether an ordering of cards (indices) passes, on the match table: the first card that matches decides, an empty
 * list permits (Cisco: an empty list permits all traffic), and a list that nothing matches denies (the implicit deny).
 *
 * @param t the table
 * @param order the card indices, top first
 * @param packets the wave
 * @returns true when every packet gets its expected verdict
 */
function passesOnTable(t: MatchTable, order: readonly number[], packets: readonly FmPacket[]): boolean {
  // Each packet in turn.
  for (let p = 0; p < packets.length; p++) {
    // The empty list permits; otherwise the implicit deny unless an entry matches.
    let action: FmAction = order.length === 0 ? "permit" : "deny";
    // The first matching entry decides.
    for (const c of order) {
      // A match: its action, and nothing below it is read.
      if (t.matches[c][p]) { action = t.actions[c]; break; }
    }
    // One wrong verdict fails the ordering.
    if (action !== packets[p].expect) return false;
  }
  // Every packet as the policy asks.
  return true;
}

/**
 * Every ordering of k distinct cards out of n, depth first; the visitor returns true to stop early.
 *
 * @param n how many cards
 * @param k how many to pick
 * @param visit called with each ordering
 * @returns true when the visitor stopped the walk
 */
function eachOrdering(n: number, k: number, visit: (order: number[]) => boolean): boolean {
  // The ordering being built.
  const order: number[] = [];
  // Which cards are in it.
  const used = new Array<boolean>(n).fill(false);
  // One level of the walk.
  const step = (): boolean => {
    // A full ordering: visit it.
    if (order.length === k) return visit(order.slice());
    // Each unused card in the next position.
    for (let c = 0; c < n; c++) {
      // Already placed.
      if (used[c]) continue;
      // Place it.
      used[c] = true;
      order.push(c);
      // Deeper; stop everything when the visitor asked to.
      const stop = step();
      // Take it back.
      order.pop();
      used[c] = false;
      // Propagate a stop.
      if (stop) return true;
    }
    // Not stopped.
    return false;
  };
  // From the empty ordering.
  return step();
}

/** What the solver found. */
export interface FmSolution {
  /** The fewest entries that pass, or -1 when nothing passes. */
  par: number;
  /** Every passing ordering of that length (card indices, top first). */
  shortest: number[][];
}

/**
 * The shortest passing lists of a level.
 *
 * @param level the level
 * @param t its match table (filled by the engine)
 * @returns the length and every passing ordering of that length
 */
function shortestOn(level: FmLevel, t: MatchTable): FmSolution {
  // Lengths from zero up: the first length with any passing ordering is the par.
  for (let k = 0; k <= level.cards.length; k++) {
    // The passing orderings of this length.
    const found: number[][] = [];
    // Walk them all (at most 7 cards: 5,040 orderings of length 7).
    eachOrdering(level.cards.length, k, (order) => {
      // Keep the passing ones.
      if (passesOnTable(t, order, level.packets)) found.push(order);
      // Never stop early: the self-test wants all of them.
      return false;
    });
    // The shortest length found.
    if (found.length > 0) return { par: k, shortest: found };
  }
  // Nothing passes.
  return { par: -1, shortest: [] };
}

/**
 * The shortest passing lists of a level (the public form, filling the table first).
 *
 * @param level the level
 * @returns the solution
 */
export function solve(level: FmLevel): FmSolution {
  // Table, then search.
  return shortestOn(level, matchTable(level));
}

/**
 * Prove a level: it reads, it is solvable at its par, the engine agrees with the table, and every trap is out of
 * every shortest list and does harm.
 *
 * @param level the level
 * @returns the problems found (empty when proven)
 */
export function proveLevel(level: FmLevel): string[] {
  // The problems.
  const out: string[] = [];
  // Every card reads, and no two are the same entry.
  const hp = handProblem(level.cards);
  // A hand that does not read cannot be judged.
  if (hp) return [`${level.key}: ${hp}`];
  // The packets must be well formed for the engine (ports for TCP and UDP only).
  for (const p of level.packets) {
    // TCP and UDP carry ports; ICMP does not.
    const l4 = p.proto === "tcp" || p.proto === "udp";
    // A mismatch is a data error.
    if (l4 !== (p.sport !== null && p.dport !== null)) out.push(`${level.key}: packet ${p.src} > ${p.dst} has ports that do not fit ${p.proto}`);
    // ACK or RST is a TCP field.
    if ((p.proto === "tcp") !== (p.ack !== null)) out.push(`${level.key}: packet ${p.src} > ${p.dst} has a TCP flag that does not fit ${p.proto}`);
  }
  // Both verdicts should appear in a wave, or the level teaches nothing about the other.
  if (!level.packets.some((p) => p.expect === "permit") && level.par !== 0) out.push(`${level.key}: no packet should be permitted`);
  // The engine-filled table.
  const t = matchTable(level);
  // The shortest lists.
  const sol = shortestOn(level, t);
  // Unsolvable is the worst failure.
  if (sol.par < 0) return [...out, `${level.key}: no list of the cards passes`];
  // The declared par must be the proven one.
  if (sol.par !== level.par) out.push(`${level.key}: par is ${level.par} but the shortest passing list has ${sol.par} entries`);
  // Every shortest list, confirmed by the engine on the whole list (the table must agree with the full walk).
  for (const order of sol.shortest) {
    // The engine's verdicts on the full list.
    const js = judge(order.map((i) => level.cards[i].line), level.packets);
    // Each must be correct.
    if (!js.every((j) => j.correct)) out.push(`${level.key}: the engine rejects the solution ${order.join(",")}`);
  }
  // The reference: the first shortest list.
  const ref = sol.shortest[0];
  // Each trap.
  level.cards.forEach((card, i) => {
    // Only the traps are proven.
    if (!card.trap) return;
    // (a) Out of every shortest list.
    if (sol.shortest.some((o) => o.includes(i))) out.push(`${level.key}: trap ${card.id} (${card.line}) is part of a shortest passing list`);
    // (b) Harm: put first above the reference, it misjudges a packet ...
    const first = judge([card.line, ...ref.map((r) => level.cards[r].line)], level.packets).some((j) => !j.correct);
    // ... or swapped for the card it imitates, it misjudges a packet.
    const twin = card.imitates === null ? -1 : level.cards.findIndex((c) => c.id === card.imitates);
    // The swap, when the imitated card is in the reference.
    const swapped = twin >= 0 && ref.includes(twin) && judge(ref.map((r) => level.cards[r === twin ? i : r].line), level.packets).some((j) => !j.correct);
    // Harmless both ways is not a trap.
    if (!first && !swapped) out.push(`${level.key}: trap ${card.id} (${card.line}) does no harm first or swapped in`);
  });
  // The findings.
  return out;
}

// ---------------------------------------------------------------------------
// The twenty hand-made levels.
// ---------------------------------------------------------------------------

/**
 * A TCP packet.
 *
 * @param src source address
 * @param sport source port
 * @param dst destination address
 * @param dport destination port
 * @param expect the verdict the policy asks for
 * @param ack ACK or RST set (a reply); false for an opening SYN
 * @returns the packet
 */
function tcp(src: string, sport: number, dst: string, dport: number, expect: FmAction, ack = false): FmPacket {
  // A TCP packet.
  return { proto: "tcp", src, dst, sport, dport, ack, expect };
}

/**
 * A UDP packet.
 *
 * @param src source address
 * @param sport source port
 * @param dst destination address
 * @param dport destination port
 * @param expect the verdict the policy asks for
 * @returns the packet
 */
function udp(src: string, sport: number, dst: string, dport: number, expect: FmAction): FmPacket {
  // A UDP packet: no TCP flags.
  return { proto: "udp", src, dst, sport, dport, ack: null, expect };
}

/**
 * An ICMP packet.
 *
 * @param src source address
 * @param dst destination address
 * @param expect the verdict the policy asks for
 * @returns the packet
 */
function icmp(src: string, dst: string, expect: FmAction): FmPacket {
  // An ICMP packet: no ports, no TCP flags.
  return { proto: "icmp", src, dst, sport: null, dport: null, ack: null, expect };
}

/** A card as the level table writes it: the entry, and for a trap the 1-based index of the card it imitates (0: none). */
type CardSpec = [line: string, trap?: number];

/**
 * A level from its table form.
 *
 * @param key l01 ... l20
 * @param par the fewest entries that pass
 * @param specs the cards (a second element marks a trap, naming the card it imitates, 1-based, or 0)
 * @param packets the wave
 * @returns the level
 */
function level(key: string, par: number, specs: CardSpec[], packets: FmPacket[]): FmLevel {
  // Cards numbered c1, c2, ... in the order written.
  const cards = specs.map(([line, trap], i): FmCard => ({ id: `c${i + 1}`, line, trap: trap !== undefined, imitates: trap ? `c${trap}` : null }));
  // The level.
  return { key, cards, packets, par, clauses: null };
}

/** The address documentation ranges used for outside hosts (RFC 5737) and the private ranges inside (RFC 1918). */
const WEB = "10.0.0.10"; // the web server

/** The twenty levels, in teaching order. Each policy and lesson is in the pack under levels.<key>. */
export const LEVELS: readonly FmLevel[] = Object.freeze([
  // 1. The implicit deny: one permit is the whole answer.
  level("l01", 1, [["permit ip any any", 0], ["permit tcp any host 10.0.0.10 eq 80"], ["deny tcp any host 10.0.0.10 eq 80", 0]], [
    tcp("203.0.113.7", 51514, WEB, 80, "permit"), tcp("198.51.100.20", 49200, WEB, 80, "permit"), tcp("203.0.113.7", 51515, WEB, 22, "deny"),
    udp("192.0.2.9", 5353, WEB, 53, "deny"), icmp("198.51.100.20", WEB, "deny"),
  ]),
  // 2. Ports and hosts: leave either out and the entry grows.
  level("l02", 2, [["permit tcp any host 10.0.0.10", 2], ["permit tcp any host 10.0.0.10 eq 443"], ["permit tcp any any eq 443", 2], ["permit tcp any host 10.0.0.10 eq 80"]], [
    tcp("203.0.113.40", 50001, WEB, 80, "permit"), tcp("198.51.100.3", 50002, WEB, 443, "permit"), tcp("203.0.113.40", 50003, WEB, 22, "deny"),
    tcp("198.51.100.3", 50004, "10.0.0.11", 443, "deny"), tcp("192.0.2.77", 50005, WEB, 8080, "deny"),
  ]),
  // 3. Order: the deny for one host goes above the permit.
  level("l03", 2, [["permit tcp any host 10.0.0.10 eq 80"], ["deny ip any any", 0], ["deny ip host 203.0.113.66 any"]], [
    tcp("203.0.113.66", 40000, WEB, 80, "deny"), tcp("198.51.100.4", 40001, WEB, 80, "permit"), tcp("203.0.113.67", 40002, WEB, 80, "permit"),
    tcp("203.0.113.66", 40003, WEB, 443, "deny"), tcp("192.0.2.1", 40004, WEB, 443, "deny"),
  ]),
  // 4. Shadowing: a broad deny above the permits hides them.
  level("l04", 2, [["deny tcp any host 10.0.0.10", 0], ["permit tcp host 10.1.20.5 host 10.0.0.10 eq 22"], ["permit tcp any host 10.0.0.10 eq 22", 2], ["permit tcp any host 10.0.0.10 eq 80"]], [
    tcp("10.1.20.5", 50100, WEB, 22, "permit"), tcp("10.1.20.6", 50101, WEB, 22, "deny"), tcp("203.0.113.9", 50102, WEB, 22, "deny"),
    tcp("203.0.113.9", 50103, WEB, 80, "permit"), tcp("10.1.20.5", 50104, WEB, 80, "permit"), tcp("10.1.20.5", 50105, WEB, 3389, "deny"),
  ]),
  // 5. Wildcards: /24 is 0.0.0.255, not 255.255.255.0.
  level("l05", 1, [["permit tcp 10.1.20.0 255.255.255.0 host 10.0.0.20 eq 22", 2], ["permit tcp 10.1.20.0 0.0.0.255 host 10.0.0.20 eq 22"], ["permit tcp 10.1.0.0 0.0.255.255 host 10.0.0.20 eq 22", 2], ["permit tcp host 10.1.20.0 host 10.0.0.20 eq 22", 2]], [
    tcp("10.1.20.7", 50200, "10.0.0.20", 22, "permit"), tcp("10.1.20.200", 50201, "10.0.0.20", 22, "permit"), tcp("10.1.21.7", 50202, "10.0.0.20", 22, "deny"),
    tcp("10.1.30.0", 50203, "10.0.0.20", 22, "deny"), tcp("203.0.113.0", 50204, "10.0.0.20", 22, "deny"),
  ]),
  // 6. host, the protocol, and a port name.
  level("l06", 1, [["permit tcp any host 10.0.0.53 eq 53", 2], ["permit udp any host 10.0.0.53 eq domain"], ["permit udp any 10.0.0.53 0.0.0.255 eq 53", 2], ["permit udp any host 10.0.0.53 eq 123", 2]], [
    udp("203.0.113.30", 40000, "10.0.0.53", 53, "permit"), udp("198.51.100.8", 53000, "10.0.0.53", 53, "permit"), tcp("198.51.100.8", 53001, "10.0.0.53", 53, "deny"),
    udp("203.0.113.30", 40001, "10.0.0.54", 53, "deny"), udp("192.0.2.12", 40002, "10.0.0.53", 123, "deny"),
  ]),
  // 7. The port belongs to the address it follows.
  level("l07", 1, [["permit tcp any eq 80 host 10.0.0.10", 2], ["permit tcp any host 10.0.0.10 eq 80"], ["permit tcp host 10.0.0.10 eq 80 any", 2]], [
    tcp("203.0.113.50", 51000, WEB, 80, "permit"), tcp("198.51.100.77", 80, WEB, 3389, "deny"), tcp(WEB, 80, "203.0.113.50", 51000, "deny", true),
    tcp("192.0.2.31", 52000, WEB, 80, "permit"),
  ]),
  // 8. gt and lt leave out the port they name.
  level("l08", 1, [["permit tcp 10.1.30.0 0.0.0.255 host 10.0.0.30 gt 1024", 2], ["permit tcp 10.1.30.0 0.0.0.255 host 10.0.0.30 gt 1023"], ["permit tcp 10.1.30.0 0.0.0.255 host 10.0.0.30 lt 1024", 2], ["permit tcp 10.1.30.0 0.0.0.255 host 10.0.0.30 range 1023 65535", 2]], [
    tcp("10.1.30.4", 40000, "10.0.0.30", 1024, "permit"), tcp("10.1.30.4", 40001, "10.0.0.30", 50000, "permit"), tcp("10.1.30.4", 40002, "10.0.0.30", 1023, "deny"),
    tcp("10.1.30.4", 40003, "10.0.0.30", 22, "deny"), tcp("10.1.31.4", 40004, "10.0.0.30", 5000, "deny"),
  ]),
  // 9. range includes both ends.
  level("l09", 1, [["permit udp 10.1.40.0 0.0.0.255 host 10.0.0.40 gt 16384", 3], ["permit tcp 10.1.40.0 0.0.0.255 host 10.0.0.40 range 16384 32767", 3], ["permit udp 10.1.40.0 0.0.0.255 host 10.0.0.40 range 16384 32767"], ["permit udp 10.1.40.0 0.0.0.255 host 10.0.0.40 range 16384 65535", 3]], [
    udp("10.1.40.11", 16500, "10.0.0.40", 16384, "permit"), udp("10.1.40.11", 16502, "10.0.0.40", 32767, "permit"), udp("10.1.40.12", 16504, "10.0.0.40", 20000, "permit"),
    udp("10.1.40.11", 16506, "10.0.0.40", 32768, "deny"), tcp("10.1.40.11", 16508, "10.0.0.40", 20000, "deny"), udp("10.1.41.11", 16510, "10.0.0.40", 20000, "deny"),
  ]),
  // 10. neq: everything but the ports named, in one entry.
  level("l10", 1, [["permit tcp 10.1.50.0 0.0.0.255 host 10.0.0.50", 0], ["permit tcp 10.1.50.0 0.0.0.255 host 10.0.0.50 neq 23"], ["deny tcp 10.1.50.0 0.0.0.255 host 10.0.0.50 eq 23"], ["permit tcp 10.1.50.0 0.0.0.255 host 10.0.0.50 eq telnet", 2]], [
    tcp("10.1.50.9", 41000, "10.0.0.50", 22, "permit"), tcp("10.1.50.9", 41001, "10.0.0.50", 443, "permit"), tcp("10.1.50.9", 41002, "10.0.0.50", 23, "deny"),
    udp("10.1.50.9", 41003, "10.0.0.50", 161, "deny"), tcp("10.1.51.9", 41004, "10.0.0.50", 22, "deny"),
  ]),
  // 11. eq takes several ports (IOS XE: up to 10).
  level("l11", 1, [["permit tcp any host 10.0.0.25 eq 25"], ["permit tcp any host 10.0.0.25 range 25 993", 0], ["permit tcp any host 10.0.0.25 eq 587"], ["permit tcp any host 10.0.0.25 eq 25 587 993"], ["permit tcp any host 10.0.0.25 eq 993"]], [
    tcp("203.0.113.25", 42000, "10.0.0.25", 25, "permit"), tcp("198.51.100.25", 42001, "10.0.0.25", 587, "permit"), tcp("192.0.2.25", 42002, "10.0.0.25", 993, "permit"),
    tcp("203.0.113.25", 42003, "10.0.0.25", 110, "deny"), tcp("198.51.100.25", 42004, "10.0.0.25", 143, "deny"), tcp("192.0.2.25", 42005, "10.0.0.25", 443, "deny"),
  ]),
  // 12. A wildcard of 7 covers eight addresses from a multiple of eight.
  level("l12", 2, [["permit tcp any 10.0.0.0 0.0.0.15 eq 80", 3], ["permit tcp any 10.0.0.8 0.0.0.8 eq 443", 4], ["permit tcp any 10.0.0.8 0.0.0.7 eq 80"], ["permit tcp any 10.0.0.8 0.0.0.7 eq 443"], ["permit tcp any host 10.0.0.10 eq 80"]], [
    tcp("203.0.113.12", 43000, "10.0.0.9", 80, "permit"), tcp("198.51.100.12", 43001, "10.0.0.15", 443, "permit"), tcp("192.0.2.12", 43002, "10.0.0.12", 443, "permit"),
    tcp("203.0.113.12", 43003, "10.0.0.7", 80, "deny"), tcp("198.51.100.12", 43004, "10.0.0.16", 80, "deny"), tcp("192.0.2.12", 43005, "10.0.0.0", 443, "deny"),
    tcp("203.0.113.12", 43006, WEB, 22, "deny"),
  ]),
  // 13. Nested exceptions: narrowest first.
  level("l13", 3, [["permit tcp any host 10.0.0.10 eq 80"], ["permit ip host 198.51.100.7 any", 3], ["deny ip 198.51.100.0 0.0.0.255 any"], ["permit tcp host 198.51.100.7 host 10.0.0.10 eq 80"]], [
    tcp("198.51.100.7", 44000, WEB, 80, "permit"), tcp("198.51.100.8", 44001, WEB, 80, "deny"), tcp("203.0.113.5", 44002, WEB, 80, "permit"),
    tcp("198.51.100.7", 44003, WEB, 22, "deny"), tcp("203.0.113.5", 44004, WEB, 443, "deny"),
  ]),
  // 14. icmp is one protocol; ip is all of them.
  level("l14", 2, [["permit ip host 10.1.20.9 10.0.0.0 0.0.0.255", 2], ["permit icmp host 10.1.20.9 10.0.0.0 0.0.0.255"], ["permit icmp any any", 2], ["permit tcp any host 10.0.0.10 eq 80"], ["permit icmp host 10.1.20.9 10.0.0.0 0.0.0.0", 2]], [
    icmp("10.1.20.9", WEB, "permit"), icmp("10.1.20.9", "10.0.0.77", "permit"), icmp("203.0.113.4", WEB, "deny"),
    tcp("10.1.20.9", 50000, WEB, 22, "deny"), tcp("203.0.113.4", 50001, WEB, 80, "permit"),
  ]),
  // 15. established: replies in, openings out.
  level("l15", 1, [["permit tcp any 10.1.60.0 0.0.0.255", 2], ["permit tcp any 10.1.60.0 0.0.0.255 established"], ["permit tcp any eq 80 10.1.60.0 0.0.0.255", 2], ["permit ip any 10.1.60.0 0.0.0.255", 2]], [
    tcp("203.0.113.80", 443, "10.1.60.15", 51000, "permit", true), tcp("198.51.100.3", 80, "10.1.60.16", 52000, "permit", true), tcp("203.0.113.80", 51000, "10.1.60.15", 22, "deny"),
    tcp("198.51.100.3", 80, "10.1.60.16", 3389, "deny"), udp("203.0.113.80", 53, "10.1.60.15", 5000, "deny"), tcp("203.0.113.80", 443, "10.1.61.5", 51001, "deny", true),
  ]),
  // 16. The empty list: no entries, no implicit deny to reach.
  level("l16", 0, [["permit ip any any"], ["permit ip any 10.0.0.0 0.0.0.255"], ["deny ip any any", 0]], [
    tcp("203.0.113.16", 45000, WEB, 80, "permit"), udp("198.51.100.16", 45001, "10.0.0.53", 53, "permit"), icmp("192.0.2.16", "10.0.0.99", "permit"),
    tcp("10.1.20.16", 45002, "10.0.0.20", 22, "permit"),
  ]),
  // 17. established beats "gt 1023" for letting replies in.
  level("l17", 2, [["permit tcp any 10.1.60.0 0.0.0.255 gt 1023", 2], ["permit tcp any 10.1.60.0 0.0.0.255 established"], ["permit tcp any host 10.1.60.5 eq 22", 4], ["permit tcp 10.1.20.0 0.0.0.255 host 10.1.60.5 eq 22"]], [
    tcp("203.0.113.80", 443, "10.1.60.15", 51000, "permit", true), tcp("203.0.113.80", 51000, "10.1.60.15", 8080, "deny"), tcp("10.1.20.7", 50000, "10.1.60.5", 22, "permit"),
    tcp("203.0.113.81", 50000, "10.1.60.5", 22, "deny"), tcp("10.1.20.7", 22, "10.1.60.5", 50000, "permit", true),
  ]),
  // 18. Non-contiguous wildcard bits: one entry for four subnets.
  level("l18", 1, [["permit tcp host 10.1.0.5 host 10.0.0.20 eq 22"], ["permit tcp 10.1.0.0 0.0.3.255 host 10.0.0.20 eq 22", 4], ["permit tcp host 10.1.1.5 host 10.0.0.20 eq 22"], ["permit tcp 10.1.0.5 0.0.3.0 host 10.0.0.20 eq 22"], ["permit tcp host 10.1.2.5 host 10.0.0.20 eq 22"], ["permit tcp host 10.1.3.5 host 10.0.0.20 eq 22"]], [
    tcp("10.1.0.5", 46000, "10.0.0.20", 22, "permit"), tcp("10.1.3.5", 46001, "10.0.0.20", 22, "permit"), tcp("10.1.2.5", 46002, "10.0.0.20", 22, "permit"),
    tcp("10.1.2.6", 46003, "10.0.0.20", 22, "deny"), tcp("10.1.4.5", 46004, "10.0.0.20", 22, "deny"), tcp("10.1.1.5", 46005, "10.0.0.20", 23, "deny"),
  ]),
  // 19. A deny only has to sit above the permits it overrides.
  level("l19", 4, [["permit tcp any host 10.0.0.10", 4], ["permit udp any host 10.0.0.53 eq 53"], ["deny ip 203.0.113.0 0.0.0.255 any"], ["permit tcp any host 10.0.0.10 eq 80 443"], ["deny tcp any host 10.0.0.20 eq 22", 0], ["permit tcp 10.1.20.0 0.0.0.255 host 10.0.0.20 eq 22"], ["permit tcp any 10.0.0.0 0.0.0.255 eq 22", 6]], [
    tcp("203.0.113.9", 47000, WEB, 443, "deny"), udp("203.0.113.9", 47001, "10.0.0.53", 53, "permit"), tcp("198.51.100.9", 47002, WEB, 80, "permit"),
    tcp("198.51.100.9", 47003, WEB, 443, "permit"), tcp("10.1.20.4", 47004, "10.0.0.20", 22, "permit"), tcp("198.51.100.9", 47005, "10.0.0.20", 22, "deny"),
    tcp("198.51.100.9", 47006, WEB, 8443, "deny"),
  ]),
  // 20. Everything at once: a host exception above its network's deny, above the general permit.
  level("l20", 5, [["permit tcp any host 10.0.0.20 eq 22", 3], ["deny ip 192.0.2.0 0.0.0.255 any"], ["permit tcp 10.1.20.0 0.0.0.255 host 10.0.0.20 eq 22"], ["permit icmp host 10.1.20.9 10.0.0.0 0.0.0.255"], ["permit tcp host 192.0.2.44 host 10.0.0.20 eq 22"], ["permit ip 10.1.20.0 0.0.0.255 any", 4], ["permit tcp any host 10.0.0.10 eq 80"]], [
    tcp("192.0.2.44", 48000, "10.0.0.20", 22, "permit"), tcp("192.0.2.45", 48001, "10.0.0.20", 22, "deny"), tcp("192.0.2.44", 48002, WEB, 80, "deny"),
    tcp("198.51.100.3", 48003, WEB, 80, "permit"), tcp("10.1.20.33", 48004, "10.0.0.20", 22, "permit"), icmp("10.1.20.9", "10.0.0.53", "permit"),
    icmp("10.1.20.33", "10.0.0.53", "deny"), tcp("10.1.20.33", 48005, WEB, 80, "permit"), tcp("203.0.113.3", 48006, "10.0.0.20", 22, "deny"),
  ]),
]);

// ---------------------------------------------------------------------------
// The daily level.
// ---------------------------------------------------------------------------

/** The servers a daily clause can protect. */
const SERVERS = ["10.0.0.10", "10.0.0.20", "10.0.0.25", "10.0.0.53", "10.0.0.80"] as const;
/** The inside /24 networks a clause can name (third octet). */
const INSIDE_NETS = [10, 20, 30, 40, 50] as const;
/** The outside documentation networks (RFC 5737), as their first three octets. */
const OUTSIDE = ["192.0.2", "198.51.100", "203.0.113"] as const;
/** How many generation attempts before the fallback. */
const MAX_ATTEMPTS = 40;

/**
 * The wildcard form of a clause source, as an entry writes it.
 *
 * @param s the source
 * @returns any, host A, or A 0.0.0.255
 */
function sourceText(s: FmSource): string {
  // Each kind in Cisco syntax.
  return s.kind === "any" ? "any" : s.kind === "host" ? `host ${s.addr}` : `${s.addr} 0.0.0.255`;
}

/**
 * Whether an address is inside a clause source.
 *
 * @param s the source
 * @param ip the address
 * @returns true when inside
 */
function inSource(s: FmSource, ip: string): boolean {
  // Anywhere admits all; a host itself; a /24 its first three octets.
  return s.kind === "any" ? true : s.kind === "host" ? ip === s.addr : ip.split(".").slice(0, 3).join(".") === s.addr.split(".").slice(0, 3).join(".");
}

/**
 * The policy's own verdict on a packet: allowed when some clause names its protocol, port, server and source, and
 * the source is not that clause's excepted host. This is the policy read as plain words, not an access list.
 *
 * @param clauses the policy
 * @param p the packet
 * @returns permit or deny
 */
function policyVerdict(clauses: readonly FmClause[], p: Omit<FmPacket, "expect">): FmAction {
  // Any clause that allows it.
  const ok = clauses.some((c) => {
    // The clause's service.
    const s = SERVICES[c.svc];
    // Protocol, port, server, source, and not the excepted host.
    return p.proto === s.proto && p.dport === s.port && p.dst === c.host && inSource(c.src, p.src) && p.src !== c.except;
  });
  // Allowed or not.
  return ok ? "permit" : "deny";
}

/**
 * A random outside host (RFC 5737), never one of the excluded addresses.
 *
 * @param rng the generator
 * @param avoid addresses not to return
 * @returns the address
 */
function outsideHost(rng: Rng, avoid: readonly string[]): string {
  // A few tries are always enough with 762 addresses and a handful to avoid.
  for (let i = 0; i < 20; i++) {
    // A host in one of the three blocks.
    const ip = `${rng.pick(OUTSIDE)}.${rng.range(2, 250)}`;
    // Not one to avoid.
    if (!avoid.includes(ip)) return ip;
  }
  // A fixed address otherwise.
  return "203.0.113.251";
}

/**
 * A random host inside a clause source.
 *
 * @param rng the generator
 * @param s the source
 * @param avoid addresses not to return
 * @returns the address
 */
function hostIn(rng: Rng, s: FmSource, avoid: readonly string[]): string {
  // A host source has one address.
  if (s.kind === "host") return s.addr;
  // Anywhere: an outside host.
  if (s.kind === "any") return outsideHost(rng, avoid);
  // A /24: a host in it.
  const base = s.addr.split(".").slice(0, 3).join(".");
  // A few tries.
  for (let i = 0; i < 20; i++) {
    // A host number.
    const ip = `${base}.${rng.range(2, 250)}`;
    // Not one to avoid.
    if (!avoid.includes(ip)) return ip;
  }
  // A fixed one otherwise.
  return `${base}.251`;
}

/**
 * An ephemeral source port (49152 to 65535, the dynamic range).
 *
 * @param rng the generator
 * @returns the port
 */
function ephemeral(rng: Rng): number {
  // The dynamic range.
  return rng.range(49152, 65535);
}

/**
 * A packet of a service, from a source address to a server, judged by the policy.
 *
 * @param rng the generator
 * @param clauses the policy
 * @param proto the protocol
 * @param src the source
 * @param dst the destination
 * @param dport the destination port
 * @param sport the source port (default: ephemeral)
 * @returns the packet, with the policy's verdict
 */
function servicePacket(rng: Rng, clauses: readonly FmClause[], proto: "tcp" | "udp", src: string, dst: string, dport: number, sport?: number): FmPacket {
  // The packet without its verdict.
  const bare = { proto, src, dst, sport: sport ?? ephemeral(rng), dport, ack: proto === "tcp" ? false : null };
  // With the policy's verdict.
  return { ...bare, expect: policyVerdict(clauses, bare) };
}

/**
 * One attempt at a daily level.
 *
 * @param rng the day's generator
 * @returns the level (par still to be proven), or null when the draw did not fit
 */
function draftDaily(rng: Rng): FmLevel | null {
  // Two clauses usually, three sometimes.
  const count = rng.chance(0.35) ? 3 : 2;
  // Distinct services and servers.
  const svcs = rng.shuffle(Object.keys(SERVICES) as FmService[]).slice(0, count);
  // The servers, one per clause.
  const hosts = rng.shuffle(SERVERS).slice(0, count);
  // Distinct inside networks for the clauses that use one.
  const nets = rng.shuffle(INSIDE_NETS);
  // At most one exception in the level.
  const exceptAt = rng.chance(0.75) ? rng.int(count) : -1;
  // The clauses.
  const clauses: FmClause[] = svcs.map((svc, i) => {
    // The source kind: anywhere, a network or a host.
    const kind = rng.pick(["any", "any", "net", "net", "host"] as const);
    // The source.
    const src: FmSource = kind === "any" ? { kind, addr: "0.0.0.0" } : kind === "net" ? { kind, addr: `10.1.${nets[i]}.0` } : { kind, addr: `10.1.${nets[i]}.${rng.range(2, 250)}` };
    // An exception only from a source with more than one host.
    const except = i === exceptAt && kind !== "host" ? hostIn(rng, src, []) : null;
    // The clause.
    return { svc, host: hosts[i], src, except };
  });
  // The cards: correct ones first (they are shuffled at the end), then traps.
  const cards: { line: string; trap: boolean; imitates: number }[] = [];
  // The packets.
  const packets: FmPacket[] = [];
  // The index of each clause's permit card.
  const permitAt: number[] = [];
  // Every address already used as a packet source, so probes do not collide with exceptions.
  const excepted = clauses.map((c) => c.except).filter((e): e is string => e !== null);
  // Each clause: its deny (when excepted), its permit, its packets.
  clauses.forEach((c) => {
    // The service.
    const s = SERVICES[c.svc];
    // The excepted host's deny goes above the permit.
    if (c.except) cards.push({ line: `deny ${s.proto} host ${c.except} host ${c.host} eq ${s.port}`, trap: false, imitates: -1 });
    // The permit.
    permitAt.push(cards.length);
    cards.push({ line: `permit ${s.proto} ${sourceText(c.src)} host ${c.host} eq ${s.port}`, trap: false, imitates: -1 });
    // One or two packets the clause allows.
    const allowed = c.src.kind === "host" ? 1 : rng.range(1, 2);
    // Each, from a host of the source other than the excepted ones.
    for (let i = 0; i < allowed; i++) packets.push(servicePacket(rng, clauses, s.proto, hostIn(rng, c.src, excepted), c.host, s.port));
    // The excepted host knocking on the same service.
    if (c.except) packets.push(servicePacket(rng, clauses, s.proto, c.except, c.host, s.port));
  });
  // The trap kinds, with what each needs; drawn in a shuffled order and kept while they fit.
  const kinds = rng.shuffle(["portless", "anyDst", "nearPort", "wrongSide", "mask", "wideSrc", "otherProto", "shadow", "wideExcept"] as const);
  // How many traps to keep.
  const want = rng.range(2, 3);
  // Traps kept.
  let traps = 0;
  // Each kind in turn, until enough.
  for (const kind of kinds) {
    // Enough already.
    if (traps >= want || cards.length >= 7) break;
    // The clause it bends.
    const ci = rng.int(count);
    // That clause and its service.
    const c = clauses[ci];
    // Its service.
    const s = SERVICES[c.svc];
    // A source host for probes.
    const from = hostIn(rng, c.src, excepted);
    // The trap's card and its probe packet, or nothing when the kind does not apply.
    let line = "";
    // The probe.
    let probe: FmPacket | null = null;
    // Each kind.
    if (kind === "portless") {
      // No port: every port of the protocol on that server.
      line = `permit ${s.proto} ${sourceText(c.src)} host ${c.host}`;
      // A probe on another port.
      probe = servicePacket(rng, clauses, s.proto, from, c.host, s.near);
    } else if (kind === "anyDst") {
      // Any destination for that port.
      line = `permit ${s.proto} ${sourceText(c.src)} any eq ${s.port}`;
      // A probe to a server no clause gives this service.
      const other = SERVERS.find((h) => !clauses.some((x) => x.host === h)) ?? "10.0.0.99";
      // The probe.
      probe = servicePacket(rng, clauses, s.proto, from, other, s.port);
    } else if (kind === "nearPort") {
      // The neighbouring port instead of the right one.
      line = `permit ${s.proto} ${sourceText(c.src)} host ${c.host} eq ${s.near}`;
      // A probe on that wrong port.
      probe = servicePacket(rng, clauses, s.proto, from, c.host, s.near);
    } else if (kind === "wrongSide") {
      // The port after the source: it tests the source port.
      line = `permit ${s.proto} ${sourceText(c.src)} eq ${s.port} host ${c.host}`;
      // A probe whose source port is the service port, aimed at another port.
      probe = servicePacket(rng, clauses, s.proto, from, c.host, 3389, s.port);
    } else if (kind === "mask" && c.src.kind === "net") {
      // A subnet mask written where the wildcard goes: it matches every address ending in .0.
      line = `permit ${s.proto} ${c.src.addr} 255.255.255.0 host ${c.host} eq ${s.port}`;
      // A probe from another network's .0 address.
      probe = servicePacket(rng, clauses, s.proto, "10.7.7.0", c.host, s.port);
    } else if (kind === "wideSrc" && c.src.kind !== "any") {
      // Anywhere instead of the named source.
      line = `permit ${s.proto} any host ${c.host} eq ${s.port}`;
      // A probe from outside.
      probe = servicePacket(rng, clauses, s.proto, outsideHost(rng, excepted), c.host, s.port);
    } else if (kind === "otherProto") {
      // The other transport protocol.
      const other = s.proto === "tcp" ? "udp" : "tcp";
      // Its card.
      line = `permit ${other} ${sourceText(c.src)} host ${c.host} eq ${s.port}`;
      // A probe over that protocol.
      probe = servicePacket(rng, clauses, other, from, c.host, s.port);
    } else if (kind === "shadow") {
      // "Nothing else" written as a broad deny: above the permits it hides them.
      line = `deny ${s.proto} any host ${c.host}`;
    } else if (kind === "wideExcept" && c.except) {
      // The exception widened to everything: it also blocks what another clause allows that host.
      const open = clauses.find((x) => x !== c && inSource(x.src, c.except!));
      // Only when another clause would let that host in.
      if (open) {
        // The card.
        line = `deny ip host ${c.except} any`;
        // The probe: the excepted host using the other clause.
        probe = servicePacket(rng, clauses, SERVICES[open.svc].proto, c.except, open.host, SERVICES[open.svc].port);
      }
    }
    // A kind that did not apply.
    if (!line) continue;
    // A duplicate of an existing card (the same text) is skipped.
    if (cards.some((x) => x.line === line)) continue;
    // The trap card; the wrong-port, wrong-side, mask, wide-source and other-protocol kinds imitate the clause's permit.
    cards.push({ line, trap: true, imitates: ["nearPort", "wrongSide", "mask", "otherProto", "portless", "anyDst", "wideSrc"].includes(kind) ? permitAt[ci] : -1 });
    // Its probe.
    if (probe) packets.push(probe);
    // One more trap.
    traps++;
  }
  // At least two traps, or the level is too easy.
  if (traps < 2) return null;
  // An ICMP ping from outside to a server: nothing allows it.
  if (rng.chance(0.5)) packets.push({ proto: "icmp", src: outsideHost(rng, excepted), dst: rng.pick(hosts), sport: null, dport: null, ack: null, expect: "deny" });
  // No more than nine packets in a wave.
  if (packets.length > 9) return null;
  // Both verdicts in the wave.
  if (!packets.some((p) => p.expect === "permit") || !packets.some((p) => p.expect === "deny")) return null;
  // The display order of the cards.
  const order = rng.shuffle(cards.map((_, i) => i));
  // The card ids follow the display order, so "c1" is the first card shown.
  const idOf = new Map(order.map((orig, shown) => [orig, `c${shown + 1}`]));
  // The cards, shuffled, with their ids and the id of the card each trap imitates.
  const shown: FmCard[] = order.map((orig) => ({ id: idOf.get(orig)!, line: cards[orig].line, trap: cards[orig].trap, imitates: cards[orig].imitates >= 0 ? idOf.get(cards[orig].imitates)! : null }));
  // The level, par still unknown.
  return { key: "daily", cards: shown, packets: rng.shuffle(packets), par: -1, clauses };
}

/**
 * The fallback daily level: hand level 19, which the self-test proves on every run.
 *
 * @returns the level, keyed daily
 */
function fallbackDaily(): FmLevel {
  // A copy of level 19 under the daily key.
  return { ...LEVELS[18], key: "daily" };
}

/**
 * The daily level of a day, and whether it is the fallback.
 *
 * @param dayKey the UTC day, YYYY-MM-DD
 * @returns the level and the fallback flag
 */
export function dailyLevelInfo(dayKey: string): { level: FmLevel; fallback: boolean } {
  // The day's generator.
  const rng = dailyRng(FM_ID, dayKey);
  // A bounded number of attempts.
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // One draft.
    const draft = draftDaily(rng);
    // A draw that did not fit.
    if (!draft) continue;
    // Its hand must read cleanly.
    if (handProblem(draft.cards)) continue;
    // Its shortest lists.
    const sol = solve(draft);
    // Unsolvable drafts are dropped (the generator never builds one, but the check is cheap).
    if (sol.par < 1) continue;
    // The proven par.
    const level = { ...draft, par: sol.par };
    // Every trap proven, every solution confirmed by the engine.
    if (proveLevel(level).length > 0) continue;
    // Kept.
    return { level, fallback: false };
  }
  // The bounded generator gives up: the known-good level.
  return { level: fallbackDaily(), fallback: true };
}

/**
 * The daily level of a day.
 *
 * @param dayKey the UTC day
 * @returns the level
 */
export function dailyLevel(dayKey: string): FmLevel {
  // The level alone.
  return dailyLevelInfo(dayKey).level;
}

/**
 * The score of a passed level: ten a packet, plus a bonus of 50 at par that shrinks by 10 for each entry over par,
 * minus 10 for each wave after the first (never below the packets' own points).
 *
 * @param level the level
 * @param rules the entries used
 * @param waves the waves sent until it passed
 * @returns the score
 */
export function levelScore(level: FmLevel, rules: number, waves: number): number {
  // Ten a packet.
  const base = 10 * level.packets.length;
  // The bonus for a short list.
  const bonus = Math.max(0, 50 - 10 * Math.max(0, rules - level.par));
  // The cost of extra waves, taken from the bonus first and never below the base.
  return Math.max(base, base + bonus - 10 * Math.max(0, waves - 1));
}

/** How many waves a daily level allows. */
export const DAILY_WAVES = 6;

// ---------------------------------------------------------------------------
// The self-test.
// ---------------------------------------------------------------------------

/**
 * Prove the twenty levels and the next 400 daily levels.
 *
 * @returns the report
 */
export function selfTest(): SelfTestReport {
  // The problems.
  const failures: string[] = [];
  // Levels and days checked.
  let checked = 0;
  // Twenty levels, keys l01 to l20, each proven.
  if (LEVELS.length !== 20) failures.push(`there are ${LEVELS.length} levels, not 20`);
  // Each hand level.
  LEVELS.forEach((lv, i) => {
    // Its key matches its place.
    if (lv.key !== `l${String(i + 1).padStart(2, "0")}`) failures.push(`level ${i + 1} has key ${lv.key}`);
    // Every trap is marked, the level is solvable at its par, and the engine agrees.
    failures.push(...proveLevel(lv));
    // At least one trap per level.
    if (!lv.cards.some((c) => c.trap)) failures.push(`${lv.key}: no trap card`);
    // Counted.
    checked++;
  });
  // The ordering lessons: reversing the reference list must fail where the order is the lesson.
  for (const key of ["l03", "l13", "l19", "l20"]) {
    // The level.
    const lv = LEVELS.find((l) => l.key === key)!;
    // Its shortest lists.
    const sol = solve(lv);
    // The first one, reversed.
    const rev = sol.shortest[0]?.slice().reverse() ?? [];
    // Must misjudge a packet.
    if (judge(rev.map((r) => lv.cards[r].line), lv.packets).every((j) => j.correct)) failures.push(`${key}: the reversed list still passes, so order is not the lesson`);
  }
  // Fallbacks among the daily levels.
  let fallbacks = 0;
  // The next 400 days from launch.
  for (let d = 0; d < 400; d++) {
    // The day.
    const day = addDays(LAUNCH_DAY, d);
    // Generated twice.
    const a = dailyLevelInfo(day);
    // The second time.
    const b = dailyLevelInfo(day);
    // Identical, or the daily is not one puzzle for everyone.
    if (JSON.stringify(a) !== JSON.stringify(b)) failures.push(`${day}: two generations differ`);
    // A fallback is counted (the fallback is level 19, proven above).
    if (a.fallback) fallbacks++;
    // Not a fallback: prove it again from scratch (proveLevel ran inside the generator; this is the record).
    else {
      // The proof.
      const probs = proveLevel(a.level);
      // Labelled with the day.
      for (const p of probs) failures.push(`${day}: ${p}`);
      // The policy must agree with every packet's expected verdict.
      for (const p of a.level.packets) if (policyVerdict(a.level.clauses ?? [], p) !== p.expect) failures.push(`${day}: a packet's expected verdict disagrees with the policy`);
    }
    // Counted.
    checked++;
  }
  // More than one fallback in twenty days would mean the generator is too narrow.
  if (fallbacks > 20) failures.push(`${fallbacks} of 400 daily levels fell back to level 19`);
  // The report, with the fallback count in the count line through a failure only when too many.
  return { checked, failures };
}

/**
 * How many of the next 400 daily levels fell back (for the notes and the log).
 *
 * @returns the count
 */
export function fallbackCount(): number {
  // Count them.
  let n = 0;
  // Each day.
  for (let d = 0; d < 400; d++) if (dailyLevelInfo(addDays(LAUNCH_DAY, d)).fallback) n++;
  // The count.
  return n;
}
