// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/nginx-location-matcher/compute.ts
// ----------------------------------------------------------------------------
// THE NGINX LOCATION MATCHING ENGINE.
//
// Teaches the rule that catches everyone, and that reading the config top to
// bottom actively misleads you about: **NGINX does not pick the first location
// that matches, and it does not pick the last. It follows a fixed order that
// has almost nothing to do with the order you wrote them in.**
//
// The documented algorithm, which this implements exactly:
//
//   1. Exact match `= /path` wins immediately. Search stops, nothing else is
//      considered.
//   2. All PREFIX locations are checked and the LONGEST match is remembered.
//      Not the first - the longest.
//   3. If that longest prefix match is marked `^~`, it wins immediately and
//      regular expressions are never tried.
//   4. Otherwise REGULAR EXPRESSIONS are tried IN FILE ORDER, and the FIRST
//      one that matches wins - beating the remembered prefix.
//   5. If no regex matches, the remembered longest prefix wins.
//
// So file order matters for exactly one of the five steps. Two consequences
// people meet the hard way:
//   * a regex further down the file beats a prefix block written above it,
//     which is why "my /images/ block is being ignored" is nearly always a
//     `~ \.(gif|jpg)$` block somewhere below;
//   * `^~` is not "more important", it is "stop before the regexes" - which is
//     the fix for exactly that situation.
//
// DELIBERATE LIMITS, stated rather than pretended away:
//   * one server block: no server_name selection, no listen-port matching;
//   * `~` and `~*` are translated to JavaScript RegExp. PCRE and JS regex
//     agree on the syntax used in ordinary location blocks, but they are not
//     the same engine, and anything exotic should be trusted to NGINX itself;
//   * no rewrite, try_files, or internal redirects - this answers "which
//     location block", not "what does the whole request do";
//   * the URI is matched as written: no normalisation or decoding, because
//     NGINX decodes before matching and doing half of that here would be
//     worse than doing none.
// ============================================================================

/** A parsed location block. */
export interface NginxLocation {
  /** 1-based position in the file - only decides regex precedence. */
  order: number;
  /** The raw directive as written, e.g. "location ^~ /images/". */
  raw: string;
  kind: "exact" | "prefix" | "prefix-priority" | "regex" | "regex-i";
  /** Pattern text as written, without the modifier. */
  pattern: string;
  /** Compiled matcher for regex kinds; null for prefix/exact. */
  re: RegExp | null;
}

export interface NginxMatchStep {
  /** What the engine did at this stage of the documented algorithm. */
  stage: "exact" | "prefix-scan" | "prefix-priority" | "regex-scan" | "fallback";
  /** The location involved, when there is one. */
  location: NginxLocation | null;
  /** Whether this step decided the outcome. */
  decisive: boolean;
  /** Plain-language explanation - the teaching. */
  reason: string;
}

export interface NginxMatchReport {
  uri: string;
  winner: NginxLocation | null;
  steps: NginxMatchStep[];
  /** Prefix blocks that matched but lost, longest first. */
  prefixCandidates: NginxLocation[];
  /** Findings about the config itself, independent of the URI. */
  findings: string[];
  locations: NginxLocation[];
}

export class NginxParseError extends Error {
  constructor(
    message: string,
    public readonly line: number,
  ) {
    super(message);
    this.name = "NginxParseError";
  }
}

// ---------------------------------------------------------------------------
// Parsing
//
// Accepts real `location` lines, with or without a trailing `{`:
//   location = /exact          location ^~ /images/
//   location /prefix           location ~ \.php$        location ~* \.(gif)$
// Plus one `request <uri>` line. Blank lines and # comments ignored.
// ---------------------------------------------------------------------------

export function parseLocations(input: string): { locations: NginxLocation[]; uri: string } {
  const locations: NginxLocation[] = [];
  let uri: string | null = null;
  let order = 0;

  const lines = input.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1;
    const raw = lines[i].split("#")[0].trim();
    if (!raw) continue;

    if (/^request\s+/i.test(raw)) {
      uri = raw.slice(7).trim();
      if (!uri.startsWith("/")) {
        throw new NginxParseError(`the request URI must start with "/"`, lineNo);
      }
      continue;
    }

    const m = /^location\s+(=|\^~|~\*|~)?\s*(\S+)\s*\{?\s*\}?\s*$/.exec(raw);
    if (!m) {
      throw new NginxParseError(
        `expected a location line, e.g. "location /images/" or "location ~ \\.php$"`,
        lineNo,
      );
    }
    const [, modifier, pattern] = m;
    order += 1;

    let kind: NginxLocation["kind"];
    let re: RegExp | null = null;
    if (modifier === "=") kind = "exact";
    else if (modifier === "^~") kind = "prefix-priority";
    else if (modifier === "~") kind = "regex";
    else if (modifier === "~*") kind = "regex-i";
    else kind = "prefix";

    if (kind === "regex" || kind === "regex-i") {
      try {
        re = new RegExp(pattern, kind === "regex-i" ? "i" : "");
      } catch {
        throw new NginxParseError(`"${pattern}" is not a usable regular expression`, lineNo);
      }
    } else if (!pattern.startsWith("/")) {
      throw new NginxParseError(`a prefix location should start with "/" (got "${pattern}")`, lineNo);
    }

    locations.push({ order, raw, kind, pattern, re });
  }

  if (!locations.length) throw new NginxParseError(`no location blocks found`, 1);
  if (uri === null) throw new NginxParseError(`no "request <uri>" line - nothing to match`, 1);
  return { locations, uri };
}

// ---------------------------------------------------------------------------
// Matching - the documented five-step algorithm, in order.
// ---------------------------------------------------------------------------

export function matchLocation(input: string): NginxMatchReport {
  const { locations, uri } = parseLocations(input);
  const steps: NginxMatchStep[] = [];

  // 1. Exact match ends everything.
  const exact = locations.find((l) => l.kind === "exact" && l.pattern === uri);
  if (exact) {
    steps.push({
      stage: "exact",
      location: exact,
      decisive: true,
      reason: `"${exact.raw}" is an exact match for ${uri}. NGINX stops here - no prefix block and no regular expression is even considered.`,
    });
    return { uri, winner: exact, steps, prefixCandidates: [], findings: analyse(locations), locations };
  }
  if (locations.some((l) => l.kind === "exact")) {
    steps.push({
      stage: "exact",
      location: null,
      decisive: false,
      reason: `No exact ("=") location matches ${uri}, so the search continues.`,
    });
  }

  // 2. Longest prefix wins the prefix round - file order is irrelevant here.
  const prefixes = locations
    .filter((l) => l.kind === "prefix" || l.kind === "prefix-priority")
    .filter((l) => uri.startsWith(l.pattern))
    .sort((a, b) => b.pattern.length - a.pattern.length);

  const best = prefixes[0] ?? null;
  if (best) {
    const others = prefixes.slice(1);
    steps.push({
      stage: "prefix-scan",
      location: best,
      decisive: false,
      reason:
        `Of the prefix locations that match, the LONGEST is "${best.raw}"` +
        (others.length
          ? ` - it beats ${others.map((o) => `"${o.pattern}"`).join(", ")} on length, not on position in the file.`
          : `. Length decides this round, not the order the blocks are written in.`),
    });
  } else {
    steps.push({
      stage: "prefix-scan",
      location: null,
      decisive: false,
      reason: `No prefix location matches ${uri}.`,
    });
  }

  // 3. A ^~ winner stops the search before regexes are tried.
  if (best && best.kind === "prefix-priority") {
    steps.push({
      stage: "prefix-priority",
      location: best,
      decisive: true,
      reason: `"${best.raw}" carries "^~", which means: stop here and do NOT try the regular expressions. That modifier is not a priority boost, it is an early exit - and it is the fix when a regex block keeps stealing traffic from a prefix block.`,
    });
    return { uri, winner: best, steps, prefixCandidates: prefixes, findings: analyse(locations), locations };
  }

  // 4. Regexes, in FILE ORDER, first match wins - and it beats the prefix.
  const regexes = locations.filter((l) => l.kind === "regex" || l.kind === "regex-i");
  for (const r of regexes) {
    if (r.re!.test(uri)) {
      steps.push({
        stage: "regex-scan",
        location: r,
        decisive: true,
        reason:
          `"${r.raw}" is the FIRST regular expression in file order that matches` +
          (best
            ? `, so it wins - beating the longest prefix "${best.pattern}". This is the step where writing order matters, and it is why a regex further down a file can quietly take over from a prefix block written above it.`
            : `, so it wins.`),
      });
      return { uri, winner: r, steps, prefixCandidates: prefixes, findings: analyse(locations), locations };
    }
  }
  if (regexes.length) {
    steps.push({
      stage: "regex-scan",
      location: null,
      decisive: false,
      reason: `None of the ${regexes.length} regular expression location(s) match ${uri}.`,
    });
  }

  // 5. Fall back to the remembered longest prefix.
  if (best) {
    steps.push({
      stage: "fallback",
      location: best,
      decisive: true,
      reason: `With no regular expression matching, the longest prefix match "${best.raw}" wins after all.`,
    });
    return { uri, winner: best, steps, prefixCandidates: prefixes, findings: analyse(locations), locations };
  }

  steps.push({
    stage: "fallback",
    location: null,
    decisive: true,
    reason: `Nothing matches ${uri}. In a real server this falls through to the server-level configuration, and typically returns 404.`,
  });
  return { uri, winner: null, steps, prefixCandidates: [], findings: analyse(locations), locations };
}

/** Findings about the config itself, independent of the tested URI. */
function analyse(locations: NginxLocation[]): string[] {
  const out: string[] = [];

  // Duplicate patterns of the same kind: the later one is dead.
  const seen = new Map<string, NginxLocation>();
  for (const l of locations) {
    const key = `${l.kind}::${l.pattern}`;
    const prev = seen.get(key);
    if (prev) {
      out.push(
        `"${l.raw}" repeats "${prev.raw}" from earlier in the file. NGINX would reject a duplicate exact or prefix location outright; a duplicate regex is simply unreachable.`,
      );
    } else {
      seen.set(key, l);
    }
  }

  // A prefix block that any earlier-ordered regex could shadow entirely.
  const regexes = locations.filter((l) => l.kind === "regex" || l.kind === "regex-i");
  for (const p of locations.filter((l) => l.kind === "prefix")) {
    const stealer = regexes.find((r) => r.re!.test(p.pattern));
    if (stealer) {
      out.push(
        `"${p.raw}" can be taken over by "${stealer.raw}": that regular expression matches the prefix itself, and regexes beat prefix matches. Add "^~" to the prefix block if it should win.`,
      );
    }
  }

  // No catch-all: worth knowing, not necessarily wrong.
  if (!locations.some((l) => l.kind === "prefix" && l.pattern === "/")) {
    out.push(
      `There is no "location /" catch-all. Requests matching nothing fall through to the server block, which is fine if that is intended.`,
    );
  }
  return out;
}
