// ============================================================================
// src/lib/tools/fortigate-route-selection-explainer/compute.ts
// ----------------------------------------------------------------------------
// FORTIGATE ROUTE SELECTION EXPLAINER — pure engine.
//
// WHAT IT ANSWERS
// "I configured this route and traffic is not using it. Why?"
//
// THE DISTINCTION THE WHOLE TOOL EXISTS FOR
// Administrative distance and priority are routinely conflated and they do
// different jobs at different moments:
//
//   DISTANCE decides which route is INSTALLED in the forwarding table. It
//     compares routes to the SAME destination and the lowest value wins. The
//     loser is not merely deprioritised, it is ABSENT — invisible in the
//     routing table, which is exactly why "my route is not working" so often
//     means "my route never installed".
//
//   PRIORITY decides which of several ALREADY-INSTALLED routes is preferred.
//     It only ever applies to routes that survived the distance comparison,
//     and again the lower value wins.
//
// Consequences that follow and that the tool states explicitly:
//   - same prefix + SAME distance  -> both install, priority chooses
//   - same prefix + DIFFERENT distance -> only one installs; the other is a
//     FLOATING BACKUP that appears only when the first is withdrawn
//   - same prefix + same distance + same priority -> ECMP across both
//
// Forwarding then picks the LONGEST matching prefix among installed routes.
//
// Pure, bounded, never fetches, never evaluates input as code.
// ============================================================================

import { say, plainText, engineError, type EngineText } from "../engine-text"; // sentences with ids (02/11/2026)
// PAGE LANGUAGE (02/11/2026): every detail, note, warning and error is built as an EngineText (a stable id, the
// English as before, and its values). runLocalisable() returns them as such for the page (pack keys
// tools.fortigate-route-selection-explainer.engine.<id>); run(), parseInput() and select() return plainText() of the
// same readings, so the API, the share spec and the golden vectors are unchanged.

const MAX_INPUT = 50_000;
const MAX_ROUTES = 500;

export interface RouteEntry {
  readonly prefix: string;
  readonly gw: string | null;
  readonly dev: string | null;
  readonly distance: number;
  readonly priority: number;
  /** Down routes are parsed so the tool can say WHY a backup activated. */
  readonly up: boolean;
  readonly order: number;
}

export type RouteVerdict =
  | "selected"        // installed, longest match, preferred
  | "ecmp"            // installed and load-shared with the selected route
  | "installed"       // in the table but a longer prefix matched, or lower priority
  | "floating"        // lost the distance comparison: NOT in the table
  | "down"            // link health withdrew it
  | "no-match";       // does not cover the destination

/** S is string in the API's reading and EngineText in the page's (runLocalisable). */
export interface RouteEvaluation<S = string> {
  readonly route: RouteEntry;
  readonly verdict: RouteVerdict;
  readonly detail: S; // a sentence
}

/** S is string in the API's reading and EngineText in the page's. */
export interface RouteResult<S = string> {
  readonly mode: "select" | "reference";
  readonly destination: string | null;
  readonly routes: readonly RouteEntry[];
  readonly evaluations: readonly RouteEvaluation<S>[]; // each route's verdict
  readonly selected: readonly RouteEntry[];
  readonly notes: readonly S[]; // each a sentence
  readonly parseWarnings: readonly S[]; // each a sentence
}

/** S is string in the API's reading and EngineText in the page's. */
export interface ToolRunResult<S = string> {
  readonly result: RouteResult<S>; // the reading
}

// ---------------------------------------------------------------------------
// IPv4 prefix maths. Deliberately explicit so the containment test is easy to
// audit: a wrong answer here would be a confidently wrong routing decision.
// ---------------------------------------------------------------------------

/** Parse dotted-quad to a 32-bit unsigned value, or null when malformed. */
export function ipToInt(ip: string): number | null {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return null;
  let v = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const n = Number(p);
    if (n > 255) return null;
    v = (v << 8) | n;
  }
  return v >>> 0;
}

/** Split "a.b.c.d/len" into its parts. Returns null when malformed. */
export function parsePrefix(s: string): { base: number; len: number } | null {
  const m = /^([0-9.]+)\/(\d{1,2})$/.exec(s.trim());
  if (!m) return null;
  const base = ipToInt(m[1]);
  const len = Number(m[2]);
  if (base === null || len < 0 || len > 32) return null;
  // Mask the base so 10.1.2.3/24 is treated as 10.1.2.0/24 rather than
  // silently failing to contain its own hosts.
  const mask = len === 0 ? 0 : (0xffffffff << (32 - len)) >>> 0;
  return { base: (base & mask) >>> 0, len };
}

/** Does the prefix contain the address? */
export function contains(prefix: string, addr: string): boolean {
  const p = parsePrefix(prefix);
  const a = ipToInt(addr);
  if (!p || a === null) return false;
  const mask = p.len === 0 ? 0 : (0xffffffff << (32 - p.len)) >>> 0;
  return ((a & mask) >>> 0) === p.base;
}

// ---------------------------------------------------------------------------

/** Read the box: the API's reading, warnings in English, exactly as before 02/11/2026. */
export function parseInput(text: string): {
  destination: string | null; routes: RouteEntry[]; warnings: string[];
} {
  return plainText(parseInputLocalisable(text)); // the same reading, as English
} // parseInput

/** Read the box: the page's reading, each warning an EngineText. */
function parseInputLocalisable(text: string): {
  destination: string | null; routes: RouteEntry[]; warnings: EngineText[];
} {
  const warnings: EngineText[] = []; // each warning with its id
  const routes: RouteEntry[] = [];
  const d = /^\s*destination\s*[:=]\s*(\S+)/im.exec(text);
  const destination = d ? d[1].trim() : null;

  const re = /^\s*route\s*:\s*(.+)$/gim;
  let m: RegExpExecArray | null;
  let order = 0;
  while ((m = re.exec(text)) !== null) {
    if (routes.length >= MAX_ROUTES) { warnings.push(say("warn.capped", `Only the first ${MAX_ROUTES} routes were parsed.`, { max: String(MAX_ROUTES) })); break; } // capped
    const f: Record<string, string> = {};
    for (const part of m[1].split(/\s*,\s*/)) {
      const kv = /^\s*([a-z]+)\s*=\s*(.+?)\s*$/i.exec(part);
      if (kv) f[kv[1].toLowerCase()] = kv[2];
    }
    const prefix = f.prefix ?? f.dst ?? f.network;
    if (!prefix) { const line = m[1].slice(0, 60); warnings.push(say("warn.noPrefix", `A route line had no prefix and was skipped: ${line}`, { line })); continue; } // no prefix
    if (!parsePrefix(prefix)) { warnings.push(say("warn.badPrefix", `Could not parse the prefix "${prefix}"; expected a.b.c.d/len.`, { prefix })); continue; } // a malformed prefix
    const n = (k: string, dflt: number) => {
      const x = Number(f[k]); return Number.isFinite(x) ? x : dflt;
    };
    order += 1;
    routes.push({
      prefix: prefix.trim(),
      gw: f.gw ?? f.gateway ?? null,
      dev: f.dev ?? f.interface ?? f.intf ?? null,
      // FortiOS defaults: static distance 10, priority 0. Documented, so
      // assuming them is better than refusing a line that omitted them.
      distance: n("distance", 10),
      priority: n("priority", 0),
      up: !/^(down|disable|disabled|false|no)$/i.test(f.status ?? f.up ?? "up"),
      order,
    });
  }
  if (routes.length === 0) {
    warnings.push(say("warn.noRoutes", "No routes were recognised. Each goes on its own line: route: prefix=10.2.0.0/16, gw=10.1.1.1, dev=port3, distance=10, priority=0")); // no routes
  }
  if (!destination) {
    warnings.push(say("warn.noDestination", "No destination was supplied. Add a line like: destination: 10.2.5.10")); // no destination
  }
  return { destination, routes, warnings };
}

/**
 * Run the selection.
 *
 * Order of operations mirrors the device: distance decides installation per
 * prefix, priority orders what installed, then forwarding takes the longest
 * matching prefix among installed routes.
 */
export function select(destination: string, routes: readonly RouteEntry[]): {
  evaluations: RouteEvaluation[]; selected: RouteEntry[];
} {
  return plainText(selectLocalisable(destination, routes)); // the same reading, as English (the API's)
} // select

/** Run the selection: the page's reading, each detail an EngineText. */
function selectLocalisable(destination: string, routes: readonly RouteEntry[]): {
  evaluations: RouteEvaluation<EngineText>[]; selected: RouteEntry[];
} {
  const evaluations: RouteEvaluation<EngineText>[] = []; // each route, its detail with an id

  // 1. Which routes even cover the destination.
  const matching = routes.filter((r) => r.up && contains(r.prefix, destination));

  // 2. Per prefix, the lowest distance installs; everything else is floating.
  const byPrefix = new Map<string, RouteEntry[]>();
  for (const r of matching) {
    const k = r.prefix;
    if (!byPrefix.has(k)) byPrefix.set(k, []);
    byPrefix.get(k)!.push(r);
  }
  const installed = new Set<RouteEntry>();
  const floating = new Set<RouteEntry>();
  for (const [, group] of byPrefix) {
    const min = Math.min(...group.map((r) => r.distance));
    for (const r of group) (r.distance === min ? installed : floating).add(r);
  }

  // 3. Forwarding: longest matching prefix among INSTALLED routes.
  let bestLen = -1;
  for (const r of installed) {
    const p = parsePrefix(r.prefix);
    if (p && p.len > bestLen) bestLen = p.len;
  }
  const longest = [...installed].filter((r) => (parsePrefix(r.prefix)?.len ?? -1) === bestLen);

  // 4. Among those, the lowest priority wins; equal priority means ECMP.
  const minPrio = longest.length ? Math.min(...longest.map((r) => r.priority)) : 0;
  const winners = longest.filter((r) => r.priority === minPrio);
  const winnerSet = new Set(winners);

  for (const r of routes) {
    if (!r.up) {
      evaluations.push({ route: r, verdict: "down",
        detail: say("detail.down", `Withdrawn: the route is down, so it is not in the forwarding table. This is what link health monitoring does, and it is what lets a floating backup take over when the path beyond the interface fails.`) }); // withdrawn
      continue;
    }
    if (!contains(r.prefix, destination)) {
      evaluations.push({ route: r, verdict: "no-match",
        detail: say("detail.noMatch", `${r.prefix} does not contain ${destination}.`, { prefix: r.prefix, destination }) }); // does not cover it
      continue;
    }
    if (floating.has(r)) {
      const group = byPrefix.get(r.prefix)!;
      const min = Math.min(...group.map((x) => x.distance));
      evaluations.push({ route: r, verdict: "floating",
        detail: say("detail.floating", `NOT INSTALLED. Distance ${r.distance} lost to distance ${min} for the same prefix, so this route is absent from the forwarding table rather than merely deprioritised. It is a floating backup: it appears only when the lower-distance route is withdrawn.`, { distance: String(r.distance), min: String(min) }) }); // lost on distance
      continue;
    }
    if (winnerSet.has(r)) {
      const verdict: RouteVerdict = winners.length > 1 ? "ecmp" : "selected";
      evaluations.push({ route: r, verdict,
        detail: winners.length > 1 // ECMP, or the one route
          ? (winners.length === 2 // one other route, or several
            ? say("detail.ecmpOne", `Installed, longest matching prefix (/${bestLen}), and tied on priority ${r.priority} with ${winners.length - 1} other route. Traffic is load shared across them by ECMP.`, { len: String(bestLen), priority: String(r.priority), others: String(winners.length - 1) }) // one other
            : say("detail.ecmpMany", `Installed, longest matching prefix (/${bestLen}), and tied on priority ${r.priority} with ${winners.length - 1} other routes. Traffic is load shared across them by ECMP.`, { len: String(bestLen), priority: String(r.priority), others: String(winners.length - 1) })) // several others
          : say("detail.selected", `Installed, longest matching prefix (/${bestLen}), and lowest priority (${r.priority}). This is the route traffic to ${destination} takes.`, { len: String(bestLen), priority: String(r.priority), destination }) }); // the route taken
      continue;
    }
    const p = parsePrefix(r.prefix)?.len ?? 0;
    evaluations.push({ route: r, verdict: "installed",
      detail: p < bestLen // a shorter prefix, or a priority loss
        ? say("detail.lessSpecific", `Installed and in the table, but a more specific route (/${bestLen}) also matches ${destination}. Longest prefix wins at forwarding time, so this route is used only for destinations the longer prefix does not cover.`, { len: String(bestLen), destination }) // a more specific route wins
        : say("detail.priorityLost", `Installed, but priority ${r.priority} lost to priority ${minPrio} among the routes with the longest matching prefix.`, { priority: String(r.priority), minPrio: String(minPrio) }) }); // lost on priority
  }
  return { evaluations, selected: winners };
}

function referenceResult(): RouteResult<EngineText> {
  return {
    mode: "reference", destination: null, routes: [], evaluations: [], selected: [],
    notes: [
      say("ref.policyRoute", "A policy route is consulted BEFORE the routing table and overrides it. If the table says one thing and traffic does another, look for a policy route first - this tool models the table, not policy routes."), // policy routes first
      say("ref.distance", "DISTANCE decides which route is INSTALLED. Routes to the same destination compete, the lowest distance wins, and the loser is absent from the table rather than merely deprioritised."), // distance
      say("ref.priority", "PRIORITY decides which of several ALREADY-INSTALLED routes is preferred. It never resurrects a route that lost on distance."), // priority
      say("ref.samePrefix", "Same prefix and same distance means both install and priority chooses. Different distances means one installs and the other is a floating backup."), // the consequences
      say("ref.longest", "Forwarding takes the LONGEST matching prefix among installed routes. True ties on prefix, distance and priority are load shared by ECMP."), // forwarding
      say("ref.lineDestination", "destination: 10.2.5.10"), // a sample line (code)
      say("ref.lineRoute1", "route: prefix=0.0.0.0/0, gw=192.0.2.1, dev=wan1, distance=10, priority=0"), // a sample line (code)
      say("ref.lineRoute2", "route: prefix=10.2.0.0/16, gw=10.1.1.1, dev=port3, distance=10, priority=0"), // a sample line (code)
    ],
    parseWarnings: [],
  };
}

/** Tool entry point: the API's reading (and the golden vectors'), every sentence in English, exactly as before. */
export function run(input: string): ToolRunResult {
  return plainText(runLocalisable(input)); // the same reading, sentences as their English
} // run

/** The page's reading: the same as run(), with every sentence an EngineText. Deterministic, bounded, never fetches. */
export function runLocalisable(input: string): ToolRunResult<EngineText> {
  if (typeof input !== "string") throw engineError(say("err.notString", "Input must be a string.")); // not text
  if (input.length > MAX_INPUT) {
    const chars = String(input.length), limit = String(MAX_INPUT); // the sizes
    throw engineError(say("err.tooLarge", `Input too large (${chars} chars; limit ${limit}).`, { chars, limit })); // too large
  }
  const text = input.trim();
  if (text === "") return { result: referenceResult() };
  const { destination, routes, warnings } = parseInputLocalisable(text); // the routes, warnings with ids
  if (!destination || routes.length === 0) {
    return { result: { mode: "select", destination, routes, evaluations: [], selected: [], notes: [], parseWarnings: warnings } };
  }
  if (ipToInt(destination) === null) {
    return {
      result: {
        mode: "select", destination, routes, evaluations: [], selected: [], notes: [],
        parseWarnings: [...warnings, say("warn.badDestination", `Could not parse the destination "${destination}" as an IPv4 address.`, { destination })], // not an IPv4 address
      },
    };
  }

  const { evaluations, selected } = selectLocalisable(destination, routes); // the verdicts, details with ids
  const notes: EngineText[] = []; // each note with its id
  if (selected.length === 0) {
    notes.push(say("note.unroutable", `No installed route covers ${destination}. The packet would be dropped as unroutable.`, { destination })); // unroutable
  }
  const floatingCount = evaluations.filter((e) => e.verdict === "floating").length;
  if (floatingCount > 0) {
    const count = String(floatingCount); // how many
    notes.push(floatingCount === 1 // one route, or several
      ? say("note.floatingOne", `${count} route is configured but NOT in the forwarding table, having lost the distance comparison. A route you cannot find in \`get router info routing-table all\` did not fail to save; it lost on distance.`, { count }) // one
      : say("note.floatingMany", `${count} routes are configured but NOT in the forwarding table, having lost the distance comparison. A route you cannot find in \`get router info routing-table all\` did not fail to save; it lost on distance.`, { count })); // several
  }
  if (selected.length > 1) {
    notes.push(say("note.ecmp", "Several routes tied completely, so ECMP load shares across them. The default hash is source-IP based, which keeps a given source on a consistent path - per-packet sharing across paths of different latency causes reordering.")); // ECMP
  }
  notes.push(say("note.scope", "This models the routing table only. A policy route is consulted BEFORE the table and overrides it, and SD-WAN rules select a member before the table is reached.")); // the scope

  return { result: { mode: "select", destination, routes, evaluations, selected, notes, parseWarnings: warnings } };
}
