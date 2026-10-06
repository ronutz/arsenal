// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0
// ============================================================================
// scripts/check-quote-headers.mjs
// ----------------------------------------------------------------------------
// THE RANDOM QUOTE HEADER MUST ALWAYS BE A VALID HTTP HEADER.
//
// worker/index.ts adds one line from worker/quote-headers.json to every HTML
// response (PRIME 2026-10-05 22:48, after slashdot.org's X-Fry, X-Bender and
// X-Lrrr). A header is the one place where a typo is not cosmetic: a name with a
// space in it or a value with a non-ASCII character makes the Workers runtime
// throw on headers.set(), and the throw happens on the page response, which is
// to say the joke takes the site down. Nothing in the build renders the Worker,
// so this guard reads the pool and checks what the runtime would reject:
//
//   - every entry has show, who, name and quote, all non-empty strings;
//   - the name is an RFC 9110 field-name token (tchar only) and starts with X-,
//     the convention every example in the Learn article follows;
//   - the value is printable ASCII (0x20 to 0x7E), since header values are not
//     Unicode-safe, with no leading or trailing blank and under 200 characters;
//   - a name is never one of the headers the site sets elsewhere (the fixed
//     tradition pair and the security headers), so the random line can never
//     overwrite a real one;
//   - no two entries are identical.
// ============================================================================
import { readFileSync } from "node:fs";

// The pool, read as plain JSON (the Worker imports the same file).
const doc = JSON.parse(readFileSync(new URL("../worker/quote-headers.json", import.meta.url), "utf8"));
const entries = Array.isArray(doc?.entries) ? doc.entries : [];

// RFC 9110 §5.1: field-name = token; token = 1*tchar.
const TOKEN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
// Printable ASCII only, for the value.
const PRINTABLE_ASCII = /^[\x20-\x7E]*$/;
// Header names the site sets elsewhere; the pool must not collide with them.
const RESERVED = new Set([
  "x-clacks-overhead",
  "x-collective",
  "x-content-type-options",
  "x-frame-options",
  "x-robots-tag",
  "x-xss-protection",
  "x-permitted-cross-domain-policies",
  "x-dns-prefetch-control",
]);

// One sentence per failure, so the fix is obvious.
const failures = [];
if (entries.length < 10) failures.push(`the pool has ${entries.length} entr(y/ies); fewer than ten is not random enough to be a joke.`);
const seen = new Set();
entries.forEach((e, i) => {
  const where = `entry ${i + 1}`;
  for (const k of ["show", "who", "name", "quote"]) {
    if (typeof e?.[k] !== "string" || e[k].trim() === "") failures.push(`${where}: "${k}" is missing or empty.`);
  }
  if (typeof e?.name === "string") {
    if (!TOKEN.test(e.name)) failures.push(`${where}: name "${e.name}" is not an RFC 9110 token.`);
    if (!/^X-/.test(e.name)) failures.push(`${where}: name "${e.name}" does not start with "X-".`);
    if (RESERVED.has(e.name.toLowerCase())) failures.push(`${where}: name "${e.name}" is a header the site sets elsewhere.`);
  }
  if (typeof e?.quote === "string") {
    if (!PRINTABLE_ASCII.test(e.quote)) failures.push(`${where}: value "${e.quote}" has a non-ASCII or control character.`);
    if (e.quote !== e.quote.trim()) failures.push(`${where}: value has a leading or trailing blank.`);
    if (e.quote.length >= 200) failures.push(`${where}: value is ${e.quote.length} characters; keep it under 200.`);
  }
  const key = `${e?.name}\u0000${e?.quote}`;
  if (seen.has(key)) failures.push(`${where}: duplicate of an earlier entry (${e?.name}: ${e?.quote}).`);
  seen.add(key);
});

if (failures.length) {
  console.error(`\n[check-quote-headers] FAIL: ${failures.length} problem(s) in worker/quote-headers.json.\n`);
  for (const f of failures) console.error(`  - ${f}`);
  console.error("");
  process.exit(1);
}

const names = new Set(entries.map((e) => e.name));
const shows = new Set(entries.map((e) => e.show));
console.log(`[check-quote-headers] OK: ${entries.length} quote(s) under ${names.size} header name(s) from ${shows.size} show(s); every name a token starting with X-, every value printable ASCII, none reserved, none duplicated.`);
