// ============================================================================
// src/i18n/routing.ts
// ----------------------------------------------------------------------------
// LOCALE ROUTING — how language appears in the URL.
//
// WHY these choices:
//   - `locales` is derived straight from the registry (LOCALE_CODES) so the
//     router and the registry can never drift out of sync.
//   - `defaultLocale: "en"` — English is the default (PRIME decision).
//   - `localePrefix: "as-needed"` — the default locale (English) is served at
//     clean, unprefixed paths (ronutz.com/, ronutz.com/about), while every
//     other locale carries its code (ronutz.com/pt-BR, ronutz.com/ja). This
//     keeps the primary English URLs clean for SEO while still giving every
//     other language a distinct, indexable URL. localeDetection is on so a
//     first-time visitor is gently routed to their browser language if we have
//     it (they can always switch).
// ============================================================================

import { defineRouting } from "next-intl/routing";
import { LOCALE_CODES, DEFAULT_LOCALE } from "./locales";

export const routing = defineRouting({
  // All 18 registered locales are valid URL locales.
  locales: LOCALE_CODES,

  // English is the default and is served without a /en prefix.
  defaultLocale: DEFAULT_LOCALE,

  // Default locale unprefixed; all others prefixed with their code.
  localePrefix: "as-needed",

  // Route a first-time visitor to their browser's language if we recognize it.
  localeDetection: true,
});
