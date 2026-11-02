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
//
// PAGE LANGUAGE (2026-11-02, batch H5): notes, warnings and errors are built
// as EngineTexts (src/lib/tools/engine-text.ts); decodeStatsLocalisable()
// returns them for the page (pack keys tools.icontrol-rest-stats-decoder.engine.<id>),
// decodeStats() and run() return plainText() of the same reading, and a thrown
// StatsDecodeError keeps its class, code and message while carrying its sentence.
// ============================================================================

import { say, plainText, withEngineText, type EngineText } from "../engine-text"; // sentences with ids (2026-11-02)

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

/** The decoded response. S is string in the API's reading, EngineText in the page's. */
export interface StatsDecode<S = string> {
  /** Every statistic, flattened. */
  stats: StatEntry[];
  /** Distinct objects found, in order of first appearance. */
  objects: string[];
  notes: S[];
  warnings: S[];
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
function walk(node: Unknown, object: string, out: StatEntry[], notes: EngineText[]) {
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
      notes.push(say("note.combined", `"${base}" arrived split into .high and .low halves and has been combined. F5 splits 64-bit counters this way because JSON numbers cannot carry them safely.`, { key: base })); // pack key engine.note.combined
    } else {
      const only = h.high !== undefined ? "high" : "low";
      out.push({ object, key: `${base}.${only}`, value: (h.high ?? h.low) as number, from: "value" });
    }
  }
}

/**
 * A StatsDecodeError whose message is the sentence's English, carrying the sentence (2026-11-02).
 * @param code the error's code
 * @param m the sentence
 * @returns the error to throw
 */
function decodeError(code: "empty" | "not-json" | "not-stats", m: EngineText): StatsDecodeError {
  return withEngineText(new StatsDecodeError(code, m.text), m); // same class, same message, plus the sentence
} // decodeError

/** Decode an iControl REST stats response (the API's reading: every sentence as its English). */
export function decodeStats(input: string): StatsDecode {
  return plainText(decodeStatsLocalisable(input)); // the same reading, sentences as their English
} // decodeStats

/**
 * The page's reading: the same as decodeStats(), with every note and warning an EngineText (id, English, values).
 * @param input the pasted response
 * @returns the reading
 */
export function decodeStatsLocalisable(input: string): StatsDecode<EngineText> {
  const trimmed = (input ?? "").trim();
  if (!trimmed) throw decodeError("empty", say("err.empty", "Nothing to decode: paste an iControl REST stats response.")); // pack key engine.err.empty

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (e) {
    throw decodeError("not-json", say("err.notJson", `That is not valid JSON: ${(e as Error).message}`, { message: (e as Error).message })); // pack key engine.err.notJson (the browser's message stays as it comes)
  }
  if (!parsed || typeof parsed !== "object") {
    throw decodeError("not-stats", say("err.notObject", "The response parsed, but it is not an object.")); // pack key engine.err.notObject
  }

  const root = parsed as Unknown;
  const notes: EngineText[] = []; // in order
  const warnings: EngineText[] = []; // in order
  const stats: StatEntry[] = [];

  const entries = root.entries as Unknown | undefined;
  if (!entries || typeof entries !== "object") {
    throw decodeError("not-stats", say("err.noEntries", "No `entries` object at the top level. iControl REST stats responses always carry one - this looks like a configuration response rather than a stats response.")); // pack key engine.err.noEntries
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
    warnings.push(say("warn.noStats", "The response carried an `entries` object but no statistics were found inside it.")); // pack key engine.warn.noStats
  }

  const objects = [...new Set(stats.map((s) => s.object))];
  if (objects.length > 1) {
    notes.push(say("note.objects", `${objects.length} objects are present in this response. A collection endpoint returns every member, which is why a pool's stats and each of its members' stats can arrive together.`, { count: String(objects.length) })); // pack key engine.note.objects
  }
  notes.push(
    say("note.totals", "Counters here are totals since the last reset, not rates. The response carries no interval, so a rate cannot be derived from a single sample - take two and divide by the time between them."), // pack key engine.note.totals
  );

  return { stats, objects, notes, warnings };
}

/** Flatten to pasteable text (only the statistics; the notes are not part of it). */
export function statsToText(d: StatsDecode<unknown>): string {
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
