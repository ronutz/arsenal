/**
 * worker/redirect-hits.ts
 *
 * HOW OFTEN EACH REDIRECT RULE ANSWERED (PRIME 16/11/2026 00:24: "add a read-only stats route to the Worker").
 * The redirect audit of 15/11/2026 (queue 5af) removes the public/_redirects rules nobody has hit in 30 days. The
 * counts already exist: every GET the Worker passes to the asset layer is written to the pageviews dataset with its
 * path (blob1) and the status it got (blob6, since 2026-10-07; worker/analytics.ts), and a _redirects rule answers
 * with its own status. This module reads those rows back for the rule list in worker/redirect-rules.json (made from
 * public/_redirects by scripts/gen-redirect-rules.mjs) and answers, per rule, how many requests it redirected.
 *
 * WHAT IS PUBLIC HERE, AND WHY: the answer names only the rules, which are the site's own published configuration,
 * and a count per rule: figures about the site, like the rest of the Stats page. No path a visitor typed is ever in
 * it: the query asks only for the rules' own paths, and a row that matches no rule is never listed (only summed).
 *
 * WHAT CANNOT BE COUNTED, SAID IN THE ANSWER: a rule whose source ends in a file extension (worker/analytics.ts does
 * not record such requests, by design), and anything before 2026-10-07 (no status was recorded then). Counts are
 * sampled sums (SUM(_sample_interval)), as everywhere else on the Stats page.
 *
 * READ-ONLY: GET and HEAD only; one SQL read per window per five minutes (the answer is kept at the edge).
 */

// The SQL API call and the pageviews dataset, shared with worker/stats.ts.
import { PAGEVIEWS, query, type StatsEnv } from "./stats";
// The rules, as public/_redirects gives them (generated; checked in prebuild).
import RULES from "./redirect-rules.json";

/** One rule, as scripts/gen-redirect-rules.mjs writes it. */
interface Rule {
  /** Its line in public/_redirects, counted from 1. */
  line: number;
  /** The path it matches (may hold a splat "*" or ":placeholder"). */
  source: string;
  /** Where it sends the request. */
  destination: string;
  /** The status it answers with. */
  status: number;
}

/** The most rows one read asks for (path and status pairs); an answer that reaches it says so (cut: true). */
export const REDIRECT_ROW_LIMIT = 20000;

/** One rule with its count, as the route answers it. */
export interface RuleHits extends Rule {
  /** Requests it redirected in the window, or null when the dataset cannot see its requests. */
  hits: number | null;
  /** Why hits is null, when it is. */
  reason?: "file_extension_not_recorded";
}

/** The rules, typed. */
const ALL_RULES = RULES as Rule[];

/** The same test worker/analytics.ts applies before recording: a path ending in a file extension is never written. */
const NOT_RECORDED = /\.[a-z0-9]+$/i;

/** Whether a rule's source holds a splat or a placeholder (a dynamic rule). */
const isDynamic = (source: string): boolean => source.includes("*") || /:[A-Za-z]\w*/.test(source);

/**
 * A rule's source as a regular expression, matching the way Cloudflare's _redirects does: a splat matches everything
 * (greedy), a placeholder everything but "/", and every other character itself.
 *
 * @param source the rule's source path
 * @returns the anchored expression
 */
function sourcePattern(source: string): RegExp {
  // Each piece: a placeholder, a splat, or one literal character escaped for the expression.
  const body = source.replace(/:[A-Za-z]\w*|\*|[.+?^${}()|[\]\\]/g, (m) =>
    m === "*" ? ".*" : m.startsWith(":") ? "[^/]+" : `\\${m}`);
  // Anchored at both ends: a rule matches a whole path, never part of one.
  return new RegExp(`^${body}$`);
}

/**
 * A path as an SQL string literal. The rules come from the site's own file, never from a request; a quote in one
 * would be a mistake in that file, so it is refused rather than escaped (as worker/probes.ts does).
 *
 * @param s the path
 * @returns the quoted literal
 */
function literal(s: string): string {
  // Refuse rather than escape: nothing in the rule file should ever need it.
  if (/['\\]/.test(s)) throw new Error("bad_rule_source");
  return `'${s}'`;
}

/**
 * A dynamic rule's source as an SQL LIKE pattern: its splat and placeholders become "%". LIKE's "_" (any one
 * character, with no escape in Analytics Engine SQL) can only widen the match, and every row is matched again
 * against the exact expression below, so a wider SQL filter never inflates a count.
 *
 * @param source the rule's source path
 * @returns the LIKE pattern, quoted
 */
function likePattern(source: string): string {
  // Splat and placeholders to "%"; the rest as written.
  return literal(source.replace(/:[A-Za-z]\w*|\*/g, "%"));
}

/**
 * Count each rule's redirects in a window.
 *
 * @param env the SQL API's credentials
 * @param since the SQL condition on the timestamp, built by the caller from its window list
 * @returns the rules with their counts, and the window's totals
 */
export async function redirectHits(env: StatsEnv, since: string): Promise<{
  rules: RuleHits[];
  totals: { rules: number; counted: number; not_countable: number; hit: number; never_hit: number; requests: number; unmatched_redirects: number };
  /** True when the read reached its row limit, so a rule's count may be low. */
  cut: boolean;
}> {
  // The rules the dataset can see (a source with a file extension is never recorded).
  const countable = ALL_RULES.filter((r) => !NOT_RECORDED.test(r.source));
  // The exact paths and the patterns to ask for, so the query never lists a path that belongs to no rule.
  const exact = countable.filter((r) => !isDynamic(r.source)).map((r) => literal(r.source));
  const likes = countable.filter((r) => isDynamic(r.source)).map((r) => `blob1 LIKE ${likePattern(r.source)}`);
  // Every status a rule can answer with, as literals.
  const statuses = [...new Set(countable.map((r) => String(r.status)))].map(literal);
  // The rules' paths, one condition (the IN list for the static rules, the LIKE patterns for the dynamic ones).
  const paths = [exact.length ? `blob1 IN (${exact.join(", ")})` : "", ...likes].filter(Boolean).join(" OR ");
  // One read: per path and status, the sampled sum, only for the rules' paths and the redirect statuses.
  const rows = paths
    ? ((await query(env, `SELECT blob1 AS path, blob6 AS status, SUM(_sample_interval) AS n FROM ${PAGEVIEWS}
         WHERE ${since} AND blob6 IN (${statuses.join(", ")}) AND (${paths})
         GROUP BY path, status ORDER BY n DESC LIMIT ${REDIRECT_ROW_LIMIT}`)) as Array<{ path?: unknown; status?: unknown; n?: unknown }>)
    : [];

  // Each countable rule's expression, compiled once.
  const compiled = countable.map((r) => ({ rule: r, re: sourcePattern(r.source) }));
  // The count per rule line.
  const counts = new Map<number, number>();
  // Requests that came back from the SQL filter but match no rule exactly (the LIKE widening; summed, never listed).
  let unmatched = 0;
  for (const row of rows) {
    // The row's values, typed.
    const path = String(row.path ?? "");
    const status = Number(row.status ?? 0);
    const n = Number(row.n ?? 0);
    // The FIRST rule that matches, as Cloudflare applies the first matching rule in file order.
    const hit = compiled.find((c) => c.rule.status === status && c.re.test(path));
    if (hit) counts.set(hit.rule.line, (counts.get(hit.rule.line) ?? 0) + n);
    else unmatched += n;
  }

  // Every rule, in file order, with its count (zero when none) or null when it cannot be counted.
  const rules: RuleHits[] = ALL_RULES.map((r) =>
    NOT_RECORDED.test(r.source)
      ? { ...r, hits: null, reason: "file_extension_not_recorded" as const }
      : { ...r, hits: Math.round(counts.get(r.line) ?? 0) });
  // The counted rules' figures, for the totals.
  const counted = rules.filter((r) => r.hits !== null);
  return {
    rules,
    // Reaching the limit means some path-status pairs were left out: the answer must say so.
    cut: rows.length >= REDIRECT_ROW_LIMIT,
    totals: {
      rules: rules.length,
      counted: counted.length,
      not_countable: rules.length - counted.length,
      hit: counted.filter((r) => (r.hits ?? 0) > 0).length,
      never_hit: counted.filter((r) => r.hits === 0).length,
      requests: Math.round(counted.reduce((s, r) => s + (r.hits ?? 0), 0)),
      unmatched_redirects: Math.round(unmatched),
    },
  };
}
