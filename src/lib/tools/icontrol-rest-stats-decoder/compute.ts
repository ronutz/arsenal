// ============================================================================
// src/lib/tools/icontrol-rest-stats-decoder/compute.ts
// ----------------------------------------------------------------------------
// iCONTROL REST STATS DECODER - the pure engine.
//
// THE PROBLEM. Ask a BIG-IP for statistics and it answers in a shape that is
// correct, self-describing, and almost unreadable:
//
//   { "entries": {
//       "https://localhost/mgmt/tm/ltm/pool/~Common~web_pool/stats": {
//         "nestedStats": {
//           "entries": {
//             "activeMemberCnt": { "value": 2 },
//             "status.availabilityState": { "description": "available" },
//             "serverside.bitsIn": { "value": 84920312 }
//   } } } } }
//
// Every leaf is wrapped in `value` or `description`; every level is wrapped in
// `entries` and `nestedStats`; and the keys of the outer `entries` object are
// full URLs. Three levels of envelope around one number.
//
// This flattens it: one line per statistic, the URL key reduced to the object
// it names, and `value`/`description` unwrapped. It is a pure local transform -
// nothing is fetched and nothing leaves the browser.
//
// WHAT IT DOES NOT DO. It does not interpret the statistics. `serverside.bitsIn`
// is reported as a number, not as a rate, because the response contains no
// interval and inventing one would be worse than saying nothing. Where F5
// splits a 64-bit counter into `high` and `low` halves the tool says so and
// combines them, because that is arithmetic rather than interpretation.
// ============================================================================

/** One flattened statistic. */
export interface StatEntry {
  /** The object this statistic belongs to, reduced from the URL key. */
  object: string;
  /** The statistic's name, e.g. "serverside.bitsIn". */
  key: string;
  /** The unwrapped value: a number, a string, or a boolean. */
  value: string | number | boolean;
  /** Which wrapper the value came out of. */
  from: "value" | "description" | "combined-64bit";
}

export interface StatsDecode {
  /** Every statistic, flattened. */
  stats: StatEntry[];
  /** Distinct objects found, in order of first appearance. */
  objects: string[];
  notes: string[];
  warnings: string[];
}

export class StatsDecodeError extends Error {
  code: "empty" | "not-json" | "not-stats";
  constructor(code: "empty" | "not-json" | "not-stats", message: string) {
    super(message);
    this.name = "StatsDecodeError";
    this.code = code;
  }
}

/**
 * Reduce a selfLink-style URL key to the object it names.
 * `https://localhost/mgmt/tm/ltm/pool/~Common~web_pool/stats` -> `/Common/web_pool`
 * Falls back to the raw key when it is not a URL, which is the honest result.
 */
function objectFromKey(key: string): string {
  const withoutQuery = key.split("?")[0];
  const m = /\/mgmt\/tm\/[^?]*?\/([^/]+)\/stats\/?$/.exec(withoutQuery);
  if (m) {
    const seg = decodeURIComponent(m[1]);
    return seg.startsWith("~") ? `/${seg.split("~").filter(Boolean).join("/")}` : seg;
  }
  // A members collection or similar: take the last two meaningful segments.
  const parts = withoutQuery.split("/").filter(Boolean);
  const tail = parts.filter((p) => p !== "stats").slice(-1)[0];
  if (tail) {
    const seg = decodeURIComponent(tail);
    return seg.startsWith("~") ? `/${seg.split("~").filter(Boolean).join("/")}` : seg;
  }
  return key;
}

type Unknown = Record<string, unknown>;

/** Recursively walk the entries/nestedStats envelopes. */
function walk(node: Unknown, object: string, out: StatEntry[], notes: string[]) {
  const entries = node.entries as Unknown | undefined;
  if (!entries || typeof entries !== "object") return;

  // Collect halves of split 64-bit counters so they can be combined afterwards.
  const halves = new Map<string, { high?: number; low?: number }>();

  for (const [k, raw] of Object.entries(entries)) {
    const v = raw as Unknown;
    if (!v || typeof v !== "object") continue;

    // A nested object: recurse, using its own key as the object name when the
    // key looks like a URL (a pool member inside a pool, for example).
    if (v.nestedStats) {
      const child = k.includes("://") || k.includes("/mgmt/") ? objectFromKey(k) : object;
      walk(v.nestedStats as Unknown, child, out, notes);
      continue;
    }

    if ("value" in v) {
      const val = v.value as string | number | boolean;
      const hi = /^(.*)\.high$/.exec(k);
      const lo = /^(.*)\.low$/.exec(k);
      if (hi && typeof val === "number") {
        const e = halves.get(hi[1]) ?? {}; e.high = val; halves.set(hi[1], e); continue;
      }
      if (lo && typeof val === "number") {
        const e = halves.get(lo[1]) ?? {}; e.low = val; halves.set(lo[1], e); continue;
      }
      out.push({ object, key: k, value: val, from: "value" });
    } else if ("description" in v) {
      out.push({ object, key: k, value: v.description as string, from: "description" });
    }
  }

  for (const [base, h] of halves) {
    if (h.high !== undefined && h.low !== undefined) {
      // Combined as a BigInt so a large counter is not silently rounded.
      const combined = (BigInt(h.high) << 32n) + BigInt(h.low >>> 0);
      out.push({ object, key: base, value: combined.toString(), from: "combined-64bit" });
      notes.push(`"${base}" arrived split into .high and .low halves and has been combined. F5 splits 64-bit counters this way because JSON numbers cannot carry them safely.`);
    } else {
      const only = h.high !== undefined ? "high" : "low";
      out.push({ object, key: `${base}.${only}`, value: (h.high ?? h.low) as number, from: "value" });
    }
  }
}

/** Decode an iControl REST stats response. */
export function decodeStats(input: string): StatsDecode {
  const trimmed = (input ?? "").trim();
  if (!trimmed) throw new StatsDecodeError("empty", "Nothing to decode: paste an iControl REST stats response.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (e) {
    throw new StatsDecodeError("not-json", `That is not valid JSON: ${(e as Error).message}`);
  }
  if (!parsed || typeof parsed !== "object") {
    throw new StatsDecodeError("not-stats", "The response parsed, but it is not an object.");
  }

  const root = parsed as Unknown;
  const notes: string[] = [];
  const warnings: string[] = [];
  const stats: StatEntry[] = [];

  const entries = root.entries as Unknown | undefined;
  if (!entries || typeof entries !== "object") {
    throw new StatsDecodeError(
      "not-stats",
      "No `entries` object at the top level. iControl REST stats responses always carry one - this looks like a configuration response rather than a stats response.",
    );
  }

  for (const [k, raw] of Object.entries(entries)) {
    const v = raw as Unknown;
    const object = objectFromKey(k);
    if (v && typeof v === "object" && v.nestedStats) {
      walk(v.nestedStats as Unknown, object, stats, notes);
    } else if (v && typeof v === "object") {
      walk(v, object, stats, notes);
    }
  }

  if (stats.length === 0) {
    warnings.push("The response carried an `entries` object but no statistics were found inside it.");
  }

  const objects = [...new Set(stats.map((s) => s.object))];
  if (objects.length > 1) {
    notes.push(`${objects.length} objects are present in this response. A collection endpoint returns every member, which is why a pool's stats and each of its members' stats can arrive together.`);
  }
  notes.push(
    "Counters here are totals since the last reset, not rates. The response carries no interval, so a rate cannot be derived from a single sample - take two and divide by the time between them.",
  );

  return { stats, objects, notes, warnings };
}

/** Flatten to pasteable text. */
export function statsToText(d: StatsDecode): string {
  const width = Math.max(...d.stats.map((s) => s.key.length), 10);
  const byObject = new Map<string, StatEntry[]>();
  for (const s of d.stats) {
    const list = byObject.get(s.object) ?? [];
    list.push(s);
    byObject.set(s.object, list);
  }
  return [...byObject.entries()]
    .map(([obj, list]) => [`# ${obj}`, ...list.map((s) => `${s.key.padEnd(width)}  ${s.value}`)].join("\n"))
    .join("\n\n");
}

/** Uniform entry point, matching the other tools in this repository. */
export function run(input: string): StatsDecode {
  return decodeStats(input);
}
