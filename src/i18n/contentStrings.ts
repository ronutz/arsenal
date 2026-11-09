// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/i18n/contentStrings.ts
// ----------------------------------------------------------------------------
// STRINGS THAT LIVE IN CODE, IN THE LANGUAGES BEYOND en AND pt-BR (09/11/2026).
//
// Most of the interface is in the message packs. A few tools, the games and the
// training catalogue carry their human text in code instead, as { en, pt }
// pairs written before the packs could hold them (the openssl s_client and
// tcpdump explainers, the dig and nslookup meanings, Five Clues, Phish or
// Legit, the course catalogue...). Brazilian Portuguese stays where it is. Every
// other interface language (PRIME 09/11/2026: Spanish, Danish, German, Dutch,
// French, written natively) keeps its text for such a module in
// src/i18n/content/<locale>/<module>.json: an object whose keys are the English
// strings exactly as the code holds them and whose values are the language's.
// A key may be a TEMPLATE: an English sentence the code builds with values in it
// (`"${tok}" at position ${n} ...`) is keyed with positional placeholders,
// "\"{0}\" at position {1} ...", and the rendered sentence is matched against it
// (useContentString in src/components/ContentStrings.tsx). The list of English
// strings and templates per module, and the guard that holds every interface
// locale to it, are scripts/content-strings.mts and
// scripts/check-interface-locales.mts.
//
// This loader runs on the server (pages are rendered at build time), reads only
// the modules a page asks for and hands them to the client through the
// ContentStrings provider, so a page carries one language's strings for its own
// modules and nothing else.
// ============================================================================

import fs from "node:fs"; // the per-locale module files
import path from "node:path"; // their paths
// The matcher (shared with the client, so it lives in a module without node imports).
import type { ContentStrings } from "./contentMatch";

// The map type, re-exported for server callers.
export type { ContentStrings } from "./contentMatch";
// The matcher, re-exported for server pages that render text directly.
export { matchContent as translateContent } from "./contentMatch";

/** Where the per-locale files live. */
const ROOT = path.join(process.cwd(), "src", "i18n", "content");

/** Parsed files, read once per build process. */
const cache = new Map<string, ContentStrings>();

/**
 * One module's strings in one locale, or an empty map when the locale has none (English, Brazilian Portuguese, which
 * keeps its text inline, and any locale whose interface is not written yet).
 *
 * @param locale the page's locale
 * @param module the module's name (a tool slug, a game id or "training")
 * @returns the module's map
 */
export function contentStringsOf(locale: string, module: string): ContentStrings {
  // The cache key.
  const key = `${locale}/${module}`;
  // Read once.
  if (!cache.has(key)) {
    // The module's file in this locale.
    const file = path.join(ROOT, locale, `${module}.json`);
    // Parsed when it exists; empty otherwise.
    cache.set(key, fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, "utf8")) as ContentStrings) : {});
  }
  // The map.
  return cache.get(key) as ContentStrings;
}

/**
 * Several modules' strings in one locale, merged (a page with two modules gets one map).
 *
 * @param locale the page's locale
 * @param modules the modules the page shows
 * @returns the merged map
 */
export function contentStringsFor(locale: string, modules: readonly string[]): ContentStrings {
  // Later modules win on a shared key (the same English sentence has the same translation anyway).
  return Object.assign({}, ...modules.map((m) => contentStringsOf(locale, m)));
}

