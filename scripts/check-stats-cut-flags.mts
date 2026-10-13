// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-stats-cut-flags.mts
// ----------------------------------------------------------------------------
// PRE-BUILD GUARD (2026-10-13): a list the stats page adds up must say when it
// was cut. Read live on 13 October, the Worker's "paths" list (behind the
// Pages, Sections, Long tail and Coverage panels) stopped at its 6,000-row
// limit and the "missing" list at its 2,000, and the page added each up as if
// it were the whole window (FINDING-stats-capped-lists-read-as-complete, in
// the canon). The limits were raised, and each answer now carries `limit` and
// `cut`; the page prints a line when `cut` is true.
//
// This guard runs worker/stats.ts as the Worker runs it, against a stand-in
// for the Analytics Engine SQL API (no network, no secrets), and fails the
// build unless, for each of the two routes:
//   1. the SQL asks for exactly the `limit` the answer reports;
//   2. an answer with fewer rows than the limit says cut: false;
//   3. an answer that reaches the limit says cut: true.
// So the flag cannot be dropped, nor the limit changed in one place and not
// the other, without the build saying so. Prints what it checked.
// ============================================================================

import { handleStats } from "../worker/stats";

const TAG = "[check-stats-cut-flags]";
const errors: string[] = [];

// The stand-in for the SQL API: the statements the Worker sends, answered with the rows set for the next call.
const sent: string[] = [];
let nextRows: unknown[] = [];
globalThis.fetch = (async (_input: unknown, init?: { body?: unknown }) => {
  // The Worker posts its SQL as the request body.
  sent.push(String(init?.body ?? ""));
  // The answer shape the Worker reads: { data: [...] }.
  return new Response(JSON.stringify({ data: nextRows }), { status: 200, headers: { "content-type": "application/json" } });
}) as typeof fetch;

// Any values: the stand-in never checks them, and the Worker only needs them present.
const env = { CF_ACCOUNT_ID: "guard", CF_ANALYTICS_TOKEN: "guard" };

/** One call of a route with `n` rows answered; the parsed answer and the SQL the Worker sent. */
async function call(route: string, n: number): Promise<{ body: Record<string, unknown>; sql: string }> {
  // n distinct addresses, one request each, shaped as the SQL API returns them.
  nextRows = Array.from({ length: n }, (_, i) => ({ path: `/en/guard-${i}/`, views: "1" }));
  sent.length = 0;
  const res = await handleStats(new URL(`https://ronutz.com/api/stats/${route}?window=30d`), env);
  if (!res || res.status !== 200) throw new Error(`${route}: status ${res?.status}`);
  return { body: (await res.json()) as Record<string, unknown>, sql: sent.join("\n") };
}

const checked: string[] = [];
for (const route of ["paths", "missing"]) {
  // A short answer first: it reports the limit the route reads with, and must not call itself cut.
  const short = await call(route, 3);
  const limit = short.body.limit;
  if (typeof limit !== "number" || !(limit > 3)) {
    errors.push(`${route}: the answer carries no numeric limit (got ${JSON.stringify(limit)})`);
    continue;
  }
  // 1. The SQL asks for that many rows, no other number.
  const asked = [...short.sql.matchAll(/LIMIT\s+(\d+)/g)].map((m) => Number(m[1]));
  if (asked.length !== 1 || asked[0] !== limit) errors.push(`${route}: the SQL's LIMIT ${asked.join(",") || "none"} is not the reported limit ${limit}`);
  // 2. Fewer rows than the limit: not cut.
  if (short.body.cut !== false) errors.push(`${route}: 3 rows under a limit of ${limit} answered cut: ${JSON.stringify(short.body.cut)}`);
  // 3. As many rows as the limit: cut.
  const full = await call(route, limit);
  if (full.body.cut !== true) errors.push(`${route}: ${limit} rows at a limit of ${limit} answered cut: ${JSON.stringify(full.body.cut)}`);
  checked.push(`${route} (limit ${limit.toLocaleString("en-GB")})`);
}

if (errors.length) {
  console.error(`${TAG} FAIL: ${errors.length} problem(s)`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
console.log(`${TAG} OK: ${checked.join(", ")}: each SQL asks for the limit its answer reports, a list under it says cut: false, a list that reaches it says cut: true.`);
