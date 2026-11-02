// ============================================================================
// src/lib/tools/f5-lb-method-chooser/compute.ts
// ----------------------------------------------------------------------------
// EXPLAINS AND CHOOSES BIG-IP LTM LOAD-BALANCING METHODS.
//
// A pool's load-balancing-mode decides which member gets the next connection.
// BIG-IP offers 19 modes, and the differences are subtle enough that the wrong
// one quietly skews traffic. This tool takes any of:
//
//   * a tmsh snippet with `ltm pool` stanzas (reuses the shared tmsh parser)
//     -> per pool: the mode explained, plus deterministic observations that
//        cross-check the mode against the rest of the pool config (ratios that
//        the mode ignores, missing connection limits that weighted modes
//        require, slow-ramp pairing, priority-group activation, and the
//        ignore-persisted-weight scope);
//   * a single method name (tmsh token or GUI-style label)
//     -> that method explained in full, with neighbors to compare;
//   * the word `methods` -> the whole catalogue as a scan-friendly table;
//   * a `choose ...` line -> a deterministic recommendation from two answers
//     (how capacity differs, and what live signal to react to).
//
// Every explanatory sentence traces to F5's own words: the tmsh `ltm pool`
// reference (per-mode descriptions, slow-ramp-time, min-active-members,
// ignore-persisted-weight), K42275060 (the "which one is best for your
// environment" chooser article), and K6406 (the mechanics of the dynamic
// modes: per-second L4 ratios, trend ranking, the OneConnect exclusion, and
// the "ratios need a ratio method" rule). Pure and offline; explains, never
// measures.
//
// PAGE LANGUAGE (2026-11-02, batch H6): every text this engine writes is
// returned as an EngineText (src/lib/tools/engine-text.ts) by runLocalisable()
// and recommendLocalisable(): the method table's texts carry catalogue ids
// (method.<token>.weighs, .behavior, .chooseWhen, .caveat<n>, .oneLiner;
// scripts/check-engine-catalogue.mts keeps the en pack equal to METHODS), and
// the settings notes, observations, recommendations, notes and errors carry
// their own ids, with their values as ICU arguments. run(), recommend() and
// catalogRows() return plainText() of the same readings, so the API and the
// golden vectors are unchanged byte for byte; thrown errors keep their English
// message and carry the sentence (engineError).
// ============================================================================

import { parseTmsh, asTopLevel, asKeyValue, type ConfigNode } from "../f5-tmsh-config-explainer/compute";
import { say, plainText, engineError, type EngineText } from "../engine-text"; // sentences with ids (2026-11-02)

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** One annotated key/value from a pool stanza (same shape family as siblings). S is string in the API's reading, EngineText in the page's. */
export interface FieldNote<S = string> {
  key: string;
  value: string | S; // as written, or the engine's own placeholder for an absent setting (a sentence)
  note?: S;
}

/** A fully explained load-balancing method. S as above. */
export interface MethodExplain<S = string> {
  /** Canonical tmsh token, e.g. "least-connections-member". */
  token: string;
  /** GUI-style label, e.g. "Least Connections (member)". */
  gui: string;
  /** Static methods ignore live server state; dynamic methods react to it. */
  family: "static" | "dynamic";
  /** member = within this pool; node = across all pools the server is in; pool = no split exists. */
  scope: "member" | "node" | "pool";
  /** The signal the method weighs when picking. */
  weighs: S;
  /** How it behaves, in the vendor's terms. */
  behavior: S;
  /** When to pick it (K42275060 / the tmsh reference's own guidance). */
  chooseWhen: S;
  /** Sharp edges, each traceable to a source. */
  caveats: S[];
  /** Manifest source ids backing this entry. */
  sources: string[];
  /** Tokens worth comparing against. */
  related: string[];
}

/** A one-line catalogue row (the `methods` view). S as above. */
export interface MethodBrief<S = string> {
  token: string;
  gui: string;
  family: "static" | "dynamic";
  scope: "member" | "node" | "pool";
  oneLiner: S;
}

/** A parsed member with the fields that interact with method choice. */
export interface MemberReading {
  name: string;
  ratio?: number; // default 1 per the tmsh reference
  connectionLimit?: number; // default 0 per the tmsh reference
  priorityGroup?: number; // default 0 per the tmsh reference
}

/** One pool, read and cross-checked. S as above. */
export interface PoolReading<S = string> {
  name: string;
  line: number;
  /** The token as written (may be an alias/quirk spelling), or null if absent. */
  modeAsWritten: string | null;
  /** The canonical token after normalization (round-robin when absent). */
  modeToken: string;
  method: MethodExplain<S>;
  /** Pool-level settings that interact with the method, annotated. */
  settings: FieldNote<S>[];
  members: MemberReading[];
  /** Deterministic cross-checks of mode vs the rest of the config. */
  observations: S[];
}

/** The deterministic chooser's answer. S as above. */
export interface Recommendation<S = string> {
  primary: string; // canonical token
  why: S;
  alternatives: { token: string; when: S }[];
  prereqs: S[];
}

/** The tool's result envelope. S as above. */
export interface LbResult<S = string> {
  ok: boolean;
  error?: string;
  mode: "pools" | "method" | "catalog" | "choose";
  pools?: PoolReading<S>[];
  method?: MethodExplain<S>;
  catalog?: MethodBrief<S>[];
  recommendation?: Recommendation<S>;
  notes: S[];
}

export type ToolRunResult = LbResult;

// ---------------------------------------------------------------------------
// Source ids (must match the manifest's sources[] ids)
// ---------------------------------------------------------------------------
const S_TMSH = "tmsh-ltm-pool";
const S_CHOOSE = "k42275060";
const S_DYN = "k6406";

// ---------------------------------------------------------------------------
// The method table - 19 canonical tokens, in the tmsh reference's own order.
// Wording rule: `behavior` and `chooseWhen` paraphrase the cited source
// closely enough to be checkable against it; `caveats` name their source.
// ---------------------------------------------------------------------------

const T = (
  token: string,
  gui: string,
  family: "static" | "dynamic",
  scope: "member" | "node" | "pool",
  weighs: string,
  behavior: string,
  chooseWhen: string,
  caveats: string[],
  sources: string[],
  related: string[],
): MethodExplain => ({ token, gui, family, scope, weighs, behavior, chooseWhen, caveats, sources, related });

/** Canonical token -> full explanation. Order mirrors the tmsh reference. */
export const METHODS: readonly MethodExplain[] = Object.freeze([
  T(
    "dynamic-ratio-member",
    "Dynamic Ratio (member)",
    "dynamic",
    "member",
    "ratio weights the system keeps recomputing from server measurements",
    "Like Ratio, but the weights come from continuous monitoring of the servers and are therefore continually changing, instead of being set by hand.",
    "Pool members differ in capacity and you want the weights measured, not guessed: the system keeps them current as server performance moves.",
    [
      "The weights need something to measure: server-side performance monitoring must be in place for the ratios to be meaningful. K14129 shows how to view the weight the system computed.",
    ],
    [S_TMSH, S_CHOOSE],
    ["ratio-member", "dynamic-ratio-node", "observed-member"],
  ),
  T(
    "dynamic-ratio-node",
    "Dynamic Ratio (node)",
    "dynamic",
    "node",
    "system-computed, continually changing ratio weights, counted per node across every pool",
    "The node-scope twin of Dynamic Ratio (member): weights come from continuous monitoring and change on their own; the accounting follows the server across all pools it belongs to.",
    "Same measured-capacity case as the member form, when servers are shared across multiple pools and should be weighted by their whole load.",
    [
      "Node scope means a busy server in another pool lowers this one's share here too - that is the point, but it surprises people reading a single pool's config.",
    ],
    [S_TMSH, S_CHOOSE],
    ["dynamic-ratio-member", "ratio-node"],
  ),
  T(
    "fastest-app-response",
    "Fastest (application)",
    "dynamic",
    "pool",
    "response speed, tracked as outstanding Layer 7 requests",
    "Passes a new connection based on the fastest response of all currently active nodes in the pool. Per K6406 the underlying count is the number of outstanding Layer 7 requests to a member.",
    "The vendor's own suggestion: particularly useful where nodes are distributed across different logical networks, so path speed differs as much as server speed.",
    [
      "It counts outstanding Layer 7 requests (K6406), so the virtual server has to be processing traffic at Layer 7 for the count to mean anything.",
    ],
    [S_TMSH, S_CHOOSE, S_DYN],
    ["fastest-node", "least-connections-member"],
  ),
  T(
    "fastest-node",
    "Fastest (node)",
    "dynamic",
    "node",
    "response speed per node, measured across all pools the server is in",
    "Passes a new connection based on the fastest response of a server counted across all pools of which it is a member - the node-scope form of Fastest.",
    "The cross-network case again, when the same servers sit in several pools and their responsiveness should be judged on their total work.",
    [
      "Same Layer 7 dependency as the application form: the outstanding-request count (K6406) needs L7 processing to exist.",
    ],
    [S_TMSH, S_DYN],
    ["fastest-app-response"],
  ),
  T(
    "least-connections-member",
    "Least Connections (member)",
    "dynamic",
    "member",
    "open connections right now, counted within this pool",
    "Passes a new connection to the member with the fewest current connections in the pool, measured at the moment the request arrives (K6406).",
    "Servers of similar capability - the vendor's stated best fit. Because it counts what is open right now, it also absorbs uneven connection durations that trip Round Robin.",
    [
      "With OneConnect enabled, idle connections are excluded: only active connections count in the selection (K6406).",
      "It counts BIG-IP-to-member connections only, not whatever else the server is doing.",
      "A freshly recovered member has zero connections and would take a flood; the tmsh reference calls slow-ramp-time particularly useful with exactly this mode (default 10 seconds).",
    ],
    [S_TMSH, S_CHOOSE, S_DYN],
    ["least-connections-node", "weighted-least-connections-member", "observed-member"],
  ),
  T(
    "least-connections-node",
    "Least Connections (node)",
    "dynamic",
    "node",
    "open connections right now, counted across every pool the server is in",
    "Passes a new connection to the node with the fewest current connections out of all pools of which it is a member.",
    "Similar-capability servers that appear in several pools, when the fair count is the server's total connections rather than this pool's slice.",
    [
      "The same OneConnect and slow-ramp notes as the member form apply; the count is just taken per node.",
    ],
    [S_TMSH, S_CHOOSE, S_DYN],
    ["least-connections-member"],
  ),
  T(
    "least-sessions",
    "Least Sessions",
    "dynamic",
    "pool",
    "entries in the persistence table",
    "Passes a new connection to the member that currently has the least number of persistent sessions.",
    "Session-heavy applications where balance should follow sessions rather than raw connections, and persistence is already in play.",
    [
      "It only works when the virtual server references a persistence profile of a type that tracks persistence connections (K42275060) - without one there is nothing to count.",
    ],
    [S_TMSH, S_CHOOSE],
    ["ratio-session", "least-connections-member"],
  ),
  T(
    "observed-member",
    "Observed (member)",
    "dynamic",
    "member",
    "a per-second ratio the system computes from recent Layer 4 connection counts",
    "Ranks members by connection count and gives a greater share to those with a better balance of fewest connections. Unlike Least Connections, which measures only at the moment of load balancing, Observed tracks Layer 4 connections over time and turns them into a ratio, reassigned every second (K6406).",
    "The vendor's wording: works well in any environment, but may be particularly useful where member performance varies significantly - it smooths where Least Connections reacts instant by instant.",
    [
      "The smoothing is also lag: a member that just got slow keeps its good ratio for a moment.",
    ],
    [S_TMSH, S_CHOOSE, S_DYN],
    ["predictive-member", "least-connections-member", "observed-node"],
  ),
  T(
    "observed-node",
    "Observed (node)",
    "dynamic",
    "node",
    "the same per-second connection-based ratio, counted per node across pools",
    "The node-scope twin of Observed (member): the over-time connection ratio follows the server across all pools it belongs to.",
    "The Observed case when servers are shared across pools.",
    [
      "Same smoothing-versus-lag trade as the member form.",
    ],
    [S_TMSH, S_DYN],
    ["observed-member", "predictive-node"],
  ),
  T(
    "predictive-member",
    "Predictive (member)",
    "dynamic",
    "member",
    "the Observed ranking plus its trend - improving or declining",
    "Uses the Observed ranking, then analyses the trend of that ranking over time: members with better rankings that are currently improving, rather than declining, receive a higher proportion of connections (K6406).",
    "The vendor states it plainly: this mode works well in any environment. Reach for it when you want Observed's smoothing plus a preference for members getting healthier.",
    [
      "Trend analysis makes it the least predictable mode to reason about by hand - which is fine, until someone asks why a specific request went where it did.",
    ],
    [S_TMSH, S_CHOOSE, S_DYN],
    ["observed-member", "predictive-node"],
  ),
  T(
    "predictive-node",
    "Predictive (node)",
    "dynamic",
    "node",
    "the Observed-node ranking plus its trend",
    "The node-scope twin of Predictive (member): trend-weighted ranking, counted per node across every pool.",
    "The Predictive case when servers are shared across pools.",
    [
      "Same reasoning-by-hand caveat as the member form.",
    ],
    [S_TMSH, S_DYN],
    ["predictive-member", "observed-node"],
  ),
  T(
    "ratio-least-connections-member",
    "Ratio Least Connections (member)",
    "dynamic",
    "member",
    "your ratio weight combined with each member's active connection count",
    "Weights the selection by the ratio defined on each member (an unset ratio counts as 1) together with the number of connections each member has active; available since LTM 11.0.0 (K6406).",
    "Mixed-capacity servers where you can state the difference as a ratio but still want live connection counts respected.",
    [
      "It is the exception to the ratio rule: outside this mode (and its node twin), member ratios only apply under a ratio method (K6406).",
    ],
    [S_TMSH, S_DYN],
    ["ratio-member", "least-connections-member", "weighted-least-connections-member"],
  ),
  T(
    "ratio-least-connections-node",
    "Ratio Least Connections (node)",
    "dynamic",
    "node",
    "the node's ratio weight combined with its active connection count",
    "The node-scope twin: the ratio defined for the member's node, combined with the node's active connections (unset ratio counts as 1).",
    "The Ratio Least Connections case when weighting belongs to the server as a whole.",
    [
      "The ratio consulted is the node's, so it must be set on the node object, not the pool member.",
    ],
    [S_TMSH, S_DYN],
    ["ratio-least-connections-member", "ratio-node"],
  ),
  T(
    "ratio-member",
    "Ratio (member)",
    "static",
    "member",
    "a fixed ratio weight you define per pool member",
    "Each member receives connections over time in proportion to the ratio weight you define for it within the pool.",
    "Known, stable capacity differences: say a 4-CPU box next to 2-CPU boxes. You state the proportion once and the split follows it.",
    [
      "Static by design - it never notices a member struggling.",
      "K11870: the ratio method costs more CPU than Round Robin; the cheapest mode is still Round Robin.",
    ],
    [S_TMSH, S_CHOOSE],
    ["ratio-node", "dynamic-ratio-member", "ratio-least-connections-member"],
  ),
  T(
    "ratio-node",
    "Ratio (node)",
    "static",
    "node",
    "a fixed ratio weight you define per node, across all pools",
    "Each machine receives connections in proportion to a ratio weight defined for it across all pools of which the server is a member.",
    "The Ratio case when the proportion belongs to the server everywhere, not to one pool's member entry.",
    [
      "Set the weight on the node object; a member-level ratio is a different knob.",
    ],
    [S_TMSH, S_CHOOSE],
    ["ratio-member"],
  ),
  T(
    "ratio-session",
    "Ratio (session)",
    "dynamic",
    "pool",
    "sessions over time, proportioned by a ratio weight per member",
    "The number of sessions each machine receives over time is proportionate to a ratio weight you define per member - the session-counting sibling of Ratio.",
    "Session-oriented traffic where you want a stated proportion of sessions, not connections. K42275060 adds one sharp detail: pending sessions count as active sessions.",
    [
      "Pending sessions count as active (K42275060), so bursts of half-open sessions shape the split.",
    ],
    [S_TMSH, S_CHOOSE],
    ["least-sessions", "ratio-member"],
  ),
  T(
    "round-robin",
    "Round Robin",
    "static",
    "pool",
    "nothing - only whose turn it is",
    "Passes each new connection to the next server in line, eventually distributing connections evenly across the pool. It is the default mode.",
    "The vendor's own advice twice over: it works well in most configurations, especially when the machines are roughly equal in processing speed and memory - and by default the BIG-IP will use it.",
    [
      "Even distribution of connections is not even distribution of load when requests differ wildly in cost.",
    ],
    [S_TMSH, S_CHOOSE],
    ["ratio-member", "least-connections-member"],
  ),
  T(
    "weighted-least-connections-member",
    "Weighted Least Connections (member)",
    "dynamic",
    "member",
    "each member's connection count as a percentage of its connection-limit",
    "Passes a new connection to the member handling the lowest percentage of its specified maximum concurrent connections - the connection-limit acts as the capacity statement.",
    "Different but quantified capability limits, in the reference's words: you know each box's ceiling and want load spread as a fraction of it.",
    [
      "The reference is explicit: this mode requires a connection-limit value on all members of the pool. A member left at the default 0 breaks the arithmetic.",
    ],
    [S_TMSH, S_CHOOSE],
    ["weighted-least-connections-node", "least-connections-member", "ratio-least-connections-member"],
  ),
  T(
    "weighted-least-connections-node",
    "Weighted Least Connections (node)",
    "dynamic",
    "node",
    "each node's connection count as a percentage of the node's connection-limit",
    "The node-scope twin: the lowest percentage of the node's specified connection limit wins the next connection.",
    "The quantified-capacity case when the ceiling belongs to the server across all pools.",
    [
      "Requires a non-zero connection-limit on all nodes used by the pool's members (K42275060 / the tmsh reference) - and node limits live on the node objects, which a pool paste does not show.",
    ],
    [S_TMSH, S_CHOOSE],
    ["weighted-least-connections-member"],
  ),
]);

/** token -> MethodExplain, for O(1) lookup. */
const METHOD_BY_TOKEN: ReadonlyMap<string, MethodExplain> = new Map(METHODS.map((m) => [m.token, m]));

/**
 * A method of the table with its texts as catalogue sentences (pack keys engine.method.<token>.*), same fields in
 * the same order, so plainText() of it is the table's entry exactly.
 * @param m the table's entry
 * @returns the entry with ids
 */
function methodLocalisable(m: MethodExplain): MethodExplain<EngineText> {
  const k = `method.${m.token}`; // its key prefix
  return {
    token: m.token, // as is
    gui: m.gui, // the GUI name, as F5 writes it
    family: m.family, // as is
    scope: m.scope, // as is
    weighs: say(`${k}.weighs`, m.weighs), // what it weighs
    behavior: say(`${k}.behavior`, m.behavior), // how it behaves
    chooseWhen: say(`${k}.chooseWhen`, m.chooseWhen), // when to pick it
    caveats: m.caveats.map((c, i) => say(`${k}.caveat${i}`, c)), // its caveats, by position (guarded)
    sources: m.sources, // source ids
    related: m.related, // tokens to compare
  }; // the entry
} // methodLocalisable

/** The set of modes that consume a member/node `ratio` weight (K6406's rule). */
const RATIO_CONSUMERS = new Set([
  "ratio-member",
  "ratio-node",
  "ratio-session",
  "ratio-least-connections-member",
  "ratio-least-connections-node",
]);

/** The documented impact scope of ignore-persisted-weight (tmsh reference). */
const IPW_SCOPE = new Set([
  "observed-member",
  "observed-node",
  "predictive-member",
  "predictive-node",
  "ratio-least-connections-member",
  "ratio-least-connections-node",
  "ratio-member",
  "ratio-node",
]);

// ---------------------------------------------------------------------------
// Token normalization. The reference itself spells the least-connections
// member token BOTH ways on one page (`least-connections-members` in SYNTAX,
// `least-connections-member` in OPTIONS), and people paste GUI labels too -
// so the normalizer accepts tokens, the plural quirk, and GUI-style names.
// ---------------------------------------------------------------------------

function canon(raw: string): string | null {
  const s = raw
    .trim()
    .toLowerCase()
    .replace(/[()]/g, " ") // "least connections (member)" -> words
    .replace(/[_\s]+/g, "-") // spaces/underscores -> hyphens
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (!s) return null;
  if (METHOD_BY_TOKEN.has(s)) return s;
  // The documented plural quirk, and a symmetrical node-side tolerance.
  if (s === "least-connections-members") return "least-connections-member";
  if (s === "least-connections-nodes") return "least-connections-node";
  // GUI-style orderings: "fastest application" / "fastest node" etc.
  const gui: Record<string, string> = {
    "fastest-application": "fastest-app-response",
    "fastest-app": "fastest-app-response",
    "dynamic-ratio": "dynamic-ratio-member",
    ratio: "ratio-member",
    "least-connections": "least-connections-member",
    "least-conn": "least-connections-member",
    observed: "observed-member",
    predictive: "predictive-member",
    "weighted-least-connections": "weighted-least-connections-member",
    "ratio-least-connections": "ratio-least-connections-member",
  };
  if (Object.hasOwn(gui, s)) return gui[s]; // own entries only (2026-11-02): "constructor" is not a GUI name
  return null;
}

// ---------------------------------------------------------------------------
// The catalogue view (the `methods` keyword).
// ---------------------------------------------------------------------------

/** The catalogue rows, every text as its English (the public reading). */
export function catalogRows(): MethodBrief[] {
  return plainText(catalogRowsLocalisable()); // the same rows, sentences as their English
} // catalogRows

/** The catalogue rows, the one-liner a catalogue sentence (pack key engine.method.<token>.oneLiner). */
export function catalogRowsLocalisable(): MethodBrief<EngineText>[] {
  return METHODS.map((m) => ({
    token: m.token, // as is
    gui: m.gui, // as is
    family: m.family, // as is
    scope: m.scope, // as is
    oneLiner: say(`method.${m.token}.oneLiner`, m.weighs.charAt(0).toUpperCase() + m.weighs.slice(1) + "."), // what it weighs, as a sentence
  })); // one row per method
} // catalogRowsLocalisable

// ---------------------------------------------------------------------------
// The deterministic chooser. Two answers, straight from how the vendor's own
// chooser article frames the decision (capacity of the members, and what the
// method should react to), mapped onto the documented modes. No heuristics
// beyond the table - same inputs, same answer, always.
//
//   capacity = equal | ratio | connlimit | measured
//   react    = none | connections | trend | sessions | response
// ---------------------------------------------------------------------------

export type CapacityAnswer = "equal" | "ratio" | "connlimit" | "measured";
export type ReactAnswer = "none" | "connections" | "trend" | "sessions" | "response";

/** The chooser's answer, every text as its English (the public reading). */
export function recommend(capacity: CapacityAnswer, react: ReactAnswer): Recommendation {
  return plainText(recommendLocalisable(capacity, react)); // the same answer, sentences as their English
} // recommend

/** The chooser's answer, every text a sentence with its id (the page's reading). */
export function recommendLocalisable(capacity: CapacityAnswer, react: ReactAnswer): Recommendation<EngineText> {
  const alt = (token: string, when: EngineText) => ({ token, when }); // one alternative
  const prereqs: EngineText[] = []; // what must be true first
  let primary = "round-robin"; // the answer's token
  let why: EngineText = say("why.roundRobin", "Roughly equal machines and no need to react is the textbook Round Robin case - the vendor's default, recommended when the equipment is roughly equal in processing speed and memory."); // replaced below
  const alternatives: { token: string; when: EngineText }[] = []; // other tokens worth a look

  if (capacity === "measured") {
    // Measured capacity wins the capacity axis outright: that IS dynamic ratio.
    primary = "dynamic-ratio-member";
    why = say("why.measured", "You asked for capacity that is measured rather than declared: that is Dynamic Ratio by definition - weights from continuous monitoring of the servers, continually changing."); // pack key engine.why.measured
    prereqs.push(say("prereq.measured", "Server-side performance monitoring must exist for the system to have something to measure (see K14129 for viewing the computed weight).")); // pack key engine.prereq.measured
    alternatives.push(alt("dynamic-ratio-node", say("alt.measuredNode", "when the same servers sit in several pools and should be weighted by their total load"))); // pack key engine.alt.measuredNode
  } else if (react === "sessions") {
    primary = capacity === "ratio" ? "ratio-session" : "least-sessions";
    why =
      capacity === "ratio"
        ? say("why.ratioSession", "Session-counted balance with a declared proportion is exactly Ratio (session): sessions over time, proportioned by the ratio you set - remembering that pending sessions count as active.") // pack key engine.why.ratioSession
        : say("why.leastSessions", "Balancing by session count is Least Sessions: the member with the fewest persistence-table entries takes the next connection."); // pack key engine.why.leastSessions
    prereqs.push(say("prereq.sessions", "The virtual server must reference a persistence profile of a type that tracks persistence connections (K42275060) - otherwise there are no sessions to count.")); // pack key engine.prereq.sessions
    if (capacity !== "ratio") alternatives.push(alt("ratio-session", say("alt.sessionsRatio", "when members should carry stated proportions of the sessions"))); // pack key engine.alt.sessionsRatio
  } else if (react === "response") {
    primary = "fastest-app-response";
    why = say("why.response", "Reacting to response speed is Fastest: the fastest-responding active node takes the connection - the vendor suggests it especially where nodes sit on different logical networks."); // pack key engine.why.response
    prereqs.push(say("prereq.response", "The count behind it is outstanding Layer 7 requests (K6406), so the virtual must process traffic at Layer 7.")); // pack key engine.prereq.response
    alternatives.push(alt("fastest-node", say("alt.responseNode", "when the same servers appear in several pools and speed should be judged across them"))); // pack key engine.alt.responseNode
  } else if (react === "trend") {
    primary = "predictive-member";
    why = say("why.trend", "Reacting to the trend - preferring members that are improving over those declining - is Predictive, built on the Observed ranking. The vendor's own words: works well in any environment."); // pack key engine.why.trend
    alternatives.push(
      alt("observed-member", say("alt.trendObserved", "when the per-second smoothed ratio is enough and the trend preference is not wanted")), // pack key engine.alt.trendObserved
      alt("predictive-node", say("alt.trendNode", "when the trend should follow servers across every pool they belong to")), // pack key engine.alt.trendNode
    );
  } else if (react === "connections") {
    if (capacity === "connlimit") {
      primary = "weighted-least-connections-member";
      why = say("why.wlc", "Live connection counts scaled by declared ceilings is Weighted Least Connections: the member at the lowest percentage of its connection-limit wins."); // pack key engine.why.wlc
      prereqs.push(say("prereq.wlc", "Every member of the pool needs a non-zero connection-limit - the reference states the requirement outright.")); // pack key engine.prereq.wlc
      alternatives.push(alt("weighted-least-connections-node", say("alt.wlcNode", "when the ceiling belongs to the server across all pools (limits set on the node objects)"))); // pack key engine.alt.wlcNode
    } else if (capacity === "ratio") {
      primary = "ratio-least-connections-member";
      why = say("why.rlc", "Live connection counts combined with a declared proportion is Ratio Least Connections: the ratio weight and the active-connection count decide together (LTM 11.0.0 and later)."); // pack key engine.why.rlc
      alternatives.push(alt("ratio-least-connections-node", say("alt.rlcNode", "when the ratio belongs to the node rather than the pool member"))); // pack key engine.alt.rlcNode
    } else {
      primary = "least-connections-member";
      why = say("why.lc", "Equal servers reacting to live load is Least Connections: the member with the fewest open connections at that moment takes the next one - the vendor's stated best fit for similar-capability servers."); // pack key engine.why.lc
      prereqs.push(say("prereq.lc", "Pair it with slow-ramp-time so a freshly recovered member is not flooded; the reference calls the pairing particularly useful (default 10 seconds).")); // pack key engine.prereq.lc
      alternatives.push(
        alt("least-connections-node", say("alt.lcNode", "when the same servers serve several pools and the fair count is their total")), // pack key engine.alt.lcNode
        alt("observed-member", say("alt.lcObserved", "when instantaneous counts feel too twitchy and a per-second smoothed ratio fits better")), // pack key engine.alt.lcObserved
      );
    }
  } else {
    // react === "none": stay static.
    if (capacity === "ratio") {
      primary = "ratio-member";
      why = say("why.ratio", "Declared capacity with no live reaction is Ratio: each member receives connections in proportion to the weight you set, and nothing else moves it."); // pack key engine.why.ratio
      alternatives.push(alt("ratio-node", say("alt.ratioNode", "when the proportion belongs to the server across all pools")), alt("dynamic-ratio-member", say("alt.ratioDynamic", "if you later want those weights measured instead of maintained by hand"))); // pack keys engine.alt.ratioNode, engine.alt.ratioDynamic
    } else if (capacity === "connlimit") {
      // Declared ceilings but no live reaction: the ceilings only act through
      // WLC (which is live) - so the static answer is Ratio derived from the
      // limits, with WLC offered as what the limits were probably bought for.
      primary = "ratio-member";
      why = say("why.connlimitStatic", "Connection limits only shape load balancing through Weighted Least Connections, which reacts live. If you truly want no live reaction, state the same proportions as Ratio weights instead."); // pack key engine.why.connlimitStatic
      alternatives.push(alt("weighted-least-connections-member", say("alt.connlimitWlc", "if reacting to live counts scaled by those limits is actually acceptable"))); // pack key engine.alt.connlimitWlc
    } else {
      primary = "round-robin";
      // why is already the Round Robin sentence (pack key engine.why.roundRobin), set where it is declared.
      alternatives.push(alt("least-connections-member", say("alt.rrLc", "if uneven connection durations start skewing the even split"))); // pack key engine.alt.rrLc
    }
  }

  return { primary, why, alternatives, prereqs };
}

// ---------------------------------------------------------------------------
// Pool parsing + the observation rules.
// ---------------------------------------------------------------------------

/** Read an integer property from a key/value line, if present and numeric. */
function intOf(v: string | undefined): number | undefined {
  if (v === undefined) return undefined;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}

/** Extract the pools (with the fields this tool cross-checks) from parsed tmsh. */
function readPools(nodes: ConfigNode[]): PoolReading<EngineText>[] {
  const pools: PoolReading<EngineText>[] = []; // in paste order

  for (const node of nodes) {
    const { type, name } = asTopLevel(node);
    if (type !== "ltm pool") continue;

    const line = node.line;
    let modeRaw: string | null = null;
    let slowRamp: number | undefined;
    let minActive: number | undefined;
    let ipw: string | undefined;
    const members: MemberReading[] = [];

    for (const child of node.children ?? []) {
      const isBlock = child.children !== undefined;
      if (!isBlock) {
        const { key, value } = asKeyValue(child);
        if (key === "load-balancing-mode") modeRaw = value;
        else if (key === "slow-ramp-time") slowRamp = intOf(value);
        else if (key === "min-active-members") minActive = intOf(value);
        else if (key === "ignore-persisted-weight") ipw = value;
        continue;
      }
      // The members { ... } block: each child block is one member, its header
      // being the member address:port and its children the member's fields.
      if (child.tokens[0] === "members") {
        for (const m of child.children ?? []) {
          if (m.children === undefined) continue; // stray leaf inside members
          const member: MemberReading = { name: m.tokens.join(" ") };
          for (const f of m.children) {
            if (f.children !== undefined) continue; // nested block (fqdn {...}) - not read here
            const { key, value } = asKeyValue(f);
            if (key === "ratio") member.ratio = intOf(value);
            else if (key === "connection-limit") member.connectionLimit = intOf(value);
            else if (key === "priority-group") member.priorityGroup = intOf(value);
          }
          members.push(member);
        }
      }
    }

    // Normalize the mode. Absent -> round-robin, the documented default.
    const token = modeRaw ? canon(modeRaw) : "round-robin";
    const method = METHOD_BY_TOKEN.get(token ?? "") ?? null;

    // ---- settings, annotated ------------------------------------------------
    const settings: FieldNote<EngineText>[] = []; // in a fixed order
    if (modeRaw !== null) {
      settings.push({
        key: "load-balancing-mode",
        value: modeRaw,
        note: method ? undefined : say("setting.notDocumented", "not a documented mode token; see the method list"), // pack key engine.setting.notDocumented
      });
    } else {
      settings.push({
        key: "load-balancing-mode",
        value: say("setting.absentValue", "(absent)"), // the engine's placeholder, shown where the value would be (pack key engine.setting.absentValue)
        note: say("setting.absent", "defaults to round-robin per the tmsh reference"), // pack key engine.setting.absent
      });
    }
    if (slowRamp !== undefined)
      settings.push({
        key: "slow-ramp-time",
        value: String(slowRamp),
        note: say("setting.slowRamp", "seconds a just-up member takes to reach a full share of new traffic"), // pack key engine.setting.slowRamp
      });
    if (minActive !== undefined)
      settings.push({
        key: "min-active-members",
        value: String(minActive),
        note: say("setting.minActive", "members that must be up to confine traffic to a priority group"), // pack key engine.setting.minActive
      });
    if (ipw !== undefined)
      settings.push({
        key: "ignore-persisted-weight",
        value: ipw,
        note: say("setting.ipw", "whether persistence-selected connections are discounted from the algorithm's accounting"), // pack key engine.setting.ipw
      });

    // ---- observations: mode vs the rest of the pool -------------------------
    const obs: EngineText[] = []; // in rule order

    if (!method) {
      obs.push(
        say("obs.unknownMode", `"${modeRaw}" is not a load-balancing-mode the tmsh reference documents. The 19 documented tokens are listed in the method catalogue (type "methods").`, { mode: String(modeRaw) }), // pack key engine.obs.unknownMode
      );
    } else {
      // Absent mode -> the default, called out explicitly.
      if (modeRaw === null) {
        obs.push(
          say("obs.defaultMode", "No load-balancing-mode is set, so this pool runs Round Robin - the documented default."), // pack key engine.obs.defaultMode
        );
      }
      // The documented plural quirk, acknowledged rather than flagged as wrong.
      if (modeRaw && modeRaw.trim().toLowerCase() === "least-connections-members") {
        obs.push(
          say("obs.pluralQuirk", "The token is spelled with the plural, exactly as the tmsh reference's SYNTAX block spells it - the same page's OPTIONS text uses the singular. Both mean Least Connections (member)."), // pack key engine.obs.pluralQuirk
        );
      }

      // Ratios configured under a mode that does not consume them (K6406).
      const ratioed = members.filter((m) => m.ratio !== undefined && m.ratio !== 1);
      if (ratioed.length > 0 && !RATIO_CONSUMERS.has(method.token)) {
        const list = ratioed.map((m) => `${m.name}=${m.ratio}`).join(", "); // member=ratio, as configured
        obs.push(
          say("obs.ratiosIgnored", `Member ratio weights are set (${list}) but ${method.gui} does not use them: per K6406, members configured with a ratio must reference a ratio load-balancing method for the ratios to apply.`, { list, method: method.gui }), // pack key engine.obs.ratiosIgnored
        );
      }

      // Weighted least connections needs limits on ALL members (the reference).
      if (method.token === "weighted-least-connections-member") {
        const unlimited = members.filter((m) => !m.connectionLimit || m.connectionLimit === 0);
        if (members.length > 0 && unlimited.length > 0) {
          const names = unlimited.map((m) => m.name).join(", "); // the members without a limit
          obs.push(
            unlimited.length === 1 // one member, or several: two sentences (the verb agrees)
              ? say("obs.wlcNoLimitOne", `Weighted Least Connections (member) requires a connection-limit on all members of the pool, but ${names} has none (the default 0). The percentage-of-limit arithmetic has nothing to divide by.`, { names }) // pack key engine.obs.wlcNoLimitOne
              : say("obs.wlcNoLimitMany", `Weighted Least Connections (member) requires a connection-limit on all members of the pool, but ${names} have none (the default 0). The percentage-of-limit arithmetic has nothing to divide by.`, { names }), // pack key engine.obs.wlcNoLimitMany
          );
        }
      }
      if (method.token === "weighted-least-connections-node") {
        obs.push(
          say("obs.wlcNode", "Weighted Least Connections (node) requires a non-zero connection-limit on all nodes used by the pool's members. Node limits live on the ltm node objects, which this pool stanza does not show - verify them there."), // pack key engine.obs.wlcNode
        );
      }

      // Least sessions has a virtual-server-side prerequisite (K42275060).
      if (method.token === "least-sessions") {
        obs.push(
          say("obs.leastSessions", "Least Sessions only works when the virtual server references a persistence profile of a type that tracks persistence connections (K42275060). The pool alone cannot satisfy that - check the virtual."), // pack key engine.obs.leastSessions
        );
      }

      // Slow ramp guidance for the least-connections family (the reference).
      if (method.token.startsWith("least-connections")) {
        if (slowRamp === undefined) {
          obs.push(
            say("obs.slowRampDefault", "slow-ramp-time is not set, so the default of 10 seconds applies. The tmsh reference calls slow ramp particularly useful with least-connections: a member that just came up has zero connections and would otherwise take a flood."), // pack key engine.obs.slowRampDefault
          );
        } else if (slowRamp === 0) {
          obs.push(
            say("obs.slowRampZero", "slow-ramp-time is 0: a member that just came up starts with zero connections and Least Connections will send it a burst of new traffic immediately. The reference singles out this pairing as the one slow ramp helps most."), // pack key engine.obs.slowRampZero
          );
        }
      }

      // ignore-persisted-weight: explain, and scope-check (the reference).
      if (ipw !== undefined) {
        const inScope = IPW_SCOPE.has(method.token);
        if (ipw === "yes" && inScope) {
          obs.push(
            say("obs.ipwYes", "ignore-persisted-weight yes: connections that arrive via persistence are not counted as picks, so they stop influencing this mode's accounting - useful when persistence concentrates returning clients and the ratios start chasing that concentration."), // pack key engine.obs.ipwYes
          );
        } else if (ipw === "yes" && !inScope) {
          obs.push(
            say("obs.ipwOutOfScope", `ignore-persisted-weight is set, but the reference scopes its effect to the observed, predictive, ratio, and ratio-least-connections modes - it does not change ${method.gui}.`, { method: method.gui }), // pack key engine.obs.ipwOutOfScope
          );
        }
      }

      // Priority groups + min-active-members (the reference's PGA semantics).
      const grouped = members.filter((m) => (m.priorityGroup ?? 0) > 0);
      if (grouped.length > 0) {
        if (minActive && minActive > 0) {
          const groups = grouped.map((m) => `${m.name}:pg${m.priorityGroup}`).join(", "); // member:pg<n>, as configured
          obs.push(
            say("obs.priorityGroups", `Priority groups are in use (${groups}) with min-active-members ${minActive}: traffic stays confined to the highest-priority group while at least ${minActive} of its members are active - an active member being up and below its connection limit. ${method.gui} then balances within the group that is receiving traffic.`, { groups, min: String(minActive), method: method.gui }), // pack key engine.obs.priorityGroups
          );
        } else {
          obs.push(
            say("obs.priorityNoMin", "Members carry priority-group values, but min-active-members is 0 (or unset), so no priority-based activation threshold is in force - the reference ties confinement to a priority group to that minimum."), // pack key engine.obs.priorityNoMin
          );
        }
      }
    }

    pools.push({
      name,
      line,
      modeAsWritten: modeRaw,
      modeToken: method ? method.token : (modeRaw ?? "round-robin"),
      method: method ? methodLocalisable(method) : unknownMethod(modeRaw ?? ""), // the table's entry with ids, or the placeholder
      settings,
      members,
      observations: obs,
    });
  }

  return pools;
}

/** A placeholder MethodExplain for undocumented tokens, so the UI renders. */
function unknownMethod(raw: string): MethodExplain<EngineText> {
  return {
    token: raw,
    gui: raw,
    family: "static",
    scope: "pool",
    weighs: say("unknown.weighs", "unknown - not a documented mode"), // pack key engine.unknown.weighs
    behavior: say("unknown.behavior", "This token does not appear in the tmsh ltm pool reference's load-balancing-mode list."), // pack key engine.unknown.behavior
    chooseWhen: say("unknown.chooseWhen", "Use one of the 19 documented tokens; type \"methods\" for the catalogue."), // pack key engine.unknown.chooseWhen
    caveats: [],
    sources: [S_TMSH],
    related: [],
  };
}

// ---------------------------------------------------------------------------
// The chooser DSL: `choose capacity=<...> react=<...>`
// ---------------------------------------------------------------------------

const CAPACITY_VALUES = new Set(["equal", "ratio", "connlimit", "measured"]);
const REACT_VALUES = new Set(["none", "connections", "trend", "sessions", "response"]);

function parseChoose(line: string): Recommendation<EngineText> {
  const parts = line.replace(/^choose\b/i, "").trim().split(/\s+/).filter(Boolean);
  let capacity: CapacityAnswer | null = null;
  let react: ReactAnswer | null = null;
  for (const p of parts) {
    const [k, v] = p.split("=", 2).map((x) => x?.trim().toLowerCase());
    if (k === "capacity" && v && CAPACITY_VALUES.has(v)) capacity = v as CapacityAnswer;
    else if (k === "react" && v && REACT_VALUES.has(v)) react = v as ReactAnswer;
    else
      throw engineError(
        say("err.chooseUnrecognised", `choose: unrecognized answer "${p}". Expected capacity=<equal|ratio|connlimit|measured> and react=<none|connections|trend|sessions|response>.`, { answer: p }), // pack key engine.err.chooseUnrecognised
      );
  }
  if (!capacity || !react) {
    throw engineError(
      say("err.chooseBoth", "choose needs both answers: capacity=<equal|ratio|connlimit|measured> react=<none|connections|trend|sessions|response>."), // pack key engine.err.chooseBoth
    );
  }
  return recommendLocalisable(capacity, react); // the page's reading
}

// ---------------------------------------------------------------------------
// run() - the single entry point (plain-string input, like its siblings).
// ---------------------------------------------------------------------------

/** The reading, every text as its English (the API's and the golden vectors'). Throws on bad input. */
export function run(input: string): LbResult {
  return plainText(runLocalisable(input)); // the same reading, sentences as their English
} // run

/** The reading, every text an EngineText (the page's). Throws on bad input; each error carries its sentence. */
export function runLocalisable(input: string): LbResult<EngineText> {
  const text = (input ?? "").trim();

  if (!text) {
    throw engineError(
      say("err.empty", 'Paste an ltm pool stanza, a method name (for example "least-connections-member"), the word "methods" for the full list, or "choose capacity=... react=..." for a recommendation.'), // pack key engine.err.empty
    );
  }

  // The catalogue keyword.
  if (/^(methods|all|list)$/i.test(text)) {
    return { ok: true, mode: "catalog", catalog: catalogRowsLocalisable(), notes: [
      say("note.catalog", "19 modes, in the tmsh reference's order. Static modes ignore live server state; dynamic modes react to it."), // pack key engine.note.catalog
    ] };
  }

  // The chooser DSL.
  if (/^choose\b/i.test(text)) {
    const recommendation = parseChoose(text);
    return { ok: true, mode: "choose", recommendation, notes: [] };
  }

  // A lone method name (no braces, single line, no tmsh keywords).
  if (!text.includes("{") && !/\n/.test(text) && !/^ltm\s/i.test(text)) {
    const token = canon(text);
    if (token) {
      const entry = METHOD_BY_TOKEN.get(token); // the table's entry (canon() only returns a table token, a plain-object lookup aside)
      const method = entry ? methodLocalisable(entry) : entry; // with ids; a missing entry stays missing, as the API has always returned it
      return { ok: true, mode: "method", method, notes: [] };
    }
    throw engineError(
      say("err.unknownMethod", `"${text}" is not a documented load-balancing mode. Type "methods" to list the 19 tokens the tmsh reference documents.`, { text }), // pack key engine.err.unknownMethod
    );
  }

  // Otherwise: tmsh. Reuse the shared parser and read the pools.
  const parsed = parseTmsh(text);
  const pools = readPools(parsed.nodes);
  // The parser's message as a sentence, by the id the parser gives it (pack keys engine.parser.*), else as written.
  const parser = parsed.error ? (parsed.errorId ? say(`parser.${parsed.errorId}`, parsed.error.message) : parsed.error.message) : null; // or none
  if (pools.length === 0) {
    throw engineError(
      !parsed.ok && parser !== null // with the parser's message, or without
        ? say("err.noPoolsParser", `No ltm pool stanzas found (parser: ${parsed.error!.message}). Paste the pool (tmsh list ltm pool <name>), a method name, or type "methods" for the catalogue.`, { parser }) // pack key engine.err.noPoolsParser
        : say("err.noPools", 'No ltm pool stanzas found. Paste the pool (tmsh list ltm pool <name>), a method name, or type "methods" for the catalogue.'), // pack key engine.err.noPools
    );
  }

  const notes: EngineText[] = []; // what the reader should know about the reading
  if (!parsed.ok && parser !== null) {
    notes.push(
      parsed.error!.line // with the line the parser names, or without
        ? say("note.parserLine", `parser: ${parsed.error!.message} (line ${parsed.error!.line}) - reading what parsed cleanly.`, { parser, line: String(parsed.error!.line) }) // pack key engine.note.parserLine
        : say("note.parser", `parser: ${parsed.error!.message} - reading what parsed cleanly.`, { parser }), // pack key engine.note.parser
    );
  }

  return { ok: true, mode: "pools", pools, notes };
}
