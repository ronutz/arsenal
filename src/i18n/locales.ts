// ============================================================================
// src/i18n/locales.ts
// ----------------------------------------------------------------------------
// THE LOCALE REGISTRY — the single source of truth for every language.
//
// WHY THIS FILE IS LOAD-BEARING (D-20, the "language pack" design):
//   Adding a new language to ronutz.com is meant to require near-zero admin
//   effort. That promise is kept HERE: to add a language you (1) add one entry
//   to LOCALES below and (2) drop a JSON pack file in src/i18n/messages/.
//   Nothing else in the app hardcodes a language list — everything (routing,
//   the language switcher, the <html lang/dir> attributes, SEO alternates)
//   derives from this registry. Community contributors add a language the same
//   way: a registry line + a pack file, via pull request.
//
//   Translation quality is evidence-gated (mirroring the VERIFIED vs
//   PRIME-ATTESTED credential model): each locale carries a `status` of
//   'reviewed' (a human native speaker approved it), 'machine-draft' (an AI
//   draft, not yet reviewed), or 'stub' (no pack yet → falls back to English).
//   Only 'reviewed' (and the source language) are fully trusted for publish.
// ============================================================================

/** Translation maturity for a locale's pack. Drives publish-confidence + UI badges. */
export type LocaleStatus = "reviewed" | "machine-draft" | "stub";

/** Everything the app needs to know about one language. */
export interface LocaleMeta {
  /** BCP-47 tag, also the URL segment (e.g. "pt-BR", "zh-Hant-TW"). */
  code: string;
  /** Endonym — the language's own name, shown in the switcher (users find their language by its own name). */
  nativeName: string;
  /** English name, for admin/registry readability. */
  englishName: string;
  /** Text direction. Arabic is RTL; everything else here is LTR. */
  dir: "ltr" | "rtl";
  /** Translation maturity (see LocaleStatus). */
  status: LocaleStatus;
  /** How a draft locale's text is made, which decides the notice its pages carry (2026-10-07, row 70; PRIME 23:5x).
   *  "machine-translated" (the default): translated from English by machine, "This page was translated by machine".
   *  "written-with-ai": written in the language itself with AI and reviewed gradually (Brazilian Portuguese), its own
   *  notice in PRIME's words. Read only when status is "machine-draft"; the layout picks the notice from it, so the
   *  rule lives here, once, and scripts/check-teaching-and-authorship-claims.mts holds the built pages to it. */
  draftKind?: "machine-translated" | "written-with-ai";
}

/**
 * THE REGISTRY. Order here is the order shown in the language switcher.
 * DEMOTION (PRIME 09/11/2026 21:41): "demote the languages for which the current languages work has not yet gone over
 * phase 1 (interface, tools, puzzles) to 'not translated yet' and don't show them in the dropdown". The eleven
 * machine-translated locales are 'stub' again: not built, not listed, their URLs sent to English by the worker with a
 * temporary redirect. A locale returns to 'machine-draft' (draftKind "written-with-ai") when its phase 1 is done.
 * RETIRED (PRIME 09/11/2026 22:14, "remove the ones you determined are of low value, and add the ones you deemed of high
 * value"): Dutch, Swedish, Danish, Norwegian, Polish, Malay and Filipino left the registry (readers there use English at
 * work: EF EPI 2025 bands "very high" and "high"); RETIRED_LOCALE_CODES below keeps their old URLs working. The planned
 * languages carry a PLANNED marker: Chinese (Simplified), Turkish, Russian, Japanese, Arabic, Indonesian, Vietnamese,
 * Italian and Korean (PLAN-interface-locales-20261109).
 * 23:04 ("Remove Hindi and Tamil as well. assess the nineteen others and apply the same filtering logic"): Hindi,
 * Tamil and seventeen of the other stubs retired (EF EPI 2025 "very high" or "high" in their main market, or a market
 * whose IT work runs in English: India's, Pakistan's, Bangladesh's, Hong Kong's, Israel's, Ukraine's, East Africa's;
 * Persian's market is out of reach of the vendors this site covers); Thai and Traditional Chinese (Taiwan) planned.
 * Human-reviewed: en only. pt-BR is machine-translated but complete; es and all others are
 * registered + selectable but 'stub' → they fall back to English until a real
 * pack lands. This is the "capability is day-one, content arrives as packs"
 * decision (D-20 amendment, PRIME-ratified 2026-06-23).
 */
export const LOCALES: readonly LocaleMeta[] = [
  // --- Languages with real, human-reviewed content shipping day-one ---
  { code: "en",         nativeName: "English",            englishName: "English",                 dir: "ltr", status: "reviewed" },
  { code: "pt-BR",      nativeName: "Português (Brasil)", englishName: "Portuguese (Brazil)",     dir: "ltr", status: "machine-draft", draftKind: "written-with-ai" }, // NOTICE REWORDED (PRIME, 2026-10-07 23:5x, row 70): "O português deste site é escrito com IA e revisado aos poucos. Esta página pode conter erros." (machineTranslation.noticeWrittenWithAi), replacing "Esta página foi traduzida automaticamente", which described a translation the Portuguese is not. RULING (PRIME, 2026-08-27): pt-BR KEEPS the notice. The corpus is generated under the native-authoring directive, but the output still sometimes over-translates technical jargon and uses constructions that do not sound natural in Portuguese — so the status stays machine-draft, and the banner stays, until human review attests otherwise. The status is a CREDENTIAL about the outcome, not a restatement of the directive. (Reverts the same-day change that read the 2026-08-16 authoring rule as the attestation.)
  { code: "es",         nativeName: "Español",            englishName: "Spanish",                 dir: "ltr", status: "machine-draft", draftKind: "written-with-ai" }, // INTERFACE-NATIVE (PRIME 09/11/2026 01:02, "in the language's NATURAL tone"): the interface, tools, tool docs, games and legal pages written in Spanish with AI and reviewed gradually; Learn, the glossary and the other corpus sections stay machine-translated for now, and the notice says so (machineTranslation.noticeWrittenWithAi).

  // --- Registered + selectable day-one; stubs falling back to English until translated ---
  { code: "de",         nativeName: "Deutsch",            englishName: "German",                  dir: "ltr", status: "machine-draft", draftKind: "written-with-ai" }, // INTERFACE-NATIVE (PRIME 09/11/2026 01:02, "in the language's NATURAL tone"): the interface, tools, tool docs, games and legal pages written in German with AI and reviewed gradually; Learn and the other corpus sections stay machine-translated, and the notice says so.
  { code: "fr",         nativeName: "Français",           englishName: "French",                  dir: "ltr", status: "machine-draft", draftKind: "written-with-ai" }, // INTERFACE-NATIVE (PRIME 09/11/2026 01:02, "in the language's NATURAL tone"; 11:02, the order Spanish, German, French): the interface, tools, tool docs, games and legal pages written in French with AI and reviewed gradually; Learn and the other corpus sections stay machine-translated, and the notice says so.
  { code: "it",         nativeName: "Italiano",           englishName: "Italian",                 dir: "ltr", status: "stub" }, // PLANNED (PRIME 09/11/2026 22:14, high value): phase 1 written in the language, on PRIME's "go"
  { code: "ru",         nativeName: "Русский",            englishName: "Russian",                 dir: "ltr", status: "stub" }, // PLANNED (PRIME 09/11/2026 22:14, high value): phase 1 written in the language, on PRIME's "go"
  { code: "tr",         nativeName: "Türkçe",             englishName: "Turkish",                 dir: "ltr", status: "stub" }, // PLANNED (PRIME 09/11/2026 22:14, high value): phase 1 written in the language, on PRIME's "go"
  { code: "ko",         nativeName: "한국어",              englishName: "Korean",                  dir: "ltr", status: "stub" }, // PLANNED (PRIME 09/11/2026 22:14, high value): phase 1 written in the language, on PRIME's "go"
  { code: "ja",         nativeName: "日本語",              englishName: "Japanese",                dir: "ltr", status: "stub" }, // PLANNED (PRIME 09/11/2026 22:14, high value): phase 1 written in the language, on PRIME's "go"
  // Two Chinese variants, by script: Simplified, and Traditional for Taiwan (Hong Kong's retired 09/11/2026: its IT
  // work runs in English).
  { code: "zh-Hans",    nativeName: "简体中文",            englishName: "Chinese (Simplified)",    dir: "ltr", status: "stub" }, // PLANNED (PRIME 09/11/2026 22:14, high value): phase 1 written in the language, on PRIME's "go"
  { code: "zh-Hant-TW", nativeName: "繁體中文（台灣）",     englishName: "Chinese (Traditional, Taiwan)", dir: "ltr", status: "stub" }, // PLANNED (PRIME 09/11/2026 23:04, high value): phase 1 written in the language, on PRIME's "go"
  // Arabic — right-to-left. RTL layout support is built into the foundation now;
  // the Arabic CONTENT is a stub until a real pack lands, at which point RTL "just works".
  { code: "ar",         nativeName: "العربية",            englishName: "Arabic",                  dir: "rtl", status: "stub" }, // PLANNED (PRIME 09/11/2026 22:14, high value): phase 1 written in the language, on PRIME's "go"

  // --- Expansion stubs (PRIME-approved 2026-06-28): registered + routable now,
  //     English-fallback until the post-queue translation campaign fills them.
  //     Grouped by region; full translation-priority ranking lives in the plan. ---
  // East / Southeast Asia (large engineer bases, lower English-at-work share -> high marginal value)
  { code: "vi",         nativeName: "Tiếng Việt",         englishName: "Vietnamese",              dir: "ltr", status: "stub" }, // PLANNED (PRIME 09/11/2026 22:14, high value): phase 1 written in the language, on PRIME's "go"
  { code: "id",         nativeName: "Bahasa Indonesia",   englishName: "Indonesian",              dir: "ltr", status: "stub" }, // PLANNED (PRIME 09/11/2026 22:14, high value): phase 1 written in the language, on PRIME's "go"
  { code: "th",         nativeName: "ไทย",                englishName: "Thai",                    dir: "ltr", status: "stub" }, // PLANNED (PRIME 09/11/2026 23:04, high value): phase 1 written in the language, on PRIME's "go"
] as const;

/** The default + source language. All stubs fall back to this. */
export const DEFAULT_LOCALE = "en";

/** Convenience: just the codes, derived (never hand-maintain a second list). */
export const LOCALE_CODES = LOCALES.map((l) => l.code);

/**
 * Locales taken out of the registry (PRIME 09/11/2026 22:14: of low value for this site, their readers use English at
 * work). Their pages were built until 09/11/2026 21:41, so the addresses exist in search indexes and bookmarks: the
 * worker answers any /<code>/... here with a PERMANENT redirect to the English page (they are not coming back, unlike a
 * stub, which gets a temporary one). Never routed, never built, never listed.
 */
export const RETIRED_LOCALE_CODES: readonly string[] = [
  // 09/11/2026 22:14: machine-translated until 21:41, so their pages were built and may be indexed.
  "nl", "sv", "da", "nb", "pl", "ms", "fil",
  // 09/11/2026 23:04: stubs that were never built (their addresses were already redirected to English).
  "hi", "ta", "zh-Hant-HK", "sw", "fa", "he", "uk", "ro", "cs", "hu", "el", "bg", "sr-Latn", "sk", "sl", "fi", "te", "bn", "ur",
];

/** The locales with a real translation (reviewed or machine-draft): the set we
 *  BUILD. Stub locales are excluded here, so they generate no pages, but they
 *  are still LISTED in the language switcher, marked unavailable and routed to
 *  the English fallback, so the full roadmap stays visible. */
export const LIVE_LOCALES = LOCALES.filter((l) => l.status !== "stub");

/** Just the codes for the live locales. This is the set we actually BUILD and
 *  route: routing.locales and the worker locale gate both derive from it, so a
 *  stub locale is neither statically generated nor advertised. Promote a locale
 *  by lifting its status above "stub" and it joins the build automatically. */
export const LIVE_LOCALE_CODES = LIVE_LOCALES.map((l) => l.code);

/** How many locales carry real translations. Derived from LIVE_LOCALES so the
 *  colophon's language count is always accurate and never hand-edited. */
/**
 * Locales that actually CARRY the authored long-form corpora - the Learn
 * articles and the glossary definitions - rather than falling back to English.
 *
 * WHY THIS EXISTS (PRIME, 2026-09-10). Those two families are half the site by
 * page count: 1,704 glossary pages and 671 Learn articles per locale, out of
 * 3,383. Learn MDX exists only under src/content/learn/{en,pt-BR}, and only the
 * en and pt-BR message packs carry glossary definitions - de.json has none. So
 * rendering them for the other fourteen live locales produced 33,250 pages of
 * ENGLISH TEXT UNDER NON-ENGLISH URLs, 41% of the whole asset manifest, and the
 * manifest is capped at 100,000 files per Worker version.
 *
 * Those routes are no longer generated outside these locales; worker/index.ts
 * answers them with a TEMPORARY redirect to the English page. Temporary, not
 * permanent, deliberately: see the redirect for the reasoning.
 *
 * Adding a locale here is the whole promotion step - author the content, add
 * the code, and the pages generate.
 */
export const AUTHORED_CONTENT_LOCALES = ["en", "pt-BR"] as const;

/**
 * Locales whose INTERFACE is written natively: every message-pack string outside the corpora (the glossary entries
 * and the Learn labs), the tool documentation and the strings that tools and games carry in code (PRIME 09/11/2026:
 * "get the site up in additional languages", each written "in the language's NATURAL tone (instead of simply
 * translated)"; 11:02 set the order Spanish, German, French, Italian, and 14:05 holds Italian until PRIME says so; the
 * first phase is the interface and the tool docs,
 * the corpora follow). A locale joins this list when its interface is complete (guard: scripts/check-interface-locales.mts).
 *
 * In such a locale a page speaks for itself (self-canonical, in the hreflang sets and the sitemap) unless its route
 * belongs to one of CORPUS_ROUTE_FAMILIES below, whose words stay English there until the corpus is written: those
 * pages keep naming the English page as canonical (scripts/seo-locales.mjs). AUTHORED_CONTENT_LOCALES are always here.
 */
export const INTERFACE_LOCALES = ["en", "pt-BR", "es", "de", "fr"] as const;

/**
 * The first route segments whose page content comes from a corpus rather than the interface: Learn and the glossary
 * (authored-only, see above), the Industry records, the certification study guides and their indexes, the blog, the
 * practice essays, the people index, the stories and the changelog (English by design). In an interface-only locale
 * these pages show English text under the locale's chrome, so they are not offered to search engines as translations.
 */
export const CORPUS_ROUTE_FAMILIES = ["learn", "glossary", "industry", "certifications", "study-guides", "blog", "practice", "people", "stories", "changelog"] as const;

export const TRANSLATED_LOCALE_COUNT = LIVE_LOCALES.length;

/** Look up one locale's metadata by code; undefined if not registered. */
export function getLocale(code: string): LocaleMeta | undefined {
  return LOCALES.find((l) => l.code === code);
}

/** Is this string a registered locale code? (Used to validate URL segments.) */
export function isValidLocale(code: string): code is string {
  return LOCALE_CODES.includes(code);
}

/** Text direction for a locale, defaulting to ltr for anything unknown. */
export function dirFor(code: string): "ltr" | "rtl" {
  return getLocale(code)?.dir ?? "ltr";
}

// ----------------------------------------------------------------------------
// WRITING-SYSTEM GROUPING (for the language-switcher ordering).
//
// We split locales coarsely into "western" (Latin script) vs "other" (every
// non-Latin script: Cyrillic, CJK, Arabic, Indic, Greek, Hebrew, Thai...).
// The switcher groups western-script languages — which a reader on a Latin
// keyboard scans fastest — before other scripts inside each translation-status
// band, then sorts alphabetically. Listing the (smaller) non-Latin set is less
// error-prone than tagging all 42 entries; anything not in it is treated as
// Latin/western. This is intentionally a two-bucket split, not a full
// script taxonomy.
// ----------------------------------------------------------------------------
const NON_LATIN_SCRIPT_CODES = new Set<string>([
  "ru", "uk", "bg",                                   // Cyrillic
  "zh-Hans", "zh-Hant-TW", "zh-Hant-HK", "ja", "ko",  // CJK (Han / Kana / Hangul)
  "hi", "ta", "te", "bn",                             // Indic (Devanagari / Tamil / Telugu / Bengali)
  "ar", "fa", "ur",                                   // Arabic script (incl. Persian, Urdu)
  "he",                                               // Hebrew
  "th",                                               // Thai
  "el",                                               // Greek
]);

/** True if a locale is written in a Latin ("western") script. Drives switcher grouping. */
export function isWesternScript(code: string): boolean {
  return !NON_LATIN_SCRIPT_CODES.has(code);
}
