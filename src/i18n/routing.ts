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
import { LIVE_LOCALE_CODES, DEFAULT_LOCALE } from "./locales";

export const routing = defineRouting({
  // Only locales with a real translation are valid URL locales and get built.
  // Stub locales are intentionally excluded (see LIVE_LOCALE_CODES): building
  // ~26 English-fallback locales tripled the static asset count past
  // Cloudflare's deploy limit and created duplicate-content URLs. They return
  // a 301 to the English equivalent at the edge (worker/index.ts) and rejoin
  // the build the moment their status is lifted above "stub".
  locales: LIVE_LOCALE_CODES,

  // English is the default locale.
  defaultLocale: DEFAULT_LOCALE,

  // Every locale (including English) is prefixed with its code. Required for a
  // correct STATIC EXPORT — see the WHY note above. The bare root (/) is sent
  // to /en/ by public/_redirects.
  localePrefix: "always",

  // Retained as intent; inert in static export (a middleware feature). First-
  // visit routing is handled at the edge (public/_redirects today; Accept-
  // Language detection can move into the API Worker later).
  // English is the default for every new visit (PRIME 2026-07-19): do NOT
  // sniff the browser Accept-Language on first visit. Users choose their locale
  // explicitly via the switcher, which keeps the choice in localStorage
  // (ronutz-lang); the layout's script reads it to send the bare domain there.
  localeDetection: false,

  // NO LOCALE COOKIE (PRIME 2026-11-02 12:58: "Since the cookie is not effectively
  // used by the site for nothing, it is the 'local storage' that takes care of
  // user preferences, I think we can get rid of the cookie and update the wording
  // appropriately."). next-intl's default writes NEXT_LOCALE (the chosen locale,
  // one year, SameSite=Lax) whenever its router or Link changes language, which
  // the language menu does; nothing on this static site ever read it (no
  // middleware, and the Worker never looks), and the Privacy page said the site's
  // own code sets no cookies. Off, the router changes language and writes
  // nothing. The layout's script deletes a NEXT_LOCALE left from before.
  localeCookie: false,
});
