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
  { code: "pt-BR",      nativeName: "Português (Brasil)", englishName: "Portuguese (Brazil)",     dir: "ltr", status: "machine-draft" },
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
] as const;

/** The default + source language. All stubs fall back to this. */
export const DEFAULT_LOCALE = "en";

/** Convenience: just the codes, derived (never hand-maintain a second list). */
export const LOCALE_CODES = LOCALES.map((l) => l.code);

/** The locales we actually offer in the UI: everything with a real translation
 *  (reviewed or machine-draft). Stubs are registered for routing/fallback but
 *  are NOT advertised in the language switcher — we only claim what we have. */
export const LIVE_LOCALES = LOCALES.filter((l) => l.status !== "stub");

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
