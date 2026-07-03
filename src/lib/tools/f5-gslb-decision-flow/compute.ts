// ============================================================================
// src/lib/tools/f5-gslb-decision-flow/compute.ts
// ----------------------------------------------------------------------------
// EXPLAINS THE BIG-IP DNS (GTM) GSLB DECISION FLOW.
//
// A DNS name resolution request walks two tiers: the wide IP picks a pool
// (pool-lb-mode), then the pool picks a member through a THREE-STEP chain -
// preferred (load-balancing-mode), alternate (alternate-mode), fallback
// (fallback-mode). The chain is where the surprises live: the alternate
// grammar admits only methods that need no LDNS path metrics, and the
// fallback tier IGNORES availability so that the system always answers.
//
// This tool takes any of:
//   * a tmsh snippet with `gtm wideip` and/or `gtm pool` stanzas (reuses the
//     shared tmsh parser) -> the resolved decision flow per object, each
//     step explained in the vendor's words, plus deterministic observations
//     (fallback-ip mode without an address, dynamic-ratio outside its
//     documented scope, the topology-at-both-tiers fallback warning, ...);
//   * a single method token -> that method explained in full; or
//   * the word `methods` -> the whole catalogue.
//
// Sources: the tmsh `gtm pool a` reference (mode grammars, per-token
// descriptions, dynamic-ratio scope, defaults), the tmsh `gtm wideip a`
// reference (pool-lb-mode grammar and semantics), and the BIG-IP DNS Load
// Balancing manual chapter "About load balancing and resource availability"
// (chain semantics: alternate is static-only, fallback ignores availability,
// the None cascade, the BIND aggregate) plus the Topology chapter (the
// both-tiers fallback warning). Pure and offline; explains, never resolves.
// ============================================================================

import { parseTmsh, asTopLevel, asKeyValue, type ConfigNode } from "../f5-tmsh-config-explainer/compute";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** One annotated key/value from a stanza. */
export interface FieldNote {
  key: string;
  value: string;
  note?: string;
}

/** Where a method's decision signal comes from (derived from the tmsh
 *  per-token descriptions: "client LDNS" wording = the probed path;
 *  "currently processing/hosts" = server-side stats; otherwise none). */
export type MetricSource = "ldns-path" | "server-side" | "none";

/** A fully explained GTM pool-tier load-balancing method. */
export interface GtmMethodExplain {
  token: string;
  gui: string;
  /** static = decides from configuration; dynamic = decides from measurements. */
  family: "static" | "dynamic";
  metricSource: MetricSource;
  /** Which chain tiers the tmsh grammar admits this token in. */
  allowedIn: { preferred: boolean; alternate: boolean; fallback: boolean };
  behavior: string;
  notes: string[];
  sources: string[];
}

/** One resolved chain step on a pool. */
export interface ChainStep {
  tier: "preferred" | "alternate" | "fallback";
  tokenAsWritten: string | null; // null = attribute absent
  token: string; // effective (defaults applied)
  method: GtmMethodExplain | null; // null when the token is undocumented
  defaulted: boolean;
  tierNote: string; // the vendor's semantics for this tier
}

/** A parsed GTM pool with its chain and cross-checks. */
export interface GtmPoolReading {
  name: string;
  recordType: string; // a | aaaa | mx | cname | srv | naptr (as written)
  line: number;
  chain: ChainStep[];
  settings: FieldNote[];
  memberCount: number;
  membersWithRatio: number;
  observations: string[];
}

/** A parsed wide IP with its pool-selection tier. */
export interface WideipReading {
  name: string;
  recordType: string;
  line: number;
  poolLbModeAsWritten: string | null;
  poolLbMode: string;
  poolLbNote: string;
  pools: { name: string; order?: number; ratio?: number }[];
  settings: FieldNote[];
  observations: string[];
}

export interface GslbResult {
  ok: boolean;
  mode: "config" | "method" | "catalog";
  wideips?: WideipReading[];
  pools?: GtmPoolReading[];
  method?: GtmMethodExplain;
  catalog?: GtmMethodExplain[];
  wideipMethods?: { token: string; note: string }[];
  notes: string[];
}

export type ToolRunResult = GslbResult;

// ---------------------------------------------------------------------------
// Source ids (must match the manifest's sources[] ids)
// ---------------------------------------------------------------------------
const S_POOL = "tmsh-gtm-pool-a";
const S_WIP = "tmsh-gtm-wideip-a";
const S_LB = "dns-lb-manual";

// ---------------------------------------------------------------------------
// The pool-tier method table. Grammar truth comes from the tmsh gtm pool a
// reference: 18 preferred tokens; 12 admitted as alternate; 19 (the 18 plus
// none) admitted as fallback. Behavior strings paraphrase the per-token
// descriptions on that page closely enough to be checkable against it.
// ---------------------------------------------------------------------------

const M = (
  token: string,
  gui: string,
  family: "static" | "dynamic",
  metricSource: MetricSource,
  alt: boolean,
  behavior: string,
  notes: string[],
): GtmMethodExplain => ({
  token,
  gui,
  family,
  metricSource,
  allowedIn: { preferred: token !== "none", alternate: alt, fallback: true },
  behavior,
  notes,
  sources: [S_POOL, S_LB],
});

/** Token order mirrors the tmsh reference's load-balancing-mode list, with
 *  `none` appended (it exists only in the alternate and fallback grammars). */
export const GTM_METHODS: readonly GtmMethodExplain[] = Object.freeze([
  M("completion-rate", "Completion Rate", "dynamic", "ldns-path", false,
    "Selects the virtual server that currently maintains the least number of dropped or timed-out packets during a transaction between a data center and the client LDNS.",
    ["The metric is measured on the path to the requesting LDNS, which is exactly the data that is missing when the preferred method fails - hence the grammar keeps it out of the alternate tier."]),
  M("cpu", "CPU", "dynamic", "server-side", false,
    "Selects the virtual server that currently has the most CPU processing time available to handle name resolution requests.",
    []),
  M("drop-packet", "Drop Packet", "static", "none", true,
    "Does nothing with the packet, and simply drops the request.",
    ["The manual's stated use: most often selected as the Alternate method, to make sure the system does not hand out an address for an unavailable resource."]),
  M("fallback-ip", "Fallback IP", "static", "none", true,
    "Returns the IP address that you specify (the pool's fallback-ip) as the answer to the query.",
    ["The address is not monitored for availability; the manual scopes this method to disaster recovery, and to the Fallback tier specifically."]),
  M("fewest-hops", "Fewest Hops", "dynamic", "ldns-path", false,
    "Selects the virtual server in the data center that has the fewest router hops from the Local DNS.",
    []),
  M("global-availability", "Global Availability", "static", "none", true,
    "Distributes requests to the virtual servers in the pool in the order in which they are listed: the first available resource keeps receiving requests until it becomes unavailable.",
    ["The manual adds the pairing rule: selecting the next resource in the list only happens when the Fallback method is set to None."]),
  M("kilobytes-per-second", "Kilobytes/Second", "dynamic", "server-side", false,
    "Selects the virtual server currently processing the fewest kilobytes per second.",
    []),
  M("least-connections", "Least Connections", "dynamic", "server-side", false,
    "Selects the virtual server on the Local Traffic Manager that currently hosts the fewest connections.",
    ["The count lives on the LTM that hosts the virtual server - a server-side statistic, not a path measurement."]),
  M("lowest-round-trip-time", "Round Trip Time", "dynamic", "ldns-path", false,
    "Selects the virtual server with the fastest measured round trip time between a data center and the client LDNS.",
    []),
  M("packet-rate", "Packet Rate", "dynamic", "server-side", true,
    "Selects the virtual server currently processing the fewest packets per second.",
    ["Measured, yet admitted as an alternate: the packets-per-second statistic is server-side, so it survives the missing-path-metrics situation that usually causes the preferred method to fail."]),
  M("quality-of-service", "Quality of Service", "dynamic", "ldns-path", false,
    "Calculates an overall score for each virtual server from current performance information, then distributes requests based on those scores.",
    ["The score blends weighted factors; the pool's qos-* coefficients set the weights (defaults: rtt 50, lcs 30, hit-ratio 5, kbps 3, packet-rate 1, the rest 0)."]),
  M("ratio", "Ratio", "static", "none", true,
    "Distributes requests among the pool's virtual servers using a weighted Round Robin: each member receives requests in proportion to its ratio weight.",
    []),
  M("return-to-dns", "Return to DNS", "static", "none", true,
    "Immediately returns the request to the Local DNS for resolution.",
    ["This is the DEFAULT fallback-mode: unless configured otherwise, a pool whose preferred and alternate methods both fail hands the query back."]),
  M("round-robin", "Round Robin", "static", "none", true,
    "Distributes requests in a circular, sequential pattern among the virtual servers in the pool. The default preferred and alternate mode.",
    []),
  M("static-persistence", "Static Persist", "static", "none", true,
    "Consistently maps an LDNS IP address to the same available virtual server for the duration of a session.",
    []),
  M("topology", "Topology", "static", "none", true,
    "Uses proximity-based load balancing: topology records score the candidates and the best score wins.",
    ["The record sorting and scoring mechanics have their own tool and article; see the topology longest-match scorer."]),
  M("virtual-server-capacity", "Virtual Server Capacity", "dynamic", "server-side", true,
    "Builds a list of the virtual servers weighted by capacity and picks from it: the servers with the greatest capacity are picked most often, but over time all are returned.",
    ["The tmsh reference's alternate-mode text describes this token with the Virtual Server Score wording (a user-defined ranking); the preferred-mode text carries the real weighted-by-capacity semantics. A documented copy quirk worth knowing when reading the man page."]),
  M("virtual-server-score", "Virtual Server Score", "dynamic", "server-side", true,
    "Assigns requests to virtual servers based on a user-defined ranking system.",
    ["The Load Balancing manual restricts it to pool members controlled by LTM systems - the score is an LTM-side ranking."]),
  M("none", "None", "static", "none", true,
    "Skips the tier. As an alternate: jump straight to the fallback method. As a fallback: use the next pool; with no more pools, the result is the same as return-to-dns.",
    ["The manual completes the cascade: with multiple pools all exhausted, the system returns an aggregate of ALL pool members' addresses using BIND."]),
]);

const GTM_BY_TOKEN: ReadonlyMap<string, GtmMethodExplain> = new Map(GTM_METHODS.map((m) => [m.token, m]));

/** The dynamic-ratio option's documented applicability set (tmsh gtm pool a). */
const DYNAMIC_RATIO_SCOPE = new Set([
  "completion-rate",
  "fewest-hops",
  "kilobytes-per-second",
  "least-connections",
  "lowest-round-trip-time",
  "quality-of-service",
  "virtual-server-capacity",
  "virtual-server-score",
]);

/** GUI-style aliases -> canonical tokens. */
function canonMethod(raw: string): string | null {
  const s = raw.trim().toLowerCase().replace(/[()]/g, " ").replace(/[_\s]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (!s) return null;
  if (GTM_BY_TOKEN.has(s)) return s;
  const gui: Record<string, string> = {
    "round-trip-time": "lowest-round-trip-time",
    rtt: "lowest-round-trip-time",
    "static-persist": "static-persistence",
    qos: "quality-of-service",
    "vs-capacity": "virtual-server-capacity",
    "vs-score": "virtual-server-score",
    hops: "fewest-hops",
    "kbps": "kilobytes-per-second",
    ga: "global-availability",
  };
  return gui[s] ?? null;
}

// ---------------------------------------------------------------------------
// The wide-IP tier (pool-lb-mode). Grammar per the tmsh gtm wideip a
// reference: four tokens, default round-robin; the v13 reference text also
// describes `random`, which the current syntax line no longer lists.
// ---------------------------------------------------------------------------

export const WIDEIP_METHODS: readonly { token: string; note: string; current: boolean }[] = Object.freeze([
  { token: "round-robin", note: "Selects pools sequentially. The default.", current: true },
  { token: "global-availability", note: "Repeatedly selects the FIRST pool in the list for as long as it is available; only when it becomes unavailable does the next pool in the list take over.", current: true },
  { token: "ratio", note: "Selects a pool based on the ratio assigned to the pool on this wide IP.", current: true },
  { token: "topology", note: "Selects a pool based on topology information in the incoming LDNS request.", current: true },
  { token: "random", note: "Selects a pool in no pattern or order. Described in the v13 wideip reference; absent from the current syntax line - a version-dependent token.", current: false },
]);

const WIP_BY_TOKEN = new Map(WIDEIP_METHODS.map((m) => [m.token, m]));

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

function intOf(v: string | undefined): number | undefined {
  if (v === undefined) return undefined;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}

const TIER_NOTES: Record<ChainStep["tier"], string> = {
  preferred: "Tried first. May be static or dynamic; a dynamic method here is the usual reason the chain advances - the manual notes a preferred-method failure usually means the proper metrics could not be acquired.",
  alternate: "Tried when the preferred method fails. The grammar admits only methods that need no LDNS path metrics; per the manual, the alternate method can be only static.",
  fallback: "Tried when preferred and alternate both fail. To ensure the system returns a response, the fallback method IGNORES the availability status of the resource.",
};

/** Read the three-tier chain and settings from one gtm pool node. */
function readGtmPool(node: ConfigNode, recordType: string): GtmPoolReading {
  const { name } = asTopLevel(node);
  let preferred: string | null = null;
  let alternate: string | null = null;
  let fallback: string | null = null;
  let fallbackIp: string | undefined;
  let dynamicRatio: string | undefined;
  let verifyAvail: string | undefined;
  let manualResume: string | undefined;
  let maxAnswers: number | undefined;
  let ttl: number | undefined;
  const qos: Record<string, number> = {};
  let memberCount = 0;
  let membersWithRatio = 0;

  for (const child of node.children ?? []) {
    if (child.children !== undefined) {
      if (child.tokens[0] === "members") {
        for (const m of child.children ?? []) {
          if (m.children === undefined) continue;
          memberCount++;
          for (const f of m.children) {
            if (f.children !== undefined) continue;
            const { key, value } = asKeyValue(f);
            if (key === "ratio" && intOf(value) !== undefined && intOf(value) !== 1) membersWithRatio++;
          }
        }
      }
      continue;
    }
    const { key, value } = asKeyValue(child);
    if (key === "load-balancing-mode") preferred = value;
    else if (key === "alternate-mode") alternate = value;
    else if (key === "fallback-mode") fallback = value;
    else if (key === "fallback-ip") fallbackIp = value;
    else if (key === "dynamic-ratio") dynamicRatio = value;
    else if (key === "verify-member-availability") verifyAvail = value;
    else if (key === "manual-resume") manualResume = value;
    else if (key === "max-answers-returned") maxAnswers = intOf(value);
    else if (key === "ttl") ttl = intOf(value);
    else if (key.startsWith("qos-")) {
      const n = intOf(value);
      if (n !== undefined) qos[key] = n;
    }
  }

  // ---- chain resolution: tmsh defaults are round-robin / round-robin /
  // return-to-dns per the gtm pool a reference.
  const mk = (tier: ChainStep["tier"], asWritten: string | null, dflt: string): ChainStep => {
    const token = asWritten ? (canonMethod(asWritten) ?? asWritten) : dflt;
    return {
      tier,
      tokenAsWritten: asWritten,
      token,
      method: GTM_BY_TOKEN.get(token) ?? null,
      defaulted: asWritten === null,
      tierNote: TIER_NOTES[tier],
    };
  };
  const chain = [
    mk("preferred", preferred, "round-robin"),
    mk("alternate", alternate, "round-robin"),
    mk("fallback", fallback, "return-to-dns"),
  ];

  // ---- settings, annotated -------------------------------------------------
  const settings: FieldNote[] = [];
  if (fallbackIp !== undefined) settings.push({ key: "fallback-ip", value: fallbackIp, note: "the address the Fallback IP method returns; not monitored for availability" });
  if (dynamicRatio !== undefined) settings.push({ key: "dynamic-ratio", value: dynamicRatio, note: "disabled: best metric wins outright; enabled: metrics become ratios and every member serves in proportion" });
  if (verifyAvail !== undefined) settings.push({ key: "verify-member-availability", value: verifyAvail, note: "whether member availability is verified before sending a connection (default enabled)" });
  if (manualResume !== undefined) settings.push({ key: "manual-resume", value: manualResume, note: "enabled: a member that went down stays out until re-enabled by hand" });
  if (maxAnswers !== undefined) settings.push({ key: "max-answers-returned", value: String(maxAnswers), note: "how many available virtual servers a response lists (default 1)" });
  if (ttl !== undefined) settings.push({ key: "ttl", value: String(ttl), note: "answer TTL in seconds (default 30)" });
  for (const [k, v] of Object.entries(qos)) settings.push({ key: k, value: String(v), note: "Quality of Service coefficient" });

  // ---- observations ---------------------------------------------------------
  const obs: string[] = [];
  const pref = chain[0], alt = chain[1], fb = chain[2];

  // Grammar validation per tier.
  if (pref.method === null) obs.push(`"${pref.tokenAsWritten}" is not a documented load-balancing-mode token. Type "methods" for the catalogue.`);
  if (pref.method && pref.token === "none") obs.push(`The preferred tier's grammar does not admit "none"; the tmsh reference lists it only for alternate-mode and fallback-mode.`);
  if (alt.method === null) obs.push(`"${alt.tokenAsWritten}" is not a documented alternate-mode token.`);
  else if (!alt.method.allowedIn.alternate) {
    obs.push(
      `alternate-mode ${alt.token} is outside the tmsh grammar for the alternate tier. The reference admits only: drop-packet, fallback-ip, global-availability, none, packet-rate, ratio, return-to-dns, round-robin, static-persistence, topology, virtual-server-capacity, virtual-server-score - the manual's rule that the alternate can be only static, expressed as a token list (the measured exceptions all use server-side statistics, never the LDNS path).`,
    );
  }
  if (fb.method === null) obs.push(`"${fb.tokenAsWritten}" is not a documented fallback-mode token.`);

  // The fallback tier's defining property, stated on every resolved chain.
  if (fb.method && fb.token !== "none") {
    obs.push(
      `Fallback resolves with ${fb.method.gui}, and the fallback tier ignores the availability status of the resource - the manual is explicit that this exists so the system always returns a response. An answer from this tier can point at a member that monitors consider down.`,
    );
  }
  if (fb.defaulted) {
    obs.push("No fallback-mode is set, so the documented default applies: return-to-dns. Preferred and alternate both failing hands the query back to the requesting LDNS.");
  }

  // Fallback IP wiring.
  const usesFallbackIp = chain.some((s) => s.token === "fallback-ip");
  const ipUnset = fallbackIp === undefined || fallbackIp === "::" || fallbackIp === "0.0.0.0";
  if (usesFallbackIp && ipUnset) {
    obs.push(
      `A tier resolves with the Fallback IP method, but fallback-ip is ${fallbackIp === undefined ? "not set" : `"${fallbackIp}" (the unset default)`}. The method answers with exactly this address; as configured, the disaster-recovery answer is empty.`,
    );
  }
  if (!usesFallbackIp && fallbackIp !== undefined && !ipUnset) {
    obs.push(`fallback-ip is set to ${fallbackIp}, but no tier uses the Fallback IP method, so the address is never returned.`);
  }

  // dynamic-ratio scope check (the tmsh reference's exact applicability list).
  if (dynamicRatio === "enabled" && pref.method && !DYNAMIC_RATIO_SCOPE.has(pref.token)) {
    obs.push(
      `dynamic-ratio is enabled, but the reference scopes it to these preferred modes: completion-rate, fewest-hops, kilobytes-per-second, least-connections, lowest-round-trip-time, quality-of-service, virtual-server-capacity, virtual-server-score. With ${pref.method.gui} preferred, the option has no documented effect.`,
    );
  }
  if (dynamicRatio === "enabled" && pref.method && DYNAMIC_RATIO_SCOPE.has(pref.token)) {
    obs.push(
      `dynamic-ratio enabled: instead of the single best-metric member taking everything, the metrics are treated as ratios and every member serves in proportion - the manual's example: RTTs of 50 and 100 microseconds mean the faster member answers twice as often, not always.`,
    );
  }

  // QoS coefficient sanity when a tier uses quality-of-service.
  if (chain.some((s) => s.token === "quality-of-service")) {
    const set = Object.entries(qos);
    if (set.length > 0 && set.every(([, v]) => v === 0)) {
      obs.push("A tier uses Quality of Service but every configured qos-* coefficient is 0: the score has nothing to weigh. The defaults weigh rtt 50, lcs 30, hit-ratio 5, kbps 3 and packet-rate 1.");
    }
  }

  // Ratios present but no ratio-consuming tier.
  if (membersWithRatio > 0 && !chain.some((s) => s.token === "ratio")) {
    obs.push(`${membersWithRatio} member${membersWithRatio === 1 ? " carries" : "s carry"} a ratio weight, but no tier uses the Ratio method, so the weights never apply.`);
  }

  // Global availability pairing note (the manual's rule).
  if (chain.some((s) => s.token === "global-availability") && fb.token !== "none") {
    obs.push("Global Availability walks its ordered list to the next resource only when the Fallback method is None (the manual's pairing rule). With a different fallback configured here, exhaustion goes to the fallback tier instead of down the list.");
  }

  if (verifyAvail === "disabled") {
    obs.push("verify-member-availability is disabled: the system does not verify member availability before answering (the default is enabled).");
  }
  if (manualResume === "enabled") {
    obs.push("manual-resume is enabled: a member that goes down stays out of rotation until someone re-enables it by hand, even after its monitors recover.");
  }

  return {
    name,
    recordType,
    line: node.line,
    chain,
    settings,
    memberCount,
    membersWithRatio,
    observations: obs,
  };
}

/** Read one gtm wideip node: pool-lb-mode + attached pools + settings. */
function readWideip(node: ConfigNode, recordType: string): WideipReading {
  const { name } = asTopLevel(node);
  let plm: string | null = null;
  let persistence: string | undefined;
  let ttlPersistence: number | undefined;
  let lastResort: string | undefined;
  let failureRcodeResponse: string | undefined;
  let failureRcode: string | undefined;
  let logVerbosity: string | undefined;
  const pools: WideipReading["pools"] = [];

  for (const child of node.children ?? []) {
    if (child.children !== undefined) {
      if (child.tokens[0] === "pools" || child.tokens[0] === "pools-cname") {
        for (const p of child.children ?? []) {
          if (p.children === undefined) {
            // pools may list bare names
            pools.push({ name: p.tokens.join(" ") });
            continue;
          }
          const entry: WideipReading["pools"][number] = { name: p.tokens.join(" ") };
          for (const f of p.children) {
            if (f.children !== undefined) continue;
            const { key, value } = asKeyValue(f);
            if (key === "order") entry.order = intOf(value);
            else if (key === "ratio") entry.ratio = intOf(value);
          }
          pools.push(entry);
        }
      }
      continue;
    }
    const { key, value } = asKeyValue(child);
    if (key === "pool-lb-mode") plm = value;
    else if (key === "persistence") persistence = value;
    else if (key === "ttl-persistence") ttlPersistence = intOf(value);
    else if (key === "last-resort-pool") lastResort = value;
    else if (key === "failure-rcode-response") failureRcodeResponse = value;
    else if (key === "failure-rcode") failureRcode = value;
    else if (key === "load-balancing-decision-log-verbosity") logVerbosity = value;
  }

  const token = plm ? (canonMethod(plm) ?? plm) : "round-robin";
  const wm = WIP_BY_TOKEN.get(token);

  const settings: FieldNote[] = [];
  if (persistence !== undefined) settings.push({ key: "persistence", value: persistence, note: "pin an LDNS to its previous answer for ttl-persistence seconds" });
  if (ttlPersistence !== undefined) settings.push({ key: "ttl-persistence", value: String(ttlPersistence), note: "persistence entry lifetime in seconds (default 3600)" });
  if (lastResort !== undefined) settings.push({ key: "last-resort-pool", value: lastResort, note: "the pool used when every configured pool is exhausted" });
  if (failureRcodeResponse !== undefined) settings.push({ key: "failure-rcode-response", value: failureRcodeResponse, note: "answer failures with a DNS RCODE instead of falling through" });
  if (failureRcode !== undefined) settings.push({ key: "failure-rcode", value: failureRcode, note: "the RCODE returned when failure-rcode-response is enabled" });
  if (logVerbosity !== undefined) settings.push({ key: "load-balancing-decision-log-verbosity", value: logVerbosity, note: "the built-in way to watch this decision flow happen: pool-selection, pool-traversal, pool-member-selection, pool-member-traversal" });

  const obs: string[] = [];
  if (!wm) {
    obs.push(`"${plm}" is not a documented pool-lb-mode. The wideip reference lists: global-availability, ratio, round-robin, topology (and the v13 text also describes random).`);
  } else {
    if (plm === null) obs.push("No pool-lb-mode is set, so pool selection runs Round Robin - the documented default.");
    if (!wm.current) obs.push("pool-lb-mode random: described in the v13 wideip reference but absent from the current syntax line - version-dependent; verify on your version before relying on it.");
    if (token === "ratio" && pools.length > 0 && pools.every((p) => p.ratio === undefined)) {
      obs.push("pool-lb-mode is ratio, but none of the attached pools carries a ratio value on this wide IP; without weights there is no proportion to follow.");
    }
    if (token === "global-availability" && pools.length > 1 && pools.every((p) => p.order === undefined)) {
      obs.push("Global Availability follows the order of the pool list; no explicit order values are set here, so the listed order is the priority order.");
    }
  }
  if (pools.length <= 1) {
    obs.push("pool-lb-mode is relevant only when multiple pools are configured (the reference's own scoping); with a single pool the selection tier has nothing to choose between.");
  }

  return {
    name,
    recordType,
    line: node.line,
    poolLbModeAsWritten: plm,
    poolLbMode: token,
    poolLbNote: wm?.note ?? "",
    pools,
    settings,
    observations: obs,
  };
}

// ---------------------------------------------------------------------------
// run() - the single entry point (plain-string input, like its siblings).
// ---------------------------------------------------------------------------

const GTM_POOL_TYPES = new Set(["a", "aaaa", "mx", "cname", "srv", "naptr"]);

export function run(input: string): GslbResult {
  const text = (input ?? "").trim();

  if (!text) {
    throw new Error(
      'Paste gtm wideip and/or gtm pool stanzas, a method name (for example "quality-of-service"), or the word "methods" for the full catalogue.',
    );
  }

  if (/^(methods|all|list)$/i.test(text)) {
    return {
      ok: true,
      mode: "catalog",
      catalog: [...GTM_METHODS],
      wideipMethods: WIDEIP_METHODS.map((m) => ({ token: m.token, note: m.note })),
      notes: [
        "Pool-tier grammar per the tmsh gtm pool a reference: 18 preferred tokens; 12 admitted as alternate; all 18 plus none admitted as fallback. Wide-IP tier per the gtm wideip a reference.",
      ],
    };
  }

  if (!text.includes("{") && !/\n/.test(text) && !/^gtm\s/i.test(text)) {
    const token = canonMethod(text);
    if (token) {
      return { ok: true, mode: "method", method: GTM_BY_TOKEN.get(token)!, notes: [] };
    }
    throw new Error(`"${text}" is not a documented GTM load-balancing method. Type "methods" to list the catalogue.`);
  }

  const parsed = parseTmsh(text);
  const wideips: WideipReading[] = [];
  const pools: GtmPoolReading[] = [];

  for (const node of parsed.nodes) {
    const { type } = asTopLevel(node);
    const parts = type.split(" ");
    if (parts[0] !== "gtm") continue;
    if (parts[1] === "pool" && parts.length === 3 && GTM_POOL_TYPES.has(parts[2])) {
      pools.push(readGtmPool(node, parts[2]));
    } else if (parts[1] === "wideip" && parts.length === 3) {
      wideips.push(readWideip(node, parts[2]));
    }
  }

  if (wideips.length === 0 && pools.length === 0) {
    const hint = !parsed.ok && parsed.error ? ` (parser: ${parsed.error.message})` : "";
    throw new Error(
      `No gtm wideip or gtm pool stanzas found${hint}. Paste them (tmsh list gtm wideip a <name> / gtm pool a <name>), a method name, or type "methods".`,
    );
  }

  const notes: string[] = [];
  if (!parsed.ok && parsed.error) {
    notes.push(`parser: ${parsed.error.message}${parsed.error.line ? ` (line ${parsed.error.line})` : ""} - reading what parsed cleanly.`);
  }

  // Cross-object observation: topology at both tiers wants pool fallback none
  // (the Load Balancing manual's Topology chapter warning).
  const wipTopo = wideips.filter((w) => w.poolLbMode === "topology");
  if (wipTopo.length > 0) {
    for (const p of pools) {
      const prefTopo = p.chain[0].token === "topology";
      const fbNotNone = p.chain[2].token !== "none";
      if (prefTopo && fbNotNone) {
        p.observations.push(
          `Topology runs at both tiers (wide IP ${wipTopo.map((w) => w.name).join(", ")} and this pool), and this pool's fallback is ${p.chain[2].token}. The Load Balancing manual's warning applies: set each pool's Fallback to None in this arrangement, or the system can send a request to a pool with no available members and fall back to BIND; with None, an empty pool passes the request to another pool instead.`,
        );
      }
    }
  }

  return { ok: true, mode: "config", wideips, pools, notes };
}
