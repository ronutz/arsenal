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
// The documented algorithm, which this implements exactly (nginx.org,
// ngx_http_core_module "location", read 2026-10-26):
//
//   1. Exact match `= /path` wins immediately. Search stops, nothing else is
//      considered.
//   2. All PREFIX locations are checked and the LONGEST match is remembered.
//      Not the first - the longest.
//   3. If that longest prefix match is marked `^~`, it wins immediately and
//      neither regular expressions nor predicate locations are tried.
//   4. Otherwise REGULAR EXPRESSIONS are tried IN FILE ORDER, and the FIRST
//      one that matches wins - beating the remembered prefix.
//   5. If no regex matches, PREDICATE locations (`location $variable`, added
//      in nginx 1.31.5) are tried IN FILE ORDER; a predicate matches when its
//      variable is neither empty nor "0", and the first match wins.
//   6. If nothing in steps 4 and 5 matched, the remembered longest prefix wins.
//
// Before 1.31.5 there was no step 5, which is why older material describes a
// five-step order; a config without predicate locations behaves the same on
// both. File order matters for exactly the two "in file order" steps. Two
// consequences people meet the hard way:
//   * a regex further down the file beats a prefix block written above it,
//     which is why "my /images/ block is being ignored" is nearly always a
//     `~ \.(gif|jpg)$` block somewhere below;
//   * `^~` is not "more important", it is "stop before the regexes and the
//     predicates" - which is the fix for exactly that situation.
//
// Locations test only the URI part of the request line, without arguments
// (nginx.org, "How nginx processes a request"), so a `request` line with a
// query string is split: the path is matched, the arguments only feed the
// `$arg_<name>` variables a predicate location can test.
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
//     worse than doing none;
//   * variables are not evaluated: `$arg_<name>` comes from the query string,
//     any other variable takes the value given on a `variable` line, and an
//     undeclared variable is treated as empty (so its predicate never matches).
// ============================================================================

/** A parsed location block. */
export interface NginxLocation {
  /** 1-based position in the file - decides regex and predicate precedence. */
  order: number;
  /** The raw directive as written, e.g. "location ^~ /images/". */
  raw: string;
  /** The block's kind; "predicate" is a `location $variable` (nginx 1.31.5+). */
  kind: "exact" | "prefix" | "prefix-priority" | "regex" | "regex-i" | "predicate";
  /** Pattern text as written, without the modifier ("$name" for a predicate). */
  pattern: string;
  /** Compiled matcher for regex kinds; null for prefix, exact and predicate. */
  re: RegExp | null;
}

export interface NginxMatchStep {
  /** What the engine did at this stage of the documented algorithm. */
  stage: "exact" | "prefix-scan" | "prefix-priority" | "regex-scan" | "predicate-scan" | "fallback";
  /** The location involved, when there is one. */
  location: NginxLocation | null;
  /** Whether this step decided the outcome. */
  decisive: boolean;
  /** Plain-language explanation - the teaching. */
  reason: string;
}

export interface NginxMatchReport {
  /** The path that was matched (the request line without its arguments). */
  uri: string;
  /** The arguments after "?" on the request line, without the "?" ("" when none). */
  args: string;
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

/** A variable name as NGINX writes it: "$" then letters, digits and underscores. */
const VARIABLE_NAME = /^\$[A-Za-z_][A-Za-z0-9_]*$/;

// ---------------------------------------------------------------------------
// Parsing
//
// Accepts real `location` lines, with or without a trailing `{`:
//   location = /exact          location ^~ /images/
//   location /prefix           location ~ \.php$        location ~* \.(gif)$
//   location $arg_preview      (a predicate location, nginx 1.31.5+)
// Plus one `request <uri>` line (a query string is allowed), and any number of
// `variable $name value` lines that give a predicate's variable its value.
// Blank lines and # comments ignored.
// ---------------------------------------------------------------------------

export function parseLocations(input: string): {
  locations: NginxLocation[];
  uri: string;
  args: string;
  variables: Map<string, string>;
} {
  // The parsed location blocks, in file order.
  const locations: NginxLocation[] = [];
  // The request line as written, until one is found.
  let request: string | null = null;
  // Declared variable values, keyed by "$name".
  const variables = new Map<string, string>();
  // Running count of location lines, which becomes each block's order.
  let order = 0;

  // Walk the input one line at a time so errors can name a line number.
  const lines = input.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    // Human-facing line numbers start at 1.
    const lineNo = i + 1;
    // Drop a trailing comment and surrounding whitespace.
    const raw = lines[i].split("#")[0].trim();
    // Skip lines that were blank or only a comment.
    if (!raw) continue;

    // The request line: everything after the keyword is the request target.
    if (/^request\s+/i.test(raw)) {
      // Keep the target as written, query string included, for splitting below.
      request = raw.slice(7).trim();
      // A request target must be an absolute path.
      if (!request.startsWith("/")) {
        throw new NginxParseError(`the request URI must start with "/"`, lineNo);
      }
      continue;
    }

    // A variable declaration: "variable $name value", the value may be empty.
    const v = /^variable\s+(\S+)(?:\s+(.*))?$/i.exec(raw);
    if (v) {
      // The name must look like an NGINX variable.
      if (!VARIABLE_NAME.test(v[1])) {
        throw new NginxParseError(`"${v[1]}" is not a variable name; write it as "$name", e.g. "variable $is_api 1"`, lineNo);
      }
      // A pair of empty quotes means the empty string; otherwise take the text as written.
      const value = (v[2] ?? "").trim();
      // Store the value, a later line for the same variable replacing an earlier one.
      variables.set(v[1], value === '""' ? "" : value);
      continue;
    }

    // Anything else must be a location line.
    const m = /^location\s+(=|\^~|~\*|~)?\s*(\S+)\s*\{?\s*\}?\s*$/.exec(raw);
    if (!m) {
      throw new NginxParseError(
        `expected a location line, e.g. "location /images/", "location ~ \\.php$" or "location $arg_preview"`,
        lineNo,
      );
    }
    // The optional modifier and the pattern that follows it.
    const [, modifier, pattern] = m;
    // This block's position among location lines.
    order += 1;

    // Classify the block from its modifier (and, with none, from its first character).
    let kind: NginxLocation["kind"];
    // Only regex kinds get a compiled matcher.
    let re: RegExp | null = null;
    if (modifier === "=") kind = "exact";
    else if (modifier === "^~") kind = "prefix-priority";
    else if (modifier === "~") kind = "regex";
    else if (modifier === "~*") kind = "regex-i";
    // No modifier and a leading "$" is a predicate location (nginx 1.31.5+).
    else if (pattern.startsWith("$")) kind = "predicate";
    else kind = "prefix";

    if (kind === "regex" || kind === "regex-i") {
      // Compile the regex; ~* is case-insensitive.
      try {
        re = new RegExp(pattern, kind === "regex-i" ? "i" : "");
      } catch {
        throw new NginxParseError(`"${pattern}" is not a usable regular expression`, lineNo);
      }
    } else if (kind === "predicate") {
      // A predicate names exactly one variable.
      if (!VARIABLE_NAME.test(pattern)) {
        throw new NginxParseError(`"${pattern}" is not a usable predicate; a predicate location names one variable, e.g. "location $arg_preview"`, lineNo);
      }
    } else if (!pattern.startsWith("/")) {
      // Exact and prefix patterns are paths.
      throw new NginxParseError(`a prefix location should start with "/" (got "${pattern}")`, lineNo);
    }

    // Record the block.
    locations.push({ order, raw, kind, pattern, re });
  }

  // A config with no blocks has nothing to choose from.
  if (!locations.length) throw new NginxParseError(`no location blocks found`, 1);
  // Without a request there is nothing to match.
  if (request === null) throw new NginxParseError(`no "request <uri>" line - nothing to match`, 1);
  // Locations test only the URI part, without arguments: split at the first "?".
  const q = request.indexOf("?");
  // The path that the exact, prefix and regex rounds see.
  const uri = q === -1 ? request : request.slice(0, q);
  // The arguments, which only feed $arg_<name>.
  const args = q === -1 ? "" : request.slice(q + 1);
  return { locations, uri, args, variables };
}

/** The value of $arg_<name>: the first "name=value" argument, "" when absent. */
function argValue(args: string, name: string): string | null {
  // Arguments are separated by "&"; each is "name" or "name=value".
  for (const part of args.split("&")) {
    // Split at the first "=" only, so values may contain "=".
    const eq = part.indexOf("=");
    // The argument's name as written.
    const key = eq === -1 ? part : part.slice(0, eq);
    // The first argument with this name supplies the value.
    if (key === name) return eq === -1 ? "" : part.slice(eq + 1);
  }
  // Not present in the request line at all.
  return null;
}

/** Resolve a predicate's variable: its value and where the value came from. */
function resolvePredicate(
  name: string,
  args: string,
  variables: Map<string, string>,
): { value: string; origin: "declared" | "query" | "undeclared" } {
  // An explicit `variable` line always wins.
  if (variables.has(name)) return { value: variables.get(name)!, origin: "declared" };
  // $arg_<name> reads the named argument from the request line.
  if (name.startsWith("$arg_")) {
    // The argument's value, or null when the request does not carry it.
    const found = argValue(args, name.slice(5));
    return { value: found ?? "", origin: "query" };
  }
  // Anything else is unknown here and treated as empty.
  return { value: "", origin: "undeclared" };
}

/** NGINX's predicate rule: matches when the value is neither empty nor "0". */
function predicateMatches(value: string): boolean {
  // Both the empty string and the single character "0" are false.
  return value !== "" && value !== "0";
}

// ---------------------------------------------------------------------------
// Matching - the documented algorithm, in order.
// ---------------------------------------------------------------------------

export function matchLocation(input: string): NginxMatchReport {
  // Parse first; any error stops here with a line number.
  const { locations, uri, args, variables } = parseLocations(input);
  // The walk, in the order NGINX performs it.
  const steps: NginxMatchStep[] = [];
  // Findings depend only on the config and the declared values.
  const findings = analyse(locations, variables);

  // 1. Exact match ends everything.
  const exact = locations.find((l) => l.kind === "exact" && l.pattern === uri);
  if (exact) {
    steps.push({
      stage: "exact",
      location: exact,
      decisive: true,
      reason: `"${exact.raw}" is an exact match for ${uri}. NGINX stops here - no prefix block, no regular expression and no predicate is even considered.`,
    });
    return { uri, args, winner: exact, steps, prefixCandidates: [], findings, locations };
  }
  // Say so when exact blocks exist but none matched.
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

  // The remembered longest prefix, if any prefix matched.
  const best = prefixes[0] ?? null;
  if (best) {
    // The shorter prefixes that also matched and lost on length.
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

  // 3. A ^~ winner stops the search before regexes and predicates are tried.
  if (best && best.kind === "prefix-priority") {
    // Whether the config has predicates the early exit also skips.
    const hasPredicates = locations.some((l) => l.kind === "predicate");
    steps.push({
      stage: "prefix-priority",
      location: best,
      decisive: true,
      reason:
        `"${best.raw}" carries "^~", which means: stop here and do NOT try the regular expressions` +
        (hasPredicates ? ` or the predicate locations` : ``) +
        `. That modifier is not a priority boost, it is an early exit - and it is the fix when a regex block keeps stealing traffic from a prefix block.`,
    });
    return { uri, args, winner: best, steps, prefixCandidates: prefixes, findings, locations };
  }

  // 4. Regexes, in FILE ORDER, first match wins - and it beats the prefix.
  const regexes = locations.filter((l) => l.kind === "regex" || l.kind === "regex-i");
  for (const r of regexes) {
    // Regexes see the path only, never the query string.
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
      return { uri, args, winner: r, steps, prefixCandidates: prefixes, findings, locations };
    }
  }
  // Record a regex round that matched nothing.
  if (regexes.length) {
    steps.push({
      stage: "regex-scan",
      location: null,
      decisive: false,
      reason: `None of the ${regexes.length} regular expression location(s) match ${uri}.`,
    });
  }

  // 5. Predicates (nginx 1.31.5+), in FILE ORDER, first true value wins.
  const predicates = locations.filter((l) => l.kind === "predicate");
  for (const p of predicates) {
    // Where this predicate's value comes from, and the value itself.
    const { value, origin } = resolvePredicate(p.pattern, args, variables);
    if (predicateMatches(value)) {
      // Explain the value's origin so the reader can reproduce it.
      const from =
        origin === "query"
          ? `the request's "${p.pattern.slice(5)}" argument`
          : `the value declared for it`;
      steps.push({
        stage: "predicate-scan",
        location: p,
        decisive: true,
        reason:
          `No regular expression matched, so predicate locations are tried in file order. "${p.raw}" is the first whose variable is neither empty nor "0" (${p.pattern} = "${value}", from ${from}), so it wins` +
          (best ? ` - beating the longest prefix "${best.pattern}".` : `.`) +
          ` Predicate locations exist from nginx 1.31.5.`,
      });
      return { uri, args, winner: p, steps, prefixCandidates: prefixes, findings, locations };
    }
  }
  // Record a predicate round that matched nothing.
  if (predicates.length) {
    steps.push({
      stage: "predicate-scan",
      location: null,
      decisive: false,
      reason: `None of the ${predicates.length} predicate location(s) has a variable that is neither empty nor "0" for this request.`,
    });
  }

  // 6. Fall back to the remembered longest prefix.
  if (best) {
    steps.push({
      stage: "fallback",
      location: best,
      decisive: true,
      reason:
        predicates.length
          ? `With no regular expression and no predicate matching, the longest prefix match "${best.raw}" wins after all.`
          : `With no regular expression matching, the longest prefix match "${best.raw}" wins after all.`,
    });
    return { uri, args, winner: best, steps, prefixCandidates: prefixes, findings, locations };
  }

  // Nothing at all matched.
  steps.push({
    stage: "fallback",
    location: null,
    decisive: true,
    reason: `Nothing matches ${uri}. In a real server this falls through to the server-level configuration, and typically returns 404.`,
  });
  return { uri, args, winner: null, steps, prefixCandidates: [], findings, locations };
}

/** Findings about the config itself, independent of the tested URI. */
function analyse(locations: NginxLocation[], variables: Map<string, string>): string[] {
  // Findings, in the order they are detected.
  const out: string[] = [];

  // Duplicate patterns of the same kind: the later one is dead.
  const seen = new Map<string, NginxLocation>();
  for (const l of locations) {
    // Same kind and same pattern is a duplicate.
    const key = `${l.kind}::${l.pattern}`;
    const prev = seen.get(key);
    if (prev && l.kind === "predicate") {
      // Predicates are tried in file order, and a cacheable variable has one value per request.
      out.push(
        `"${l.raw}" repeats "${prev.raw}" from earlier in the file. Predicates are tried in file order and a cacheable variable is evaluated once per request, so the later block can never be reached.`,
      );
    } else if (prev) {
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
    // The first regex that matches the prefix text itself.
    const stealer = regexes.find((r) => r.re!.test(p.pattern));
    if (stealer) {
      out.push(
        `"${p.raw}" can be taken over by "${stealer.raw}": that regular expression matches the prefix itself, and regexes beat prefix matches. Add "^~" to the prefix block if it should win.`,
      );
    }
  }

  // Predicate locations: name the version, and warn about undeclared variables.
  const predicates = locations.filter((l) => l.kind === "predicate");
  if (predicates.length) {
    out.push(
      `Predicate locations ("location $variable") need nginx 1.31.5 or later. They are tried after the regular expressions, so a matching regex still wins, and a "^~" prefix skips them.`,
    );
  }
  for (const p of predicates) {
    // Only variables that are neither declared nor $arg_ are unknown here.
    if (!variables.has(p.pattern) && !p.pattern.startsWith("$arg_")) {
      out.push(
        `${p.pattern} has no value here, so "${p.raw}" is treated as not matching. Add a line such as "variable ${p.pattern} 1" to test the request as NGINX would see it with that value.`,
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
