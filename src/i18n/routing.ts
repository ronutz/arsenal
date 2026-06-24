// ============================================================================
// src/i18n/routing.ts
// ----------------------------------------------------------------------------
// LOCALE ROUTING — how language appears in the URL.
//
// WHY these choices:
//   - `locales` is derived straight from the registry (LOCALE_CODES) so the
//     router and the registry can never drift out of sync.
//   - `defaultLocale: "en"` — English is the default (PRIME decision).
//   - `localePrefix: "always"` — EVERY locale, English included, carries its
//     code in the path (ronutz.com/en, ronutz.com/pt-BR, ronutz.com/ja).
//
//     WHY "always" and not "as-needed": this site is a STATIC EXPORT
//     (output: "export"). next-intl's "as-needed" strips the prefix from the
//     default locale's LINKS but relies on request-time MIDDLEWARE to serve
//     those unprefixed pages — and middleware does not run in a static export.
//     The result was a mismatch: pages emitted under /en/* but links pointing
//     at /* (which do not exist as files), breaking English navigation.
//     "always" keeps links and files in agreement (both /en/*), so navigation
//     is correct on a pure static host. The bare root (/) is sent to /en/ by a
//     host-level redirect in public/_redirects.
// ============================================================================

import { defineRouting } from "next-intl/routing";
import { LOCALE_CODES, DEFAULT_LOCALE } from "./locales";

export const routing = defineRouting({
  // All 18 registered locales are valid URL locales.
  locales: LOCALE_CODES,

  // English is the default locale.
  defaultLocale: DEFAULT_LOCALE,

  // Every locale (including English) is prefixed with its code. Required for a
  // correct STATIC EXPORT — see the WHY note above. The bare root (/) is sent
  // to /en/ by public/_redirects.
  localePrefix: "always",

  // Retained as intent; inert in static export (a middleware feature). First-
  // visit routing is handled at the edge (public/_redirects today; Accept-
  // Language detection can move into the API Worker later).
  localeDetection: true,
});
