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
}

/**
 * THE REGISTRY. Order here is the order shown in the language switcher.
 * Day-one real content: en, pt-BR, es (status 'reviewed'). All others are
 * registered + selectable but 'stub' → they fall back to English until a real
 * pack lands. This is the "capability is day-one, content arrives as packs"
 * decision (D-20 amendment, PRIME-ratified 2026-06-23).
 */
export const LOCALES: readonly LocaleMeta[] = [
  // --- Languages with real, human-reviewed content shipping day-one ---
  { code: "en",         nativeName: "English",            englishName: "English",                 dir: "ltr", status: "reviewed" },
  { code: "pt-BR",      nativeName: "Português (Brasil)", englishName: "Portuguese (Brazil)",     dir: "ltr", status: "reviewed" },
  { code: "es",         nativeName: "Español",            englishName: "Spanish",                 dir: "ltr", status: "machine-draft" },

  // --- Registered + selectable day-one; stubs falling back to English until translated ---
  { code: "de",         nativeName: "Deutsch",            englishName: "German",                  dir: "ltr", status: "machine-draft" },
  { code: "fr",         nativeName: "Français",           englishName: "French",                  dir: "ltr", status: "machine-draft" },
  { code: "nl",         nativeName: "Nederlands",         englishName: "Dutch",                   dir: "ltr", status: "machine-draft" },
  { code: "it",         nativeName: "Italiano",           englishName: "Italian",                 dir: "ltr", status: "machine-draft" },
  { code: "sv",         nativeName: "Svenska",            englishName: "Swedish",                 dir: "ltr", status: "machine-draft" },
  { code: "da",         nativeName: "Dansk",              englishName: "Danish",                  dir: "ltr", status: "machine-draft" },
  { code: "nb",         nativeName: "Norsk bokmål",       englishName: "Norwegian Bokmål",        dir: "ltr", status: "machine-draft" },
  { code: "ru",         nativeName: "Русский",            englishName: "Russian",                 dir: "ltr", status: "machine-draft" },
  { code: "pl",         nativeName: "Polski",             englishName: "Polish",                  dir: "ltr", status: "machine-draft" },
  { code: "tr",         nativeName: "Türkçe",             englishName: "Turkish",                 dir: "ltr", status: "machine-draft" },
  { code: "hi",         nativeName: "हिन्दी",               englishName: "Hindi",                   dir: "ltr", status: "stub" },
  { code: "ta",         nativeName: "தமிழ்",              englishName: "Tamil",                   dir: "ltr", status: "stub" },
  { code: "ms",         nativeName: "Bahasa Melayu",      englishName: "Malay",                   dir: "ltr", status: "machine-draft" },
  { code: "fil",        nativeName: "Filipino",           englishName: "Filipino",                dir: "ltr", status: "machine-draft" },
  { code: "ko",         nativeName: "한국어",              englishName: "Korean",                  dir: "ltr", status: "stub" },
  { code: "ja",         nativeName: "日本語",              englishName: "Japanese",                dir: "ltr", status: "stub" },
  // Three Chinese variants — split by script + region so no major demographic is excluded.
  { code: "zh-Hans",    nativeName: "简体中文",            englishName: "Chinese (Simplified)",    dir: "ltr", status: "machine-draft" },
  { code: "zh-Hant-TW", nativeName: "繁體中文（台灣）",     englishName: "Chinese (Traditional, Taiwan)", dir: "ltr", status: "stub" },
  { code: "zh-Hant-HK", nativeName: "繁體中文（香港）",     englishName: "Chinese (Traditional, Hong Kong)", dir: "ltr", status: "stub" },
  // Arabic — right-to-left. RTL layout support is built into the foundation now;
  // the Arabic CONTENT is a stub until a real pack lands, at which point RTL "just works".
  { code: "ar",         nativeName: "العربية",            englishName: "Arabic",                  dir: "rtl", status: "stub" },
  { code: "sw",         nativeName: "Kiswahili",          englishName: "Swahili",                 dir: "ltr", status: "stub" },

  // --- Expansion stubs (PRIME-approved 2026-06-28): registered + routable now,
  //     English-fallback until the post-queue translation campaign fills them.
  //     Grouped by region; full translation-priority ranking lives in the plan. ---
  // East / Southeast Asia (large engineer bases, lower English-at-work share -> high marginal value)
  { code: "vi",         nativeName: "Tiếng Việt",         englishName: "Vietnamese",              dir: "ltr", status: "stub" },
  { code: "id",         nativeName: "Bahasa Indonesia",   englishName: "Indonesian",              dir: "ltr", status: "stub" },
  { code: "th",         nativeName: "ไทย",                englishName: "Thai",                    dir: "ltr", status: "stub" },
  // MENA (Arabic already registered above; Persian + Hebrew are RTL like Arabic)
  { code: "fa",         nativeName: "فارسی",              englishName: "Persian",                 dir: "rtl", status: "stub" },
  { code: "he",         nativeName: "עברית",              englishName: "Hebrew",                  dir: "rtl", status: "stub" },
  // Central & Eastern Europe (strong IT-outsourcing markets)
  { code: "uk",         nativeName: "Українська",         englishName: "Ukrainian",               dir: "ltr", status: "stub" },
  { code: "ro",         nativeName: "Română",             englishName: "Romanian",                dir: "ltr", status: "stub" },
  { code: "cs",         nativeName: "Čeština",            englishName: "Czech",                   dir: "ltr", status: "stub" },
  { code: "hu",         nativeName: "Magyar",             englishName: "Hungarian",               dir: "ltr", status: "stub" },
  { code: "el",         nativeName: "Ελληνικά",           englishName: "Greek",                   dir: "ltr", status: "stub" },
  { code: "bg",         nativeName: "Български",           englishName: "Bulgarian",               dir: "ltr", status: "stub" },
  { code: "sr-Latn",    nativeName: "Srpskohrvatski",     englishName: "Serbo-Croatian (Latin)",  dir: "ltr", status: "stub" },
  { code: "sk",         nativeName: "Slovenčina",         englishName: "Slovak",                  dir: "ltr", status: "stub" },
  { code: "sl",         nativeName: "Slovenščina",        englishName: "Slovenian",               dir: "ltr", status: "stub" },
  { code: "fi",         nativeName: "Suomi",              englishName: "Finnish",                 dir: "ltr", status: "stub" },
  // South Asia (Hindi + Tamil already registered above; Urdu is RTL)
  { code: "te",         nativeName: "తెలుగు",             englishName: "Telugu",                  dir: "ltr", status: "stub" },
  { code: "bn",         nativeName: "বাংলা",              englishName: "Bengali",                 dir: "ltr", status: "stub" },
  { code: "ur",         nativeName: "اردو",               englishName: "Urdu",                    dir: "rtl", status: "stub" },
] as const;

/** The default + source language. All stubs fall back to this. */
export const DEFAULT_LOCALE = "en";

/** Convenience: just the codes, derived (never hand-maintain a second list). */
export const LOCALE_CODES = LOCALES.map((l) => l.code);

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
